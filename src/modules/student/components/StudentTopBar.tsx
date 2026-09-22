import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Moon, School, Sun } from 'lucide-react'
import { useThemeMode } from '../../../shared/contexts/ThemeProvider'
import { useTranslation } from '../../../shared/contexts/LanguageProvider'
import { findNavItem } from '../studentNav'
import type { TranslationKey } from '../../../shared/i18n'

interface StudentTopBarProps {
  unreadNotifications?: number
}

/**
 * Compact phone app bar. It replaces the desktop brand header on small
 * screens: the page the student is on, a bell, and the theme toggle — nothing
 * that needs a hover state or a mouse.
 */
export default function StudentTopBar({ unreadNotifications = 0 }: StudentTopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedMode, toggleMode } = useThemeMode()
  const { t } = useTranslation()
  const item = findNavItem(location.pathname)
  const pageTitle = item ? (item.translationKey ? t(item.translationKey as TranslationKey) : item.label) : 'Vriddhi'

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b0f19]/92 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-2 px-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-sm">
          <School className="h-[18px] w-[18px] text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
            {pageTitle}
          </p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            {t('nav.studentPortal')}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMode}
          aria-label={resolvedMode === 'dark' ? 'Light mode' : 'Dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
        >
          {resolvedMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => navigate('/student/notifications')}
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotifications > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
