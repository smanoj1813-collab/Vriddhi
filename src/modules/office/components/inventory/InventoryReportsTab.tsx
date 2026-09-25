// Inventory reports: fixed-asset schedule (block-wise depreciation for the
// financial year, as auditors want it), asset register PDF, stock
// valuation and consumption by department.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText } from 'lucide-react'
import { Loading, btn, downloadCsv, inr } from '../officeUi'
import { fetchMovements } from '../../api/inventoryApi'
import { depreciationSchedule, fyStartYear, type InventorySettings } from '../../utils/inventoryEngine'
import { downloadReportPdf, pdfMoney } from '../../utils/reportPdf'
import { todayIso } from '../../api/officeDb'
import { useBranding, useCollegeId } from '../../hooks/useLibrary'
import { useAssets, useItems } from '../../hooks/useInventory'

export default function InventoryReportsTab({ settings }: { settings: InventorySettings }) {
  const cid = useCollegeId()
  const branding = useBranding()
  const assetsQ = useAssets()
  const itemsQ = useItems()
  const [fy, setFy] = useState(fyStartYear(todayIso()))
  const from = `${fy}-04-01`
  const to = `${fy + 1}-03-31`
  const fyLabel = `${fy}-${String((fy + 1) % 100).padStart(2, '0')}`
  const movesQ = useQuery({ queryKey: ['inventory', cid, 'moves', from, to], queryFn: () => fetchMovements({ from, to }), enabled: !!cid })

  const blocks = useMemo(() => {
    const m = new Map<string, { block: string; opening: number; additions: number; deletions: number; depreciation: number; closing: number; count: number }>()
    for (const a of assetsQ.data || []) {
      const s = depreciationSchedule({ cost: a.cost, purchaseDate: a.purchaseDate, method: a.method, rate: a.rate, salvage: a.salvage, asOfFy: fy, disposedOn: a.disposal?.date, fullWriteOffBelow: settings.fullWriteOffBelow })
      const row = s.find(y => y.fy === fyLabel)
      if (!row) continue
      const e = m.get(a.category) || { block: `${a.category} (${a.method} ${a.rate}%)`, opening: 0, additions: 0, deletions: 0, depreciation: 0, closing: 0, count: 0 }
      e.opening += row.opening
      e.additions += row.addition
      e.depreciation += row.depreciation
      const disposedThisYear = a.disposal?.date && fyStartYear(a.disposal.date) === fy
      if (disposedThisYear) e.deletions += row.closing
      e.closing += disposedThisYear ? 0 : row.closing
      e.count += disposedThisYear ? 0 : 1
      m.set(a.category, e)
    }
    return [...m.values()].sort((a, b) => b.closing - a.closing)
  }, [assetsQ.data, fy, fyLabel, settings.fullWriteOffBelow])

  const consumption = useMemo(() => {
    const m = new Map<string, number>()
    ;(movesQ.data || []).filter(x => x.type === 'out').forEach(x => m.set(x.department || 'Unspecified', (m.get(x.department || 'Unspecified') || 0) + x.value))
    return [...m.entries()].map(([department, value]) => ({ department, value })).sort((a, b) => b.value - a.value)
  }, [movesQ.data])
  const purchases = (movesQ.data || []).filter(x => x.type === 'in').reduce((s, x) => s + x.value, 0)
  const stockValue = (itemsQ.data || []).reduce((s, i) => s + i.qty * i.avgCost, 0)
  const tot = blocks.reduce((t, b) => ({ opening: t.opening + b.opening, additions: t.additions + b.additions, deletions: t.deletions + b.deletions, depreciation: t.depreciation + b.depreciation, closing: t.closing + b.closing }), { opening: 0, additions: 0, deletions: 0, depreciation: 0, closing: 0 })

  const pdf = () => void downloadReportPdf({
    collegeName: branding.collegeName || 'College',
    address: branding.address,
    title: `Fixed assets & stores — FY ${fyLabel}`,
    subtitle: `${from} to ${to}`,
    filename: `fixed-assets-${fyLabel}.pdf`,
    landscape: true,
    sections: [
      { heading: 'Schedule of fixed assets (written-down value)', table: { head: ['Block', 'Opening WDV', 'Additions', 'Deletions', 'Depreciation', 'Closing WDV', 'Units'], body: [...blocks.map(b => [b.block, pdfMoney(b.opening), pdfMoney(b.additions), pdfMoney(b.deletions), pdfMoney(b.depreciation), pdfMoney(b.closing), b.count]), ['Total', pdfMoney(tot.opening), pdfMoney(tot.additions), pdfMoney(tot.deletions), pdfMoney(tot.depreciation), pdfMoney(tot.closing), '']] }, note: 'Depreciation pro-rata by days in the year of purchase / disposal; rates as configured per category in Inventory Settings.' },
      { heading: 'Consumable stores', rows: [['Purchases during the year', pdfMoney(purchases)], ['Closing stock value (moving average)', pdfMoney(stockValue)]] },
      { heading: 'Consumption by department', table: { head: ['Department', 'Value issued'], body: consumption.map(c => [c.department, pdfMoney(c.value)]) } },
    ],
  })

  const registerCsv = () => downloadCsv(`fixed-asset-schedule-${fyLabel}.csv`, blocks.map(b => ({ block: b.block, opening: b.opening.toFixed(2), additions: b.additions.toFixed(2), deletions: b.deletions.toFixed(2), depreciation: b.depreciation.toFixed(2), closing: b.closing.toFixed(2), units: b.count })))

  if (assetsQ.isLoading) return <Loading />
  const years = Array.from({ length: 8 }, (_, i) => fyStartYear(todayIso()) - i)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input-field !w-auto" value={fy} onChange={e => setFy(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>FY {y}-{String((y + 1) % 100).padStart(2, '0')}</option>)}</select>
        <div className="flex-1" />
        <button onClick={registerCsv} className={btn.ghost}><Download className="w-4 h-4" /> Schedule CSV</button>
        <button onClick={pdf} className={btn.primary}><FileText className="w-4 h-4" /> PDF for audit</button>
      </div>
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Block</th><th className="table-header text-right">Opening</th><th className="table-header text-right">Additions</th><th className="table-header text-right">Deletions</th><th className="table-header text-right">Depreciation</th><th className="table-header text-right">Closing WDV</th></tr></thead>
          <tbody>
            {blocks.map(b => <tr key={b.block} className="border-b border-vriddhi-border/50"><td className="table-cell">{b.block}<span className="block text-xs text-vriddhi-muted">{b.count} units</span></td><td className="table-cell text-right">{inr(b.opening)}</td><td className="table-cell text-right">{inr(b.additions)}</td><td className="table-cell text-right">{inr(b.deletions)}</td><td className="table-cell text-right">{inr(b.depreciation)}</td><td className="table-cell text-right font-semibold">{inr(b.closing)}</td></tr>)}
            <tr className="font-semibold"><td className="table-cell">Total</td><td className="table-cell text-right">{inr(tot.opening)}</td><td className="table-cell text-right">{inr(tot.additions)}</td><td className="table-cell text-right">{inr(tot.deletions)}</td><td className="table-cell text-right">{inr(tot.depreciation)}</td><td className="table-cell text-right">{inr(tot.closing)}</td></tr>
          </tbody>
        </table>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-4 text-sm"><p className="font-medium text-slate-900 dark:text-white mb-2">Stores</p><p>Purchases this FY: <b>{inr(purchases)}</b></p><p>Closing stock value: <b>{inr(stockValue)}</b></p></div>
        <div className="glass-card p-4 text-sm"><p className="font-medium text-slate-900 dark:text-white mb-2">Consumption by department</p>{consumption.length ? consumption.map(c => <p key={c.department} className="flex justify-between"><span>{c.department}</span><span>{inr(c.value)}</span></p>) : <p className="text-vriddhi-muted">No issues recorded.</p>}</div>
      </div>
    </div>
  )
}
