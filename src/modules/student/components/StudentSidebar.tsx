import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  FileText,
  CreditCard,
  UserCheck,
  TrendingUp,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Library,
  CalendarDays,
  FileUp,
} from 'lucide-react';
import { useState } from 'react';
import { useStudentData } from '../hooks/useStudentData';

const navItems = [
  { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/schedule', label: 'Class Schedule', icon: Calendar },
  { path: '/student/assessments', label: 'Assessments', icon: ClipboardList },
  { path: '/student/assignments', label: 'Assignments', icon: FileUp },
  { path: '/student/attendance', label: 'Attendance', icon: UserCheck },
  { path: '/student/grades', label: 'Grades & Progress', icon: TrendingUp },
  { path: '/student/fees', label: 'Fee Details', icon: CreditCard },
  { path: '/student/materials', label: 'Study Materials', icon: BookOpen },
  { path: '/student/timetable', label: 'Time Table', icon: CalendarDays },
  { path: '/student/library', label: 'Library', icon: Library },
  { path: '/student/events', label: 'Events', icon: CalendarDays },
  { path: '/student/notifications', label: 'Notifications', icon: Bell, badge: true },
];

export default function StudentSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Self-contained: fetch own data via useStudentData
  const studentId = localStorage.getItem('studentToken') || '';
  const { profile, unreadNotifications } = useStudentData(studentId);

  const studentName = profile?.name || 'Student';
  const studentRegNo = profile?.regNo || '';
  const avatar = profile?.avatar;
  const unreadCount = unreadNotifications;

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    localStorage.removeItem('studentRole');
    navigate('/student/login');
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800/90 backdrop-blur-md border border-slate-700/50 text-slate-200 hover:bg-slate-700/90 transition-colors"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/30 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Vriddhi</h1>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 mx-4 mt-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <img
              src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentRegNo}`}
              alt={studentName}
              className="w-12 h-12 rounded-full bg-slate-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{studentName}</p>
              <p className="text-xs text-slate-400">{studentRegNo}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1">{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-700/30 space-y-1">
          <NavLink
            to="/student/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}