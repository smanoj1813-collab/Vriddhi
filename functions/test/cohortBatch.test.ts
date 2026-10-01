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
import {
  batchFieldsIntersect,
  batchKeysMatch,
  cohortLetters,
  cohortScopesOverlap,
  divisionScopesOverlap,
  normalizeBatchKey,
} from '../src/cohortBatch.ts'
import {
  batchFieldsIntersect as browserBatchFieldsIntersect,
  batchKeysMatch as browserBatchKeysMatch,
  cohortLetters as browserCohortLetters,
  cohortScopesOverlap as browserCohortScopesOverlap,
  divisionScopesOverlap as browserDivisionScopesOverlap,
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

// ─── Division letters + cohort scope overlap ────────────────────────────────
//
// Same story as the batch rule above, one field over: staff write a LIST when
// a class covers several divisions ("A,B,C,D") and the auto-scheduler / clash
// detector / student page must all read that as a set of letters. The last
// block pins the SERVER copy and the BROWSER copy together.

describe('cohortLetters', () => {
  it('splits a list on every separator staff use', () => {
    assert.deepEqual(cohortLetters('A,B,C,D'), ['a', 'b', 'c', 'd'])
    assert.deepEqual(cohortLetters('A/B'), ['a', 'b'])
    assert.deepEqual(cohortLetters('A;B'), ['a', 'b'])
    assert.deepEqual(cohortLetters('a b'), ['a', 'b'])
    assert.deepEqual(cohortLetters('A&B'), ['a', 'b'])
    assert.deepEqual(cohortLetters('Div A, Div B'), ['a', 'b'])
    assert.deepEqual(cohortLetters('division a'), ['a'])
  })

  it('keeps an unseparated token as ONE letter', () => {
    assert.deepEqual(cohortLetters('ABCD'), ['abcd'])
    assert.notDeepEqual(cohortLetters('ABCD'), cohortLetters('A'))
  })

  it('is empty for blank and prefix-only fields', () => {
    assert.deepEqual(cohortLetters(''), [])
    assert.deepEqual(cohortLetters(null), [])
    assert.deepEqual(cohortLetters('Div'), [])
  })
})

describe('divisionScopesOverlap / cohortScopesOverlap', () => {
  it('a list covers each of its letters and a blank side covers everything', () => {
    assert.equal(divisionScopesOverlap({ division: 'A,B,C,D' }, { division: 'A' }), true)
    assert.equal(divisionScopesOverlap({ division: 'B' }, { division: 'A' }), false)
    assert.equal(divisionScopesOverlap({ division: '' }, { division: 'A' }), true)
    assert.equal(divisionScopesOverlap({ division: 'A' }, { section: 'A' }), true)
  })

  it('overlaps a batch range with its end year and a division list with a letter', () => {
    assert.equal(
      cohortScopesOverlap(
        { branch: 'BBA', batch: '2026-2027', division: 'A,B,C,D' },
        { branch: 'BBA', batch: '2027', division: 'A' },
      ),
      true,
    )
  })

  it('does not overlap different cohorts', () => {
    assert.equal(
      cohortScopesOverlap({ branch: 'BBA', batch: '2027', division: 'B' }, { branch: 'BBA', batch: '2027', division: 'A' }),
      false,
    )
    assert.equal(
      cohortScopesOverlap({ branch: 'BBA', batch: '2026' }, { branch: 'BBA', batch: '2027' }),
      false,
    )
    assert.equal(
      cohortScopesOverlap({ branch: 'B.Com', batch: '2027' }, { branch: 'BBA', batch: '2027' }),
      false,
    )
  })

  it('never overlaps two fully blank scopes', () => {
    // "no cohort recorded" is not a cohort everyone belongs to.
    assert.equal(cohortScopesOverlap({}, {}), false)
    assert.equal(cohortScopesOverlap({ division: '' }, { division: '' }), false)
    // One identifying field is enough to compare.
    assert.equal(cohortScopesOverlap({ batch: '2027' }, { batch: '2027' }), true)
  })
})

describe('batchFieldsIntersect', () => {
  it('matches multi-intake lists token by token, keyed', () => {
    assert.equal(batchFieldsIntersect('2027, 2028', '2027;2028'), true)
    assert.equal(batchFieldsIntersect('2027', '2026-2027'), true)
    assert.equal(batchFieldsIntersect('2026', '2026-2027'), false)
    assert.equal(batchFieldsIntersect('', '2027'), false)
    assert.equal(batchFieldsIntersect('', ''), true)
  })
})

describe('server ↔ browser parity (division letters and scope overlap)', () => {
  const SCOPES: Array<{ branch?: unknown; batch?: unknown; division?: unknown; section?: unknown }> = [
    { branch: 'BBA', batch: '2026-2027', division: 'A,B,C,D' },
    { branch: 'BBA', batch: '2027', division: 'A' },
    { branch: 'BBA', batch: '2027', section: 'A' },
    { branch: 'BBA', batch: '2026', division: 'B' },
    { branch: 'B.Com', batch: '2027', division: 'A' },
    { branch: 'BBA', batch: '2027', division: '' },
    { division: 'Div A, Div B' },
    {},
    { batch: '' },
  ]

  it('agrees on the letters of a field', () => {
    for (const value of ['A,B,C,D', 'Div A, Div B', 'ABCD', '', 'Div', 'a b', null]) {
      assert.deepEqual(cohortLetters(value), browserCohortLetters(value, 'division'), `cohortLetters(${String(value)})`)
    }
  })

  it('agrees on division-scope overlap for every pair', () => {
    for (const left of SCOPES) {
      for (const right of SCOPES) {
        assert.equal(
          divisionScopesOverlap(left, right),
          browserDivisionScopesOverlap(left, right),
          `divisionScopesOverlap(${JSON.stringify(left)}, ${JSON.stringify(right)})`,
        )
      }
    }
  })

  it('agrees on cohort-scope overlap for every pair', () => {
    for (const left of SCOPES) {
      for (const right of SCOPES) {
        assert.equal(
          cohortScopesOverlap(left, right),
          browserCohortScopesOverlap(left, right),
          `cohortScopesOverlap(${JSON.stringify(left)}, ${JSON.stringify(right)})`,
        )
      }
    }
  })
})
