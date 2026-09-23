// ─────────────────────────────────────────────────────────────────────────────
// Auto slot scheduler (G4)
//
// WHY THIS EXISTS
// mapping() → who teaches what; the timetable is still a hand-drawn grid of
// days × periods — the single most error-prone Excel in a Karnataka degree
// college (clashes fixed by phone, lab spans double-booked, guest faculty
// over-stuffed, and no visibility of "how many hours a day does this batch
// actually get?").
//
// THE ALGORITHM (deterministic, preview-before-write)
//   1. DEMAND   — every ACTIVE course mapping of the target cohort (curriculum
//                 + batch + division + section) needs `hoursPerWeek` periods
//                 (same conversion as the auto-mapper: totalHours/semesterWeeks,
//                 min 1). Lab/practical-looking courses are packed in spans
//                 (default 2 consecutive periods).
//   2. GRID     — days × periodsPerDay slots materialised from startTime &
//                 periodMinutes with one configurable break. Slot times are
//                 computed here and echoed back so the preview and the written
//                 docs can never disagree.
//   3. PLACE    — courses in demand order (heaviest first, then code for a
//                 stable tiebreak). Each period/span goes to the least-used
//                 day for that course (spread), earliest free period, subject
//                 to: cohort not busy, faculty not busy (ANY college class),
//                 faculty daily cap, room not double-booked. Room choice:
//                 least-loaded free room (spreads utilisation).
//   4. TRUST    — the result carries per-day coverage (periods + hours/day
//                 vs the grid) and per-faculty load (existing + placed vs the
//                 24-period UGC ceiling) — the two questions every principal
//                 asks of a machine-made timetable.
//   5. WRITE    — dryRun (default) only returns the plan. dryRun:false writes
//                 each placement as an ordinary weeklySchedules doc (same
//                 shape as bulk import), stamped autoScheduled for audit.
// ─────────────────────────────────────────────────────────────────────────────

import * as admin from 'firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { resolveSchedulingStaff, isValidDateKey, daysBetween, MAX_GENERATE_RANGE_DAYS } from './classSchedule'
import { hoursPerWeek, DEFAULT_SEMESTER_WEEKS, DEFAULT_CAPACITY_WEEKLY_HOURS } from './autoCurriculumMapping'
import { normalizeDay, isValidTime } from './scheduleImport'
import { buildCalendarView, toCalendarEventLite, MAX_CALENDAR_READ, type CalendarView, type CalendarEventLite } from './calendar'
import type { DayOfWeek } from './classSchedule'

// ═════════════════════════════════════════════════════════════════════════════
// Pure core
// ═════════════════════════════════════════════════════════════════════════════

export interface ScheduleGrid {
  days: DayOfWeek[]
  periodsPerDay: number
  startTime: string
  periodMinutes: number
  /** Break inserted after this 1-based period index (0 = no break). */
  breakAfterPeriod: number
  breakMinutes: number
  labSpan: number
}

/** P3 — how placements choose among legal slots (constraints stay sacred). */
export type PlacementStrategy = 'uniform' | 'spread' | 'random'
/** P3 — room choice among the rooms free for a span. */
export type RoomStrategy = 'leastLoaded' | 'random'
export const PLACEMENT_STRATEGIES: PlacementStrategy[] = ['uniform', 'spread', 'random']
export const ROOM_STRATEGIES: RoomStrategy[] = ['leastLoaded', 'random']

/** P2 — per-course steering for one apply run. */
export interface CourseOverride {
  mappingId: string
  /** Overrides hoursPerWeek() for this course. 0 (or include:false) excludes. */
  weeklyPeriods?: number | null
  include?: boolean
}

export interface PlannedSlot {
  day: DayOfWeek
  periodIndex: number // 1-based within the day
  startTime: string
  endTime: string
}

/** A mapped course that needs periods placed. */
export interface AutoScheduleCourse {
  mappingId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyId: string
  facultyName: string
  totalHours: number
  credits: number
  branch: string
  semester: number
  batch: string
  division: string
  section: string
}

/** Already-committed occupancy from the college's live weeklySchedules. */
export interface Occupancy {
  /** `${day}|${hh:mm}` the faculty already teaches (any cohort). */
  facultyBusy: Set<string>
  /** `${day}|${hh:mm}` the cohort already has a class. */
  cohortBusy: Set<string>
  /** `${day}|${hh:mm}|${room}` already booked. */
  roomBusy: Set<string>
  /** facultyId → weekly periods already committed. */
  facultyWeekly: Map<string, number>
}

export interface AutoScheduleInput {
  courses: AutoScheduleCourse[]
  grid: ScheduleGrid
  rooms: string[]
  occupancy: Occupancy
  semesterWeeks: number
  maxPeriodsPerDayPerFaculty: number
  /** P3 — default 'uniform' = today's behaviour, zero surprise. */
  strategy?: PlacementStrategy
  /** P3 — deterministic RNG seed ('random' mode + roomStrategy:'random'). */
  randomSeed?: string
  /** P3 — default 'leastLoaded'. */
  roomStrategy?: RoomStrategy
  /** P2 — include/weeklyPeriods steering, keyed by mappingId. */
  courseOverrides?: CourseOverride[]
}

export type PlacementType = 'lecture' | 'lab'

