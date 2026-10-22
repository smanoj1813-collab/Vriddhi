import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import { useAuth } from '@/modules/auth/context/AuthContext';

type CurriculumRow = Record<string, any> & { id: string };
export default function CurriculumApprovalPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CurriculumRow[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!user?.collegeId) return;
    const snap = await getDocs(query(collection(db, 'curriculum'), where('collegeId', '==', user.collegeId), limit(500)));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CurriculumRow)).filter((r) => r.approvalStatus === 'pending_principal'));
  }, [user?.collegeId]);
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load curriculum assignments')); }, [load]);
  const decide = async (row: CurriculumRow, decision: 'approved' | 'returned') => {
    setBusy(true); setError(''); setMessage('');
    try {
      const call = httpsCallable(functions, 'reviewCurriculumAssignment');
      await call({ curriculumId: row.id, decision, note: notes[row.id] || '' });
      setMessage(decision === 'approved' ? 'Curriculum approved. Operations has been notified to map faculty and prepare the timetable.' : 'Curriculum returned to Superadmin for revision.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save curriculum decision'); }
    finally { setBusy(false); }
  };
  if (user?.role !== 'principal') return <main className="p-6">Principal access is required.</main>;
  return <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-8"><header><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700">Curriculum governance</p><h1 className="text-2xl font-bold">Curriculum approvals</h1><p className="mt-2 text-sm text-slate-600">Superadmin assignments must be approved here before Operations can map faculty or prepare the timetable.</p></header>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}{message && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
    <div className="space-y-3">{rows.map((r) => <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"><div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold">{r.title || `${r.branch || 'Curriculum'} — Semester ${r.semester || '?'}`}</h2><p className="text-sm text-slate-500">{r.branch} · Semester {r.semester} · {r.totalCourses || r.courses?.length || 0} courses · {r.totalModules || 0} modules</p></div><span className="h-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">{r.approvalStatus}</span></div>{r.description && <p className="mt-2 text-sm">Assignment note: {r.description}</p>}<textarea className="mt-3 w-full rounded-lg border p-2 text-sm dark:bg-slate-950" placeholder="Approval or return note" value={notes[r.id] || ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} /><div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => decide(r, 'approved')} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Approve assignment</button><button disabled={busy || !notes[r.id]?.trim()} onClick={() => decide(r, 'returned')} className="rounded-lg border border-rose-400 px-4 py-2 text-sm font-semibold text-rose-800">Return to Superadmin</button></div></article>)}{!rows.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">No curriculum assignments are awaiting your review.</p>}</div>
  </main>;
}
