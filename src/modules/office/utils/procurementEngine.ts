// src/modules/office/utils/procurementEngine.ts
//
// Pure procurement rules: GST line maths (CGST+SGST within the state, IGST
// across states), the college's purchase-approval chain, TDS on vendor
// bills and PO-vs-receipt tracking. Settings live in
// colleges/{id}/config/procurement. Unit tested.

export type ApproverRole = 'hod' | 'principal' | 'accounts' | 'operations'

export interface ApprovalStep {
  role: ApproverRole
  /** Step applies when the estimated total is at least this (₹). */
  minAmount: number
  label: string
}

export interface TdsSection {
  code: string
  label: string
  rate: number
  /** Deduct only when the bill is at least this (₹); 0 = always. */
  threshold: number
}

export interface ProcurementSettings {
  approvalChain: ApprovalStep[]
  prPrefix: string
  poPrefix: string
  grnPrefix: string
  billPrefix: string
  collegeGstin: string
  collegeState: string
  deliveryAddress: string
  defaultGstRate: number
  gstRates: number[]
  /** Quotations required when a request is at least this (₹); 0 = never. */
  quotationsAbove: number
  quotationsRequired: number
  poTerms: string
  tdsSections: TdsSection[]
  budgetHeads: string[]
  paymentTermsDays: number
}

export const DEFAULT_PROCUREMENT_SETTINGS: ProcurementSettings = {
  approvalChain: [
    { role: 'hod', minAmount: 0, label: 'Head of department' },
    { role: 'principal', minAmount: 0, label: 'Principal' },
  ],
  prPrefix: 'PR',
  poPrefix: 'PO',
  grnPrefix: 'GRN',
  billPrefix: 'BILL',
  collegeGstin: '',
  collegeState: 'Karnataka',
  deliveryAddress: '',
  defaultGstRate: 18,
  gstRates: [0, 5, 12, 18, 28],
  quotationsAbove: 25000,
  quotationsRequired: 3,
  poTerms: '1. Supply as per specifications within the delivery date.\n2. Goods are subject to inspection and acceptance.\n3. Payment within 30 days of receipt of goods and a valid GST invoice.\n4. Please quote the PO number on the invoice.',
  tdsSections: [
    { code: 'none', label: 'No TDS', rate: 0, threshold: 0 },
    { code: '194C-I', label: '194C Contractor (individual/HUF) 1%', rate: 1, threshold: 30000 },
    { code: '194C', label: '194C Contractor (others) 2%', rate: 2, threshold: 30000 },
    { code: '194J', label: '194J Professional / technical 10%', rate: 10, threshold: 30000 },
    { code: '194I', label: '194I Rent 10%', rate: 10, threshold: 240000 },
    { code: '194Q', label: '194Q Purchase of goods 0.1%', rate: 0.1, threshold: 0 },
  ],
  budgetHeads: ['Library', 'Laboratory', 'Computers & IT', 'Furniture', 'Maintenance', 'Stationery', 'Sports', 'Events', 'Miscellaneous'],
  paymentTermsDays: 30,
}

const nonNeg = (v: unknown, f: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : f
}
const round2 = (n: number) => Math.round(n * 100) / 100
const ROLES: ApproverRole[] = ['hod', 'principal', 'accounts', 'operations']

export function normalizeProcurementSettings(raw: Record<string, unknown> | null | undefined): ProcurementSettings {
  const r = raw || {}
  const d = DEFAULT_PROCUREMENT_SETTINGS
  const str = (v: unknown, f: string) => (typeof v === 'string' ? v : f)
  const prefix = (v: unknown, f: string) => (typeof v === 'string' && v.trim() ? v : f).toUpperCase().replace(/[^A-Z0-9-]/g, '') || f
  const chain = Array.isArray(r.approvalChain)
    ? (r.approvalChain as Array<Record<string, unknown>>)
        .filter(s => s && ROLES.includes(s.role as ApproverRole))
        .map(s => ({ role: s.role as ApproverRole, minAmount: nonNeg(s.minAmount, 0), label: str(s.label, String(s.role)) }))
    : d.approvalChain
  const tds = Array.isArray(r.tdsSections)
    ? (r.tdsSections as Array<Record<string, unknown>>)
        .filter(s => s && typeof s.code === 'string' && s.code)
        .map(s => ({ code: String(s.code), label: str(s.label, String(s.code)), rate: Math.min(100, nonNeg(s.rate, 0)), threshold: nonNeg(s.threshold, 0) }))
    : d.tdsSections
  const rates = Array.isArray(r.gstRates) ? (r.gstRates as unknown[]).map(Number).filter(n => Number.isFinite(n) && n >= 0 && n <= 100) : d.gstRates
  return {
    approvalChain: chain,
    prPrefix: prefix(r.prPrefix, d.prPrefix),
    poPrefix: prefix(r.poPrefix, d.poPrefix),
    grnPrefix: prefix(r.grnPrefix, d.grnPrefix),
    billPrefix: prefix(r.billPrefix, d.billPrefix),
    collegeGstin: str(r.collegeGstin, d.collegeGstin).toUpperCase().trim(),
    collegeState: str(r.collegeState, d.collegeState),
    deliveryAddress: str(r.deliveryAddress, d.deliveryAddress),
    defaultGstRate: nonNeg(r.defaultGstRate, d.defaultGstRate),
    gstRates: rates.length ? Array.from(new Set(rates)).sort((a, b) => a - b) : d.gstRates,
    quotationsAbove: nonNeg(r.quotationsAbove, d.quotationsAbove),
    quotationsRequired: Math.floor(nonNeg(r.quotationsRequired, d.quotationsRequired)),
    poTerms: str(r.poTerms, d.poTerms),
    tdsSections: tds.length ? tds : d.tdsSections,
    budgetHeads: Array.isArray(r.budgetHeads) ? (r.budgetHeads as unknown[]).map(String).filter(Boolean) : d.budgetHeads,
    paymentTermsDays: Math.floor(nonNeg(r.paymentTermsDays, d.paymentTermsDays)),
  }
}

