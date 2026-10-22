// /admin/certificates — the student certificate desk. Issue bonafide /
// study, transfer, conduct, course-completion and fee-structure
// certificates with numbered PDFs on the college letterhead. Students
// apply from their portal; this desk works the queue, handles walk-ins
// and owns the certificate wordings.
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Award, CheckCircle2, Download, FileText, Plus, Save, Search, Trash2, XCircle } from 'lucide-react'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate, inr } from '../components/officeUi'
import {
  decideCertificateRequest, downloadIssuedCertificate, fetchCertificateRequests, fetchCertificateSettings,
  fetchCertificateStudents, issueCertificate, issueDirectCertificate, saveCertificateSettings,
  type CertificateRequest, type CertificateStudent,
} from '../api/certificateApi'
import { useBranding, useCollegeId } from '../hooks/useLibrary'
import { queueEmailQuietly } from '@/shared/utils/mailApi'
import {
  CERTIFICATE_PLACEHOLDERS, DEFAULT_CERTIFICATE_SETTINGS, certificateType, certificateVars, feeLinesTotal,
  renderCertificateBody, type CertificateSettings, type CertificateTypeDef, type IssueExtras,
} from '../utils/certificateEngine'

type Tab = 'requests' | 'issued' | 'walkin' | 'settings'

interface IssueForm extends IssueExtras { reqId: string; kind: string }

const blankExtras = (): IssueExtras => ({ purpose: '', leavingReason: '', conduct: 'Good', feeLines: [{ label: '', amount: 0 }] })

