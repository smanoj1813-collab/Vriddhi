// Single source of truth for the student portal navigation. The desktop
// sidebar, the phone bottom bar, and the "More" sheet all read this list, so
// a new student page is registered once instead of in three layouts.
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
  GraduationCap,
  Download,
  Milestone,
  BookMarked,
  UserCheck,
  Receipt,
  type LucideIcon,
} from 'lucide-react'
import type { TranslationKey } from '../../shared/i18n'

export type StudentNavGroup = 'academics' | 'practice' | 'money' | 'account'

export interface StudentNavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  group: StudentNavGroup
  /** English label used when the student hasn't picked another language. */
  translationKey?: TranslationKey
  /** Shows a count of unread notifications. */
  badge?: 'notifications'
  /** Extra route spellings that should still light this item up. */
  aliases?: string[]
}

export const STUDENT_NAV_ITEMS: StudentNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, group: 'academics', translationKey: 'nav.dashboard' },
  { id: 'attendance', label: 'Attendance', path: '/student/attendance', icon: Calendar, group: 'academics', translationKey: 'nav.attendance' },
  { id: 'assessments', label: 'Assessments', path: '/student/assessments', icon: BookOpen, group: 'academics', translationKey: 'nav.assessments' },
  { id: 'assignments', label: 'Assignments', path: '/student/assignments', icon: FileText, group: 'academics', translationKey: 'nav.assignments' },
  { id: 'grades', label: 'Grades', path: '/student/grades', icon: TrendingUp, group: 'academics', translationKey: 'nav.grades' },
  { id: 'curriculum', label: 'Curriculum', path: '/student/curriculum', icon: BookMarked, group: 'academics', translationKey: 'nav.curriculum' },
  { id: 'timetable', label: 'Timetable', path: '/student/timetable', icon: Clock, group: 'academics', translationKey: 'nav.timetable' },
  { id: 'materials', label: 'Materials', path: '/student/materials', icon: Library, group: 'practice', translationKey: 'nav.materials' },
  { id: 'library', label: 'Library', path: '/student/library', icon: GraduationCap, group: 'practice', translationKey: 'nav.library' },
  { id: 'journey', label: 'My Journey', path: '/student/journey', icon: Milestone, group: 'practice', translationKey: 'nav.journey' },
  { id: 'faculty-connect', label: 'Faculty Connect', path: '/student/faculty-connect', icon: UserCheck, group: 'practice', aliases: ['/student/mentorship'] },
  { id: 'fees', label: 'Fees', path: '/student/fees', icon: CreditCard, group: 'money', translationKey: 'nav.fees', aliases: ['/student/fee-portal'] },
  { id: 'challans', label: 'My Challans', path: '/student/challans', icon: Receipt, group: 'money' },
  { id: 'halltickets', label: 'Hall Tickets', path: '/student/hall-tickets', icon: Download, group: 'money' },
  { id: 'events', label: 'Events', path: '/student/events', icon: CalendarDays, group: 'account', translationKey: 'nav.events' },
  { id: 'notifications', label: 'Notifications', path: '/student/notifications', icon: Bell, group: 'account', translationKey: 'nav.notifications', badge: 'notifications' },
  { id: 'install-app', label: 'Install App', path: '/student/install-app', icon: Download, group: 'account', aliases: ['/student/pwa-install'] },
  { id: 'settings', label: 'Settings', path: '/student/settings', icon: Settings, group: 'account', translationKey: 'nav.settings' },
]

/** The four destinations a student reaches with a thumb, plus "More". */
export const MOBILE_TAB_IDS = ['dashboard', 'assessments', 'fees', 'notifications'] as const

export const STUDENT_NAV_GROUPS: Array<{ id: StudentNavGroup; label: string }> = [
  { id: 'academics', label: 'Academics' },
  { id: 'practice', label: 'Learning' },
  { id: 'money', label: 'Fees & exams' },
  { id: 'account', label: 'Account' },
]

const NAV_PATHS = new Map<string, string>(
  STUDENT_NAV_ITEMS.flatMap((item) => [[item.path, item.id] as [string, string], ...(item.aliases || []).map((alias) => [alias, item.id] as [string, string])])
)

/** The nav item that owns a pathname — longest match wins. */
export function findNavItem(pathname: string): StudentNavItem | undefined {
  // Longest match wins so /student/assessments/:id/take does not resolve to
  // the Assessments tab while a test is open, and an alias route
  // (/student/fee-portal) still lights up the tab it duplicates.
  const candidates = [...NAV_PATHS.entries()]
    .filter(([path]) => pathname === path || (path !== '/student/dashboard' && pathname.startsWith(path)))
    .sort(([a], [b]) => b.length - a.length)
  const ownerId = candidates[0] ? NAV_PATHS.get(candidates[0][0]) : undefined
  return STUDENT_NAV_ITEMS.find((item) => item.id === ownerId)
}
