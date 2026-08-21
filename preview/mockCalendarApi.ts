// ═══════════════════════════════════════════════════════════════════════
// preview/mockCalendarApi.ts — In-memory stand-in for academicCalendarApi
// Used ONLY by the local UI preview (vite.preview.config.ts alias).
// Never imported by the app build.
// ═══════════════════════════════════════════════════════════════════════

import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarFilterOptions,
  CalendarStats,
  CalendarEventType,
} from '@/shared/types/academicCalendar';

export const CALENDAR_COLLECTION = 'academicCalendarEvents';

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  class: '#14b8a6',
  exam: '#ef4444',
  holiday: '#8b5cf6',
  event: '#0ea5e9',
  deadline: '#f59e0b',
  meeting: '#64748b',
};

export function eventColor(event: CalendarEvent): string {
  return event.color || EVENT_TYPE_COLORS[event.eventType] || '#14b8a6';
}

export function computeCalendarStats(events: CalendarEvent[], reference = new Date()): CalendarStats {
  const today = toISODate(reference);
  const weekStart = new Date(reference);
  weekStart.setDate(reference.getDate() - reference.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(weekEnd);
  const monthPrefix = today.slice(0, 7);

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let upcomingEvents = 0, classesToday = 0, examsThisWeek = 0, holidaysThisMonth = 0;

  for (const e of events) {
    byType[e.eventType] = (byType[e.eventType] || 0) + 1;
    byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    const spansToday = e.startDate <= today && e.endDate >= today;
    const overlapsWeek = e.startDate <= weekEndISO && e.endDate >= weekStartISO;
    if (e.startDate > today && e.status !== 'cancelled') upcomingEvents++;
    if (e.eventType === 'class' && spansToday && e.status !== 'cancelled') classesToday++;
    if (e.eventType === 'exam' && overlapsWeek && e.status !== 'cancelled') examsThisWeek++;
    if (e.eventType === 'holiday' && e.startDate.startsWith(monthPrefix)) holidaysThisMonth++;
  }

  return { totalEvents: events.length, upcomingEvents, classesToday, examsThisWeek, holidaysThisMonth, byType, byStatus };
}

// ─── Seed data (relative to today) ─────────────────────────────────────

const today = new Date();
const shift = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

let seq = 0;
function make(partial: Partial<CalendarEvent> & Pick<CalendarEvent, 'title' | 'eventType' | 'startDate'>): CalendarEvent {
  seq += 1;
  return {
    id: `mock-${seq}`,
    description: null,
    status: 'scheduled',
    priority: 'medium',
    endDate: partial.startDate,
    allDay: true,
    startTime: null,
    endTime: null,
    collegeId: 'demo-college',
    curriculumId: null, courseId: null, courseName: null, courseCode: null,
    moduleId: null, moduleName: null, facultyId: null, facultyName: null,
    branch: null, semester: null, batch: null, division: null, section: null,
    room: null, building: null,
    createdBy: 'demo-user', createdByName: 'Dr. Principal',
    createdAt: new Date().toISOString(), updatedAt: null,
    attendees: null, color: null, isRecurring: false, recurringRule: null, parentEventId: null,
    ...partial,
  } as CalendarEvent;
}

let store: CalendarEvent[] = [
  make({ title: 'Data Structures — Lecture', eventType: 'class', startDate: shift(0), allDay: false, startTime: '09:00', endTime: '10:00', courseCode: '21CS32', courseName: 'Data Structures', facultyId: 'f1', facultyName: 'Prof. Anitha R', room: 'LH-201', building: 'Block B', branch: 'CSE', semester: 3, batch: '2023-27', division: 'A' }),
  make({ title: 'DBMS Lab', eventType: 'class', startDate: shift(0), allDay: false, startTime: '11:00', endTime: '13:00', courseCode: '21CS45', courseName: 'DBMS', facultyId: 'f2', facultyName: 'Dr. Kiran Kumar', room: 'Lab-3', branch: 'CSE', semester: 4, batch: '2022-26' }),
  make({ title: 'Department Faculty Meeting', eventType: 'meeting', startDate: shift(0), allDay: false, startTime: '16:00', endTime: '17:00', room: 'Conference Room', priority: 'high' }),
  make({ title: 'Mid-Semester Exam — Operating Systems', eventType: 'exam', startDate: shift(2), endDate: shift(2), allDay: false, startTime: '10:00', endTime: '13:00', courseCode: '21CS43', courseName: 'Operating Systems', room: 'Exam Hall 1', priority: 'urgent', branch: 'CSE', semester: 4 }),
  make({ title: 'Assignment 2 Submission', eventType: 'deadline', startDate: shift(3), priority: 'high', courseCode: '21CS32', courseName: 'Data Structures', facultyId: 'f1', facultyName: 'Prof. Anitha R' }),
  make({ title: 'Independence Day', eventType: 'holiday', startDate: shift(5), description: 'College closed — flag hoisting at 8:00 AM' }),
  make({ title: 'Tech Fest — Vriddhi 2026', eventType: 'event', startDate: shift(7), endDate: shift(9), description: 'Three-day inter-college technical festival', priority: 'high', building: 'Main Auditorium' }),
  make({ title: 'Machine Learning — Lecture', eventType: 'class', startDate: shift(1), allDay: false, startTime: '14:00', endTime: '15:00', courseCode: '21AI61', courseName: 'Machine Learning', facultyId: 'f3', facultyName: 'Dr. Meera S', room: 'LH-105', branch: 'AIML', semester: 6 }),
  make({ title: 'Internal Assessment 1 — Maths', eventType: 'exam', startDate: shift(-3), status: 'completed', allDay: false, startTime: '09:30', endTime: '11:00', courseCode: '21MAT31', courseName: 'Engineering Mathematics III' }),
  make({ title: 'Guest Lecture — Cloud Native Systems', eventType: 'event', startDate: shift(-1), status: 'cancelled', allDay: false, startTime: '11:00', endTime: '12:30', room: 'Seminar Hall' }),
  make({ title: 'Semester Break', eventType: 'holiday', startDate: shift(20), endDate: shift(27) }),
  make({ title: 'Project Synopsis Deadline', eventType: 'deadline', startDate: shift(12), priority: 'urgent', branch: 'CSE', semester: 7 }),
];

const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

export async function listCalendarEvents(_opts: CalendarFilterOptions = {}): Promise<CalendarEvent[]> {
  await delay();
  return [...store].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  await delay(200);
  const created = make({ ...(input as any), title: input.title, eventType: input.eventType, startDate: input.startDate });
  store = [...store, created];
  return created;
}

export async function updateCalendarEvent(id: string, input: UpdateCalendarEventInput): Promise<void> {
  await delay(200);
  store = store.map(e => (e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } as CalendarEvent : e));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await delay(150);
  store = store.filter(e => e.id !== id);
}

export async function getCalendarEvent(id: string): Promise<CalendarEvent | null> {
  return store.find(e => e.id === id) || null;
}

export async function getCalendarStats(): Promise<CalendarStats> {
  return computeCalendarStats(store);
}

export async function bulkCreateCalendarEvents(inputs: CreateCalendarEventInput[]): Promise<number> {
  for (const i of inputs) await createCalendarEvent(i);
  return inputs.length;
}

export async function deleteEventSeries(parentEventId: string): Promise<number> {
  const before = store.length;
  store = store.filter(e => e.id !== parentEventId && e.parentEventId !== parentEventId);
  return before - store.length;
}
