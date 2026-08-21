// ═══════════════════════════════════════════════════════════════════════
// api/academicCalendarApi.ts — Academic Calendar Firestore CRUD + Stats
// ═══════════════════════════════════════════════════════════════════════

import { db } from '@/Firebase/config';
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp, writeBatch,
  DocumentData, QueryDocumentSnapshot, Query,
} from 'firebase/firestore';

import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarFilterOptions,
  CalendarStats,
  CalendarEventType,
} from '@/shared/types/academicCalendar';

export const CALENDAR_COLLECTION = 'academicCalendarEvents';

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

/** Strips `undefined` values recursively — Firestore rejects them. */
function deepSanitize<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as T;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) {
    return obj.map(deepSanitize).filter(v => v !== undefined) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = deepSanitize(value);
  }
  return result as T;
}

/** YYYY-MM-DD for a local Date (no UTC shift). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function docToEvent(snap: QueryDocumentSnapshot<DocumentData>): CalendarEvent {
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title || 'Untitled',
    description: data.description ?? null,
    eventType: data.eventType || 'event',
    status: data.status || 'scheduled',
    priority: data.priority || 'medium',

    startDate: data.startDate || '',
    endDate: data.endDate || data.startDate || '',
    allDay: data.allDay ?? true,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,

    collegeId: data.collegeId || '',
    curriculumId: data.curriculumId ?? null,
    courseId: data.courseId ?? null,
    courseName: data.courseName ?? null,
    courseCode: data.courseCode ?? null,
    moduleId: data.moduleId ?? null,
    moduleName: data.moduleName ?? null,
    facultyId: data.facultyId ?? null,
    facultyName: data.facultyName ?? null,
    branch: data.branch ?? null,
    semester: data.semester ?? null,
    batch: data.batch ?? null,
    division: data.division ?? null,
    section: data.section ?? null,

    room: data.room ?? null,
    building: data.building ?? null,

    createdBy: data.createdBy || '',
    createdByName: data.createdByName ?? null,
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || null,
    attendees: Array.isArray(data.attendees) ? data.attendees : null,
    color: data.color ?? null,
    isRecurring: data.isRecurring ?? false,
    recurringRule: data.recurringRule ?? null,
    parentEventId: data.parentEventId ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// CRUD
// ═══════════════════════════════════════════════════════════════════════

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  const now = Timestamp.now();
  const payload = deepSanitize({
    title: input.title,
    description: input.description ?? null,
    eventType: input.eventType,
    status: input.status ?? 'scheduled',
    priority: input.priority ?? 'medium',

    startDate: input.startDate,
    endDate: input.endDate || input.startDate,
    allDay: input.allDay ?? true,
    startTime: input.allDay ? null : (input.startTime ?? null),
    endTime: input.allDay ? null : (input.endTime ?? null),

    collegeId: input.collegeId,
    curriculumId: input.curriculumId ?? null,
    courseId: input.courseId ?? null,
    courseName: input.courseName ?? null,
    courseCode: input.courseCode ?? null,
    moduleId: input.moduleId ?? null,
    moduleName: input.moduleName ?? null,
    facultyId: input.facultyId ?? null,
    facultyName: input.facultyName ?? null,
    branch: input.branch ?? null,
    semester: input.semester ?? null,
    batch: input.batch ?? null,
    division: input.division ?? null,
    section: input.section ?? null,

    room: input.room ?? null,
    building: input.building ?? null,

    createdBy: input.createdBy,
    createdByName: input.createdByName ?? null,
    createdAt: now,
    updatedAt: null,
    attendees: input.attendees ?? null,
    color: input.color ?? null,
    isRecurring: input.isRecurring ?? false,
    recurringRule: input.recurringRule ?? null,
    parentEventId: null,
  });

  const ref = await addDoc(collection(db, CALENDAR_COLLECTION), payload);
  const created = await getDoc(ref);
  return docToEvent(created as QueryDocumentSnapshot<DocumentData>);
}

export async function updateCalendarEvent(
  id: string,
  input: UpdateCalendarEventInput
): Promise<void> {
  const patch: Record<string, any> = deepSanitize({ ...input });
  if (input.allDay === true) {
    patch.startTime = null;
    patch.endTime = null;
  }
  patch.updatedAt = Timestamp.now();
  await updateDoc(doc(db, CALENDAR_COLLECTION, id), patch);
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, CALENDAR_COLLECTION, id));
}

export async function getCalendarEvent(id: string): Promise<CalendarEvent | null> {
  const snap = await getDoc(doc(db, CALENDAR_COLLECTION, id));
  if (!snap.exists()) return null;
  return docToEvent(snap as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Lists events for a college.
 * Only `collegeId` + `orderBy(startDate)` hit Firestore — every other filter is
 * applied in memory so no composite indexes beyond one are required.
 */
