// /admin/no-dues — clearance requests. Each office clears the sections it
// owns (library → operations, fees → accounts, department → HOD, …as the
// college configures); live checks show pending books, library fines and
// fee balances. When everything is cleared, an office issues the
// numbered certificate.

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Award, CheckCircle2, CircleDashed, FileText, Plus, Save, Search, ShieldCheck, Trash2, XCircle } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, btn, downloadCsv, errMsg, fmtDate, fmtDateTime, inr } from '../components/officeUi'
import { cancelNoDues, createNoDuesRequest, downloadNoDuesCertificate, fetchNoDuesRequests, fetchNoDuesSettings, issueNoDuesCertificate, saveNoDuesSettings, setNoDuesSection, type NoDuesRequest } from '../api/noDuesApi'
import { fetchLibraryMembers, fetchLoansForMember, fetchUnpaidFineTotal } from '../api/libraryApi'
import { fetchFeePayments, getOutstandingAmount } from '@/modules/admin/api/feeApi'
import { useBranding, useCollegeId } from '../hooks/useLibrary'
import { actor } from '../api/officeDb'
import { DEFAULT_NODUES_SETTINGS, canActOnSection, effectiveSections, progress, type AutoCheck, type NoDuesSectionDef, type NoDuesSettings, type SectionOwner, type SectionStatus } from '../utils/noDuesEngine'

type Filter = 'mine' | 'open' | 'cleared' | 'issued' | 'all' | 'settings'
const OWNER_LABEL: Record<SectionOwner, string> = { operations: 'Operations team', accounts: 'Accounts team', hod: 'Department HOD', principal: 'Principal' }
const CAN_ISSUE = ['principal', 'superadmin', 'operations', 'accounts']
const CAN_CONFIG = ['principal', 'superadmin', 'operations']

