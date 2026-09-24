// src/modules/admin/utils/financeReceipt.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildReceiptModel } from './financeReceipt'

const payment = {
  studentName: 'Asha Kumar',
  regNo: 'BCA21001',
  course: 'BCA',
  batch: '2021-24',
  category: 'tuition',
  amount: 50000,
  paidAmount: 20000,
  status: 'partial',
}
const txn = {
  receiptNo: 'RCP-2026-123456',
  transactionId: 'TXN-1-2',
  bankReference: 'UPI/REF 9',
  paymentMode: 'upi',
  amount: 20000,
  paidOn: '2026-09-20',
  submissionStatus: 'verified',
}

test('buildReceiptModel maps the core receipt fields', () => {
  const r = buildReceiptModel({ payment, transaction: txn, collegeName: 'Govt College', collegeCode: 'GC101' })
  assert.equal(r.receiptNo, 'RCP-2026-123456')
  assert.equal(r.date, '2026-09-20')
  assert.equal(r.collegeName, 'Govt College')
  assert.equal(r.studentName, 'Asha Kumar')
  assert.equal(r.feeCategory, 'Tuition')
  assert.equal(r.amountReceived, 20000)
  assert.equal(r.totalFee, 50000)
  assert.equal(r.totalPaid, 20000)
  assert.equal(r.balance, 30000)
  assert.equal(r.status, 'verified')
})

test('buildReceiptModel adds discount + late-fine line items only when present', () => {
  const plain = buildReceiptModel({ payment, transaction: txn })
  assert.deepEqual(plain.items, [{ label: 'Tuition fee', amount: 50000 }])

  const withBoth = buildReceiptModel({ payment, transaction: txn, discountTotal: 5000, lateFine: 250 })
  assert.deepEqual(withBoth.items, [
    { label: 'Tuition fee', amount: 50000 },
    { label: 'Discount', amount: -5000 },
    { label: 'Late payment fine', amount: 250 },
  ])
})

test('buildReceiptModel falls back for missing receipt no and date', () => {
  const r = buildReceiptModel({ payment, transaction: { amount: 100, createdAt: '2026-08-01T10:00:00Z' } })
  assert.equal(r.receiptNo, '—')
  assert.equal(r.date, '2026-08-01')
  assert.equal(r.status, 'partial') // falls back to the payment status
})
