// src/modules/faculty/pages/FacultyMySalary.tsx
//
// Faculty self-service: approved/paid payslips, issued salary certificates and
// (for guest faculty) monthly guest bills — each downloadable as a branded PDF.
// Read-only; everything is produced by the finance office in Faculty Payroll /
// Guest Faculty Billing.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Clock, Download, FileSignature, FileText, Loader2, ShieldCheck, Wallet } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { fetchMyPayslips, fetchMySalaryCertificates, type Payslip } from '@/modules/admin/api/payrollApi'
import { fetchMyGuestBills, type GuestBill } from '@/modules/admin/api/guestBillApi'
import { useFinanceRules } from '@/modules/admin/hooks/useFinanceRules'
import { certificateToPdfModel, letterheadFrom, monthLabel, payslipToPdfModel } from '@/modules/admin/utils/payrollDocs'
import { amountInWords, formatINR } from '@/modules/admin/utils/payrollEngine'
import { downloadGuestBillPdf, downloadPayslipPdf, downloadSalaryCertificatePdf } from '@/shared/utils/financePdf'
import { useNotification } from '@/shared/providers/NotificationProvider'

type Tab = 'payslips' | 'certificates' | 'bills'
const inr = (n: number) => `₹${formatINR(n)}`

export default function FacultyMySalary() {
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const { rules, branding } = useFinanceRules()
  const { showError } = useNotification()
  const [selected, setSelected] = useState<Payslip | null>(null)

  const payslipsQ = useQuery({ queryKey: ['myPayslips', uid], queryFn: () => fetchMyPayslips(uid), enabled: !!uid })
  const certsQ = useQuery({ queryKey: ['mySalaryCertificates', uid], queryFn: () => fetchMySalaryCertificates(uid), enabled: !!uid })
  const billsQ = useQuery({ queryKey: ['myGuestBills', uid], queryFn: () => fetchMyGuestBills(uid), enabled: !!uid })

  const payslips = payslipsQ.data ?? []
  const certs = certsQ.data ?? []
  const bills = (billsQ.data ?? []).filter(b => b.status === 'approved' || b.status === 'recorded')
  const [tab, setTab] = useState<Tab>('payslips')
  const effectiveTab: Tab = tab === 'payslips' && payslips.length === 0 && bills.length > 0 && !payslipsQ.isLoading ? 'bills' : tab

  const latest = payslips[0]
  const ytd = useMemo(() => {
    const now = new Date()
    const fyStart = now.getMonth() >= 3 ? `${now.getFullYear()}-04` : `${now.getFullYear() - 1}-04`
    const inFy = payslips.filter(p => p.month >= fyStart)
    return { gross: inFy.reduce((s, p) => s + p.gross, 0), net: inFy.reduce((s, p) => s + p.net, 0), count: inFy.length }
  }, [payslips])

  const dlPayslip = async (p: Payslip) => {
    try { await downloadPayslipPdf(payslipToPdfModel(p, branding, rules.payroll.payslipFooter)) } catch { showError('Could not generate the PDF.') }
  }
  const dlBill = async (b: GuestBill) => {
    try {
      await downloadGuestBillPdf({
        letterhead: letterheadFrom(branding),
        billNo: b.billNo, monthLabel: monthLabel(b.month), status: b.status,
        faculty: { name: b.name, staffCode: b.staffCode, department: b.department, employmentType: b.employmentType },
        rate: b.periodRate, scheduledPeriods: b.scheduledPeriods, extraPeriods: b.extraPeriods, absentPeriods: b.absentPeriods,
        billablePeriods: b.billablePeriods, periodAmount: b.periodAmount,
        adjustments: b.adjustments.map(a => ({ label: a.label || 'Adjustment', amount: a.amount })),
        grossAmount: b.grossAmount, deductionLabel: b.deductionLabel, deductionPercent: b.deductionPercent, deductionAmount: b.deductionAmount,
        netAmount: b.netAmount, netInWords: amountInWords(b.netAmount), remarks: b.remarks, recordedOn: b.recordedOn, recordedRef: b.recordedRef,
        footer: rules.guestBilling.billFooter,
      })
    } catch { showError('Could not generate the PDF.') }
  }

  const loading = payslipsQ.isLoading || certsQ.isLoading || billsQ.isLoading

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="section-title mb-1 flex items-center gap-2"><Wallet className="w-7 h-7 text-vriddhi-accent" /> My Salary</h1>
        <p className="text-sm text-vriddhi-muted">Your payslips, salary certificates and guest-lecture bills issued by {branding.collegeName || 'the college'}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 md:col-span-1 bg-gradient-to-br from-vriddhi-accent/15 to-transparent">
          <p className="text-xs text-vriddhi-muted">{latest ? `Net pay · ${monthLabel(latest.month)}` : bills[0] ? `Guest bill · ${monthLabel(bills[0].month)}` : 'Latest pay'}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{latest ? inr(latest.net) : bills[0] ? inr(bills[0].netAmount) : '—'}</p>
          {latest && <p className="text-xs text-vriddhi-muted mt-1">Gross {inr(latest.gross)} · Deductions {inr(latest.totalDeductions)}</p>}
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-vriddhi-muted">This financial year · gross</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{inr(ytd.gross)}</p>
          <p className="text-xs text-vriddhi-muted mt-1">{ytd.count} payslip{ytd.count === 1 ? '' : 's'}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-vriddhi-muted">This financial year · net</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{inr(ytd.net)}</p>
          <p className="text-xs text-vriddhi-muted mt-1">{certs.length} certificate{certs.length === 1 ? '' : 's'} issued</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {([
          { id: 'payslips', label: `Payslips (${payslips.length})`, icon: FileText },
          { id: 'certificates', label: `Salary certificates (${certs.length})`, icon: FileSignature },
          ...(bills.length ? [{ id: 'bills', label: `Guest bills (${bills.length})`, icon: Clock }] : []),
        ] as { id: Tab; label: string; icon: typeof FileText }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${effectiveTab === t.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card text-vriddhi-muted hover:text-slate-900 dark:hover:text-white'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card h-48 flex items-center justify-center"><Loader2 className="w-7 h-7 animate-spin text-vriddhi-muted" /></div>
      ) : effectiveTab === 'payslips' ? (
        payslips.length === 0 ? <Empty text="No payslips released yet. They appear here once the finance office approves the month's payroll." /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {payslips.map(p => (
              <div key={p.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{monthLabel(p.month)}</p>
                    <p className="text-[11px] font-mono text-vriddhi-muted">{p.payslipNo}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${p.status === 'paid' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'}`}>
                    {p.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />} {p.status === 'paid' ? `Paid${p.paidOn ? ` · ${p.paidOn}` : ''}` : 'Approved'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div className="rounded-lg bg-vriddhi-dark/20 p-2"><p className="text-[11px] text-vriddhi-muted">Gross</p><p className="text-sm font-semibold">{inr(p.gross)}</p></div>
                  <div className="rounded-lg bg-vriddhi-dark/20 p-2"><p className="text-[11px] text-vriddhi-muted">Deductions</p><p className="text-sm font-semibold text-red-600 dark:text-red-400">{inr(p.totalDeductions)}</p></div>
                  <div className="rounded-lg bg-vriddhi-accent/10 p-2"><p className="text-[11px] text-vriddhi-muted">Net</p><p className="text-sm font-bold text-vriddhi-accent">{inr(p.net)}</p></div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => setSelected(selected?.id === p.id ? null : p)} className="text-xs text-vriddhi-accent hover:underline">{selected?.id === p.id ? 'Hide details' : `Details · ${p.paidDays}/${p.daysInPeriod} days`}</button>
                  <button onClick={() => dlPayslip(p)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent text-white hover:bg-teal-600"><Download className="w-3.5 h-3.5" /> Download payslip</button>
                </div>
                {selected?.id === p.id && (
                  <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-vriddhi-border text-xs">
                    <div>{p.earnings.map((l, i) => <div key={i} className="flex justify-between py-0.5"><span className="text-vriddhi-muted">{l.label}</span><span>{inr(l.amount)}</span></div>)}</div>
                    <div>{p.deductions.length === 0 ? <p className="text-vriddhi-muted">No deductions</p> : p.deductions.map((l, i) => <div key={i} className="flex justify-between py-0.5"><span className="text-vriddhi-muted">{l.label}</span><span>{inr(l.amount)}</span></div>)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : effectiveTab === 'certificates' ? (
        certs.length === 0 ? <Empty text="No salary certificates issued yet. Ask the office — they can issue one for a bank loan, visa or any other purpose." /> : (
          <div className="glass-card divide-y divide-vriddhi-border">
            {certs.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{c.title || 'Salary Certificate'}</p>
                  <p className="text-xs text-vriddhi-muted"><span className="font-mono">{c.certificateNo}</span> · {c.issuedOn} · for {c.purpose}</p>
                </div>
                <button onClick={async () => { try { await downloadSalaryCertificatePdf(certificateToPdfModel(c, branding, rules.payroll.certificate)) } catch { showError('Could not generate the PDF.') } }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent text-white hover:bg-teal-600 shrink-0">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-vriddhi-border">
              <th className="table-header">Month</th><th className="table-header text-center">Periods</th><th className="table-header text-right">Gross</th><th className="table-header text-right">Net</th><th className="table-header text-center">Status</th><th className="table-header text-right">Bill</th>
            </tr></thead>
            <tbody>
              {bills.map(b => (
                <tr key={b.id} className="border-b border-vriddhi-border/50">
                  <td className="table-cell"><p className="font-medium">{monthLabel(b.month)}</p><p className="text-[11px] font-mono text-vriddhi-muted">{b.billNo}</p></td>
                  <td className="table-cell text-center">{b.billablePeriods} × {inr(b.periodRate)}</td>
                  <td className="table-cell text-right">{inr(b.grossAmount)}</td>
                  <td className="table-cell text-right font-semibold">{inr(b.netAmount)}</td>
                  <td className="table-cell text-center"><span className={`text-xs px-2 py-1 rounded-full ${b.status === 'recorded' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'}`}>{b.status === 'recorded' ? 'Paid' : 'Approved'}</span></td>
                  <td className="table-cell text-right"><button onClick={() => dlBill(b)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent/15 text-vriddhi-accent"><Download className="w-3.5 h-3.5" /> PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="glass-card p-10 text-center text-sm text-vriddhi-muted">{text}</div>
}
