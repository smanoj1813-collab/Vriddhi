// src/modules/office/api/financeReportsApi.ts
//
// Assembles the day book for a period from every money ledger in Vriddhi:
//   • fee receipts         feePayments/{id}/transactions (type payment, not pending/rejected)
//   • library fines        libraryFines collected at the desk (status collected)
//                          — fines posted to / paid through the fee ledger are
//                          already in fee receipts, so they're not counted twice
//   • vendor bills booked  vendorBills (invoice date in range)
//   • vendor payments      vendorBills.payments[]
//   • salaries             payslips (status paid, paidOn in range)
//   • guest faculty        guestBills (status recorded, recordedOn in range)

import { fetchFeePayments, fetchFeeTransactions, type FeePayment } from '@/modules/admin/api/feeApi'
import { fetchPayslips } from '@/modules/admin/api/payrollApi'
import { fetchGuestBills } from '@/modules/admin/api/guestBillApi'
import { fetchFines } from './libraryApi'
import { fetchVendorBills } from './procurementApi'
import type { DaybookEntry } from '../utils/tallyExport'

const inRange = (d: string | undefined, from: string, to: string) => !!d && d.slice(0, 10) >= from && d.slice(0, 10) <= to

/** Months (YYYY-MM) touched by a date range. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = []
  let y = Number(from.slice(0, 4))
  let m = Number(from.slice(5, 7))
  const ey = Number(to.slice(0, 4))
  const em = Number(to.slice(5, 7))
  let guard = 0
  while ((y < ey || (y === ey && m <= em)) && guard++ < 36) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

async function mapLimit<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  for (let i = 0; i < items.length; i += n) out.push(...(await Promise.all(items.slice(i, i + n).map(fn))))
  return out
}

export interface DaybookOptions {
  from: string
  to: string
  includeFees: boolean
  includeFines: boolean
  includeVendors: boolean
  /** payroll only when the viewer is allowed to see it */
  includePayroll: boolean
  onProgress?: (msg: string) => void
}

export async function buildDaybook(o: DaybookOptions): Promise<{ entries: DaybookEntry[]; warnings: string[] }> {
  const entries: DaybookEntry[] = []
  const warnings: string[] = []
  const tasks: Promise<void>[] = []

  if (o.includeFees) {
    tasks.push(
      (async () => {
        o.onProgress?.('Reading fee ledger…')
        const payments = (await fetchFeePayments()).filter((p: FeePayment) => p.paidAmount > 0)
        // A payment updated before the range can't hold receipts inside it.
        const candidates = payments.filter(p => !p.updatedAt || p.updatedAt.slice(0, 10) >= o.from)
        const lists = await mapLimit(candidates, 20, async p => ({ p, txns: await fetchFeeTransactions(p.id) }))
        for (const { p, txns } of lists) {
          for (const t of txns) {
            if (t.type !== 'payment') continue
            if (t.submissionStatus === 'rejected' || t.submissionStatus === 'pending_verification') continue
            const date = (t.paidOn || t.createdAt || '').slice(0, 10)
            if (!inRange(date, o.from, o.to)) continue
            entries.push({
              date,
              kind: 'fee_receipt',
              ref: t.receiptNo || t.transactionId || t.id,
              party: p.studentName,
              narration: `${p.category} fee — ${p.studentName} (${p.regNo || p.course})${t.bankReference ? ` ref ${t.bankReference}` : ''}`,
              amount: t.amount,
              mode: t.paymentMode || 'other',
              category: p.category,
            })
          }
        }
      })(),
    )
  }

  if (o.includeFines) {
    tasks.push(
      (async () => {
        const fines = await fetchFines('collected')
        for (const f of fines) {
          const date = f.collectedAt.slice(0, 10)
          if (!inRange(date, o.from, o.to)) continue
          entries.push({ date, kind: 'fine_receipt', ref: f.receiptNo || f.id, party: f.memberName, narration: `Library fine — ${f.memberName} (${f.memberCode}) ${f.titleName}`, amount: f.amount, mode: f.paymentMode || 'cash' })
        }
      })(),
    )
  }

  if (o.includeVendors) {
    tasks.push(
      (async () => {
        const bills = (await fetchVendorBills()).filter(b => b.status !== 'cancelled')
        for (const b of bills) {
          if (b.status === 'approved' && inRange(b.invoiceDate, o.from, o.to)) {
            entries.push({ date: b.invoiceDate, kind: 'vendor_bill', ref: b.billNo, party: b.vendorName, narration: `Inv ${b.vendorInvoiceNo} — ${b.description || b.budgetHead}${b.poNo ? ` (PO ${b.poNo})` : ''}`, amount: b.gross, taxable: b.taxable, gst: b.gst, tds: b.tdsAmount })
          }
          b.payments.forEach((p, i) => {
            if (!inRange(p.date, o.from, o.to)) return
            entries.push({ date: p.date, kind: 'vendor_payment', ref: `${b.billNo}-P${i + 1}`, party: b.vendorName, narration: `Payment against ${b.billNo} / inv ${b.vendorInvoiceNo}${p.ref ? ` ref ${p.ref}` : ''}`, amount: p.amount, mode: p.mode })
          })
        }
      })(),
    )
  }

  if (o.includePayroll) {
    tasks.push(
      (async () => {
        for (const month of monthsBetween(o.from, o.to)) {
          try {
            const [slips, guest] = await Promise.all([fetchPayslips(month), fetchGuestBills(month)])
            for (const s of slips) {
              if (s.status !== 'paid' || !inRange(s.paidOn, o.from, o.to)) continue
              entries.push({ date: s.paidOn!.slice(0, 10), kind: 'salary_payment', ref: `SAL-${month}-${s.name.slice(0, 12)}`, party: s.name, narration: `Salary ${month} — ${s.name}${s.paymentRef ? ` ref ${s.paymentRef}` : ''}`, amount: s.net, mode: 'bank' })
            }
            for (const g of guest) {
              if (g.status !== 'recorded' || !inRange(g.recordedOn, o.from, o.to)) continue
              entries.push({ date: g.recordedOn!.slice(0, 10), kind: 'guest_payment', ref: `GF-${month}-${g.id.slice(-6)}`, party: g.name, narration: `Guest faculty ${month} — ${g.name}${g.recordedRef ? ` ref ${g.recordedRef}` : ''}`, amount: g.netAmount, mode: 'bank' })
            }
          } catch {
            warnings.push(`Payroll for ${month} could not be read (payroll may be hidden from this role).`)
          }
        }
      })(),
    )
  }

  const results = await Promise.allSettled(tasks)
  results.forEach(r => {
    if (r.status === 'rejected') warnings.push(r.reason instanceof Error ? r.reason.message : String(r.reason))
  })
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind) || a.ref.localeCompare(b.ref))
  return { entries, warnings }
}
