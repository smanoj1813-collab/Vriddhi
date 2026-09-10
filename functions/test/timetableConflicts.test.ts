// functions/test/timetableConflicts.test.ts
//
// These cases previously exercised an inline copy of the clash helpers that
// lived inside this test file — which meant the tests passed no matter what the
// shipped code did. S2.5 ports the core into
// functions/src/utils/timetableConflicts.ts so the callables can enforce it
// server-side, and this file now imports that module, keeping every original
// case and adding the dated-session variant the callables actually use.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  cohortKey,
  conflictErrorCode,
  describeConflict,
  findClashes,
  findSessionClashes,
  formatMinutesToTime,
  hardClashes,
  isHardClash,
  occupiesSlot,
  parseTimeToMinutes,
  timesOverlap,
  type ScheduleEntry,
  type SessionCandidate,
} from '../src/utils/timetableConflicts'

function entry(overrides: Partial<ScheduleEntry> = {}): ScheduleEntry {
  return {
    id: 'candidate',
    collegeId: 'college-a',
    facultyId: 'faculty-a',
    branch: 'B.Com',
    batch: '2026',
    division: 'A',
    room: '101',
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    isActive: true,
    ...overrides,
  }
}

describe('timetable conflict utilities', () => {
  it('converts times to minutes', () => {
    assert.equal(parseTimeToMinutes('00:00'), 0)
    assert.equal(parseTimeToMinutes('09:30'), 570)
    assert.equal(parseTimeToMinutes('23:59'), 1439)
  })

  it('round-trips minutes back to a time', () => {
    assert.equal(formatMinutesToTime(0), '00:00')
    assert.equal(formatMinutesToTime(570), '09:30')
    assert.equal(formatMinutesToTime(1439), '23:59')
  })

  it('treats adjacent slots as non-overlapping', () => {
    assert.equal(timesOverlap('09:00', '10:00', '10:00', '11:00'), false)
  })

  it('detects partial and contained overlaps', () => {
    assert.equal(timesOverlap('09:00', '10:00', '09:30', '10:30'), true)
    assert.equal(timesOverlap('09:00', '12:00', '10:00', '11:00'), true)
  })

  it('detects faculty, cohort, and room clashes', () => {
    const clashes = findClashes(entry(), [entry({ id: 'existing', startTime: '09:30' })])
    assert.deepEqual(clashes.sort(), ['cohort', 'faculty', 'room'])
  })

  it('does not compare schedules across colleges', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', collegeId: 'college-b' })]), [])
  })

  it('does not compare schedules on different days', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', dayOfWeek: 'tuesday' })]), [])
  })

  it('skips inactive entries', () => {
    assert.deepEqual(findClashes(entry(), [entry({ id: 'other', isActive: false })]), [])
  })

  it('skips the entry being updated', () => {
    const existing = entry({ id: 'same' })
    assert.deepEqual(findClashes(entry({ id: 'same' }), [existing], 'same'), [])
  })

  it('matches cohort values case-insensitively', () => {
    const clashes = findClashes(
      entry({ facultyId: 'new-faculty', room: 'new-room' }),
      [entry({ id: 'other', facultyId: 'other-faculty', branch: 'b.com', division: 'a', room: 'other-room' })]
    )
    assert.deepEqual(clashes, ['cohort'])
  })

  it('does not report unrelated overlapping entries', () => {
    const clashes = findClashes(
      entry({ facultyId: 'new-faculty', division: 'A', room: 'new-room' }),
      [entry({ id: 'other', facultyId: 'other-faculty', division: 'B', room: 'other-room' })]
    )
    assert.deepEqual(clashes, [])
  })

  it('ignores an empty cohort key rather than matching everyone', () => {
    // Two entries with no branch/batch/division must not be "the same cohort".
    assert.equal(cohortKey({}), '||')
    assert.deepEqual(
      findClashes(
        entry({ branch: '', batch: '', division: '', facultyId: 'f2', room: 'r2' }),
        [entry({ id: 'other', branch: '', batch: '', division: '', facultyId: 'f3', room: 'r3' })]
      ),
      []
    )
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// Dated sessions — what the callables enforce
// ═══════════════════════════════════════════════════════════════════════════

function session(overrides: Partial<SessionCandidate> = {}): SessionCandidate {
  return {
    id: 'new',
    collegeId: 'college-a',
    date: '2026-09-14',
    facultyId: 'faculty-a',
    room: 'LH-201',
    startTime: '09:00',
    endTime: '10:00',
    status: 'scheduled',
    subject: 'Data Structures',
    ...overrides,
  }
}

describe('findSessionClashes', () => {
  it('flags a faculty double-booking', () => {
    const conflicts = findSessionClashes(session(), [
      session({ id: 'other', facultyId: 'faculty-a', room: 'LH-999', startTime: '09:30', endTime: '10:30' }),
    ])
    assert.deepEqual(conflicts.map(c => c.kind), ['faculty'])
  })

  it('flags a room double-booking', () => {
    const conflicts = findSessionClashes(session(), [
      session({ id: 'other', facultyId: 'faculty-b', room: 'LH-201', startTime: '09:30', endTime: '10:30' }),
    ])
    assert.deepEqual(conflicts.map(c => c.kind), ['room'])
  })

  it('can flag both at once', () => {
    const conflicts = findSessionClashes(session(), [
      session({ id: 'other', facultyId: 'faculty-a', room: 'LH-201', startTime: '09:30', endTime: '10:30' }),
    ])
    assert.deepEqual(conflicts.map(c => c.kind).sort(), ['faculty', 'room'])
  })

  it('ignores sessions on another date', () => {
    assert.deepEqual(
      findSessionClashes(session(), [session({ id: 'other', date: '2026-09-15' })]),
      []
    )
  })

  it('ignores sessions in another college', () => {
    assert.deepEqual(
      findSessionClashes(session(), [session({ id: 'other', collegeId: 'college-b' })]),
      []
    )
  })

  it('ignores cancelled sessions — a cancelled class frees the slot', () => {
    assert.deepEqual(
      findSessionClashes(session(), [session({ id: 'other', status: 'cancelled' })]),
      []
    )
  })

  it('treats an unknown status as still occupying the slot', () => {
    // Fail closed: a new status spelling must not let a double-booking through.
    assert.equal(findSessionClashes(session(), [session({ id: 'other', status: 'rescheduled' })]).length > 0, true)
  })

  it('lets the same session compare against itself without self-clashing', () => {
    assert.deepEqual(findSessionClashes(session({ id: 'a' }), [session({ id: 'a' })]), [])
  })

  it('does not clash when the times are merely adjacent', () => {
    assert.deepEqual(
      findSessionClashes(session(), [session({ id: 'other', startTime: '10:00', endTime: '11:00' })]),
      []
    )
  })

  it('leaves an empty room out of room matching', () => {
    // Different faculty and cohort, so an empty room must not match another
    // empty room into a clash.
    assert.deepEqual(
      findSessionClashes(
        session({ room: '', facultyId: 'f1' }),
        [session({ id: 'other', room: '', facultyId: 'f2' })]
      ).map(c => c.kind),
      []
    )
  })

  it('reports the cohort clash as advisory', () => {
    const conflicts = findSessionClashes(
      session({ branch: 'BCA', batch: '2026', division: 'A', facultyId: 'f1', room: 'r1' }),
      [session({ id: 'other', branch: 'BCA', batch: '2026', division: 'A', facultyId: 'f2', room: 'r2' })]
    )
    assert.deepEqual(conflicts.map(c => c.kind), ['cohort'])
    assert.equal(hardClashes(conflicts).length, 0)
  })
})

describe('hard clashes', () => {
  it('is faculty and room — cohort is advisory only', () => {
    assert.equal(isHardClash('faculty'), true)
    assert.equal(isHardClash('room'), true)
    assert.equal(isHardClash('cohort'), false)
  })

  it('filters a mixed list down to what the server rejects', () => {
    const conflicts = [
      ...findSessionClashes(session({ branch: 'BCA', batch: '2026', division: 'A' }), [
        session({ id: 'other', branch: 'BCA', batch: '2026', division: 'A' }),
      ]),
    ]
    assert.equal(hardClashes(conflicts).length, 2) // faculty + room from the same overlap
  })
})

describe('occupiesSlot', () => {
  it('frees the slot only for explicit cancellations', () => {
    assert.equal(occupiesSlot('cancelled'), false)
    assert.equal(occupiesSlot('canceled'), false)
    assert.equal(occupiesSlot('scheduled'), true)
    assert.equal(occupiesSlot('completed'), true)
    // Missing status defaults to occupied, so unknown data cannot cause a
    // double-booking.
    assert.equal(occupiesSlot(''), true)
    assert.equal(occupiesSlot(undefined), true)
  })
})

describe('conflict reporting', () => {
  it('produces a stable machine-readable error code', () => {
    assert.equal(conflictErrorCode({ kind: 'faculty' } as never), 'class-schedule/faculty-conflict')
    assert.equal(conflictErrorCode({ kind: 'room' } as never), 'class-schedule/room-conflict')
    assert.equal(conflictErrorCode({ kind: 'cohort' } as never), 'class-schedule/cohort-conflict')
  })

  it('produces admin-facing copy', () => {
    // A different faculty, so the only clash is the shared room.
    const conflict = findSessionClashes(session(), [
      session({
        id: 'other',
        facultyId: 'faculty-b',
        room: 'LH-201',
        startTime: '09:30',
        endTime: '10:30',
        subject: 'DBMS',
      }),
    ])[0]
    assert.match(describeConflict(conflict), /Room double-booked on 2026-09-14 at 09:00–10:00/)
    assert.match(conflict.message, /room is already occupied \(DBMS 09:30–10:30\)/)
  })
})
