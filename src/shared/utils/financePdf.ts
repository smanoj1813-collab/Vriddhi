// src/shared/utils/financePdf.ts
//
// PDF renderers for the finance module: fee receipt, faculty payslip, salary
// certificate and guest-faculty bill. All share one letterhead driven by the
// college's branding (Finance Settings → Receipts & letterhead), so every
// document is customised per college without code changes.
//
// jsPDF is lazily imported so it stays out of the main bundle. The built-in
// Helvetica font has no ₹ glyph, so amounts print as "Rs." / "INR".

import { loadPdfLibs } from './pdfRuntime'
import type { ReceiptModel } from '../../modules/admin/utils/financeReceipt'

type JsPDF = import('jspdf').jsPDF

export interface Letterhead {
  collegeName: string
  collegeCode?: string
  address?: string
  contact?: string
  registrationLine?: string
}

export interface MoneyLine {
  label: string
  amount: number
}

const LEFT = 40
const RIGHT = 555
const WIDTH = RIGHT - LEFT

export const rs = (n: number) =>
  `Rs. ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function newDoc(): Promise<JsPDF> {
  const { jsPDF } = await loadPdfLibs()
  return new jsPDF({ unit: 'pt', format: 'a4' })
}

function safeName(s: string): string {
  return String(s || 'document').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

/** Draws the centred college letterhead + document title; returns the next y. */
function drawLetterhead(doc: JsPDF, lh: Letterhead, title: string): number {
  let y = 50
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  doc.text(lh.collegeName || 'College', 297.5, y, { align: 'center' }); y += 15
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90)
  for (const line of [lh.address, lh.contact, lh.registrationLine, lh.collegeCode ? `College code: ${lh.collegeCode}` : '']) {
    if (!line) continue
    for (const wrapped of doc.splitTextToSize(line, WIDTH) as string[]) {
      doc.text(wrapped, 297.5, y, { align: 'center' }); y += 11
    }
  }
  y += 4
  doc.setDrawColor(20, 184, 166); doc.setLineWidth(1.2); doc.line(LEFT, y, RIGHT, y)
  doc.setDrawColor(0); doc.setLineWidth(0.6)
  y += 20
  doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text(title, 297.5, y, { align: 'center' })
  return y + 22
}

/** Two-column key/value grid. */
function drawKeyValues(doc: JsPDF, pairs: [string, string | undefined][], y: number): number {
  const rows = pairs.filter(([, v]) => v != null && v !== '')
  const colW = WIDTH / 2
  doc.setFontSize(9.5)
  for (let i = 0; i < rows.length; i += 2) {
    for (let c = 0; c < 2; c++) {
      const pair = rows[i + c]
      if (!pair) continue
      const x = LEFT + c * colW
      doc.setFont('helvetica', 'bold'); doc.text(pair[0], x, y)
      doc.setFont('helvetica', 'normal'); doc.text(String(pair[1]).slice(0, 48), x + 95, y)
    }
    y += 15
  }
  return y + 4
}

function drawSignature(doc: JsPDF, y: number, name?: string, designation?: string, rightLabel = true): number {
  y += 40
  const x = rightLabel ? RIGHT - 170 : LEFT
  doc.setLineWidth(0.5); doc.line(x, y, x + 170, y)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5)
  doc.text(name || 'Authorised Signatory', x + 85, y + 13, { align: 'center' })
  if (designation) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
    doc.text(designation, x + 85, y + 25, { align: 'center' })
  }
  return y + 34
}

function drawFooter(doc: JsPDF, text?: string) {
  if (!text) return
  doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120)
  const lines = doc.splitTextToSize(text, WIDTH) as string[]
  let y = 800 - lines.length * 10
  for (const l of lines) { doc.text(l, 297.5, y, { align: 'center' }); y += 10 }
  doc.setTextColor(0)
}

// ─── Fee receipt ──────────────────────────────────────────
export async function downloadReceiptPdf(model: ReceiptModel): Promise<void> {
  const doc = await newDoc()
  let y = drawLetterhead(doc, {
    collegeName: model.collegeName,
    collegeCode: model.collegeCode,
    address: model.collegeAddress,
    contact: model.collegeContact,
    registrationLine: model.registrationLine,
  }, model.title || 'FEE PAYMENT RECEIPT')

  y = drawKeyValues(doc, [
    ['Receipt No', model.receiptNo],
    ['Date', model.date],
    ['Student', model.studentName],
    ['Registration No', model.regNo],
    ['Course / Batch', [model.course, model.batch].filter(Boolean).join(' — ')],
    ['Fee', model.feeCategory],
    ['Payment mode', model.paymentMode ? model.paymentMode.toUpperCase() : undefined],
    ['Transaction ID', model.transactionId],
    ['Bank reference', model.bankReference],
  ], y)

  doc.line(LEFT, y, RIGHT, y); y += 16
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Particulars', LEFT, y); doc.text('Amount', RIGHT, y, { align: 'right' }); y += 14
  doc.setFont('helvetica', 'normal')
  for (const item of model.items) {
    doc.text(item.label, LEFT, y); doc.text(rs(item.amount), RIGHT, y, { align: 'right' }); y += 15
  }
  doc.line(LEFT, y, RIGHT, y); y += 18

  doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('Amount received', LEFT, y); doc.text(rs(model.amountReceived), RIGHT, y, { align: 'right' }); y += 20
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.text('Total fee', LEFT, y); doc.text(rs(model.totalFee), RIGHT, y, { align: 'right' }); y += 15
  doc.text('Total paid to date', LEFT, y); doc.text(rs(model.totalPaid), RIGHT, y, { align: 'right' }); y += 15
  if (model.showBalance !== false) {
    doc.text('Balance due', LEFT, y); doc.text(rs(model.balance), RIGHT, y, { align: 'right' }); y += 15
  }
  if (model.remarks) {
    y += 6
    for (const l of doc.splitTextToSize(`Remarks: ${model.remarks}`, WIDTH) as string[]) { doc.text(l, LEFT, y); y += 13 }
  }

  drawSignature(doc, y + 10, model.signatoryName, model.signatoryDesignation)
  drawFooter(doc, model.footer || 'This is a computer-generated receipt.')

  const tag = model.receiptNo && model.receiptNo !== '—' ? model.receiptNo : model.regNo || 'receipt'
  doc.save(`receipt-${safeName(tag)}.pdf`)
}

// ─── Payslip ──────────────────────────────────────────────
export interface PayslipPdfModel {
  letterhead: Letterhead
  payslipNo: string
  monthLabel: string
  status?: string
  employee: {
    name: string
    staffCode?: string
    designation?: string
    department?: string
    employmentType?: string
    joiningDate?: string
    pan?: string
    uan?: string
    bankName?: string
    accountNo?: string
  }
  daysInPeriod: number
  paidDays: number
  lopDays: number
  earnings: MoneyLine[]
  deductions: MoneyLine[]
  gross: number
  totalDeductions: number
  net: number
  netInWords: string
  footer?: string
}

function maskAccount(acc?: string): string | undefined {
  if (!acc) return undefined
  const s = String(acc)
  return s.length > 4 ? `XXXX${s.slice(-4)}` : s
}

export async function downloadPayslipPdf(m: PayslipPdfModel): Promise<void> {
  const doc = await newDoc()
  let y = drawLetterhead(doc, m.letterhead, `PAYSLIP — ${m.monthLabel.toUpperCase()}`)

  y = drawKeyValues(doc, [
    ['Employee', m.employee.name],
    ['Payslip No', m.payslipNo],
    ['Staff code', m.employee.staffCode],
    ['Designation', m.employee.designation],
    ['Department', m.employee.department],
    ['Employment', m.employee.employmentType?.replace(/_/g, ' ')],
    ['Date of joining', m.employee.joiningDate],
    ['PAN', m.employee.pan],
    ['UAN / PF No', m.employee.uan],
    ['Bank', m.employee.bankName],
    ['Account', maskAccount(m.employee.accountNo)],
    ['Days (paid / period)', `${m.paidDays} / ${m.daysInPeriod}${m.lopDays ? `  (LOP ${m.lopDays})` : ''}`],
  ], y)

  // Earnings | Deductions table
  const mid = LEFT + WIDTH / 2
  const tableTop = y - 11
  doc.setFillColor(240, 253, 250); doc.rect(LEFT, tableTop, WIDTH, 17, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Earnings', LEFT + 6, y); doc.text('Amount', mid - 6, y, { align: 'right' })
  doc.text('Deductions', mid + 6, y); doc.text('Amount', RIGHT - 6, y, { align: 'right' })
  y += 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  const rows = Math.max(m.earnings.length, m.deductions.length, 1)
  for (let i = 0; i < rows; i++) {
    const e = m.earnings[i]; const d = m.deductions[i]
    if (e) { doc.text(e.label.slice(0, 34), LEFT + 6, y); doc.text(rs(e.amount), mid - 6, y, { align: 'right' }) }
    if (d) { doc.text(d.label.slice(0, 34), mid + 6, y); doc.text(rs(d.amount), RIGHT - 6, y, { align: 'right' }) }
    y += 14
  }
  doc.line(LEFT, y - 6, RIGHT, y - 6); y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Gross earnings', LEFT + 6, y); doc.text(rs(m.gross), mid - 6, y, { align: 'right' })
  doc.text('Total deductions', mid + 6, y); doc.text(rs(m.totalDeductions), RIGHT - 6, y, { align: 'right' })
  doc.setLineWidth(0.4)
  doc.rect(LEFT, tableTop, WIDTH, y + 6 - tableTop)
  doc.line(mid, tableTop, mid, y + 6)
  y += 30

  doc.setFillColor(20, 184, 166); doc.rect(LEFT, y - 14, WIDTH, 24, 'F')
  doc.setTextColor(255); doc.setFontSize(12)
  doc.text('NET PAY', LEFT + 8, y + 2); doc.text(rs(m.net), RIGHT - 8, y + 2, { align: 'right' })
  doc.setTextColor(0); y += 26
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5)
  doc.text(m.netInWords, LEFT, y); y += 14
  if (m.status && m.status !== 'paid') {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 120, 0)
    doc.text(`Status: ${m.status.toUpperCase()}`, LEFT, y); doc.setTextColor(0); y += 14
  }

  drawFooter(doc, m.footer)
  doc.save(`payslip-${safeName(m.employee.staffCode || m.employee.name)}-${safeName(m.monthLabel)}.pdf`)
}

// ─── Salary certificate ───────────────────────────────────
export interface SalaryCertificatePdfModel {
  letterhead: Letterhead
  title: string
  certificateNo: string
  date: string
  body: string
  breakdown?: { earnings: MoneyLine[]; deductions: MoneyLine[]; gross: number; net: number; monthLabel?: string }
  signatoryName?: string
  signatoryDesignation?: string
  fileTag: string
}

export async function downloadSalaryCertificatePdf(m: SalaryCertificatePdfModel): Promise<void> {
  const doc = await newDoc()
  let y = drawLetterhead(doc, m.letterhead, m.title || 'SALARY CERTIFICATE')
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  doc.text(`Ref: ${m.certificateNo}`, LEFT, y)
  doc.text(`Date: ${m.date}`, RIGHT, y, { align: 'right' })
  y += 26

  doc.setFontSize(11)
  for (const para of m.body.split(/\n\s*\n/)) {
    const lines = doc.splitTextToSize(para.replace(/\n/g, ' ').trim(), WIDTH) as string[]
    for (const l of lines) { doc.text(l, LEFT, y, { maxWidth: WIDTH, align: 'justify' }); y += 16 }
    y += 8
  }

  if (m.breakdown) {
    y += 4
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text(`Monthly salary particulars${m.breakdown.monthLabel ? ` (${m.breakdown.monthLabel})` : ''}`, LEFT, y); y += 14
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
    const all: [string, number, boolean][] = [
      ...m.breakdown.earnings.map(e => [e.label, e.amount, false] as [string, number, boolean]),
      ['Gross salary', m.breakdown.gross, true],
      ...m.breakdown.deductions.map(d => [`Less: ${d.label}`, d.amount, false] as [string, number, boolean]),
      ['Net salary', m.breakdown.net, true],
    ]
    for (const [label, amt, bold] of all) {
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.text(label, LEFT + 10, y); doc.text(rs(amt), LEFT + 330, y, { align: 'right' }); y += 14
      if (y > 700) break
    }
  }

  drawSignature(doc, Math.min(y + 20, 720), m.signatoryName, m.signatoryDesignation)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9)
  doc.text('Seal of the institution', LEFT, Math.min(y + 60, 760))
  doc.save(`salary-certificate-${safeName(m.fileTag)}.pdf`)
}

// ─── Guest faculty bill ───────────────────────────────────
export interface GuestBillPdfModel {
  letterhead: Letterhead
  billNo: string
  monthLabel: string
  status: string
  faculty: { name: string; staffCode?: string; department?: string; employmentType?: string }
  rate: number
  scheduledPeriods: number
  extraPeriods: number
  absentPeriods: number
  billablePeriods: number
  periodAmount: number
  adjustments: MoneyLine[]
  grossAmount: number
  deductionLabel: string
  deductionPercent: number
  deductionAmount: number
  netAmount: number
  netInWords: string
  remarks?: string
  recordedOn?: string
  recordedRef?: string
  footer?: string
}

export async function downloadGuestBillPdf(m: GuestBillPdfModel): Promise<void> {
  const doc = await newDoc()
  let y = drawLetterhead(doc, m.letterhead, `GUEST FACULTY BILL — ${m.monthLabel.toUpperCase()}`)
  y = drawKeyValues(doc, [
    ['Bill No', m.billNo],
    ['Status', m.status.toUpperCase()],
    ['Faculty', m.faculty.name],
    ['Staff code', m.faculty.staffCode],
    ['Department', m.faculty.department],
    ['Engagement', m.faculty.employmentType?.replace(/_/g, ' ')],
    ['Recorded on', m.recordedOn],
    ['Reference', m.recordedRef],
  ], y)

  doc.line(LEFT, y, RIGHT, y); y += 16
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
  doc.text('Particulars', LEFT, y); doc.text('Amount', RIGHT, y, { align: 'right' }); y += 15
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
  const line = (label: string, value: string) => { doc.text(label, LEFT, y); doc.text(value, RIGHT, y, { align: 'right' }); y += 14 }
  line('Periods as per timetable', String(m.scheduledPeriods))
  if (m.extraPeriods) line('Add: extra periods engaged', String(m.extraPeriods))
  if (m.absentPeriods) line('Less: periods not engaged', String(m.absentPeriods))
  line(`Billable periods × ${rs(m.rate)}`, `${m.billablePeriods}  =  ${rs(m.periodAmount)}`)
  for (const a of m.adjustments) line(a.label, rs(a.amount))
  doc.line(LEFT, y - 4, RIGHT, y - 4); y += 10
  doc.setFont('helvetica', 'bold')
  line('Gross amount', rs(m.grossAmount))
  if (m.deductionAmount > 0) {
    doc.setFont('helvetica', 'normal')
    line(`Less: ${m.deductionLabel} @ ${m.deductionPercent}%`, rs(m.deductionAmount))
  }
  y += 6
  doc.setFillColor(20, 184, 166); doc.rect(LEFT, y - 14, WIDTH, 24, 'F')
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
  doc.text('NET PAYABLE', LEFT + 8, y + 2); doc.text(rs(m.netAmount), RIGHT - 8, y + 2, { align: 'right' })
  doc.setTextColor(0); y += 26
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.text(m.netInWords, LEFT, y); y += 16
  if (m.remarks) {
    doc.setFont('helvetica', 'normal')
    for (const l of doc.splitTextToSize(`Remarks: ${m.remarks}`, WIDTH) as string[]) { doc.text(l, LEFT, y); y += 13 }
  }

  const sigY = Math.max(y + 50, 640)
  drawSignature(doc, sigY - 40, 'Faculty signature', undefined, false)
  drawSignature(doc, sigY - 40, 'Head of Department', undefined, true)
  drawSignature(doc, sigY + 20, 'Principal', undefined, true)
  drawFooter(doc, m.footer)
  doc.save(`guest-bill-${safeName(m.faculty.staffCode || m.faculty.name)}-${safeName(m.monthLabel)}.pdf`)
}
