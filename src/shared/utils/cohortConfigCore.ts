// src/shared/utils/cohortConfigCore.ts
//
// A college's cohort vocabulary — the section letters and semester count that
// every student, session and import in that college must speak.
//
// WHY THIS EXISTS
// Sections and semesters had no authoritative definition. A section letter was
// whatever someone typed ("A", "Section A", "A,B,C,D", "abcd"), and the
// semester count was guessed (promotionCore defaulted to 6). Two consequences:
//
//   * the derived cohort key (./cohortKey) could be incomplete or inconsistent
//     with no way to say so, because nothing knew which sections existed;
//   * onboarding could not REJECT a bad value, only store it and fail later —
//     which is how "Section A" vs "A" reached the matchers in the first place.
//
// So each college declares its own vocabulary once, and onboarding validates
// against it. It is per-college because a college running A–D and one running
// A–F are both legitimate; a platform-wide hardcoded six would be wrong.
//
// WHERE IT LIVES
// colleges/{collegeId}/config/cohort — the existing per-college config
// subcollection, which firestore.rules already lets the principal/admin write
// and staff read. Deliberately NOT the college document: that document's update
// rule is superadmin-only, and section letters are an academic-setup decision
// the college must own.
//
// PURE: no Firestore, no Date.now. Callers pass the current year in, so the
// validation is deterministic and testable.
// KEEP IN SYNC with functions/src/cohortConfigCore.ts — functions/test/cohortConfigCore.test.ts
// imports both and fails if they drift. This is the BROWSER copy.

/**
 * A section/division letter: ONE alphabetic character.
 *
 * Multi-character entries are REJECTED rather than split, because "ABCD" is
 * ambiguous — it is the letter cluster that cohortLetters deliberately keeps
 * as one token (see ./cohortBatch), not four sections. Guessing would put
 * students in sections they do not have.
 */
const SECTION_LETTER = /^[a-z]$/

/** List separators accepted when the setting arrives as free text. */
const LIST_SPLIT = /[,;/|&+\s]+/

/** Prefix words that are not letters: "Section A" → "a". */
const PREFIX_WORDS = new Set(['div', 'division', 'sec', 'sect', 'section'])

// NOTE: there is deliberately no `MAX_SECTIONS` limit to enforce. A section is
// exactly one letter, so de-duplication bounds the list at 26 by construction
// (see SECTION_LETTER) — a length check would be unreachable code.

/** How many semesters a programme may run. 12 = 6 years, generously. */
export const MIN_SEMESTERS = 1
export const MAX_SEMESTERS = 12

export interface CohortConfig {
  /** Declared section letters, upper-case and sorted: ["A","B","C","D"]. */
  sections: string[]
  /** Semesters in this college's programmes: 6 for a 3-year UG. */
  semesterCount: number
  /**
   * Whether a cohort must name a section to be complete. False for a college
   * with no section split, where a programme runs as one whole batch.
   */
  requireSection: boolean
}

/**
 * The default vocabulary. Four sections and six semesters is the common Indian
 * UG shape, and matches promotionCore's long-standing programmeSemesters
 * default — so a college that never opens the setting behaves exactly as it
 * does today.
 */
export const DEFAULT_COHORT_CONFIG: CohortConfig = {
  sections: ['A', 'B', 'C', 'D'],
  semesterCount: 6,
  requireSection: true,
}

/** What a raw section list looked like once split, before validation. */
export interface SectionListResult {
  /** Valid, de-duplicated, sorted upper-case letters. */
  sections: string[]
  /** Entries that were present but not a single letter — for the UI to show. */
  rejected: string[]
}

/**
 * Split a section list into letters.
 *
 * Accepts an array or free text ("A,B,C,D", "Div A, Div B", "a b c d",
 * "Section A, Section B"). Prefix words and separators are dropped; anything
 * that is not a single letter is reported in `rejected` rather than silently
 * discarded, so a typo is visible instead of becoming a missing section.
 */
