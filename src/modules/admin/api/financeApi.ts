// src/modules/admin/api/financeApi.ts
//
// Per-college finance configuration: discount rules, discount stacking policy,
// late-fine policy and payment terms, stored at colleges/{id}/config/finance
// (staff-read / admin-write per Firestore rules). Plus a pure helper to resolve
// the academic score a score-based discount reads from.

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import type {
  DiscountPolicy,
  DiscountRule,
  LateFinePolicy,
  PaymentTerms,
} from '../utils/financeRules'

export interface FinanceRulesDoc {
  discountRules: DiscountRule[]
  discountPolicy: DiscountPolicy
  lateFinePolicy: LateFinePolicy
  terms: PaymentTerms
  updatedAt?: string
}

export const DEFAULT_FINANCE_RULES: FinanceRulesDoc = {
  discountRules: [],
  discountPolicy: { stack: 'best_of' },
  lateFinePolicy: { enabled: false, graceDays: 0, type: 'per_day_flat', rate: 0 },
  terms: { termsText: '', installments: [] },
}

function financeRef(collegeId?: string | null) {
  const id = (collegeId && collegeId.trim()) || localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college to scope finance settings to. Sign out and back in.')
  return doc(db, 'colleges', id, 'config', 'finance')
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
  }
}

/** Persist the college's finance rules (admin only — enforced by Firestore). */
export async function saveFinanceRules(rules: FinanceRulesDoc, collegeId?: string | null): Promise<void> {
  await setDoc(
    financeRef(collegeId),
    { ...rules, updatedAt: serverTimestamp() },
    { merge: true },
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
