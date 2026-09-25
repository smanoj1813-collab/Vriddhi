// src/modules/admin/api/financeApi.ts
//
// Per-college finance configuration: discount rules, discount stacking policy,
// late-fine policy and payment terms, stored at colleges/{id}/config/finance
// (staff-read / admin-write per Firestore rules). Plus a pure helper to resolve
// the academic score a score-based discount reads from.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { stripUndefined } from '@/shared/utils/firestoreClean'
import type {
  DiscountPolicy,
  DiscountRule,
  LateFinePolicy,
  PaymentTerms,
} from '../utils/financeRules'
import type { PaymentMode } from './feeApi'
import {
  DEFAULT_GUEST_BILLING_SETTINGS,
  type GuestBillingSettings,
} from '../utils/guestBilling'
import {
  DEFAULT_CERTIFICATE_SETTINGS,
  DEFAULT_PAYROLL_SETTINGS,
  type PayrollSettings,
} from '../utils/payrollEngine'

export const ALL_PAYMENT_MODES: PaymentMode[] = ['cash', 'upi', 'card', 'netbanking', 'cheque', 'dd']

export interface FinanceRulesDoc {
  discountRules: DiscountRule[]
  discountPolicy: DiscountPolicy
  lateFinePolicy: LateFinePolicy
  terms: PaymentTerms
  /** Payment modes the finance office accepts at the counter. */
  enabledPaymentModes: PaymentMode[]
  guestBilling: GuestBillingSettings
  payroll: PayrollSettings
  updatedAt?: string
}

export const DEFAULT_FINANCE_RULES: FinanceRulesDoc = {
  discountRules: [],
  discountPolicy: { stack: 'best_of' },
  lateFinePolicy: { enabled: false, graceDays: 0, type: 'per_day_flat', rate: 0 },
  terms: { termsText: '', installments: [] },
  enabledPaymentModes: ALL_PAYMENT_MODES,
  guestBilling: DEFAULT_GUEST_BILLING_SETTINGS,
  payroll: DEFAULT_PAYROLL_SETTINGS,
}

/**
 * Letterhead + receipt customisation. Stored in its own doc
 * (colleges/{id}/config/branding) because students and faculty also need it
 * to render receipts / payslips — the finance rules doc stays staff-only.
 */
export interface BrandingSettings {
  collegeName: string
  collegeCode: string
  address: string
  phone: string
  email: string
  website: string
  /** Optional tax / affiliation line printed under the address (e.g. GSTIN, affiliation no.). */
  registrationLine: string
  receiptTitle: string
  receiptPrefix: string
  receiptFooter: string
  signatoryName: string
  signatoryDesignation: string
  /** Print "Balance due" on fee receipts. */
  showBalanceOnReceipt: boolean
}

export const DEFAULT_BRANDING: BrandingSettings = {
  collegeName: '',
  collegeCode: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  registrationLine: '',
  receiptTitle: 'FEE PAYMENT RECEIPT',
  receiptPrefix: 'RCP',
  receiptFooter: 'This is a computer-generated receipt.',
  signatoryName: '',
  signatoryDesignation: 'Accounts Officer',
  showBalanceOnReceipt: true,
}

function resolveCollegeId(collegeId?: string | null): string {
  const id = (collegeId && collegeId.trim()) || localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college to scope finance settings to. Sign out and back in.')
  return id
}

function brandingRef(collegeId?: string | null) {
  return doc(db, 'colleges', resolveCollegeId(collegeId), 'config', 'branding')
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : v == null ? fallback : String(v)
}

/**
 * Load the college letterhead. Falls back to the college profile document
 * (name / code / address) so receipts are never titled just "College".
 */
