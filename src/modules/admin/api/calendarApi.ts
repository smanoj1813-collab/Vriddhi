// src/modules/admin/api/calendarApi.ts
// Academic calendar client API (Auto-Scheduler v2 — P4).
//
// Reads are client-side (rules: staff + superadmin) so the timetable
// "⛔ Holiday — no classes" banners and the Academic Calendar page stay fast;
// WRITES ARE CALLABLE-ONLY (saveCalendarEvent / deleteCalendarEvent mirror the
// schemePacks single door — rules deny every client write).

import { collection, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import {
  DEFAULT_SUSPENDS_CLASSES,
  type CalendarEvent,
  type CalendarEventInput,
  type CalendarEventType,
} from '@/shared/types/calendarEvent';
import {
  KARNATAKA_PUBLIC_HOLIDAYS,
  karnatakaHolidaysForYear,
} from '@/shared/data/karnatakaPublicHolidays';

function currentCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college is linked to this account');
  return id;
}

function toEvent(id: string, data: Record<string, unknown>): CalendarEvent | null {
  const title = String(data.title ?? '').trim();
  const type = String(data.type ?? '').trim() as CalendarEventType;
  const startDate = String(data.startDate ?? '').trim();
  const endDate = String(data.endDate ?? '').trim();
  if (!title || !startDate || !endDate) return null;
  return {
    id,
    collegeId: String(data.collegeId ?? ''),
    title,
    type,
    startDate,
    endDate,
    suspendsClasses: data.suspendsClasses !== false,
    notes: String(data.notes ?? ''),
    createdBy: String(data.createdBy ?? ''),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** Every event of the college (bounded server-side too — 200 is plenty). */
export async function fetchCalendarEvents(collegeId?: string): Promise<CalendarEvent[]> {
  const cid = collegeId || currentCollegeId();
  const snap = await getDocs(
    query(collection(db, 'academicCalendar'), where('collegeId', '==', cid)),
  );
  return snap.docs
    .map((d) => toEvent(d.id, d.data() as Record<string, unknown>))
    .filter((e): e is CalendarEvent => e !== null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export interface SaveCalendarResult {
  id: string;
  updated: boolean;
  /** Future, unmarked sessions reconciled immediately for a suspending event. */
  cancelledSessions: number;
  warnings: string[];
}

export async function saveCalendarEvent(
  event: CalendarEventInput,
  collegeId?: string,
): Promise<SaveCalendarResult> {
  const call = httpsCallable<Record<string, unknown>, SaveCalendarResult>(
    functions,
    'saveCalendarEvent',
  );
  const res = await call({
    event: {
      ...(event.id ? { id: event.id } : {}),
      title: event.title,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      suspendsClasses: event.suspendsClasses,
      notes: event.notes ?? '',
    },
    collegeId: collegeId || currentCollegeId(),
  });
  return res.data;
}

export async function deleteCalendarEvent(id: string, collegeId?: string): Promise<void> {
  const call = httpsCallable<Record<string, unknown>, { id: string }>(
    functions,
    'deleteCalendarEvent',
  );
  await call({ id, collegeId: collegeId || currentCollegeId() });
}

/** Stable, college-scoped ID so concurrent/repeated imports are idempotent. */
function importedHolidayId(collegeId: string, date: string): string {
  let hash = 2166136261;
  for (let i = 0; i < collegeId.length; i += 1) {
    hash ^= collegeId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `kph-${(hash >>> 0).toString(36)}-${date.replace(/-/g, '')}`;
}

function normalizedHolidayTitle(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Import the bundled Karnataka list through the callable write door. Existing
 * matching rows are updated in place (and reconciled for already-generated
 * sessions), while new rows use stable IDs so repeated imports cannot clone
 * the same holiday.
 */
export async function importKarnatakaHolidays(
  year: number,
  collegeId?: string,
): Promise<{ created: number; alreadyPresent: number; cancelledSessions: number; ids: string[]; warnings: string[] }> {
  const cid = collegeId || currentCollegeId();
  const existingEvents = await fetchCalendarEvents(cid);
  const ids: string[] = [];
  const warnings: string[] = [];
  let created = 0;
  let alreadyPresent = 0;
  let cancelledSessions = 0;

  for (const holiday of karnatakaHolidaysForYear(year)) {
    const existing = existingEvents.find((event) =>
      event.type === 'public-holiday' &&
      event.startDate === holiday.date &&
      event.endDate === holiday.date &&
      normalizedHolidayTitle(event.title) === normalizedHolidayTitle(holiday.title),
    );
    const notes = existing?.notes || (holiday.tentative
      ? 'Tentative date (lunar sighting) — verify against the gazetted list'
      : 'Imported from the bundled Karnataka public-holiday list');
    const result = await saveCalendarEvent(
      {
        ...(existing ? { id: existing.id } : { id: importedHolidayId(cid, holiday.date) }),
        title: existing?.title || holiday.title,
        type: 'public-holiday',
        startDate: holiday.date,
        endDate: holiday.date,
        // Preserve a college's explicit teach-on-holiday override on re-import.
        suspendsClasses: existing ? existing.suspendsClasses : DEFAULT_SUSPENDS_CLASSES['public-holiday'],
        notes,
      },
      cid,
    );
    ids.push(result.id);
    if (existing) alreadyPresent += 1;
    else created += 1;
    cancelledSessions += result.cancelledSessions || 0;
    warnings.push(...result.warnings);
  }

  return { created, alreadyPresent, cancelledSessions, ids, warnings };
}

export { KARNATAKA_PUBLIC_HOLIDAYS };
