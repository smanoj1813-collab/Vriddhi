// src/modules/admin/utils/feeReference.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)
// Locks the reference numbering + ledger math shared by direct collection and
// proof verification, so a future tweak can't silently change fee status.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  creditLedger,
  normalizeReference,
  suggestTransactionId,
  type PaymentSubmissionStatus,
} from './feeReference'

test('suggestTransactionId is deterministic given a seed', () => {
  assert.equal(suggestTransactionId(1700000000000, 42), 'TXN-1700000000000-42')
})

test('normalizeReference trims and upper-cases; empty stays empty', () => {
  assert.equal(normalizeReference('  upi/ref 123 '), 'UPI/REF 123')
  assert.equal(normalizeReference(''), '')
  assert.equal(normalizeReference(undefined), '')
  assert.equal(normalizeReference(null), '')
})

test('creditLedger marks a fully-credited fee as paid', () => {
  assert.deepEqual(
    creditLedger({ amount: 1000, paidAmount: 400, dueDate: '2030-01-01' }, 600, '2026-09-24'),
    { paidAmount: 1000, status: 'paid' },
  )
})

test('creditLedger clamps an over-credit to the total', () => {
  assert.deepEqual(
    creditLedger({ amount: 1000, paidAmount: 900, dueDate: '2030-01-01' }, 500, '2026-09-24'),
    { paidAmount: 1000, status: 'paid' },
  )
})

test('creditLedger leaves a past-due partial as overdue, future-due as partial', () => {
  assert.deepEqual(
    creditLedger({ amount: 1000, paidAmount: 0, dueDate: '2020-01-01' }, 100, '2026-09-24'),
    { paidAmount: 100, status: 'overdue' },
  )
  assert.deepEqual(
    creditLedger({ amount: 1000, paidAmount: 0, dueDate: '2030-01-01' }, 100, '2026-09-24'),
    { paidAmount: 100, status: 'partial' },
  )
})

test('PaymentSubmissionStatus covers the four lifecycle states', () => {
  const states: PaymentSubmissionStatus[] = ['recorded', 'pending_verification', 'verified', 'rejected']
  assert.equal(states.length, 4)
})
