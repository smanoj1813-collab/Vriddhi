/**
 * Phase 1 deterministic academic context contracts and builders.
 *
 * This module is deliberately pure: callers provide already-scoped documents,
 * and the builders perform no Firestore reads and no AI calls. A future
 * feature-flagged callable can assemble the input using college/student scope
 * and then call these builders. Keeping the join logic pure makes it cheap to
 * test and prevents routine academic answers from becoming agent prompts.
 */

export interface AcademicStudent {
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

export interface ContextClass {
  id: string
  collegeId?: string
  date: string
  startTime?: string
  endTime?: string
  subject?: string
  subjectCode?: string
  facultyName?: string
  room?: string
  status?: string
  topics?: string[]
  branch?: string
  batch?: string
  semester?: number
  division?: string
  section?: string
}

export interface ContextAssignment {
  id: string
  collegeId?: string
  title: string
  courseName?: string
  courseCode?: string
  dueDate?: string
  status?: string
  submitted?: boolean
  submittedAt?: string
}

export interface ContextTest {
  id: string
  collegeId?: string
  title: string
  subject?: string
  startDateTime: string
  status?: string
}

export interface ContextTopic {
  id: string
  title: string
  unitId?: string
  unitName?: string
  order?: number
}

export interface ContextModule {
  id: string
  name: string
  order?: number
  topics?: ContextTopic[]
}

export interface ContextCurriculum {
  id: string
  collegeId?: string
  status?: string
  courseCode: string
  courseName: string
  semester?: number
  modules: ContextModule[]
}

export interface ContextAttendance {
  date: string
  status: 'present' | 'absent' | 'late' | 'excused' | string
  subjectCode?: string
}

export interface StudentAcademicContext {
  kind: 'student'
  generatedFor: string
  collegeId: string
  student: AcademicStudent
  classes: ContextClass[]
  pendingAssignments: ContextAssignment[]
  upcomingTests: ContextTest[]
  curriculum: ContextCurriculum[]
  attendance: { records: ContextAttendance[]; present: number; absent: number; percentage: number | null }
}

export interface FacultyCourse {
  id: string
  collegeId?: string
  courseCode: string
  courseName: string
  modules: ContextModule[]
}

export interface FacultySession {
  id: string
  date: string
  courseId?: string
  courseCode?: string
  topicIds?: string[]
  topicNames?: string[]
  status?: string
}

export interface FacultyAssignment {
  id: string
  courseId?: string
  courseCode?: string
  title: string
  dueDate?: string
  status?: string
}

export interface FacultyAssessment {
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
  courses: FacultyCourse[]
  completedTopics: string[]
  upcomingSessions: FacultySession[]
  assignmentHistory: FacultyAssignment[]
  assessmentHistory: FacultyAssessment[]
}

export interface PaperBlueprint {
  sections?: Array<{ name: string; count: number; marks?: number; difficulty?: string }>
  totalQuestions?: number
  totalMarks?: number
}

export interface PaperQuestionCandidate {
  id: string
  courseCode?: string
  moduleId?: string
  topicId?: string
  type?: string
  difficulty?: string
  bloomsLevel?: string
  usedAt?: string
  approved?: boolean
}

export interface PaperAcademicContext {
  kind: 'paper'
  generatedFor: string
  collegeId: string
  course: FacultyCourse | null
  candidates: PaperQuestionCandidate[]
  blueprint: PaperBlueprint | null
  recentlyUsedQuestionIds: string[]
  distributions: { difficulty: Record<string, number>; blooms: Record<string, number> }
}

const text = (value: unknown): string => String(value ?? '').trim()
const lower = (value: unknown): string => text(value).toLowerCase()
const dateMs = (value: unknown): number => {
  const parsed = Date.parse(text(value))
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}
const sameCollege = (collegeId: string, value: { collegeId?: string }): boolean =>
  !value.collegeId || value.collegeId === collegeId
const sortByDate = <T extends { dueDate?: string; startDateTime?: string; date?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => dateMs(a.dueDate || a.startDateTime || a.date) - dateMs(b.dueDate || b.startDateTime || b.date))

function isStudentClassFor(classItem: ContextClass, student: AcademicStudent): boolean {
  if (classItem.branch && classItem.branch !== student.branch) return false
  if (classItem.batch && classItem.batch !== student.batch) return false
  if (classItem.semester && classItem.semester !== student.semester) return false
  const division = lower(classItem.division || classItem.section)
  const studentDivision = lower(student.division || student.section)
  return !division || !studentDivision || division === studentDivision
}

export function buildStudentAcademicContext(input: {
  student: AcademicStudent
  date: string
  classes: ContextClass[]
  assignments: ContextAssignment[]
  tests: ContextTest[]
  curriculum: ContextCurriculum[]
  attendance: ContextAttendance[]
}): StudentAcademicContext {
  const { student } = input
  const classes = input.classes
    .filter((item) => sameCollege(student.collegeId, item) && isStudentClassFor(item, student))
    .filter((item) => item.date === input.date)
    .sort((a, b) => text(a.startTime).localeCompare(text(b.startTime)) || a.id.localeCompare(b.id))
  const pendingAssignments = sortByDate(input.assignments.filter((item) =>
    sameCollege(student.collegeId, item)
    && !item.submitted
    && !['submitted', 'graded', 'cancelled'].includes(lower(item.status))
  ))
  const upcomingTests = sortByDate(input.tests.filter((item) =>
    sameCollege(student.collegeId, item)
    && !['cancelled', 'completed'].includes(lower(item.status))
  ).map((item) => ({ ...item, startDateTime: item.startDateTime })))
  const curriculum = input.curriculum
    .filter((item) => sameCollege(student.collegeId, item))
    .filter((item) => !item.status || ['approved', 'published', 'active'].includes(lower(item.status)))
    .filter((item) => !item.semester || item.semester === student.semester)
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.id.localeCompare(b.id))
  const records = [...input.attendance].sort((a, b) => a.date.localeCompare(b.date))
  const present = records.filter((item) => ['present', 'late'].includes(lower(item.status))).length
  const absent = records.filter((item) => lower(item.status) === 'absent').length
  return {
    kind: 'student', generatedFor: input.date, collegeId: student.collegeId, student,
    classes, pendingAssignments, upcomingTests, curriculum,
    attendance: { records, present, absent, percentage: records.length ? Math.round((present / records.length) * 10000) / 100 : null },
  }
}

