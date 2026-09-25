// Library fines — one ledger shared by the library desk (Operations) and the
// accounts team. The desk assesses fines on return, collects at the counter
// (library receipt) or posts a student's fine to their fee account. Accounts
// sees the same list, reconciles fines paid through the fee account and is
// the only office that can waive.

import { useMemo, useState } from 'react'
import { Ban, Download, IndianRupee, Plus, Receipt, RefreshCw, Send } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { roleHasPermission } from '@/modules/auth/permissions'
import {
  addManualFine,
  collectFineAtDesk,
  findMembers,
  postFineToFeeAccount,
  syncPostedFines,
  waiveFine,
  type FineReason,
  type FineStatus,
  type LibraryFine,
  type LibraryMember,
} from '../../api/libraryApi'
import type { LibrarySettings } from '../../utils/libraryEngine'
import { todayIso } from '../../api/officeDb'
import { useBranding, useLibraryFines, useLibraryMembers, useLibraryRefresh } from '../../hooks/useLibrary'
import { downloadReceiptPdf } from '@/shared/utils/financePdf'

const STATUS: Record<FineStatus, { label: string; tone: 'amber' | 'blue' | 'green' | 'slate' | 'purple' }> = {
  pending: { label: 'Unpaid', tone: 'amber' },
  posted: { label: 'On fee account', tone: 'blue' },
  collected: { label: 'Paid at desk', tone: 'green' },
  paid: { label: 'Paid via fees', tone: 'green' },
  waived: { label: 'Waived', tone: 'slate' },
}
const REASON: Record<FineReason, string> = { overdue: 'Overdue', lost: 'Lost book', damaged: 'Damaged', other: 'Other' }
const MODES = ['cash', 'upi', 'card', 'netbanking', 'cheque']

