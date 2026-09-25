// /admin/finance-reports — day book, collection summary and Tally export
// (accounts team + principal). Payroll entries appear only for roles the
// college lets see payroll.

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, BookOpen, Download, FileCode, FileText, Play, Save } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { roleHasPermission } from '@/modules/auth/permissions'
import { useAccessSettings } from '@/modules/admin/hooks/useAccessSettings'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Badge, Empty, Field, Loading, PageHeader, PillTabs, StatCard, btn, downloadCsv, errMsg, fmtDate, inr } from '../components/officeUi'
import { buildDaybook } from '../api/financeReportsApi'
import { fetchTallyLedgers, saveTallyLedgers } from '../api/tallyApi'
import { useBranding, useCollegeId } from '../hooks/useLibrary'
import { todayIso } from '../api/officeDb'
import { buildTallyXml, entryToVoucher, summarizeDaybook, voucherBalances, type DaybookEntry, type TallyLedgerMap, type TallyVoucher } from '../utils/tallyExport'
import { downloadReportPdf, pdfMoney } from '../utils/reportPdf'

type Tab = 'daybook' | 'summary' | 'tally' | 'ledgers'
const KIND_LABEL: Record<DaybookEntry['kind'], string> = {
  fee_receipt: 'Fee receipt',
  fine_receipt: 'Library fine',
  vendor_bill: 'Vendor bill (booked)',
  vendor_payment: 'Vendor payment',
  salary_payment: 'Salary',
  guest_payment: 'Guest faculty',
}
const isReceipt = (k: DaybookEntry['kind']) => k === 'fee_receipt' || k === 'fine_receipt'

function saveBlob(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function FinanceReportsPage() {
  const { user } = useAuth()
  const { access } = useAccessSettings()
  const cid = useCollegeId()
  const branding = useBranding()
  const { showError } = useNotification()
  const canPayroll = roleHasPermission((user?.role || 'student') as never, 'payroll.view', access)
  const today = todayIso()
  const [tab, setTab] = useState<Tab>('daybook')
  const [from, setFrom] = useState(today.slice(0, 8) + '01')
  const [to, setTo] = useState(today)
  const [inc, setInc] = useState({ fees: true, fines: true, vendors: true, payroll: canPayroll })
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<{ entries: DaybookEntry[]; warnings: string[]; from: string; to: string } | null>(null)
  const ledgersQ = useQuery({ queryKey: ['tallyLedgers', cid], queryFn: () => fetchTallyLedgers(cid), enabled: !!cid })

  const run = useMutation({
    mutationFn: async () => {
      if (!from || !to || from > to) throw new Error('Choose a valid date range.')
      const r = await buildDaybook({ from, to, includeFees: inc.fees, includeFines: inc.fines, includeVendors: inc.vendors, includePayroll: inc.payroll && canPayroll, onProgress: setProgress })
      return { ...r, from, to }
    },
    onSuccess: r => { setResult(r); setProgress('') },
    onError: e => { setProgress(''); showError(errMsg(e)) },
  })

  const entries = result?.entries || []
  const summary = useMemo(() => summarizeDaybook(entries), [entries])
  const period = result ? `${fmtDate(result.from)} – ${fmtDate(result.to)}` : ''

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="Finance Reports" subtitle="Day book, collections and Tally export" icon={<BarChart3 className="w-5 h-5" />} />
      <div className="glass-card p-4 mb-4 flex flex-wrap items-end gap-3">
        <Field label="From"><input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-3 text-sm pb-2">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={inc.fees} onChange={e => setInc({ ...inc, fees: e.target.checked })} />Fee receipts</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={inc.fines} onChange={e => setInc({ ...inc, fines: e.target.checked })} />Library fines</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={inc.vendors} onChange={e => setInc({ ...inc, vendors: e.target.checked })} />Vendor bills & payments</label>
          {canPayroll && <label className="flex items-center gap-1.5"><input type="checkbox" checked={inc.payroll} onChange={e => setInc({ ...inc, payroll: e.target.checked })} />Salaries & guest faculty</label>}
        </div>
        <button className={`${btn.primary} ml-auto`} disabled={run.isPending} onClick={() => run.mutate()}><Play className="w-4 h-4" />{run.isPending ? progress || 'Building…' : 'Generate'}</button>
      </div>
      <PillTabs value={tab} onChange={setTab} options={[{ id: 'daybook', label: 'Day book', count: entries.length || undefined }, { id: 'summary', label: 'Collection summary' }, { id: 'tally', label: 'Tally export' }, { id: 'ledgers', label: 'Tally ledger mapping' }]} />
      <div className="mt-4">
        {tab === 'ledgers' ? (ledgersQ.isLoading ? <Loading /> : <LedgerForm initial={ledgersQ.data!} />) : run.isPending ? <Loading label={progress || 'Building day book…'} /> : !result ? (
          <Empty icon={<BookOpen className="w-8 h-8" />} title="Choose a period and generate" hint="Receipts from the fee ledger and library desk, vendor bills and payments, and (if permitted) payroll." />
        ) : (
          <>
            {result.warnings.length > 0 && <div className="mb-3 p-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm">{result.warnings.join(' ')}</div>}
            {tab === 'daybook' && <Daybook entries={entries} period={period} collegeName={branding.collegeName} address={branding.address} />}
            {tab === 'summary' && <Summary entries={entries} summary={summary} period={period} collegeName={branding.collegeName} address={branding.address} />}
            {tab === 'tally' && (ledgersQ.data ? <TallyExport entries={entries} ledgers={ledgersQ.data} period={result} /> : <Loading />)}
          </>
        )}
      </div>
    </div>
  )
}

