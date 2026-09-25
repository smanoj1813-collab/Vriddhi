// src/modules/admin/utils/payrollEngine.ts
//
// Pure, dependency-free faculty payroll engine. Every rate is DATA — the
// college defines its own salary components (earnings + deductions) in
// Finance Settings → Payroll, and each faculty member's salary structure only
// carries a basic pay plus optional per-person overrides. No Firebase import,
// so it unit-tests under `node --test` (see payrollEngine.test.ts).
//
// Also hosts the helpers the payslip / salary-certificate PDFs share:
// Indian-format amount-in-words and a tiny {{placeholder}} template renderer
// so the certificate wording is fully editable per college.

import { resolveBracket, type Bracket } from './financeRules'

// ── Shared ──────────────────────────────────────────────
export function round2(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

/** Round to the nearest `step` (1 = whole rupee, 10 = nearest ten …). 0/NaN → paise. */
export function roundTo(n: number, step: number | undefined): number {
  const s = Number(step)
  if (!Number.isFinite(s) || s <= 0) return round2(n)
  return Math.round(n / s) * s
}

// ── Configuration types ─────────────────────────────────
export type ComponentKind = 'earning' | 'deduction'
/**
 * fixed            — a flat monthly amount (`value`)
 * percent_of_basic — `value`% of basic (deductions use the LOP-adjusted basic)
 * percent_of_gross — `value`% of gross earnings (deductions only)
 * slab_on_gross    — flat amount picked from `brackets` by gross (e.g. Professional Tax)
 */
export type ComponentCalc = 'fixed' | 'percent_of_basic' | 'percent_of_gross' | 'slab_on_gross'

export interface SalaryComponent {
  id: string
  name: string
  /** Short code printed on the payslip (e.g. DA, HRA, PF, PT). */
  code?: string
  kind: ComponentKind
  calc: ComponentCalc
  value: number
  brackets?: Bracket[]
  /** Upper cap on the monthly amount (e.g. PF wage ceiling). */
  maxAmount?: number
  /** Reduce proportionally for loss-of-pay days. */
  prorate: boolean
  enabled: boolean
  /** Employment types this component applies to (empty/absent = all). */
  appliesTo?: string[]
}

export type LopBasis = 'calendar_days' | 'fixed_days'

export interface SalaryCertificateSettings {
  title: string
  /** Body text with {{placeholders}} — see CERTIFICATE_PLACEHOLDERS. */
  bodyTemplate: string
  signatoryName: string
  signatoryDesignation: string
  includeBreakdown: boolean
  certificatePrefix: string
  defaultPurpose: string
}

export interface PayrollSettings {
  components: SalaryComponent[]
  lopBasis: LopBasis
  /** Used when lopBasis = fixed_days (commonly 30 or 26). */
  fixedDaysPerMonth: number
  requireApproval: boolean
  payslipPrefix: string
  /** Round the net pay to this step (1 = rupee). */
  roundNetTo: number
  /** Footer printed on every payslip. */
  payslipFooter: string
  certificate: SalaryCertificateSettings
}

export const CERTIFICATE_PLACEHOLDERS = [
  'name', 'staffCode', 'designation', 'department', 'employmentType', 'joiningDate',
  'collegeName', 'collegeAddress', 'basic', 'monthlyGross', 'monthlyNet', 'monthlyDeductions',
  'annualGross', 'annualNet', 'monthlyGrossWords', 'annualGrossWords', 'purpose', 'date',
  'certificateNo', 'pan', 'bankName', 'accountNo', 'salaryMonth', 'pronoun', 'possessive', 'salutation',
] as const

export const DEFAULT_CERTIFICATE_SETTINGS: SalaryCertificateSettings = {
  title: 'SALARY CERTIFICATE',
  bodyTemplate:
    'This is to certify that {{salutation}} {{name}} (Staff Code: {{staffCode}}) is working as {{designation}} in the Department of {{department}} at {{collegeName}} since {{joiningDate}}.\n\n' +
    '{{possessive}} gross monthly salary is Rs. {{monthlyGross}} ({{monthlyGrossWords}}) and the net monthly salary after statutory deductions is Rs. {{monthlyNet}}. The annual gross salary is Rs. {{annualGross}}.\n\n' +
    'This certificate is issued on {{possessive}} request for the purpose of {{purpose}}.',
  signatoryName: '',
  signatoryDesignation: 'Principal',
  includeBreakdown: true,
  certificatePrefix: 'SC',
  defaultPurpose: 'bank loan',
}

export const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  components: [
    { id: 'da', name: 'Dearness Allowance', code: 'DA', kind: 'earning', calc: 'percent_of_basic', value: 0, prorate: true, enabled: false },
    { id: 'hra', name: 'House Rent Allowance', code: 'HRA', kind: 'earning', calc: 'percent_of_basic', value: 0, prorate: true, enabled: false },
    { id: 'pf', name: 'Provident Fund', code: 'PF', kind: 'deduction', calc: 'percent_of_basic', value: 12, maxAmount: 1800, prorate: false, enabled: false },
    {
      id: 'pt', name: 'Professional Tax', code: 'PT', kind: 'deduction', calc: 'slab_on_gross', value: 0, prorate: false, enabled: false,
      brackets: [{ min: 0, max: 24999, value: 0 }, { min: 25000, value: 200 }],
    },
  ],
  lopBasis: 'calendar_days',
  fixedDaysPerMonth: 30,
  requireApproval: true,
  payslipPrefix: 'PS',
  roundNetTo: 1,
  payslipFooter: 'This is a computer-generated payslip and does not require a signature.',
  certificate: DEFAULT_CERTIFICATE_SETTINGS,
}

