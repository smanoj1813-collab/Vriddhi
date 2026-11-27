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

// ─── The college's declared vocabulary ──────────────────────────────────────
//
// A row is now also checked against the college's declared sections and
// semester count. Two mistakes are easy to make here and both were made while
// writing this code, so they are pinned:
//
//   1. Enforcing the PLATFORM DEFAULT on a college that never configured
//      anything. A PG college (8 semesters) or one running sections A–F would
//      have live imports rejected because of a default it never chose.
//   2. Downgrading the MISSING-division error to "only if configured". That
//      re-opens the original bug, where a row imported fine and the student was
//      invisible to every roster.

describe('validateStudentCohortRow — declared vocabulary', () => {
  const complete = { department: 'BBA', batch: '2027', division: 'C', semester: '3' }
  const config = { sections: ['A', 'B', 'C', 'D'], semesterCount: 6, requireSection: true }

  it('accepts a declared section letter', () => {
    for (const division of ['A', 'B', 'C', 'D']) {
      assert.equal(validateStudentCohortRow({ ...complete, division }, config, { declared: true }), null)
    }
  })

  it('rejects an undeclared letter, naming the declared set', () => {
    const error = validateStudentCohortRow({ ...complete, division: 'E' }, config, { declared: true }) ?? ''
    assert.match(error, /not one of this college's sections/i)
    assert.match(error, /A, B, C, D/, 'the message must show what is allowed')
  })

  it('accepts the letter from either field', () => {
    assert.equal(
      validateStudentCohortRow({ ...complete, division: '', section: 'B' }, config, { declared: true }),
      null,
      'section-only row',
    )
    assert.match(
      validateStudentCohortRow({ ...complete, division: '', section: 'F' }, config, { declared: true }) ?? '',
      /not one of this college's sections/i,
      'an undeclared section-only row is still rejected',
    )
  })

  it('rejects a semester beyond the declared count', () => {
    const error = validateStudentCohortRow({ ...complete, semester: '7' }, config, { declared: true }) ?? ''
    assert.match(error, /1-6/)
  })

  it('accepts any letter and up to 12 semesters when NOTHING is declared', () => {
    // Today's behaviour must survive: an unconfigured college imports unchanged.
    for (const division of ['A', 'E', 'F', 'Z']) {
      assert.equal(validateStudentCohortRow({ ...complete, division }, config, { declared: false }), null, division)
    }
    for (const semester of ['1', '7', '8', '12']) {
      assert.equal(validateStudentCohortRow({ ...complete, semester }, config, { declared: false }), null, semester)
    }
    assert.match(validateStudentCohortRow({ ...complete, semester: '13' }, config, { declared: false }) ?? '', /1-12/)
  })

  it('ALWAYS rejects a missing division, configured or not', () => {
    // The safeguard that once prevented 343 unplaceable students must not
    // depend on configuration.
    for (const declared of [true, false]) {
      assert.match(
        validateStudentCohortRow({ ...complete, division: '' }, config, { declared }) ?? '',
        /Missing division/i,
        `declared=${declared}`,
      )
      assert.match(
        validateStudentCohortRow({ ...complete, division: undefined }, config, { declared }) ?? '',
        /Missing division/i,
        `declared=${declared}`,
      )
    }
  })

  it('ACCEPTS the academic-year range this college actually stores', () => {
    // Real data uses "2026-2027" (see the dry run: every sampled row). The
    // canonicaliser reads it as the class of 2027, and imports must not refuse
    // it — that would reject the college's own convention.
    for (const batch of ['2026-2027', '2026-27', '2026/2027']) {
      assert.equal(
        validateStudentCohortRow({ ...complete, batch }, config, { declared: true }),
        null,
        batch,
      )
    }
  })

  it('rejects a multi-year SPAN, which names no single cohort', () => {
    // A three/four-year programme span survives canonicalisation as a literal,
    // so it matches no pass-out year and would import a student into a class
    // that does not exist.
    for (const batch of ['2024-2027', '2025-2028']) {
      const error = validateStudentCohortRow({ ...complete, batch }, config, { declared: true }) ?? ''
      assert.match(error, /spans several years/i, batch)
    }
  })

  it('accepts a PAST pass-out year — re-importing a live batch is legitimate', () => {
    // Whether a cohort has graduated is a policy question, not a data-entry
    // one. Rejecting past years would break re-imports.
    assert.equal(validateStudentCohortRow({ ...complete, batch: '2023' }, config, { declared: true }), null)
    assert.equal(validateStudentCohortRow({ ...complete, batch: '2019' }, config, { declared: true }), null)
  })
})
