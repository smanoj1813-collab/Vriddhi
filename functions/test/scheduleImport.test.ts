// functions/test/scheduleImport.test.ts
// ─── Bulk schedule import — CSV parsing + the pure import plan ──────────────
//
// The callable is again thin (identity + one read path + planScheduleImport +
// a batch write of the valid rows). Everything the admin sees in the preview
// — which row is invalid, which one clashes, which one is a duplicate, and
// which ones merely deserve a warning — is decided here.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  normalizeClassType,
  normalizeDay,
  parseCsv,
  planScheduleImport,
  validateScheduleImportPayload,
  type ImportExistingSchedule,
  type ImportMappingRef,
} from '../src/scheduleImport.ts'

// ─── CSV parsing ─────────────────────────────────────────────────────────────

describe('parseCsv', () => {
  it('handles quoted fields containing commas and escaped quotes', () => {
    // RFC-4180: a quote inside a quoted field is doubled.
    const rows = parseCsv('subject,room,notes\n"Financial, Accounting","R ""A"" 301","x,y"\n')
    assert.equal(rows.length, 1)
    assert.equal(rows[0].subject, 'Financial, Accounting')
    assert.equal(rows[0].room, 'R "A" 301')
    assert.equal(rows[0].notes, 'x,y')
  })

  it('lower-cases headers, trims cells and skips blank lines', () => {
    const rows = parseCsv('Subject ,FacultyId\n  Business Law  , uid-1 \n\n')
    assert.deepEqual(rows, [{ subject: 'Business Law', facultyid: 'uid-1' }])
  })

  it('returns [] for header-only or empty input', () => {
    assert.deepEqual(parseCsv('subject,facultyId'), [])
    assert.deepEqual(parseCsv(''), [])
  })

  it('accepts CRLF line endings', () => {
    const rows = parseCsv('subject,facultyId\r\nA,uid-1\r\nB,uid-2\r\n')
    assert.equal(rows.length, 2)
    assert.equal(rows[1].subject, 'B')
  })
})

// ─── Normalisation ───────────────────────────────────────────────────────────

describe('normalisation helpers', () => {
  it('maps day aliases case-insensitively', () => {
    assert.equal(normalizeDay('mon'), 'monday')
    assert.equal(normalizeDay('TUES'), 'tuesday')
    assert.equal(normalizeDay(' wednesday '), 'wednesday')
    assert.equal(normalizeDay('sunday'), 'sunday')
    assert.equal(normalizeDay('holiday'), null)
    assert.equal(normalizeDay(''), null)
  })

  it('folds type aliases onto the four canonical types', () => {
    assert.equal(normalizeClassType('Laboratory'), 'lab')
    assert.equal(normalizeClassType('practical'), 'lab')
    assert.equal(normalizeClassType('discussion'), 'tutorial')
    assert.equal(normalizeClassType('class'), 'lecture')
    assert.equal(normalizeClassType(''), 'lecture')
    assert.equal(normalizeClassType('field-trip'), 'lecture')
  })
})

// ─── Plan fixtures ───────────────────────────────────────────────────────────

function existingSchedule(over: Partial<ImportExistingSchedule> = {}): ImportExistingSchedule {
  return {
    id: over.id ?? 'exist-1',
    subject: over.subject ?? 'Cost Accounting',
    subjectCode: over.subjectCode ?? 'CA01',
    facultyId: over.facultyId ?? 'uid-x',
    branch: over.branch ?? 'B.Com',
    batch: over.batch ?? '2026',
    division: over.division ?? 'A',
    section: over.section ?? 'A',
    room: over.room ?? '301',
    dayOfWeek: over.dayOfWeek ?? 'monday',
    startTime: over.startTime ?? '09:00',
    endTime: over.endTime ?? '10:00',
    type: over.type ?? 'lecture',
    isActive: over.isActive ?? true,
  }
}

const NO_FACULTY = { byId: new Map<string, string>(), byName: new Map<string, string>() }

function planFor(
  rows: Record<string, string>[],
  over: {
    existing?: ImportExistingSchedule[]
    mappings?: ImportMappingRef[]
    byId?: Map<string, string>
  } = {},
) {
  return planScheduleImport({
    rawRows: rows.map((fields, i) => ({ line: i + 2, fields })),
    existing: over.existing ?? [],
    mappings: over.mappings ?? [],
    faculty: { byId: over.byId ?? NO_FACULTY.byId, byName: NO_FACULTY.byName },
  })
}

