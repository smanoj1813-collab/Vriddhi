// Superadmin: assign previous-year question papers to ONE college, the same
// way course packs are assigned (colleges/{id}/config/pyqPapers). College
// staff then see the assigned papers under Question Bank → Previous Year
// Papers and can turn them into online assessments.

import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, ExternalLink, FileText, Loader2, RefreshCw, Save, ShieldCheck, Square } from 'lucide-react';
import { fetchPrepPapers, type PrepPaperSummary } from '@/shared/services/prepContentService';
import { loadPyqAssignments, savePyqAssignments } from '@/shared/pyq/pyqAssignments';
import {
  assignedPyqIds,
  filterPyqRows,
  isAssessmentReadyRow,
  pyqProgramOptions,
  sortPyqRows,
  type PyqAssignmentSettings,
  type PyqRowFilters,
} from '@/shared/pyq/pyqAssignmentModel';

interface PyqAssignmentPanelProps {
  collegeId: string;
  collegeName?: string;
  embedded?: boolean;
}

const selectClass = 'text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-950';

export default function PyqAssignmentPanel({ collegeId, collegeName, embedded }: PyqAssignmentPanelProps) {
  const [rows, setRows] = useState<PrepPaperSummary[]>([]);
  const [saved, setSaved] = useState<PyqAssignmentSettings>({ assignments: {} });
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<PyqRowFilters>({ readiness: 'all' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [catalogue, settings] = await Promise.all([fetchPrepPapers(), loadPyqAssignments(collegeId)]);
      setRows(sortPyqRows(catalogue.papers));
      setSaved(settings);
      setDraft(new Set(assignedPyqIds(settings)));
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not load previous year papers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  const programs = useMemo(() => pyqProgramOptions(rows), [rows]);
  const semesters = useMemo(
    () => [...new Set(rows.filter((r) => !filters.program || r.program === filters.program).map((r) => r.semester).filter(Boolean))].sort((a, b) => a - b),
    [rows, filters.program],
  );
  const shown = useMemo(() => filterPyqRows(rows, filters), [rows, filters]);
  const knownIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);
  const savedIds = useMemo(() => new Set(assignedPyqIds(saved)), [saved]);
  const dirty = draft.size !== savedIds.size || [...draft].some((id) => !savedIds.has(id));
  const assignedReady = rows.filter((r) => draft.has(r.id) && isAssessmentReadyRow(r)).length;
  const orphaned = [...draft].filter((id) => !knownIds.has(id)).length;

  const toggle = (id: string) => setDraft((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const setShown = (on: boolean) => setDraft((prev) => {
    const next = new Set(prev);
    for (const row of shown) {
      if (on) next.add(row.id); else next.delete(row.id);
    }
    return next;
  });

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const next = await savePyqAssignments(collegeId, saved, draft);
      setSaved(next);
      setMsg({ type: 'ok', text: `Saved — ${draft.size} paper(s) assigned to ${collegeName || 'this college'}.` });
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not save assignments.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={embedded ? '' : 'rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900'}>
      <header className="flex flex-col gap-1">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <FileText className="h-4 w-4 text-teal-600" />
          Previous year question papers{collegeName ? ` — ${collegeName}` : ''}
        </h3>
        <p className="text-xs text-slate-500">
          Assigned papers appear in this college’s Question Bank → <span className="font-semibold">Previous Year Papers</span>.
          Faculty can run online assessments from papers marked <span className="font-semibold">Online-ready</span>; PDF-only
          papers can be viewed but need their questions transcribed before they can be used online.
        </p>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select aria-label="Programme" value={filters.program || ''} onChange={(e) => setFilters((f) => ({ ...f, program: e.target.value || undefined, semester: undefined }))} className={selectClass}>
          <option value="">All programmes</option>
          {programs.map((p) => <option key={p.value} value={p.value}>{p.label} ({p.count})</option>)}
        </select>
        <select aria-label="Semester" value={filters.semester || ''} onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value || undefined }))} className={selectClass}>
          <option value="">All semesters</option>
          {semesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
        </select>
        <select aria-label="Format" value={filters.readiness || 'all'} onChange={(e) => setFilters((f) => ({ ...f, readiness: e.target.value as PyqRowFilters['readiness'] }))} className={selectClass}>
          <option value="all">Online-ready and PDF-only</option>
          <option value="ready">Online-ready only</option>
          <option value="pdf">PDF-only</option>
        </select>
        <input aria-label="Search papers" value={filters.q || ''} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="Search subject or file…" className={`${selectClass} min-w-[180px] flex-1`} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>{shown.length} shown · {draft.size} assigned ({assignedReady} online-ready){orphaned ? ` · ${orphaned} no longer in the catalogue` : ''}</span>
        <span className="flex gap-3">
          <button type="button" disabled={loading || saving || shown.length === 0} onClick={() => setShown(true)} className="font-semibold text-teal-700 hover:underline disabled:opacity-50 dark:text-teal-300">Assign all shown</button>
          <button type="button" disabled={loading || saving || shown.length === 0} onClick={() => setShown(false)} className="font-semibold text-slate-600 hover:underline disabled:opacity-50 dark:text-slate-300">Unassign all shown</button>
        </span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading papers…</div>
      ) : shown.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No papers match these filters.</p>
      ) : (
        <ul className="mt-2 max-h-[480px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {shown.map((row) => {
            const checked = draft.has(row.id);
            const ready = isAssessmentReadyRow(row);
            return (
              <li key={row.id} className={`flex items-start gap-3 px-3 py-2.5 ${checked ? 'bg-teal-50/60 dark:bg-teal-950/20' : ''}`}>
                <button type="button" role="checkbox" aria-checked={checked} aria-label={`Assign ${row.subjectName}`} disabled={saving} onClick={() => toggle(row.id)} className="mt-0.5 text-teal-700 disabled:opacity-50 dark:text-teal-300">
                  {checked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-400" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{row.subjectName}</p>
                  <p className="text-[11px] text-slate-500">
                    {row.programLabel}{row.semester ? ` · Semester ${row.semester}` : ''}{row.examLabel ? ` · ${row.examLabel}` : ''}
                    {ready ? ` · ${row.questionCount} questions${row.maxMarks ? ` · ${row.maxMarks} marks` : ''}` : ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ready ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                  {ready ? 'Online-ready' : 'PDF only'}
                </span>
                <a href={`/prep/papers/${encodeURIComponent(row.id)}`} target="_blank" rel="noreferrer" title="Open paper" className="shrink-0 text-slate-400 hover:text-teal-700 dark:hover:text-teal-300">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            );
          })}
        </ul>
      )}

      {msg ? <div role="status" className={`mt-3 rounded-lg px-3 py-2 text-xs ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>{msg.text}</div> : null}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {saved.updatedAt ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}` : 'Nothing is assigned until you save'}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || saving} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset
          </button>
          <button type="button" onClick={() => void save()} disabled={!dirty || loading || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save assignments'}
          </button>
        </div>
      </footer>
    </section>
  );
}
