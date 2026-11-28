// functions/test/cohortKey.test.ts
// ─── Derived cohort identity ────────────────────────────────────────────────
//
// One string identifies a class: college|programme|batch|semester|sections.
// These cases pin the shape, pin the spelling-independence (the whole point),
// pin the trap that the padded semester must never leak onto documents, and
// finally pin the SERVER and BROWSER copies together so they cannot drift.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  cohortKey,
  cohortKeyCovers,
  cohortKeyIsComplete,
  cohortKeyParts,
  cohortKeysMatch,
  normalizeCollegeKey,
  normalizeProgrammeKey,
  sectionsKey,
  semesterKey,
} from '../src/cohortKey.ts'
import {
  cohortKey as browserCohortKey,
  cohortKeyCovers as browserCohortKeyCovers,
  cohortKeyParts as browserCohortKeyParts,
  cohortKeyIsComplete as browserCohortKeyIsComplete,
  sectionsKey as browserSectionsKey,
  semesterKey as browserSemesterKey,
  normalizeProgrammeKey as browserNormalizeProgrammeKey,
  normalizeCollegeKey as browserNormalizeCollegeKey,
} from '../../src/shared/utils/cohortKey.ts'
import { normalizeSemester } from '../../src/shared/utils/cohortMatching.ts'

const BASE = {
  collegeId: 'vriddhi',
  branch: 'BBA',
  batch: '2027',
  semester: 3,
  section: 'A',
}

describe('cohortKey — shape', () => {
  it('joins five segments in a fixed order', () => {
    assert.equal(cohortKey(BASE), 'vriddhi|bba|2027|s03|a')
  })

  it('always emits exactly five segments, even when fields are blank', () => {
    const key = cohortKey({})
    assert.equal(key, '||||')
    assert.equal(key.split('|').length, 5)
  })

  it('zero-pads to two digits and keeps larger semesters intact', () => {
    assert.equal(cohortKeyParts({ ...BASE, semester: 1 }).semester, 's01')
    assert.equal(cohortKeyParts({ ...BASE, semester: 9 }).semester, 's09')
    assert.equal(cohortKeyParts({ ...BASE, semester: 10 }).semester, 's10')
    assert.equal(cohortKeyParts({ ...BASE, semester: 12 }).semester, 's12')
  })
})

describe('cohortKey — spelling independence (the reason it exists)', () => {
  it('treats every spelling of one cohort as the same key', () => {
    const spellings = [
      { branch: 'BBA', batch: '2027', semester: 3, section: 'A' },
      { branch: 'B.B.A', batch: '2026-2027', semester: 3, section: 'A' },
      { branch: ' bba ', batch: '2026-27', semester: '3', section: 'Section A' },
      { branch: 'BBA', batch: '2026/2027', semester: 3, division: 'Div A' },
      { branch: 'BBA', batch: 2027, semester: 3, section: 'sec. a' },
      { branch: 'BBA', batch: ' 2026 – 2027 ', semester: 3, section: 'A' },
    ]
    const keys = spellings.map((fields) => cohortKey({ collegeId: 'vriddhi', ...fields }))
    for (const key of keys) {
      assert.equal(key, 'vriddhi|bba|2027|s03|a', `spelling produced ${key}`)
    }
    assert.equal(new Set(keys).size, 1)
  })

  it('falls back to department when branch is absent (bulk import)', () => {
    assert.equal(
      cohortKey({ ...BASE, branch: undefined, department: 'B.B.A' }),
      cohortKey(BASE),
    )
  })

  it('keeps a genuine difference a difference', () => {
    const base = cohortKey(BASE)
    assert.notEqual(cohortKey({ ...BASE, branch: 'BCA' }), base, 'different programme')
    assert.notEqual(cohortKey({ ...BASE, batch: '2026' }), base, 'different intake')
    assert.notEqual(cohortKey({ ...BASE, semester: 4 }), base, 'different semester')
    assert.notEqual(cohortKey({ ...BASE, section: 'E' }), base, 'different section')
    assert.notEqual(cohortKey({ ...BASE, collegeId: 'other' }), base, 'different college')
  })

  it('does not let a bare start year claim an academic-year range', () => {
    assert.notEqual(
      cohortKey({ ...BASE, batch: '2026' }),
      cohortKey({ ...BASE, batch: '2026-2027' }),
    )
  })
})

describe('sectionsKey', () => {
  it('sorts and de-duplicates the letter set', () => {
    assert.equal(sectionsKey({ section: 'B,A' }), 'a,b')
    assert.equal(sectionsKey({ section: 'A,B,C,D' }), 'a,b,c,d')
    assert.equal(sectionsKey({ section: 'Section A' }), 'a')
    assert.equal(sectionsKey({ division: 'Div B' }), 'b')
    assert.equal(sectionsKey({ division: 'A', section: 'A' }), 'a', 'union, not concat')
    assert.equal(sectionsKey({}), '')
  })

  it('makes an order-independent key', () => {
    assert.equal(sectionsKey({ section: 'C,A,B' }), sectionsKey({ section: 'a b c' }))
  })

  it('does not split a letter cluster that has no separator', () => {
    assert.equal(sectionsKey({ section: 'ABCD' }), 'abcd')
  })
})

