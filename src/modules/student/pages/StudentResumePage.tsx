// src/modules/student/pages/StudentResumePage.tsx
//
// Resume Builder (paid add-on, enabled per college by a superadmin).
//
//   • Edit on the left, live server-rendered preview on the right (the exact
//     HTML Chrome will print, watermarked). Phones get Edit / Preview / ATS tabs.
//   • Autosave: 1.5 s after the last keystroke, PUT /resume/me. A copy also
//     sits in localStorage so a flaky connection never loses typing.
//   • "Download PDF" spends ONE credit for the selected template. The server
//     reserves the credit in the same transaction that authorises the render,
//     returns a text PDF (never a screenshot) and keeps it for free re-download.
//   • Credits, template availability and AI quota all come from the server;
//     this page only shows them.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Briefcase, Cloud, CloudOff, Download, Eye, Gauge, Loader2, Lock, Pencil, RefreshCw, ShieldCheck } from 'lucide-react'
import { useStudentData } from '../hooks/useStudentData'
import { useNotification } from '@/shared/providers/NotificationProvider'
import {
  fetchMyResume,
  fetchResumePreview,
  generateResumePdf,
  improveWithAi,
  redownloadResumePdf,
  ResumeCreditsExhaustedError,
  saveBlobAs,
  saveMyResume,
  type ResumeAiKind,
} from '@/shared/services/resumeService'
import { emptyResumeData, prefillResumeData, type ResumeData, type ResumeDownloadRow, type ResumeMeResponse, type ResumeTemplateId } from '@/shared/types/resume'
import { countResumeWords, estimateResumePages } from '@/shared/utils/resumeAts'
import ResumeEditor from '../components/resume/ResumeEditor'
import { ResumeAtsPanel, ResumeDownloadsList, ResumePreviewFrame, ResumeTemplatePicker } from '../components/resume/ResumePanels'
import PlacementPackPanel from '../components/resume/PlacementPackPanel'

const AUTOSAVE_MS = 1500
const PREVIEW_MS = 700

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
type MobileTab = 'edit' | 'preview' | 'ats'

function draftKey(studentId: string): string {
  return `vriddhi.resume.draft.${studentId || 'me'}`
}

function readDraft(key: string): { data: ResumeData; templateId: ResumeTemplateId } | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.data && parsed.templateId) return parsed
  } catch {
    /* ignore */
  }
  return null
}

