// src/modules/student/pages/StudentHubPage.tsx
//
// The phone's "Academics" and "Learning" tabs.
//
// The bottom bar can only carry four destinations, so the two section
// headings that already organise the sidebar, the dashboard quick tiles and
// the "More" sheet get a landing page of their own. The tiles come from the
// nav model — a page added to a group shows up here without touching this
// file, and no page can exist on the sidebar but be missing from its hub.
import { Link } from 'react-router-dom'
import { ChevronRight, GraduationCap, Sparkles } from 'lucide-react'
import PortalIllustration from '@/shared/components/PortalIllustration'
import { useTranslation } from '../../../shared/contexts/LanguageProvider'
import type { TranslationKey } from '../../../shared/i18n'
import { useStudentData } from '../hooks/useStudentData'
import { STUDENT_NAV_GROUPS, navItemsInGroup, type StudentNavGroup } from '../studentNav'

interface StudentHubPageProps {
  group: StudentNavGroup
}

const GROUP_BLURB: Partial<Record<StudentNavGroup, string>> = {
  academics: 'Attendance, assignments, grades, timetable and curriculum — everything your programme is measured on.',
  practice: 'Study materials, sample programs, the coding lab, the library, your learning journey and faculty support.',
}

export default function StudentHubPage({ group }: StudentHubPageProps) {
  const { t } = useTranslation()
  const { profile, codingLabEnabled } = useStudentData()
  const definition = STUDENT_NAV_GROUPS.find((entry) => entry.id === group)
  const items = navItemsInGroup(group, profile, codingLabEnabled)
  const SectionIcon = group === 'practice' ? Sparkles : GraduationCap

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-4">
      <header className="grid grid-cols-[minmax(0,1fr)_96px] sm:grid-cols-[minmax(0,1fr)_200px] items-center gap-x-4 gap-y-2 rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50/60 p-5 sm:p-6 dark:border-teal-900/60 dark:from-teal-950/50 dark:via-slate-900 dark:to-slate-900">
        <div className="min-w-0">
          <span className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
            <SectionIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {t('student.studentPortal')}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {definition?.label || 'Academics'}
          </h1>
        </div>
        <PortalIllustration scene={group === 'practice' ? 'learning' : 'academics'} className="col-start-2 row-start-1 sm:row-span-2" />
        {GROUP_BLURB[group] && (
          <p className="col-span-2 sm:col-span-1 sm:row-start-2 self-start text-sm leading-relaxed text-slate-600 dark:text-slate-300">{GROUP_BLURB[group]}</p>
        )}
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon
          const label = item.translationKey
            ? t(item.translationKey as TranslationKey)
            : item.label
          return (
            <Link
              key={item.id}
              to={item.path}
              className="portal-motion-target group flex min-h-[74px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50/40 active:border-teal-300 active:bg-teal-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-teal-800 dark:hover:bg-teal-950/30 dark:active:border-teal-800 dark:active:bg-teal-950/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                <Icon aria-hidden="true" className="portal-interactive-icon h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">{label}</span>
                {item.hint && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {item.hint}
                  </span>
                )}
              </span>
              <ChevronRight aria-hidden="true" className="portal-link-arrow h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
