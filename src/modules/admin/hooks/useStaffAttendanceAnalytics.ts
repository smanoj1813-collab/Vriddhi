// src/modules/admin/hooks/useStaffAttendanceAnalytics.ts
//
// Principal-side state for staff attendance: one fetch for the college's
// records in the selected range, one for the roster, then all of the analysis
// is computed locally by the pure helpers in staffAttendanceStats.
//
// Keeping the maths out of the component means the numbers a principal sees
// are the same numbers the downloaded report contains — both come from
// `summarizeByFaculty` / `buildRegister`.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchCollegeStaffAttendance,
  fetchStaffRoster,
} from '@/shared/api/staffAttendanceApi';
import {
  buildRegister,
  customRange,
  dailySeries,
  departmentBreakdown,
  monthRange,
  summarizeByFaculty,
  totalize,
  currentMonthKey,
  type AttendanceRange,
  type RangeKind,
} from '@/shared/utils/staffAttendanceStats';
import type { StaffAttendanceRecord, StaffRosterEntry } from '@/shared/types/staffAttendance';

export interface StaffAttendanceFilters {
  kind: RangeKind;
  month: string;
  start: string;
  end: string;
  department: string;
  search: string;
}

export function useStaffAttendanceAnalytics(collegeId: string | undefined) {
  const [month, setMonth] = useState<string>(() => currentMonthKey());
  const [kind, setKind] = useState<RangeKind>('month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [department, setDepartment] = useState('all');
  const [search, setSearch] = useState('');

  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [roster, setRoster] = useState<StaffRosterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const range: AttendanceRange = useMemo(() => {
    if (kind === 'custom' && customStart && customEnd) return customRange(customStart, customEnd);
    return monthRange(month);
  }, [kind, month, customStart, customEnd]);

  const load = useCallback(async () => {
    if (!collegeId) {
      setRecords([]);
      setRoster([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [recs, staff] = await Promise.all([
        fetchCollegeStaffAttendance(collegeId, range.start, range.end),
        fetchStaffRoster(collegeId),
      ]);
      setRecords(recs);
      setRoster(staff);
      setLastLoadedAt(new Date().toISOString());
    } catch (err) {
      console.error('[useStaffAttendanceAnalytics] load failed', err);
      setError(err instanceof Error ? err.message : 'Could not load faculty attendance.');
    } finally {
      setLoading(false);
    }
  }, [collegeId, range.start, range.end]);

  useEffect(() => {
    void load();
  }, [load]);

  /** When a month is picked, keep the custom inputs in step so switching back works. */
  useEffect(() => {
    if (kind === 'month') {
      const bounds = monthRange(month);
      setCustomStart(bounds.start);
      setCustomEnd(bounds.end);
    }
  }, [kind, month]);

  const departments = useMemo(
    () => Array.from(new Set(roster.map((r) => r.department || 'General'))).sort(),
    [roster],
  );

  const filteredRoster = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return roster.filter((member) => {
      const matchesDept = department === 'all' || (member.department || 'General') === department;
      const matchesSearch =
        !needle ||
        member.name.toLowerCase().includes(needle) ||
        member.id.toLowerCase().includes(needle) ||
        (member.email ?? '').toLowerCase().includes(needle);
      return matchesDept && matchesSearch;
    });
  }, [roster, department, search]);

  // Records are filtered to the same roster slice, so the table, the charts
  // and the download all describe the same population.
  const visibleRecords = useMemo(() => {
    const ids = new Set(filteredRoster.map((m) => m.id));
    return records.filter((r) => ids.has(r.facultyId));
  }, [records, filteredRoster]);

  const summaries = useMemo(
    () => summarizeByFaculty(visibleRecords, filteredRoster, range),
    [visibleRecords, filteredRoster, range],
  );

  const register = useMemo(
    () => buildRegister(visibleRecords, filteredRoster, range),
    [visibleRecords, filteredRoster, range],
  );

  const trend = useMemo(
    () => dailySeries(visibleRecords, range, filteredRoster.length),
    [visibleRecords, range, filteredRoster.length],
  );

  const totals = useMemo(() => totalize(summaries), [summaries]);
  const byDepartment = useMemo(() => departmentBreakdown(summaries), [summaries]);

  /** Who has not recorded anything today — the actionable list for a principal. */
  const pendingToday = useMemo(() => {
    const marked = new Set(visibleRecords.filter((r) => r.date === todayIso()).map((r) => r.facultyId));
    return filteredRoster.filter((m) => !marked.has(m.id));
  }, [visibleRecords, filteredRoster]);

  const setRangeKind = useCallback((next: RangeKind) => setKind(next), []);

  return {
    collegeId,
    month,
    setMonth,
    kind,
    setKind: setRangeKind,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    department,
    setDepartment,
    search,
    setSearch,
    departments,
    range,
    records: visibleRecords,
    roster: filteredRoster,
    summaries,
    register,
    trend,
    totals,
    byDepartment,
    pendingToday,
    loading,
    error,
    reload: load,
    lastLoadedAt,
  };
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default useStaffAttendanceAnalytics;
