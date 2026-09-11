// src/shared/types/staffAttendance.ts
//
// Staff (faculty) attendance — a faculty member marking THEIR OWN attendance.
//
// This is deliberately separate from the student attendance model in
// src/modules/admin/types/attendance.ts. Students are marked per class session
// by a teacher; staff are marked once per calendar day by themselves. Mixing
// the two in one collection is what makes "who was in the building today"
// unanswerable, so they live apart:
//
//   attendance / attendanceRecords  → student attendance (per session)
//   staffAttendance                 → staff attendance (per faculty, per day)

/** Every status a faculty member can record for a day. */
export type StaffAttendanceStatus =
  | 'present'
  | 'late'
  | 'halfday'
  | 'absent'
  | 'leave'
  | 'medical'
  | 'onduty'
  | 'wfh';

/**
 * How much of a working day each status is worth, used for the attendance
 * percentage. `late` still counts as a full day (they came in), `halfday`
 * counts as half, and the leave flavours count as zero.
 */
export const STAFF_STATUS_WEIGHT: Record<StaffAttendanceStatus, number> = {
  present: 1,
  late: 1,
  onduty: 1,
  wfh: 1,
  halfday: 0.5,
  absent: 0,
  leave: 0,
  medical: 0,
};

export const STAFF_STATUS_ORDER: StaffAttendanceStatus[] = [
  'present',
  'late',
  'halfday',
  'onduty',
  'wfh',
  'leave',
  'medical',
  'absent',
];

export const STAFF_STATUS_LABEL: Record<StaffAttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  halfday: 'Half Day',
  absent: 'Absent',
  leave: 'On Leave',
  medical: 'Medical Leave',
  onduty: 'On Duty',
  wfh: 'Work From Home',
};

/** One letter, used by the month grid and the printed register. */
export const STAFF_STATUS_SHORT: Record<StaffAttendanceStatus, string> = {
  present: 'P',
  late: 'L',
  halfday: 'H',
  absent: 'A',
  leave: 'LV',
  medical: 'ML',
  onduty: 'OD',
  wfh: 'WFH',
};

/** Tailwind classes so every screen colours a status the same way. */
export const STAFF_STATUS_STYLE: Record<StaffAttendanceStatus, { chip: string; dot: string; hex: string }> = {
  present: { chip: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500', hex: '#10b981' },
  late: { chip: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500', hex: '#f59e0b' },
  halfday: { chip: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800', dot: 'bg-sky-500', hex: '#0ea5e9' },
  absent: { chip: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', dot: 'bg-rose-500', hex: '#ef4444' },
  leave: { chip: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800', dot: 'bg-violet-500', hex: '#8b5cf6' },
  medical: { chip: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800', dot: 'bg-pink-500', hex: '#ec4899' },
  onduty: { chip: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800', dot: 'bg-indigo-500', hex: '#6366f1' },
  wfh: { chip: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800', dot: 'bg-teal-500', hex: '#14b8a6' },
};

/** Statuses that mean the person actually worked (fully or partly). */
export function statusCountsAsAttended(status: StaffAttendanceStatus): boolean {
  return STAFF_STATUS_WEIGHT[status] > 0;
}

export function isStaffAttendanceStatus(value: unknown): value is StaffAttendanceStatus {
  return typeof value === 'string' && (STAFF_STATUS_ORDER as string[]).includes(value);
}

/** Who wrote the record — the faculty themselves, or an admin correcting it. */
export type StaffAttendanceSource = 'self' | 'admin';

/** One faculty member's attendance for one calendar day. */
export interface StaffAttendanceRecord {
  id: string;
  collegeId: string;
  /** Auth uid of the faculty member — the owner of the record. */
  facultyId: string;
  facultyName: string;
  department: string;
  designation?: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  status: StaffAttendanceStatus;
  /** `HH:mm` 24h, empty when not captured. */
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  note: string;
  /** ISO instant the record was written. */
  markedAt: string;
  source: StaffAttendanceSource;
  /** uid of whoever wrote it (self-marking → same as facultyId). */
  markedBy: string;
}

/** Write payload for a faculty member marking (or updating) their own day. */
export interface StaffAttendanceInput {
  date: string;
  status: StaffAttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  note?: string;
}

/** A faculty member as the attendance views need to see them. */
export interface StaffRosterEntry {
  id: string;
  name: string;
  email?: string;
  department: string;
  designation?: string;
}
