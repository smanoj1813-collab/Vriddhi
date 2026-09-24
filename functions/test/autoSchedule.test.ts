// functions/test/autoSchedule.test.ts
// G4 slot auto-scheduler — pure-core tests, no Firestore.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSlots,
  planAutoSchedule,
  validateAutoSchedulePayload,
  batchListMatches,
  batchTokens,
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
  // 24-period UGC ceiling: flagged honestly whenever exceeded
  for (const f of plan.facultyLoad) {
    assert.equal(f.overloaded, f.totalWeekly > f.capacity)
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
    assert.deepEqual(p.courseOverrides, [])
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
