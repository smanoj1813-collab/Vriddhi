// src/shared/utils/studentFilters.ts
//
// Client-side narrowing of an already-loaded student list, shared by the
// superadmin Student Management screen (batch / branch / section / search).
//
// WHY CLIENT-SIDE: `listStudents` fetches the whole (college-scoped) collection
// anyway and the fields it must match on are the same messy join keys the
// attendance roster normalises (`cohortMatching.ts`): "2027" = 2027, "BBA" =
// "B.B.A", "Div A" = "A". A Firestore `where()` cannot make those equal, and
// composite indexes would be required for every filter combination — so the
// filter runs over the loaded rows with the SAME normalisers the roster uses,
// keeping one definition of "the same cohort value" across the app.
//
// The `search` box previously did nothing at all: the page passed `search` to
// `listStudents`, which silently ignored it. Filtering here makes it real.

import {
  normalizeCohortToken,
  normalizeDivision,
  normalizeProgramName,
  normalizeSection,
} from './cohortMatching'

export interface StudentFilterRow {
  name?: unknown
  email?: unknown
  regNo?: unknown
  batch?: unknown
  /** Canonical program field. */
  branch?: unknown
  /** Legacy alias for branch written by older imports. */
  department?: unknown
  division?: unknown
  section?: unknown
}

export interface StudentListFilters {
  search?: string
  batch?: string
  branch?: string
  /**
   * Section/division letter. Matches a student recorded under EITHER field —
   * the same "letters form a set" semantics the attendance cohort matcher
   * uses, so a legacy row with only `section: "A"` is found by selecting "A".
   */
  section?: string
}

/**
 * Letters a student is recorded under, from their division and section fields.
 * Mirrors `studentLetters` in cohortMatching (kept local to avoid widening
 * that module's surface).
 */
function studentLetters(row: StudentFilterRow): string[] {
  return [normalizeDivision(row.division), normalizeSection(row.section)].filter((l) => l !== '')
}

function matchesSearch(row: StudentFilterRow, raw: string): boolean {
  const needle = raw.trim().toLowerCase()
  if (!needle) return true
  return [row.name, row.email, row.regNo].some((value) =>
    String(value ?? '')
      .trim()
      .toLowerCase()
      .includes(needle)
  )
}

/** True when the row passes every active filter (empty filter = no constraint). */
export function studentMatchesFilters(row: StudentFilterRow, filters: StudentListFilters): boolean {
  if (!matchesSearch(row, filters.search || '')) return false

  const batch = normalizeCohortToken(filters.batch)
  if (batch && normalizeCohortToken(row.batch) !== batch) return false

  const branch = normalizeProgramName(filters.branch)
  if (branch) {
    // `||` not `??` — a blank `branch` must fall through to the legacy
    // `department` alias, exactly like the roster matcher's field extraction.
    const rowBranch = normalizeProgramName(row.branch || row.department || '')
    if (rowBranch !== branch) return false
  }

  const section = normalizeSection(filters.section)
  if (section && !studentLetters(row).includes(section)) return false

  return true
}

/** Narrow a loaded list. Order is preserved. */
export function filterStudentRows<T extends StudentFilterRow>(
  rows: T[],
  filters: StudentListFilters
): T[] {
  return rows.filter((row) => studentMatchesFilters(row, filters))
}

export interface StudentFilterOptions {
  batches: string[]
  branches: string[]
  sections: string[]
}

function sortedDistinct(values: Iterable<string>): string[] {
  return [...new Set([...values].filter((value) => value.trim() !== ''))].sort((a, b) =>
    a.localeCompare(b, 'en', { numeric: true })
  )
}

/**
 * Distinct raw values to populate the filter dropdowns, de-duplicated on the
 * normalised key ("BBA" and "B.B.A" produce one option, the first spelling).
 */
export function studentFilterOptions(rows: StudentFilterRow[]): StudentFilterOptions {
  const batches = new Map<string, string>()
  const branches = new Map<string, string>()
  const sections = new Map<string, string>()

  for (const row of rows) {
    const batch = String(row.batch ?? '').trim()
    const batchKey = normalizeCohortToken(batch)
    if (batchKey && !batches.has(batchKey)) batches.set(batchKey, batch)

    const branch = String(row.branch || row.department || '').trim()
    const branchKey = normalizeProgramName(branch)
    if (branchKey && !branches.has(branchKey)) branches.set(branchKey, branch)

    for (const field of [row.division, row.section]) {
      const letter = String(field ?? '').trim()
      const letterKey = normalizeSection(letter)
      if (letterKey && !sections.has(letterKey)) sections.set(letterKey, letter)
    }
  }

  return {
    batches: sortedDistinct(batches.values()),
    branches: sortedDistinct(branches.values()),
    sections: sortedDistinct(sections.values()),
  }
}
