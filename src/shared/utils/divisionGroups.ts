import { cohortLetters } from './cohortMatching'

/**
 * Normalise the values used by division multi-selects and by the existing
 * comma-separated cohort field. The stored form stays plain text ("A,B");
 * the letters are not a new collection or an alternate identity system.
 */
export function divisionSelection(value: unknown): string[] {
  return cohortLetters(value, 'division').map((letter) => letter.toUpperCase())
}

export function divisionSelectionValue(value: unknown): string {
  return divisionSelection(value).join(',')
}

export function divisionSelectionLabel(value: unknown): string {
  const divisions = divisionSelection(value)
  return divisions.length > 0 ? divisions.join(' + ') : 'All divisions'
}

export function divisionOptions(values: readonly unknown[]): string[] {
  const divisions = new Set<string>()
  for (const value of values) {
    for (const letter of divisionSelection(value)) divisions.add(letter)
  }
  return [...divisions].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/** Gather both stored cohort fields while keeping the existing letter-list shape. */
export function divisionValuesFromStudentRecords(
  records: ReadonlyArray<{ division?: unknown; section?: unknown }>,
): string[] {
  return divisionOptions(records.flatMap((record) => [record.division, record.section]))
}

/** A readable cohort label for merged-scope roster diagnostics. */
export function teachingGroupScopeLabel(division?: unknown, section?: unknown): string {
  const groups = divisionSelection([division, section].filter(Boolean).join(','))
  if (groups.length === 0) return ''
  return groups.length > 1
    ? `Merged teaching group ${groups.join('+')}`
    : `Teaching group ${groups[0]}`
}

export function isMergedDivision(value: unknown): boolean {
  return divisionSelection(value).length > 1
}

export function mergedDivisionLabel(value: unknown): string {
  return divisionSelection(value).join('+')
}
