// src/shared/api/academicContext.ts
// ------------------------------------------------------------------
// Phase 1 deterministic academic context — frontend contracts.
//
// This module is deliberately pure: it defines the typed request/response
// models for the `getMyStudentAcademicContext`, `getFacultyAcademicContext`
// and `getPaperAcademicContext` callables, plus normalisers that coerce the
// raw (spread-Firestore-document) payloads into those models. The Firebase
// callable wiring lives in `academicContextApi.ts`; this file has NO Firebase
// imports so the mapping and disabled/error behaviour stays cheap to test
// (npm run test:unit) exactly like the backend builders in
// functions/src/academic/context.ts.
//
// Nothing here calls an AI: the values are served verbatim from the
// deterministic backend context, or reported as missing.
// ------------------------------------------------------------------

// ─── Shared shapes (mirror functions/src/academic/context.ts) ──────────

export interface AcademicContextStudent {
  id: string
  uid?: string
  collegeId: string
  name?: string
  branch?: string
  batch?: string
  semester?: number
  division?: string
  section?: string
}

export interface AcademicContextClass {
  id: string
  date: string
  startTime?: string
  endTime?: string
  subject?: string
  subjectCode?: string
  facultyName?: string
  room?: string
  status?: string
  topics?: string[]
}

export interface AcademicContextAssignment {
  id: string
  title: string
  courseName?: string
  courseCode?: string
  dueDate?: string
  status?: string
  submitted?: boolean
}

export interface AcademicContextTest {
  id: string
  title: string
  subject?: string
  startDateTime: string
  status?: string
}

export interface AcademicContextCurriculum {
  id: string
  status?: string
  courseCode: string
  courseName: string
  semester?: number
  moduleCount: number
}

export interface AcademicContextAttendance {
  date: string
  status: string
}

export interface StudentAcademicContext {
  kind: 'student'
  generatedFor: string
  collegeId: string
  student: AcademicContextStudent
  classes: AcademicContextClass[]
  pendingAssignments: AcademicContextAssignment[]
  upcomingTests: AcademicContextTest[]
  curriculum: AcademicContextCurriculum[]
  attendance: {
    records: AcademicContextAttendance[]
    present: number
    absent: number
    percentage: number | null
  }
}

export interface AcademicContextCourse {
  id: string
  courseCode: string
  courseName: string
  moduleCount: number
}

export interface AcademicContextSession {
  id: string
  date: string
  courseId?: string
  courseCode?: string
  topicNames?: string[]
  status?: string
}

export interface AcademicContextFacultyAssignment {
  id: string
  courseId?: string
  courseCode?: string
  title: string
  dueDate?: string
  status?: string
}

export interface AcademicContextFacultyAssessment {
  id: string
  courseId?: string
  courseCode?: string
  title: string
  scheduledAt?: string
  status?: string
}

export interface FacultyAcademicContext {
  kind: 'faculty'
  generatedFor: string
  collegeId: string
  facultyId: string
  courses: AcademicContextCourse[]
  completedTopics: string[]
  upcomingSessions: AcademicContextSession[]
  assignmentHistory: AcademicContextFacultyAssignment[]
  assessmentHistory: AcademicContextFacultyAssessment[]
}

/**
 * Metadata-only view of an approved paper question candidate.
 *
 * The backend spreads the whole question document into each candidate, so the
 * frontend normaliser explicitly whitelists these safe fields — question
 * text, options and any restricted answer material are DROPPED here and can
 * never reach the paper-context UI.
 */
export interface AcademicPaperCandidate {
  id: string
  courseCode?: string
  moduleId?: string
  topicId?: string
  type?: string
  difficulty?: string
  bloomsLevel?: string
  usedAt?: string
  approved: boolean
}

export interface AcademicPaperBlueprint {
  totalQuestions?: number
  totalMarks?: number
  sections?: Array<{ name: string; count: number; marks?: number; difficulty?: string }>
}

export interface PaperAcademicContext {
  kind: 'paper'
  generatedFor: string
  collegeId: string
  course: AcademicContextCourse | null
  candidates: AcademicPaperCandidate[]
  blueprint: AcademicPaperBlueprint | null
  recentlyUsedQuestionIds: string[]
  distributions: { difficulty: Record<string, number>; blooms: Record<string, number> }
}

// ─── Responses: the callable feature gate ──────────────────────────────

/** What the callable returns when ACADEMIC_INTELLIGENCE_ENABLED is off. */
export interface AcademicContextDisabled {
  enabled: false
}

export type StudentAcademicContextResponse =
  | AcademicContextDisabled
  | { enabled: true; context: StudentAcademicContext }

export type FacultyAcademicContextResponse =
  | AcademicContextDisabled
  | { enabled: true; context: FacultyAcademicContext }

