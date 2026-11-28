import admin from 'firebase-admin'
import { HttpsError, onCall, type CallableRequest } from 'firebase-functions/v2/https'
import { sessionMatchesCohort } from '../studentCurriculum.js'
import {
  buildFacultyAcademicContext,
  buildPaperAcademicContext,
  buildStudentAcademicContext,
  facultyCoursesFromCurriculum,
  type AcademicStudent,
  type ContextAssignment,
  type ContextClass,
  type ContextCurriculum,
  type ContextTest,
  type ContextAttendance,
  type FacultyAssignment,
  type FacultyAssessment,
  type FacultyCourse,
  type FacultyCurriculumMapping,
  type FacultySession,
} from './context'

const REGION = 'asia-south1'
const MAX_CONTEXT_DOCS = 200
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function enabled(flag: string): boolean {
  return process.env[flag] === 'true'
}

function requireAuth(request: CallableRequest<Record<string, unknown>>): { uid: string; token: Record<string, unknown> } {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  return { uid, token: request.auth?.token || {} }
}

function dateKey(value: unknown): string {
  const result = String(value || '').slice(0, 10)
  if (!DATE_KEY.test(result)) throw new HttpsError('invalid-argument', 'date must be yyyy-mm-dd')
  return result
}

async function studentIdentity(uid: string, token: Record<string, unknown>): Promise<AcademicStudent> {
  const db = admin.firestore()
  const [userDoc, profiles] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('students').where('userId', '==', uid).limit(2).get(),
  ])
  const user = userDoc.data() || {}
  if (!userDoc.exists || String(token.role || user.role || '') !== 'student') {
    throw new HttpsError('permission-denied', 'A linked student account is required')
  }
  if (profiles.size !== 1) throw new HttpsError('failed-precondition', 'A single linked student profile is required')
  const profile = profiles.docs[0].data()
  const collegeId = String(token.collegeId || user.collegeId || '')
  if (!collegeId || profile.collegeId !== collegeId) throw new HttpsError('permission-denied', 'Student tenant linkage is invalid')
  return {
    id: profiles.docs[0].id, uid, collegeId, name: String(profile.name || user.name || ''),
    branch: String(profile.branch || profile.department || ''), batch: String(profile.batch || profile.academicYear || ''),
    semester: Number(profile.semester) || 0, division: String(profile.division || ''), section: String(profile.section || ''),
  }
}

function asClass(id: string, value: admin.firestore.DocumentData): ContextClass {
  return { id, ...value, date: String(value.date || value.sessionDate || '').slice(0, 10), topics: Array.isArray(value.topicsCovered) ? value.topicsCovered.map(String) : [] }
}
/**
 * Does this assignment address the student's cohort?
 *
 * This was raw string equality on every cohort field, which is wrong for this
 * data in the same ways the class matcher was:
 *
 *   assignment "2026-2027" vs student "2027"    → same class, dropped
 *   assignment batch 2026  vs student "2026"    → number vs string, dropped
 *   assignment "Section A" vs student "A"       → prefix is noise, dropped
 *   assignment "A,B,C,D"   vs student "A"       → section is a SET, dropped
 *
 * Those drops are why a student whose timetable showed three classes still saw
 * "Assignments 0" on the dashboard. The class matcher was fixed to delegate to
 * sessionMatchesCohort; this one has to use the same rule or the two disagree
 * again.
 *
 * A blank field on EITHER side is "no constraint", matching the matcher's own
 * wildcard rule — an assignment with no batch addresses every intake.
 */
export function assignmentTargetsStudent(value: admin.firestore.DocumentData, student: AcademicStudent): boolean {
  const targetStudents = Array.isArray(value.targetStudents) ? value.targetStudents.map(String) : []
  if (
    targetStudents.length > 0
    && ![student.id, student.uid || '', String(value.regNo || '')].some(
      (id) => id && targetStudents.includes(id),
    )
  ) {
    return false
  }

  // A student's section may be recorded in either `section` or `division`
  // (records split one letter across the two fields). Keep both so the set
  // rule can see the letter whichever field holds it.
  const studentCohort = {
    branch: student.branch,
    batch: student.batch,
    semester: student.semester,
    section: student.section,
    division: student.division,
  }

  const targetSections = Array.isArray(value.targetSections) ? value.targetSections : []
  if (targetSections.length > 0) {
    // Any ONE matching target admits the assignment.
    //
    // NOTE: the previous implementation also ran an inline
    // `.replace(/^section\\s+/, '')` on both sides. That regex matches a
    // literal backslash followed by "s", never a space, so it never stripped
    // the "Section " prefix at all — the intended normalisation silently did
    // nothing. cohortLetters drops the prefix properly, so the local hack is
    // gone rather than repaired.
    const matched = targetSections.some((target: unknown) => {
      const item = (target || {}) as Record<string, unknown>
      return sessionMatchesCohort(
        {
          branch: item.branch,
          batch: item.batch,
          semester: item.semester,
          section: item.section ?? item.division ?? item.sectionName ?? item.sectionId,
        },
        studentCohort,
      )
    })
    if (!matched) return false
  }

  // The assignment's own cohort fields, when it carries them.
  return sessionMatchesCohort(
    {
      branch: value.branch,
      batch: value.batch,
      semester: value.semester,
      section: value.section,
      division: value.division,
    },
    studentCohort,
  )
}

