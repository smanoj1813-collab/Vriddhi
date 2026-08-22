// ============================================================
// VRIDDHI - Attendance batch years
// ============================================================
// Attendance batches are admission years. Per product requirement,
// only batches from 2026 and above are active — 2025 and older
// are no longer offered in selectors or used for new records.
// ============================================================

export const ATTENDANCE_MIN_BATCH_YEAR = 2026;

/** Number of future years to offer beyond the current year. */
const FUTURE_YEARS = 3;

/**
 * Allowed attendance batches, e.g. ['2026', '2027', '2028', '2029'] in 2026.
 * Grows automatically as years pass.
 */
export function getAttendanceBatches(): string[] {
  const currentYear = new Date().getFullYear();
  const batches: string[] = [];
  for (
    let year = ATTENDANCE_MIN_BATCH_YEAR;
    year <= currentYear + FUTURE_YEARS;
    year++
  ) {
    batches.push(String(year));
  }
  return batches;
}

/** True when the batch value is 2026 or above (numeric comparison). */
export function isAllowedAttendanceBatch(batch: string | undefined | null): boolean {
  if (!batch) return false;
  const year = Number(batch);
  return Number.isFinite(year) && year >= ATTENDANCE_MIN_BATCH_YEAR;
}
