// src/modules/admin/pages/FacultyPayroll.tsx
//
// Faculty Payroll — three tabs:
//   1. Salary structures   basic pay + per-person component overrides, bank/PAN/UAN
//   2. Monthly payroll     generate payslips → edit LOP / one-off adjustments →
//                          approve → mark paid (date + bank reference) → PDF
//   3. Salary certificates issue a numbered certificate from the college's own
//                          wording (Finance Settings → Salary certificate) + PDF
//
// Every component, rate, LOP rule, approval step, number prefix and certificate
// wording is configured per college in Finance Settings → Payroll. Salary is
// disbursed by the bank; "paid" stamps the ledger with the date and reference.

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BadgeIndianRupee, CheckCircle2, Clock, Download, FileSignature, Loader2, Pencil, Plus,
  RefreshCw, RotateCcw, Search, Settings as SettingsIcon, ShieldCheck, Trash2, Users, Wallet, X, XCircle,
} from 'lucide-react'
import { currentCollegeId, fetchCollegeFaculty, type FacultyDirectoryEntry } from '../api/facultyDirectoryApi'
import {
  deletePayslip,
  fetchPayslips,
  fetchSalaryCertificates,
  fetchSalaryStructures,
  issueSalaryCertificate,
  payslipId,
  savePayslipDraft,
  saveSalaryStructure,
  setPayslipStatus,
  type Payslip,
  type PayslipDraft,
  type SalaryCertificateRecord,
  type SalaryStructure,
} from '../api/payrollApi'
import {
  componentApplies,
  computePayslip,
  docNumber,
  formatINR,
  renderTemplate,
  type PayAdjustment,
  type PayrollSettings,
  type PayslipStatus,
} from '../utils/payrollEngine'
import {
  certificateToPdfModel,
  certificateVars,
  monthLabel,
  nextCertificateNo,
  payslipToPdfModel,
} from '../utils/payrollDocs'
import { useFinanceRules } from '../hooks/useFinanceRules'
import { downloadPayslipPdf, downloadSalaryCertificatePdf } from '../../../shared/utils/financePdf'
import { useNotification } from '../../../shared/providers/NotificationProvider'

const inr = (n: number) => `₹${formatINR(n)}`