export async function listCalendarEvents(opts: CalendarFilterOptions = {}): Promise<CalendarEvent[]> {
  const base = collection(db, CALENDAR_COLLECTION);
  let q: Query<DocumentData> = base;

  if (opts.collegeId) {
    q = query(base, where('collegeId', '==', opts.collegeId), orderBy('startDate', 'asc'));
  } else {
    q = query(base, orderBy('startDate', 'asc'));
  }

  const snap = await getDocs(q);
  let items = snap.docs.map(docToEvent);

  if (opts.eventType && opts.eventType !== 'all') {
    items = items.filter(e => e.eventType === opts.eventType);
  }
  if (opts.status && opts.status !== 'all') {
    items = items.filter(e => e.status === opts.status);
  }
  if (opts.branch && opts.branch !== 'all') {
    items = items.filter(e => e.branch === opts.branch);
  }
  if (opts.semester !== undefined && opts.semester !== 'all') {
    items = items.filter(e => e.semester === opts.semester);
  }
  if (opts.batch && opts.batch !== 'all') {
    items = items.filter(e => e.batch === opts.batch);
  }
  if (opts.facultyId && opts.facultyId !== 'all') {
    items = items.filter(e => e.facultyId === opts.facultyId);
  }
  if (opts.startDate) {
    items = items.filter(e => e.endDate >= opts.startDate!);
  }
  if (opts.endDate) {
    items = items.filter(e => e.startDate <= opts.endDate!);
  }
  if (opts.search?.trim()) {
    const term = opts.search.trim().toLowerCase();
    items = items.filter(e =>
      e.title.toLowerCase().includes(term) ||
      (e.description || '').toLowerCase().includes(term) ||
      (e.courseName || '').toLowerCase().includes(term) ||
      (e.courseCode || '').toLowerCase().includes(term) ||
      (e.facultyName || '').toLowerCase().includes(term) ||
      (e.room || '').toLowerCase().includes(term)
    );
  }

  return items;
}

export async function bulkCreateCalendarEvents(
  inputs: CreateCalendarEventInput[]
): Promise<number> {
  if (!inputs.length) return 0;
  const now = Timestamp.now();
  const batch = writeBatch(db);

  inputs.forEach(input => {
    const ref = doc(collection(db, CALENDAR_COLLECTION));
    batch.set(ref, deepSanitize({
      ...input,
      endDate: input.endDate || input.startDate,
      status: input.status ?? 'scheduled',
      priority: input.priority ?? 'medium',
      allDay: input.allDay ?? true,
      isRecurring: input.isRecurring ?? false,
      parentEventId: null,
      createdAt: now,
      updatedAt: null,
    }));
  });

  await batch.commit();
  return inputs.length;
}

/** Deletes an event and any child occurrences generated from it. */
export async function deleteEventSeries(parentEventId: string): Promise<number> {
  const snap = await getDocs(
    query(collection(db, CALENDAR_COLLECTION), where('parentEventId', '==', parentEventId))
  );
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, CALENDAR_COLLECTION, parentEventId));
  await batch.commit();
  return snap.size + 1;
}

// ═══════════════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════════════

export function computeCalendarStats(events: CalendarEvent[], reference = new Date()): CalendarStats {
  const today = toISODate(reference);

  const weekStart = new Date(reference);
  weekStart.setDate(reference.getDate() - reference.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartISO = toISODate(weekStart);
  const weekEndISO = toISODate(weekEnd);

  const monthPrefix = today.slice(0, 7); // YYYY-MM

  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  let upcomingEvents = 0;
  let classesToday = 0;
  let examsThisWeek = 0;
  let holidaysThisMonth = 0;

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

  return {
    totalEvents: events.length,
    upcomingEvents,
    classesToday,
    examsThisWeek,
    holidaysThisMonth,
    byType,
    byStatus,
  };
}

export async function getCalendarStats(collegeId: string): Promise<CalendarStats> {
  const events = await listCalendarEvents({ collegeId });
  return computeCalendarStats(events);
}

// ═══════════════════════════════════════════════════════════════════════
// Presentation helpers
// ═══════════════════════════════════════════════════════════════════════

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
