// src/modules/student/pages/StudentCurriculumPage.tsx
// ------------------------------------------------------------------
// "What am I studying?" — every subject mapped to the student's cohort, its
// modules and topics, split into Completed / Current / Upcoming, plus the
// scheduled classes for the next two weeks with the topics each one covers.
//
// Every figure is computed server-side by `getMyCurriculum` from the real
// curriculum plan, the class sessions faculty have completed and the faculty
// topic ledger. No progress is guessed; where nothing is mapped the page says
// so instead of showing zeros.
// ------------------------------------------------------------------
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  Calendar,
  MapPin,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
  Layers,
  PlayCircle,
} from 'lucide-react';
import {
  useMyCurriculum,
  type StudentModule,
  type StudentSubject,
  type StudentTopic,
  type StudentSessionSummary,
  type TopicState,
} from '../hooks/useMyCurriculum';

// ── Presentation helpers ────────────────────────────────────────────

const STATE_META: Record<TopicState, { label: string; chip: string; dot: React.ReactNode; bar: string }> = {
  completed: {
    label: 'Completed',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    bar: 'bg-emerald-500',
  },
  current: {
    label: 'Current',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dot: <PlayCircle className="w-4 h-4 text-amber-500" />,
    bar: 'bg-amber-500',
  },
  upcoming: {
    label: 'Upcoming',
    chip: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    dot: <Circle className="w-4 h-4 text-slate-400" />,
    bar: 'bg-slate-300 dark:bg-slate-600',
  },
};

type Filter = 'all' | TopicState;

