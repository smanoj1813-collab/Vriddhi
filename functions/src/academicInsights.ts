// functions/src/academicInsights.ts
// ─── Academic Insights — the drill-down aggregate ──────────────────────────
//
// The principal portal's "Academics" surface only offered workflow queues
// (curriculum approvals, timetable, inbox): no answer to "what curriculum is
// assigned to whom, how many classes happened, how much of the syllabus is
// covered, what is the attendance, how are students performing". This callable
// is the computed answer — overview → semester → subject → individual student —
// assembled from the same trustworthy sources as getCurriculumProgress:
//
//   curriculumFacultyMappings — the plan: subject ↔ faculty ↔ cohort
//   classSessions             — the actual: delivered/scheduled classes
//                               (presentCount/attendanceCount per session)
//   facultyTopics + curriculum— the coverage: planned topics vs the ledger
//   assessments / studentAssessments — scores, quizzes, assignments
//   attendanceRecords         — per-student attendance (drill mode only)
//   students                  — the roster (drill mode only)
//
// Everything is computed server-side and bounded by explicit caps; nothing is
// read from a hand-maintained counter field (audit finding F4).

import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/https'
import { logger } from 'firebase-functions'
import {
  type ModuleProgress,
  type SchedulingStaff,
  classesNeededForHours,
  earlierDateKey,
  expectedSessions,
  hoursFromMinutes,
  isSlotActive,
  isTopicCovered,
  mergeTopicCoverage,
  moduleRollup,
  normalizeSessionDate,
  normalizeTopicKey,
  percent,
  plannedTopicsFromCurriculum,
  resolveStaff,
  todayKey,
  validateProgressInput,
  weeksBetween,
  type WeeklySlot,
} from './classSchedule'

// ─── Access ────────────────────────────────────────────────────────────────

/**
 * Who may read academic insights. Unlike getCurriculumProgress (self-service
 * faculty + scheduling staff) this is an ADMINISTRATIVE view: the principal,
 * the admin and the HOD are exactly the people who were missing it.
 */
export const ACADEMIC_INSIGHTS_ROLES = ['superadmin', 'operations', 'admin', 'principal', 'hod']

// ─── Read caps (bounded fan-out, mirroring MAX_PROGRESS_*) ─────────────────

export const MAX_INSIGHTS_MAPPINGS = 500
export const MAX_INSIGHTS_SESSIONS = 2000
export const MAX_INSIGHTS_TOPICS = 300
export const MAX_INSIGHTS_SLOTS = 500
export const MAX_INSIGHTS_ASSESSMENTS = 500
export const MAX_INSIGHTS_SUBMISSIONS = 6000
export const MAX_INSIGHTS_ATTENDANCE_RECORDS = 15000
export const MAX_INSIGHTS_STUDENTS = 1000
export const MAX_INSIGHTS_CURRICULUM_DOCS = 30

// ─── Response types (mirrored client-side in academicInsightsApi.ts) ───────

export interface InsightTopics {
  total: number
  covered: number
  pending: number
  pct: number
}

export interface InsightAttendance {
  present: number
  marked: number
  pct: number
}

export interface InsightSessions {
  total: number
  completed: number
  scheduled: number
  cancelled: number
}

export interface InsightPace {
  slotsPerWeek: number
  weeksElapsed: number
  expected: number
  completed: number
  pct: number
}

export interface AssessmentTypeCounts {
  quiz: number
  assignment: number
  exam: number
  other: number
}

export interface AssessmentRollup {
  total: number
  published: number
  submissions: number
  graded: number
  /** Mean percentage across graded submissions (0-100, one decimal). */
  avgPct: number
  byType: AssessmentTypeCounts
}

export interface SubjectInsight {
  curriculumId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyName: string
  branch: string
  batch: string
  semester: number
  credits: number
  totalHours: number
  modulesCount: number
  hoursPlanned: number
  hoursDelivered: number
  hoursPct: number
  classesNeeded: number
  topics: InsightTopics
  modules: ModuleProgress[]
  sessions: InsightSessions
  pace: InsightPace
  attendance: InsightAttendance
  assessments: AssessmentRollup
}

export interface SemesterInsight {
  semester: number
  label: string
  subjectCount: number
  topics: InsightTopics
  hoursPlanned: number
  hoursDelivered: number
  hoursPct: number
  classesNeeded: number
  sessions: InsightSessions
  attendance: InsightAttendance
  assessments: AssessmentRollup
  subjects: SubjectInsight[]
}

