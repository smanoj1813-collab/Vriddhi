// src/modules/admin/utils/financeReceipt.ts
//
// Pure receipt-model builder: turns a fee payment + one of its transactions
// into a plain, render-agnostic receipt. Unit-tested; the jsPDF rendering lives
// in shared/utils/receiptPdf.ts so the model can be reused (PDF, print, email).

export interface ReceiptLineItem {
  label: string
  amount: number
}

export interface ReceiptModel {
  receiptNo: string
  date: string
  collegeName: string
  collegeCode?: string
  studentName: string
  regNo: string
  course: string
  batch: string
  feeCategory: string
  paymentMode?: string
  transactionId?: string
  bankReference?: string
  items: ReceiptLineItem[]
  amountReceived: number
  totalFee: number
  totalPaid: number
  balance: number
  status: string
  remarks?: string
  /** Letterhead extras (Finance Settings → Receipts & letterhead). */
  collegeAddress?: string
  collegeContact?: string
  registrationLine?: string
  title: string
  footer: string
  signatoryName?: string
  signatoryDesignation?: string
  showBalance: boolean
}

/** Subset of BrandingSettings the receipt needs (kept structural to stay pure). */
export interface ReceiptBranding {
  collegeName?: string
  collegeCode?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  registrationLine?: string
  receiptTitle?: string
  receiptFooter?: string
  signatoryName?: string
  signatoryDesignation?: string
  showBalanceOnReceipt?: boolean
}

export interface BuildReceiptArgs {
  payment: {
    studentName: string
    regNo: string
    course: string
    batch: string
    category: string
    amount: number
    paidAmount: number
    status: string
  }
  transaction: {
    receiptNo?: string
    transactionId?: string
    bankReference?: string
    paymentMode?: string
    amount: number
    paidOn?: string
    createdAt?: string
    submissionStatus?: string
  }
  collegeName?: string
  collegeCode?: string
  discountTotal?: number
  lateFine?: number
  remarks?: string
  branding?: ReceiptBranding
}

function money(n: number): number {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

function humanize(s: string): string {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
}

/** Pure: build the receipt model for one payment transaction. */
export function buildReceiptModel(args: BuildReceiptArgs): ReceiptModel {
  const { payment, transaction } = args
  const totalFee = money(payment.amount)
  const amountReceived = money(transaction.amount)
  const totalPaid = money(payment.paidAmount)

  const items: ReceiptLineItem[] = [{ label: `${humanize(payment.category)} fee`, amount: totalFee }]
  if (args.discountTotal && args.discountTotal > 0) {
    items.push({ label: 'Discount', amount: -money(args.discountTotal) })
  }
  if (args.lateFine && args.lateFine > 0) {
    items.push({ label: 'Late payment fine', amount: money(args.lateFine) })
  }

  const date =
    transaction.paidOn ||
    (transaction.createdAt ? transaction.createdAt.slice(0, 10) : '') ||
    new Date().toISOString().slice(0, 10)

  const b = args.branding || {}
  const contact = [b.phone && `Ph: ${b.phone}`, b.email, b.website].filter(Boolean).join(' · ')

  return {
    receiptNo: transaction.receiptNo || '—',
    date,
    collegeName: b.collegeName || args.collegeName || 'College',
    collegeCode: b.collegeCode || args.collegeCode,
    studentName: payment.studentName,
    regNo: payment.regNo,
    course: payment.course,
    batch: payment.batch,
    feeCategory: humanize(payment.category),
    paymentMode: transaction.paymentMode,
    transactionId: transaction.transactionId,
    bankReference: transaction.bankReference,
    items,
    amountReceived,
    totalFee,
    totalPaid,
    balance: money(Math.max(0, totalFee - totalPaid)),
    status: transaction.submissionStatus || payment.status,
    remarks: args.remarks,
    collegeAddress: b.address || undefined,
    collegeContact: contact || undefined,
    registrationLine: b.registrationLine || undefined,
    title: b.receiptTitle || 'FEE PAYMENT RECEIPT',
    footer: b.receiptFooter || 'This is a computer-generated receipt.',
    signatoryName: b.signatoryName || undefined,
    signatoryDesignation: b.signatoryDesignation || undefined,
    showBalance: b.showBalanceOnReceipt !== false,
  }
}
