// src/modules/student/components/resume/ResumePanels.tsx
//
// The non-form panels of the Resume Builder: template picker (with the
// per-template credit badges the server reports), the live preview iframe,
// the ATS readiness panel and the download history with free re-downloads.

import { useMemo } from 'react'
import {
  AlertTriangle, CheckCircle2, Download, FileText, History, Loader2, Lock, XCircle,
} from 'lucide-react'
import type { ResumeData, ResumeDownloadRow, ResumeTemplateCredit, ResumeTemplateId, ResumeTemplateInfo } from '@/shared/types/resume'
import { runAtsCheck, type AtsCheck } from '@/shared/utils/resumeAts'

// ─── Template picker ────────────────────────────────────────────────────────

export function ResumeTemplatePicker({ templates, credits, value, onChange }: {
  templates: ResumeTemplateInfo[]
  credits: ResumeTemplateCredit[]
  value: ResumeTemplateId
  onChange: (id: ResumeTemplateId) => void
}) {
  const creditFor = (id: ResumeTemplateId) => credits.find((c) => c.templateId === id)
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup" aria-label="Resume template">
      {templates.map((t) => {
        const credit = creditFor(t.id)
        const selected = t.id === value
        const disabled = !t.enabled
        const remaining = credit?.remaining ?? 0
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            title={t.tagline}
            className={
              'relative rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 ' +
              (selected
                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/30 dark:bg-teal-900/20'
                : 'border-slate-200 bg-white hover:border-teal-300 dark:border-slate-700 dark:bg-slate-900')
            }
          >
            <span className="mb-2 block h-1.5 w-10 rounded-full" style={{ backgroundColor: t.accent }} aria-hidden="true" />
            <span className="block text-sm font-bold text-slate-900 dark:text-white">{t.name}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">{t.bestFor}</span>
            <span className={'mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' + (disabled ? 'bg-slate-100 text-slate-500' : remaining > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200')}>
              {disabled ? <><Lock size={10} /> Off for your college</> : `${remaining} of ${credit?.allowed ?? 0} downloads left`}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Preview ────────────────────────────────────────────────────────────────

export function ResumePreviewFrame({ html, loading, stale, estimatedPages }: { html: string; loading: boolean; stale: boolean; estimatedPages: number }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-[#131b2e]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
          <FileText size={14} className="text-teal-600" /> Live preview
          <span className="text-slate-400">· ≈ {estimatedPages} page{estimatedPages > 1 ? 's' : ''}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-slate-400">
          {loading ? <><Loader2 size={12} className="animate-spin" /> updating</> : stale ? 'updating…' : 'watermark disappears in the PDF'}
        </span>
      </div>
      {html ? (
        <iframe
          title="Resume preview"
          srcDoc={html}
          sandbox=""
          className="min-h-[520px] w-full flex-1 bg-slate-100"
          data-testid="resume-preview"
        />
      ) : (
        <div className="flex min-h-[520px] flex-1 items-center justify-center text-sm text-slate-400">
          {loading ? <Loader2 className="animate-spin" /> : 'Start typing — your resume appears here.'}
        </div>
      )}
    </div>
  )
}

// ─── ATS panel ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: AtsCheck['status'] }) {
  if (status === 'pass') return <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
  if (status === 'warn') return <AlertTriangle size={16} className="shrink-0 text-amber-500" />
  return <XCircle size={16} className="shrink-0 text-rose-500" />
}

export function ResumeAtsPanel({ data, onJobDescriptionChange }: { data: ResumeData; onJobDescriptionChange: (jd: string) => void }) {
  const report = useMemo(() => runAtsCheck(data), [data])
  const tone = report.score >= 85 ? 'text-emerald-600' : report.score >= 70 ? 'text-teal-600' : report.score >= 50 ? 'text-amber-600' : 'text-rose-600'
  const failing = report.checks.filter((c) => c.status !== 'pass')
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]" data-testid="resume-ats">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-4 ${tone} border-current`}>
          <span className="text-xl font-extrabold leading-none">{report.score}</span>
          <span className="text-[9px] font-bold uppercase tracking-wide">/100</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">ATS readiness: {report.grade}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {report.wordCount} words · ≈ {report.estimatedPages} page{report.estimatedPages > 1 ? 's' : ''}. Rule-based guidance on what parsers and recruiters look for — not a guarantee of shortlisting.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {[...failing, ...report.checks.filter((c) => c.status === 'pass')].map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs">
            <StatusIcon status={check.status} />
            <span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{check.label}</span>
              <span className="text-slate-500 dark:text-slate-400"> — {check.detail}</span>
            </span>
          </li>
        ))}
      </ul>

      <div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Target job description (optional)</span>
          <textarea
            className="min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            placeholder="Paste the JD here and the checker tells you which keywords your resume is missing. It is never printed."
            value={data.targetJobDescription}
            maxLength={6000}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
          />
        </label>
        {report.keywords && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {report.keywords.matched.map((k) => <span key={`m-${k}`} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">{k}</span>)}
            {report.keywords.missing.map((k) => <span key={`x-${k}`} className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 line-through dark:bg-rose-900/30 dark:text-rose-200">{k}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Downloads ──────────────────────────────────────────────────────────────

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function ResumeDownloadsList({ downloads, busyId, onRedownload }: { downloads: ResumeDownloadRow[]; busyId: string | null; onRedownload: (row: ResumeDownloadRow) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]" data-testid="resume-downloads">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
        <History size={16} className="text-teal-600" /> Your PDF versions
        <span className="text-xs font-normal text-slate-400">re-downloads are free</span>
      </h3>
      {downloads.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Nothing generated yet. Each template gives you a fixed number of PDF downloads per year, so preview first, download when it is ready.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {downloads.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{row.templateName} · v{row.version}</p>
                <p className="text-slate-500 dark:text-slate-400">{formatWhen(row.createdAt)}{row.sizeBytes ? ` · ${formatSize(row.sizeBytes)}` : ''}{row.status !== 'ready' ? ` · ${row.status}` : ''}</p>
              </div>
              <button
                type="button"
                disabled={row.status !== 'ready' || busyId === row.id}
                onClick={() => onRedownload(row)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {busyId === row.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
