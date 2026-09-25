// Shared building blocks for the office (library / inventory / procurement /
// accounts) screens, styled with the app's vriddhi-* design tokens.

import { useEffect, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Loader2, X } from 'lucide-react'

export const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const fmtDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
export const fmtDateTime = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : String(e)
  return /permission|insufficient/i.test(m) ? 'You do not have permission for this action.' : m
}

export function PageHeader({ title, subtitle, icon, actions }: { title: string; subtitle?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="w-11 h-11 rounded-2xl bg-vriddhi-accent/15 text-vriddhi-accent flex items-center justify-center shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-vriddhi-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, icon, tone = 'text-vriddhi-accent', hint }: { label: string; value: ReactNode; icon: ReactNode; tone?: string; hint?: string }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-vriddhi-dark/30 flex items-center justify-center shrink-0 ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{value}</p>
        <p className="text-xs text-vriddhi-muted truncate">{label}</p>
        {hint && <p className="text-[11px] text-vriddhi-muted/80 truncate">{hint}</p>}
      </div>
    </div>
  )
}

export function RouteTabs({ tabs }: { tabs: { to: string; label: string; end?: boolean; badge?: number }[] }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 border-b border-vriddhi-border">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              isActive ? 'bg-vriddhi-accent text-white' : 'text-vriddhi-muted hover:bg-vriddhi-card hover:text-vriddhi-text'
            }`
          }
        >
          {t.label}
          {t.badge ? <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white">{t.badge}</span> : null}
        </NavLink>
      ))}
    </div>
  )
}

export function PillTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {options.map(o => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
            value === o.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card border border-vriddhi-border text-vriddhi-muted hover:text-vriddhi-text'
          }`}
        >
          {o.label}
          {o.count != null && <span className="opacity-70"> ({o.count})</span>}
        </button>
      ))}
    </div>
  )
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'teal' }) {
  const cls: Record<string, string> = {
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    green: 'bg-green-500/15 text-green-700 dark:text-green-400',
    amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    red: 'bg-red-500/15 text-red-700 dark:text-red-400',
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-400',
    teal: 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
  }
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls[tone]}`}>{children}</span>
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="glass-card h-48 flex flex-col items-center justify-center gap-2 text-vriddhi-muted">
      <Loader2 className="w-7 h-7 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function Empty({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="glass-card p-10 text-center">
      {icon && <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-vriddhi-dark/30 flex items-center justify-center text-vriddhi-muted">{icon}</div>}
      <p className="font-medium text-slate-900 dark:text-white">{title}</p>
      {hint && <p className="text-sm text-vriddhi-muted mt-1 max-w-md mx-auto">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={onClose}>
      <div
        className={`bg-white dark:bg-slate-900 border border-vriddhi-border w-full ${wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl`}
        onMouseDown={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-vriddhi-border">
          <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-vriddhi-border/50 text-vriddhi-muted" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-vriddhi-border flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint, className = '' }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-vriddhi-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-vriddhi-muted/80 mt-1">{hint}</span>}
    </label>
  )
}

export const btn = {
  primary: 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-vriddhi-accent text-white rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 disabled:opacity-50',
  danger: 'inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 disabled:opacity-50',
  small: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-vriddhi-card border border-vriddhi-border text-vriddhi-text hover:bg-vriddhi-border/50 disabled:opacity-50',
}

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>, columns?: string[]) {
  const cols = columns || Array.from(new Set(rows.flatMap(r => Object.keys(r))))
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
