// src/modules/admin/utils/guestBilling.ts
//
// Pure helpers for the Guest Faculty Billing LEDGER (Phase 3). Karnataka degree
// colleges staff many sections with guest / part-time teachers paid PER
// PERIOD. The pay sheet is derived from the live weekly timetable (periods per
// weekday × occurrences in the month) and each bill can then be adjusted
// (extra / not-taken periods, one-off adjustments, TDS-style deduction) and
// moved through draft → approved → recorded. This is a billing ledger only —
// no money is moved by the app.
//
// No Firebase import, so it unit-tests under `node --test`.

import type { DayOfWeek, WeeklyClassSchedule } from '../types/schedule'

function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

// ── Settings ────────────────────────────────────────────
export interface GuestBillingSettings {
  /** Bills must be approved before they can be marked recorded. */
  requireApproval: boolean
  /** Fallback per-period rate when neither the contract nor the type sets one. */
  defaultPeriodRate: number
  /** employmentType (PART_TIME / ADJUNCT / VISITING / …) → per-period rate. */
  rateByEmploymentType: Record<string, number>
  /** Deduction withheld from every bill (e.g. TDS 10%). 0 = none. */
  deductionPercent: number
  deductionLabel: string
  /** Round the net bill to this step (1 = rupee). */
  roundTo: number
  billPrefix: string
  /** Hard cap on billable periods a guest can claim in a month (0 = no cap). */
  maxPeriodsPerMonth: number
  /** Printed at the foot of the bill PDF. */
  billFooter: string
}

export const DEFAULT_GUEST_BILLING_SETTINGS: GuestBillingSettings = {
  requireApproval: true,
  defaultPeriodRate: 0,
  rateByEmploymentType: {},
  deductionPercent: 0,
  deductionLabel: 'TDS',
  roundTo: 1,
  billPrefix: 'GFB',
  maxPeriodsPerMonth: 0,
  billFooter: 'Certified that the above periods were engaged as per the timetable.',
}

// ── Timetable derivation ────────────────────────────────
const DAY_INDEX: Record<DayOfWeek, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
}

/** Number of `dayOfWeek` occurrences inside month `yyyy-MM` (exact, calendar-safe). */
export function countWeekdayInMonth(monthKey: string, dayOfWeek: DayOfWeek): number {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) return 0
  const want = DAY_INDEX[dayOfWeek]
  if (want == null) return 0
  const days = new Date(y, m, 0).getDate()
  let count = 0
  for (let d = 1; d <= days; d++) {
    if (new Date(y, m - 1, d).getDay() === want) count++
  }
  return count
}

export interface GuestFacultyDoc {
  profileId: string
  uid: string
  staffCode: string
  name: string
  department: string
  designation?: string
  employmentType: string
  guestContract?: { startDate?: string; endDate?: string | null; periodRate?: number; notes?: string } | null
}

export interface BillingRow {
  profileId: string
  uid: string
  name: string
  staffCode: string
  department: string
  employmentType: string
  periodRate: number
  hoursPerWeek: number
  periodsInMonth: number
  amount: number
  contract: string
  expired: boolean
}

/** Resolve the per-period rate: contract → employment-type default → college default. */
export function resolveGuestRate(
  contractRate: number | undefined,
  employmentType: string,
  settings: Pick<GuestBillingSettings, 'rateByEmploymentType' | 'defaultPeriodRate'>,
): number {
  const c = Number(contractRate)
  if (Number.isFinite(c) && c > 0) return c
  const t = Number(settings.rateByEmploymentType?.[employmentType])
  if (Number.isFinite(t) && t > 0) return t
  const d = Number(settings.defaultPeriodRate)
  return Number.isFinite(d) && d > 0 ? d : 0
}

export function buildBillingRows(
  guests: GuestFacultyDoc[],
  schedules: WeeklyClassSchedule[],
  monthKey: string,
  settings: Pick<GuestBillingSettings, 'rateByEmploymentType' | 'defaultPeriodRate'> = DEFAULT_GUEST_BILLING_SETTINGS,
  todayIso: string = new Date().toISOString().slice(0, 10),
): BillingRow[] {
  return guests.map((g) => {
    const aliases = new Set([g.uid, g.profileId, g.staffCode].filter(Boolean).map((s) => s.toLowerCase()))
    const mine = schedules.filter(
      (s) => s.isActive !== false && aliases.has(String(s.facultyId || '').toLowerCase()),
    )

    let hoursPerWeek = 0
    let periodsInMonth = 0
    for (const s of mine) {
      hoursPerWeek++
      periodsInMonth += countWeekdayInMonth(monthKey, s.dayOfWeek)
    }

    const rate = resolveGuestRate(g.guestContract?.periodRate, g.employmentType, settings)
    const end = g.guestContract?.endDate ?? null
    return {
      profileId: g.profileId,
      uid: g.uid,
      name: g.name,
      staffCode: g.staffCode,
      department: g.department,
      employmentType: g.employmentType,
      periodRate: rate,
      hoursPerWeek,
      periodsInMonth,
      amount: round2(periodsInMonth * rate),
      contract: `${g.guestContract?.startDate || '—'} → ${end || 'ongoing'}`,
      expired: !!end && end < todayIso,
    }
  }).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
}

