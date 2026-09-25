// /admin/vendor-bills — vendor invoices: entered by operations or accounts,
// approved and paid (payment recorded) by the accounts team. TDS is
// computed from the college's sections; MSME bills are flagged after 45
// days (MSMED Act). No money moves from the app — the bank reference is
// recorded against the bill.

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Download, FileText, IndianRupee, Plus, Receipt, Wallet } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { roleHasPermission } from '@/modules/auth/permissions'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, Modal, PageHeader, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate, inr } from '../components/officeUi'
import ProcurementSettingsForm from '../components/procurement/ProcurementSettingsForm'
import { approveVendorBill, billPayState, cancelVendorBill, createVendorBill, previewBill, recordBillPayment, type PurchaseOrder, type Vendor, type VendorBill } from '../api/procurementApi'
import { useProcurementRefresh, useProcurementSettings, usePurchaseOrders, useVendorBills, useVendors } from '../hooks/useProcurement'
import { useBranding } from '../hooks/useLibrary'
import { financialYear, todayIso } from '../api/officeDb'
import { addDays } from '../utils/libraryEngine'
import { downloadReportPdf, pdfMoney } from '../utils/reportPdf'
import { amountInWords } from '@/modules/admin/utils/payrollEngine'
import type { ProcurementSettings } from '../utils/procurementEngine'

type Filter = 'pending' | 'payable' | 'paid' | 'all' | 'tds' | 'settings'
const MODES = ['neft', 'rtgs', 'imps', 'upi', 'cheque', 'dd', 'cash']
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