export type PaperAcademicContextResponse =
  | AcademicContextDisabled
  | { enabled: true; context: PaperAcademicContext }

// ─── Requests ──────────────────────────────────────────────────────────

export interface StudentAcademicContextParams {
  /** Local calendar date as yyyy-mm-dd. Omit for "today". */
  date?: string
}

export interface FacultyAcademicContextParams {
  date?: string
  /** Optional curriculum course filter. */
  courseId?: string
}

export interface PaperAcademicContextParams {
  courseId?: string
  blueprint?: AcademicPaperBlueprint | null
}

// ─── Normalisation helpers ─────────────────────────────────────────────

type UnknownRecord = Record<string, unknown>

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' ? (value as UnknownRecord) : {}

const asText = (value: unknown): string | undefined => {
  const text = String(value ?? '').trim()
  return text ? text : undefined
}

const asNumber = (value: unknown): number | undefined => {
  // `Number(null)`/`Number('')` are 0 — a null must stay "no value" (e.g. the
  // attendance percentage of a student with no records), never a fake 0.
  if (value === null || value === undefined || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.map((item) => String(item ?? '').trim()).filter(Boolean) : undefined

const isoDatePart = (value: unknown): string | undefined => {
  const text = asText(value)
  if (!text) return undefined
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

/** Local calendar date as yyyy-mm-dd — the key the backend filters classes by. */
export function todayDateKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

/** Validate a yyyy-mm-dd request date; the backend rejects anything else. */
export function normaliseDateKey(date?: string): string | undefined {
  if (!date) return undefined
  const text = String(date).trim()
  return DATE_KEY.test(text) ? text : undefined
}

function normaliseStudentClass(id: string, raw: UnknownRecord): AcademicContextClass {
  return {
    id,
    date: String(raw.date ?? raw.sessionDate ?? '').slice(0, 10),
    startTime: asText(raw.startTime),
    endTime: asText(raw.endTime),
    subject: asText(raw.subject),
    subjectCode: asText(raw.subjectCode),
    facultyName: asText(raw.facultyName ?? raw.teacher ?? raw.teacherName),
    room: asText(raw.room),
    status: asText(raw.status),
    topics: asStringArray(raw.topics ?? raw.topicsCovered),
  }
}

function normaliseAssignment(id: string, raw: UnknownRecord): AcademicContextAssignment {
  return {
    id,
    title: asText(raw.title) || asText(raw.name) || 'Assignment',
    courseName: asText(raw.courseName),
    courseCode: asText(raw.courseCode),
    dueDate: asText(raw.dueDate),
    status: asText(raw.status),
    submitted: raw.submitted === true,
  }
}

function normaliseTest(id: string, raw: UnknownRecord): AcademicContextTest {
  return {
    id,
    title: asText(raw.title) || asText(raw.paperTitle) || 'Assessment',
    subject: asText(raw.subject),
    startDateTime: String(raw.startDateTime ?? raw.scheduledAt ?? ''),
    status: asText(raw.status),
  }
}

function normaliseCurriculum(raw: UnknownRecord): AcademicContextCurriculum {
  const modules = Array.isArray(raw.modules) ? raw.modules : []
  return {
    id: String(raw.id ?? ''),
    status: asText(raw.status),
    courseCode: asText(raw.courseCode) || '—',
    courseName: asText(raw.courseName) || asText(raw.name) || 'Course',
    semester: asNumber(raw.semester),
    moduleCount: modules.length,
  }
}

function normaliseStudentContext(raw: UnknownRecord): StudentAcademicContext {
  const classes = Array.isArray(raw.classes) ? raw.classes : []
  const assignments = Array.isArray(raw.pendingAssignments) ? raw.pendingAssignments : []
  const tests = Array.isArray(raw.upcomingTests) ? raw.upcomingTests : []
  const curriculum = Array.isArray(raw.curriculum) ? raw.curriculum : []
  const attendanceRaw = asRecord(raw.attendance)
  const recordsRaw = Array.isArray(attendanceRaw.records) ? attendanceRaw.records : []

  return {
    kind: 'student',
    generatedFor: String(raw.generatedFor ?? ''),
    collegeId: String(raw.collegeId ?? ''),
    student: (() => {
      const student = asRecord(raw.student)
      return {
        id: String(student.id ?? ''),
        uid: asText(student.uid),
        collegeId: String(student.collegeId ?? raw.collegeId ?? ''),
        name: asText(student.name),
        branch: asText(student.branch),
        batch: asText(student.batch),
        semester: asNumber(student.semester),
        division: asText(student.division),
        section: asText(student.section),
      }
    })(),
    classes: classes.map((item, index) => normaliseStudentClass(String(asRecord(item).id ?? index), asRecord(item))),
    pendingAssignments: assignments.map((item, index) =>
      normaliseAssignment(String(asRecord(item).id ?? index), asRecord(item))
    ),
    upcomingTests: tests.map((item, index) => normaliseTest(String(asRecord(item).id ?? index), asRecord(item))),
    curriculum: curriculum.map((item) => normaliseCurriculum(asRecord(item))),
    attendance: {
      records: recordsRaw.map((item) => {
        const record = asRecord(item)
        return {
          date: isoDatePart(record.date) || String(record.date ?? '').slice(0, 10),
          status: String(record.status ?? ''),
        }
      }),
      present: asNumber(attendanceRaw.present) ?? 0,
      absent: asNumber(attendanceRaw.absent) ?? 0,
      percentage: asNumber(attendanceRaw.percentage) ?? null,
    },
  }
}

function normaliseFacultyContext(raw: UnknownRecord): FacultyAcademicContext {
  const courses = Array.isArray(raw.courses) ? raw.courses : []
  const sessions = Array.isArray(raw.upcomingSessions) ? raw.upcomingSessions : []
  const assignments = Array.isArray(raw.assignmentHistory) ? raw.assignmentHistory : []
  const assessments = Array.isArray(raw.assessmentHistory) ? raw.assessmentHistory : []

  return {
    kind: 'faculty',
    generatedFor: String(raw.generatedFor ?? ''),
    collegeId: String(raw.collegeId ?? ''),
    facultyId: String(raw.facultyId ?? ''),
    courses: courses.map((item) => normaliseCurriculum(asRecord(item))),
    completedTopics: asStringArray(raw.completedTopics) ?? [],
    upcomingSessions: sessions.map((item, index) => {
      const session = asRecord(item)
      return {
        id: String(session.id ?? index),
        date: String(session.date ?? '').slice(0, 10),
        courseId: asText(session.courseId),
        courseCode: asText(session.courseCode),
        topicNames: asStringArray(session.topicNames ?? session.topics),
        status: asText(session.status),
      }
    }),
    assignmentHistory: assignments.map((item, index) => {
      const assignment = asRecord(item)
      return {
        id: String(assignment.id ?? index),
        courseId: asText(assignment.courseId),
        courseCode: asText(assignment.courseCode),
        title: asText(assignment.title) || 'Assignment',
        dueDate: asText(assignment.dueDate),
        status: asText(assignment.status),
      }
    }),
    assessmentHistory: assessments.map((item, index) => {
      const assessment = asRecord(item)
      return {
        id: String(assessment.id ?? index),
        courseId: asText(assessment.courseId),
        courseCode: asText(assessment.courseCode),
        title: asText(assessment.title) || 'Assessment',
        scheduledAt: asText(assessment.scheduledAt ?? assessment.startDateTime),
        status: asText(assessment.status),
      }
    }),
  }
}

/** Whitelist of candidate fields the paper UI is allowed to see. */
const PAPER_CANDIDATE_FIELDS = [
  'id', 'courseCode', 'moduleId', 'topicId', 'type', 'difficulty', 'bloomsLevel', 'usedAt',
] as const

function normalisePaperContext(raw: UnknownRecord): PaperAcademicContext {
  const candidatesRaw = Array.isArray(raw.candidates) ? raw.candidates : []
  const blueprintRaw = asRecord(raw.blueprint)
  const sectionsRaw = Array.isArray(blueprintRaw.sections) ? blueprintRaw.sections : []
  const distributionsRaw = asRecord(raw.distributions)
  const difficultyRaw = asRecord(distributionsRaw.difficulty)
  const bloomsRaw = asRecord(distributionsRaw.blooms)

  const toCounts = (source: UnknownRecord): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const [key, value] of Object.entries(source)) {
      const n = Number(value)
      if (key && Number.isFinite(n)) counts[key] = n
    }
    return counts
  }

  return {
    kind: 'paper',
    generatedFor: String(raw.generatedFor ?? ''),
    collegeId: String(raw.collegeId ?? ''),
    course: raw.course && typeof raw.course === 'object' ? normaliseCurriculum(asRecord(raw.course)) : null,
    // Safety: only the whitelisted metadata fields survive. Question text,
    // options and any restricted answer keys are dropped, never rendered.
    candidates: candidatesRaw.map((item, index) => {
      const candidate = asRecord(item)
      const safe: AcademicPaperCandidate = {
        id: String(candidate.id ?? index),
        approved: candidate.approved !== false,
      }
      for (const field of PAPER_CANDIDATE_FIELDS) {
        if (field === 'id') continue
        const value = asText(candidate[field])
        if (value) safe[field] = value
      }
      return safe
    }),
    blueprint: raw.blueprint && typeof raw.blueprint === 'object'
      ? {
          totalQuestions: asNumber(blueprintRaw.totalQuestions),
          totalMarks: asNumber(blueprintRaw.totalMarks),
          sections: sectionsRaw.map((item) => {
            const section = asRecord(item)
            return {
              name: String(section.name ?? ''),
              count: Number(section.count) || 0,
              marks: asNumber(section.marks),
              difficulty: asText(section.difficulty),
            }
          }),
        }
      : null,
    recentlyUsedQuestionIds: asStringArray(raw.recentlyUsedQuestionIds) ?? [],
    distributions: { difficulty: toCounts(difficultyRaw), blooms: toCounts(bloomsRaw) },
  }
}

// ─── Response normalisers (disabled gate + typed context) ──────────────

export function normaliseStudentAcademicContextResponse(
  payload: unknown
): StudentAcademicContextResponse {
  const raw = asRecord(payload)
  if (raw.enabled !== true) return { enabled: false }
  return { enabled: true, context: normaliseStudentContext(asRecord(raw.context)) }
}

export function normaliseFacultyAcademicContextResponse(
  payload: unknown
): FacultyAcademicContextResponse {
  const raw = asRecord(payload)
  if (raw.enabled !== true) return { enabled: false }
  return { enabled: true, context: normaliseFacultyContext(asRecord(raw.context)) }
}

export function normalisePaperAcademicContextResponse(
  payload: unknown
): PaperAcademicContextResponse {
  const raw = asRecord(payload)
  if (raw.enabled !== true) return { enabled: false }
  return { enabled: true, context: normalisePaperContext(asRecord(raw.context)) }
}

// ─── Error mapping ─────────────────────────────────────────────────────

/**
 * Firebase callable rejections arrive as code/message pairs where the code is
 * namespaced `functions/<HttpsError code>`. Same mapping style as
 * assignmentAnalyticsApi, kept pure so it can be unit-tested.
 */
const ACADEMIC_ERROR_MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Your session has expired. Sign out and back in, then try again.',
  'functions/permission-denied': 'Your account does not have access to this academic context.',
  'functions/failed-precondition': 'This account is not linked to a valid college/student identity yet.',
  'functions/invalid-argument': 'The academic context request was invalid. Refresh and try again.',
  'functions/unavailable': 'The academic service is temporarily unavailable. Try again shortly.',
  'functions/internal': 'The academic service hit an unexpected error. Try again shortly.',
  'functions/deadline-exceeded': 'The academic context took too long to load. Try again.',
}

