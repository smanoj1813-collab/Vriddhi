// src/modules/admin/utils/payrollEngine.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  amountInWords,
  canTransitionPayslip,
  computePayslip,
  daysInMonth,
  docNumber,
  periodDays,
  pronounsFor,
  renderTemplate,
  roundTo,
  DEFAULT_PAYROLL_SETTINGS,
  type PayrollSettings,
} from './payrollEngine'

const settings: PayrollSettings = {
  ...DEFAULT_PAYROLL_SETTINGS,
  components: [
    { id: 'da', name: 'Dearness Allowance', code: 'DA', kind: 'earning', calc: 'percent_of_basic', value: 50, prorate: true, enabled: true },
    { id: 'hra', name: 'HRA', code: 'HRA', kind: 'earning', calc: 'percent_of_basic', value: 20, prorate: true, enabled: true },
    { id: 'conv', name: 'Conveyance', kind: 'earning', calc: 'fixed', value: 1600, prorate: false, enabled: true },
    { id: 'pf', name: 'PF', code: 'PF', kind: 'deduction', calc: 'percent_of_basic', value: 12, maxAmount: 1800, prorate: false, enabled: true },
    {
      id: 'pt', name: 'Professional Tax', code: 'PT', kind: 'deduction', calc: 'slab_on_gross', value: 0, prorate: false, enabled: true,
      brackets: [{ min: 0, max: 24999, value: 0 }, { min: 25000, value: 200 }],
    },
    { id: 'off', name: 'Disabled', kind: 'earning', calc: 'fixed', value: 9999, prorate: false, enabled: false },
  ],
}

test('daysInMonth / periodDays honour the LOP basis', () => {
  assert.equal(daysInMonth('2026-02'), 28)
  assert.equal(daysInMonth('2028-02'), 29)
  assert.equal(daysInMonth('bad'), 0)
  assert.equal(periodDays('2026-09', { lopBasis: 'calendar_days', fixedDaysPerMonth: 26 }), 30)
  assert.equal(periodDays('2026-09', { lopBasis: 'fixed_days', fixedDaysPerMonth: 26 }), 26)
})

test('computePayslip — full month, configured components', () => {
  const r = computePayslip({ basic: 30000, monthKey: '2026-09' }, settings)
  // basic 30000 + DA 15000 + HRA 6000 + conv 1600
  assert.equal(r.gross, 52600)
  // PF capped at 1800, PT 200
  assert.deepEqual(r.deductions.map(d => [d.code ?? d.label, d.amount]), [['PF', 1800], ['PT', 200]])
  assert.equal(r.totalDeductions, 2000)
  assert.equal(r.net, 50600)
  assert.equal(r.paidDays, 30)
  assert.ok(!r.earnings.some(e => e.label === 'Disabled'))
})

test('computePayslip — loss of pay prorates basic and prorated components only', () => {
  const r = computePayslip({ basic: 30000, monthKey: '2026-09', lopDays: 3 }, settings)
  // factor 27/30 = 0.9 → basic 27000, DA 13500, HRA 5400, conveyance NOT prorated 1600
  assert.equal(r.earnings.find(e => e.componentId === 'basic')?.amount, 27000)
  assert.equal(r.earnings.find(e => e.componentId === 'da')?.amount, 13500)
  assert.equal(r.earnings.find(e => e.componentId === 'conv')?.amount, 1600)
  assert.equal(r.gross, 47500)
  assert.equal(r.lopDays, 3)
  assert.equal(r.paidDays, 27)
})

test('computePayslip — overrides and one-off adjustments', () => {
  const r = computePayslip({
    basic: 20000,
    monthKey: '2026-09',
    overrides: { hra: 0, pf: 500 },
    adjustments: [
      { label: 'Arrears', amount: 1000, kind: 'earning' },
      { label: 'Advance recovery', amount: 2000, kind: 'deduction' },
    ],
  }, settings)
  assert.ok(!r.earnings.some(e => e.componentId === 'hra'))
  assert.ok(r.earnings.some(e => e.label === 'Arrears' && e.amount === 1000))
  // 20000 + DA 10000 + conv 1600 + arrears 1000
  assert.equal(r.gross, 32600)
  assert.equal(r.deductions.find(d => d.componentId === 'pf')?.amount, 500)
  assert.ok(r.deductions.some(d => d.label === 'Advance recovery'))
  assert.equal(r.net, 32600 - 500 - 200 - 2000)
})

