// src/modules/admin/utils/guestBilling.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  billingRowsToCsv,
  buildBillingRows,
  canTransitionBill,
  computeGuestBill,
  countWeekdayInMonth,
  guestBillId,
  resolveGuestRate,
  DEFAULT_GUEST_BILLING_SETTINGS,
} from './guestBilling'
import type { WeeklyClassSchedule } from '../types/schedule'

test('countWeekdayInMonth counts calendar occurrences', () => {
  // September 2026 starts on a Tuesday → 5 Tuesdays/Wednesdays, 4 Mondays
  assert.equal(countWeekdayInMonth('2026-09', 'tuesday'), 5)
  assert.equal(countWeekdayInMonth('2026-09', 'monday'), 4)
  assert.equal(countWeekdayInMonth('bad', 'monday'), 0)
})

test('resolveGuestRate falls back contract → type → default', () => {
  const s = { rateByEmploymentType: { PART_TIME: 400 }, defaultPeriodRate: 300 }
  assert.equal(resolveGuestRate(500, 'PART_TIME', s), 500)
  assert.equal(resolveGuestRate(0, 'PART_TIME', s), 400)
  assert.equal(resolveGuestRate(undefined, 'VISITING', s), 300)
  assert.equal(resolveGuestRate(undefined, 'VISITING', { rateByEmploymentType: {}, defaultPeriodRate: 0 }), 0)
})

test('buildBillingRows derives periods from the timetable', () => {
  const schedules = [
    { facultyId: 'uid-1', dayOfWeek: 'monday', isActive: true },
    { facultyId: 'UID-1', dayOfWeek: 'tuesday', isActive: true },
    { facultyId: 'uid-1', dayOfWeek: 'friday', isActive: false },
  ] as unknown as WeeklyClassSchedule[]
  const rows = buildBillingRows(
    [{ profileId: 'p1', uid: 'uid-1', staffCode: 'G01', name: 'Ravi', department: 'Commerce', employmentType: 'PART_TIME', guestContract: { periodRate: 0, endDate: '2026-01-01' } }],
    schedules,
    '2026-09',
    { rateByEmploymentType: { PART_TIME: 450 }, defaultPeriodRate: 0 },
    '2026-09-25',
  )
  assert.equal(rows[0].hoursPerWeek, 2)
  assert.equal(rows[0].periodsInMonth, 9)
  assert.equal(rows[0].periodRate, 450)
  assert.equal(rows[0].amount, 4050)
  assert.equal(rows[0].expired, true)
  assert.match(billingRowsToCsv(rows, '2026-09'), /TOTAL,4050/)
})

test('computeGuestBill applies extra/absent periods, adjustments, deduction and rounding', () => {
  const t = computeGuestBill(
    { scheduledPeriods: 20, extraPeriods: 3, absentPeriods: 2, rate: 450, adjustments: [{ label: 'Invigilation', amount: 500 }, { label: 'Recovery', amount: -100 }] },
    { deductionPercent: 10, roundTo: 1, maxPeriodsPerMonth: 0 },
  )
  assert.equal(t.billablePeriods, 21)
  assert.equal(t.periodAmount, 9450)
  assert.equal(t.adjustmentsTotal, 400)
  assert.equal(t.grossAmount, 9850)
  assert.equal(t.deductionAmount, 985)
  assert.equal(t.netAmount, 8865)
  assert.equal(t.capped, false)
})

test('computeGuestBill honours the monthly period cap', () => {
  const t = computeGuestBill({ scheduledPeriods: 40, rate: 100 }, { deductionPercent: 0, roundTo: 1, maxPeriodsPerMonth: 30 })
  assert.equal(t.billablePeriods, 30)
  assert.equal(t.capped, true)
  assert.equal(t.netAmount, 3000)
})

test('bill lifecycle', () => {
  const req = DEFAULT_GUEST_BILLING_SETTINGS.requireApproval
  assert.equal(req, true)
  assert.equal(canTransitionBill('draft', 'recorded', true), false)
  assert.equal(canTransitionBill('draft', 'recorded', false), true)
  assert.equal(canTransitionBill('approved', 'recorded', true), true)
  assert.equal(canTransitionBill('recorded', 'draft', true), false)
  assert.equal(canTransitionBill('approved', 'draft', true), true)
})

test('guestBillId is one-per-guest-per-month', () => {
  assert.equal(guestBillId('2026-09', 'abc/def'), '2026-09_abcdef')
})