describe('semesterKey', () => {
  it('accepts numbers and numeric strings', () => {
    assert.equal(semesterKey(3), 's03')
    assert.equal(semesterKey('3'), 's03')
    assert.equal(semesterKey(' 3 '), 's03')
    assert.equal(semesterKey(3.0), 's03')
  })

  it('refuses anything that is not a positive whole number', () => {
    assert.equal(semesterKey(''), '')
    assert.equal(semesterKey(null), '')
    assert.equal(semesterKey(undefined), '')
    assert.equal(semesterKey(0), '')
    assert.equal(semesterKey(-1), '')
    assert.equal(semesterKey(3.5), '')
    assert.equal(semesterKey('x'), '')
    // parseInt would read these as 3 — a typo must not become a cohort.
    assert.equal(semesterKey('3rd'), '')
    assert.equal(semesterKey('3 X'), '')
    assert.equal(semesterKey('s003'), '')
  })
})

describe('the alphanumeric-semester trap', () => {
  // THE reason "s001"-style ids must never be written to `semester`.
  it('shows why a padded id on the document would be a wildcard, not a cohort', () => {
    assert.equal(Number('s001').toString(), 'NaN')
    assert.equal(normalizeSemester('s001'), null, 'browser matcher reads it as UNKNOWN')
    // Unknown semester = no constraint, so such a class matches EVERY student.
    assert.equal(semesterKey('s001'), '', 'the key layer refuses it outright')
  })
})

describe('cohortKeyIsComplete', () => {
  it('accepts a fully identified cohort', () => {
    assert.equal(cohortKeyIsComplete(BASE), true)
  })

  it('rejects a key that is missing any identity field', () => {
    for (const field of ['collegeId', 'branch', 'batch', 'semester', 'section'] as const) {
      assert.equal(
        cohortKeyIsComplete({ ...BASE, [field]: '' }),
        false,
        `missing ${field} must be incomplete`,
      )
    }
  })

  it('can tolerate a college with no section split when asked to', () => {
    const noSection = { ...BASE, section: '' }
    assert.equal(cohortKeyIsComplete(noSection), false)
    assert.equal(cohortKeyIsComplete(noSection, { requireSection: false }), true)
  })

  it('rejects a semester that only looks present', () => {
    assert.equal(cohortKeyIsComplete({ ...BASE, semester: 's03' }), false)
  })
})

describe('cohortKeysMatch', () => {
  it('compares keys strictly', () => {
    const key = cohortKey(BASE)
    assert.equal(cohortKeysMatch(key, cohortKey({ ...BASE, section: 'Section A' })), true)
    assert.equal(cohortKeysMatch(key, cohortKey({ ...BASE, semester: 4 })), false)
    assert.equal(cohortKeysMatch(key, undefined), false)
    assert.equal(cohortKeysMatch('', undefined), true, 'two blanks are both "no key"')
  })
})

describe('cohortKey — normalisers', () => {
  it('keeps programme internals distinct but drops punctuation', () => {
    assert.equal(normalizeProgrammeKey('B.B.A'), 'bba')
    assert.equal(normalizeProgrammeKey('M. Tech'), 'm tech')
    assert.notEqual(normalizeProgrammeKey('BBA IT'), normalizeProgrammeKey('BBA'))
  })

  it('does not strip punctuation from opaque college ids', () => {
    assert.equal(normalizeCollegeKey('  Vriddhi College  '), 'vriddhi-college')
  })
})