export interface AssessmentInsight {
  id: string
  title: string
  type: string
  bucket: 'quiz' | 'assignment' | 'exam' | 'other'
  status: string
  totalMarks: number
  scheduledDate: string
  submissions: number
  graded: number
  avgMarks: number
  avgPct: number
  highest: number
  lowest: number
}

export interface StudentSubmissionRow {
  assessmentId: string
  title: string
  type: string
  bucket: 'quiz' | 'assignment' | 'exam' | 'other'
  marksObtained: number
  totalMarks: number
  pct: number
  status: string
}

export interface StudentInsightRow {
  studentId: string
  name: string
  regNo: string
  semester: number
  branch: string
  batch: string
  attendance: InsightAttendance
  /** Mean percentage across the student's graded submissions (null when none). */
  avgPct: number | null
  totals: { obtained: number; max: number; pct: number | null }
  submissions: StudentSubmissionRow[]
}

export interface AttendanceTrendPoint {
  date: string
  startTime: string
  topic: string
  status: string
  present: number
  marked: number
  pct: number
}

export interface SubjectDrill {
  subject: SubjectInsight
  assessmentDetail: AssessmentInsight[]
  attendanceTrend: AttendanceTrendPoint[]
  students: StudentInsightRow[]
}

export interface AcademicInsightsResult {
  collegeId: string
  from: string
  to: string
  generatedAt: string
  semesters: SemesterInsight[]
  totals: {
    subjectCount: number
    topics: InsightTopics
    hoursPlanned: number
    hoursDelivered: number
    hoursPct: number
    classesNeeded: number
    sessions: InsightSessions
    attendance: InsightAttendance
    assessments: AssessmentRollup
  }
  /** Present only when the caller asked for one subject (drill mode). */
  subject?: SubjectDrill
}

// ─── Pure helpers (unit-tested in test/academicInsights.test.ts) ───────────

export type AssessmentBucket = 'quiz' | 'assignment' | 'exam' | 'other'

/** Map the free-form assessment type onto the four surfaces the UI shows. */
export function assessmentTypeBucket(type: unknown): AssessmentBucket {
  const value = normalizeTopicKey(type).replace(/\s+/g, '')
  if (!value) return 'other'
  if (value.includes('quiz')) return 'quiz'
  if (value.includes('assign') || value.includes('lab') || value.includes('record')) return 'assignment'
  if (
    value.includes('exam') ||
    value.includes('midterm') ||
    value.includes('endterm') ||
    value.includes('internal') ||
    value === 'ia' ||
    value.includes('test') ||
    value.includes('mock')
  ) {
    return 'exam'
  }
  return 'other'
}

const fold = (value: unknown): string => String(value ?? '').trim().toLowerCase()

/**
 * Tolerant subject join. Sessions and ledger rows name their subject free-text
 * (`subject`, `subjectCode`) while the mapping speaks `courseName`,
 * `courseCode` — three writers, no shared id. Equal codes win, then equal
 * names, then a containment fallback for "Financial Accounting" vs
 * "Financial Accounting (Hons)".
 */
export function matchesSubject(
  candidate: { subject?: unknown; subjectCode?: unknown },
  subject: { courseName?: unknown; courseCode?: unknown }
): boolean {
  const code = fold(candidate.subjectCode)
  const wantCode = fold(subject.courseCode)
  if (code && wantCode && code === wantCode) return true
  const name = normalizeTopicKey(candidate.subject)
  const wantName = normalizeTopicKey(subject.courseName)
  if (name && wantName) {
    if (name === wantName) return true
    const shorter = name.length <= wantName.length ? name : wantName
    const longer = name.length <= wantName.length ? wantName : name
    if (shorter.length >= 4 && longer.includes(shorter)) return true
  }
  // A code written where the name should be (or vice versa) still counts.
  if (code && wantName && normalizeTopicKey(code) === wantName) return true
  if (name && wantCode && name === normalizeTopicKey(wantCode)) return true
  return false
}

/** A session also has to belong to the subject's teacher and cohort. */
export function sessionBelongsToSubject(
  session: Record<string, unknown>,
  subject: {
    facultyId?: unknown
    courseName?: unknown
    courseCode?: unknown
    batch?: unknown
    branch?: unknown
  }
): boolean {
  const faculty = fold(session.facultyId)
  const wantFaculty = fold(subject.facultyId)
  if (faculty && wantFaculty && faculty !== wantFaculty) return false
  const batch = fold(session.batch)
  const wantBatch = fold(subject.batch)
  if (batch && wantBatch && batch !== wantBatch) return false
  const branch = fold(session.branch)
  const wantBranch = fold(subject.branch)
  if (branch && wantBranch && branch !== wantBranch) return false
  return matchesSubject(
    { subject: session.subject, subjectCode: session.subjectCode },
    { courseName: subject.courseName, courseCode: subject.courseCode }
  )
}

