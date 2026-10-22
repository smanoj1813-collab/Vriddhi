// /admin/scholarships — SSP/NSP scholarship desk for the college office.
// Tabs: verification queue (e-attestation), all applications, the
// "eligible but not applied" worklist, and scheme settings with the
// portal last dates for this academic year.
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Download, GraduationCap, Landmark, Save, Search, Wallet } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate, inr } from '../components/officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { fetchCertificateStudents } from '../api/certificateApi'
import {
  fetchScholarshipApplications, fetchScholarshipSettings, saveScholarshipSettings, updateScholarshipStatus,
  type ScholarshipApplication,
} from '../api/scholarshipApi'
import { useCollegeId } from '../hooks/useLibrary'
import {
  DEFAULT_SCHOLARSHIP_SETTINGS, SCHOLARSHIP_NEXT, SCHOLARSHIP_STATUS_LABELS, academicYearOf,
  daysToDeadline, isLikelyEligible, normalizeScholarshipSettings,
  type ScholarshipSettings, type ScholarshipStatus,
} from '../utils/scholarshipEngine'

const TONE: Record<ScholarshipStatus, 'amber' | 'blue' | 'purple' | 'green' | 'teal' | 'red' | 'slate'> = {
  applied: 'amber', verified: 'blue', forwarded: 'purple', sanctioned: 'green', disbursed: 'teal', rejected: 'red', withdrawn: 'slate',
}

type TabId = 'queue' | 'all' | 'worklist' | 'settings'

