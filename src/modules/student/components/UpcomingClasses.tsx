// src/components/student/UpcomingClasses.tsx
import { motion } from 'framer-motion';
import { Clock, MapPin, User, BookOpen, ChevronRight } from 'lucide-react';
import type { ClassSchedule } from '../types/student';

interface UpcomingClassesProps {
  classes: ClassSchedule[];
}

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  lecture: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  lab: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  tutorial: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  seminar: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

export default function UpcomingClasses({ classes }: UpcomingClassesProps) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = classes.filter(c => c.day === today).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="glass-card rounded-xl border border-slate-700/30 overflow-hidden"
    >
      <div className="p-5 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Today's Classes</h3>
            <p className="text-sm text-slate-400">{today} &bull; {todayClasses.length} sessions</p>
          </div>
        </div>
        <button className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors">
          View All <ChevronRight size={16} />
        </button>
      </div>

      <div className="divide-y divide-slate-700/30">
        {todayClasses.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <BookOpen size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400">No classes scheduled for today</p>
          </div>
        ) : (
          todayClasses.map((cls, index) => {
            const colors = typeColors[cls.type] || typeColors.lecture;
            const now = new Date();
            const startTime = new Date(`${now.toDateString()} ${cls.startTime}`);
            const endTime = new Date(`${now.toDateString()} ${cls.endTime}`);
            const isOngoing = now >= startTime && now <= endTime;
            const isUpcoming = now < startTime;
            const isCompleted = now > endTime;

            return (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`p-4 hover:bg-slate-800/30 transition-colors ${isOngoing ? 'bg-teal-500/5' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Time Column */}
                  <div className="flex flex-col items-center min-w-[70px]">
                    <span className="text-sm font-semibold text-white">{cls.startTime}</span>
                    <span className="text-xs text-slate-500">{cls.endTime}</span>
                    {isOngoing && (
                      <span className="mt-1 px-2 py-0.5 text-xs font-medium bg-teal-500 text-white rounded-full animate-pulse">
                        Live
                      </span>
                    )}
                    {isCompleted && (
                      <span className="mt-1 text-xs text-slate-500">Done</span>
                    )}
                    {isUpcoming && (
                      <span className="mt-1 text-xs text-amber-400">Upcoming</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-white truncate">{cls.subject}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{cls.topic}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${colors.bg} ${colors.text} ${colors.border} capitalize shrink-0`}>
                        {cls.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {cls.faculty}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {cls.room}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {Math.round((endTime.getTime() - startTime.getTime()) / 60000)} min
                      </span>
                    </div>
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