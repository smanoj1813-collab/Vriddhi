// src/shared/utils/staffAttendanceStats.ts
//
// Pure date-range and aggregation logic for staff attendance.
//
// Everything here is side-effect free and timezone-explicit so it can be unit
// tested under plain Node (`npm run test:unit`) without Firebase or a DOM.
// The Firestore-facing code in src/shared/api/staffAttendanceApi.ts only maps
// documents onto these shapes; the arithmetic lives here.

import {
  STAFF_STATUS_ORDER,
  STAFF_STATUS_WEIGHT,
  type StaffAttendanceRecord,
  type StaffAttendanceStatus,
  type StaffRosterEntry,
} from '../types/staffAttendance';

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** `YYYY-MM-DD` for a Date, in LOCAL time. Never `toISOString().slice(0,10)` —
 *  that shifts the day for anyone east of Greenwich late in the evening. */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM` for a `YYYY-MM-DD` key. */
export function monthKeyOf(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** Local-midnight Date for a `YYYY-MM-DD` key (invalid input → null). */
export function parseDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  // Rejects rollovers like 2026-02-31, which `new Date` silently rewrites.
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function todayKey(): string {
  return toLocalDateKey(new Date());
}

/** Inclusive list of `YYYY-MM-DD` keys between two keys (empty if reversed). */
export function dateKeysBetween(startKey: string, endKey: string): string[] {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  if (!start || !end) return [];
  const out: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += 86_400_000) {
    // Re-anchor each step on a local date so a DST shift cannot skip or repeat
    // a day: adding 24h to a Date across a DST boundary keeps the same
    // wall-clock hour, but rebuilding from y/m/d is unambiguous.
    const d = new Date(t);
    out.push(toLocalDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate())));
  }
  // A DST day can be 23h/25h long, so the loop above may emit a duplicate.
  return Array.from(new Set(out));
}

/** First and last day of a `YYYY-MM` month. */
export function monthBounds(month: string): { start: string; end: string } | null {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  if (m < 1 || m > 12) return null;
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

/** The month a day belongs to as `YYYY-MM`; falls back to the current month. */
export function currentMonthKey(): string {
  return toLocalDateKey(new Date()).slice(0, 7);
}

/** `0` = Sunday … `6` = Saturday. Returns -1 for an unparseable key. */
export function dayOfWeek(dateKey: string): number {
  const d = parseDateKey(dateKey);
  return d ? d.getDay() : -1;
}

/**
 * Working days in an inclusive range. Colleges run Mon–Sat here, so Sunday is
 * the only day off; a holiday calendar is a per-college feature that does not
 * exist in this codebase yet, and inventing one silently would make every
 * percentage wrong in a way nobody could see.
 */
export function workingDaysBetween(startKey: string, endKey: string): number {
  return dateKeysBetween(startKey, endKey).filter((k) => dayOfWeek(k) !== 0).length;
}

// Formatted by hand rather than with toLocaleDateString: ICU disagrees between
// Node ("Sept") and browsers ("Sep") on the short month name, and a downloaded
// report must not change wording depending on who generated it.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

/** Human label, e.g. `September 2026`. */
export function monthLabel(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const m = Number(month.slice(5, 7));
  if (m < 1 || m > 12) return month;
  return `${MONTH_NAMES[m - 1]} ${month.slice(0, 4)}`;
}

/** `12 Sep 2026` */
export function formatDayLabel(dateKey: string): string {
  const d = parseDateKey(dateKey);
  if (!d) return dateKey;
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Selection model ──────────────────────────────────────────────────────────

export type RangeKind = 'day' | 'month' | 'custom';

export interface AttendanceRange {
  kind: RangeKind;
  /** Inclusive. */
  start: string;
  /** Inclusive. */
  end: string;
  label: string;
  /** `YYYY-MM` when the range is exactly one calendar month. */
  month?: string;
}

export function dayRange(dateKey: string): AttendanceRange {
  return { kind: 'day', start: dateKey, end: dateKey, label: formatDayLabel(dateKey) };
}

export function monthRange(month: string): AttendanceRange {
  const bounds = monthBounds(month) ?? monthBounds(currentMonthKey())!;
  return {
    kind: 'month',
    start: bounds.start,
    end: bounds.end,
    label: monthLabel(month),
    month,
  };
}

/** Custom range; a reversed pair is swapped so the UI can never ask for "nothing". */
export function customRange(start: string, end: string): AttendanceRange {
  const a = parseDateKey(start);
  const b = parseDateKey(end);
  if (!a || !b) {
    const today = todayKey();
    return { kind: 'custom', start: today, end: today, label: formatDayLabel(today) };
  }
  const lo = a <= b ? start : end;
  const hi = a <= b ? end : start;
  const sameMonth = monthKeyOf(lo) === monthKeyOf(hi);
  return {
    kind: 'custom',
    start: lo,
    end: hi,
    label: `${formatDayLabel(lo)} – ${formatDayLabel(hi)}`,
    month: sameMonth ? monthKeyOf(lo) : undefined,
  };
}

export function rangeDateKeys(range: AttendanceRange): string[] {
  return dateKeysBetween(range.start, range.end);
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

export type StaffStatusCounts = Record<StaffAttendanceStatus, number>;

export function emptyCounts(): StaffStatusCounts {
  return STAFF_STATUS_ORDER.reduce((acc, s) => ({ ...acc, [s]: 0 }), {} as StaffStatusCounts);
}

export function addCount(counts: StaffStatusCounts, status: StaffAttendanceStatus): StaffStatusCounts {
  if (!(status in counts)) return counts;
  return { ...counts, [status]: counts[status] + 1 };
}

export interface StaffAttendanceSummary {
  facultyId: string;
  facultyName: string;
  department: string;
  designation?: string;
  /** Days the faculty member actually recorded something for. */
  marked: number;
  /** Working days in the range that have no record at all. */
  unmarked: number;
  counts: StaffStatusCounts;
  /** Working days in the range — the denominator of `percentage`. */
  expectedDays: number;
  /** 0–100: weighted attendance over expected working days. */
  percentage: number;
}

/** Days credited, counting a half day as half. */
export function attendedDays(counts: StaffStatusCounts): number {
  return STAFF_STATUS_ORDER.reduce((sum, s) => sum + counts[s] * STAFF_STATUS_WEIGHT[s], 0);
}

/** 0–100, one decimal, guarded against a zero denominator. */
export function attendancePercentage(attended: number, expected: number): number {
  if (expected <= 0) return 0;
  const pct = (attended / expected) * 100;
  return Math.round(Math.min(Math.max(pct, 0), 100) * 10) / 10;
}

/**
 * Per-faculty rollup for a range.
 *
 * The roster drives the result: a faculty member with no records at all must
 * still appear (that is exactly the row a principal needs to see), so they are
 * reported with 0% rather than dropped. Records whose facultyId is not in the
 * roster — a deleted account, or a cross-college document — are summarised too,
 * rather than silently vanishing from a report.
 */
export function summarizeByFaculty(
  records: StaffAttendanceRecord[],
  roster: StaffRosterEntry[],
  range: AttendanceRange,
): StaffAttendanceSummary[] {
  const expectedDays = workingDaysBetween(range.start, range.end);
  const inRange = new Set(rangeDateKeys(range));

  const byFaculty = new Map<string, StaffAttendanceSummary>();
  for (const member of roster) {
    byFaculty.set(member.id, {
      facultyId: member.id,
      facultyName: member.name,
      department: member.department,
      designation: member.designation,
      marked: 0,
      unmarked: expectedDays,
      counts: emptyCounts(),
      expectedDays,
      percentage: 0,
    });
  }

  // One document per faculty per day is the storage contract, but a duplicate
  // (e.g. a legacy write under a different id) must not double-count a day.
  const seenDays = new Map<string, Set<string>>();

  for (const record of records) {
    if (!inRange.has(record.date)) continue;
    let days = seenDays.get(record.facultyId);
    if (!days) {
      days = new Set();
      seenDays.set(record.facultyId, days);
    }
    if (days.has(record.date)) continue;
    days.add(record.date);

    let entry = byFaculty.get(record.facultyId);
    if (!entry) {
      entry = {
        facultyId: record.facultyId,
        facultyName: record.facultyName || 'Unknown',
        department: record.department || 'General',
        designation: record.designation,
        marked: 0,
        unmarked: expectedDays,
        counts: emptyCounts(),
        expectedDays,
        percentage: 0,
      };
      byFaculty.set(record.facultyId, entry);
    }
    entry.marked += 1;
    entry.counts = addCount(entry.counts, record.status);
  }

  const summaries = Array.from(byFaculty.values());
  for (const s of summaries) {
    s.unmarked = Math.max(expectedDays - s.marked, 0);
    s.percentage = attendancePercentage(attendedDays(s.counts), s.expectedDays);
  }

  // Worst attendance first: the rows that need a conversation are on top.
  return summaries.sort(
    (a, b) => a.percentage - b.percentage || a.facultyName.localeCompare(b.facultyName),
  );
}

export interface DailyAttendancePoint {
  date: string;
  label: string;
  present: number;
  absent: number;
  leave: number;
  late: number;
  other: number;
  /** Faculty with no record for that day. */
  unmarked: number;
  total: number;
  percentage: number;
}

/**
 * Day-by-day series for a range — the trend line on the principal dashboard.
 * Empty days are kept (as zeros) so a gap reads as a gap, not as a jump.
 */
export function dailySeries(
  records: StaffAttendanceRecord[],
  range: AttendanceRange,
  rosterSize: number,
): DailyAttendancePoint[] {
  const days = rangeDateKeys(range);
  const byDay = new Map<string, StaffAttendanceRecord[]>();
  for (const r of records) {
    const list = byDay.get(r.date);
    if (list) list.push(r);
    else byDay.set(r.date, [r]);
  }

  return days.map((date) => {
    const dayRecords = byDay.get(date) ?? [];
    // `addCount` is immutable, so the result has to be reassigned — dropping it
    // silently produced an all-zero trend line.
    let counts = emptyCounts();
    const seen = new Set<string>();
    for (const r of dayRecords) {
      if (seen.has(r.facultyId)) continue;
      seen.add(r.facultyId);
      counts = addCount(counts, r.status);
    }
    const present = counts.present + counts.onduty + counts.wfh;
    const absent = counts.absent;
    const leave = counts.leave + counts.medical;
    const late = counts.late;
    const other = counts.halfday;
    const marked = present + absent + leave + late + other;
    return {
      date,
      label: formatDayLabel(date),
      present,
      absent,
      leave,
      late,
      other,
      unmarked: Math.max(rosterSize - marked, 0),
      total: marked,
      percentage: attendancePercentage(attendedDays(counts), marked),
    };
  });
}

export interface StaffAttendanceTotals {
  counts: StaffStatusCounts;
  marked: number;
  expectedDays: number;
  /** Weighted days credited across every faculty member. */
  attended: number;
  /** College-wide percentage over roster × working days. */
  percentage: number;
  rosterSize: number;
}

export function totalize(summaries: StaffAttendanceSummary[]): StaffAttendanceTotals {
  const counts = emptyCounts();
  let marked = 0;
  let expectedDays = 0;
  for (const s of summaries) {
    for (const status of STAFF_STATUS_ORDER) counts[status] += s.counts[status];
    marked += s.marked;
    expectedDays += s.expectedDays;
  }
  const attended = attendedDays(counts);
  return {
    counts,
    marked,
    expectedDays,
    attended,
    percentage: attendancePercentage(attended, expectedDays),
    rosterSize: summaries.length,
  };
}

/** Status → count, restricted to statuses that actually occurred (for charts). */
export function statusBreakdown(counts: StaffStatusCounts): { status: StaffAttendanceStatus; label: string; value: number }[] {
  return STAFF_STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
    status: s,
    label: s,
    value: counts[s],
  }));
}

/** Department rollup, alphabetical so the chart does not shuffle between loads. */
export function departmentBreakdown(summaries: StaffAttendanceSummary[]): { department: string; faculty: number; percentage: number; attended: number; expected: number }[] {
  const map = new Map<string, { faculty: number; attended: number; expected: number }>();
  for (const s of summaries) {
    const key = s.department || 'General';
    const entry = map.get(key) ?? { faculty: 0, attended: 0, expected: 0 };
    entry.faculty += 1;
    entry.attended += attendedDays(s.counts);
    entry.expected += s.expectedDays;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([department, v]) => ({
      department,
      faculty: v.faculty,
      attended: v.attended,
      expected: v.expected,
      percentage: attendancePercentage(v.attended, v.expected),
    }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

/**
 * Faculty × day matrix, the shape of a printed monthly register: one row per
 * person, one column per working day, a short status code in each cell.
 */
export interface RegisterRow {
  facultyId: string;
  facultyName: string;
  department: string;
  /** `null` = no record for that day. */
  cells: (StaffAttendanceStatus | null)[];
  counts: StaffStatusCounts;
  percentage: number;
}

export interface AttendanceRegister {
  dates: string[];
  rows: RegisterRow[];
}

export function buildRegister(
  records: StaffAttendanceRecord[],
  roster: StaffRosterEntry[],
  range: AttendanceRange,
): AttendanceRegister {
  const dates = rangeDateKeys(range).filter((d) => dayOfWeek(d) !== 0);
  const cellMap = new Map<string, Map<string, StaffAttendanceStatus>>();
  for (const r of records) {
    let per = cellMap.get(r.facultyId);
    if (!per) {
      per = new Map();
      cellMap.set(r.facultyId, per);
    }
    if (!per.has(r.date)) per.set(r.date, r.status);
  }

  const summaries = summarizeByFaculty(records, roster, range);
  const rows: RegisterRow[] = summaries.map((s) => ({
    facultyId: s.facultyId,
    facultyName: s.facultyName,
    department: s.department,
    cells: dates.map((d) => cellMap.get(s.facultyId)?.get(d) ?? null),
    counts: s.counts,
    percentage: s.percentage,
  }));

  rows.sort((a, b) => a.department.localeCompare(b.department) || a.facultyName.localeCompare(b.facultyName));
  return { dates, rows };
}

/** `HH:mm` in, `HH:mm` out → hours to one decimal. Empty in/out → 0. */
export function hoursBetween(checkIn: string, checkOut: string): number {
  const parse = (v: string): number | null => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  };
  const a = parse(checkIn);
  const b = parse(checkOut);
  if (a == null || b == null) return 0;
  const diff = b - a;
  // A shift that crosses midnight (night duty) is positive once wrapped.
  const minutes = diff >= 0 ? diff : diff + 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
}

/** `HH:mm` for "now", local. */
export function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
