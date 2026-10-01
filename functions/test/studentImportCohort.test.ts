// functions/test/studentImportCohort.test.ts
// ─── Student import: the cohort fields a row must carry ─────────────────────
//
// `bulkCreateStudentAccounts` used to require only a name and an email, and
// defaulted a missing semester to 1. A college imported 343 students that way:
// every row succeeded, and every roster, curriculum mapping and timetable
// missed them, because the profiles carried no department (the `branch`),
// batch or division and all sat in semester 1. The import result said
// "created", so nothing pointed at the file.
//
// These cases pin the per-row rule that replaced it: a row that cannot be
// placed in a class is rejected WITH the reason, so the operator fixes the CSV
// instead of hunting through Firestore.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateStudentCohortRow } from '../src/studentAuth.ts'

describe('validateStudentCohortRow', () => {
  const complete = { department: 'BBA', batch: '2027', division: 'C', semester: '3' }

  it('accepts a row that names the whole class', () => {
    assert.equal(validateStudentCohortRow(complete), null)
    assert.equal(validateStudentCohortRow({ ...complete, semester: 3 }), null)
    assert.equal(validateStudentCohortRow({ ...complete, batch: 2027 }), null)
    assert.equal(validateStudentCohortRow({ ...complete, division: ' c ' }), null)
    // Semester 1 is a real semester, not a sentinel (see the next test).
    assert.equal(validateStudentCohortRow({ ...complete, semester: '1' }), null)
    assert.equal(validateStudentCohortRow({ ...complete, semester: '12' }), null)
  })

  it('rejects a row with no semester instead of defaulting it to 1', () => {
    // This is the exact trap: `normalizeSemester(undefined)` returned 1, so
    // the row imported and the student was invisible to every semester-3 and
    // semester-4 mapping.
    assert.match(validateStudentCohortRow({ ...complete, semester: undefined }) ?? '', /Missing semester/i)
    assert.match(validateStudentCohortRow({ ...complete, semester: '' }) ?? '', /Missing semester/i)
    assert.match(validateStudentCohortRow({ ...complete, semester: '   ' }) ?? '', /Missing semester/i)
  })

  it('rejects a semester outside 1–12 with the offending value quoted', () => {
    assert.match(validateStudentCohortRow({ ...complete, semester: '0' }) ?? '', /Invalid semester "0"/)
    assert.match(validateStudentCohortRow({ ...complete, semester: '13' }) ?? '', /Invalid semester "13"/)
    assert.match(validateStudentCohortRow({ ...complete, semester: 'three' }) ?? '', /Invalid semester "three"/)
    assert.match(validateStudentCohortRow({ ...complete, semester: '2.5' }) ?? '', /Invalid semester "2\.5"/)
  })

  it('rejects a row missing department (the profile branch)', () => {
    // `department` is what the student profile calls `branch`, and every
    // roster compares it against the class's branch.
    const message = validateStudentCohortRow({ ...complete, department: undefined })
    assert.match(message ?? '', /Missing department\/branch/i)
  })

  it('rejects a row missing batch — the cohort key the mappings use', () => {
    assert.match(validateStudentCohortRow({ ...complete, batch: '' }) ?? '', /Missing batch/i)
    assert.match(validateStudentCohortRow({ ...complete, batch: undefined }) ?? '', /Missing batch/i)
  })

  it('rejects a row missing division', () => {
    assert.match(validateStudentCohortRow({ ...complete, division: '' }) ?? '', /Missing division/i)
    assert.match(validateStudentCohortRow({ ...complete, division: undefined }) ?? '', /Missing division/i)
  })
})