// ── Inputs / outputs ────────────────────────────────────
export interface PayAdjustment {
  label: string
  amount: number
  kind: ComponentKind
}

export interface PayslipInput {
  basic: number
  /** componentId → flat monthly amount replacing the configured calculation (0 disables it). */
  overrides?: Record<string, number>
  employmentType?: string
  /** yyyy-MM */
  monthKey: string
  lopDays?: number
  /** One-off lines for this month only (arrears, bonus, advance recovery …). */
  adjustments?: PayAdjustment[]
}

export interface PayslipLine {
  componentId?: string
  code?: string
  label: string
  amount: number
}

export interface PayslipComputation {
  daysInPeriod: number
  lopDays: number
  paidDays: number
  earnings: PayslipLine[]
  deductions: PayslipLine[]
  gross: number
  totalDeductions: number
  net: number
}

/** Calendar days in `yyyy-MM` (0 for a malformed key). */
export function daysInMonth(monthKey: string): number {
  const [y, m] = String(monthKey || '').split('-').map(Number)
  if (!y || !m || m < 1 || m > 12) return 0
  return new Date(y, m, 0).getDate()
}

export function periodDays(monthKey: string, settings: Pick<PayrollSettings, 'lopBasis' | 'fixedDaysPerMonth'>): number {
  if (settings.lopBasis === 'fixed_days') {
    const n = Math.floor(Number(settings.fixedDaysPerMonth))
    return n > 0 ? n : 30
  }
  return daysInMonth(monthKey) || 30
}

export function componentApplies(component: SalaryComponent, employmentType?: string): boolean {
  if (!component || !component.enabled) return false
  if (component.appliesTo && component.appliesTo.length && employmentType) {
    return component.appliesTo.includes(employmentType)
  }
  return true
}

function cap(amount: number, max?: number): number {
  const m = Number(max)
  return max != null && Number.isFinite(m) && m >= 0 ? Math.min(amount, m) : amount
}

/** Pure: compute one faculty member's payslip for a month. */
export function computePayslip(input: PayslipInput, settings: PayrollSettings): PayslipComputation {
  const days = periodDays(input.monthKey, settings)
  const lopDays = Math.min(days, Math.max(0, Number(input.lopDays) || 0))
  const paidDays = days - lopDays
  const factor = days > 0 ? paidDays / days : 1
  const basicFull = Math.max(0, Number(input.basic) || 0)
  const basicEarned = round2(basicFull * factor)
  const overrides = input.overrides || {}
  const components = (settings.components || []).filter(c => componentApplies(c, input.employmentType))

  const earnings: PayslipLine[] = [{ componentId: 'basic', code: 'BASIC', label: 'Basic Pay', amount: basicEarned }]

  for (const c of components.filter(x => x.kind === 'earning')) {
    let amount: number
    if (Object.prototype.hasOwnProperty.call(overrides, c.id)) {
      amount = Math.max(0, Number(overrides[c.id]) || 0)
    } else if (c.calc === 'percent_of_basic') {
      amount = (basicFull * (Number(c.value) || 0)) / 100
    } else if (c.calc === 'fixed') {
      amount = Number(c.value) || 0
    } else {
      // percent_of_gross / slab_on_gross are circular for an earning — ignored.
      amount = 0
    }
    amount = cap(Math.max(0, amount), c.maxAmount)
    if (c.prorate) amount *= factor
    amount = round2(amount)
    if (amount > 0) earnings.push({ componentId: c.id, code: c.code, label: c.name, amount })
  }

  for (const adj of input.adjustments || []) {
    const amt = round2(Math.max(0, Number(adj.amount) || 0))
    if (adj.kind === 'earning' && amt > 0) earnings.push({ label: adj.label || 'Adjustment', amount: amt })
  }

  const gross = round2(earnings.reduce((s, l) => s + l.amount, 0))

  const deductions: PayslipLine[] = []
  for (const c of components.filter(x => x.kind === 'deduction')) {
    let amount: number
    if (Object.prototype.hasOwnProperty.call(overrides, c.id)) {
      amount = Math.max(0, Number(overrides[c.id]) || 0)
      if (c.prorate) amount *= factor
    } else {
      switch (c.calc) {
        case 'percent_of_basic':
          amount = (basicEarned * (Number(c.value) || 0)) / 100
          break
        case 'percent_of_gross':
          amount = (gross * (Number(c.value) || 0)) / 100
          break
        case 'slab_on_gross':
          amount = resolveBracket(c.brackets, gross, 0)
          break
        default:
          amount = (Number(c.value) || 0) * (c.prorate ? factor : 1)
      }
    }
    amount = round2(cap(Math.max(0, amount), c.maxAmount))
    if (amount > 0) deductions.push({ componentId: c.id, code: c.code, label: c.name, amount })
  }

  for (const adj of input.adjustments || []) {
    const amt = round2(Math.max(0, Number(adj.amount) || 0))
    if (adj.kind === 'deduction' && amt > 0) deductions.push({ label: adj.label || 'Recovery', amount: amt })
  }

  const totalDeductions = round2(deductions.reduce((s, l) => s + l.amount, 0))
  const net = Math.max(0, roundTo(gross - totalDeductions, settings.roundNetTo))

  return { daysInPeriod: days, lopDays, paidDays, earnings, deductions, gross, totalDeductions, net }
}

