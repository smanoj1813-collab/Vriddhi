/**
 * Phase 1 deterministic academic context contracts and builders.
 *
 * This module is deliberately pure: callers provide already-scoped documents,
 * and the builders perform no Firestore reads and no AI calls. A future
 * feature-flagged callable can assemble the input using college/student scope
 * and then call these builders. Keeping the join logic pure makes it cheap to
 * test and prevents routine academic answers from becoming agent prompts.
 */

import { sessionMatchesCohort } from '../studentCurriculum'

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
  endDateTime?: string
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
  curriculumId?: string
  status?: string
  branch?: string
  semester?: number
  courseCode: string
  courseName: string
  modules: ContextModule[]
}

export interface FacultyCurriculumPlan {
  id: string
  collegeId?: string
  status?: string
  branch?: string
  semester?: number
  courses?: unknown[]
}

export interface FacultyCurriculumMapping {
  curriculumId?: string
  facultyId?: string
  facultyEmail?: string
  courseId?: string
  courseCode?: string
  courseName?: string
  modulesCount?: number
  status?: string
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

function curriculumModule(value: unknown, index: number): ContextModule {
  const module = record(value)
  const rawTopics = Array.isArray(module.topics) ? module.topics : []
  return {
    id: String(module.id || `module-${index + 1}`),
    name: String(module.name || module.moduleName || module.title || `Module ${index + 1}`),
    order: Number(module.order || module.moduleNo) || index + 1,
    topics: rawTopics.map((topic, topicIndex) => {
      const item = record(topic)
      return {
        id: String(item.id || `topic-${topicIndex + 1}`),
        title: typeof topic === 'string'
          ? topic
          : String(item.title || item.name || `Topic ${topicIndex + 1}`),
        order: Number(item.order) || topicIndex + 1,
      }
    }),
  }
}

/**
 * Curriculum documents are plans containing a `courses[]` array, not course
 * documents themselves. Flattening that shape here prevents the faculty
 * planner from rendering the plan wrapper as "— — Course / 0 modules".
 *
 * When mappings are supplied, only courses explicitly assigned to the faculty
 * are returned. Legacy mappings may identify a course by id, code, or name;
 * all three are supported. A metadata-only fallback preserves the mapping's
 * real module count if its old curriculum document is no longer available.
 */
export function facultyCoursesFromCurriculum(
  plans: FacultyCurriculumPlan[],
  mappings?: FacultyCurriculumMapping[]
): FacultyCourse[] {
  const flattened = plans
    .filter((plan) => !plan.status || ['active', 'approved', 'published', 'assigned'].includes(String(plan.status).toLowerCase()))
    .flatMap((plan) => {
      const courses = Array.isArray(plan.courses) ? plan.courses : []
      return courses.map((value, index) => {
        const course = record(value)
        const modules = Array.isArray(course.modules) ? course.modules : []
        return {
          id: String(course.id || `${plan.id}-course-${index + 1}`),
          collegeId: plan.collegeId,
          curriculumId: plan.id,
          status: String(course.status || plan.status || ''),
          branch: String(course.branch || plan.branch || ''),
          semester: Number(course.semester || plan.semester) || undefined,
          courseCode: String(course.code || course.courseCode || ''),
          courseName: String(course.name || course.courseName || course.title || ''),
          modules: modules.map(curriculumModule),
        } satisfies FacultyCourse
      })
    })

  if (!mappings) return flattened

  const activeMappings = mappings.filter((mapping) => !mapping.status || String(mapping.status).toLowerCase() === 'active')
  const resolved: FacultyCourse[] = []
  const seen = new Set<string>()
  for (const mapping of activeMappings) {
    const curriculumId = String(mapping.curriculumId || '')
    const courseId = String(mapping.courseId || '')
    const courseCode = String(mapping.courseCode || '').trim().toLowerCase()
    const courseName = String(mapping.courseName || '').trim().toLowerCase()
    const match = flattened.find((course) =>
      (!curriculumId || course.curriculumId === curriculumId)
      && (
        (courseId && course.id === courseId)
        || (courseCode && course.courseCode.trim().toLowerCase() === courseCode)
        || (courseName && course.courseName.trim().toLowerCase() === courseName)
      )
    )
    const moduleCount = Math.max(0, Math.min(100, Number(mapping.modulesCount) || 0))
    const course = match || {
      id: courseId || `${curriculumId || 'curriculum'}-${courseCode || courseName || resolved.length + 1}`,
      curriculumId: curriculumId || undefined,
      courseCode: String(mapping.courseCode || ''),
      courseName: String(mapping.courseName || ''),
      modules: Array.from({ length: moduleCount }, (_, index) => curriculumModule({}, index)),
    }
    const key = `${course.curriculumId || ''}|${course.id}|${course.courseCode.toLowerCase()}`
    if (!seen.has(key)) {
      seen.add(key)
      resolved.push(course)
    }
  }
  return resolved
}

export interface FacultySession {
  id: string
  date: string
  courseId?: string
  courseCode?: string
  /**
   * Sessions are written from a weekly schedule slot, which carries a subject
   * and a subject code but never a curriculum course id. Without these two
   * fields every session was unattributable, and an unattributable session was
   * dropped by the course filter — which is how a faculty member with classes
   * today saw "Upcoming sessions: 0".
   */
  subject?: string
  subjectCode?: string
  /** Who teaches it. The field the dashboard already filters on. */
  facultyId?: string
  startTime?: string
  endTime?: string
  room?: string
  topicIds?: string[]
  topicNames?: string[]
  status?: string
  attendanceMarked?: boolean
}

export interface FacultyAssignment {
  id: string
  courseId?: string
  courseCode?: string
  /** Stored by sanitizeAssignmentAuthoringInput. The panel used to ignore it. */
  courseName?: string
  subject?: string
  subjectCode?: string
  title: string
  dueDate?: string
  status?: string
}

export interface FacultyAssessment {
  id: string
  courseId?: string
  courseCode?: string
  /** scheduledTests stores `subject` (or the legacy `subjectName`). */
  subject?: string
  subjectName?: string
  courseName?: string
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
/**
 * Semester as a number, 0 meaning "not recorded".
 *
 * The twin of the rule studentCurriculum applies (`Number(x) || 0`). Kept
 * local because that module does not export it; the two must agree, and both
 * exist only to stop a number/string split from silently matching nothing.
 */
const semesterNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(parsed)) return 0
  const int = Math.trunc(parsed)
  return int > 0 ? int : 0
}
const sameCollege = (collegeId: string, value: { collegeId?: string }): boolean =>
  !value.collegeId || value.collegeId === collegeId
