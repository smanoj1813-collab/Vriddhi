// src/modules/admin/api/classSessionApi.ts
// ─── Slice 2 S2.1 — client wrappers for the session materialisation callables ──
//
// Before Slice 2 the timetable (`weeklySchedules`) and the delivered classes
// (`classSessions`) were two unrelated piles of documents: a slot on the grid
// never became a class, and cancelling a slot left every future session
// sitting at "scheduled" (audit finding F1).
//
// These two callables are the bridge. Both run server-side, so the college is
// resolved from the caller's auth claim inside the function — the legacy
// `localStorage.getItem('vriddhi_college_id')` scoping used elsewhere in
// scheduleApi.ts is deliberately NOT used on these write paths (finding F7).

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

// ─── Types ────────────────────────────────────────────

export interface GenerateSessionsInput {
  from: string // yyyy-mm-dd
  to: string // yyyy-mm-dd
  weeklyScheduleId?: string
  facultyId?: string
  branch?: string
  batch?: string
}

export interface GenerateSessionsResult {
  collegeId: string
  from: string
  to: string
  slotsScanned: number
  scheduledOccurrences: number
  created: number
  skippedExisting: number
  batches: number
}

export interface CancelWeeklyScheduleInput {
  weeklyScheduleId: string
  from?: string // yyyy-mm-dd, defaults to today inside the callable
  reason?: string
}

export interface CancelWeeklyScheduleResult {
  collegeId: string
  weeklyScheduleId: string
  from: string
  scanned: number
  cancelled: number
  skipped: number
  slotDeactivated: boolean
}

// ─── Error surface ────────────────────────────────────

/**
 * Callable failures arrive as `functions/xxx` codes. Admin-facing copy here so
 * the page can show something actionable instead of a raw error string.
 */
const MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Your session has expired. Sign out and back in, then try again.',
  'functions/permission-denied':
    'Only college administrators (admin, principal, HOD) can generate or cancel class sessions.',
  'functions/invalid-argument': 'The date range is not valid. Use a start and end date within one term (92 days).',
  'functions/not-found': 'That weekly schedule no longer exists. Refresh the page and try again.',
  'functions/failed-precondition': 'This schedule cannot be materialised in its current state.',
}

function toMessage(error: unknown, fallback: string): string {
  const code = String((error as { code?: string } | null)?.code || '')
  return MESSAGES[code] || (error instanceof Error ? error.message : fallback)
}

// ─── Callables ────────────────────────────────────────

/**
 * Expand the college's active weekly timetable into `classSessions` across a
 * date range. Idempotent: each occurrence is stored under
 * `${weeklyScheduleId}_${yyyy-mm-dd}`, so re-running the same range reports
 * `created: 0` and adds no duplicates.
 */
export async function generateClassSessions(
  input: GenerateSessionsInput
): Promise<GenerateSessionsResult> {
  const call = httpsCallable<Record<string, unknown>, GenerateSessionsResult>(
    functions,
    'generateClassSessions'
  )
  try {
    const response = await call({
      from: input.from,
      to: input.to,
      ...(input.weeklyScheduleId ? { weeklyScheduleId: input.weeklyScheduleId } : {}),
      ...(input.facultyId ? { facultyId: input.facultyId } : {}),
      ...(input.branch ? { branch: input.branch } : {}),
      ...(input.batch ? { batch: input.batch } : {}),
    })
    return response.data
  } catch (error) {
    throw new Error(toMessage(error, 'Class sessions could not be generated.'))
  }
}

/**
 * Cancel a recurring slot: every unmarked session it produced on or after
 * `from` moves to `cancelled`, and the slot is deactivated so the next
 * materialisation run does not resurrect them.
 */
export async function cancelWeeklySchedule(
  input: CancelWeeklyScheduleInput
): Promise<CancelWeeklyScheduleResult> {
  const call = httpsCallable<Record<string, unknown>, CancelWeeklyScheduleResult>(
    functions,
    'cancelWeeklySchedule'
  )
  try {
    const response = await call({
      weeklyScheduleId: input.weeklyScheduleId,
      ...(input.from ? { from: input.from } : {}),
      ...(input.reason ? { reason: input.reason } : {}),
    })
    return response.data
  } catch (error) {
    throw new Error(toMessage(error, 'The weekly schedule could not be cancelled.'))
  }
}

// ─── S2.2: the one writer for a class session ─────────

