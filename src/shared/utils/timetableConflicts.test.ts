// src/shared/utils/timetableConflicts.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// The browser copy of the clash detector is what the timetable dialogs warn
// with before a save. Its cohort rule must agree with the server's
// (functions/src/utils/timetableConflicts.ts) and with the cohort helpers:
// the same class is recorded "2026-2027" and "2027", and a division field may
// be a LIST written for a whole batch. functions/test/cohortBatch.test.ts
// pins the helper behind both copies; this file pins the wiring.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { findClashes, type ScheduleEntry } from './timetableConflicts'

function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'existing',
    collegeId: 'college-a',
    subject: 'Financial Accounting',
    subjectCode: 'BBA301',
    facultyId: 'uid-asha',
    facultyName: 'Asha Rao',
    branch: 'BBA',
    batch: '2027',
    division: 'A',
    room: 'R12',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture',
    isActive: true,
    ...overrides,
  }
}

describe('findClashes — cohort identity', () => {
  it('warns when a whole-batch slot and a division slot compete for the same students', () => {
    const clashes = findClashes(
      entry({ division: 'A', facultyId: 'uid-ravi', room: 'R13' }),
      [entry({ division: 'A,B,C,D' })],
    )
    assert.deepEqual(clashes.map((c) => c.kind), ['cohort'])
  })

  it('warns across the academic-year-range spelling of one class', () => {
    const clashes = findClashes(
      entry({ batch: '2027', facultyId: 'uid-ravi', room: 'R13' }),
      [entry({ batch: '2026-2027' })],
    )
    assert.deepEqual(clashes.map((c) => c.kind), ['cohort'])
  })

  it('does not warn for parallel divisions of the same batch', () => {
    const clashes = findClashes(
      entry({ division: 'B', facultyId: 'uid-ravi', room: 'R13' }),
      [entry({ division: 'A' })],
    )
    assert.deepEqual(clashes, [])
  })

  it('does not treat a bare start year as the range that starts with it', () => {
    const clashes = findClashes(
      entry({ batch: '2026', facultyId: 'uid-ravi', room: 'R13' }),
      [entry({ batch: '2026-2027' })],
    )
    assert.deepEqual(clashes, [])
  })

  it('still reports faculty and room clashes independently of the cohort rule', () => {
    const clashes = findClashes(
      entry({ facultyId: 'uid-asha', room: 'R12' }),
      [entry({ division: 'B' })],
    )
    assert.deepEqual(clashes.map((c) => c.kind).sort(), ['faculty', 'room'])
  })
})