const sortByDate = <T extends { dueDate?: string; startDateTime?: string; date?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => dateMs(a.dueDate || a.startDateTime || a.date) - dateMs(b.dueDate || b.startDateTime || b.date))

/**
 * Does this session belong to the student's cohort?
 *
 * This used to be a hand-rolled strict comparison, and strict comparison is
 * wrong for this data in ways that are invisible until they bite:
 *
 *   schedule "2026-2027" vs student "2027"   → an academic-year range and its
 *                                              end year are the same class
 *   schedule batch 2026  vs student "2026"   → number vs string
 *   schedule "Section A" vs student "A"      → the prefix is noise
 *   schedule "A,B,C,D"   vs student "A"      → division is a letter SET
 *   schedule semester 3  vs student "3"      → number vs string
 *
 * Every one of those produced "No classes scheduled today" for a student whose
 * timetable showed three classes — because the timetable page uses the shared
 * canonical matcher and this did not. `sessionMatchesCohort` in
 * ../studentCurriculum is that matcher, already used by curriculum progress;
 * delegate to it so the two screens cannot disagree again.
 */
function isStudentClassFor(classItem: ContextClass, student: AcademicStudent): boolean {
  return sessionMatchesCohort(
    {
      branch: classItem.branch,
      batch: classItem.batch,
      semester: classItem.semester,
      division: classItem.division,
      section: classItem.section,
    },
    {
      branch: student.branch,
      batch: student.batch,
      semester: student.semester,
      division: student.division,
      section: student.section,
    }
  )
}

