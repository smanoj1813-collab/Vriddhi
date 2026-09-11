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
//   batch      schedule empty → no constraint; otherwise trimmed,
//                case-folded tokens must be equal ("2027" = 2027 = " 2027 ");
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

/** "Div A" / "division a" / "div. a" / "A" → "a". */
export function normalizeDivision(value: unknown): string {
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').replace(DIVISION_PREFIXES, '').trim()
}

/** "Section B" / "sec. b" / "B" → "b". */
export function normalizeSection(value: unknown): string {
  return foldText(value).replace(NOISE_PUNCT, '').replace(/\s+/g, ' ').replace(SECTION_PREFIXES, '').trim()
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
  const letters = [normalizeDivision(criteria.division), normalizeSection(criteria.section)]
  return letters.filter((l) => l !== '')
}

/** Letters the student is recorded under, from their division and section fields. */
function studentLetters(fields: StudentCohortFields): string[] {
  const letters = [normalizeDivision(fields.division), normalizeSection(fields.section)]
  return letters.filter((l) => l !== '')
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

  // Batch.
  const criterionBatch = normalizeCohortToken(criteria.batch)
  if (criterionBatch && normalizeCohortToken(fields.batch) !== criterionBatch) {
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
    // the UI can say which column to fix.
    if (normalizeDivision(fields.division) !== '' && !sched.includes(normalizeDivision(fields.division))) {
      mismatches.push('division')
    }
    if (normalizeSection(fields.section) !== '' && !sched.includes(normalizeSection(fields.section))) {
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
   * The distinct semesters among MATCHED students when the schedule does not
   * specify one; null when the schedule does (or nobody matched). A length > 1
   * here means the class is silently wider than intended.
   */
  matchedSemesters: string[] | null
}

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
      matchedSemesters: criterionSemesterKnown ? null : matchedSemesters,
    },
  }
}
