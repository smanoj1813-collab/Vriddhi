// src/components/student/SchedulingPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, User, BookOpen, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, AlertCircle, PlayCircle, ChevronRight as ChevronRightIcon,
  GraduationCap, Target, Layers, ArrowRight, FileText, Link2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface Topic {
  id: string;
  name: string;
  description: string;
  weightage: number;
  duration: number;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  resources?: { title: string; url: string; type: 'pdf' | 'video' | 'link' }[];
}

interface ClassSession {
  id: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  facultyInitials: string;
  room: string;
  timeSlot: string;
  duration: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendance?: 'present' | 'absent' | 'pending';
  date: string;
  topicsCovered: Topic[];
  currentTopic?: Topic;
  upcomingTopic?: Topic;
  notes?: string;
}

interface SyllabusProgress {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  pendingTopics: number;
  overallProgress: number;
}

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════

const TOPICS: Record<string, Topic[]> = {
  'BCOM101': [
    { id: 't1', name: 'Introduction to Accounting', description: 'Basic concepts, principles and conventions', weightage: 5, duration: 2, order: 1, status: 'completed', resources: [{ title: 'Chapter 1 Notes', url: '#', type: 'pdf' }, { title: 'Intro Video', url: '#', type: 'video' }] },
    { id: 't2', name: 'Journal Entries', description: 'Recording transactions in journal', weightage: 10, duration: 3, order: 2, status: 'completed', resources: [{ title: 'Practice Problems', url: '#', type: 'pdf' }] },
    { id: 't3', name: 'Ledger Posting', description: 'Transferring entries to ledger accounts', weightage: 10, duration: 3, order: 3, status: 'completed', resources: [{ title: 'Ledger Templates', url: '#', type: 'pdf' }] },
    { id: 't4', name: 'Trial Balance', description: 'Preparing and analyzing trial balance', weightage: 8, duration: 2, order: 4, status: 'in_progress', resources: [{ title: 'TB Worksheet', url: '#', type: 'pdf' }] },
    { id: 't5', name: 'Financial Statements', description: 'Income statement and balance sheet', weightage: 15, duration: 4, order: 5, status: 'pending', resources: [{ title: 'FS Format Guide', url: '#', type: 'pdf' }] },
    { id: 't6', name: 'Bank Reconciliation', description: 'Reconciling bank and cash book', weightage: 8, duration: 2, order: 6, status: 'pending' },
    { id: 't7', name: 'Depreciation', description: 'Methods and accounting for depreciation', weightage: 12, duration: 3, order: 7, status: 'pending' },
    { id: 't8', name: 'Partnership Accounts', description: 'Admission, retirement and dissolution', weightage: 15, duration: 5, order: 8, status: 'pending' },
    { id: 't9', name: 'Company Accounts', description: 'Issue of shares and debentures', weightage: 10, duration: 4, order: 9, status: 'pending' },
    { id: 't10', name: 'Ratio Analysis', description: 'Liquidity, profitability and solvency ratios', weightage: 7, duration: 2, order: 10, status: 'pending' },
  ],
  'BCOM102': [
    { id: 't1', name: 'Demand Theory', description: 'Law of demand and elasticity', weightage: 12, duration: 3, order: 1, status: 'completed' },
    { id: 't2', name: 'Supply Theory', description: 'Law of supply and market equilibrium', weightage: 10, duration: 2, order: 2, status: 'completed' },
    { id: 't3', name: 'Consumer Behavior', description: 'Utility analysis and indifference curves', weightage: 12, duration: 3, order: 3, status: 'in_progress' },
    { id: 't4', name: 'Production Function', description: 'Law of variable proportions', weightage: 10, duration: 3, order: 4, status: 'pending' },
    { id: 't5', name: 'Cost Analysis', description: 'Short run and long run costs', weightage: 10, duration: 3, order: 5, status: 'pending' },
    { id: 't6', name: 'Market Structures', description: 'Perfect competition and monopoly', weightage: 15, duration: 4, order: 6, status: 'pending' },
    { id: 't7', name: 'Pricing Strategies', description: 'Price discrimination and dumping', weightage: 8, duration: 2, order: 7, status: 'pending' },
    { id: 't8', name: 'Macro Economics', description: 'National income and inflation', weightage: 13, duration: 4, order: 8, status: 'pending' },
  ],
  'BCOM103': [
    { id: 't1', name: 'Indian Contract Act', description: 'Essentials of valid contract', weightage: 15, duration: 4, order: 1, status: 'completed' },
    { id: 't2', name: 'Sale of Goods Act', description: 'Conditions and warranties', weightage: 12, duration: 3, order: 2, status: 'in_progress' },
    { id: 't3', name: 'Partnership Act', description: 'Rights and duties of partners', weightage: 10, duration: 3, order: 3, status: 'pending' },
    { id: 't4', name: 'Company Law', description: 'Incorporation and memorandum', weightage: 15, duration: 4, order: 4, status: 'pending' },
    { id: 't5', name: 'Consumer Protection', description: 'Rights and redressal mechanisms', weightage: 8, duration: 2, order: 5, status: 'pending' },
  ],
};

