// /admin/library/:tab — the library office (Operations team + principal).

import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, BookMarked, BookOpen, Bookmark, Clock, IndianRupee, Library, Settings as SettingsIcon } from 'lucide-react'
import { Loading, PageHeader, RouteTabs, StatCard, btn, fmtDate, inr } from '../components/officeUi'
import { useActiveLoans, useBranding, useLibraryFines, useLibrarySettings, useLibraryTitles, useOpenReservations } from '../hooks/useLibrary'
import { loanState } from '../utils/libraryEngine'
import { todayIso } from '../api/officeDb'
import CirculationDesk from '../components/library/CirculationDesk'
import CatalogueTab from '../components/library/CatalogueTab'
import LoansTab from '../components/library/LoansTab'
import ReservationsTab from '../components/library/ReservationsTab'
import GateRegisterTab from '../components/library/GateRegisterTab'
import StockCheckTab from '../components/library/StockCheckTab'
import LibraryReportsTab from '../components/library/LibraryReportsTab'
import LibrarySettingsTab from '../components/library/LibrarySettingsTab'
import type { LibrarySettings } from '../utils/libraryEngine'

const TABS = [
  { id: '', label: 'Overview' },
  { id: 'desk', label: 'Issue & Return' },
  { id: 'catalogue', label: 'Catalogue' },
  { id: 'loans', label: 'Loans' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'gate', label: 'Gate Register' },
  { id: 'stock', label: 'Stock Verification' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

export default function LibraryManagement() {
  const { tab = '' } = useParams()
  const { settings, loading } = useLibrarySettings()
  const branding = useBranding()
  const loansQ = useActiveLoans()
  const today = todayIso()
  const overdue = (loansQ.data || []).filter(l => loanState(l.dueDate, today) === 'overdue').length

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title={settings.libraryName} subtitle={settings.openingHours} icon={<Library className="w-5 h-5" />} actions={<Link to="/admin/library-fines" className={btn.ghost}><IndianRupee className="w-4 h-4" /> Fines</Link>} />
      <RouteTabs tabs={TABS.map(t => ({ to: t.id ? `/admin/library/${t.id}` : '/admin/library', label: t.label, end: !t.id, badge: t.id === 'loans' ? overdue : undefined }))} />
      {loading ? <Loading /> : <TabBody tab={tab} settings={settings} collegeName={branding.collegeName || settings.libraryName} />}
    </div>
  )
}

function TabBody({ tab, settings, collegeName }: { tab: string; settings: LibrarySettings; collegeName: string }) {
  switch (tab) {
    case 'desk': return <CirculationDesk settings={settings} />
    case 'catalogue': return <CatalogueTab settings={settings} collegeName={collegeName} />
    case 'loans': return <LoansTab settings={settings} />
    case 'reservations': return <ReservationsTab settings={settings} />
    case 'gate': return <GateRegisterTab />
    case 'stock': return <StockCheckTab />
    case 'reports': return <LibraryReportsTab settings={settings} />
    case 'settings': return <LibrarySettingsTab settings={settings} />
    default: return <Overview />
  }
}

function Overview() {
  const titlesQ = useLibraryTitles()
  const loansQ = useActiveLoans()
  const resQ = useOpenReservations()
  const finesQ = useLibraryFines('open')
  const today = todayIso()
  const titles = titlesQ.data || []
  const loans = loansQ.data || []
  const overdue = loans.filter(l => loanState(l.dueDate, today) === 'overdue')
  const dueToday = loans.filter(l => l.dueDate === today)
  const requests = loans.filter(l => l.renewRequestedAt)
  const ready = (resQ.data || []).filter(r => r.status === 'ready')
  const outstanding = (finesQ.data || []).reduce((s, f) => s + f.amount, 0)
  const volumes = titles.reduce((s, t) => s + t.totalCopies, 0)

  if (titlesQ.isLoading) return <Loading />

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Titles / volumes" value={`${titles.length.toLocaleString('en-IN')} / ${volumes.toLocaleString('en-IN')}`} icon={<BookOpen className="w-5 h-5" />} />
        <StatCard label="On loan" value={loans.length} icon={<BookMarked className="w-5 h-5" />} tone="text-blue-500" hint={`${dueToday.length} due today`} />
        <StatCard label="Overdue" value={overdue.length} icon={<AlertTriangle className="w-5 h-5" />} tone="text-red-500" />
        <StatCard label="Unpaid fines" value={inr(outstanding)} icon={<IndianRupee className="w-5 h-5" />} tone="text-amber-500" hint={`${finesQ.data?.length || 0} open`} />
      </div>

      {titles.length === 0 && (
        <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">Set up your library</p>
            <p className="text-sm text-vriddhi-muted">1. Review loan rules &amp; fines in Settings · 2. Import your catalogue (CSV) or add titles · 3. Print barcode labels · 4. Start issuing.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/library/settings" className={btn.ghost}><SettingsIcon className="w-4 h-4" /> Settings</Link>
            <Link to="/admin/library/catalogue" className={btn.primary}>Catalogue <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-2"><p className="font-medium text-slate-900 dark:text-white">Most overdue</p><Link to="/admin/library/loans" className="text-xs text-vriddhi-accent">All loans →</Link></div>
          {overdue.length === 0 ? <p className="text-sm text-vriddhi-muted">Nothing overdue. 🎉</p> : (
            <ul className="divide-y divide-vriddhi-border/60">
              {overdue.slice(0, 8).map(l => (
                <li key={l.id} className="py-2 flex justify-between gap-2 text-sm">
                  <span className="min-w-0"><span className="text-slate-900 dark:text-white">{l.memberName}</span> <span className="text-vriddhi-muted">· {l.memberCode}</span><span className="block text-xs text-vriddhi-muted truncate">{l.titleName} ({l.accessionNo})</span></span>
                  <span className="text-red-500 text-xs whitespace-nowrap">due {fmtDate(l.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-3">
          <Link to="/admin/library/desk" className="glass-card p-4 flex items-center justify-between hover:border-vriddhi-accent"><span className="font-medium text-slate-900 dark:text-white">Open issue / return desk</span><ArrowRight className="w-4 h-4" /></Link>
          <Link to="/admin/library/loans" className="glass-card p-4 flex items-center justify-between"><span className="text-sm"><Clock className="w-4 h-4 inline mr-1" /> Renewal requests</span><span className="font-bold">{requests.length}</span></Link>
          <Link to="/admin/library/reservations" className="glass-card p-4 flex items-center justify-between"><span className="text-sm"><Bookmark className="w-4 h-4 inline mr-1" /> Holds ready for pickup</span><span className="font-bold">{ready.length}</span></Link>
          <Link to="/admin/library/reservations" className="glass-card p-4 flex items-center justify-between"><span className="text-sm"><Bookmark className="w-4 h-4 inline mr-1" /> Waiting reservations</span><span className="font-bold">{(resQ.data || []).length - ready.length}</span></Link>
        </div>
      </div>
    </div>
  )
}
