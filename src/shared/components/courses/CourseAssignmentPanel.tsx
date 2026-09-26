import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  Eye,
  ExternalLink,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { listCourses } from '@/shared/courses/courseCatalog'
import {
  getCourseProgressSummary,
  listCollegePrograms,
  loadCourseAssignments,
  saveCourseAssignments,
  type CollegeProgramOption,
  type CourseAssignment,
  type CourseAssignmentSettings,
  type CourseProgressSummary,
} from '@/shared/courses/courseCloud'
import { normalizeProgramName } from '@/shared/utils/cohortMatching'

interface CourseAssignmentPanelProps {
  collegeId: string
  collegeName?: string
  embedded?: boolean
}

const emptySettings: CourseAssignmentSettings = { assignments: {} }

function cleanAssignment(assignment?: CourseAssignment): CourseAssignment {
  return {
    enabled: assignment?.enabled === true,
    assignedAt: assignment?.assignedAt,
    assignedBy: assignment?.assignedBy,
    cohort: assignment?.cohort?.programs?.length ? { programs: [...assignment.cohort.programs] } : undefined,
    startsOn: assignment?.startsOn,
    dueOn: assignment?.dueOn,
    notes: assignment?.notes,
  }
}

function normalizeDraft(input: Record<string, CourseAssignment>): Record<string, CourseAssignment> {
  const out: Record<string, CourseAssignment> = {}
  for (const [id, assignment] of Object.entries(input)) {
    out[id] = cleanAssignment(assignment)
  }
  return out
}

