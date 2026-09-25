// src/shared/components/resume/ResumeAddonPanel.tsx
//
// "Resume Builder add-on" control panel.
//
//   • Superadmin → Colleges → {college} → Overview: full control — master
//     switch, downloads-per-template cap, template allow-list, AI assist,
//     credit resets — plus this year's usage.
//   • College admin / principal → Settings → General: the same card read-only
//     (usage + what is switched on), so the placement cell can see uptake.
//
// Everything is enforced by functions/src/routes/resume.ts; this card only
// edits colleges/{id}/config/resumeBuilder through that API.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Briefcase, Download, Loader2, RefreshCw, RotateCcw, Save, ShieldCheck } from 'lucide-react'
import {
  fetchResumeAdminSettings,
  redownloadResumePdf,
  resetResumeCredits,
  saveBlobAs,
  saveResumeAdminSettings,
} from '@/shared/services/resumeService'
import type { ResumeAdminSettingsResponse, ResumeSettings, ResumeTemplateId } from '@/shared/types/resume'

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ' +
        (checked ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600')
      }
    >
      <span className={'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  )
}

export interface ResumeAddonPanelProps {
  /** Omit for "my college" (college admin). Superadmin must pass one. */
  collegeId?: string
  collegeName?: string
  /** Superadmin only: shows the switches and the credit-reset form. */
  canEdit?: boolean
  embedded?: boolean
}

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ResumeAddonPanel({ collegeId, collegeName, canEdit = false, embedded = false }: ResumeAddonPanelProps) {
  const [state, setState] = useState<ResumeAdminSettingsResponse | null>(null)
  const [draft, setDraft] = useState<ResumeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  const [resetTemplate, setResetTemplate] = useState<'all' | ResumeTemplateId>('all')
  const [resetting, setResetting] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchResumeAdminSettings(collegeId)
      setState(res)
      setDraft(res.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the add-on settings.')
    } finally {
      setLoading(false)
    }
  }, [collegeId])

  useEffect(() => {
    void load()
  }, [load])

  const dirty = useMemo(() => !!state && !!draft && JSON.stringify(state.settings) !== JSON.stringify(draft), [state, draft])

  const save = async () => {
    if (!draft || !canEdit) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await saveResumeAdminSettings(draft, collegeId)
      setState((prev) => (prev ? { ...prev, settings: res.settings, configured: true } : prev))
      setDraft(res.settings)
      setNotice(res.settings.enabled ? 'Saved — students see Resume Builder under Learning.' : 'Saved — the add-on is switched off for this college.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const reset = async () => {
    if (!resetEmail.trim() || !canEdit) return
    setResetting(true)
    setNotice(null)
    setError(null)
    try {
      const res = await resetResumeCredits({ collegeId, email: resetEmail.trim(), templateId: resetTemplate === 'all' ? undefined : resetTemplate })
      const remaining = res.credits.map((c) => `${c.templateId} ${c.remaining}/${c.allowed}`).join(', ')
      setNotice(`Credits reset for ${resetEmail.trim()} — ${remaining}.`)
      setResetEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credit reset failed.')
    } finally {
      setResetting(false)
    }
  }

  const download = async (id: string, fileName: string) => {
    setDownloadingId(id)
    try {
      const res = await redownloadResumePdf(id, fileName)
      saveBlobAs(res.blob, res.fileName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download.')
    } finally {
      setDownloadingId(null)
    }
  }

  const toggleTemplate = (id: ResumeTemplateId, enabled: boolean) => {
    if (!draft) return
    const disabled = new Set(draft.disabledTemplates)
    if (enabled) disabled.delete(id)
    else disabled.add(id)
    setDraft({ ...draft, disabledTemplates: Array.from(disabled) })
  }

  const shell = embedded ? 'space-y-4' : 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]'

  return (
    <section className={shell} data-testid="resume-addon-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Briefcase size={18} className="text-teal-600" /> Resume Builder add-on
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">Placement Pack</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {collegeName ? `${collegeName}: ` : ''}five ATS-friendly templates, live preview, ATS score, text PDFs. Sold per college; each student gets a fixed number of PDF downloads per template per academic year.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state && (
            <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + (state.settings.enabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300')}>
              {state.settings.enabled ? 'Enabled' : 'Off'}
            </span>
          )}
          <button type="button" onClick={() => void load()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800" aria-label="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      {loading && !state && (
        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      )}
      {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">{notice}</p>}

      {state && draft && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Enable for this college</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Students see "Resume Builder" under Learning.</p>
                </div>
                <Switch checked={draft.enabled} disabled={!canEdit} label="Enable Resume Builder" onChange={(v) => setDraft({ ...draft, enabled: v })} />
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="block font-semibold text-slate-800 dark:text-slate-100">PDF downloads per template / year</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Default 3 (×5 templates = 15). Re-downloads are always free.</span>
                </span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  disabled={!canEdit}
                  value={draft.downloadsPerTemplate}
                  onChange={(e) => setDraft({ ...draft, downloadsPerTemplate: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI rewrite suggestions</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gemini, capped per student per year. Off by default (adds ~₹0.16 per call).</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canEdit || !draft.aiAssist}
                    value={draft.aiCallsPerStudent}
                    onChange={(e) => setDraft({ ...draft, aiCallsPerStudent: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    aria-label="AI calls per student"
                  />
                  <Switch checked={draft.aiAssist} disabled={!canEdit} label="Enable AI suggestions" onChange={(v) => setDraft({ ...draft, aiAssist: v })} />
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Templates offered</p>
              {state.templates.map((t) => {
                const on = !draft.disabledTemplates.includes(t.id)
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{t.name}</span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">{t.bestFor}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{state.usage.byTemplate[t.id] || 0} PDFs</span>
                      <Switch checked={on} disabled={!canEdit} label={`Offer ${t.name} template`} onChange={(v) => toggleTemplate(t.id, v)} />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-slate-400">
                {state.configured ? `Last changed ${formatWhen(state.updatedAt)}${state.updatedBy ? ` by ${state.updatedBy}` : ''}.` : 'Never configured — defaults shown (add-on off).'}
              </p>
              <button
                type="button"
                onClick={() => void save()}
                disabled={!dirty || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save add-on settings
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Usage · {state.usage.cycle}</p>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{state.usage.resumes} resumes started</span>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">{state.usage.downloads} PDFs</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{state.usage.studentsWithDownloads} students downloaded</span>
                {state.usage.failedRenders > 0 && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">{state.usage.failedRenders} failed renders (credits returned)</span>}
              </div>
            </div>
            {state.usage.recent.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {state.usage.recent.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 py-1.5">
                    <span className="min-w-0 truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{row.studentName || row.studentEmail || row.uid}</span>
                      <span className="text-slate-400"> · {row.templateName} v{row.version} · {formatWhen(row.createdAt)}{row.status !== 'ready' ? ` · ${row.status}` : ''}</span>
                    </span>
                    {row.status === 'ready' && (
                      <button type="button" onClick={() => void download(row.id, row.fileName)} disabled={downloadingId === row.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        {downloadingId === row.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} PDF
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No PDFs generated this academic year yet.</p>
            )}
          </div>

          {canEdit && (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100"><RotateCcw size={14} className="text-teal-600" /> Give a student their downloads back</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Use when a student made a genuine mistake. Resets this year's PDF credits (all templates or one). Logged in resumeAudit.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="student@email"
                  className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  aria-label="Student email"
                />
                <select value={resetTemplate} onChange={(e) => setResetTemplate(e.target.value as 'all' | ResumeTemplateId)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white" aria-label="Template to reset">
                  <option value="all">All templates</option>
                  {state.templates.map((t) => <option key={t.id} value={t.id}>{t.name} only</option>)}
                </select>
                <button type="button" onClick={() => void reset()} disabled={!resetEmail.trim() || resetting} className="inline-flex items-center gap-2 rounded-lg border border-teal-600 px-3 py-2 text-sm font-bold text-teal-700 hover:bg-teal-50 disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-900/20">
                  {resetting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Reset credits
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
