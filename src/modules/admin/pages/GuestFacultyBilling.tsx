// src/modules/admin/pages/GuestFacultyBilling.tsx
// Guest Faculty Billing — Phase 3 BILLING LEDGER (no disbursement).
//
// Karnataka degree colleges staff 30–50% of sections with guest / P&T teachers
// paid PER PERIOD. For a chosen month this page derives each guest's periods
// from the live weekly timetable (per-weekday occurrences × per-period rate),
// then lets the finance office turn that into a persisted monthly bill per
// guest (colleges/{id}/guestBills/{month_profileId}):
//
//   not generated → draft (editable: extra / not-engaged periods, rate,
//   adjustments, remarks) → approved → recorded (date + payment reference)
//
// "Recorded" means the payment made outside the app has been entered in the
// ledger; the app never moves money. Every rate, deduction (TDS), cap,
// approval step and bill wording comes from Finance Settings → Guest billing.

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, Clock, Download, FileText, IndianRupee, Loader2, Pencil,
  Plus, RefreshCw, RotateCcw, Settings as SettingsIcon, ShieldCheck, Trash2, Users, X, XCircle,
} from 'lucide-react'
import { fetchWeeklySchedules } from '../api/scheduleApi'
import { currentCollegeId, fetchCollegeFaculty } from '../api/facultyDirectoryApi'
import {
  deleteGuestBill,
  fetchGuestBills,
  generateGuestBillDrafts,
  saveGuestBillDraft,
  setGuestBillStatus,
  type GuestBill,
  type GuestBillDraft,
} from '../api/guestBillApi'
import {
  billingRowsToCsv,
  buildBillingRows,
  computeGuestBill,
  guestBillId,
  type BillAdjustment,
  type BillingRow,
  type GuestBillStatus,
  type GuestBillingSettings,
} from '../utils/guestBilling'
import { amountInWords, docNumber } from '../utils/payrollEngine'
import { useFinanceRules } from '../hooks/useFinanceRules'
import { downloadGuestBillPdf } from '../../../shared/utils/financePdf'
import type { BrandingSettings } from '../api/financeApi'
import { useNotification } from '../../../shared/providers/NotificationProvider'