// ── Bill computation ────────────────────────────────────
export interface BillAdjustment {
  label: string
  /** Positive = addition (e.g. exam invigilation), negative = recovery. */
  amount: number
}

export interface GuestBillInput {
  scheduledPeriods: number
  extraPeriods?: number
  /** Periods on the timetable that were not engaged (leave, holiday, cancelled). */
  absentPeriods?: number
  rate: number
  adjustments?: BillAdjustment[]
}

export interface GuestBillTotals {
  billablePeriods: number
  periodAmount: number
  adjustmentsTotal: number
  grossAmount: number
  deductionAmount: number
  netAmount: number
  capped: boolean
}

export function computeGuestBill(
  input: GuestBillInput,
  settings: Pick<GuestBillingSettings, 'deductionPercent' | 'roundTo' | 'maxPeriodsPerMonth'>,
): GuestBillTotals {
  const scheduled = Math.max(0, Math.floor(Number(input.scheduledPeriods) || 0))
  const extra = Math.max(0, Math.floor(Number(input.extraPeriods) || 0))
  const absent = Math.max(0, Math.floor(Number(input.absentPeriods) || 0))
  let billable = Math.max(0, scheduled + extra - absent)
  const max = Math.floor(Number(settings.maxPeriodsPerMonth) || 0)
  const capped = max > 0 && billable > max
  if (capped) billable = max

  const rate = Math.max(0, Number(input.rate) || 0)
  const periodAmount = round2(billable * rate)
  const adjustmentsTotal = round2((input.adjustments || []).reduce((s, a) => s + (Number(a.amount) || 0), 0))
  const grossAmount = Math.max(0, round2(periodAmount + adjustmentsTotal))
  const pct = Math.min(100, Math.max(0, Number(settings.deductionPercent) || 0))
  const deductionAmount = round2((grossAmount * pct) / 100)
  const step = Number(settings.roundTo)
  const rawNet = grossAmount - deductionAmount
  const netAmount = Math.max(0, Number.isFinite(step) && step > 0 ? Math.round(rawNet / step) * step : round2(rawNet))

  return { billablePeriods: billable, periodAmount, adjustmentsTotal, grossAmount, deductionAmount, netAmount, capped }
}

// ── Lifecycle ───────────────────────────────────────────
export type GuestBillStatus = 'draft' | 'approved' | 'recorded' | 'cancelled'

/** Allowed status moves. `recorded` is final — the ledger entry is closed. */
export function canTransitionBill(from: GuestBillStatus, to: GuestBillStatus, requireApproval: boolean): boolean {
  if (from === to) return false
  switch (from) {
    case 'draft':
      return to === 'approved' || to === 'cancelled' || (to === 'recorded' && !requireApproval)
    case 'approved':
      return to === 'recorded' || to === 'draft' || to === 'cancelled'
    case 'cancelled':
      return to === 'draft'
    case 'recorded':
    default:
      return false
  }
}

/** Deterministic Firestore id: one bill per guest per month. */
export function guestBillId(monthKey: string, profileId: string): string {
  return `${monthKey}_${String(profileId).replace(/[^A-Za-z0-9_-]/g, '')}`
}

export function billingRowsToCsv(rows: BillingRow[], monthKey: string): string {
  const q = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
  const header = 'Name,Staff Code,Department,Employment,Rate/Period,Periods/Week,Periods in Month,Amount (INR),Contract'
  const lines = rows.map((r) =>
    [q(r.name), r.staffCode, q(r.department), r.employmentType, r.periodRate, r.hoursPerWeek, r.periodsInMonth, r.amount, q(r.contract)].join(','),
  )
  const total = rows.reduce((s, r) => s + r.amount, 0)
  return [`Guest faculty billing — ${monthKey}`, header, ...lines, `,,,,,,TOTAL,${total},`].join('\n')
}
