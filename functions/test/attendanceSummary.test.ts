// functions/test/attendanceSummary.test.ts
//
// Item 3.1. The maths here decides a student's attendance percentage, so every
// status, both directions of a delta and the drift detection are pinned.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  RECENT_RECORDS_LIMIT,
  applyAttendanceDelta,
  attendancePercentage,
  emptyCounts,
  normaliseStatus,
  rowToRecent,
  summariseAttendanceRows,
  summaryDrifted,
  type AttendanceRowLike,
  type AttendanceSummaryDoc,
} from '../src/attendanceSummary'

function row(id: string, overrides: Partial<AttendanceRowLike> = {}): AttendanceRowLike & { id: string } {
  return {
    id,
    studentId: 'student-1',
    collegeId: 'college-a',
    date: '2026-08-03',
    subject: 'Financial Accounting',
    status: 'present',
    ...overrides,
  }
}

function base(studentId = 'student-1'): AttendanceSummaryDoc {
  return {
    ...emptyCounts(),
    collegeId: 'college-a',
    studentId,
    bySubject: {},
    byMonth: {},
    recent: [],
    updatedAt: '2026-08-01T00:00:00.000Z',
    version: 1,
  }
}

describe('status normalisation', () => {
  it('accepts the six known statuses', () => {
    for (const status of ['present', 'absent', 'late', 'leave', 'onDuty', 'medicalLeave']) {
      assert.equal(normaliseStatus(status), status)
    }
  })

  it('maps legacy spellings onto the known statuses', () => {
    assert.equal(normaliseStatus('on-duty'), 'onDuty')
    assert.equal(normaliseStatus('onduty'), 'onDuty')
    assert.equal(normaliseStatus('medical-leave'), 'medicalLeave')
    assert.equal(normaliseStatus('medical'), 'medicalLeave')
  })

  it('never invents a bucket for an unknown status', () => {
    assert.equal(normaliseStatus('holiday'), 'other')
    assert.equal(normaliseStatus(undefined), 'other')
    assert.equal(normaliseStatus(null), 'other')
  })
})

describe('applyAttendanceDelta', () => {
  it('adds a new record into every bucket', () => {
    const next = applyAttendanceDelta(base(), null, row('r1'), { now: '2026-08-03T10:00:00.000Z' })
    assert.equal(next.total, 1)
    assert.equal(next.present, 1)
    assert.equal(next.bySubject['Financial Accounting'].total, 1)
    assert.equal(next.byMonth['2026-08'].total, 1)
    assert.equal(next.byMonth['2026-08'].present, 1)
    assert.equal(next.recent.length, 1)
    assert.equal(next.recent[0].id, 'r1')
    assert.equal(next.updatedAt, '2026-08-03T10:00:00.000Z')
    assert.equal(next.version, 2)
  })

  it('removes a record on delete and cleans up empty buckets', () => {
    const created = applyAttendanceDelta(base(), null, row('r1'))
    const deleted = applyAttendanceDelta(created, row('r1'), null)
    assert.equal(deleted.total, 0)
    assert.equal(deleted.present, 0)
    assert.deepEqual(deleted.bySubject, {})
    assert.deepEqual(deleted.byMonth, {})
    assert.deepEqual(deleted.recent, [])
    assert.equal(deleted.version, created.version + 1)
  })

  it('a status change subtracts the old bucket and adds the new one', () => {
    const created = applyAttendanceDelta(base(), null, row('r1', { status: 'present' }))
    const changed = applyAttendanceDelta(created, row('r1', { status: 'present' }), row('r1', { status: 'absent' }))
    assert.equal(changed.total, 1)
    assert.equal(changed.present, 0)
    assert.equal(changed.absent, 1)
    assert.equal(changed.byMonth['2026-08'].present, 0)
    assert.equal(changed.byMonth['2026-08'].absent, 1)
  })

  it('a date change moves the record between months', () => {
    const created = applyAttendanceDelta(base(), null, row('r1', { date: '2026-08-30' }))
    const moved = applyAttendanceDelta(
      created,
      row('r1', { date: '2026-08-30' }),
      row('r1', { date: '2026-09-02' }),
    )
    assert.deepEqual(Object.keys(moved.byMonth).sort(), ['2026-09'])
    assert.equal(moved.byMonth['2026-09'].total, 1)
    assert.equal(moved.total, 1)
  })

  it('counts late as attended in the percentage, and leave/medicalLeave in neither', () => {
    let summary = base()
    summary = applyAttendanceDelta(summary, null, row('r1', { status: 'present' }))
    summary = applyAttendanceDelta(summary, null, row('r2', { status: 'late' }))
    summary = applyAttendanceDelta(summary, null, row('r3', { status: 'leave' }))
    summary = applyAttendanceDelta(summary, null, row('r4', { status: 'medicalLeave' }))
    summary = applyAttendanceDelta(summary, null, row('r5', { status: 'absent' }))
    summary = applyAttendanceDelta(summary, null, row('r6', { status: 'onDuty' }))
    assert.equal(summary.total, 6)
    // Buckets stay honest — `present` counts only rows marked present…
    assert.equal(summary.present, 1)
    assert.equal(summary.onDuty, 1)
    assert.equal(summary.late, 1)
    assert.equal(summary.leave, 1)
    assert.equal(summary.medicalLeave, 1)
    assert.equal(summary.absent, 1)
    // …while the percentage counts attended = present + onDuty + late = 3/6.
    assert.equal(attendancePercentage(summary), 50)
  })

  it('still counts an unknown status in the total (never silently drops a row)', () => {
    const summary = applyAttendanceDelta(base(), null, row('r1', { status: 'holiday' }))
    assert.equal(summary.total, 1)
    assert.equal(summary.other, 1)
    assert.equal(attendancePercentage(summary), 0)
  })

  it('keeps the recent list capped and newest-first', () => {
    let summary = base()
    for (let index = 0; index < RECENT_RECORDS_LIMIT + 5; index += 1) {
      const day = String(2 + index).padStart(2, '0')
      summary = applyAttendanceDelta(summary, null, row(`r${index}`, { date: `2026-08-${day}` }))
    }
    assert.equal(summary.recent.length, RECENT_RECORDS_LIMIT)
    assert.equal(summary.total, RECENT_RECORDS_LIMIT + 5, 'totals still count every record')
    const dates = summary.recent.map((entry) => entry.date)
    assert.deepEqual(dates, [...dates].sort().reverse())
  })

  it('records the causing event id so a redelivery can be detected (clause A7)', () => {
    const first = applyAttendanceDelta(base(), null, row('r1'), { eventId: 'event-1' })
    assert.equal(first.lastEventId, 'event-1')
    const second = applyAttendanceDelta(first, null, row('r1'), { eventId: 'event-2' })
    assert.equal(second.lastEventId, 'event-2')
    // This function is deliberately dumb: it applies what it is given. The
    // exactly-once guard is the `lastEventId` comparison inside the trigger's
    // transaction, which is where a redelivered event is dropped.
    assert.equal(second.total, 2)
  })

  it('never mutates the summary it was given', () => {
    const start = applyAttendanceDelta(base(), null, row('r1'))
    const snapshot = JSON.stringify(start)
    applyAttendanceDelta(start, row('r1'), null)
    assert.equal(JSON.stringify(start), snapshot)
  })

  it('adopts the college from the row when the summary had none', () => {
    const summary = applyAttendanceDelta(base(), null, row('r1', { collegeId: 'college-b' }))
    assert.equal(summary.collegeId, 'college-b')
  })
})

