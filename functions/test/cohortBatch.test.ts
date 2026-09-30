// functions/test/cohortBatch.test.ts
// ─── Batch (academic year) identity ─────────────────────────────────────────
//
// The same class is stored as a graduating year ("2027") by bulk import and as
// the academic-year range that ends in it ("2026-2027", "2026-27") by the
// curriculum/auto-map dialogs. Every strict-string comparison treated those as
// two different cohorts — the student page said "mapped — but to a different
// class than yours", and applyAutoMapping duplicated an already-mapped faculty.
// These cases pin the rule, and the last block pins the SERVER copy and the
// BROWSER copy together so they cannot drift apart.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { batchKeysMatch, normalizeBatchKey } from '../src/cohortBatch.ts'
import {
  batchKeysMatch as browserBatchKeysMatch,
  normalizeBatchKey as browserNormalizeBatchKey,
} from '../../src/shared/utils/cohortMatching.ts'

describe('normalizeBatchKey', () => {
  it('canonicalises an academic-year range to its END year', () => {
    assert.equal(normalizeBatchKey('2026-2027'), '2027')
    assert.equal(normalizeBatchKey('2026-27'), '2027')
    assert.equal(normalizeBatchKey(' 2026 - 2027 '), '2027')
    assert.equal(normalizeBatchKey('2026/2027'), '2027')
    assert.equal(normalizeBatchKey('2026–2027'), '2027', 'en dash')
    assert.equal(normalizeBatchKey('26-27'), '2027')
    // The two-digit tail carries the start's century, wrapping when it must.
    assert.equal(normalizeBatchKey('1999-00'), '2000')
  })

  it('leaves anything that is not a consecutive year range alone', () => {
    assert.equal(normalizeBatchKey('2027'), '2027')
    assert.equal(normalizeBatchKey(2027), '2027')
    assert.equal(normalizeBatchKey(' 2027 '), '2027')
    assert.equal(normalizeBatchKey('A'), 'a')
    assert.equal(normalizeBatchKey(''), '')
    assert.equal(normalizeBatchKey(undefined), '')
    // A bare START year is a different cohort, never the range's class…
    assert.equal(normalizeBatchKey('2026'), '2026')
    // …a multi-year span is not one academic year…
    assert.equal(normalizeBatchKey('2026-2028'), '2026-2028')
    assert.equal(normalizeBatchKey('2027-2026'), '2027-2026')
    // …and a letter-year pair was never a range.
    assert.equal(normalizeBatchKey('A-2027'), 'a-2027')
  })
})

describe('batchKeysMatch', () => {
  it('names the same class across spellings, and nothing else', () => {
    assert.equal(batchKeysMatch('2026-2027', '2027'), true)
    assert.equal(batchKeysMatch('2026-27', 2027), true)
    assert.equal(batchKeysMatch('2027', '2027–2028'), false, 'a range ending elsewhere')
    assert.equal(batchKeysMatch('2026', '2026-2027'), false, 'the start year is a different class')
    assert.equal(batchKeysMatch('2026', '2027'), false)
    // Pure key comparison: blank is an empty key, not a wildcard. The matchers
    // apply the wildcard rules themselves before calling this.
    assert.equal(batchKeysMatch('', '2027'), false)
    assert.equal(batchKeysMatch('2027', ''), false)
    assert.equal(batchKeysMatch('', ''), true)
  })
})

describe('server copy ≡ browser copy', () => {
  // functions/ cannot import src/ at build time (rootDir: src), so the rule
  // exists twice on purpose. This is the guard that keeps the two honest.
  const SPELLINGS: unknown[] = [
    '2027',
    2027,
    ' 2027 ',
    '2026',
    '2026-2027',
    '2026-27',
    '2026 - 2027',
    '2026/2027',
    '2026–2027',
    '2026-2028',
    '2027-2026',
    '2027-2028',
    '1999-00',
    '26-27',
    'A',
    'a',
    'A-2027',
    '',
    null,
    undefined,
    'B.B.A 2026-27',
    'BBA . 2026',
    '2026 . 2027',
  ]

  it('canonicalises every spelling identically', () => {
    for (const value of SPELLINGS) {
      assert.equal(
        normalizeBatchKey(value),
        browserNormalizeBatchKey(value),
        `normalizeBatchKey(${JSON.stringify(value)})`,
      )
    }
  })

  it('agrees on every pair', () => {
    for (const left of SPELLINGS) {
      for (const right of SPELLINGS) {
        assert.equal(
          batchKeysMatch(left, right),
          browserBatchKeysMatch(left, right),
          `batchKeysMatch(${JSON.stringify(left)}, ${JSON.stringify(right)})`,
        )
      }
    }
  })
})