export function buildStudentAcademicContext(input: {
  student: AcademicStudent
  date: string
  classes: ContextClass[]
  assignments: ContextAssignment[]
  tests: ContextTest[]
  curriculum: ContextCurriculum[]
  attendance: ContextAttendance[]
  now?: string
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
  const nowMs = Date.parse(input.now || `${input.date}T23:59:59.999Z`)
  const upcomingTests = sortByDate(input.tests.filter((item) => {
    if (!sameCollege(student.collegeId, item)) return false
    if (['cancelled', 'completed'].includes(lower(item.status))) return false
    const endMs = Date.parse(item.endDateTime || '')
    return !Number.isFinite(endMs) || !Number.isFinite(nowMs) || endMs >= nowMs
  }).map((item) => ({ ...item, startDateTime: item.startDateTime })))
  const curriculum = input.curriculum
    .filter((item) => sameCollege(student.collegeId, item))
    .filter((item) => !item.status || ['approved', 'published', 'active'].includes(lower(item.status)))
    // Semester is compared NUMERICALLY, not strictly.
    //
    // `item.semester === student.semester` failed whenever one side was a
    // number and the other a string — the same number-vs-string split that
    // emptied the class list. A curriculum row whose semester was "3" and a
    // student whose semester was 3 dropped the student's own curriculum, and
    // the dashboard reported no subjects.
    //
    // semesterNumber is the server-side twin of the canonical rule in
    // studentCurriculum (`Number(x) || 0`): an unusable value reads as 0,
    // which means "not recorded" and imposes NO constraint — the same wildcard
    // the matcher applies, so a row missing a semester is never dropped.
    .filter((item) => {
      const itemSemester = semesterNumber(item.semester)
      const studentSemester = semesterNumber(student.semester)
      if (!itemSemester || !studentSemester) return true
      return itemSemester === studentSemester
    })
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
  /** Limit history to the supplied (assigned) courses even without a filter. */
  scopeToCourses?: boolean
}): FacultyAcademicContext {
  const availableCourses = input.courses.filter((course) => sameCollege(input.collegeId, course))
  const courses = input.courseId
    ? availableCourses.filter((course) => course.id === input.courseId)
    : availableCourses
  const shouldScope = Boolean(input.courseId || input.scopeToCourses)
  const courseIds = new Set(courses.map((course) => course.id).filter(Boolean))
  const courseCodes = new Set(courses.map((course) => lower(course.courseCode)).filter(Boolean))

  // A session links to its course through the scheduling fields it actually
  // stores — subject / subjectCode — not through a curriculum course id. Both
  // spellings are compared because the two writers disagree: the weekly-schedule
  // path stores "CS301", the ad-hoc path stores a human subject name.
  const matchesCourse = (item: { courseId?: string; courseCode?: string; subject?: string; subjectCode?: string }) => {
    if (!shouldScope) return true
    // An explicit curriculum link always wins.
    if (item.courseId && courseIds.has(item.courseId)) return true
    if (item.courseCode && courseCodes.has(lower(item.courseCode))) return true
    const key = lower(item.subjectCode || item.subject)
    if (!key) return false
    if (courseCodes.has(key)) return true
    // Give back the code-shaped prefix of a subject name ("Language-I" ->
    // "lang.3.1" style codes are compared whole, but a name stored as
    // "CS301 - Databases" must still match the code "CS301").
    const head = lower(String(item.subject || '').split(/[-–—]/)[0])
    return Boolean(head) && courseCodes.has(head)
  }

  // Hiding a class a teacher is about to walk into is a worse failure than
  // showing one extra, so an explicit courseId filter stays strict (the caller
  // asked for that course) while the implicit "my courses" scope only drops a
  // session when it can be attributed to a DIFFERENT course. Unattributable
  // sessions are kept.
  const belongsToAnotherCourse = (item: { courseId?: string; courseCode?: string; subject?: string; subjectCode?: string }) => {
    const explicit = item.courseId || item.courseCode
    if (!explicit) return false
    return !matchesCourse(item)
  }

  const upcomingSessions = input.sessions
    .filter((item) => (input.courseId ? matchesCourse(item) : !belongsToAnotherCourse(item)))
    .filter((item) => !input.today || item.date >= input.today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  return {
    kind: 'faculty', generatedFor: input.today || '', collegeId: input.collegeId, facultyId: input.facultyId,
    courses, completedTopics: [...new Set(input.completedTopics.map(text).filter(Boolean))].sort(),
    upcomingSessions,
    assignmentHistory: input.assignments.filter((item) => (input.courseId ? matchesCourse(item) : !belongsToAnotherCourse(item))),
    assessmentHistory: input.assessments.filter((item) => (input.courseId ? matchesCourse(item) : !belongsToAnotherCourse(item))),
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
