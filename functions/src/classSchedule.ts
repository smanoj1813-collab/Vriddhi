// functions/src/classSchedule.ts
// ─── Slice 2 "Delivery Spine" — S2.1: session materialisation ───────────────
//
// The audit (docs/curriculum-scheduling-audit.md, finding F1) found that the
// recurring timetable in `weeklySchedules` is decorative grid data: nothing
// ever expands it into the actual class instances that attendance, coverage
// and progress need. A `classSessions` document only ever came into existence
// when a human typed one in — and because two different client writers
// (scheduleApi.createSchedule and attendanceApi.createClassSession) each
// invented their own payload, the collection already has schema drift.
//
// This module is the single server-side writer that turns the plan
// (weeklySchedules) into the actual (classSessions):
//
//   generateClassSessions({ from, to })  — expand active slots into sessions
//   cancelWeeklySchedule({ ... })        — cancel a slot's future sessions
//
// Design rules that came out of the audit:
//  * Tenancy comes from the auth custom claim (`token.collegeId`), never from
//    the `vriddhi_college_id` localStorage value the legacy client code reads
//    at src/modules/admin/api/scheduleApi.ts:47. Rules still do the real
//    college-scoping, but a callable must not take the tenant from the caller.
//  * Materialisation is idempotent. The document id is deterministic —
//    `${weeklyScheduleId}_${yyyy-mm-dd}` — so re-running the same range adds
//    zero duplicates (audit DoD #1). Existing ids are probed with getAll and
//    skipped before the batch is built, so `set` is last-write-wins rather
//    than `create`-and-abort-the-whole-batch.
//  * Every session carries `weeklyScheduleId`, so the plan→actual link is a
//    real field and not a coincidence of matching free-text strings (F6).
//  * Writes are chunked under Firestore's 500-op batch ceiling.
//
// The pure helpers (date maths, expansion, id building) are exported so they
// can be unit-tested without a Firestore emulator — see functions/test/
// classSchedule.test.ts.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

// ─── Constants ─────────────────────────────────────────────────────────────

/** Longest span one generate call may cover. ~13 weeks — one teaching term. */
export const MAX_GENERATE_RANGE_DAYS = 92

/**
 * Firestore caps a WriteBatch at 500 operations. Each session is one `set`,
 * plus one `updatedAt`-style bookkeeping write per chunk, so we stay well
 * under the ceiling.
 */
export const MAX_BATCH_OPS = 400

/**
 * A transaction counts reads *and* writes against the same 500-op ceiling, so
 * a cancel chunk is one read + one write per session plus the slot itself.
 */
export const MAX_CANCEL_DOCS_PER_TXN = 180

/** Hard ceiling on weekly slots read for one college, to bound the callable. */
export const MAX_WEEKLY_SLOTS_READ = 2000

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Roles allowed to materialise / cancel sessions for their college. */
export const SCHEDULING_ROLES = ['superadmin', 'admin', 'principal', 'hod']

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

/** `Date.getUTCDay()` is 0=Sunday..6=Saturday. */
export const DAY_OF_WEEK_INDEX: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const DAY_NAMES: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]

export const SESSION_STATUSES = ['scheduled', 'ongoing', 'completed', 'cancelled'] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

// ─── Pure helpers ──────────────────────────────────────────────────────────

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const parsed = new Date(Date.UTC(year, month - 1, day))
  // Rejects overflow such as 2026-02-31, which Date silently rolls forward.
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function assertDateKey(value: unknown, field: string): string {
  if (!isValidDateKey(value)) {
    throw new Error(`${field} must be a yyyy-mm-dd date (received: ${String(value)})`)
  }
  return value
}

/** UTC midnight for a date key. All date maths here is UTC so the callable
 *  produces the same answer regardless of where the function instance runs. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = assertDateKey(key, 'date').split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toDateKey(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's date key. Exists as a helper so tests can pin "today". */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(now)
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function weekdayOf(key: string): DayOfWeek {
  return DAY_NAMES[parseDateKey(key).getUTCDay()]
}

/** Inclusive count of days between two date keys. */
export function daysBetween(from: string, to: string): number {
  const start = parseDateKey(from).getTime()
  const end = parseDateKey(to).getTime()
  return Math.round((end - start) / 86_400_000)
}

