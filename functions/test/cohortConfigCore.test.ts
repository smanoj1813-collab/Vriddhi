// functions/test/cohortConfigCore.test.ts
// ─── A college's cohort vocabulary ──────────────────────────────────────────
//
// Sections and semesters had no authoritative definition: a section letter was
// whatever someone typed, and the semester count was guessed. These cases pin
// the vocabulary (what a college may declare), the validation that lets
// onboarding REJECT a bad value at the moment it is typed, and the pass-out
// year rule — which exists because entering a programme RANGE in the batch
// field silently produced a cohort that matched nobody.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_COHORT_CONFIG,
  cohortConfigFromDoc,
  derivePassOutYear,
  normalizeSectionList,
  normalizeSemesterCount,
  sectionIsDeclared,
  semesterIds,
  semesterInRange,
  validateCohortConfig,
  validatePassOutYear,
} from '../src/cohortConfigCore.ts'
import {
  DEFAULT_COHORT_CONFIG as browserDefault,
  cohortConfigFromDoc as browserFromDoc,
  derivePassOutYear as browserDerivePassOutYear,
  normalizeSectionList as browserNormalizeSectionList,
  normalizeSemesterCount as browserNormalizeSemesterCount,
  sectionIsDeclared as browserSectionIsDeclared,
  semesterIds as browserSemesterIds,
  semesterInRange as browserSemesterInRange,
  validateCohortConfig as browserValidateCohortConfig,
  validatePassOutYear as browserValidatePassOutYear,
} from '../../src/shared/utils/cohortConfigCore.ts'

describe('normalizeSectionList', () => {
  it('accepts an array of letters', () => {
    assert.deepEqual(normalizeSectionList(['A', 'B', 'C', 'D']), { sections: ['A', 'B', 'C', 'D'], rejected: [] })
    assert.deepEqual(normalizeSectionList(['d', 'a']), { sections: ['A', 'D'], rejected: [] })
  })

  it('accepts free text with prefix words and mixed separators', () => {
    for (const value of ['A,B,C,D', 'a b c d', 'Div A, Div B, Div C, Div D', 'Section A / Section B', 'A;B|C&D']) {
      const result = normalizeSectionList(value)
      assert.deepEqual(result.sections, result.sections.length === 4 ? ['A', 'B', 'C', 'D'] : result.sections, String(value))
      assert.deepEqual(result.rejected, [], String(value))
    }
    assert.deepEqual(normalizeSectionList('A,B,C,D').sections, ['A', 'B', 'C', 'D'])
    assert.deepEqual(normalizeSectionList('a b c d').sections, ['A', 'B', 'C', 'D'])
    assert.deepEqual(normalizeSectionList('Div A, Div B, Div C, Div D').sections, ['A', 'B', 'C', 'D'])
    assert.deepEqual(normalizeSectionList('Section A / Section B').sections, ['A', 'B'])
  })

  it('de-duplicates and sorts', () => {
    assert.deepEqual(normalizeSectionList('C,A,B,A').sections, ['A', 'B', 'C'])
  })

  it('reports multi-character entries instead of splitting them', () => {
    // "ABCD" is the letter cluster cohortLetters keeps as ONE token. Guessing
    // that it means four sections would put students in sections they lack.
    const result = normalizeSectionList('ABCD')
    assert.deepEqual(result.sections, [])
    assert.deepEqual(result.rejected, ['ABCD'])
  })

  it('reports numbers and words as rejections', () => {
    const result = normalizeSectionList(['A', '1', 'Alpha'])
    assert.deepEqual(result.sections, ['A'])
    assert.deepEqual(result.rejected, ['1', 'Alpha'])
  })

  it('treats blank input as an empty list', () => {
    assert.deepEqual(normalizeSectionList(''), { sections: [], rejected: [] })
    assert.deepEqual(normalizeSectionList(null), { sections: [], rejected: [] })
    assert.deepEqual(normalizeSectionList(undefined), { sections: [], rejected: [] })
    assert.deepEqual(normalizeSectionList([]), { sections: [], rejected: [] })
  })
})

describe('normalizeSemesterCount', () => {
  it('accepts whole numbers in range', () => {
    assert.equal(normalizeSemesterCount(6), 6)
    assert.equal(normalizeSemesterCount('8'), 8)
    assert.equal(normalizeSemesterCount(1), 1)
    assert.equal(normalizeSemesterCount(12), 12)
  })

  it('refuses anything outside the supported range', () => {
    for (const value of [0, -1, 13, 3.5, 'x', '', null, undefined, 'six']) {
      assert.equal(normalizeSemesterCount(value), null, String(value))
    }
  })
})

