// src/modules/office/api/procurementApi.ts
//
// Purchase-to-pay: vendors → purchase requests (department, approval chain)
// → purchase orders (GST) → goods receipts (auto stock-in for consumables)
// → vendor bills (TDS, payments recorded by accounts; no disbursement from
// the app — the payment is made through the college's bank and the
// reference is recorded here).
//
//   colleges/{cid}/vendors, purchaseRequests, purchaseOrders,
//   goodsReceipts, vendorBills, config/procurement

import { addDoc, arrayUnion, doc as fsDoc, getDoc, getDocs, limit, query, runTransaction, setDoc, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import { actor, clean, financialYear, formatDocNo, nextCounter, nowIso, num, officeCol, officeDoc, str, todayIso } from './officeDb'
import { recordMovement } from './inventoryApi'
import {
  billNet,
  billPaymentStatus,
  computeTds,
  isInterState,
  nextStep,
  normalizeProcurementSettings,
  orderTotals,
  receiptStatus,
  requiredSteps,
  type ApprovalRecord,
  type OrderLine,
  type OrderTotals,
  type ProcurementSettings,
} from '../utils/procurementEngine'

const MAX = 2000
const arr = <T>(v: unknown, map: (x: Record<string, unknown>) => T): T[] => (Array.isArray(v) ? (v as Record<string, unknown>[]).map(map) : [])
const docNo = async (prefix: string, kind: string) => formatDocNo(prefix, await nextCounter(`${kind}_${financialYear()}`))

// ─── Settings ─────────────────────────────────────────────
export async function fetchProcurementSettings(cid?: string): Promise<ProcurementSettings> {
  const snap = await getDoc(officeDoc('config', 'procurement', cid))
  return normalizeProcurementSettings(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
}
export async function saveProcurementSettings(s: ProcurementSettings): Promise<void> {
  await setDoc(officeDoc('config', 'procurement'), clean({ ...normalizeProcurementSettings(s as unknown as Record<string, unknown>), updatedAt: nowIso(), updatedBy: actor().name }))
}

// ─── Vendors ──────────────────────────────────────────────
export interface Vendor {
  id: string
  name: string
  gstin: string
  pan: string
  state: string
  address: string
  contactPerson: string
  phone: string
  email: string
  categories: string[]
  msme: boolean
  udyam: string
  tdsSection: string
  bank: { accountName: string; accountNo: string; ifsc: string; bankName: string }
  active: boolean
  note: string
}

export type VendorInput = Omit<Vendor, 'id'>

function mapVendor(id: string, r: DocumentData): Vendor {
  const b = (r.bank || {}) as Record<string, unknown>
  return {
    id,
    name: str(r.name),
    gstin: str(r.gstin),
    pan: str(r.pan),
    state: str(r.state),
    address: str(r.address),
    contactPerson: str(r.contactPerson),
    phone: str(r.phone),
    email: str(r.email),
    categories: Array.isArray(r.categories) ? r.categories.map(String) : [],
    msme: !!r.msme,
    udyam: str(r.udyam),
    tdsSection: str(r.tdsSection, 'none'),
    bank: { accountName: str(b.accountName), accountNo: str(b.accountNo), ifsc: str(b.ifsc), bankName: str(b.bankName) },
    active: r.active !== false,
    note: str(r.note),
  }
}

export async function fetchVendors(cid?: string): Promise<Vendor[]> {
  const snap = await getDocs(query(officeCol('vendors', cid), limit(MAX)))
  return snap.docs.map(d => mapVendor(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name))
}

export async function saveVendor(input: VendorInput, id?: string): Promise<string> {
  const data = clean({ ...input, name: input.name.trim(), gstin: input.gstin.trim().toUpperCase(), pan: input.pan.trim().toUpperCase(), updatedAt: nowIso(), updatedBy: actor().name })
  if (id) {
    await updateDoc(officeDoc('vendors', id), data)
    return id
  }
  const ref = await addDoc(officeCol('vendors'), { ...data, createdAt: nowIso() })
  return ref.id
}

// ─── Purchase requests ────────────────────────────────────
export type PrStatus = 'submitted' | 'approved' | 'rejected' | 'ordered' | 'cancelled'
export const PR_STATUS_LABEL: Record<PrStatus, string> = { submitted: 'Awaiting approval', approved: 'Approved', rejected: 'Rejected', ordered: 'PO raised', cancelled: 'Cancelled' }

export interface PrItem {
  description: string
  qty: number
  unit: string
  estRate: number
  itemId?: string
}

export interface Quotation {
  vendorName: string
  amount: number
  note: string
}

export interface PurchaseRequest {
  id: string
  prNo: string
  title: string
  department: string
  budgetHead: string
  neededBy: string
  justification: string
  items: PrItem[]
  quotations: Quotation[]
  estimatedTotal: number
  requestedBy: { uid: string; name: string; role: string }
  status: PrStatus
  approvals: ApprovalRecord[]
  poIds: string[]
  createdAt: string
}

function mapPr(id: string, r: DocumentData): PurchaseRequest {
  const rb = (r.requestedBy || {}) as Record<string, unknown>
  return {
    id,
    prNo: str(r.prNo),
    title: str(r.title),
    department: str(r.department),
    budgetHead: str(r.budgetHead),
    neededBy: str(r.neededBy),
    justification: str(r.justification),
    items: arr(r.items, x => ({ description: str(x.description), qty: num(x.qty), unit: str(x.unit, 'nos'), estRate: num(x.estRate), itemId: x.itemId ? str(x.itemId) : undefined })),
    quotations: arr(r.quotations, x => ({ vendorName: str(x.vendorName), amount: num(x.amount), note: str(x.note) })),
    estimatedTotal: num(r.estimatedTotal),
    requestedBy: { uid: str(rb.uid), name: str(rb.name), role: str(rb.role) },
    status: (str(r.status, 'submitted') as PrStatus),
    approvals: arr(r.approvals, x => ({ role: str(x.role) as ApprovalRecord['role'], decision: str(x.decision) as ApprovalRecord['decision'], by: str(x.by), uid: str(x.uid), at: str(x.at), note: str(x.note) })),
    poIds: Array.isArray(r.poIds) ? r.poIds.map(String) : [],
    createdAt: str(r.createdAt),
  }
}

export async function fetchPurchaseRequests(cid?: string): Promise<PurchaseRequest[]> {
  const snap = await getDocs(query(officeCol('purchaseRequests', cid), limit(MAX)))
  return snap.docs.map(d => mapPr(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createPurchaseRequest(
  input: Omit<PurchaseRequest, 'id' | 'prNo' | 'estimatedTotal' | 'requestedBy' | 'status' | 'approvals' | 'poIds' | 'createdAt'>,
  requester: { role: string },
  settings: ProcurementSettings,
): Promise<string> {
  const items = input.items.filter(i => i.description.trim() && i.qty > 0)
  if (!items.length) throw new Error('Add at least one item with a quantity.')
  const estimatedTotal = Math.round(items.reduce((s, i) => s + i.qty * i.estRate, 0) * 100) / 100
  if (settings.quotationsAbove > 0 && estimatedTotal >= settings.quotationsAbove && input.quotations.filter(q => q.vendorName.trim()).length < settings.quotationsRequired) {
    throw new Error(`Requests of ₹${settings.quotationsAbove.toLocaleString('en-IN')} or more need ${settings.quotationsRequired} quotations.`)
  }
  const me = actor()
  const prNo = await docNo(settings.prPrefix, 'pr')
  const ref = await addDoc(
    officeCol('purchaseRequests'),
    clean({
      ...input,
      items,
      quotations: input.quotations.filter(q => q.vendorName.trim()),
      prNo,
      estimatedTotal,
      requestedBy: { uid: me.uid, name: me.name, role: requester.role },
      status: 'submitted',
      approvals: [],
      poIds: [],
      createdAt: nowIso(),
    }),
  )
  // Nothing in the chain applies (e.g. an empty chain) → approved straight away.
  if (!requiredSteps(settings.approvalChain, estimatedTotal, requester.role).length) {
    await updateDoc(ref, { status: 'approved', updatedAt: nowIso() })
  }
  return ref.id
}

/** Record an approval/rejection for the current step; settles status when the chain completes. */
export async function decidePurchaseRequest(pr: PurchaseRequest, settings: ProcurementSettings, decision: 'approved' | 'rejected', note: string): Promise<void> {
  const step = nextStep(settings.approvalChain, pr.estimatedTotal, pr.requestedBy.role, pr.approvals)
  if (!step || pr.status !== 'submitted') throw new Error('This request is not awaiting approval.')
  const me = actor()
  const rec: ApprovalRecord = { role: step.role, decision, by: me.name, uid: me.uid, at: nowIso(), note: note.trim() }
  const approvals = [...pr.approvals, rec]
  const status: PrStatus = decision === 'rejected' ? 'rejected' : nextStep(settings.approvalChain, pr.estimatedTotal, pr.requestedBy.role, approvals) ? 'submitted' : 'approved'
  await updateDoc(officeDoc('purchaseRequests', pr.id), clean({ approvals, status, updatedAt: nowIso() }))
}

export async function cancelPurchaseRequest(id: string): Promise<void> {
  await updateDoc(officeDoc('purchaseRequests', id), { status: 'cancelled', updatedAt: nowIso() })
}

// ─── Purchase orders ──────────────────────────────────────
export type PoStatus = 'issued' | 'partial' | 'received' | 'closed' | 'cancelled'
export const PO_STATUS_LABEL: Record<PoStatus, string> = { issued: 'Issued', partial: 'Partly received', received: 'Received', closed: 'Closed', cancelled: 'Cancelled' }

export interface PoLine extends OrderLine {
  receivedQty: number
  itemId?: string
}

export interface PurchaseOrder {
  id: string
  poNo: string
  date: string
  vendorId: string
  vendorName: string
  vendorGstin: string
  vendorState: string
  vendorAddress: string
  prIds: string[]
  prNos: string[]
  department: string
  budgetHead: string
  lines: PoLine[]
  interState: boolean
  totals: OrderTotals
  deliveryBy: string
  deliveryAddress: string
  terms: string
  status: PoStatus
  createdBy: string
  createdAt: string
}

function mapPo(id: string, r: DocumentData): PurchaseOrder {
  const t = (r.totals || {}) as Record<string, unknown>
  return {
    id,
    poNo: str(r.poNo),
    date: str(r.date),
    vendorId: str(r.vendorId),
    vendorName: str(r.vendorName),
    vendorGstin: str(r.vendorGstin),
    vendorState: str(r.vendorState),
    vendorAddress: str(r.vendorAddress),
    prIds: Array.isArray(r.prIds) ? r.prIds.map(String) : [],
    prNos: Array.isArray(r.prNos) ? r.prNos.map(String) : [],
    department: str(r.department),
    budgetHead: str(r.budgetHead),
    lines: arr(r.lines, x => ({ description: str(x.description), qty: num(x.qty), unit: str(x.unit, 'nos'), rate: num(x.rate), gstRate: num(x.gstRate), discountPct: num(x.discountPct), receivedQty: num(x.receivedQty), itemId: x.itemId ? str(x.itemId) : undefined })),
    interState: !!r.interState,
    totals: { taxable: num(t.taxable), cgst: num(t.cgst), sgst: num(t.sgst), igst: num(t.igst), total: num(t.total), roundOff: num(t.roundOff), grandTotal: num(t.grandTotal) },
    deliveryBy: str(r.deliveryBy),
    deliveryAddress: str(r.deliveryAddress),
    terms: str(r.terms),
    status: str(r.status, 'issued') as PoStatus,
    createdBy: str(r.createdBy),
    createdAt: str(r.createdAt),
  }
}

export async function fetchPurchaseOrders(cid?: string): Promise<PurchaseOrder[]> {
  const snap = await getDocs(query(officeCol('purchaseOrders', cid), limit(MAX)))
  return snap.docs.map(d => mapPo(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface PoInput {
  vendor: Vendor
  prs: PurchaseRequest[]
  department: string
  budgetHead: string
  lines: Array<OrderLine & { itemId?: string }>
  deliveryBy: string
  deliveryAddress: string
  terms: string
  date?: string
}

export async function createPurchaseOrder(input: PoInput, settings: ProcurementSettings): Promise<string> {
  const lines = input.lines.filter(l => l.description.trim() && l.qty > 0)
  if (!lines.length) throw new Error('Add at least one line.')
  const interState = isInterState(settings.collegeGstin, input.vendor.gstin, settings.collegeState, input.vendor.state)
  const totals = orderTotals(lines, interState)
  const poNo = await docNo(settings.poPrefix, 'po')
  const ref = await addDoc(
    officeCol('purchaseOrders'),
    clean({
      poNo,
      date: input.date || todayIso(),
      vendorId: input.vendor.id,
      vendorName: input.vendor.name,
      vendorGstin: input.vendor.gstin,
      vendorState: input.vendor.state,
      vendorAddress: input.vendor.address,
      prIds: input.prs.map(p => p.id),
      prNos: input.prs.map(p => p.prNo),
      department: input.department,
      budgetHead: input.budgetHead,
      lines: lines.map(l => ({ ...l, receivedQty: 0 })),
      interState,
      totals,
      deliveryBy: input.deliveryBy,
      deliveryAddress: input.deliveryAddress,
      terms: input.terms,
      status: 'issued',
      createdBy: actor().name,
      createdAt: nowIso(),
    }),
  )
  await Promise.all(input.prs.map(p => updateDoc(officeDoc('purchaseRequests', p.id), { status: 'ordered', poIds: arrayUnion(ref.id), updatedAt: nowIso() })))
  return ref.id
}

export async function setPoStatus(id: string, status: 'closed' | 'cancelled'): Promise<void> {
  await updateDoc(officeDoc('purchaseOrders', id), { status, updatedAt: nowIso(), updatedBy: actor().name })
}

// ─── Goods receipts ───────────────────────────────────────
export interface GrnLine {
  lineIndex: number
  description: string
  accepted: number
  rejected: number
  itemId?: string
}

export interface GoodsReceipt {
  id: string
  grnNo: string
  poId: string
  poNo: string
  vendorName: string
  date: string
  invoiceNo: string
  invoiceDate: string
  lines: GrnLine[]
  note: string
  receivedBy: string
  stockPosted: number
  createdAt: string
}

function mapGrn(id: string, r: DocumentData): GoodsReceipt {
  return {
    id,
    grnNo: str(r.grnNo),
    poId: str(r.poId),
    poNo: str(r.poNo),
    vendorName: str(r.vendorName),
    date: str(r.date),
    invoiceNo: str(r.invoiceNo),
    invoiceDate: str(r.invoiceDate),
    lines: arr(r.lines, x => ({ lineIndex: num(x.lineIndex), description: str(x.description), accepted: num(x.accepted), rejected: num(x.rejected), itemId: x.itemId ? str(x.itemId) : undefined })),
    note: str(r.note),
    receivedBy: str(r.receivedBy),
    stockPosted: num(r.stockPosted),
    createdAt: str(r.createdAt),
  }
}

export async function fetchGoodsReceipts(cid?: string): Promise<GoodsReceipt[]> {
  const snap = await getDocs(query(officeCol('goodsReceipts', cid), limit(MAX)))
  return snap.docs.map(d => mapGrn(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Record goods received against a PO: updates received quantities (in a
 * transaction so two desks can't over-receive), then posts accepted
 * quantities of stock-linked lines into the consumables ledger at the PO rate.
 */
export async function receiveGoods(
  po: PurchaseOrder,
  input: { date: string; invoiceNo: string; invoiceDate: string; note: string; lines: GrnLine[] },
  settings: ProcurementSettings,
): Promise<{ grnNo: string; stockPosted: number }> {
  const lines = input.lines.filter(l => l.accepted > 0 || l.rejected > 0)
  if (!lines.length) throw new Error('Enter the quantity received for at least one line.')
  const grnNo = await docNo(settings.grnPrefix, 'grn')
  const poRef = officeDoc('purchaseOrders', po.id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(poRef)
    if (!snap.exists()) throw new Error('Purchase order not found.')
    const cur = mapPo(po.id, snap.data())
    if (cur.status === 'cancelled' || cur.status === 'closed') throw new Error('This PO is closed.')
    const updated = cur.lines.map((l, i) => {
      const g = lines.find(x => x.lineIndex === i)
      if (!g) return l
      if (l.receivedQty + g.accepted > l.qty + 1e-9) throw new Error(`"${l.description}": only ${l.qty - l.receivedQty} ${l.unit} left to receive.`)
      return { ...l, receivedQty: l.receivedQty + g.accepted }
    })
    const rs = receiptStatus(updated)
    tx.update(poRef, clean({ lines: updated, status: rs === 'received' ? 'received' : rs === 'partial' ? 'partial' : cur.status, updatedAt: nowIso() }))
    tx.set(
      doc0('goodsReceipts'),
      clean({ grnNo, poId: po.id, poNo: po.poNo, vendorName: po.vendorName, date: input.date, invoiceNo: input.invoiceNo, invoiceDate: input.invoiceDate, note: input.note, lines, receivedBy: actor().name, stockPosted: 0, createdAt: nowIso() }),
    )
  })
  let stockPosted = 0
  for (const g of lines) {
    const pl = po.lines[g.lineIndex]
    if (!g.itemId || g.accepted <= 0 || !pl) continue
    const landed = pl.rate * (1 - (pl.discountPct || 0) / 100)
    await recordMovement(g.itemId, { type: 'in', qty: g.accepted, rate: landed, date: input.date, vendor: po.vendorName, refNo: `${grnNo} / ${po.poNo}`, note: 'Goods receipt' })
    stockPosted += 1
  }
  if (stockPosted) {
    const snap = await getDocs(query(officeCol('goodsReceipts'), where('grnNo', '==', grnNo), limit(1)))
    if (!snap.empty) await updateDoc(snap.docs[0].ref, { stockPosted })
  }
  return { grnNo, stockPosted }
}

// new doc ref with auto id inside a collection (for transactions)
const doc0 = (name: string) => fsDoc(officeCol(name))

// ─── Vendor bills ─────────────────────────────────────────
export type BillStatus = 'pending' | 'approved' | 'cancelled'
export interface BillPayment {
  date: string
  amount: number
  mode: string
  ref: string
  by: string
  at: string
}

export interface VendorBill {
  id: string
  billNo: string
  vendorId: string
  vendorName: string
  vendorInvoiceNo: string
  invoiceDate: string
  poId: string
  poNo: string
  description: string
  budgetHead: string
  taxable: number
  gst: number
  gross: number
  tdsSection: string
  tdsAmount: number
  otherDeduction: number
  net: number
  dueDate: string
  status: BillStatus
  payments: BillPayment[]
  paid: number
  enteredBy: string
  approvedBy: string
  approvedAt: string
  createdAt: string
}

function mapBill(id: string, r: DocumentData): VendorBill {
  return {
    id,
    billNo: str(r.billNo),
    vendorId: str(r.vendorId),
    vendorName: str(r.vendorName),
    vendorInvoiceNo: str(r.vendorInvoiceNo),
    invoiceDate: str(r.invoiceDate),
    poId: str(r.poId),
    poNo: str(r.poNo),
    description: str(r.description),
    budgetHead: str(r.budgetHead),
    taxable: num(r.taxable),
    gst: num(r.gst),
    gross: num(r.gross),
    tdsSection: str(r.tdsSection, 'none'),
    tdsAmount: num(r.tdsAmount),
    otherDeduction: num(r.otherDeduction),
    net: num(r.net),
    dueDate: str(r.dueDate),
    status: str(r.status, 'pending') as BillStatus,
    payments: arr(r.payments, x => ({ date: str(x.date), amount: num(x.amount), mode: str(x.mode), ref: str(x.ref), by: str(x.by), at: str(x.at) })),
    paid: num(r.paid),
    enteredBy: str(r.enteredBy),
    approvedBy: str(r.approvedBy),
    approvedAt: str(r.approvedAt),
    createdAt: str(r.createdAt),
  }
}

export const billPayState = (b: VendorBill) => billPaymentStatus(b.net, b.paid)

export async function fetchVendorBills(cid?: string): Promise<VendorBill[]> {
  const snap = await getDocs(query(officeCol('vendorBills', cid), limit(MAX)))
  return snap.docs.map(d => mapBill(d.id, d.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export interface BillInput {
  vendor: Vendor
  po?: PurchaseOrder
  vendorInvoiceNo: string
  invoiceDate: string
  description: string
  budgetHead: string
  taxable: number
  gst: number
  tdsSection: string
  otherDeduction: number
  dueDate: string
}

export function previewBill(input: Pick<BillInput, 'taxable' | 'gst' | 'tdsSection' | 'otherDeduction'>, settings: ProcurementSettings) {
  const gross = Math.round(((Number(input.taxable) || 0) + (Number(input.gst) || 0)) * 100) / 100
  const tdsAmount = computeTds(Number(input.taxable) || 0, settings.tdsSections.find(s => s.code === input.tdsSection))
  return { gross, tdsAmount, net: billNet(gross, tdsAmount, input.otherDeduction) }
}

export async function createVendorBill(input: BillInput, settings: ProcurementSettings): Promise<string> {
  if (!input.vendorInvoiceNo.trim()) throw new Error("Enter the vendor's invoice number.")
  if (!(input.taxable > 0)) throw new Error('Enter the taxable amount.')
  const dup = await getDocs(query(officeCol('vendorBills'), where('vendorId', '==', input.vendor.id), where('vendorInvoiceNo', '==', input.vendorInvoiceNo.trim()), limit(1)))
  if (!dup.empty) throw new Error('This vendor invoice is already entered.')
  const p = previewBill(input, settings)
  const billNo = await docNo(settings.billPrefix, 'bill')
  const ref = await addDoc(
    officeCol('vendorBills'),
    clean({
      billNo,
      vendorId: input.vendor.id,
      vendorName: input.vendor.name,
      vendorInvoiceNo: input.vendorInvoiceNo.trim(),
      invoiceDate: input.invoiceDate,
      poId: input.po?.id || '',
      poNo: input.po?.poNo || '',
      description: input.description,
      budgetHead: input.budgetHead || input.po?.budgetHead || '',
      taxable: input.taxable,
      gst: input.gst,
      gross: p.gross,
      tdsSection: input.tdsSection,
      tdsAmount: p.tdsAmount,
      otherDeduction: input.otherDeduction || 0,
      net: p.net,
      dueDate: input.dueDate,
      status: 'pending',
      payments: [],
      paid: 0,
      enteredBy: actor().name,
      createdAt: nowIso(),
    }),
  )
  return ref.id
}

/** Accounts approves the bill for payment (books the liability). Only finance may update bills. */
export async function approveVendorBill(id: string): Promise<void> {
  await updateDoc(officeDoc('vendorBills', id), { status: 'approved', approvedBy: actor().name, approvedAt: nowIso(), updatedAt: nowIso() })
}
export async function cancelVendorBill(id: string, reason: string): Promise<void> {
  await updateDoc(officeDoc('vendorBills', id), clean({ status: 'cancelled', cancelReason: reason, updatedAt: nowIso(), updatedBy: actor().name }))
}

/** Record a payment made through the bank (the app does not move money). */
export async function recordBillPayment(bill: VendorBill, p: { date: string; amount: number; mode: string; ref: string }): Promise<void> {
  if (bill.status !== 'approved') throw new Error('Approve the bill before recording a payment.')
  const amount = Math.round(p.amount * 100) / 100
  if (!(amount > 0)) throw new Error('Enter the amount paid.')
  const ref = officeDoc('vendorBills', bill.id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    const cur = mapBill(bill.id, snap.data() || {})
    if (cur.paid + amount > cur.net + 0.005) throw new Error(`Only ₹${(cur.net - cur.paid).toFixed(2)} is outstanding on this bill.`)
    const pay: BillPayment = { date: p.date, amount, mode: p.mode, ref: p.ref.trim(), by: actor().name, at: nowIso() }
    tx.update(ref, { payments: [...cur.payments, pay], paid: Math.round((cur.paid + amount) * 100) / 100, updatedAt: nowIso() })
  })
}

export async function fetchBillsInRange(from: string, to: string, cid?: string): Promise<VendorBill[]> {
  const all = await fetchVendorBills(cid)
  return all.filter(b => b.status !== 'cancelled' && ((b.invoiceDate >= from && b.invoiceDate <= to) || b.payments.some(p => p.date >= from && p.date <= to)))
}

