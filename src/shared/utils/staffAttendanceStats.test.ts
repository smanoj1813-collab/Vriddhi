// src/shared/utils/staffAttendanceStats.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the arithmetic behind every faculty-attendance number a principal sees:
// date ranges, per-faculty rollups, the register grid and working-hours maths.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  addCount,
  attendancePercentage,
  attendedDays,
  buildRegister,
  customRange,
  dailySeries,
  dateKeysBetween,
  dayOfWeek,
  departmentBreakdown,
  emptyCounts,
  hoursBetween,
  monthBounds,
  monthLabel,
  monthRange,
  summarizeByFaculty,
  toLocalDateKey,
  totalize,
  workingDaysBetween,
} from './staffAttendanceStats'
import type { StaffAttendanceRecord, StaffRosterEntry } from '../types/staffAttendance'

// September 2026: 1 Sep is a Tuesday, 30 Sep a Wednesday. Sundays are 6, 13, 20, 27.
const ROSTER: StaffRosterEntry[] = [
  { id: 'f1', name: 'Asha Rao', department: 'Commerce' },
  { id: 'f2', name: 'Bala Kumar', department: 'Science' },
  { id: 'f3', name: 'Chitra N', department: 'Commerce' },
]

function record(facultyId: string, date: string, status: StaffAttendanceRecord['status']): StaffAttendanceRecord {
  const member = ROSTER.find((m) => m.id === facultyId)!
  return {
    id: `${facultyId}__${date}`,
    collegeId: 'c1',
    facultyId,
    facultyName: member.name,
    department: member.department,
    date,
    status,
    checkIn: '09:00',
    checkOut: '17:00',
    hoursWorked: 8,
    note: '',
    markedAt: `${date}T09:05:00.000Z`,
    source: 'self',
    markedBy: facultyId,
  }
}

describe('date helpers', () => {
  it('formats local dates without a UTC shift', () => {
    // 23:30 local on the 5th is still the 5th locally, but the 6th in UTC for
    // anyone west of Greenwich — the bug `toISOString().slice(0,10)` produces.
    const date = new Date(2026, 8, 5, 23, 30)
    assert.equal(toLocalDateKey(date), '2026-09-05')
  })

  it('rejects impossible calendar dates instead of rolling them over', () => {
    assert.equal(monthBounds('2026-02')?.end, '2026-02-28')
    assert.equal(monthBounds('2028-02')?.end, '2028-02-29') // leap year
    assert.equal(monthBounds('2026-13'), null)
  })

  it('lists an inclusive range once, in order', () => {
    assert.deepEqual(dateKeysBetween('2026-09-01', '2026-09-03'), ['2026-09-01', '2026-09-02', '2026-09-03'])
    assert.deepEqual(dateKeysBetween('2026-09-03', '2026-09-01'), [])
    assert.deepEqual(dateKeysBetween('2026-09-30', '2026-10-02'), ['2026-09-30', '2026-10-01', '2026-10-02'])
  })

  it('counts Sunday as the only non-working day', () => {
    assert.equal(dayOfWeek('2026-09-06'), 0)
    assert.equal(dayOfWeek('2026-09-07'), 1)
    // 30 days in September 2026, four of them Sundays.
    assert.equal(workingDaysBetween('2026-09-01', '2026-09-30'), 26)
  })

  it('swaps a reversed custom range instead of returning nothing', () => {
    const range = customRange('2026-09-10', '2026-09-02')
    assert.equal(range.start, '2026-09-02')
    assert.equal(range.end, '2026-09-10')
    assert.equal(range.month, '2026-09')
  })

  it('labels a month for humans', () => {
    assert.equal(monthLabel('2026-09'), 'September 2026')
    assert.equal(monthRange('2026-09').start, '2026-09-01')
    assert.equal(monthRange('2026-09').end, '2026-09-30')
  })
})

describe('summarizeByFaculty', () => {
  const range = monthRange('2026-09')

  it('reports faculty with no records at all, rather than dropping them', () => {
    const out = summarizeByFaculty([], ROSTER, range)
    assert.equal(out.length, 3)
    assert.equal(out[0].marked, 0)
    assert.equal(out[0].expectedDays, 26)
    assert.equal(out[0].percentage, 0)
  })

  it('credits a half day as half and a leave day as zero', () => {
    const records = [
      record('f1', '2026-09-01', 'present'),
      record('f1', '2026-09-02', 'halfday'),
      record('f1', '2026-09-03', 'leave'),
    ]
    const out = summarizeByFaculty(records, ROSTER, range)
    const asha = out.find((s) => s.facultyId === 'f1')!
    assert.equal(asha.marked, 3)
    assert.equal(attendedDays(asha.counts), 1.5)
    assert.equal(asha.percentage, Math.round((1.5 / 26) * 100 * 10) / 10)
  })

  it('counts a late arrival as a full attended day', () => {
    const out = summarizeByFaculty([record('f2', '2026-09-01', 'late')], ROSTER, range)
    const bala = out.find((s) => s.facultyId === 'f2')!
    assert.equal(attendedDays(bala.counts), 1)
  })

  it('ignores a second record for the same day (no double counting)', () => {
    const duplicate = { ...record('f1', '2026-09-01', 'present'), id: 'other-doc-id' }
    const out = summarizeByFaculty([record('f1', '2026-09-01', 'present'), duplicate], ROSTER, range)
    const asha = out.find((s) => s.facultyId === 'f1')!
    assert.equal(asha.marked, 1)
    assert.equal(asha.counts.present, 1)
  })

  it('ignores records outside the requested range', () => {
    const out = summarizeByFaculty([record('f1', '2026-08-31', 'present')], ROSTER, range)
    assert.equal(out.find((s) => s.facultyId === 'f1')!.marked, 0)
  })

  it('still summarises a record whose faculty is no longer on the roster', () => {
    const orphan: StaffAttendanceRecord = {
      ...record('f1', '2026-09-01', 'present'),
      facultyId: 'ghost',
      facultyName: 'Left the college',
      department: 'Commerce',
    }
    const out = summarizeByFaculty([orphan], ROSTER, range)
    assert.equal(out.length, 4)
    assert.ok(out.some((s) => s.facultyId === 'ghost'))
  })

  it('sorts worst attendance first, breaking percentage ties by name', () => {
    const records = [
      ...Array.from({ length: 26 }, (_, i) => record('f1', `2026-09-${String(i + 1).padStart(2, '0')}`, 'present' as const)),
      record('f2', '2026-09-01', 'absent'),
    ]
    const out = summarizeByFaculty(records, ROSTER, range)

    // f2 (marked absent) and f3 (never marked) are both at 0%, so the order
    // between them is the name tie-break — deterministic, which is what a
    // printed report needs. f1 at 100% is last.
    assert.deepEqual(out.map((s) => s.facultyId), ['f2', 'f3', 'f1'])
    assert.deepEqual(out.map((s) => s.percentage), [0, 0, 100])
  })

  it('ranks a partial month above an unmarked one', () => {
    const out = summarizeByFaculty([record('f2', '2026-09-01', 'present')], ROSTER, range)
    assert.equal(out[0].facultyId, 'f1') // 0%
    assert.equal(out[out.length - 1].facultyId, 'f2')
    assert.equal(out[out.length - 1].percentage, Math.round((1 / 26) * 100 * 10) / 10)
  })
})

