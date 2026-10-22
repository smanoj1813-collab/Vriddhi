// functions/src/promotionCore.ts
//
// Pure semester-promotion logic: who moves up, who is detained, who
// graduates — and each student's live backlog list. Universities differ
// (carryover limits, critical subjects), so the rule is a simple,
// college-visible policy the principal sets on the Promotion screen:
// a student may carry at most N backlogs into the next semester, and
// graduation needs every subject cleared. Staff can override per
// student in the preview before anything is written.

export interface PromotionPolicy {
  /** A student with MORE backlogs than this is detained (repeats the semester). */
  maxBacklogsToPromote: number
  /** Final-semester students graduate only with zero backlogs. */
  requireAllClearForGraduation: boolean
  /** Total semesters in the programme (UG = 6 or 8, PG = 4). */
  programmeSemesters: number
}

export const DEFAULT_PROMOTION_POLICY: PromotionPolicy = {
  maxBacklogsToPromote: 4,
  requireAllClearForGraduation: true,
  programmeSemesters: 6,
}

export interface GradeLite {
  subjectCode?: string
  subjectName?: string
  semester?: number
  grade?: string
  gradePoint?: number
  result?: string
  createdAt?: string
  updatedAt?: string
}

export interface BacklogSubject { subjectCode: string; subjectName: string; semester: number }

const FAIL_GRADES = new Set(['F', 'FAIL', 'FAILED', 'ABSENT', 'AB', 'NE', 'W'])

export function isFail(r: GradeLite): boolean {
  const result = String(r.result || '').trim().toUpperCase()
  if (result) return result === 'FAIL' || result === 'F' || result === 'FAILED'
  if ((Number(r.gradePoint) || 0) <= 0) return true
  return FAIL_GRADES.has(String(r.grade || '').trim().toUpperCase())
}

/**
 * Live backlogs: the LATEST published record per subject decides, so a
 * subject cleared in a supplementary attempt drops off the list.
 */
export function liveBacklogs(records: GradeLite[]): BacklogSubject[] {
  const latest = new Map<string, GradeLite>()
  for (const r of records) {
    const key = (String(r.subjectCode || '').trim() || String(r.subjectName || '').trim()).toUpperCase()
    if (!key) continue
    const prev = latest.get(key)
    const ts = (x: GradeLite) => String(x.updatedAt || x.createdAt || '')
    if (!prev || ts(r) >= ts(prev)) latest.set(key, r)
  }
  const out: BacklogSubject[] = []
  for (const r of latest.values()) {
    if (isFail(r)) {
      out.push({
        subjectCode: String(r.subjectCode || '').trim(),
        subjectName: String(r.subjectName || '').trim(),
        semester: Number(r.semester) || 0,
      })
    }
  }
  return out.sort((a, b) => a.semester - b.semester || a.subjectCode.localeCompare(b.subjectCode))
}

export type PromotionAction = 'promote' | 'detain' | 'graduate' | 'repeat_final' | 'skip'

export interface PromotionVerdict {
  action: PromotionAction
  fromSemester: number
  toSemester: number
  backlogs: BacklogSubject[]
  reason: string
}

export function isActiveStudent(status: unknown): boolean {
  const s = String(status || 'active').trim().toLowerCase()
  return !['alumni', 'dropped', 'suspended', 'graduated', 'passed out', 'passout'].includes(s)
}

export function evaluatePromotion(
  student: { semester?: number; status?: string },
  records: GradeLite[],
  policy: PromotionPolicy,
): PromotionVerdict {
  const semester = Number(student.semester) || 1
  const backlogs = liveBacklogs(records)
  if (!isActiveStudent(student.status)) {
    return { action: 'skip', fromSemester: semester, toSemester: semester, backlogs, reason: `Not an active student (${String(student.status || '—')})` }
  }
  if (semester >= policy.programmeSemesters) {
    if (policy.requireAllClearForGraduation && backlogs.length > 0) {
      return { action: 'repeat_final', fromSemester: semester, toSemester: semester, backlogs, reason: `${backlogs.length} backlog${backlogs.length === 1 ? '' : 's'} to clear before graduation` }
    }
    return { action: 'graduate', fromSemester: semester, toSemester: semester, backlogs, reason: 'Completed the final semester' }
  }
  if (backlogs.length > policy.maxBacklogsToPromote) {
    return {
      action: 'detain', fromSemester: semester, toSemester: semester, backlogs,
      reason: `${backlogs.length} backlogs exceed the carryover limit of ${policy.maxBacklogsToPromote}`,
    }
  }
  return {
    action: 'promote', fromSemester: semester, toSemester: semester + 1, backlogs,
    reason: backlogs.length ? `Promoted with ${backlogs.length} backlog${backlogs.length === 1 ? '' : 's'} (within carryover limit)` : 'All subjects clear',
  }
}

export function normalizePolicy(raw: unknown): PromotionPolicy {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const clamp = (n: number, lo: number, hi: number, fb: number) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : fb)
  return {
    maxBacklogsToPromote: clamp(Number(p.maxBacklogsToPromote), 0, 40, DEFAULT_PROMOTION_POLICY.maxBacklogsToPromote),
    requireAllClearForGraduation: p.requireAllClearForGraduation === undefined ? true : p.requireAllClearForGraduation === true,
    programmeSemesters: clamp(Number(p.programmeSemesters), 1, 12, DEFAULT_PROMOTION_POLICY.programmeSemesters),
  }
}
