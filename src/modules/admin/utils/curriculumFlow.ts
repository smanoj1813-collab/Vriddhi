// src/modules/admin/utils/curriculumFlow.ts
// ─── The curriculum → schedule → reschedule flow, as pure functions ──────────
//
// The admin surface this feeds is one screen: pick a branch and a batch, walk
// semester 1 → 6, and for every subject see the same three facts — who teaches
// it, when it is on the timetable, and what happens if the class has to move.
//
// Keeping the maths here (rather than inside the page) is what makes it
// testable without Firestore and reusable by the reschedule dialog, which has
// to show the same outcome the server will produce before the admin commits.
//
// The join key is deliberately the one the rest of the codebase already uses
// (docs/curriculum-scheduling-audit.md, finding F6): the timetable carries no
// courseId, so subject code + branch + semester is the closest thing to a link
// back to a curriculum course. Batch is a filter on top, never part of the key,
// because one course can be taught to several batches.

import type { CurriculumDoc, CurriculumFacultyMapping, ParsedCourse } from '@/shared/types/curriculum'
import type { DayOfWeek, WeeklyClassSchedule } from '../types/schedule'

/** The programme years the flow walks. Semesters outside this list are still
 *  shown above it, so an unexpected value can never hide a course. */
export const FLOW_SEMESTERS = [1, 2, 3, 4, 5, 6] as const

export const DAY_ORDER: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

/**
 * Identity of a scheduled class across the curriculum and timetable
 * collections. Mirrors `scheduledClassKey` in AdminCurriculum, minus batch —
 * a course card is not tied to one batch, so it should report every slot for
 * that subject and let callers that do know the batch filter the group.
 */
export function scheduledClassKey(
  subjectCode: string | null | undefined,
  branch: string | null | undefined,
  semester: number | null | undefined,
): string {
  return [
    (subjectCode ?? '').trim().toUpperCase(),
    (branch ?? '').trim().toUpperCase(),
    semester ?? '',
  ].join('|')
}

/** Timetable rows that belong to one course, batch-filtered when asked. */
export function courseSlots(params: {
  course: ParsedCourse
  curriculum?: CurriculumDoc | null
  branch?: string | null
  semester?: number | null
  slots: WeeklyClassSchedule[]
  batch?: string | null
}): WeeklyClassSchedule[] {
  const { course, curriculum, slots } = params
  const branch = params.branch || course.branch || curriculum?.branch || ''
  const semester = params.semester ?? course.semester ?? curriculum?.semester ?? null
  const key = scheduledClassKey(course.code, branch, semester)
  return slots.filter((slot) => {
    if (slot.isActive === false) return false
    if (scheduledClassKey(slot.subjectCode, slot.branch, slot.semester) !== key) return false
    // A batch filter narrows the group; an empty batch on the mapping means
    // "not batch-specific", so every slot for the subject counts.
    if (params.batch && slot.batch && slot.batch !== params.batch) return false
    return true
  })
}

export interface CourseFlowRow {
  course: ParsedCourse
  /** The curriculum document the course came from. */
  curriculum: CurriculumDoc
  /** Active faculty assignment for the cohort, if one exists. */
  mapping: CurriculumFacultyMapping | null
  /** Active timetable slots for this subject (batch-filtered). */
  slots: WeeklyClassSchedule[]
  status: 'ready' | 'unscheduled' | 'unassigned'
}

export interface SemesterFlowRow {
  semester: number
  courses: CourseFlowRow[]
  courseCount: number
  assignedCount: number
  scheduledCount: number
  unassignedCount: number
  unscheduledCount: number
  /** Total weekly classes for the semester's subjects. */
  weeklyClasses: number
  status: 'empty' | 'ready' | 'partial' | 'unassigned'
}

/**
 * Build the semester ladder for one branch (and optional batch).
 *
 * Read from the courses, not from the curriculum headers: a parsed curriculum
 * can hold courses from several semesters under one header semester, and those
 * are exactly the courses that used to disappear from the filter
 * (useCurriculumMapping.semesters documents the same trap).
 */