describe('percentages and totals', () => {
  it('never divides by zero', () => {
    assert.equal(attendancePercentage(5, 0), 0)
    assert.equal(attendancePercentage(0, 0), 0)
  })

  it('clamps to 0–100 and keeps one decimal', () => {
    assert.equal(attendancePercentage(1, 3), 33.3)
    assert.equal(attendancePercentage(10, 3), 100)
  })

  it('accumulates counts immutably', () => {
    const base = emptyCounts()
    const next = addCount(base, 'present')
    assert.equal(base.present, 0)
    assert.equal(next.present, 1)
    // An unknown status must not invent a key.
    assert.deepEqual(addCount(base, 'nonsense' as never), base)
  })

  it('rolls the roster up to one college-wide percentage', () => {
    const range = monthRange('2026-09')
    const records = ROSTER.flatMap((m) => [
      record(m.id, '2026-09-01', 'present' as const),
      record(m.id, '2026-09-02', 'present' as const),
    ])
    const totals = totalize(summarizeByFaculty(records, ROSTER, range))
    assert.equal(totals.rosterSize, 3)
    assert.equal(totals.marked, 6)
    assert.equal(totals.expectedDays, 78) // 3 × 26
    assert.equal(totals.percentage, Math.round((6 / 78) * 100 * 10) / 10)
  })
})

describe('dailySeries', () => {
  it('keeps empty days so a gap reads as a gap', () => {
    const range = customRange('2026-09-01', '2026-09-03')
    const series = dailySeries([record('f1', '2026-09-02', 'present')], range, ROSTER.length)
    assert.equal(series.length, 3)
    assert.equal(series[0].present, 0)
    assert.equal(series[1].present, 1)
    assert.equal(series[1].unmarked, 2)
    assert.equal(series[2].total, 0)
  })

  it('counts on-duty and WFH as present', () => {
    const range = customRange('2026-09-01', '2026-09-01')
    const series = dailySeries(
      [record('f1', '2026-09-01', 'onduty'), record('f2', '2026-09-01', 'wfh')],
      range,
      ROSTER.length,
    )
    assert.equal(series[0].present, 2)
    assert.equal(series[0].percentage, 100)
  })
})

describe('departmentBreakdown', () => {
  it('groups and sorts by department', () => {
    const range = monthRange('2026-09')
    const records = [record('f1', '2026-09-01', 'present'), record('f3', '2026-09-01', 'absent')]
    const out = departmentBreakdown(summarizeByFaculty(records, ROSTER, range))
    assert.deepEqual(out.map((d) => d.department), ['Commerce', 'Science'])
    assert.equal(out[0].faculty, 2)
    assert.equal(out[1].faculty, 1)
  })
})

describe('buildRegister', () => {
  it('lays out one row per faculty and one column per working day', () => {
    const range = monthRange('2026-09')
    const register = buildRegister([record('f1', '2026-09-01', 'present')], ROSTER, range)
    assert.equal(register.dates.length, 26) // Sundays excluded
    assert.ok(!register.dates.includes('2026-09-06'))
    assert.equal(register.rows.length, 3)

    const asha = register.rows.find((r) => r.facultyId === 'f1')!
    assert.equal(asha.cells[0], 'present')
    assert.equal(asha.cells[1], null)

    // Rows are ordered by department then name, so a printed register groups.
    assert.deepEqual(register.rows.map((r) => r.department), ['Commerce', 'Commerce', 'Science'])
  })
})

describe('hoursBetween', () => {
  it('computes a normal shift', () => {
    assert.equal(hoursBetween('09:15', '17:45'), 8.5)
  })

  it('wraps a shift that crosses midnight', () => {
    assert.equal(hoursBetween('22:00', '06:00'), 8)
  })

  it('returns 0 for missing or malformed times', () => {
    assert.equal(hoursBetween('', '17:00'), 0)
    assert.equal(hoursBetween('09:00', ''), 0)
    assert.equal(hoursBetween('25:00', '17:00'), 0)
    assert.equal(hoursBetween('9am', '5pm'), 0)
  })
})
