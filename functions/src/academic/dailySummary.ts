import type { StudentAcademicContext, ContextClass, ContextAssignment, ContextTest } from './context'

/** Phase 2 materialized-summary contract. One document can serve the dashboard. */
export interface StudentDailySummary {
  kind: 'student-daily-summary'
  studentId: string
  collegeId: string
  date: string
  classes: ContextClass[]
  pendingAssignments: ContextAssignment[]
  overdueAssignments: ContextAssignment[]
  upcomingTests: ContextTest[]
  attendanceAlert: { status: 'ok' | 'warning'; percentage: number | null; threshold: number }
  generatedAt: string
  sourceVersion: number
}

function dateOnly(value: unknown): string {
  const raw = String(value || '')
  return raw.length >= 10 ? raw.slice(0, 10) : raw
}

function dateValue(value: unknown): number {
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

/**
 * Builds the daily summary from a previously scoped Phase 1 context. It does
 * not read Firestore, call AI or mutate the source context. Submitted work is
 * already excluded by the context builder; overdue is calculated against the
 * server-supplied date, never the browser clock.
 */
export function buildStudentDailySummary(
  context: StudentAcademicContext,
  options: { date: string; attendanceThreshold?: number; generatedAt?: string }
): StudentDailySummary {
  const threshold = Math.max(0, Math.min(100, Number(options.attendanceThreshold ?? 75)))
  const pendingAssignments = [...context.pendingAssignments]
    .sort((a, b) => dateValue(a.dueDate) - dateValue(b.dueDate) || a.id.localeCompare(b.id))
  const overdueAssignments = pendingAssignments.filter((assignment) =>
    Boolean(assignment.dueDate) && dateOnly(assignment.dueDate) < options.date
  )
  const upcomingTests = [...context.upcomingTests]
    .filter((test) => dateValue(test.startDateTime) >= dateValue(`${options.date}T00:00:00Z`))
    .sort((a, b) => dateValue(a.startDateTime) - dateValue(b.startDateTime) || a.id.localeCompare(b.id))
  const percentage = context.attendance.percentage
  return {
    kind: 'student-daily-summary',
    studentId: context.student.id,
    collegeId: context.collegeId,
    date: options.date,
    classes: [...context.classes],
    pendingAssignments,
    overdueAssignments,
    upcomingTests,
    attendanceAlert: {
      status: percentage !== null && percentage < threshold ? 'warning' : 'ok',
      percentage,
      threshold,
    },
    generatedAt: options.generatedAt || new Date().toISOString(),
    sourceVersion: 1,
  }
}
