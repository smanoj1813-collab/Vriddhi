// src/modules/admin/utils/financeRules.ts
//
// Pure, dependency-free finance rules engine for college fees: discounts
// (category / academic-score bracket / management / custom), late-payment
// fines, reusable brackets, and payment-terms/installment schedules.
//
// Everything is DATA-DRIVEN so a college can customise every rate without a
// code change (the persisted config lives in a per-college `financeRules` doc;
// see financeApi in a later phase). No Firebase import, so it unit-tests under
// `node --test` (same pattern as assessmentStats.ts / feeReference.ts).

// ── Shared ──────────────────────────────────────────────
function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

// ── Brackets (slabs) ────────────────────────────────────
export interface Bracket {
  /** Inclusive lower bound of the slab. */
  min: number
  /** Inclusive upper bound; omit (or leave undefined) for the open top slab. */
  max?: number
  /** The value this slab maps to (e.g. a discount %, a fine rate). */
  value: number
}

/**
 * Pure: the value of the bracket that `input` falls into. Brackets are expected
 * to be non-overlapping; the first matching slab wins. Returns `fallback` when
 * nothing matches (e.g. a score below the lowest slab).
 */
export function resolveBracket(brackets: Bracket[] | undefined, input: number, fallback = 0): number {
  if (!Array.isArray(brackets)) return fallback
  const value = Number(input)
  if (!Number.isFinite(value)) return fallback
  const hit = brackets.find(b => value >= b.min && (b.max == null || value <= b.max))
  return hit ? hit.value : fallback
}

// ── Discounts ───────────────────────────────────────────
export type DiscountType = 'category' | 'academic_score' | 'management' | 'custom'
export type DiscountValueType = 'percent' | 'flat'
/** best_of = only the single largest discount applies; cumulative = sum them. */
export type StackPolicy = 'best_of' | 'cumulative'

export interface DiscountRule {
  id: string
  type: DiscountType
  label: string
  enabled: boolean
  valueType: DiscountValueType
  /** percent (0-100) or flat amount, for category/custom rules. */
  value: number
  /** academic_score: slabs mapping a score → discount percent. */
  brackets?: Bracket[]
  /** category/custom: student categories this applies to (empty = all). */
  categories?: string[]
  /** courses this applies to (empty = all). */
  courses?: string[]
  /** academic_score only: where the caller should read the score from. */
  scoreSource?: 'profile' | 'assessment' | 'manual'
}

export interface DiscountPolicy {
  stack: StackPolicy
  /** Cap on total discount as a percent of base (cumulative only). */
  maxPercent?: number
  /** Cap on total discount as a flat amount. */
  maxFlat?: number
}

export interface DiscountInput {
  baseAmount: number
  studentCategory?: string
  course?: string
  /** Resolved academic score (0-100 or CGPA) supplied by the caller. */
  academicScore?: number
  /** Admin-granted discretionary amount for a management rule (flat). */
  managementDiscount?: number
}

export interface AppliedDiscount {
  ruleId: string
  label: string
  type: DiscountType
  amount: number
}

export interface DiscountResult {
  applied: AppliedDiscount[]
  totalDiscount: number
  netBase: number
}

/** Pure: does this rule apply to the given student/course at all? */
export function ruleApplies(rule: DiscountRule, input: DiscountInput): boolean {
  if (!rule || !rule.enabled) return false
  if (rule.courses && rule.courses.length && input.course && !rule.courses.includes(input.course)) return false
  if ((rule.type === 'category' || rule.type === 'custom') && rule.categories && rule.categories.length) {
    if (!input.studentCategory || !rule.categories.includes(input.studentCategory)) return false
  }
  return true
}

