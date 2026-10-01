// src/shared/utils/accessWindow.ts
// ─── Platform-access windows (a product's duration applied to a start date) ──
//
// WHY THIS EXISTS
// A student's platform access is sold as a product — "1 year", "2 years",
// "3 years" — with a price. Onboarding stamps the student with the product and
// the window it buys:
//
//     accessProductId / accessProductName / accessDurationMonths / accessPrice
//     accessStart (yyyy-mm-dd) ──► accessEnd (yyyy-mm-dd, inclusive last day)
//
// The END date is what everything downstream reads: the student list shows
// "Active / Expiring / Expired", and the MIS page counts and values each bucket.
// Deriving it in two places (the browser preview and the import callable) with
// two different month-arithmetic rules is exactly how a subscription ends up a
// day or a month off, so this is the browser copy of the shared rule.
//
// KEEP IN SYNC with functions/src/accessProducts.ts — functions/ cannot import
// from src/ (rootDir: src), so the rule exists twice on purpose.
// functions/test/accessProducts.test.ts imports BOTH copies and fails if they
// ever disagree.
//
// Pure: no Firestore, no ambient clock (the caller passes "today").

export type AccessStatus = 'active' | 'expiring' | 'expired'

/** Days before the end date at which access is reported as "expiring". */
export const ACCESS_EXPIRING_SOON_DAYS = 60

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/

/** True for a real yyyy-mm-dd calendar date (rejects 2026-02-30). */
export function isDateKey(value: unknown): value is string {
  const match = DATE_KEY.exec(String(value ?? '').trim())
  if (!match) return false
  const [, y, m, d] = match
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  )
}

function toUtcDate(key: string): Date {
  const [, y, m, d] = DATE_KEY.exec(key)!
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)))
}

function toKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * The same day `months` calendar months later, clamped to the last day of the
 * target month: 2026-01-31 + 1 month → 2026-02-28, not 2026-03-03.
 */
export function addMonthsToDateKey(dateKey: string, months: number): string | null {
  if (!isDateKey(dateKey)) return null
  if (!Number.isFinite(months)) return null
  const wholeMonths = Math.trunc(months)
  const start = toUtcDate(dateKey)
  const day = start.getUTCDate()
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + wholeMonths, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(day, lastDay))
  return toKey(target)
}

/** Add (or subtract) whole days to a date key. */
export function addDaysToDateKey(dateKey: string, days: number): string | null {
  if (!isDateKey(dateKey)) return null
  const date = toUtcDate(dateKey)
  date.setUTCDate(date.getUTCDate() + Math.trunc(days))
  return toKey(date)
}

export interface AccessWindow {
  /** First day of access (yyyy-mm-dd). */
  start: string
  /** LAST day of access, inclusive (yyyy-mm-dd). */
  end: string
  durationMonths: number
}

/**
 * The window a product of `durationMonths` buys from `startDate`.
 *
 * A 12-month product starting 2026-10-01 ends 2027-09-30 — the end date is the
 * last day covered, so "access until 30 Sep 2027" means the whole of it.
 * Returns null when the start date or the duration is unusable.
 */
export function computeAccessWindow(
  startDate: unknown,
  durationMonths: unknown,
): AccessWindow | null {
  const start = String(startDate ?? '').trim()
  if (!isDateKey(start)) return null
  const months = Number(durationMonths)
  if (!Number.isFinite(months) || months <= 0) return null
  const wholeMonths = Math.max(1, Math.trunc(months))
  const exclusiveEnd = addMonthsToDateKey(start, wholeMonths)
  if (!exclusiveEnd) return null
  const end = addDaysToDateKey(exclusiveEnd, -1)
  if (!end) return null
  return { start, end, durationMonths: wholeMonths }
}

/** Whole days from `today` to the inclusive end date (negative once past). */
export function accessDaysLeft(endDate: unknown, today: unknown): number | null {
  const end = String(endDate ?? '').trim()
  const now = String(today ?? '').trim()
  if (!isDateKey(end) || !isDateKey(now)) return null
  const diff = toUtcDate(end).getTime() - toUtcDate(now).getTime()
  return Math.round(diff / 86_400_000)
}

/**
 * active   — more than `warnDays` left
 * expiring — ends today or within `warnDays`
 * expired  — the end date is in the past
 * Unknown/missing dates count as expired: access with no end date cannot be
 * proved valid, and the MIS should surface it rather than hide it.
 */
export function accessStatus(
  endDate: unknown,
  today: unknown,
  warnDays: number = ACCESS_EXPIRING_SOON_DAYS,
): AccessStatus {
  const left = accessDaysLeft(endDate, today)
  if (left === null) return 'expired'
  if (left < 0) return 'expired'
  if (left <= Math.max(0, Math.trunc(warnDays))) return 'expiring'
  return 'active'
}

/** Human label for a duration in months: 12 → "1 year", 18 → "1 yr 6 mo". */
export function formatDurationMonths(months: unknown): string {
  const total = Math.trunc(Number(months))
  if (!Number.isFinite(total) || total <= 0) return '—'
  const years = Math.floor(total / 12)
  const rest = total % 12
  if (years === 0) return `${rest} month${rest === 1 ? '' : 's'}`
  const yearText = `${years} year${years === 1 ? '' : 's'}`
  return rest === 0 ? yearText : `${yearText} ${rest} month${rest === 1 ? '' : 's'}`
}
