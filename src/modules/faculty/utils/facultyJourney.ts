import { isValidDateKey } from '@/shared/utils/sessionDate'

export function normalizeMentorReference(value: unknown): string {
  return String(value ?? '').trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ')
}

/** Legacy rosters use names/emails; newer ones use the profile id or Auth uid. */
export function isFacultyMentee(row: Record<string, unknown>, aliases: readonly string[]): boolean {
  const known = new Set(aliases.map(normalizeMentorReference).filter(Boolean))
  return [row.mentorId, row.mentorFacultyId, row.mentor, row.mentorName]
    .some(value => !!normalizeMentorReference(value) && known.has(normalizeMentorReference(value)))
}

/** Each mentee contributes once, using their mean of valid graded results. */
export function summarizeMenteePerformance(
  studentIds: readonly string[],
  scores: ReadonlyArray<{ studentId: string; percentage: number }>,
) {
  const assigned = new Set(studentIds)
  const byStudent = new Map<string, { sum: number; count: number }>()
  for (const score of scores) {
    if (!assigned.has(score.studentId) || !Number.isFinite(score.percentage) || score.percentage < 0 || score.percentage > 100) continue
    const previous = byStudent.get(score.studentId) || { sum: 0, count: 0 }
    byStudent.set(score.studentId, { sum: previous.sum + score.percentage, count: previous.count + 1 })
  }
  const means = [...byStudent.values()].map(row => row.sum / row.count)
  const good = means.filter(score => score >= 80).length
  const average = means.filter(score => score >= 60 && score < 80).length
  const weak = means.filter(score => score < 60).length
  return {
    avgStudentScore: means.length ? Math.round(means.reduce((sum, score) => sum + score, 0) / means.length * 10) / 10 : null,
    studentPerformanceDistribution: { good, average, weak },
    goodStudentsCount: good,
    weakStudentsCount: weak,
    scoredStudentsCount: means.length,
    ungradedStudentsCount: assigned.size - means.length,
  }
}

/** Missing, invalid and future joining dates are unknown, not zero years. */
export function yearsOfService(joiningDate?: string, today = new Date()): number | null {
  if (!isValidDateKey(joiningDate)) return null
  const [year, month, day] = joiningDate.split('-').map(Number)
  let years = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) years--
  return years >= 0 ? years : null
}