const STATUS_META: Record<GuestBillStatus | 'none', { label: string; cls: string; icon: typeof Clock }> = {
  none: { label: 'Not generated', cls: 'bg-slate-500/10 text-slate-500 dark:text-slate-400', icon: FileText },
  draft: { label: 'Draft', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', icon: ShieldCheck },
  recorded: { label: 'Recorded', cls: 'bg-green-500/15 text-green-700 dark:text-green-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: XCircle },
}

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

interface LedgerRow {
  key: string
  derived?: BillingRow
  bill?: GuestBill
}

/** Build a draft from a derived timetable row (+ optional edits). */
function draftFromRow(
  row: BillingRow,
  month: string,
  settings: GuestBillingSettings,
  edits?: { scheduledPeriods?: number; extraPeriods?: number; absentPeriods?: number; rate?: number; adjustments?: BillAdjustment[]; remarks?: string },
): GuestBillDraft {
  const scheduledPeriods = edits?.scheduledPeriods ?? row.periodsInMonth
  const extraPeriods = edits?.extraPeriods ?? 0
  const absentPeriods = edits?.absentPeriods ?? 0
  const rate = edits?.rate ?? row.periodRate
  const adjustments = edits?.adjustments ?? []
  const t = computeGuestBill({ scheduledPeriods, extraPeriods, absentPeriods, rate, adjustments }, settings)
  return {
    month,
    billNo: docNumber(settings.billPrefix, month, row.profileId),
    facultyProfileId: row.profileId,
    facultyUid: row.uid,
    staffCode: row.staffCode,
    name: row.name,
    department: row.department,
    employmentType: row.employmentType,
    periodRate: rate,
    scheduledPeriods,
    extraPeriods,
    absentPeriods,
    billablePeriods: t.billablePeriods,
    periodAmount: t.periodAmount,
    adjustments,
    adjustmentsTotal: t.adjustmentsTotal,
    grossAmount: t.grossAmount,
    deductionPercent: settings.deductionPercent,
    deductionLabel: settings.deductionLabel,
    deductionAmount: t.deductionAmount,
    netAmount: t.netAmount,
    remarks: edits?.remarks,
  }
}

function billToPdfModel(bill: GuestBill, branding: BrandingSettings, footer: string) {
  return {
    letterhead: {
      collegeName: branding.collegeName || 'College',
      collegeCode: branding.collegeCode,
      address: branding.address,
      contact: [branding.phone && `Ph: ${branding.phone}`, branding.email].filter(Boolean).join(' · '),
      registrationLine: branding.registrationLine,
    },
    billNo: bill.billNo,
    monthLabel: monthLabel(bill.month),
    status: bill.status,
    faculty: { name: bill.name, staffCode: bill.staffCode, department: bill.department, employmentType: bill.employmentType },
    rate: bill.periodRate,
    scheduledPeriods: bill.scheduledPeriods,
    extraPeriods: bill.extraPeriods,
    absentPeriods: bill.absentPeriods,
    billablePeriods: bill.billablePeriods,
    periodAmount: bill.periodAmount,
    adjustments: bill.adjustments.map(a => ({ label: a.label || 'Adjustment', amount: a.amount })),
    grossAmount: bill.grossAmount,
    deductionLabel: bill.deductionLabel,
    deductionPercent: bill.deductionPercent,
    deductionAmount: bill.deductionAmount,
    netAmount: bill.netAmount,
    netInWords: amountInWords(bill.netAmount),
    remarks: bill.remarks,
    recordedOn: bill.recordedOn,
    recordedRef: bill.recordedRef,
    footer,
  }
}

export default function GuestFacultyBilling() {
  const collegeId = currentCollegeId()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const { rules, branding, loading: rulesLoading } = useFinanceRules()
  const settings = rules.guestBilling
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [filter, setFilter] = useState<GuestBillStatus | 'none' | 'all'>('all')
  const [editing, setEditing] = useState<LedgerRow | null>(null)
  const [recording, setRecording] = useState<GuestBill | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const guestsQuery = useQuery({
    queryKey: ['guestFaculty', collegeId],
    queryFn: async () => (await fetchCollegeFaculty(collegeId)).filter(f => f.employmentType !== 'FULL_TIME'),
    enabled: !!collegeId,
  })
  const schedulesQuery = useQuery({
    queryKey: ['weeklySchedules', 'admin', collegeId],
    queryFn: () => fetchWeeklySchedules(collegeId),
    enabled: !!collegeId,
  })
  const billsQuery = useQuery({
    queryKey: ['guestBills', collegeId, month],
    queryFn: () => fetchGuestBills(month),
    enabled: !!collegeId,
  })

  const derived = useMemo(
    () => buildBillingRows(guestsQuery.data ?? [], schedulesQuery.data ?? [], month, settings),
    [guestsQuery.data, schedulesQuery.data, month, settings],
  )

  const ledger: LedgerRow[] = useMemo(() => {
    const byId = new Map<string, LedgerRow>()
    for (const d of derived) byId.set(guestBillId(month, d.profileId), { key: guestBillId(month, d.profileId), derived: d })
    for (const b of billsQuery.data ?? []) {
      const existing = byId.get(b.id)
      byId.set(b.id, { key: b.id, derived: existing?.derived, bill: b })
    }
    return [...byId.values()].sort((a, b) =>
      (a.bill?.name || a.derived?.name || '').localeCompare(b.bill?.name || b.derived?.name || ''))
  }, [derived, billsQuery.data, month])

  const visible = ledger.filter(r => filter === 'all' || (r.bill ? r.bill.status === filter : filter === 'none'))

  const totals = useMemo(() => {
    const active = ledger.filter(r => r.bill?.status !== 'cancelled')
    const netOf = (r: LedgerRow) => r.bill ? r.bill.netAmount : computeGuestBill({ scheduledPeriods: r.derived?.periodsInMonth ?? 0, rate: r.derived?.periodRate ?? 0 }, settings).netAmount
    return {
      guests: ledger.length,
      periods: active.reduce((s, r) => s + (r.bill ? r.bill.billablePeriods : r.derived?.periodsInMonth ?? 0), 0),
      net: active.reduce((s, r) => s + netOf(r), 0),
      recorded: ledger.filter(r => r.bill?.status === 'recorded').reduce((s, r) => s + (r.bill?.netAmount ?? 0), 0),
      notGenerated: ledger.filter(r => !r.bill).length,
      drafts: ledger.filter(r => r.bill?.status === 'draft').length,
      missingRate: derived.filter(r => r.hoursPerWeek > 0 && r.periodRate <= 0).length,
    }
  }, [ledger, derived, settings])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: ledger.length, none: 0, draft: 0, approved: 0, recorded: 0, cancelled: 0 }
    for (const r of ledger) c[r.bill ? r.bill.status : 'none']++
    return c
  }, [ledger])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['guestBills', collegeId, month] })

  const run = async (key: string, fn: () => Promise<void>, ok?: string) => {
    setBusy(key)
    try {
      await fn()
      if (ok) showSuccess(ok)
      await refresh()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  const generateAll = () => run('generate', async () => {
    const drafts = ledger.filter(r => !r.bill && r.derived).map(r => draftFromRow(r.derived!, month, settings))
    if (drafts.length === 0) throw new Error('Every guest already has a bill for this month.')
    const n = await generateGuestBillDrafts(drafts, billsQuery.data ?? [])
    showSuccess(`${n} draft bill${n === 1 ? '' : 's'} generated from the timetable.`)
  })

  const approveAllDrafts = () => run('approveAll', async () => {
    const drafts = ledger.filter(r => r.bill?.status === 'draft').map(r => r.bill!)
    for (const b of drafts) await setGuestBillStatus(b.id, 'approved', { requireApproval: settings.requireApproval })
    showSuccess(`${drafts.length} bill${drafts.length === 1 ? '' : 's'} approved.`)
  })

  const changeStatus = (bill: GuestBill, to: GuestBillStatus, label: string) =>
    run(`${bill.id}:${to}`, () => setGuestBillStatus(bill.id, to, { requireApproval: settings.requireApproval }), label)

  const downloadPdf = async (bill: GuestBill) => {
    try {
      await downloadGuestBillPdf(billToPdfModel(bill, branding, settings.billFooter))
    } catch {
      showError('Could not generate the bill PDF.')
    }
  }

  const exportCsv = () => {
    const q = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const header = ['Bill No', 'Name', 'Staff Code', 'Department', 'Type', 'Rate', 'Timetable periods', 'Extra', 'Not engaged', 'Billable', 'Gross', settings.deductionLabel, 'Net', 'Status', 'Recorded on', 'Reference']
    const lines = ledger.map(r => {
      if (r.bill) {
        const b = r.bill
        return [b.billNo, q(b.name), b.staffCode, q(b.department), b.employmentType, b.periodRate, b.scheduledPeriods, b.extraPeriods, b.absentPeriods, b.billablePeriods, b.grossAmount, b.deductionAmount, b.netAmount, b.status, b.recordedOn || '', q(b.recordedRef || '')].join(',')
      }
      const d = r.derived!
      return ['', q(d.name), d.staffCode, q(d.department), d.employmentType, d.periodRate, d.periodsInMonth, 0, 0, d.periodsInMonth, d.amount, '', d.amount, 'not generated', '', ''].join(',')
    })
    const csv = ledger.some(r => r.bill) ? [`Guest faculty billing ledger — ${month}`, header.join(','), ...lines].join('\r\n') : billingRowsToCsv(derived, month)
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `guest-faculty-billing-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = guestsQuery.isLoading || schedulesQuery.isLoading || billsQuery.isLoading || rulesLoading

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title mb-1 flex items-center gap-2"><Users className="w-7 h-7 text-vriddhi-accent" /> Guest Faculty Billing</h1>
          <p className="text-sm text-vriddhi-muted max-w-2xl">
            Monthly bills for guest / part-time / visiting faculty, derived from the live timetable × per-period rate.
            Adjust, approve and record them — this is a billing ledger; payments are made outside the app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field !w-auto" />
          <button onClick={refresh} className="flex items-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50">
            <RefreshCw className={`w-4 h-4 ${billsQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={exportCsv} disabled={ledger.length === 0} className="flex items-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 disabled:opacity-50">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={generateAll}
            disabled={busy === 'generate' || totals.notGenerated === 0}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-accent text-white rounded-xl text-sm font-medium hover:bg-teal-600 disabled:opacity-50"
          >
            {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Generate bills{totals.notGenerated ? ` (${totals.notGenerated})` : ''}
          </button>
          <Link to="/admin/finance-settings" title="Guest billing settings" className="flex items-center px-3 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-vriddhi-text hover:bg-vriddhi-border/50">
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Guest faculty', value: totals.guests, icon: Users, cls: 'text-vriddhi-accent' },
          { label: `Billable periods · ${monthLabel(month)}`, value: totals.periods, icon: Clock, cls: 'text-blue-500' },
          { label: 'Net payable', value: inr(totals.net), icon: IndianRupee, cls: 'text-amber-500' },
          { label: 'Recorded', value: inr(totals.recorded), icon: CheckCircle2, cls: 'text-green-500' },
        ].map(c => (
          <div key={c.label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-vriddhi-dark/30 flex items-center justify-center"><c.icon className={`w-5 h-5 ${c.cls}`} /></div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900 dark:text-white truncate">{c.value}</p>
              <p className="text-xs text-vriddhi-muted truncate">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {totals.missingRate > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-700 dark:text-amber-400 flex gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {totals.missingRate} scheduled guest {totals.missingRate === 1 ? 'teacher has' : 'teachers have'} no per-period rate. Set it on the faculty
            guest contract, or a default in <Link to="/admin/finance-settings" className="underline">Finance Settings → Guest billing</Link>.
          </span>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'none', 'draft', 'approved', 'recorded', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card border border-vriddhi-border text-vriddhi-muted hover:text-slate-900 dark:hover:text-white'}`}
            >
              {f === 'all' ? 'All' : STATUS_META[f].label} <span className="opacity-70">({counts[f] ?? 0})</span>
            </button>
          ))}
        </div>
        {settings.requireApproval && totals.drafts > 0 && (
          <button onClick={approveAllDrafts} disabled={busy === 'approveAll'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 disabled:opacity-50">
            {busy === 'approveAll' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Approve all drafts ({totals.drafts})
          </button>
        )}
      </div>

      {/* Ledger */}
      {loading ? (
        <div className="glass-card h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" /></div>
      ) : ledger.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-vriddhi-muted">
          No guest faculty found. Mark teachers as Part-time / Adjunct / Visiting (employment type) and set their contract rate —
          they then appear here automatically.
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vriddhi-border">
                  <th className="table-header">Faculty</th>
                  <th className="table-header text-right">Rate</th>
                  <th className="table-header text-center">Timetable</th>
                  <th className="table-header text-center">Billable</th>
                  <th className="table-header text-right">Gross</th>
                  <th className="table-header text-right">Net</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(r => {
                  const b = r.bill
                  const d = r.derived
                  const meta = STATUS_META[b ? b.status : 'none']
                  const Icon = meta.icon
                  const drift = b && d && b.status === 'draft' && b.scheduledPeriods !== d.periodsInMonth
                  return (
                    <tr key={r.key} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-dark/20 transition-colors">
                      <td className="table-cell">
                        <p className="font-medium text-slate-900 dark:text-white">{b?.name || d?.name}</p>
                        <p className="text-xs text-vriddhi-muted">
                          {(b?.staffCode || d?.staffCode) || '—'} · {(b?.department || d?.department) || '—'} · {(b?.employmentType || d?.employmentType || '').replace(/_/g, ' ')}
                          {d?.expired && <span className="ml-1 text-red-500">· contract expired</span>}
                        </p>
                        {b?.billNo && <p className="text-[11px] font-mono text-vriddhi-muted/80">{b.billNo}</p>}
                      </td>
                      <td className="table-cell text-right">{inr(b ? b.periodRate : d?.periodRate ?? 0)}</td>
                      <td className="table-cell text-center">
                        {b ? b.scheduledPeriods : d?.periodsInMonth ?? 0}
                        {d && <span className="block text-[11px] text-vriddhi-muted">{d.hoursPerWeek}/week</span>}
                        {drift && <span className="block text-[10px] text-amber-600">timetable now {d!.periodsInMonth}</span>}
                      </td>
                      <td className="table-cell text-center font-medium">
                        {b ? b.billablePeriods : d?.periodsInMonth ?? 0}
                        {b && (b.extraPeriods > 0 || b.absentPeriods > 0) && (
                          <span className="block text-[11px] text-vriddhi-muted">{b.extraPeriods ? `+${b.extraPeriods}` : ''}{b.absentPeriods ? ` −${b.absentPeriods}` : ''}</span>
                        )}
                      </td>
                      <td className="table-cell text-right">{inr(b ? b.grossAmount : d?.amount ?? 0)}</td>
                      <td className="table-cell text-right font-bold text-slate-900 dark:text-white">
                        {inr(b ? b.netAmount : computeGuestBill({ scheduledPeriods: d?.periodsInMonth ?? 0, rate: d?.periodRate ?? 0 }, settings).netAmount)}
                        {b && b.deductionAmount > 0 && <span className="block text-[11px] font-normal text-vriddhi-muted">−{inr(b.deductionAmount)} {b.deductionLabel}</span>}
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}><Icon className="w-3 h-3" /> {meta.label}</span>
                        {b?.status === 'recorded' && b.recordedOn && <span className="block text-[10px] text-vriddhi-muted mt-0.5">{b.recordedOn}{b.recordedRef ? ` · ${b.recordedRef}` : ''}</span>}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {!b && d && (
                            <ActionBtn onClick={() => setEditing(r)} icon={Plus} label="Create bill" tone="accent" />
                          )}
                          {b?.status === 'draft' && (
                            <>
                              <ActionBtn onClick={() => setEditing(r)} icon={Pencil} label="Edit" />
                              {settings.requireApproval ? (
                                <ActionBtn onClick={() => changeStatus(b, 'approved', 'Bill approved.')} icon={ShieldCheck} label="Approve" tone="blue" busy={busy === `${b.id}:approved`} />
                              ) : (
                                <ActionBtn onClick={() => setRecording(b)} icon={CheckCircle2} label="Record" tone="green" />
                              )}
                              <ActionBtn onClick={() => run(`${b.id}:del`, () => deleteGuestBill(b), 'Draft deleted.')} icon={Trash2} label="" tone="red" title="Delete draft" />
                            </>
                          )}
                          {b?.status === 'approved' && (
                            <>
                              <ActionBtn onClick={() => setRecording(b)} icon={CheckCircle2} label="Record" tone="green" />
                              <ActionBtn onClick={() => changeStatus(b, 'draft', 'Bill reverted to draft.')} icon={RotateCcw} label="" title="Revert to draft" />
                            </>
                          )}
                          {b?.status === 'cancelled' && (
                            <ActionBtn onClick={() => changeStatus(b, 'draft', 'Bill restored as draft.')} icon={RotateCcw} label="Restore" />
                          )}
                          {b && (b.status === 'draft' || b.status === 'approved') && (
                            <ActionBtn onClick={() => changeStatus(b, 'cancelled', 'Bill cancelled.')} icon={X} label="" tone="red" title="Cancel bill" />
                          )}
                          {b && b.status !== 'cancelled' && (
                            <ActionBtn onClick={() => downloadPdf(b)} icon={Download} label="PDF" tone="accent" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-sm text-vriddhi-muted">Nothing in this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <BillEditor
          row={editing}
          month={month}
          settings={settings}
          onClose={() => setEditing(null)}
          onSave={async draft => {
            await saveGuestBillDraft(draft, editing.bill ? 'Edited draft' : 'Created bill')
            showSuccess(`Bill saved for ${draft.name}.`)
            setEditing(null)
            await refresh()
          }}
        />
      )}

      {recording && (
        <RecordBillModal
          bill={recording}
          onClose={() => setRecording(null)}
          onRecord={async (recordedOn, recordedRef, note) => {
            await setGuestBillStatus(recording.id, 'recorded', { requireApproval: settings.requireApproval, recordedOn, recordedRef, note })
            showSuccess(`Bill recorded for ${recording.name}.`)
            setRecording(null)
            await refresh()
          }}
        />
      )}
    </div>
  )
}

// ─── Small pieces ─────────────────────────────────────────
const TONES: Record<string, string> = {
  default: 'bg-vriddhi-border/40 text-vriddhi-muted hover:text-slate-900 dark:hover:text-white',
  accent: 'bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25',
  green: 'bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
}

function ActionBtn({ onClick, icon: Icon, label, tone = 'default', busy, title }: {
  onClick: () => void; icon: typeof Clock; label: string; tone?: keyof typeof TONES; busy?: boolean; title?: string
}) {
  return (
    <button onClick={onClick} disabled={busy} title={title || label} className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${TONES[tone]}`}>
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {label}
    </button>
  )
}

function BillEditor({ row, month, settings, onClose, onSave }: {
  row: LedgerRow
  month: string
  settings: GuestBillingSettings
  onClose: () => void
  onSave: (draft: GuestBillDraft) => Promise<void>
}) {
  const b = row.bill
  const base: BillingRow = row.derived ?? {
    profileId: b!.facultyProfileId, uid: b!.facultyUid, name: b!.name, staffCode: b!.staffCode, department: b!.department,
    employmentType: b!.employmentType, periodRate: b!.periodRate, hoursPerWeek: 0, periodsInMonth: b!.scheduledPeriods,
    amount: b!.periodAmount, contract: '', expired: false,
  }
  const [scheduled, setScheduled] = useState(b ? b.scheduledPeriods : base.periodsInMonth)
  const [extra, setExtra] = useState(b?.extraPeriods ?? 0)
  const [absent, setAbsent] = useState(b?.absentPeriods ?? 0)
  const [rate, setRate] = useState(b ? b.periodRate : base.periodRate)
  const [adjustments, setAdjustments] = useState<BillAdjustment[]>(b?.adjustments ?? [])
  const [remarks, setRemarks] = useState(b?.remarks ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totals = computeGuestBill({ scheduledPeriods: scheduled, extraPeriods: extra, absentPeriods: absent, rate, adjustments }, settings)

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      const draft = draftFromRow(base, month, settings, {
        scheduledPeriods: scheduled, extraPeriods: extra, absentPeriods: absent, rate,
        adjustments: adjustments.filter(a => a.label.trim() || a.amount),
        remarks: remarks.trim() || undefined,
      })
      await onSave(b ? { ...draft, billNo: b.billNo || draft.billNo, deductionPercent: settings.deductionPercent } : draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the bill.')
    } finally {
      setSaving(false)
    }
  }

  const num = (v: string) => Math.max(0, Number(v) || 0)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-vriddhi-card flex items-center justify-between p-5 border-b border-vriddhi-border">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{b ? 'Edit bill' : 'Create bill'} · {base.name}</h2>
            <p className="text-xs text-vriddhi-muted">{monthLabel(month)} · {base.department || '—'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-vriddhi-muted" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <label className="text-xs text-vriddhi-muted">Timetable periods<input type="number" className="input-field mt-1" value={scheduled} onChange={e => setScheduled(num(e.target.value))} /></label>
            <label className="text-xs text-vriddhi-muted">+ Extra periods<input type="number" className="input-field mt-1" value={extra} onChange={e => setExtra(num(e.target.value))} /></label>
            <label className="text-xs text-vriddhi-muted">− Not engaged<input type="number" className="input-field mt-1" value={absent} onChange={e => setAbsent(num(e.target.value))} /></label>
            <label className="text-xs text-vriddhi-muted">Rate / period (₹)<input type="number" className="input-field mt-1" value={rate} onChange={e => setRate(num(e.target.value))} /></label>
          </div>
          {row.derived && scheduled !== row.derived.periodsInMonth && (
            <p className="text-[11px] text-amber-600">Timetable shows {row.derived.periodsInMonth} periods for this month. <button className="underline" onClick={() => setScheduled(row.derived!.periodsInMonth)}>Use timetable</button></p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Adjustments</p>
              <button onClick={() => setAdjustments(a => [...a, { label: '', amount: 0 }])} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-vriddhi-accent/15 text-vriddhi-accent"><Plus className="w-3.5 h-3.5" /> Add</button>
            </div>
            {adjustments.length === 0 && <p className="text-xs text-vriddhi-muted">e.g. exam invigilation (+), valuation (+), advance recovery (− use a negative amount).</p>}
            {adjustments.map((a, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input placeholder="Label" value={a.label} onChange={e => setAdjustments(l => l.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="input-field col-span-7" />
                <input type="number" placeholder="± ₹" value={a.amount} onChange={e => setAdjustments(l => l.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) || 0 } : x)))} className="input-field col-span-4" />
                <button onClick={() => setAdjustments(l => l.filter((_, j) => j !== i))} className="col-span-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          <label className="block text-xs text-vriddhi-muted">Remarks<textarea rows={2} className="input-field mt-1" value={remarks} onChange={e => setRemarks(e.target.value)} /></label>

          <div className="rounded-xl border border-vriddhi-border p-4 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-vriddhi-muted">Billable periods</span><span>{totals.billablePeriods}{totals.capped ? ' (capped)' : ''} × {inr(rate)} = {inr(totals.periodAmount)}</span></div>
            {totals.adjustmentsTotal !== 0 && <div className="flex justify-between"><span className="text-vriddhi-muted">Adjustments</span><span>{inr(totals.adjustmentsTotal)}</span></div>}
            <div className="flex justify-between"><span className="text-vriddhi-muted">Gross</span><span>{inr(totals.grossAmount)}</span></div>
            {totals.deductionAmount > 0 && <div className="flex justify-between"><span className="text-vriddhi-muted">{settings.deductionLabel} @ {settings.deductionPercent}%</span><span>− {inr(totals.deductionAmount)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-vriddhi-border font-bold text-slate-900 dark:text-white"><span>Net payable</span><span>{inr(totals.netAmount)}</span></div>
          </div>

          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>}
        </div>
        <div className="p-5 border-t border-vriddhi-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save draft
          </button>
        </div>
      </div>
    </div>
  )
}

function RecordBillModal({ bill, onClose, onRecord }: {
  bill: GuestBill
  onClose: () => void
  onRecord: (recordedOn: string, recordedRef: string, note: string) => Promise<void>
}) {
  const [on, setOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [ref, setRef] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record bill · {bill.name}</h2>
          <p className="text-sm text-vriddhi-muted">Net {inr(bill.netAmount)} · {bill.billNo}. Enter how it was paid outside the app.</p>
        </div>
        <label className="block text-xs text-vriddhi-muted">Paid / recorded on<input type="date" className="input-field mt-1" value={on} onChange={e => setOn(e.target.value)} /></label>
        <label className="block text-xs text-vriddhi-muted">Payment reference (cheque / NEFT / voucher no.)<input className="input-field mt-1 font-mono" value={ref} onChange={e => setRef(e.target.value)} /></label>
        <label className="block text-xs text-vriddhi-muted">Note (optional)<input className="input-field mt-1" value={note} onChange={e => setNote(e.target.value)} /></label>
        <p className="text-[11px] text-vriddhi-muted">Recorded bills are locked for audit.</p>
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border">Cancel</button>
          <button
            onClick={async () => { setSaving(true); setError(null); try { await onRecord(on, ref.trim(), note.trim()) } catch (err) { setError(err instanceof Error ? err.message : 'Could not record.') } finally { setSaving(false) } }}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Mark recorded
          </button>
        </div>
      </div>
    </div>
  )
}