function Daybook({ entries, period, collegeName, address }: { entries: DaybookEntry[]; period: string; collegeName: string; address: string }) {
  let running = 0
  const rows = entries.map(e => {
    const receipt = isReceipt(e.kind)
    const cash = e.kind !== 'vendor_bill'
    if (cash) running += receipt ? e.amount : -e.amount
    return { e, receipt, cash, running }
  })
  const csv = () => downloadCsv(`daybook.csv`, rows.map(r => ({ Date: r.e.date, Type: KIND_LABEL[r.e.kind], Ref: r.e.ref, Party: r.e.party, Narration: r.e.narration, Mode: r.e.mode || '', Receipt: r.receipt ? r.e.amount : '', Payment: r.cash && !r.receipt ? r.e.amount : '', 'Bill booked': r.cash ? '' : r.e.amount, 'Net (running)': r.cash ? r.running : '' })))
  const pdf = () =>
    downloadReportPdf({
      collegeName: collegeName || 'College',
      address,
      title: 'DAY BOOK',
      subtitle: period,
      landscape: true,
      sections: [{ heading: `${entries.length} entries`, table: { head: ['Date', 'Type', 'Ref', 'Party', 'Mode', 'Receipt', 'Payment'], body: rows.filter(r => r.cash).map(r => [fmtDate(r.e.date), KIND_LABEL[r.e.kind], r.e.ref, r.e.party, (r.e.mode || '').toUpperCase(), r.receipt ? pdfMoney(r.e.amount) : '', r.receipt ? '' : pdfMoney(r.e.amount)]), align: ['left', 'left', 'left', 'left', 'left', 'right', 'right'] } }],
      filename: 'daybook.pdf',
    })
  if (!entries.length) return <Empty icon={<BookOpen className="w-8 h-8" />} title="No transactions in this period" />
  return (
    <>
      <div className="flex justify-end gap-2 mb-2"><button className={btn.ghost} onClick={csv}><Download className="w-4 h-4" />CSV</button><button className={btn.ghost} onClick={pdf}><FileText className="w-4 h-4" />PDF</button></div>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-vriddhi-muted border-b border-vriddhi-border"><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Ref</th><th className="p-2">Party / narration</th><th className="p-2">Mode</th><th className="p-2 text-right">Receipt</th><th className="p-2 text-right">Payment</th><th className="p-2 text-right">Net</th></tr></thead>
          <tbody>
            {rows.map(({ e, receipt, cash, running }, i) => (
              <tr key={i} className={`border-b border-vriddhi-border/40 ${cash ? '' : 'opacity-70'}`}>
                <td className="p-2 whitespace-nowrap">{fmtDate(e.date)}</td>
                <td className="p-2"><Badge tone={receipt ? 'green' : cash ? 'red' : 'slate'}>{KIND_LABEL[e.kind]}</Badge></td>
                <td className="p-2 font-mono text-xs">{e.ref}</td>
                <td className="p-2">{e.party}<div className="text-xs text-vriddhi-muted">{e.narration}</div></td>
                <td className="p-2 uppercase text-xs">{e.mode || ''}</td>
                <td className="p-2 text-right">{receipt ? inr(e.amount) : ''}</td>
                <td className="p-2 text-right">{cash && !receipt ? inr(e.amount) : !cash ? <span className="text-xs">({inr(e.amount)} booked)</span> : ''}</td>
                <td className="p-2 text-right">{cash ? inr(running) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Summary({ entries, summary, period, collegeName, address }: { entries: DaybookEntry[]; summary: ReturnType<typeof summarizeDaybook>; period: string; collegeName: string; address: string }) {
  const byCategory = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of entries) if (e.kind === 'fee_receipt') m[e.category || 'other'] = (m[e.category || 'other'] || 0) + e.amount
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [entries])
  const byDay = useMemo(() => {
    const m: Record<string, number> = {}
    for (const e of entries) if (isReceipt(e.kind)) m[e.date] = (m[e.date] || 0) + e.amount
    return Object.entries(m).sort()
  }, [entries])
  const max = Math.max(1, ...byDay.map(d => d[1]))
  const pdf = () =>
    downloadReportPdf({
      collegeName: collegeName || 'College',
      address,
      title: 'COLLECTION SUMMARY',
      subtitle: period,
      sections: [
        { heading: 'Totals', rows: [['Total receipts', pdfMoney(summary.receipts)], ['Fee receipts', pdfMoney(summary.byKind.fee_receipt)], ['Library fines (desk)', pdfMoney(summary.byKind.fine_receipt)], ['Payments', pdfMoney(summary.payments)], ['Vendor bills booked', pdfMoney(summary.billsBooked)]] },
        { heading: 'By mode', table: { head: ['Mode', 'Amount'], body: Object.entries(summary.byMode).map(([k, v]) => [k.toUpperCase(), pdfMoney(v)]), align: ['left', 'right'] } },
        { heading: 'Fee receipts by category', table: { head: ['Category', 'Amount'], body: byCategory.map(([k, v]) => [k, pdfMoney(v)]), align: ['left', 'right'] } },
        { heading: 'Day-wise receipts', table: { head: ['Date', 'Amount'], body: byDay.map(([d, v]) => [fmtDate(d), pdfMoney(v)]), align: ['left', 'right'] } },
      ],
      filename: 'collection-summary.pdf',
    })
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Receipts" value={inr(summary.receipts)} icon={<BarChart3 className="w-5 h-5" />} tone="text-emerald-500" />
        <StatCard label="Library fines (desk)" value={inr(summary.byKind.fine_receipt)} icon={<BookOpen className="w-5 h-5" />} />
        <StatCard label="Payments" value={inr(summary.payments)} icon={<BarChart3 className="w-5 h-5" />} tone="text-red-500" />
        <StatCard label="Bills booked" value={inr(summary.billsBooked)} icon={<FileText className="w-5 h-5" />} />
      </div>
      <div className="flex justify-end"><button className={btn.ghost} onClick={pdf}><FileText className="w-4 h-4" />PDF</button></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">By mode</h3>
          {Object.entries(summary.byMode).map(([k, v]) => <div key={k} className="flex justify-between text-sm py-1 border-b border-vriddhi-border/40"><span className="uppercase">{k}</span><span>{inr(v)}</span></div>)}
          <h3 className="font-semibold mt-4 mb-2">Fee receipts by category</h3>
          {byCategory.map(([k, v]) => <div key={k} className="flex justify-between text-sm py-1 border-b border-vriddhi-border/40"><span className="capitalize">{k.replace(/_/g, ' ')}</span><span>{inr(v)}</span></div>)}
        </div>
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">Day-wise receipts</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {byDay.map(([d, v]) => <div key={d} className="flex items-center gap-2 text-xs"><span className="w-20 shrink-0">{fmtDate(d)}</span><div className="flex-1 h-3 rounded bg-vriddhi-border/30"><div className="h-3 rounded bg-emerald-500" style={{ width: `${(v / max) * 100}%` }} /></div><span className="w-24 text-right">{inr(v)}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}

function TallyExport({ entries, ledgers, period }: { entries: DaybookEntry[]; ledgers: TallyLedgerMap; period: { from: string; to: string } }) {
  const [kinds, setKinds] = useState<Record<DaybookEntry['kind'], boolean>>({ fee_receipt: true, fine_receipt: true, vendor_bill: true, vendor_payment: true, salary_payment: true, guest_payment: true })
  const vouchers = useMemo(() => entries.filter(e => kinds[e.kind]).map(e => entryToVoucher(e, ledgers)).filter((v): v is TallyVoucher => !!v), [entries, kinds, ledgers])
  const unbalanced = vouchers.filter(v => !voucherBalances(v)).length
  const usedLedgers = Array.from(new Set(vouchers.flatMap(v => v.lines.map(l => l.ledger)))).sort()
  const name = `tally-${period.from}-to-${period.to}`
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <h3 className="font-semibold mb-2">Include</h3>
        <div className="flex flex-wrap gap-3 text-sm">
          {(Object.keys(KIND_LABEL) as DaybookEntry['kind'][]).map(k => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" checked={kinds[k]} onChange={e => setKinds({ ...kinds, [k]: e.target.checked })} />{KIND_LABEL[k]} ({entries.filter(x => x.kind === k).length})</label>)}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button className={btn.primary} disabled={!vouchers.length || unbalanced > 0} onClick={() => saveBlob(buildTallyXml(vouchers, ledgers), 'application/xml', `${name}.xml`)}><FileCode className="w-4 h-4" />Download Tally XML ({vouchers.length} vouchers)</button>
          <button className={btn.ghost} disabled={!vouchers.length} onClick={() => downloadCsv(`${name}.csv`, vouchers.flatMap(v => v.lines.map(l => ({ Date: v.date, 'Voucher type': v.type, 'Voucher no': v.number, Party: v.party, Ledger: l.ledger, Debit: l.debit || '', Credit: l.credit || '', Narration: v.narration }))))}><Download className="w-4 h-4" />Voucher CSV</button>
        </div>
        {unbalanced > 0 && <p className="text-sm text-red-500 mt-2">{unbalanced} voucher(s) don't balance — check the entries.</p>}
      </div>
      <div className="glass-card p-4 text-sm">
        <h3 className="font-semibold mb-2">Before importing</h3>
        <ol className="list-decimal ml-5 space-y-1 text-vriddhi-muted">
          <li>These ledgers must exist in Tally with exactly these names: <span className="text-vriddhi-text">{usedLedgers.join(', ') || '—'}</span>{ledgers.vendorLedgerMode === 'party' && ' (vendor ledgers are named after each vendor)'}.</li>
          <li>Company in Tally: <b className="text-vriddhi-text">{ledgers.companyName || 'the currently open company'}</b>. Set it under "Tally ledger mapping".</li>
          <li>Tally Prime: Gateway of Tally → Import → Vouchers → choose the XML file. (ERP 9: Import of Data → Vouchers.)</li>
          <li>Import each period once — re-importing creates duplicate vouchers.</li>
        </ol>
      </div>
    </div>
  )
}

function LedgerForm({ initial }: { initial: TallyLedgerMap }) {
  const [m, setM] = useState<TallyLedgerMap>(initial)
  const cid = useCollegeId()
  const qc = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const save = useMutation({ mutationFn: () => saveTallyLedgers(m), onSuccess: () => { showSuccess('Ledger mapping saved'); qc.invalidateQueries({ queryKey: ['tallyLedgers', cid] }) }, onError: e => showError(errMsg(e)) })
  const f = (k: keyof TallyLedgerMap, label: string, hint?: string) => (
    <Field label={label} hint={hint}><input className="input-field" value={String(m[k] ?? '')} onChange={e => setM({ ...m, [k]: e.target.value })} /></Field>
  )
  const cats = Object.keys(m.feeIncome)
  const [newCat, setNewCat] = useState('')
  return (
    <div className="space-y-4 pb-16">
      <section className="glass-card p-4 grid sm:grid-cols-3 gap-3">
        <h3 className="font-semibold sm:col-span-3">Company & voucher types</h3>
        {f('companyName', 'Tally company name', 'Exactly as shown in Tally, e.g. "ABC College 2026-27"')}
        {f('receiptVoucherType', 'Receipt voucher type')}
        {f('paymentVoucherType', 'Payment voucher type')}
        {f('journalVoucherType', 'Journal voucher type')}
      </section>
      <section className="glass-card p-4 grid sm:grid-cols-3 gap-3">
        <h3 className="font-semibold sm:col-span-3">Cash, bank & expenses</h3>
        {f('cashLedger', 'Cash ledger', 'Used for cash receipts / payments')}
        {f('bankLedger', 'Bank ledger', 'UPI, cards, NEFT, cheque')}
        {f('libraryFineLedger', 'Library fines (income)')}
        {f('purchaseLedger', 'Purchases / expenses')}
        {f('tdsPayableLedger', 'TDS payable')}
        {f('salaryLedger', 'Salaries')}
        {f('guestFacultyLedger', 'Guest faculty remuneration')}
        <Field label="Vendor ledgers">
          <select className="input-field" value={m.vendorLedgerMode} onChange={e => setM({ ...m, vendorLedgerMode: e.target.value as TallyLedgerMap['vendorLedgerMode'] })}>
            <option value="party">One ledger per vendor (vendor name)</option>
            <option value="single">Single creditors ledger</option>
          </select>
        </Field>
        {m.vendorLedgerMode === 'single' && f('sundryCreditorsLedger', 'Creditors ledger')}
      </section>
      <section className="glass-card p-4">
        <h3 className="font-semibold mb-3">Fee income ledgers (by fee category)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {cats.map(c => <Field key={c} label={c.replace(/_/g, ' ')}><input className="input-field" value={m.feeIncome[c]} onChange={e => setM({ ...m, feeIncome: { ...m.feeIncome, [c]: e.target.value } })} /></Field>)}
          {f('feeIncomeDefault', 'Any other category')}
        </div>
        <div className="flex gap-2 mt-3">
          <input className="input-field max-w-xs" placeholder="Category key, e.g. placement" value={newCat} onChange={e => setNewCat(e.target.value)} />
          <button className={btn.small} onClick={() => { const k = newCat.trim().toLowerCase().replace(/\s+/g, '_'); if (k) { setM({ ...m, feeIncome: { ...m.feeIncome, [k]: m.feeIncomeDefault } }); setNewCat('') } }}>Add category</button>
        </div>
      </section>
      <div className="fixed bottom-4 right-4 md:right-8 z-20"><button className={`${btn.primary} shadow-lg`} disabled={save.isPending} onClick={() => save.mutate()}><Save className="w-4 h-4" />{save.isPending ? 'Saving…' : 'Save mapping'}</button></div>
    </div>
  )
}