export function normalizeDayOfWeek(value: unknown): DayOfWeek | null {
  if (typeof value !== 'string') return null
  const key = value.trim().toLowerCase() as DayOfWeek
  return key in DAY_OF_WEEK_INDEX ? key : null
}

/** Free-text day strings also show up as "Mon", "MONDAY", 1..7 etc. */
export function coerceDayOfWeek(value: unknown): DayOfWeek | null {
  const direct = normalizeDayOfWeek(value)
  if (direct) return direct
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase()
    // Guard on length: every string startsWith(''), so an empty day would
    // otherwise match "sunday" first.
    const byPrefix = text.length > 0 ? DAY_NAMES.find((name) => name.startsWith(text.slice(0, 3))) : undefined
    if (byPrefix) return byPrefix
    // A single digit 0..6 is also accepted (0 = Sunday). Only an explicitly
    // numeric *string* takes this path: Number(null) is 0, and silently
    // reading a missing dayOfWeek as "every Sunday" would be a nasty surprise.
    if (/^[0-6]$/.test(text)) return DAY_NAMES[Number(text)]
    return null
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) {
    return DAY_NAMES[value]
  }
  return null
}

/**
 * Every `yyyy-mm-dd` date key in [from, to], inclusive and ascending.
 * Enforces the 92-day guard (one teaching term) so a typo cannot ask the
 * function to fan out across years.
 */
export function dateKeysInRange(from: string, to: string): string[] {
  const start = assertDateKey(from, 'from')
  const end = assertDateKey(to, 'to')
  const span = daysBetween(start, end)
  if (span < 0) throw new Error('from must be on or before to')
  if (span + 1 > MAX_GENERATE_RANGE_DAYS) {
    throw new Error(`Range spans ${span + 1} days; the maximum is ${MAX_GENERATE_RANGE_DAYS}`)
  }
  const keys: string[] = []
  for (let offset = 0; offset <= span; offset += 1) keys.push(addDays(start, offset))
  return keys
}

/**
 * The date keys in [from, to] that fall on `dayOfWeek`.
 *
 * Unknown / junk day values yield an empty list rather than throwing: the
 * `dayOfWeek` comes from a free-form Firestore field and one malformed slot
 * must not abort materialisation for the whole college.
 */
export function expandWeeklyRange(from: string, to: string, dayOfWeek: unknown): string[] {
  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    throw new Error('expandWeeklyRange requires yyyy-mm-dd from/to bounds')
  }
  const day = coerceDayOfWeek(dayOfWeek)
  if (!day) return []
  return dateKeysInRange(from, to).filter((key) => weekdayOf(key) === day)
}

/**
 * Deterministic document id for one occurrence of one recurring slot.
 * This is what makes materialisation idempotent: the same slot on the same
 * date always names the same document, so a second run is a no-op.
 */
export function slotDateKey(weeklyScheduleId: string, date: string): string {
  const slot = String(weeklyScheduleId || '').trim()
  if (!slot) throw new Error('weeklyScheduleId is required to build a session id')
  if (slot.includes('/')) throw new Error('weeklyScheduleId may not contain "/"')
  return `${slot}_${assertDateKey(date, 'date')}`
}

