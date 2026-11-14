import { Link } from 'react-router-dom';
import { ArrowUpRight, BellRing, Info, ShieldAlert } from 'lucide-react';
import { useAcademicRiskAlerts } from '../hooks/useAcademicRiskAlerts';
import { activeRiskAlerts, riskCheckedLabel, riskInboxPath } from '../utils/riskAlertPresentation';
import '../styles/portalExperience.css';

export default function RiskAlertsSummary() {
  const { data, isPending, isError, eligible, user } = useAcademicRiskAlerts();
  if (!eligible) return null;
  const active = activeRiskAlerts(data?.alerts || []);
  const coverage = (data?.alerts || []).filter(a => a.category === 'coverage' && ['active', 'unverified'].includes(a.state));
  const last = data?.checkedAt || Math.max(0, ...(data?.alerts || []).map(a => a.checkedAt));
  return (
    <section aria-label="Academic risk alerts" className="mb-6 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span aria-hidden="true" className="rounded-xl bg-amber-50 p-2.5 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"><ShieldAlert size={20} /></span>
          <div><h2 className="text-sm font-bold text-slate-900 dark:text-white">Risk Alerts</h2>
            <p className="text-xs mt-0.5 text-slate-600 dark:text-slate-400">{isPending ? 'Loading your inbox…' : isError ? 'Inbox unavailable — open alerts to retry loading' : `${active.length} attention item${active.length === 1 ? '' : 's'} · ${last ? `Last check ${riskCheckedLabel(last)}` : 'No completed check yet'}`}</p>
          </div>
        </div>
        <Link to={riskInboxPath(user?.role)} className="portal-motion-target inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50">
          Open alerts <ArrowUpRight size={16} aria-hidden="true" className="portal-interactive-icon" />
        </Link>
      </div>
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Scheduled snapshot — not live monitoring. Opening or refreshing the inbox does not start a check.</p>
      {!isError && !isPending && <div className="mt-3 flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-300">
        {active.slice(0, 2).map(alert => <Link key={alert.id} to={riskInboxPath(user?.role)} className="portal-motion-target flex gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
          <BellRing size={14} aria-hidden="true" className="portal-interactive-icon mt-0.5 shrink-0 text-amber-800 dark:text-amber-200" />
          <span className="min-w-0 break-words">{alert.subjectUid !== (user?.uid || user?.id) && <strong>{alert.subjectName} · </strong>}{alert.title}{alert.state === 'unverified' ? ' · recheck needed' : ''}</span>
        </Link>)}
        {coverage.length > 0 && <p className="flex items-start gap-2"><Info size={14} aria-hidden="true" className="shrink-0 mt-0.5" /><span>{coverage.length} coverage warning{coverage.length === 1 ? '' : 's'} — incomplete data, not confirmed risks.</span></p>}
        {!active.length && !coverage.length && <p>{last ? 'No active alerts from the completed checks. This is not a final eligibility or compliance decision.' : 'Your first automatic scheduled review is pending. Supervisors receive faculty alerts after the scheduled review.'}</p>}
        {data?.truncated && <p>Showing the most recent 300 inbox entries; older items may not be included.</p>}
      </div>}
    </section>
  );
}
