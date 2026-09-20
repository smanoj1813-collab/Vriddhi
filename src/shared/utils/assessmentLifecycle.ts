export interface ScheduledAssessmentWindow {
  status?: string
  startDateTime?: Date | string
  scheduledAt?: Date | string
  endDateTime?: Date | string
}

export interface StudentAssessmentWindow extends ScheduledAssessmentWindow {
  canStart?: boolean
  canResume?: boolean
}

function epoch(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? time : null
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const time = new Date(value).getTime()
    return Number.isFinite(time) ? time : null
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate()
    const time = date.getTime()
    return Number.isFinite(time) ? time : null
  }
  return null
}

/** Immediate staff-facing lifecycle, independent of the persisted cleanup job. */
export function effectiveScheduledAssessmentStatus(
  assessment: ScheduledAssessmentWindow,
  nowMs = Date.now()
): string {
  const stored = String(assessment.status || '')
  if (stored === 'cancelled' || stored === 'completed') return stored
  const startMs = epoch(assessment.startDateTime ?? assessment.scheduledAt)
  const endMs = epoch(assessment.endDateTime)
  if (endMs !== null && nowMs > endMs && (stored === 'published' || stored === 'ongoing')) {
    return 'completed'
  }
  if (startMs !== null && nowMs >= startMs && (stored === 'published' || stored === 'ongoing')) {
    return 'ongoing'
  }
  return stored
}

/**
 * Dashboard cards are actionable only inside their real window. This timestamp
 * guard intentionally wins over stale `available`, `ongoing`, or `canStart`
 * fields returned by an older backend deployment.
 */
export function isStudentAssessmentActionable(
  assessment: StudentAssessmentWindow,
  nowMs = Date.now()
): boolean {
  const endMs = epoch(assessment.endDateTime)
  if (endMs !== null && nowMs > endMs) return false
  return assessment.canStart === true
    || assessment.canResume === true
    || assessment.status === 'available'
    || assessment.status === 'ongoing'
}

/** Defensively correct a whole student card when talking to an older backend. */
export function withEffectiveStudentAssessmentLifecycle<
  T extends StudentAssessmentWindow
>(assessment: T, nowMs = Date.now()): T {
  const endMs = epoch(assessment.endDateTime)
  if (
    endMs === null
    || nowMs <= endMs
    || ['completed', 'graded', 'missed', 'cancelled'].includes(String(assessment.status || ''))
  ) return assessment
  return {
    ...assessment,
    status: assessment.canResume ? 'completed' : 'missed',
    canStart: false,
    canResume: false,
  }
}