describe('summariseAttendanceRows (backfill / reconcile)', () => {
  it('rebuilds the same numbers as the incremental path', () => {
    const rows = [
      row('r1', { status: 'present', date: '2026-07-01' }),
      row('r2', { status: 'absent', date: '2026-07-02' }),
      row('r3', { status: 'late', date: '2026-08-01', subject: 'Business Law' }),
    ]
    const rebuilt = summariseAttendanceRows(rows, { studentId: 'student-1', collegeId: 'college-a' })

    let incremental = base()
    for (const entry of rows) incremental = applyAttendanceDelta(incremental, null, entry)

    assert.equal(rebuilt.total, incremental.total)
    assert.equal(rebuilt.present, incremental.present)
    assert.equal(rebuilt.late, incremental.late)
    assert.deepEqual(rebuilt.byMonth, incremental.byMonth)
    assert.deepEqual(Object.keys(rebuilt.bySubject).sort(), ['Business Law', 'Financial Accounting'])
    assert.equal(rebuilt.version, 1, 'a rebuild is a fresh document, not a delta')
  })

  it('an empty history is a valid, zeroed summary', () => {
    const empty = summariseAttendanceRows([], { studentId: 'student-9', collegeId: null })
    assert.equal(empty.total, 0)
    assert.equal(attendancePercentage(empty), 0)
    assert.equal(empty.studentId, 'student-9')
  })
})

describe('percentage and drift detection', () => {
  it('is zero for no records and rounds like the student app', () => {
    assert.equal(attendancePercentage({ present: 0, onDuty: 0, late: 0, total: 0 }), 0)
    assert.equal(attendancePercentage({ present: 2, onDuty: 0, late: 1, total: 3 }), 100)
    assert.equal(attendancePercentage({ present: 1, onDuty: 0, late: 0, total: 3 }), 33)
    assert.equal(attendancePercentage({ present: 2, onDuty: 0, late: 0, total: 3 }), 67)
    // On-duty counts as attended, exactly as the client does today.
    assert.equal(attendancePercentage({ present: 0, onDuty: 1, late: 0, total: 2 }), 50)
  })

  it('flags a summary whose total disagrees with a live count (clause A7)', () => {
    assert.equal(summaryDrifted({ total: 10 }, 10), false)
    assert.equal(summaryDrifted({ total: 10 }, 11), true)
    assert.equal(summaryDrifted({ total: 10 }, 9), true)
    assert.equal(summaryDrifted({ total: 0 }, 0), false)
  })
})

describe('recent-row projection', () => {
  it('normalises the legacy field names the app already reads', () => {
    const projected = rowToRecent({
      id: 'r1',
      date: '2026-08-03',
      subject: 'Financial Accounting',
      subjectCode: 'FA101',
      status: 'present',
      timeIn: '09:05',
      note: 'late bus',
      markedAt: '2026-08-03T09:05:00.000Z',
    })
    assert.deepEqual(projected, {
      id: 'r1',
      date: '2026-08-03',
      subject: 'Financial Accounting',
      subjectCode: 'FA101',
      status: 'present',
      checkInTime: '09:05',
      notes: 'late bus',
      markedAt: '2026-08-03T09:05:00.000Z',
    })
  })

  it('omits empty optional fields instead of writing nulls', () => {
    const projected = rowToRecent({ id: 'r2', date: '2026-08-03', subject: '', status: 'absent' })
    assert.deepEqual(projected, { id: 'r2', date: '2026-08-03', subject: '', status: 'absent' })
  })
})
