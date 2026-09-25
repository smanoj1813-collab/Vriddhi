import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PROCUREMENT_SETTINGS as D,
  billNet,
  billPaymentStatus,
  canActOnStep,
  computeTds,
  isInterState,
  isValidGstin,
  lineTotals,
  nextStep,
  normalizeProcurementSettings,
  orderTotals,
  receiptStatus,
  requiredSteps,
} from './procurementEngine'
import {
  DEFAULT_TALLY_LEDGERS as L,
  buildTallyXml,
  entryToVoucher,
  normalizeTallyLedgers,
  summarizeDaybook,
  voucherBalances,
} from './tallyExport'

test('GST: intra-state splits CGST/SGST, inter-state IGST, rounding', () => {
  assert.deepEqual(lineTotals({ description: 'x', qty: 2, unit: 'nos', rate: 1000, gstRate: 18, discountPct: 10 }), { taxable: 1800, gst: 324, total: 2124 })
  const lines = [
    { description: 'Chair', qty: 3, unit: 'nos', rate: 1499.5, gstRate: 18 },
    { description: 'Book', qty: 1, unit: 'nos', rate: 450, gstRate: 0 },
  ]
  const intra = orderTotals(lines, false)
  assert.equal(intra.taxable, 4948.5)
  assert.equal(intra.cgst + intra.sgst, 809.73)
  assert.equal(intra.igst, 0)
  assert.equal(intra.grandTotal, 5758)
  assert.equal(intra.roundOff, -0.23)
  const inter = orderTotals(lines, true)
  assert.equal(inter.igst, 809.73)
  assert.equal(inter.cgst, 0)
})

test('GSTIN and inter-state detection', () => {
  assert.equal(isValidGstin('29ABCDE1234F1Z5'), true)
  assert.equal(isValidGstin('29ABCDE1234F1X5'), false)
  assert.equal(isInterState('29ABCDE1234F1Z5', '33ABCDE1234F1Z5', '', ''), true)
  assert.equal(isInterState('29ABCDE1234F1Z5', '29AAAAA1111A1Z1', '', ''), false)
  assert.equal(isInterState('', '', 'Karnataka', 'karnataka'), false)
  assert.equal(isInterState('', '', 'Karnataka', 'Tamil Nadu'), true)
})

test('approval chain: amount thresholds, HOD step skipped for HOD requests, who may act', () => {
  const chain = [
    { role: 'hod' as const, minAmount: 0, label: 'HOD' },
    { role: 'principal' as const, minAmount: 0, label: 'Principal' },
    { role: 'accounts' as const, minAmount: 50000, label: 'Accounts' },
  ]
  assert.deepEqual(requiredSteps(chain, 10000, 'faculty').map(s => s.role), ['hod', 'principal'])
  assert.deepEqual(requiredSteps(chain, 90000, 'hod').map(s => s.role), ['principal', 'accounts'])
  assert.equal(nextStep(chain, 10000, 'operations', [])?.role, 'hod')
  const approvals = [{ role: 'hod' as const, decision: 'approved' as const, by: 'x', uid: 'u', at: '', note: '' }]
  assert.equal(nextStep(chain, 10000, 'operations', approvals)?.role, 'principal')
  assert.equal(nextStep(chain, 10000, 'operations', [...approvals, { ...approvals[0], role: 'principal' }]), null)
  assert.equal(canActOnStep(chain[0], 'admin'), true)
  assert.equal(canActOnStep(chain[0], 'accounts'), false)
  assert.equal(canActOnStep(chain[2], 'accounts'), true)
  assert.equal(canActOnStep(chain[2], 'principal'), true)
  assert.equal(canActOnStep(null, 'principal'), false)
})

test('TDS, bill net and payment status; receipt status', () => {
  const s194j = D.tdsSections.find(s => s.code === '194J')
  assert.equal(computeTds(50000, s194j), 5000)
  assert.equal(computeTds(20000, s194j), 0) // below threshold
  assert.equal(computeTds(50000, undefined), 0)
  assert.equal(billNet(59000, 5000, 100), 53900)
  assert.equal(billPaymentStatus(100, 0), 'unpaid')
  assert.equal(billPaymentStatus(100, 40), 'partial')
  assert.equal(billPaymentStatus(100, 100), 'paid')
  assert.equal(receiptStatus([{ qty: 5 }, { qty: 2 }]), 'pending')
  assert.equal(receiptStatus([{ qty: 5, receivedQty: 5 }, { qty: 2, receivedQty: 1 }]), 'partial')
  assert.equal(receiptStatus([{ qty: 5, receivedQty: 6 }, { qty: 2, receivedQty: 2 }]), 'received')
})

