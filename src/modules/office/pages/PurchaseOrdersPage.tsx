// /admin/purchase-orders[/:tab] — purchase orders (GST), goods receipts
// (auto stock-in for consumables) and purchase settings. Operations team.

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ClipboardList, Download, FileText, PackageCheck, Plus, Trash2 } from 'lucide-react'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, RouteTabs, btn, downloadCsv, errMsg, fmtDate, inr } from '../components/officeUi'
import ProcurementSettingsForm from '../components/procurement/ProcurementSettingsForm'
import { PO_STATUS_LABEL, createPurchaseOrder, receiveGoods, setPoStatus, type GrnLine, type PoLine, type PurchaseOrder, type PurchaseRequest, type Vendor } from '../api/procurementApi'
import { useGoodsReceipts, useProcurementRefresh, useProcurementSettings, usePurchaseOrders, usePurchaseRequests, useVendorBills, useVendors } from '../hooks/useProcurement'
import { useItems, useInventoryRefresh } from '../hooks/useInventory'
import { useBranding } from '../hooks/useLibrary'
import { todayIso } from '../api/officeDb'
import { isInterState, lineTotals, orderTotals, type OrderLine, type ProcurementSettings } from '../utils/procurementEngine'
import { downloadReportPdf, pdfMoney } from '../utils/reportPdf'
import { amountInWords } from '@/modules/admin/utils/payrollEngine'
import type { InventoryItem } from '../api/inventoryApi'

const TABS = [
  { id: '', label: 'Purchase Orders' },
  { id: 'receipts', label: 'Goods Receipts' },
  { id: 'settings', label: 'Purchase Settings' },
]
const poTone = (s: PurchaseOrder['status']) => (s === 'received' || s === 'closed' ? 'green' : s === 'partial' ? 'amber' : s === 'cancelled' ? 'red' : 'blue')

export default function PurchaseOrdersPage() {
  const { tab = '' } = useParams()
  const { settings, loading } = useProcurementSettings()
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="Purchasing" subtitle="Purchase orders, goods receipts and purchase settings" icon={<ClipboardList className="w-5 h-5" />} />
      <RouteTabs tabs={TABS.map(t => ({ to: t.id ? `/admin/purchase-orders/${t.id}` : '/admin/purchase-orders', label: t.label, end: !t.id }))} />
      {loading ? <Loading /> : tab === 'receipts' ? <ReceiptsTab /> : tab === 'settings' ? <ProcurementSettingsForm settings={settings} /> : <OrdersTab settings={settings} />}
    </div>
  )
}

