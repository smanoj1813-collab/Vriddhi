// src/modules/student/components/StudentAcademicSummary.tsx
// ------------------------------------------------------------------
// The student's deterministic "today" summary, powered entirely by the
// `getMyStudentAcademicContext` callable (asia-south1). The backend decides
// everything — cohort-targeted classes, pending assignments, upcoming
// assessments and the attendance percentage — so this component only
// renders what arrived.
//
// State contract:
//   loading            → skeleton rows (no data yet)
//   { enabled:false }  → renders nothing (feature gate off; UI must not break)
//   error              → compact, actionable alert with a retry button
//                        (session expired / access / profile-linkage wording
//                        comes from the shared error mapping)
//   loaded             → the four summary panels, each with its own empty state
// ------------------------------------------------------------------
import { Link } from 'react-router-dom';
import {
  BookOpen, CalendarX2, ChevronRight, Clock, FileText, GraduationCap,
  MapPin, RefreshCw, BarChart3,
} from 'lucide-react';
import { useMyAcademicContext } from '../hooks/useMyAcademicContext';
import { sortTestsByStart, type AcademicContextClass } from '@/shared/api/academicContext';
import { deadlineCountdown } from '../utils/deadlineCountdown';

const MAX_PER_PANEL = 4;

function formatDateTime(value: string | undefined): string {
  if (!value) return 'Schedule pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

function ClassRow({ item }: { item: AcademicContextClass }) {
  const statusMeta: Record<string, { label: string; cls: string }> = {
    completed: { label: 'Taught', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    ongoing: { label: 'In class', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    cancelled: { label: 'Cancelled', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  };
  const badge = statusMeta[String(item.status || '').toLowerCase()];
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
      <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 shrink-0">
        <Clock className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.subject || 'Class'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
          {item.facultyName || 'Faculty Member'}
          {item.room ? ` · ${item.room}` : ''}
        </p>
        {item.topics && item.topics.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.topics.slice(0, 3).map((topic, index) => (
              <span key={index} className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.startTime || '--:--'}</p>
        {badge && <span className={`mt-1 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>}
      </div>
    </div>
  );
}

function PanelHeader({ icon: Icon, title, to, count }: {
  icon: React.ElementType; title: string; to?: string; count?: number;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Icon className="w-4 h-4 text-teal-600" />
        {title}
        {typeof count === 'number' && (
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
            {count}
          </span>
        )}
      </h3>
      {to && (
        <Link to={to} className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm" aria-busy="true">
      <div className="h-4 w-52 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900/60 animate-pulse" />
            <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentAcademicSummary() {
  const { context, disabled, loading, error, refetch } = useMyAcademicContext();

  // Feature gate off: the deterministic academic backend is disabled for this
  // deployment. Quietly render nothing — the rest of the dashboard is
  // unaffected (acceptance: a disabled response must not break the UI).
  if (disabled && !error) return null;

  if (error && !context) {
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 flex flex-wrap items-center gap-3"
        role="alert"
      >
        <CalendarX2 className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex-1 min-w-[12rem]">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!context) {
    if (loading) return <SummarySkeleton />;
    return null;
  }

  const tests = sortTestsByStart(context.upcomingTests);
  const attendance = context.attendance;
  const attendedRecords = attendance.records.length;

  return (
    <section
      className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm"
      aria-label="Academic summary"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" />
            Your day, {context.generatedFor}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cohort-scoped summary served by your college's academic service.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Today's classes */}
        <div>
          <PanelHeader icon={Clock} title="Today's classes" count={context.classes.length} to="/student/timetable" />
          <div className="space-y-2">
            {context.classes.length > 0 ? (
              context.classes.slice(0, MAX_PER_PANEL).map((item) => <ClassRow key={item.id} item={item} />)
            ) : (
              <EmptyNote text="No classes scheduled today." />
            )}
          </div>
        </div>

        {/* Pending assignments */}
        <div>
          <PanelHeader icon={FileText} title="Pending assignments" count={context.pendingAssignments.length} to="/student/assignments" />
          <div className="space-y-2">
            {context.pendingAssignments.length > 0 ? (
              context.pendingAssignments.slice(0, MAX_PER_PANEL).map((item) => {
                const countdown = deadlineCountdown(item.dueDate);
                return (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                      {item.courseName || item.courseCode || 'Course pending'}
                      {item.dueDate ? ` · Due ${formatDateTime(item.dueDate).split(',').pop()?.trim() || item.dueDate}` : ''}
                    </p>
                    {countdown && (
                      <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        countdown.tone === 'overdue'
                          ? 'text-rose-700 dark:text-rose-300 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                          : countdown.tone === 'soon'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-700'
                      }`}>
                        <Clock className="w-2.5 h-2.5" /> {countdown.text}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <EmptyNote text="Nothing pending — you're all caught up." />
            )}
          </div>
        </div>

        {/* Upcoming assessments */}
        <div>
          <PanelHeader icon={BookOpen} title="Upcoming assessments" count={tests.length} to="/student/assessments" />
          <div className="space-y-2">
            {tests.length > 0 ? (
              tests.slice(0, MAX_PER_PANEL).map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium">
                    {item.subject || 'Subject pending'}
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {formatDateTime(item.startDateTime)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyNote text="No assessments scheduled." />
            )}
          </div>
        </div>

        {/* Attendance summary */}
        <div>
          <PanelHeader icon={BarChart3} title="Attendance" to="/student/attendance" />
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            {attendedRecords > 0 ? (
              <>
                <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                  {attendance.percentage ?? 0}%
                </p>
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, attendance.percentage ?? 0)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {attendance.present} present · {attendance.absent} absent · {attendedRecords} record{attendedRecords === 1 ? '' : 's'}
                </p>
              </>
            ) : (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                No attendance records yet.
              </p>
            )}
          </div>
          <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {context.curriculum.length} course{context.curriculum.length === 1 ? '' : 's'} in your curriculum
            </p>
            {context.curriculum.slice(0, 2).map((course) => (
              <p key={course.id} className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {course.courseCode} · {course.courseName}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
