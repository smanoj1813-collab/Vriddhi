// ─────────────────────────────────────────────────────────────────────────────
// Student curriculum — "what am I studying, what's done, what's next".
//
// WHY A CALLABLE
// The plan lives in `curriculum/*` (admin-owned, staff-read-only by rule), the
// assignment of plan→cohort in `curriculumFacultyMappings`, the delivery
// evidence in `classSessions.topicsCovered` and the faculty ledger
// `facultyTopics` (also staff-only). A student cannot — and should not — list
// any of those directly. This function joins them server-side for exactly one
// student (resolved from the Auth uid, never from the request) and returns a
// read-only projection scoped to that student's cohort.
//
// CLASSIFICATION (per topic)
//   completed — its title appears in `topicsCovered` of a *completed* session
//               for this cohort, OR the faculty ledger marks it covered.
//   current   — not completed, but (a) it is planned on a session dated today
//               or within the next 7 days, or (b) it sits in the first module
//               that still has any pending topic AND that module has at least
//               one covered topic (i.e. the module is being taught right now).
//   upcoming  — everything else.
//
// The pure pieces (`classifyTopics`, `sessionMatchesCohort`) are exported for
// unit tests; Firestore is only touched inside the callable.
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { addDays, isTopicCovered, normalizeSessionDate, normalizeTopicKey, todayKey } from './classSchedule'

// ─── Types returned to the client ───────────────────────────────────────────

export type TopicState = 'completed' | 'current' | 'upcoming'

export interface StudentTopic {
  title: string
  state: TopicState
  /** yyyy-mm-dd of the completed session that covered it, when known. */
  coveredOn: string | null
  /** yyyy-mm-dd of the next scheduled session that plans it, when known. */
  plannedOn: string | null
}

export interface StudentModule {
  moduleNo: string
  moduleName: string
  hours: number
  topics: StudentTopic[]
  total: number
  completed: number
  current: number
  upcoming: number
  pct: number
  state: TopicState
}

export interface StudentSubject {
  curriculumId: string
  courseCode: string
  courseName: string
  facultyName: string
  credits: number
  totalHours: number
  modules: StudentModule[]
  totals: { total: number; completed: number; current: number; upcoming: number; pct: number }
  /** Sessions for this subject: recent completed and upcoming scheduled. */
  recentSessions: StudentSessionSummary[]
  upcomingSessions: StudentSessionSummary[]
}

export interface StudentSessionSummary {
  id: string
  date: string
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  subjectCode: string
  facultyName: string
  room: string
  status: string
  topics: string[]
}

export interface StudentCurriculumResult {
  generatedAt: string
  student: { branch: string; batch: string; semester: number; division: string }
  subjects: StudentSubject[]
  totals: { subjects: number; topics: number; completed: number; current: number; upcoming: number; pct: number }
  /** Next 14 days of classes for this cohort, with planned/covered topics. */
  upcomingClasses: StudentSessionSummary[]
  /** True when no mapping exists for this cohort — the UI explains instead of showing zero. */
  noCurriculumAssigned: boolean
}

// ─── Identity ───────────────────────────────────────────────────────────────

interface StudentIdentity {
  uid: string
  studentId: string
  collegeId: string
  branch: string
  batch: string
  division: string
  section: string
  semester: number
}

async function resolveStudent(uid: string, token: Record<string, unknown>): Promise<StudentIdentity> {
  const db = admin.firestore()
  const [userDoc, students] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('students').where('userId', '==', uid).limit(2).get(),
  ])
  const userData = userDoc.data()
  if (!userDoc.exists || (token.role || userData?.role) !== 'student') {
    throw new HttpsError('permission-denied', 'A linked student account is required')
  }
  if (students.size !== 1) {
    throw new HttpsError(
      'failed-precondition',
      students.empty
        ? 'Your account is not linked to a student profile. Contact your college administrator.'
        : 'Multiple student profiles are linked to this account. Contact your college administrator.'
    )
  }
  const studentDoc = students.docs[0]
  const student = studentDoc.data()
  const collegeId = String(token.collegeId || userData?.collegeId || '')
  if (!collegeId || student.collegeId !== collegeId) {
    throw new HttpsError('failed-precondition', 'Student account tenant linkage is invalid')
  }
  return {
    uid,
    studentId: studentDoc.id,
    collegeId,
    branch: String(student.branch || student.department || ''),
    batch: String(student.batch || student.academicYear || ''),
    division: String(student.division || ''),
    section: String(student.section || ''),
    semester: Number(student.semester) || 0,
  }
}

