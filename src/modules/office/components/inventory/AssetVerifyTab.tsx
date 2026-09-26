// Physical verification of assets: scan tags room by room; scanned assets
// get today's verification date. Lists what is still unverified.

import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Download, Loader2 } from 'lucide-react'
import { ScanInput } from '../ScanInput'
import { Badge, StatCard, btn, downloadCsv, errMsg, fmtDate } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { markVerified } from '../../api/inventoryApi'
import { verificationDue, type InventorySettings } from '../../utils/inventoryEngine'
import { todayIso } from '../../api/officeDb'
import { useAssets, useInventoryRefresh } from '../../hooks/useInventory'

export default function AssetVerifyTab({ settings }: { settings: InventorySettings }) {
  const { showSuccess, showWarning, showError } = useNotification()
  const assetsQ = useAssets()
  const refresh = useInventoryRefresh()
  const [location, setLocation] = useState('')
  const [scanned, setScanned] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const today = todayIso()

  const active = (assetsQ.data || []).filter(a => !['disposed', 'lost'].includes(a.status))
  const scope = active.filter(a => !location || a.location === location)
  const byTag = useMemo(() => new Map(active.map(a => [a.tag, a])), [active])
  const due = scope.filter(a => verificationDue(a.lastVerifiedOn, today, settings.verificationCycleDays) && !scanned.includes(a.id))
  const locations = useMemo(() => Array.from(new Set(active.map(a => a.location).filter(Boolean))).sort(), [active])

  function onScan(code: string) {
    const a = byTag.get(code.trim().toUpperCase())
    if (!a) return showWarning(`${code} is not an active asset tag.`)
    if (scanned.includes(a.id)) return showWarning(`${a.tag} already scanned.`)
    if (location && a.location !== location) showWarning(`${a.tag} (${a.name}) is registered at “${a.location || '—'}”, not here — consider transferring it.`)
    setScanned(s => [...s, a.id])
  }

  async function save() {
    setBusy(true)
    try {
      await markVerified(scanned)
      showSuccess(`${scanned.length} asset(s) marked verified today.`)
      setScanned([])
      refresh()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={location ? `Assets in ${location}` : 'Active assets'} value={scope.length} icon={<ClipboardCheck className="w-5 h-5" />} />
        <StatCard label="Scanned now" value={scanned.length} icon={<CheckCircle2 className="w-5 h-5" />} tone="text-green-500" />
        <StatCard label="Verification due" value={due.length} icon={<ClipboardCheck className="w-5 h-5" />} tone="text-amber-500" hint={`cycle: ${settings.verificationCycleDays} days`} />
      </div>
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <select className="input-field !w-auto" value={location} onChange={e => setLocation(e.target.value)}><option value="">All locations</option>{locations.map(l => <option key={l}>{l}</option>)}</select>
          <div className="flex-1 min-w-[240px]"><ScanInput placeholder="Scan asset tag" onScan={onScan} continuous autoFocus /></div>
          <button onClick={save} disabled={!scanned.length || busy} className={btn.primary}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Save verification ({scanned.length})</button>
        </div>
        {scanned.length > 0 && <div className="flex flex-wrap gap-1.5">{scanned.slice(-20).map(id => { const a = active.find(x => x.id === id); return <Badge key={id} tone="green">{a?.tag}</Badge> })}</div>}
      </div>
      <div className="glass-card overflow-x-auto">
        <div className="flex justify-between items-center px-4 pt-3">
          <p className="font-medium text-slate-900 dark:text-white">Not yet verified{location ? ` in ${location}` : ''}</p>
          <button onClick={() => downloadCsv(`assets-unverified-${today}.csv`, due.map(a => ({ tag: a.tag, name: a.name, department: a.department, location: a.location, custodian: a.custodian, lastVerifiedOn: a.lastVerifiedOn })))} disabled={!due.length} className={btn.small}><Download className="w-3 h-3" /> CSV</button>
        </div>
        <table className="w-full">
          <tbody>
            {due.slice(0, 200).map(a => (
              <tr key={a.id} className="border-b border-vriddhi-border/50">
                <td className="table-cell font-mono text-xs">{a.tag}</td>
                <td className="table-cell text-sm">{a.name}</td>
                <td className="table-cell text-sm text-vriddhi-muted">{[a.location, a.custodian].filter(Boolean).join(' · ')}</td>
                <td className="table-cell text-xs text-vriddhi-muted text-right">last: {fmtDate(a.lastVerifiedOn)}</td>
              </tr>
            ))}
            {due.length === 0 && <tr><td className="table-cell text-center text-sm text-green-600 py-6">Everything here is verified. ✔</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