export function emptyAssessmentRollup(): AssessmentRollup {
  return {
    total: 0,
    published: 0,
    submissions: 0,
    graded: 0,
    avgPct: 0,
    byType: { quiz: 0, assignment: 0, exam: 0, other: 0 },
  }
}

export function emptyTopics(): InsightTopics {
  return { total: 0, covered: 0, pending: 0, pct: 0 }
}

export function emptySessions(): InsightSessions {
  return { total: 0, completed: 0, scheduled: 0, cancelled: 0 }
}

export function emptyAttendance(): InsightAttendance {
  return { present: 0, marked: 0, pct: 0 }
}

/** Sum subject rows into one rollup (what a semester card shows). */
export function rollupSubjects(subjects: SubjectInsight[]): {
  subjectCount: number
  topics: InsightTopics
  hoursPlanned: number
  hoursDelivered: number
  hoursPct: number
  classesNeeded: number
  sessions: InsightSessions
  attendance: InsightAttendance
  assessments: AssessmentRollup
} {
  const topics = emptyTopics()
  const sessions = emptySessions()
  const attendance = emptyAttendance()
  const assessments = emptyAssessmentRollup()
  let hoursPlanned = 0
  let hoursDelivered = 0
  let gradedSum = 0
  for (const subject of subjects) {
    topics.total += subject.topics.total
    topics.covered += subject.topics.covered
    hoursPlanned += subject.hoursPlanned
    hoursDelivered += subject.hoursDelivered
    sessions.total += subject.sessions.total
    sessions.completed += subject.sessions.completed
    sessions.scheduled += subject.sessions.scheduled
    sessions.cancelled += subject.sessions.cancelled
    attendance.present += subject.attendance.present
    attendance.marked += subject.attendance.marked
    assessments.total += subject.assessments.total
    assessments.published += subject.assessments.published
    assessments.submissions += subject.assessments.submissions
    assessments.graded += subject.assessments.graded
    assessments.byType.quiz += subject.assessments.byType.quiz
    assessments.byType.assignment += subject.assessments.byType.assignment
    assessments.byType.exam += subject.assessments.byType.exam
    assessments.byType.other += subject.assessments.byType.other
    // Weight the mean by graded submissions so a 2-subject semester with one
    // huge course does not average the two subject means equally.
    gradedSum += subject.assessments.graded
  }
  topics.pending = topics.total - topics.covered
  topics.pct = percent(topics.covered, topics.total)
  attendance.pct = percent(attendance.present, attendance.marked)
  hoursDelivered = Math.round(hoursDelivered * 10) / 10
  // Weight the mean percentage by graded submissions so one huge course does
  // not count the same as a small quiz-only subject.
  assessments.avgPct = gradedSum > 0
    ? Math.round(
        (subjects.reduce((acc, subject) => acc + subject.assessments.avgPct * subject.assessments.graded, 0) /
          gradedSum) *
          10
      ) / 10
    : 0
  return {
    subjectCount: subjects.length,
    topics,
    hoursPlanned,
    hoursDelivered,
    hoursPct: percent(hoursDelivered, hoursPlanned),
    classesNeeded: classesNeededForHours(hoursPlanned),
    sessions,
    attendance,
    assessments,
  }
}

/**
 * Group subject rows into semesters, ascending, each carrying its rollup.
 * Subjects with no semester land in semester 0 ("Unassigned").
 */
export function groupIntoSemesters(subjects: SubjectInsight[]): SemesterInsight[] {
  const buckets = new Map<number, SubjectInsight[]>()
  for (const subject of subjects) {
    const key = Number.isFinite(subject.semester) ? subject.semester : 0
    const list = buckets.get(key) || []
    list.push(subject)
    buckets.set(key, list)
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([semester, list]) => {
      const rollup = rollupSubjects(list)
      return {
        semester,
        label: semester > 0 ? `Semester ${semester}` : 'Unassigned semester',
        subjectCount: rollup.subjectCount,
        topics: rollup.topics,
        hoursPlanned: rollup.hoursPlanned,
        hoursDelivered: rollup.hoursDelivered,
        hoursPct: rollup.hoursPct,
        classesNeeded: rollup.classesNeeded,
        sessions: rollup.sessions,
        attendance: rollup.attendance,
        assessments: rollup.assessments,
        subjects: [...list].sort((a, b) =>
          String(a.courseName || a.courseCode).localeCompare(String(b.courseName || b.courseCode), 'en')
        ),
      }
    })
}