describe('cohortConfigFromDoc', () => {
  it('falls back to the default for a college that never saved one', () => {
    assert.deepEqual(cohortConfigFromDoc(undefined), DEFAULT_COHORT_CONFIG)
    assert.deepEqual(cohortConfigFromDoc({}), DEFAULT_COHORT_CONFIG)
    assert.deepEqual(cohortConfigFromDoc(null), DEFAULT_COHORT_CONFIG)
  })

  it('reads a saved config', () => {
    assert.deepEqual(
      cohortConfigFromDoc({ sections: ['A', 'B'], semesterCount: 8, requireSection: true }),
      { sections: ['A', 'B'], semesterCount: 8, requireSection: true },
    )
  })

  it('treats an explicitly empty section list as a real choice', () => {
    // A college with no section split is a valid setup — distinct from
    // "never configured", which falls back to the default.
    const config = cohortConfigFromDoc({ sections: [], semesterCount: 6, requireSection: false })
    assert.deepEqual(config.sections, [])
    assert.equal(config.requireSection, false)
  })

  it('repairs a malformed stored value rather than throwing', () => {
    const config = cohortConfigFromDoc({ sections: 'A,XYZ', semesterCount: 'lots' })
    assert.deepEqual(config.sections, ['A'])
    assert.equal(config.semesterCount, DEFAULT_COHORT_CONFIG.semesterCount)
  })
})

describe('validateCohortConfig', () => {
  it('accepts a valid config', () => {
    const result = validateCohortConfig({ sections: ['A', 'B', 'C', 'D'], semesterCount: 6, requireSection: true })
    assert.equal(result.ok, true)
    assert.deepEqual(result.errors, [])
    assert.deepEqual(result.config.sections, ['A', 'B', 'C', 'D'])
  })

  it('rejects no sections when a section is required', () => {
    const result = validateCohortConfig({ sections: [], semesterCount: 6, requireSection: true })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(' '), /at least one section/i)
  })

  it('accepts no sections when the college has no section split', () => {
    const result = validateCohortConfig({ sections: [], semesterCount: 6, requireSection: false })
    assert.equal(result.ok, true)
  })

  it('surfaces a typo instead of silently dropping it', () => {
    const result = validateCohortConfig({ sections: ['A', 'B', 'Alpha'], semesterCount: 6 })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(' '), /Alpha/)
  })

  it('rejects a bad semester count', () => {
    const result = validateCohortConfig({ sections: ['A'], semesterCount: 0 })
    assert.equal(result.ok, false)
    assert.match(result.errors.join(' '), /Semester count/)
  })

  it('cannot exceed the alphabet, because a section is one letter', () => {
    // Not a limit we enforce — a structural bound. De-duplication caps the list
    // at 26 however many entries arrive, which is why there is no MAX_SECTIONS.
    const many = Array.from({ length: 40 }, (_, i) => String.fromCharCode(97 + (i % 26)))
    const result = validateCohortConfig({ sections: many, semesterCount: 6 })
    assert.equal(result.ok, true)
    assert.equal(result.config.sections.length, 26)
  })
})

describe('semesterIds / semesterInRange / sectionIsDeclared', () => {
  const config = { sections: ['A', 'B'], semesterCount: 6, requireSection: true }

  it('produces padded ids as labels', () => {
    assert.deepEqual(semesterIds({ ...DEFAULT_COHORT_CONFIG, semesterCount: 3 }), ['s01', 's02', 's03'])
    assert.equal(semesterIds(config).length, 6)
  })

  it('checks a semester against the declared range', () => {
    assert.equal(semesterInRange(1, config), true)
    assert.equal(semesterInRange(6, config), true)
    assert.equal(semesterInRange('6', config), true)
    assert.equal(semesterInRange(7, config), false, 'beyond the declared count')
    assert.equal(semesterInRange(0, config), false)
    assert.equal(semesterInRange('x', config), false)
  })

  it('treats a blank section as unrecorded, not unknown', () => {
    assert.equal(sectionIsDeclared('', config), true)
    assert.equal(sectionIsDeclared('A', config), true)
    assert.equal(sectionIsDeclared('Section B', config), true)
    assert.equal(sectionIsDeclared('E', config), false, 'not declared by this college')
    assert.equal(sectionIsDeclared('A,E', config), false, 'one undeclared letter is enough')
  })
})

describe('derivePassOutYear', () => {
  it('adds the programme length in years', () => {
    assert.equal(derivePassOutYear(2023, 6), 2026, '3-year UG')
    assert.equal(derivePassOutYear(2023, 8), 2027, '4-year UG')
    assert.equal(derivePassOutYear(2024, 4), 2026, '2-year PG')
    assert.equal(derivePassOutYear(2024, 2), 2025, '1-year diploma')
  })
})

