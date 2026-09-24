// src/shared/utils/studentFilters.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the superadmin Student Management filters: batch / branch / section
// selects and the (previously dead) search box. Uses the same normalisation as
// the attendance cohort matcher, so "BBA" = "B.B.A" and a student recorded
// under only `section: "A"` is found by the "A" filter.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  filterStudentRows,
  studentFilterOptions,
  studentMatchesFilters,
  type StudentFilterRow,
} from './studentFilters'

function student(overrides: Record<string, unknown> = {}): StudentFilterRow {
  return {
    name: 'Test Student',
    email: 'test@example.com',
    regNo: 'REG001',
    batch: '2027',
    branch: 'BBA',
    department: 'BBA',
    division: 'A',
    section: '',
    ...overrides,
  }
}

describe('studentMatchesFilters', () => {
  it('passes everything when no filter is set', () => {
    assert.equal(studentMatchesFilters(student(), {}), true)
  })

  it('matches batch as a normalised token (2027 = " 2027 ")', () => {
    assert.equal(studentMatchesFilters(student(), { batch: ' 2027 ' }), true)
    assert.equal(studentMatchesFilters(student({ batch: '2027' }), { batch: '2027' }), true)
    assert.equal(studentMatchesFilters(student(), { batch: '2026' }), false)
  })

  it('matches branch against branch OR the legacy department alias', () => {
    assert.equal(studentMatchesFilters(student({ branch: '', department: 'B.B.A' }), { branch: 'BBA' }), true)
    assert.equal(studentMatchesFilters(student({ branch: 'BBA IT' }), { branch: 'BBA' }), false)
    assert.equal(studentMatchesFilters(student(), { branch: 'bca' }), false)
  })

  it('matches the section letter through EITHER the division or section field', () => {
    // Recorded under section only (legacy import shape) — still found as "A".
    assert.equal(
      studentMatchesFilters(student({ division: '', section: 'Section A' }), { section: 'A' }),
      true
    )
    // Recorded under division only.
    assert.equal(studentMatchesFilters(student({ division: 'Div A' }), { section: 'a' }), true)
    // Letter genuinely differs.
    assert.equal(studentMatchesFilters(student({ division: 'B', section: '' }), { section: 'A' }), false)
  })

  it('searches name, email and reg no case-insensitively', () => {
    const row = student({ name: 'Ananya Rao', email: 'ananya@college.edu', regNo: 'BCU/2027/015' })
    assert.equal(studentMatchesFilters(row, { search: 'ananya' }), true)
    assert.equal(studentMatchesFilters(row, { search: 'COLLEGE.EDU' }), true)
    assert.equal(studentMatchesFilters(row, { search: '2027/015' }), true)
    assert.equal(studentMatchesFilters(row, { search: 'missing' }), false)
    assert.equal(studentMatchesFilters(row, { search: '   ' }), true) // blank = no constraint
  })

  it('combines filters with AND', () => {
    const row = student()
    assert.equal(studentMatchesFilters(row, { batch: '2027', branch: 'BBA', section: 'A' }), true)
    assert.equal(studentMatchesFilters(row, { batch: '2027', branch: 'BCA' }), false)
  })
})

describe('filterStudentRows', () => {
  it('preserves order and keeps only matches', () => {
    const rows = [
      student({ name: 'One', batch: '2026' }),
      student({ name: 'Two' }),
      student({ name: 'Three', division: 'B' }),
    ]
    assert.deepEqual(
      filterStudentRows(rows, { section: 'A' }).map((row) => row.name),
      ['One', 'Two']
    )
    assert.deepEqual(
      filterStudentRows(rows, { batch: '2026' }).map((row) => row.name),
      ['One']
    )
  })
})

describe('studentFilterOptions', () => {
  it('offers distinct values, collapsing normalised duplicates', () => {
    const rows = [
      student({ batch: '2027', branch: 'BBA', department: 'BBA', division: 'A' }),
      student({ batch: ' 2027 ', branch: 'B.B.A', department: 'B.B.A', division: 'B', section: 'B' }),
      student({ batch: '2026', branch: 'BCA', department: 'BCA', section: 'C' }),
    ]
    const options = studentFilterOptions(rows)
    assert.deepEqual(options.batches, ['2026', '2027']) // " 2027 " collapses into the first spelling
    assert.deepEqual(options.branches, ['BBA', 'BCA']) // "B.B.A" collapses into "BBA"
    assert.deepEqual(options.sections, ['A', 'B', 'C']) // "B" division + "B" section = one option
  })

  it('drops blanks and handles an empty list', () => {
    assert.deepEqual(studentFilterOptions([]), { batches: [], branches: [], sections: [] })
    const options = studentFilterOptions([student({ batch: '', branch: '', department: '', division: '', section: '' })])
    assert.deepEqual(options, { batches: [], branches: [], sections: [] })
  })
})