test('computePayslip — appliesTo scopes a component to employment types', () => {
  const scoped: PayrollSettings = {
    ...settings,
    components: [{ id: 'x', name: 'Research', kind: 'earning', calc: 'fixed', value: 5000, prorate: false, enabled: true, appliesTo: ['FULL_TIME'] }],
  }
  assert.equal(computePayslip({ basic: 1000, monthKey: '2026-09', employmentType: 'FULL_TIME' }, scoped).gross, 6000)
  assert.equal(computePayslip({ basic: 1000, monthKey: '2026-09', employmentType: 'PART_TIME' }, scoped).gross, 1000)
})

test('computePayslip — LOP cannot exceed the period and net never negative', () => {
  const r = computePayslip({ basic: 10000, monthKey: '2026-09', lopDays: 99, adjustments: [{ label: 'x', amount: 50000, kind: 'deduction' }] }, settings)
  assert.equal(r.lopDays, 30)
  assert.equal(r.paidDays, 0)
  assert.equal(r.net, 0)
})

test('roundTo', () => {
  assert.equal(roundTo(1234.56, 1), 1235)
  assert.equal(roundTo(1234.56, 10), 1230)
  assert.equal(roundTo(1234.567, 0), 1234.57)
})

test('payslip lifecycle respects approval setting', () => {
  assert.equal(canTransitionPayslip('draft', 'paid', true), false)
  assert.equal(canTransitionPayslip('draft', 'paid', false), true)
  assert.equal(canTransitionPayslip('draft', 'approved', true), true)
  assert.equal(canTransitionPayslip('approved', 'paid', true), true)
  assert.equal(canTransitionPayslip('paid', 'draft', true), false)
  assert.equal(canTransitionPayslip('cancelled', 'draft', true), true)
})

test('amountInWords — Indian numbering', () => {
  assert.equal(amountInWords(0), 'Rupees Zero Only')
  assert.equal(amountInWords(52600), 'Rupees Fifty Two Thousand Six Hundred Only')
  assert.equal(amountInWords(1250000), 'Rupees Twelve Lakh Fifty Thousand Only')
  assert.equal(amountInWords(31000000), 'Rupees Three Crore Ten Lakh Only')
  assert.equal(amountInWords(101.5), 'Rupees One Hundred One and Fifty Paise Only')
})

test('renderTemplate fills placeholders and marks missing ones', () => {
  assert.equal(renderTemplate('Hi {{ name }}, {{x}}', { name: 'Asha' }), 'Hi Asha, —')
  assert.equal(renderTemplate('that {{salutation}} {{name}} is', { salutation: '', name: 'Asha' }), 'that Asha is')
})

test('docNumber is deterministic and sanitised', () => {
  assert.equal(docNumber('ps', '2026-09', 'abc-123456789'), 'PS-202609-456789')
  assert.equal(docNumber('', '2026-09', 'x'), 'DOC-202609-X')
})

test('pronounsFor', () => {
  assert.equal(pronounsFor('Female').possessive, 'Her')
  assert.equal(pronounsFor('male').salutation, 'Mr.')
  assert.equal(pronounsFor(undefined).pronoun, 'They')
})

test('nextCertificateNo is sequential per prefix/year', async () => {
  const { nextCertificateNo } = await import('./payrollDocs')
  assert.equal(nextCertificateNo('sc', [], 2026), 'SC/2026/0001')
  assert.equal(nextCertificateNo('SC', [{ certificateNo: 'SC/2026/0007' }, { certificateNo: 'SC/2025/0099' }, { certificateNo: 'X/2026/0100' }], 2026), 'SC/2026/0008')
})