function asAssignment(id: string, value: admin.firestore.DocumentData): ContextAssignment {
  return { id, title: String(value.title || value.name || 'Assignment'), ...value, dueDate: value.dueDate ? new Date(value.dueDate.toDate?.() || value.dueDate).toISOString() : '' }
}
function dateTime(value: unknown): string {
  if (!value) return ''
  const converted = typeof value === 'object' && value !== null && 'toDate' in value
    ? (value as { toDate: () => Date }).toDate()
    : new Date(String(value))
  return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted.toISOString() : ''
}
function asTest(id: string, value: admin.firestore.DocumentData): ContextTest {
  return {
    id,
    title: String(value.title || value.paperTitle || 'Assessment'),
    ...value,
    startDateTime: dateTime(value.startDateTime || value.scheduledAt),
    endDateTime: dateTime(value.endDateTime),
  }
}

async function facultyIdentityAliases(
  uid: string,
  token: Record<string, unknown>
): Promise<{ ids: Set<string>; email: string }> {
  const db = admin.firestore()
  const [profileDocs, userDoc] = await Promise.all([
    db.collection('faculty').where('uid', '==', uid).limit(2).get(),
    db.collection('users').doc(uid).get(),
  ])
  const ids = new Set<string>([uid])
  let email = String(token.email || userDoc.data()?.email || '').trim().toLowerCase()
  profileDocs.docs.forEach((profileDoc) => {
    const profile = profileDoc.data()
    ids.add(profileDoc.id)
    if (profile.facultyId) ids.add(String(profile.facultyId))
    if (!email && profile.email) email = String(profile.email).trim().toLowerCase()
  })
  return { ids, email }
}

export const getMyStudentAcademicContext = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 20 },
  async (request) => {
    if (!enabled('ACADEMIC_INTELLIGENCE_ENABLED')) return { enabled: false }
    const { uid, token } = requireAuth(request)
    const student = await studentIdentity(uid, token)
    const date = dateKey(request.data?.date || new Date().toISOString())
    const db = admin.firestore()
    const [classDocs, assignmentDocs, testDocs, curriculumDocs, attendanceDocs] = await Promise.all([
      db.collection('classSessions').where('collegeId', '==', student.collegeId).where('date', '==', date).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('assignments').where('collegeId', '==', student.collegeId).where('status', 'in', ['published', 'ongoing']).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('scheduledTests').where('collegeId', '==', student.collegeId).where('status', 'in', ['published', 'ongoing']).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('curriculum').where('collegeId', '==', student.collegeId).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('attendance').where('collegeId', '==', student.collegeId).where('studentId', '==', student.id).limit(MAX_CONTEXT_DOCS).get(),
    ])
    const context = buildStudentAcademicContext({
      student, date,
      classes: classDocs.docs.map((doc) => asClass(doc.id, doc.data())),
      assignments: assignmentDocs.docs
        .filter((doc) => assignmentTargetsStudent(doc.data(), student))
        .map((doc) => asAssignment(doc.id, doc.data())),
      tests: testDocs.docs.map((doc) => asTest(doc.id, doc.data())),
      curriculum: facultyCoursesFromCurriculum(curriculumDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        courses: Array.isArray(doc.data().courses) ? doc.data().courses : [],
      }))) as ContextCurriculum[],
      attendance: attendanceDocs.docs.map((doc) => ({ date: String(doc.data().date || '').slice(0, 10), status: String(doc.data().status || '') })) as ContextAttendance[],
      now: new Date().toISOString(),
    })
    return { enabled: true, context }
  }
)

