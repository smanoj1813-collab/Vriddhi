// functions/src/utils/timetableConflicts.ts
// ─── Slice 2 S2.5 — server-side clash detection ────────────────────────────
//
// Ported from src/shared/utils/timetableConflicts.ts, which is used client-side
// at scheduleApi.ts:790. A client-side check is advisory: it can be bypassed by
// any other writer, and before Slice 2 nothing enforced it at all — a teacher
// could create a class that double-books a room or a colleague (audit finding
// F5).
//
// Scope of the port: the pure clash maths only. The client keeps the full
// module for its advisory warnings and its React-facing formatting helpers;
// this file is what the callables use to *reject* a hard clash.

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ClashKind = 'faculty' | 'cohort' | 'room'

/**
 * The two clash kinds that are physically impossible to honour: one person, or
 * one room, in two places at once. A cohort clash is reported as a warning —
 * two classes scheduled for the same batch is usually a data-entry mistake
 * rather than something Firestore should refuse to store.
 */
export const HARD_CLASH_KINDS: ClashKind[] = ['faculty', 'room']

export interface ScheduleEntry {
  id: string
  collegeId: string
  facultyId: string
  branch: string
  batch: string
  division?: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive?: boolean
}

// ─── Time maths ────────────────────────────────────────────────────────────

/** "HH:mm" → minutes since midnight. */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = String(time ?? '').split(':').map(Number)
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * True when two ranges overlap. Adjacent slots (one ends exactly when the other
 * begins) are not a clash.
 */
export function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return parseTimeToMinutes(start1) < parseTimeToMinutes(end2) &&
    parseTimeToMinutes(start2) < parseTimeToMinutes(end1)
}

export function formatTimeRange(start: string, end: string): string {
  return `${start}–${end}`
}

/** Cohort identity: branch + batch + division, compared case-insensitively. */
export function cohortKey(entry: {
  branch?: unknown
  batch?: unknown
  division?: unknown
}): string {
  return `${entry.branch ?? ''}|${entry.batch ?? ''}|${entry.division ?? ''}`.toLowerCase()
}

// ─── Weekly timetable clashes (day-of-week based) ──────────────────────────

/**
 * Which clash kinds a weekly slot would create against the existing timetable.
 * Ported verbatim in behaviour from the client module so the advisory warnings
 * the UI already shows and the server's rejection agree.
 */
export function findClashes(
  candidate: ScheduleEntry,
  existingEntries: ScheduleEntry[],
  ignoreEntryId?: string
): ClashKind[] {
  const clashes: ClashKind[] = []

  for (const existing of existingEntries) {
    if (existing.collegeId !== candidate.collegeId) continue
    if (existing.isActive === false || existing.id === ignoreEntryId) continue
    if (existing.dayOfWeek !== candidate.dayOfWeek) continue
    if (!timesOverlap(candidate.startTime, candidate.endTime, existing.startTime, existing.endTime)) {
      continue
    }
    if (existing.facultyId === candidate.facultyId) clashes.push('faculty')
    if (cohortKey(existing) === cohortKey(candidate) && cohortKey(candidate) !== '||') {
      clashes.push('cohort')
    }
    if (candidate.room && existing.room === candidate.room) clashes.push('room')
  }

  return clashes
}

// ─── Dated session clashes (used by the callables) ─────────────────────────

export interface SessionCandidate {
  id: string
  collegeId: string
  date: string
  facultyId: string
  room: string
  startTime: string
  endTime: string
  /** Sessions that are cancelled or completed do not occupy the slot. */
  status?: string
  branch?: string
  batch?: string
  division?: string
  subject?: string
}

export interface SessionConflict {
  kind: ClashKind
  date: string
  startTime: string
  endTime: string
  sessionId: string
  otherSessionId: string
  message: string
}

export function occupiesSlot(status: unknown): boolean {
  const value = String(status ?? '').trim().toLowerCase()
  // An unknown status is treated as occupying, so a new spelling cannot let a
  // double-booking through until it is deliberately added to the exclude list.
  if (!value) return true
  return !['cancelled', 'canceled'].includes(value)
}

const KIND_MESSAGE: Record<ClashKind, string> = {
  faculty: 'faculty is already teaching another class',
  room: 'room is already occupied',
  cohort: 'this batch already has another class',
}

export function isHardClash(kind: ClashKind): boolean {
  return HARD_CLASH_KINDS.includes(kind)
}

/** Just the faculty/room clashes — the ones the server refuses to store. */
export function hardClashes(conflicts: SessionConflict[]): SessionConflict[] {
  return conflicts.filter((conflict) => isHardClash(conflict.kind))
}

/**
 * All clashes one dated session would have against a set of others.
 *
 * Cancelled sessions are ignored — a cancelled class frees both the teacher and
 * the room, which is exactly why `cancelWeeklySchedule` exists.
 */
export function findSessionClashes(
  candidate: SessionCandidate,
  existing: SessionCandidate[]
): SessionConflict[] {
  const conflicts: SessionConflict[] = []

  for (const other of existing) {
    if (other.id === candidate.id) continue
    if (other.date !== candidate.date) continue
    if (other.collegeId !== candidate.collegeId) continue
    if (!occupiesSlot(other.status)) continue
    if (!timesOverlap(candidate.startTime, candidate.endTime, other.startTime, other.endTime)) {
      continue
    }

    const kinds: ClashKind[] = []
    if (other.facultyId && other.facultyId === candidate.facultyId) kinds.push('faculty')
    if (candidate.room && other.room === candidate.room) kinds.push('room')
    if (
      cohortKey(other) === cohortKey(candidate) &&
      cohortKey(candidate) !== '||' &&
      cohortKey(candidate) !== '|'
    ) {
      kinds.push('cohort')
    }

    kinds.forEach((kind) => {
      conflicts.push({
        kind,
        date: candidate.date,
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        sessionId: candidate.id,
        otherSessionId: other.id,
        message:
          `${candidate.id} on ${candidate.date} ${formatTimeRange(candidate.startTime, candidate.endTime)}: ` +
          `${KIND_MESSAGE[kind]} (${other.subject || other.id} ` +
          `${formatTimeRange(other.startTime, other.endTime)})`,
      })
    })
  }

  return conflicts
}

/** Short, admin-facing one-liner for a conflict. */
export function describeConflict(conflict: SessionConflict): string {
  const what =
    conflict.kind === 'faculty'
      ? 'Faculty double-booked'
      : conflict.kind === 'room'
        ? 'Room double-booked'
        : 'Batch double-booked'
  return `${what} on ${conflict.date} at ${formatTimeRange(conflict.startTime, conflict.endTime)} — conflicts with ${conflict.otherSessionId}`
}

/**
 * Error code surfaced to the client. Kept stable and machine-readable so the UI
 * can distinguish "you cannot do this" from "something went wrong".
 */
export function conflictErrorCode(conflict: SessionConflict): string {
  return conflict.kind === 'faculty'
    ? 'class-schedule/faculty-conflict'
    : conflict.kind === 'room'
      ? 'class-schedule/room-conflict'
      : 'class-schedule/cohort-conflict'
}