export function buildSemesterFlow(params: {
  curricula: CurriculumDoc[]
  mappings: CurriculumFacultyMapping[]
  slots: WeeklyClassSchedule[]
  branch?: string | null
  batch?: string | null
  semesters?: number[]
}): SemesterFlowRow[] {
  const { curricula, mappings, slots } = params
  const branch = params.branch && params.branch !== 'all' ? params.branch : null
  const batch = params.batch && params.batch !== 'all' ? params.batch : null

  const activeMappings = mappings.filter((mapping) => (mapping.status || 'active') === 'active')
  const bySemester = new Map<number, Map<string, CourseFlowRow>>()

  const sameBranch = (value: string | null | undefined): boolean =>
    !branch || (value || '').trim().toUpperCase() === branch.trim().toUpperCase()

  for (const curriculum of curricula) {
    for (const course of curriculum.courses || []) {
      const semester = typeof course.semester === 'number' ? course.semester : curriculum.semester
      if (typeof semester !== 'number') continue

      const courseBranch = course.branch || curriculum.branch || ''
      // The course's own branch wins, and the curriculum header is the
      // fallback: a parsed document can carry a stray elective whose branch
      // differs from the header it was filed under.
      if (!sameBranch(courseBranch) && !sameBranch(curriculum.branch)) continue
      const mapping =
        activeMappings.find(
          (row) =>
            row.courseId === course.id &&
            (!batch || !row.batch || row.batch === batch) &&
            (!row.branch || row.branch.trim().toUpperCase() === courseBranch.trim().toUpperCase()),
        ) || null

      const slotsForCourse = courseSlots({
        course,
        curriculum,
        branch: courseBranch,
        semester,
        slots,
        batch: mapping?.batch || batch,
      })

      const row: CourseFlowRow = {
        course,
        curriculum,
        mapping,
        slots: slotsForCourse,
        status: !mapping ? 'unassigned' : slotsForCourse.length > 0 ? 'ready' : 'unscheduled',
      }

      const bucket = bySemester.get(semester) || new Map<string, CourseFlowRow>()
      // Course ids are unique per curriculum; two curricula for the same
      // branch+semester must not list the same course twice.
      if (!bucket.has(course.id)) bucket.set(course.id, row)
      bySemester.set(semester, bucket)
    }
  }

  const semesters = params.semesters?.length
    ? params.semesters
    : [...new Set([...FLOW_SEMESTERS, ...bySemester.keys()])].sort((a, b) => a - b)

  return semesters.map((semester) => {
    const courses = [...(bySemester.get(semester)?.values() || [])].sort((a, b) =>
      String(a.course.name || '').localeCompare(String(b.course.name || '')),
    )
    const assignedCount = courses.filter((row) => row.mapping).length
    const scheduledCount = courses.filter((row) => row.slots.length > 0).length
    const unassignedCount = courses.length - assignedCount
    const unscheduledCount = courses.length - scheduledCount
    const weeklyClasses = courses.reduce((sum, row) => sum + row.slots.length, 0)

    const status: SemesterFlowRow['status'] =
      courses.length === 0
        ? 'empty'
        : unassignedCount === courses.length && courses.length > 0
          ? 'unassigned'
          : unassignedCount > 0 || unscheduledCount > 0
            ? 'partial'
            : 'ready'

    return {
      semester,
      courses,
      courseCount: courses.length,
      assignedCount,
      scheduledCount,
      unassignedCount,
      unscheduledCount,
      weeklyClasses,
      status,
    }
  })
}

/** "Mon 09:00–10:00 · Room 12" — the one-line slot summary used everywhere. */
export function formatSlot(slot: Pick<WeeklyClassSchedule, 'dayOfWeek' | 'startTime' | 'endTime' | 'room'>): string {
  const day = DAY_LABELS[slot.dayOfWeek] || String(slot.dayOfWeek || '')
  const time = [slot.startTime, slot.endTime].filter(Boolean).join('–')
  const room = (slot.room || '').trim()
  return [day, time].filter(Boolean).join(' ') + (room ? ` · ${room}` : '')
}

/** Monday-first ordering, then by start time. */
export function sortSlots<T extends Pick<WeeklyClassSchedule, 'dayOfWeek' | 'startTime'>>(slots: T[]): T[] {
  return [...slots].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
    if (dayDiff !== 0) return dayDiff
    return String(a.startTime || '').localeCompare(String(b.startTime || ''))
  })
}

