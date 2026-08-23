import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentData } from '../hooks/useStudentData';
import {
  Calendar, BookOpen, FileText, CreditCard, Clock, CheckCircle, AlertTriangle,
  Bell, ChevronRight, TrendingUp, MapPin, BarChart3, Library, Settings,
} from 'lucide-react';
import type { Assessment, ClassSchedule } from '../types/student';

// ─── Sub-components ─────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtext, color }: {
  icon: React.ElementType; label: string; value: string; subtext?: string; color: string;
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
    <div className={`rounded-xl md:rounded-2xl border p-3 md:p-4 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs md:text-sm opacity-80 mb-0.5 md:mb-1 truncate">{label}</p>
          <h3 className="text-lg md:text-2xl font-bold">{value}</h3>
          {subtext && <p className="text-xs mt-0.5 md:mt-1 opacity-70 truncate">{subtext}</p>}
        </div>
        <div className="p-1.5 md:p-2 rounded-lg bg-white/5 shrink-0">
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
    </div>
  );
}

function ScheduleCard({ session }: { session: ClassSchedule }) {
  return (
    <div className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className="p-2 md:p-2.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
        <Clock className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-medium text-white truncate">{session.subject}</p>
        <p className="text-xs text-slate-400 truncate">
          {session.teacher || session.facultyName || 'Faculty'}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-white">{session.startTime}</p>
        <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
          <MapPin size={10} /> {session.room}
        </p>
      </div>
    </div>
  );
}

function NotificationCard({ notification }: { notification: { id: string; title: string; message: string; type: string; read: boolean } }) {
  const typeColors: Record<string, string> = {
    info: 'border-blue-500/20 bg-blue-500/5',
    warning: 'border-amber-500/20 bg-amber-500/5',
    success: 'border-emerald-500/20 bg-emerald-500/5',
  };
  return (
    <div className={`p-3 rounded-xl border ${typeColors[notification.type] || typeColors.info}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          {notification.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
           notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
           <Bell className="w-4 h-4 text-blue-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{notification.title}</p>
          <p className="text-xs text-slate-400 line-clamp-2">{notification.message}</p>
        </div>
        {!notification.read && <div className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1" />}
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, color }: {
  to: string; icon: React.ElementType; label: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    teal: 'hover:border-teal-500/30 hover:bg-teal-500/5 text-teal-400',
    blue: 'hover:border-blue-500/30 hover:bg-blue-500/5 text-blue-400',
    amber: 'hover:border-amber-500/30 hover:bg-amber-500/5 text-amber-400',
    violet: 'hover:border-violet-500/30 hover:bg-violet-500/5 text-violet-400',
    rose: 'hover:border-rose-500/30 hover:bg-rose-500/5 text-rose-400',
    emerald: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 text-emerald-400',
  };
  return (
    <Link to={to} className={`p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 transition-all text-center group ${colorMap[color]}`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1.5 md:mb-2 group-hover:scale-110 transition-transform" />
      <p className="text-xs md:text-sm font-medium text-white">{label}</p>
    </Link>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function StudentDashboard() {
  // Identity comes from Firebase Auth via useStudentData — no localStorage token.
  const { loading, profile, attendance, assessments, assignments, fees, schedule, notifications, unreadNotifications, todayDate } =
    useStudentData();

  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'notifications'>('overview');

  // Safe fee values
  const paidFees = fees?.paidFees || 0;
  const pendingFees = fees?.pendingFees || 0;
  const totalFees = fees?.totalFees || 0;
  const paidPercent = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;
  const pendingPercent = totalFees > 0 ? (pendingFees / totalFees) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto bg-slate-950 min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg md:text-xl">
            {profile?.name?.charAt(0) || 'S'}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold text-white truncate">
              Welcome, {profile?.name?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 truncate">
              {profile?.regNo || 'Reg. No'} &bull; {profile?.course || 'Course'} &bull; {profile?.batch || 'Batch'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard icon={Calendar} label="Attendance" value={`${attendance?.percentage ?? 0}%`}
          subtext={`${attendance?.presentClasses ?? 0}/${attendance?.totalClasses ?? 0} classes`} color="teal" />
        <StatCard icon={BookOpen} label="Assessments" value={String(assessments?.length ?? 0)} subtext="Upcoming" color="blue" />
        <StatCard icon={FileText} label="Assignments" value={String(assignments?.length ?? 0)} subtext="Pending" color="amber" />
        <StatCard icon={CreditCard} label="Fees" value={`₹${pendingFees.toLocaleString()}`}
          subtext={pendingFees > 0 ? 'Due' : 'Paid'} color={pendingFees > 0 ? 'rose' : 'emerald'} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 mb-6 md:mb-8">
        <QuickAction to="/student/attendance" icon={Calendar} label="Attendance" color="teal" />
        <QuickAction to="/student/assessments" icon={BookOpen} label="Assessments" color="blue" />
        <QuickAction to="/student/assignments" icon={FileText} label="Assignments" color="amber" />
        <QuickAction to="/student/grades" icon={TrendingUp} label="Grades" color="emerald" />
        <QuickAction to="/student/materials" icon={Library} label="Materials" color="violet" />
        <QuickAction to="/student/timetable" icon={Clock} label="Timetable" color="rose" />
        <QuickAction to="/student/fees" icon={CreditCard} label="Fees" color="teal" />
        <QuickAction to="/student/library" icon={BookOpen} label="Library" color="blue" />
        <QuickAction to="/student/events" icon={Calendar} label="Events" color="amber" />
        <QuickAction to="/student/settings" icon={Settings} label="Settings" color="violet" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'schedule', label: "Today's Schedule" },
          { id: 'notifications', label: `Notifications ${unreadNotifications > 0 ? `(${unreadNotifications})` : ''}` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
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
            {/* Upcoming Assessments */}
            <div>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Upcoming Assessments
                </h2>
                <Link to="/student/assessments" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {assessments.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {assessments.slice(0, 3).map((a: Assessment) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{a.title}</p>
                        <p className="text-xs text-slate-400">{a.subject} &bull; {a.type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400">{a.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 md:p-8 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No upcoming assessments</p>
                </div>
              )}
            </div>

            {/* Pending Assignments */}
            <div>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-amber-400" /> Pending Assignments
                </h2>
                <Link to="/student/assignments" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {assignments.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {assignments.slice(0, 3).map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 md:p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{a.title}</p>
                        <p className="text-xs text-slate-400">{a.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-amber-400">Due {a.dueDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 md:p-8 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">All assignments submitted!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4 md:space-y-6">
            {/* Fee Status */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 md:p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Fee Status
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-slate-400">Paid</span>
                    <span className="text-emerald-400">₹{paidFees.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${paidPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-slate-400">Pending</span>
                    <span className="text-rose-400">₹{pendingFees.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500 transition-all"
                      style={{ width: `${pendingPercent}%` }} />
                  </div>
                </div>
              </div>
              <Link to="/student/fees" className="mt-3 md:mt-4 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                Pay fees <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Recent Notifications */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 md:p-5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm md:text-base">
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Recent
              </h3>
              <div className="space-y-2 md:space-y-3">
                {notifications.slice(0, 3).map((n) => <NotificationCard key={n.id} notification={n} />)}
              </div>
              <Link to="/student/notifications" className="mt-3 md:mt-4 text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> Today's Schedule
            </h2>
            <span className="text-xs text-slate-500">{todayDate}</span>
          </div>
          {schedule.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {schedule.map((s) => <ScheduleCard key={s.id} session={s} />)}
            </div>
          ) : (
            <div className="p-8 md:p-12 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Calendar className="w-8 h-8 md:w-10 md:h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm md:text-base text-slate-400">No classes scheduled for today</p>
              <p className="text-xs text-slate-500 mt-1">Enjoy your day off!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-3 md:space-y-4">
          <h2 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-teal-400" /> All Notifications
          </h2>
          {notifications.length > 0 ? (
            notifications.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="p-8 md:p-12 text-center rounded-xl bg-slate-800/50 border border-slate-700/50">
              <Bell className="w-8 h-8 md:w-10 md:h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm md:text-base text-slate-400">No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
