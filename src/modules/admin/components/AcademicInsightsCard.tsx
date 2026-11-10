// src/modules/admin/components/AcademicInsightsCard.tsx
//
// The at-a-glance academic tile on the principal dashboard's Overview tab.
// The dashboard used to show users/departments only — no answer to "how is
// the teaching going". This card surfaces the four numbers that matter
// (syllabus covered, classes delivered, attendance, average score) and links
// into the full semester → subject → student drill-down.
//
// Like FacultyAttendanceTodayCard it stays cheap: one call, module-level
// cache with a short TTL so tab-hopping on the dashboard does not re-read.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, Loader2, School } from 'lucide-react';

import {
  getAcademicInsights,
  type AcademicInsightsResult,
} from '../api/academicInsightsApi';

const CACHE_TTL_MS = 60_000;
let cache: { at: number; data: AcademicInsightsResult } | null = null;

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
      {hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

export default function AcademicInsightsCard({ collegeId }: { collegeId: string | undefined }) {
  const navigate = useNavigate();
  const [data, setData] = useState<AcademicInsightsResult | null>(
    cache && Date.now() - cache.at < CACHE_TTL_MS ? cache.data : null
  );
  const [loading, setLoading] = useState(!data);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      setData(cache.data);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await getAcademicInsights(collegeId ? { collegeId } : {});
        if (!cancelled) {
          cache = { at: Date.now(), data: result };
          setData(result);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collegeId]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <BookOpenCheck size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Academic Insights</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Curriculum coverage, classes, attendance and scores
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/academic-insights')}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Open drill-down <ArrowRight size={15} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 py-6">
          <Loader2 size={16} className="animate-spin" /> Computing insights…
        </div>
      ) : failed && !data ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
          Insights are unavailable right now.{' '}
          <button
            onClick={() => navigate('/admin/academic-insights')}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Open the insights page
          </button>{' '}
          to retry.
        </p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat
              label="Syllabus covered"
              value={`${data.totals.topics.pct}%`}
              hint={`${data.totals.topics.covered} of ${data.totals.topics.total} topics`}
            />
            <MiniStat
              label="Classes delivered"
              value={String(data.totals.sessions.completed)}
              hint={`of ${data.totals.sessions.total} · ${data.totals.sessions.scheduled} scheduled`}
            />
            <MiniStat
              label="Attendance"
              value={data.totals.attendance.marked ? `${data.totals.attendance.pct}%` : '—'}
              hint={data.totals.attendance.marked ? 'marked present' : 'not marked yet'}
            />
            <MiniStat
              label="Average score"
              value={data.totals.assessments.graded ? `${data.totals.assessments.avgPct}%` : '—'}
              hint={`${data.totals.assessments.total} assessments`}
            />
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 text-xs text-slate-500 dark:text-slate-400">
            <School size={14} />
            <span>
              {data.totals.subjectCount} subjects across {data.semesters.length} semester
              {data.semesters.length === 1 ? '' : 's'} — dig into any subject down to its individual
              students.
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