function ProgramPicker({
  options,
  selected,
  disabled,
  onChange,
}: {
  options: CollegeProgramOption[]
  selected: string[]
  disabled: boolean
  onChange: (programs: string[]) => void
}) {
  const selectedKeys = new Set(selected.map(normalizeProgramName))
  const toggle = (option: CollegeProgramOption) => {
    const next = new Set(selected)
    if (selectedKeys.has(normalizeProgramName(option.value))) {
      for (const value of next) if (normalizeProgramName(value) === normalizeProgramName(option.value)) next.delete(value)
    } else {
      next.add(option.value)
    }
    onChange([...next])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Limit to programmes <span className="font-normal text-slate-400">(optional)</span></p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(options.length > 0 && options.every((option) => selectedKeys.has(normalizeProgramName(option.value))) ? [] : options.map((option) => option.value))}
          className="text-[11px] font-semibold text-teal-700 hover:underline disabled:opacity-50 dark:text-teal-300"
        >
          {options.length > 0 && options.every((option) => selectedKeys.has(normalizeProgramName(option.value))) ? 'Clear filter' : 'Select all'}
        </button>
      </div>
      {options.length ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = selectedKeys.has(normalizeProgramName(option.value))
            return (
              <label key={option.value} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${checked ? 'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'} ${disabled ? 'opacity-50' : ''}`}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(option)} className="accent-teal-600" />
                {option.label}
              </label>
            )
          })}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">No programme names were found in this college’s student records. Leave this blank to assign college-wide.</p>
      )}
      {selected.length > 0 ? <p className="text-[11px] text-slate-500">Assigned to: {selected.join(', ')}</p> : <p className="text-[11px] text-slate-500">Available to every programme in the college.</p>}
    </div>
  )
}

export default function CourseAssignmentPanel({ collegeId, collegeName, embedded }: CourseAssignmentPanelProps) {
  const courses = useMemo(() => listCourses(), [])
  const [saved, setSaved] = useState<CourseAssignmentSettings>(emptySettings)
  const [draft, setDraft] = useState<Record<string, CourseAssignment>>({})
  const [programs, setPrograms] = useState<CollegeProgramOption[]>([])
  const [summaries, setSummaries] = useState<Record<string, CourseProgressSummary>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [copied, setCopied] = useState('')

  const load = async () => {
    setLoading(true)
    setMsg(null)
    try {
      const [settings, knownPrograms] = await Promise.all([
        loadCourseAssignments(collegeId),
        listCollegePrograms(collegeId).catch(() => []),
      ])
      const allRows: Record<string, CourseAssignment> = {}
      for (const { manifest } of courses) allRows[manifest.id] = cleanAssignment(settings.assignments[manifest.id])
      const reports = await Promise.all(courses.map(async ({ manifest }) => {
        if (!settings.assignments[manifest.id]?.enabled) return [manifest.id, undefined] as const
        try {
          return [manifest.id, await getCourseProgressSummary(collegeId, manifest.id)] as const
        } catch {
          return [manifest.id, undefined] as const
        }
      }))
      setSaved(settings)
      setDraft(allRows)
      setPrograms(knownPrograms)
      setSummaries(Object.fromEntries(reports.filter(([, report]) => !!report)) as Record<string, CourseProgressSummary>)
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not load course assignments.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId])

  const assignedCount = courses.filter(({ manifest }) => draft[manifest.id]?.enabled).length
  const savedDraft = useMemo(() => JSON.stringify(normalizeDraft(draft)), [draft])
  const storedDraft = useMemo(() => JSON.stringify(normalizeDraft(Object.fromEntries(
    courses.map(({ manifest }) => [manifest.id, cleanAssignment(saved.assignments[manifest.id])]),
  ))), [courses, saved])
  const dirty = savedDraft !== storedDraft

  const patchAssignment = (courseId: string, patch: Partial<CourseAssignment>) => {
    setDraft((previous) => ({
      ...previous,
      [courseId]: { ...cleanAssignment(previous[courseId]), ...patch },
    }))
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const now = new Date().toISOString()
      const assignments: Record<string, CourseAssignment> = {}
      for (const { manifest } of courses) {
        const current = cleanAssignment(draft[manifest.id])
        if (current.startsOn && current.dueOn && current.startsOn > current.dueOn) {
          throw new Error(`${manifest.title}: start date must be on or before the due date.`)
        }
        const previous = saved.assignments[manifest.id]
        assignments[manifest.id] = {
          ...current,
          ...(current.enabled ? {
            assignedAt: previous?.enabled && previous.assignedAt ? previous.assignedAt : now,
            assignedBy: previous?.enabled && previous.assignedBy ? previous.assignedBy : undefined,
          } : {
            assignedAt: previous?.assignedAt,
            assignedBy: previous?.assignedBy,
          }),
          cohort: current.cohort?.programs?.length ? { programs: current.cohort.programs } : undefined,
          startsOn: current.startsOn || undefined,
          dueOn: current.dueOn || undefined,
          notes: current.notes?.trim() || undefined,
        }
      }
      const updated = await saveCourseAssignments(collegeId, assignments)
      setSaved(updated)
      setDraft(normalizeDraft(assignments))
      setMsg({ type: 'ok', text: `Saved — ${Object.values(assignments).filter((item) => item.enabled).length} of ${courses.length} courses assigned.` })
      void loadReports(assignments)
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Could not save course assignments.' })
    } finally {
      setSaving(false)
    }
  }

  const loadReports = async (assignments: Record<string, CourseAssignment>) => {
    const reports = await Promise.all(courses.map(async ({ manifest }) => {
      if (!assignments[manifest.id]?.enabled) return [manifest.id, undefined] as const
      try {
        return [manifest.id, await getCourseProgressSummary(collegeId, manifest.id)] as const
      } catch {
        return [manifest.id, undefined] as const
      }
    }))
    setSummaries(Object.fromEntries(reports.filter(([, report]) => !!report)) as Record<string, CourseProgressSummary>)
  }

  const copyCourseUrl = async (courseId: string, kind: 'student' | 'preview') => {
    const path = kind === 'student' ? `/student/courses/${courseId}` : `/courses/${courseId}`
    const url = `${window.location.origin}${path}`
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setCopied(`${courseId}-${kind}`)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setMsg({ type: 'err', text: `Copy was blocked by the browser. Select this URL instead: ${url}` })
    }
  }

  const shell = embedded ? 'space-y-4' : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-6'

  return (
    <section className={shell}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Award className="h-4 w-4 text-teal-600" /> Course assignments
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-500 dark:text-slate-400">
            Assign certificate courses to {collegeName ? <strong>{collegeName}</strong> : 'this college'}.
            Courses are hidden from students by default; an optional programme filter can narrow an assignment.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          <ShieldCheck className="h-3.5 w-3.5" /> {assignedCount} of {courses.length} assigned
        </span>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading assignments…</div>
      ) : courses.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">No course packs are bundled in this build.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {courses.map(({ manifest }) => {
            const assignment = draft[manifest.id] || cleanAssignment()
            const summary = summaries[manifest.id]
            const studentPath = `/student/courses/${manifest.id}`
            const previewPath = `/courses/${manifest.id}`
            const programValues = assignment.cohort?.programs || []
            return (
              <article key={manifest.id} className={`rounded-xl border p-4 ${assignment.enabled ? 'border-teal-200 dark:border-teal-900' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">{manifest.code}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{manifest.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{manifest.totalHours} hours · {manifest.modules.length} modules · {manifest.modules.reduce((sum, mod) => sum + mod.topics.length, 0)} topics</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
                      <a href={previewPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300">
                        <Eye className="h-3.5 w-3.5" /> Public preview <ExternalLink className="h-3 w-3" />
                      </a>
                      <a href={studentPath} className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline dark:text-teal-300" title={`${window.location.origin}${studentPath}`}>
                        <BookOpen className="h-3.5 w-3.5" /> Student course URL: {studentPath}
                      </a>
                      <button type="button" onClick={() => void copyCourseUrl(manifest.id, 'student')} className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-teal-700 dark:hover:text-teal-300">
                        {copied === `${manifest.id}-student` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === `${manifest.id}-student` ? 'Copied' : 'Copy student URL'}
                      </button>
                    </div>
                  </div>
                  <label className="inline-flex shrink-0 items-center gap-2 self-start text-xs font-bold text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={`Assign ${manifest.title}`}
                      checked={assignment.enabled}
                      disabled={saving || loading}
                      onChange={(event) => patchAssignment(manifest.id, { enabled: event.target.checked })}
                      className="h-4 w-4 accent-teal-600"
                    />
                    {assignment.enabled ? 'Assigned' : 'Not assigned'}
                  </label>
                </div>

                {assignment.enabled ? (
                  <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
                    <div className="space-y-4">
                      <ProgramPicker
                        options={programs}
                        selected={programValues}
                        disabled={saving}
                        onChange={(selected) => patchAssignment(manifest.id, { cohort: selected.length ? { programs: selected } : undefined })}
                      />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Starts on</span>
                          <input type="date" value={assignment.startsOn || ''} disabled={saving} onChange={(event) => patchAssignment(manifest.id, { startsOn: event.target.value || undefined })} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Due on</span>
                          <input type="date" value={assignment.dueOn || ''} disabled={saving} onChange={(event) => patchAssignment(manifest.id, { dueOn: event.target.value || undefined })} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" />
                        </label>
                      </div>
                      <label className="block space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span>Notes for students</span>
                        <textarea value={assignment.notes || ''} disabled={saving} onChange={(event) => patchAssignment(manifest.id, { notes: event.target.value || undefined })} rows={2} maxLength={500} placeholder="Optional instructions or cohort details" className="block w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950" />
                      </label>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                      <p className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"><Users className="h-3.5 w-3.5 text-teal-600" /> Learner progress</p>
                      {summary ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-lg font-extrabold text-slate-900 dark:text-white">{summary.started}</p><p className="text-[10px] text-slate-500">started</p></div>
                          <div><p className="text-lg font-extrabold text-slate-900 dark:text-white">{summary.completed}</p><p className="text-[10px] text-slate-500">completed</p></div>
                          <div><p className="text-lg font-extrabold text-slate-900 dark:text-white">{summary.averageQuiz === null ? '—' : `${summary.averageQuiz}%`}</p><p className="text-[10px] text-slate-500">quiz average</p></div>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-slate-500">No learner progress is recorded yet.</p>
                      )}
                      <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
                        <ClipboardList className="mt-0.5 h-3 w-3 shrink-0" />
                        Student progress is stored in this college’s private course-progress collection.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:bg-slate-800/50">
                    <LockKeyhole className="h-3.5 w-3.5" /> Hidden until assigned. Students can still use the public preview URL above.
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {msg ? <div role="status" className={`mt-4 rounded-lg px-3 py-2 text-xs ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>{msg.text}</div> : null}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          {saved.updatedAt ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}` : 'Not assigned unless you save'}
          {saved.updatedBy ? <> · by <code>{saved.updatedBy}</code></> : null}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading || saving} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Reset
          </button>
          <button type="button" onClick={() => void save()} disabled={!dirty || loading || saving} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save assignments'}
          </button>
        </div>
      </footer>
    </section>
  )
}
