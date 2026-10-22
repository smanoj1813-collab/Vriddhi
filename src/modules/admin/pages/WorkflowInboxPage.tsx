import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, limit, query, updateDoc, where, doc } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';

type Task = Record<string, any> & { id: string };
export default function WorkflowInboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user?.uid) return;
    const constraints = [where('recipientUid', '==', user.uid), ...(user.collegeId ? [where('collegeId', '==', user.collegeId)] : []), limit(200)];
    const snap = await getDocs(query(collection(db, 'workflowTasks'), ...constraints));
    setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
  }, [user?.uid]);
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Could not load workflow tasks')); }, [load]);
  const markRead = async (task: Task) => {
    try { await updateDoc(doc(db, 'workflowTasks', task.id), { read: true }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not mark task read'); }
  };
  const openTask = async (task: Task) => {
    if (!task.read) await markRead(task);
    if (typeof task.path === 'string' && task.path.startsWith('/admin/')) navigate(task.path);
    else if (typeof task.path === 'string' && task.path.startsWith('/superadmin/')) navigate(task.path);
  };
  return <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-8"><header><p className="text-xs font-semibold uppercase tracking-[.18em] text-teal-700">In-app notifications</p><h1 className="text-2xl font-bold">Academic workflow inbox</h1><p className="mt-2 text-sm text-slate-600">Tasks are scoped to your college and delivered to your account.</p></header>{error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>}<div className="space-y-3">{tasks.map((t) => <article key={t.id} className={`rounded-xl border p-4 ${t.read ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900' : 'border-teal-300 bg-teal-50 dark:bg-teal-950/30'}`}><div className="flex items-start justify-between gap-4"><div><button onClick={() => openTask(t)} className="text-left font-semibold text-teal-800 hover:underline">{t.title} <span aria-hidden="true">↗</span></button><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.message}</p><p className="mt-2 text-xs text-slate-500">{t.createdAt?.toDate ? t.createdAt.toDate().toLocaleString() : 'Just now'}</p></div>{!t.read && <button onClick={() => markRead(t)} className="shrink-0 rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-semibold text-teal-800">Mark read</button>}</div></article>)}{!tasks.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">You have no workflow tasks right now.</p>}</div><button onClick={() => load().catch((e) => setError(e.message))} className="text-sm text-teal-800 underline">Refresh inbox</button></main>;
}