export default function ScholarshipsPage() {
  const cid = useCollegeId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const settingsQ = useQuery({ queryKey: ['scholarships', cid, 'settings'], queryFn: () => fetchScholarshipSettings(cid), enabled: !!cid })
  const appsQ = useQuery({ queryKey: ['scholarships', cid, 'apps'], queryFn: fetchScholarshipApplications, enabled: !!cid })
  const rosterQ = useQuery({ queryKey: ['scholarships', cid, 'roster'], queryFn: () => fetchCertificateStudents(cid), enabled: !!cid })
  const settings = settingsQ.data || DEFAULT_SCHOLARSHIP_SETTINGS
  const apps = appsQ.data || []
  const year = academicYearOf()
  const yearApps = apps.filter(a => a.academicYear === year)
  const queue = yearApps.filter(a => a.status === 'applied')
  const totalDisbursed = yearApps.reduce((sum, a) => sum + a.disbursedAmount, 0)
  const [tab, setTab] = useState<TabId>('queue')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ScholarshipStatus>('all')
  const [decideFor, setDecideFor] = useState<ScholarshipApplication | null>(null)
  const [nextStatus, setNextStatus] = useState<ScholarshipStatus>('verified')
  const [note, setNote] = useState('')
  const [sanctioned, setSanctioned] = useState(0)
  const [disbursed, setDisbursed] = useState(0)
  const [appNo, setAppNo] = useState('')
  const [draft, setDraft] = useState<ScholarshipSettings | null>(null)
  const editDraft = draft || settings

  const refresh = () => { void qc.invalidateQueries({ queryKey: ['scholarships', cid, 'apps'] }); void qc.invalidateQueries({ queryKey: ['scholarships', cid, 'settings'] }) }
  const decide = useMutation({
    mutationFn: () => updateScholarshipStatus(decideFor!.id, nextStatus, { officeNote: note, sanctionedAmount: sanctioned, disbursedAmount: disbursed, applicationNo: appNo }),
    onSuccess: () => { showSuccess('Application updated'); setDecideFor(null); refresh() },
    onError: e => showError(errMsg(e)),
  })
  const saveSettings = useMutation({
    mutationFn: () => saveScholarshipSettings(normalizeScholarshipSettings(editDraft)),
    onSuccess: () => { showSuccess('Scholarship schemes saved'); setDraft(null); refresh() },
    onError: e => showError(errMsg(e)),
  })

  const worklist = useMemo(() => {
    const appliedKeys = new Set(yearApps.filter(a => !['rejected', 'withdrawn'].includes(a.status)).map(a => `${a.studentId}|${a.schemeId}`))
    const rows: { student: string; regNo: string; programme: string; category: string; scheme: string; portal: string; lastDate: string; days: number | null }[] = []
    for (const st of rosterQ.data || []) {
      for (const scheme of settings.schemes.filter(s => s.enabled)) {
        if (appliedKeys.has(`${st.studentId}|${scheme.id}`)) continue
        const verdict = isLikelyEligible(scheme, { category: st.category || '' })
        if (verdict === 'unlikely') continue
        rows.push({ student: st.name, regNo: st.regNo, programme: st.programme, category: st.category || 'Not recorded', scheme: scheme.name, portal: scheme.portal, lastDate: scheme.lastDate, days: daysToDeadline(scheme) })
      }
    }
    return rows.sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999) || a.student.localeCompare(b.student))
  }, [rosterQ.data, yearApps, settings])

  const filtered = apps.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (!search || `${a.studentName} ${a.regNo} ${a.schemeName} ${a.applicationNo}`.toLowerCase().includes(search.toLowerCase())))

  const openDecide = (a: ScholarshipApplication) => {
    setDecideFor(a)
    setNextStatus(SCHOLARSHIP_NEXT[a.status][0] || a.status)
    setNote(a.officeNote); setSanctioned(a.sanctionedAmount); setDisbursed(a.disbursedAmount); setAppNo(a.applicationNo)
  }

  const appRow = (a: ScholarshipApplication) => (
    <div key={a.id} className="glass-card p-4 flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{a.studentName} <span className="text-xs text-vriddhi-muted font-normal">{a.regNo} · {a.programme} · {a.category || '—'}</span></p>
        <p className="text-xs text-vriddhi-muted">{a.schemeName} ({a.portal}) · {a.academicYear}{a.applicationNo && <> · App. {a.applicationNo}</>} · applied {fmtDate(a.appliedOn || a.createdAt)}</p>
        {(a.sanctionedAmount > 0 || a.disbursedAmount > 0) && <p className="text-xs mt-0.5">Sanctioned {inr(a.sanctionedAmount)} · Disbursed {inr(a.disbursedAmount)}</p>}
        {a.officeNote && <p className="text-xs text-vriddhi-muted mt-0.5">Note: {a.officeNote}</p>}
      </div>
      <Badge tone={TONE[a.status]}>{SCHOLARSHIP_STATUS_LABELS[a.status]}</Badge>
      {!!SCHOLARSHIP_NEXT[a.status].length && <button className={btn.primary} onClick={() => openDecide(a)}><BadgeCheck className="w-4 h-4" /> Update status</button>}
    </div>
  )

  if (!cid) return <div className="p-6"><Empty icon={<Landmark className="w-8 h-8" />} title="No college selected" /></div>

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <PageHeader title="Scholarship Desk" subtitle={`SSP / NSP applications, verification & DBT tracking — ${year}`} icon={<GraduationCap className="w-5 h-5" />}
        actions={<button className={btn.ghost} onClick={() => downloadCsv('scholarship-register.csv', apps.map(a => ({ Student: a.studentName, 'Reg No': a.regNo, Programme: a.programme, Category: a.category, Scheme: a.schemeName, Portal: a.portal, Year: a.academicYear, 'Application No': a.applicationNo, Status: a.status, 'Sanctioned (₹)': a.sanctionedAmount, 'Disbursed (₹)': a.disbursedAmount })))}><Download className="w-4 h-4" /> Register CSV</button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label={`Applications (${year})`} value={yearApps.length} icon={<GraduationCap className="w-4 h-4" />} />
        <StatCard label="Awaiting verification" value={queue.length} icon={<BadgeCheck className="w-4 h-4" />} />
        <StatCard label="Sanctioned / disbursed" value={yearApps.filter(a => ['sanctioned', 'disbursed'].includes(a.status)).length} icon={<Landmark className="w-4 h-4" />} />
        <StatCard label="DBT disbursed" value={inr(totalDisbursed)} icon={<Wallet className="w-4 h-4" />} />
      </div>

      <PillTabs value={tab} onChange={t => setTab(t as TabId)} options={[
        { id: 'queue', label: `Verification queue (${queue.length})` },
        { id: 'all', label: 'All applications' },
        { id: 'worklist', label: `Not applied (${worklist.length})` },
        { id: 'settings', label: 'Schemes & last dates' },
      ]} />

      {appsQ.isLoading ? <Loading /> : tab === 'queue' ? (
        <div className="space-y-3">
          <p className="text-sm text-vriddhi-muted">Verify these applications on the SSP/NSP institute login (e-attestation for private colleges), then mark them verified here. Unverified applications are rejected by the department when the window closes.</p>
          {!queue.length ? <Empty icon={<BadgeCheck className="w-8 h-8" />} title="Nothing waiting" hint="New student applications will appear here." /> : queue.map(appRow)}
        </div>
      ) : tab === 'all' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
              <input className="input-field pl-9" placeholder="Search student, register no, scheme…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input-field !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'all' | ScholarshipStatus)}>
              <option value="all">All statuses</option>
              {(Object.keys(SCHOLARSHIP_STATUS_LABELS) as ScholarshipStatus[]).map(s => <option key={s} value={s}>{SCHOLARSHIP_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          {!filtered.length ? <Empty icon={<GraduationCap className="w-8 h-8" />} title="No applications" /> : filtered.map(appRow)}
        </div>
      ) : tab === 'worklist' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-vriddhi-muted flex-1">Students who look eligible (by recorded category) but have no live application this year. Students whose category is not on record are included — confirm with the student. Announce last dates early; most rejections are simply missed deadlines.</p>
            <button className={btn.ghost} onClick={() => downloadCsv('scholarship-worklist.csv', worklist.map(w => ({ Student: w.student, 'Reg No': w.regNo, Programme: w.programme, Category: w.category, Scheme: w.scheme, Portal: w.portal, 'Last date': w.lastDate, 'Days left': w.days ?? '' })))}><Download className="w-4 h-4" /> Worklist CSV</button>
          </div>
          {worklist.length ? (
            <div className="glass-card p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-vriddhi-muted border-b border-slate-200 dark:border-slate-700"><th className="py-2 pr-2">Student</th><th className="py-2 pr-2">Category</th><th className="py-2 pr-2">Scheme</th><th className="py-2">Last date</th></tr></thead>
                <tbody>
                  {worklist.slice(0, 400).map((w, i) => (
                    <tr key={`${w.regNo}-${w.scheme}-${i}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-2"><span className="font-medium">{w.student}</span> <span className="text-xs text-vriddhi-muted">{w.regNo} · {w.programme}</span></td>
                      <td className="py-2 pr-2">{w.category}</td>
                      <td className="py-2 pr-2">{w.scheme} <span className="text-xs text-vriddhi-muted">({w.portal})</span></td>
                      <td className="py-2">{w.lastDate ? <>{fmtDate(w.lastDate)} {w.days !== null && <Badge tone={w.days < 0 ? 'red' : w.days <= 15 ? 'amber' : 'green'}>{w.days < 0 ? `${-w.days}d overdue` : `${w.days}d left`}</Badge>}</> : <span className="text-xs text-vriddhi-muted">Set in Schemes tab</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {worklist.length > 400 && <p className="text-xs text-vriddhi-muted mt-2">Showing first 400 rows — download the CSV for the full list.</p>}
            </div>
          ) : <Empty icon={<GraduationCap className="w-8 h-8" />} title="Everyone has applied" hint="Or record students' categories (Admin → Students) so eligibility can be assessed." />}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="glass-card p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Institute nodal officer (shown to students)"><input className="input-field" value={editDraft.nodalOfficer} onChange={e => setDraft({ ...editDraft, nodalOfficer: e.target.value })} placeholder="e.g. Smt. Lakshmi Devi, Office Superintendent" /></Field>
              <label className="flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={editDraft.allowStudentApply} onChange={e => setDraft({ ...editDraft, allowStudentApply: e.target.checked })} /> Students can record their own applications</label>
            </div>
          </div>
          {editDraft.schemes.map((s, i) => (
            <div key={s.id} className="glass-card p-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Field label="Scheme name"><input className="input-field" value={s.name} onChange={e => setDraft({ ...editDraft, schemes: editDraft.schemes.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} /></Field>
                <Field label="Portal"><select className="input-field" value={s.portal} onChange={e => setDraft({ ...editDraft, schemes: editDraft.schemes.map((x, j) => j === i ? { ...x, portal: e.target.value as typeof s.portal } : x) })}>{['SSP', 'NSP', 'College', 'Private', 'Other'].map(p => <option key={p}>{p}</option>)}</select></Field>
                <Field label={`Last date (${year})`}><input type="date" className="input-field" value={s.lastDate} onChange={e => setDraft({ ...editDraft, schemes: editDraft.schemes.map((x, j) => j === i ? { ...x, lastDate: e.target.value } : x) })} /></Field>
                <Field label="Income limit (₹, 0 = none)"><input type="number" min={0} className="input-field" value={s.incomeLimit} onChange={e => setDraft({ ...editDraft, schemes: editDraft.schemes.map((x, j) => j === i ? { ...x, incomeLimit: Number(e.target.value) } : x) })} /></Field>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="text-xs text-vriddhi-muted">Categories: {s.categories.length ? s.categories.join(', ') : 'All categories'}</span>
                <label className="flex items-center gap-2 text-sm ml-auto"><input type="checkbox" checked={s.enabled} onChange={e => setDraft({ ...editDraft, schemes: editDraft.schemes.map((x, j) => j === i ? { ...x, enabled: e.target.checked } : x) })} /> Open this year</label>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button className={btn.primary} disabled={saveSettings.isPending} onClick={() => saveSettings.mutate()}><Save className="w-4 h-4" /> Save schemes</button>
            <button className={btn.ghost} onClick={() => setDraft({ ...editDraft, schemes: [...editDraft.schemes, { id: `scheme-${Date.now()}`, name: 'New scheme', portal: 'Other', categories: [], incomeLimit: 0, lastDate: '', enabled: true }] })}>Add scheme</button>
          </div>
          <p className="text-xs text-vriddhi-muted">SSP/NSP publish fresh last dates every academic year — update them here in June so the worklist countdowns and student reminders stay truthful.</p>
        </div>
      )}

      {decideFor && (
        <Modal open onClose={() => setDecideFor(null)} title={`Update — ${decideFor.studentName}`}>
          <div className="space-y-3">
            <p className="text-sm text-vriddhi-muted">{decideFor.schemeName} · currently “{SCHOLARSHIP_STATUS_LABELS[decideFor.status]}”</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="New status">
                <select className="input-field" value={nextStatus} onChange={e => setNextStatus(e.target.value as ScholarshipStatus)}>
                  {SCHOLARSHIP_NEXT[decideFor.status].map(s => <option key={s} value={s}>{SCHOLARSHIP_STATUS_LABELS[s]}</option>)}
                </select>
              </Field>
              <Field label="Portal application no."><input className="input-field" value={appNo} onChange={e => setAppNo(e.target.value)} placeholder="e.g. KA2026…" /></Field>
              <Field label="Sanctioned amount (₹)"><input type="number" min={0} className="input-field" value={sanctioned} onChange={e => setSanctioned(Number(e.target.value))} /></Field>
              <Field label="Disbursed via DBT (₹)"><input type="number" min={0} className="input-field" value={disbursed} onChange={e => setDisbursed(Number(e.target.value))} /></Field>
            </div>
            <Field label="Office note (visible to the student)"><input className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. E-attested on SSP, acknowledgement no. …" /></Field>
            <div className="flex gap-2">
              <button className={btn.primary} disabled={decide.isPending} onClick={() => decide.mutate()}>{decide.isPending ? 'Saving…' : 'Save update'}</button>
              <button className={btn.ghost} onClick={() => setDecideFor(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
