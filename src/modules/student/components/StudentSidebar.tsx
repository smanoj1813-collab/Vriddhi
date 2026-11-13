import { useState, useEffect, useId } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStudentData } from '../hooks/useStudentData';
import { useThemeMode } from '../../../shared/contexts/ThemeProvider';
import { useTranslation } from '../../../shared/contexts/LanguageProvider';
import LanguageSwitcher from '../../../shared/components/LanguageSwitcher';
import VriddhiLogo from '../../../shared/components/VriddhiLogo';
import { isPwaStandalone, requestPwaInstall } from '../../../shared/pwa/install';
import {
  findNavItem, studentNavItemsForProfile, STUDENT_NAV_GROUPS,
  type StudentNavGroup, type StudentNavItem,
} from '../studentNav';
import {
  ChevronDown, ChevronRight, CreditCard, GraduationCap, Sparkles, UserRound,
  Sun, Moon, LogOut, Download,
} from 'lucide-react';
import '@/shared/styles/portalExperience.css';

const COLLAPSED_KEY = 'vriddhi-student-collapsed';
const OPEN_SECTION_KEY = 'vriddhi-student-open-section';
const SECTION_ICONS = {
  academics: GraduationCap,
  practice: Sparkles,
  money: CreditCard,
  account: UserRound,
};

// Navigation must still work when the browser blocks local storage (private
// browsing / embedded webviews). Only presentation preferences are saved here.
function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function savePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Optional preference. */ }
}

/**
 * Desktop accordion navigation. Dashboard stays one tap away; opening a
 * section closes the previous one. Phones keep the bottom bar + More sheet.
 * The optional compact rail still exposes EVERY permitted destination, not
 * just the section that happened to be expanded before compacting it.
 */