export interface SchedulePlacement {
  mappingId: string
  courseId: string
  subject: string
  subjectCode: string
  facultyId: string
  facultyName: string
  branch: string
  batch: string
  semester: number
  division: string
  section: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  type: PlacementType
  periodIndex: number
  span: number
  flags: string[]
}

export interface UnplacedCourse {
  courseId: string
  subject: string
  periodsRequested: number
  periodsPlaced: number
  reason: string
}

/**
 * P2 — one row per candidate course, included or not. The dialog's
 * per-course override table is prefilled from this (the preview's demand
 * list), so the operator sees exactly what the server derived and why.
 */
export interface DemandRow {
  mappingId: string
  courseId: string
  courseCode: string
  courseName: string
  facultyName: string
  /** Effective weekly demand after overrides (0 when excluded/zero-hours). */
  periodsRequested: number
  included: boolean
  /** 'derived' = hoursPerWeek(), 'override' = operator set weeklyPeriods. */
  source: 'derived' | 'override' | 'excluded' | 'zero-hours'
  reason?: string
}

export interface ScheduleFacultyLoad {
  facultyId: string
  facultyName: string
  existingWeekly: number
  placedWeekly: number
  totalWeekly: number
  capacity: number
  overloaded: boolean
}

export interface DailyCoverage {
  day: DayOfWeek
  periods: number
  /** periods × periodMinutes, in hours (1 decimal) */
  hours: number
  utilization: number // periods / periodsPerDay, 0..1
  subjects: string[]
}

