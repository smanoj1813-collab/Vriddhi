// functions/src/cohortBatch.ts
//
// Batch (academic year) identity, shared by every server-side cohort matcher.
//
// WHY THIS EXISTS
// A cohort's batch is recorded two ways in this codebase:
//
//     "2027"        the graduating year — what bulk import writes;
//     "2026-2027"   the academic-year range that ENDS in it — what the
//     "2026-27"     curriculum/auto-map dialogs and question-bank config use.
//
// Both name the same class. Comparing them as strict strings (the previous
// behaviour everywhere) excluded a student from their own curriculum and made
// the student page say "your subjects are mapped — but to a different class
// than yours" while sixteen correct mappings sat in the database. The same
// comparison in autoCurriculumMapping meant an already-mapped faculty member
// was re-proposed and DUPLICATED by applyAutoMapping, because the existing row
// looked like a different batch.
//
// THE RULE
//   * an academic-year range canonicalises to its END year — "2026-2027",
//     "2026-27", "2026 – 2027" and "2026/2027" are all the class of "2027";
//   * a bare start year is a DIFFERENT cohort — "2026" is not "2027", and it
//     is not "2026-2027" either;
//   * only a CONSECUTIVE pair is an academic year — "2026-2028" keeps its
//     literal token and cannot match a class by accident;
//   * everything else is unchanged — "2027" = 2027 = " 2027 ", "A" = "a".
//
// KEEP IN SYNC with src/shared/utils/cohortMatching.ts (normalizeBatchKey /
// batchKeysMatch). The roster preview runs in the browser and the curriculum /
// auto-mapping matchers run here; the two sides must not disagree about who is
// in a class. functions/test/cohortBatch.test.ts imports BOTH copies and fails
// if they ever drift apart.
//
// Pure: no Firestore, no Date, no console. Unit tested with zero setup.

/** Punctuation that importers disagree about — dropped, not space-converted. */
const NOISE_PUNCT = /[.,;:'’"·]+/g

/**
 * Batch tokens: trim + case-fold + drop noise punctuation + collapse
 * whitespace. Numbers print without a trailing ".0" — the same rules as the
 * frontend's normalizeCohortToken, so the two keys are comparable.
 */
function normalizeBatchToken(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return String(value)
    .trim()
    .toLowerCase()
    .replace(NOISE_PUNCT, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A two-part year range: "2026-2027", "2026-27", "2026 – 2027", "2026/2027".
 * The dash may be a hyphen, en/em dash or a slash; spaces around it are noise.
 */
const ACADEMIC_YEAR_RANGE = /^(\d{2,4})\s*[-–—/]\s*(\d{2,4})$/

/**
 * End year of a two-part year range, or null when the pair is not a
 * CONSECUTIVE academic year.
 *
 * A four-digit start anchors the century: "2026-27" ends in 2027, and
 * "1999-00" wraps to 2000. A two-digit start ("26-27") is read as the 2000s —
 * the only century this app stores batches in.
 */
function academicYearEnd(startPart: string, endPart: string): number | null {
  const start = startPart.length === 4 ? Number(startPart) : 2000 + Number(startPart)
  const rawEnd =
    endPart.length === 4 ? Number(endPart) : Math.floor(start / 100) * 100 + Number(endPart)
  const end = endPart.length === 2 && rawEnd <= start ? rawEnd + 100 : rawEnd
  // "2026-2028" is a span of years, not one academic year — leave it literal
  // so it cannot match a class by accident.
  return end === start + 1 ? end : null
}

/**
 * Batch / academic-year canonical key (see the header for the rule).
 * Blank values key to '', which every caller reads as "not recorded".
 */
export function normalizeBatchKey(value: unknown): string {
  const token = normalizeBatchToken(value)
  const range = ACADEMIC_YEAR_RANGE.exec(token)
  if (!range) return token
  const endYear = academicYearEnd(range[1], range[2])
  return endYear === null ? token : String(endYear)
}

/**
 * Do two batch values name the same class? Pure key comparison: a blank batch
 * is an empty key (two blanks compare equal, a blank against a known batch
 * does not). Wildcard/"unknown" semantics belong to the matcher — the schedule
 * treats a blank batch as "no constraint" and a blank student batch as
 * "unknown" BEFORE this is called.
 */
export function batchKeysMatch(left: unknown, right: unknown): boolean {
  return normalizeBatchKey(left) === normalizeBatchKey(right)
}