/** Marks summary for one assessment. Accepts raw numeric arrays. */
export function submissionStats(
  marks: Array<{ obtained: number; total: number; graded: boolean }>
): { submissions: number; graded: number; avgMarks: number; avgPct: number; highest: number; lowest: number } {
  const gradedRows = marks.filter((row) => row.graded && row.total > 0)
  const submissions = marks.length
  const graded = gradedRows.length
  if (!graded) {
    return { submissions, graded, avgMarks: 0, avgPct: 0, highest: 0, lowest: 0 }
  }
  const obtained = gradedRows.map((row) => row.obtained)
  const sum = obtained.reduce((acc, value) => acc + value, 0)
  const pcts = gradedRows.map((row) => (row.obtained / row.total) * 100)
  return {
    submissions,
    graded,
    avgMarks: Math.round((sum / graded) * 10) / 10,
    avgPct: Math.round((pcts.reduce((acc, value) => acc + value, 0) / graded) * 10) / 10,
    highest: Math.max(...obtained),
    lowest: Math.min(...obtained),
  }
}

/** Per-student rollup: attendance + submissions → one ranked row. */
export function buildStudentRows(
  students: Array<{
    id: string
    name: string
    regNo: string
    semester: number
    branch: string
    batch: string
  }>,
  attendanceByStudent: Map<string, { present: number; marked: number }>,
  submissionsByStudent: Map<string, StudentSubmissionRow[]>
): StudentInsightRow[] {
  return students
    .map((student) => {
      const attendance = attendanceByStudent.get(student.id) || { present: 0, marked: 0 }
      const submissions = (submissionsByStudent.get(student.id) || []).slice().sort((a, b) =>
        a.title.localeCompare(b.title, 'en')
      )
      const graded = submissions.filter((row) => row.totalMarks > 0)
      const obtained = graded.reduce((acc, row) => acc + row.marksObtained, 0)
      const max = graded.reduce((acc, row) => acc + row.totalMarks, 0)
      const avgPct = graded.length
        ? Math.round((graded.reduce((acc, row) => acc + row.pct, 0) / graded.length) * 10) / 10
        : null
      return {
        studentId: student.id,
        name: student.name,
        regNo: student.regNo,
        semester: student.semester,
        branch: student.branch,
        batch: student.batch,
        attendance: {
          present: attendance.present,
          marked: attendance.marked,
          pct: percent(attendance.present, attendance.marked),
        },
        avgPct,
        totals: {
          obtained,
          max,
          pct: max > 0 ? percent(obtained, max) : null,
        },
        submissions,
      }
    })
    .sort((a, b) => {
      // Best performers first; the ungraded roster brings up the rear.
      const av = a.avgPct ?? -1
      const bv = b.avgPct ?? -1
      if (av !== bv) return bv - av
      return a.name.localeCompare(b.name, 'en')
    })
}

// ─── Callable ──────────────────────────────────────────────────────────────

interface InsightSubjectRow {
  curriculumId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyName: string
  branch: string
  batch: string
  semester: number
  credits: number
  totalHours: number
  modulesCount: number
  mapping: Record<string, unknown>
}

function subjectRowFromMapping(mapping: Record<string, unknown>): InsightSubjectRow {
  return {
    curriculumId: String(mapping.curriculumId || ''),
    courseId: String(mapping.courseId || ''),
    courseCode: String(mapping.courseCode || ''),
    courseName: String(mapping.courseName || ''),
    facultyId: String(mapping.facultyId || ''),
    facultyName: String(mapping.facultyName || ''),
    branch: String(mapping.branch || ''),
    batch: String(mapping.batch || ''),
    semester: Number(mapping.semester) || 0,
    credits: Number(mapping.credits) || 0,
    totalHours: Number(mapping.totalHours) || 0,
    modulesCount: Number(mapping.modulesCount) || 0,
    mapping,
  }
}

/** Does an assessment belong to this subject? Same three-writer problem. */
export function assessmentBelongsToSubject(
  assessment: Record<string, unknown>,
  subject: InsightSubjectRow
): boolean {
  if (assessment.subjectId && subject.curriculumId && fold(assessment.subjectId) === fold(subject.curriculumId)) {
    return true
  }
  if (assessment.courseId && subject.courseId && fold(assessment.courseId) === fold(subject.courseId)) {
    return true
  }
  return matchesSubject(
    { subject: assessment.courseName, subjectCode: assessment.courseCode },
    { courseName: subject.courseName, courseCode: subject.courseCode }
  )
}

