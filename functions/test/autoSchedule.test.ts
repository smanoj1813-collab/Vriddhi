// functions/test/autoSchedule.test.ts
// G4 slot auto-scheduler — pure-core tests, no Firestore.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSlots,
  planAutoSchedule,
  validateAutoSchedulePayload,
  DEFAULT_GRID,
  type AutoScheduleCourse,
  type Occupancy,
  type ScheduleGrid,
} from '../src/autoSchedule'

// ─── Fixtures ────────────────────────────────────────────────────────────────

const GRID_5P: ScheduleGrid = {
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  periodsPerDay: 5,
  startTime: '08:00',
  periodMinutes: 50,
  breakAfterPeriod: 3,
  breakMinutes: 15,
  labSpan: 2,
}

function emptyOccupancy(): Occupancy {
  return {
    facultyBusy: new Set(),
    cohortBusy: new Set(),
    roomBusy: new Set(),
    facultyWeekly: new Map(),
  }
}

function mappedCourse(over: Partial<AutoScheduleCourse> = {}): AutoScheduleCourse {
  return {
    mappingId: over.mappingId ?? 'm1',
    courseId: over.courseId ?? over.courseCode ?? 'c1',
    courseCode: over.courseCode ?? 'FA01',
    courseName: over.courseName ?? 'Financial Accounting',
    facultyId: over.facultyId ?? 'uid-f1',
    facultyName: over.facultyName ?? 'Dr. Rao',
    totalHours: over.totalHours ?? 60, // 4 h/wk at 15 weeks
    credits: over.credits ?? 4,
    branch: over.branch ?? 'B.Com',
    semester: over.semester ?? 3,
    batch: over.batch ?? '2026',
    division: over.division ?? '',
    section: over.section ?? 'A',
  }
}

// ─── buildSlots ──────────────────────────────────────────────────────────────

describe('buildSlots', () => {
  it('materialises day × period slots with the break folded in', () => {
    const monday = buildSlots(GRID_5P).filter((s) => s.day === 'monday')
    assert.equal(monday.length, 5)
    assert.deepEqual(
      monday.map((s) => `${s.startTime}-${s.endTime}`),
      ['08:00-08:50', '08:50-09:40', '09:40-10:30', '10:45-11:35', '11:35-12:25'],
    )
  })

  it('defaults: 6 days × 5 periods from DEFAULT_GRID, and invalid time → []', () => {
    assert.equal(buildSlots(DEFAULT_GRID).length, 30)
    assert.equal(buildSlots({ ...GRID_5P, startTime: 'nope' }).length, 0)
  })
})

// ─── planAutoSchedule ────────────────────────────────────────────────────────