export interface AutoSchedulePlan {
  grid: ScheduleGrid
  rooms: string[]
  placements: SchedulePlacement[]
  unplaced: UnplacedCourse[]
  facultyLoad: ScheduleFacultyLoad[]
  dailyCoverage: DailyCoverage[]
  /** P2 — every candidate course with its effective demand + include state. */
  demand: DemandRow[]
  /** P4 — calendar view for the preview (blocked weekdays + day counts). */
  calendar?: CalendarView
  /** P3 — echo of the effective seed when a seeded RNG shaped this plan. */
  randomSeed?: string
  summary: {
    courses: number
    placements: number
    periodsRequested: number
    periodsPlaced: number
    unplacedCourses: number
    overloadedFaculty: number
    /** P2 — courses the run actually asked to place (after overrides). */
    coursesIncluded?: number
    /** P4 — grid-day occurrences in dateRange, minus suspended ones. */
    teachingDays?: number
    blockedDays?: number
    blockedBreakdown?: Record<string, number>
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Deterministic RNG (P3) — mulberry32 over a seed string
// ═════════════════════════════════════════════════════════════════════════════

/** xmur3 string hash → uint32 seed for mulberry32. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/**
 * mulberry32 PRNG seeded from a string. Same seed + same inputs = same grid,
 * so preview == apply and a run is reproducible/auditable weeks later.
 */
export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates shuffle driven by the seeded RNG (pure: returns a copy). */
export function shuffleWith<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}

const pad2 = (n: number) => String(n).padStart(2, '0')
function minutesToHhMm(total: number): string {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}

/** Materialise the day's slots from the grid config (break included). */
export function buildSlots(grid: ScheduleGrid): PlannedSlot[] {
  const [h, m] = grid.startTime.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return []
  const slots: PlannedSlot[] = []
  for (const day of grid.days) {
    let cursor = h * 60 + m
    for (let p = 1; p <= grid.periodsPerDay; p++) {
      const end = cursor + grid.periodMinutes
      slots.push({
        day,
        periodIndex: p,
        startTime: minutesToHhMm(cursor),
        endTime: minutesToHhMm(end),
      })
      cursor = end
      if (grid.breakAfterPeriod === p) cursor += grid.breakMinutes
    }
  }
  return slots
}

const LAB_NAME_RE = /\b(lab|laboratory|practical|practicum)\b/i

const busyKey = (day: DayOfWeek, startTime: string) => `${day}|${startTime}`

// ─── Multi-batch matching (in-flight fix, commit 8bfdac0) ───────────────────
// Mappings store batch as a comma-joined multi-intake string ("2027, 2028");
// operators type "2027,2028". Strict equality dropped every row and the
// dialog misreported "run Auto Map first". Both sides are tokenised on
// [,/;\s]+ and match when ANY requested token appears in the mapping's batch
// list. Empty-batch semantics are unchanged (both empty = match, one empty =
// mismatch — the callable always requires a non-empty batch anyway).

/** Unplaced reason for a 0h mapping the operator has not overridden yet. */
export const ZERO_HOURS_REASON = 'course has 0 contact hours — set weeklyPeriods'

/** Fallback RNG seed when a 'random' run arrives without one (P3). */
export const DEFAULT_RANDOM_SEED = 'vriddhi-auto-v2'

/** Split a batch field into comparable intake tokens. */
export function batchTokens(value: unknown): string[] {
  return String(value ?? '')
    .split(/[,/;\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * True when the requested batch (single value or multi-intake string)
 * intersects the mapping's batch list. Empty-batch semantics unchanged.
 */
export function batchListMatches(requested: unknown, mappingBatch: unknown): boolean {
  const requestTokens = batchTokens(requested)
  const mappingTokens = batchTokens(mappingBatch)
  if (requestTokens.length === 0 && mappingTokens.length === 0) return true
  if (requestTokens.length === 0 || mappingTokens.length === 0) return false
  const mappingSet = new Set(mappingTokens)
  return requestTokens.some((t) => mappingSet.has(t))
}

/**
 * Place one course's periods into the grid. Mutates the local occupancy so
 * subsequent courses see this course's footprint (intra-run clash safety,
 * exactly like the import planner).
 */
export function planAutoSchedule(input: AutoScheduleInput): AutoSchedulePlan {
  const rooms = input.rooms.length > 0 ? input.rooms : ['Room 1']
  const slots = buildSlots(input.grid)
  if (slots.length === 0) {
    throw new HttpsError('invalid-argument', 'Grid produced no slots — check startTime and periodsPerDay')
  }

  // Local mutable view: seeds from the college's existing timetable.
  const facultyBusy = new Set(input.occupancy.facultyBusy)
  const cohortBusy = new Set(input.occupancy.cohortBusy)
  const roomBusy = new Set(input.occupancy.roomBusy)
  const facultyWeekly = new Map(input.occupancy.facultyWeekly)
  const facultyDaily = new Map<string, number>()

  // P3 — preference order changes with the strategy; hard constraints never do.
  const strategy: PlacementStrategy = input.strategy ?? 'uniform'
  const roomStrategy: RoomStrategy = input.roomStrategy ?? 'leastLoaded'
  const usesRng = strategy === 'random' || roomStrategy === 'random'
  const effectiveSeed = String(input.randomSeed ?? '').trim() || DEFAULT_RANDOM_SEED
  const rng = seededRandom(effectiveSeed)

  const placements: SchedulePlacement[] = []
  const unplaced: UnplacedCourse[] = []

  // Per-course spread bookkeeping: how many periods each course already has per day.
  const courseDayCount = new Map<string, number>()

  // ── P2: course inclusion & weekly-load overrides ──────────────────────────
  // `courseOverrides` steer one run: include:false (or weeklyPeriods:0)
  // excludes a course; weeklyPeriods replaces the hoursPerWeek() derivation.
  // A zero-hour mapping with NO override no longer demands credits×4 periods
  // ("0h language courses got 12 periods demanded") — it lands in unplaced
  // with an explicit reason instead.
  const overridesByMapping = new Map<string, CourseOverride>()
  for (const o of input.courseOverrides ?? []) {
    if (o && typeof o.mappingId === 'string' && o.mappingId) overridesByMapping.set(o.mappingId, o)
  }

  const demandRows: DemandRow[] = []
  const placeable: { course: AutoScheduleCourse; periods: number }[] = []
  for (const c of input.courses) {
    const override = overridesByMapping.get(c.mappingId)
    const overridePeriods =
      override && typeof override.weeklyPeriods === 'number' && Number.isFinite(override.weeklyPeriods)
        ? Math.max(0, Math.floor(override.weeklyPeriods))
        : null
    const include = override?.include !== false && overridePeriods !== 0
    const rowBase = {
      mappingId: c.mappingId,
      courseId: c.courseId,
      courseCode: c.courseCode,
      courseName: c.courseName,
      facultyName: c.facultyName,
    }
    if (!include) {
      demandRows.push({
        ...rowBase,
        periodsRequested: 0,
        included: false,
        source: 'excluded',
        reason: 'Excluded for this run (course override)',
      })
      continue
    }
    if (overridePeriods !== null) {
      demandRows.push({ ...rowBase, periodsRequested: overridePeriods, included: true, source: 'override' })
      if (overridePeriods > 0) placeable.push({ course: c, periods: overridePeriods })
      continue
    }
    if (!(c.totalHours > 0)) {
      demandRows.push({
        ...rowBase,
        periodsRequested: 0,
        included: false,
        source: 'zero-hours',
        reason: ZERO_HOURS_REASON,
      })
      unplaced.push({
        courseId: c.courseId,
        subject: c.courseName,
        periodsRequested: 0,
        periodsPlaced: 0,
        reason: ZERO_HOURS_REASON,
      })
      continue
    }
    const periods = hoursPerWeek({ totalHours: c.totalHours, credits: c.credits }, input.semesterWeeks)
    demandRows.push({ ...rowBase, periodsRequested: periods, included: true, source: 'derived' })
    placeable.push({ course: c, periods })
  }

  // Demand order: heaviest first, then code for a stable tiebreak.
  const demand = [...placeable].sort(
    (a, b) => b.periods - a.periods || a.course.courseCode.localeCompare(b.course.courseCode),
  )

  for (let courseRank = 0; courseRank < demand.length; courseRank++) {
    const { course, periods } = demand[courseRank]
    const isLab = LAB_NAME_RE.test(course.courseName)
    const span = isLab ? Math.max(1, Math.min(input.grid.labSpan, periods)) : 1
    const spansNeeded = isLab ? Math.ceil(periods / span) : periods
    let placed = 0

    spanLoop: for (let s = 0; s < spansNeeded; s++) {
      const thisSpan = isLab && periods - placed < span ? Math.max(1, periods - placed) : span
      const dayKey = `${course.courseId}`

      // Candidate (day, period) pairs: this course's least-used days first
      // (spread the week), then earliest period. Labs must fit a full span.
      // P3: 'uniform' keeps this exact order (regression pin); 'spread'
      // rotates the day-tiebreak by course rank and pends early/late periods;
      // 'random' shuffles days and same-span candidates with the seeded RNG.
      let candidates: PlannedSlot[][] = []
      const byDay = new Map<DayOfWeek, PlannedSlot[]>()
      for (const slot of slots) {
        const arr = byDay.get(slot.day) ?? []
        arr.push(slot)
        byDay.set(slot.day, arr)
      }
      const countFor = (day: DayOfWeek) => courseDayCount.get(`${dayKey}|${day}`) ?? 0
      let daysOrdered = [...byDay.keys()].sort(
        (a, b) => countFor(a) - countFor(b) || input.grid.days.indexOf(a) - input.grid.days.indexOf(b),
      )
      if (strategy === 'spread') {
        // Course #n starts its day pick at days[n % days.length] — ties rotate
        // instead of always favouring Monday.
        const n = Math.max(1, input.grid.days.length)
        const rankOffset = courseRank % n
        const rotatedIndex = (d: DayOfWeek) => (((input.grid.days.indexOf(d) - rankOffset) % n) + n) % n
        daysOrdered = [...byDay.keys()].sort((a, b) => countFor(a) - countFor(b) || rotatedIndex(a) - rotatedIndex(b))
      } else if (strategy === 'random') {
        daysOrdered = shuffleWith(daysOrdered, rng)
      }
      for (const day of daysOrdered) {
        const daySlots = (byDay.get(day) ?? []).sort((x, y) => x.periodIndex - y.periodIndex)
        let starts: number[] = []
        for (let i = 0; i + thisSpan <= daySlots.length; i++) starts.push(i)
        if (strategy === 'spread' && starts.length > 1) {
          // Period dispersion: alternate early/late window starts (a pendulum
          // over the day), course-rank parity picks which end goes first.
          const pendulum: number[] = []
          let lo = 0
          let hi = starts.length - 1
          let takeEarly = courseRank % 2 === 0
          while (lo <= hi) {
            if (takeEarly) pendulum.push(lo++)
            else pendulum.push(hi--)
            takeEarly = !takeEarly
          }
          starts = pendulum
        }
        for (const i of starts) {
          candidates.push(daySlots.slice(i, i + thisSpan))
        }
      }
      if (strategy === 'random') candidates = shuffleWith(candidates, rng)

      let chose: PlannedSlot[] | null = null
      let choseRoom = ''
      for (const cand of candidates) {
        const day = cand[0].day
        // one (span) per day per course for lectures — labs also spread days
        if ((courseDayCount.get(`${course.courseId}|${day}`) ?? 0) > 0 && input.grid.days.length > 1) continue
        const keys = cand.map((slot) => busyKey(day, slot.startTime))
        if (keys.some((k) => cohortBusy.has(k))) continue
        if (keys.some((k) => facultyBusy.has(k))) continue
        const dailyKey = `${course.facultyId}|${day}`
        if ((facultyDaily.get(dailyKey) ?? 0) + thisSpan > Math.max(1, input.maxPeriodsPerDayPerFaculty)) continue
        // room: least-loaded room free for the whole span (P3: or seeded pick)
        let pick = ''
        if (roomStrategy === 'random') {
          const freeRooms = rooms.filter((room) => !keys.some((k) => roomBusy.has(`${k}|${room}`)))
          if (freeRooms.length > 0) pick = freeRooms[Math.floor(rng() * freeRooms.length)]
        } else {
          let pickLoad = Number.MAX_SAFE_INTEGER
          for (const room of rooms) {
            if (keys.some((k) => roomBusy.has(`${k}|${room}`))) continue
          const load = [...roomBusy.keys()].filter((bk) => bk.endsWith(`|${room}`)).length
          if (load < pickLoad) {
            pick = room
            pickLoad = load
          }
          }
        }
        if (!pick) continue // all rooms busy in this span
        chose = cand
        choseRoom = pick
        break
      }

      if (!chose) {
        // Could not place this span — the rest of the course counts as unplaced.
        unplaced.push({
          courseId: course.courseId,
          subject: course.courseName,
          periodsRequested: periods,
          periodsPlaced: placed,
          reason:
            'No free slot satisfies cohort + faculty availability, faculty daily cap and room availability',
        })
        break spanLoop
      }

      const day = chose[0].day
      const weeklyAfter = (facultyWeekly.get(course.facultyId) ?? 0) + thisSpan
      const flags: string[] = []
      if (weeklyAfter > DEFAULT_CAPACITY_WEEKLY_HOURS) flags.push('faculty-overloaded')
      if (isLab && thisSpan < span) flags.push('lab-span-clipped')
      if (input.rooms.length === 0) flags.push('room-auto')

      for (let i = 0; i < chose.length; i++) {
        const slot = chose[i]
        placements.push({
          mappingId: course.mappingId,
          courseId: course.courseId,
          subject: course.courseName,
          subjectCode: course.courseCode,
          facultyId: course.facultyId,
          facultyName: course.facultyName,
          branch: course.branch,
          batch: course.batch,
          semester: course.semester,
          division: course.division,
          section: course.section,
          room: choseRoom,
          dayOfWeek: day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          type: isLab ? 'lab' : 'lecture',
          periodIndex: slot.periodIndex,
          span: chose.length,
          flags,
        })
        const key = busyKey(day, slot.startTime)
        cohortBusy.add(key)
        facultyBusy.add(key)
        roomBusy.add(`${key}|${choseRoom}`)
      }
      facultyDaily.set(`${course.facultyId}|${day}`, (facultyDaily.get(`${course.facultyId}|${day}`) ?? 0) + chose.length)
      facultyWeekly.set(course.facultyId, (facultyWeekly.get(course.facultyId) ?? 0) + chose.length)
      courseDayCount.set(`${course.courseId}|${day}`, (courseDayCount.get(`${course.courseId}|${day}`) ?? 0) + chose.length)
      placed += chose.length
    }
  }

  // ── Trust surfaces ─────────────────────────────────────────────────────────
  const facultyLoad: ScheduleFacultyLoad[] = [...facultyWeekly.entries()]
    .map(([facultyId, total]) => {
      const courseSpots = input.courses.filter((c) => c.facultyId === facultyId)
      const placedByRun = courseSpots.reduce(
        (sum, c) => sum + placements.filter((p) => p.courseId === c.courseId && p.facultyId === facultyId).length,
        0,
      )
      const existing = Math.max(0, (input.occupancy.facultyWeekly.get(facultyId) ?? 0))
      return {
        facultyId,
        facultyName: courseSpots[0]?.facultyName || facultyId,
        existingWeekly: existing,
        placedWeekly: placedByRun,
        totalWeekly: total,
        capacity: DEFAULT_CAPACITY_WEEKLY_HOURS,
        overloaded: total > DEFAULT_CAPACITY_WEEKLY_HOURS,
      }
    })
    .sort((a, b) => b.totalWeekly - a.totalWeekly || a.facultyName.localeCompare(b.facultyName))

  const dailyCoverage: DailyCoverage[] = input.grid.days.map((day) => {
    const dayPlacements = placements.filter((p) => p.dayOfWeek === day)
    return {
      day,
      periods: dayPlacements.length,
      hours: Math.round(((dayPlacements.length * input.grid.periodMinutes) / 60) * 10) / 10,
      utilization: Math.round((dayPlacements.length / Math.max(1, input.grid.periodsPerDay)) * 100) / 100,
      subjects: dayPlacements.map((p) => p.subjectCode || p.subject),
    }
  })

  const periodsRequested = demand.reduce((s, d) => s + d.periods, 0)
  return {
    grid: input.grid,
    rooms,
    placements,
    unplaced,
    facultyLoad,
    dailyCoverage,
    demand: demandRows,
    summary: {
      courses: input.courses.length,
      placements: placements.length,
      periodsRequested,
      periodsPlaced: placements.length,
      unplacedCourses: unplaced.length,
      overloadedFaculty: facultyLoad.filter((f) => f.overloaded).length,
      coursesIncluded: placeable.length,
    },
    ...(usesRng ? { randomSeed: effectiveSeed } : {}),
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Payload validation (pure — throws HttpsError)
// ═════════════════════════════════════════════════════════════════════════════

export interface AutoSchedulePayload {
  curriculumId: string
  batch: string
  division: string
  section: string
  grid: ScheduleGrid
  rooms: string[]
  semesterWeeks: number
  maxPeriodsPerDayPerFaculty: number
  dryRun: boolean
  collegeId: string
  /** P1 — one applicability window per apply run, written through to docs. */
  dateRange?: { from: string; to?: string }
  /** P3 — default 'uniform' (pre-v2 behaviour). */
  strategy: PlacementStrategy
  /** P3 — deterministic seed for 'random' placement / random room pick. */
  randomSeed?: string
  /** P3 — default 'leastLoaded'. */
  roomStrategy: RoomStrategy
  /** P2 — per-course include / weekly-period steering. */
  courseOverrides: CourseOverride[]
  /** Non-fatal operator hints (e.g. a dateRange wider than one generate run). */
  warnings: string[]
}

function boundedInt(value: unknown, field: string, fallback: number, min: number, max: number): number {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new HttpsError('invalid-argument', `${field} must be between ${min} and ${max}`)
  }
  return Math.floor(n)
}

export const DEFAULT_GRID: ScheduleGrid = {
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  periodsPerDay: 5,
  startTime: '08:00',
  periodMinutes: 50,
  breakAfterPeriod: 3,
  breakMinutes: 15,
  labSpan: 2,
}

export function validateAutoSchedulePayload(
  data: unknown,
  role: string,
  claimCollegeId: string,
): AutoSchedulePayload {
  const raw = (data || {}) as Record<string, unknown>
  const curriculumId = String(raw.curriculumId ?? '').trim()
  if (!curriculumId || curriculumId.length > 100) {
    throw new HttpsError('invalid-argument', 'curriculumId is required')
  }
  const batch = String(raw.batch ?? '').trim()
  if (!batch || batch.length > 50) throw new HttpsError('invalid-argument', 'batch is required (e.g. 2026)')

  const gridRaw = (raw.grid || {}) as Record<string, unknown>
  const daysRaw = Array.isArray(gridRaw.days) ? gridRaw.days : DEFAULT_GRID.days
  const days = daysRaw
    .map((d) => normalizeDay(d))
    .filter((d): d is DayOfWeek => d !== null)
    .slice(0, 7)
  if (days.length === 0) throw new HttpsError('invalid-argument', 'grid.days must name at least one weekday')
  const startTime = String(gridRaw.startTime ?? DEFAULT_GRID.startTime).trim()
  if (!isValidTime(startTime)) throw new HttpsError('invalid-argument', 'grid.startTime must be HH:mm')

  const collegeId = role === 'superadmin' ? String(raw.collegeId ?? '').trim() : claimCollegeId
  if (!collegeId) throw new HttpsError('invalid-argument', 'No college is associated with this account')

  // P1 — applicability window (one per apply run). Dates must be real; the
  // range may exceed one generate run (whole semester is the usual intent) —
  // that is warned, not rejected, because the expansion callable chunks at 92.
  const warnings: string[] = []
  let dateRange: { from: string; to?: string } | undefined
  if (raw.dateRange !== undefined && raw.dateRange !== null) {
    const rangeRaw = (raw.dateRange || {}) as Record<string, unknown>
    const from = String(rangeRaw.from ?? '').trim()
    const to = String(rangeRaw.to ?? '').trim()
    if (!isValidDateKey(from)) {
      throw new HttpsError('invalid-argument', 'dateRange.from must be a yyyy-mm-dd date')
    }
    if (to && !isValidDateKey(to)) {
      throw new HttpsError('invalid-argument', 'dateRange.to must be a yyyy-mm-dd date')
    }
    if (to && daysBetween(from, to) < 0) {
      throw new HttpsError('invalid-argument', 'dateRange.from must be on or before dateRange.to')
    }
    if (to && daysBetween(from, to) + 1 > MAX_GENERATE_RANGE_DAYS) {
      warnings.push(
        `dateRange covers ${daysBetween(from, to) + 1} days — generateClassSessions expands at most ` +
          `${MAX_GENERATE_RANGE_DAYS} days per run; generate the term in chunks`,
      )
    }
    dateRange = to ? { from, to } : { from }
  }

  // P3 — placement strategy + seeded RNG + room pick.
  const strategyRaw = String(raw.strategy ?? 'uniform').trim() || 'uniform'
  if (!PLACEMENT_STRATEGIES.includes(strategyRaw as PlacementStrategy)) {
    throw new HttpsError('invalid-argument', `strategy must be one of: ${PLACEMENT_STRATEGIES.join(', ')}`)
  }
  const roomStrategyRaw = String(raw.roomStrategy ?? 'leastLoaded').trim() || 'leastLoaded'
  if (!ROOM_STRATEGIES.includes(roomStrategyRaw as RoomStrategy)) {
    throw new HttpsError('invalid-argument', `roomStrategy must be one of: ${ROOM_STRATEGIES.join(', ')}`)
  }
  const randomSeed = String(raw.randomSeed ?? '').trim().slice(0, 64)

  // P2 — per-course inclusion & weekly-load overrides.
  const courseOverrides: CourseOverride[] = []
  if (raw.courseOverrides !== undefined && raw.courseOverrides !== null) {
    if (!Array.isArray(raw.courseOverrides)) {
      throw new HttpsError('invalid-argument', 'courseOverrides must be an array')
    }
    if (raw.courseOverrides.length > 60) {
      throw new HttpsError('invalid-argument', 'courseOverrides allows at most 60 rows')
    }
    for (const [i, entry] of raw.courseOverrides.entries()) {
      const row = (entry || {}) as Record<string, unknown>
      const mappingId = String(row.mappingId ?? '').trim()
      if (!mappingId || mappingId.length > 120) {
        throw new HttpsError('invalid-argument', `courseOverrides[${i}].mappingId is required`)
      }
      const override: CourseOverride = { mappingId }
      if (row.weeklyPeriods !== undefined && row.weeklyPeriods !== null) {
        const periods = Number(row.weeklyPeriods)
        if (!Number.isFinite(periods) || periods < 0 || periods > 40) {
          throw new HttpsError(
            'invalid-argument',
            `courseOverrides[${i}].weeklyPeriods must be a number between 0 and 40 (or null)`,
          )
        }
        override.weeklyPeriods = Math.floor(periods)
      }
      if (row.include !== undefined && row.include !== null) {
        if (typeof row.include !== 'boolean') {
          throw new HttpsError('invalid-argument', `courseOverrides[${i}].include must be a boolean`)
        }
        override.include = row.include
      }
      courseOverrides.push(override)
    }
  }

  return {
    curriculumId,
    batch,
    division: String(raw.division ?? '').trim().slice(0, 50),
    section: String(raw.section ?? '').trim().slice(0, 50),
    grid: {
      days,
      periodsPerDay: boundedInt(gridRaw.periodsPerDay, 'grid.periodsPerDay', DEFAULT_GRID.periodsPerDay, 1, 10),
      startTime,
      periodMinutes: boundedInt(gridRaw.periodMinutes, 'grid.periodMinutes', DEFAULT_GRID.periodMinutes, 20, 120),
      breakAfterPeriod: boundedInt(gridRaw.breakAfterPeriod, 'grid.breakAfterPeriod', DEFAULT_GRID.breakAfterPeriod, 0, 10),
      breakMinutes: boundedInt(gridRaw.breakMinutes, 'grid.breakMinutes', DEFAULT_GRID.breakMinutes, 0, 60),
      labSpan: boundedInt(gridRaw.labSpan, 'grid.labSpan', DEFAULT_GRID.labSpan, 1, 4),
    },
    rooms: Array.isArray(raw.rooms)
      ? raw.rooms.map((r) => String(r ?? '').trim()).filter(Boolean).slice(0, 30)
      : [],
    semesterWeeks: boundedInt(raw.semesterWeeks, 'semesterWeeks', DEFAULT_SEMESTER_WEEKS, 4, 30),
    maxPeriodsPerDayPerFaculty: boundedInt(raw.maxPeriodsPerDayPerFaculty, 'maxPeriodsPerDayPerFaculty', 4, 1, 10),
    dryRun: raw.dryRun !== false, // default TRUE — nothing writes without intent
    collegeId,
    ...(dateRange ? { dateRange } : {}),
    strategy: strategyRaw as PlacementStrategy,
    ...(randomSeed ? { randomSeed } : {}),
    roomStrategy: roomStrategyRaw as RoomStrategy,
    courseOverrides,
    warnings,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Callable
// ═════════════════════════════════════════════════════════════════════════════

const MAX_COURSES = 60
const MAX_SCHEDULES_READ = 2000

export const autoGenerateWeeklySchedule = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 90 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveSchedulingStaff(uid, request.auth?.token || {})
    const payload = validateAutoSchedulePayload(request.data, staff.role, staff.collegeId)

    const db = admin.firestore()

    // 1. Curriculum (branch/semester authority + tenancy check)
    const curSnap = await db.collection('curriculum').doc(payload.curriculumId).get()
    if (!curSnap.exists) throw new HttpsError('not-found', 'Curriculum not found')
    const curriculum = curSnap.data() as Record<string, unknown>
    if (String(curriculum.collegeId ?? '') !== payload.collegeId) {
      throw new HttpsError('permission-denied', 'This curriculum belongs to another college')
    }
    const branch = String(curriculum.branch ?? '').trim()
    const semester = Number(curriculum.semester ?? 0) || 0

    // 2. Active course ↔ faculty mappings for this cohort = the demand
    const mappingsSnap = await db
      .collection('curriculumFacultyMappings')
      .where('collegeId', '==', payload.collegeId)
      .where('curriculumId', '==', payload.curriculumId)
      .limit(400)
      .get()
    const lower = (v: unknown) => String(v ?? '').trim().toLowerCase()
    type MappingRow = Record<string, unknown> & { id: string }
    const courses: AutoScheduleCourse[] = mappingsSnap.docs
      .map((d): MappingRow => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .filter((m) => {
        if (String(m.status ?? 'active') === 'removed' || String(m.status) === 'inactive') return false
        // Tokenised multi-batch matching: "2027,2028" matches "2027, 2028".
        if (!batchListMatches(payload.batch, m.batch)) return false
        if (lower(m.division ?? '') !== lower(payload.division)) return false
        if (lower(m.section ?? '') !== lower(payload.section)) return false
        if (!String(m.facultyId ?? '').trim()) return false
        return true
      })
      .slice(0, MAX_COURSES)
      .map((m) => ({
        mappingId: String(m.id),
        courseId: String(m.courseId ?? ''),
        courseCode: String(m.courseCode ?? ''),
        courseName: String(m.courseName ?? ''),
        facultyId: String(m.facultyId ?? ''),
        facultyName: String(m.facultyName ?? m.facultyId ?? ''),
        totalHours: Number(m.totalHours ?? 0) || 0,
        credits: Number(m.credits ?? 0) || 0,
        branch: String(m.branch ?? branch),
        semester: Number(m.semester ?? semester) || semester,
        batch: payload.batch,
        division: payload.division,
        section: payload.section,
      }))
    if (courses.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'No active faculty mappings for this curriculum/batch/division/section — run Auto Map first',
      )
    }

    // 3. Occupancy from the college's live timetable
    const schedulesSnap = await db
      .collection('weeklySchedules')
      .where('collegeId', '==', payload.collegeId)
      .limit(MAX_SCHEDULES_READ)
      .get()
    const occupancy: Occupancy = {
      facultyBusy: new Set(),
      cohortBusy: new Set(),
      roomBusy: new Set(),
      facultyWeekly: new Map(),
    }
    const cohortFacultyIds = new Set(courses.map((c) => c.facultyId.toLowerCase()))
    // Cohort identity is token-normalised on batch so "2027, 2028" and
    // "2027,2028" name the same cohort (same root cause as batchListMatches).
    const batchKey = (v: unknown) => batchTokens(v).sort().join('+')
    const cohortKey = (d: Record<string, unknown>) =>
      [lower(d.branch), batchKey(d.batch), lower(d.division ?? ''), lower(d.section ?? '')].join('|')
    const targetCohort = cohortKey({ branch, batch: payload.batch, division: payload.division, section: payload.section })

    for (const d of schedulesSnap.docs) {
      const s = d.data() as Record<string, unknown>
      if (s.isActive === false) continue
      const day = normalizeDay(s.dayOfWeek)
      const start = String(s.startTime ?? '').trim()
      if (!day || !isValidTime(start)) continue
      const key = busyKey(day, start)
      const fid = String(s.facultyId ?? '').trim()
      if (fid) {
        occupancy.facultyBusy.add(key)
        // Weekly counts matter only for the cohort's faculty (load display)
        if (cohortFacultyIds.has(fid.toLowerCase())) {
          occupancy.facultyWeekly.set(fid, (occupancy.facultyWeekly.get(fid) ?? 0) + 1)
        }
      }
      const room = String(s.room ?? '').trim()
      if (room) occupancy.roomBusy.add(`${key}|${room}`)
      // Cohort busy: match on the schedule's own cohort identity — a schedule
      // for B.Com 2026 A blocks this cohort even if it came from another curriculum.
      if (cohortKey({ branch: s.branch, batch: s.batch, division: s.division, section: s.section }) === targetCohort) {
        occupancy.cohortBusy.add(key)
      }
    }
    // faculty busy keys are uid-agnostic, but weekly per faculty was keyed by
    // whatever id the schedule carries — map uids so loads line up.
    // (schedules store the auth uid, same as the mapper's facultyId.)

    const plan = planAutoSchedule({
      courses,
      grid: payload.grid,
      rooms: payload.rooms,
      occupancy,
      semesterWeeks: payload.semesterWeeks,
      maxPeriodsPerDayPerFaculty: payload.maxPeriodsPerDayPerFaculty,
      strategy: payload.strategy,
      ...(payload.randomSeed ? { randomSeed: payload.randomSeed } : {}),
      roomStrategy: payload.roomStrategy,
      courseOverrides: payload.courseOverrides,
    })

    // P4 — the college's academic calendar (bounded read). Weekly patterns
    // aren't day-skippable (a Mon holiday only voids specific Mondays), so
    // placement is untouched; the preview marks blocked weekdays and — with a
    // dateRange — reports teachingDays vs blockedDays. Generated sessions get
    // suppressed on these dates by `generateClassSessions`.
    const calSnap = await db
      .collection('academicCalendar')
      .where('collegeId', '==', payload.collegeId)
      .limit(MAX_CALENDAR_READ)
      .get()
    const calendarEvents = calSnap.docs
      .map((d) => toCalendarEventLite(d.id, d.data() as Record<string, unknown>))
      .filter((e): e is CalendarEventLite => e !== null)
    const calendar = buildCalendarView(calendarEvents, payload.grid.days, payload.dateRange)
    plan.calendar = calendar
    plan.summary.teachingDays = calendar.teachingDays
    plan.summary.blockedDays = calendar.blockedDays
    plan.summary.blockedBreakdown = calendar.blockedBreakdown

    // P2 — topic seeding (v2 scope: ordered module ids on the created slot
    // docs, so the session-topics UI can auto-suggest "next module"; full
    // auto-advancing topic assignment is v3).
    const moduleQueueByCourse = new Map<string, string[]>()
    if (payload.dateRange) {
      const curriculumCourses = Array.isArray(curriculum.courses) ? (curriculum.courses as unknown[]) : []
      for (const c of courses) {
        const course = curriculumCourses.find((raw) => {
          const row = (raw || {}) as Record<string, unknown>
          return (
            String(row.id ?? '') === c.courseId ||
            (c.courseCode && String(row.code ?? '').toLowerCase() === c.courseCode.toLowerCase()) ||
            (c.courseName && String(row.name ?? '').toLowerCase() === c.courseName.toLowerCase())
          )
        })
        const modules = Array.isArray((course as Record<string, unknown> | undefined)?.modules)
          ? ((course as Record<string, unknown>).modules as unknown[])
          : []
        const queue = modules
          .map((m, i) => String(((m || {}) as Record<string, unknown>).id ?? ((m || {}) as Record<string, unknown>).moduleNo ?? i + 1))
          .filter(Boolean)
        if (queue.length > 0) moduleQueueByCourse.set(c.mappingId, queue)
      }
    }

    const responseWarnings = [...payload.warnings]
    // Truthful diagnostics (acceptance): a window the calendar has exhausted
    // must say so — not leave the operator hunting for a phantom free slot.
    if (payload.dateRange && calendar.teachingDays !== undefined && calendar.teachingDays === 0) {
      responseWarnings.push(
        'The selected date range has no teaching days — every working day in it is blocked by the academic calendar',
      )
    }
    if (payload.dryRun) {
      return { dryRun: true, plan, warnings: responseWarnings, ...(plan.randomSeed ? { randomSeed: plan.randomSeed } : {}) }
    }
    if (plan.placements.length === 0) {
      return { dryRun: false, plan, created: 0, warnings: responseWarnings }
    }

    const now = Timestamp.now()
    const writeBatch = db.batch()
    for (const p of plan.placements) {
      const initials = p.facultyName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
      writeBatch.set(db.collection('weeklySchedules').doc(), {
        collegeId: payload.collegeId,
        subject: p.subject,
        subjectCode: p.subjectCode,
        facultyId: p.facultyId,
        facultyName: p.facultyName,
        facultyInitials: initials,
        branch: p.branch,
        batch: p.batch,
        semester: p.semester,
        division: p.division,
        section: p.section,
        room: p.room,
        dayOfWeek: p.dayOfWeek,
        startTime: p.startTime,
        endTime: p.endTime,
        type: p.type,
        isActive: true,
        autoScheduled: true,
        mappingId: p.mappingId,
        // P1 — write-through applicability window (legacy docs keep no window
        // and stay perpetual; these slots die with their term).
        ...(payload.dateRange?.from ? { effectiveFrom: payload.dateRange.from } : {}),
        ...(payload.dateRange?.to ? { effectiveTo: payload.dateRange.to } : {}),
        // P2 — ordered module ids for the session-topics "next module" hint.
        ...(moduleQueueByCourse.get(p.mappingId) ? { moduleQueue: moduleQueueByCourse.get(p.mappingId) } : {}),
        importedAt: now,
        importedBy: `${staff.name || staff.uid} (auto-scheduler)`,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      })
    }
    await writeBatch.commit()
    return {
      dryRun: false,
      plan,
      created: plan.placements.length,
      warnings: responseWarnings,
      ...(plan.randomSeed ? { randomSeed: plan.randomSeed } : {}),
    }
  },
)
