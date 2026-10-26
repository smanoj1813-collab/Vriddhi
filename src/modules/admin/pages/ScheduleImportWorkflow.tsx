import { useState } from 'react';
import { applyScheduleImport, previewScheduleImport, type ScheduleImportResult } from '../api/scheduleImportApi';

type Props = { onSubmitted: () => void };

export default function ScheduleImportWorkflow({ onSubmitted }: Props) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<ScheduleImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const runPreview = async () => {
    setBusy(true); setError(''); setNotice('');
    try { setPreview(await previewScheduleImport({ csv })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not validate the timetable CSV'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await applyScheduleImport({ csv });
      setNotice(`${result.submitted ?? 0} unpublished draft(s) submitted to the relevant programme HOD(s). Nothing is live until approved.`);
      setPreview(result);
      onSubmitted();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit timetable drafts'); }
    finally { setBusy(false); }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">Import timetable CSV</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="schedule-import-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="schedule-import-title" className="text-xl font-bold">Import timetable drafts</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Valid rows are routed to the matching programme HOD. They do not change the live timetable until approval.</p></div>
          <button type="button" disabled={busy} onClick={() => setOpen(false)} aria-label="Close" className="rounded px-3 py-1 text-slate-600 hover:bg-slate-100">✕</button>
        </div>
        <p className="mt-4 rounded-lg bg-sky-50 p-3 text-xs text-sky-900">Columns: subject, subjectCode, facultyId, facultyName, branch, batch, semester, division, section, room, dayOfWeek, startTime, endTime, type. Quote a merged division such as "A,B" in CSV.</p>
        <textarea aria-label="Timetable CSV" value={csv} onChange={(e) => { setCsv(e.target.value); setPreview(null); setNotice(''); }} rows={8} placeholder={'subject,subjectCode,facultyId,branch,batch,semester,division,room,dayOfWeek,startTime,endTime\nBusiness Law,BL01,faculty-uid,B.Com,2026,4,A,301,monday,09:00,10:00'} className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
        {error && <p role="alert" className="mt-3 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {notice && <p role="status" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        {preview && <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2 text-xs"><span className="rounded bg-emerald-100 px-2 py-1">{preview.plan.totals.valid} valid</span><span className="rounded bg-rose-100 px-2 py-1">{preview.plan.totals.clash} clashes</span><span className="rounded bg-amber-100 px-2 py-1">{preview.plan.totals.duplicate} duplicates</span><span className="rounded bg-slate-100 px-2 py-1">{preview.plan.totals.invalid} invalid</span></div>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-100 dark:bg-slate-800"><tr><th className="p-2">Line</th><th className="p-2">Subject</th><th className="p-2">Time</th><th className="p-2">Status / notes</th></tr></thead><tbody>{preview.plan.rows.map((row) => <tr key={row.line} className="border-t border-slate-100 dark:border-slate-800"><td className="p-2">{row.line}</td><td className="p-2">{row.subject}</td><td className="p-2">{row.dayOfWeek} {row.startTime}–{row.endTime}</td><td className="p-2"><strong>{row.status}</strong>{[...row.reasons, ...row.warnings].length > 0 && ` — ${[...row.reasons, ...row.warnings].join('; ')}`}</td></tr>)}</tbody></table></div>
        </div>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" disabled={busy} onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm">Close</button>
          <button type="button" disabled={busy || !csv.trim()} onClick={runPreview} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-50">{busy && !preview ? 'Checking…' : 'Preview CSV'}</button>
          {preview && preview.plan.totals.valid > 0 && !notice && <button type="button" disabled={busy} onClick={submit} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : `Submit ${preview.plan.totals.valid} valid drafts for HOD approval`}</button>}
        </div>
      </section>
    </div>}
  </>;
}