function fmtDate(key: string | null | undefined): string {
  if (!key) return '';
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function fmtDateLong(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  if (Number.isNaN(d.getTime())) return key;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function StatCard({ label, value, hint, tone, icon }: { label: string; value: string; hint?: string; tone: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-slate-500">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-extrabold tracking-tight ${tone}`}>{value}</p>
      {hint ? <p className="text-[11px] text-slate-500 mt-1">{hint}</p> : null}
    </div>
  );
}

function ProgressBar({ completed, current, total }: { completed: number; current: number; total: number }) {
  const done = total ? (completed / total) * 100 : 0;
  const cur = total ? (current / total) * 100 : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
      <div className="h-full bg-emerald-500" style={{ width: `${done}%` }} />
      <div className="h-full bg-amber-400" style={{ width: `${cur}%` }} />
    </div>
  );
}

function TopicRow({ topic }: { topic: StudentTopic }) {
  const meta = STATE_META[topic.state];
  return (
    <li className="flex items-start gap-3 py-2">
      <span className="mt-0.5 shrink-0">{meta.dot}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${topic.state === 'completed' ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300' : 'text-slate-800 dark:text-slate-100'}`}>
          {topic.title}
        </p>
        {topic.state === 'completed' && topic.coveredOn && (
          <p className="text-[11px] text-slate-400">Taught on {fmtDate(topic.coveredOn)}</p>
        )}
        {topic.state !== 'completed' && topic.plannedOn && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400">Scheduled for {fmtDate(topic.plannedOn)}</p>
        )}
      </div>
      <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.chip}`}>{meta.label}</span>
    </li>
  );
}

function ModuleCard({ module, filter }: { module: StudentModule; filter: Filter }) {
  const [open, setOpen] = useState(module.state === 'current');
  const meta = STATE_META[module.state];
  const topics = filter === 'all' ? module.topics : module.topics.filter((t) => t.state === filter);
  if (filter !== 'all' && topics.length === 0) return null;

  return (
    <div className={`rounded-xl border ${module.state === 'current' ? 'border-amber-300 dark:border-amber-700/60' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-[#0f1729]`}>
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        {open ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {module.moduleNo ? `Module ${module.moduleNo}: ` : ''}{module.moduleName}
            </p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.chip}`}>{meta.label}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex-1 max-w-xs"><ProgressBar completed={module.completed} current={module.current} total={module.total} /></div>
            <span className="text-[11px] text-slate-500 whitespace-nowrap">
              {module.completed}/{module.total} done{module.hours ? ` · ${module.hours}h` : ''}
            </span>
          </div>
        </div>
      </button>
      {open && (
        <ul className="px-4 pb-3 divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
          {topics.length === 0 ? (
            <li className="py-3 text-xs text-slate-500">No topics listed in this module.</li>
          ) : (
            topics.map((t, i) => <TopicRow key={`${t.title}-${i}`} topic={t} />)
          )}
        </ul>
      )}
    </div>
  );
}

function SessionChip({ s, compact = false }: { s: StudentSessionSummary; compact?: boolean }) {
  const isToday = s.date === todayKey();
  return (
    <div className={`rounded-xl border p-3 ${isToday ? 'border-teal-300 dark:border-teal-700 bg-teal-50/60 dark:bg-teal-900/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1729]'}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {isToday ? 'Today' : fmtDateLong(s.date)} · {s.startTime}{s.endTime ? `–${s.endTime}` : ''}
        </p>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          s.status === 'completed' ? STATE_META.completed.chip : s.status === 'ongoing' ? STATE_META.current.chip : STATE_META.upcoming.chip
        }`}>
          {s.status === 'completed' ? 'Taught' : s.status === 'ongoing' ? 'In class' : 'Scheduled'}
        </span>
      </div>
      {!compact && (
        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">{s.subject}{s.subjectCode ? <span className="text-slate-400 font-normal"> · {s.subjectCode}</span> : null}</p>
      )}
      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
        {s.facultyName && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{s.facultyName}</span>}
        {s.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.room}</span>}
      </div>
      {s.topics.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {s.topics.map((t, i) => (
            <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{t}</span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[11px] italic text-slate-400">Topic not announced yet</p>
      )}
    </div>
  );
}

function SubjectCard({ subject, filter }: { subject: StudentSubject; filter: Filter }) {
  const [tab, setTab] = useState<'topics' | 'classes'>('topics');
  const visibleModules = subject.modules.filter((m) =>
    filter === 'all' ? true : m.topics.some((t) => t.state === filter)
  );
  if (filter !== 'all' && visibleModules.length === 0) return null;

  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] shadow-sm overflow-hidden">
      <header className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">{subject.courseCode || 'Subject'}</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">{subject.courseName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {subject.facultyName ? `Taught by ${subject.facultyName}` : 'Faculty to be announced'}
              {subject.credits ? ` · ${subject.credits} credits` : ''}
              {subject.totalHours ? ` · ${subject.totalHours} hrs` : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{subject.totals.pct}%</p>
            <p className="text-[11px] text-slate-500">syllabus covered</p>
          </div>
        </div>
        <div className="mt-3"><ProgressBar completed={subject.totals.completed} current={subject.totals.current} total={subject.totals.total} /></div>
        <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{subject.totals.completed} completed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{subject.totals.current} current</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />{subject.totals.upcoming} upcoming</span>
        </div>
        <div className="flex gap-1 mt-4">
          {(['topics', 'classes'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === k ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {k === 'topics' ? `Topics (${subject.totals.total})` : `Classes (${subject.upcomingSessions.length} upcoming)`}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-3">
        {tab === 'topics' ? (
          subject.modules.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">The syllabus for this subject has not been uploaded yet.</p>
          ) : (
            subject.modules.map((m) => <ModuleCard key={`${m.moduleNo}-${m.moduleName}`} module={m} filter={filter} />)
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Upcoming classes</p>
              {subject.upcomingSessions.length === 0 ? (
                <p className="text-xs text-slate-500">No classes scheduled in the next two weeks.</p>
              ) : (
                <div className="space-y-2">{subject.upcomingSessions.map((s) => <SessionChip key={s.id} s={s} compact />)}</div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Recently taught</p>
              {subject.recentSessions.length === 0 ? (
                <p className="text-xs text-slate-500">No completed classes recorded yet.</p>
              ) : (
                <div className="space-y-2">{subject.recentSessions.map((s) => <SessionChip key={s.id} s={s} compact />)}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

export default function StudentCurriculumPage() {
  const { data, loading, error, refetch } = useMyCurriculum();
  const [filter, setFilter] = useState<Filter>('all');
  const navigate = useNavigate();

  const currentTopics = useMemo(() => {
    if (!data) return [] as Array<{ subject: string; topic: StudentTopic }>;
    const out: Array<{ subject: string; topic: StudentTopic }> = [];
    for (const s of data.subjects) for (const m of s.modules) for (const t of m.topics) if (t.state === 'current') out.push({ subject: s.courseName, topic: t });
    return out.slice(0, 12);
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto">
        {[0, 1, 2].map((k) => <div key={k} className="h-28 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-900/10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-300">Could not load your curriculum</p>
            <p className="text-sm text-rose-600/80 dark:text-rose-300/80 mt-1">{error}</p>
            <button onClick={() => void refetch()} className="mt-3 text-sm font-semibold text-rose-700 dark:text-rose-300 underline">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" /> My Curriculum
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.student.branch}{data.student.batch ? ` · Batch ${data.student.batch}` : ''}{data.student.semester ? ` · Semester ${data.student.semester}` : ''}{data.student.division ? ` · Division ${data.student.division}` : ''}
          </p>
        </div>
        <button onClick={() => void refetch()} className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {data.noCurriculumAssigned ? (
        <div className="p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
          <p className="font-bold text-slate-800 dark:text-slate-100">No curriculum has been mapped to your class yet</p>
          <p className="text-sm text-slate-500 mt-1">
            Your college has not assigned subjects to {data.student.branch || 'your branch'}{data.student.semester ? ` semester ${data.student.semester}` : ''}{data.student.batch ? ` (batch ${data.student.batch})` : ''} yet.
            Once the admin maps the syllabus and faculty, every subject, module and topic will appear here with live progress.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Subjects" value={String(data.totals.subjects)} tone="text-slate-800 dark:text-slate-100" icon={<Layers className="w-4 h-4" />} />
            <StatCard label="Completed" value={String(data.totals.completed)} hint={`${data.totals.pct}% of ${data.totals.topics} topics`} tone="text-emerald-600 dark:text-emerald-400" icon={<CheckCircle2 className="w-4 h-4" />} />
            <StatCard label="Current" value={String(data.totals.current)} hint="being taught now" tone="text-amber-600 dark:text-amber-400" icon={<PlayCircle className="w-4 h-4" />} />
            <StatCard label="Upcoming" value={String(data.totals.upcoming)} hint="still to come" tone="text-slate-600 dark:text-slate-300" icon={<Clock className="w-4 h-4" />} />
          </div>

          {/* Now studying + next classes */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-2 rounded-3xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300 flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> Currently studying</p>
              {currentTopics.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">Nothing is in progress right now.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {currentTopics.map(({ subject, topic }, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-slate-800 dark:text-slate-100 font-medium">{topic.title}</p>
                      <p className="text-[11px] text-slate-500">{subject}{topic.plannedOn ? ` · ${fmtDate(topic.plannedOn)}` : ''}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="lg:col-span-3 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Next classes (14 days)</p>
                <button onClick={() => navigate('/student/timetable')} className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline">Full timetable →</button>
              </div>
              {data.upcomingClasses.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">No classes have been scheduled for your class in the next two weeks.</p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {data.upcomingClasses.slice(0, 6).map((s) => <SessionChip key={s.id} s={s} />)}
                </div>
              )}
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Show</span>
            {(['all', 'current', 'upcoming', 'completed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {f === 'all' ? 'All topics' : STATE_META[f].label}
              </button>
            ))}
          </div>

          {/* Subjects */}
          <div className="space-y-5">
            {data.subjects.map((s) => <SubjectCard key={`${s.curriculumId}-${s.courseCode}-${s.courseName}`} subject={s} filter={filter} />)}
          </div>
        </>
      )}
    </div>
  );
}
