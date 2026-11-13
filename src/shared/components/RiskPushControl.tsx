import { useEffect, useState } from 'react';
import { BellRing, BellOff } from 'lucide-react';
import { disableRiskPushOnThisDevice, enableRiskPush, riskPushOptedIn, riskPushUnavailableReason } from '../services/riskPush';
import { riskErrorMessage } from '../utils/riskAlertPresentation';

export default function RiskPushControl({ uid }: { uid: string }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unavailable = riskPushUnavailableReason();
  useEffect(() => {
    let current = true;
    setEnabled(false); setError('');
    if (riskPushOptedIn(uid) && !unavailable) {
      setBusy(true);
      // Renew the token only for a browser/account that explicitly opted in.
      // This never requests permission automatically.
      void enableRiskPush(uid, false).then(() => { if (current) setEnabled(true); }).catch(e => { if (current) setError(riskErrorMessage(e)); }).finally(() => { if (current) setBusy(false); });
    }
    return () => { current = false; };
  }, [uid, unavailable]);
  const toggle = async () => {
    setBusy(true); setError('');
    try {
      if (enabled) { await disableRiskPushOnThisDevice(uid); setEnabled(false); }
      else { await enableRiskPush(uid, true); setEnabled(true); }
    } catch (e) { if (enabled) setEnabled(false); setError(riskErrorMessage(e)); }
    finally { setBusy(false); }
  };
  const Icon = enabled ? BellOff : BellRing;
  return <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 p-4 text-xs">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1"><p className="font-bold text-slate-900 dark:text-white">Push notifications · {enabled ? 'enabled on this browser' : 'opt-in per browser'}</p><p className="mt-1 text-slate-600 dark:text-slate-400">{unavailable || 'A private inbox reminder, without academic details on your lock screen. Portal alerts work even with push disabled.'}</p></div>
      <button type="button" disabled={busy || (!!unavailable && !enabled)} onClick={() => void toggle()} className="portal-motion-target inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-3 py-2.5 font-bold text-white hover:bg-teal-800 disabled:opacity-60 disabled:cursor-not-allowed">
        <Icon size={15} aria-hidden="true" className="portal-interactive-icon" />{busy ? 'Connecting…' : enabled ? 'Disable on this browser' : 'Enable push'}
      </button>
    </div>
    {error && <p role="alert" className="mt-2 text-rose-800 dark:text-rose-300">{error}</p>}
  </div>;
}
