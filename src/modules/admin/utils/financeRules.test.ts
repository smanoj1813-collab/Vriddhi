// src/modules/admin/utils/financeRules.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)
// Locks the finance rules engine — discounts, late fines, brackets, schedules —
// so a future tweak can't silently change what a student is charged.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyDiscounts,
  buildSchedule,
  computeFinance,
  computeLateFine,
  daysOverdue,
  discountForRule,
  feeNetPayable,
  resolveBracket,
  type DiscountPolicy,
  type DiscountRule,
  type LateFinePolicy,
} from './financeRules'

// ── Brackets ────────────────────────────────────────────
test('resolveBracket returns the slab value; open top slab; fallback when below', () => {
  const brackets = [
    { min: 0, max: 59, value: 0 },
    { min: 60, max: 74, value: 10 },
    { min: 75, max: 89, value: 25 },
    { min: 90, value: 50 },
  ]
  assert.equal(resolveBracket(brackets, 85), 25)
  assert.equal(resolveBracket(brackets, 90), 50)
  assert.equal(resolveBracket(brackets, 95), 50)
  assert.equal(resolveBracket(brackets, 30), 0)
  assert.equal(resolveBracket(brackets, -5), 0)
  assert.equal(resolveBracket(undefined, 85), 0)
  assert.equal(resolveBracket(brackets, 85, 99), 25)
})

// ── Discounts ───────────────────────────────────────────
const catRule: DiscountRule = { id: 'sc', type: 'category', label: 'SC concession', enabled: true, valueType: 'percent', value: 50, categories: ['SC', 'ST'] }
const mgmtRule: DiscountRule = { id: 'mg', type: 'management', label: 'Management', enabled: true, valueType: 'flat', value: 0 }
const scoreRule: DiscountRule = {
  id: 'merit', type: 'academic_score', label: 'Merit', enabled: true, valueType: 'percent', value: 0,
  brackets: [{ min: 90, value: 40 }, { min: 75, max: 89, value: 20 }, { min: 0, max: 74, value: 0 }],
}

test('discountForRule: category percent, respects the category whitelist', () => {
  assert.equal(discountForRule(catRule, { baseAmount: 10000, studentCategory: 'SC' }), 5000)
  assert.equal(discountForRule(catRule, { baseAmount: 10000, studentCategory: 'OBC' }), 0)
})

test('discountForRule: flat is capped at base', () => {
  const flat: DiscountRule = { id: 'f', type: 'custom', label: 'Sibling', enabled: true, valueType: 'flat', value: 99999 }
  assert.equal(discountForRule(flat, { baseAmount: 5000 }), 5000)
})

test('discountForRule: academic score uses the bracket; no score → 0', () => {
  assert.equal(discountForRule(scoreRule, { baseAmount: 10000, academicScore: 92 }), 4000)
  assert.equal(discountForRule(scoreRule, { baseAmount: 10000, academicScore: 80 }), 2000)
  assert.equal(discountForRule(scoreRule, { baseAmount: 10000 }), 0)
})

test('discountForRule: management uses the supplied discretionary amount', () => {
  assert.equal(discountForRule(mgmtRule, { baseAmount: 10000, managementDiscount: 1500 }), 1500)
  assert.equal(discountForRule(mgmtRule, { baseAmount: 10000 }), 0)
})

test('applyDiscounts: best_of keeps only the single largest discount', () => {
  const policy: DiscountPolicy = { stack: 'best_of' }
  const r = applyDiscounts([catRule, scoreRule, mgmtRule], policy, { baseAmount: 10000, studentCategory: 'SC', academicScore: 92, managementDiscount: 1000 })
  assert.equal(r.applied.length, 1)
  assert.equal(r.applied[0].ruleId, 'sc') // 50% = 5000 beats 40% = 4000
  assert.equal(r.totalDiscount, 5000)
  assert.equal(r.netBase, 5000)
})

test('applyDiscounts: cumulative sums then caps by maxPercent and maxFlat', () => {
  const rules = [catRule, scoreRule, mgmtRule]
  const input = { baseAmount: 10000, studentCategory: 'SC', academicScore: 92, managementDiscount: 1000 }
  const summed = applyDiscounts(rules, { stack: 'cumulative' }, input)
  assert.equal(summed.totalDiscount, 10000) // 5000 + 4000 + 1000 = 10000
  assert.equal(summed.netBase, 0)

  const cappedPercent = applyDiscounts(rules, { stack: 'cumulative', maxPercent: 60 }, input)
  assert.equal(cappedPercent.totalDiscount, 6000)

  const cappedFlat = applyDiscounts(rules, { stack: 'cumulative', maxFlat: 5500 }, input)
  assert.equal(cappedFlat.totalDiscount, 5500)
})

test('applyDiscounts: total never exceeds base', () => {
  const r = applyDiscounts([{ id: 'x', type: 'custom', label: 'X', enabled: true, valueType: 'percent', value: 200 }], { stack: 'cumulative' }, { baseAmount: 1000 })
  assert.equal(r.totalDiscount, 1000)
  assert.equal(r.netBase, 0)
})

// ── Late fines ──────────────────────────────────────────
test('daysOverdue: overdue / within / future / invalid', () => {
  assert.equal(daysOverdue('2026-09-01', '2026-09-11'), 10)
  assert.equal(daysOverdue('2026-09-11', '2026-09-11'), 0)
  assert.equal(daysOverdue('2026-09-20', '2026-09-11'), 0)
  assert.equal(daysOverdue('bad', '2026-09-11'), 0)
})

