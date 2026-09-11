// src/modules/admin/components/FacultyAttendanceTodayCard.tsx
//
// The at-a-glance staff attendance tile on the principal dashboard's Overview
// tab. It deliberately fetches only TODAY (not the whole month) — the tab that
// needs the full analysis is one click away, and loading a month of records to
// render four numbers would be a waste of reads on every dashboard visit.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Loader2, UserX } from 'lucide-react';

import {
  fetchCollegeStaffAttendance,
  fetchStaffRoster,
} from '@/shared/api/staffAttendanceApi';
import {
  attendancePercentage,
  attendedDays,
  emptyCounts,
  addCount,
  todayKey,
} from '@/shared/utils/staffAttendanceStats';
import { STAFF_STATUS_LABEL, STAFF_STATUS_STYLE, type StaffAttendanceRecord } from '@/shared/types/staffAttendance';

export default function FacultyAttendanceTodayCard({ collegeId }: { collegeId: string | undefined }) {
  const navigate = useNavigate();
  const today = todayKey();
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [rosterSize, setRosterSize] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [recs, roster] = await Promise.all([
        fetchCollegeStaffAttendance(collegeId, today, today),
        fetchStaffRoster(collegeId),
      ]);
      setRecords(recs);
      setRosterSize(roster.length);
    } catch (err) {
      // A failed tile must not take the dashboard down with it.
      console.warn('[FacultyAttendanceTodayCard] load failed', err);
    } finally {
      setLoading(false);
    }
  }, [collegeId, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    let counts = emptyCounts();
    for (const r of records) counts = addCount(counts, r.status);
    const marked = records.length;
    return {
      counts,
      marked,
      unmarked: Math.max(rosterSize - marked, 0),
      rosterSize,
      percentage: attendancePercentage(attendedDays(counts), marked),
    };
  }, [records, rosterSize]);

  const openPanel = () => navigate('/admin/faculty-attendance');

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <BadgeCheck size={18} className="text-teal-600 dark:text-teal-400" />
            Faculty attendance today
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Self-marked by staff</p>
        </div>
        <button
          onClick={openPanel}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal-600 transition-colors hover:bg-teal-500/10 dark:text-teal-400"
        >
          Analyse <ArrowRight size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-400">
          <Loader2 className="mr-2 animate-spin" size={16} /> Loading…
        </div>
      ) : rosterSize === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
          No active faculty linked to this college yet.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.counts.present + stats.counts.late + stats.counts.onduty + stats.counts.wfh}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">In today</p>
            </div>
            <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-950/30">
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">
                {stats.counts.leave + stats.counts.medical}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">On leave</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.unmarked}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Not marked</p>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.marked} of {stats.rosterSize} faculty marked</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{stats.percentage}% present</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(stats.percentage, 100)}%` }} />
          </div>

          {stats.unmarked > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <UserX size={13} />
              {stats.unmarked} faculty have not marked attendance for today.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(['present', 'late', 'halfday', 'leave', 'medical', 'onduty', 'wfh', 'absent'] as const)
              .filter((s) => stats.counts[s] > 0)
              .map((s) => (
                <span key={s} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STAFF_STATUS_STYLE[s].chip}`}>
                  {STAFF_STATUS_LABEL[s]} · {stats.counts[s]}
                </span>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
