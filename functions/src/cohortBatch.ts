// functions/src/cohortBatch.ts
//
// Cohort identity — batch (academic year) AND division/section letters —
// shared by every server-side cohort matcher: the student curriculum page,
// the auto-scheduler, the bulk schedule import and the clash detector.
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

/** Multi-intake separators: "2027,2028", "2027/2028", "2027 2028". A hyphen
 *  is NOT a separator — "2026-2027" is one academic-year token, not two. */
const BATCH_LIST_SPLIT = /[,/;|&\s]+/

/**
 * The batch tokens of a multi-intake list ("2027, 2028" → ["2027","2028"]),
 * each canonicalised with normalizeBatchKey so a token that is an
 * academic-year range ("2026-2027") is compared as its END year.
 * Empty list → [].
 */
export function batchKeyTokens(value: unknown): string[] {
  const out: string[] = []
  for (const raw of String(value ?? '').split(BATCH_LIST_SPLIT)) {
    const key = normalizeBatchKey(raw)
    if (key && !out.includes(key)) out.push(key)
  }
  return out
}

/**
 * Do two batch FIELDS name at least one common class? Either side may hold a
 * multi-intake list, and every token is compared keyed (range ≡ end year).
 * Both empty → true; exactly one empty → false (a field that names no class
 * cannot be assumed to be the other one).
 */
export function batchFieldsIntersect(left: unknown, right: unknown): boolean {
  const leftTokens = batchKeyTokens(left)
  const rightTokens = batchKeyTokens(right)
  if (leftTokens.length === 0 && rightTokens.length === 0) return true
  if (leftTokens.length === 0 || rightTokens.length === 0) return false
  return leftTokens.some((token) => rightTokens.includes(token))
}

// ─── Division / section letters ─────────────────────────────────────────────

/** Words that carry no letter of their own: "Div A, Div B" → ["a", "b"]. */
const LETTER_PREFIX_WORDS = new Set(['div', 'division', 'sec', 'sect', 'section'])

/** List separators: "A,B,C,D", "A/B", "A;B", "A B", "A&B". */
const LETTER_SPLIT = /[,/;|&+]+|\s+/

const foldLetter = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
const normLetter = (value: unknown) =>
  foldLetter(value).replace(/^div(ision)?[.\s]*/, '').replace(/^sec(tion)?[.\s]*/, '').trim()

/**
 * Every letter a division/section FIELD holds.
 *
 * Staff write a LIST when one class covers several divisions — "A,B,C,D".
 * Reading that as one token ("abcd") made the class equal nobody, so a
 * correctly mapped subject was reported as "a different class than yours"
 * (and the same value blanks the attendance roster). A field with no
 * separators is still ONE token: "ABCD" ≠ "A".
 */
export function cohortLetters(value: unknown): string[] {
  const out: string[] = []
  for (const raw of String(value ?? '').split(LETTER_SPLIT)) {
    const letter = normLetter(raw)
    if (!letter || LETTER_PREFIX_WORDS.has(letter)) continue
    if (!out.includes(letter)) out.push(letter)
  }
  return out
}

/** A row's division/section scope — any object carrying the two fields. */
export interface DivisionScope {
  division?: unknown
  section?: unknown
}

/**
 * Do two division/section scopes address at least one common division?
 *
 * A scope is the pair (division, section) because records split the letter
 * across the two fields. A blank side is "no constraint" (true) — the same
 * wildcard rule the student matcher uses. A list on either side overlaps a
 * single letter or another list as soon as one letter is shared.
 */
export function divisionScopesOverlap(left: DivisionScope, right: DivisionScope): boolean {
  const leftLetters = [...cohortLetters(left.division), ...cohortLetters(left.section)]
  const rightLetters = [...cohortLetters(right.division), ...cohortLetters(right.section)]
  if (leftLetters.length === 0 || rightLetters.length === 0) return true
  return leftLetters.some((letter) => rightLetters.includes(letter))
}

/** A row's cohort scope — branch + batch + division/section. */
export interface CohortScope extends DivisionScope {
  branch?: unknown
  batch?: unknown
}

const foldBranch = (value: unknown) =>
  String(value ?? '').trim().toLowerCase().replace(/[.,;:'’"·]+/g, '').replace(/\s+/g, ' ').trim()

/**
 * Do two cohort scopes (branch, batch, division/section) overlap — i.e. could
 * they contain the same students?
 *
 * Used by clash detection and the auto-scheduler to decide whether two
 * timetable rows compete for one cohort. Two fully blank scopes are "no
 * identifiable cohort" and never overlap; a blank FIELD inside a scope is a
 * wildcard (a slot with no division recorded covers every division).
 */
export function cohortScopesOverlap(left: CohortScope, right: CohortScope): boolean {
  const leftBranch = foldBranch(left.branch)
  const rightBranch = foldBranch(right.branch)
  const leftBatch = batchKeyTokens(left.batch)
  const rightBatch = batchKeyTokens(right.batch)
  const leftLetters = [...cohortLetters(left.division), ...cohortLetters(left.section)]
  const rightLetters = [...cohortLetters(right.division), ...cohortLetters(right.section)]

  if (!leftBranch && !rightBranch && leftBatch.length === 0 && rightBatch.length === 0 &&
      leftLetters.length === 0 && rightLetters.length === 0) {
    return false
  }
  if (leftBranch && rightBranch && leftBranch !== rightBranch) return false
  if (leftBatch.length > 0 && rightBatch.length > 0 &&
      !leftBatch.some((token) => rightBatch.includes(token))) {
    return false
  }
  if (leftLetters.length > 0 && rightLetters.length > 0 &&
      !leftLetters.some((letter) => rightLetters.includes(letter))) {
    return false
  }
  return true
}
