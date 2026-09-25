// /admin/inventory/:tab — asset register and consumable stores.

import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Boxes, IndianRupee, Package, ShieldAlert, Wrench } from 'lucide-react'
import { Loading, PageHeader, RouteTabs, StatCard, btn, inr } from '../components/officeUi'
import { useBranding } from '../hooks/useLibrary'
import { useAssets, useInventorySettings, useItems } from '../hooks/useInventory'
import { bookValue, expiryState, fyStartYear, needsReorder, verificationDue, type InventorySettings } from '../utils/inventoryEngine'
import { todayIso } from '../api/officeDb'
import AssetsTab from '../components/inventory/AssetsTab'
import StockTab from '../components/inventory/StockTab'
import AssetVerifyTab from '../components/inventory/AssetVerifyTab'
import InventoryReportsTab from '../components/inventory/InventoryReportsTab'
import InventorySettingsTab from '../components/inventory/InventorySettingsTab'

const TABS = [
  { id: '', label: 'Overview' },
  { id: 'assets', label: 'Assets' },
  { id: 'stock', label: 'Consumables & Stock' },
  { id: 'verify', label: 'Physical Verification' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
]

export default function InventoryManagement() {
  const { tab = '' } = useParams()
  const { settings, loading } = useInventorySettings()
  const branding = useBranding()
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader title="Inventory & Assets" subtitle="Asset register, stores, verification and depreciation" icon={<Boxes className="w-5 h-5" />} />
      <RouteTabs tabs={TABS.map(t => ({ to: t.id ? `/admin/inventory/${t.id}` : '/admin/inventory', label: t.label, end: !t.id }))} />
      {loading ? <Loading /> : (() => {
        switch (tab) {
          case 'assets': return <AssetsTab settings={settings} collegeName={branding.collegeName || 'College'} />
          case 'stock': return <StockTab settings={settings} />
          case 'verify': return <AssetVerifyTab settings={settings} />
          case 'reports': return <InventoryReportsTab settings={settings} />
          case 'settings': return <InventorySettingsTab settings={settings} />
          default: return <Overview settings={settings} />
        }
      })()}
    </div>
  )
}

function Overview({ settings }: { settings: InventorySettings }) {
  const assetsQ = useAssets()
  const itemsQ = useItems()
  const today = todayIso()
  const fy = fyStartYear(today)
  if (assetsQ.isLoading || itemsQ.isLoading) return <Loading />
  const assets = (assetsQ.data || []).filter(a => !['disposed', 'lost'].includes(a.status))
  const items = (itemsQ.data || []).filter(i => i.active)
  const wdv = assets.reduce((s, a) => s + bookValue({ cost: a.cost, purchaseDate: a.purchaseDate, method: a.method, rate: a.rate, salvage: a.salvage, asOfFy: fy, fullWriteOffBelow: settings.fullWriteOffBelow }), 0)
  const repair = assets.filter(a => a.status === 'under_repair')
  const amc = assets.filter(a => ['expiring', 'expired'].includes(expiryState(a.amcUntil, today, settings.expiryAlertDays)))
  const warranty = assets.filter(a => expiryState(a.warrantyUntil, today, settings.expiryAlertDays) === 'expiring')
  const reorder = items.filter(needsReorder)
  const verify = assets.filter(a => verificationDue(a.lastVerifiedOn, today, settings.verificationCycleDays))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Active assets" value={assets.length.toLocaleString('en-IN')} icon={<Package className="w-5 h-5" />} hint={`cost ${inr(assets.reduce((s, a) => s + a.cost, 0))}`} />
        <StatCard label="Book value (WDV)" value={inr(wdv)} icon={<IndianRupee className="w-5 h-5" />} tone="text-green-500" />
        <StatCard label="Under repair" value={repair.length} icon={<Wrench className="w-5 h-5" />} tone="text-amber-500" />
        <StatCard label="Stock items to reorder" value={reorder.length} icon={<AlertTriangle className="w-5 h-5" />} tone="text-red-500" hint={`${items.length} items`} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {[
          { label: 'AMC expiring / expired', n: amc.length, to: '/admin/inventory/assets', icon: <ShieldAlert className="w-4 h-4" /> },
          { label: 'Warranty ending soon', n: warranty.length, to: '/admin/inventory/assets', icon: <ShieldAlert className="w-4 h-4" /> },
          { label: 'Physical verification due', n: verify.length, to: '/admin/inventory/verify', icon: <Package className="w-4 h-4" /> },
        ].map(c => (
          <Link key={c.label} to={c.to} className="glass-card p-4 flex items-center justify-between"><span className="text-sm flex items-center gap-2">{c.icon} {c.label}</span><span className="font-bold">{c.n}</span></Link>
        ))}
      </div>
      {assets.length === 0 && (
        <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-vriddhi-muted">Start by reviewing asset categories and depreciation rates, then register your assets and print tags.</p>
          <div className="flex gap-2"><Link to="/admin/inventory/settings" className={btn.ghost}>Settings</Link><Link to="/admin/inventory/assets" className={btn.primary}>Register assets <ArrowRight className="w-4 h-4" /></Link></div>
        </div>
      )}
      {reorder.length > 0 && (
        <div className="glass-card p-4">
          <p className="font-medium text-slate-900 dark:text-white mb-2">Reorder now</p>
          <ul className="text-sm divide-y divide-vriddhi-border/60">{reorder.slice(0, 10).map(i => <li key={i.id} className="py-1.5 flex justify-between"><span>{i.name}</span><span className="text-red-500">{i.qty} {i.unit} (≤ {i.reorderLevel})</span></li>)}</ul>
          <Link to="/admin/purchase-requests" className="text-xs text-vriddhi-accent mt-2 inline-block">Raise a purchase request →</Link>
        </div>
      )}
    </div>
  )
}