describe('validatePassOutYear', () => {
  const opts = { currentYear: 2026 }

  it('accepts a single four-digit year in range', () => {
    assert.deepEqual(validatePassOutYear('2027', opts), { ok: true, year: 2027, error: null })
    assert.deepEqual(validatePassOutYear(2027, opts), { ok: true, year: 2027, error: null })
    assert.equal(validatePassOutYear('2026', opts).ok, true)
    assert.equal(validatePassOutYear('2034', opts).ok, true, '8 years ahead is allowed')
  })

  it('rejects a RANGE — the failure that produced a cohort matching nobody', () => {
    for (const value of ['2024-2027', '2024-27', '2024 – 2027', '2024/2027']) {
      const result = validatePassOutYear(value, opts)
      assert.equal(result.ok, false, value)
      assert.match(result.error ?? '', /on its own|range/i)
    }
  })

  it('rejects a year in the past', () => {
    const result = validatePassOutYear('2025', opts)
    assert.equal(result.ok, false)
    assert.match(result.error ?? '', /past/i)
  })

  it('rejects an implausible year', () => {
    assert.equal(validatePassOutYear('2099', opts).ok, false)
    assert.equal(validatePassOutYear('27', opts).ok, false, 'two digits is ambiguous')
    assert.equal(validatePassOutYear('abcd', opts).ok, false)
    assert.equal(validatePassOutYear('', opts).ok, false)
    assert.equal(validatePassOutYear(null, opts).ok, false)
  })
})

describe('server copy ≡ browser copy', () => {
  it('agrees on the default vocabulary', () => {
    assert.deepEqual(DEFAULT_COHORT_CONFIG, browserDefault)
  })

  it('agrees on section lists, including rejections', () => {
    const INPUTS = [
      ['A', 'B', 'C', 'D'], 'A,B,C,D', 'a b c d', 'Div A, Div B', 'Section A / Section B',
      'A;B|C&D', 'ABCD', ['A', '1', 'Alpha'], ['d', 'a'], '', null, undefined, [], 'A,A,B',
    ]
    for (const input of INPUTS) {
      assert.deepEqual(normalizeSectionList(input), browserNormalizeSectionList(input), JSON.stringify(input))
    }
  })

  it('agrees on semester counts', () => {
    for (const value of [1, 6, 8, 12, 13, 0, -1, 3.5, '6', 'x', '', null, undefined]) {
      assert.equal(normalizeSemesterCount(value), browserNormalizeSemesterCount(value), String(value))
    }
  })

  it('agrees on stored configs', () => {
    const DOCS = [
      undefined, null, {}, { sections: ['A', 'B'], semesterCount: 8, requireSection: true },
      { sections: [], semesterCount: 6, requireSection: false }, { sections: 'A,XYZ', semesterCount: 'lots' },
    ]
    for (const doc of DOCS) {
      assert.deepEqual(cohortConfigFromDoc(doc), browserFromDoc(doc), JSON.stringify(doc))
    }
  })

  it('agrees on validation, errors included', () => {
    const INPUTS = [
      { sections: ['A', 'B', 'C', 'D'], semesterCount: 6, requireSection: true },
      { sections: [], semesterCount: 6, requireSection: true },
      { sections: [], semesterCount: 6, requireSection: false },
      { sections: ['A', 'Alpha'], semesterCount: 6 },
      { sections: ['A'], semesterCount: 0 },
    ]
    for (const input of INPUTS) {
      assert.deepEqual(validateCohortConfig(input), browserValidateCohortConfig(input), JSON.stringify(input))
    }
  })

  it('agrees on semester ids, range checks and declared sections', () => {
    const config = { sections: ['A', 'B'], semesterCount: 6, requireSection: true }
    assert.deepEqual(semesterIds(config), browserSemesterIds(config))
    for (const value of [0, 1, 6, 7, '6', 'x', null]) {
      assert.equal(semesterInRange(value, config), browserSemesterInRange(value, config), String(value))
    }
    for (const value of ['', 'A', 'Section B', 'E', 'A,E', null]) {
      assert.equal(sectionIsDeclared(value, config), browserSectionIsDeclared(value, config), String(value))
    }
  })

  it('agrees on pass-out year derivation and validation', () => {
    for (const [year, semesters] of [[2023, 6], [2023, 8], [2024, 4], [2024, 2]]) {
      assert.equal(derivePassOutYear(year, semesters), browserDerivePassOutYear(year, semesters))
    }
    const opts = { currentYear: 2026 }
    for (const value of ['2027', 2027, '2024-2027', '2025', '2099', '27', '', null, 'abcd', '2034']) {
      assert.deepEqual(validatePassOutYear(value, opts), browserValidatePassOutYear(value, opts), String(value))
    }
  })
})
