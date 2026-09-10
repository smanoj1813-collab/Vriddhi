// src/modules/faculty/hooks/useMyStaffAttendance.ts
//
// State for a faculty member marking THEIR OWN attendance.
//
// Identity comes from AuthContext — never from a URL parameter or a form
// field. A faculty member can only ever write the document their own uid owns;
// current-firestore.rules enforces the same thing server-side.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  fetchMyStaffAttendance,
  fetchStaffAttendanceForDate,
  saveStaffAttendance,
} from '@/shared/api/staffAttendanceApi';
import {
  monthBounds,
  monthKeyOf,
  summarizeByFaculty,
  todayKey,
  type AttendanceRange,
  monthRange,
} from '@/shared/utils/staffAttendanceStats';
import type {
  StaffAttendanceRecord,
  StaffAttendanceStatus,
} from '@/shared/types/staffAttendance';

export interface MyAttendanceForm {
  date: string;
  status: StaffAttendanceStatus;
  checkIn: string;
  checkOut: string;
  note: string;
}

const DEFAULT_STATUS: StaffAttendanceStatus = 'present';

function emptyForm(date: string): MyAttendanceForm {
  return { date, status: DEFAULT_STATUS, checkIn: '', checkOut: '', note: '' };
}

export function useMyStaffAttendance() {
  const { user } = useAuth();
  const collegeId = user?.collegeId ?? '';
  const facultyId = user?.uid ?? user?.id ?? '';
  const facultyName = user?.name ?? user?.displayName ?? 'Faculty';
  const department = user?.department ?? 'General';

  const [month, setMonth] = useState<string>(() => monthKeyOf(todayKey()));
  const [form, setForm] = useState<MyAttendanceForm>(() => emptyForm(todayKey()));
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const range: AttendanceRange = useMemo(() => monthRange(month), [month]);

  const load = useCallback(async () => {
    if (!facultyId) return;
    const bounds = monthBounds(month);
    if (!bounds) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyStaffAttendance(facultyId, bounds.start, bounds.end);
      setRecords(data);
    } catch (err) {
      console.error('[useMyStaffAttendance] load failed', err);
      setError(err instanceof Error ? err.message : 'Could not load your attendance.');
    } finally {
      setLoading(false);
    }
  }, [facultyId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Pre-fill the form from the stored record for the selected day, if any. */
  const selectDate = useCallback(
    async (date: string) => {
      setForm(emptyForm(date));
      if (!collegeId || !facultyId) return;
      const existing = await fetchStaffAttendanceForDate(collegeId, facultyId, date);
      if (!existing) return;
      setForm({
        date,
        status: existing.status,
        checkIn: existing.checkIn,
        checkOut: existing.checkOut,
        note: existing.note,
      });
    },
    [collegeId, facultyId],
  );

  const save = useCallback(async (): Promise<boolean> => {
    setError(null);
    if (!collegeId || !facultyId) {
      setError('Your account is missing a college or user id — sign out and back in.');
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      setError('Pick a valid date.');
      return false;
    }
    if (form.date > todayKey()) {
      setError('You cannot mark attendance for a future date.');
      return false;
    }
    setSaving(true);
    try {
      await saveStaffAttendance({
        collegeId,
        facultyId,
        facultyName,
        department,
        date: form.date,
        status: form.status,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        note: form.note,
        source: 'self',
        markedBy: facultyId,
      });
      setSavedAt(new Date().toISOString());
      // Only reload when the saved day is inside the month being displayed.
      if (monthKeyOf(form.date) === month) await load();
      return true;
    } catch (err) {
      console.error('[useMyStaffAttendance] save failed', err);
      setError(err instanceof Error ? err.message : 'Could not save your attendance.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [collegeId, facultyId, facultyName, department, form, month, load]);

  /** Rollup of just this faculty member, for the stats strip. */
  const summary = useMemo(
    () =>
      summarizeByFaculty(
        records,
        [{ id: facultyId, name: facultyName, department }],
        range,
      )[0],
    [records, facultyId, facultyName, department, range],
  );

  const recordForDate = useCallback(
    (date: string) => records.find((r) => r.date === date) ?? null,
    [records],
  );

  return {
    collegeId,
    facultyId,
    facultyName,
    department,
    month,
    setMonth,
    range,
    form,
    setForm,
    records,
    recordForDate,
    selectDate,
    save,
    reload: load,
    loading,
    saving,
    error,
    setError,
    savedAt,
    summary,
    today: todayKey(),
  };
}

export default useMyStaffAttendance;
