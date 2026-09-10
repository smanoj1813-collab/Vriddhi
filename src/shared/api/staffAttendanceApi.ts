// src/shared/api/staffAttendanceApi.ts
//
// Firestore access for staff (faculty) attendance — one document per faculty
// member per calendar day, stored under a deterministic id so a re-mark is an
// update rather than a duplicate:
//
//   staffAttendance/{collegeId}__{facultyUid}__{YYYY-MM-DD}
//
// The id is deterministic on purpose. `addDoc` would let one double-tap write
// two "present" rows for the same day, and every percentage downstream would
// silently inflate.
//
// Tenancy: every document carries `collegeId`, and the security rules in
// current-firestore.rules require it to match the caller's college claim.

import {
  collection, doc, getDoc, getDocs, query, setDoc, where, orderBy,
  Timestamp, type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/Firebase/config';

import {
  isStaffAttendanceStatus,
  type StaffAttendanceRecord,
  type StaffAttendanceSource,
  type StaffAttendanceStatus,
  type StaffRosterEntry,
} from '../types/staffAttendance';
import { hoursBetween, monthKeyOf, toLocalDateKey } from '../utils/staffAttendanceStats';

export const STAFF_ATTENDANCE_COLLECTION = 'staffAttendance';

/** Deterministic document id — the storage contract for "one row per day". */
export function staffAttendanceDocId(collegeId: string, facultyId: string, date: string): string {
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${safe(collegeId)}__${safe(facultyId)}__${safe(date)}`;
}

function toIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return '';
}

/** Map a Firestore document onto the app's record shape, tolerating old fields. */
export function mapStaffAttendanceDoc(id: string, data: Record<string, unknown>): StaffAttendanceRecord | null {
  const facultyId = String(data.facultyId ?? data.uid ?? '');
  const date = String(data.date ?? '');
  if (!facultyId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  const status = isStaffAttendanceStatus(data.status) ? data.status : null;
  if (!status) return null;

  const checkIn = String(data.checkIn ?? data.timeIn ?? '');
  const checkOut = String(data.checkOut ?? data.timeOut ?? '');
  const rawHours = Number(data.hoursWorked);

  return {
    id,
    collegeId: String(data.collegeId ?? ''),
    facultyId,
    facultyName: String(data.facultyName ?? data.name ?? 'Unknown'),
    department: String(data.department ?? '') || 'General',
    designation: data.designation ? String(data.designation) : undefined,
    date,
    status,
    checkIn,
    checkOut,
    // Trust a stored value only when it is a finite positive number; otherwise
    // recompute from the times so a legacy row without the field is still right.
    hoursWorked: Number.isFinite(rawHours) && rawHours > 0 ? Math.round(rawHours * 10) / 10 : hoursBetween(checkIn, checkOut),
    note: String(data.note ?? data.notes ?? ''),
    markedAt: toIso(data.markedAt ?? data.updatedAt),
    source: (data.source === 'admin' ? 'admin' : 'self') as StaffAttendanceSource,
    markedBy: String(data.markedBy ?? facultyId),
  };
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export interface SaveStaffAttendanceParams {
  collegeId: string;
  facultyId: string;
  facultyName: string;
  department?: string;
  designation?: string;
  date: string;
  status: StaffAttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  /** `self` for a faculty member marking their own day, `admin` for an override. */
  source?: StaffAttendanceSource;
  markedBy?: string;
}

/** Upsert one faculty member's day. Returns the document id. */
export async function saveStaffAttendance(params: SaveStaffAttendanceParams): Promise<string> {
  if (!params.collegeId) throw new Error('Missing college context — sign in again to refresh it.');
  if (!params.facultyId) throw new Error('Missing faculty identity.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.date)) throw new Error('Invalid date.');

  const now = Timestamp.now();
  const id = staffAttendanceDocId(params.collegeId, params.facultyId, params.date);
  const checkIn = params.checkIn ?? '';
  const checkOut = params.checkOut ?? '';

  await setDoc(
    doc(db, STAFF_ATTENDANCE_COLLECTION, id),
    {
      collegeId: params.collegeId,
      facultyId: params.facultyId,
      facultyName: params.facultyName,
      department: params.department || 'General',
      designation: params.designation || '',
      date: params.date,
      month: monthKeyOf(params.date),
      status: params.status,
      checkIn,
      checkOut,
      hoursWorked: hoursBetween(checkIn, checkOut),
      note: params.note ?? '',
      source: params.source ?? 'self',
      markedBy: params.markedBy ?? params.facultyId,
      markedAt: new Date().toISOString(),
      updatedAt: now,
      // Only set on first write, so `createdAt` stays meaningful on updates.
      ...(await docExists(doc(db, STAFF_ATTENDANCE_COLLECTION, id)) ? {} : { createdAt: now }),
    },
    { merge: true },
  );

  return id;
}

async function docExists(ref: ReturnType<typeof doc>): Promise<boolean> {
  try {
    const snap = await getDoc(ref);
    return snap.exists();
  } catch {
    // A rules denial here must not block the write; `merge: true` is safe either way.
    return false;
  }
}

// ─── Reads ────────────────────────────────────────────────────────────────────

async function runQuery(constraints: QueryConstraint[]): Promise<StaffAttendanceRecord[]> {
  const snap = await getDocs(query(collection(db, STAFF_ATTENDANCE_COLLECTION), ...constraints));
  const out: StaffAttendanceRecord[] = [];
  for (const d of snap.docs) {
    const mapped = mapStaffAttendanceDoc(d.id, d.data());
    if (mapped) out.push(mapped);
  }
  // Sorted client-side: a range query with orderBy('date') needs a composite
  // index, and doing it here keeps the read to one index-free query.
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.facultyName.localeCompare(b.facultyName));
}

/** One faculty member's records inside an inclusive date range. */
export async function fetchMyStaffAttendance(
  facultyId: string,
  start: string,
  end: string,
): Promise<StaffAttendanceRecord[]> {
  if (!facultyId) return [];
  return runQuery([
    where('facultyId', '==', facultyId),
    where('date', '>=', start),
    where('date', '<=', end),
  ]);
}

/** A single day for one faculty member (used to pre-fill the marking form). */
export async function fetchStaffAttendanceForDate(
  collegeId: string,
  facultyId: string,
  date: string,
): Promise<StaffAttendanceRecord | null> {
  if (!collegeId || !facultyId || !date) return null;
  try {
    const snap = await getDoc(doc(db, STAFF_ATTENDANCE_COLLECTION, staffAttendanceDocId(collegeId, facultyId, date)));
    if (!snap.exists()) return null;
    return mapStaffAttendanceDoc(snap.id, snap.data());
  } catch (err) {
    console.warn('[staffAttendanceApi] single-day read failed', err);
    return null;
  }
}

/** Everything a college recorded inside an inclusive range — the principal view. */
export async function fetchCollegeStaffAttendance(
  collegeId: string,
  start: string,
  end: string,
): Promise<StaffAttendanceRecord[]> {
  if (!collegeId) return [];
  return runQuery([
    where('collegeId', '==', collegeId),
    where('date', '>=', start),
    where('date', '<=', end),
  ]);
}

/** A whole month, by the denormalised `month` field. */
export async function fetchCollegeStaffAttendanceByMonth(
  collegeId: string,
  month: string,
): Promise<StaffAttendanceRecord[]> {
  if (!collegeId || !/^\d{4}-\d{2}$/.test(month)) return [];
  return runQuery([
    where('collegeId', '==', collegeId),
    where('month', '==', month),
  ]);
}

/**
 * The staff roster — who *should* have attendance. Without it a report can only
 * show people who bothered to mark, and the quiet absentees disappear.
 */
export async function fetchStaffRoster(collegeId: string): Promise<StaffRosterEntry[]> {
  if (!collegeId) return [];
  try {
    const snap = await getDocs(
      query(collection(db, 'faculty'), where('collegeId', '==', collegeId), orderBy('createdAt', 'desc')),
    );
    const roster: StaffRosterEntry[] = [];
    for (const d of snap.docs) {
      const data = d.data();
      const status = String(data.status ?? 'active').toLowerCase();
      if (status === 'inactive' || status === 'suspended') continue;

      // Faculty profiles are keyed by profile id and carry the auth uid in a
      // field; attendance is owned by the uid. Fall back to the doc id for
      // profiles provisioned without a uid so they still appear in the roster.
      const id = String(data.uid ?? d.id);
      const name =
        String(data.name ?? '').trim() ||
        `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim() ||
        String(data.email ?? 'Unknown');

      roster.push({
        id,
        name,
        email: data.email ? String(data.email) : undefined,
        department: String(data.department ?? '') || 'General',
        designation: data.designation ? String(data.designation) : undefined,
      });
    }
    // A uid can appear on more than one profile during a migration; keep one.
    const seen = new Set<string>();
    return roster.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  } catch (err) {
    console.error('[staffAttendanceApi] roster fetch failed', err);
    return [];
  }
}

/** Today's date key, local — the default for the marking form. */
export function todayDateKey(): string {
  return toLocalDateKey(new Date());
}