const VALID_ROW = {
  subject: 'Business Law',
  subjectCode: 'BL01',
  facultyId: 'uid-1',
  branch: 'B.Com',
  batch: '2026',
  semester: '4',
  division: 'A',
  section: 'A',
  room: '302',
  dayOfWeek: 'monday',
  startTime: '10:00',
  endTime: '11:00',
  type: 'lecture',
}

// ─── Validation ──────────────────────────────────────────────────────────────

describe('planScheduleImport — validation', () => {
  it('passes a well-formed row through as valid', () => {
    const plan = planFor([VALID_ROW], {
      byId: new Map([['uid-1', 'Dr. Rao']]),
      mappings: [
        {
          courseCode: 'BL01',
          courseName: 'Business Law',
          branch: 'B.Com',
          semester: 4,
          facultyId: 'uid-1',
          facultyName: 'Dr. Rao',
        },
      ],
    })
    assert.equal(plan.totals.valid, 1)
    assert.equal(plan.rows[0].status, 'valid')
    // Everything matches the mapping, so no warnings at all.
    assert.deepEqual(plan.rows[0].warnings, [])
  })

  it('collects every validation error on an invalid row', () => {
    const plan = planFor([
      {
        subject: '',
        subjectCode: 'X1',
        facultyId: '',
        dayOfWeek: 'holiday',
        startTime: '25:99',
        endTime: '08:00',
        semester: '11',
      },
    ])
    const row = plan.rows[0]
    assert.equal(row.status, 'invalid')
    // subject + facultyId + day + startTime format + semester = 5; the
    // end-after-start check is skipped while startTime itself is invalid.
    assert.equal(row.reasons.length, 5)
    assert.ok(row.reasons.some((r) => r.includes('subject is required')))
    assert.ok(row.reasons.some((r) => r.includes('facultyId is required')))
    assert.ok(row.reasons.some((r) => r.includes('day of the week')))
    assert.ok(row.reasons.some((r) => r.includes('startTime')))
    assert.ok(row.reasons.some((r) => r.includes('semester')))
    assert.equal(plan.totals.valid, 0)
  })

  it('rejects end times that do not start after the start time', () => {
    const plan = planFor([{ ...VALID_ROW, startTime: '10:00', endTime: '10:00' }])
    assert.equal(plan.rows[0].status, 'invalid')
    assert.ok(plan.rows[0].reasons.some((r) => r.includes('after startTime')))
  })
})

// ─── Duplicates ──────────────────────────────────────────────────────────────

describe('planScheduleImport — duplicates', () => {
  it('flags a second identical row inside the same file', () => {
    const plan = planFor([VALID_ROW, { ...VALID_ROW }])
    assert.equal(plan.rows[0].status, 'valid')
    assert.equal(plan.rows[1].status, 'duplicate')
    assert.ok(plan.rows[1].reasons[0].includes('earlier row'))
  })

  it('flags a row that reproduces an active schedule', () => {
    const plan = planFor([VALID_ROW], {
      existing: [
        existingSchedule({
          subject: 'Business Law',
          subjectCode: 'BL01',
          facultyId: 'uid-1',
          room: '302',
          startTime: '10:00',
          endTime: '11:00',
        }),
      ],
    })
    assert.equal(plan.rows[0].status, 'duplicate')
    assert.ok(plan.rows[0].reasons[0].includes('already scheduled'))
  })

  it('ignores inactive schedules when de-duplicating', () => {
    const plan = planFor([VALID_ROW], {
      existing: [
        existingSchedule({
          subject: 'Business Law',
          subjectCode: 'BL01',
          facultyId: 'uid-1',
          room: '302',
          startTime: '10:00',
          endTime: '11:00',
          isActive: false,
        }),
      ],
    })
    assert.equal(plan.rows[0].status, 'valid')
  })
})

// ─── Clashes ─────────────────────────────────────────────────────────────────

