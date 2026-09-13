import React, { useState } from 'react'
import { Link2, Loader2, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useRelinkFacultyToCollege } from '../hooks/useSuperAdmin'
import type { RelinkFacultyResult, RelinkCandidate } from '../api/superAdminApi'

interface Props {
  collegeId: string
  collegeName: string
  /** Faculty currently listed for this college (by collegeId). */
  linkedCount: number
  onRelinked?: () => void
}

const REASON_LABEL: Record<RelinkCandidate['reason'], string> = {
  'orphaned-college': 'Linked to a college that no longer exists',
  'matching-code': 'College code matches, but linked to another college',
  'matching-name': 'College name matches, but linked to another college',
  explicit: 'Selected by operator',
}

/**
 * "The faculty list says they belong here but the college page shows nobody."
 *
 * The college page queries `faculty.collegeId`; the faculty list displays the
 * stored `collegeName`. This panel previews every faculty whose label points
 * at this college while their collegeId does not, and relinks the selected
 * ones through the Admin SDK (profile + users/{uid} + Auth claim + HOD doc).
 */
export default function FacultyLinkRepair({ collegeId, collegeName, linkedCount, onRelinked }: Props) {
  const relink = useRelinkFacultyToCollege()
  const [preview, setPreview] = useState<RelinkFacultyResult | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applied, setApplied] = useState<RelinkFacultyResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runPreview = async () => {
    setError(null)
    setApplied(null)
    try {
      const result = await relink.mutateAsync({ collegeId, dryRun: true })
      setPreview(result)
      setSelected(new Set(result.candidates.map((c) => c.facultyDocId)))
    } catch (err: any) {
      setError(err?.message || 'Could not scan for unlinked faculty')
    }
  }

  const apply = async () => {
    if (!preview || selected.size === 0) return
    setError(null)
    try {
      const result = await relink.mutateAsync({
        collegeId,
        facultyDocIds: Array.from(selected),
        dryRun: false,
      })
      setApplied(result)
      setPreview(null)
      setSelected(new Set())
      onRelinked?.()
    } catch (err: any) {
      setError(err?.message || 'Relink failed')
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const busy = relink.isPending

  return (
    <div className="glass-card p-4 border border-amber-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Faculty missing from this college?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              Faculty that show “{collegeName}” in the faculty list but are not listed here are linked to a
              different (or deleted) college record. Scan to find them and relink them to this college —
              profile, login lookup, access claim and HOD entry are all updated together.
            </p>
          </div>
        </div>
        <button
          onClick={runPreview}
          disabled={busy}
          className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {busy && !preview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Scan for unlinked faculty
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {applied && (
        <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Relinked {applied.relinked} faculty to {collegeName}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {applied.usersDocsUpdated} login record(s) updated · {applied.claimsUpdated} access claim(s) refreshed
            {applied.hodDocsMoved ? ` · ${applied.hodDocsMoved} HOD entr${applied.hodDocsMoved === 1 ? 'y' : 'ies'} moved` : ''}
            {' '}· this college now has {applied.facultyCount} faculty.
            {applied.claimsUpdated > 0 && ' Affected faculty must sign out and back in.'}
          </p>
          {applied.errors.length > 0 && (
            <ul className="mt-2 text-xs text-red-600 dark:text-red-400 list-disc pl-4 space-y-0.5">
              {applied.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {preview && (
        <div className="mt-3">
          {preview.candidates.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Scanned {preview.scanned} faculty profiles — none reference {collegeName} without being linked to it.
              {linkedCount === 0 && ' If faculty should be here, they were imported under a different college name/code; import them again with this college selected.'}
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-700 dark:text-slate-200 mb-2">
                Found <span className="font-semibold">{preview.candidates.length}</span> faculty referencing{' '}
                {collegeName} but linked elsewhere:
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left w-8"></th>
                      <th className="px-3 py-2 text-left">Faculty</th>
                      <th className="px-3 py-2 text-left">Department</th>
                      <th className="px-3 py-2 text-left">Currently linked to</th>
                      <th className="px-3 py-2 text-left">Why</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {preview.candidates.map((c) => (
                      <tr key={c.facultyDocId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(c.facultyDocId)}
                            onChange={() => toggle(c.facultyDocId)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-900 dark:text-white">{c.name || c.email}</div>
                          <div className="text-xs text-slate-500">{c.facultyId} · {c.email}</div>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{c.department || '—'}</td>
                        <td className="px-3 py-2">
                          <div className="text-slate-700 dark:text-slate-200">
                            {c.previousCollegeName || c.previousCollegeId || <span className="italic text-slate-400">nothing</span>}
                          </div>
                          <div className="text-xs font-mono text-slate-400 break-all">
                            {c.previousCollegeId || '—'}
                            {c.previousCollegeId && !c.previousCollegeExists && (
                              <span className="ml-1 text-amber-500 font-sans">(deleted)</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{REASON_LABEL[c.reason]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-slate-500">
                  {selected.size} of {preview.candidates.length} selected. Anyone linked to a college that still exists
                  will be <em>moved</em> here — untick them if that is wrong.
                </p>
                <button
                  onClick={apply}
                  disabled={busy || selected.size === 0}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Relink {selected.size} to {collegeName}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
