// src/modules/faculty/hooks/useMyStaffAttendance.ts
//
// State for a faculty member marking THEIR OWN attendance.
//
// Identity comes from AuthContext — never from a URL parameter or a form
// field. A faculty member can only ever write the document their own uid owns;
// current-firestore.rules enforces the same thing server-side.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  fetchMyStaffAttendance,
  fetchStaffAttendanceForDate,
  saveStaffAttendance,
} from '@/shared/api/staffAttendanceApi';
import { ensureIdentityClaims } from '@/shared/services/identitySelfHeal';
import { isPermissionDeniedError, staleClaimMessage } from '@/shared/utils/identityClaims';
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

  // How many times this session has asked syncMyIdentity to re-issue the
  // token claims. One attempt per page mount: after that, further denials
  // get the actionable message instead of re-calling the function.
  const healAttempts = useRef(0);

  // selectDate reads the month records through a ref (not a dependency) on
  // purpose: the page re-runs selectDate(today) whenever the callback's
  // identity changes, and keying it on records would yank the form back to
  // "today" the moment the month load — or the post-save reload — lands.
  const recordsRef = useRef<StaffAttendanceRecord[]>([]);
  recordsRef.current = records;

  const range: AttendanceRange = useMemo(() => monthRange(month), [month]);

  /**
   * The permanent self-heal, on demand: if the sign-in self-heal never ran
   * (or the token went stale mid-session — a superadmin just ran Identity
   * Repair, the token was minted by an older deployment, …) a permission
   * denial on this page triggers it here. Resolves true only when the claims
   * were actually re-issued and the force-refreshed token now agrees, which
   * is the one case where retrying the failed operation can succeed.
   */
  const selfHealOnce = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    if (healAttempts.current > 0) return false;
    healAttempts.current += 1;
    try {
      const outcome = await ensureIdentityClaims({
        role: user.role,
        collegeId: user.collegeId ?? null,
      });
      if (outcome !== 'refreshed') {
        console.warn('[useMyStaffAttendance] claim self-heal did not re-issue claims:', outcome);
      }
      return outcome === 'refreshed';
    } catch (err) {
      console.warn('[useMyStaffAttendance] claim self-heal failed:', err);
      return false;
    }
  }, [user]);

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
      if (isPermissionDeniedError(err) && (await selfHealOnce())) {
        // The token was stale; the fresh one may now be authorised.
        try {
          setRecords(await fetchMyStaffAttendance(facultyId, bounds.start, bounds.end));
          return;
        } catch (retryErr) {
          console.error('[useMyStaffAttendance] load failed after claim refresh', retryErr);
          setError(staleClaimMessage('attendance load'));
          return;
        }
      }
      setError(
        isPermissionDeniedError(err)
          ? staleClaimMessage('attendance load')
          : err instanceof Error ? err.message : 'Could not load your attendance.',
      );
    } finally {
      setLoading(false);
    }
  }, [facultyId, month, selfHealOnce]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Pre-fill the form from the stored record for the selected day, if any. */
  const selectDate = useCallback(
    async (date: string) => {
      setForm(emptyForm(date));
      if (!collegeId || !facultyId) return;
      // The month load already told us which days are marked; pass that along
      // so the expected denial on an unmarked day's deterministic id stays
      // quiet instead of flooding the console with "single-day read failed".
      const existing = await fetchStaffAttendanceForDate(collegeId, facultyId, date, {
        expectExists: recordsRef.current.some((r) => r.date === date),
      });
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
    const params = {
      collegeId,
      facultyId,
      facultyName,
      department,
      date: form.date,
      status: form.status,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      note: form.note,
      source: 'self' as const,
      markedBy: facultyId,
    };
    try {
      try {
        await saveStaffAttendance(params);
      } catch (err) {
        // A tenant-scoped write is exactly where a stale collegeId claim
        // hurts: the rules compare the document's collegeId against the
        // token, not the profile. Re-issue the claims and try once more —
        // the write is an idempotent upsert, so the retry cannot duplicate.
        if (isPermissionDeniedError(err) && (await selfHealOnce())) {
          await saveStaffAttendance(params);
        } else {
          throw err;
        }
      }
      setSavedAt(new Date().toISOString());
      // Only reload when the saved day is inside the month being displayed.
      if (monthKeyOf(form.date) === month) await load();
      return true;
    } catch (err) {
      console.error('[useMyStaffAttendance] save failed', err);
      setError(
        isPermissionDeniedError(err)
          ? staleClaimMessage('attendance save')
          : err instanceof Error ? err.message : 'Could not save your attendance.',
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [collegeId, facultyId, facultyName, department, form, month, load, selfHealOnce]);

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