describe('planScheduleImport — clashes', () => {
  it('blocks a faculty double-booking', () => {
    const plan = planFor([{ ...VALID_ROW, room: '999' }], {
      existing: [existingSchedule({ facultyId: 'uid-1' })], // same faculty, 09:00–10:00 monday
    })
    // Row is 10:00–11:00 — adjacent, not overlapping: this must NOT clash.
    assert.equal(plan.rows[0].status, 'valid')
  })

  it('blocks a faculty double-booking on overlapping times', () => {
    const plan = planFor([{ ...VALID_ROW, startTime: '09:30', endTime: '10:30', room: '999' }], {
      existing: [existingSchedule({ facultyId: 'uid-1' })],
    })
    assert.equal(plan.rows[0].status, 'clash')
    assert.ok(plan.rows[0].reasons.some((r) => r.includes('faculty')))
  })

  it('blocks a room double-booking even for a different faculty', () => {
    const plan = planFor([{ ...VALID_ROW, facultyId: 'uid-2', startTime: '09:30', endTime: '10:30' }], {
      existing: [existingSchedule({ facultyId: 'uid-1', room: '302' })],
    })
    assert.equal(plan.rows[0].status, 'clash')
    assert.ok(plan.rows[0].reasons.some((r) => r.includes('room')))
  })

  it('detects clashes against earlier accepted rows of the same file', () => {
    const plan = planFor([
      { ...VALID_ROW, subject: 'Course A', subjectCode: 'A1', startTime: '09:00', endTime: '10:00' },
      { ...VALID_ROW, subject: 'Course B', subjectCode: 'B1', startTime: '09:30', endTime: '10:30' },
    ])
    assert.equal(plan.rows[0].status, 'valid')
    assert.equal(plan.rows[1].status, 'clash')
  })

  it('reports a cohort overlap as a warning, not a block', () => {
    const plan = planFor(
      [{ ...VALID_ROW, facultyId: 'uid-2', room: '999', startTime: '09:00', endTime: '10:00' }],
      {
        existing: [
          existingSchedule({
            facultyId: 'uid-1',
            room: '900',
            division: 'A',
            section: 'A',
            branch: 'B.Com',
            batch: '2026',
          }),
        ],
      },
    )
    assert.equal(plan.rows[0].status, 'valid')
    assert.ok(plan.rows[0].warnings.some((w) => w.includes('cohort')))
  })
})

// ─── Cross-references (warnings only) ────────────────────────────────────────

describe('planScheduleImport — mapping & faculty cross-references', () => {
  it('warns when the subject is not in the mapped curriculum', () => {
    const plan = planFor([VALID_ROW], { byId: new Map([['uid-1', 'Dr. Rao']]) })
    assert.equal(plan.rows[0].status, 'valid')
    assert.ok(plan.rows[0].warnings.some((w) => w.includes('not in the college')))
  })

  it('warns when the row books a different person than the mapped faculty', () => {
    const plan = planFor([{ ...VALID_ROW, facultyId: 'uid-2' }], {
      byId: new Map([
        ['uid-1', 'Dr. Rao'],
        ['uid-2', 'Dr. Rao'],
      ]),
      mappings: [
        {
          courseCode: 'BL01',
          courseName: 'Business Law',
          branch: 'B.Com',
          semester: 4,
          facultyId: 'uid-1',
          facultyName: 'Dr. Rao',
        },
      ],
    })
    assert.equal(plan.rows[0].status, 'valid')
    assert.ok(plan.rows[0].warnings.some((w) => w.includes('different person')))
  })

  it('warns when the facultyId is not in the college roster', () => {
    const plan = planFor([VALID_ROW])
    assert.equal(plan.rows[0].status, 'valid')
    assert.ok(plan.rows[0].warnings.some((w) => w.includes('not found in the college faculty list')))
  })
})

// ─── Payload validation ──────────────────────────────────────────────────────

describe('validateScheduleImportPayload', () => {
  it('requires CSV or rows', () => {
    assert.throws(() => validateScheduleImportPayload({}, 'admin', 'c1'), (e: any) => e.code === 'invalid-argument')
  })

  it('parses the CSV and defaults dryRun to true', () => {
    const p = validateScheduleImportPayload({ csv: 'subject,facultyId\nA,uid-1' }, 'admin', 'c1')
    assert.equal(p.dryRun, true)
    assert.equal(p.collegeId, 'c1')
    assert.equal(p.rawRows.length, 1)
    assert.equal(p.rawRows[0].line, 2)
    assert.equal(p.rawRows[0].fields.subject, 'A')
  })

  it('accepts structured rows and honours dryRun: false', () => {
    const p = validateScheduleImportPayload({ rows: [{ subject: 'A', facultyId: 'uid-1' }], dryRun: false }, 'hod', 'c1')
    assert.equal(p.dryRun, false)
    assert.equal(p.rawRows.length, 1)
  })

  it('caps the row count', () => {
    const rows = Array.from({ length: 501 }, (_, i) => ({ subject: `S${i}`, facultyId: 'uid' }))
    assert.throws(
      () => validateScheduleImportPayload({ rows }, 'admin', 'c1'),
      (e: any) => e.code === 'invalid-argument',
    )
  })
})
