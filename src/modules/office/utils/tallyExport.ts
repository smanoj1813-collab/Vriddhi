// src/modules/office/utils/tallyExport.ts
//
// Tally Prime / Tally ERP 9 voucher export (XML "Import Data" envelope).
// Colleges keep their books in Tally; the accounts team exports Vriddhi's
// day book for a period and imports it (Gateway of Tally → Import → Vouchers).
// Ledger names come from Finance Settings so they match the college's chart
// of accounts exactly. Pure + unit tested.
//
// Tally sign convention in XML: a DEBIT entry has ISDEEMEDPOSITIVE=Yes and a
// NEGATIVE amount; a CREDIT entry has ISDEEMEDPOSITIVE=No and a positive amount.

export interface TallyLedgerMap {
  companyName: string
  cashLedger: string
  bankLedger: string
  /** Fee income ledger per fee category; falls back to feeIncomeDefault. */
  feeIncome: Record<string, string>
  feeIncomeDefault: string
  libraryFineLedger: string
  tdsPayableLedger: string
  /** 'party' = one ledger per vendor (vendor name); 'single' = sundryCreditorsLedger. */
  vendorLedgerMode: 'party' | 'single'
  sundryCreditorsLedger: string
  purchaseLedger: string
  salaryLedger: string
  guestFacultyLedger: string
  /** Voucher type names as they exist in the company. */
  receiptVoucherType: string
  paymentVoucherType: string
  journalVoucherType: string
}

export const DEFAULT_TALLY_LEDGERS: TallyLedgerMap = {
  companyName: '',
  cashLedger: 'Cash',
  bankLedger: 'Bank Account',
  feeIncome: { tuition: 'Tuition Fees', exam: 'Examination Fees', university_exam: 'University Examination Fees', library: 'Library Fees & Fines', lab: 'Laboratory Fees', hostel: 'Hostel Fees', transport: 'Transport Fees' },
  feeIncomeDefault: 'Other Fees',
  libraryFineLedger: 'Library Fines',
  tdsPayableLedger: 'TDS Payable',
  vendorLedgerMode: 'party',
  sundryCreditorsLedger: 'Sundry Creditors',
  purchaseLedger: 'Purchases',
  salaryLedger: 'Salaries',
  guestFacultyLedger: 'Guest Faculty Remuneration',
  receiptVoucherType: 'Receipt',
  paymentVoucherType: 'Payment',
  journalVoucherType: 'Journal',
}

export function normalizeTallyLedgers(raw: unknown): TallyLedgerMap {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const d = DEFAULT_TALLY_LEDGERS
  const s = (k: keyof TallyLedgerMap) => (typeof r[k] === 'string' && String(r[k]).trim() ? String(r[k]).trim() : (d[k] as string))
  const fee = r.feeIncome && typeof r.feeIncome === 'object' ? (r.feeIncome as Record<string, unknown>) : {}
  return {
    companyName: typeof r.companyName === 'string' ? r.companyName.trim() : '',
    cashLedger: s('cashLedger'),
    bankLedger: s('bankLedger'),
    feeIncome: { ...d.feeIncome, ...Object.fromEntries(Object.entries(fee).filter(([, v]) => typeof v === 'string' && v.trim()).map(([k, v]) => [k, String(v).trim()])) },
    feeIncomeDefault: s('feeIncomeDefault'),
    libraryFineLedger: s('libraryFineLedger'),
    tdsPayableLedger: s('tdsPayableLedger'),
    vendorLedgerMode: r.vendorLedgerMode === 'single' ? 'single' : 'party',
    sundryCreditorsLedger: s('sundryCreditorsLedger'),
    purchaseLedger: s('purchaseLedger'),
    salaryLedger: s('salaryLedger'),
    guestFacultyLedger: s('guestFacultyLedger'),
    receiptVoucherType: s('receiptVoucherType'),
    paymentVoucherType: s('paymentVoucherType'),
    journalVoucherType: s('journalVoucherType'),
  }
}

/** One accounting event from the day book. */
export interface DaybookEntry {
  date: string
  kind: 'fee_receipt' | 'fine_receipt' | 'vendor_bill' | 'vendor_payment' | 'salary_payment' | 'guest_payment'
  ref: string
  party: string
  narration: string
  amount: number
  /** cash / upi / bank … */
  mode?: string
  /** fee category for fee receipts */
  category?: string
  /** vendor bills: split */
  taxable?: number
  gst?: number
  tds?: number
}

export interface TallyVoucher {
  type: 'receipt' | 'payment' | 'journal'
  date: string
  number: string
  narration: string
  party: string
  lines: Array<{ ledger: string; debit: number; credit: number }>
}

const isCash = (mode?: string) => (mode || '').toLowerCase() === 'cash'