export interface EnsureSessionInput {
  date: string // yyyy-mm-dd
  weeklyScheduleId?: string
  facultyId?: string
  facultyName?: string
  subject?: string
  subjectCode?: string
  branch?: string
  batch?: string
  semester?: number | string
  division?: string
  section?: string
  room?: string
  startTime?: string
  endTime?: string
  type?: string
  topic?: string
}

export interface EnsureSessionResult {
  id: string
  created: boolean
  date: string
  weeklyScheduleId: string
  status: string
  attendanceMarked: boolean
}

/**
 * Get-or-create the `classSessions` document for one day+slot.
 *
 * This is the single writer shared by the admin schedule form and the faculty
 * attendance flow, which is what stops a day+slot from ending up with two
 * documents in different shapes (audit DoD #3). The id is deterministic —
 * `${weeklyScheduleId}_${date}` for a recurring slot, otherwise a hash of
 * faculty + date + start time + subject + cohort — so calling it twice never
 * creates a second session, and an existing session is never overwritten.
 */
export async function ensureClassSession(
  input: EnsureSessionInput
): Promise<EnsureSessionResult> {
  const call = httpsCallable<Record<string, unknown>, EnsureSessionResult>(
    functions,
    'ensureClassSession'
  )
  try {
    const response = await call({
      date: input.date,
      ...(input.weeklyScheduleId ? { weeklyScheduleId: input.weeklyScheduleId } : {}),
      ...(input.facultyId ? { facultyId: input.facultyId } : {}),
      ...(input.facultyName ? { facultyName: input.facultyName } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
      ...(input.subjectCode ? { subjectCode: input.subjectCode } : {}),
      ...(input.branch ? { branch: input.branch } : {}),
      ...(input.batch ? { batch: input.batch } : {}),
      ...(input.semester !== undefined ? { semester: input.semester } : {}),
      ...(input.division ? { division: input.division } : {}),
      ...(input.section ? { section: input.section } : {}),
      ...(input.room ? { room: input.room } : {}),
      ...(input.startTime ? { startTime: input.startTime } : {}),
      ...(input.endTime ? { endTime: input.endTime } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.topic ? { topic: input.topic } : {}),
    })
    return response.data
  } catch (error) {
    throw new Error(toMessage(error, 'The class session could not be created.'))
  }
}

// ─── S2.3: mark a session complete and flip the topic ledger ─

export interface CompleteSessionInput {
  sessionId: string
  topicIds?: string[]
  topicTitles?: string[]
  notes?: string
}

export interface CompleteSessionResult {
  id: string
  status: string
  topicIds: string[]
  topicsCovered: string[]
  topicsAttached: number
  ledgerRowsCreated: number
  ledgerRowsUpdated: number
  alreadyCovered: number
}

/**
 * Mark a delivered class complete and flip the faculty's topic ledger for the
 * topics it covered — one server-side transaction, so the session and the
 * ledger cannot disagree.
 *
 * `topicIds` are `topics/*` ids from the curriculum bank. `topicTitles` is the
 * free-text fallback: a faculty member can always type a topic that has no
 * curriculum row, and it still lands in the ledger (and in `topicsCovered`,
 * which is what the UI displays).
 */
export async function completeClassSession(
  input: CompleteSessionInput
): Promise<CompleteSessionResult> {
  const call = httpsCallable<Record<string, unknown>, CompleteSessionResult>(
    functions,
    'completeClassSession'
  )
  try {
    const response = await call({
      sessionId: input.sessionId,
      ...(input.topicIds ? { topicIds: input.topicIds } : {}),
      ...(input.topicTitles ? { topicTitles: input.topicTitles } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    })
    return response.data
  } catch (error) {
    throw new Error(toMessage(error, 'The class session could not be completed.'))
  }
}

// ─── Small date helpers (shared by the admin UI) ──────

export function toDateKey(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** A sensible default window: this Monday through ~12 weeks out. */
export function defaultTermWindow(today = new Date()): { from: string; to: string } {
  const start = new Date(today)
  // Monday-based start keeps the first generated week whole.
  const weekday = start.getDay() // 0=Sunday
  const backtrack = weekday === 0 ? 6 : weekday - 1
  start.setDate(start.getDate() - backtrack)
  return { from: toDateKey(start), to: toDateKey(addDays(start, 83)) }
}

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}
