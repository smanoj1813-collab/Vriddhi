import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useStudentData } from '../hooks/useStudentData';
import { useThemeMode } from '../../../shared/contexts/ThemeProvider';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher';
import { isPwaStandalone, requestPwaInstall } from '../../../shared/pwa/install';
import type { TranslationKey } from '../../../shared/i18n';
import { STUDENT_NAV_ITEMS } from '../studentNav';
import {
  School,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Download,
} from 'lucide-react';

/**
 * Desktop sidebar only. On a phone the same destinations are served by the
 * bottom bar + "More" sheet (see StudentBottomNav / StudentMoreSheet): a
 * slide-over drawer with an 18-row list is precisely what made the installed
 * app feel like a squeezed desktop site.
 */
export default function StudentSidebar({ onSignOut }: { onSignOut: () => void }) {
  const { profile, unreadNotifications } = useStudentData();
  const { resolvedMode, toggleMode } = useThemeMode();
  const { t } = useTranslation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('vriddhi-student-collapsed') === 'true';
  });

  const showInstallApp = !isPwaStandalone();

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('vriddhi-student-collapsed', String(next));
  };

  // A collapsed rail is a mouse affordance; a narrow desktop window gets the
  // full list so labels are never cut off mid-word.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 1100px)');
    const apply = () => {
      if (media.matches) {
        setIsCollapsed(false);
        localStorage.setItem('vriddhi-student-collapsed', 'false');
      }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  // In the installed app there is nothing left to install, so that row would
  // just be dead weight in the list.
  const navItems = showInstallApp ? STUDENT_NAV_ITEMS : STUDENT_NAV_ITEMS.filter((item) => item.id !== 'install-app');

  return (
    <>
    <aside
      className={`hidden md:flex fixed left-0 top-0 h-full ${sidebarWidth} shrink-0 flex-col bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50`}
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
        <button
          onClick={toggleCollapsed}
          className="flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
          />
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
          const Icon = item.icon;
          const badge = item.badge === 'notifications' && unreadNotifications > 0 ? unreadNotifications : undefined;
          const translatedLabel = item.translationKey ? t(item.translationKey as TranslationKey) : item.label;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/student/dashboard'}
              title={isCollapsed ? translatedLabel : undefined}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 min-h-[40px] rounded-xl text-sm transition-all duration-150 group
                ${isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className="relative shrink-0">
                <Icon className={`w-4 h-4 ${'text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`} />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="truncate text-[13px]">{translatedLabel}</span>
              )}
            </NavLink>
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
        {showInstallApp && (
          <button
            onClick={requestPwaInstall}
            title={isCollapsed ? 'Install app' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <Download className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Install app</span>}
          </button>
        )}
        <button
          onClick={toggleMode}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          {resolvedMode === 'dark' ? <Sun className="w-4 h-4 shrink-0 text-amber-400" /> : <Moon className="w-4 h-4 shrink-0 text-slate-500" />}
          {!isCollapsed && <span>{resolvedMode === 'dark' ? t('common.lightMode') : t('common.darkMode')}</span>}
        </button>

        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>{t('common.signOut')}</span>}
        </button>
      </div>
    </aside>
    {/* Spacer: the aside is fixed, so this reserves its column width. */}
    <div className={`hidden md:block ${sidebarWidth} shrink-0 transition-all duration-300`} />
    </>
  );
}