export default function StudentSidebar({ onSignOut }: { onSignOut: () => void }) {
  const { profile, unreadNotifications, codingLabEnabled } = useStudentData();
  const { resolvedMode, toggleMode } = useThemeMode();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const sidebarId = useId();
  const activeItem = findNavItem(pathname);
  const activeGroup = activeItem?.id !== 'dashboard' ? activeItem?.group : undefined;

  const [isCollapsed, setIsCollapsed] = useState(() => readPreference(COLLAPSED_KEY) === 'true');
  const [openSection, setOpenSection] = useState<StudentNavGroup | null>(() => {
    if (activeGroup) return activeGroup;
    const saved = readPreference(OPEN_SECTION_KEY);
    if (saved === 'none') return null;
    return STUDENT_NAV_GROUPS.find((group) => group.id === saved)?.id ?? 'academics';
  });
  const showInstallApp = !isPwaStandalone();

  // Deep links, aliases and browser Back/Forward must reveal the current
  // destination. A student can still close that section until the next route.
  useEffect(() => {
    if (activeGroup) setOpenSection(activeGroup);
  }, [pathname, activeGroup]);

  useEffect(() => {
    savePreference(OPEN_SECTION_KEY, openSection ?? 'none');
  }, [openSection]);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    savePreference(COLLAPSED_KEY, String(next));
  };

  // Keep labels on narrow desktop windows, as before.
  useEffect(() => {
    const media = window.matchMedia('(max-width: 1100px)');
    const apply = () => {
      if (media.matches) {
        setIsCollapsed(false);
        savePreference(COLLAPSED_KEY, 'false');
      }
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  // Install has its own footer button. Section hubs remain phone tabs rather
  // than duplicating the pages nested under these desktop section buttons.
  const navItems = studentNavItemsForProfile(profile, codingLabEnabled).filter((item) => item.id !== 'install-app' && !item.hub);
  const topItems = navItems.filter((item) => item.id === 'dashboard');
  const groupedItems = STUDENT_NAV_GROUPS.map((group) => ({
    ...group,
    items: navItems.filter((item) => item.group === group.id && item.id !== 'dashboard'),
  })).filter((group) => group.items.length > 0);

  const renderItem = (item: StudentNavItem) => {
    const Icon = item.icon;
    const isActive = activeItem?.id === item.id;
    const badge = item.badge === 'notifications' && unreadNotifications > 0 ? unreadNotifications : undefined;
    const label = item.translationKey ? t(item.translationKey) : item.label;
    return (
      <Link
        key={item.id}
        to={item.path}
        title={isCollapsed ? label : undefined}
        aria-label={badge ? `${label}, ${badge} unread notifications` : label}
        aria-current={isActive ? 'page' : undefined}
        className={`portal-motion-target flex items-center gap-3 px-3 py-2 min-h-[38px] rounded-xl text-sm transition-colors duration-150 group
          ${isActive
            ? 'bg-teal-600 text-white font-semibold shadow-sm shadow-teal-600/20'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <span className="relative shrink-0">
          <Icon aria-hidden="true" className={`portal-interactive-icon w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400'}`} />
          {badge && (
            <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 min-w-3.5 h-3.5 px-0.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>
        {!isCollapsed && <span className="text-[13px] leading-5">{label}</span>}
      </Link>
    );
  };

  const themeLabel = resolvedMode === 'dark' ? t('common.lightMode') : t('common.darkMode');

  return (
    <>
      <aside
        id={sidebarId}
        aria-label="Student sidebar"
        className={`student-sidebar hidden md:flex fixed left-0 top-0 h-dvh ${sidebarWidth} shrink-0 flex-col bg-white dark:bg-[#131b2e] border-r border-slate-200 dark:border-slate-800 transition-[width] duration-300 z-50`}
      >
        <div className={`flex items-center justify-between h-16 border-b border-slate-200 dark:border-slate-800 shrink-0 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <Link
            to="/student/dashboard"
            className="portal-motion-target flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-md"
            aria-label="Vriddhi Institutions"
          >
            <VriddhiLogo variant={isCollapsed ? 'mark' : 'horizontal'} height={28} reverse={resolvedMode === 'dark'} className="shrink-0" />
            {!isCollapsed && (
              <span className="text-[9px] font-semibold text-teal-700 dark:text-teal-300 tracking-wider uppercase truncate">
                {t('nav.studentPortal')}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="portal-motion-target flex h-8 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            aria-label={isCollapsed ? 'Expand menu' : 'Collapse menu'}
            aria-expanded={!isCollapsed}
            aria-controls={`${sidebarId}-navigation`}
          >
            <ChevronRight aria-hidden="true" className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {!isCollapsed && (
          <div className="p-3 mx-2 my-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 shrink-0">
            <div className="flex items-center gap-3">
              <div aria-hidden="true" className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {profile?.name?.charAt(0) || 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-slate-900 dark:text-white text-xs font-bold truncate">{profile?.name || 'Student User'}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{profile?.regNo || 'Reg. No'}</p>
                <span className="inline-block text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-950/60 px-1.5 py-0.5 rounded mt-0.5">
                  {profile?.course || 'Undergraduate'}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav id={`${sidebarId}-navigation`} aria-label="Student navigation" className="p-2 overflow-y-auto min-h-0 flex-1">
          {topItems.map(renderItem)}
          {groupedItems.map((group) => {
            const isOpen = openSection === group.id;
            const isCurrentSection = activeGroup === group.id;
            const Icon = SECTION_ICONS[group.id];
            const sectionId = `${sidebarId}-section-${group.id}`;
            const hasUnread = group.id === 'account' && unreadNotifications > 0;
            return (
              <div key={group.id} className={isCollapsed ? 'pt-3' : 'pt-1.5'}>
                {isCollapsed ? (
                  <>
                    <div className="mx-3 mb-1 border-t border-slate-200 dark:border-slate-800" />
                    <div className="space-y-0.5">{group.items.map(renderItem)}</div>
                  </>
                ) : (
                  <>
                    <h2>
                      <button
                        type="button"
                        id={`${sectionId}-toggle`}
                        aria-expanded={isOpen}
                        aria-controls={sectionId}
                        onClick={() => setOpenSection((current) => current === group.id ? null : group.id)}
                        className={`portal-motion-target flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors ${
                          isCurrentSection
                            ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon aria-hidden="true" className={`portal-interactive-icon h-4 w-4 shrink-0 ${isCurrentSection ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="flex-1">{group.label}</span>
                        {hasUnread && (
                          <>
                            <span aria-hidden="true" className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 text-[10px] leading-4 text-rose-700 dark:text-rose-300">
                              {unreadNotifications > 9 ? '9+' : unreadNotifications}
                            </span>
                            <span className="sr-only">{unreadNotifications} unread notifications</span>
                          </>
                        )}
                        <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </h2>
                    <div
                      id={sectionId}
                      role="group"
                      aria-labelledby={`${sectionId}-toggle`}
                      hidden={!isOpen}
                      className="student-nav-panel ml-5 mt-1 space-y-0.5 border-l border-slate-200 pl-2 dark:border-slate-700"
                    >
                      {group.items.map(renderItem)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-1 bg-white dark:bg-[#131b2e]">
          {!isCollapsed && (
            <div className="px-1 pb-1">
              <LanguageSwitcher compact showLabel={false} className="w-full" />
            </div>
          )}
          {showInstallApp && (
            <button
              type="button"
              onClick={requestPwaInstall}
              aria-label="Install app"
              title={isCollapsed ? 'Install app' : undefined}
              className={`portal-motion-target w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Download aria-hidden="true" className="portal-interactive-icon w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Install app</span>}
            </button>
          )}
          <button
            type="button"
            onClick={toggleMode}
            aria-label={themeLabel}
            title={isCollapsed ? themeLabel : undefined}
            className={`portal-motion-target w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            {resolvedMode === 'dark'
              ? <Sun aria-hidden="true" className="portal-interactive-icon w-4 h-4 shrink-0 text-amber-400" />
              : <Moon aria-hidden="true" className="portal-interactive-icon w-4 h-4 shrink-0 text-slate-500" />}
            {!isCollapsed && <span>{themeLabel}</span>}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            aria-label={t('common.signOut')}
            title={isCollapsed ? t('common.signOut') : undefined}
            className={`portal-motion-target w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut aria-hidden="true" className="portal-interactive-icon w-4 h-4 shrink-0" />
            {!isCollapsed && <span>{t('common.signOut')}</span>}
          </button>
        </div>
      </aside>
      <div className={`student-sidebar-spacer hidden md:block ${sidebarWidth} shrink-0 transition-[width] duration-300`} />
    </>
  );
}