/** "09:00" → 540. Returns null for anything unparseable. */
export function minutesOfDay(text: unknown): number | null {
  if (typeof text !== 'string') return null
  const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/** Scheduled contact minutes for a slot, or null if the times are unusable. */
export function durationMinutes(startTime: unknown, endTime: unknown): number | null {
  const start = minutesOfDay(startTime)
  const end = minutesOfDay(endTime)
  if (start === null || end === null || end <= start) return null
  return end - start
}

// ─── Session document shape ─────────────────────────────────────────────────

export interface WeeklySlot {
  id: string
  collegeId?: unknown
  subject?: unknown
  subjectCode?: unknown
  facultyId?: unknown
  facultyName?: unknown
  facultyInitials?: unknown
  branch?: unknown
  batch?: unknown
  semester?: unknown
  division?: unknown
  section?: unknown
  room?: unknown
  dayOfWeek?: unknown
  startTime?: unknown
  endTime?: unknown
  type?: unknown
  isActive?: unknown
}

function text(value: unknown, fallback = ''): string {
  const trimmed = String(value ?? '').trim()
  return trimmed || fallback
}

function toSemester(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

/**
 * The canonical session document (audit S2.2). Every field the two legacy
 * client writers produced survives here, so existing readers keep working:
 *  * `date` is the normalised `yyyy-mm-dd` string (scheduleApi wrote ISO
 *    datetimes, attendanceApi wrote whatever the caller passed).
 *  * `topicsCovered` stays as the free-text display list the UI reads at
 *    scheduleApi.ts:84 (`d.topicsCovered || d.topicsPlanned`); S2.3 adds the
 *    real `topicIds` references alongside it.
 *  * `createdAt`/`updatedAt` are ISO strings, matching the shape the majority
 *    of client writers already use (attendanceApi's Timestamp is the outlier,
 *    and S2.2 folds that path into this one).
 */
export function buildSessionDoc(slot: WeeklySlot, date: string, now: Date = new Date()): admin.firestore.DocumentData {
  const day = coerceDayOfWeek(slot.dayOfWeek)
  const start = text(slot.startTime)
  const end = text(slot.endTime)
  const stamp = now.toISOString()
  return {
    collegeId: text(slot.collegeId),
    weeklyScheduleId: slot.id,
    date: assertDateKey(date, 'date'),
    dayOfWeek: day || weekdayOf(date),
    startTime: start,
    endTime: end,
    durationMinutes: durationMinutes(start, end) ?? 60,
    subject: text(slot.subject),
    subjectCode: text(slot.subjectCode),
    facultyId: text(slot.facultyId),
    facultyName: text(slot.facultyName),
    facultyInitials: text(slot.facultyInitials),
    branch: text(slot.branch),
    batch: text(slot.batch),
    semester: toSemester(slot.semester),
    division: text(slot.division),
    section: text(slot.section),
    room: text(slot.room),
    type: text(slot.type, 'lecture'),
    status: 'scheduled' as SessionStatus,
    // S2.3 fills these from the topic picker; the free-text list below stays
    // as the legacy display fallback.
    topicIds: [],
    topicsCovered: [],
    attendanceCount: 0,
    presentCount: 0,
    source: 'weekly-schedule',
    createdAt: stamp,
    updatedAt: stamp,
  }
}

// ─── Staff resolution ───────────────────────────────────────────────────────

interface SchedulingStaff {
  uid: string
  role: string
  collegeId: string
  name: string
}

/**
 * Same contract as resolvePaperStaff in paperWorkflow.ts: the role comes from
 * the auth token with the user doc as fallback, and the college is resolved
 * server-side. A superadmin may target a college explicitly; everybody else is
 * pinned to the college on their own claim.
 */
export async function resolveSchedulingStaff(
  uid: string,
  token: Record<string, unknown>
): Promise<SchedulingStaff> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !SCHEDULING_ROLES.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', 'Scheduling administration access is required')
  }
  return { uid, role, collegeId, name: String(user?.name || user?.displayName || '') }
}

/** Optional, length-bounded string filter supplied by the caller. */
function optionalFilter(value: unknown, field: string, maximum = 100): string {
  if (value === undefined || value === null || value === '') return ''
  const trimmed = String(value).trim()
  if (trimmed.length > maximum) throw new HttpsError('invalid-argument', `${field} is invalid`)
  return trimmed
}

export interface GeneratePayload {
  collegeId: string
  from: string
  to: string
  weeklyScheduleId: string
  facultyId: string
  branch: string
  batch: string
}

