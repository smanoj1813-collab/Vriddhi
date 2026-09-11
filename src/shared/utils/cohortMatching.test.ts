// src/shared/utils/cohortMatching.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the roster-matching rules behind "Mark Attendance". Every case here
// was a live way for a real class to report "0 students" against a college
// full of bulk-imported students, or for the diagnostics to miscount.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  extractStudentCohortFields,
  matchCohortRows,
  matchStudentToCohort,
  normalizeCohortToken,
  normalizeDivision,
  normalizeProgramName,
  normalizeSemester,
  normalizeSection,
  normalizeSubjectToken,
  type CohortCriteria,
} from './cohortMatching'

const COLLEGE = 'college-a'

function criteria(overrides: Partial<CohortCriteria> = {}): CohortCriteria {
  return {
    collegeId: COLLEGE,
    branch: 'BBA',
    batch: '2027',
    division: 'A',
    section: 'B',
    semester: 3,
    subject: 'Language-I (Lang3.1)',
    subjectCode: 'Lang3.1',
    ...overrides,
  }
}

/**
 * A bulk-imported student document as studentAuth.ts writes it. The defaults
 * describe a student who IS in the default criteria's cohort, so tests can
 * isolate one field at a time; the "bulk import defaults a missing semester
 * to 1" scenario is exercised explicitly via `student({ semester: 1 })`.
 */
function student(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    collegeId: COLLEGE,
    name: 'Test Student',
    department: 'BBA',
    batch: '2027',
    division: 'A',
    semester: 3,
    ...overrides,
  }
}

function matches(row: Record<string, unknown>, c: CohortCriteria = criteria()): boolean {
  return matchStudentToCohort(extractStudentCohortFields(row), c).match
}

describe('normalisation helpers', () => {
  it('normalises program names across case, whitespace and punctuation', () => {
    assert.equal(normalizeProgramName('BBA'), normalizeProgramName('bba'))
    assert.equal(normalizeProgramName(' BBA '), normalizeProgramName('BBA'))
    // Dots between letters drop entirely: "B.B.A" IS "BBA".
    assert.equal(normalizeProgramName('B.B.A'), normalizeProgramName('BBA'))
    // Dots that replace a space become no character, not a space: "M. Tech"
    // IS "M Tech".
    assert.equal(normalizeProgramName('M. Tech'), normalizeProgramName('M Tech'))
    // (A space already present in the source stays: "B. A." → "b a".)
    assert.equal(normalizeProgramName('B. A. '), 'b a')
    // Internal structure is preserved: different programs stay different.
    assert.notEqual(normalizeProgramName('BBA'), normalizeProgramName('BBA IT'))
  })

  it('normalises batches as numeric-vs-string and case/whitespace variants', () => {
    assert.equal(normalizeCohortToken(2027), normalizeCohortToken('2027'))
    assert.equal(normalizeCohortToken(' 2027 '), normalizeCohortToken(2027))
    assert.equal(normalizeCohortToken('A'), normalizeCohortToken('a'))
    assert.notEqual(normalizeCohortToken(2027), normalizeCohortToken(2026))
  })

  it('normalises divisions and sections independently, with prefixes', () => {
    assert.equal(normalizeDivision('Div A'), normalizeDivision('a'))
    assert.equal(normalizeDivision('division a.'), normalizeDivision('A'))
    assert.equal(normalizeSection('Section B'), normalizeSection('b'))
    assert.equal(normalizeSection('sec. b'), normalizeSection('B'))
    // The two slots are distinct: a "div" prefix never leaks into section.
    assert.notEqual(normalizeDivision('Div A'), normalizeDivision('B'))
  })

  it('treats 0, blanks and junk as an unknown semester, never "semester zero"', () => {
    assert.equal(normalizeSemester(3), 3)
    assert.equal(normalizeSemester('3'), 3)
    assert.equal(normalizeSemester(0), null)
    assert.equal(normalizeSemester(''), null)
    assert.equal(normalizeSemester(undefined), null)
    assert.equal(normalizeSemester('x'), null)
  })

  it('normalises subject tokens to letters and digits only', () => {
    assert.equal(normalizeSubjectToken('Language-I (Lang3.1)'), normalizeSubjectToken('Language I (Lang 3.1)'))
    assert.equal(normalizeSubjectToken('Lang3.1'), 'lang31')
    assert.equal(normalizeSubjectToken('lang-3.1'), normalizeSubjectToken('Lang3.1'))
  })
})