export async function fetchBranding(collegeId?: string | null): Promise<BrandingSettings> {
  const id = resolveCollegeId(collegeId)
  const [brandSnap, collegeSnap] = await Promise.all([
    getDoc(brandingRef(id)).catch(() => null),
    getDoc(doc(db, 'colleges', id)).catch(() => null),
  ])
  const college = (collegeSnap && collegeSnap.exists() ? collegeSnap.data() : {}) as Record<string, unknown>
  const raw = (brandSnap && brandSnap.exists() ? brandSnap.data() : {}) as Record<string, unknown>
  const merged: BrandingSettings = { ...DEFAULT_BRANDING }
  for (const key of Object.keys(DEFAULT_BRANDING) as (keyof BrandingSettings)[]) {
    if (raw[key] != null) (merged as unknown as Record<string, unknown>)[key] = raw[key]
  }
  if (!merged.collegeName) merged.collegeName = str(college.name || college.collegeName)
  if (!merged.collegeCode) merged.collegeCode = str(college.code || college.collegeCode)
  if (!merged.address) {
    const addr = college.address
    merged.address = typeof addr === 'string'
      ? addr
      : addr && typeof addr === 'object'
        ? Object.values(addr as Record<string, unknown>).filter(v => typeof v === 'string' && v).join(', ')
        : [college.city, college.state].filter(Boolean).map(String).join(', ')
  }
  if (!merged.phone) merged.phone = str(college.phone || college.contactPhone)
  if (!merged.email) merged.email = str(college.email || college.contactEmail)
  return merged
}

/** Persist the letterhead (admin only — enforced by Firestore). */
export async function saveBranding(branding: BrandingSettings, collegeId?: string | null): Promise<void> {
  await setDoc(brandingRef(collegeId), { ...stripUndefined(branding), updatedAt: serverTimestamp() })
}

function financeRef(collegeId?: string | null) {
  return doc(db, 'colleges', resolveCollegeId(collegeId), 'config', 'finance')
}

function mergeObject<T extends object>(defaults: T, raw: unknown): T {
  return raw && typeof raw === 'object' ? { ...defaults, ...(raw as Partial<T>) } : { ...defaults }
}

/** Load the college's finance rules, falling back to sane defaults. */
export async function fetchFinanceRules(collegeId?: string | null): Promise<FinanceRulesDoc> {
  const snap = await getDoc(financeRef(collegeId))
  if (!snap.exists()) return DEFAULT_FINANCE_RULES
  const raw = snap.data() as Record<string, unknown>
  return {
    discountRules: Array.isArray(raw.discountRules) ? (raw.discountRules as DiscountRule[]) : [],
    discountPolicy: (raw.discountPolicy as DiscountPolicy) || DEFAULT_FINANCE_RULES.discountPolicy,
    lateFinePolicy: (raw.lateFinePolicy as LateFinePolicy) || DEFAULT_FINANCE_RULES.lateFinePolicy,
    terms: (raw.terms as PaymentTerms) || DEFAULT_FINANCE_RULES.terms,
    enabledPaymentModes: Array.isArray(raw.enabledPaymentModes) && raw.enabledPaymentModes.length
      ? (raw.enabledPaymentModes as PaymentMode[]).filter(m => ALL_PAYMENT_MODES.includes(m))
      : ALL_PAYMENT_MODES,
    guestBilling: mergeObject(DEFAULT_GUEST_BILLING_SETTINGS, raw.guestBilling),
    payroll: normalizePayroll(raw.payroll),
  }
}

function normalizePayroll(raw: unknown): PayrollSettings {
  const merged = mergeObject(DEFAULT_PAYROLL_SETTINGS, raw)
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    ...merged,
    components: Array.isArray(r.components) ? (r.components as PayrollSettings['components']) : DEFAULT_PAYROLL_SETTINGS.components,
    certificate: mergeObject(DEFAULT_CERTIFICATE_SETTINGS, r.certificate),
  }
}

/** Persist the college's finance rules (admin only — enforced by Firestore). */
export async function saveFinanceRules(rules: FinanceRulesDoc, collegeId?: string | null): Promise<void> {
  await setDoc(
    financeRef(collegeId),
    // Full overwrite (not merge): a merge would deep-merge maps, so a removed
    // key (e.g. a per-employment-type rate) could never be deleted.
    { ...stripUndefined(rules), updatedAt: serverTimestamp() },
  )
}

export interface ScoreSourceStudent {
  cgpa?: number
  academicScore?: number
  latestPercentage?: number
}

/**
 * Pure: resolve the academic score for a score-based discount from the chosen
 * source. 'manual' returns undefined so the caller can supply it per case.
 */
export function resolveAcademicScore(
  student: ScoreSourceStudent | null | undefined,
  source: 'profile' | 'assessment' | 'manual' = 'profile',
): number | undefined {
  if (source === 'manual') return undefined
  if (!student) return 0
  const raw = source === 'assessment'
    ? (student.latestPercentage ?? student.academicScore ?? student.cgpa)
    : (student.academicScore ?? student.cgpa)
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}
