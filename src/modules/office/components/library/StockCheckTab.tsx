// Annual stock verification: scan every volume on the shelves (USB scanner
// or phone camera, several people can scan into the same session), then
// close the session to list missing / unexpected items.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, Download, Loader2, Play, Square } from 'lucide-react'
import { ScanInput } from '../ScanInput'
import { Badge, Empty, Field, Loading, Modal, StatCard, btn, downloadCsv, errMsg, fmtDate } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { closeStockCheck, fetchStockChecks, recordStockScan, startStockCheck, stockExpectation, type StockCheck } from '../../api/libraryApi'
import { useCollegeId, useLibraryCopies, useLibraryRefresh } from '../../hooks/useLibrary'

export default function StockCheckTab() {
  const { showSuccess, showError, showWarning } = useNotification()
  const cid = useCollegeId()
  const copiesQ = useLibraryCopies()
  const refreshLib = useLibraryRefresh()
  const checksQ = useQuery({ queryKey: ['library', cid, 'stockChecks'], queryFn: fetchStockChecks, enabled: !!cid })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pending, setPending] = useState<string[]>([])
  const [startOpen, setStartOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [busy, setBusy] = useState(false)

  const checks = checksQ.data || []
  const active = checks.find(c => c.id === activeId) || checks.find(c => c.status === 'open') || null
  const copies = copiesQ.data || []
  const locations = useMemo(() => Array.from(new Set(copies.map(c => c.location).filter(Boolean))).sort(), [copies])
  const scannedSet = useMemo(() => new Set([...(active?.scanned || []), ...pending]), [active, pending])
  const expected = active ? stockExpectation(copies, active.location) : []
  const found = expected.filter(c => scannedSet.has(c.accessionNo)).length
  const byAcc = useMemo(() => new Map(copies.map(c => [c.accessionNo, c])), [copies])

  async function onScan(code: string) {
    if (!active) return
    const acc = code.trim().toUpperCase()
    if (scannedSet.has(acc)) return showWarning(`${acc} already scanned`)
    const c = byAcc.get(acc)
    if (!c) showWarning(`${acc} is not in the accession register`)
    else if (c.status === 'issued') showWarning(`${acc} is recorded as ON LOAN (${c.titleName}) — check the loan.`)
    setPending(p => [...p, acc])
    try {
      await recordStockScan(active.id, [acc])
    } catch (e) {
      showError(errMsg(e))
    }
  }

  async function close(markMissing: boolean) {
    if (!active) return
    setBusy(true)
    try {
      const fresh = (await checksQ.refetch()).data?.find(c => c.id === active.id) || active
      const summary = await closeStockCheck({ ...fresh, scanned: Array.from(new Set([...fresh.scanned, ...pending])) }, copies, markMissing)
      showSuccess(`Closed: ${summary?.found}/${summary?.expected} found, ${summary?.missing.length} missing.`)
      setPending([])
      setClosing(false)
      checksQ.refetch()
      refreshLib()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const exportReport = (c: StockCheck) => {
    const rows = (c.summary?.missing || []).map(a => ({ accessionNo: a, title: byAcc.get(a)?.titleName, callNumber: byAcc.get(a)?.callNumber, location: byAcc.get(a)?.location, price: byAcc.get(a)?.price, result: 'MISSING' }))
      .concat((c.summary?.unexpected || []).map(a => ({ accessionNo: a, title: '', callNumber: '', location: '', price: 0, result: 'NOT IN REGISTER' })))
    downloadCsv(`stock-verification-${c.name.replace(/\W+/g, '-')}.csv`, rows)
  }

  if (checksQ.isLoading || copiesQ.isLoading) return <Loading />

  return (
    <div className="space-y-5">
      {active ? (
        <div className="glass-card p-4 space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{active.name}</p>
              <p className="text-xs text-vriddhi-muted">Started {fmtDate(active.startedAt)} by {active.startedBy}{active.location ? ` · location: ${active.location}` : ' · whole library'}</p>
            </div>
            <button onClick={() => setClosing(true)} className={btn.danger}><Square className="w-4 h-4" /> Finish verification</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Expected on shelf" value={expected.length} icon={<ClipboardCheck className="w-5 h-5" />} />
            <StatCard label="Found" value={found} icon={<ClipboardCheck className="w-5 h-5" />} tone="text-green-500" />
            <StatCard label="Not yet scanned" value={expected.length - found} icon={<ClipboardCheck className="w-5 h-5" />} tone="text-amber-500" />
          </div>
          <div className="h-2 rounded-full bg-vriddhi-border overflow-hidden"><div className="h-full bg-vriddhi-accent transition-all" style={{ width: `${expected.length ? (found / expected.length) * 100 : 0}%` }} /></div>
          <ScanInput placeholder="Scan each book on the shelf" onScan={onScan} autoFocus continuous />
          {pending.length > 0 && <p className="text-xs text-vriddhi-muted font-mono">Recent: {pending.slice(-8).reverse().join(' · ')}</p>}
        </div>
      ) : (
        <Empty icon={<ClipboardCheck className="w-6 h-6" />} title="No verification in progress" hint="Start a session, then scan every book on the shelves. Several staff can scan into the same session from their phones." action={<button onClick={() => setStartOpen(true)} className={btn.primary}><Play className="w-4 h-4" /> Start stock verification</button>} />
      )}

      {checks.filter(c => c.status === 'closed').length > 0 && (
        <div className="glass-card overflow-x-auto">
          <p className="px-4 pt-3 font-medium text-slate-900 dark:text-white">Past verifications</p>
          <table className="w-full">
            <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Session</th><th className="table-header text-center">Found</th><th className="table-header text-center">Missing</th><th className="table-header text-center">Not in register</th><th className="table-header" /></tr></thead>
            <tbody>
              {checks.filter(c => c.status === 'closed').map(c => (
                <tr key={c.id} className="border-b border-vriddhi-border/50">
                  <td className="table-cell"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-vriddhi-muted">{fmtDate(c.closedAt)}{c.summary?.markedMissing ? ' · missing items flagged' : ''}</p></td>
                  <td className="table-cell text-center">{c.summary?.found}/{c.summary?.expected}</td>
                  <td className="table-cell text-center"><Badge tone={c.summary?.missing.length ? 'red' : 'green'}>{c.summary?.missing.length ?? 0}</Badge></td>
                  <td className="table-cell text-center">{c.summary?.unexpected.length ?? 0}</td>
                  <td className="table-cell text-right"><button onClick={() => exportReport(c)} className={btn.small}><Download className="w-3 h-3" /> Report</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {startOpen && <StartModal locations={locations} onClose={() => setStartOpen(false)} onStarted={id => { setStartOpen(false); setActiveId(id); checksQ.refetch() }} />}
      <Modal open={closing} onClose={() => setClosing(false)} title="Finish stock verification" footer={
        <>
          <button onClick={() => setClosing(false)} className={btn.ghost}>Keep scanning</button>
          <button onClick={() => close(false)} disabled={busy} className={btn.ghost}>Close — report only</button>
          <button onClick={() => close(true)} disabled={busy} className={btn.primary}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Close &amp; flag missing</button>
        </>
      }>
        <p className="text-sm text-vriddhi-muted">{expected.length - found} of {expected.length} expected volumes were not scanned. “Flag missing” marks them <b>Missing</b> in the register (they stop showing as available) and puts previously-missing books that were found back on the shelf. Books on loan are not expected on the shelf.</p>
      </Modal>
    </div>
  )
}

function StartModal({ locations, onClose, onStarted }: { locations: string[]; onClose: () => void; onStarted: (id: string) => void }) {
  const { showError } = useNotification()
  const [name, setName] = useState(`Stock verification ${new Date().getFullYear()}`)
  const [location, setLocation] = useState('')
  const [busy, setBusy] = useState(false)
  async function start() {
    setBusy(true)
    try {
      onStarted(await startStockCheck(name, location))
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title="Start stock verification" footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={start} disabled={busy} className={btn.primary}>Start</button></>}>
      <div className="space-y-3">
        <Field label="Name"><input className="input-field" value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label="Limit to a location" hint="Leave empty to verify the whole library">
          <select className="input-field" value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">Whole library</option>
            {locations.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  )
}
