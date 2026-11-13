import { lazy, Suspense, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check, CircleAlert, Clock3, Info, RefreshCw, Settings2, ShieldAlert } from 'lucide-react';
import RoleWelcomeBanner from '../components/RoleWelcomeBanner';
import RiskPushControl from '../components/RiskPushControl';
import { useAcademicRiskAlerts } from '../hooks/useAcademicRiskAlerts';
import { RISK_CATEGORY_LABELS, activeRiskAlerts, riskCheckedLabel, riskErrorMessage, safeRiskActionPath } from '../utils/riskAlertPresentation';
import type { AcademicRiskAlert } from '../services/riskAlertsApi';

const AcademicRiskSettings = lazy(() => import('../components/AcademicRiskSettings'));
const control = 'portal-motion-target inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-teal-500 disabled:opacity-50 disabled:cursor-not-allowed';

function AlertCard({ alert, role, ownUid, marking, markRead }: { alert: AcademicRiskAlert; role?: string; ownUid: string; marking: boolean; markRead: () => void }) {
  const heading = useId();
  const historical = ['resolved', 'archived'].includes(alert.state);
  return <article aria-labelledby={heading} className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 ${historical ? 'border-slate-200 dark:border-slate-700' : alert.severity === 'critical' ? 'border-rose-200 dark:border-rose-900/70' : 'border-amber-200 dark:border-amber-900/70'}`}>
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
      <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200">{RISK_CATEGORY_LABELS[alert.category]}</span>
      <span className={alert.severity === 'critical' ? 'text-rose-800 dark:text-rose-300' : 'text-amber-900 dark:text-amber-200'}>{historical ? alert.state : alert.severity === 'critical' ? 'Action needed' : 'Early warning'}</span>
      {!alert.read && <span className="text-teal-800 dark:text-teal-200">Unread</span>}
      {alert.state === 'unverified' && <span className="text-slate-600 dark:text-slate-300">Recheck needed — not confirmed current</span>}
    </div>
    {alert.subjectUid !== ownUid && <p className="mt-3 text-xs font-bold text-teal-800 dark:text-teal-200">Faculty · {alert.subjectName}</p>}
    <h2 id={heading} className="mt-2 text-base font-bold text-slate-900 dark:text-white break-words">{alert.title}</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 break-words whitespace-pre-line">{alert.message}</p>
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Link to={safeRiskActionPath(alert.path, role)} className="portal-motion-target rounded-xl bg-teal-700 px-3 py-2.5 text-xs font-bold text-white hover:bg-teal-800">Open {RISK_CATEGORY_LABELS[alert.category].toLowerCase()}</Link>
      {!alert.read && <button type="button" onClick={markRead} disabled={marking} className={control}><Check size={14} aria-hidden="true" className="portal-interactive-icon" />Mark read</button>}
      <span className="w-full sm:w-auto sm:ml-auto text-[11px] text-slate-600 dark:text-slate-400">Checked {riskCheckedLabel(alert.checkedAt)}</span>
    </div>
  </article>;
}
export default function AcademicRiskAlertsPage() {
  const { data, isPending, isError, error, refetch, isFetching, refresh, markRead, uid, user, eligible } = useAcademicRiskAlerts();
  const id = useId();
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState<'active' | 'history'>('active');
  const [showSettings, setShowSettings] = useState(false);
  const alerts = data?.alerts || [];
  const active = activeRiskAlerts(alerts);
  const coverage = alerts.filter(a => a.category === 'coverage' && ['active', 'unverified'].includes(a.state));
  const list = (mode === 'active' ? active : alerts.filter(a => a.category !== 'coverage' && ['resolved', 'archived'].includes(a.state))).filter(a => category === 'all' || a.category === category);
  const latest = data?.checkedAt || Math.max(0, ...alerts.map(a => a.checkedAt));
  const supervisor = ['principal', 'hod', 'admin'].includes(user?.role || '');
  if (!eligible) return <div role="alert" className="p-6 text-sm text-slate-700 dark:text-slate-200">Academic alerts require a verified faculty, student, HOD or Principal account.</div>;
  return <div className="space-y-5">
    <RoleWelcomeBanner role={user?.role || 'faculty'} headingLevel={1} title="Risk Alerts" subtitle={supervisor ? 'Faculty issues for your verified department or college. Each faculty alert is shared with that faculty member, the matching department HOD and the college Principal.' : 'Know what needs attention, understand the evidence and take the next step. Coverage gaps are not treated as confirmed risks.'} />
    <section aria-label="Alert inbox controls" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-auto flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><ShieldAlert size={19} aria-hidden="true" className="text-amber-800 dark:text-amber-200" />{active.length} attention item{active.length === 1 ? '' : 's'}</p>
        <button type="button" onClick={() => void refetch()} disabled={isFetching} className={control}><RefreshCw size={14} aria-hidden="true" className="portal-interactive-icon" />{isFetching ? 'Loading…' : 'Refresh inbox'}</button>
        {data?.canRefresh && <button type="button" onClick={() => refresh.mutate()} disabled={refresh.isPending} className={control}><BellRing size={14} aria-hidden="true" className="portal-interactive-icon" />{refresh.isPending ? 'Checking records…' : 'Check my records now'}</button>}
        {data?.canConfigure && <button type="button" aria-expanded={showSettings} aria-controls={`${id}-settings`} onClick={() => setShowSettings(v => !v)} className={control}><Settings2 size={14} aria-hidden="true" className="portal-interactive-icon" />Warning settings</button>}
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400"><Clock3 size={14} aria-hidden="true" className="mt-0.5 shrink-0" /><span>{supervisor ? 'Most recent received faculty check' : 'Last completed check'}: {riskCheckedLabel(latest)}. Background checks rotate through accounts; inbox refresh alone does not recompute records. {supervisor ? 'Missing department or recipient links appear as coverage warnings, not college-wide HOD broadcasts.' : 'Self-service checks can be requested once every two minutes.'}</span></p>
      {latest > 0 && Date.now() - latest > 4 * 3_600_000 && <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">These checks are over four hours old. Review the evidence time and recheck before taking action.</p>}
      {data?.truncated && <p role="status" className="mt-2 text-xs text-amber-900 dark:text-amber-200">Only the most recent 300 inbox entries are shown. Older items are not necessarily resolved.</p>}
    </section>
    {showSettings && data?.canConfigure && <div id={`${id}-settings`}><Suspense fallback={<p role="status">Loading warning settings…</p>}><AcademicRiskSettings /></Suspense></div>}
    <RiskPushControl key={uid} uid={uid} />
    {(isError || refresh.error || markRead.error) && <div role="alert" className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-900 dark:text-rose-200">{riskErrorMessage(error || refresh.error || markRead.error)}{isError && <button type="button" onClick={() => void refetch()} className="ml-2 underline font-bold">Retry alerts</button>}</div>}
    {isPending ? <p role="status" className="py-8 text-center text-sm text-slate-600 dark:text-slate-400">Loading private academic alerts…</p> : <>
      {coverage.length > 0 && <section aria-labelledby={`${id}-coverage`} className="rounded-2xl border border-sky-200 dark:border-sky-900/70 bg-sky-50/60 dark:bg-sky-950/20 p-4 sm:p-5">
        <h2 id={`${id}-coverage`} className="flex gap-2 items-center text-sm font-bold text-sky-900 dark:text-sky-200"><Info size={18} aria-hidden="true" />Coverage warnings — not confirmed risks</h2>
        <div className="mt-3 space-y-4">{coverage.map(a => <div key={a.id}>{a.subjectUid !== uid && <h3 className="mb-1 text-xs font-bold text-slate-800 dark:text-slate-200">{a.subjectName}</h3>}<ul className="list-disc pl-5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-1">{a.message.split('\n').map((line, i) => <li key={i}>{line}</li>)}</ul></div>)}</div>
      </section>}
      <div className="flex flex-wrap gap-3 items-end">
        <fieldset className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1" aria-label="Alert state"><legend className="sr-only">Alert state</legend>{(['active', 'history'] as const).map(state => <button key={state} type="button" aria-pressed={mode === state} onClick={() => setMode(state)} className={`portal-motion-target rounded-lg px-3 py-2 text-xs font-bold ${mode === state ? 'bg-teal-700 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{state === 'active' ? 'Needs attention' : 'History'}</button>)}</fieldset>
        <div className="min-w-0"><label htmlFor={`${id}-category`} className="block mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">Filter by area</label><select id={`${id}-category`} value={category} onChange={e => setCategory(e.target.value)} className="max-w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs text-slate-800 dark:text-slate-200"><option value="all">All areas</option>{Object.entries(RISK_CATEGORY_LABELS).filter(([value]) => value !== 'coverage').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      <div aria-live="polite" className="space-y-3">{list.map(alert => <AlertCard key={alert.id} alert={alert} role={user?.role} ownUid={uid} marking={markRead.isPending} markRead={() => markRead.mutate(alert.id)} />)}
        {!list.length && !isError && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center"><CircleAlert size={25} aria-hidden="true" className="mx-auto text-teal-700 dark:text-teal-300" /><h2 className="mt-3 font-bold text-slate-900 dark:text-white">{mode === 'history' ? 'No history in this view' : latest ? 'No attention items in this view' : 'Your first check is still pending'}</h2><p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{mode === 'history' ? 'Resolved means a complete recheck cleared the item. Archived means it aged outside the observation window.' : 'Only confirmed, scoped evidence creates a risk. Review coverage warnings too; an empty inbox is not a final eligibility or compliance decision.'}</p></div>}
      </div>
    </>}
    <p className="pb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">Marking an alert read only acknowledges it. Fix the underlying record, then run a new check; incomplete rechecks retain the previous alert as unverified rather than declaring it resolved. Attendance requirements come from the explicitly assigned scheme, never a default university.</p>
  </div>;
}