export function validateGeneratePayload(data: unknown, role: string, claimCollegeId: string): GeneratePayload {
  const raw = (data || {}) as Record<string, unknown>
  const from = String(raw.from ?? '').trim()
  const to = String(raw.to ?? '').trim()
  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    throw new HttpsError('invalid-argument', 'from and to are required as yyyy-mm-dd dates')
  }
  if (daysBetween(from, to) < 0) {
    throw new HttpsError('invalid-argument', 'from must be on or before to')
  }
  if (daysBetween(from, to) + 1 > MAX_GENERATE_RANGE_DAYS) {
    throw new HttpsError(
      'invalid-argument',
      `Date range is longer than ${MAX_GENERATE_RANGE_DAYS} days; generate one term at a time`
    )
  }
  // Superadmin targets a college explicitly; everyone else is pinned to the
  // claim. The client never gets to name its own tenant (audit finding F7).
  const requested = String(raw.collegeId ?? '').trim()
  const collegeId = role === 'superadmin' ? requested : claimCollegeId
  if (!collegeId) {
    throw new HttpsError('invalid-argument', 'No college is associated with this account')
  }
  return {
    collegeId,
    from,
    to,
    weeklyScheduleId: optionalFilter(raw.weeklyScheduleId, 'weeklyScheduleId', 200),
    facultyId: optionalFilter(raw.facultyId, 'facultyId', 200),
    branch: optionalFilter(raw.branch, 'branch', 100),
    batch: optionalFilter(raw.batch, 'batch', 100),
  }
}

/** True when a slot is live: legacy documents predate the `isActive` field. */
export function isSlotActive(slot: WeeklySlot): boolean {
  return slot.isActive !== false
}

export function matchesFilters(slot: WeeklySlot, filters: GeneratePayload): boolean {
  if (filters.weeklyScheduleId && slot.id !== filters.weeklyScheduleId) return false
  if (filters.facultyId && text(slot.facultyId) !== filters.facultyId) return false
  if (filters.branch && text(slot.branch).toLowerCase() !== filters.branch.toLowerCase()) return false
  if (filters.batch && text(slot.batch).toLowerCase() !== filters.batch.toLowerCase()) return false
  return true
}

/** Chunk an array so no Firestore batch/transaction blows the 500-op ceiling. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error('chunk size must be a positive integer')
  const out: T[][] = []
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size))
  return out
}

// ─── Callables ──────────────────────────────────────────────────────────────

/**
 * Expand the college's active weekly timetable into `classSessions` documents
 * for [from, to]. Re-running the same range creates nothing new.
 */
export const generateClassSessions = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 180, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveSchedulingStaff(uid, request.auth?.token || {})
    const payload = validateGeneratePayload(request.data, staff.role, staff.collegeId)

    const db = admin.firestore()
    // Single-field equality only — no composite index required, so this works
    // on an existing project without an index deploy.
    const slotsSnap = await db
      .collection('weeklySchedules')
      .where('collegeId', '==', payload.collegeId)
      .limit(MAX_WEEKLY_SLOTS_READ)
      .get()

    const slots: WeeklySlot[] = slotsSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .filter((slot) => isSlotActive(slot) && matchesFilters(slot, payload))

    // (slotId, date) pairs this run should cover.
    const planned: Array<{ slot: WeeklySlot; date: string }> = []
    for (const slot of slots) {
      for (const date of expandWeeklyRange(payload.from, payload.to, slot.dayOfWeek)) {
        planned.push({ slot, date })
      }
    }

    let created = 0
    let skippedExisting = 0
    let batches = 0

    for (const group of chunk(planned, MAX_BATCH_OPS)) {
      const refs = group.map(({ slot, date }) =>
        db.collection('classSessions').doc(slotDateKey(slot.id, date))
      )
      // getId-only probe: `getAll` returns lightweight document snapshots, and
      // skipping what already exists is what makes a re-run a no-op.
      const existing = new Set<string>()
      for (const probe of chunk(refs, 100)) {
        const snaps = await db.getAll(...probe)
        snaps.forEach((snap) => {
          if (snap.exists) existing.add(snap.id)
        })
      }

      const pending = group.filter(({ slot, date }) => !existing.has(slotDateKey(slot.id, date)))
      skippedExisting += group.length - pending.length
      if (pending.length === 0) continue

      const batch = db.batch()
      const now = new Date()
      for (const { slot, date } of pending) {
        batch.set(
          db.collection('classSessions').doc(slotDateKey(slot.id, date)),
          buildSessionDoc(slot, date, now)
        )
      }
      await batch.commit()
      created += pending.length
      batches += 1
    }

    logger.info('[classSchedule] generateClassSessions', {
      collegeId: payload.collegeId,
      from: payload.from,
      to: payload.to,
      slotsScanned: slots.length,
      planned: planned.length,
      created,
      skippedExisting,
      batches,
      actorUid: uid,
    })

    return {
      collegeId: payload.collegeId,
      from: payload.from,
      to: payload.to,
      slotsScanned: slots.length,
      scheduledOccurrences: planned.length,
      created,
      skippedExisting,
      batches,
    }
  }
)