describe('extractStudentCohortFields', () => {
  it('reads branch from the department fallback bulk import uses', () => {
    const fields = extractStudentCohortFields({ department: 'BBA' })
    assert.equal(fields.branch, 'BBA')
  })

  it('keeps division and section as separate fields', () => {
    const fields = extractStudentCohortFields({ division: 'A', section: 'B' })
    assert.equal(fields.division, 'A')
    assert.equal(fields.section, 'B')
  })

  it('collects subjects from strings or {name} objects', () => {
    const fields = extractStudentCohortFields({
      subjects: ['Language-I', { name: 'Mathematics-I' }],
      assignedSubjects: 'ignored',
    })
    assert.deepEqual(fields.subjects, ['Language-I', 'Mathematics-I'])
  })
})

describe('cohort matching — branch/batch formatting', () => {
  it('matches BBA against bba / whitespace / punctuation spellings', () => {
    assert.equal(matches(student({ department: 'bba' })), true)
    assert.equal(matches(student({ department: '  BBA  ' })), true)
    assert.equal(matches(student({ branch: 'B.B.A' })), true)
    assert.equal(matches(student({ department: 'BBA' })), true)
  })

  it('excludes a different program', () => {
    assert.equal(matches(student({ department: 'B.Com' })), false)
  })

  it('matches numeric and string batches', () => {
    assert.equal(matches(student({ batch: 2027 })), true)
    assert.equal(matches(student({ batch: ' 2027 ' })), true)
    assert.equal(matches(student({ batch: '2026' })), false)
  })

  it('applies no branch/batch constraint when the schedule leaves them blank', () => {
    const c = criteria({ branch: '', batch: '' })
    assert.equal(matches(student({ department: 'MCA', batch: '2026' }), c), true)
  })
})

describe('cohort matching — semester (the legacy-cohort rules)', () => {
  it('excludes a student whose known semester differs from the schedule', () => {
    // Bulk import defaults semester to 1 while the class is semester 3:
    // different cohorts, correctly excluded — and counted, not silent.
    assert.equal(matches(student({ semester: 1 })), false)
    assert.equal(matches(student({ semester: '3' })), true)
    assert.equal(matches(student({ semester: 3 })), true)
  })

  it('excludes a student with no semester when the schedule names one', () => {
    const c = criteria({ semester: 3 })
    assert.equal(matches(student({ semester: undefined }), c), false)
  })

  it('lets an unknown schedule semester pass, either way', () => {
    const c = criteria({ semester: 0 })
    assert.equal(matches(student({ semester: 1 }), c), true)
    assert.equal(matches(student({ semester: undefined }), c), true)
  })

  it('flags a mixed-semester match when the schedule did not constrain', () => {
    const { diagnostics } = matchCohortRows(
      [student({ semester: 1 }), student({ semester: 2 }), student({ semester: 1 })],
      criteria({ semester: 0 }),
      450,
    )
    assert.equal(diagnostics.matched, 3)
    assert.deepEqual(diagnostics.matchedSemesters, ['1', '2'])
  })

  it('reports no spread when the schedule constrains the semester', () => {
    const { diagnostics } = matchCohortRows(
      [student({ semester: 3 })],
      criteria({ semester: 3 }),
      450,
    )
    assert.equal(diagnostics.matchedSemesters, null)
  })
})

describe('cohort matching — division and section', () => {
  it('matches a student recorded under division against a class with division+section', () => {
    assert.equal(matches(student({ division: 'A' })), true)
  })

  it('matches a student recorded only under section against the class division', () => {
    // Legacy conflation: the letter lives in `section`, not `division`.
    assert.equal(matches(student({ division: '', section: 'A' })), true)
  })

  it('matches a student whose section letter is the class section letter', () => {
    assert.equal(matches(student({ division: '', section: 'B' })), true)
  })

  it('matches case and prefix variants of the letters', () => {
    assert.equal(matches(student({ division: 'div a' })), true)
    assert.equal(matches(student({ division: 'a', section: '' })), true)
  })

  it('excludes a student in a different letter with no overlap', () => {
    assert.equal(matches(student({ division: 'C' })), false)
    assert.equal(matches(student({ division: '', section: 'C' })), false)
  })

  it('excludes a student with no division/section when the class names one', () => {
    assert.equal(matches(student({ division: '', section: '' })), false)
  })

  it('matches any letter when the schedule names none', () => {
    const c = criteria({ division: '', section: '' })
    assert.equal(matches(student({ division: 'C' }), c), true)
    assert.equal(matches(student({ division: '', section: '' }), c), true)
  })
})

