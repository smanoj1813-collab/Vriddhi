// /admin/promotion — semester promotion & year rollover.
//
// Evaluates a cohort against the college's carryover policy using
// PUBLISHED grade records: promote / detain / graduate, with each
// student's live backlog list. Staff review and can override per
// student before applying; the run is recorded server-side and the
// same run can never apply twice.
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpCircle, Download, GraduationCap, Play, Search, ShieldAlert } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, PageHeader, StatCard, btn, downloadCsv, errMsg } from '@/modules/office/components/officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { fetchCertificateStudents } from '@/modules/office/api/certificateApi'
import { useCollegeId } from '@/modules/office/hooks/useLibrary'
import { previewPromotion, runPromotion, type PromotionAction, type PromotionRow } from '../api/promotionApi'

const ACTION_META: Record<PromotionAction, { label: string; tone: 'green' | 'amber' | 'purple' | 'slate' | 'red' }> = {
  promote: { label: 'Promote', tone: 'green' },
  detain: { label: 'Detain', tone: 'red' },
  graduate: { label: 'Graduate', tone: 'purple' },
  repeat_final: { label: 'Repeat final sem', tone: 'amber' },
  skip: { label: 'Skip', tone: 'slate' },
}

export default function PromotionPage() {
  const cid = useCollegeId()
  const { showSuccess, showError } = useNotification()
  const rosterQ = useQuery({ queryKey: ['promotion', cid, 'roster'], queryFn: () => fetchCertificateStudents(cid), enabled: !!cid })
  const roster = rosterQ.data || []
  const batches = useMemo(() => [...new Set(roster.map(r => r.batch).filter(Boolean))].sort(), [roster])
  const branches = useMemo(() => [...new Set(roster.map(r => r.programme).filter(Boolean))].sort(), [roster])

  const [batch, setBatch] = useState('')
  const [branch, setBranch] = useState('')
  const [semester, setSemester] = useState('0')
  const [maxBacklogs, setMaxBacklogs] = useState(4)
  const [programmeSemesters, setProgrammeSemesters] = useState(6)
  const [allClear, setAllClear] = useState(true)

  const [busy, setBusy] = useState(false)
  const [rows, setRows] = useState<PromotionRow[] | null>(null)
  const [choices, setChoices] = useState<Record<string, PromotionAction>>({})
  const [search, setSearch] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [applying, setApplying] = useState(false)
  const [done, setDone] = useState<Record<string, number> | null>(null)

  const policy = { maxBacklogsToPromote: maxBacklogs, requireAllClearForGraduation: allClear, programmeSemesters }

  const runPreview = async () => {
    setBusy(true); setDone(null)
    try {
      const res = await previewPromotion(policy, { batch, branch, semester: Number(semester) || 0 })
      setRows(res.rows)
      setChoices(Object.fromEntries(res.rows.map(r => [r.studentId, r.action])))
      if (!res.rows.length) showError('No students match this cohort. Check the batch/branch/semester filters.')
    } catch (e) { showError(errMsg(e)) } finally { setBusy(false) }
  }

  const visible = (rows || []).filter(r => !search || `${r.name} ${r.regNo}`.toLowerCase().includes(search.toLowerCase()))
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const r of rows || []) { const a = choices[r.studentId] || r.action; c[a] = (c[a] || 0) + 1 }
    return c
  }, [rows, choices])
  const actionable = (rows || []).filter(r => (choices[r.studentId] || r.action) !== 'skip').length

  const apply = async () => {
    if (!rows) return
    setApplying(true)
    try {
      const decisions = rows.map(r => ({ studentId: r.studentId, action: choices[r.studentId] || r.action }))
      const runId = crypto.randomUUID()
      const res = await runPromotion(runId, policy, decisions, `Promotion run — batch ${batch || 'all'}, semester ${semester === '0' ? 'all' : semester}`)
      setDone(res.counts)
      setConfirmOpen(false)
      showSuccess(res.alreadyApplied ? 'This run was already applied' : 'Promotion applied')
      void rosterQ.refetch()
    } catch (e) { showError(errMsg(e)) } finally { setApplying(false) }
  }

  const exportCsv = () => {
    if (!rows) return
    downloadCsv('promotion-preview.csv', rows.map(r => ({
      'Register No': r.regNo, Name: r.name, Branch: r.branch, Batch: r.batch, 'From Sem': r.fromSemester,
      Decision: ACTION_META[choices[r.studentId] || r.action].label,
      Backlogs: r.backlogs.map(b => b.subjectCode || b.subjectName).join('; '), Reason: r.reason,
    })))
  }

  if (!cid) return <div className="p-6"><Empty icon={<ShieldAlert className="w-8 h-8" />} title="No college selected" hint="Select a college to run semester promotion." /></div>

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader title="Semester Promotion" subtitle="Promote, detain or graduate a cohort using published results — with backlogs computed for you" icon={<ArrowUpCircle className="w-5 h-5" />} />

      <div className="glass-card p-4 mb-4">
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Field label="Batch"><select className="input-field" value={batch} onChange={e => setBatch(e.target.value)}><option value="">All batches</option>{batches.map(b => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Programme / branch"><select className="input-field" value={branch} onChange={e => setBranch(e.target.value)}><option value="">All programmes</option>{branches.map(b => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Current semester"><select className="input-field" value={semester} onChange={e => setSemester(e.target.value)}><option value="0">All semesters</option>{Array.from({ length: 8 }, (_, i) => <option key={i + 1} value={i + 1}>Semester {i + 1}</option>)}</select></Field>
          <Field label="Carryover limit (backlogs)"><input type="number" min={0} max={40} className="input-field" value={maxBacklogs} onChange={e => setMaxBacklogs(Number(e.target.value))} /></Field>
          <Field label="Programme length (sems)"><input type="number" min={1} max={12} className="input-field" value={programmeSemesters} onChange={e => setProgrammeSemesters(Number(e.target.value))} /></Field>
          <Field label="Graduation rule">
            <label className="flex items-center gap-2 input-field cursor-pointer"><input type="checkbox" checked={allClear} onChange={e => setAllClear(e.target.checked)} /><span className="text-sm">All subjects clear</span></label>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button className={btn.primary} disabled={busy} onClick={runPreview}><Play className="w-4 h-4" />{busy ? 'Evaluating…' : 'Preview promotion'}</button>
          <p className="text-xs text-vriddhi-muted">Uses <b>published</b> grade records only. Publish this semester's results (Admin → Grade Import) before running promotion. Students already Alumni/Dropped are skipped automatically.</p>
        </div>
      </div>

      {done && (
        <div className="glass-card p-4 mb-4 border-teal-500/30">
          <p className="font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-teal-500" /> Promotion applied</p>
          <p className="text-sm text-vriddhi-muted mt-1">
            Promoted {done.promote || 0} · Graduated {done.graduate || 0} · Detained {done.detain || 0} · Repeat final {done.repeat_final || 0}. Backlog lists are recorded on each student; graduates now show as Alumni with passing year {new Date().getFullYear()}.
          </p>
        </div>
      )}

      {busy ? <Loading /> : rows === null ? (
        <Empty icon={<ArrowUpCircle className="w-8 h-8" />} title="No preview yet" hint="Choose a cohort and policy, then preview. Nothing changes until you apply." />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <StatCard label="Promote" value={counts.promote || 0} icon={<ArrowUpCircle className="w-4 h-4" />} />
            <StatCard label="Graduate" value={counts.graduate || 0} icon={<GraduationCap className="w-4 h-4" />} />
            <StatCard label="Detain" value={counts.detain || 0} icon={<ShieldAlert className="w-4 h-4" />} />
            <StatCard label="Repeat final" value={counts.repeat_final || 0} icon={<ShieldAlert className="w-4 h-4" />} />
            <StatCard label="Skipped" value={counts.skip || 0} icon={<Search className="w-4 h-4" />} />
          </div>
          <div className="glass-card p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
                <input className="input-field pl-9" placeholder="Search name or register no…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className={btn.ghost} onClick={exportCsv}><Download className="w-4 h-4" /> Export CSV</button>
              <button className={btn.primary} disabled={!actionable || !!done} onClick={() => setConfirmOpen(true)}>Apply promotion ({actionable})</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-vriddhi-muted border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 pr-2">Student</th><th className="py-2 pr-2">Sem</th><th className="py-2 pr-2">Backlogs</th><th className="py-2 pr-2">Verdict</th><th className="py-2 pr-2">Decision</th><th className="py-2">Reason</th>
                </tr></thead>
                <tbody>
                  {visible.map(r => (
                    <tr key={r.studentId} className="border-b border-slate-100 dark:border-slate-800 align-top">
                      <td className="py-2 pr-2"><p className="font-medium">{r.name}</p><p className="text-xs text-vriddhi-muted">{r.regNo} · {r.branch}</p></td>
                      <td className="py-2 pr-2">{r.fromSemester} → {(choices[r.studentId] || r.action) === 'promote' ? r.fromSemester + 1 : r.fromSemester}</td>
                      <td className="py-2 pr-2">{r.backlogs.length ? <span className="text-xs">{r.backlogs.map(b => b.subjectCode || b.subjectName).join(', ')}</span> : '—'}</td>
                      <td className="py-2 pr-2"><Badge tone={ACTION_META[r.action].tone}>{ACTION_META[r.action].label}</Badge></td>
                      <td className="py-2 pr-2">
                        <select className="input-field !w-auto !py-1.5 text-sm" value={choices[r.studentId] || r.action} onChange={e => setChoices(prev => ({ ...prev, [r.studentId]: e.target.value as PromotionAction }))}>
                          {(['promote', 'detain', 'graduate', 'repeat_final', 'skip'] as PromotionAction[]).map(a => <option key={a} value={a}>{ACTION_META[a].label}</option>)}
                        </select>
                      </td>
                      <td className="py-2 text-xs text-vriddhi-muted">{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visible.length && <p className="text-sm text-vriddhi-muted py-4 text-center">No students match the search.</p>}
            </div>
          </div>
        </>
      )}

      {confirmOpen && (
        <Modal open={confirmOpen} title="Apply this promotion run?" onClose={() => setConfirmOpen(false)}>
          <div className="space-y-3">
            <p className="text-sm">This updates student records immediately: <b>{counts.promote || 0}</b> promoted, <b>{counts.graduate || 0}</b> graduated to Alumni, <b>{counts.detain || 0}</b> detained, <b>{counts.repeat_final || 0}</b> repeating final semester. Backlog lists are recomputed on the server at apply time. The run is recorded and cannot double-apply; corrections are made on the individual student record afterwards.</p>
            <div className="flex gap-2">
              <button className={btn.primary} disabled={applying} onClick={apply}>{applying ? 'Applying…' : 'Apply promotion'}</button>
              <button className={btn.ghost} onClick={() => setConfirmOpen(false)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