const SUBJECTS = [
  { name: 'Financial Accounting', code: 'BCOM101', faculty: 'Dr. Rajesh Kumar', initials: 'RK', room: 'Room 301' },
  { name: 'Business Economics', code: 'BCOM102', faculty: 'Prof. Anita Sharma', initials: 'AS', room: 'Room 205' },
  { name: 'Corporate Law', code: 'BCOM103', faculty: 'Dr. Vikram Patel', initials: 'VP', room: 'Room 402' },
  { name: 'Marketing Management', code: 'BCOM104', faculty: 'Prof. Sneha Gupta', initials: 'SG', room: 'Lab 2' },
  { name: 'Business Statistics', code: 'BCOM105', faculty: 'Dr. Arjun Mehta', initials: 'AM', room: 'Room 105' },
  { name: 'Organizational Behavior', code: 'BCOM106', faculty: 'Prof. Priya Nair', initials: 'PN', room: 'Room 203' },
];

const TIME_SLOTS = ['09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:15 AM - 12:15 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:30 PM', '03:30 PM - 05:00 PM'];

function generateMockSchedule(date: Date): ClassSession[] {
  const sessions: ClassSession[] = [];
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0) return sessions;

  const numClasses = 3 + Math.floor(Math.random() * 2);
  const shuffled = [...SUBJECTS].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numClasses; i++) {
    const subject = shuffled[i];
    const allTopics = TOPICS[subject.code] || [];
    const completedTopics = allTopics.filter((t: any) => t.status === 'completed');
    const inProgressTopic = allTopics.find(t => t.status === 'in_progress');
    const upcomingTopic = allTopics.find(t => t.status === 'pending');

    const now = new Date();
    const sessionDate = new Date(date);
    const [startHour] = TIME_SLOTS[i].split(':').map(Number);
    sessionDate.setHours(startHour, 0, 0, 0);

    let status: ClassSession['status'] = 'upcoming';
    if (date.toDateString() === now.toDateString()) {
      if (now.getHours() > startHour + 1) status = 'completed';
      else if (now.getHours() >= startHour && now.getHours() < startHour + 1) status = 'ongoing';
    } else if (date < now) {
      status = 'completed';
    }

    const attendanceStatus: ClassSession['attendance'] = status === 'completed'
      ? (Math.random() > 0.15 ? 'present' : 'absent')
      : 'pending';

    sessions.push({
      id: `sess-${date.toISOString().split('T')[0]}-${i}`,
      subject: subject.name,
      subjectCode: subject.code,
      faculty: subject.faculty,
      facultyInitials: subject.initials,
      room: subject.room,
      timeSlot: TIME_SLOTS[i],
      duration: '1 hr',
      type: i % 3 === 0 ? 'lab' : i % 2 === 0 ? 'tutorial' : 'lecture',
      status,
      attendance: attendanceStatus,
      date: date.toISOString().split('T')[0],
      topicsCovered: completedTopics.slice(0, 3),
      currentTopic: inProgressTopic,
      upcomingTopic: upcomingTopic || undefined,
      notes: status === 'completed' ? 'Discussed key concepts with examples' : undefined,
    });
  }
  return sessions;
}

