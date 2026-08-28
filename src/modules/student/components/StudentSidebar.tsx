import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentData } from '../hooks/useStudentData';
import { useThemeMode } from '../../../shared/contexts/ThemeProvider';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher';
import type { TranslationKey } from '../../../shared/i18n';
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
  Sun,
  Moon,
  School,
  ArrowUpRight,
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

const STUDENT_NAV_KEYS: Record<string, TranslationKey> = {
  dashboard: 'nav.dashboard',
  attendance: 'nav.attendance',
  assessments: 'nav.assessments',
  assignments: 'nav.assignments',
  grades: 'nav.grades',
  materials: 'nav.materials',
  timetable: 'nav.timetable',
  fees: 'nav.fees',
  library: 'nav.library',
  events: 'nav.events',
  notifications: 'nav.notifications',
  settings: 'nav.settings',
};

export default function StudentSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, unreadNotifications } = useStudentData();
  const { resolvedMode, toggleMode } = useThemeMode();
  const { t } = useTranslation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('vriddhi-student-collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('vriddhi-student-collapsed', String(next));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || (path !== '/student/dashboard' && location.pathname.startsWith(path));

  const handleLogout = async () => {
    await logout();
    navigate('/student/login', { replace: true });
  };

  const sidebarWidth = isCollapsed ? 'md:w-20' : 'md:w-64';

  return (
    <>
      {/* ═══ Mobile Header ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-sm leading-tight">Vriddhi</h1>
            <p className="text-teal-600 dark:text-teal-400 text-[10px] font-semibold uppercase tracking-wider">{t('nav.studentPortal')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {resolvedMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ═══ Mobile Overlay ═══ */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-300 flex flex-col
          ${sidebarWidth}
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link to="/student/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
              <School className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-teal-600 to-teal-800 dark:from-teal-400 dark:to-teal-200 bg-clip-text text-transparent leading-tight">
                  Vriddhi
                </span>
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 tracking-wider uppercase">
                  {t('nav.studentPortal')}
                </span>
              </div>
            )}
          </Link>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
            />
          </button>
          {/* Close — mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        {!isCollapsed && (
          <div className="p-3 mx-2 my-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {profile?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-900 dark:text-white text-xs font-bold truncate">
                  {profile?.name || 'Student User'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                  {profile?.regNo || 'Reg. No'}
                </p>
                <span className="inline-block text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-1.5 py-0.5 rounded mt-0.5">
                  {profile?.course || 'Undergraduate'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-2 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            const badge = item.id === 'notifications' ? unreadNotifications : undefined;
            const translatedLabel = STUDENT_NAV_KEYS[item.id] ? t(STUDENT_NAV_KEYS[item.id]) : item.label;
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? translatedLabel : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 group
                  ${active
                    ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative shrink-0">
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="truncate text-[13px]">{translatedLabel}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1 bg-white dark:bg-[#131b2e]">
          {!isCollapsed && (
            <div className="px-1 pb-1">
              <LanguageSwitcher compact showLabel={false} className="w-full" />
            </div>
          )}
          {/* Theme Toggle */}
          <button
            onClick={toggleMode}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            {resolvedMode === 'dark' ? <Sun className="w-4 h-4 shrink-0 text-amber-400" /> : <Moon className="w-4 h-4 shrink-0 text-slate-500" />}
            {!isCollapsed && <span>{resolvedMode === 'dark' ? t('common.lightMode') : t('common.darkMode')}</span>}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>{t('common.signOut')}</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Desktop Content Spacer ═══ */}
      <div className={`hidden md:block ${sidebarWidth} shrink-0 transition-all duration-300`} />
    </>
  );
}