function isPresentStatus(status: unknown): boolean {
  const value = normalizeTopicKey(status)
  return value === 'present' || value === 'late'
}

/**
 * Overview → semester → subject → individual student.
 *
 * Without `curriculumId` the result carries the semester/subject tree only
 * (aggregates are cheap: the session docs carry their own attendance
 * counters). With `curriculumId` the single subject is drilled: assessment
 * breakdown, attendance trend and the per-student rows that the roster,
 * the attendance records and the submissions add up to.
 */
export const getAcademicInsights = onCall(
  { region: 'asia-south1', memory: '1GiB', timeoutSeconds: 120, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff: SchedulingStaff = await resolveStaff(
      uid,
      (request.auth?.token || {}) as Record<string, unknown>,
      ACADEMIC_INSIGHTS_ROLES,
      'Academic insights access is required'
    )
    const input = validateProgressInput(request.data, staff.role, staff.collegeId)

    const db = admin.firestore()

    // ─── Plan: the assigned curriculum ────────────────────────────────────
    const mappingsSnap = await db
      .collection('curriculumFacultyMappings')
      .where('collegeId', '==', input.collegeId)
      .limit(MAX_INSIGHTS_MAPPINGS)
      .get()

    const mappings = mappingsSnap.docs
      .map((doc): Record<string, unknown> & { id: string } => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((mapping) => {
        if (String(mapping.status || '') === 'removed') return false
        if (input.facultyId && String(mapping.facultyId || '') !== input.facultyId) return false
        if (input.curriculumId && String(mapping.curriculumId || '') !== input.curriculumId) return false
        if (input.batch && fold(mapping.batch) !== fold(input.batch)) return false
        if (input.branch && fold(mapping.branch) !== fold(input.branch)) return false
        if (input.semester && String(mapping.semester ?? '') !== input.semester) return false
        return true
      })

    const subjectRows = mappings.map(subjectRowFromMapping)

    // ─── Actual: the sessions the timetable materialised ─────────────────
    let sessionQuery: admin.firestore.Query = db
      .collection('classSessions')
      .where('collegeId', '==', input.collegeId)
    if (input.from) sessionQuery = sessionQuery.where('date', '>=', input.from)
    if (input.to) sessionQuery = sessionQuery.where('date', '<=', input.to)
    const sessionsSnap = await sessionQuery.limit(MAX_INSIGHTS_SESSIONS).get()
    const sessions: Array<Record<string, unknown>> = sessionsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }))

    const weeklySnap = await db
      .collection('weeklySchedules')
      .where('collegeId', '==', input.collegeId)
      .limit(MAX_INSIGHTS_SLOTS)
      .get()
    const weeklySlots = weeklySnap.docs
      .map((doc): Record<string, unknown> & { id: string } => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((slot) => isSlotActive(slot as WeeklySlot))

    // ─── Coverage: curriculum bank + the faculty ledger ──────────────────
    const facultyIds = [...new Set(subjectRows.map((row) => row.facultyId).filter(Boolean))]
    const ledgerByFaculty = new Map<string, Array<Record<string, unknown>>>()
    for (const facultyId of facultyIds.slice(0, MAX_INSIGHTS_MAPPINGS)) {
      const ledgerSnap = await db
        .collection('facultyTopics')
        .where('facultyId', '==', facultyId)
        .limit(MAX_INSIGHTS_TOPICS)
        .get()
      ledgerByFaculty.set(
        facultyId,
        ledgerSnap.docs.map((doc) => doc.data() as Record<string, unknown>)
      )
    }
    const curriculumIds = [
      ...new Set(subjectRows.map((row) => row.curriculumId).filter(Boolean)),
    ].slice(0, MAX_INSIGHTS_CURRICULUM_DOCS)
    const curriculumSnaps = curriculumIds.length
      ? await db.getAll(...curriculumIds.map((id) => db.collection('curriculum').doc(id)))
      : []
    const curriculumDocs = curriculumSnaps
      .filter((snap): snap is admin.firestore.DocumentSnapshot => Boolean(snap && snap.exists))
      .map((snap) => ({ id: snap.id, data: snap.data() || {} }))

    // ─── Scores: assessments + submissions ───────────────────────────────
    const assessmentsSnap = await db
      .collection('assessments')
      .where('collegeId', '==', input.collegeId)
      .limit(MAX_INSIGHTS_ASSESSMENTS)
      .get()
    const allAssessments: Array<Record<string, unknown>> = assessmentsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    }))

    // Submissions are read once for the whole college (overview shares them),
    // chunked because Firestore's `in` filter caps at 10 values per query.
    const submissionsByAssessment = new Map<string, Array<Record<string, unknown>>>()
    {
      const assessmentIds = allAssessments.map((a) => String(a.id)).filter(Boolean)
      let budget = MAX_INSIGHTS_SUBMISSIONS
      for (let index = 0; index < assessmentIds.length && budget > 0; index += 10) {
        const chunk = assessmentIds.slice(index, index + 10)
        const snap = await db
          .collection('studentAssessments')
          .where('assessmentId', 'in', chunk)
          .limit(budget)
          .get()
        budget -= snap.size
        for (const doc of snap.docs) {
          const data = doc.data() as Record<string, unknown>
          const key = String(data.assessmentId || '')
          const list = submissionsByAssessment.get(key) || []
          list.push(data)
          submissionsByAssessment.set(key, list)
        }
      }
    }

    // ─── Per subject ─────────────────────────────────────────────────────
    const today = todayKey()
    const subjectInsights: SubjectInsight[] = []

    for (const subject of subjectRows) {
      const subjectSessions = sessions.filter((session) => sessionBelongsToSubject(session, subject))

      // Coverage: the curriculum bank leads (module numbers/hours), the ledger
      // and the completed sessions' topic lists OR their coverage in.
      const coveredTitles = new Set<string>()
      subjectSessions
        .filter((session) => String(session.status || '') === 'completed')
        .forEach((session) => {
          const titles = Array.isArray(session.topicsCovered) ? session.topicsCovered : []
          titles.forEach((title: unknown) => {
            const key = normalizeTopicKey(title)
            if (key) coveredTitles.add(key)
          })
        })
      const ledgerRows = (ledgerByFaculty.get(subject.facultyId) || []).filter(
        (row) =>
          (!row.subject && !row.subjectCode) || matchesSubject(
            { subject: row.subject, subjectCode: row.subjectCode },
            { courseName: subject.courseName, courseCode: subject.courseCode }
          )
      )
      const rows = [
        ...plannedTopicsFromCurriculum([subject.mapping], curriculumDocs).map((row) => ({
          ...row,
          covered: false,
        })),
        ...ledgerRows.map((row) => ({
          title: String(row.title || row.name || ''),
          moduleNo: String(row.moduleNo || ''),
          moduleName: String(row.moduleName || row.unit || ''),
          hours: Number(row.hours) || 0,
          covered: isTopicCovered(row.status),
        })),
      ]
      const topics = mergeTopicCoverage(rows, coveredTitles)
      const topicsCovered = topics.filter((topic) => topic.covered).length

      // Sessions & hours.
      const completed = subjectSessions.filter((s) => String(s.status || '') === 'completed')
      const deliveredMinutes = completed.reduce(
        (sum, s) => sum + (Number(s.durationMinutes) > 0 ? Number(s.durationMinutes) : 60),
        0
      )
      const attendancePresent = subjectSessions.reduce((sum, s) => sum + (Number(s.presentCount) || 0), 0)
      const attendanceMarked = subjectSessions.reduce((sum, s) => sum + (Number(s.attendanceCount) || 0), 0)

      // Pace against the college's own timetable for this subject.
      const slotsPerWeek = weeklySlots.filter((slot) =>
        sessionBelongsToSubject(slot, subject)
      ).length
      const sessionDates = subjectSessions
        .map((s) => normalizeSessionDate(s.date))
        .filter((date): date is string => Boolean(date))
        .sort()
      const termStart = input.from || sessionDates[0] || today
      const termEnd = earlierDateKey(input.to || sessionDates[sessionDates.length - 1] || today, today)
      const weeksElapsed =
        termEnd && termStart && termEnd >= termStart ? weeksBetween(termStart, termEnd) : 0
      const expected = expectedSessions(slotsPerWeek, weeksElapsed)

      // Assessments + submissions for this subject.
      const subjectAssessments = allAssessments.filter((assessment) =>
        assessmentBelongsToSubject(assessment, subject)
      )
      const rollup = emptyAssessmentRollup()
      const byAssessmentMarks: Array<Array<{ obtained: number; total: number; graded: boolean }>> = []
      for (const assessment of subjectAssessments) {
        const bucket = assessmentTypeBucket(assessment.type)
        rollup.byType[bucket] += 1
        if (String(assessment.status || '') === 'published' || String(assessment.status || '') === 'completed') {
          rollup.published += 1
        }
        const subs = submissionsByAssessment.get(String(assessment.id)) || []
        byAssessmentMarks.push(
          subs.map((sub) => ({
            obtained: Number(sub.marksObtained) || 0,
            total: Number(sub.totalMarks) || Number(assessment.totalMarks) || 0,
            graded: String(sub.status || '') === 'graded',
          }))
        )
      }
      const allMarks = byAssessmentMarks.flat()
      const stats = submissionStats(allMarks)
      rollup.total = subjectAssessments.length
      rollup.submissions = stats.submissions
      rollup.graded = stats.graded
      rollup.avgPct = stats.avgPct

      const hoursPlanned = subject.totalHours
      subjectInsights.push({
        curriculumId: subject.curriculumId,
        courseId: subject.courseId,
        courseCode: subject.courseCode,
        courseName: subject.courseName,
        facultyId: subject.facultyId,
        facultyName: subject.facultyName,
        branch: subject.branch,
        batch: subject.batch,
        semester: subject.semester,
        credits: subject.credits,
        totalHours: subject.totalHours,
        modulesCount: subject.modulesCount,
        hoursPlanned,
        hoursDelivered: hoursFromMinutes(deliveredMinutes),
        hoursPct: percent(hoursFromMinutes(deliveredMinutes), hoursPlanned),
        classesNeeded: classesNeededForHours(hoursPlanned),
        topics: {
          total: topics.length,
          covered: topicsCovered,
          pending: topics.length - topicsCovered,
          pct: percent(topicsCovered, topics.length),
        },
        modules: moduleRollup(topics),
        sessions: {
          total: subjectSessions.length,
          completed: completed.length,
          scheduled: subjectSessions.filter((s) => String(s.status || 'scheduled') === 'scheduled').length,
          cancelled: subjectSessions.filter((s) => String(s.status || '') === 'cancelled').length,
        },
        pace: {
          slotsPerWeek,
          weeksElapsed,
          expected,
          completed: completed.length,
          pct: percent(completed.length, expected),
        },
        attendance: {
          present: attendancePresent,
          marked: attendanceMarked,
          pct: percent(attendancePresent, attendanceMarked),
        },
        assessments: rollup,
      })
    }

    const semesters = groupIntoSemesters(subjectInsights)
    const totalsRollup = rollupSubjects(subjectInsights)

    const base: AcademicInsightsResult = {
      collegeId: input.collegeId,
      from: input.from,
      to: input.to,
      generatedAt: new Date().toISOString(),
      semesters,
      totals: {
        subjectCount: totalsRollup.subjectCount,
        topics: totalsRollup.topics,
        hoursPlanned: totalsRollup.hoursPlanned,
        hoursDelivered: totalsRollup.hoursDelivered,
        hoursPct: totalsRollup.hoursPct,
        classesNeeded: totalsRollup.classesNeeded,
        sessions: totalsRollup.sessions,
        attendance: totalsRollup.attendance,
        assessments: totalsRollup.assessments,
      },
    }

    // ─── Drill mode: one subject, down to the individual student ─────────
    if (input.curriculumId && subjectInsights.length) {
      const subjectInsight = subjectInsights[0]
      const subjectRow = subjectRows[0]
      const subjectSessions = sessions.filter((session) => sessionBelongsToSubject(session, subjectRow))
      const subjectAssessments = allAssessments.filter((assessment) =>
        assessmentBelongsToSubject(assessment, subjectRow)
      )

      // Assessment detail.
      const assessmentDetail: AssessmentInsight[] = subjectAssessments.map((assessment) => {
        const subs = (submissionsByAssessment.get(String(assessment.id)) || []).map((sub) => ({
          obtained: Number(sub.marksObtained) || 0,
          total: Number(sub.totalMarks) || Number(assessment.totalMarks) || 0,
          graded: String(sub.status || '') === 'graded',
        }))
        const stats = submissionStats(subs)
        return {
          id: String(assessment.id),
          title: String(assessment.title || 'Assessment'),
          type: String(assessment.type || ''),
          bucket: assessmentTypeBucket(assessment.type),
          status: String(assessment.status || ''),
          totalMarks: Number(assessment.totalMarks) || 0,
          scheduledDate: normalizeSessionDate(assessment.scheduledDate || assessment.startDate || ''),
          submissions: stats.submissions,
          graded: stats.graded,
          avgMarks: stats.avgMarks,
          avgPct: stats.avgPct,
          highest: stats.highest,
          lowest: stats.lowest,
        }
      })

      // Attendance trend straight off the session counters.
      const attendanceTrend: AttendanceTrendPoint[] = subjectSessions
        .map((session) => {
          const present = Number(session.presentCount) || 0
          const marked = Number(session.attendanceCount) || 0
          return {
            date: normalizeSessionDate(session.date),
            startTime: String(session.startTime || ''),
            topic: String(session.topic || ''),
            status: String(session.status || ''),
            present,
            marked,
            pct: percent(present, marked),
          }
        })
        .filter((point) => Boolean(point.date))
        .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)))

      // Per-student attendance (attendanceRecords, chunked by session id).
      const sessionIds = subjectSessions.map((s) => String(s.id)).filter(Boolean)
      const attendanceByStudent = new Map<string, { present: number; marked: number }>()
      {
        let budget = MAX_INSIGHTS_ATTENDANCE_RECORDS
        for (let index = 0; index < sessionIds.length && budget > 0; index += 10) {
          const chunk = sessionIds.slice(index, index + 10)
          const snap = await db
            .collection('attendanceRecords')
            .where('sessionId', 'in', chunk)
            .limit(budget)
            .get()
          budget -= snap.size
          for (const doc of snap.docs) {
            const data = doc.data() as Record<string, unknown>
            const studentId = String(data.studentId || '')
            if (!studentId) continue
            const row = attendanceByStudent.get(studentId) || { present: 0, marked: 0 }
            row.marked += 1
            if (isPresentStatus(data.status)) row.present += 1
            attendanceByStudent.set(studentId, row)
          }
        }
      }

      // Submissions per student for this subject's assessments.
      const submissionsByStudent = new Map<string, StudentSubmissionRow[]>()
      for (const assessment of subjectAssessments) {
        const subs = submissionsByAssessment.get(String(assessment.id)) || []
        for (const sub of subs) {
          const studentId = String(sub.studentId || '')
          if (!studentId) continue
          const total = Number(sub.totalMarks) || Number(assessment.totalMarks) || 0
          const obtained = Number(sub.marksObtained) || 0
          const list = submissionsByStudent.get(studentId) || []
          list.push({
            assessmentId: String(assessment.id),
            title: String(assessment.title || 'Assessment'),
            type: String(assessment.type || ''),
            bucket: assessmentTypeBucket(assessment.type),
            marksObtained: obtained,
            totalMarks: total,
            pct: total > 0 ? Math.round((obtained / total) * 1000) / 10 : 0,
            status: String(sub.status || ''),
          })
          submissionsByStudent.set(studentId, list)
        }
      }

      // Roster: the subject's cohort. The mapping's cohort fields filter;
      // when the mapping carries no batch every student of the semester is in.
      const studentsSnap = await db
        .collection('students')
        .where('collegeId', '==', input.collegeId)
        .limit(MAX_INSIGHTS_STUDENTS)
        .get()
      const roster = studentsSnap.docs
        .map((doc): Record<string, unknown> & { id: string } => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
        .filter((student) => {
          const semester = Number(student.semester ?? student.currentSemester ?? 0)
          if (subjectRow.semester && semester && semester !== subjectRow.semester) return false
          if (subjectRow.batch && fold(student.batch) && fold(student.batch) !== fold(subjectRow.batch)) return false
          if (subjectRow.branch && fold(student.branch) && fold(student.branch) !== fold(subjectRow.branch)) {
            return false
          }
          return true
        })
        .map((student) => ({
          id: String(student.id),
          name: String(student.name || student.displayName || ''),
          regNo: String(student.usn || student.regNo || student.rollNo || ''),
          semester: Number(student.semester ?? student.currentSemester ?? 0),
          branch: String(student.branch || ''),
          batch: String(student.batch || ''),
        }))

      // Include anyone who has marks/attendance but sits outside the roster
      // filter (e.g. a promoted student), so nobody's numbers disappear.
      const rosterIds = new Set(roster.map((student) => student.id))
      for (const studentId of [...attendanceByStudent.keys(), ...submissionsByStudent.keys()]) {
        if (rosterIds.has(studentId)) continue
        roster.push({
          id: studentId,
          name: '',
          regNo: '',
          semester: subjectRow.semester,
          branch: subjectRow.branch,
          batch: subjectRow.batch,
        })
        rosterIds.add(studentId)
      }

      base.subject = {
        subject: subjectInsight,
        assessmentDetail: assessmentDetail.sort((a, b) =>
          a.scheduledDate === b.scheduledDate
            ? a.title.localeCompare(b.title, 'en')
            : b.scheduledDate.localeCompare(a.scheduledDate)
        ),
        attendanceTrend,
        students: buildStudentRows(roster, attendanceByStudent, submissionsByStudent),
      }
    }

    logger.info('[academicInsights] getAcademicInsights', {
      collegeId: input.collegeId,
      subjects: subjectInsights.length,
      semesters: semesters.length,
      drill: Boolean(input.curriculumId),
      actorUid: uid,
    })

    return base
  }
)