function getSyllabusProgress(subjectCode: string): SyllabusProgress {
  const topics = TOPICS[subjectCode] || [];
  const completed = topics.filter((t: any) => t.status === 'completed').length;
  const inProgress = topics.filter((t: any) => t.status === 'in_progress').length;
  const pending = topics.filter((t: any) => t.status === 'pending').length;
  return {
    totalTopics: topics.length,
    completedTopics: completed,
    inProgressTopics: inProgress,
    pendingTopics: pending,
    overallProgress: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

export const SchedulingPage: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [showTopicDetail, setShowTopicDetail] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockSessions = generateMockSchedule(selectedDate);
      setSessions(mockSessions);
      setLoading(false);
    }, 300);
  }, [selectedDate, studentId]);

  const navigateDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getStatusConfig = (status: ClassSession['status']) => {
    switch (status) {
      case 'ongoing': return { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', icon: PlayCircle, label: 'Ongoing' };
      case 'completed': return { bg: 'bg-slate-700/50 border-slate-600/30', text: 'text-slate-400', icon: CheckCircle, label: 'Completed' };
      case 'cancelled': return { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400', icon: XCircle, label: 'Cancelled' };
      default: return { bg: 'bg-slate-800/50 border-slate-700/30', text: 'text-white', icon: Clock, label: 'Upcoming' };
    }
  };

  const getTypeConfig = (type: ClassSession['type']) => {
    switch (type) {
      case 'lab': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'tutorial': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'seminar': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getAttendanceIcon = (attendance?: ClassSession['attendance']) => {
    switch (attendance) {
      case 'present': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleTopicClick = (topic: Topic, session: ClassSession) => {
    setSelectedTopic(topic);
    setSelectedSession(session);
    setShowTopicDetail(true);
  };

  const weekDays = getWeekDays();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
          <p className="text-slate-400 text-sm">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Class Schedule</h1>
          <p className="text-slate-400 text-sm">View your daily classes, topics covered and syllabus progress</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
          <button onClick={() => navigateDay(-1)} className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="text-white font-medium text-sm">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button onClick={() => navigateDay(1)} className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((day, idx) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const isToday = day.toDateString() === new Date().toDateString();
          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center min-w-[64px] p-3 rounded-xl border transition-all ${
                isSelected ? 'bg-teal-500/20 border-teal-500/40 text-teal-400' :
                isToday ? 'bg-slate-700/30 border-slate-600/30 text-white' :
                'bg-slate-800/30 border-slate-700/20 text-slate-400 hover:bg-slate-700/20'
              }`}
            >
              <span className="text-xs font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className={`text-lg font-bold ${isSelected ? 'text-teal-400' : 'text-white'}`}>{day.getDate()}</span>
              {isToday && <div className="w-1 h-1 rounded-full bg-teal-400 mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Class Sessions */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No classes scheduled</h3>
            <p className="text-slate-500">Enjoy your day off!</p>
          </div>
        ) : (
          sessions.map(session => {
            const statusCfg = getStatusConfig(session.status);
            const StatusIcon = statusCfg.icon;
            const progress = getSyllabusProgress(session.subjectCode);

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-800/50 border rounded-2xl overflow-hidden transition-all hover:bg-slate-700/30 ${
                  session.status === 'ongoing' ? 'border-teal-500/30 shadow-lg shadow-teal-500/5' : 'border-slate-700/50'
                }`}
              >
                {/* Main Class Card */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Time */}
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        session.status === 'ongoing' ? 'bg-teal-500/20' : 'bg-slate-700/50'
                      }`}>
                        <Clock className={`w-5 h-5 ${session.status === 'ongoing' ? 'text-teal-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{session.timeSlot}</div>
                        <div className="text-xs text-slate-500">{session.duration}</div>
                      </div>
                    </div>

                    {/* Subject Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{session.subject}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase border ${getTypeConfig(session.type)}`}>
                          {session.type}
                        </span>
                        {session.status === 'ongoing' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{session.subjectCode}</div>
                    </div>

                    {/* Faculty & Room */}
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{session.faculty}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{session.room}</span>
                      </div>
                    </div>

                    {/* Attendance */}
                    {session.status === 'completed' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/30">
                        {getAttendanceIcon(session.attendance)}
                        <span className={`text-xs font-medium capitalize ${
                          session.attendance === 'present' ? 'text-emerald-400' :
                          session.attendance === 'absent' ? 'text-red-400' : 'text-slate-400'
                        }`}>{session.attendance}</span>
                      </div>
                    )}

                    {session.status === 'upcoming' && (
                      <div className="px-3 py-2 rounded-lg bg-slate-700/30 text-xs text-slate-400">
                        Upcoming
                      </div>
                    )}
                  </div>

                  {/* Syllabus Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-slate-500" />
                        <span className="text-xs text-slate-400">Syllabus Progress</span>
                      </div>
                      <span className="text-xs font-medium text-teal-400">{progress.overallProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progress.overallProgress}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>{progress.completedTopics} completed</span>
                      <span>{progress.inProgressTopics} in progress</span>
                      <span>{progress.pendingTopics} pending</span>
                    </div>
                  </div>
                </div>

                {/* Topics Section - Expandable */}
                <div className="border-t border-slate-700/30">
                  {/* Past Topics */}
                  {session.topicsCovered.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {session.topicsCovered.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => handleTopicClick(topic, session)}
                            className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/20 hover:border-teal-500/30 transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-sm text-white">{topic.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600/30 text-slate-400">{topic.weightage}%</span>
                            <ChevronRightIcon className="w-3 h-3 text-slate-500 group-hover:text-teal-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Topic */}
                  {session.currentTopic && (
                    <div className="px-4 pb-4">
                      <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <PlayCircle className="w-3.5 h-3.5" />Current Topic
                      </h4>
                      <button
                        onClick={() => handleTopicClick(session.currentTopic!, session)}
                        className="w-full text-left p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:border-teal-500/40 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-white group-hover:text-teal-400 transition-colors">{session.currentTopic.name}</h5>
                            <p className="text-sm text-slate-400 mt-1">{session.currentTopic.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 rounded bg-teal-500/20 text-teal-400">Weightage: {session.currentTopic.weightage}%</span>
                              <span className="text-xs text-slate-500">Duration: {session.currentTopic.duration} hrs</span>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Upcoming Topic */}
                  {session.upcomingTopic && session.status !== 'completed' && (
                    <div className="px-4 pb-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />Upcoming Topic
                      </h4>
                      <button
                        onClick={() => handleTopicClick(session.upcomingTopic!, session)}
                        className="w-full text-left p-4 rounded-xl bg-slate-700/20 border border-slate-600/20 hover:border-slate-500/40 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-slate-300 group-hover:text-white transition-colors">{session.upcomingTopic.name}</h5>
                            <p className="text-sm text-slate-500 mt-1">{session.upcomingTopic.description}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 rounded bg-slate-600/30 text-slate-400">Weightage: {session.upcomingTopic.weightage}%</span>
                              <span className="text-xs text-slate-500">Duration: {session.upcomingTopic.duration} hrs</span>
                            </div>
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Summary Footer */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <div className="text-xs text-slate-500 mt-1">Total Classes</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {sessions.filter(s => s.attendance === 'present').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Present</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">
              {sessions.filter(s => s.attendance === 'absent').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Absent</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {sessions.filter(s => s.status === 'upcoming').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Upcoming</div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TOPIC DETAIL MODAL
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTopicDetail && selectedTopic && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTopicDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                        selectedTopic.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedTopic.status === 'in_progress' ? 'bg-teal-500/20 text-teal-400' :
                        'bg-slate-600/30 text-slate-400'
                      }`}>
                        {selectedTopic.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">{selectedSession.subjectCode}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedTopic.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">{selectedSession.subject}</p>
                  </div>
                  <button onClick={() => setShowTopicDetail(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />Description
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{selectedTopic.description}</p>
                </div>

                {/* Weightage & Duration */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/30">
                    <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedTopic.weightage}%</div>
                    <div className="text-xs text-slate-500 mt-1">Exam Weightage</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/30">
                    <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{selectedTopic.duration}</div>
                    <div className="text-xs text-slate-500 mt-1">Hours</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 text-center border border-slate-700/30">
                    <GraduationCap className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">#{selectedTopic.order}</div>
                    <div className="text-xs text-slate-500 mt-1">Topic Order</div>
                  </div>
                </div>

                {/* Resources */}
                {selectedTopic.resources && selectedTopic.resources.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-teal-400" />Study Resources
                    </h3>
                    <div className="space-y-2">
                      {selectedTopic.resources.map((resource, idx) => (
                        <a
                          key={idx}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 hover:border-teal-500/30 transition-all group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            resource.type === 'pdf' ? 'bg-red-500/20' :
                            resource.type === 'video' ? 'bg-purple-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              resource.type === 'pdf' ? 'text-red-400' :
                              resource.type === 'video' ? 'text-purple-400' :
                              'text-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors">{resource.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{resource.type}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Topics */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400" />Related Topics in Syllabus
                  </h3>
                  <div className="space-y-2">
                    {TOPICS[selectedSession.subjectCode]?.map(topic => (
                      <div
                        key={topic.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          topic.id === selectedTopic.id
                            ? 'bg-teal-500/10 border-teal-500/30'
                            : 'bg-slate-800/30 border-slate-700/20'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          topic.status === 'completed' ? 'bg-emerald-400' :
                          topic.status === 'in_progress' ? 'bg-teal-400' :
                          'bg-slate-600'
                        }`} />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${topic.id === selectedTopic.id ? 'text-teal-400' : 'text-slate-300'}`}>
                            {topic.name}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">{topic.weightage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};