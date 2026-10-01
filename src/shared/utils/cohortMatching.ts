// src/shared/utils/cohortMatching.ts
//
// Matches a class session's cohort (branch / batch / semester / division /
// section / subject) against the student documents of a college, and — when
// nothing matches — explains WHY instead of showing "0 students".
//
// WHY THIS EXISTS
// The "Mark Attendance" page used to compare fields with raw string equality:
//
//     String(d.branch || d.department || '') !== String(branch)
//
// That is a coin flip against real data:
//   * bulk-imported students carry the program in `department` ("BBA") while
//     schedules carry `branch` (" bba "), and "B.B.A" / "BBA" never compared
//     equal to each other;
//   * batches and semesters exist as numbers in one importer and strings in
//     another;
//   * "A", "Div A" and "div. A" all mean the same division;
//   * the schedule stores division AND section, but the roster filter dropped
//     the section, so a class for "A B" could never find a student recorded
//     under either letter;
//   * bulk import defaults a missing semester to 1, so a class scheduled for
//     semester 3 excluded every freshly-imported student — silently, with a
//     generic "No students found matching your criteria" empty state.
//
// This module is the single pure decision used by the roster fetch, so the
// matching rules are unit-testable without Firestore, and the diagnostics it
// emits (per-field mismatch counts and the distinct values seen) are what the
// UI shows when the cohort is empty. The matching rules, explicitly:
//
//   collegeId  both present  → must be equal (defense in depth: the query
//                              already scopes by college, but a mis-scoped
//                              query must not leak another tenant's roster);
//   branch     schedule empty → no constraint; otherwise normalised program
//                names must be equal (case, whitespace, dots and punctuation
//                ignored: "BBA" = "bba" = "B.B.A" = " bba ");
//   batch      schedule empty → no constraint; otherwise the batch KEYS must
//                be equal ("2027" = 2027 = " 2027 "), and an academic-year
//                RANGE names the class of its END year ("2026-2027" =
//                "2026-27" = "2027") while a bare start year stays a
//                different cohort ("2026" ≠ "2027"). See normalizeBatchKey;
//   semester   both unknown    → no constraint (neither side says which
//                cohort — a legacy gap, not a mismatch);
//              schedule unknown → no constraint, BUT if the matched students
//                span more than one semester the diagnostics flag it, because
//                the class is silently wider than intended;
//              schedule known, student unknown → EXCLUDED (the student's
//                cohort is not provably this class) and counted so the UI can
//                say "N students have no semester recorded";
//              both known → must be equal;
//   division / section are normalised independently ("A" = "div A" = "a "),
//   and the schedule's two letters form a set; a student's two letters form a
//   set; the sets must intersect when either is non-empty. A student recorded
//   under only `section: "A"` therefore matches a class for division "A",
//   and vice versa.
//   subject    a student with no subject list is never filtered out; a
//                student whose subject list exists must contain the class
//                subject (or its code), ignoring formatting — "Language-I
//                (Lang3.1)" = "Language I (Lang 3.1)" = the code "Lang3.1".

// ─── Normalisation ──────────────────────────────────────────────────────────

/** Punctuation that importers disagree about — dropped, not space-converted. */
const NOISE_PUNCT = /[.,;:'’"·]+/g

/** trim + case-fold + collapse whitespace (dots stay for the callers below). */
function foldText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Program names: "B.B.A" → "bba", "BBA " → "bba", "M. Tech" → "m tech".
 * Dots and stray punctuation are dropped (not turned into spaces) so
 * "B.B.A" equals "BBA"; real internal whitespace is preserved, so "BBA IT"
 * stays distinct from "BBA".
 */
export function normalizeProgramName(value: unknown): string {
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').trim()
}

/**
 * Cohort tokens (batch, division, section): trimmed, case-folded, dots and
 * punctuation dropped. "2027" = 2027 = " 2027 ", "A" = "a".
 */
export function normalizeCohortToken(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    // A numeric batch/semester prints without a trailing ".0".
    return String(value)
  }
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').trim()
}

