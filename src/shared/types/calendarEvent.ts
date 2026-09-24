// src/shared/types/calendarEvent.ts
// ─── Academic calendar (Auto-Scheduler v2 — P4) ──────────────────────────────
// Mirrors `CalendarEventType` / `CalendarEventInput` in
// functions/src/calendar.ts (project convention: functions/ and src/ type
// copies stay in lockstep). The stored doc shape:
//
//   academicCalendar/{id} = {
//     collegeId, title,
//     type: CalendarEventType,
//     startDate, endDate,          // yyyy-mm-dd, inclusive
//     suspendsClasses: boolean,    // fests may NOT suspend teaching
//     notes?, createdBy, createdAt, updatedAt
//   }
//
// Writes are callable-only (saveCalendarEvent / deleteCalendarEvent); clients
// read for the timetable "⛔ Holiday — no classes" banners and the admin
// Academic Calendar page.

export const CALENDAR_EVENT_TYPES = [
  'public-holiday',
  'college-holiday',
  'study-holiday',
  'fest',
  'exam',
] as const

export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number]

/**
 * Per-type defaults for `suspendsClasses` (handoff §5 Q1 — spec defaults):
 * holidays/study holidays/exam windows displace teaching; fests do NOT.
 */
export const DEFAULT_SUSPENDS_CLASSES: Record<CalendarEventType, boolean> = {
  'public-holiday': true,
  'college-holiday': true,
  'study-holiday': true,
  fest: false,
  exam: true,
}

export interface CalendarEvent {
  id: string
  collegeId: string
  title: string
  type: CalendarEventType
  /** yyyy-mm-dd, inclusive. */
  startDate: string
  /** yyyy-mm-dd, inclusive. */
  endDate: string
  suspendsClasses: boolean
  notes?: string
  createdBy?: string
  createdAt?: unknown
  updatedAt?: unknown
}

export interface CalendarEventInput {
  id?: string
  title: string
  type: CalendarEventType
  startDate: string
  endDate: string
  suspendsClasses: boolean
  notes?: string
}

/** Inclusive [startDate, endDate] membership (keys are yyyy-mm-dd). */
export function eventCoversDate(
  event: Pick<CalendarEvent, 'startDate' | 'endDate'>,
  dateKey: string,
): boolean {
  return dateKey >= event.startDate && dateKey <= event.endDate
}

/** The first suspendsClasses event covering `dateKey`, or null (fest ≠ block). */
export function suspendingEventOn(
  events: Pick<CalendarEvent, 'title' | 'startDate' | 'endDate' | 'suspendsClasses'>[],
  dateKey: string,
): { title: string; startDate: string; endDate: string } | null {
  return (
    events.find((e) => e.suspendsClasses !== false && eventCoversDate(e, dateKey)) ?? null
  )
}

export const CALENDAR_TYPE_COLORS: Record<CalendarEventType, string> = {
  'public-holiday': '#ef4444',
  'college-holiday': '#f97316',
  'study-holiday': '#8b5cf6',
  fest: '#10b981',
  exam: '#3b82f6',
}

export const CALENDAR_TYPE_LABELS: Record<CalendarEventType, string> = {
  'public-holiday': 'Public holiday',
  'college-holiday': 'College holiday',
  'study-holiday': 'Study holiday',
  fest: 'Fest / event',
  exam: 'Exams',
}
