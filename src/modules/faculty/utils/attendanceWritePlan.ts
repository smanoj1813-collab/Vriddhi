import { sameFirestoreValue } from '@/shared/utils/firestoreEquality'

/** Compare only fields owned by this writer. Preserve unrelated metadata and
 * audit timestamps on a no-op, but never suppress notes/cohort/name changes. */
export function sameAttendancePayload(previous: Record<string, unknown> | undefined, next: Record<string, unknown>): boolean {
  if (!previous) return false
  const keys = Object.keys(next).filter(key => key !== 'markedAt' && key !== 'updatedAt')
  return sameFirestoreValue(
    Object.fromEntries(keys.map(key => [key, previous[key]])),
    Object.fromEntries(keys.map(key => [key, next[key]])),
  )
}