// ─── Date maths for the reschedule preview ─────────────────────────────────
//
// These mirror `nextDateForDay` / `planReschedule` in
// functions/src/classSchedule.ts on purpose: the dialog has to show the
// admin where each class will land *before* they commit, and the server must
// then do exactly that. The server is authoritative — this is only ever used
// to render the preview.

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toDateKey(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function weekdayOf(key: string): DayOfWeek {
  return DAY_ORDER[(parseDateKey(key).getUTCDay() + 6) % 7]
}

/** The next occurrence of `day` strictly after `afterDate` (never the past). */
export function nextDateForDay(afterDate: string, day: DayOfWeek | string): string | null {
  const target = DAY_ORDER.find((value) => value === String(day).toLowerCase())
  if (!target) return null
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = addDays(afterDate, offset)
    if (weekdayOf(candidate) === target) return candidate
  }
  return null
}

export interface SlotMovePreviewRow {
  /** The class's current date. */
  date: string
  /** Where it lands — same as `date` when it needs no date change. */
  newDate: string
  /** What the move will do to this class. */
  action: 'move' | 'keep' | 'merge'
}

/**
 * Preview what moving a slot to `newDay` does to its upcoming classes.
 *
 * Same three outcomes the server produces: classes already on the new day stay
 * put, classes with a free destination move 1–7 days ahead, and classes whose
 * destination is already taken by another class of the same slot are merged
 * (the source retires, the existing class stays).
 */
export function previewSlotMove(params: {
  sessions: { id: string; date: string; status?: string }[]
  newDay: DayOfWeek | string
  from: string
}): SlotMovePreviewRow[] {
  const { sessions, newDay, from } = params
  const upcoming = sessions
    .filter((session) => (session.status || 'scheduled') === 'scheduled' && session.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date))

  const claimed = new Set<string>()
  const occupied = new Set(sessions.map((session) => session.date))
  const rows: SlotMovePreviewRow[] = []

  for (const session of upcoming) {
    if (weekdayOf(session.date) === String(newDay).toLowerCase()) {
      rows.push({ date: session.date, newDate: session.date, action: 'keep' })
      continue
    }
    const newDate = nextDateForDay(session.date, newDay)
    if (!newDate) {
      rows.push({ date: session.date, newDate: session.date, action: 'keep' })
      continue
    }
    // `occupied` deliberately includes every session of the slot, including
    // ones that will themselves move — the server classifies a destination it
    // can already see the same way.
    if ((occupied.has(newDate) && newDate !== session.date) || claimed.has(newDate)) {
      rows.push({ date: session.date, newDate, action: 'merge' })
      continue
    }
    claimed.add(newDate)
    rows.push({ date: session.date, newDate, action: 'move' })
  }

  return rows
}

/** "Mon, 05 Oct" — compact, unambiguous in a dialog. */
export function formatDateLabel(key: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key
  const date = parseDateKey(key)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${DAY_LABELS[weekdayOf(key)]}, ${String(date.getUTCDate()).padStart(2, '0')} ${months[date.getUTCMonth()]}`
}

// ─── Ladder read-outs ──────────────────────────────────────────────────────

/** One-line status for a semester tile, in words an admin can act on. */
export function semesterStatusLabel(row: SemesterFlowRow): string {
  if (row.status === 'empty') return 'No curriculum'
  const parts: string[] = [`${row.courseCount} subject${row.courseCount === 1 ? '' : 's'}`]
  if (row.unassignedCount > 0) parts.push(`${row.unassignedCount} unassigned`)
  if (row.unscheduledCount > 0) parts.push(`${row.unscheduledCount} not scheduled`)
  if (row.unassignedCount === 0 && row.unscheduledCount === 0) parts.push('ready')
  return parts.join(' · ')
}

export function semesterStatusColor(row: SemesterFlowRow): 'success' | 'warning' | 'error' | 'default' {
  if (row.status === 'empty') return 'default'
  if (row.status === 'ready') return 'success'
  if (row.status === 'unassigned') return 'error'
  return 'warning'
}

/**
 * The flow's own progress metric: of every subject in the branch's first six
 * semesters, how many are assigned to a teacher and on the timetable.
 */
export function flowProgress(rows: SemesterFlowRow[]): {
  courses: number
  assigned: number
  scheduled: number
  unassigned: number
  unscheduled: number
  pct: number
} {
  const courses = rows.reduce((sum, row) => sum + row.courseCount, 0)
  const assigned = rows.reduce((sum, row) => sum + row.assignedCount, 0)
  const scheduled = rows.reduce((sum, row) => sum + row.scheduledCount, 0)
  return {
    courses,
    assigned,
    scheduled,
    unassigned: courses - assigned,
    unscheduled: courses - scheduled,
    pct: courses === 0 ? 0 : Math.round((scheduled / courses) * 100),
  }
}