test('procurement settings normalisation', () => {
  const s = normalizeProcurementSettings({ approvalChain: [{ role: 'principal', minAmount: -5 }, { role: 'janitor', minAmount: 0 }], poPrefix: 'po!', gstRates: [18, 5, 18, 'x'] })
  assert.deepEqual(s.approvalChain, [{ role: 'principal', minAmount: 0, label: 'principal' }])
  assert.equal(s.poPrefix, 'PO')
  assert.deepEqual(s.gstRates, [5, 18])
  assert.deepEqual(normalizeProcurementSettings(null).approvalChain, D.approvalChain)
})

test('Tally vouchers balance and XML follows the Tally sign convention', () => {
  const m = normalizeTallyLedgers({ companyName: 'BCU College 2026-27', feeIncome: { tuition: 'Tuition Fee A/c' } })
  const fee = entryToVoucher({ date: '2026-09-25', kind: 'fee_receipt', ref: 'RCP/1', party: 'Asha', narration: 'Tuition', amount: 15000, mode: 'upi', category: 'tuition' }, m)!
  assert.deepEqual(fee.lines, [{ ledger: 'Bank Account', debit: 15000, credit: 0 }, { ledger: 'Tuition Fee A/c', debit: 0, credit: 15000 }])
  const bill = entryToVoucher({ date: '2026-09-25', kind: 'vendor_bill', ref: 'BILL/1', party: 'Sri Traders', narration: 'Chairs', amount: 59000, tds: 1000 }, m)!
  assert.equal(voucherBalances(bill), true)
  assert.deepEqual(bill.lines.map(l => l.ledger), ['Purchases', 'Sri Traders', 'TDS Payable'])
  const cashFine = entryToVoucher({ date: '2026-09-25', kind: 'fine_receipt', ref: 'LIB/1', party: 'Ravi', narration: 'Fine', amount: 20, mode: 'cash' }, m)!
  assert.equal(cashFine.lines[0].ledger, 'Cash')
  assert.equal(entryToVoucher({ date: '2026-09-25', kind: 'salary_payment', ref: 'x', party: '', narration: '', amount: 0 }, m), null)
  const xml = buildTallyXml([fee, bill], m)
  assert.match(xml, /<SVCURRENTCOMPANY>BCU College 2026-27<\/SVCURRENTCOMPANY>/)
  assert.match(xml, /<DATE>20260925<\/DATE>/)
  assert.match(xml, /<LEDGERNAME>Bank Account<\/LEDGERNAME>\s*<ISDEEMEDPOSITIVE>Yes<\/ISDEEMEDPOSITIVE>\s*<AMOUNT>-15000.00<\/AMOUNT>/)
  assert.match(xml, /<LEDGERNAME>Tuition Fee A\/c<\/LEDGERNAME>\s*<ISDEEMEDPOSITIVE>No<\/ISDEEMEDPOSITIVE>\s*<AMOUNT>15000.00<\/AMOUNT>/)
  assert.ok(!buildTallyXml([{ ...fee, narration: 'A & B <x>' }], m).includes('A & B <x>'))
  assert.equal(normalizeTallyLedgers(null).cashLedger, L.cashLedger)
})

test('daybook summary', () => {
  const s = summarizeDaybook([
    { date: '2026-09-25', kind: 'fee_receipt', ref: '', party: '', narration: '', amount: 1000, mode: 'cash' },
    { date: '2026-09-25', kind: 'fine_receipt', ref: '', party: '', narration: '', amount: 20, mode: 'UPI' },
    { date: '2026-09-25', kind: 'vendor_bill', ref: '', party: '', narration: '', amount: 5000 },
    { date: '2026-09-25', kind: 'vendor_payment', ref: '', party: '', narration: '', amount: 4000 },
  ])
  assert.equal(s.receipts, 1020)
  assert.equal(s.payments, 4000)
  assert.equal(s.billsBooked, 5000)
  assert.deepEqual(s.byMode, { cash: 1000, upi: 20 })
})
