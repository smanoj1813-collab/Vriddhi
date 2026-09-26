// src/modules/courses/CoursePublicLayout.tsx
//
// Minimal chrome for the public course preview (/courses/…): a slim header
// with the Vriddhi mark, the page, and a footer. Sits OUTSIDE every RoleRoute
// like the /prep catalog, so a shared link opens without a login. Progress on
// this route is device-local only (no uid).
//
// If a course is ever sold rather than previewed, gate these routes (or drop
// them from routes/index.tsx) — the student portal at /student/courses is the
// authenticated home of the same pages.

import { Link, Outlet } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { dashboardPathFor } from '@/modules/auth/roleRoutes'

export default function CoursePublicLayout() {
  const { user } = useAuth()
  const home = user ? dashboardPathFor(user.role) || '/' : '/login'
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b0f19] dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-[#0b0f19]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
          <Link to="/courses" className="flex items-center gap-2">
            <img src="/brand/hero/vriddhi-mark-hero-light@600.png" alt="Vriddhi" className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-extrabold tracking-tight">Vriddhi <span className="font-semibold text-slate-500">· Courses</span></span>
          </Link>
          <Link
            to={home}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <LogIn className="h-3.5 w-3.5" /> {user ? 'Open my portal' : 'Sign in'}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 text-center text-[11px] text-slate-400">
        Vriddhi Academic Cloud · course content © Vriddhi. Public preview — progress is kept on this device only.
      </footer>
    </div>
  )
}
