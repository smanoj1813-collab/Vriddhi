// functions/src/cohortKey.ts
//
// Cohort identity as ONE derived string — the durable key for
// (college, programme, batch, semester, section).
//
// WHY THIS EXISTS
// Cohort matching was an equality test over five loosely-typed fields, and the
// fields disagreed between writers: `"Section A"` vs `"A"`, `3` vs `"3"`,
// `"2026-2027"` vs `"2027"`. Every such disagreement silently emptied a roster
// or a student's day. The normalisers in ./cohortBatch and ./studentCurriculum
// FIX each disagreement individually, but nothing stops a new writer from
// introducing the next one — that is exactly how the same bug arrived twice.
//
// The fix is to make the identity DERIVED and STORED: one function computes the
// key from all known spellings, every writer calls it, and the matcher can
// compare two keys instead of five fields.
//
// THE SHAPE
//
//     collegeKey|programme|batch|semester|sections
//     vriddhi|bba|2027|s03|a,b
//
//   collegeKey  college id, folded (a blank college is "" — see below)
//   programme   normalised programme/branch ("B.B.A" = "bba")
//   batch       PASS-OUT YEAR, canonicalised via normalizeBatchKey so the
//               academic-year range "2026-2027" keys to "2027"
//   semester    "s" + zero-padded number: 3 = "3" = "s03"
//   sections    the section/division LETTERS as a sorted set, comma-joined:
//               "A,B,C,D" keys to "a,b,c,d"; "Section A" keys to "a"
//
// WHY THE KEY IS HIERARCHICAL, NOT FLAT
// A class may address SEVERAL sections — staff write "A,B,C,D" when one lecture
// covers four divisions. A student is in exactly one. So the key of such a
// class ("…|s03|a,b,c,d") is NOT equal to the key of the student in it
// ("…|s03|a"), and strict string equality would reject a class the current
// matcher correctly matches. The last segment is therefore a SET, and matching
// is segment-wise: the first four segments must be equal, and the SECTION SETS
// must INTERSECT. cohortKeyCovers() implements that; cohortKeysMatch() stays
// strict for exact identity checks (dedup, grouping, backfill verification).
//
// WHY THE SEGMENTS ARE UNPADDED AND FIXED-ORDER
// A key is only useful if two independently-written records produce the same
// string. Ordering the fields and sorting the letters removes the two ways a
// set-like value can be spelled differently while meaning the same thing.
//
// WHY THE SEMESTER IS "s03" AND NOT "s001"
// A stored alphanumeric semester is DANGEROUS: `Number("s001")` is NaN, which
// every existing matcher reads as "semester unknown" and treats as a WILDCARD.
// A class would then match every student instead of none. So `semester` MUST
// stay a number on documents; the "s03" form lives only inside this key.
//
// BLANK IS NOT WILDCARD HERE
// The existing matchers treat a blank FIELD as "no constraint". A KEY cannot:
// a key that omitted a blank segment would collide with a different cohort.
// Every segment is therefore always present, and a blank field keys to a blank
// segment (`"vriddhi|bba||s03|a"`). Two records that both omit the batch would
// collide — which is why cohortKeyIsComplete() exists and why the writer
// should refuse to store an incomplete key rather than store a colliding one.
// Callers that need wildcard semantics keep using the field matchers; this key
// is the strict identity, not the query.
//
// PURE: no Firestore, no Date, no console. Unit tested with zero setup.
// KEEP IN SYNC with src/shared/utils/cohortKey.ts — functions/test imports
// both and fails if they drift.

import {
  cohortLetters,
  normalizeBatchKey,
} from './cohortBatch.js'

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
    ...cohortLetters(fields.division),
    ...cohortLetters(fields.section),
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

/**
 * Derive the canonical cohort key. Always returns a well-formed key with five
 * segments; unknown fields are blank segments (see the header — a key must
 * never merge two cohorts by dropping a field).
 *
 *     cohortKey({ collegeId: 'vriddhi', branch: 'B.B.A', batch: '2026-2027',
 *                 semester: 3, section: 'Section A' })
 *       === 'vriddhi|bba|2027|s03|a'
 */
export function cohortKey(fields: CohortKeyFields): string {
  const parts = cohortKeyParts(fields)
  return [parts.college, parts.programme, parts.batch, parts.semester, parts.sections].join('|')
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
 * Does this key identify a class the platform can actually match on?
 *
 * The identity-defining fields are college, programme, batch, semester and
 * section. A key missing any of them is incomplete: two students from
 * different intakes with no batch recorded would produce the same key, so it
 * must not be treated as identity. The writer should refuse to persist an
 * incomplete key rather than persist a colliding one.
 *
 * Section is part of the identity check because a programme's sections are
 * distinct classes — but a programme with no section split is a real setup, so
 * `requireSection: false` covers it when a college records sections elsewhere.
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
 * Do two records name the same cohort, by key? STRICT identity — every segment
 * must be equal, section sets included.
 *
 * Use this for exact-identity questions: is this the same cohort I backfilled?
 * Are these two rows duplicates? Do NOT use it to ask "is this student in this
 * class" — a class covering "a,b,c,d" is a superset of the student in "a" and
 * would fail here. Use cohortKeyCovers() for that.
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
