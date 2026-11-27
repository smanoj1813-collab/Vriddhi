import React, { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { AlertTriangle, Check, Loader2, Save, Users } from 'lucide-react'
import { db } from '@/Firebase/data'
import {
  DEFAULT_COHORT_CONFIG,
  cohortConfigFromDoc,
  semesterIds,
  validateCohortConfig,
  type CohortConfig,
} from '@/shared/utils/cohortConfigCore'

/**
 * A college's cohort vocabulary — the section letters and semester count that
 * every student, class session and import in this college must speak.
 *
 * WHY THIS SCREEN EXISTS
 * Sections had no authoritative definition: a letter was whatever someone typed
 * on an import ("A", "Section A", "A,B,C,D"), and the semester count was
 * guessed. Cohort matching then failed on values that meant the same thing, and
 * nothing could reject a bad value at the moment it was entered — only fail
 * later, on an empty roster or an empty timetable.
 *
 * Declaring the vocabulary once makes onboarding able to validate against it.
 * It is per-college because a college running A–D and one running A–F are both
 * legitimate; a platform-wide hardcoded six would be wrong for one of them.
 *
 * Storage: colleges/{collegeId}/config/cohort — the existing per-college config
 * subcollection, which firestore.rules already lets the principal/admin write.
 *
 * NOTE ON SEMESTER IDS
 * The "s01 · s02 …" ids shown below are LABELS for pickers and reports. The
 * stored `semester` field stays a NUMBER: Number("s001") is NaN, which both
 * cohort matchers read as "unknown" — and unknown is a wildcard, so a stored
 * alphanumeric semester would match every student instead of none.
 */
export default function CohortConfigPanel({
  collegeId,
  canEdit = true,
  embedded = false,
}: {
  collegeId: string
  canEdit?: boolean
  embedded?: boolean
}) {
  const [config, setConfig] = useState<CohortConfig>(DEFAULT_COHORT_CONFIG)
  const [sectionsText, setSectionsText] = useState(DEFAULT_COHORT_CONFIG.sections.join(','))
  const [semesterCount, setSemesterCount] = useState(String(DEFAULT_COHORT_CONFIG.semesterCount))
  const [requireSection, setRequireSection] = useState(DEFAULT_COHORT_CONFIG.requireSection)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!collegeId) {
        setLoading(false)
        return
      }
      try {
        const snap = await getDoc(doc(db, 'colleges', collegeId, 'config', 'cohort'))
        if (cancelled) return
        const loaded = cohortConfigFromDoc(snap.exists() ? snap.data() : undefined)
        setConfig(loaded)
        setSectionsText(loaded.sections.join(','))
        setSemesterCount(String(loaded.semesterCount))
        setRequireSection(loaded.requireSection)
      } catch (e) {
        if (!cancelled) {
          setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not load the cohort setup.' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [collegeId])

  async function handleSave() {
    if (!canEdit || saving || !collegeId) return
    setErrors([])
    setMsg(null)

    const result = validateCohortConfig({ sections: sectionsText, semesterCount, requireSection })
    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setSaving(true)
    try {
      await setDoc(
        doc(db, 'colleges', collegeId, 'config', 'cohort'),
        {
          sections: result.config.sections,
          semesterCount: result.config.semesterCount,
          requireSection: result.config.requireSection,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
      setConfig(result.config)
      setSectionsText(result.config.sections.join(','))
      setMsg({ type: 'ok', text: 'Cohort setup saved. New students and classes will be checked against it.' })
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Could not save the cohort setup.' })
    } finally {
      setSaving(false)
    }
  }

  const ids = semesterIds({ ...config, semesterCount: Number(semesterCount) || config.semesterCount })

  const body = (
    <>
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-teal-50 p-2 dark:bg-teal-950/40">
          <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">Cohort setup</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The sections and semesters your college runs. Students, classes and imports are checked
            against this list, so a typo is caught when it is entered instead of leaving a class empty.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Sections
            </label>
            <input
              type="text"
              value={sectionsText}
              onChange={(e) => setSectionsText(e.target.value)}
              disabled={!canEdit}
              placeholder="A,B,C,D"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              One letter per section, separated by commas. Add as many as your college runs — four
              (A–D) and six (A–F) are both fine.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
              Semesters per programme
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={semesterCount}
              onChange={(e) => setSemesterCount(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Semester ids: {ids.join(' · ')}. These are labels — the stored semester stays a number.
            </p>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <input
              type="checkbox"
              checked={requireSection}
              onChange={(e) => setRequireSection(e.target.checked)}
              disabled={!canEdit}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200">
              Every cohort must name a section
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                Turn this off only if your college runs each programme as a single whole batch with
                no section split.
              </span>
            </span>
          </label>

          {errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" /> Fix before saving
              </div>
              <ul className="list-disc space-y-1 pl-5">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {msg && (
            <div
              className={
                msg.type === 'ok'
                  ? 'flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300'
                  : 'flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300'
              }
            >
              {msg.type === 'ok' ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {msg.text}
            </div>
          )}

          {canEdit && (
            <div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-medium text-white shadow-md shadow-teal-500/20 transition-all duration-200 hover:bg-teal-600 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save cohort setup
              </button>
            </div>
          )}

          {!canEdit && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only the principal or a college admin can change the cohort setup.
            </p>
          )}
        </div>
      )}
    </>
  )

  if (embedded) return <div className="pt-2">{body}</div>

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-950">
      {body}
    </div>
  )
}