export function entryToVoucher(e: DaybookEntry, m: TallyLedgerMap): TallyVoucher | null {
  const amt = Math.round((Number(e.amount) || 0) * 100) / 100
  if (amt <= 0) return null
  const cashOrBank = isCash(e.mode) ? m.cashLedger : m.bankLedger
  const vendorLedger = m.vendorLedgerMode === 'party' && e.party ? e.party : m.sundryCreditorsLedger
  const base = { date: e.date, number: e.ref, narration: e.narration, party: e.party }
  switch (e.kind) {
    case 'fee_receipt':
      return { ...base, type: 'receipt', lines: [{ ledger: cashOrBank, debit: amt, credit: 0 }, { ledger: m.feeIncome[e.category || ''] || m.feeIncomeDefault, debit: 0, credit: amt }] }
    case 'fine_receipt':
      return { ...base, type: 'receipt', lines: [{ ledger: cashOrBank, debit: amt, credit: 0 }, { ledger: m.libraryFineLedger, debit: 0, credit: amt }] }
    case 'vendor_bill': {
      // Purchase booked: Dr Purchases (gross), Cr Vendor (net), Cr TDS payable
      const tds = Math.round((Number(e.tds) || 0) * 100) / 100
      const lines = [{ ledger: m.purchaseLedger, debit: amt, credit: 0 }, { ledger: vendorLedger, debit: 0, credit: Math.round((amt - tds) * 100) / 100 }]
      if (tds > 0) lines.push({ ledger: m.tdsPayableLedger, debit: 0, credit: tds })
      return { ...base, type: 'journal', lines }
    }
    case 'vendor_payment':
      return { ...base, type: 'payment', lines: [{ ledger: vendorLedger, debit: amt, credit: 0 }, { ledger: cashOrBank, debit: 0, credit: amt }] }
    case 'salary_payment':
      return { ...base, type: 'payment', lines: [{ ledger: m.salaryLedger, debit: amt, credit: 0 }, { ledger: cashOrBank, debit: 0, credit: amt }] }
    case 'guest_payment':
      return { ...base, type: 'payment', lines: [{ ledger: m.guestFacultyLedger, debit: amt, credit: 0 }, { ledger: cashOrBank, debit: 0, credit: amt }] }
    default:
      return null
  }
}

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const tallyDate = (iso: string) => iso.slice(0, 10).replace(/-/g, '')
const amt2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2)

export function buildTallyXml(vouchers: TallyVoucher[], m: TallyLedgerMap): string {
  const vt = (t: TallyVoucher['type']) => (t === 'receipt' ? m.receiptVoucherType : t === 'payment' ? m.paymentVoucherType : m.journalVoucherType)
  const body = vouchers
    .map(v => {
      const entries = v.lines
        .map(l => {
          const debit = l.debit > 0
          const amount = debit ? -l.debit : l.credit
          return `        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${esc(l.ledger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${debit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
          <AMOUNT>${amt2(amount)}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
        })
        .join('\n')
      return `    <TALLYMESSAGE xmlns:UDF="TallyUDF">
      <VOUCHER VCHTYPE="${esc(vt(v.type))}" ACTION="Create">
        <DATE>${tallyDate(v.date)}</DATE>
        <EFFECTIVEDATE>${tallyDate(v.date)}</EFFECTIVEDATE>
        <VOUCHERTYPENAME>${esc(vt(v.type))}</VOUCHERTYPENAME>
        <VOUCHERNUMBER>${esc(v.number)}</VOUCHERNUMBER>
        <PARTYLEDGERNAME>${esc(v.party)}</PARTYLEDGERNAME>
        <NARRATION>${esc(v.narration)}</NARRATION>
${entries}
      </VOUCHER>
    </TALLYMESSAGE>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${esc(m.companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${body}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
`
}

/** Every voucher must balance (Σ debit = Σ credit). */
export function voucherBalances(v: TallyVoucher): boolean {
  const d = v.lines.reduce((s, l) => s + l.debit, 0)
  const c = v.lines.reduce((s, l) => s + l.credit, 0)
  return Math.abs(d - c) < 0.005
}

export interface DaybookSummary {
  receipts: number
  payments: number
  billsBooked: number
  byKind: Record<DaybookEntry['kind'], number>
  byMode: Record<string, number>
}

export function summarizeDaybook(entries: DaybookEntry[]): DaybookSummary {
  const byKind = { fee_receipt: 0, fine_receipt: 0, vendor_bill: 0, vendor_payment: 0, salary_payment: 0, guest_payment: 0 } as Record<DaybookEntry['kind'], number>
  const byMode: Record<string, number> = {}
  let receipts = 0
  let payments = 0
  let billsBooked = 0
  for (const e of entries) {
    byKind[e.kind] += e.amount
    if (e.kind === 'fee_receipt' || e.kind === 'fine_receipt') {
      receipts += e.amount
      const mode = (e.mode || 'other').toLowerCase()
      byMode[mode] = (byMode[mode] || 0) + e.amount
    } else if (e.kind === 'vendor_bill') billsBooked += e.amount
    else payments += e.amount
  }
  const r2 = (n: number) => Math.round(n * 100) / 100
  Object.keys(byKind).forEach(k => (byKind[k as DaybookEntry['kind']] = r2(byKind[k as DaybookEntry['kind']])))
  Object.keys(byMode).forEach(k => (byMode[k] = r2(byMode[k])))
  return { receipts: r2(receipts), payments: r2(payments), billsBooked: r2(billsBooked), byKind, byMode }
}