/** Pure: the flat discount amount a single rule yields for the input (0 if N/A). */
export function discountForRule(rule: DiscountRule, input: DiscountInput): number {
  if (!ruleApplies(rule, input)) return 0
  const base = Math.max(0, Number(input.baseAmount) || 0)
  switch (rule.type) {
    case 'academic_score': {
      if (input.academicScore == null || !rule.brackets || !rule.brackets.length) return 0
      const percent = Math.max(0, resolveBracket(rule.brackets, input.academicScore, 0))
      return round2((base * percent) / 100)
    }
    case 'management': {
      const amt = Math.max(0, Number(input.managementDiscount) || 0)
      return round2(Math.min(amt, base))
    }
    case 'category':
    case 'custom':
    default:
      return rule.valueType === 'percent'
        ? round2((base * Math.max(0, rule.value)) / 100)
        : round2(Math.min(Math.max(0, rule.value), base))
  }
}

/** Pure: apply the whole rule set under a stacking policy, respecting caps. */
export function applyDiscounts(
  rules: DiscountRule[] | undefined,
  policy: DiscountPolicy,
  input: DiscountInput,
): DiscountResult {
  const base = Math.max(0, Number(input.baseAmount) || 0)
  const candidates: AppliedDiscount[] = (rules || [])
    .filter(r => r && r.enabled)
    .map(r => ({ ruleId: r.id, label: r.label, type: r.type, amount: discountForRule(r, input) }))
    .filter(d => d.amount > 0)

  let chosen: AppliedDiscount[]
  if (policy && policy.stack === 'cumulative') {
    chosen = candidates
  } else {
    const best = candidates.reduce<AppliedDiscount | null>((a, b) => (a && a.amount >= b.amount ? a : b), null)
    chosen = best ? [best] : []
  }

  let total = round2(chosen.reduce((s, d) => s + d.amount, 0))
  if (policy && policy.maxPercent != null) total = Math.min(total, round2((base * policy.maxPercent) / 100))
  if (policy && policy.maxFlat != null) total = Math.min(total, policy.maxFlat)
  total = Math.min(total, base)
  return { applied: chosen, totalDiscount: round2(total), netBase: round2(base - total) }
}

// ── Late-payment fines ──────────────────────────────────
export type LateFineType = 'per_day_percent' | 'per_day_flat' | 'fixed' | 'bracket'

export interface LateFinePolicy {
  enabled: boolean
  /** Days after the due date before any fine accrues. */
  graceDays: number
  type: LateFineType
  /** per_day_percent: % of outstanding/day. per_day_flat: ₹/day. fixed: one-time ₹. */
  rate: number
  /** bracket: slabs mapping days-overdue → fine. */
  brackets?: Bracket[]
  /** whether bracket values are a percent of outstanding or a flat amount. */
  bracketValueType?: 'percent' | 'flat'
  /** Maximum fine (flat cap). */
  maxFine?: number
}

export interface LateFineResult {
  daysOverdue: number
  fine: number
}

/** Pure: whole days from dueDate to asOf (YYYY-MM-DD); 0 when not overdue. */
export function daysOverdue(dueDate: string, asOf: string): number {
  const d = Date.parse(`${dueDate}T00:00:00Z`)
  const a = Date.parse(`${asOf}T00:00:00Z`)
  if (!Number.isFinite(d) || !Number.isFinite(a)) return 0
  return Math.max(0, Math.round((a - d) / 86400000))
}

/** Pure: the late fine owed on `outstanding` as of `asOf`. */
export function computeLateFine(
  policy: LateFinePolicy,
  outstanding: number,
  dueDate: string,
  asOf: string,
): LateFineResult {
  const amt = Math.max(0, Number(outstanding) || 0)
  const overdue = daysOverdue(dueDate, asOf)
  if (!policy || !policy.enabled || amt <= 0 || overdue <= (policy.graceDays || 0)) {
    return { daysOverdue: overdue, fine: 0 }
  }
  const chargeableDays = overdue - (policy.graceDays || 0)
  let fine = 0
  switch (policy.type) {
    case 'per_day_percent':
      fine = (amt * policy.rate * chargeableDays) / 100
      break
    case 'per_day_flat':
      fine = policy.rate * chargeableDays
      break
    case 'fixed':
      fine = policy.rate
      break
    case 'bracket': {
      const v = resolveBracket(policy.brackets, overdue, 0)
      fine = policy.bracketValueType === 'percent' ? (amt * v) / 100 : v
      break
    }
  }
  if (policy.maxFine != null) fine = Math.min(fine, policy.maxFine)
  return { daysOverdue: overdue, fine: round2(Math.max(0, fine)) }
}