describe('cohortKeyCovers — hierarchical matching', () => {
  const student = cohortKey(BASE) // 'vriddhi|bba|2027|s03|a'
  const other = (patch: Record<string, unknown>) => cohortKey({ ...BASE, ...patch })

  it('matches a class that covers the student\'s section', () => {
    assert.equal(cohortKeyCovers(other({ section: 'A' }), student), true)
    assert.equal(cohortKeyCovers(other({ section: 'A,B' }), student), true)
    assert.equal(cohortKeyCovers(other({ section: 'A,B,C,D' }), student), true)
    assert.equal(cohortKeyCovers(other({ section: 'A,C' }), student), true)
  })

  it('rejects a class that does not cover the student\'s section', () => {
    assert.equal(cohortKeyCovers(other({ section: 'E' }), student), false)
    assert.equal(cohortKeyCovers(other({ section: 'B,C,D' }), student), false)
  })

  it('never crosses programme, intake, semester or college', () => {
    assert.equal(cohortKeyCovers(other({ branch: 'BCA', section: 'A,B,C,D' }), student), false)
    assert.equal(cohortKeyCovers(other({ batch: '2026', section: 'A,B,C,D' }), student), false)
    assert.equal(cohortKeyCovers(other({ semester: 4, section: 'A,B,C,D' }), student), false)
    assert.equal(cohortKeyCovers(other({ collegeId: 'other', section: 'A,B,C,D' }), student), false)
  })

  it('treats a blank section set on either side as a wildcard', () => {
    assert.equal(cohortKeyCovers(other({ section: '' }), student), true, 'class-wide lecture')
    const noSection = cohortKey({ ...BASE, section: '' })
    assert.equal(cohortKeyCovers(other({ section: 'A' }), noSection), true, 'student with no section')
  })

  it('is strict about identity even when sections would overlap', () => {
    const classKey = other({ section: 'A,B,C,D' })
    assert.equal(cohortKeysMatch(classKey, student), false, 'strict equality is exact')
    assert.equal(cohortKeyCovers(classKey, student), true, 'coverage is hierarchical')
  })

  it('rejects malformed keys instead of guessing', () => {
    assert.equal(cohortKeyCovers('vriddhi|bba|2027', student), false)
    assert.equal(cohortKeyCovers('', student), false)
    assert.equal(cohortKeyCovers(student, 'nonsense'), false)
  })
})

describe('server copy ≡ browser copy', () => {
  const FIELDS = [
    BASE,
    { ...BASE, branch: undefined, department: 'B.B.A' },
    { ...BASE, batch: '2026-27' },
    { ...BASE, semester: '3' },
    { ...BASE, semester: 'three' },
    { ...BASE, section: 'A,B,C,D' },
    { ...BASE, division: 'Div A, Div B' },
    { ...BASE, section: 'Section A / Sec. B' },
    { collegeId: 'Acme College', branch: 'M. Tech', batch: 2028, semester: 1, section: 'E' },
    { collegeId: '', branch: '', batch: '', semester: '', section: '' },
    {},
    { batch: null, semester: null, branch: null, section: null, division: null },
    { batch: '2026-2028', semester: 2, section: 'A' },
    { batch: '1999-00', semester: 1, section: 'A' },
    { batch: '2027,2028', semester: 5, section: 'B' },
  ]

  it('produces the same key for every field combination', () => {
    for (const fields of FIELDS) {
      assert.equal(
        cohortKey(fields),
        browserCohortKey(fields),
        `cohortKey disagreed for ${JSON.stringify(fields)}`,
      )
    }
  })

  it('produces the same segments for every field combination', () => {
    for (const fields of FIELDS) {
      assert.deepEqual(
        cohortKeyParts(fields),
        browserCohortKeyParts(fields),
        `cohortKeyParts disagreed for ${JSON.stringify(fields)}`,
      )
    }
  })

  it('agrees on completeness for every field combination', () => {
    for (const fields of FIELDS) {
      assert.equal(
        cohortKeyIsComplete(fields),
        browserCohortKeyIsComplete(fields),
        `cohortKeyIsComplete disagreed for ${JSON.stringify(fields)}`,
      )
    }
  })

  it('agrees on coverage for every pair of keys', () => {
    const keys = FIELDS.map((fields) => cohortKey(fields))
    for (const container of keys) {
      for (const member of keys) {
        assert.equal(
          cohortKeyCovers(container, member),
          browserCohortKeyCovers(container, member),
          `cohortKeyCovers(${container}, ${member})`,
        )
      }
    }
  })

  it('agrees on section letters and semester tokens', () => {
    const LETTERS = ['A,B', 'A,B,C,D', 'Div A, Div B', 'Section A / Sec. B', 'ABCD', '', 'Div', 'a b', null, 'C,A,B']
    for (const value of LETTERS) {
      assert.equal(sectionsKey({ section: value }), browserSectionsKey({ section: value }), `sections: ${String(value)}`)
      assert.equal(sectionsKey({ division: value }), browserSectionsKey({ division: value }), `divisions: ${String(value)}`)
    }
    const SEMESTERS = [1, 3, '3', ' 3 ', 3.0, 10, 12, 0, -1, 3.5, 'x', '', null, undefined, '3rd', 's003', 1e3]
    for (const value of SEMESTERS) {
      assert.equal(semesterKey(value), browserSemesterKey(value), `semester: ${String(value)}`)
    }
    for (const value of ['B.B.A', 'M. Tech', 'BBA IT', ' bba ', '', null]) {
      assert.equal(normalizeProgrammeKey(value), browserNormalizeProgrammeKey(value), `programme: ${String(value)}`)
    }
    for (const value of ['Acme College', ' vriddhi ', '', null]) {
      assert.equal(normalizeCollegeKey(value), browserNormalizeCollegeKey(value), `college: ${String(value)}`)
    }
  })
})
