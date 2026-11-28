// src/shared/utils/cohortKey.ts
//
// Cohort identity as ONE derived string — the browser copy. See
// functions/src/cohortKey.ts for the full rationale; the two copies must
// produce byte-identical keys, and functions/test/cohortKey.test.ts asserts it.
//
//     collegeKey|programme|batch|semester|sections
//     vriddhi|bba|2027|s03|a,b
//
// The key is HIERARCHICAL, not flat: a class may address several sections
// ("a,b,c,d") and must still match the student in "a". Matching therefore uses
// cohortKeyCovers(); cohortKeysMatch() is strict equality for exact identity.
// See functions/src/cohortKey.ts for the full rationale.
//
// The only difference from the server copy is the import site: this one builds
// on ./cohortMatching (the browser matcher module) rather than the server's
// cohortBatch. Both expose the same normalisers, including the semantic guard
// that imports in functions/ cannot reach across into src/.
//
// WHY THE SEMESTER IS "s03" AND NOT "s001"
// A stored alphanumeric semester is DANGEROUS: normalizeSemester("s001") is
// null, which the browser matcher reads as "unknown" and treats as a WILDCARD.
// A class would then match every student instead of none. So `semester` MUST
// stay numeric on documents; the padded form lives only inside this key.

import { cohortLetters, normalizeBatchKey } from './cohortMatching'

/** Punctuation importers disagree about — dropped, not space-converted. */
const NOISE_PUNCT = /[.,;:'’"·]+/g

/**
 * Programme name key: "B.B.A" → "bba", "BBA " → "bba", "M. Tech" → "m tech".
 * Internal whitespace is preserved so "BBA IT" stays distinct from "BBA".
 */
export function normalizeProgrammeKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(NOISE_PUNCT, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * College id key. Ids are opaque, so only surrounding whitespace and case are
 * normalised — punctuation is NOT stripped (an id may legitimately contain it).
 */
export function normalizeCollegeKey(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '-')
}

/**
 * Semester key: 3, "3", " 3 ", 3.0 → "s03". Anything that is not a positive
 * whole number → "" (unknown). Deliberately NOT `parseInt`, which would read
 * "3rd" as semester 3 and turn a typo into a real cohort.
 */
export function semesterKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) return ''
  const int = Math.trunc(n)
  if (int < 1 || int !== n) return ''
  return `s${String(int).padStart(2, '0')}`
}

/** The cohort fields a key is derived from — any object carrying them. */
export interface CohortKeyFields {
  collegeId?: unknown
  /** Programme/branch; `department` is the bulk-import fallback. */
  branch?: unknown
  department?: unknown
  /** Pass-out year — a bare year, or the academic-year range ending in it. */
  batch?: unknown
  semester?: unknown
  division?: unknown
  section?: unknown
}

/**
 * Every section/division letter a record holds, as a sorted, de-duplicated,
 * comma-joined set: "Section A" → "a"; "A,B,C,D" → "a,b,c,d"; "Div B" → "b".
 *
 * Division and section are UNIONED because records split one letter across
 * the two fields (the same rule divisionScopesOverlap applies). Sorting makes
 * the key order-independent: "B,A" and "A,B" are one cohort.
 */
export function sectionsKey(fields: CohortKeyFields): string {
  const letters = [
    ...cohortLetters(fields.division, 'division'),
    ...cohortLetters(fields.section, 'section'),
  ]
  const unique = [...new Set(letters)].filter(Boolean).sort()
  return unique.join(',')
}

/** The segments of a cohort key, for diagnostics and validation. */
export interface CohortKeyParts {
  college: string
  programme: string
  batch: string
  semester: string
  sections: string
}

/** The key's segments, each already normalised. */
export function cohortKeyParts(fields: CohortKeyFields): CohortKeyParts {
  const programmeSource = fields.branch ?? fields.department
  return {
    college: normalizeCollegeKey(fields.collegeId),
    programme: normalizeProgrammeKey(programmeSource),
    batch: normalizeBatchKey(fields.batch),
    semester: semesterKey(fields.semester),
    sections: sectionsKey(fields),
  }
}

/**
 * Derive the canonical cohort key. Always returns a well-formed key with five
 * segments; unknown fields are blank segments (a key must never merge two
 * cohorts by dropping a field).
 *
 *     cohortKey({ collegeId: 'vriddhi', branch: 'B.B.A', batch: '2026-2027',
 *                 semester: 3, section: 'Section A' })
 *       === 'vriddhi|bba|2027|s03|a'
 */
export function cohortKey(fields: CohortKeyFields): string {
  const parts = cohortKeyParts(fields)
  return [parts.college, parts.programme, parts.batch, parts.semester, parts.sections].join('|')
}

/**
 * Does this key identify a class the platform can actually match on?
 *
 * The identity-defining fields are college, programme, batch, semester and
 * section. A key missing any of them is incomplete: two students from
 * different intakes with no batch recorded would produce the same key, so it
 * must not be treated as identity.
 */
export function cohortKeyIsComplete(
  fields: CohortKeyFields,
  options: { requireSection?: boolean } = {},
): boolean {
  const { requireSection = true } = options
  const parts = cohortKeyParts(fields)
  if (!parts.college || !parts.programme || !parts.batch || !parts.semester) return false
  if (requireSection && !parts.sections) return false
  return true
}

/**
 * Do two records name the same cohort, by key? This is the strict identity
 * comparison. It is NOT a wildcard query — use sessionMatchesCohort /
 * matchStudentToCohort when a blank field should mean "any".
 */
export function cohortKeysMatch(left: unknown, right: unknown): boolean {
  return String(left ?? '') === String(right ?? '')
}

/** The first four segments (identity) and the section set, split apart. */
function splitKey(key: unknown): { identity: string; sections: string[] } {
  const text = String(key ?? '')
  const parts = text.split('|')
  if (parts.length !== 5) return { identity: text, sections: [] }
  const sections = parts[4].split(',').filter(Boolean)
  return { identity: parts.slice(0, 4).join('|'), sections }
}

/**
 * Does the cohort `container` address a cohort that contains `member`?
 *
 * This is the matching primitive. The first four segments (college, programme,
 * batch, semester) must be IDENTICAL — a class cannot cross programmes, intakes
 * or semesters. The section sets then follow the existing set rule: a member in
 * section "a" is covered by a container for "a", "a,b" or "a,b,c,d"; a blank
 * section set on either side is a wildcard, matching the
 * divisionScopesOverlap rule the current matchers already use.
 *
 *     cohortKeyCovers('vriddhi|bba|2027|s03|a,b,c,d', 'vriddhi|bba|2027|s03|a') === true
 *     cohortKeyCovers('vriddhi|bba|2027|s03|a',       'vriddhi|bba|2027|s03|a') === true
 *     cohortKeyCovers('vriddhi|bba|2027|s03|e',       'vriddhi|bba|2027|s03|a') === false
 */
export function cohortKeyCovers(container: unknown, member: unknown): boolean {
  const left = splitKey(container)
  const right = splitKey(member)
  if (left.identity !== right.identity) return false
  if (left.sections.length === 0 || right.sections.length === 0) return true
  return right.sections.every((letter) => left.sections.includes(letter))
}
