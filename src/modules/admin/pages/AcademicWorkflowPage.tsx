import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getDocs, limit, query, where, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import { useAuth } from '@/modules/auth/context/AuthContext';
import AutoScheduleDialog from './AutoScheduleDialog';
import ScheduleImportWorkflow from './ScheduleImportWorkflow';
import { downloadTimetableJPG, downloadTimetablePDF, type TimetableSlot } from '@/shared/utils/timetableExport';

type Row = Record<string, any> & { id: string };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const emptySlot = { subject: '', subjectCode: '', facultyId: '', facultyName: '', branch: '', batch: '', semester: 1, division: '', section: '', room: '', dayOfWeek: 'monday', startTime: '09:00', endTime: '10:00', type: 'lecture' };

export default function AcademicWorkflowPage() {
  const { user } = useAuth();
  const role = user?.role;
  const collegeId = user?.collegeId || '';
  const [proposals, setProposals] = useState<Row[]>([]);
  const [schedules, setSchedules] = useState<Row[]>([]);
  const [hods, setHods] = useState<Row[]>([]);
  const [faculty, setFaculty] = useState<Row[]>([]);
  const [slot, setSlot] = useState<Record<string, any>>(emptySlot);
  const [reviewerUid, setReviewerUid] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);

  const load = useCallback(async () => {
    if (!collegeId) return;
    const proposalPromise = role === 'operations'
      ? getDocs(query(collection(db, 'scheduleProposals'), where('collegeId', '==', collegeId), limit(500)))
      : role === 'hod'
        ? getDocs(query(collection(db, 'scheduleProposals'), where('collegeId', '==', collegeId), where('reviewerUid', '==', user?.uid || ''), limit(500)))
        : Promise.resolve(null);
    const [proposalSnap, scheduleSnap] = await Promise.all([
      proposalPromise,
      getDocs(query(collection(db, 'weeklySchedules'), where('collegeId', '==', collegeId), limit(1000))),
    ]);
    setProposals(proposalSnap?.docs.map((d) => ({ id: d.id, ...d.data() } as Row)) || []);
    setSchedules(scheduleSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Row)).filter((s) =>
      s.isActive !== false && (!s.approvalStatus || s.approvalStatus === 'approved'),
    ));
    if (role === 'operations') {
      const [hodSnap, facultySnap] = await Promise.all([
        getDocs(query(collection(db, 'hods'), where('collegeId', '==', collegeId), limit(200))),
        getDocs(query(collection(db, 'faculty'), where('collegeId', '==', collegeId), limit(500))),
      ]);
      const h = hodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Row));
      setHods(h);
      setFaculty(facultySnap.docs.map((d) => ({ id: d.id, ...d.data() } as Row)).filter((f) => f.status !== 'inactive'));
      if (!reviewerUid && h.length) setReviewerUid(String(h[0].uid || h[0].id));
    }
  }, [collegeId, role, reviewerUid]);

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load academic workflow')); }, [load]);

  const relevantProposals = useMemo(() => proposals
    .filter((p) => role !== 'hod' || p.reviewerUid === user?.uid)
    .sort((a, b) => String(b.createdAt?.seconds || 0).localeCompare(String(a.createdAt?.seconds || 0))), [proposals, role, user?.uid]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const call = httpsCallable(functions, 'submitScheduleProposal');
      await call({ slot, reviewerUid, ...(editingScheduleId ? { targetWeeklyScheduleId: editingScheduleId } : {}) });
      setNotice('Draft sent to the selected programme HOD. It is not yet visible to students or faculty; the existing published schedule remains live while the edit is reviewed.');
      setSlot(emptySlot); setEditingScheduleId(''); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit schedule draft'); }
    finally { setBusy(false); }
  };

  const review = async (proposalId: string, decision: 'approved' | 'returned') => {
    setBusy(true); setError(''); setNotice('');
    try {
      const call = httpsCallable(functions, 'reviewScheduleProposal');
      const result = await call({ proposalId, decision, note: reviewNotes[proposalId] || '' });
      const data = result.data as { weeklyScheduleId?: string };
      setNotice(decision === 'approved'
        ? `Schedule approved and published${data.weeklyScheduleId ? `. Operations must generate dated class sessions (schedule ${data.weeklyScheduleId}).` : '.'}`
        : 'Schedule returned to Operations with your note.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not review schedule'); }
    finally { setBusy(false); }
  };

  const generate = async (schedule: Row) => {
    setBusy(true); setError(''); setNotice('');
    try {
      const today = new Date();
      const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const from = dateKey(today);
      const until = dateKey(new Date(today.getTime() + 89 * 86400000));
      const call = httpsCallable(functions, 'generateClassSessions');
      const result = await call({ from, to: until, weeklyScheduleId: schedule.id, detectConflicts: true, skipConflicting: true });
      const data = result.data as Record<string, unknown>;
      setNotice(`Dated class sessions generated for ${schedule.subject}. Review the generated/skipped counts in the response: ${JSON.stringify(data)}`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not generate class sessions'); }
    finally { setBusy(false); }
  };

  const exportPublished = async (format: 'pdf' | 'jpg') => {
    setError('');
    try {
      const exportOptions = {
        title: 'Published weekly timetable',
        subtitle: collegeId,
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        slots: schedules.map((s): TimetableSlot => ({
          dayOfWeek: String(s.dayOfWeek || ''), startTime: String(s.startTime || ''), endTime: String(s.endTime || ''),
          subject: String(s.subject || ''), subjectCode: String(s.subjectCode || ''), facultyName: String(s.facultyName || ''),
          room: String(s.room || ''), branch: String(s.branch || ''), batch: String(s.batch || ''),
          semester: s.semester, division: String(s.division || ''), section: String(s.section || ''), type: String(s.type || ''),
        })),
        showCohort: true,
        fileName: 'vriddhi-published-timetable',
      };
      if (format === 'pdf') await downloadTimetablePDF(exportOptions);
      else await downloadTimetableJPG(exportOptions);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not export the published timetable'); }
  };

  if (!user || !collegeId) return <main className="p-6">Your account is not linked to a college.</main>;
  const isOps = role === 'operations';
  const isHod = role === 'hod';
  const isPrincipal = role === 'principal';

  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <header>
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700">Academic workflow</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Timetable preparation & approval</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">Operations prepares drafts, the relevant programme HOD reviews them, and only approved schedules are published. Existing live schedules remain available.</p>
    </header>
    {error && <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

    {isOps && <>
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mr-auto"><h2 className="font-semibold">Bulk timetable tools</h2><p className="text-sm text-slate-500">Generate or import multiple draft slots. Every slot remains unpublished until its programme HOD approves it.</p></div>
        <button type="button" onClick={() => setAutoScheduleOpen(true)} className="rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50">Auto-generate drafts</button>
        <ScheduleImportWorkflow onSubmitted={() => { void load(); setNotice('Imported timetable drafts were routed to their programme HODs for approval.'); }} />
      </section>
      <AutoScheduleDialog collegeId={collegeId} open={autoScheduleOpen} onClose={() => setAutoScheduleOpen(false)} onApplied={() => { void load(); setNotice('Generated timetable drafts were routed to their programme HODs for approval.'); }} />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Prepare a schedule draft</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">Submission creates an unpublished proposal. It does not replace or modify the live timetable.</p>
        {!hods.length && <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">No programme HOD is registered for this college yet. Ask an administrator to complete the HOD profile before submitting a draft.</p>}
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">Subject<input className={inputClass} required value={slot.subject} onChange={(e) => setSlot({ ...slot, subject: e.target.value })} /></label>
          <label className="text-sm">Subject code<input className={inputClass} value={slot.subjectCode} onChange={(e) => setSlot({ ...slot, subjectCode: e.target.value })} /></label>
          <label className="text-sm">Faculty<select className={inputClass} required value={slot.facultyId} onChange={(e) => { const f = faculty.find((x) => x.id === e.target.value); setSlot({ ...slot, facultyId: e.target.value, facultyName: f ? `${f.firstName || ''} ${f.lastName || ''}`.trim() || f.name || '' : '' }); }}><option value="">Select mapped faculty</option>{faculty.map((f) => <option key={f.id} value={f.uid || f.id}>{`${f.firstName || ''} ${f.lastName || ''}`.trim() || f.name || f.email || f.id}</option>)}</select></label>
          <label className="text-sm">Programme / branch<input className={inputClass} required value={slot.branch} onChange={(e) => setSlot({ ...slot, branch: e.target.value })} /></label>
          <label className="text-sm">Batch<input className={inputClass} required value={slot.batch} onChange={(e) => setSlot({ ...slot, batch: e.target.value })} /></label>
          <label className="text-sm">Semester<input className={inputClass} type="number" min="1" max="20" required value={slot.semester} onChange={(e) => setSlot({ ...slot, semester: Number(e.target.value) })} /></label>
          <label className="text-sm">Division<input className={inputClass} value={slot.division} onChange={(e) => setSlot({ ...slot, division: e.target.value })} /></label>
          <label className="text-sm">Section<input className={inputClass} value={slot.section} onChange={(e) => setSlot({ ...slot, section: e.target.value })} /></label>
          <label className="text-sm">Room<input className={inputClass} required value={slot.room} onChange={(e) => setSlot({ ...slot, room: e.target.value })} /></label>
          <label className="text-sm">Day<select className={inputClass} value={slot.dayOfWeek} onChange={(e) => setSlot({ ...slot, dayOfWeek: e.target.value })}>{['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>)}</select></label>
          <label className="text-sm">Start time<input className={inputClass} type="time" required value={slot.startTime} onChange={(e) => setSlot({ ...slot, startTime: e.target.value })} /></label>
          <label className="text-sm">End time<input className={inputClass} type="time" required value={slot.endTime} onChange={(e) => setSlot({ ...slot, endTime: e.target.value })} /></label>
          <label className="text-sm md:col-span-2">Programme HOD reviewer<select className={inputClass} required value={reviewerUid} onChange={(e) => setReviewerUid(e.target.value)}><option value="">Select programme HOD</option>{hods.map((h) => <option key={h.id} value={h.uid || h.id}>{h.name || h.displayName || h.email || h.uid || h.id}</option>)}</select></label>
          <div className="flex items-end gap-2"><button disabled={busy || !hods.length} className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Submitting…' : editingScheduleId ? 'Submit edit for HOD approval' : 'Submit for HOD approval'}</button>{editingScheduleId && <button type="button" onClick={() => { setEditingScheduleId(''); setSlot(emptySlot); }} className="rounded-lg border px-3 py-2 text-sm">Cancel edit</button>}</div>
        </form>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Published schedules</h2><p className="text-sm text-slate-500">Generate dated class sessions after approval; student class counts use these dated sessions.</p></div><div className="flex gap-2"><button type="button" onClick={() => void exportPublished('pdf')} className="rounded-lg border px-3 py-2 text-sm">Download PDF</button><button type="button" onClick={() => void exportPublished('jpg')} className="rounded-lg border px-3 py-2 text-sm">Download JPG</button></div></div>
        <div className="space-y-2">{schedules.map((s) => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"><div><strong>{s.subject}</strong><div className="text-xs text-slate-500">{s.branch} · Semester {s.semester} · {s.dayOfWeek} {s.startTime}–{s.endTime} · {s.room}</div></div><div className="flex gap-2"><button disabled={busy} onClick={() => generate(s)} className="rounded-lg border border-teal-700 px-3 py-2 text-sm text-teal-800 disabled:opacity-50">Generate dated sessions</button><button onClick={() => { setEditingScheduleId(s.id); setSlot({ ...emptySlot, ...s }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="rounded-lg border border-slate-400 px-3 py-2 text-sm">Propose edit</button></div></div>)}{!schedules.length && <p className="text-sm text-slate-500">No published schedules in this college yet.</p>}</div>
      </section>
    </>}

    {(isHod || isOps) && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{isHod ? 'Your programme review queue' : 'Your submitted drafts'}</h2>
      <div className="mt-4 space-y-3">{relevantProposals.map((p) => <article key={p.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{p.slot?.subject || 'Class schedule'}</h3><p className="text-sm text-slate-500">{p.slot?.branch} · Semester {p.slot?.semester} · Batch {p.slot?.batch} · {p.slot?.dayOfWeek} {p.slot?.startTime}–{p.slot?.endTime} · {p.slot?.room}</p></div><span className="h-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">{p.status}</span></div>{p.reviewNote && <p className="mt-2 text-sm text-rose-700">HOD note: {p.reviewNote}</p>}{isOps && p.status === 'returned' && <button onClick={() => { setEditingScheduleId(String(p.targetWeeklyScheduleId || '')); setReviewerUid(String(p.reviewerUid || '')); setSlot({ ...emptySlot, ...(p.slot || {}) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="mt-3 rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-800">Revise returned draft</button>}{isHod && p.status === 'pending_hod' && <div className="mt-3 space-y-2"><textarea className={inputClass} placeholder="Review note (required when returning)" value={reviewNotes[p.id] || ''} onChange={(e) => setReviewNotes({ ...reviewNotes, [p.id]: e.target.value })} /><div className="flex gap-2"><button disabled={busy} onClick={() => review(p.id, 'approved')} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Approve & publish</button><button disabled={busy || !reviewNotes[p.id]?.trim()} onClick={() => review(p.id, 'returned')} className="rounded-lg border border-rose-400 px-3 py-2 text-sm font-semibold text-rose-800">Return for changes</button></div></div>}</article>)}{!relevantProposals.length && <p className="text-sm text-slate-500">No schedule drafts to show.</p>}</div>
    </section>}

    {isPrincipal && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Published schedule visibility</h2><p className="text-sm text-slate-500">Read-only. Schedule changes are prepared by Operations and approved by the relevant programme HOD.</p></div><div className="flex gap-2"><button type="button" onClick={() => void exportPublished('pdf')} className="rounded-lg border px-3 py-2 text-sm">Download PDF</button><button type="button" onClick={() => void exportPublished('jpg')} className="rounded-lg border px-3 py-2 text-sm">Download JPG</button></div></div><div className="space-y-2">{schedules.map((s) => <div key={s.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"><strong>{s.subject}</strong><p className="text-sm text-slate-500">{s.branch} · Semester {s.semester} · Batch {s.batch} · {s.dayOfWeek} {s.startTime}–{s.endTime} · {s.room}</p></div>)}{!schedules.length && <p className="text-sm text-slate-500">No published schedules yet.</p>}</div></section>}
    <button onClick={() => load().catch((e) => setError(e.message))} className="text-sm font-medium text-teal-800 underline">Refresh workflow</button>
  </main>;
}
