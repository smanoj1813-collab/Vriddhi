// src/shared/utils/apaar.ts
//
// APAAR (Automated Permanent Academic Account Registry) — the 12-digit
// "One Nation, One Student ID" that keys a student's Academic Bank of
// Credits (ABC) account. Universities increasingly refuse exam forms and
// DigiLocker/NAD result uploads for students whose APAAR ID is not on the
// college ERP, and UGC now closes each examination year's NAD-ABC upload
// window permanently. These helpers are pure so the admin completeness
// desk, the student profile editor and the CSV importer all agree on what
// a valid ID looks like.

/** Strip spaces/hyphens and any non-digit noise a pasted ID may carry. */
export function normalizeApaarId(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '')
}

/** APAAR/ABC IDs are exactly 12 digits. (No public checksum is specified.) */
export function isValidApaarId(raw: unknown): boolean {
  return /^\d{12}$/.test(normalizeApaarId(raw))
}

/** Human-friendly grouping for display: 1234 5678 9012. */
export function formatApaarId(raw: unknown): string {
  const d = normalizeApaarId(raw)
  return d.length === 12 ? `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}` : d
}

export interface ApaarStudentLike {
  apaarId?: string | null
  semester?: number | string | null
  course?: string | null
  department?: string | null
  branch?: string | null
}

export interface ApaarCompleteness {
  total: number
  withValidId: number
  withInvalidId: number
  missing: number
  /** 0–100, one decimal. */
  percent: number
  bySemester: Array<{ semester: number; total: number; withValidId: number; percent: number }>
  byProgramme: Array<{ programme: string; total: number; withValidId: number; percent: number }>
}

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

/** Completeness rollup for the admin desk: overall + per semester/programme. */
export function apaarCompleteness(students: ApaarStudentLike[]): ApaarCompleteness {
  let withValidId = 0
  let withInvalidId = 0
  const semMap = new Map<number, { total: number; ok: number }>()
  const progMap = new Map<string, { total: number; ok: number }>()
  for (const s of students) {
    const id = normalizeApaarId(s.apaarId)
    const valid = isValidApaarId(id)
    if (valid) withValidId += 1
    else if (id) withInvalidId += 1
    const sem = Number(s.semester) || 0
    const semRow = semMap.get(sem) || { total: 0, ok: 0 }
    semRow.total += 1
    if (valid) semRow.ok += 1
    semMap.set(sem, semRow)
    const prog = String(s.course || s.department || s.branch || '—').trim() || '—'
    const progRow = progMap.get(prog) || { total: 0, ok: 0 }
    progRow.total += 1
    if (valid) progRow.ok += 1
    progMap.set(prog, progRow)
  }
  const total = students.length
  return {
    total,
    withValidId,
    withInvalidId,
    missing: total - withValidId - withInvalidId,
    percent: pct(withValidId, total),
    bySemester: [...semMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([semester, r]) => ({ semester, total: r.total, withValidId: r.ok, percent: pct(r.ok, r.total) })),
    byProgramme: [...progMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([programme, r]) => ({ programme, total: r.total, withValidId: r.ok, percent: pct(r.ok, r.total) })),
  }
}

/** Students grouped by APAAR problem so the desk can work a named list. */
export function apaarWorklist<T extends ApaarStudentLike>(students: T[]): { missing: T[]; invalid: T[] } {
  const missing: T[] = []
  const invalid: T[] = []
  for (const s of students) {
    const id = normalizeApaarId(s.apaarId)
    if (!id) missing.push(s)
    else if (!isValidApaarId(id)) invalid.push(s)
  }
  return { missing, invalid }
}

/** Duplicate APAAR IDs (same ID on 2+ students) — a data-entry red flag. */
export function apaarDuplicates<T extends ApaarStudentLike & { id?: string }>(students: T[]): Array<{ apaarId: string; studentIds: string[] }> {
  const byId = new Map<string, string[]>()
  for (const s of students) {
    const id = normalizeApaarId(s.apaarId)
    if (!isValidApaarId(id)) continue
    const list = byId.get(id) || []
    list.push(String(s.id || ''))
    byId.set(id, list)
  }
  return [...byId.entries()].filter(([, ids]) => ids.length > 1).map(([apaarId, studentIds]) => ({ apaarId, studentIds }))
}
