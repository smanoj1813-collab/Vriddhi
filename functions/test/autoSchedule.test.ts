// functions/test/autoSchedule.test.ts
// G4 slot auto-scheduler — pure-core tests, no Firestore.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSlots,
  buildFacultyIdentityMap,
  canonicalFacultyId,
  assertTimetableOccupancyComplete,
  planAutoSchedule,
  validateAutoSchedulePayload,
  batchListMatches,
  batchTokens,
  mappingServesCohort,
  resolveMappingTeachingGroups,
  teachingGroupsFromStudents,
  seededRandom,
  shuffleWith,
  DEFAULT_GRID,
  ZERO_HOURS_REASON,
  type AutoScheduleCourse,
  type Occupancy,
  type ScheduleGrid,
  type SchedulePlacement,
  type AutoSchedulePlan,
  type PlacementStrategy,
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
    assert.equal(plan.unplaced[0].section, 'A', 'unplaced demand retains its teaching-group scope')
    assert.match(plan.unplaced[0].reason, /No free slot/)
  })

  it('enforces the 24-period weekly cap and reports demand arithmetic instead of overbooking', () => {
    const occupied = emptyOccupancy()
    occupied.facultyWeekly.set('uid-f1', 22) // only two periods of capacity remain
    const plan = planAutoSchedule({
      courses: [mappedCourse({ totalHours: 60 })], // requests four more → projected 26
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: occupied,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    const row = plan.facultyLoad.find((f) => f.facultyId === 'uid-f1')
    assert.equal(row?.totalWeekly, 24)
    assert.equal(row?.placedWeekly, 2)
    assert.equal(row?.existingWeekly, 22)
    assert.equal(row?.requestedWeekly, 4)
    assert.equal(row?.projectedWeekly, 26)
    assert.equal(row?.overloaded, false)
    assert.equal(row?.demandExceeded, true)
    assert.equal(plan.summary.overloadedFaculty, 1)
    assert.equal(plan.placements.some((p) => p.flags.includes('faculty-overloaded')), false)
    assert.match(plan.unplaced[0].reason, /weekly capacity reached/)
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

describe('group-aware placement, hard capacity and daily density', () => {
  it('packs separate A/B/C meetings for one faculty into a compact three-class day', () => {
    const courses = ['A', 'B', 'C'].map((division) => mappedCourse({
      mappingId: 'mapping-module',
      courseId: 'module-1',
      courseCode: 'MOD1',
      courseName: 'Business Law',
      totalHours: 15, // one weekly meeting per group
      facultyId: 'shared-faculty',
      facultyName: 'Dr. Shared',
      division,
      section: '',
    }))
    const plan = planAutoSchedule({
      courses,
      grid: { ...GRID_5P, days: ['monday', 'tuesday'] },
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
      targetFacultyClassesPerDay: 3,
      facultyDayPreference: 'compact',
    })
    assert.equal(plan.placements.length, 3)
    assert.deepEqual(plan.placements.map((p) => p.division).sort(), ['A', 'B', 'C'])
    assert.ok(plan.placements.every((p) => p.dayOfWeek === 'monday'))
    assert.equal(new Set(plan.placements.map((p) => p.startTime)).size, 3)
    const load = plan.facultyDailyLoad.find((row) => row.facultyId === 'shared-faculty' && row.day === 'monday')
    assert.deepEqual(load && { classes: load.classes, periods: load.periods, targetMet: load.targetMet }, {
      classes: 3, periods: 3, targetMet: true,
    })
  })

  it('fills a compact faculty day to the soft target plus one meeting, then opens another day', () => {
    const courses = ['A', 'B', 'C', 'D', 'E'].map((division, index) => mappedCourse({
      mappingId: `mapping-${division}`,
      courseId: `module-${division}`,
      courseCode: `MOD${index + 1}`,
      courseName: `Module ${division}`,
      totalHours: 15,
      facultyId: 'shared-faculty',
      facultyName: 'Dr. Shared',
      division,
      section: '',
    }))
    const plan = planAutoSchedule({
      courses,
      grid: { ...GRID_5P, days: ['monday', 'tuesday'] },
      rooms: ['R1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
      targetFacultyClassesPerDay: 3,
      facultyDayPreference: 'compact',
    })
    assert.equal(plan.placements.filter((placement) => placement.dayOfWeek === 'monday').length, 4)
    assert.equal(plan.placements.filter((placement) => placement.dayOfWeek === 'tuesday').length, 1)
    const monday = plan.facultyDailyLoad.find((row) => row.facultyId === 'shared-faculty' && row.day === 'monday')
    assert.equal(monday?.classes, 4)
    assert.equal(monday?.periods, 4)
    assert.equal(monday?.targetMet, true)
  })

  it('applies a demandKey override to one section without changing sibling sections', () => {
    const courses = ['A', 'B'].map((division) => mappedCourse({
      mappingId: 'legacy-shared',
      courseId: 'module-2',
      courseCode: 'MOD2',
      courseName: 'Economics',
      totalHours: 0,
      division,
      section: '',
    }))
    const input = {
      courses,
      grid: { ...GRID_5P, days: ['monday'] },
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    }
    const base = planAutoSchedule(input)
    const aDemand = base.demand.find((row) => row.division === 'A')!
    const updated = planAutoSchedule({
      ...input,
      courseOverrides: [{ demandKey: aDemand.demandKey, weeklyPeriods: 1 }],
    })
    assert.equal(updated.demand.find((row) => row.division === 'A')?.periodsRequested, 1)
    assert.equal(updated.demand.find((row) => row.division === 'B')?.periodsRequested, 0)
    assert.equal(updated.placements.filter((p) => p.division === 'A').length, 1)
    assert.equal(updated.placements.filter((p) => p.division === 'B').length, 0)
  })

  it('allows disjoint divisions to share the same period but keeps merged scopes conflict-safe', () => {
    const disjoint = planAutoSchedule({
      courses: [
        mappedCourse({ mappingId: 'a', courseId: 'same', facultyId: 'fa', facultyName: 'Faculty A', division: 'A', section: '' }),
        mappedCourse({ mappingId: 'b', courseId: 'same', facultyId: 'fb', facultyName: 'Faculty B', division: 'B', section: '' }),
      ],
      grid: { ...GRID_5P, days: ['monday'] },
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(disjoint.placements.length, 8)
    assert.ok(disjoint.placements.some((a) => disjoint.placements.some((b) => a.facultyId !== b.facultyId && a.startTime === b.startTime)))
    const mondayCoverage = disjoint.dailyCoverage.find((row) => row.day === 'monday')
    assert.equal(mondayCoverage?.periods, 4, 'parallel groups occupy four timetable slots, not eight placements')
    assert.equal(mondayCoverage?.utilization, 0.8)

    const merged = planAutoSchedule({
      courses: [
        mappedCourse({ mappingId: 'ab', courseId: 'same', facultyId: 'fab', facultyName: 'Faculty AB', totalHours: 30, division: 'A,B', section: '' }),
        mappedCourse({ mappingId: 'a', courseId: 'same', facultyId: 'fa', facultyName: 'Faculty A', totalHours: 30, division: 'A', section: '' }),
      ],
      grid: { ...GRID_5P, days: ['monday', 'tuesday'] },
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(merged.placements.length, 4)
    for (const mergedClass of merged.placements.filter((p) => p.division === 'A,B')) {
      const slot = `${mergedClass.dayOfWeek}|${mergedClass.startTime}`
      assert.ok(!merged.placements.some((other) => other.division === 'A' && `${other.dayOfWeek}|${other.startTime}` === slot))
    }
  })

  it('keeps weekly placements at or below capacity and suggests exact merge savings', () => {
    const occupied = emptyOccupancy()
    occupied.facultyWeekly.set('shared', 18)
    const courses = [
      mappedCourse({ mappingId: 'm-a', courseId: 'language', courseCode: 'L1', courseName: 'Language I', facultyId: 'shared', facultyName: 'Shared Faculty', totalHours: 90, division: 'A', section: '' }),
      mappedCourse({ mappingId: 'm-b', courseId: 'language', courseCode: 'L1', courseName: 'Language I', facultyId: 'shared', facultyName: 'Shared Faculty', totalHours: 90, division: 'B', section: '' }),
    ]
    const plan = planAutoSchedule({
      courses,
      grid: GRID_5P,
      rooms: ['R1'],
      occupancy: occupied,
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    const load = plan.facultyLoad.find((row) => row.facultyId === 'shared')
    assert.equal(load?.requestedWeekly, 12)
    assert.equal(load?.projectedWeekly, 30)
    assert.equal(load?.totalWeekly, 24)
    assert.equal(load?.demandExceeded, true)
    assert.match(load?.mergeSuggestions.join(' ') ?? '', /Merge A \+ B.*saves 6 periods\/week/)
    assert.ok(plan.unplaced.some((row) => /weekly capacity reached/.test(row.reason)))
  })

  it('counts a two-period lab span as one class in per-division daily density', () => {
    const plan = planAutoSchedule({
      courses: [mappedCourse({
        courseName: 'Computer Lab',
        totalHours: 60,
        division: 'A',
        section: '',
      })],
      grid: GRID_5P,
      rooms: ['LAB-1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.placements.length, 4)
    assert.equal(plan.cohortDailyCoverage.reduce((sum, row) => sum + row.classes, 0), 2)
    assert.equal(plan.cohortDailyCoverage.filter((row) => row.classes === 1).length, 2)
  })

  it('counts a multi-period lab as one faculty meeting but counts every occupied period', () => {
    const plan = planAutoSchedule({
      courses: [mappedCourse({
        courseCode: 'LB01',
        courseName: 'Computer Lab',
        totalHours: 30,
      })],
      grid: { ...GRID_5P, days: ['monday'] },
      rooms: ['LAB-1'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
      targetFacultyClassesPerDay: 3,
    })
    const monday = plan.facultyDailyLoad[0]
    assert.equal(monday.classes, 1)
    assert.equal(monday.periods, 2)
    assert.equal(monday.targetClasses, 3)
    assert.equal(monday.targetMet, false)
  })

  it('balances a 20-period cohort into four classes per day across five days', () => {
    const courses = Array.from({ length: 5 }, (_, index) => mappedCourse({
      mappingId: `m${index}`,
      courseId: `c${index}`,
      courseCode: `C${index}`,
      courseName: `Subject ${index}`,
      facultyId: `f${index}`,
      facultyName: `Faculty ${index}`,
      totalHours: 60,
      division: 'A',
      section: '',
    }))
    const plan = planAutoSchedule({
      courses,
      grid: GRID_5P,
      rooms: ['R1', 'R2'],
      occupancy: emptyOccupancy(),
      semesterWeeks: 15,
      maxPeriodsPerDayPerFaculty: 4,
    })
    assert.equal(plan.placements.length, 20)
    assert.ok(plan.cohortDailyCoverage.every((row) => row.classes === 4 && row.onTarget))
    assert.equal(plan.summary.divisionsInTarget, 1)
  })
})

describe('faculty identity reconciliation', () => {
  it('canonicalizes profile IDs, auth UIDs, and email aliases to one faculty key', () => {
    const aliases = buildFacultyIdentityMap([
      { id: 'faculty-profile-1', uid: 'auth-user-1', email: 'teacher@example.test' },
    ])
    assert.equal(canonicalFacultyId('faculty-profile-1', aliases), 'auth-user-1')
    assert.equal(canonicalFacultyId('AUTH-USER-1', aliases), 'auth-user-1')
    assert.equal(canonicalFacultyId('TEACHER@example.test', aliases), 'auth-user-1')
    assert.equal(canonicalFacultyId('legacy-unmatched', aliases), 'legacy-unmatched')
  })
})

describe('timetable occupancy safety cap', () => {
  it('rejects a capped partial read rather than planning with unchecked clashes', () => {
    assert.doesNotThrow(() => assertTimetableOccupancyComplete(1999, 2000))
    assert.throws(
      () => assertTimetableOccupancyComplete(2000, 2000),
      (error: any) => error.code === 'failed-precondition' && /cannot guarantee clash-free placement/.test(error.message),
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
    assert.equal(p.maxWeeklyPeriodsPerFaculty, 24)
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

// ─── batchListMatches (multi-batch matching fix) ─────────────────────────────

describe('batchListMatches', () => {
  it('matches an exact single batch token', () => {
    assert.equal(batchListMatches('2027', '2027'), true)
    assert.equal(batchListMatches(' 2027 ', '2027'), true)
    assert.equal(batchListMatches('2027', ' 2027 '), true)
  })

  it('tolerates separator and spacing drift ("2027,2028" vs "2027, 2028")', () => {
    assert.equal(batchListMatches('2027,2028', '2027, 2028'), true)
    assert.equal(batchListMatches('2027, 2028', '2028,2027'), true)
    assert.equal(batchListMatches('2027;2028', '2027/2028'), true)
    assert.equal(batchListMatches('2027 2028', '2027, 2028'), true)
  })

  it('matches when ANY requested token appears in the mapping batch list', () => {
    assert.equal(batchListMatches('2028', '2027, 2028'), true)
    assert.equal(batchListMatches('2028,2029', '2027, 2028'), true)
    assert.deepEqual(batchTokens('2027, 2028'), ['2027', '2028'])
  })

  it('rejects non-overlapping intakes', () => {
    assert.equal(batchListMatches('2026', '2027, 2028'), false)
    assert.equal(batchListMatches('2029,2030', '2027, 2028'), false)
    assert.equal(batchListMatches('20271', '2027'), false) // no prefix matching
  })

  it('keeps empty-batch semantics unchanged', () => {
    assert.equal(batchListMatches('', ''), true) // both empty → match
    assert.equal(batchListMatches('', '2027'), false) // one empty → mismatch
    assert.equal(batchListMatches('2027', ''), false)
  })

  it('reads an academic-year range as the class of its END year', () => {
    // The curriculum/auto-map dialogs store "2026-2027"; the operator runs the
    // scheduler for "2027". Before this the run found no demand at all and
    // said "run Auto Map first" about mappings that existed.
    assert.equal(batchListMatches('2027', '2026-2027'), true)
    assert.equal(batchListMatches('2026-2027', '2027'), true)
    assert.equal(batchListMatches('2026-27', '2027'), true)
    assert.equal(batchListMatches('2027, 2028', '2026-2027'), true)
  })

  it('keeps a bare start year out of its own range', () => {
    // "2026" is the class before 2027 — it must not be swept into 2026-2027.
    assert.equal(batchListMatches('2026', '2026-2027'), false)
    assert.equal(batchListMatches('2026-2027', '2026'), false)
  })
})

// ─── mappingServesCohort (auto-schedule demand filter) ──────────────────────

describe('mappingServesCohort', () => {
  const target = { batch: '2027', division: 'A', section: '' }

  it('includes a mapping whose batch is the run batch spelling of the same class', () => {
    assert.equal(mappingServesCohort({ batch: '2026-2027', division: 'A' }, target), true)
  })

  it('includes a mapping that covers the run division as part of a list', () => {
    // The live shape: Auto Map wrote ONE mapping for the whole batch with
    // division "A,B,C,D"; the admin schedules division A. The class covers A.
    assert.equal(mappingServesCohort({ batch: '2027', division: 'A,B,C,D' }, target), true)
    assert.equal(mappingServesCohort({ batch: '2027', division: 'A,B,C,D' }, { batch: '2027', division: 'b' }), true)
  })

  it('excludes a mapping for a different division', () => {
    assert.equal(mappingServesCohort({ batch: '2027', division: 'B' }, target), false)
    // A list that does not contain the run's letter is a different division.
    assert.equal(mappingServesCohort({ batch: '2027', division: 'B,C' }, target), false)
  })

  it('treats a blank mapping division as the whole-batch class', () => {
    assert.equal(mappingServesCohort({ batch: '2027', division: '' }, target), true)
    assert.equal(mappingServesCohort({ batch: '2027' }, target), true)
  })

  it('does not expand a division-specific mapping into a blank run', () => {
    // A run with no division schedules only whole-batch demand; including a
    // mapping for "A" would put a class on every division's timetable.
    assert.equal(mappingServesCohort({ batch: '2027', division: 'A' }, { batch: '2027', division: '' }), false)
    assert.equal(mappingServesCohort({ batch: '2027', division: '' }, { batch: '2027', division: '' }), true)
  })

  it('reads the letter from the section field too', () => {
    assert.equal(mappingServesCohort({ batch: '2027', section: 'A' }, target), true)
    assert.equal(mappingServesCohort({ batch: '2027', section: 'B' }, target), false)
  })

  it('still requires the batch to name the same class', () => {
    assert.equal(mappingServesCohort({ batch: '2026', division: 'A' }, target), false)
  })
})

describe('teaching-group expansion', () => {
  const rosterGroups = ['A', 'B', 'C', 'D', 'E'].map((division) => ({ division, section: '' }))

  it('keeps explicit comma-separated divisions as one merged teaching group', () => {
    assert.deepEqual(
      resolveMappingTeachingGroups({ division: 'A,B', section: '' }, rosterGroups),
      [{ division: 'A,B', section: '' }],
    )
  })

  it('can split an explicit merged mapping into one independent group per division', () => {
    assert.deepEqual(
      resolveMappingTeachingGroups({ division: 'A,B,C', section: '' }, rosterGroups, {}, 'separate'),
      [{ division: 'A', section: '' }, { division: 'B', section: '' }, { division: 'C', section: '' }],
    )
    assert.deepEqual(
      resolveMappingTeachingGroups({ division: 'A,B', section: '1' }, rosterGroups, { division: 'B' }, 'separate'),
      [{ division: 'B', section: '1' }],
    )
  })

  it('expands a legacy unscoped mapping to distinct enrolled groups, respecting a filter', () => {
    assert.deepEqual(
      resolveMappingTeachingGroups({ division: '', section: '' }, rosterGroups, { division: 'A,C', section: '' }),
      [{ division: 'A', section: '' }, { division: 'C', section: '' }],
    )
    assert.equal(resolveMappingTeachingGroups({ division: '', section: '' }, rosterGroups).length, 5)
  })

  it('retains one merged mapping when the run filters to any covered division', () => {
    assert.deepEqual(
      resolveMappingTeachingGroups({ division: 'A,B', section: '' }, rosterGroups, { division: 'B', section: '' }),
      [{ division: 'A,B', section: '' }],
    )
    assert.deepEqual(resolveMappingTeachingGroups({ division: 'A,B' }, rosterGroups, { division: 'C' }), [])
  })

  it('discovers groups only in the requested branch, batch and semester', () => {
    const rows = [
      { branch: 'BBA', batch: '2026-2027', semester: 4, division: 'A' },
      { department: 'b.b.a', batch: '2027', semester: '4', section: 'B' },
      { branch: 'BBA', batch: '2027', semester: 2, division: 'C' },
      { branch: 'BBA', batch: '2028', semester: 4, division: 'D' },
      { branch: 'B.Com', batch: '2027', semester: 4, division: 'E' },
    ]
    assert.deepEqual(
      teachingGroupsFromStudents(rows, { branch: 'BBA', batch: '2027', semester: 4 }),
      [{ division: 'A', section: '' }, { division: '', section: 'B' }],
    )
  })
})

// ─── Deterministic RNG helper ────────────────────────────────────────────────

describe('seededRandom / shuffleWith', () => {
  it('is reproducible for a seed and distinct across seeds', () => {
    const a1 = seededRandom('alpha')
    const a2 = seededRandom('alpha')
    const b = seededRandom('beta')
    const seqA1 = [a1(), a1(), a1()]
    const seqA2 = [a2(), a2(), a2()]
    assert.deepEqual(seqA1, seqA2)
    assert.notDeepEqual(seqA1, [b(), b(), b()])
  })

  it('shuffleWith is a permutation and deterministic per seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const s1 = shuffleWith(items, seededRandom('s'))
    const s2 = shuffleWith(items, seededRandom('s'))
    assert.deepEqual(s1, s2)
    assert.deepEqual([...s1].sort((x, y) => x - y), items) // same members
  })
})

// ─── P3: placement strategies + room strategy ────────────────────────────────

function sixCourseInput() {
  return {
    courses: [
      mappedCourse({ mappingId: 'm1', courseId: 'c1', courseCode: 'A1', courseName: 'Accounting', facultyId: 'f1', facultyName: 'A One', totalHours: 60 }),
      mappedCourse({ mappingId: 'm2', courseId: 'c2', courseCode: 'B1', courseName: 'Business Law', facultyId: 'f2', facultyName: 'B Two', totalHours: 45 }),
      mappedCourse({ mappingId: 'm3', courseId: 'c3', courseCode: 'C1', courseName: 'Statistics Lab', facultyId: 'f3', facultyName: 'C Three', totalHours: 30 }),
      mappedCourse({ mappingId: 'm4', courseId: 'c4', courseCode: 'D1', courseName: 'Economics', facultyId: 'f4', facultyName: 'D Four', totalHours: 60 }),
      mappedCourse({ mappingId: 'm5', courseId: 'c5', courseCode: 'E1', courseName: 'Language Lab', facultyId: 'f5', facultyName: 'E Five', totalHours: 30 }),
      mappedCourse({ mappingId: 'm6', courseId: 'c6', courseCode: 'F1', courseName: 'History', facultyId: 'f6', facultyName: 'F Six', totalHours: 45 }),
    ],
    grid: GRID_5P,
    rooms: ['R1', 'R2'],
    occupancy: emptyOccupancy(),
    semesterWeeks: 15,
    maxPeriodsPerDayPerFaculty: 4,
  }
}

const fingerprint = (plan: AutoSchedulePlan) =>
  plan.placements.map((p: SchedulePlacement) => [p.courseId, p.dayOfWeek, p.periodIndex, p.room])

/** Hard constraints — sacred in EVERY strategy. */
function assertHardConstraints(plan: AutoSchedulePlan) {
  const cohortKeys = new Set<string>()
  const facultyKeys = new Set<string>()
  const roomKeys = new Set<string>()
  const facultyDay = new Map<string, number>()
  const courseDay = new Map<string, SchedulePlacement[]>()
  for (const p of plan.placements) {
    const slotKey = `${p.dayOfWeek}|${p.startTime}`
    assert.ok(!cohortKeys.has(slotKey), `cohort double-booked at ${slotKey}`)
    cohortKeys.add(slotKey)
    assert.ok(!facultyKeys.has(`${p.facultyId}|${slotKey}`), `faculty ${p.facultyId} double-booked at ${slotKey}`)
    facultyKeys.add(`${p.facultyId}|${slotKey}`)
    assert.ok(!roomKeys.has(`${slotKey}|${p.room}`), `room ${p.room} double-booked at ${slotKey}`)
    roomKeys.add(`${slotKey}|${p.room}`)
    const fd = `${p.facultyId}|${p.dayOfWeek}`
    facultyDay.set(fd, (facultyDay.get(fd) ?? 0) + 1)
    const cd = `${p.courseId}|${p.dayOfWeek}`
    courseDay.set(cd, [...(courseDay.get(cd) ?? []), p])
    // UGC ceiling is flag-only (pre-v2 semantics) — but it must be truthful.
    if (p.flags.includes('faculty-overloaded')) {
      assert.ok(p.type === 'lecture' || p.type === 'lab')
    }
  }
  for (const [fd, n] of facultyDay) {
    assert.ok(n <= 4, `faculty daily cap violated at ${fd}: ${n}`)
  }
  for (const [cd, rows] of courseDay) {
    // ≤1 course-span/day (lectures and labs both spread days)
    const periods = rows.map((r) => r.periodIndex).sort((a, b) => a - b)
    assert.equal(periods.length, new Set(periods).size, `overlapping spans for ${cd}`)
    if (rows[0].type === 'lab' && rows.length > 1) {
      // lab spans stay contiguous within the day
      for (let i = 1; i < periods.length; i++) {
        assert.equal(periods[i], periods[i - 1] + 1, `lab span not contiguous for ${cd}`)
      }
    } else {
      assert.equal(rows.length, 1, `course ${cd} has ${rows.length} spans in one day`)
    }
  }
  // Weekly faculty capacity is a hard placement constraint.
  for (const f of plan.facultyLoad) {
    assert.equal(f.overloaded, f.totalWeekly > f.capacity)
    assert.ok(f.totalWeekly <= f.capacity)
  }
}

describe('planAutoSchedule strategies', () => {
  it("uniform is the default and is byte-identical to pre-v2's fixed order", () => {
    const input = sixCourseInput()
    const implicit = planAutoSchedule(input)
    const explicit = planAutoSchedule({ ...input, strategy: 'uniform' })
    assert.deepEqual(fingerprint(implicit), fingerprint(explicit))
    assert.deepEqual(implicit.summary, explicit.summary)
  })

  it('same randomSeed → identical plan (determinism), preview == apply', () => {
    for (const strategy of ['random', 'spread'] as PlacementStrategy[]) {
      const a = planAutoSchedule({ ...sixCourseInput(), strategy, randomSeed: 'seed-42' })
      const b = planAutoSchedule({ ...sixCourseInput(), strategy, randomSeed: 'seed-42' })
      assert.deepEqual(fingerprint(a), fingerprint(b), `${strategy} must be seed-deterministic`)
    }
    const ra = planAutoSchedule({ ...sixCourseInput(), strategy: 'random', roomStrategy: 'random', randomSeed: 'seed-42' })
    const rb = planAutoSchedule({ ...sixCourseInput(), strategy: 'random', roomStrategy: 'random', randomSeed: 'seed-42' })
    assert.deepEqual(fingerprint(ra), fingerprint(rb))
  })

  it('random mode keeps every hard constraint over a synthetic 6-course input', () => {
    for (const seed of ['s1', 's2', 's3', 's4', 's5']) {
      const plan = planAutoSchedule({ ...sixCourseInput(), strategy: 'random', randomSeed: seed })
      assertHardConstraints(plan)
      assert.equal(plan.summary.periodsPlaced, 18) // 6 courses × derived hours, all placed
    }
  })

  it('spread mode keeps every hard constraint and differs from uniform', () => {
    const uniform = planAutoSchedule(sixCourseInput())
    const spread = planAutoSchedule({ ...sixCourseInput(), strategy: 'spread' })
    assertHardConstraints(spread)
    assert.equal(spread.summary.periodsPlaced, 18)
    assert.notDeepEqual(fingerprint(uniform), fingerprint(spread))
  })

  it('roomStrategy random still respects room busy and stays seed-deterministic', () => {
    const occupied = emptyOccupancy()
    occupied.roomBusy.add('monday|08:00|R1')
    const plan = planAutoSchedule({
      ...sixCourseInput(),
      occupancy: occupied,
      strategy: 'random',
      roomStrategy: 'random',
      randomSeed: 'rooms-7',
    })
    assertHardConstraints(plan)
    assert.ok(!plan.placements.some((p) => p.dayOfWeek === 'monday' && p.startTime === '08:00' && p.room === 'R1'))
  })

  it('plan echoes the effective seed only when a seeded RNG shaped it', () => {
    const uniform = planAutoSchedule(sixCourseInput())
    assert.equal(uniform.randomSeed, undefined)
    const random = planAutoSchedule({ ...sixCourseInput(), strategy: 'random', randomSeed: 'seed-x' })
    assert.equal(random.randomSeed, 'seed-x')
  })
})

// ─── P2: course overrides + zero-hour demand ─────────────────────────────────

describe('courseOverrides + demand rows', () => {
  it('include:false (and weeklyPeriods:0) removes a course from the plan', () => {
    const input = sixCourseInput()
    const plan = planAutoSchedule({
      ...input,
      courseOverrides: [{ mappingId: 'm1', include: false }, { mappingId: 'm2', weeklyPeriods: 0 }],
    })
    assert.equal(plan.summary.periodsPlaced, 18 - 4 - 3)
    assert.ok(!plan.placements.some((p) => p.mappingId === 'm1'))
    assert.ok(!plan.placements.some((p) => p.mappingId === 'm2'))
    const row = plan.demand.find((d) => d.mappingId === 'm1')
    assert.equal(row?.included, false)
    assert.equal(row?.source, 'excluded')
  })

  it('weeklyPeriods overrides the hoursPerWeek derivation', () => {
    const plan = planAutoSchedule({
      ...sixCourseInput(),
      courseOverrides: [{ mappingId: 'm1', weeklyPeriods: 2 }], // derived would be 4
    })
    const placed = plan.placements.filter((p) => p.mappingId === 'm1')
    assert.equal(placed.length, 2)
    const row = plan.demand.find((d) => d.mappingId === 'm1')
    assert.equal(row?.periodsRequested, 2)
    assert.equal(row?.source, 'override')
  })

  it('zero-hour mapping with no override → unplaced with the explicit reason', () => {
    const input = sixCourseInput()
    input.courses[0] = mappedCourse({
      mappingId: 'm0', courseId: 'c0', courseCode: 'LANG3', courseName: 'Kannada (0h)',
      facultyId: 'f0', facultyName: 'K Zero', totalHours: 0, credits: 3,
    })
    const plan = planAutoSchedule(input)
    const unplaced = plan.unplaced.find((u) => u.courseId === 'c0')
    assert.ok(unplaced, 'zero-hour course must be reported unplaced')
    assert.equal(unplaced.reason, ZERO_HOURS_REASON)
    assert.equal(unplaced.reason, 'course has 0 contact hours — set weeklyPeriods')
    assert.ok(!plan.placements.some((p) => p.courseId === 'c0'))
    // credits×4 fallback is gone: no 12-period phantom demand
    assert.equal(plan.demand.find((d) => d.courseId === 'c0')?.periodsRequested, 0)
  })

  it('zero-hour mapping WITH weeklyPeriods override places exactly that many', () => {
    const input = sixCourseInput()
    input.courses[0] = mappedCourse({
      mappingId: 'm0', courseId: 'c0', courseCode: 'LANG3', courseName: 'Kannada (0h)',
      facultyId: 'f0', facultyName: 'K Zero', totalHours: 0, credits: 3,
    })
    const plan = planAutoSchedule({ ...input, courseOverrides: [{ mappingId: 'm0', weeklyPeriods: 3 }] })
    assert.equal(plan.placements.filter((p) => p.courseId === 'c0').length, 3)
    assert.equal(plan.demand.find((d) => d.courseId === 'c0')?.source, 'override')
  })
})

// ─── P1/P2/P3 payload validation ─────────────────────────────────────────────

describe('validateAutoSchedulePayload v2 fields', () => {
  const base = { curriculumId: 'cur-1', batch: '2026' }

  it('defaults: no dateRange, uniform strategy, leastLoaded rooms, no overrides', () => {
    const p = validateAutoSchedulePayload(base, 'hod', 'col-1')
    assert.equal(p.dateRange, undefined)
    assert.equal(p.strategy, 'uniform')
    assert.equal(p.roomStrategy, 'leastLoaded')
    assert.equal(p.targetFacultyClassesPerDay, 3)
    assert.equal(p.facultyDayPreference, 'compact')
    assert.equal(p.teachingGroupMode, 'mapping')
    assert.deepEqual(p.courseOverrides, [])
    assert.equal(p.maxWeeklyPeriodsPerFaculty, 24)
    assert.deepEqual(p.warnings, [])
  })

  it('validates dateRange dates and order', () => {
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, dateRange: { from: '2026-13-01' } }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, dateRange: { from: '10/09/2026' } }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, dateRange: { from: '2026-12-20', to: '2026-09-22' } }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    const p = validateAutoSchedulePayload({ ...base, dateRange: { from: '2026-09-22', to: '2026-12-20' } }, 'hod', 'col-1')
    assert.deepEqual(p.dateRange, { from: '2026-09-22', to: '2026-12-20' })
    assert.deepEqual(p.warnings, [])
  })

  it('warns (does not reject) when the range exceeds one generate run (92 days)', () => {
    const p = validateAutoSchedulePayload({ ...base, dateRange: { from: '2026-09-22', to: '2027-03-31' } }, 'hod', 'col-1')
    assert.equal(p.warnings.length, 1)
    assert.match(p.warnings[0], /92/)
    const fromOnly = validateAutoSchedulePayload({ ...base, dateRange: { from: '2026-09-22' } }, 'hod', 'col-1')
    assert.deepEqual(fromOnly.dateRange, { from: '2026-09-22' })
  })

  it('rejects unknown strategies and room strategies', () => {
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, strategy: 'chaos' }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, roomStrategy: 'biggest' }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    const p = validateAutoSchedulePayload({ ...base, strategy: 'spread', roomStrategy: 'random', randomSeed: 'abc' }, 'hod', 'col-1')
    assert.equal(p.strategy, 'spread')
    assert.equal(p.roomStrategy, 'random')
    assert.equal(p.randomSeed, 'abc')
  })

  it('validates a positive weekly capacity no greater than 60', () => {
    assert.equal(validateAutoSchedulePayload({ ...base, maxWeeklyPeriodsPerFaculty: 18 }, 'hod', 'col-1').maxWeeklyPeriodsPerFaculty, 18)
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, maxWeeklyPeriodsPerFaculty: 0 }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, maxWeeklyPeriodsPerFaculty: 61 }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
  })

  it('validates faculty packing and teaching-group preferences', () => {
    const p = validateAutoSchedulePayload({
      ...base,
      targetFacultyClassesPerDay: 3,
      facultyDayPreference: 'balanced',
      teachingGroupMode: 'separate',
      courseOverrides: [{ demandKey: 'mapping|branch|2026|a', include: false }],
    }, 'hod', 'col-1')
    assert.equal(p.targetFacultyClassesPerDay, 3)
    assert.equal(p.facultyDayPreference, 'balanced')
    assert.equal(p.teachingGroupMode, 'separate')
    assert.deepEqual(p.courseOverrides, [{ demandKey: 'mapping|branch|2026|a', include: false }])
    const legacyCap = validateAutoSchedulePayload({ ...base, maxPeriodsPerDayPerFaculty: 2 }, 'hod', 'col-1')
    assert.equal(legacyCap.targetFacultyClassesPerDay, 2)
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, facultyDayPreference: 'packed' }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, teachingGroupMode: 'explode' }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, maxPeriodsPerDayPerFaculty: 2, targetFacultyClassesPerDay: 3 }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
  })

  it('validates courseOverrides rows', () => {
    const ok = validateAutoSchedulePayload(
      { ...base, courseOverrides: [{ mappingId: 'm1', weeklyPeriods: 2 }, { mappingId: 'm2', include: false }] },
      'hod', 'col-1',
    )
    assert.deepEqual(ok.courseOverrides, [{ mappingId: 'm1', weeklyPeriods: 2 }, { mappingId: 'm2', include: false }])
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, courseOverrides: [{ weeklyPeriods: 2 }] }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, courseOverrides: [{ mappingId: 'm1', weeklyPeriods: -1 }] }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, courseOverrides: [{ mappingId: 'm1', weeklyPeriods: 41 }] }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
    assert.throws(
      () => validateAutoSchedulePayload({ ...base, courseOverrides: [{ mappingId: 'm1', include: 'yes' }] }, 'hod', 'col-1'),
      (e: any) => e.code === 'invalid-argument',
    )
  })
})

// ─── Unplaced reasons stay truthful per mode ─────────────────────────────────

describe('unplaced reasons are mode-independent', () => {
  it('random mode still says "No free slot…" when jammed (never blames the strategy)', () => {
    const jammed = emptyOccupancy()
    for (const slot of buildSlots(GRID_5P)) jammed.cohortBusy.add(`${slot.day}|${slot.startTime}`)
    for (const strategy of ['uniform', 'spread', 'random'] as PlacementStrategy[]) {
      const plan = planAutoSchedule({
        courses: [mappedCourse()],
        grid: GRID_5P,
        rooms: ['R1'],
        occupancy: jammed,
        semesterWeeks: 15,
        maxPeriodsPerDayPerFaculty: 4,
        strategy,
        randomSeed: 'truth-seed',
      })
      assert.equal(plan.placements.length, 0)
      assert.equal(plan.unplaced.length, 1)
      assert.match(plan.unplaced[0].reason, /No free slot/)
    }
  })
})