export function normalizeSectionList(value: unknown): SectionListResult {
  const raw: string[] = []
  if (Array.isArray(value)) {
    for (const item of value) raw.push(String(item ?? ''))
  } else if (value !== null && value !== undefined) {
    raw.push(...String(value).split(LIST_SPLIT))
  }

  const sections: string[] = []
  const rejected: string[] = []
  for (const item of raw) {
    const token = item.trim().toLowerCase().replace(/[.,;:'’"·]/g, '')
    if (!token) continue
    if (PREFIX_WORDS.has(token)) continue
    if (!SECTION_LETTER.test(token)) {
      if (!rejected.includes(item.trim())) rejected.push(item.trim())
      continue
    }
    const letter = token.toUpperCase()
    if (!sections.includes(letter)) sections.push(letter)
  }

  sections.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  return { sections, rejected }
}

/** Semester count as a whole number in range, or null when it is not usable. */
export function normalizeSemesterCount(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) return null
  const int = Math.trunc(n)
  if (int !== n) return null
  if (int < MIN_SEMESTERS || int > MAX_SEMESTERS) return null
  return int
}

/**
 * Read a stored config document, tolerating anything missing or malformed.
 * A college that has never saved the setting gets DEFAULT_COHORT_CONFIG, so
 * behaviour does not change until the college chooses to.
 */
export function cohortConfigFromDoc(data: unknown): CohortConfig {
  const raw = (data ?? {}) as Record<string, unknown>
  const { sections } = normalizeSectionList(raw.sections)
  const semesterCount = normalizeSemesterCount(raw.semesterCount)
  const requireSection = typeof raw.requireSection === 'boolean' ? raw.requireSection : undefined

  return {
    // An explicit EMPTY list is a real choice (a college with no section
    // split); only an entirely absent field falls back to the default.
    sections: raw.sections === undefined ? DEFAULT_COHORT_CONFIG.sections : sections,
    semesterCount: semesterCount ?? DEFAULT_COHORT_CONFIG.semesterCount,
    requireSection: requireSection ?? DEFAULT_COHORT_CONFIG.requireSection,
  }
}

/** A validated config plus the reasons it was rejected. */
export interface CohortConfigValidation {
  ok: boolean
  /** Human-readable problems, empty when ok. */
  errors: string[]
  /** Present even when !ok — the best reading of the input. */
  config: CohortConfig
}

/**
 * Validate a config a college is trying to save.
 *
 * Rejects what would make cohort matching impossible later: no sections while
 * requiring one, a section count beyond the alphabet, a semester count outside
 * the supported range. Entry-level typos are reported too (see
 * normalizeSectionList's `rejected`) so the college fixes the value at the
 * moment it types it, not when a roster comes back empty.
 */
export function validateCohortConfig(input: unknown): CohortConfigValidation {
  const raw = (input ?? {}) as Record<string, unknown>
  const errors: string[] = []

  const { sections, rejected } = normalizeSectionList(raw.sections)
  const semesterCount = normalizeSemesterCount(raw.semesterCount)
  const requireSection = typeof raw.requireSection === 'boolean' ? raw.requireSection : DEFAULT_COHORT_CONFIG.requireSection

  if (rejected.length > 0) {
    errors.push(
      `Not a section letter: ${rejected.join(', ')}. Use one letter per section (A, B, C…).`,
    )
  }
  if (requireSection && sections.length === 0) {
    errors.push('Add at least one section, or turn off "requires a section" for a college with no section split.')
  }
  if (semesterCount === null) {
    errors.push(`Semester count must be a whole number from ${MIN_SEMESTERS} to ${MAX_SEMESTERS}.`)
  }

  return {
    ok: errors.length === 0,
    errors,
    config: {
      sections,
      semesterCount: semesterCount ?? DEFAULT_COHORT_CONFIG.semesterCount,
      requireSection,
    },
  }
}

/**
 * The semester ids this college's vocabulary produces, for display and for
 * onboarding pickers: ["s01", "s02", …]. These are LABELS — the stored
 * `semester` field stays a number (see ./cohortKey for why an alphanumeric
 * semester stored on a document would match every student).
 */
export function semesterIds(config: CohortConfig): string[] {
  const count = config.semesterCount
  const out: string[] = []
  for (let i = 1; i <= count; i += 1) out.push(`s${String(i).padStart(2, '0')}`)
  return out
}

/** Is this semester number inside the college's declared range? */
export function semesterInRange(semester: unknown, config: CohortConfig): boolean {
  const n = typeof semester === 'number' ? semester : Number(String(semester ?? '').trim())
  if (!Number.isFinite(n)) return false
  const int = Math.trunc(n)
  if (int !== n || int < 1) return false
  return int <= config.semesterCount
}

/**
 * Is this section letter one the college declared?
 *
 * Blank is "not recorded" and returns true — a missing section is an
 * incomplete record, not an unknown section, and onboarding reports it
 * separately via cohortKeyIsComplete.
 */
export function sectionIsDeclared(section: unknown, config: CohortConfig): boolean {
  const { sections } = normalizeSectionList(section)
  if (sections.length === 0) return true
  return sections.every((letter) => config.sections.includes(letter))
}

// ─── Pass-out year ──────────────────────────────────────────────────────────

/** A college's admission year plus its programme length, in years. */
export function derivePassOutYear(admissionYear: number, programmeSemesters: number): number | null {
  if (!Number.isFinite(admissionYear) || !Number.isFinite(programmeSemesters)) return null
  if (programmeSemesters < 1) return null
  return admissionYear + Math.ceil(programmeSemesters / 2)
}

/**
 * How far ahead a pass-out year may be. Eight years covers a 4-year degree
 * plus a detained year and a gap year; beyond that it is a typo, not a cohort.
 */
export const MAX_YEARS_TO_PASS_OUT = 8

/**
 * Validate the pass-out year a college enters for a cohort.
 *
 * THE FIELD IS DELIBERATELY A SINGLE YEAR, NOT A RANGE. The batch canonicaliser
 * treats an academic-year RANGE as its end year ("2026-2027" → 2027) but a
 * three-year range ("2024-2027") stays literal so it cannot match by accident.
 * A college typing its programme range into the batch field therefore produced
 * a cohort that matched nobody. Asking for the pass-out year alone removes that
 * failure mode at the source.
 */
export function validatePassOutYear(
  value: unknown,
  options: { currentYear: number; maxYearsAhead?: number },
): { ok: boolean; year: number | null; error: string | null } {
  const { currentYear } = options
  const maxYearsAhead = options.maxYearsAhead ?? MAX_YEARS_TO_PASS_OUT
  const text = String(value ?? '').trim()

  if (!text) return { ok: false, year: null, error: 'Pass-out year is required.' }
  if (/\d\s*[-–—/]\s*\d/.test(text)) {
    return {
      ok: false,
      year: null,
      error: 'Enter the pass-out year on its own (2027), not a range (2024-2027).',
    }
  }
  if (!/^\d{4}$/.test(text)) {
    return { ok: false, year: null, error: 'Pass-out year must be four digits, e.g. 2027.' }
  }

  const year = Number(text)
  if (year < currentYear) {
    return { ok: false, year: null, error: `Pass-out year ${year} is in the past; this cohort has left.` }
  }
  if (year > currentYear + maxYearsAhead) {
    return {
      ok: false,
      year: null,
      error: `Pass-out year ${year} is more than ${maxYearsAhead} years away — check the intake year.`,
    }
  }
  return { ok: true, year, error: null }
}