export const getFacultyAcademicContext = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 20 },
  async (request) => {
    if (!enabled('ACADEMIC_INTELLIGENCE_ENABLED')) return { enabled: false }
    const { uid, token } = requireAuth(request)
    const role = String(token.role || '')
    if (!['faculty', 'hod', 'principal', 'admin', 'superadmin'].includes(role)) throw new HttpsError('permission-denied', 'Faculty access is required')
    const collegeId = String(token.collegeId || '')
    if (!collegeId) throw new HttpsError('failed-precondition', 'College scope is required')
    const today = dateKey(request.data?.date || new Date().toISOString())
    const db = admin.firestore()
    // Sessions used to be read with a bare `limit(200)` and no order. Firestore
    // returns documents in id order, and session ids begin with the date, so a
    // college past its 200th session only ever read the OLDEST ones — every
    // upcoming class fell outside the window and the panel said "0 upcoming"
    // while the dashboard, which queries by date, correctly showed today's
    // classes. Bounding by date asks for the rows the panel actually needs and
    // reads fewer of them than before.
    const [courseDocs, mappingDocs, sessionDocs, assignmentDocs, assessmentDocs, aliases] = await Promise.all([
      db.collection('curriculum').where('collegeId', '==', collegeId).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('curriculumFacultyMappings').where('collegeId', '==', collegeId).limit(MAX_CONTEXT_DOCS).get(),
      // collegeId + date ASC is an existing composite index, so this needs no
      // index deploy. `today` is inclusive: a class earlier today still shows.
      db.collection('classSessions')
        .where('collegeId', '==', collegeId)
        .where('date', '>=', today)
        .orderBy('date', 'asc')
        .limit(MAX_CONTEXT_DOCS)
        .get(),
      db.collection('assignments').where('collegeId', '==', collegeId).limit(MAX_CONTEXT_DOCS).get(),
      db.collection('scheduledTests').where('collegeId', '==', collegeId).limit(MAX_CONTEXT_DOCS).get(),
      facultyIdentityAliases(uid, token),
    ])
    const plans = courseDocs.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      collegeId,
      courses: Array.isArray(doc.data().courses) ? doc.data().courses : [],
    }))
    const allMappings = mappingDocs.docs.map((doc) => ({
      ...(doc.data() as FacultyCurriculumMapping),
      id: doc.id,
    }))
    const isPersonalFacultyView = role === 'faculty' || role === 'hod'
    const facultyMappings = allMappings.filter((mapping) => {
      if (!isPersonalFacultyView) return true
      const mappingEmail = String(mapping.facultyEmail || '').trim().toLowerCase()
      return aliases.ids.has(String(mapping.facultyId || ''))
        || Boolean(aliases.email && mappingEmail && aliases.email === mappingEmail)
    })
    const courses = facultyCoursesFromCurriculum(
      plans,
      isPersonalFacultyView ? facultyMappings : undefined
    ) as FacultyCourse[]
    const context = buildFacultyAcademicContext({
      facultyId: uid, collegeId, courseId: request.data?.courseId ? String(request.data.courseId) : undefined, courses,
      today, sessions: sessionDocs.docs.map((doc) => ({ id: doc.id, ...doc.data(), date: String(doc.data().date || '').slice(0, 10) })) as FacultySession[],
      assignments: assignmentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data(), title: String(doc.data().title || '') })) as FacultyAssignment[],
      assessments: assessmentDocs.docs.map((doc) => ({ id: doc.id, ...doc.data(), title: String(doc.data().title || doc.data().paperTitle || '') })) as FacultyAssessment[],
      completedTopics: [],
      scopeToCourses: isPersonalFacultyView,
    })
    return { enabled: true, context }
  }
)

export const getPaperAcademicContext = onCall(
  { region: REGION, memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 20 },
  async (request) => {
    if (!enabled('ACADEMIC_INTELLIGENCE_ENABLED')) return { enabled: false }
    const { token } = requireAuth(request)
    if (!['faculty', 'hod', 'principal', 'admin', 'superadmin'].includes(String(token.role || ''))) throw new HttpsError('permission-denied', 'Academic staff access is required')
    const collegeId = String(token.collegeId || '')
    if (!collegeId) throw new HttpsError('failed-precondition', 'College scope is required')
    const courseId = String(request.data?.courseId || '')
    const db = admin.firestore()
    const courseDoc = courseId ? await db.collection('curriculum').doc(courseId).get() : null
    const questionDocs = await db.collection('questions').where('collegeId', '==', collegeId).limit(MAX_CONTEXT_DOCS).get()
    const course = courseDoc?.exists ? ({ id: courseDoc.id, collegeId, ...courseDoc.data(), courseCode: String(courseDoc.data()?.courseCode || ''), courseName: String(courseDoc.data()?.courseName || '') } as FacultyCourse) : null
    const context = buildPaperAcademicContext({ generatedFor: new Date().toISOString(), collegeId, course, blueprint: request.data?.blueprint || null, candidates: questionDocs.docs.map((doc) => ({ id: doc.id, ...doc.data(), approved: doc.data().approved !== false })) })
    return { enabled: true, context }
  }
)
