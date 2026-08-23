import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentData } from '../hooks/useStudentData';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  TrendingUp,
  Library,
  Clock,
  CreditCard,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { id: 'attendance', label: 'Attendance', path: '/student/attendance', icon: Calendar },
  { id: 'assessments', label: 'Assessments', path: '/student/assessments', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', path: '/student/assignments', icon: FileText },
  { id: 'grades', label: 'Grades', path: '/student/grades', icon: TrendingUp },
  { id: 'materials', label: 'Materials', path: '/student/materials', icon: Library },
  { id: 'timetable', label: 'Timetable', path: '/student/timetable', icon: Clock },
  { id: 'fees', label: 'Fees', path: '/student/fees', icon: CreditCard },
  { id: 'library', label: 'Library', path: '/student/library', icon: GraduationCap },
  { id: 'events', label: 'Events', path: '/student/events', icon: CalendarDays },
  { id: 'notifications', label: 'Notifications', path: '/student/notifications', icon: Bell },
  { id: 'settings', label: 'Settings', path: '/student/settings', icon: Settings },
];

export default function StudentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, unreadNotifications } = useStudentData();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/student/login', { replace: true });
  };

  const sidebarWidth = isCollapsed ? 'md:w-20' : 'md:w-72';

  return (
    <>
      {/* ═══ Mobile Header ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Vriddhi</h1>
            <p className="text-slate-400 text-[10px]">Student Portal</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ═══ Mobile Overlay ═══ */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside
        className={`fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 z-50 transition-all duration-300
          ${sidebarWidth}
          ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-white font-bold text-sm">Vriddhi</h1>
                <p className="text-slate-400 text-[10px]">Student Portal</p>
              </div>
            )}
          </div>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
          {/* Close — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 border-b border-slate-800">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg shrink-0">
              {profile?.name?.charAt(0) || 'S'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">
                  {profile?.name || 'Student'}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {profile?.regNo || 'Reg. No'}
                </p>
                <p className="text-slate-500 text-[10px] truncate">
                  {profile?.course || 'Course'} · {profile?.batch || 'Batch'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {!isCollapsed && (
            <div className="px-3 py-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Menu
              </span>
            </div>
          )}
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const badge = item.id === 'notifications' ? unreadNotifications : undefined;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group
                  ${active
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative shrink-0">
                  <Icon className={`w-5 h-5 ${active ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="truncate font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Desktop Content Spacer ═══ */}
      <div className={`hidden md:block ${sidebarWidth} shrink-0 transition-all duration-300`} />
    </>
  );
}