function ExtrasFields({ def, form, set }: { def?: CertificateTypeDef; form: IssueExtras; set: (f: IssueExtras) => void }) {
  if (!def) return null
  const lines = form.feeLines || []
  return (
    <div className="grid gap-3">
      {def.needsPurpose && (
        <Field label="Purpose"><input className="input-field" value={form.purpose} onChange={e => set({ ...form, purpose: e.target.value })} placeholder="e.g. SSP post-matric scholarship, education loan, bus pass" /></Field>
      )}
      {def.needsLeavingReason && (
        <>
          <Field label="Reason for leaving"><input className="input-field" value={form.leavingReason || ''} onChange={e => set({ ...form, leavingReason: e.target.value })} placeholder="e.g. Course completed / joined another institution" /></Field>
          <Field label="Conduct remark"><input className="input-field" value={form.conduct || ''} onChange={e => set({ ...form, conduct: e.target.value })} placeholder="Good" /></Field>
        </>
      )}
      {def.kind === 'conduct' && (
        <Field label="Conduct remark"><input className="input-field" value={form.conduct || ''} onChange={e => set({ ...form, conduct: e.target.value })} placeholder="Good" /></Field>
      )}
      {def.needsFeeLines && (
        <div>
          <p className="text-xs font-bold text-vriddhi-muted mb-2">Fee heads (printed as a table)</p>
          <div className="grid gap-2">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2">
                <input className="input-field flex-1" placeholder="Fee head (e.g. Tuition fee)" value={l.label} onChange={e => set({ ...form, feeLines: lines.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                <input className="input-field" style={{ width: 140 }} type="number" min={0} placeholder="₹" value={l.amount || ''} onChange={e => set({ ...form, feeLines: lines.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) } : x) })} />
                <button type="button" className={btn.small} onClick={() => set({ ...form, feeLines: lines.filter((_, j) => j !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <button type="button" className={btn.small} onClick={() => set({ ...form, feeLines: [...lines, { label: '', amount: 0 }] })}><Plus className="w-3.5 h-3.5" /> Add fee head</button>
              <span className="text-sm font-bold">Total: {inr(feeLinesTotal(lines))}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BodyPreview({ def, student, form, collegeName }: { def?: CertificateTypeDef; student?: { name: string; regNo: string; programme: string; semester: number; batch: string; gender: string; dateOfBirth: string; apaarId: string }; form: IssueExtras; collegeName: string }) {
  if (!def || !student) return null
  const vars = certificateVars({ student, collegeName, extras: form, certificateNo: `${def.prefix}/…`, date: '…' })
  return (
    <div className="rounded-xl border border-vriddhi-border bg-vriddhi-card p-3">
      <p className="text-[11px] font-bold text-vriddhi-muted mb-1">Preview — {def.title}</p>
      <p className="text-sm whitespace-pre-line text-vriddhi-text/90">{renderCertificateBody(def, vars)}</p>
    </div>
  )
}

export default function CertificatesPage() {
  const cid = useCollegeId()
  const qc = useQueryClient()
  const branding = useBranding()
  const { showSuccess, showError } = useNotification()
  const [tab, setTab] = useState<Tab>('requests')
  const [q, setQ] = useState('')
  const [issueForm, setIssueForm] = useState<IssueForm | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const settingsQ = useQuery({ queryKey: ['certificates', cid, 'settings'], queryFn: () => fetchCertificateSettings(cid), enabled: !!cid })
  const reqQ = useQuery({ queryKey: ['certificates', cid, 'requests'], queryFn: () => fetchCertificateRequests(cid), enabled: !!cid })
  const studentsQ = useQuery({ queryKey: ['certificates', cid, 'students'], queryFn: () => fetchCertificateStudents(cid), enabled: !!cid && tab === 'walkin' })
  const settings = settingsQ.data || DEFAULT_CERTIFICATE_SETTINGS
  const [draftSettings, setDraftSettings] = useState<CertificateSettings | null>(null)
  const effSettings = draftSettings || settings

  const refresh = () => qc.invalidateQueries({ queryKey: ['certificates', cid] })
  const all = reqQ.data || []
  const open = all.filter(r => r.status === 'requested')
  const issued = all.filter(r => r.status === 'issued')
  const issuedThisMonth = issued.filter(r => r.issuedAt.slice(0, 7) === new Date().toISOString().slice(0, 7)).length
  const s = q.trim().toLowerCase()
  const visible = (tab === 'issued' ? issued : open).filter(r => !s || `${r.studentName} ${r.regNo} ${r.certificateNo} ${r.kindLabel}`.toLowerCase().includes(s))

  const issueMut = useMutation({
    mutationFn: (f: IssueForm) => issueCertificate(f.reqId, f, settings, branding),
    onSuccess: async req => { showSuccess(`Issued ${req.certificateNo}`); setIssueForm(null); refresh(); void queueEmailQuietly('certificate_issued', [req.studentId], { certificateKind: req.kindLabel, certificateNo: req.certificateNo }); await downloadIssuedCertificate(req, branding, settings).catch(() => {}) },
    onError: e => showError(errMsg(e)),
  })
  const decideMut = useMutation({
    mutationFn: ({ id, to, note }: { id: string; to: 'rejected' | 'cancelled'; note: string }) => decideCertificateRequest(id, to, note),
    onSuccess: () => { showSuccess('Request updated'); setRejectId(null); setRejectNote(''); refresh() },
    onError: e => showError(errMsg(e)),
  })
  const saveSettingsMut = useMutation({
    mutationFn: (s2: CertificateSettings) => saveCertificateSettings(s2),
    onSuccess: () => { showSuccess('Certificate settings saved'); setDraftSettings(null); refresh() },
    onError: e => showError(errMsg(e)),
  })

  // Walk-in state
  const [walkKind, setWalkKind] = useState(settings.types[0]?.kind || 'bonafide')
  const [walkSearch, setWalkSearch] = useState('')
  const [walkStudent, setWalkStudent] = useState<CertificateStudent | null>(null)
  const [walkForm, setWalkForm] = useState<IssueExtras>(blankExtras())
  const walkMut = useMutation({
    mutationFn: () => {
      if (!walkStudent) throw new Error('Pick a student first.')
      return issueDirectCertificate(walkStudent, walkKind, walkForm, settings, branding)
    },
    onSuccess: async req => { showSuccess(`Issued ${req.certificateNo}`); refresh(); void queueEmailQuietly('certificate_issued', [req.studentId], { certificateKind: req.kindLabel, certificateNo: req.certificateNo }); await downloadIssuedCertificate(req, branding, settings).catch(() => {}); setWalkStudent(null); setWalkSearch(''); setWalkForm(blankExtras()) },
    onError: e => showError(errMsg(e)),
  })
  const studentMatches = useMemo(() => {
    const ws = walkSearch.trim().toLowerCase()
    if (ws.length < 2) return []
    return (studentsQ.data || []).filter(st => `${st.name} ${st.regNo}`.toLowerCase().includes(ws)).slice(0, 8)
  }, [walkSearch, studentsQ.data])

  if (settingsQ.isLoading || reqQ.isLoading) return <div className="p-6"><Loading /></div>

  const statusBadge = (r: CertificateRequest) => (
    r.status === 'issued' ? <Badge tone="green">Issued</Badge>
      : r.status === 'rejected' ? <Badge tone="red">Rejected</Badge>
        : r.status === 'cancelled' ? <Badge tone="slate">Cancelled</Badge>
          : <Badge tone="amber">Requested</Badge>
  )

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="Certificate Desk" subtitle="Bonafide · Transfer · Conduct · Course completion · Fee structure — numbered PDFs on the college letterhead"
        icon={<Award className="w-5 h-5" />}
        actions={<button className={btn.ghost} onClick={() => downloadCsv('certificate-register.csv', all.map(r => ({ 'Certificate No': r.certificateNo, Type: r.kindLabel, Student: r.studentName, 'Reg No': r.regNo, Programme: r.programme, Purpose: r.purpose, Status: r.status, Requested: r.createdAt.slice(0, 10), Issued: r.issuedAt.slice(0, 10), 'Issued by': r.issuedBy })))}><Download className="w-4 h-4" /> Register CSV</button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Open requests" value={open.length} icon={<FileText className="w-4 h-4" />} />
        <StatCard label="Issued this month" value={issuedThisMonth} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Issued (all time)" value={issued.length} icon={<Award className="w-4 h-4" />} />
        <StatCard label="Certificate types" value={settings.types.filter(t => t.enabled).length} icon={<FileText className="w-4 h-4" />} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PillTabs value={tab} onChange={setTab} options={[
          { id: 'requests', label: 'Requests', count: open.length },
          { id: 'issued', label: 'Issued', count: issued.length },
          { id: 'walkin', label: 'Issue new (walk-in)' },
          { id: 'settings', label: 'Settings' },
        ]} />
        {(tab === 'requests' || tab === 'issued') && (
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
            <input className="input-field pl-9" placeholder="Search student, reg no, certificate no…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        )}
      </div>

      {(tab === 'requests' || tab === 'issued') && (
        !visible.length ? <Empty icon={<Award className="w-8 h-8" />} title={tab === 'requests' ? 'No open requests' : 'No certificates issued yet'} hint={tab === 'requests' ? 'Student applications and walk-ins appear here.' : 'Issued certificates form your certificate register.'} /> : (
          <div className="grid gap-3">
            {visible.map(r => (
              <div key={r.id} className="glass-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{r.studentName}</p>
                  <span className="text-xs text-vriddhi-muted font-mono">{r.regNo}</span>
                  <Badge tone="teal">{r.kindLabel}</Badge>
                  {statusBadge(r)}
                  <span className="ml-auto flex items-center gap-2">
                    {r.status === 'requested' && <>
                      <button className={btn.primary} onClick={() => setIssueForm({ reqId: r.id, kind: r.kind, purpose: r.purpose, leavingReason: '', conduct: 'Good', feeLines: [{ label: '', amount: 0 }] })}><Award className="w-4 h-4" /> Issue</button>
                      <button className={btn.danger} onClick={() => setRejectId(r.id)}><XCircle className="w-4 h-4" /> Reject</button>
                    </>}
                    {r.status === 'issued' && <button className={btn.ghost} onClick={() => downloadIssuedCertificate(r, branding, settings).catch(e => showError(errMsg(e)))}><Download className="w-4 h-4" /> PDF</button>}
                  </span>
                </div>
                <p className="text-xs text-vriddhi-muted mt-1.5">
                  {r.programme} · Semester {r.semester || '—'} · Batch {r.batch || '—'}
                  {r.purpose && <> · Purpose: {r.purpose}</>}
                  {r.status === 'requested' && <> · requested {fmtDate(r.createdAt)} by {r.requestedBy}</>}
                  {r.status === 'issued' && <> · <span className="font-mono">{r.certificateNo}</span> issued {fmtDate(r.issuedAt)} by {r.issuedBy}</>}
                  {(r.status === 'rejected' || r.status === 'cancelled') && r.decidedNote && <> · {r.decidedNote}</>}
                </p>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'walkin' && (
        <div className="glass-card p-4 grid gap-4 max-w-3xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Certificate type">
              <select className="input-field" value={walkKind} onChange={e => setWalkKind(e.target.value)}>
                {settings.types.filter(t => t.enabled).map(t => <option key={t.kind} value={t.kind}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Student (name or reg no)">
              <input className="input-field" value={walkSearch} onChange={e => { setWalkSearch(e.target.value); setWalkStudent(null) }} placeholder="Type at least 2 characters…" />
            </Field>
          </div>
          {studentsQ.isLoading && <p className="text-xs text-vriddhi-muted">Loading students…</p>}
          {!!studentMatches.length && !walkStudent && (
            <div className="grid gap-1.5">
              {studentMatches.map(st => (
                <button key={st.studentId} className="text-left px-3 py-2 rounded-xl border border-vriddhi-border hover:bg-vriddhi-border/40 text-sm" onClick={() => { setWalkStudent(st); setWalkSearch(`${st.name} (${st.regNo})`) }}>
                  <span className="font-semibold">{st.name}</span> <span className="text-vriddhi-muted font-mono text-xs">{st.regNo} · {st.programme} · Sem {st.semester || '—'}</span>
                </button>
              ))}
            </div>
          )}
          <ExtrasFields def={certificateType(settings, walkKind)} form={walkForm} set={setWalkForm} />
          <BodyPreview def={certificateType(settings, walkKind)} student={walkStudent ? { name: walkStudent.name, regNo: walkStudent.regNo, programme: walkStudent.programme, semester: walkStudent.semester, batch: walkStudent.batch, gender: walkStudent.gender, dateOfBirth: walkStudent.dateOfBirth, apaarId: walkStudent.apaarId } : undefined} form={walkForm} collegeName={branding.collegeName} />
          <div>
            <button className={btn.primary} disabled={walkMut.isPending || !walkStudent} onClick={() => walkMut.mutate()}><Award className="w-4 h-4" /> {walkMut.isPending ? 'Issuing…' : 'Issue & download PDF'}</button>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="glass-card p-4 grid gap-5 max-w-4xl">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Signatory name"><input className="input-field" value={effSettings.signatoryName} onChange={e => setDraftSettings({ ...effSettings, signatoryName: e.target.value })} placeholder="Defaults to Finance Settings signatory" /></Field>
            <Field label="Signatory designation"><input className="input-field" value={effSettings.signatoryDesignation} onChange={e => setDraftSettings({ ...effSettings, signatoryDesignation: e.target.value })} /></Field>
            <Field label="Students may apply">
              <select className="input-field" value={effSettings.allowStudentApply ? 'yes' : 'no'} onChange={e => setDraftSettings({ ...effSettings, allowStudentApply: e.target.value === 'yes' })}>
                <option value="yes">Yes — from the student portal</option><option value="no">No — office only</option>
              </select>
            </Field>
          </div>
          <p className="text-xs text-vriddhi-muted">Placeholders: {CERTIFICATE_PLACEHOLDERS.map(p => `{{${p}}}`).join(' ')}</p>
          <div className="grid gap-4">
            {effSettings.types.map((t, i) => {
              const setT = (next: CertificateTypeDef) => setDraftSettings({ ...effSettings, types: effSettings.types.map((x, j) => j === i ? next : x) })
              return (
                <div key={t.kind} className="rounded-xl border border-vriddhi-border p-3 grid gap-3">
                  <div className="grid sm:grid-cols-4 gap-3">
                    <Field label="Label"><input className="input-field" value={t.label} onChange={e => setT({ ...t, label: e.target.value })} /></Field>
                    <Field label="Prefix"><input className="input-field" value={t.prefix} onChange={e => setT({ ...t, prefix: e.target.value })} /></Field>
                    <Field label="Printed title"><input className="input-field" value={t.title} onChange={e => setT({ ...t, title: e.target.value })} /></Field>
                    <Field label="Enabled">
                      <select className="input-field" value={t.enabled ? 'yes' : 'no'} onChange={e => setT({ ...t, enabled: e.target.value === 'yes' })}><option value="yes">Enabled</option><option value="no">Disabled</option></select>
                    </Field>
                  </div>
                  <Field label="Body wording">
                    <textarea className="input-field" rows={4} value={t.bodyTemplate} onChange={e => setT({ ...t, bodyTemplate: e.target.value })} />
                  </Field>
                  <div className="flex flex-wrap gap-4 text-xs">
                    {([['needsPurpose', 'Ask purpose'], ['needsFeeLines', 'Fee-lines table'], ['needsLeavingReason', 'Leaving reason + conduct']] as const).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5"><input type="checkbox" checked={t[key]} onChange={e => setT({ ...t, [key]: e.target.checked })} /> {label}</label>
                    ))}
                    <button type="button" className="ml-auto text-red-500 font-bold" onClick={() => setDraftSettings({ ...effSettings, types: effSettings.types.filter((_, j) => j !== i) })}>Remove</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button className={btn.ghost} onClick={() => setDraftSettings({ ...effSettings, types: [...effSettings.types, { kind: `custom_${effSettings.types.length + 1}`, label: 'New certificate', prefix: 'CERT', title: 'CERTIFICATE', bodyTemplate: 'This is to certify that {{name}} (Reg. No. {{regNo}}) …', needsPurpose: true, needsFeeLines: false, needsLeavingReason: false, enabled: true }] })}><Plus className="w-4 h-4" /> Add type</button>
            <button className={btn.primary} disabled={saveSettingsMut.isPending || !draftSettings} onClick={() => draftSettings && saveSettingsMut.mutate(draftSettings)}><Save className="w-4 h-4" /> Save settings</button>
          </div>
        </div>
      )}

      <Modal open={!!issueForm} onClose={() => setIssueForm(null)} title="Issue certificate" wide
        footer={<>
          <button className={btn.ghost} onClick={() => setIssueForm(null)}>Cancel</button>
          <button className={btn.primary} disabled={issueMut.isPending} onClick={() => issueForm && issueMut.mutate(issueForm)}><Award className="w-4 h-4" /> {issueMut.isPending ? 'Issuing…' : 'Issue & download PDF'}</button>
        </>}>
        {issueForm && (() => {
          const req = all.find(r => r.id === issueForm.reqId)
          const def = certificateType(settings, issueForm.kind)
          return (
            <div className="grid gap-4">
              <p className="text-sm">{req ? <><span className="font-semibold">{req.studentName}</span> · {req.regNo} · {req.programme}</> : ''}</p>
              <ExtrasFields def={def} form={issueForm} set={f => setIssueForm(prev => (prev ? { ...prev, ...f } : prev))} />
              <BodyPreview def={def} student={req ? { name: req.studentName, regNo: req.regNo, programme: req.programme, semester: req.semester, batch: req.batch, gender: req.gender, dateOfBirth: req.dateOfBirth, apaarId: req.apaarId } : undefined} form={issueForm} collegeName={branding.collegeName} />
            </div>
          )
        })()}
      </Modal>

      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Reject request"
        footer={<>
          <button className={btn.ghost} onClick={() => setRejectId(null)}>Back</button>
          <button className={btn.danger} disabled={decideMut.isPending} onClick={() => rejectId && decideMut.mutate({ id: rejectId, to: 'rejected', note: rejectNote })}>Reject request</button>
        </>}>
        <Field label="Reason (shown to the student)"><input className="input-field" value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="e.g. Fee dues pending — clear at Accounts first" /></Field>
      </Modal>
    </div>
  )
}
