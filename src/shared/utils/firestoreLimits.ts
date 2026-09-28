// src/shared/utils/firestoreLimits.ts
//
// WHY THIS EXISTS
//
// The production desks failed with:
//   invalid-argument: Limit value in the structured query is over the
//   maximum value of 10000
//
// That is not a permission problem, a missing index, or an unlinked account.
// Firestore validates `limit()` BEFORE the query runs and rejects anything
// above 10000, so a query written with `limit(50000)` never executed once —
// the office desks have been throwing on those reads the whole time, and the
// failure was being reported as an unexplained "could not load" because
// nothing in the UI knew what an invalid-argument was.
//
// Two rules follow from that, and both matter:
//
// 1. NEVER pass a literal above 10000 to `limit()`. `cappedLimit` is the only
//    way to ask for "as much as possible" in this codebase.
//
// 2. A clamped read can be TRUNCATED, and a truncated read that looks
//    complete is a different kind of lie from one that throws. The helpers
//    here keep the old (impossible) intent, clamp it to what the API actually
//    allows, and shout when a result comes back at the cap so the truncation
//    is diagnosable instead of invisible.

/** Firestore's hard ceiling on a single structured query. */
export const FIRESTORE_MAX_LIMIT = 10000

/**
 * Clamp a requested limit to something the API will actually run.
 * Anything at or below the cap is passed through untouched.
 */
export function cappedLimit(requested: number): number {
  const n = Number(requested)
  if (!Number.isFinite(n) || n <= 0) return FIRESTORE_MAX_LIMIT
  return Math.min(Math.floor(n), FIRESTORE_MAX_LIMIT)
}

/**
 * Warn once per call site when a query comes back exactly at the cap, i.e. it
 * may be truncated. Without this, a college with more documents than the cap
 * would see a count that is quietly wrong — and no way to tell that apart from
 * a college that really has nothing more.
 */
export function warnIfTruncated(size: number, label: string): boolean {
  if (size >= FIRESTORE_MAX_LIMIT) {
    console.warn(
      `[firestoreLimits] ${label} returned ${size} documents — the Firestore maximum. ` +
        `The result may be truncated; this query needs pagination, not a bigger limit.`
    );
    return true;
  }
  return false;
}