const DIVISION_PREFIXES = /^(?:division|div)\s+/
const SECTION_PREFIXES = /^(?:section|sect|sec)\s+/

/**
 * A two-part year range: "2026-2027", "2026-27", "2026 – 2027", "2026/2027".
 * The dash may be a hyphen, en/em dash or a slash; spaces around it are noise
 * (both already collapse to one space by the time this runs).
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
 * Batch / academic-year canonical key.
 *
 * The same class is recorded two ways in this codebase: by its graduating
 * year ("2027") and by the academic-year range that ends in it ("2026-2027",
 * "2026-27"). Both name the same cohort, so a range canonicalises to its END
 * year — the range 2026-2027 IS the class of 2027.
 *
 * A bare start year is NOT that class: "2026" keeps its own key, so "2026" is
 * neither "2027" nor "2026-2027". Everything that is not a consecutive year
 * range is untouched: "2027" = 2027 = " 2027 ", "A" = "a".
 *
 * KEEP IN SYNC with functions/src/cohortBatch.ts — the server-side matchers
 * (student curriculum, auto faculty mapping) use the same rule, and the two
 * sides must not disagree about who is in a class.
 */
export function normalizeBatchKey(value: unknown): string {
  const token = normalizeCohortToken(value)
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
 * The batch tokens of a multi-intake list, each canonicalised as a batch key
 * (so an academic-year token counts as its END year). Empty list → [].
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
 * multi-intake list; every token is compared keyed (range ≡ end year).
 * Both empty → true; exactly one empty → false.
 */
export function batchFieldsIntersect(left: unknown, right: unknown): boolean {
  const leftTokens = batchKeyTokens(left)
  const rightTokens = batchKeyTokens(right)
  if (leftTokens.length === 0 && rightTokens.length === 0) return true
  if (leftTokens.length === 0 || rightTokens.length === 0) return false
  return leftTokens.some((token) => rightTokens.includes(token))
}

/** A row's cohort/division scope — any object carrying these fields. */
export interface CohortScope {
  branch?: unknown
  batch?: unknown
  division?: unknown
  section?: unknown
}

const foldScopeText = (value: unknown) =>
  String(value ?? '').trim().toLowerCase().replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').trim()

/**
 * Do two division/section scopes address a common division? A blank side is
 * "no constraint" (true); otherwise the letters must intersect — so a class
 * mapped to "A,B,C,D" covers division "A". Same rule as the server copy in
 * functions/src/cohortBatch.ts.
 */
export function divisionScopesOverlap(left: CohortScope, right: CohortScope): boolean {
  const leftLetters = [...cohortLetters(left.division, 'division'), ...cohortLetters(left.section, 'section')]
  const rightLetters = [...cohortLetters(right.division, 'division'), ...cohortLetters(right.section, 'section')]
  if (leftLetters.length === 0 || rightLetters.length === 0) return true
  return leftLetters.some((letter) => rightLetters.includes(letter))
}

/**
 * Do two cohort scopes (branch, batch, division/section) overlap — i.e. could
 * they contain the same students? Used by clash detection both in the browser
 * and on the server (functions/src/utils/timetableConflicts.ts).
 *
 * Two fully blank scopes are "no identifiable cohort" and never overlap; a
 * blank FIELD inside a scope is a wildcard. Batches compare as keyed token
 * lists, divisions as letter sets.
 */
export function cohortScopesOverlap(left: CohortScope, right: CohortScope): boolean {
  const leftBranch = foldScopeText(left.branch)
  const rightBranch = foldScopeText(right.branch)
  const leftBatch = batchKeyTokens(left.batch)
  const rightBatch = batchKeyTokens(right.batch)
  const leftLetters = [...cohortLetters(left.division, 'division'), ...cohortLetters(left.section, 'section')]
  const rightLetters = [...cohortLetters(right.division, 'division'), ...cohortLetters(right.section, 'section')]

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

/** "Div A" / "division a" / "div. a" / "A" → "a". */
export function normalizeDivision(value: unknown): string {
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').replace(DIVISION_PREFIXES, '').trim()
}

/** "Section B" / "sec. b" / "B" → "b". */
export function normalizeSection(value: unknown): string {
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').replace(SECTION_PREFIXES, '').trim()
}

/**
 * Prefix words that carry no letter of their own, so a list spelled out as
 * "Div A, Div B" does not leave "div" behind as a letter of its own.
 */
const LETTER_PREFIX_WORDS = new Set(['div', 'division', 'sec', 'sect', 'section'])

/** List separators: "A,B,C,D", "A/B", "A;B", "A B", "A&B". */
const LETTER_SPLIT = /[,/;|&+]+|\s+/

/**
 * Every letter a division/section FIELD holds.
 *
 * Most records carry one letter ("A" = "div a"), but staff routinely write a
 * LIST when one class covers several divisions — "A,B,C,D", "Div A, Div B",
 * "a b". The old comparison read the whole field as a single token: "A,B,C,D"
 * normalised to "abcd", which equals no student's "A", so the class matched
 * nobody and the page blamed the student's division.
 *
 * A field with no separators is still ONE token: "ABCD" remains "abcd" and
 * does not magically equal "A".
 */
export function cohortLetters(value: unknown, kind: 'division' | 'section'): string[] {
  const normalize = kind === 'division' ? normalizeDivision : normalizeSection
  const out: string[] = []
  for (const raw of String(value ?? '').split(LETTER_SPLIT)) {
    const letter = normalize(raw)
    if (!letter || LETTER_PREFIX_WORDS.has(letter)) continue
    if (!out.includes(letter)) out.push(letter)
  }
  return out
}

/** 3, "3" → 3; 0, "", null, "x" → null (unknown, not "semester zero"). */
export function normalizeSemester(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  const int = Math.trunc(n)
  if (int < 1) return null
  return int
}

/**
 * Subject tokens: everything but letters and digits dropped, so "Language-I
 * (Lang3.1)" → "languageilang31" and "LANG-3.1" → "lang31".
 */
export function normalizeSubjectToken(value: unknown): string {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

// ─── Student field extraction ───────────────────────────────────────────────

export interface StudentCohortFields {
  collegeId: string
  branch: string
  batch: string
  division: string
  section: string
  semester: number | null
  subjects: string[]
}

/**
 * Project a raw student document onto the fields the cohort match uses.
 *
 * `branch` falls back to `department` because bulk-imported students store
 * the program there; division and section are read as SEPARATE fields (the
 * old code conflated them, which is how a student's "section A" was silently
 * re-labelled "division A" and then compared against the wrong letter).
 */
export function extractStudentCohortFields(data: Record<string, unknown>): StudentCohortFields {
  const branch = String(data.branch ?? data.department ?? '')
  const batch = String(data.batch ?? '')
  const division = String(data.division ?? '')
  const section = String(data.section ?? '')

  const rawSubjects: unknown = data.subjects ?? data.assignedSubjects ?? []
  const subjects: string[] = []
  if (Array.isArray(rawSubjects)) {
    for (const item of rawSubjects) {
      if (typeof item === 'string' && item.trim()) subjects.push(item)
      else if (item && typeof item === 'object') {
        const name = String((item as Record<string, unknown>).name ?? (item as Record<string, unknown>).subject ?? '')
        if (name.trim()) subjects.push(name)
      }
    }
  }

  return {
    collegeId: String(data.collegeId ?? ''),
    branch,
    batch,
    division,
    section,
    semester: normalizeSemester(data.semester),
    subjects,
  }
}

// ─── Cohort criteria ────────────────────────────────────────────────────────

export interface CohortCriteria {
  collegeId: string
  branch: string
  batch: string
  division: string
  section: string
  /** 0 / '' / null all mean "the schedule does not say". */
  semester: number | string
  subject: string
  subjectCode?: string
}

export type CohortField = 'collegeId' | 'branch' | 'batch' | 'semester' | 'division' | 'section' | 'subject'

export interface CohortMatchResult {
  match: boolean
  /** Fields on which this student individually fails (for per-field counts). */
  mismatches: CohortField[]
}

/** Letters the class is taught to, from its division and section slots. */
function scheduleLetters(criteria: CohortCriteria): string[] {
  return [
    ...cohortLetters(criteria.division, 'division'),
    ...cohortLetters(criteria.section, 'section'),
  ]
}

/** Letters the student is recorded under, from their division and section fields. */
function studentLetters(fields: StudentCohortFields): string[] {
  return [
    ...cohortLetters(fields.division, 'division'),
    ...cohortLetters(fields.section, 'section'),
  ]
}

/**
 * Substring matches need a length floor: a code shorter than four characters
 * ("31") would be "contained" in unrelated subjects ("Math3.1"), and a four-
 * letter abbreviation is the shortest token that is safe to treat as "the
 * same course in a shorter spelling".
 */
const SUBJECT_SUBSTRING_MIN = 4

function subjectMatches(fields: StudentCohortFields, criteria: CohortCriteria): boolean {
  const name = normalizeSubjectToken(criteria.subject)
  const code = criteria.subjectCode ? normalizeSubjectToken(criteria.subjectCode) : ''
  return fields.subjects.some((subject) => {
    const token = normalizeSubjectToken(subject)
    if (!token) return false
    if (name) {
      if (token === name) return true
      // "Language-I" and "Language" (no parenthesised code) are the same
      // course as "Language-I (Lang3.1)"; the abbreviation "Math" stands for
      // "Mathematics-I (Math3.1)".
      if (token.length >= SUBJECT_SUBSTRING_MIN && name.includes(token)) return true
      // …and the reverse direction, which used to be missing: a schedule that
      // names the course short ("Financial Accounting") must still find
      // students enrolled under the long form ("Financial Accounting-I").
      if (name.length >= SUBJECT_SUBSTRING_MIN && token.includes(name)) return true
    }
    if (code) {
      if (token === code) return true
      if (code.length >= SUBJECT_SUBSTRING_MIN && token.includes(code)) return true
      if (token.length >= SUBJECT_SUBSTRING_MIN && code.includes(token)) return true
    }
    return false
  })
}

/**
 * Decide whether one student belongs to one class session's cohort, and on
 * which fields it fails. Pure: no Firestore, no Date, no console.
 */
export function matchStudentToCohort(fields: StudentCohortFields, criteria: CohortCriteria): CohortMatchResult {
  const mismatches: CohortField[] = []

  // Tenant guard — the query scopes by collegeId; this re-check keeps a
  // mis-scoped query from ever returning another college's roster.
  if (
    fields.collegeId.trim() !== '' &&
    criteria.collegeId.trim() !== '' &&
    fields.collegeId.trim() !== criteria.collegeId.trim()
  ) {
    mismatches.push('collegeId')
  }

  // Branch / program.
  const criterionBranch = normalizeProgramName(criteria.branch)
  if (criterionBranch && normalizeProgramName(fields.branch) !== criterionBranch) {
    mismatches.push('branch')
  }

  // Batch — keyed so an academic-year range agrees with its end year: a class
  // scheduled for "2026-2027" is the class of "2027", while a student whose
  // batch is the bare start year "2026" belongs to a different cohort.
  const criterionBatch = normalizeBatchKey(criteria.batch)
  if (criterionBatch && !batchKeysMatch(criteria.batch, fields.batch)) {
    mismatches.push('batch')
  }

  // Semester — see the header for the legacy rules.
  const criterionSemester = normalizeSemester(criteria.semester)
  if (criterionSemester === null) {
    if (fields.semester === null) {
      // Neither side says — allowed, and flagged in diagnostics if the
      // resulting cohort turns out to span several semesters.
    }
    // schedule unknown, student known → no constraint (diagnostics flag it).
  } else if (fields.semester === null) {
    mismatches.push('semester')
  } else if (fields.semester !== criterionSemester) {
    mismatches.push('semester')
  }

  // Division / section as intersecting letter sets.
  const sched = scheduleLetters(criteria)
  const stu = studentLetters(fields)
  if (sched.length > 0 && stu.length === 0) {
    // The student has no division/section at all while the class is for a
    // specific one: not provably this cohort.
    mismatches.push('section')
  } else if (
    sched.length > 0 &&
    stu.length > 0 &&
    !stu.some((letter) => sched.includes(letter))
  ) {
    // Attribute the failure to the field(s) the student actually carries, so
    // the UI can say which column to fix. Both sides are letter SETS: a class
    // for "A,B,C,D" that omits the student's "E" fails on division, and a
    // student's multi-letter field fails unless the class teaches one of them.
    const ownDivision = cohortLetters(fields.division, 'division')
    if (ownDivision.length > 0 && !ownDivision.some((letter) => sched.includes(letter))) {
      mismatches.push('division')
    }
    const ownSection = cohortLetters(fields.section, 'section')
    if (ownSection.length > 0 && !ownSection.some((letter) => sched.includes(letter))) {
      mismatches.push('section')
    }
    // Both letters are off but were already attributed to neither field
    // (defensive — cannot happen when both normalisations are non-empty).
    if (!mismatches.includes('division') && !mismatches.includes('section')) {
      mismatches.push('section')
    }
  }

  // Subject.
  if (fields.subjects.length > 0 && !subjectMatches(fields, criteria)) {
    mismatches.push('subject')
  }

  return { match: mismatches.length === 0, mismatches }
}

// ─── Roster-level matching + diagnostics ────────────────────────────────────

export interface RosterMismatchDetail {
  /** How many loaded students fail on this field (a student may fail several). */
  count: number
  /** Up to 6 distinct RAW values seen on the failing students. */
  values: string[]
}

export interface RosterDiagnostics {
  /** Students the college query returned (before cohort filtering). */
  collegeTotal: number
  matched: number
  /** True when the college query hit its limit and may have truncated. */
  truncated: boolean
  target: {
    branch: string
    batch: string
    division: string
    section: string
    semester: string
    subject: string
  }
  mismatches: Partial<Record<CohortField, RosterMismatchDetail>>
  /**
   * "Almost this class" exclusions: students who fail ONLY on cohort-identity
   * fields (semester / division / section / subject) while matching college,
   * branch and batch. Students of other branches or batches failing to match
   * is NORMAL (they belong to other classes) and is deliberately excluded —
   * this is the difference between "7 BCA students were left out" (a bug to
   * fix) and "the B.Com students were left out" (working as intended).
   */
  nearMisses: Partial<Record<CohortField, RosterMismatchDetail>>
  /** Total students counted in `nearMisses` (a student may fail several fields). */
  nearMissTotal: number
  /**
   * The distinct semesters among MATCHED students when the schedule does not
   * specify one; null when the schedule does (or nobody matched). A length > 1
   * here means the class is silently wider than intended.
   */
  matchedSemesters: string[] | null
}

/** Identity fields — failing these means "a different cohort", not "almost". */
const IDENTITY_FIELDS: readonly CohortField[] = ['collegeId', 'branch', 'batch']

/**
 * Run the cohort match over every loaded student document and build the
 * diagnostics that explain an empty (or thin) roster.
 */
export function matchCohortRows(
  rows: Array<Record<string, unknown>>,
  criteria: CohortCriteria,
  limit: number,
): { matched: Array<Record<string, unknown>>; matchedIndices: number[]; diagnostics: RosterDiagnostics } {
  const matched: Array<Record<string, unknown>> = []
  const matchedIndices: number[] = []
  const valueSinks: Partial<Record<CohortField, Map<string, number>>> = {}
  const countSink: Partial<Record<CohortField, number>> = {}
  const nearValueSinks: Partial<Record<CohortField, Map<string, number>>> = {}
  const nearCountSink: Partial<Record<CohortField, number>> = {}
  let nearMissTotal = 0
  const matchedSemesterSet = new Map<number, number>()

  const rawValueOf = (row: Record<string, unknown>, field: CohortField): string => {
    switch (field) {
      case 'collegeId':
        return String(row.collegeId ?? '')
      case 'branch':
        return String(row.branch ?? row.department ?? '')
      case 'batch':
        return String(row.batch ?? '')
      case 'semester': {
        const s = normalizeSemester(row.semester)
        return s === null ? '(none)' : String(s)
      }
      case 'division':
        return String(row.division ?? '')
      case 'section':
        return String(row.section ?? '')
      case 'subject':
        return '(subjects: ' + extractStudentCohortFields(row).subjects.join(', ') + ')'
      default:
        return ''
    }
  }

  for (const [index, row] of rows.entries()) {
    const fields = extractStudentCohortFields(row)
    const result = matchStudentToCohort(fields, criteria)
    if (result.match) {
      matched.push(row)
      matchedIndices.push(index)
      if (fields.semester !== null) {
        matchedSemesterSet.set(fields.semester, (matchedSemesterSet.get(fields.semester) ?? 0) + 1)
      }
      continue
    }
    for (const field of result.mismatches) {
      countSink[field] = (countSink[field] ?? 0) + 1
      const sink = valueSinks[field] ?? new Map<string, number>()
      const value = rawValueOf(row, field).trim() || '(none)'
      sink.set(value, (sink.get(value) ?? 0) + 1)
      valueSinks[field] = sink
    }
    // Near-miss: same college/branch/batch, one identity field off. These are
    // the students a data fix would bring INTO this roster.
    if (!result.mismatches.some((field) => IDENTITY_FIELDS.includes(field))) {
      nearMissTotal += 1
      for (const field of result.mismatches) {
        nearCountSink[field] = (nearCountSink[field] ?? 0) + 1
        const sink = nearValueSinks[field] ?? new Map<string, number>()
        const value = rawValueOf(row, field).trim() || '(none)'
        sink.set(value, (sink.get(value) ?? 0) + 1)
        nearValueSinks[field] = sink
      }
    }
  }

  const mismatches: RosterDiagnostics['mismatches'] = {}
  for (const field of Object.keys(countSink) as CohortField[]) {
    const sink = valueSinks[field]
    mismatches[field] = {
      count: countSink[field] ?? 0,
      values: sink
        ? [...sink.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 6)
            .map(([value]) => value)
        : [],
    }
  }

  const nearMisses: RosterDiagnostics['nearMisses'] = {}
  for (const field of Object.keys(nearCountSink) as CohortField[]) {
    const sink = nearValueSinks[field]
    nearMisses[field] = {
      count: nearCountSink[field] ?? 0,
      values: sink
        ? [...sink.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, 6)
            .map(([value]) => value)
        : [],
    }
  }

  const criterionSemesterKnown = normalizeSemester(criteria.semester) !== null
  const matchedSemesters =
    matchedSemesterSet.size > 0
      ? [...matchedSemesterSet.keys()].sort((a, b) => a - b).map(String)
      : null

  return {
    matched,
    matchedIndices,
    diagnostics: {
      collegeTotal: rows.length,
      matched: matched.length,
      truncated: rows.length >= limit,
      target: {
        branch: String(criteria.branch ?? '').trim(),
        batch: String(criteria.batch ?? '').trim(),
        division: String(criteria.division ?? '').trim(),
        section: String(criteria.section ?? '').trim(),
        semester: criterionSemesterKnown ? String(normalizeSemester(criteria.semester)) : '',
        subject: String(criteria.subject ?? '').trim(),
      },
      mismatches,
      nearMisses,
      nearMissTotal,
      matchedSemesters: criterionSemesterKnown ? null : matchedSemesters,
    },
  }
}
