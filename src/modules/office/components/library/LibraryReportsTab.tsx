// Library reports — annual / NAAC Criterion 4.2 figures for any academic or
// financial year, downloadable as PDF (for the SSR / AQAR folder) or CSV.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, BookOpen, Download, FileText, Library, Users } from 'lucide-react'
import { Loading, StatCard, btn, downloadCsv, inr } from '../officeUi'
import { fetchLoansBetween, fetchVisits } from '../../api/libraryApi'
import { buildLibraryAnnualReport, yearBounds } from '../../utils/libraryReports'
import { downloadReportPdf, pdfMoney } from '../../utils/reportPdf'
import type { LibrarySettings } from '../../utils/libraryEngine'
import { useBranding, useCollegeId, useLibraryCopies, useLibraryTitles } from '../../hooks/useLibrary'

export default function LibraryReportsTab({ settings }: { settings: LibrarySettings }) {
  const cid = useCollegeId()
  const branding = useBranding()
  const now = new Date()
  const [kind, setKind] = useState<'academic' | 'financial'>('academic')
  const defaultStart = kind === 'academic' ? (now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1) : now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const [start, setStart] = useState(defaultStart)
  const { from, to } = yearBounds(start, kind)

  const titlesQ = useLibraryTitles()
  const copiesQ = useLibraryCopies()
  const loansQ = useQuery({ queryKey: ['library', cid, 'loansBetween', from, to], queryFn: () => fetchLoansBetween(from, to), enabled: !!cid })
  const visitsQ = useQuery({ queryKey: ['library', cid, 'visitsBetween', from, to], queryFn: () => fetchVisits(from, to), enabled: !!cid })

  const report = useMemo(() => {
    if (!titlesQ.data || !copiesQ.data || !loansQ.data || !visitsQ.data) return null
    return buildLibraryAnnualReport({ titles: titlesQ.data, copies: copiesQ.data, loans: loansQ.data, visits: visitsQ.data, from, to })
  }, [titlesQ.data, copiesQ.data, loansQ.data, visitsQ.data, from, to])

  const yearLabel = `${kind === 'academic' ? 'Academic' : 'Financial'} year ${start}-${String((start + 1) % 100).padStart(2, '0')}`

  const pdf = () => {
    if (!report) return
    void downloadReportPdf({
      collegeName: branding.collegeName || 'College',
      address: branding.address,
      title: `${settings.libraryName} — Annual Report`,
      subtitle: `${yearLabel} (${from} to ${to}) · NAAC Criterion 4.2`,
      filename: `library-report-${start}-${kind}.pdf`,
      sections: [
        { heading: 'Holdings (as on date)', rows: [['Titles (physical)', report.holdings.titles], ['Volumes in stock', report.holdings.volumes], ['Value of stock', pdfMoney(report.holdings.value)]] },
        { heading: 'Additions during the year', rows: [['Volumes added', report.additions.volumes], ['New titles', report.additions.titles], ['Purchased / donated', `${report.additions.purchased} / ${report.additions.donated}`], ['Expenditure on books', pdfMoney(report.additions.value)]] },
        { heading: 'E-resources & periodicals (4.2.2 / 4.2.3)', rows: [['E-books', report.eResources.ebooks], ['E-journals', report.eResources.ejournals], ['Databases (e.g. N-LIST, DELNET)', report.eResources.databases], ['Subscription cost', pdfMoney(report.eResources.annualCost)], ['Print journals', report.periodicals.printJournals], ['Magazines', report.periodicals.magazines]] },
        { heading: 'Usage of the library (4.2.4)', rows: [['Books issued', report.circulation.issues], ['Unique borrowers', report.circulation.uniqueBorrowers], ['Issues to students / teachers', `${report.circulation.studentIssues} / ${report.circulation.staffIssues}`], ['Footfall (gate register)', report.footfall.visits], ['Days with entries', report.footfall.openDays], ['Average footfall per day', report.footfall.averagePerDay], ['Student / teacher visits', `${report.footfall.students} / ${report.footfall.teachers}`]] },
        { heading: 'Issues by department / course', table: { head: ['Department', 'Issues'], body: report.circulation.byDepartment.map(d => [d.department, d.issues]) } },
        { heading: 'Most borrowed titles', table: { head: ['Title', 'Issues'], body: report.topTitles.map(t => [t.title, t.issues]) } },
        { heading: 'Holdings by category', table: { head: ['Category', 'Titles', 'Volumes'], body: report.holdings.byCategory.map(c => [c.category, c.titles, c.volumes]) } },
        { heading: 'Losses', rows: [['Lost', report.losses.lost], ['Missing (stock verification)', report.losses.missing], ['Withdrawn / weeded out', report.losses.withdrawn]] },
      ],
    })
  }

  const csv = () => {
    if (!report) return
    const rows: Array<Record<string, unknown>> = [
      { section: 'Holdings', metric: 'Titles', value: report.holdings.titles },
      { section: 'Holdings', metric: 'Volumes', value: report.holdings.volumes },
      { section: 'Holdings', metric: 'Value', value: report.holdings.value },
      { section: 'Additions', metric: 'Volumes', value: report.additions.volumes },
      { section: 'Additions', metric: 'Expenditure', value: report.additions.value },
      { section: 'E-resources', metric: 'Count', value: report.eResources.count },
      { section: 'E-resources', metric: 'Cost', value: report.eResources.annualCost },
      { section: 'Usage', metric: 'Issues', value: report.circulation.issues },
      { section: 'Usage', metric: 'Unique borrowers', value: report.circulation.uniqueBorrowers },
      { section: 'Usage', metric: 'Footfall', value: report.footfall.visits },
      { section: 'Usage', metric: 'Average per day', value: report.footfall.averagePerDay },
      ...report.circulation.byDepartment.map(d => ({ section: 'Issues by department', metric: d.department, value: d.issues })),
      ...report.topTitles.map(t => ({ section: 'Top titles', metric: t.title, value: t.issues })),
    ]
    downloadCsv(`library-report-${start}-${kind}.csv`, rows, ['section', 'metric', 'value'])
  }

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 items-center">
        <select className="input-field !w-auto" value={kind} onChange={e => setKind(e.target.value as 'academic' | 'financial')}>
          <option value="academic">Academic year (Jun–May)</option>
          <option value="financial">Financial year (Apr–Mar)</option>
        </select>
        <select className="input-field !w-auto" value={start} onChange={e => setStart(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}-{String((y + 1) % 100).padStart(2, '0')}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={csv} disabled={!report} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
        <button onClick={pdf} disabled={!report} className={btn.primary}><FileText className="w-4 h-4" /> NAAC / annual report PDF</button>
      </div>
      {!report ? (
        <Loading label="Building report…" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Volumes in stock" value={report.holdings.volumes.toLocaleString('en-IN')} icon={<Library className="w-5 h-5" />} hint={`${report.holdings.titles} titles · ${inr(report.holdings.value)}`} />
            <StatCard label="Added this year" value={report.additions.volumes} icon={<BookOpen className="w-5 h-5" />} tone="text-green-500" hint={inr(report.additions.value)} />
            <StatCard label="Books issued" value={report.circulation.issues} icon={<BarChart3 className="w-5 h-5" />} tone="text-blue-500" hint={`${report.circulation.uniqueBorrowers} borrowers`} />
            <StatCard label="Avg footfall / day" value={report.footfall.averagePerDay} icon={<Users className="w-5 h-5" />} tone="text-purple-500" hint={`${report.footfall.visits} visits`} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card p-4">
              <p className="font-medium text-slate-900 dark:text-white mb-2">Issues by department / course</p>
              {report.circulation.byDepartment.length === 0 ? <p className="text-sm text-vriddhi-muted">No issues in this period.</p> : report.circulation.byDepartment.slice(0, 12).map(d => {
                const max = report.circulation.byDepartment[0].issues
                return (
                  <div key={d.department} className="mb-1.5">
                    <div className="flex justify-between text-xs"><span className="text-vriddhi-text">{d.department}</span><span className="text-vriddhi-muted">{d.issues}</span></div>
                    <div className="h-1.5 rounded-full bg-vriddhi-border"><div className="h-full rounded-full bg-vriddhi-accent" style={{ width: `${(d.issues / max) * 100}%` }} /></div>
                  </div>
                )
              })}
            </div>
            <div className="glass-card p-4">
              <p className="font-medium text-slate-900 dark:text-white mb-2">Most borrowed</p>
              {report.topTitles.length === 0 ? <p className="text-sm text-vriddhi-muted">—</p> : (
                <ol className="text-sm space-y-1 list-decimal list-inside">{report.topTitles.map(t => <li key={t.title} className="text-vriddhi-text">{t.title} <span className="text-vriddhi-muted">· {t.issues}</span></li>)}</ol>
              )}
              <p className="font-medium text-slate-900 dark:text-white mt-4 mb-1">E-resources</p>
              <p className="text-sm text-vriddhi-muted">{report.eResources.ebooks} e-books · {report.eResources.ejournals} e-journals · {report.eResources.databases} databases · {inr(report.eResources.annualCost)} / year</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