// ─── Orders ───────────────────────────────────────────────
function OrdersTab({ settings }: { settings: ProcurementSettings }) {
  const posQ = usePurchaseOrders()
  const prsQ = usePurchaseRequests()
  const vendorsQ = useVendors()
  const billsQ = useVendorBills()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')
  const [creating, setCreating] = useState<string[] | null>(null)
  const [open, setOpen] = useState<PurchaseOrder | null>(null)

  useEffect(() => {
    const fromPr = params.get('fromPr')
    if (fromPr) {
      setCreating([fromPr])
      params.delete('fromPr')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const approved = (prsQ.data || []).filter(p => p.status === 'approved')
  const billedByPo = useMemo(() => {
    const m: Record<string, number> = {}
    for (const b of billsQ.data || []) if (b.poId && b.status !== 'cancelled') m[b.poId] = (m[b.poId] || 0) + b.gross
    return m
  }, [billsQ.data])
  const all = posQ.data || []
  const list = all.filter(p => (filter === 'all' ? true : filter === 'open' ? ['issued', 'partial'].includes(p.status) : ['received', 'closed', 'cancelled'].includes(p.status)))

  if (posQ.isLoading) return <Loading />
  return (
    <>
      {approved.length > 0 && (
        <div className="glass-card p-4 mb-4 border-l-4 border-emerald-500">
          <p className="font-medium text-sm mb-2">{approved.length} approved request(s) waiting for a PO</p>
          <div className="flex flex-wrap gap-2">
            {approved.map(p => <button key={p.id} className={btn.small} onClick={() => setCreating([p.id])}>{p.prNo} · {p.title} · {inr(p.estimatedTotal)}</button>)}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PillTabs value={filter} onChange={setFilter} options={[{ id: 'open', label: 'Open', count: all.filter(p => ['issued', 'partial'].includes(p.status)).length }, { id: 'done', label: 'Completed' }, { id: 'all', label: 'All' }]} />
        <div className="ml-auto flex gap-2">
          <button className={btn.ghost} onClick={() => downloadCsv('purchase-orders.csv', all.map(p => ({ 'PO No': p.poNo, Date: p.date, Vendor: p.vendorName, GSTIN: p.vendorGstin, Department: p.department, 'Budget head': p.budgetHead, Taxable: p.totals.taxable, CGST: p.totals.cgst, SGST: p.totals.sgst, IGST: p.totals.igst, Total: p.totals.grandTotal, Billed: billedByPo[p.id] || 0, Status: PO_STATUS_LABEL[p.status], PRs: p.prNos.join('; ') })))}><Download className="w-4 h-4" />CSV</button>
          <button className={btn.primary} onClick={() => setCreating([])}><Plus className="w-4 h-4" />New PO</button>
        </div>
      </div>
      {!list.length ? <Empty icon={<ClipboardList className="w-8 h-8" />} title="No purchase orders" hint="Raise a PO from an approved request, or directly for routine purchases." /> : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-3">PO</th><th className="p-3">Vendor</th><th className="p-3">Department</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Billed</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {list.map(p => (
                <tr key={p.id} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-border/20 cursor-pointer" onClick={() => setOpen(p)}>
                  <td className="p-3 font-mono text-xs">{p.poNo}<div className="text-vriddhi-muted">{fmtDate(p.date)}</div></td>
                  <td className="p-3">{p.vendorName}<div className="text-xs text-vriddhi-muted">{p.lines.length} line(s){p.prNos.length ? ` · ${p.prNos.join(', ')}` : ''}</div></td>
                  <td className="p-3">{p.department || '—'}</td>
                  <td className="p-3 text-right">{inr(p.totals.grandTotal)}</td>
                  <td className="p-3 text-right">{inr(billedByPo[p.id] || 0)}</td>
                  <td className="p-3"><Badge tone={poTone(p.status)}>{PO_STATUS_LABEL[p.status]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && <NewPoModal settings={settings} vendors={(vendorsQ.data || []).filter(v => v.active)} approved={approved} preselect={creating} onClose={() => setCreating(null)} />}
      {open && <PoModal po={open} settings={settings} onClose={() => setOpen(null)} />}
    </>
  )
}

type DraftLine = OrderLine & { itemId?: string }

function NewPoModal({ settings, vendors, approved, preselect, onClose }: { settings: ProcurementSettings; vendors: Vendor[]; approved: PurchaseRequest[]; preselect: string[]; onClose: () => void }) {
  const refresh = useProcurementRefresh()
  const itemsQ = useItems()
  const { showSuccess, showError } = useNotification()
  const [vendorId, setVendorId] = useState('')
  const [prIds, setPrIds] = useState<string[]>(preselect)
  const prs = approved.filter(p => prIds.includes(p.id))
  const fromPrs = (list: PurchaseRequest[]): DraftLine[] => list.flatMap(p => p.items.map(i => ({ description: i.description, qty: i.qty, unit: i.unit, rate: i.estRate, gstRate: settings.defaultGstRate, discountPct: 0, itemId: i.itemId })))
  const [lines, setLines] = useState<DraftLine[]>(() => {
    const init = fromPrs(approved.filter(p => preselect.includes(p.id)))
    return init.length ? init : [{ description: '', qty: 1, unit: 'nos', rate: 0, gstRate: settings.defaultGstRate, discountPct: 0 }]
  })
  const [department, setDepartment] = useState(prs[0]?.department || '')
  const [budgetHead, setBudgetHead] = useState(prs[0]?.budgetHead || '')
  const [deliveryBy, setDeliveryBy] = useState(prs[0]?.neededBy || '')
  const [deliveryAddress, setDeliveryAddress] = useState(settings.deliveryAddress)
  const [terms, setTerms] = useState(settings.poTerms)
  const vendor = vendors.find(v => v.id === vendorId)
  const inter = vendor ? isInterState(settings.collegeGstin, vendor.gstin, settings.collegeState, vendor.state) : false
  const totals = orderTotals(lines, inter)
  const setLine = (i: number, p: Partial<DraftLine>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...p } : l)))
  const togglePr = (p: PurchaseRequest) => {
    const on = prIds.includes(p.id)
    setPrIds(ids => (on ? ids.filter(x => x !== p.id) : [...ids, p.id]))
    if (!on) {
      setLines(ls => [...ls.filter(l => l.description.trim()), ...fromPrs([p])])
      if (!department) setDepartment(p.department)
      if (!budgetHead) setBudgetHead(p.budgetHead)
    }
  }
  const m = useMutation({
    mutationFn: () => {
      if (!vendor) throw new Error('Choose a vendor.')
      return createPurchaseOrder({ vendor, prs, department, budgetHead, lines, deliveryBy, deliveryAddress, terms }, settings)
    },
    onSuccess: () => { showSuccess('Purchase order issued'); refresh(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title="New purchase order" wide footer={<><span className="mr-auto text-sm">Total <b>{inr(totals.grandTotal)}</b> <span className="text-vriddhi-muted">({inter ? `IGST ${inr(totals.igst)}` : `CGST ${inr(totals.cgst)} + SGST ${inr(totals.sgst)}`})</span></span><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Issuing…' : 'Issue PO'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Vendor *" hint={vendors.length ? undefined : 'Add vendors first on the Vendors page'}>
          <select className="input-field" value={vendorId} onChange={e => setVendorId(e.target.value)}>
            <option value="">Choose…</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}{v.gstin ? ` · ${v.gstin}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Delivery by"><input type="date" className="input-field" value={deliveryBy} onChange={e => setDeliveryBy(e.target.value)} /></Field>
        <Field label="Department"><input className="input-field" value={department} onChange={e => setDepartment(e.target.value)} /></Field>
        <Field label="Budget head">
          <select className="input-field" value={budgetHead} onChange={e => setBudgetHead(e.target.value)}><option value="">—</option>{settings.budgetHeads.map(b => <option key={b}>{b}</option>)}</select>
        </Field>
      </div>
      {approved.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-vriddhi-muted mb-1">Against approved requests</p>
          <div className="flex flex-wrap gap-2">{approved.map(p => <label key={p.id} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg border border-vriddhi-border"><input type="checkbox" checked={prIds.includes(p.id)} onChange={() => togglePr(p)} />{p.prNo} · {p.title}</label>)}</div>
        </div>
      )}
      <p className="text-xs font-semibold text-vriddhi-muted mt-4 mb-2">Lines <span className="font-normal">— link a stores item to add received quantities to stock automatically</span></p>
      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-vriddhi-border/10">
            <input className="input-field col-span-12 sm:col-span-4" placeholder="Description" value={l.description} onChange={e => setLine(i, { description: e.target.value })} />
            <input className="input-field col-span-3 sm:col-span-1" type="number" min={0} value={l.qty} onChange={e => setLine(i, { qty: Number(e.target.value) })} title="Qty" />
            <input className="input-field col-span-3 sm:col-span-1" value={l.unit} onChange={e => setLine(i, { unit: e.target.value })} title="Unit" />
            <input className="input-field col-span-3 sm:col-span-2" type="number" min={0} placeholder="Rate" value={l.rate || ''} onChange={e => setLine(i, { rate: Number(e.target.value) })} />
            <select className="input-field col-span-3 sm:col-span-1" value={l.gstRate} onChange={e => setLine(i, { gstRate: Number(e.target.value) })} title="GST %">{settings.gstRates.map(r => <option key={r} value={r}>{r}%</option>)}</select>
            <input className="input-field col-span-3 sm:col-span-1" type="number" min={0} max={100} placeholder="Disc%" value={l.discountPct || ''} onChange={e => setLine(i, { discountPct: Number(e.target.value) })} />
            <span className="col-span-5 sm:col-span-1 text-xs text-right">{inr(lineTotals(l).total)}</span>
            <button className="col-span-1 text-red-500 justify-self-end" onClick={() => setLines(ls => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))}><Trash2 className="w-4 h-4" /></button>
            <select className="input-field col-span-12 sm:col-span-6 text-xs" value={l.itemId || ''} onChange={e => setLine(i, { itemId: e.target.value || undefined })}>
              <option value="">Not a stores item (asset / service)</option>
              {(itemsQ.data || []).filter(it => it.active).map(it => <option key={it.id} value={it.id}>Stock: {it.name} ({it.unit})</option>)}
            </select>
          </div>
        ))}
        <button className={btn.small} onClick={() => setLines(ls => [...ls, { description: '', qty: 1, unit: 'nos', rate: 0, gstRate: settings.defaultGstRate, discountPct: 0 }])}><Plus className="w-3 h-3" />Add line</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Field label="Delivery address"><textarea className="input-field" rows={3} value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} /></Field>
        <Field label="Terms"><textarea className="input-field" rows={3} value={terms} onChange={e => setTerms(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

function PoModal({ po, settings, onClose }: { po: PurchaseOrder; settings: ProcurementSettings; onClose: () => void }) {
  const branding = useBranding()
  const grnsQ = useGoodsReceipts()
  const refresh = useProcurementRefresh()
  const { showSuccess, showError } = useNotification()
  const [receiving, setReceiving] = useState(false)
  const grns = (grnsQ.data || []).filter(g => g.poId === po.id)
  const status = useMutation({ mutationFn: (s: 'closed' | 'cancelled') => setPoStatus(po.id, s), onSuccess: () => { showSuccess('Updated'); refresh(); onClose() }, onError: e => showError(errMsg(e)) })
  const pdf = () =>
    downloadReportPdf({
      collegeName: branding.collegeName || 'College',
      address: [branding.address, settings.collegeGstin ? `GSTIN ${settings.collegeGstin}` : ''].filter(Boolean).join(' · '),
      title: 'PURCHASE ORDER',
      subtitle: `${po.poNo} · ${fmtDate(po.date)}`,
      sections: [
        { heading: 'Supplier', rows: [['Vendor', po.vendorName], ['GSTIN', po.vendorGstin || 'Unregistered'], ['Address', po.vendorAddress || '—'], ['Reference', po.prNos.join(', ') || '—'], ['Deliver by', po.deliveryBy ? fmtDate(po.deliveryBy) : 'At the earliest'], ['Deliver to', po.deliveryAddress || '—']] },
        {
          heading: 'Items',
          table: {
            head: ['#', 'Description', 'Qty', 'Rate', 'Disc %', 'GST %', 'Amount'],
            body: po.lines.map((l, i) => [i + 1, l.description, `${l.qty} ${l.unit}`, pdfMoney(l.rate), l.discountPct || 0, l.gstRate, pdfMoney(lineTotals(l).total)]),
            align: ['left', 'left', 'right', 'right', 'right', 'right', 'right'],
          },
        },
        {
          heading: 'Totals',
          rows: [
            ['Taxable value', pdfMoney(po.totals.taxable)],
            ...(po.interState ? [['IGST', pdfMoney(po.totals.igst)] as [string, string]] : [['CGST', pdfMoney(po.totals.cgst)] as [string, string], ['SGST', pdfMoney(po.totals.sgst)] as [string, string]]),
            ['Round off', pdfMoney(po.totals.roundOff)],
            ['Grand total', pdfMoney(po.totals.grandTotal)],
            ['In words', amountInWords(po.totals.grandTotal)],
          ],
        },
        { heading: 'Terms & conditions', note: po.terms || '—' },
        { heading: '', note: '\n\nAuthorised signatory' },
      ],
      filename: `${po.poNo.replace(/\//g, '-')}.pdf`,
    })
  return (
    <>
      <Modal open onClose={onClose} title={`${po.poNo} · ${po.vendorName}`} wide footer={<>
        {po.status === 'issued' && !grns.length && <button className={`${btn.danger} mr-auto`} disabled={status.isPending} onClick={() => status.mutate('cancelled')}>Cancel PO</button>}
        {po.status === 'partial' && <button className={`${btn.ghost} mr-auto`} disabled={status.isPending} onClick={() => status.mutate('closed')}>Short-close</button>}
        <button className={btn.ghost} onClick={pdf}><FileText className="w-4 h-4" />PDF</button>
        {['issued', 'partial'].includes(po.status) && <button className={btn.primary} onClick={() => setReceiving(true)}><PackageCheck className="w-4 h-4" />Receive goods</button>}
      </>}>
        <div className="flex flex-wrap gap-2 mb-3"><Badge tone={poTone(po.status)}>{PO_STATUS_LABEL[po.status]}</Badge>{po.department && <Badge>{po.department}</Badge>}{po.budgetHead && <Badge tone="purple">{po.budgetHead}</Badge>}<Badge tone="teal">{po.interState ? 'IGST' : 'CGST + SGST'}</Badge></div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="py-2">Item</th><th className="py-2 text-right">Ordered</th><th className="py-2 text-right">Received</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">GST</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>{po.lines.map((l, i) => <tr key={i} className="border-b border-vriddhi-border/40"><td className="py-2">{l.description}{l.itemId && <span className="ml-1 text-xs text-teal-600">· stock</span>}</td><td className="py-2 text-right">{l.qty} {l.unit}</td><td className="py-2 text-right">{l.receivedQty}</td><td className="py-2 text-right">{inr(l.rate)}</td><td className="py-2 text-right">{l.gstRate}%</td><td className="py-2 text-right">{inr(lineTotals(l).total)}</td></tr>)}</tbody>
        </table>
        <div className="text-sm text-right mt-3 space-y-0.5">
          <p>Taxable {inr(po.totals.taxable)}</p>
          {po.interState ? <p>IGST {inr(po.totals.igst)}</p> : <p>CGST {inr(po.totals.cgst)} · SGST {inr(po.totals.sgst)}</p>}
          <p className="font-semibold">Total {inr(po.totals.grandTotal)}</p>
        </div>
        {grns.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-vriddhi-muted mb-1">Goods receipts</p>
            {grns.map(g => <p key={g.id} className="text-sm">{g.grnNo} · {fmtDate(g.date)} · inv {g.invoiceNo || '—'} · {g.lines.map(l => `${l.description}: ${l.accepted}${l.rejected ? ` (+${l.rejected} rejected)` : ''}`).join(', ')}</p>)}
          </div>
        )}
      </Modal>
      {receiving && <ReceiveModal po={po} settings={settings} onClose={() => setReceiving(false)} onDone={onClose} />}
    </>
  )
}

function ReceiveModal({ po, settings, onClose, onDone }: { po: PurchaseOrder; settings: ProcurementSettings; onClose: () => void; onDone: () => void }) {
  const refresh = useProcurementRefresh()
  const refreshInv = useInventoryRefresh()
  const itemsQ = useItems()
  const { showSuccess, showError } = useNotification()
  const [date, setDate] = useState(todayIso())
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState<GrnLine[]>(po.lines.map((l: PoLine, i) => ({ lineIndex: i, description: l.description, accepted: Math.max(0, l.qty - l.receivedQty), rejected: 0, itemId: l.itemId })))
  const items: InventoryItem[] = itemsQ.data || []
  const setLine = (i: number, p: Partial<GrnLine>) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, ...p } : l)))
  const m = useMutation({
    mutationFn: () => receiveGoods(po, { date, invoiceNo, invoiceDate, note, lines }, settings),
    onSuccess: r => { showSuccess(`${r.grnNo} recorded${r.stockPosted ? ` · ${r.stockPosted} line(s) added to stock` : ''}`); refresh(); refreshInv(); onClose(); onDone() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title={`Receive goods · ${po.poNo}`} wide footer={<><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Record receipt'}</button></>}>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <Field label="Received on"><input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Vendor invoice / DC no."><input className="input-field" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} /></Field>
        <Field label="Invoice date"><input type="date" className="input-field" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></Field>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="py-2">Item</th><th className="py-2 text-right">Pending</th><th className="py-2">Accepted</th><th className="py-2">Rejected</th><th className="py-2">Add to stock</th></tr></thead>
        <tbody>
          {lines.map((l, i) => {
            const pl = po.lines[i]
            const pending = pl.qty - pl.receivedQty
            return (
              <tr key={i} className="border-b border-vriddhi-border/40">
                <td className="py-2 pr-2">{l.description}</td>
                <td className="py-2 text-right pr-2">{pending} {pl.unit}</td>
                <td className="py-2 pr-2"><input className="input-field w-24" type="number" min={0} max={pending} value={l.accepted} disabled={pending <= 0} onChange={e => setLine(i, { accepted: Math.max(0, Number(e.target.value) || 0) })} /></td>
                <td className="py-2 pr-2"><input className="input-field w-24" type="number" min={0} value={l.rejected} disabled={pending <= 0} onChange={e => setLine(i, { rejected: Math.max(0, Number(e.target.value) || 0) })} /></td>
                <td className="py-2">
                  <select className="input-field text-xs" value={l.itemId || ''} onChange={e => setLine(i, { itemId: e.target.value || undefined })}>
                    <option value="">No (asset / service)</option>
                    {items.filter(it => it.active).map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Field label="Note" className="mt-3"><input className="input-field" value={note} onChange={e => setNote(e.target.value)} placeholder="Condition, shortages, inspection remarks" /></Field>
      <p className="text-xs text-vriddhi-muted mt-2">Capital items? Register them on Inventory → Assets after receipt (use the PO/GRN number as the reference).</p>
    </Modal>
  )
}

// ─── Receipts ─────────────────────────────────────────────
function ReceiptsTab() {
  const grnsQ = useGoodsReceipts()
  const list = grnsQ.data || []
  if (grnsQ.isLoading) return <Loading />
  if (!list.length) return <Empty icon={<PackageCheck className="w-8 h-8" />} title="No goods receipts yet" hint="Open a purchase order and choose Receive goods." />
  return (
    <>
      <div className="flex justify-end mb-3"><button className={btn.ghost} onClick={() => downloadCsv('goods-receipts.csv', list.flatMap(g => g.lines.map(l => ({ GRN: g.grnNo, Date: g.date, PO: g.poNo, Vendor: g.vendorName, Invoice: g.invoiceNo, Item: l.description, Accepted: l.accepted, Rejected: l.rejected, 'Received by': g.receivedBy }))))}><Download className="w-4 h-4" />CSV</button></div>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-3">GRN</th><th className="p-3">PO</th><th className="p-3">Vendor</th><th className="p-3">Invoice</th><th className="p-3">Items</th><th className="p-3">By</th></tr></thead>
          <tbody>{list.map(g => <tr key={g.id} className="border-b border-vriddhi-border/50"><td className="p-3 font-mono text-xs">{g.grnNo}<div className="text-vriddhi-muted">{fmtDate(g.date)}</div></td><td className="p-3 font-mono text-xs">{g.poNo}</td><td className="p-3">{g.vendorName}</td><td className="p-3">{g.invoiceNo || '—'}</td><td className="p-3 text-xs">{g.lines.map(l => `${l.description} × ${l.accepted}${l.rejected ? ` (${l.rejected} rej.)` : ''}`).join(', ')}{g.stockPosted > 0 && <Badge tone="teal">stock updated</Badge>}</td><td className="p-3">{g.receivedBy}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  )
}
