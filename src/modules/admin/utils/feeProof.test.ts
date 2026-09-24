// src/modules/admin/utils/feeProof.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PROOF_ALLOWED_TYPES,
  PROOF_MAX_BYTES,
  feeProofPath,
  proofObjectName,
  validateProofFile,
} from './feeProof'

test('validateProofFile accepts a small png', () => {
  assert.equal(validateProofFile({ name: 'screenshot.png', type: 'image/png', size: 1024 }), null)
})

test('validateProofFile rejects missing, non-image, empty and oversized files', () => {
  assert.match(validateProofFile(null)!, /choose a payment screenshot/i)
  assert.match(validateProofFile({ name: 'a.pdf', type: 'application/pdf', size: 10 })!, /png, jpg/i)
  assert.match(validateProofFile({ name: 'a.png', type: 'image/png', size: 0 })!, /empty/i)
  assert.match(validateProofFile({ name: 'a.png', type: 'image/png', size: PROOF_MAX_BYTES + 1 })!, /too large/i)
})

test('validateProofFile accepts every allowed image type', () => {
  for (const type of PROOF_ALLOWED_TYPES) {
    assert.equal(validateProofFile({ name: 'x', type, size: 100 }), null)
  }
})

test('proofObjectName is safe, keeps a valid extension and injects the timestamp', () => {
  assert.equal(proofObjectName('my screenshot (1).PNG', 1700000000000), '1700000000000-myscreenshot1.png')
  // unknown/absent extension falls back to .png
  assert.equal(proofObjectName('weird name', 1), '1-weirdname.png')
})

test('feeProofPath is tenant-scoped under fee-proofs', () => {
  assert.equal(feeProofPath('col1', 'pay9', 'a.png'), 'colleges/col1/fee-proofs/pay9/a.png')
})