test('computeLateFine: per-day percent after a grace window', () => {
  const policy: LateFinePolicy = { enabled: true, graceDays: 5, type: 'per_day_percent', rate: 1 }
  // 10 days overdue − 5 grace = 5 chargeable days × 1% of 10000 = 500
  assert.deepEqual(computeLateFine(policy, 10000, '2026-09-01', '2026-09-11'), { daysOverdue: 10, fine: 500 })
})

test('computeLateFine: within grace, disabled, or nothing owed → 0', () => {
  const policy: LateFinePolicy = { enabled: true, graceDays: 10, type: 'per_day_percent', rate: 1 }
  assert.equal(computeLateFine(policy, 10000, '2026-09-01', '2026-09-11').fine, 0) // 10 days, grace 10
  assert.equal(computeLateFine({ ...policy, enabled: false }, 10000, '2026-08-01', '2026-09-11').fine, 0)
  assert.equal(computeLateFine(policy, 0, '2026-08-01', '2026-09-11').fine, 0)
})

test('computeLateFine: flat-per-day, fixed, bracket and maxFine cap', () => {
  assert.equal(computeLateFine({ enabled: true, graceDays: 0, type: 'per_day_flat', rate: 20 }, 5000, '2026-09-01', '2026-09-06').fine, 100) // 5 days × 20
  assert.equal(computeLateFine({ enabled: true, graceDays: 0, type: 'fixed', rate: 250 }, 5000, '2026-09-01', '2026-09-30').fine, 250)
  const bracket: LateFinePolicy = { enabled: true, graceDays: 0, type: 'bracket', bracketValueType: 'percent', rate: 0, brackets: [{ min: 1, max: 7, value: 2 }, { min: 8, value: 5 }] }
  assert.equal(computeLateFine(bracket, 10000, '2026-09-01', '2026-09-06').fine, 200) // 6 days → 2% of 10000
  assert.equal(computeLateFine(bracket, 10000, '2026-09-01', '2026-09-20').fine, 500) // 19 days → 5%
  assert.equal(computeLateFine({ enabled: true, graceDays: 0, type: 'per_day_flat', rate: 100, maxFine: 300 }, 5000, '2026-09-01', '2026-09-30').fine, 300) // capped
})

// ── Payment terms / installments ────────────────────────
test('buildSchedule: percent split with the last row absorbing rounding', () => {
  const rows = buildSchedule({ installments: [
    { label: '1st', percent: 40, dueDate: '2026-10-01' },
    { label: '2nd', percent: 30, dueDate: '2026-11-01' },
    { label: '3rd', percent: 30, dueDate: '2026-12-01' },
  ] }, 10000)
  assert.deepEqual(rows.map(r => r.amount), [4000, 3000, 3000])
  assert.equal(rows.reduce((s, r) => s + r.amount, 0), 10000)
})

test('buildSchedule: mixed flat + percent, last row balances the remainder', () => {
  const rows = buildSchedule({ installments: [
    { label: 'Booking', amount: 2000, dueDate: '2026-10-01' },
    { label: 'Balance', percent: 100, dueDate: '2026-11-01' },
  ] }, 9500)
  assert.deepEqual(rows.map(r => r.amount), [2000, 7500])
})

test('buildSchedule: no installments → a single full-payment row', () => {
  assert.deepEqual(buildSchedule({ installments: [] }, 5000), [{ label: 'Full payment', amount: 5000, dueDate: '' }])
})

// ── Orchestration ───────────────────────────────────────
test('computeFinance: base − discount + late-fine = payable, with audit trail', () => {
  const breakdown = computeFinance({
    baseAmount: 10000,
    dueDate: '2026-09-01',
    asOf: '2026-09-11',
    studentCategory: 'SC',
    academicScore: 80,
    managementDiscount: 500,
    discountRules: [catRule, scoreRule, mgmtRule],
    discountPolicy: { stack: 'best_of' }, // 50% SC = 5000 wins
    lateFinePolicy: { enabled: true, graceDays: 5, type: 'per_day_percent', rate: 1 }, // 5 chargeable days × 1% of 5000 = 250
  })
  assert.equal(breakdown.base, 10000)
  assert.equal(breakdown.totalDiscount, 5000)
  assert.equal(breakdown.netBase, 5000)
  assert.equal(breakdown.daysOverdue, 10)
  assert.equal(breakdown.lateFine, 250)
  assert.equal(breakdown.payable, 5250)
  assert.equal(breakdown.discounts[0].ruleId, 'sc')
})

// ── Net payable ─────────────────────────────────────────
test('feeNetPayable: amount − discount + late fine − paid', () => {
  assert.equal(feeNetPayable({ amount: 10000, paidAmount: 0 }), 10000)
  assert.equal(feeNetPayable({ amount: 10000, paidAmount: 0, discountTotal: 2000 }), 8000)
  assert.equal(feeNetPayable({ amount: 10000, paidAmount: 3000, discountTotal: 2000, lateFine: 500 }), 5500)
  // discount cannot push below zero
  assert.equal(feeNetPayable({ amount: 5000, paidAmount: 0, discountTotal: 9999 }), 0)
})
