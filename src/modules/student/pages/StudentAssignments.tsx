// src/modules/student/pages/StudentAssignments.tsx
// Full assignments page backed by real Firestore data.
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, FileUp, Upload } from 'lucide-react';
import { useStudentData } from '../hooks/useStudentData';
import AssignmentUploadModal from '../components/AssignmentUploadModal';
import type { Assignment } from '../types/student';

type FilterKey = 'pending' | 'submitted' | 'graded' | 'all';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  overdue: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Overdue' },
  submitted: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Submitted' },
  'late-submitted': { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Late' },
  graded: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Graded' },
};

export default function StudentAssignments() {
  const { assignments, loading, refresh } = useStudentData();
  const [filter, setFilter] = useState<FilterKey>('pending');
  const [selected, setSelected] = useState<Assignment | null>(null);

  const handleSubmitted = () => {
    // Refetch assignments so the card moves to "submitted".
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-amber-400" /> Assignments
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track and submit your assigned work.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'pending', label: 'Pending' },
          { key: 'submitted', label: 'Submitted' },
          { key: 'graded', label: 'Graded' },
          { key: 'all', label: 'All' },
        ] as { key: FilterKey; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white border border-transparent hover:bg-slate-800'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
          <FileUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-medium">No assignments here</p>
          <p className="text-sm text-slate-400 mt-1">Check back later for new assignments.</p>
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
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{a.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{a.subject}{a.subjectCode ? ` · ${a.subjectCode}` : ''}</p>
                    {a.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{a.description}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    {a.status === 'graded' && a.marksObtained != null && (
                      <div className="text-lg font-bold text-blue-400">
                        {a.marksObtained}/{a.maxMarks ?? '—'}
                      </div>
                    )}
                    {a.dueDate && (
                      <div className={`text-xs ${due.urgent && a.status === 'pending' ? 'text-red-400' : 'text-slate-500'}`}>
                        Due {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {a.status === 'pending' && ` · ${due.text}`}
                      </div>
                    )}
                    {(a.status === 'pending' || a.status === 'overdue') && (
                      <button
                        onClick={() => setSelected(a)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/15 text-teal-400 text-xs font-medium hover:bg-teal-500/25 border border-teal-500/20 transition-colors"
                      >
                        <Upload size={13} /> Submit
                      </button>
                    )}
                    {a.status === 'submitted' && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={13} /> Awaiting grade
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
