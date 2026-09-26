// src/modules/courses/courseUi.tsx
//
// Small presentational pieces shared by the course catalog, overview and
// lesson pages. Tailwind + lucide, matching the student portal.

import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function ProgressBar({ percent, className = '', tone = 'teal' }: { percent: number; className?: string; tone?: 'teal' | 'emerald' | 'indigo' }) {
  const p = Math.max(0, Math.min(100, percent))
  const bar = tone === 'emerald' ? 'bg-emerald-500' : tone === 'indigo' ? 'bg-indigo-500' : 'bg-teal-600'
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 ${className}`} role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${bar} transition-[width] duration-500`} style={{ width: `${p}%` }} />
    </div>
  )
}

export function Chip({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'teal' | 'amber' | 'emerald' | 'indigo' | 'violet' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>
}

export function Breadcrumb({ items }: { items: Array<{ label: string; to?: string }> }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      {items.map((item, idx) => (
        <span key={`${item.label}-${idx}`} className="flex items-center gap-1">
          {idx > 0 ? <ChevronRight className="h-3 w-3" /> : null}
          {item.to ? (
            <Link to={item.to} className="hover:text-teal-700 dark:hover:text-teal-300">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 ${className}`}>{children}</div>
  )
}

export function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  return (
    <div>
      {kicker ? <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">{kicker}</p> : null}
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{children}</h2>
    </div>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <p className="text-base font-bold text-slate-800 dark:text-white">{title}</p>
      {body ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{body}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
