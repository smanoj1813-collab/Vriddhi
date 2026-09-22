import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Moon, Sun } from 'lucide-react'
import { useThemeMode } from '../../../shared/contexts/ThemeProvider'
import VriddhiLogo from '../../../shared/components/VriddhiLogo'
import { useTranslation } from '../../../shared/contexts/LanguageProvider'
import { findNavItem } from '../studentNav'
import type { TranslationKey } from '../../../shared/i18n'

interface StudentTopBarProps {
  unreadNotifications?: number
  /** Sign the student out. Omitted on the login shell, which has no session. */
  onSignOut?: () => void
}

/**
 * Compact phone app bar. It replaces the desktop brand header on small
 * screens: the page the student is on, a bell, the theme toggle and — because
 * the only other way out of the portal lived at the bottom of the "More"
 * sheet — a sign-out button within thumb's reach of the top of the screen.
 */
export default function StudentTopBar({ unreadNotifications = 0, onSignOut }: StudentTopBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { resolvedMode, toggleMode } = useThemeMode()
  const { t } = useTranslation()
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const item = findNavItem(location.pathname)
  const pageTitle = item ? (item.translationKey ? t(item.translationKey as TranslationKey) : item.label) : 'Vriddhi'

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 bg-white/92 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b0f19]/92 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-2 px-3">
        <VriddhiLogo
          variant="mark"
          height={30}
          reverse={resolvedMode === 'dark'}
          className="shrink-0"
          title="Vriddhi Institutions"
        />
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
        {onSignOut && (
          <button
            type="button"
            onClick={() => setConfirmSignOut(true)}
            aria-label={t('common.signOut')}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-rose-600 transition-colors active:bg-rose-50 dark:text-rose-400 dark:active:bg-rose-950/40"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {confirmSignOut && onSignOut && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label={t('common.signOut')}>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setConfirmSignOut(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-[#131b2e]">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Sign out of Vriddhi?</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              You will be taken back to the login screen. Anything you have not submitted is already saved on the server.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSignOut(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors active:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:active:bg-slate-800"
              >
                Stay signed in
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSignOut(false)
                  onSignOut()
                }}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white transition-colors active:bg-rose-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