export default function FinesTab({ settings }: { settings: LibrarySettings }) {
  const { showSuccess, showError, showInfo } = useNotification()
  const { user } = useAuth()
  const branding = useBranding()
  const canWaive = roleHasPermission(user?.role, 'fines.waive')
  const isFinance = canWaive
  const finesQ = useLibraryFines('all')
  const refresh = useLibraryRefresh()
  const [filter, setFilter] = useState<FineStatus | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [collecting, setCollecting] = useState<LibraryFine | null>(null)
  const [waiving, setWaiving] = useState<LibraryFine | null>(null)
  const [adding, setAdding] = useState(false)

  const fines = finesQ.data || []
  const totals = useMemo(() => {
    const sum = (s: FineStatus[]) => fines.filter(f => s.includes(f.status)).reduce((a, f) => a + f.amount, 0)
    const month = todayIso().slice(0, 7)
    return {
      outstanding: sum(['pending', 'posted']),
      desk: sum(['collected']),
      viaFees: sum(['paid']),
      waived: sum(['waived']),
      thisMonth: fines.filter(f => ['collected', 'paid'].includes(f.status) && (f.collectedAt || '').startsWith(month)).reduce((a, f) => a + f.amount, 0),
    }
  }, [fines])
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: fines.length }
    fines.forEach(f => (c[f.status] = (c[f.status] || 0) + 1))
    return c
  }, [fines])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return fines.filter(f => (filter === 'all' || f.status === filter) && (!q || `${f.memberName} ${f.memberCode} ${f.titleName} ${f.accessionNo} ${f.receiptNo}`.toLowerCase().includes(q)))
  }, [fines, filter, search])

  const canPost = (f: LibraryFine) => f.status === 'pending' && f.memberType === 'student' && !!f.studentId && settings.fineHandling !== 'desk'
  const canCollect = (f: LibraryFine) => f.status === 'pending' && (settings.fineHandling !== 'fee_account' || f.memberType !== 'student')

  async function post(f: LibraryFine) {
    setBusy(f.id)
    try {
      await postFineToFeeAccount(f)
      showSuccess(`${inr(f.amount)} added to ${f.memberName}’s fee account — it now shows in their Fee Portal.`)
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  async function postAll() {
    const list = rows.filter(canPost)
    if (!list.length || !window.confirm(`Post ${list.length} student fine(s) to fee accounts?`)) return
    setBusy('postAll')
    let ok = 0
    for (const f of list) {
      try {
        await postFineToFeeAccount(f)
        ok++
      } catch {
        /* keep going */
      }
    }
    setBusy(null)
    showSuccess(`Posted ${ok} of ${list.length}.`)
    refresh()
  }

  async function sync() {
    setBusy('sync')
    try {
      const n = await syncPostedFines(fines)
      showInfo(n ? `${n} fine(s) updated from the fee ledger.` : 'All posted fines are up to date.')
      if (n) refresh()
    } finally {
      setBusy(null)
    }
  }

  const exportCsv = () => downloadCsv(`library-fines-${filter}-${todayIso()}.csv`, rows.map(f => ({
    date: f.createdAt.slice(0, 10), member: f.memberName, code: f.memberCode, type: f.memberType, course: f.course || f.department,
    reason: REASON[f.reason], days: f.days, title: f.titleName, accessionNo: f.accessionNo, amount: f.amount, status: STATUS[f.status].label,
    receiptNo: f.receiptNo, mode: f.paymentMode, collectedOn: f.collectedAt.slice(0, 10), feePaymentId: f.feePaymentId, waivedReason: f.waivedReason,
  })))

  if (finesQ.isLoading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Outstanding" value={inr(totals.outstanding)} icon={<IndianRupee className="w-5 h-5" />} tone="text-amber-500" />
        <StatCard label="Collected at desk" value={inr(totals.desk)} icon={<Receipt className="w-5 h-5" />} tone="text-green-500" />
        <StatCard label="Paid via fee account" value={inr(totals.viaFees)} icon={<Send className="w-5 h-5" />} tone="text-blue-500" />
        <StatCard label="Collected this month" value={inr(totals.thisMonth)} icon={<IndianRupee className="w-5 h-5" />} hint={`Waived to date ${inr(totals.waived)}`} />
      </div>

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <PillTabs value={filter} onChange={setFilter} options={[
          { id: 'pending', label: 'Unpaid', count: counts.pending || 0 },
          { id: 'posted', label: 'On fee account', count: counts.posted || 0 },
          { id: 'collected', label: 'Paid at desk', count: counts.collected || 0 },
          { id: 'paid', label: 'Paid via fees', count: counts.paid || 0 },
          { id: 'waived', label: 'Waived', count: counts.waived || 0 },
          { id: 'all', label: 'All', count: counts.all },
        ]} />
        <div className="flex flex-wrap gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="input-field !w-48" />
          {settings.fineHandling !== 'desk' && filter === 'pending' && <button onClick={postAll} disabled={busy === 'postAll'} className={btn.ghost}><Send className="w-4 h-4" /> Post all to fees</button>}
          {isFinance && <button onClick={sync} disabled={busy === 'sync'} className={btn.ghost} title="Mark posted fines paid/waived from the fee ledger"><RefreshCw className={`w-4 h-4 ${busy === 'sync' ? 'animate-spin' : ''}`} /> Reconcile</button>}
          <button onClick={() => setAdding(true)} className={btn.ghost}><Plus className="w-4 h-4" /> Manual charge</button>
          <button onClick={exportCsv} disabled={!rows.length} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title="No fines here" hint="Overdue, lost and damaged charges are created automatically when books are returned at the desk." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Member</th><th className="table-header">Reason</th><th className="table-header text-right">Amount</th><th className="table-header">Status</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map(f => (
                  <tr key={f.id} className="border-b border-vriddhi-border/50">
                    <td className="table-cell"><p className="font-medium text-slate-900 dark:text-white">{f.memberName}</p><p className="text-xs text-vriddhi-muted">{f.memberCode} · {f.memberType}{f.course ? ` · ${f.course}` : ''}</p></td>
                    <td className="table-cell text-sm">{REASON[f.reason]}{f.days ? ` · ${f.days} day(s)` : ''}<span className="block text-xs text-vriddhi-muted truncate max-w-[240px]">{f.titleName}{f.accessionNo ? ` (${f.accessionNo})` : ''}{f.note ? ` — ${f.note}` : ''}</span><span className="block text-[11px] text-vriddhi-muted">{fmtDate(f.createdAt)}</span></td>
                    <td className="table-cell text-right font-semibold">{inr(f.amount)}</td>
                    <td className="table-cell text-sm"><Badge tone={STATUS[f.status].tone}>{STATUS[f.status].label}</Badge>{f.receiptNo && <span className="block text-[11px] font-mono text-vriddhi-muted">{f.receiptNo}</span>}{f.waivedReason && <span className="block text-[11px] text-vriddhi-muted">{f.waivedReason}</span>}</td>
                    <td className="table-cell text-right whitespace-nowrap space-x-1">
                      {canCollect(f) && <button onClick={() => setCollecting(f)} disabled={!!busy} className={btn.small}><Receipt className="w-3 h-3" /> Collect</button>}
                      {canPost(f) && <button onClick={() => post(f)} disabled={busy === f.id} className={btn.small}><Send className="w-3 h-3" /> To fees</button>}
                      {canWaive && ['pending', 'posted'].includes(f.status) && <button onClick={() => setWaiving(f)} className={btn.small}><Ban className="w-3 h-3" /> Waive</button>}
                      {f.status === 'collected' && <button onClick={() => printReceipt(f)} className={btn.small}><Download className="w-3 h-3" /> Receipt</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {collecting && <CollectModal fine={collecting} settings={settings} onClose={() => setCollecting(null)} onDone={(f) => { setCollecting(null); refresh(); printReceipt(f) }} />}
      {waiving && <WaiveModal fine={waiving} onClose={() => setWaiving(null)} onDone={() => { setWaiving(null); refresh() }} />}
      {adding && <ManualFineModal onClose={() => setAdding(false)} onDone={() => { setAdding(false); refresh() }} />}
    </div>
  )

  function printReceipt(f: LibraryFine) {
    void downloadReceiptPdf({
      receiptNo: f.receiptNo,
      date: (f.collectedAt || new Date().toISOString()).slice(0, 10),
      collegeName: branding.collegeName || settings.libraryName,
      collegeCode: branding.collegeCode,
      collegeAddress: branding.address,
      collegeContact: [branding.phone, branding.email].filter(Boolean).join(' · '),
      registrationLine: branding.registrationLine,
      studentName: f.memberName,
      regNo: f.memberCode,
      course: f.course || f.department,
      batch: f.batch,
      feeCategory: 'Library fine',
      paymentMode: f.paymentMode,
      items: [{ label: `${REASON[f.reason]}${f.days ? ` (${f.days} days)` : ''}${f.titleName ? ` — ${f.titleName}` : ''}`, amount: f.amount }],
      amountReceived: f.amount,
      totalFee: f.amount,
      totalPaid: f.amount,
      balance: 0,
      status: 'paid',
      title: `${settings.libraryName} — Fine Receipt`,
      footer: branding.receiptFooter,
      signatoryName: '',
      signatoryDesignation: 'Librarian',
      showBalance: false,
    })
  }
}

function CollectModal({ fine, settings, onClose, onDone }: { fine: LibraryFine; settings: LibrarySettings; onClose: () => void; onDone: (f: LibraryFine) => void }) {
  const { showError } = useNotification()
  const [mode, setMode] = useState('cash')
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      const receiptNo = await collectFineAtDesk(fine, mode, settings)
      onDone({ ...fine, status: 'collected', receiptNo, paymentMode: mode, collectedAt: new Date().toISOString() })
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={`Collect ${inr(fine.amount)}`} footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy} className={btn.primary}>Collect &amp; print receipt</button></>}>
      <p className="text-sm text-vriddhi-muted mb-3">{fine.memberName} · {REASON[fine.reason]} · {fine.titleName}</p>
      <Field label="Payment mode">
        <select className="input-field" value={mode} onChange={e => setMode(e.target.value)}>{MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select>
      </Field>
      <p className="text-xs text-vriddhi-muted mt-2">A library receipt number ({settings.receiptPrefix}/…) is generated. Desk collections appear in Accounts’ collection reports.</p>
    </Modal>
  )
}

function WaiveModal({ fine, onClose, onDone }: { fine: LibraryFine; onClose: () => void; onDone: () => void }) {
  const { showError, showSuccess } = useNotification()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      await waiveFine(fine, reason)
      showSuccess('Fine waived.')
      onDone()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={`Waive ${inr(fine.amount)}`} footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy || !reason.trim()} className={btn.danger}>Waive fine</button></>}>
      <p className="text-sm text-vriddhi-muted mb-3">{fine.memberName} · {REASON[fine.reason]}{fine.status === 'posted' ? ' · the fee-account due will be waived too' : ''}</p>
      <Field label="Reason (kept for audit)"><input className="input-field" value={reason} onChange={e => setReason(e.target.value)} autoFocus /></Field>
    </Modal>
  )
}

function ManualFineModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { showError, showSuccess } = useNotification()
  const membersQ = useLibraryMembers()
  const [q, setQ] = useState('')
  const [member, setMember] = useState<LibraryMember | null>(null)
  const [reason, setReason] = useState<FineReason>('damaged')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const hits = member ? [] : findMembers(membersQ.data || [], q, 6)
  async function save() {
    if (!member) return
    setBusy(true)
    try {
      await addManualFine(member, { reason, amount, note })
      showSuccess('Charge added.')
      onDone()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title="Manual library charge" footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy || !member || amount <= 0} className={btn.primary}>Add</button></>}>
      <div className="space-y-3">
        <Field label="Member">{member ? <div className="flex justify-between"><span className="text-sm">{member.name} · {member.code}</span><button className={btn.small} onClick={() => setMember(null)}>Change</button></div> : <input className="input-field" value={q} onChange={e => setQ(e.target.value)} placeholder="Reg. no / name" autoFocus />}</Field>
        {hits.map(m => <button key={m.id} onClick={() => setMember(m)} className="block w-full text-left text-sm px-2 py-1 rounded hover:bg-vriddhi-border/40">{m.name} <span className="text-vriddhi-muted">· {m.code}</span></button>)}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Reason"><select className="input-field" value={reason} onChange={e => setReason(e.target.value as FineReason)}>{(Object.keys(REASON) as FineReason[]).map(r => <option key={r} value={r}>{REASON[r]}</option>)}</select></Field>
          <Field label="Amount (₹)"><input type="number" min={0} className="input-field" value={amount || ''} onChange={e => setAmount(Number(e.target.value) || 0)} /></Field>
        </div>
        <Field label="Note"><input className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. lost ID card replacement" /></Field>
      </div>
    </Modal>
  )
}
