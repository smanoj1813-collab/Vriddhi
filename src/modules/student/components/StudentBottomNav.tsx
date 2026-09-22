import { NavLink, useLocation } from 'react-router-dom'
import { Grid2x2 } from 'lucide-react'
import { useTranslation } from '../../../shared/contexts/LanguageProvider'
import type { TranslationKey } from '../../../shared/i18n'
import { findNavItem, mobileTabItems } from '../studentNav'

interface StudentBottomNavProps {
  onOpenMore: () => void
  unreadNotifications?: number
  moreOpen?: boolean
}

/**
 * Thumb-reachable primary navigation for the installed phone app: Dashboard,
 * Academics, Assessments, Learning — then "More" for the occasional pages
 * (Fees, Notifications, Events, Settings…). The desktop sidebar stays for
 * `md+`; on a phone the drawer was the only way to move around, which is why
 * the portal read as a desktop site squeezed into a narrow window.
 */
export default function StudentBottomNav({ onOpenMore, unreadNotifications = 0, moreOpen = false }: StudentBottomNavProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const active = findNavItem(location.pathname)

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0f1729]/95 backdrop-blur-md safe-area-bottom"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1">
        {mobileTabItems().map((item) => {
          const isActive = active?.id === item.id
          const Icon = item.icon
          const label = item.translationKey ? t(item.translationKey as TranslationKey) : item.label
          return (
            <li key={item.id} className="flex-1">
              <NavLink
                to={item.path}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-t-xl px-1 py-1.5 transition-colors ${
                  isActive ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                    isActive ? 'bg-teal-600 dark:bg-teal-400' : 'bg-transparent'
                  }`}
                />
                <span className="relative">
                  <Icon className={`h-[22px] w-[22px] ${isActive ? 'stroke-[2.4]' : ''}`} />
                  {item.badge === 'notifications' && unreadNotifications > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </NavLink>
            </li>
          )
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onOpenMore}
            aria-label="More"
            aria-expanded={moreOpen}
            className={`relative flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-t-xl px-1 py-1.5 transition-colors ${
              moreOpen ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <span
              className={`absolute top-0 h-0.5 w-8 rounded-full transition-all ${
                moreOpen ? 'bg-teal-600 dark:bg-teal-400' : 'bg-transparent'
              }`}
            />
            <span className="relative">
              <Grid2x2 className="h-[22px] w-[22px]" />
              {unreadNotifications > 0 && !moreOpen && (
                <span className="absolute -right-2 -top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}