export default function StudentResumePage() {
  const { profile, collegeId, studentId, loading: studentLoading } = useStudentData()
  const { showSuccess, showError, showInfo } = useNotification()

  const [me, setMe] = useState<ResumeMeResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [data, setData] = useState<ResumeData>(emptyResumeData)
  const [templateId, setTemplateId] = useState<ResumeTemplateId>('classic')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewStale, setPreviewStale] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [redownloadingId, setRedownloadingId] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [tab, setTab] = useState<MobileTab>('edit')

  const hydrated = useRef(false)
  const latest = useRef({ data, templateId })
  latest.current = { data, templateId }
  const previewAbort = useRef<AbortController | null>(null)

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const response = await fetchMyResume(collegeId || undefined)
      setMe(response)
      if (!hydrated.current) {
        const draft = readDraft(draftKey(studentId))
        if (response.resume) {
          setData(response.resume.data)
          setTemplateId(response.resume.templateId)
        } else if (draft) {
          setData(draft.data)
          setTemplateId(draft.templateId)
          setSaveState('dirty')
        } else {
          setData(prefillResumeData({ name: profile?.name, email: profile?.email, phone: profile?.phone, course: profile?.course, branch: profile?.branch, batch: profile?.batch }))
          setTemplateId(response.settings.templates.find((t) => t.enabled)?.id || 'classic')
          setSaveState('dirty')
        }
        hydrated.current = true
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the resume builder.')
    }
  }, [collegeId, studentId, profile?.name, profile?.email, profile?.phone, profile?.course, profile?.branch, profile?.batch])

  // Wait for the student record: the first visit is prefilled from it, and the
  // layout does not block on the data provider (only on auth).
  useEffect(() => {
    if (studentLoading) return
    void load()
  }, [load, studentLoading])

  const enabled = !!me?.enabled
  const templates = me?.settings.templates ?? []
  const credits = me?.credits ?? []
  const currentCredit = credits.find((c) => c.templateId === templateId)
  const aiRemaining = me?.aiCredits?.remaining ?? 0
  const wordCount = useMemo(() => countResumeWords(data), [data])
  const estimatedPages = estimateResumePages(wordCount)

  // ── Edits → local draft + autosave + preview ─────────────────────────────
  const onChange = useCallback((next: ResumeData) => {
    setData(next)
    setSaveState('dirty')
    setPreviewStale(true)
  }, [])

  const onTemplateChange = useCallback((next: ResumeTemplateId) => {
    setTemplateId(next)
    setSaveState('dirty')
    setPreviewStale(true)
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(draftKey(studentId), JSON.stringify({ data, templateId, savedAt: Date.now() }))
    } catch {
      /* quota / private mode */
    }
  }, [data, templateId, studentId])

  useEffect(() => {
    if (!enabled || !hydrated.current || saveState !== 'dirty') return
    const handle = setTimeout(async () => {
      setSaveState('saving')
      try {
        await saveMyResume(latest.current.data, latest.current.templateId, collegeId || undefined)
        setSaveState((s) => (s === 'saving' ? 'saved' : s))
      } catch {
        setSaveState('error')
      }
    }, AUTOSAVE_MS)
    return () => clearTimeout(handle)
  }, [data, templateId, enabled, saveState, collegeId])

  useEffect(() => {
    if (!enabled || !hydrated.current) return
    const handle = setTimeout(async () => {
      previewAbort.current?.abort()
      const controller = new AbortController()
      previewAbort.current = controller
      setPreviewLoading(true)
      try {
        const res = await fetchResumePreview(latest.current.data, latest.current.templateId, collegeId || undefined, controller.signal)
        if (!controller.signal.aborted) {
          setPreviewHtml(res.html)
          setPreviewStale(false)
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          // Keep the previous preview; the next keystroke retries.
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false)
      }
    }, PREVIEW_MS)
    return () => clearTimeout(handle)
  }, [data, templateId, enabled, collegeId])

  // ── Actions ─────────────────────────────────────────────────────────────
  const onDownload = async () => {
    if (!enabled || downloading) return
    if (!data.contact.fullName.trim()) {
      showError('Add your name before downloading.')
      return
    }
    setDownloading(true)
    try {
      const result = await generateResumePdf(templateId, data, collegeId || undefined)
      saveBlobAs(result.blob, result.fileName)
      setSaveState('saved')
      showSuccess(
        result.creditsRemaining !== null
          ? `PDF ready (v${result.version ?? ''}). ${result.creditsRemaining} download${result.creditsRemaining === 1 ? '' : 's'} left for this template.`
          : 'PDF ready.',
      )
      await load()
    } catch (err) {
      if (err instanceof ResumeCreditsExhaustedError) {
        showError(err.message)
        await load()
      } else {
        showError(err instanceof Error ? err.message : 'PDF generation failed.')
      }
    } finally {
      setDownloading(false)
    }
  }

  const onRedownload = async (row: ResumeDownloadRow) => {
    setRedownloadingId(row.id)
    try {
      const result = await redownloadResumePdf(row.id, row.fileName)
      saveBlobAs(result.blob, result.fileName || row.fileName)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not download that PDF.')
    } finally {
      setRedownloadingId(null)
    }
  }

  const onAi = async (kind: ResumeAiKind, text: string, apply: (improved: string) => void) => {
    if (aiBusy) return
    setAiBusy(true)
    try {
      const res = await improveWithAi(kind, text, { role: data.contact.headline, program: data.education[0]?.degree }, collegeId || undefined)
      apply(res.text)
      setSaveState('dirty')
      setPreviewStale(true)
      setMe((prev) => (prev && prev.aiCredits ? { ...prev, aiCredits: { ...prev.aiCredits, used: prev.aiCredits.used + 1, remaining: res.remaining } } : prev))
      showInfo(`AI suggestion applied — ${res.remaining} left this year. Check every fact before you download.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'AI suggestion failed.')
    } finally {
      setAiBusy(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Header />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200">
          <p className="font-bold">Could not load the Resume Builder.</p>
          <p className="mt-1 break-words">{loadError}</p>
          <button type="button" onClick={() => void load()} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700"><RefreshCw size={14} /> Retry</button>
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Loading Resume Builder…</p>
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Header />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-500 dark:bg-slate-800"><Lock size={20} /></div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Not enabled for your college yet</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                The Resume Builder is part of the Vriddhi Placement Pack. When your college switches it on you get five ATS-friendly templates,
                a live preview, an ATS readiness score and {me.settings.downloadsPerTemplate} PDF downloads per template every year — with free re-downloads.
              </p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Ask your placement cell or college admin to enable it.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabBtn = (id: MobileTab, label: string, Icon: typeof Pencil) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={'inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ' + (tab === id ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')}
    >
      <Icon size={14} /> {label}
    </button>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-24 lg:pb-6">
      <Header />

      <ResumeTemplatePicker templates={templates} credits={credits} value={templateId} onChange={onTemplateChange} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-[#131b2e]">
        <div className="flex items-center gap-3 text-xs">
          <SaveBadge state={saveState} />
          <span className="text-slate-400">{wordCount} words · ≈ {estimatedPages} page{estimatedPages > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          {currentCredit && (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400" data-testid="resume-credit-line">
              {currentCredit.remaining} of {currentCredit.allowed} downloads left · {templates.find((t) => t.id === templateId)?.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => void onDownload()}
            disabled={downloading || !currentCredit || currentCredit.remaining <= 0 || !currentCredit.enabled}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#131b2e] lg:hidden">
        {tabBtn('edit', 'Edit', Pencil)}
        {tabBtn('preview', 'Preview', Eye)}
        {tabBtn('ats', 'ATS score', Gauge)}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className={`space-y-4 lg:col-span-6 xl:col-span-5 ${tab === 'edit' ? '' : 'hidden lg:block'}`}>
          <ResumeEditor data={data} onChange={onChange} aiRemaining={aiRemaining} aiBusy={aiBusy} onAi={onAi} />
        </div>
        <div className={`space-y-4 lg:col-span-6 xl:col-span-7 ${tab === 'edit' ? 'hidden lg:block' : ''}`}>
          <div className={`lg:sticky lg:top-4 ${tab === 'preview' ? '' : 'hidden lg:block'}`} style={{ minHeight: 560 }}>
            <ResumePreviewFrame html={previewHtml} loading={previewLoading} stale={previewStale} estimatedPages={estimatedPages} />
          </div>
          <div className={tab === 'ats' ? '' : 'hidden lg:block'}>
            <ResumeAtsPanel data={data} onJobDescriptionChange={(jd) => onChange({ ...data, targetJobDescription: jd })} />
          </div>
          <div className={tab === 'ats' ? '' : 'hidden lg:block'}>
            {/* Item 4.2: the week a company visits — cover letter, About and the
                questions, all built from this resume. Sits under the ATS panel
                because that panel owns the target job description. */}
            <PlacementPackPanel
              jobDescription={data.targetJobDescription || ''}
              defaultJobTitle={data.contact.headline || ''}
              collegeId={collegeId || undefined}
              onCreditsChanged={() => void load()}
            />

            <ResumeDownloadsList downloads={me.downloads} busyId={redownloadingId} onRedownload={(row) => void onRedownload(row)} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white md:text-2xl">
          <Briefcase className="text-teal-600" /> Resume Builder
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Five ATS-friendly templates, live preview, instant ATS check. PDFs are real text — exactly what recruiters' software reads.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-200">
        <ShieldCheck size={14} /> Placement Pack
      </span>
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === 'saving') return <span className="inline-flex items-center gap-1 font-semibold text-slate-500"><Loader2 size={12} className="animate-spin" /> Saving…</span>
  if (state === 'saved') return <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><Cloud size={12} /> Saved</span>
  if (state === 'error') return <span className="inline-flex items-center gap-1 font-semibold text-rose-600"><CloudOff size={12} /> Not saved — kept in this browser, retrying on next edit</span>
  if (state === 'dirty') return <span className="inline-flex items-center gap-1 font-semibold text-slate-500"><Cloud size={12} /> Unsaved changes</span>
  return <span className="inline-flex items-center gap-1 font-semibold text-slate-400"><Cloud size={12} /> Autosave on</span>
}
