// /admin/purchase-requests — departments raise requests; the college's
// approval chain (HOD → Principal → Accounts above a limit, configurable)
// decides; the operations team converts approved requests into POs.

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Download, Plus, ShoppingCart, Trash2, XCircle } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { roleHasPermission } from '@/modules/auth/permissions'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, btn, downloadCsv, errMsg, fmtDate, fmtDateTime, inr } from '../components/officeUi'
import { PR_STATUS_LABEL, cancelPurchaseRequest, createPurchaseRequest, decidePurchaseRequest, type PrItem, type PurchaseRequest, type Quotation } from '../api/procurementApi'
import { useProcurementRefresh, useProcurementSettings, usePurchaseRequests } from '../hooks/useProcurement'
import { canActOnStep, nextStep, requiredSteps, type ProcurementSettings } from '../utils/procurementEngine'

type Filter = 'mine_to_approve' | 'open' | 'approved' | 'closed' | 'raised_by_me'

const tone = (s: PurchaseRequest['status']) => (s === 'approved' ? 'green' : s === 'rejected' ? 'red' : s === 'ordered' ? 'blue' : s === 'cancelled' ? 'slate' : 'amber')

export default function PurchaseRequestsPage() {
  const { user } = useAuth()
  const role = user?.role || ''
  const { settings, loading } = useProcurementSettings()
  const prsQ = usePurchaseRequests()
  const [filter, setFilter] = useState<Filter>('mine_to_approve')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<PurchaseRequest | null>(null)
  const isDeptHead = role === 'hod' || role === 'admin'

  const visible = useMemo(() => {
    const all = prsQ.data || []
    // Department heads see their own department's requests only.
    return isDeptHead ? all.filter(p => p.requestedBy.uid === user?.uid || (!!user?.department && p.department === user.department)) : all
  }, [prsQ.data, isDeptHead, user?.uid, user?.department])

  const toApprove = visible.filter(p => p.status === 'submitted' && canActOnStep(nextStep(settings.approvalChain, p.estimatedTotal, p.requestedBy.role, p.approvals), role))
  const lists: Record<Filter, PurchaseRequest[]> = {
    mine_to_approve: toApprove,
    open: visible.filter(p => p.status === 'submitted'),
    approved: visible.filter(p => p.status === 'approved'),
    closed: visible.filter(p => ['ordered', 'rejected', 'cancelled'].includes(p.status)),
    raised_by_me: visible.filter(p => p.requestedBy.uid === user?.uid),
  }
  const list = lists[filter]

  const exportCsv = () =>
    downloadCsv('purchase-requests.csv', visible.map(p => ({ 'PR No': p.prNo, Date: p.createdAt.slice(0, 10), Title: p.title, Department: p.department, 'Budget head': p.budgetHead, 'Estimated ₹': p.estimatedTotal, 'Raised by': p.requestedBy.name, Status: PR_STATUS_LABEL[p.status], Approvals: p.approvals.map(a => `${a.role}:${a.decision} ${a.by}`).join('; ') })))

  if (loading || prsQ.isLoading) return <div className="p-6"><Loading /></div>
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Purchase Requests"
        subtitle={`Approval chain: ${settings.approvalChain.map(s => (s.minAmount > 0 ? `${s.label} (≥ ${inr(s.minAmount)})` : s.label)).join(' → ') || 'none'}`}
        icon={<ShoppingCart className="w-5 h-5" />}
        actions={<>
          <button className={btn.ghost} onClick={exportCsv}><Download className="w-4 h-4" />CSV</button>
          <button className={btn.primary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" />New request</button>
        </>}
      />
      <PillTabs value={filter} onChange={setFilter} options={[
        { id: 'mine_to_approve', label: 'Awaiting my approval', count: lists.mine_to_approve.length },
        { id: 'open', label: 'In approval', count: lists.open.length },
        { id: 'approved', label: 'Approved (to order)', count: lists.approved.length },
        { id: 'closed', label: 'Closed', count: lists.closed.length },
        { id: 'raised_by_me', label: 'Raised by me', count: lists.raised_by_me.length },
      ]} />
      {!list.length ? <Empty icon={<ShoppingCart className="w-8 h-8" />} title="Nothing here" hint="Requests you raise or need to approve will appear here." /> : (
        <div className="glass-card overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border">
              <th className="p-3">PR</th><th className="p-3">Title</th><th className="p-3">Department</th><th className="p-3 text-right">Estimate</th><th className="p-3">Raised by</th><th className="p-3">Status</th>
            </tr></thead>
            <tbody>
              {list.map(p => {
                const step = p.status === 'submitted' ? nextStep(settings.approvalChain, p.estimatedTotal, p.requestedBy.role, p.approvals) : null
                return (
                  <tr key={p.id} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-border/20 cursor-pointer" onClick={() => setOpen(p)}>
                    <td className="p-3 font-mono text-xs">{p.prNo}<div className="text-vriddhi-muted">{fmtDate(p.createdAt)}</div></td>
                    <td className="p-3">{p.title}<div className="text-xs text-vriddhi-muted">{p.items.length} item(s){p.budgetHead ? ` · ${p.budgetHead}` : ''}</div></td>
                    <td className="p-3">{p.department || '—'}</td>
                    <td className="p-3 text-right">{inr(p.estimatedTotal)}</td>
                    <td className="p-3">{p.requestedBy.name}</td>
                    <td className="p-3"><Badge tone={tone(p.status)}>{step ? `With ${step.label}` : PR_STATUS_LABEL[p.status]}</Badge></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {creating && <NewRequestModal settings={settings} role={role} department={user?.department || ''} onClose={() => setCreating(false)} />}
      {open && <RequestModal pr={open} settings={settings} role={role} uid={user?.uid || ''} onClose={() => setOpen(null)} />}
    </div>
  )
}

const blankItem = (): PrItem => ({ description: '', qty: 1, unit: 'nos', estRate: 0 })

function NewRequestModal({ settings, role, department, onClose }: { settings: ProcurementSettings; role: string; department: string; onClose: () => void }) {
  const refresh = useProcurementRefresh()
  const { showSuccess, showError } = useNotification()
  const [title, setTitle] = useState('')
  const [dept, setDept] = useState(department)
  const [budgetHead, setBudgetHead] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [justification, setJustification] = useState('')
  const [items, setItems] = useState<PrItem[]>([blankItem()])
  const [quotes, setQuotes] = useState<Quotation[]>([])
  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.estRate) || 0), 0)
  const needQuotes = settings.quotationsAbove > 0 && total >= settings.quotationsAbove
  const steps = requiredSteps(settings.approvalChain, total, role)
  const lockDept = (role === 'hod' || role === 'admin') && !!department
  const setItem = (i: number, patch: Partial<PrItem>) => setItems(p => p.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const setQuote = (i: number, patch: Partial<Quotation>) => setQuotes(p => p.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const m = useMutation({
    mutationFn: () => {
      if (!title.trim()) throw new Error('Give the request a title.')
      return createPurchaseRequest({ title: title.trim(), department: dept.trim(), budgetHead, neededBy, justification: justification.trim(), items: items.map(i => ({ ...i, qty: Number(i.qty) || 0, estRate: Number(i.estRate) || 0 })), quotations: quotes.map(q => ({ ...q, amount: Number(q.amount) || 0 })) }, { role }, settings)
    },
    onSuccess: () => { showSuccess('Request submitted for approval'); refresh(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title="New purchase request" wide footer={<><span className="mr-auto text-sm text-vriddhi-muted">Estimate <b className="text-vriddhi-text">{inr(total)}</b></span><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Submitting…' : 'Submit'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Title *" className="sm:col-span-2"><input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 30 chairs for Seminar Hall 2" /></Field>
        <Field label="Department"><input className="input-field" value={dept} disabled={lockDept} onChange={e => setDept(e.target.value)} /></Field>
        <Field label="Budget head">
          <select className="input-field" value={budgetHead} onChange={e => setBudgetHead(e.target.value)}>
            <option value="">—</option>
            {settings.budgetHeads.map(b => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Needed by"><input type="date" className="input-field" value={neededBy} onChange={e => setNeededBy(e.target.value)} /></Field>
        <Field label="Justification" className="sm:col-span-2"><textarea className="input-field" rows={2} value={justification} onChange={e => setJustification(e.target.value)} /></Field>
      </div>
      <p className="text-xs font-semibold text-vriddhi-muted mt-4 mb-2">Items</p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input className="input-field col-span-12 sm:col-span-5" placeholder="Description / specification" value={it.description} onChange={e => setItem(i, { description: e.target.value })} />
            <input className="input-field col-span-3 sm:col-span-2" type="number" min={0} placeholder="Qty" value={it.qty} onChange={e => setItem(i, { qty: Number(e.target.value) })} />
            <input className="input-field col-span-3 sm:col-span-1" placeholder="Unit" value={it.unit} onChange={e => setItem(i, { unit: e.target.value })} />
            <input className="input-field col-span-4 sm:col-span-2" type="number" min={0} placeholder="Est. rate ₹" value={it.estRate || ''} onChange={e => setItem(i, { estRate: Number(e.target.value) })} />
            <span className="col-span-1 text-xs text-right">{inr((it.qty || 0) * (it.estRate || 0))}</span>
            <button className="col-span-1 text-red-500 justify-self-end" onClick={() => setItems(p => (p.length > 1 ? p.filter((_, j) => j !== i) : p))}><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button className={btn.small} onClick={() => setItems(p => [...p, blankItem()])}><Plus className="w-3 h-3" />Add item</button>
      </div>
      {(needQuotes || quotes.length > 0) && (
        <>
          <p className="text-xs font-semibold text-vriddhi-muted mt-4 mb-2">Quotations {needQuotes && <span className="text-amber-600">— {settings.quotationsRequired} required for requests ≥ {inr(settings.quotationsAbove)}</span>}</p>
          <div className="space-y-2">
            {quotes.map((q, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input className="input-field col-span-5" placeholder="Vendor" value={q.vendorName} onChange={e => setQuote(i, { vendorName: e.target.value })} />
                <input className="input-field col-span-3" type="number" placeholder="Amount ₹" value={q.amount || ''} onChange={e => setQuote(i, { amount: Number(e.target.value) })} />
                <input className="input-field col-span-3" placeholder="Note" value={q.note} onChange={e => setQuote(i, { note: e.target.value })} />
                <button className="col-span-1 text-red-500" onClick={() => setQuotes(p => p.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </>
      )}
      <button className={`${btn.small} mt-2`} onClick={() => setQuotes(p => [...p, { vendorName: '', amount: 0, note: '' }])}><Plus className="w-3 h-3" />Add quotation</button>
      <p className="text-xs text-vriddhi-muted mt-4">Will go to: {steps.map(s => s.label).join(' → ') || 'auto-approved (no approval steps apply)'}</p>
    </Modal>
  )
}

function RequestModal({ pr, settings, role, uid, onClose }: { pr: PurchaseRequest; settings: ProcurementSettings; role: string; uid: string; onClose: () => void }) {
  const refresh = useProcurementRefresh()
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [note, setNote] = useState('')
  const step = pr.status === 'submitted' ? nextStep(settings.approvalChain, pr.estimatedTotal, pr.requestedBy.role, pr.approvals) : null
  const canAct = canActOnStep(step, role)
  const canOrder = pr.status === 'approved' && roleHasPermission(role as never, 'procurement.order')
  const decide = useMutation({
    mutationFn: (d: 'approved' | 'rejected') => {
      if (d === 'rejected' && !note.trim()) throw new Error('Give a reason for rejecting.')
      return decidePurchaseRequest(pr, settings, d, note)
    },
    onSuccess: (_, d) => { showSuccess(d === 'approved' ? 'Approved' : 'Rejected'); refresh(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  const cancel = useMutation({ mutationFn: () => cancelPurchaseRequest(pr.id), onSuccess: () => { showSuccess('Request cancelled'); refresh(); onClose() }, onError: e => showError(errMsg(e)) })
  const steps = requiredSteps(settings.approvalChain, pr.estimatedTotal, pr.requestedBy.role)
  return (
    <Modal open onClose={onClose} title={`${pr.prNo} · ${pr.title}`} wide footer={<>
      {pr.status === 'submitted' && pr.requestedBy.uid === uid && <button className={`${btn.danger} mr-auto`} onClick={() => cancel.mutate()} disabled={cancel.isPending}>Withdraw</button>}
      {canOrder && <button className={btn.primary} onClick={() => navigate(`/admin/purchase-orders?fromPr=${pr.id}`)}>Raise purchase order</button>}
      {canAct && <>
        <button className={btn.danger} disabled={decide.isPending} onClick={() => decide.mutate('rejected')}><XCircle className="w-4 h-4" />Reject</button>
        <button className={btn.primary} disabled={decide.isPending} onClick={() => decide.mutate('approved')}><CheckCircle2 className="w-4 h-4" />Approve as {step?.label}</button>
      </>}
    </>}>
      <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
        <div><p className="text-xs text-vriddhi-muted">Department</p>{pr.department || '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Budget head</p>{pr.budgetHead || '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Needed by</p>{pr.neededBy ? fmtDate(pr.neededBy) : '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Raised by</p>{pr.requestedBy.name} ({pr.requestedBy.role})</div>
        <div><p className="text-xs text-vriddhi-muted">Estimate</p><b>{inr(pr.estimatedTotal)}</b></div>
        <div><p className="text-xs text-vriddhi-muted">Status</p><Badge tone={tone(pr.status)}>{PR_STATUS_LABEL[pr.status]}</Badge></div>
      </div>
      {pr.justification && <p className="text-sm mb-4 p-3 rounded-xl bg-vriddhi-border/20">{pr.justification}</p>}
      <table className="w-full text-sm mb-4">
        <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Est. rate</th><th className="py-2 text-right">Amount</th></tr></thead>
        <tbody>{pr.items.map((i, k) => <tr key={k} className="border-b border-vriddhi-border/40"><td className="py-2">{i.description}</td><td className="py-2 text-right">{i.qty} {i.unit}</td><td className="py-2 text-right">{inr(i.estRate)}</td><td className="py-2 text-right">{inr(i.qty * i.estRate)}</td></tr>)}</tbody>
      </table>
      {pr.quotations.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-vriddhi-muted mb-1">Quotations</p>
          {pr.quotations.map((q, k) => <p key={k} className="text-sm">{q.vendorName} — {inr(q.amount)} {q.note && <span className="text-vriddhi-muted">({q.note})</span>}</p>)}
        </div>
      )}
      <p className="text-xs font-semibold text-vriddhi-muted mb-2">Approvals</p>
      <ol className="space-y-2 mb-3">
        {steps.map(s => {
          const rec = pr.approvals.find(a => a.role === s.role)
          return (
            <li key={s.role} className="flex items-center gap-2 text-sm">
              {rec ? (rec.decision === 'approved' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />) : <span className={`w-4 h-4 rounded-full border-2 ${step?.role === s.role ? 'border-amber-500' : 'border-vriddhi-border'}`} />}
              <span className="font-medium">{s.label}</span>
              {rec && <span className="text-vriddhi-muted">— {rec.by}, {fmtDateTime(rec.at)}{rec.note ? ` · "${rec.note}"` : ''}</span>}
              {!rec && step?.role === s.role && <span className="text-amber-600 text-xs">pending</span>}
            </li>
          )
        })}
      </ol>
      {canAct && <Field label="Note (required to reject)"><input className="input-field" value={note} onChange={e => setNote(e.target.value)} /></Field>}
    </Modal>
  )
}