/**
 * Cancel a recurring slot: every future session it generated that has not yet
 * been marked moves to `cancelled`, and the slot is deactivated so the next
 * materialisation run does not resurrect them.
 */
export const cancelWeeklySchedule = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 180, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveSchedulingStaff(uid, request.auth?.token || {})

    const raw = (request.data || {}) as Record<string, unknown>
    const weeklyScheduleId = String(raw.weeklyScheduleId ?? '').trim()
    if (!weeklyScheduleId || weeklyScheduleId.includes('/') || weeklyScheduleId.length > 200) {
      throw new HttpsError('invalid-argument', 'weeklyScheduleId is required')
    }
    // Default to today so "cancel this slot" never rewinds into sessions that
    // have already been delivered and marked.
    const from = String(raw.from ?? '').trim() || todayKey()
    if (!isValidDateKey(from)) {
      throw new HttpsError('invalid-argument', 'from must be a yyyy-mm-dd date')
    }
    const reason = optionalFilter(raw.reason, 'reason', 300)
    const collegeId = staff.role === 'superadmin' ? String(raw.collegeId ?? '').trim() : staff.collegeId
    if (!collegeId) {
      throw new HttpsError('invalid-argument', 'No college is associated with this account')
    }

    const db = admin.firestore()
    const slotRef = db.collection('weeklySchedules').doc(weeklyScheduleId)
    const slotSnap = await slotRef.get()
    if (!slotSnap.exists) throw new HttpsError('not-found', 'Weekly schedule not found')
    if (String(slotSnap.data()?.collegeId || '') !== collegeId) {
      throw new HttpsError('permission-denied', 'Weekly schedule belongs to another college')
    }

    // Equality on weeklyScheduleId alone — again, no composite index needed.
    // Status/date are filtered in code because a transaction cannot run a
    // fresh query, and the candidate set for one slot is one document a week.
    const sessionsSnap = await db
      .collection('classSessions')
      .where('weeklyScheduleId', '==', weeklyScheduleId)
      .get()

    const now = new Date().toISOString()
    const candidates = sessionsSnap.docs.filter((snap) => {
      const data = snap.data()
      return String(data.status || 'scheduled') === 'scheduled' && String(data.date || '') >= from
    })

    let cancelled = 0
    let skipped = sessionsSnap.docs.length - candidates.length

    // One transaction per chunk: reads + writes must stay under 500 ops, and a
    // partial failure must not leave half a slot cancelled.
    for (const group of chunk(candidates, MAX_CANCEL_DOCS_PER_TXN)) {
      const applied = await db.runTransaction(async (txn) => {
        let count = 0
        for (const snap of group) {
          const fresh = await txn.get(snap.ref)
          const data = fresh.data()
          // Re-check inside the transaction: anything can change between the
          // query and the write, and a session that was already marked must
          // never be cancelled out from under its attendance.
          if (
            !fresh.exists ||
            String(data?.status || 'scheduled') !== 'scheduled' ||
            String(data?.date || '') < from
          ) {
            continue
          }
          txn.update(snap.ref, {
            status: 'cancelled',
            cancelledAt: now,
            cancelledBy: uid,
            cancelReason: reason,
            updatedAt: now,
          })
          count += 1
        }
        txn.set(
          slotRef,
          { isActive: false, updatedAt: now, cancelledAt: now, cancelledBy: uid },
          { merge: true }
        )
        return count
      })
      // Report what was actually cancelled, not the size of the candidate
      // group — the two diverge whenever a session was marked in flight.
      cancelled += applied
      skipped += group.length - applied
    }

    logger.info('[classSchedule] cancelWeeklySchedule', {
      collegeId,
      weeklyScheduleId,
      from,
      cancelled,
      skipped,
      actorUid: uid,
    })

    return {
      collegeId,
      weeklyScheduleId,
      from,
      scanned: sessionsSnap.docs.length,
      cancelled,
      skipped,
      slotDeactivated: true,
    }
  }
)