export default function NoDuesPage() {
  const { user } = useAuth()
  const role = user?.role || ''
  const cid = useCollegeId()
  const qc = useQueryClient()
  const settingsQ = useQuery({ queryKey: ['nodues', cid, 'settings'], queryFn: () => fetchNoDuesSettings(cid), enabled: !!cid })
  const reqQ = useQuery({ queryKey: ['nodues', cid, 'requests'], queryFn: () => fetchNoDuesRequests(cid), enabled: !!cid })
  const settings = settingsQ.data || DEFAULT_NODUES_SETTINGS
  const [filter, setFilter] = useState<Filter>('mine')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<NoDuesRequest | null>(null)
  const [creating, setCreating] = useState(false)
  const refresh = () => qc.invalidateQueries({ queryKey: ['nodues', cid] })

  const isDeptHead = role === 'hod' || role === 'admin'
  const all = useMemo(() => {
    const list = reqQ.data || []
    return isDeptHead ? list.filter(r => !!user?.department && r.department.trim().toLowerCase() === user.department.trim().toLowerCase()) : list
  }, [reqQ.data, isDeptHead, user?.department])
  const mine = all.filter(r => r.status === 'open' && effectiveSections(settings.sections, r.sections).some(s => s.status !== 'cleared' && canActOnSection(s, role, user?.department, r.department)))
  const lists: Record<Exclude<Filter, 'settings'>, NoDuesRequest[]> = {
    mine,
    open: all.filter(r => r.status === 'open'),
    cleared: all.filter(r => r.status === 'cleared'),
    issued: all.filter(r => r.status === 'issued'),
    all,
  }
  const s = q.trim().toLowerCase()
  const list = filter === 'settings' ? [] : lists[filter].filter(r => !s || `${r.studentName} ${r.regNo} ${r.certificateNo}`.toLowerCase().includes(s))

  if (settingsQ.isLoading || reqQ.isLoading) return <div className="p-6"><Loading /></div>
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="No-Dues Clearance" subtitle={`Checklist: ${settings.sections.map(x => x.label).join(' · ')}`} icon={<ShieldCheck className="w-5 h-5" />}
        actions={<>
          <button className={btn.ghost} onClick={() => downloadCsv('no-dues.csv', all.map(r => ({ Student: r.studentName, 'Reg No': r.regNo, Course: r.course, Department: r.department, Purpose: r.purpose, Status: r.status, ...Object.fromEntries(effectiveSections(settings.sections, r.sections).map(x => [x.label, x.status])), 'Certificate': r.certificateNo, 'Issued on': r.issuedAt.slice(0, 10) })))}>CSV</button>
          {role !== 'hod' && role !== 'admin' && <button className={btn.primary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" />New request</button>}
        </>} />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PillTabs value={filter} onChange={setFilter} options={[
          { id: 'mine', label: 'Needs my clearance', count: lists.mine.length },
          { id: 'open', label: 'In progress', count: lists.open.length },
          { id: 'cleared', label: 'Ready to issue', count: lists.cleared.length },
          { id: 'issued', label: 'Issued' },
          { id: 'all', label: 'All' },
          ...(CAN_CONFIG.includes(role) ? [{ id: 'settings' as Filter, label: 'Checklist settings' }] : []),
        ]} />
        {filter !== 'settings' && <div className="relative ml-auto"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" /><input className="input-field pl-9" placeholder="Name, reg no, certificate" value={q} onChange={e => setQ(e.target.value)} /></div>}
      </div>
      {filter === 'settings' ? <SettingsForm initial={settings} onSaved={refresh} /> : !list.length ? <Empty icon={<ShieldCheck className="w-8 h-8" />} title="Nothing here" hint="Students apply from their portal, or start a request for them." /> : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-3">Student</th><th className="p-3">Purpose</th><th className="p-3">Progress</th><th className="p-3">Applied</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {list.map(r => {
                const p = progress(settings.sections, r.sections)
                return (
                  <tr key={r.id} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-border/20 cursor-pointer" onClick={() => setOpen(r)}>
                    <td className="p-3">{r.studentName}<div className="text-xs text-vriddhi-muted">{r.regNo} · {r.course}{r.department ? ` · ${r.department}` : ''}</div></td>
                    <td className="p-3">{r.purpose}</td>
                    <td className="p-3">
                      <div className="flex gap-1">{effectiveSections(settings.sections, r.sections).map(x => <span key={x.key} title={`${x.label}: ${x.status}`} className={`w-3 h-3 rounded-full ${x.status === 'cleared' ? 'bg-emerald-500' : x.status === 'blocked' ? 'bg-red-500' : 'bg-vriddhi-border'}`} />)}</div>
                      <div className="text-xs text-vriddhi-muted mt-1">{p.cleared}/{p.total} cleared{p.blocked ? ` · ${p.blocked} blocked` : ''}</div>
                    </td>
                    <td className="p-3">{fmtDate(r.createdAt)}</td>
                    <td className="p-3"><Badge tone={r.status === 'issued' ? 'green' : r.status === 'cleared' ? 'teal' : r.status === 'cancelled' ? 'slate' : p.blocked ? 'red' : 'amber'}>{r.status === 'issued' ? r.certificateNo : r.status === 'cleared' ? 'Ready to issue' : r.status === 'cancelled' ? 'Cancelled' : p.blocked ? 'Dues pending' : 'In progress'}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating && <NewRequestModal settings={settings} existing={reqQ.data || []} onClose={() => setCreating(false)} onDone={refresh} />}
      {open && <RequestModal req={open} settings={settings} role={role} dept={user?.department} onClose={() => setOpen(null)} onDone={() => { refresh(); setOpen(null) }} />}
    </div>
  )
}

function NewRequestModal({ settings, existing, onClose, onDone }: { settings: NoDuesSettings; existing: NoDuesRequest[]; onClose: () => void; onDone: () => void }) {
  const { showSuccess, showError } = useNotification()
  const membersQ = useQuery({ queryKey: ['nodues', 'members'], queryFn: fetchLibraryMembers })
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<string>('')
  const [purpose, setPurpose] = useState(settings.purposes[0] || '')
  const students = (membersQ.data || []).filter(m => m.type === 'student')
  const s = q.trim().toLowerCase()
  const matches = s.length >= 2 ? students.filter(m => `${m.name} ${m.code}`.toLowerCase().includes(s)).slice(0, 8) : []
  const chosen = students.find(m => m.id === pick)
  const m = useMutation({
    mutationFn: () => {
      if (!chosen) throw new Error('Choose a student.')
      return createNoDuesRequest({ studentId: chosen.studentId, uid: chosen.uid, name: chosen.name, regNo: chosen.code, course: chosen.course, batch: chosen.batch, department: chosen.department }, purpose, existing)
    },
    onSuccess: () => { showSuccess('Request created'); onDone(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title="New no-dues request" footer={<><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>Create</button></>}>
      <Field label="Student"><input className="input-field" placeholder="Type name or register number" value={chosen ? `${chosen.name} (${chosen.code})` : q} onChange={e => { setPick(''); setQ(e.target.value) }} /></Field>
      {!chosen && matches.length > 0 && <div className="mt-1 border border-vriddhi-border rounded-xl overflow-hidden">{matches.map(x => <button key={x.id} className="block w-full text-left px-3 py-2 text-sm hover:bg-vriddhi-border/30" onClick={() => setPick(x.id)}>{x.name} <span className="text-vriddhi-muted">{x.code} · {x.course}</span></button>)}</div>}
      {membersQ.isLoading && <p className="text-xs text-vriddhi-muted mt-1">Loading students…</p>}
      <Field label="Purpose" className="mt-3"><select className="input-field" value={purpose} onChange={e => setPurpose(e.target.value)}>{settings.purposes.map(p => <option key={p}>{p}</option>)}</select></Field>
    </Modal>
  )
}

function AutoCheckLine({ auto, req }: { auto: AutoCheck; req: NoDuesRequest }) {
  const q = useQuery({
    queryKey: ['nodues', 'check', auto, req.studentId],
    enabled: auto !== 'none' && !!req.studentId,
    retry: false,
    queryFn: async () => {
      if (auto === 'library') {
        const [loans, fines] = await Promise.all([fetchLoansForMember(req.studentId), fetchUnpaidFineTotal(req.studentId)])
        const out = loans.filter(l => l.status === 'issued')
        return { ok: !out.length && fines <= 0, text: `${out.length} book(s) not returned${out.length ? `: ${out.slice(0, 3).map(l => l.titleName).join(', ')}` : ''} · unpaid fines ${inr(fines)}`, dues: fines }
      }
      const pays = await fetchFeePayments({ studentId: req.studentId })
      const due = pays.filter(p => p.status !== 'waived').reduce((s, p) => s + getOutstandingAmount(p), 0)
      return { ok: due <= 0, text: `Fee balance ${inr(due)}`, dues: due }
    },
  })
  if (auto === 'none') return null
  if (q.isLoading) return <p className="text-xs text-vriddhi-muted">Checking…</p>
  if (q.isError || !q.data) return <p className="text-xs text-vriddhi-muted">Live check not available for your role.</p>
  return <p className={`text-xs flex items-center gap-1 ${q.data.ok ? 'text-emerald-600' : 'text-red-500'}`}>{q.data.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}{q.data.text}</p>
}

function RequestModal({ req, settings, role, dept, onClose, onDone }: { req: NoDuesRequest; settings: NoDuesSettings; role: string; dept?: string; onClose: () => void; onDone: () => void }) {
  const branding = useBranding()
  const { showSuccess, showError } = useNotification()
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [dues, setDues] = useState<Record<string, number>>({})
  const secs = effectiveSections(settings.sections, req.sections)
  const act = useMutation({
    mutationFn: ({ key, status }: { key: string; status: SectionStatus }) => setNoDuesSection(req.id, key, status, notes[key] || '', dues[key] || 0, settings),
    onSuccess: () => { showSuccess('Updated'); onDone() },
    onError: e => showError(errMsg(e)),
  })
  const issue = useMutation({
    mutationFn: async () => {
      const no = await issueNoDuesCertificate(req, settings)
      await downloadNoDuesCertificate({ ...req, status: 'issued', certificateNo: no, issuedAt: new Date().toISOString(), issuedBy: actor().name }, settings, branding)
      return no
    },
    onSuccess: no => { showSuccess(`Certificate ${no} issued`); onDone() },
    onError: e => showError(errMsg(e)),
  })
  const cancel = useMutation({ mutationFn: () => cancelNoDues(req.id), onSuccess: () => { showSuccess('Cancelled'); onDone() }, onError: e => showError(errMsg(e)) })
  const closed = req.status === 'issued' || req.status === 'cancelled'
  return (
    <Modal open onClose={onClose} title={`${req.studentName} · ${req.purpose}`} wide footer={<>
      {!closed && CAN_ISSUE.includes(role) && <button className={`${btn.danger} mr-auto`} disabled={cancel.isPending} onClick={() => cancel.mutate()}>Cancel request</button>}
      {req.status === 'issued' && <button className={btn.ghost} onClick={() => downloadNoDuesCertificate(req, settings, branding)}><FileText className="w-4 h-4" />Certificate</button>}
      {req.status === 'cleared' && CAN_ISSUE.includes(role) && <button className={btn.primary} disabled={issue.isPending} onClick={() => issue.mutate()}><Award className="w-4 h-4" />Issue certificate</button>}
    </>}>
      <p className="text-sm text-vriddhi-muted mb-4">{req.regNo} · {req.course} {req.batch} · {req.department || '—'} · applied {fmtDate(req.createdAt)} by {req.requestedBy}{req.certificateNo ? ` · ${req.certificateNo} issued ${fmtDate(req.issuedAt)}` : ''}</p>
      <div className="space-y-3">
        {secs.map(s => {
          const mineSec = !closed && canActOnSection(s, role, dept, req.department)
          return (
            <div key={s.key} className="p-3 rounded-xl border border-vriddhi-border">
              <div className="flex items-center gap-2">
                {s.status === 'cleared' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : s.status === 'blocked' ? <XCircle className="w-5 h-5 text-red-500" /> : <CircleDashed className="w-5 h-5 text-vriddhi-muted" />}
                <span className="font-medium">{s.label}</span>
                <span className="text-xs text-vriddhi-muted">{OWNER_LABEL[s.ownerRole]}</span>
                {s.by && <span className="ml-auto text-xs text-vriddhi-muted">{s.by} · {fmtDateTime(s.at)}</span>}
              </div>
              {s.note && <p className="text-sm mt-1 ml-7">{s.note}{s.dues ? ` · dues ${inr(s.dues)}` : ''}</p>}
              {mineSec && (
                <div className="ml-7 mt-2 space-y-2">
                  <AutoCheckLine auto={s.auto} req={req} />
                  <div className="flex flex-wrap gap-2 items-center">
                    <input className="input-field flex-1 min-w-[180px]" placeholder="Note (required to block)" value={notes[s.key] ?? ''} onChange={e => setNotes({ ...notes, [s.key]: e.target.value })} />
                    <input className="input-field w-28" type="number" min={0} placeholder="Dues ₹" value={dues[s.key] || ''} onChange={e => setDues({ ...dues, [s.key]: Number(e.target.value) || 0 })} />
                    {s.status !== 'cleared' && <button className={btn.primary} disabled={act.isPending} onClick={() => act.mutate({ key: s.key, status: 'cleared' })}><CheckCircle2 className="w-4 h-4" />Clear</button>}
                    {s.status !== 'blocked' && <button className={btn.danger} disabled={act.isPending} onClick={() => act.mutate({ key: s.key, status: 'blocked' })}><XCircle className="w-4 h-4" />Dues pending</button>}
                    {s.status !== 'pending' && <button className={btn.ghost} disabled={act.isPending} onClick={() => act.mutate({ key: s.key, status: 'pending' })}>Reset</button>}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

function SettingsForm({ initial, onSaved }: { initial: NoDuesSettings; onSaved: () => void }) {
  const [s, setS] = useState<NoDuesSettings>(initial)
  const [purpose, setPurpose] = useState('')
  const { showSuccess, showError } = useNotification()
  const save = useMutation({ mutationFn: () => saveNoDuesSettings(s), onSuccess: () => { showSuccess('Checklist saved'); onSaved() }, onError: e => showError(errMsg(e)) })
  const setSec = (i: number, p: Partial<NoDuesSectionDef>) => setS({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, ...p } : x)) })
  return (
    <div className="space-y-4 pb-16">
      <section className="glass-card p-4">
        <h3 className="font-semibold mb-1">Clearance checklist</h3>
        <p className="text-xs text-vriddhi-muted mb-3">Every section must be cleared before a certificate can be issued. Changing the list applies to open requests too.</p>
        <div className="space-y-2">
          {s.sections.map((x, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className="input-field col-span-4" value={x.label} onChange={e => setSec(i, { label: e.target.value })} placeholder="Section name" />
              <select className="input-field col-span-4" value={x.ownerRole} onChange={e => setSec(i, { ownerRole: e.target.value as SectionOwner })}>{(Object.keys(OWNER_LABEL) as SectionOwner[]).map(o => <option key={o} value={o}>{OWNER_LABEL[o]}</option>)}</select>
              <select className="input-field col-span-3" value={x.auto} onChange={e => setSec(i, { auto: e.target.value as AutoCheck })}><option value="none">No live check</option><option value="library">Check library</option><option value="fees">Check fee balance</option></select>
              <button className="col-span-1 text-red-500" onClick={() => setS({ ...s, sections: s.sections.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button className={`${btn.small} mt-2`} onClick={() => setS({ ...s, sections: [...s.sections, { key: '', label: '', ownerRole: 'operations', auto: 'none' }] })}><Plus className="w-3 h-3" />Add section</button>
      </section>
      <section className="glass-card p-4 grid sm:grid-cols-2 gap-3">
        <Field label="Certificate prefix" hint="NDC/2026-27/0001"><input className="input-field" value={s.certificatePrefix} onChange={e => setS({ ...s, certificatePrefix: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={s.allowStudentApply} onChange={e => setS({ ...s, allowStudentApply: e.target.checked })} />Students can apply from their portal</label>
        <Field label="Certificate text" className="sm:col-span-2"><textarea className="input-field" rows={3} value={s.certificateNote} onChange={e => setS({ ...s, certificateNote: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <p className="text-xs font-medium text-vriddhi-muted mb-1">Purposes</p>
          <div className="flex flex-wrap gap-1.5 mb-2">{s.purposes.map(p => <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-vriddhi-card border border-vriddhi-border">{p}<button onClick={() => setS({ ...s, purposes: s.purposes.filter(x => x !== p) })}>×</button></span>)}</div>
          <input className="input-field" value={purpose} placeholder="Add and press Enter" onChange={e => setPurpose(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && purpose.trim()) { setS({ ...s, purposes: Array.from(new Set([...s.purposes, purpose.trim()])) }); setPurpose('') } }} />
        </div>
      </section>
      <div className="fixed bottom-4 right-4 md:right-8 z-20"><button className={`${btn.primary} shadow-lg`} disabled={save.isPending} onClick={() => save.mutate()}><Save className="w-4 h-4" />{save.isPending ? 'Saving…' : 'Save checklist'}</button></div>
    </div>
  )
}
