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
import { resolveSchedulingStaff } from './classSchedule'
import { hoursPerWeek, DEFAULT_SEMESTER_WEEKS, DEFAULT_CAPACITY_WEEKLY_HOURS } from './autoCurriculumMapping'
import { normalizeDay, isValidTime } from './scheduleImport'
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
  summary: {
    courses: number
    placements: number
    periodsRequested: number
    periodsPlaced: number
    unplacedCourses: number
    overloadedFaculty: number
  }
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

  const placements: SchedulePlacement[] = []
  const unplaced: UnplacedCourse[] = []

  // Per-course spread bookkeeping: how many periods each course already has per day.
  const courseDayCount = new Map<string, number>()

  const demand = [...input.courses]
    .map((c) => ({ course: c, periods: hoursPerWeek({ totalHours: c.totalHours, credits: c.credits }, input.semesterWeeks) }))
    .sort((a, b) => b.periods - a.periods || a.course.courseCode.localeCompare(b.course.courseCode))

  for (const { course, periods } of demand) {
    const isLab = LAB_NAME_RE.test(course.courseName)
    const span = isLab ? Math.max(1, Math.min(input.grid.labSpan, periods)) : 1
    const spansNeeded = isLab ? Math.ceil(periods / span) : periods
    let placed = 0

    spanLoop: for (let s = 0; s < spansNeeded; s++) {
      const thisSpan = isLab && periods - placed < span ? Math.max(1, periods - placed) : span
      const dayKey = `${course.courseId}`

      // Candidate (day, period) pairs: this course's least-used days first
      // (spread the week), then earliest period. Labs must fit a full span.
      const candidates: PlannedSlot[][] = []
      const byDay = new Map<DayOfWeek, PlannedSlot[]>()
      for (const slot of slots) {
        const arr = byDay.get(slot.day) ?? []
        arr.push(slot)
        byDay.set(slot.day, arr)
      }
      const daysOrdered = [...byDay.keys()].sort(
        (a, b) =>
          (courseDayCount.get(`${dayKey}|${a}`) ?? 0) - (courseDayCount.get(`${dayKey}|${b}`) ?? 0) ||
          input.grid.days.indexOf(a) - input.grid.days.indexOf(b),
      )
      for (const day of daysOrdered) {
        const daySlots = (byDay.get(day) ?? []).sort((x, y) => x.periodIndex - y.periodIndex)
        for (let i = 0; i + thisSpan <= daySlots.length; i++) {
          candidates.push(daySlots.slice(i, i + thisSpan))
        }
      }

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
        // room: least-loaded room free for the whole span
        let pick = ''
        let pickLoad = Number.MAX_SAFE_INTEGER
        for (const room of rooms) {
          if (keys.some((k) => roomBusy.has(`${k}|${room}`))) continue
          const load = [...roomBusy.keys()].filter((bk) => bk.endsWith(`|${room}`)).length
          if (load < pickLoad) {
            pick = room
            pickLoad = load
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
    summary: {
      courses: input.courses.length,
      placements: placements.length,
      periodsRequested,
      periodsPlaced: placements.length,
      unplacedCourses: unplaced.length,
      overloadedFaculty: facultyLoad.filter((f) => f.overloaded).length,
    },
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
        if (lower(m.batch) !== lower(payload.batch)) return false
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
    const cohortKey = (d: Record<string, unknown>) =>
      [lower(d.branch), lower(d.batch), lower(d.division ?? ''), lower(d.section ?? '')].join('|')
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
    })

    if (payload.dryRun) {
      return { dryRun: true, plan }
    }
    if (plan.placements.length === 0) {
      return { dryRun: false, plan, created: 0 }
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
        importedAt: now,
        importedBy: `${staff.name || staff.uid} (auto-scheduler)`,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      })
    }
    await writeBatch.commit()
    return { dryRun: false, plan, created: plan.placements.length }
  },
)
