// src/modules/student/components/UpcomingAssessments.tsx
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, FileText, AlertCircle, ChevronRight } from 'lucide-react';
import type { Assessment } from '../types/student';

interface UpcomingAssessmentsProps {
  assessments: Assessment[];
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  quiz: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  midterm: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  final: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  assignment: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  project: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  practical: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export default function UpcomingAssessments({ assessments }: UpcomingAssessmentsProps) {
  const upcoming = assessments
    .filter(a => a.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const getDaysLeft = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days left`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="glass-card rounded-xl border border-slate-700/30 overflow-hidden"
    >
      <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <FileText size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Upcoming Assessments</h3>
            <p className="text-sm text-slate-400">{upcoming.length} scheduled</p>
          </div>
        </div>
        <button className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div className="divide-y divide-slate-700/30">
        {upcoming.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No upcoming assessments</p>
          </div>
        ) : (
          upcoming.map((assessment, index) => {
            const colors = typeColors[assessment.type ?? 'quiz'] || typeColors.quiz;
            const daysLeft = getDaysLeft(assessment.date);
            const isUrgent = daysLeft === 'Today' || daysLeft === 'Tomorrow';

            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{assessment.title}</h4>
                      {isUrgent && (
                        <AlertCircle size={14} className="text-red-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{assessment.subject}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(assessment.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {assessment.time ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {assessment.venue ?? 'TBA'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${colors.bg} ${colors.text} ${colors.border} capitalize`}>
                      {assessment.type}
                    </span>
                    <p className={`text-xs mt-1.5 font-medium ${isUrgent ? 'text-red-400' : 'text-slate-500'}`}>
                      {daysLeft}
                    </p>
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