// ─── GST ──────────────────────────────────────────────────
export interface OrderLine {
  description: string
  qty: number
  unit: string
  rate: number
  gstRate: number
  discountPct?: number
}

export interface LineTotals {
  taxable: number
  gst: number
  total: number
}

export function lineTotals(l: OrderLine): LineTotals {
  const gross = (Number(l.qty) || 0) * (Number(l.rate) || 0)
  const taxable = gross * (1 - Math.min(100, Math.max(0, Number(l.discountPct) || 0)) / 100)
  const gst = taxable * (Math.max(0, Number(l.gstRate) || 0) / 100)
  return { taxable: round2(taxable), gst: round2(gst), total: round2(taxable + gst) }
}

export interface OrderTotals {
  taxable: number
  cgst: number
  sgst: number
  igst: number
  total: number
  roundOff: number
  grandTotal: number
}

/** Inter-state supply → IGST; otherwise CGST + SGST split equally. Grand total rounded to the rupee. */
export function orderTotals(lines: OrderLine[], interState: boolean): OrderTotals {
  let taxable = 0
  let gst = 0
  for (const l of lines) {
    const t = lineTotals(l)
    taxable += t.taxable
    gst += t.gst
  }
  taxable = round2(taxable)
  gst = round2(gst)
  const half = round2(gst / 2)
  const total = round2(taxable + gst)
  const grandTotal = Math.round(total)
  return {
    taxable,
    cgst: interState ? 0 : half,
    sgst: interState ? 0 : round2(gst - half),
    igst: interState ? gst : 0,
    total,
    roundOff: round2(grandTotal - total),
    grandTotal,
  }
}

/** GSTIN state code (first two digits) — e.g. 29 = Karnataka. */
export function gstinStateCode(gstin: string): string {
  const m = String(gstin || '').trim().match(/^(\d{2})[A-Z0-9]{13}$/i)
  return m ? m[1] : ''
}

export function isValidGstin(gstin: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(String(gstin || '').trim())
}

/** Decide inter-state from the two GSTINs; falls back to comparing state names. */
export function isInterState(collegeGstin: string, vendorGstin: string, collegeState: string, vendorState: string): boolean {
  const a = gstinStateCode(collegeGstin)
  const b = gstinStateCode(vendorGstin)
  if (a && b) return a !== b
  if (collegeState && vendorState) return collegeState.trim().toLowerCase() !== vendorState.trim().toLowerCase()
  return false
}

// ─── Approval chain ───────────────────────────────────────
export interface ApprovalRecord {
  role: ApproverRole
  decision: 'approved' | 'rejected'
  by: string
  uid: string
  at: string
  note: string
}

/** Steps that apply to a request of this amount (skips HOD when a HOD raised it). */
export function requiredSteps(chain: ApprovalStep[], amount: number, raisedByRole: string): ApprovalStep[] {
  return chain.filter(s => amount >= s.minAmount && !(s.role === 'hod' && (raisedByRole === 'hod' || raisedByRole === 'admin')))
}

export function nextStep(chain: ApprovalStep[], amount: number, raisedByRole: string, approvals: ApprovalRecord[]): ApprovalStep | null {
  const done = new Set(approvals.filter(a => a.decision === 'approved').map(a => a.role))
  return requiredSteps(chain, amount, raisedByRole).find(s => !done.has(s.role)) || null
}

/** Can a user with this role act on the step? admin ≡ HOD; principal/superadmin may act on any step. */
export function canActOnStep(step: ApprovalStep | null, userRole: string): boolean {
  if (!step) return false
  if (userRole === 'superadmin' || userRole === 'principal') return true
  if (step.role === 'hod') return userRole === 'hod' || userRole === 'admin'
  return step.role === userRole
}

// ─── TDS / bills ──────────────────────────────────────────
export function computeTds(taxable: number, section: TdsSection | undefined): number {
  if (!section || section.rate <= 0) return 0
  if (section.threshold > 0 && taxable < section.threshold) return 0
  // TDS is on the amount excluding GST
  return Math.round(taxable * (section.rate / 100))
}

export function billNet(gross: number, tds: number, otherDeduction: number): number {
  return round2(Math.max(0, (Number(gross) || 0) - (Number(tds) || 0) - (Number(otherDeduction) || 0)))
}

export function billPaymentStatus(net: number, paid: number): 'unpaid' | 'partial' | 'paid' {
  if (paid <= 0) return 'unpaid'
  return paid + 0.005 >= net ? 'paid' : 'partial'
}

// ─── Receipts vs order ────────────────────────────────────
export function receiptStatus(lines: Array<{ qty: number; receivedQty?: number }>): 'pending' | 'partial' | 'received' {
  const ordered = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const received = lines.reduce((s, l) => s + Math.min(Number(l.qty) || 0, Number(l.receivedQty) || 0), 0)
  if (received <= 0) return 'pending'
  return received + 1e-9 >= ordered ? 'received' : 'partial'
}
