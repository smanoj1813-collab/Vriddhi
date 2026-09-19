// src/shared/components/prep/CompanyPrepVisibilityPanel.tsx
//
// "Which company prep guides can this college's learners see?"
//
// One panel, three entry points:
//   • College admin → Settings → General (their own college; collegeId omitted,
//     the server takes it from the token).
//   • Superadmin → Colleges → {college} → Overview (explicit collegeId).
//   • Superadmin → Prep Content Studio (pick a college from a dropdown).
//
// The master switch hides the whole "Company-specific prep" section; the
// per-company toggles hide individual guides. Both are enforced server-side
// on list, detail and mock endpoints, so a hidden guide is hidden on deep
// links as well, not just on the hub strip.

import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Eye, EyeOff, Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import {
  fetchCompanyPrepSettings,
  saveCompanyPrepSettings,
  type CompanyPrepSettingsRow,
} from '@/shared/services/prepContentService';

const PROGRAM_SHORT: Record<string, string> = {
  bba: 'BBA', bcom: 'B.Com', bca: 'BCA', bsc: 'B.Sc', ba: 'BA', mba: 'MBA', mcom: 'M.Com', mca: 'MCA',
};

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ' +
        (checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600')
      }
    >
      <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

export interface CompanyPrepVisibilityPanelProps {
  /** Omit for "my college" (college admin). Superadmin must pass one. */
  collegeId?: string;
  collegeName?: string;
  /** Compact variant for embedding inside another card. */
  embedded?: boolean;
}

export default function CompanyPrepVisibilityPanel({ collegeId, collegeName, embedded }: CompanyPrepVisibilityPanelProps) {
  const [rows, setRows] = useState<CompanyPrepSettingsRow[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<{ enabled: boolean; hidden: string[] } | null>(null);
  const [resolvedCollege, setResolvedCollege] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetchCompanyPrepSettings(collegeId);
      setRows(r.companies);
      setEnabled(r.settings.enabled);
      setHidden(new Set(r.settings.hiddenCompanies));
      setSaved({ enabled: r.settings.enabled, hidden: [...r.settings.hiddenCompanies].sort() });
      setResolvedCollege(r.collegeId);
      setUpdatedAt(r.settings.updatedAt);
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Could not load company prep settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const dirty = useMemo(() => {
    if (!saved) return false;
    const cur = [...hidden].sort();
    return saved.enabled !== enabled || saved.hidden.join('|') !== cur.join('|');
  }, [saved, enabled, hidden]);

  const visibleCount = enabled ? rows.length - [...hidden].filter((c) => rows.some((r) => r.code === c)).length : 0;

  const toggleCompany = (code: string, show: boolean) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (show) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const s = await saveCompanyPrepSettings({ enabled, hiddenCompanies: [...hidden] }, collegeId);
      setSaved({ enabled: s.enabled, hidden: [...s.hiddenCompanies].sort() });
      setUpdatedAt(s.updatedAt);
      setMsg({ type: 'ok', text: s.enabled ? `Saved — learners see ${rows.length - s.hiddenCompanies.length} of ${rows.length} company guides.` : 'Saved — company prep is hidden for this college.' });
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const shell = embedded ? 'space-y-4' : 'glass-card p-6 space-y-4';

  return (
    <div className={shell}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            Company-specific placement prep
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Choose whether {collegeName ? <strong>{collegeName}</strong> : 'this college'}'s learners see the company guides
            (TCS, Infosys, Wipro, Accenture, Capgemini, Cognizant) on the Prep hub, and which ones. Hidden guides are also
            blocked on direct links.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={'text-xs font-semibold ' + (enabled ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500')}>
            {enabled ? 'Visible' : 'Hidden'}
          </span>
          <Switch checked={enabled} onChange={setEnabled} disabled={loading || saving} label="Show company prep to learners" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading company guides…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No published company guides yet — seed “Company Prep” from the Prep Content Studio first.</p>
      ) : (
        <div className={'rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 ' + (!enabled ? 'opacity-50' : '')}>
          {rows.map((r) => {
            const shown = enabled && !hidden.has(r.code);
            return (
              <div key={r.code} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</span>
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{r.tier}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {r.testName}
                    {r.programs.length ? <> · {r.programs.map((p) => PROGRAM_SHORT[p] || p.toUpperCase()).join(', ')}</> : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {shown ? <Eye className="w-3.5 h-3.5 text-teal-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  <Switch
                    checked={!hidden.has(r.code)}
                    onChange={(v) => toggleCompany(r.code, v)}
                    disabled={!enabled || saving}
                    label={`Show ${r.name}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {msg && (
        <div className={'text-xs px-3 py-2 rounded-lg ' + (msg.type === 'ok' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300')}>
          {msg.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          {loading ? '…' : `${visibleCount} of ${rows.length} visible`}
          {resolvedCollege ? <> · college <code className="font-mono">{resolvedCollege}</code></> : null}
          {updatedAt ? <> · last saved {new Date(updatedAt).toLocaleString()}</> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (loading ? 'animate-spin' : '')} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save visibility'}
          </button>
        </div>
      </div>
    </div>
  );
}
