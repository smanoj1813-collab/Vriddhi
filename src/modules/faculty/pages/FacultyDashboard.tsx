import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useFacultyData } from '../../../hooks/useFacultyData';
import {
  Users, BookOpen, Calendar, TrendingUp, TrendingDown, AlertTriangle, Bell,
  CheckCircle, Clock, ChevronRight, Target, Award, FileText, ClipboardCheck,
  FileUp, Brain, FileQuestion, BarChart3, ArrowRight, Loader2,
} from 'lucide-react';
import type { FacultyStudent, FacultyTopic, ClassSession } from '../../../hooks/useFacultyData';

// ─── Sub-components ─────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, subtext, color, trend,
}: {
  icon: React.ElementType; label: string; value: string; subtext?: string;
  color: string; trend?: number;
}) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  return (
    <div className={`rounded-xl md:rounded-2xl border p-3 md:p-5 ${colorMap[color] || colorMap.teal}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs md:text-sm opacity-80 mb-0.5 md:mb-1 truncate">{label}</p>
          <h3 className="text-xl md:text-2xl font-bold">{value}</h3>
          {subtext && <p className="text-xs mt-0.5 md:mt-1 opacity-70 truncate">{subtext}</p>}
        </div>
        <div className="p-1.5 md:p-2 rounded-xl bg-white/5 shrink-0">
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 md:mt-3 text-xs">
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, color = 'teal' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
    emerald: 'bg-emerald-500', slate: 'bg-slate-500',
  };
  return (
    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || colorMap.teal}`}
        style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function StudentRow({ student }: { student: FacultyStudent }) {
  const statusColors: Record<string, string> = {
    good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    average: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    weak: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <div className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all">
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs md:text-sm font-semibold text-slate-300 shrink-0">
        {student.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{student.name}</p>
        <p className="text-xs text-slate-400">{student.rollNo}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{student.attendancePercentage}%</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[student.status]}`}>
            {student.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Avg: {student.avgScore}%</p>
      </div>
    </div>
  );
}

function TopicItem({ topic }: { topic: FacultyTopic }) {
  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
    covered: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    'in-progress': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    pending: { icon: Target, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  };
  const config = statusConfig[topic.status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className={`p-1.5 md:p-2 rounded-lg ${config.bg} shrink-0`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{topic.title}</p>
        <p className="text-xs text-slate-400">{topic.unit} &bull; {topic.duration} hrs</p>
      </div>
      {topic.dateCovered && <span className="text-xs text-slate-500 shrink-0">{topic.dateCovered}</span>}
    </div>
  );
}

interface FacultyPaper {
  id: string;
  title: string;
  verificationStatus: 'pending-verification' | 'submitted-for-approval' | 'approved' | 'verified';
}

function TodayClassCard({ session }: { session: ClassSession }) {
  const statusColors: Record<string, string> = {
    scheduled: 'border-amber-500/30 bg-amber-500/5',
    completed: 'border-emerald-500/30 bg-emerald-500/5',
    rescheduled: 'border-blue-500/30 bg-blue-500/5',
    cancelled: 'border-rose-500/30 bg-rose-500/5',
  };
  const statusBadge: Record<string, string> = {
    scheduled: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    completed: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    rescheduled: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    cancelled: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  };
  return (
    <div className={`rounded-xl border p-3 md:p-4 ${statusColors[session.status] || statusColors.scheduled}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h4 className="font-semibold text-white text-sm md:text-base truncate">{session.subject}</h4>
          <p className="text-xs md:text-sm text-slate-400">{session.className}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border shrink-0 ${statusBadge[session.status] || ''}`}>
          {session.status}
        </span>
      </div>
      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-slate-400 flex-wrap">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{session.startTime} - {session.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>{session.room}</span>
        </div>
      </div>
      <div className="mt-2 md:mt-3 flex items-center gap-2 flex-wrap">
        {(session.topicsPlanned || []).map((topic: string, i: number) => (
          <span key={i} className="text-xs px-2 py-1 rounded-lg bg-slate-700/50 text-slate-300">{topic}</span>
        ))}
      </div>
      {!session.attendanceMarked && session.status === 'scheduled' && (
        <Link to="/faculty/attendance" className="mt-2 md:mt-3 inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors">
          Mark Attendance <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, color }: {
  to: string; icon: React.ElementType; label: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'hover:border-teal-500/30 hover:bg-teal-500/5 text-teal-400',
    amber: 'hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400',
    violet: 'hover:border-violet-500/30 hover:bg-violet-500/5 text-violet-400',
    rose: 'hover:border-rose-500/30 hover:bg-rose-500/5 text-rose-400',
    emerald: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400',
    blue: 'hover:border-blue-500/30 hover:bg-blue-500/5 text-blue-400',
  };
  return (
    <Link to={to} className={`p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all text-center group ${colorMap[color] || colorMap.teal}`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
      <p className="text-xs md:text-sm font-medium text-white">{label}</p>
    </Link>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { loading, students, topics, sessions, papers, stats, todayDate } = useFacultyData();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'topics'>('overview');

  const weakStudents = useMemo(() => students.filter((s) => s.status === 'weak'), [students]);
  const goodStudents = useMemo(() => students.filter((s) => s.status === 'good'), [students]);
  const coveredTopics = useMemo(() => topics.filter((t) => t.status === 'covered'), [topics]);
  const pendingTopics = useMemo(() => topics.filter((t) => t.status === 'pending'), [topics]);
  const inProgressTopics = useMemo(() => topics.filter((t) => t.status === 'in-progress'), [topics]);
  const typedPapers = papers as FacultyPaper[];
  const pendingVerifications = useMemo(() => typedPapers.filter((p) => p.verificationStatus === 'pending-verification'), [typedPapers]);
  const pendingApprovals = useMemo(() => typedPapers.filter((p) => p.verificationStatus === 'submitted-for-approval'), [typedPapers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
          <p className="text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Faculty Dashboard</h1>
        <p className="text-sm text-slate-400">
          Welcome back, {user?.name || 'Faculty'}{user?.department ? ` · ${user.department}` : ''}
        </p>
      </div>

      {/* Stats Grid &mdash; 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={Users} label="Total Students" value={String(stats.totalStudents)}
          subtext={`${stats.weakStudentsCount} need attention`} color="teal" />
        <StatCard icon={ClipboardCheck} label="Avg Attendance" value={`${stats.avgAttendance}%`}
          subtext="Class average" color="blue" trend={3} />
        <StatCard icon={CheckCircle} label="Topics Covered" value={`${stats.topicsCovered}/${topics.length}`}
          subtext={`${stats.topicsPending} pending`} color="emerald" />
        <StatCard icon={FileText} label="Papers" value={String(stats.papersUploaded)}
          subtext={`${stats.papersPendingApproval} awaiting approval`} color="violet" />
      </div>

      {/* Quick Actions &mdash; horizontal scroll on very small screens, 2-col grid otherwise */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 mb-6 md:mb-8">
        <QuickAction to="/faculty/attendance" icon={ClipboardCheck} label="Mark Attendance" color="teal" />
        <QuickAction to="/faculty/topics" icon={Target} label="Manage Topics" color="teal" />
        <QuickAction to="/faculty/question-bank" icon={Brain} label="Question Bank" color="teal" />
        <QuickAction to="/faculty/paper-generator" icon={FileQuestion} label="Generate Paper" color="teal" />
        <QuickAction to="/faculty/papers" icon={FileText} label="My Papers" color="teal" />
        <QuickAction to="/faculty/student-analysis" icon={BarChart3} label="Student Analysis" color="teal" />
        <QuickAction to="/faculty/reschedule" icon={Calendar} label="Reschedule" color="amber" />
        <QuickAction to="/faculty/upload-material" icon={FileUp} label="Upload Material" color="violet" />
        <QuickAction to="/faculty/announcements" icon={Bell} label="Announcements" color="rose" />
        <QuickAction to="/faculty/assignments" icon={BookOpen} label="Assignments" color="emerald" />
        <QuickAction to="/faculty/calendar" icon={Calendar} label="Calendar" color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: 'Student Performance' },
          { id: 'topics', label: 'Topics Progress' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'students' | 'topics')}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Today's Classes */}
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Today's Classes
                </h2>
                <span className="text-xs text-slate-500">{todayDate}</span>
              </div>
              {sessions.length > 0 ? (
                sessions.map((session) => <TodayClassCard key={session.id} session={session} />)
              ) : (
                <div className="p-6 md:p-8 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <p className="text-sm md:text-base text-slate-400">No classes scheduled for today</p>
                </div>
              )}
            </div>

            {/* Paper Status */}
            <div>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Paper Status
                </h2>
                <Link to="/faculty/papers" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-2 md:space-y-3">
                {pendingVerifications.length > 0 && (
                  <div className="p-3 md:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-400">Pending Verification</span>
                    </div>
                    {pendingVerifications.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-white truncate">{paper.title}</span>
                        </div>
                        <Link to="/faculty/papers" className="text-xs text-teal-400 hover:text-teal-300 shrink-0">Review</Link>
                      </div>
                    ))}
                  </div>
                )}
                {pendingApprovals.length > 0 && (
                  <div className="p-3 md:p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-blue-400">Awaiting HOD Approval</span>
                    </div>
                    {pendingApprovals.map((paper) => (
                      <div key={paper.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-sm text-white truncate">{paper.title}</span>
                        </div>
                        <span className="text-xs text-blue-400 shrink-0">Submitted</span>
                      </div>
                    ))}
                  </div>
                )}
                {pendingVerifications.length === 0 && pendingApprovals.length === 0 && (
                  <div className="p-3 md:p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                    <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">All papers up to date!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4 md:space-y-6">
            {/* Weak Students Alert */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                <h3 className="font-semibold text-rose-400 text-sm md:text-base">Attention Needed</h3>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mb-2 md:mb-3">
                {weakStudents.length} students are flagged as weak performers
              </p>
              <div className="space-y-2">
                {weakStudents.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-300 truncate">{s.name}</span>
                    <span className="text-rose-400 shrink-0">{s.attendancePercentage}% attd</span>
                  </div>
                ))}
              </div>
              <Link to="/faculty/student-analysis" className="mt-2 md:mt-3 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                View all analysis <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Topic Progress */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-3 md:p-4">
              <h3 className="font-semibold text-white mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Syllabus Progress
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-slate-400">Covered</span>
                    <span className="text-emerald-400">{coveredTopics.length}</span>
                  </div>
                  <ProgressBar value={topics.length > 0 ? (coveredTopics.length / topics.length) * 100 : 0} color="emerald" />
                </div>
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-slate-400">In Progress</span>
                    <span className="text-amber-400">{inProgressTopics.length}</span>
                  </div>
                  <ProgressBar value={topics.length > 0 ? (inProgressTopics.length / topics.length) * 100 : 0} color="amber" />
                </div>
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-slate-400">Pending</span>
                    <span className="text-slate-400">{pendingTopics.length}</span>
                  </div>
                  <ProgressBar value={topics.length > 0 ? (pendingTopics.length / topics.length) * 100 : 0} color="slate" />
                </div>
              </div>
              <Link to="/faculty/topics" className="mt-3 md:mt-4 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                Manage topics <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                <h3 className="font-semibold text-emerald-400 text-sm md:text-base">Good Performers</h3>
              </div>
              <p className="text-2xl font-bold text-white">{goodStudents.length}</p>
              <p className="text-xs text-slate-400">Attendance &gt; 85%, Score &gt; 80%</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-400 text-sm md:text-base">Average</h3>
              </div>
              <p className="text-2xl font-bold text-white">{students.filter((s) => s.status === 'average').length}</p>
              <p className="text-xs text-slate-400">Attendance 75-85%, Score 60-80%</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                <h3 className="font-semibold text-rose-400 text-sm md:text-base">Weak Students</h3>
              </div>
              <p className="text-2xl font-bold text-white">{weakStudents.length}</p>
              <p className="text-xs text-slate-400">Attendance &lt; 75% or Score &lt; 60%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> Good Performers
              </h3>
              <div className="space-y-2">
                {goodStudents.map((student) => <StudentRow key={student.id} student={student} />)}
              </div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-rose-400" /> Needs Attention
              </h3>
              <div className="space-y-2">
                {weakStudents.map((student) => <StudentRow key={student.id} student={student} />)}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Link to="/faculty/student-analysis" className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all font-medium text-sm md:text-base">
              <BarChart3 className="w-4 h-4" /> View Full Student Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="p-3 md:p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 mb-2" />
              <h3 className="text-2xl font-bold text-white">{coveredTopics.length}</h3>
              <p className="text-xs md:text-sm text-slate-400">Topics Covered</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400 mb-2" />
              <h3 className="text-2xl font-bold text-white">{inProgressTopics.length}</h3>
              <p className="text-xs md:text-sm text-slate-400">In Progress</p>
            </div>
            <div className="p-3 md:p-4 rounded-xl bg-slate-500/5 border border-slate-500/20">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-slate-400 mb-2" />
              <h3 className="text-2xl font-bold text-white">{pendingTopics.length}</h3>
              <p className="text-xs md:text-sm text-slate-400">Pending</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" /> Covered Topics
              </h3>
              <div className="space-y-2">
                {coveredTopics.map((topic) => <TopicItem key={topic.id} topic={topic} />)}
              </div>
            </div>
            <div>
              <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-slate-400" /> Pending Topics
              </h3>
              <div className="space-y-2">
                {pendingTopics.map((topic) => <TopicItem key={topic.id} topic={topic} />)}
              </div>
              {inProgressTopics.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> In Progress
                  </h3>
                  <div className="space-y-2">
                    {inProgressTopics.map((topic) => <TopicItem key={topic.id} topic={topic} />)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Link to="/faculty/topics" className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30 transition-all font-medium text-sm md:text-base">
              <Target className="w-4 h-4" /> Manage All Topics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
