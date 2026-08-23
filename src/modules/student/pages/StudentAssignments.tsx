import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, FileUp, Upload } from 'lucide-react';
import { useStudentData } from '../hooks/useStudentData';
import AssignmentUploadModal from '../components/AssignmentUploadModal';
import type { Assignment } from '../types/student';

type FilterKey = 'pending' | 'submitted' | 'graded' | 'all';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800', label: 'Pending' },
  overdue: { icon: XCircle, color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800', label: 'Overdue' },
  submitted: { icon: CheckCircle2, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800', label: 'Submitted' },
  'late-submitted': { icon: AlertTriangle, color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800', label: 'Late' },
  graded: { icon: CheckCircle2, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800', label: 'Graded' },
};

export default function StudentAssignments() {
  const { assignments, loading, refresh } = useStudentData();
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [selected, setSelected] = useState<Assignment | null>(null);

  const handleSubmitted = () => {
    refresh();
  };

  const filtered = useMemo(() => {
    const list = filter === 'all'
      ? assignments
      : assignments.filter((a) => a.status === filter);
    return [...list].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [assignments, filter]);

  const counts = useMemo(() => ({
    pending: assignments.filter((a) => a.status === 'pending').length,
    submitted: assignments.filter((a) => a.status === 'submitted').length,
    graded: assignments.filter((a) => a.status === 'graded').length,
    all: assignments.length,
  }), [assignments]);

  const getDaysLeft = (dueDate: string, dueTime?: string) => {
    const timeStr = dueTime ? `T${dueTime}` : 'T23:59:59';
    const due = new Date(`${dueDate}${timeStr}`);
    const hours = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours < 0) return { text: 'Overdue', urgent: true };
    if (hours < 24) return { text: `${hours}h left`, urgent: true };
    return { text: `${Math.floor(hours / 24)} days left`, urgent: false };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading Assignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Course Assignments</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">Submit homework, practical writeups and view teacher feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {([
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'graded', label: 'Graded' },
          { key: 'all', label: 'All Assignments' },
        ] as { key: FilterKey; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-8 shadow-sm">
          <FileUp className="w-12 h-12 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-900 dark:text-white font-bold text-sm">No assignments found</p>
          <p className="text-xs text-slate-500 mt-0.5">No tasks match your selected filter right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const cfg = statusConfig[a.status] || statusConfig.pending;
            const Icon = cfg.icon;
            const due = getDaysLeft(a.dueDate, a.dueTime);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131b2e] p-5 shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-700 transition-all"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-sm md:text-base text-slate-900 dark:text-white">{a.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-1">
                      {a.subject}{a.subjectCode ? ` · ${a.subjectCode}` : ''}
                    </p>
                    {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{a.description}</p>}
                  </div>

                  <div className="text-right flex flex-col items-end gap-2.5 shrink-0">
                    {a.status === 'graded' && a.marksObtained != null && (
                      <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
                        {a.marksObtained} / {a.maxMarks ?? '100'} Marks
                      </div>
                    )}
                    {a.dueDate && (
                      <div className={`text-xs font-medium ${due.urgent && a.status === 'pending' ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                        Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {a.status === 'pending' && ` · ${due.text}`}
                      </div>
                    )}
                    {(a.status === 'pending' || a.status === 'overdue') && (
                      <button
                        onClick={() => setSelected(a)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Upload size={13} /> Submit Assignment
                      </button>
                    )}
                    {a.status === 'submitted' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 size={13} /> Awaiting Faculty Grade
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selected && (
        <AssignmentUploadModal
          assignment={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onSubmit={handleSubmitted}
        />
      )}
    </div>
  );
}