const STUDENT_ERROR_OVERRIDES: Record<string, string> = {
  'functions/permission-denied': 'A linked student account is required for your academic summary.',
  'functions/failed-precondition': 'Your student profile could not be resolved. Contact your college administrator.',
}

export function describeAcademicContextError(
  error: unknown,
  fallback = 'The academic context could not be loaded.',
  surface: 'student' | 'faculty' | 'paper' = 'faculty'
): string {
  const code = String((error as { code?: string } | null)?.code || '').toLowerCase()
  if (surface === 'student' && STUDENT_ERROR_OVERRIDES[code]) return STUDENT_ERROR_OVERRIDES[code]
  if (ACADEMIC_ERROR_MESSAGES[code]) return ACADEMIC_ERROR_MESSAGES[code]
  if (error instanceof Error && error.message) return error.message
  return fallback
}

// ─── Deterministic client-side view helpers ────────────────────────────
// These only reshape what the backend already decided — they never invent
// academic facts.

/** Assessments the backend returned, sorted soonest-first. */
export function sortTestsByStart(tests: AcademicContextTest[]): AcademicContextTest[] {
  const ms = (value: string | undefined): number => {
    const parsed = Date.parse(value || '')
    return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
  }
  return [...tests].sort((a, b) => ms(a.startDateTime) - ms(b.startDateTime))
}

/**
 * Faculty "pending" view: the callable returns the college/course assignment
 * history as stored. An assignment counts as pending when it is not closed,
 * graded or cancelled — a purely deterministic rule over stored fields.
 */
export function isFacultyAssignmentPending(assignment: AcademicContextFacultyAssignment): boolean {
  const status = String(assignment.status || '').toLowerCase()
  return !['closed', 'graded', 'cancelled'].includes(status)
}

/**
 * Faculty "upcoming" view: scheduled for today or later (per the context's
 * own generatedFor date), or published/ongoing without a stored date.
 */
export function isFacultyAssessmentUpcoming(
  assessment: AcademicContextFacultyAssessment,
  todayKey: string
): boolean {
  const status = String(assessment.status || '').toLowerCase()
  if (['cancelled', 'completed'].includes(status)) return false
  const datePart = isoDatePart(assessment.scheduledAt)
  if (!datePart) return !status || ['published', 'scheduled', 'ongoing'].includes(status)
  return datePart >= todayKey
}