export function buildFacultyAcademicContext(input: {
  facultyId: string
  collegeId: string
  courseId?: string
  courses: FacultyCourse[]
  sessions: FacultySession[]
  assignments: FacultyAssignment[]
  assessments: FacultyAssessment[]
  completedTopics: string[]
  today?: string
}): FacultyAcademicContext {
  const courseIds = input.courseId ? new Set([input.courseId]) : null
  const courses = input.courses.filter((course) => sameCollege(input.collegeId, course) && (!courseIds || courseIds.has(course.id)))
  const matchesCourse = (item: { courseId?: string; courseCode?: string }) =>
    !courseIds || Boolean(item.courseId && courseIds.has(item.courseId))
  const upcomingSessions = input.sessions
    .filter(matchesCourse)
    .filter((item) => !input.today || item.date >= input.today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  return {
    kind: 'faculty', generatedFor: input.today || '', collegeId: input.collegeId, facultyId: input.facultyId,
    courses, completedTopics: [...new Set(input.completedTopics.map(text).filter(Boolean))].sort(),
    upcomingSessions, assignmentHistory: input.assignments.filter(matchesCourse), assessmentHistory: input.assessments.filter(matchesCourse),
  }
}

export function buildPaperAcademicContext(input: {
  generatedFor: string
  collegeId: string
  course: FacultyCourse | null
  candidates: PaperQuestionCandidate[]
  blueprint: PaperBlueprint | null
}): PaperAcademicContext {
  const candidates = input.candidates.filter((candidate) =>
    sameCollege(input.collegeId, candidate as PaperQuestionCandidate & { collegeId?: string })
    && candidate.approved !== false
  )
  const recentlyUsedQuestionIds = candidates
    .filter((candidate) => candidate.usedAt)
    .sort((a, b) => dateMs(b.usedAt) - dateMs(a.usedAt))
    .map((candidate) => candidate.id)
  const count = (key: 'difficulty' | 'blooms') => candidates.reduce<Record<string, number>>((result, candidate) => {
    const raw = key === 'difficulty' ? candidate.difficulty : candidate.bloomsLevel
    const value = text(raw) || 'unknown'
    result[value] = (result[value] || 0) + 1
    return result
  }, {})
  return { kind: 'paper', generatedFor: input.generatedFor, collegeId: input.collegeId, course: input.course, candidates, blueprint: input.blueprint, recentlyUsedQuestionIds, distributions: { difficulty: count('difficulty'), blooms: count('blooms') } }
}
