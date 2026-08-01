// src/components/student/StatsCards.tsx
import { motion } from 'framer-motion';
import {
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  DollarSign,
  Bell,
  Clock,
  TrendingDown,
  FileX,
} from 'lucide-react';
import type { StudentDashboardStats } from '../types/student';

interface StatsCardsProps {
  stats: StudentDashboardStats;
}

const cards = [
  {
    key: 'upcomingClasses' as const,
    label: 'Upcoming Classes',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    key: 'pendingAssignments' as const,
    label: 'Pending Assignments',
    icon: ClipboardCheck,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    key: 'upcomingAssessments' as const,
    label: 'Upcoming Assessments',
    icon: Clock,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
  },
  {
    key: 'attendancePercentage' as const,
    label: 'Attendance',
    icon: TrendingDown,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    suffix: '%',
  },
  {
    key: 'feeDue' as const,
    label: 'Fee Due',
    icon: DollarSign,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/20',
    prefix: 'Rs.',
    alert: true,
  },
  {
    key: 'newNotifications' as const,
    label: 'New Notifications',
    icon: Bell,
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/20',
  },
  {
    key: 'overdueAssignments' as const,
    label: 'Overdue Assignments',
    icon: FileX,
    color: 'from-rose-500 to-rose-600',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/20',
    alert: true,
  },
  {
    key: 'lowAttendanceSubjects' as const,
    label: 'Low Attendance Alert',
    icon: AlertTriangle,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/20',
    alert: true,
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const isAlert = card.alert && (typeof value === 'number' ? value > 0 : false);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className={`glass-card rounded-xl p-5 border ${card.borderColor} hover:shadow-lg hover:shadow-${card.color.split('-')[1]}-500/10 transition-all duration-300 group cursor-pointer`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                <Icon size={20} className={card.textColor} />
              </div>
              {isAlert && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {card.prefix || ''}
                {typeof value === 'number' && card.key === 'feeDue'
                  ? value.toLocaleString('en-IN')
                  : value}
                {card.suffix || ''}
              </p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
            </div>
            <div className={`mt-3 h-1 rounded-full bg-slate-700/50 overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((typeof value === 'number' ? value : 0) / (card.key === 'attendancePercentage' ? 100 : 10) * 100, 100)}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full bg-gradient-to-r ${card.color}`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}