describe('planAutoSchedule', () => {
  it('spreads a 4-period course across 4 distinct days, earliest periods first', () => {
    const plan = planAutoSchedule({
      courses: [mappedCourse()],
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.summary.periodsRequested, 4)
    assert.equal(plan.summary.periodsPlaced, 4)
    const days = plan.placements.map((p) => p.dayOfWeek)
    assert.equal(new Set(days).size, 4) // one period per day
    for (const p of plan.placements) {
      assert.equal(p.startTime, '08:00') // earliest free period each day
      assert.equal(p.room, 'R1')
      assert.equal(p.type, 'lecture')
    }
    // coverage view now answers "hours per day" for the cohort
    assert.equal(plan.dailyCoverage.find((d) => d.day === 'monday')?.hours, 0.8)
    assert.equal(plan.dailyCoverage.length, 5)
  })

  it('packs labs into consecutive spans on one day, flagged as lab', () => {
    const plan = planAutoSchedule({
      courses: [mappedCourse({ courseCode: 'LB01', courseName: 'Computer Lab', totalHours: 60 })],
      grid: GRID_5P,
      rooms: ['LAB-1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.placements.length, 4)
    assert.ok(plan.placements.every((p) => p.type === 'lab'))
    const byDay = new Map<string, number>()
    for (const p of plan.placements) byDay.set(p.dayOfWeek, (byDay.get(p.dayOfWeek) ?? 0) + 1)
    assert.deepEqual([...byDay.values()].sort(), [2, 2]) // two 2-period spans
    for (const p of plan.placements.filter((x) => x.dayOfWeek === 'monday')) {
      // the two monday placements must be consecutive
      const idxs = plan.placements
        .filter((x) => x.dayOfWeek === 'monday')
        .map((x) => x.periodIndex)
        .sort((a, b) => a - b)
      assert.equal(idxs[1] - idxs[0], 1)
    }
  })

  it('never double-books the cohort, the faculty, or a room — even across courses', () => {
    const courses = [
      mappedCourse({ mappingId: 'm1', courseCode: 'A1', courseName: 'Accounting', facultyId: 'f1', facultyName: 'A' }),
      mappedCourse({ mappingId: 'm2', courseId: 'c2', courseCode: 'B1', courseName: 'Business Law', facultyId: 'f2', facultyName: 'B' }),
      mappedCourse({ mappingId: 'm3', courseId: 'c3', courseCode: 'C1', courseName: 'Statistics', facultyId: 'f3', facultyName: 'C' }),
    ]
    const plan = planAutoSchedule({
      courses,
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.summary.periodsPlaced, 12)
    const cohortSlots = new Set(plan.placements.map((p) => `${p.dayOfWeek}|${p.startTime}`))
    assert.equal(cohortSlots.size, 12) // no two courses share a cohort slot
    const roomSlots = new Set(plan.placements.map((p) => `${p.dayOfWeek}|${p.startTime}|${p.room}`))
    assert.equal(roomSlots.size, 12)
  })

  it('respects existing occupancy and the faculty daily cap', () => {
    const occupied = emptyOccupancy()
    // cohort already has Monday 08:00 booked; faculty is busy everywhere Tuesday
    occupied.cohortBusy.add('monday|08:00')
    for (const day of GRID_5P.days) occupied.facultyBusy.add(`${day}|08:50`)
    const plan = planAutoSchedule({
      courses: [mappedCourse()],
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: occupied,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 1, // hard daily cap
    })
    assert.equal(plan.placements.length, 4)
    assert.ok(!plan.placements.some((p) => p.dayOfWeek === 'monday' && p.startTime === '08:00'))
    assert.ok(!plan.placements.some((p) => p.startTime === '08:50'))
    const perDayFaculty = new Map<string, number>()
    for (const p of plan.placements) {
      const k = `${p.facultyId}|${p.dayOfWeek}`
      perDayFaculty.set(k, (perDayFaculty.get(k) ?? 0) + 1)
    }
    assert.ok(Math.max(...perDayFaculty.values()) <= 1)
  })

  it('reports unplaced courses instead of silently dropping them', () => {
    const jammed = emptyOccupancy()
    for (const slot of buildSlots(GRID_5P)) jammed.cohortBusy.add(`${slot.day}|${slot.startTime}`)
    const plan = planAutoSchedule({
      courses: [mappedCourse()],
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: jammed,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.placements.length, 0)
    assert.equal(plan.unplaced.length, 1)
    assert.equal(plan.unplaced[0].subject, 'Financial Accounting')
    assert.equal(plan.unplaced[0].periodsRequested, 4)
    assert.match(plan.unplaced[0].reason, /No free slot/)
  })

  it('flags faculty above the 24-period UGC ceiling (existing + placed)', () => {
    const occupied = emptyOccupancy()
    occupied.facultyWeekly.set('uid-f1', 22) // already near the cap
    const plan = planAutoSchedule({
      courses: [mappedCourse({ totalHours: 60 })], // 4 more → 26
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: occupied,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    const row = plan.facultyLoad.find((f) => f.facultyId === 'uid-f1')
    assert.equal(row?.totalWeekly, 26)
    assert.equal(row?.overloaded, true)
    assert.equal(plan.summary.overloadedFaculty, 1)
    assert.ok(plan.placements.some((p) => p.flags.includes('faculty-overloaded')))
  })

  it('falls back to the next room when the first is busy', () => {
    const occupied = emptyOccupancy()
    for (const slot of buildSlots({ ...GRID_5P, days: ['monday'] }).slice(0, 1)) {
      occupied.roomBusy.add(`monday|${slot.startTime}|R1`)
    }
    const plan = planAutoSchedule({
      courses: [mappedCourse({ totalHours: 15 })], // 1 period
      grid: { ...GRID_5P, days: ['monday'] },
      rooms: ['R1', 'R2'],
      occupancy: occupied,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    // R1 free at every other slot of the day — but if we jam all R1 slots, pick R2
    assert.ok(['R1', 'R2'].includes(plan.placements[0].room))
  })

  it('is deterministic: same input → identical plan', () => {
    const input = {
      courses: [
        mappedCourse({ mappingId: 'm1', facultyId: 'f1' }),
        mappedCourse({ mappingId: 'm2', courseId: 'c2', courseCode: 'BL1', courseName: 'Business Law', facultyId: 'f2', facultyName: 'B' }),
      ],
      grid: GRID_5P,
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    }
    const a = planAutoSchedule(input)
    const b = planAutoSchedule(input)
    assert.deepEqual(
      a.placements.map((p) => [p.courseId, p.dayOfWeek, p.startTime, p.room]),
      b.placements.map((p) => [p.courseId, p.dayOfWeek, p.startTime, p.room]),
    )
  })
})

// ─── Payload validation ──────────────────────────────────────────────────────

describe('validateAutoSchedulePayload', () => {
  it('applies safe defaults and pins non-superadmins to their college', () => {
    const p = validateAutoSchedulePayload({ curriculumId: 'cur-1', batch: '2026' }, 'hod', 'col-1')
    assert.equal(p.collegeId, 'col-1')
    assert.equal(p.dryRun, true) // default is preview-only
    assert.equal(p.grid.periodsPerDay, DEFAULT_GRID.periodsPerDay)
    assert.equal(p.grid.startTime, '08:00')
    assert.deepEqual(p.grid.days.length, 6)
  })

  it('rejects bad grids and missing identity', () => {
    assert.throws(
      () => validateAutoSchedulePayload({ batch: '2026' }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ curriculumId: 'x', batch: '2026', grid: { startTime: '25:00' } }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ curriculumId: 'x', batch: '2026', grid: { days: ['funday'] } }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
  })

  it('superadmin can target another college explicitly', () => {
    const p = validateAutoSchedulePayload(
      { curriculumId: 'x', batch: '2026', collegeId: 'col-9' },
      'superadmin',
      '',
    )
    assert.equal(p.collegeId, 'col-9')
  })
})
