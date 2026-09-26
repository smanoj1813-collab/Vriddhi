// Tests for the attendance summary → screen mapping (item 3.1).
//
// The risk this file guards is specific: switching a student from the raw
// 500-row query to the summary document must NOT move the numbers inside the
// window. The raw path computes
//   percentage = (present + onDuty + late) / total
//   present    = rows marked present OR onDuty
//   excused    = leave + medicalLeave
//   month %    = attended-in-month / month total
// so these cases pin the same arithmetic on the summary document.
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { attendanceFromSummary } from './utils/attendanceDigest'

describe('attendanceFromSummary', () => {
  it('reproduces the raw path for a simple history', () => {
    // 3 present, 1 onDuty, 1 late, 1 absent, 1 leave → total 7
    // attended = 3 + 1 + 1 = 5 → 71 %
    const view = attendanceFromSummary({
      total: 7,
      present: 3,
      onDuty: 1,
      late: 1,
      absent: 1,
      leave: 1,
      medicalLeave: 0,
      byMonth: { '2026-08': { total: 7, present: 5, absent: 1 } },
      recent: [{ id: 'r1', date: '2026-08-03', subject: 'FA', status: 'present' }],
    })
    assert.equal(view.percentage, 71)
    assert.equal(view.totalClasses, 7)
    assert.equal(view.present, 4) // present + onDuty, as the raw path reports it
    assert.equal(view.absent, 1)
    assert.equal(view.late, 1)
    assert.equal(view.excused, 1)
    assert.equal(view.requiredPercentage, 75)
    assert.deepEqual(view.records, [{ id: 'r1', date: '2026-08-03', subject: 'FA', status: 'present' }])
  })

  it('counts on-duty and late as attended, medical leave not', () => {
    const view = attendanceFromSummary({
      total: 4,
      present: 1,
      onDuty: 1,
      late: 1,
      medicalLeave: 1,
    })
    assert.equal(view.percentage, 75)
    assert.equal(view.excused, 1)
  })

  it('is zero-safe on an empty or partial document', () => {
    const empty = attendanceFromSummary({})
    assert.equal(empty.percentage, 0)
    assert.equal(empty.totalClasses, 0)
    assert.deepEqual(empty.monthlyBreakdown, [])
    assert.deepEqual(empty.records, [])

    const noTotals = attendanceFromSummary({ present: 5, absent: 5 })
    assert.equal(noTotals.percentage, 0, 'a missing total must not divide by zero')
    assert.equal(noTotals.totalClasses, 0)
  })

  it('builds the monthly breakdown in chronological order with the same month percentage', () => {
    const view = attendanceFromSummary({
      total: 9,
      present: 7,
      byMonth: {
        '2026-09': { total: 4, present: 3, absent: 1 },
        '2026-08': { total: 5, present: 4, absent: 1 },
      },
    })
    assert.deepEqual(view.monthlyBreakdown.map((entry) => entry.month), ['2026-08', '2026-09'])
    assert.deepEqual(view.monthlyBreakdown[0], { month: '2026-08', total: 5, present: 4, absent: 1, percentage: 80 })
    assert.deepEqual(view.monthlyBreakdown[1], { month: '2026-09', total: 4, present: 3, absent: 1, percentage: 75 })
  })

  it('rounds the same way the raw window path does', () => {
    // 2 of 3 attended → 66.67 → 67, and 1 of 3 → 33.33 → 33
    assert.equal(attendanceFromSummary({ total: 3, present: 2 }).percentage, 67)
    assert.equal(attendanceFromSummary({ total: 3, present: 1 }).percentage, 33)
  })

  it('carries the recent rows through untouched (the card renders them as-is)', () => {
    const recent = [
      { id: 'a', date: '2026-09-02', subject: 'Business Law', status: 'late', checkInTime: '09:20' },
      { id: 'b', date: '2026-09-01', subject: 'Business Law', status: 'absent' },
    ]
    const view = attendanceFromSummary({ total: 2, present: 0, late: 1, absent: 1, recent })
    assert.deepEqual(view.records, recent)
  })
})