export default function VendorBillsPage() {
  const { user } = useAuth()
  const isFinance = roleHasPermission((user?.role || 'student') as never, 'vendorBills.manage')
  const { settings, loading } = useProcurementSettings()
  const billsQ = useVendorBills()
  const vendorsQ = useVendors()
  const posQ = usePurchaseOrders()
  const [filter, setFilter] = useState<Filter>('pending')
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState<VendorBill | null>(null)
  const today = todayIso()
  const vendors = vendorsQ.data || []
  const msme = useMemo(() => new Set(vendors.filter(v => v.msme).map(v => v.id)), [vendors])

  const bills = billsQ.data || []
  const live = bills.filter(b => b.status !== 'cancelled')
  const payable = live.filter(b => b.status === 'approved' && billPayState(b) !== 'paid')
  const outstanding = live.filter(b => billPayState(b) !== 'paid').reduce((s, b) => s + (b.net - b.paid), 0)
  const overdue = payable.filter(b => b.dueDate && b.dueDate < today)
  const msmeLate = live.filter(b => msme.has(b.vendorId) && billPayState(b) !== 'paid' && b.invoiceDate && daysBetween(b.invoiceDate, today) > 45)
  const fy = financialYear()
  const tdsFy = live.filter(b => b.invoiceDate && financialYear(new Date(b.invoiceDate)) === fy).reduce((s, b) => s + b.tdsAmount, 0)

  const lists: Record<Exclude<Filter, 'tds' | 'settings'>, VendorBill[]> = {
    pending: live.filter(b => b.status === 'pending'),
    payable,
    paid: live.filter(b => billPayState(b) === 'paid'),
    all: bills,
  }

  const tdsCsv = () =>
    downloadCsv(`tds-${fy}.csv`, live.filter(b => b.tdsAmount > 0).map(b => {
      const v = vendors.find(x => x.id === b.vendorId)
      return { Bill: b.billNo, 'Invoice date': b.invoiceDate, Vendor: b.vendorName, PAN: v?.pan || '', Section: b.tdsSection, 'Amount paid/credited': b.taxable, 'TDS ₹': b.tdsAmount, 'Paid on': b.payments.map(p => p.date).join('; ') }
    }))

  if (loading || billsQ.isLoading) return <div className="p-6"><Loading /></div>
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="Vendor Bills" subtitle={isFinance ? 'Approve bills, record payments and track TDS' : 'Enter supplier invoices for the accounts team'} icon={<Receipt className="w-5 h-5" />}
        actions={<button className={btn.primary} onClick={() => setCreating(true)}><Plus className="w-4 h-4" />Enter bill</button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Outstanding" value={inr(outstanding)} icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Overdue" value={overdue.length} icon={<AlertTriangle className="w-5 h-5" />} tone={overdue.length ? 'text-red-500' : undefined} hint={inr(overdue.reduce((s, b) => s + b.net - b.paid, 0))} />
        <StatCard label="MSME > 45 days" value={msmeLate.length} icon={<AlertTriangle className="w-5 h-5" />} tone={msmeLate.length ? 'text-amber-500' : undefined} hint="Pay within 45 days (MSMED Act)" />
        <StatCard label={`TDS deducted ${fy}`} value={inr(tdsFy)} icon={<IndianRupee className="w-5 h-5" />} />
      </div>
      <PillTabs value={filter} onChange={setFilter} options={[
        { id: 'pending', label: 'To approve', count: lists.pending.length },
        { id: 'payable', label: 'Payable', count: lists.payable.length },
        { id: 'paid', label: 'Paid' },
        { id: 'all', label: 'All' },
        { id: 'tds', label: 'TDS' },
        ...(isFinance ? [{ id: 'settings' as Filter, label: 'Settings' }] : []),
      ]} />
      <div className="mt-4">
        {filter === 'settings' ? <ProcurementSettingsForm settings={settings} /> : filter === 'tds' ? (
          <TdsSummary bills={live} onCsv={tdsCsv} />
        ) : !lists[filter].length ? <Empty icon={<Receipt className="w-8 h-8" />} title="No bills here" /> : (
          <>
            <div className="flex justify-end mb-2"><button className={btn.ghost} onClick={() => downloadCsv('vendor-bills.csv', lists[filter].map(b => ({ Bill: b.billNo, Vendor: b.vendorName, 'Vendor invoice': b.vendorInvoiceNo, 'Invoice date': b.invoiceDate, PO: b.poNo, 'Budget head': b.budgetHead, Taxable: b.taxable, GST: b.gst, Gross: b.gross, TDS: b.tdsAmount, Other: b.otherDeduction, Net: b.net, Paid: b.paid, Due: b.dueDate, Status: b.status })))}><Download className="w-4 h-4" />CSV</button></div>
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-3">Bill</th><th className="p-3">Vendor</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Net payable</th><th className="p-3 text-right">Paid</th><th className="p-3">Due</th><th className="p-3">Status</th></tr></thead>
                <tbody>
                  {lists[filter].map(b => {
                    const ps = billPayState(b)
                    const late = b.dueDate && b.dueDate < today && ps !== 'paid' && b.status !== 'cancelled'
                    return (
                      <tr key={b.id} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-border/20 cursor-pointer" onClick={() => setOpen(b)}>
                        <td className="p-3 font-mono text-xs">{b.billNo}<div className="text-vriddhi-muted">inv {b.vendorInvoiceNo}</div></td>
                        <td className="p-3">{b.vendorName}{msme.has(b.vendorId) && <span className="ml-1"><Badge tone="purple">MSME</Badge></span>}<div className="text-xs text-vriddhi-muted">{b.poNo || b.description}</div></td>
                        <td className="p-3 text-right">{inr(b.gross)}</td>
                        <td className="p-3 text-right">{inr(b.net)}</td>
                        <td className="p-3 text-right">{inr(b.paid)}</td>
                        <td className={`p-3 ${late ? 'text-red-500 font-medium' : ''}`}>{b.dueDate ? fmtDate(b.dueDate) : '—'}</td>
                        <td className="p-3"><Badge tone={b.status === 'cancelled' ? 'slate' : b.status === 'pending' ? 'amber' : ps === 'paid' ? 'green' : ps === 'partial' ? 'blue' : 'teal'}>{b.status === 'pending' ? 'To approve' : b.status === 'cancelled' ? 'Cancelled' : ps === 'paid' ? 'Paid' : ps === 'partial' ? 'Part paid' : 'Approved'}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {creating && <NewBillModal settings={settings} vendors={vendors.filter(v => v.active)} pos={posQ.data || []} bills={bills} onClose={() => setCreating(false)} />}
      {open && <BillModal bill={open} vendor={vendors.find(v => v.id === open.vendorId)} isFinance={isFinance} onClose={() => setOpen(null)} />}
    </div>
  )
}

function TdsSummary({ bills, onCsv }: { bills: VendorBill[]; onCsv: () => void }) {
  const bySection = useMemo(() => {
    const m: Record<string, { count: number; base: number; tds: number }> = {}
    for (const b of bills) {
      if (b.tdsAmount <= 0) continue
      const k = b.tdsSection
      m[k] = m[k] || { count: 0, base: 0, tds: 0 }
      m[k].count += 1
      m[k].base += b.taxable
      m[k].tds += b.tdsAmount
    }
    return Object.entries(m)
  }, [bills])
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">TDS by section</h3><button className={btn.ghost} onClick={onCsv}><Download className="w-4 h-4" />Deductee-wise CSV</button></div>
      {!bySection.length ? <p className="text-sm text-vriddhi-muted">No TDS deducted yet.</p> : (
        <table className="w-full text-sm"><thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="py-2">Section</th><th className="py-2 text-right">Bills</th><th className="py-2 text-right">Amount credited</th><th className="py-2 text-right">TDS</th></tr></thead>
          <tbody>{bySection.map(([k, v]) => <tr key={k} className="border-b border-vriddhi-border/40"><td className="py-2">{k}</td><td className="py-2 text-right">{v.count}</td><td className="py-2 text-right">{inr(v.base)}</td><td className="py-2 text-right">{inr(v.tds)}</td></tr>)}</tbody></table>
      )}
      <p className="text-xs text-vriddhi-muted mt-3">Use this for challan 281 deposits and quarterly 26Q returns. Deposit TDS by the 7th of the following month.</p>
    </div>
  )
}

function NewBillModal({ settings, vendors, pos, bills, onClose }: { settings: ProcurementSettings; vendors: Vendor[]; pos: PurchaseOrder[]; bills: VendorBill[]; onClose: () => void }) {
  const refresh = useProcurementRefresh()
  const { showSuccess, showError } = useNotification()
  const [vendorId, setVendorId] = useState('')
  const [poId, setPoId] = useState('')
  const [vendorInvoiceNo, setInvNo] = useState('')
  const [invoiceDate, setInvDate] = useState(todayIso())
  const [description, setDescription] = useState('')
  const [budgetHead, setBudgetHead] = useState('')
  const [taxable, setTaxable] = useState(0)
  const [gst, setGst] = useState(0)
  const [tdsSection, setTds] = useState('none')
  const [otherDeduction, setOther] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const vendor = vendors.find(v => v.id === vendorId)
  const vendorPos = pos.filter(p => p.vendorId === vendorId && p.status !== 'cancelled')
  const po = vendorPos.find(p => p.id === poId)
  const p = previewBill({ taxable, gst, tdsSection, otherDeduction }, settings)
  const termDays = vendor?.msme ? Math.min(45, settings.paymentTermsDays || 45) : settings.paymentTermsDays
  const due = dueDate || (invoiceDate ? addDays(invoiceDate, termDays) : '')
  const pickVendor = (id: string) => {
    setVendorId(id)
    setPoId('')
    const v = vendors.find(x => x.id === id)
    if (v) setTds(v.tdsSection || 'none')
  }
  const pickPo = (id: string) => {
    setPoId(id)
    const o = vendorPos.find(x => x.id === id)
    if (!o) return
    const billedTaxable = bills.filter(b => b.poId === o.id && b.status !== 'cancelled').reduce((s, b) => s + b.taxable, 0)
    const ratio = o.totals.taxable > 0 ? Math.max(0, o.totals.taxable - billedTaxable) / o.totals.taxable : 0
    setTaxable(Math.round(o.totals.taxable * ratio * 100) / 100)
    setGst(Math.round((o.totals.cgst + o.totals.sgst + o.totals.igst) * ratio * 100) / 100)
    setBudgetHead(o.budgetHead)
    setDescription(o.lines.map(l => l.description).slice(0, 3).join(', '))
  }
  const m = useMutation({
    mutationFn: () => {
      if (!vendor) throw new Error('Choose a vendor.')
      return createVendorBill({ vendor, po, vendorInvoiceNo, invoiceDate, description, budgetHead, taxable, gst, tdsSection, otherDeduction, dueDate: due }, settings)
    },
    onSuccess: () => { showSuccess('Bill entered — awaiting approval by accounts'); refresh(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title="Enter vendor bill" wide footer={<><span className="mr-auto text-sm">Net payable <b>{inr(p.net)}</b></span><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save bill'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Vendor *"><select className="input-field" value={vendorId} onChange={e => pickVendor(e.target.value)}><option value="">Choose…</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></Field>
        <Field label="Against PO" hint="Prefills the unbilled balance"><select className="input-field" value={poId} disabled={!vendorId} onChange={e => pickPo(e.target.value)}><option value="">No PO (direct bill)</option>{vendorPos.map(o => <option key={o.id} value={o.id}>{o.poNo} · {inr(o.totals.grandTotal)}</option>)}</select></Field>
        <Field label="Vendor invoice no. *"><input className="input-field" value={vendorInvoiceNo} onChange={e => setInvNo(e.target.value)} /></Field>
        <Field label="Invoice date"><input type="date" className="input-field" value={invoiceDate} onChange={e => setInvDate(e.target.value)} /></Field>
        <Field label="Description" className="sm:col-span-2"><input className="input-field" value={description} onChange={e => setDescription(e.target.value)} /></Field>
        <Field label="Budget head"><select className="input-field" value={budgetHead} onChange={e => setBudgetHead(e.target.value)}><option value="">—</option>{settings.budgetHeads.map(b => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Due date" hint={vendor?.msme ? 'MSME vendor — 45 days max' : `Default ${termDays} days`}><input type="date" className="input-field" value={due} onChange={e => setDueDate(e.target.value)} /></Field>
        <Field label="Taxable value ₹ *"><input type="number" className="input-field" value={taxable || ''} onChange={e => setTaxable(Number(e.target.value) || 0)} /></Field>
        <Field label="GST ₹"><input type="number" className="input-field" value={gst || ''} onChange={e => setGst(Number(e.target.value) || 0)} /></Field>
        <Field label="TDS section"><select className="input-field" value={tdsSection} onChange={e => setTds(e.target.value)}>{settings.tdsSections.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}</select></Field>
        <Field label="Other deductions ₹" hint="Retention, penalty, advance adjusted"><input type="number" className="input-field" value={otherDeduction || ''} onChange={e => setOther(Number(e.target.value) || 0)} /></Field>
      </div>
      <div className="mt-4 p-3 rounded-xl bg-vriddhi-border/20 text-sm grid grid-cols-3 gap-2">
        <div><p className="text-xs text-vriddhi-muted">Gross</p>{inr(p.gross)}</div>
        <div><p className="text-xs text-vriddhi-muted">TDS</p>{inr(p.tdsAmount)}</div>
        <div><p className="text-xs text-vriddhi-muted">Net payable</p><b>{inr(p.net)}</b></div>
      </div>
    </Modal>
  )
}

function BillModal({ bill, vendor, isFinance, onClose }: { bill: VendorBill; vendor?: Vendor; isFinance: boolean; onClose: () => void }) {
  const refresh = useProcurementRefresh()
  const branding = useBranding()
  const { showSuccess, showError } = useNotification()
  const [pay, setPay] = useState({ date: todayIso(), amount: Math.max(0, Math.round((bill.net - bill.paid) * 100) / 100), mode: 'neft', ref: '' })
  const [reason, setReason] = useState('')
  const ps = billPayState(bill)
  const done = () => { refresh(); onClose() }
  const approve = useMutation({ mutationFn: () => approveVendorBill(bill.id), onSuccess: () => { showSuccess('Bill approved for payment'); done() }, onError: e => showError(errMsg(e)) })
  const cancel = useMutation({ mutationFn: () => { if (!reason.trim()) throw new Error('Give a reason.'); return cancelVendorBill(bill.id, reason) }, onSuccess: () => { showSuccess('Bill cancelled'); done() }, onError: e => showError(errMsg(e)) })
  const record = useMutation({ mutationFn: () => recordBillPayment(bill, pay), onSuccess: () => { showSuccess('Payment recorded'); done() }, onError: e => showError(errMsg(e)) })
  const voucher = (p: VendorBill['payments'][number], i: number) =>
    downloadReportPdf({
      collegeName: branding.collegeName || 'College',
      address: branding.address,
      title: 'PAYMENT VOUCHER',
      subtitle: `${bill.billNo}-P${i + 1} · ${fmtDate(p.date)}`,
      sections: [
        { heading: 'Paid to', rows: [['Vendor', bill.vendorName], ['PAN', vendor?.pan || '—'], ['GSTIN', vendor?.gstin || '—'], ['Bank', vendor ? `${vendor.bank.bankName} ${vendor.bank.accountNo} ${vendor.bank.ifsc}` : '—']] },
        { heading: 'Against', rows: [['Bill', bill.billNo], ['Vendor invoice', `${bill.vendorInvoiceNo} dt ${fmtDate(bill.invoiceDate)}`], ['PO', bill.poNo || '—'], ['Budget head', bill.budgetHead || '—'], ['Gross', pdfMoney(bill.gross)], [`TDS (${bill.tdsSection})`, pdfMoney(bill.tdsAmount)], ['Other deductions', pdfMoney(bill.otherDeduction)], ['Net payable', pdfMoney(bill.net)]] },
        { heading: 'Payment', rows: [['Amount', pdfMoney(p.amount)], ['In words', amountInWords(p.amount)], ['Mode', p.mode.toUpperCase()], ['Reference', p.ref || '—'], ['Recorded by', p.by]] },
        { heading: '', note: '\n\nPrepared by                         Checked by                         Authorised signatory' },
      ],
      filename: `voucher-${bill.billNo.replace(/\//g, '-')}-${i + 1}.pdf`,
    })
  return (
    <Modal open onClose={onClose} title={`${bill.billNo} · ${bill.vendorName}`} wide footer={<>
      {isFinance && bill.status !== 'cancelled' && !bill.paid && <button className={`${btn.danger} mr-auto`} disabled={cancel.isPending} onClick={() => cancel.mutate()}>Cancel bill</button>}
      {isFinance && bill.status === 'pending' && <button className={btn.primary} disabled={approve.isPending} onClick={() => approve.mutate()}><CheckCircle2 className="w-4 h-4" />Approve for payment</button>}
      {isFinance && bill.status === 'approved' && ps !== 'paid' && <button className={btn.primary} disabled={record.isPending} onClick={() => record.mutate()}><IndianRupee className="w-4 h-4" />Record payment</button>}
    </>}>
      <div className="grid sm:grid-cols-4 gap-3 text-sm mb-4">
        <div><p className="text-xs text-vriddhi-muted">Invoice</p>{bill.vendorInvoiceNo} · {fmtDate(bill.invoiceDate)}</div>
        <div><p className="text-xs text-vriddhi-muted">PO</p>{bill.poNo || '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Budget head</p>{bill.budgetHead || '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Due</p>{bill.dueDate ? fmtDate(bill.dueDate) : '—'}</div>
        <div><p className="text-xs text-vriddhi-muted">Taxable + GST</p>{inr(bill.taxable)} + {inr(bill.gst)}</div>
        <div><p className="text-xs text-vriddhi-muted">TDS ({bill.tdsSection})</p>{inr(bill.tdsAmount)}</div>
        <div><p className="text-xs text-vriddhi-muted">Net payable</p><b>{inr(bill.net)}</b></div>
        <div><p className="text-xs text-vriddhi-muted">Paid</p>{inr(bill.paid)}</div>
      </div>
      {bill.description && <p className="text-sm mb-3">{bill.description}</p>}
      <p className="text-xs text-vriddhi-muted mb-3">Entered by {bill.enteredBy}{bill.approvedBy ? ` · approved by ${bill.approvedBy} on ${fmtDate(bill.approvedAt)}` : ''}</p>
      {vendor && (vendor.bank.accountNo || vendor.bank.ifsc) && <p className="text-xs mb-3 p-2 rounded-lg bg-vriddhi-border/20">Pay to: {vendor.bank.accountName || vendor.name} · {vendor.bank.bankName} · A/c {vendor.bank.accountNo} · IFSC {vendor.bank.ifsc}</p>}
      {bill.payments.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-vriddhi-muted mb-1">Payments</p>
          {bill.payments.map((p, i) => <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-vriddhi-border/40"><span>{fmtDate(p.date)} · {p.mode.toUpperCase()} {p.ref} · {inr(p.amount)} <span className="text-xs text-vriddhi-muted">by {p.by}</span></span><button className={btn.small} onClick={() => voucher(p, i)}><FileText className="w-3 h-3" />Voucher</button></div>)}
        </div>
      )}
      {isFinance && bill.status === 'approved' && ps !== 'paid' && (
        <div className="grid sm:grid-cols-4 gap-3 p-3 rounded-xl border border-vriddhi-border">
          <p className="sm:col-span-4 text-xs text-vriddhi-muted">Record a payment already made through the bank. Vriddhi does not transfer money.</p>
          <Field label="Paid on"><input type="date" className="input-field" value={pay.date} onChange={e => setPay({ ...pay, date: e.target.value })} /></Field>
          <Field label="Amount ₹"><input type="number" className="input-field" value={pay.amount || ''} onChange={e => setPay({ ...pay, amount: Number(e.target.value) || 0 })} /></Field>
          <Field label="Mode"><select className="input-field" value={pay.mode} onChange={e => setPay({ ...pay, mode: e.target.value })}>{MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}</select></Field>
          <Field label="UTR / cheque no."><input className="input-field" value={pay.ref} onChange={e => setPay({ ...pay, ref: e.target.value })} /></Field>
        </div>
      )}
      {isFinance && bill.status !== 'cancelled' && !bill.paid && <Field label="Cancellation reason" className="mt-3"><input className="input-field" value={reason} onChange={e => setReason(e.target.value)} /></Field>}
    </Modal>
  )
}
