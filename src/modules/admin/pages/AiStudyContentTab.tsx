// src/modules/admin/pages/AiStudyContentTab.tsx
//
// Admin Settings → "AI Content & Cost" tab — INTERNAL PLATFORM VIEW.
//
// This surface (spend meter, token usage, daily caps, exam freezes,
// pre-warm runner) is visible to SUPERADMIN ONLY. It is deliberately never
// shown to college staff: cost data is platform-internal. The server
// enforces this independently — /ai/study-material/controls 403s any
// non-superadmin — so the tab is convenience, not the boundary.
//
// What it manages (guards from functions/src/routes/ai-chat.ts):
//   - TODAY's spend meter (serves vs generations vs real token counts) — the
//     provider billing console lags ~24h, this is real time; plus the
//     per-campus breakdown across every college.
//   - Per-campus limits: student daily new-topic cap + campus circuit
//     breaker (target any campus by collegeId).
//   - Exam freeze windows: pause ALL new generation during internal
//     assessments while cached packs keep serving for free.
//   - Pre-warm: bulk-generate every module of a subject BEFORE the rush so
//     students only ever ride free cache hits.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Sparkles, Loader2, RefreshCw, AlertTriangle, Check, Info, Zap,
  Gauge, Snowflake, Plus, Trash2, BookOpen, Globe2, Play,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import {
  getStudyMaterialControls,
  updateStudyMaterialControls,
  prewarmAIStudyMaterials,
  type StudyMaterialControls,
  type PrewarmModuleResult,
} from '@/shared/services/aiStudyMaterialService';