// ─── Cohort matching (same rules as the roster/announcement matchers) ──────

const NOISE_PUNCT = /[.,;:'’"·]+/g
const fold = (v: unknown) => String(v ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
const normProgram = (v: unknown) => fold(v).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').trim()
const normToken = (v: unknown) => fold(v).replace(NOISE_PUNCT, '')
const normLetter = (v: unknown) =>
  fold(v).replace(/^div(ision)?[.\s]*/, '').replace(/^sec(tion)?[.\s]*/, '').trim()

export interface CohortLike {
  branch?: unknown
  batch?: unknown
  semester?: unknown
  division?: unknown
  section?: unknown
}

/**
 * Does a schedule/mapping row address this student's cohort?
 * Empty fields on the row are wildcards; empty fields on the student are
 * treated as unknown (no constraint) so a freshly-imported profile is not
 * silently excluded from everything.
 */
export function sessionMatchesCohort(row: CohortLike, student: CohortLike): boolean {
  const rb = normProgram(row.branch)
  if (rb && normProgram(student.branch) && rb !== normProgram(student.branch)) return false

  const rBatch = normToken(row.batch)
  if (rBatch && normToken(student.batch) && rBatch !== normToken(student.batch)) return false

  const rSem = Number(row.semester) || 0
  const sSem = Number(student.semester) || 0
  if (rSem && sSem && rSem !== sSem) return false

  const rowLetters = [normLetter(row.division), normLetter(row.section)].filter(Boolean)
  const studentLetters = [normLetter(student.division), normLetter(student.section)].filter(Boolean)
  if (rowLetters.length && studentLetters.length) {
    if (!rowLetters.some((l) => studentLetters.includes(l))) return false
  }
  return true
}

// ─── Classification ─────────────────────────────────────────────────────────

export interface PlannedModule {
  moduleNo: string
  moduleName: string
  hours: number
  topics: string[]
}

export interface CoverageEvidence {
  /** normalised topic key → date covered */
  covered: Map<string, string>
  /** normalised topic key → next planned date (>= today) */
  planned: Map<string, string>
  today: string
  horizon: string
}

export function classifyTopics(modules: PlannedModule[], evidence: CoverageEvidence): StudentModule[] {
  const out: StudentModule[] = modules.map((mod) => {
    const topics: StudentTopic[] = []
    const seen = new Set<string>()
    for (const raw of mod.topics) {
      const title = String(raw ?? '').trim()
      const key = normalizeTopicKey(title)
      if (!key || seen.has(key)) continue
      seen.add(key)
      const coveredOn = evidence.covered.get(key) ?? null
      const plannedOn = evidence.planned.get(key) ?? null
      let state: TopicState = 'upcoming'
      if (coveredOn !== null) state = 'completed'
      else if (plannedOn && plannedOn >= evidence.today && plannedOn <= evidence.horizon) state = 'current'
      topics.push({ title, state, coveredOn, plannedOn })
    }
    const completed = topics.filter((t) => t.state === 'completed').length
    const current = topics.filter((t) => t.state === 'current').length
    const total = topics.length
    return {
      moduleNo: mod.moduleNo,
      moduleName: mod.moduleName,
      hours: mod.hours,
      topics,
      total,
      completed,
      current,
      upcoming: total - completed - current,
      pct: total ? Math.round((completed / total) * 100) : 0,
      state: 'upcoming',
    }
  })

  // Module-level state. The module being taught is the first one where
  // teaching has started (some topics covered) but not finished. When nothing
  // has been covered anywhere yet, the term starts at the first module with
  // topics. Everything before it is completed, everything after is upcoming —
  // except individual topics a scheduled class has already promised inside
  // the horizon, which stay "current" wherever they sit.
  const withTopics = out.filter((m) => m.total > 0)
  const teaching =
    withTopics.find((m) => m.completed > 0 && m.completed < m.total) ||
    withTopics.find((m) => m.completed < m.total) ||
    null
  for (const mod of withTopics) {
    if (mod.completed === mod.total) {
      mod.state = 'completed'
    } else if (mod === teaching) {
      mod.state = 'current'
      // Pending topics in the module being taught are what a student means by
      // "what we are studying now".
      for (const t of mod.topics) if (t.state === 'upcoming') t.state = 'current'
    } else {
      mod.state = 'upcoming'
    }
    mod.current = mod.topics.filter((t) => t.state === 'current').length
    mod.upcoming = mod.total - mod.completed - mod.current
  }
  return out
}

function topicsOfSession(s: admin.firestore.DocumentData): string[] {
  const toTitles = (v: unknown): string[] =>
    Array.isArray(v)
      ? v
          .map((t) => (typeof t === 'string' ? t : String((t as { title?: unknown })?.title ?? '')))
          .map((t) => t.trim())
          .filter(Boolean)
      : []
  const covered = toTitles(s.topicsCovered)
  if (covered.length) return covered
  const planned = toTitles(s.topicsPlanned)
  if (planned.length) return planned
  const single = String(s.topic || '').trim()
  return single ? [single] : []
}

function summarizeSession(id: string, s: admin.firestore.DocumentData): StudentSessionSummary {
  const date = normalizeSessionDate(s.date)
  return {
    id,
    date,
    dayOfWeek: String(s.dayOfWeek || ''),
    startTime: String(s.startTime || ''),
    endTime: String(s.endTime || ''),
    subject: String(s.subject || ''),
    subjectCode: String(s.subjectCode || ''),
    facultyName: String(s.facultyName || ''),
    room: String(s.room || ''),
    status: String(s.status || 'scheduled'),
    topics: topicsOfSession(s),
  }
}

const subjKey = (name: unknown, code: unknown) => `${normToken(code)}|${normProgram(name)}`

function sessionBelongsToSubject(s: StudentSessionSummary, subject: { courseCode: string; courseName: string }): boolean {
  const code = normToken(subject.courseCode)
  const name = normProgram(subject.courseName)
  if (code && normToken(s.subjectCode) === code) return true
  if (name && normProgram(s.subject) === name) return true
  return false
}

// ─── Callable ───────────────────────────────────────────────────────────────

const MAX_MAPPINGS = 500
const MAX_SESSIONS = 2000
const MAX_LEDGER = 1500
const HORIZON_DAYS = 7
const UPCOMING_DAYS = 14
const RECENT_DAYS = 45

export const getMyCurriculum = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request): Promise<StudentCurriculumResult> => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const db = admin.firestore()

    const today = todayKey()
    const horizon = addDays(today, HORIZON_DAYS)
    const upcomingEnd = addDays(today, UPCOMING_DAYS)
    const recentStart = addDays(today, -RECENT_DAYS)

    // 1. Which curriculum courses are assigned to this cohort.
    const mappingsSnap = await db
      .collection('curriculumFacultyMappings')
      .where('collegeId', '==', student.collegeId)
      .limit(MAX_MAPPINGS)
      .get()
    const mappings: Array<Record<string, any> & { id: string }> = mappingsSnap.docs
      .map((d): Record<string, any> & { id: string } => ({ ...(d.data() as Record<string, any>), id: d.id }))
      .filter((m) => String(m.status || 'active') !== 'inactive')
      .filter((m) => sessionMatchesCohort(m as CohortLike, student))

    if (mappings.length === 0) {
      return {
        generatedAt: new Date().toISOString(),
        student: { branch: student.branch, batch: student.batch, semester: student.semester, division: student.division || student.section },
        subjects: [],
        totals: { subjects: 0, topics: 0, completed: 0, current: 0, upcoming: 0, pct: 0 },
        upcomingClasses: await loadUpcomingClasses(db, student, today, upcomingEnd),
        noCurriculumAssigned: true,
      }
    }

    // 2. The plan documents.
    const curriculumIds = [...new Set(mappings.map((m) => String(m.curriculumId || '')).filter(Boolean))]
    const curriculumSnaps = curriculumIds.length
      ? await db.getAll(...curriculumIds.map((id) => db.collection('curriculum').doc(id)))
      : []
    const curriculumById = new Map<string, admin.firestore.DocumentData>()
    curriculumSnaps.forEach((s) => s.exists && curriculumById.set(s.id, s.data() || {}))

    // 3. Evidence: sessions for this cohort (recent + upcoming) and the
    //    faculty ledgers for the assigned teachers.
    const facultyIds = [...new Set(mappings.map((m) => String(m.facultyId || '')).filter(Boolean))].slice(0, 50)
    const [sessionsSnap, ...ledgerSnaps] = await Promise.all([
      db
        .collection('classSessions')
        .where('collegeId', '==', student.collegeId)
        .where('date', '>=', recentStart)
        .where('date', '<=', upcomingEnd)
        .limit(MAX_SESSIONS)
        .get(),
      ...facultyIds.map((fid) =>
        db.collection('facultyTopics').where('facultyId', '==', fid).limit(MAX_LEDGER).get()
      ),
    ])

    const cohortSessions = sessionsSnap.docs
      .filter((d) => sessionMatchesCohort(d.data(), student))
      .map((d) => summarizeSession(d.id, d.data()))
      .filter((s) => s.date)

    // All-time coverage also needs sessions older than RECENT_DAYS; the
    // ledger covers that (completeClassSession writes it), so we do not need
    // an unbounded session scan.
    const ledgerRows = ledgerSnaps.flatMap((snap) => snap.docs.map((d) => d.data()))

    // 4. Per subject.
    const subjects: StudentSubject[] = []
    const seenSubjects = new Set<string>()
    for (const m of mappings) {
      const key = subjKey(m.courseName, m.courseCode)
      if (seenSubjects.has(key)) continue
      seenSubjects.add(key)

      const curriculum = curriculumById.get(String(m.curriculumId || ''))
      const courses: any[] = Array.isArray(curriculum?.courses) ? curriculum!.courses : []
      const course =
        (m.courseId && courses.find((c) => String(c?.id || '') === String(m.courseId))) ||
        (m.courseCode && courses.find((c) => normToken(c?.code) === normToken(m.courseCode))) ||
        (m.courseName && courses.find((c) => normProgram(c?.name) === normProgram(m.courseName))) ||
        null

      const plannedModules: PlannedModule[] = (Array.isArray(course?.modules) ? course.modules : []).map(
        (mod: any, i: number) => ({
          moduleNo: String(mod?.moduleNo ?? i + 1),
          moduleName: String(mod?.moduleName || mod?.title || `Module ${i + 1}`),
          hours: Number(mod?.hours || mod?.totalHours || 0) || 0,
          topics: Array.isArray(mod?.topics)
            ? mod.topics.map((t: unknown) => (typeof t === 'string' ? t : String((t as any)?.title ?? (t as any)?.name ?? '')))
            : [],
        })
      )

      const subjectMeta = { courseCode: String(m.courseCode || course?.code || ''), courseName: String(m.courseName || course?.name || '') }
      const mySessions = cohortSessions.filter((s) => sessionBelongsToSubject(s, subjectMeta))

      const covered = new Map<string, string>()
      const planned = new Map<string, string>()
      for (const s of mySessions) {
        for (const t of s.topics) {
          const k = normalizeTopicKey(t)
          if (!k) continue
          if (s.status === 'completed') {
            const prev = covered.get(k)
            if (!prev || s.date < prev) covered.set(k, s.date)
          } else if (s.status !== 'cancelled' && s.date >= today) {
            const prev = planned.get(k)
            if (!prev || s.date < prev) planned.set(k, s.date)
          }
        }
      }
      // Ledger rows for this subject (or unlabelled rows from these teachers).
      for (const row of ledgerRows) {
        if (!isTopicCovered(row.status)) continue
        const rowSubject = String(row.subject || row.course || '')
        const rowCode = String(row.subjectCode || '')
        const belongs =
          (rowCode && normToken(rowCode) === normToken(subjectMeta.courseCode)) ||
          (rowSubject && normProgram(rowSubject) === normProgram(subjectMeta.courseName)) ||
          (!rowSubject && !rowCode)
        if (!belongs) continue
        if (row.batch && student.batch && normToken(row.batch) !== normToken(student.batch)) continue
        const k = normalizeTopicKey(row.title || row.name)
        if (!k || covered.has(k)) continue
        covered.set(k, String(row.dateCovered || normalizeSessionDate(row.coveredAt) || ''))
      }

      const modules = classifyTopics(plannedModules, { covered, planned, today, horizon })
      const total = modules.reduce((a, x) => a + x.total, 0)
      const done = modules.reduce((a, x) => a + x.completed, 0)
      const cur = modules.reduce((a, x) => a + x.current, 0)

      subjects.push({
        curriculumId: String(m.curriculumId || ''),
        courseCode: subjectMeta.courseCode,
        courseName: subjectMeta.courseName,
        facultyName: String(m.facultyName || ''),
        credits: Number(m.credits || course?.credits || 0) || 0,
        totalHours: Number(m.totalHours || course?.totalHours || 0) || 0,
        modules,
        totals: { total, completed: done, current: cur, upcoming: total - done - cur, pct: total ? Math.round((done / total) * 100) : 0 },
        recentSessions: mySessions
          .filter((s) => s.status === 'completed' && s.date <= today)
          .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
          .slice(0, 8),
        upcomingSessions: mySessions
          .filter((s) => s.status !== 'cancelled' && s.status !== 'completed' && s.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
          .slice(0, 8),
      })
    }

    subjects.sort((a, b) => a.courseName.localeCompare(b.courseName))

    const topics = subjects.reduce((a, s) => a + s.totals.total, 0)
    const completed = subjects.reduce((a, s) => a + s.totals.completed, 0)
    const current = subjects.reduce((a, s) => a + s.totals.current, 0)

    logger.info('[studentCurriculum] getMyCurriculum', {
      collegeId: student.collegeId,
      studentId: student.studentId,
      subjects: subjects.length,
      sessions: cohortSessions.length,
    })

    return {
      generatedAt: new Date().toISOString(),
      student: { branch: student.branch, batch: student.batch, semester: student.semester, division: student.division || student.section },
      subjects,
      totals: { subjects: subjects.length, topics, completed, current, upcoming: topics - completed - current, pct: topics ? Math.round((completed / topics) * 100) : 0 },
      upcomingClasses: cohortSessions
        .filter((s) => s.status !== 'cancelled' && s.date >= today && s.date <= upcomingEnd)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
        .slice(0, 40),
      noCurriculumAssigned: false,
    }
  }
)

async function loadUpcomingClasses(
  db: admin.firestore.Firestore,
  student: StudentIdentity,
  from: string,
  to: string
): Promise<StudentSessionSummary[]> {
  const snap = await db
    .collection('classSessions')
    .where('collegeId', '==', student.collegeId)
    .where('date', '>=', from)
    .where('date', '<=', to)
    .limit(MAX_SESSIONS)
    .get()
  return snap.docs
    .filter((d) => sessionMatchesCohort(d.data(), student))
    .map((d) => summarizeSession(d.id, d.data()))
    .filter((s) => s.date && s.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 40)
}