describe('cohort matching — subject filtering', () => {
  it('never filters out a student without a subject list', () => {
    assert.equal(matches(student({ subjects: undefined })), true)
  })

  it('matches subject names across formatting', () => {
    assert.equal(matches(student({ subjects: ['Language I (Lang 3.1)'] })), true)
    assert.equal(matches(student({ subjects: ['language-i'] })), true)
  })

  it('matches the subject code inside a longer name, and vice versa', () => {
    assert.equal(matches(student({ subjects: ['Lang3.1'] })), true)
    assert.equal(matches(student({ subjects: ['LANG-3.1'] })), true)
  })

  it('excludes a student enrolled in a different subject', () => {
    assert.equal(matches(student({ subjects: ['Mathematics-I (Math3.1)'] })), false)
    // A different course that merely shares the "(x3.1)" shape.
    assert.equal(matches(student({ subjects: ['Latin-I (Lat3.1)'] })), false)
  })

  it('accepts the course without its parenthesised code as the same course', () => {
    assert.equal(matches(student({ subjects: ['language-i'] })), true)
    // A bare shortening of the course name is the same course in fewer words.
    assert.equal(matches(student({ subjects: ['Language'] })), true)
  })
})

describe('cohort matching — tenant guard', () => {
  it('excludes a student from another college even if the query was mis-scoped', () => {
    const c = criteria({ collegeId: COLLEGE })
    assert.equal(matches(student({ collegeId: 'college-b' }), c), false)
  })

  it('applies no tenant constraint when either side is blank', () => {
    assert.equal(matches(student({ collegeId: '' })), true)
  })
})

describe('matchStudentToCohort — mismatch attribution', () => {
  it('reports every field a student individually fails', () => {
    const result = matchStudentToCohort(
      extractStudentCohortFields(student({ department: 'MCA', batch: '2026', semester: 1, division: 'C' })),
      criteria(),
    )
    assert.equal(result.match, false)
    for (const field of ['branch', 'batch', 'semester', 'division']) {
      assert.ok(result.mismatches.includes(field), `expected ${field} in ${result.mismatches}`)
    }
  })

  it('attributes a section-only miss to the section field', () => {
    const result = matchStudentToCohort(
      extractStudentCohortFields(student({ division: '', section: 'C', semester: 3 })),
      criteria(),
    )
    assert.ok(result.mismatches.includes('section'))
    assert.ok(!result.mismatches.includes('division'))
  })
})

describe('matchCohortRows — diagnostics', () => {
  it('counts per-field mismatches and the distinct raw values', () => {
    const rows = [
      // Semesters 1 and 2, sections A and C, one MCA student, one cross-college.
      student({ semester: 1, division: 'A' }),
      student({ semester: 2, division: 'A' }),
      student({ semester: 3, division: 'C' }),
      student({ semester: 3, department: 'MCA', division: 'A' }),
      student({ collegeId: 'college-b', semester: 3 }),
    ]
    const { matched, diagnostics } = matchCohortRows(rows, criteria(), 450)

    // Only row 3 fits every constraint... row 3 is division C → also out.
    assert.equal(matched.length, 0)
    assert.equal(diagnostics.collegeTotal, 5)
    assert.deepEqual(diagnostics.target, {
      branch: 'BBA',
      batch: '2027',
      division: 'A',
      section: 'B',
      semester: '3',
      subject: 'Language-I (Lang3.1)',
    })

    // Semester 1 and 2 students fail the semester check (schedule says 3).
    assert.equal(diagnostics.mismatches.semester?.count, 2)
    assert.deepEqual(diagnostics.mismatches.semester?.values, ['1', '2'])
    // Division C fails the letter check.
    assert.equal(diagnostics.mismatches.division?.count, 1)
    assert.deepEqual(diagnostics.mismatches.division?.values, ['C'])
    // MCA fails the branch check.
    assert.equal(diagnostics.mismatches.branch?.count, 1)
    assert.deepEqual(diagnostics.mismatches.branch?.values, ['MCA'])
    // The cross-college row fails the tenant guard.
    assert.equal(diagnostics.mismatches.collegeId?.count, 1)
    assert.deepEqual(diagnostics.mismatches.collegeId?.values, ['college-b'])
  })

  it('reports zero diagnostics when the cohort is healthy', () => {
    const { matched, diagnostics } = matchCohortRows(
      [
        student({ semester: 3 }),
        student({ semester: '3', division: '', section: 'B' }),
      ],
      criteria(),
      450,
    )
    assert.equal(matched.length, 2)
    assert.deepEqual(diagnostics.mismatches, {})
  })

  it('flags truncation when the college query returned its full limit', () => {
    const { diagnostics } = matchCohortRows([student({ semester: 1 })], criteria(), 1)
    assert.equal(diagnostics.truncated, true)
  })

  it('shows "(none)" for a student missing the semester the schedule requires', () => {
    const { diagnostics } = matchCohortRows(
      [student({ semester: undefined })],
      criteria({ semester: 3 }),
      450,
    )
    assert.equal(diagnostics.mismatches.semester?.count, 1)
    assert.deepEqual(diagnostics.mismatches.semester?.values, ['(none)'])
  })
})
