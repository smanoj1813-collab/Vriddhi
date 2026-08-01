// src/components/student/PendingAssignments.tsx
import { motion } from 'framer-motion';
import { FileUp, Clock, AlertTriangle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import type { Assignment } from '../types/student';

interface PendingAssignmentsProps {
  assignments: Assignment[];
  onSubmit: (assignmentId: string) => void;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  overdue: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Overdue' },
  submitted: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Submitted' },
  'late-submitted': { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Late' },
  graded: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Graded' },
};

export default function PendingAssignments({ assignments, onSubmit }: PendingAssignmentsProps) {
  const pending = assignments
    .filter(a => a.status === 'pending' || a.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const getDaysLeft = (dueDate: string, dueTime: string) => {
    const due = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    const hours = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 0) return { text: 'Overdue', urgent: true };
    if (hours < 24) return { text: `${hours}h left`, urgent: true };
    return { text: `${days} days left`, urgent: false };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="glass-card rounded-xl border border-slate-700/30 overflow-hidden"
    >
      <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FileUp size={18} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Pending Assignments</h3>
            <p className="text-sm text-slate-400">{pending.filter(a => a.status === 'pending').length} pending, {pending.filter(a => a.status === 'overdue').length} overdue</p>
          </div>
        </div>
        <button className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div className="divide-y divide-slate-700/30">
        {pending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-400">All assignments completed!</p>
          </div>
        ) : (
          pending.map((assignment, index) => {
            const status = statusConfig[assignment.status];
            const StatusIcon = status.icon;
            const timeLeft = getDaysLeft(assignment.dueDate, assignment.dueTime);
            const submissionTypeIcons: Record<string, string> = {
              document: '📄', image: '🖼️', code: '💻', video: '🎥', presentation: '📊', mixed: '📁'
            };

            return (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-4 hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{assignment.title}</h4>
                      <span className="text-sm">{submissionTypeIcons[assignment.submissionType]}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{assignment.subject} • {assignment.maxMarks} marks</p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className={`flex items-center gap-1 text-xs ${timeLeft.urgent ? 'text-red-400' : 'text-slate-500'}`}>
                        <Clock size={12} />
                        Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {assignment.dueTime}
                      </span>
                      <span className={`text-xs font-medium ${timeLeft.urgent ? 'text-red-400' : 'text-slate-500'}`}>
                        {timeLeft.text}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${status.bg} ${status.color} ${status.color.replace('text', 'border').replace('400', '500/20')}`}>
                      <StatusIcon size={10} className="inline mr-1" />
                      {status.label}
                    </span>
                    {assignment.status !== 'overdue' && (
                      <button
                        onClick={() => onSubmit(assignment.id)}
                        className="opacity-0 group-hover:opacity-100 px-3 py-1 text-xs font-medium bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-all"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}