const STATUS_META: Record<PayslipStatus | 'none', { label: string; cls: string; icon: typeof Clock }> = {
  none: { label: 'Not generated', cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400', icon: Clock },
  draft: { label: 'Draft', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: ShieldCheck },
  paid: { label: 'Paid', cls: 'bg-green-500/15 text-green-700 dark:text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle },
}

type Tab = 'structures' | 'payroll' | 'certificates'

/** Structure seeded from the faculty profile when none exists yet. */
function blankStructure(f: FacultyDirectoryEntry): Omit<SalaryStructure, 'id' | 'updatedAt'> {
  return {
    facultyProfileId: f.profileId,
    facultyUid: f.uid,
    name: f.name,
    staffCode: f.staffCode,
    department: f.department,
    designation: f.designation,
    employmentType: f.employmentType,
    joiningDate: f.joiningDate,
    gender: f.gender || undefined,
    basic: 0,
    overrides: {},
    active: true,
  }
}

function buildDraft(
  s: SalaryStructure,
  month: string,
  settings: PayrollSettings,
  lopDays = 0,
  adjustments: PayAdjustment[] = [],
): PayslipDraft {
  const c = computePayslip({ basic: s.basic, overrides: s.overrides, employmentType: s.employmentType, monthKey: month, lopDays, adjustments }, settings)
  return {
    month,
    payslipNo: docNumber(settings.payslipPrefix, month, s.facultyProfileId),
    facultyProfileId: s.facultyProfileId,
    facultyUid: s.facultyUid,
    name: s.name,
    staffCode: s.staffCode,
    department: s.department,
    designation: s.designation,
    employmentType: s.employmentType,
    joiningDate: s.joiningDate,
    pan: s.pan,
    uan: s.uan,
    bankName: s.bankName,
    accountNo: s.accountNo,
    basic: s.basic,
    lopDays: c.lopDays,
    adjustments,
    daysInPeriod: c.daysInPeriod,
    paidDays: c.paidDays,
    earnings: c.earnings,
    deductions: c.deductions,
    gross: c.gross,
    totalDeductions: c.totalDeductions,
    net: c.net,
  }
}

export default function FacultyPayroll() {
  const collegeId = currentCollegeId()
  const [tab, setTab] = useState<Tab>('structures')
  const { rules, branding, loading: rulesLoading } = useFinanceRules()
  const settings = rules.payroll

  const facultyQuery = useQuery({
    queryKey: ['payrollFaculty', collegeId],
    queryFn: () => fetchCollegeFaculty(collegeId),
    enabled: !!collegeId,
  })
  const structuresQuery = useQuery({
    queryKey: ['salaryStructures', collegeId],
    queryFn: fetchSalaryStructures,
    enabled: !!collegeId,
  })

  const structures = structuresQuery.data ?? []
  const faculty = facultyQuery.data ?? []

  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title mb-1 flex items-center gap-2"><Wallet className="w-7 h-7 text-vriddhi-accent" /> Faculty Payroll</h1>
          <p className="text-sm text-vriddhi-muted max-w-2xl">
            Salary structures, monthly payslips and salary certificates. Components, LOP rules, approvals and certificate wording
            are set in <Link to="/admin/finance-settings" className="text-vriddhi-accent hover:underline">Finance Settings</Link>.
          </p>
        </div>
        <Link to="/admin/finance-settings" className="self-start flex items-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50">
          <SettingsIcon className="w-4 h-4" /> Payroll settings
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {([
          { id: 'structures', label: 'Salary structures', icon: Users },
          { id: 'payroll', label: 'Monthly payroll', icon: BadgeIndianRupee },
          { id: 'certificates', label: 'Salary certificates', icon: FileSignature },
        ] as { id: Tab; label: string; icon: typeof Users }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${tab === t.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card text-vriddhi-muted hover:text-slate-900 dark:hover:text-white hover:bg-vriddhi-border/50'}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {(facultyQuery.isLoading || structuresQuery.isLoading || rulesLoading) ? (
        <div className="glass-card h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" /></div>
      ) : structuresQuery.isError ? (
        <div className="glass-card p-6 text-sm text-red-600 dark:text-red-400">
          Could not load payroll data. Payroll is restricted to college admins and the principal.
        </div>
      ) : (
        <>
          {tab === 'structures' && <StructuresTab faculty={faculty} structures={structures} settings={settings} />}
          {tab === 'payroll' && <PayrollTab structures={structures} settings={settings} branding={branding} />}
          {tab === 'certificates' && <CertificatesTab structures={structures} settings={settings} branding={branding} />}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Tab 1 — Salary structures
// ═══════════════════════════════════════════════════════════
function StructuresTab({ faculty, structures, settings }: { faculty: FacultyDirectoryEntry[]; structures: SalaryStructure[]; settings: PayrollSettings }) {
  const [search, setSearch] = useState('')
  const [showGuests, setShowGuests] = useState(false)
  const [editing, setEditing] = useState<Omit<SalaryStructure, 'id' | 'updatedAt'> | null>(null)
  const month = new Date().toISOString().slice(0, 7)

  const byProfile = useMemo(() => new Map(structures.map(s => [s.facultyProfileId, s])), [structures])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = faculty
      .filter(f => showGuests || f.employmentType === 'FULL_TIME' || byProfile.has(f.profileId))
      .filter(f => !q || `${f.name} ${f.staffCode} ${f.department} ${f.designation}`.toLowerCase().includes(q))
    return list.map(f => ({ f, s: byProfile.get(f.profileId) }))
  }, [faculty, byProfile, search, showGuests])

  const configured = rows.filter(r => r.s && r.s.basic > 0).length
  const monthlyCost = rows.reduce((sum, r) => {
    if (!r.s || !r.s.active || r.s.basic <= 0) return sum
    return sum + computePayslip({ basic: r.s.basic, overrides: r.s.overrides, employmentType: r.s.employmentType, monthKey: month }, settings).gross
  }, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat label="Faculty listed" value={rows.length} icon={Users} />
        <Stat label="Salary structure set" value={`${configured} / ${rows.length}`} icon={CheckCircle2} />
        <Stat label="Monthly gross (active)" value={inr(monthlyCost)} icon={BadgeIndianRupee} />
      </div>

      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-vriddhi-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search faculty…" className="bg-transparent text-sm text-vriddhi-text focus:outline-none w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm text-vriddhi-muted">
          <input type="checkbox" checked={showGuests} onChange={e => setShowGuests(e.target.checked)} />
          Include guest / part-time faculty (normally billed via Guest Faculty Billing)
        </label>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-vriddhi-border">
                <th className="table-header">Faculty</th>
                <th className="table-header">Designation</th>
                <th className="table-header text-right">Basic</th>
                <th className="table-header text-right">Gross / month</th>
                <th className="table-header text-right">Net / month</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ f, s }) => {
                const c = s && s.basic > 0 ? computePayslip({ basic: s.basic, overrides: s.overrides, employmentType: s.employmentType, monthKey: month }, settings) : null
                return (
                  <tr key={f.profileId} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-dark/20">
                    <td className="table-cell">
                      <p className="font-medium text-slate-900 dark:text-white">{f.name}</p>
                      <p className="text-xs text-vriddhi-muted">{f.staffCode || '—'} · {f.department || '—'} · {f.employmentType.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="table-cell text-vriddhi-muted">{s?.designation || f.designation || '—'}</td>
                    <td className="table-cell text-right">{s ? inr(s.basic) : '—'}</td>
                    <td className="table-cell text-right">{c ? inr(c.gross) : '—'}</td>
                    <td className="table-cell text-right font-semibold text-slate-900 dark:text-white">{c ? inr(c.net) : '—'}</td>
                    <td className="table-cell text-center">
                      {!s ? <span className="text-xs px-2 py-1 rounded-full bg-slate-500/10 text-slate-500">Not set</span>
                        : !s.active ? <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600">Inactive</span>
                          : <span className="text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">Active</span>}
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => setEditing(s ? { ...s } : blankStructure(f))}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25"
                      >
                        {s ? <><Pencil className="w-3.5 h-3.5" /> Edit</> : <><Plus className="w-3.5 h-3.5" /> Set salary</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-sm text-vriddhi-muted">No faculty match.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <StructureEditor initial={editing} settings={settings} onClose={() => setEditing(null)} />}
    </div>
  )
}

function StructureEditor({ initial, settings, onClose }: { initial: Omit<SalaryStructure, 'id' | 'updatedAt'>; settings: PayrollSettings; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { showSuccess } = useNotification()
  const [s, setS] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (p: Partial<typeof s>) => setS(x => ({ ...x, ...p }))
  const month = new Date().toISOString().slice(0, 7)
  const preview = computePayslip({ basic: s.basic, overrides: s.overrides, employmentType: s.employmentType, monthKey: month }, settings)
  const applicable = settings.components.filter(c => componentApplies(c, s.employmentType))

  const save = async () => {
    if (!(s.basic > 0)) { setError('Enter the basic pay.'); return }
    setSaving(true)
    setError(null)
    try {
      await saveSalaryStructure(s)
      await queryClient.invalidateQueries({ queryKey: ['salaryStructures'] })
      showSuccess(`Salary structure saved for ${s.name}.`)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Salary structure · ${s.name}`} subtitle={`${s.staffCode || '—'} · ${s.department || '—'}`} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 disabled:opacity-50">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save structure</button>
      </>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <L label="Basic pay (₹ / month)"><input type="number" className="input-field" value={s.basic || ''} onChange={e => set({ basic: Number(e.target.value) || 0 })} /></L>
            <L label="Effective from"><input type="month" className="input-field" value={s.effectiveFrom ?? ''} onChange={e => set({ effectiveFrom: e.target.value || undefined })} /></L>
            <L label="Designation"><input className="input-field" value={s.designation} onChange={e => set({ designation: e.target.value })} /></L>
            <L label="Date of joining"><input className="input-field" value={s.joiningDate} onChange={e => set({ joiningDate: e.target.value })} placeholder="YYYY-MM-DD" /></L>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Components</p>
            {applicable.length === 0 && <p className="text-xs text-vriddhi-muted">No active components. Add them in Finance Settings → Payroll.</p>}
            {applicable.map(c => {
              const custom = Object.prototype.hasOwnProperty.call(s.overrides, c.id)
              return (
                <div key={c.id} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${c.kind === 'earning' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="flex-1 min-w-0 truncate">{c.name} <span className="text-[11px] text-vriddhi-muted">({c.calc === 'fixed' ? `₹${c.value}` : c.calc === 'slab_on_gross' ? 'slab' : `${c.value}%`})</span></span>
                  <label className="flex items-center gap-1 text-[11px] text-vriddhi-muted">
                    <input type="checkbox" checked={custom} onChange={e => {
                      const next = { ...s.overrides }
                      if (e.target.checked) next[c.id] = 0
                      else delete next[c.id]
                      set({ overrides: next })
                    }} /> custom ₹
                  </label>
                  <input
                    type="number"
                    disabled={!custom}
                    value={custom ? s.overrides[c.id] : ''}
                    placeholder="default"
                    onChange={e => set({ overrides: { ...s.overrides, [c.id]: Number(e.target.value) || 0 } })}
                    className="input-field !w-28 !py-1.5 disabled:opacity-40"
                  />
                </div>
              )
            })}
            <p className="text-[11px] text-vriddhi-muted">Tick “custom” to replace the college default with a fixed monthly amount for this person (0 = not applicable).</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <L label="PAN"><input className="input-field font-mono" value={s.pan ?? ''} onChange={e => set({ pan: e.target.value.toUpperCase() || undefined })} /></L>
            <L label="UAN / PF no."><input className="input-field font-mono" value={s.uan ?? ''} onChange={e => set({ uan: e.target.value || undefined })} /></L>
            <L label="Bank name"><input className="input-field" value={s.bankName ?? ''} onChange={e => set({ bankName: e.target.value || undefined })} /></L>
            <L label="IFSC"><input className="input-field font-mono" value={s.ifsc ?? ''} onChange={e => set({ ifsc: e.target.value.toUpperCase() || undefined })} /></L>
            <L label="Account number" className="col-span-2"><input className="input-field font-mono" value={s.accountNo ?? ''} onChange={e => set({ accountNo: e.target.value || undefined })} /></L>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.active} onChange={e => set({ active: e.target.checked })} /> Include in monthly payroll</label>
          <L label="Notes"><textarea rows={2} className="input-field" value={s.notes ?? ''} onChange={e => set({ notes: e.target.value || undefined })} /></L>
        </div>

        <PayslipPreview earnings={preview.earnings} deductions={preview.deductions} gross={preview.gross} totalDeductions={preview.totalDeductions} net={preview.net} caption={`${monthLabel(month)} · full month`} />
      </div>
      {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>}
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════
// Tab 2 — Monthly payroll
// ═══════════════════════════════════════════════════════════
function PayrollTab({ structures, settings, branding }: { structures: SalaryStructure[]; settings: PayrollSettings; branding: ReturnType<typeof useFinanceRules>['branding'] }) {
  const collegeId = currentCollegeId()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ s: SalaryStructure; p?: Payslip } | null>(null)
  const [paying, setPaying] = useState<Payslip[] | null>(null)

  const payslipsQuery = useQuery({
    queryKey: ['payslips', collegeId, month],
    queryFn: () => fetchPayslips(month),
    enabled: !!collegeId,
  })
  const payslips = payslipsQuery.data ?? []
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['payslips', collegeId, month] })

  const active = structures.filter(s => s.active && s.basic > 0)
  const byId = new Map(payslips.map(p => [p.id, p]))
  const rows = (() => {
    const out: { s?: SalaryStructure; p?: Payslip; key: string }[] = active.map(s => ({ s, p: byId.get(payslipId(month, s.facultyProfileId)), key: s.facultyProfileId }))
    for (const p of payslips) if (!active.some(s => s.facultyProfileId === p.facultyProfileId)) out.push({ p, s: structures.find(s => s.facultyProfileId === p.facultyProfileId), key: p.id })
    return out.sort((a, b) => (a.s?.name || a.p?.name || '').localeCompare(b.s?.name || b.p?.name || ''))
  })()

  const live = payslips.filter(p => p.status !== 'cancelled')
  const totals = {
    gross: live.reduce((s, p) => s + p.gross, 0),
    deductions: live.reduce((s, p) => s + p.totalDeductions, 0),
    net: live.reduce((s, p) => s + p.net, 0),
    paid: payslips.filter(p => p.status === 'paid').reduce((s, p) => s + p.net, 0),
    missing: rows.filter(r => r.s && !r.p).length,
    drafts: payslips.filter(p => p.status === 'draft'),
    approved: payslips.filter(p => p.status === 'approved'),
  }

  const run = async (key: string, fn: () => Promise<void>, ok?: string) => {
    setBusy(key)
    try { await fn(); if (ok) showSuccess(ok); await refresh() }
    catch (err) { showError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(null) }
  }

  const generate = () => run('gen', async () => {
    const todo = rows.filter(r => r.s && !r.p).map(r => r.s!)
    if (!todo.length) throw new Error('Every active faculty member already has a payslip for this month.')
    for (const s of todo) await savePayslipDraft(buildDraft(s, month, settings), 'Generated')
    showSuccess(`${todo.length} payslip${todo.length === 1 ? '' : 's'} generated.`)
  })

  const recalcDrafts = () => run('recalc', async () => {
    let n = 0
    for (const p of totals.drafts) {
      const s = structures.find(x => x.facultyProfileId === p.facultyProfileId)
      if (!s) continue
      await savePayslipDraft(buildDraft(s, month, settings, p.lopDays, p.adjustments), 'Recalculated')
      n++
    }
    showSuccess(`${n} draft payslip${n === 1 ? '' : 's'} recalculated with current settings.`)
  })

  const approveAll = () => run('approveAll', async () => {
    for (const p of totals.drafts) await setPayslipStatus(p.id, 'approved', { requireApproval: settings.requireApproval })
    showSuccess(`${totals.drafts.length} payslip${totals.drafts.length === 1 ? '' : 's'} approved.`)
  })

  const status = (p: Payslip, to: PayslipStatus, msg: string) =>
    run(`${p.id}:${to}`, () => setPayslipStatus(p.id, to, { requireApproval: settings.requireApproval }), msg)

  const pdf = async (p: Payslip) => {
    try { await downloadPayslipPdf(payslipToPdfModel(p, branding, settings.payslipFooter)) }
    catch { showError('Could not generate the payslip PDF.') }
  }

  const exportRegister = () => {
    const componentLabels = Array.from(new Set(live.flatMap(p => [...p.earnings, ...p.deductions].map(l => l.label))))
    const q = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const header = ['Payslip No', 'Name', 'Staff Code', 'Department', 'Designation', 'Days', 'LOP', ...componentLabels, 'Gross', 'Deductions', 'Net', 'Status', 'Paid on', 'Reference', 'Bank', 'Account', 'IFSC']
    const lines = live.map(p => {
      const amt = (label: string) => [...p.earnings, ...p.deductions].find(l => l.label === label)?.amount ?? ''
      const s = structures.find(x => x.facultyProfileId === p.facultyProfileId)
      return [p.payslipNo, q(p.name), p.staffCode, q(p.department), q(p.designation), p.paidDays, p.lopDays, ...componentLabels.map(amt), p.gross, p.totalDeductions, p.net, p.status, p.paidOn || '', q(p.paymentRef || ''), q(p.bankName || ''), q(p.accountNo || ''), s?.ifsc || ''].join(',')
    })
    const csv = [`Salary register — ${monthLabel(month)}`, header.map(q).join(','), ...lines, `,,,,,,,${componentLabels.map(() => '').join(',')},${totals.gross},${totals.deductions},${totals.net}`].join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `salary-register-${month}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field !w-auto" />
          <button onClick={refresh} className="p-2.5 rounded-xl border border-vriddhi-border text-vriddhi-muted hover:bg-vriddhi-border/40"><RefreshCw className={`w-4 h-4 ${payslipsQuery.isFetching ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {totals.drafts.length > 0 && (
            <button onClick={recalcDrafts} disabled={busy === 'recalc'} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-vriddhi-border text-vriddhi-muted hover:bg-vriddhi-border/40 disabled:opacity-50">
              {busy === 'recalc' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Recalculate drafts
            </button>
          )}
          {settings.requireApproval && totals.drafts.length > 0 && (
            <button onClick={approveAll} disabled={busy === 'approveAll'} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/15 text-blue-700 dark:text-blue-400 disabled:opacity-50">
              <ShieldCheck className="w-3.5 h-3.5" /> Approve all ({totals.drafts.length})
            </button>
          )}
          {(settings.requireApproval ? totals.approved : [...totals.drafts, ...totals.approved]).length > 0 && (
            <button onClick={() => setPaying(settings.requireApproval ? totals.approved : [...totals.drafts, ...totals.approved])} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-green-500/15 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Mark all paid
            </button>
          )}
          <button onClick={exportRegister} disabled={live.length === 0} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-vriddhi-border text-vriddhi-muted hover:bg-vriddhi-border/40 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Salary register (CSV)
          </button>
          <button onClick={generate} disabled={busy === 'gen' || totals.missing === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 disabled:opacity-50">
            {busy === 'gen' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Generate payslips{totals.missing ? ` (${totals.missing})` : ''}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={`Gross · ${monthLabel(month)}`} value={inr(totals.gross)} icon={BadgeIndianRupee} />
        <Stat label="Deductions" value={inr(totals.deductions)} icon={XCircle} />
        <Stat label="Net payable" value={inr(totals.net)} icon={Wallet} />
        <Stat label="Marked paid" value={inr(totals.paid)} icon={CheckCircle2} />
      </div>

      {active.length === 0 && payslips.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-vriddhi-muted">No active salary structures yet. Set basic pay for faculty in the <b>Salary structures</b> tab.</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vriddhi-border">
                  <th className="table-header">Faculty</th>
                  <th className="table-header text-center">Paid days</th>
                  <th className="table-header text-right">Gross</th>
                  <th className="table-header text-right">Deductions</th>
                  <th className="table-header text-right">Net</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ s, p, key }) => {
                  const meta = STATUS_META[p ? p.status : 'none']
                  const preview = !p && s ? computePayslip({ basic: s.basic, overrides: s.overrides, employmentType: s.employmentType, monthKey: month }, settings) : null
                  return (
                    <tr key={key} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-dark/20">
                      <td className="table-cell">
                        <p className="font-medium text-slate-900 dark:text-white">{p?.name || s?.name}</p>
                        <p className="text-xs text-vriddhi-muted">{(p?.staffCode || s?.staffCode) || '—'} · {(p?.designation || s?.designation) || '—'}</p>
                        {p?.payslipNo && <p className="text-[11px] font-mono text-vriddhi-muted/80">{p.payslipNo}</p>}
                      </td>
                      <td className="table-cell text-center">{p ? `${p.paidDays}/${p.daysInPeriod}` : preview ? `${preview.paidDays}/${preview.daysInPeriod}` : '—'}{p && p.lopDays > 0 && <span className="block text-[11px] text-amber-600">LOP {p.lopDays}</span>}</td>
                      <td className="table-cell text-right">{inr(p ? p.gross : preview?.gross ?? 0)}</td>
                      <td className="table-cell text-right text-red-600 dark:text-red-400">{inr(p ? p.totalDeductions : preview?.totalDeductions ?? 0)}</td>
                      <td className="table-cell text-right font-bold text-slate-900 dark:text-white">{inr(p ? p.net : preview?.net ?? 0)}</td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}><meta.icon className="w-3 h-3" /> {meta.label}</span>
                        {p?.status === 'paid' && p.paidOn && <span className="block text-[10px] text-vriddhi-muted mt-0.5">{p.paidOn}{p.paymentRef ? ` · ${p.paymentRef}` : ''}</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {!p && s && <Btn icon={Plus} label="Create" tone="accent" onClick={() => setEditing({ s })} />}
                          {p?.status === 'draft' && s && <Btn icon={Pencil} label="Edit" onClick={() => setEditing({ s, p })} />}
                          {p?.status === 'draft' && (settings.requireApproval
                            ? <Btn icon={ShieldCheck} label="Approve" tone="blue" busy={busy === `${p.id}:approved`} onClick={() => status(p, 'approved', 'Payslip approved.')} />
                            : <Btn icon={CheckCircle2} label="Paid" tone="green" onClick={() => setPaying([p])} />)}
                          {p?.status === 'approved' && <>
                            <Btn icon={CheckCircle2} label="Paid" tone="green" onClick={() => setPaying([p])} />
                            <Btn icon={RotateCcw} label="" title="Revert to draft" onClick={() => status(p, 'draft', 'Reverted to draft.')} />
                          </>}
                          {p && (p.status === 'draft' || p.status === 'approved') && <Btn icon={X} label="" tone="red" title="Cancel" onClick={() => status(p, 'cancelled', 'Payslip cancelled.')} />}
                          {p?.status === 'cancelled' && <>
                            <Btn icon={RotateCcw} label="Restore" onClick={() => status(p, 'draft', 'Restored as draft.')} />
                            <Btn icon={Trash2} label="" tone="red" title="Delete" onClick={() => run(`${p.id}:del`, () => deletePayslip(p), 'Payslip deleted.')} />
                          </>}
                          {p && p.status !== 'cancelled' && <Btn icon={Download} label="PDF" tone="accent" onClick={() => pdf(p)} />}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <PayslipEditor
          structure={editing.s}
          payslip={editing.p}
          month={month}
          settings={settings}
          onClose={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await refresh() }}
        />
      )}
      {paying && (
        <MarkPaidModal
          payslips={paying}
          onClose={() => setPaying(null)}
          onConfirm={async (paidOn, ref) => {
            for (const p of paying) {
              if (p.status === 'draft' && settings.requireApproval) continue
              await setPayslipStatus(p.id, 'paid', { requireApproval: settings.requireApproval, paidOn, paymentRef: ref })
            }
            showSuccess(`${paying.length} payslip${paying.length === 1 ? '' : 's'} marked paid.`)
            setPaying(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

function PayslipEditor({ structure, payslip, month, settings, onClose, onSaved }: {
  structure: SalaryStructure; payslip?: Payslip; month: string; settings: PayrollSettings; onClose: () => void; onSaved: () => Promise<void>
}) {
  const { showSuccess } = useNotification()
  const [lop, setLop] = useState(payslip?.lopDays ?? 0)
  const [adjustments, setAdjustments] = useState<PayAdjustment[]>(payslip?.adjustments ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draft = buildDraft(structure, month, settings, lop, adjustments.filter(a => a.amount > 0))

  const save = async () => {
    setSaving(true); setError(null)
    try {
      await savePayslipDraft(payslip ? { ...draft, payslipNo: payslip.payslipNo || draft.payslipNo } : draft, payslip ? 'Edited' : 'Created')
      showSuccess(`Payslip saved for ${structure.name}.`)
      await onSaved()
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save.') }
    finally { setSaving(false) }
  }

  return (
    <Modal title={`Payslip · ${structure.name}`} subtitle={monthLabel(month)} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 disabled:opacity-50">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Save draft</button>
      </>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <L label={`Loss-of-pay days (of ${draft.daysInPeriod})`}><input type="number" min={0} className="input-field" value={lop} onChange={e => setLop(Math.max(0, Number(e.target.value) || 0))} /></L>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">One-off adjustments</p>
              <button onClick={() => setAdjustments(a => [...a, { label: '', amount: 0, kind: 'earning' }])} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-vriddhi-accent/15 text-vriddhi-accent"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            {adjustments.length === 0 && <p className="text-xs text-vriddhi-muted">Arrears, bonus, overtime (earnings) · advance / loan recovery (deductions).</p>}
            {adjustments.map((a, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <select value={a.kind} onChange={e => setAdjustments(l => l.map((x, j) => j === i ? { ...x, kind: e.target.value as PayAdjustment['kind'] } : x))} className="input-field col-span-3 !px-2">
                  <option value="earning">+ Earn</option><option value="deduction">− Deduct</option>
                </select>
                <input placeholder="Label" value={a.label} onChange={e => setAdjustments(l => l.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="input-field col-span-5" />
                <input type="number" value={a.amount || ''} onChange={e => setAdjustments(l => l.map((x, j) => j === i ? { ...x, amount: Math.max(0, Number(e.target.value) || 0) } : x))} className="input-field col-span-3" />
                <button onClick={() => setAdjustments(l => l.filter((_, j) => j !== i))} className="col-span-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-vriddhi-muted">Basic ₹{formatINR(structure.basic)} and components come from the salary structure and Finance Settings.</p>
        </div>
        <PayslipPreview earnings={draft.earnings} deductions={draft.deductions} gross={draft.gross} totalDeductions={draft.totalDeductions} net={draft.net} caption={`${draft.paidDays}/${draft.daysInPeriod} paid days`} />
      </div>
      {error && <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>}
    </Modal>
  )
}

function MarkPaidModal({ payslips, onClose, onConfirm }: { payslips: Payslip[]; onClose: () => void; onConfirm: (paidOn: string, ref: string) => Promise<void> }) {
  const [on, setOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const total = payslips.reduce((s, p) => s + p.net, 0)
  return (
    <Modal title={payslips.length === 1 ? `Mark paid · ${payslips[0].name}` : `Mark ${payslips.length} payslips paid`} subtitle={`Net ${inr(total)} — record the bank transfer made outside the app.`} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border">Cancel</button>
        <button onClick={async () => { setSaving(true); setError(null); try { await onConfirm(on, ref.trim()) } catch (err) { setError(err instanceof Error ? err.message : 'Could not update.') } finally { setSaving(false) } }} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">{saving && <Loader2 className="w-4 h-4 animate-spin" />} Mark paid</button>
      </>}
    >
      <div className="space-y-3">
        <L label="Paid on"><input type="date" className="input-field" value={on} onChange={e => setOn(e.target.value)} /></L>
        <L label="Bank batch / UTR / cheque reference"><input className="input-field font-mono" value={ref} onChange={e => setRef(e.target.value)} /></L>
        <p className="text-[11px] text-vriddhi-muted">Paid payslips are locked and visible to faculty in My Salary.</p>
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>}
      </div>
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════
// Tab 3 — Salary certificates
// ═══════════════════════════════════════════════════════════
function CertificatesTab({ structures, settings, branding }: { structures: SalaryStructure[]; settings: PayrollSettings; branding: ReturnType<typeof useFinanceRules>['branding'] }) {
  const collegeId = currentCollegeId()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const cert = settings.certificate
  const certsQuery = useQuery({ queryKey: ['salaryCertificates', collegeId], queryFn: fetchSalaryCertificates, enabled: !!collegeId })
  const certs = certsQuery.data ?? []

  const eligible = structures.filter(s => s.basic > 0).sort((a, b) => a.name.localeCompare(b.name))
  const [profileId, setProfileId] = useState('')
  const [purpose, setPurpose] = useState(cert.defaultPurpose)
  const [basis, setBasis] = useState<'structure' | string>('structure')
  const [issuedOn, setIssuedOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [includeBreakdown, setIncludeBreakdown] = useState(cert.includeBreakdown)
  const [issuing, setIssuing] = useState(false)
  const [search, setSearch] = useState('')

  const structure = eligible.find(s => s.facultyProfileId === profileId)
  const payslipsQuery = useQuery({
    queryKey: ['payslipsForCert', collegeId, profileId],
    queryFn: async () => {
      // Pull the last 12 months of this person's payslips (paid/approved) for "based on" selection.
      const months: string[] = []
      const d = new Date()
      for (let i = 0; i < 12; i++) { months.push(new Date(d.getFullYear(), d.getMonth() - i, 1).toISOString().slice(0, 7)) }
      const all = await Promise.all(months.map(m => fetchPayslips(m).catch(() => [] as Payslip[])))
      return all.flat().filter(p => p.facultyProfileId === profileId && (p.status === 'paid' || p.status === 'approved'))
    },
    enabled: !!profileId,
  })
  const basisPayslip = basis !== 'structure' ? (payslipsQuery.data ?? []).find(p => p.id === basis) : undefined
  const month = new Date().toISOString().slice(0, 7)
  const pay = structure
    ? basisPayslip
      ? { earnings: basisPayslip.earnings, deductions: basisPayslip.deductions, gross: basisPayslip.gross, net: basisPayslip.net, totalDeductions: basisPayslip.totalDeductions }
      : computePayslip({ basic: structure.basic, overrides: structure.overrides, employmentType: structure.employmentType, monthKey: month }, settings)
    : null
  const certificateNo = nextCertificateNo(cert.certificatePrefix, certs)
  const dateText = new Date(issuedOn).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  const body = structure && pay
    ? renderTemplate(cert.bodyTemplate, certificateVars({
        structure, pay, branding, purpose: purpose || cert.defaultPurpose, certificateNo, date: dateText,
        salaryMonth: basisPayslip ? monthLabel(basisPayslip.month) : 'the current month',
      }))
    : ''

  const issue = async () => {
    if (!structure || !pay) return
    setIssuing(true)
    try {
      const rec = await issueSalaryCertificate({
        certificateNo,
        facultyProfileId: structure.facultyProfileId,
        facultyUid: structure.facultyUid,
        name: structure.name,
        purpose: purpose || cert.defaultPurpose,
        issuedOn: dateText,
        title: cert.title,
        body,
        breakdown: includeBreakdown
          ? { earnings: pay.earnings, deductions: pay.deductions, gross: pay.gross, net: pay.net, monthLabel: basisPayslip ? monthLabel(basisPayslip.month) : undefined }
          : null,
        signatoryName: cert.signatoryName || branding.signatoryName || undefined,
        signatoryDesignation: cert.signatoryDesignation || undefined,
      })
      await downloadSalaryCertificatePdf(certificateToPdfModel(rec, branding, cert))
      await queryClient.invalidateQueries({ queryKey: ['salaryCertificates', collegeId] })
      showSuccess(`Certificate ${rec.certificateNo} issued.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not issue the certificate.')
    } finally {
      setIssuing(false)
    }
  }

  const redownload = async (rec: SalaryCertificateRecord) => {
    try { await downloadSalaryCertificatePdf(certificateToPdfModel(rec, branding, cert)) }
    catch { showError('Could not generate the PDF.') }
  }

  const history = certs.filter(c => !search || `${c.name} ${c.certificateNo} ${c.purpose}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="glass-card p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2"><FileSignature className="w-5 h-5 text-vriddhi-accent" /> Issue a salary certificate</h2>
        {eligible.length === 0 ? (
          <p className="text-sm text-vriddhi-muted">Set salary structures first — the certificate is computed from them.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <L label="Faculty">
                <select className="input-field" value={profileId} onChange={e => { setProfileId(e.target.value); setBasis('structure') }}>
                  <option value="">Select…</option>
                  {eligible.map(s => <option key={s.facultyProfileId} value={s.facultyProfileId}>{s.name}{s.staffCode ? ` (${s.staffCode})` : ''}</option>)}
                </select>
              </L>
              <L label="Purpose"><input className="input-field" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="bank loan, visa, rental…" /></L>
              <L label="Salary figures based on">
                <select className="input-field" value={basis} onChange={e => setBasis(e.target.value)} disabled={!profileId}>
                  <option value="structure">Current salary structure</option>
                  {(payslipsQuery.data ?? []).sort((a, b) => b.month.localeCompare(a.month)).map(p => <option key={p.id} value={p.id}>Payslip · {monthLabel(p.month)}</option>)}
                </select>
              </L>
              <L label="Date of issue"><input type="date" className="input-field" value={issuedOn} onChange={e => setIssuedOn(e.target.value)} /></L>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeBreakdown} onChange={e => setIncludeBreakdown(e.target.checked)} /> Include earnings / deductions table</label>

            {structure && pay ? (
              <div className="rounded-xl border border-vriddhi-border bg-white dark:bg-slate-950 p-5 text-sm text-slate-800 dark:text-slate-200">
                <p className="text-center font-bold">{branding.collegeName || 'College'}</p>
                {branding.address && <p className="text-center text-[11px] text-slate-500">{branding.address}</p>}
                <div className="h-0.5 bg-teal-500 my-3" />
                <p className="text-center font-bold tracking-wide">{cert.title}</p>
                <div className="flex justify-between text-[11px] text-slate-500 my-3"><span>Ref: {certificateNo}</span><span>Date: {dateText}</span></div>
                {body.split(/\n\s*\n/).map((para, i) => <p key={i} className="mb-3 text-justify leading-relaxed">{para}</p>)}
                {includeBreakdown && (
                  <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-2 max-w-sm">
                    {pay.earnings.map((l, i) => <div key={i} className="flex justify-between"><span>{l.label}</span><span>Rs. {formatINR(l.amount)}</span></div>)}
                    <div className="flex justify-between font-semibold"><span>Gross salary</span><span>Rs. {formatINR(pay.gross)}</span></div>
                    {pay.deductions.map((l, i) => <div key={i} className="flex justify-between"><span>Less: {l.label}</span><span>Rs. {formatINR(l.amount)}</span></div>)}
                    <div className="flex justify-between font-semibold"><span>Net salary</span><span>Rs. {formatINR(pay.net)}</span></div>
                  </div>
                )}
                <div className="text-right mt-6"><p className="font-semibold">{cert.signatoryName || branding.signatoryName || 'Authorised Signatory'}</p><p className="text-[11px] text-slate-500">{cert.signatoryDesignation}</p></div>
              </div>
            ) : (
              <p className="text-sm text-vriddhi-muted">Choose a faculty member to preview.</p>
            )}

            <div className="flex items-center justify-between gap-3">
              <Link to="/admin/finance-settings" className="text-xs text-vriddhi-accent hover:underline">Edit wording & signatory →</Link>
              <button onClick={issue} disabled={!structure || issuing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 disabled:opacity-50">
                {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Issue &amp; download PDF
              </button>
            </div>
          </>
        )}
      </div>

      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Issued certificates</h2>
          <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-vriddhi-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="bg-transparent text-sm focus:outline-none w-32" />
          </div>
        </div>
        {certsQuery.isLoading ? <Loader2 className="w-5 h-5 animate-spin text-vriddhi-muted" /> : history.length === 0 ? (
          <p className="text-sm text-vriddhi-muted">None issued yet.</p>
        ) : (
          <div className="divide-y divide-vriddhi-border">
            {history.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-vriddhi-muted truncate"><span className="font-mono">{c.certificateNo}</span> · {c.issuedOn} · {c.purpose}</p>
                </div>
                <Btn icon={Download} label="PDF" tone="accent" onClick={() => redownload(c)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Shared bits
// ═══════════════════════════════════════════════════════════
function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-vriddhi-accent/10 flex items-center justify-center"><Icon className="w-5 h-5 text-vriddhi-accent" /></div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{value}</p>
        <p className="text-xs text-vriddhi-muted truncate">{label}</p>
      </div>
    </div>
  )
}

function L({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs text-vriddhi-muted ${className}`}><span className="block mb-1">{label}</span>{children}</label>
}

const BTN_TONES: Record<string, string> = {
  default: 'bg-vriddhi-border/40 text-vriddhi-muted hover:text-slate-900 dark:hover:text-white',
  accent: 'bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25',
  green: 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
}

function Btn({ icon: Icon, label, onClick, tone = 'default', busy, title }: { icon: typeof Users; label: string; onClick: () => void; tone?: string; busy?: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={busy} title={title || label} className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${BTN_TONES[tone]}`}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}{label}
    </button>
  )
}

function Modal({ title, subtitle, onClose, children, footer, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`glass-card w-full ${wide ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 z-10 bg-vriddhi-card flex items-center justify-between p-5 border-b border-vriddhi-border">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="text-xs text-vriddhi-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-vriddhi-muted" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 border-t border-vriddhi-border flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}

function PayslipPreview({ earnings, deductions, gross, totalDeductions, net, caption }: {
  earnings: { label: string; amount: number }[]; deductions: { label: string; amount: number }[]; gross: number; totalDeductions: number; net: number; caption: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-vriddhi-muted">Preview · {caption}</p>
      <div className="rounded-xl border border-vriddhi-border overflow-hidden text-sm">
        <p className="px-3 py-2 bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium">Earnings</p>
        {earnings.map((l, i) => <div key={i} className="flex justify-between px-3 py-1.5 border-t border-vriddhi-border/60"><span>{l.label}</span><span>{inr(l.amount)}</span></div>)}
        <div className="flex justify-between px-3 py-2 border-t border-vriddhi-border font-semibold"><span>Gross</span><span>{inr(gross)}</span></div>
        <p className="px-3 py-2 bg-red-500/10 text-red-700 dark:text-red-400 text-xs font-medium">Deductions</p>
        {deductions.length === 0 && <p className="px-3 py-1.5 text-vriddhi-muted">None</p>}
        {deductions.map((l, i) => <div key={i} className="flex justify-between px-3 py-1.5 border-t border-vriddhi-border/60"><span>{l.label}</span><span>{inr(l.amount)}</span></div>)}
        <div className="flex justify-between px-3 py-2 border-t border-vriddhi-border font-semibold"><span>Total deductions</span><span>{inr(totalDeductions)}</span></div>
      </div>
      <div className="flex justify-between items-center p-3 rounded-xl bg-vriddhi-accent text-white"><span className="font-medium">Net pay</span><span className="text-lg font-bold">{inr(net)}</span></div>
    </div>
  )
}