// ── Payment terms / installments ────────────────────────
export interface Installment {
  label: string
  /** percent of net payable (0-100); ignored when `amount` is set. */
  percent?: number
  /** flat amount for this installment. */
  amount?: number
  dueDate: string
}

export interface PaymentTerms {
  /** Free-text terms shown to the student. */
  termsText?: string
  installments: Installment[]
}

export interface ScheduleRow {
  label: string
  amount: number
  dueDate: string
}

/**
 * Pure: expand percentage/amount installments into concrete amounts that sum to
 * `netAmount`. The last installment absorbs any rounding remainder.
 */
export function buildSchedule(terms: PaymentTerms | undefined, netAmount: number): ScheduleRow[] {
  const net = Math.max(0, Number(netAmount) || 0)
  const inst = (terms?.installments || []).filter(i => i && i.label)
  if (!inst.length) return [{ label: 'Full payment', amount: round2(net), dueDate: '' }]
  const rows: ScheduleRow[] = []
  let assigned = 0
  inst.forEach((i, idx) => {
    const isLast = idx === inst.length - 1
    const remaining = round2(net - assigned)
    let amount = isLast
      ? remaining
      : i.amount != null
        ? Math.min(round2(Number(i.amount) || 0), remaining)
        : round2((net * (Number(i.percent) || 0)) / 100)
    amount = round2(Math.max(0, amount))
    assigned = round2(assigned + amount)
    rows.push({ label: i.label, amount, dueDate: i.dueDate || '' })
  })
  return rows
}

// ── Orchestration ───────────────────────────────────────
export interface FinanceContext {
  baseAmount: number
  dueDate: string
  asOf: string
  studentCategory?: string
  course?: string
  academicScore?: number
  managementDiscount?: number
  discountRules: DiscountRule[]
  discountPolicy: DiscountPolicy
  lateFinePolicy: LateFinePolicy
}

export interface FinanceBreakdown {
  base: number
  discounts: AppliedDiscount[]
  totalDiscount: number
  netBase: number
  lateFine: number
  daysOverdue: number
  payable: number
}

/** Pure: base − discounts + late-fine = payable, with the full audit trail. */
export function computeFinance(ctx: FinanceContext): FinanceBreakdown {
  const base = Math.max(0, Number(ctx.baseAmount) || 0)
  const d = applyDiscounts(ctx.discountRules, ctx.discountPolicy, {
    baseAmount: base,
    studentCategory: ctx.studentCategory,
    course: ctx.course,
    academicScore: ctx.academicScore,
    managementDiscount: ctx.managementDiscount,
  })
  const lf = computeLateFine(ctx.lateFinePolicy, d.netBase, ctx.dueDate, ctx.asOf)
  return {
    base: round2(base),
    discounts: d.applied,
    totalDiscount: d.totalDiscount,
    netBase: d.netBase,
    lateFine: lf.fine,
    daysOverdue: lf.daysOverdue,
    payable: round2(d.netBase + lf.fine),
  }
}

/**
 * Pure: the amount still owed on a fee after discounts and late fines —
 * max(0, amount − discount) + lateFine − already paid. Mirrors the discount-
 * aware balance used by collectPayment / verifyPaymentProof in feeApi.
 */
export function feeNetPayable(fee: {
  amount: unknown
  paidAmount: unknown
  discountTotal?: unknown
  lateFine?: unknown
}): number {
  const amount = Math.max(0, Number(fee.amount) || 0)
  const discount = Math.max(0, Number(fee.discountTotal) || 0)
  const lateFine = Math.max(0, Number(fee.lateFine) || 0)
  const paid = Math.max(0, Number(fee.paidAmount) || 0)
  return round2(Math.max(0, amount - discount) + lateFine - paid)
}