// ── Payslip lifecycle ───────────────────────────────────
export type PayslipStatus = 'draft' | 'approved' | 'paid' | 'cancelled'

export function canTransitionPayslip(from: PayslipStatus, to: PayslipStatus, requireApproval: boolean): boolean {
  if (from === to) return false
  switch (from) {
    case 'draft':
      return to === 'approved' || to === 'cancelled' || (to === 'paid' && !requireApproval)
    case 'approved':
      return to === 'paid' || to === 'draft' || to === 'cancelled'
    case 'cancelled':
      return to === 'draft'
    case 'paid':
    default:
      return false
  }
}

// ── Document numbering ──────────────────────────────────
/** e.g. docNumber('PS', '2026-09', 'fac123') → "PS-202609-FAC123". Deterministic per person/month. */
export function docNumber(prefix: string, monthKey: string, key: string): string {
  const p = (prefix || 'DOC').trim().toUpperCase().replace(/[^A-Z0-9/-]/g, '') || 'DOC'
  const m = String(monthKey || '').replace(/[^0-9]/g, '')
  const k = String(key || '').replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase()
  return [p, m, k].filter(Boolean).join('-')
}

// ── Amount in words (Indian numbering) ──────────────────
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigits(n: number): string {
  if (n < 20) return ONES[n]
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100)
  const r = n % 100
  return [h ? `${ONES[h]} Hundred` : '', r ? twoDigits(r) : ''].filter(Boolean).join(' ')
}

function integerToWords(n: number): string {
  if (n === 0) return 'Zero'
  const parts: string[] = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000
  if (crore) parts.push(`${integerToWords(crore)} Crore`)
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`)
  if (rest) parts.push(threeDigits(rest))
  return parts.join(' ')
}

/** 52340.5 → "Rupees Fifty Two Thousand Three Hundred Forty and Fifty Paise Only". */
export function amountInWords(amount: number): string {
  const value = Math.max(0, round2(Number(amount) || 0))
  const rupees = Math.floor(value)
  const paise = Math.round((value - rupees) * 100)
  const words = `Rupees ${integerToWords(rupees)}`
  return paise ? `${words} and ${twoDigits(paise)} Paise Only` : `${words} Only`
}

// ── Template rendering ──────────────────────────────────
/**
 * Replace {{key}} tokens (whitespace-tolerant). Missing keys render as "—" so
 * gaps are visible; an intentionally empty value ('') renders as nothing.
 */
export function renderTemplate(template: string, vars: Record<string, string | number | undefined | null>): string {
  return String(template || '')
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
      const v = vars[key]
      return v == null ? '—' : String(v)
    })
    .replace(/[ \t]{2,}/g, ' ')
}

export function formatINR(n: number): string {
  return (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Gender-aware pronouns for certificate wording (defaults to neutral). */
export function pronounsFor(gender?: string): { pronoun: string; possessive: string; salutation: string } {
  const g = String(gender || '').trim().toLowerCase()
  if (g === 'male' || g === 'm') return { pronoun: 'He', possessive: 'His', salutation: 'Mr.' }
  if (g === 'female' || g === 'f') return { pronoun: 'She', possessive: 'Her', salutation: 'Ms.' }
  return { pronoun: 'They', possessive: 'Their', salutation: '' }
}
