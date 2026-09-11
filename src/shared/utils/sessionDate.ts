// src/shared/utils/sessionDate.ts
// ─── Slice 2 S2.2 — one way to read a class-session date ───────────────────
//
// Mirrors `normalizeSessionDate` in functions/src/classSchedule.ts. The two
// copies are deliberate: functions/tsconfig compiles only functions/src
// (`rootDir: src`), so the callable cannot import from the SPA and the SPA
// cannot import from the callable. Both sides are unit-tested against the same
// contract — functions/test/classSchedule.test.ts and
// src/shared/utils/sessionDate.test.ts — so they cannot quietly drift.
//
// Why this exists: `classSessions.date` has been written in three shapes.
// scheduleApi writes a `yyyy-mm-dd` string, some bulk imports wrote a full ISO
// datetime, and attendanceApi's session writer wrote a Firestore Timestamp.
// Everything downstream (sorting, the `date >= from` string comparisons in the
// materialisation and cancel calls, the faculty day picker) assumes the string
// form, so reading normalises once here.

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function toDateKey(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * `yyyy-mm-dd` for anything a session might call a date, or '' when there is
 * nothing usable. Empty rather than a guess: a wrong date silently moves a
 * class to the wrong day, which is worse than a visibly missing one.
 */
export function normalizeSessionDate(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    // Covers both the canonical `yyyy-mm-dd` and a full ISO datetime.
    const head = trimmed.slice(0, 10)
    return isValidDateKey(head) ? head : ''
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateKey(value)
  if (typeof value === 'object') {
    const candidate = value as { toDate?: () => Date; seconds?: number; _seconds?: number }
    if (typeof candidate.toDate === 'function') {
      const date = candidate.toDate()
      return date instanceof Date && !Number.isNaN(date.getTime()) ? toDateKey(date) : ''
    }
    const seconds = Number(candidate.seconds ?? candidate._seconds)
    if (Number.isFinite(seconds) && seconds > 0) return toDateKey(new Date(seconds * 1000))
  }
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return toDateKey(new Date(numeric))
  return ''
}

/**
 * The id a session generated from a recurring slot has, and the id
 * `ensureClassSession` will give it if it does not exist yet.
 *
 * Shared with the server (functions/src/classSchedule.ts `slotDateKey`) so the
 * client can recognise — and link to — a materialised session without a round
 * trip.
 */
export function slotDateKey(weeklyScheduleId: string, date: string): string {
  const slot = String(weeklyScheduleId || '').trim()
  if (!slot) throw new Error('weeklyScheduleId is required to build a session id')
  if (slot.includes('/')) throw new Error('weeklyScheduleId may not contain "/"')
  if (!isValidDateKey(date)) throw new Error(`date must be yyyy-mm-dd (received: ${date})`)
  return `${slot}_${date}`
}

/**
 * Split a materialised session id back into its slot and date, or null when
 * the id is an ad-hoc one. Used to keep reading attendance that was marked
 * before S2.2 changed which id a recurring session is keyed on.
 */
export function parseSlotDateKey(
  sessionId: string
): { weeklyScheduleId: string; date: string } | null {
  const match = /^(.+)_(\d{4}-\d{2}-\d{2})$/.exec(String(sessionId || ''))
  if (!match || !isValidDateKey(match[2])) return null
  return { weeklyScheduleId: match[1], date: match[2] }
}