const fmt = (n?: number) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none p-5 ${className}`}>
      {children}
    </div>
  );
}

function Note({ type, text }: { type: 'ok' | 'err' | 'info'; text: string }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
    err: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  };
  const Icon = type === 'ok' ? Check : type === 'err' ? AlertTriangle : Info;
  return (
    <div className={`p-3 rounded-xl text-xs font-semibold border flex items-start gap-2 ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all
  bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700/50
  text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500
  focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500
  disabled:opacity-50 disabled:cursor-not-allowed`;

const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide';

const statusChip = (status: string) => {
  const map: Record<string, string> = {
    generated: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    cached: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    error: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    limited: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  };
  return map[status] || map.cached;
};

export default function AiStudyContentTab() {
  const { user } = useAuth();
  const role = user?.role || '';
  // Internal platform view: editing and even READING are superadmin-only
  // (mirrors the server's 403; college staff must not see cost data).
  const canEdit = role === 'superadmin';
  const isSuperadmin = role === 'superadmin';

  // Superadmin targets a campus explicitly; staff are auto-scoped by claim.
  const [collegeInput, setCollegeInput] = useState('');
  const [appliedCollege, setAppliedCollege] = useState('');

  const [controls, setControls] = useState<StudyMaterialControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageErr, setPageErr] = useState<string | null>(null);

  const [studentLimit, setStudentLimit] = useState('');
  const [collegeLimit, setCollegeLimit] = useState('');
  const [limitsMsg, setLimitsMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingLimits, setSavingLimits] = useState(false);

  const [freezeStart, setFreezeStart] = useState('');
  const [freezeEnd, setFreezeEnd] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeMsg, setFreezeMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingFreeze, setSavingFreeze] = useState(false);

  const [pwSubject, setPwSubject] = useState('');
  const [pwCourseName, setPwCourseName] = useState('');
  const [pwCourseCode, setPwCourseCode] = useState('');
  const [pwSemester, setPwSemester] = useState('');
  const [pwTopics, setPwTopics] = useState('');
  const [pwRunning, setPwRunning] = useState(false);
  const [pwProgress, setPwProgress] = useState<{ processed: number; total: number } | null>(null);
  const [pwResults, setPwResults] = useState<PrewarmModuleResult[]>([]);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);

  const target = isSuperadmin && appliedCollege.trim() ? appliedCollege.trim() : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setPageErr(null);
    try {
      const data = await getStudyMaterialControls(target);
      setControls(data);
      setStudentLimit(String(data.config.studentDailyGenerationLimit));
      setCollegeLimit(String(data.config.collegeDailyGenerationLimit));
    } catch (err: any) {
      setPageErr(err?.message || 'Failed to load AI content controls.');
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveLimits = async () => {
    if (!controls) return;
    setSavingLimits(true);
    setLimitsMsg(null);
    try {
      await updateStudyMaterialControls(
        {
          studentDailyGenerationLimit: Number(studentLimit),
          collegeDailyGenerationLimit: Number(collegeLimit),
        },
        target
      );
      setLimitsMsg({ type: 'ok', text: 'Limits saved. They take effect on the next request.' });
      await load();
    } catch (err: any) {
      setLimitsMsg({ type: 'err', text: err?.message || 'Could not save limits.' });
    } finally {
      setSavingLimits(false);
    }
  };

  const saveFreezeWindows = async (windows: StudyMaterialControls['config']['freezeWindows'], okText: string) => {
    setSavingFreeze(true);
    setFreezeMsg(null);
    try {
      await updateStudyMaterialControls({ freezeWindows: windows }, target);
      setFreezeMsg({ type: 'ok', text: okText });
      setFreezeStart('');
      setFreezeEnd('');
      setFreezeReason('');
      await load();
    } catch (err: any) {
      setFreezeMsg({ type: 'err', text: err?.message || 'Could not update freeze windows.' });
    } finally {
      setSavingFreeze(false);
    }
  };

  const addFreezeWindow = async () => {
    if (!controls) return;
    if (!freezeStart || !freezeEnd) {
      setFreezeMsg({ type: 'err', text: 'Pick both a start and an end date/time.' });
      return;
    }
    const start = new Date(freezeStart);
    const end = new Date(freezeEnd);
    if (!(start < end)) {
      setFreezeMsg({ type: 'err', text: 'The freeze end must be after the start.' });
      return;
    }
    await saveFreezeWindows(
      [
        ...controls.config.freezeWindows,
        { start: start.toISOString(), end: end.toISOString(), ...(freezeReason.trim() ? { reason: freezeReason.trim() } : {}) },
      ],
      'Freeze window added. During it, cached packs still serve — only new generation is paused.'
    );
  };

  const runPrewarm = async () => {
    const topics = pwTopics
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);
    if (!pwSubject.trim() || topics.length === 0) {
      setPwMsg({ type: 'err', text: 'Enter a subject and at least one module topic (one per line).' });
      return;
    }
    if (topics.length > 40) {
      setPwMsg({ type: 'err', text: 'At most 40 module topics per run.' });
      return;
    }
    setPwRunning(true);
    setPwMsg(null);
    setPwResults([]);
    setPwProgress({ processed: 0, total: topics.length });
    try {
      const summary = await prewarmAIStudyMaterials(
        {
          subject: pwSubject.trim(),
          courseName: pwCourseName.trim() || undefined,
          courseCode: pwCourseCode.trim() || undefined,
          semester: pwSemester.trim() || undefined,
          modules: topics.map((topic, i) => ({ topic, moduleNo: i + 1 })),
        },
        (p) => setPwProgress({ processed: p.processed, total: p.total })
      );
      setPwResults(summary.results);
      const generated = summary.results.filter((r) => r.status === 'generated').length;
      const cached = summary.results.filter((r) => r.status === 'cached').length;
      const failed = summary.results.filter((r) => r.status === 'error').length;
      if (summary.limitedScope) {
        setPwMsg({
          type: 'info',
          text: `Pre-warm paused: the daily ${summary.limitedScope === 'college' ? 'campus budget' : 'account limit'} was reached. ${generated} generated, ${cached} already cached — re-run tomorrow to finish the rest for free.`,
        });
      } else {
        setPwMsg({
          type: 'ok',
          text: `Pre-warm complete: ${generated} newly generated, ${cached} already cached${failed ? `, ${failed} failed (retry them)` : ''}. Students now get instant, free cache hits.`,
        });
      }
      await load();
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err?.message || 'Pre-warm failed.' });
    } finally {
      setPwRunning(false);
    }
  };

  // Defense in depth: even if this component is ever mounted for a college
  // role (a route change, a copied link), it renders nothing — cost data is
  // internal. The server independently 403s the underlying endpoints.
  if (!isSuperadmin) return null;

  if (loading && !controls) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin" />
        <p className="text-sm">Loading AI content controls…</p>
      </div>
    );
  }

  if (pageErr && !controls) {
    return <Note type="err" text={pageErr} />;
  }

  if (!controls) return null;

  const hitRate =
    controls.today.serves + controls.today.generations > 0
      ? Math.round((controls.today.serves / (controls.today.serves + controls.today.generations)) * 100)
      : null;

  return (
    <div className="space-y-5">
      {/* Superadmin campus targeting */}
      {isSuperadmin && (
        <Card>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className={labelCls}>Target campus (superadmin)</label>
              <input
                className={inputCls}
                placeholder="collegeId — leave blank for global view"
                value={collegeInput}
                onChange={(e) => setCollegeInput(e.target.value)}
              />
            </div>
            <button
              onClick={() => setAppliedCollege(collegeInput)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors"
            >
              Load campus
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Viewing: {controls.collegeId ? `campus ${controls.collegeId}` : 'global (all campuses)'} — limits and freezes apply to the loaded campus.
          </p>
        </Card>
      )}

      {controls.freeze.frozen && (
        <Note
          type="info"
          text={`Generation is currently FROZEN for this campus until ${new Date(controls.freeze.until || '').toLocaleString()}${controls.freeze.reason ? ` — ${controls.freeze.reason}` : ''}. Cached packs still serve.`}
        />
      )}

      {/* Usage meter */}
      <Card>
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-teal-500" /> Today's usage ({controls.date}, UTC)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Real-time spend meter (provider billing lags ~24h). Serves are free cache hits; generations are paid LLM calls. Counters reset at UTC midnight (05:30 IST).
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="p-2 rounded-xl text-slate-400 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cache serves</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fmt(controls.today.serves)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Generations</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">{fmt(controls.today.generations)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Tokens in / out</p>
            <p className="text-xl font-black text-slate-800 dark:text-white mt-0.5">
              {fmt(controls.today.tokensIn)} <span className="text-slate-400 text-sm font-bold">/ {fmt(controls.today.tokensOut)}</span>
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Cache hit rate</p>
            <p className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5">{hitRate === null ? '—' : `${hitRate}%`}</p>
          </div>
        </div>

        {controls.global && (
          <div className="mt-5">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5" /> All campuses today — {fmt(controls.global.generations)} generations / {fmt(controls.global.serves)} serves
            </p>
            {Object.keys(controls.global.colleges || {}).length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-left">
                      <th className="px-3 py-2 font-bold">Campus</th>
                      <th className="px-3 py-2 font-bold text-right">Generations</th>
                      <th className="px-3 py-2 font-bold text-right">Serves</th>
                      <th className="px-3 py-2 font-bold text-right">Tokens (in/out)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(controls.global.colleges)
                      .sort((a, b) => (Number(b[1]?.generations) || 0) - (Number(a[1]?.generations) || 0))
                      .map(([cid, c]) => (
                        <tr key={cid} className="border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <td className="px-3 py-2 font-mono text-[11px]">{cid}</td>
                          <td className="px-3 py-2 text-right font-bold">{fmt(c?.generations)}</td>
                          <td className="px-3 py-2 text-right">{fmt(c?.serves)}</td>
                          <td className="px-3 py-2 text-right">{fmt(c?.tokensIn)} / {fmt(c?.tokensOut)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No campus activity yet today.</p>
            )}
          </div>
        )}
      </Card>

      {/* Limits */}
      <Card>
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-amber-500" /> Daily generation limits
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Cache serves are always unlimited and free — these caps only bound NEW generations (cold keys). Set 0 to disable a cap. Defaults: {controls.defaults.studentDailyGenerationLimit}/student, {controls.defaults.collegeDailyGenerationLimit}/campus.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Per student/parent (new topics per day)</label>
            <input className={inputCls} type="number" min={0} value={studentLimit} disabled={!canEdit} onChange={(e) => setStudentLimit(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Campus circuit breaker (all generations per day)</label>
            <input className={inputCls} type="number" min={0} value={collegeLimit} disabled={!canEdit} onChange={(e) => setCollegeLimit(e.target.value)} />
          </div>
        </div>
        {limitsMsg && <div className="mt-3"><Note type={limitsMsg.type} text={limitsMsg.text} /></div>}
        {canEdit && (
          <button
            onClick={() => void saveLimits()}
            disabled={savingLimits}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
          >
            {savingLimits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save limits
          </button>
        )}
      </Card>

      {/* Exam freeze windows */}
      <Card>
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
          <Snowflake className="w-4 h-4 text-sky-500" /> Exam freeze windows
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          During a freeze, students keep reading cached packs for free but NO new packs can be generated or regenerated — spend and exam-season misuse both drop to zero.
        </p>
        {controls.config.freezeWindows.length === 0 ? (
          <p className="text-xs text-slate-400 mb-4">No freeze windows configured.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {controls.config.freezeWindows.map((w, i) => (
              <div key={`${w.start}-${i}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                <Snowflake className="w-4 h-4 text-sky-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {new Date(w.start).toLocaleString()} → {new Date(w.end).toLocaleString()}
                  </p>
                  {w.reason && <p className="text-[11px] text-slate-400 truncate">{w.reason}</p>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => void saveFreezeWindows(controls.config.freezeWindows.filter((_, j) => j !== i), 'Freeze window removed.')}
                    disabled={savingFreeze}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    title="Remove window"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {canEdit && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className={labelCls}>Starts</label>
              <input className={inputCls} type="datetime-local" value={freezeStart} onChange={(e) => setFreezeStart(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Ends</label>
              <input className={inputCls} type="datetime-local" value={freezeEnd} onChange={(e) => setFreezeEnd(e.target.value)} />
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Reason (optional)</label>
              <input className={inputCls} placeholder="e.g. Internal Assessments" value={freezeReason} onChange={(e) => setFreezeReason(e.target.value)} />
            </div>
            <button
              onClick={() => void addFreezeWindow()}
              disabled={savingFreeze}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {savingFreeze ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add freeze
            </button>
          </div>
        )}
        {freezeMsg && <div className="mt-3"><Note type={freezeMsg.type} text={freezeMsg.text} /></div>}
      </Card>

      {/* Pre-warm */}
      {canEdit && (
        <Card>
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-teal-500" /> Pre-warm a subject's study packs
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Generate every module's pack once, calmly, before students ask. After that, the whole campus rides free cache hits and the per-student daily cap never bites. Already-cached modules are skipped at zero cost — safe to re-run.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Subject *</label>
              <input className={inputCls} placeholder="e.g. Cost Accounting" value={pwSubject} onChange={(e) => setPwSubject(e.target.value)} disabled={pwRunning} />
            </div>
            <div>
              <label className={labelCls}>Course name</label>
              <input className={inputCls} placeholder="e.g. B.Com" value={pwCourseName} onChange={(e) => setPwCourseName(e.target.value)} disabled={pwRunning} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Course code</label>
                <input className={inputCls} placeholder="e.g. COM-301" value={pwCourseCode} onChange={(e) => setPwCourseCode(e.target.value)} disabled={pwRunning} />
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <input className={inputCls} placeholder="e.g. 5" value={pwSemester} onChange={(e) => setPwSemester(e.target.value)} disabled={pwRunning} />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Module topics — one per line (max 40) *</label>
            <textarea
              className={`${inputCls} min-h-[110px] font-mono text-xs`}
              placeholder={'Marginal Costing\nBreak-even Analysis\nStandard Costing'}
              value={pwTopics}
              onChange={(e) => setPwTopics(e.target.value)}
              disabled={pwRunning}
            />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => void runPrewarm()}
              disabled={pwRunning}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {pwRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {pwRunning ? 'Pre-warming…' : 'Start pre-warm'}
            </button>
            {pwProgress && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {pwProgress.processed} / {pwProgress.total} modules
              </p>
            )}
          </div>
          {pwRunning && pwProgress && (
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all duration-500"
                style={{ width: `${Math.round((pwProgress.processed / Math.max(pwProgress.total, 1)) * 100)}%` }}
              />
            </div>
          )}
          {pwMsg && <div className="mt-3"><Note type={pwMsg.type} text={pwMsg.text} /></div>}
          {pwResults.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {pwResults.map((r, i) => (
                <div key={`${r.topic}-${i}`} className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${statusChip(r.status)}`}>
                    {r.status}{r.version ? ` · v${r.version}` : ''}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">{r.topic}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-teal-500" />
        Students always receive the shared cached pack instantly; only staff can regenerate, each topic at most once every 15 minutes, and concurrent requests share a single paid generation.
      </p>
    </div>
  );
}
