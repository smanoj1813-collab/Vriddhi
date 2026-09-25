// Asset register — tagged capital items with custody, warranty / AMC,
// maintenance history, transfers, depreciation and disposal.

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeftRight, Download, Loader2, PackagePlus, Pencil, Printer, Search, Trash2, Wrench } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, btn, downloadCsv, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import {
  ASSET_STATUS_LABEL,
  addMaintenance,
  disposeAsset,
  registerAssets,
  transferAsset,
  updateAsset,
  type Asset,
  type AssetInput,
  type AssetStatus,
  type MaintenanceEntry,
} from '../../api/inventoryApi'
import { bookValue, depreciationSchedule, expiryState, fyStartYear, verificationDue, type InventorySettings } from '../../utils/inventoryEngine'
import { downloadLabelSheet } from '../../utils/labelsPdf'
import { todayIso } from '../../api/officeDb'
import { useAssets, useInventoryRefresh } from '../../hooks/useInventory'

const STATUS_TONE: Record<AssetStatus, 'green' | 'slate' | 'amber' | 'red' | 'purple'> = { in_use: 'green', in_store: 'slate', under_repair: 'amber', condemned: 'purple', disposed: 'slate', lost: 'red' }

const EMPTY: AssetInput = {
  name: '', category: '', department: '', location: '', custodian: '', make: '', model: '', serialNo: '', purchaseDate: todayIso(), cost: 0, salvage: 0,
  vendor: '', invoiceNo: '', poNo: '', fundSource: '', warrantyUntil: '', amcVendor: '', amcUntil: '', status: 'in_use', notes: '', serials: [], qty: 1,
}

export default function AssetsTab({ settings, collegeName }: { settings: InventorySettings; collegeName: string }) {
  const assetsQ = useAssets()
  const refresh = useInventoryRefresh()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [dept, setDept] = useState('all')
  const [status, setStatus] = useState<'active' | AssetStatus | 'all'>('active')
  const [flag, setFlag] = useState<'none' | 'warranty' | 'amc' | 'verify'>('none')
  const [registering, setRegistering] = useState(false)
  const [open, setOpen] = useState<Asset | null>(null)
  const today = todayIso()
  const fy = fyStartYear(today)
  const assets = assetsQ.data || []

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return assets.filter(a => {
      if (status === 'active' && ['disposed', 'lost'].includes(a.status)) return false
      if (status !== 'active' && status !== 'all' && a.status !== status) return false
      if (cat !== 'all' && a.category !== cat) return false
      if (dept !== 'all' && a.department !== dept) return false
      if (flag === 'warranty' && !['expiring', 'expired'].includes(expiryState(a.warrantyUntil, today, settings.expiryAlertDays))) return false
      if (flag === 'amc' && !['expiring', 'expired'].includes(expiryState(a.amcUntil, today, settings.expiryAlertDays))) return false
      if (flag === 'verify' && !verificationDue(a.lastVerifiedOn, today, settings.verificationCycleDays)) return false
      return !q || `${a.tag} ${a.name} ${a.make} ${a.model} ${a.serialNo} ${a.location} ${a.custodian}`.toLowerCase().includes(q)
    })
  }, [assets, search, cat, dept, status, flag, today, settings])

  const bv = (a: Asset) => bookValue({ cost: a.cost, purchaseDate: a.purchaseDate, method: a.method, rate: a.rate, salvage: a.salvage, asOfFy: fy, disposedOn: a.disposal?.date, fullWriteOffBelow: settings.fullWriteOffBelow })

  const exportCsv = () => downloadCsv(`asset-register-${today}.csv`, rows.map(a => ({
    tag: a.tag, name: a.name, category: a.category, make: a.make, model: a.model, serialNo: a.serialNo, department: a.department, location: a.location, custodian: a.custodian,
    purchaseDate: a.purchaseDate, cost: a.cost, bookValue: bv(a), vendor: a.vendor, invoiceNo: a.invoiceNo, poNo: a.poNo, fundSource: a.fundSource,
    warrantyUntil: a.warrantyUntil, amcUntil: a.amcUntil, status: ASSET_STATUS_LABEL[a.status], lastVerifiedOn: a.lastVerifiedOn,
  })))

  const printTags = () => downloadLabelSheet(rows.map(a => ({ code: a.tag, line1: a.name, line2: [a.department, a.location].filter(Boolean).join(' · '), line3: a.serialNo ? `S/N ${a.serialNo}` : '' })), { header: `${collegeName} — Property of the college`, columns: 3, rows: 9, filename: `asset-tags-${today}.pdf` })

  if (assetsQ.isLoading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tag, name, serial, location, custodian" className="input-field !pl-9" />
        </div>
        <select className="input-field !w-auto" value={cat} onChange={e => setCat(e.target.value)}><option value="all">All categories</option>{settings.categories.map(c => <option key={c.name}>{c.name}</option>)}</select>
        <select className="input-field !w-auto" value={dept} onChange={e => setDept(e.target.value)}><option value="all">All departments</option>{settings.departments.map(d => <option key={d}>{d}</option>)}</select>
        <select className="input-field !w-auto" value={status} onChange={e => setStatus(e.target.value as typeof status)}>
          <option value="active">Active</option><option value="all">All</option>
          {(Object.keys(ASSET_STATUS_LABEL) as AssetStatus[]).map(s => <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>)}
        </select>
        <select className="input-field !w-auto" value={flag} onChange={e => setFlag(e.target.value as typeof flag)}>
          <option value="none">No alert filter</option><option value="warranty">Warranty expiring</option><option value="amc">AMC expiring</option><option value="verify">Verification due</option>
        </select>
        <button onClick={() => setRegistering(true)} className={btn.primary}><PackagePlus className="w-4 h-4" /> Register asset</button>
        <button onClick={printTags} disabled={!rows.length} className={btn.ghost}><Printer className="w-4 h-4" /> Tags</button>
        <button onClick={exportCsv} disabled={!rows.length} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
      </div>
      <p className="text-xs text-vriddhi-muted">{rows.length} assets · cost {inr(rows.reduce((s, a) => s + a.cost, 0))} · book value {inr(rows.reduce((s, a) => s + bv(a), 0))} (FY {fy}-{String((fy + 1) % 100).padStart(2, '0')})</p>

      {rows.length === 0 ? (
        <Empty icon={<PackagePlus className="w-6 h-6" />} title={assets.length ? 'No assets match' : 'No assets registered yet'} hint="Register computers, furniture, lab equipment and more. Each unit gets a barcode tag for audits." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Tag / asset</th><th className="table-header">Where</th><th className="table-header text-right">Cost / book value</th><th className="table-header">Status</th></tr></thead>
              <tbody>
                {rows.slice(0, 500).map(a => {
                  const w = expiryState(a.warrantyUntil, today, settings.expiryAlertDays)
                  const amc = expiryState(a.amcUntil, today, settings.expiryAlertDays)
                  return (
                    <tr key={a.id} onClick={() => setOpen(a)} className="border-b border-vriddhi-border/50 hover:bg-vriddhi-dark/20 cursor-pointer">
                      <td className="table-cell"><p className="font-mono text-xs text-vriddhi-muted">{a.tag}</p><p className="font-medium text-slate-900 dark:text-white">{a.name}</p><p className="text-xs text-vriddhi-muted">{[a.make, a.model, a.serialNo && `S/N ${a.serialNo}`].filter(Boolean).join(' · ')}</p></td>
                      <td className="table-cell text-sm">{a.department}<span className="block text-xs text-vriddhi-muted">{[a.location, a.custodian].filter(Boolean).join(' · ')}</span></td>
                      <td className="table-cell text-right text-sm">{inr(a.cost)}<span className="block text-xs text-vriddhi-muted">{inr(bv(a))}</span></td>
                      <td className="table-cell text-sm space-y-1">
                        <Badge tone={STATUS_TONE[a.status]}>{ASSET_STATUS_LABEL[a.status]}</Badge>
                        {w === 'expiring' && <span className="block text-[11px] text-amber-600">warranty ends {fmtDate(a.warrantyUntil)}</span>}
                        {amc === 'expiring' && <span className="block text-[11px] text-amber-600">AMC ends {fmtDate(a.amcUntil)}</span>}
                        {amc === 'expired' && <span className="block text-[11px] text-red-500">AMC expired</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 500 && <p className="p-3 text-xs text-vriddhi-muted text-center">Showing 500 of {rows.length} — refine the filters or export CSV.</p>}
        </div>
      )}

      {registering && <AssetEditor settings={settings} onClose={() => setRegistering(false)} onSaved={() => { setRegistering(false); refresh() }} />}
      {open && <AssetDetail asset={assets.find(a => a.id === open.id) || open} settings={settings} onClose={() => setOpen(null)} onChanged={refresh} />}
    </div>
  )
}

function AssetFields({ d, set, settings, isNew }: { d: AssetInput; set: <K extends keyof AssetInput>(k: K, v: AssetInput[K]) => void; settings: InventorySettings; isNew: boolean }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Field label="Asset name *" className="sm:col-span-2"><input className="input-field" value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dell OptiPlex 3000 desktop" /></Field>
      <Field label="Category *">
        <select className="input-field" value={d.category} onChange={e => set('category', e.target.value)} disabled={!isNew}>
          <option value="">Select</option>{settings.categories.map(c => <option key={c.name} value={c.name}>{c.name} ({c.method} {c.rate}%)</option>)}
        </select>
      </Field>
      <Field label="Make"><input className="input-field" value={d.make} onChange={e => set('make', e.target.value)} /></Field>
      <Field label="Model"><input className="input-field" value={d.model} onChange={e => set('model', e.target.value)} /></Field>
      {isNew ? (
        <Field label="Serial numbers" hint="One per unit, separated by commas / new lines — or set quantity">
          <textarea rows={1} className="input-field font-mono" value={(d.serials || []).join('\n')} onChange={e => set('serials', e.target.value.split(/[\n,]+/))} />
        </Field>
      ) : (
        <Field label="Serial no."><input className="input-field font-mono" value={d.serialNo} onChange={e => set('serialNo', e.target.value)} /></Field>
      )}
      {isNew && <Field label="Quantity" hint="Ignored when serials are given"><input type="number" min={1} max={500} className="input-field" value={d.qty || 1} onChange={e => set('qty', Number(e.target.value) || 1)} /></Field>}
      <Field label="Department"><input className="input-field" list="inv-depts" value={d.department} onChange={e => set('department', e.target.value)} /></Field>
      <Field label="Location / room"><input className="input-field" list="inv-locs" value={d.location} onChange={e => set('location', e.target.value)} /></Field>
      <Field label="Custodian"><input className="input-field" value={d.custodian} onChange={e => set('custodian', e.target.value)} placeholder="Responsible person" /></Field>
      <Field label="Purchase date"><input type="date" className="input-field" value={d.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} /></Field>
      <Field label="Cost per unit (₹, incl. GST)"><input type="number" min={0} className="input-field" value={d.cost || ''} onChange={e => set('cost', Number(e.target.value) || 0)} /></Field>
      <Field label="Salvage value (₹)"><input type="number" min={0} className="input-field" value={d.salvage || ''} onChange={e => set('salvage', Number(e.target.value) || 0)} /></Field>
      <Field label="Vendor"><input className="input-field" value={d.vendor} onChange={e => set('vendor', e.target.value)} /></Field>
      <Field label="Invoice no."><input className="input-field" value={d.invoiceNo} onChange={e => set('invoiceNo', e.target.value)} /></Field>
      <Field label="PO no."><input className="input-field" value={d.poNo} onChange={e => set('poNo', e.target.value)} /></Field>
      <Field label="Fund source"><select className="input-field" value={d.fundSource} onChange={e => set('fundSource', e.target.value)}><option value="">—</option>{settings.fundSources.map(f => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Warranty until"><input type="date" className="input-field" value={d.warrantyUntil} onChange={e => set('warrantyUntil', e.target.value)} /></Field>
      <Field label="AMC vendor"><input className="input-field" value={d.amcVendor} onChange={e => set('amcVendor', e.target.value)} /></Field>
      <Field label="AMC until"><input type="date" className="input-field" value={d.amcUntil} onChange={e => set('amcUntil', e.target.value)} /></Field>
      <Field label="Status"><select className="input-field" value={d.status} onChange={e => set('status', e.target.value as AssetStatus)}>{(['in_use', 'in_store', 'under_repair', 'condemned'] as AssetStatus[]).map(s => <option key={s} value={s}>{ASSET_STATUS_LABEL[s]}</option>)}</select></Field>
      <Field label="Notes" className="sm:col-span-2"><input className="input-field" value={d.notes} onChange={e => set('notes', e.target.value)} /></Field>
      <datalist id="inv-depts">{settings.departments.map(x => <option key={x} value={x} />)}</datalist>
      <datalist id="inv-locs">{settings.locations.map(x => <option key={x} value={x} />)}</datalist>
    </div>
  )
}

function AssetEditor({ settings, onClose, onSaved }: { settings: InventorySettings; onClose: () => void; onSaved: () => void }) {
  const { showSuccess, showError } = useNotification()
  const [d, setD] = useState<AssetInput>({ ...EMPTY, category: settings.categories[0]?.name || '' })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof AssetInput>(k: K, v: AssetInput[K]) => setD(p => ({ ...p, [k]: v }))
  async function save() {
    const cat = settings.categories.find(c => c.name === d.category)
    if (!cat) return showError('Choose a category.')
    setBusy(true)
    try {
      const tags = await registerAssets(d, cat, settings)
      showSuccess(`Registered ${tags.length} asset(s): ${tags[0]}${tags.length > 1 ? ` … ${tags[tags.length - 1]}` : ''}`)
      onSaved()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open wide onClose={onClose} title="Register asset" footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy || !d.name.trim()} className={btn.primary}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Register &amp; tag</button></>}>
      <AssetFields d={d} set={set} settings={settings} isNew />
    </Modal>
  )
}

function AssetDetail({ asset: a, settings, onClose, onChanged }: { asset: Asset; settings: InventorySettings; onClose: () => void; onChanged: () => void }) {
  const { showSuccess, showError } = useNotification()
  const [mode, setMode] = useState<'view' | 'edit' | 'transfer' | 'maintenance' | 'dispose'>('view')
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState<AssetInput>({ ...a })
  const [tr, setTr] = useState({ department: a.department, location: a.location, custodian: a.custodian, note: '' })
  const [mt, setMt] = useState<Omit<MaintenanceEntry, 'by'> & { status: AssetStatus | '' }>({ date: todayIso(), kind: 'repair', vendor: '', cost: 0, note: '', status: '' })
  const [dp, setDp] = useState({ date: todayIso(), method: 'scrapped' as 'sold' | 'scrapped' | 'donated' | 'written_off' | 'lost', amount: 0, approvalRef: '', note: '' })
  const fy = fyStartYear(todayIso())
  const schedule = depreciationSchedule({ cost: a.cost, purchaseDate: a.purchaseDate, method: a.method, rate: a.rate, salvage: a.salvage, asOfFy: fy, disposedOn: a.disposal?.date, fullWriteOffBelow: settings.fullWriteOffBelow })
  const inactive = ['disposed', 'lost'].includes(a.status)

  const run = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true)
    try {
      await fn()
      showSuccess(msg)
      setMode('view')
      onChanged()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const footer = mode === 'view' ? (
    !inactive && (
      <>
        <button onClick={() => setMode('edit')} className={btn.ghost}><Pencil className="w-4 h-4" /> Edit</button>
        <button onClick={() => setMode('transfer')} className={btn.ghost}><ArrowLeftRight className="w-4 h-4" /> Transfer</button>
        <button onClick={() => setMode('maintenance')} className={btn.ghost}><Wrench className="w-4 h-4" /> Maintenance</button>
        <button onClick={() => setMode('dispose')} className={btn.danger}><Trash2 className="w-4 h-4" /> Dispose</button>
      </>
    )
  ) : (
    <>
      <button onClick={() => setMode('view')} className={btn.ghost}>Back</button>
      {mode === 'edit' && <button disabled={busy} onClick={() => run(() => { const { serials: _s, qty: _q, category: _c, ...rest } = edit; void _s; void _q; void _c; return updateAsset(a.id, rest) }, 'Asset updated.')} className={btn.primary}>Save</button>}
      {mode === 'transfer' && <button disabled={busy} onClick={() => run(() => transferAsset(a, tr, tr.note), 'Transferred.')} className={btn.primary}>Transfer</button>}
      {mode === 'maintenance' && <button disabled={busy} onClick={() => run(() => { const { status, ...e } = mt; return addMaintenance(a, e, status || undefined) }, 'Logged.')} className={btn.primary}>Add entry</button>}
      {mode === 'dispose' && <button disabled={busy} onClick={() => run(() => disposeAsset(a, dp), 'Asset disposed.')} className={btn.danger}>Confirm disposal</button>}
    </>
  )

  return (
    <Modal open wide onClose={onClose} title={`${a.tag} · ${a.name}`} footer={footer}>
      {mode === 'view' && (
        <div className="space-y-4 text-sm">
          <div className="grid sm:grid-cols-3 gap-x-4 gap-y-2">
            {[
              ['Category', `${a.category} (${a.method} ${a.rate}%)`], ['Status', ASSET_STATUS_LABEL[a.status]], ['Make / model', [a.make, a.model].filter(Boolean).join(' ') || '—'],
              ['Serial no.', a.serialNo || '—'], ['Department', a.department || '—'], ['Location', a.location || '—'], ['Custodian', a.custodian || '—'],
              ['Purchased', `${fmtDate(a.purchaseDate)} · ${inr(a.cost)}`], ['Vendor / invoice', [a.vendor, a.invoiceNo].filter(Boolean).join(' · ') || '—'], ['PO', a.poNo || '—'],
              ['Fund source', a.fundSource || '—'], ['Warranty until', fmtDate(a.warrantyUntil)], ['AMC', a.amcUntil ? `${a.amcVendor || ''} until ${fmtDate(a.amcUntil)}` : '—'],
              ['Last verified', fmtDate(a.lastVerifiedOn)],
            ].map(([k, v]) => <div key={k}><p className="text-xs text-vriddhi-muted">{k}</p><p className="text-vriddhi-text">{v}</p></div>)}
          </div>
          {a.disposal && <p className="rounded-xl p-3 bg-slate-500/10">Disposed on {fmtDate(a.disposal.date)} — {a.disposal.method.replace('_', ' ')}{a.disposal.amount ? `, realised ${inr(a.disposal.amount)}` : ''}{a.disposal.approvalRef ? ` · approval ${a.disposal.approvalRef}` : ''}</p>}
          {schedule.length > 0 && (
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">Depreciation schedule</p>
              <table className="w-full text-xs"><thead><tr className="text-vriddhi-muted"><th className="text-left py-1">FY</th><th className="text-right">Opening</th><th className="text-right">Addition</th><th className="text-right">Depreciation</th><th className="text-right">Closing</th></tr></thead>
                <tbody>{schedule.map(y => <tr key={y.fy} className="border-t border-vriddhi-border/50"><td className="py-1">{y.fy}</td><td className="text-right">{inr(y.opening)}</td><td className="text-right">{y.addition ? inr(y.addition) : ''}</td><td className="text-right">{inr(y.depreciation)}</td><td className="text-right font-medium">{inr(y.closing)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
          {a.maintenance.length > 0 && (
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">Maintenance ({inr(a.maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0))})</p>
              <ul className="text-xs space-y-1">{[...a.maintenance].reverse().map((m, i) => <li key={i}>{fmtDate(m.date)} · {m.kind.replace('_', ' ')} · {m.vendor} · {inr(m.cost)} — {m.note}</li>)}</ul>
            </div>
          )}
          {a.transfers.length > 0 && (
            <div>
              <p className="font-medium text-slate-900 dark:text-white mb-1">Movement history</p>
              <ul className="text-xs space-y-1">{[...a.transfers].reverse().map((t, i) => <li key={i}>{fmtDate(t.date)} · {t.from || '—'} → {t.to} ({t.by}){t.note ? ` — ${t.note}` : ''}</li>)}</ul>
            </div>
          )}
        </div>
      )}
      {mode === 'edit' && <AssetFields d={edit} set={(k, v) => setEdit(p => ({ ...p, [k]: v }))} settings={settings} isNew={false} />}
      {mode === 'transfer' && (
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="To department"><input className="input-field" list="inv-depts2" value={tr.department} onChange={e => setTr({ ...tr, department: e.target.value })} /></Field>
          <Field label="To location"><input className="input-field" list="inv-locs2" value={tr.location} onChange={e => setTr({ ...tr, location: e.target.value })} /></Field>
          <Field label="New custodian"><input className="input-field" value={tr.custodian} onChange={e => setTr({ ...tr, custodian: e.target.value })} /></Field>
          <Field label="Note / order ref."><input className="input-field" value={tr.note} onChange={e => setTr({ ...tr, note: e.target.value })} /></Field>
          <datalist id="inv-depts2">{settings.departments.map(x => <option key={x} value={x} />)}</datalist>
          <datalist id="inv-locs2">{settings.locations.map(x => <option key={x} value={x} />)}</datalist>
        </div>
      )}
      {mode === 'maintenance' && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Date"><input type="date" className="input-field" value={mt.date} onChange={e => setMt({ ...mt, date: e.target.value })} /></Field>
          <Field label="Type"><select className="input-field" value={mt.kind} onChange={e => setMt({ ...mt, kind: e.target.value as MaintenanceEntry['kind'] })}><option value="repair">Repair</option><option value="service">Service</option><option value="amc_visit">AMC visit</option><option value="upgrade">Upgrade</option></select></Field>
          <Field label="Cost (₹)"><input type="number" min={0} className="input-field" value={mt.cost || ''} onChange={e => setMt({ ...mt, cost: Number(e.target.value) || 0 })} /></Field>
          <Field label="Vendor / technician"><input className="input-field" value={mt.vendor} onChange={e => setMt({ ...mt, vendor: e.target.value })} /></Field>
          <Field label="Work done" className="sm:col-span-2"><input className="input-field" value={mt.note} onChange={e => setMt({ ...mt, note: e.target.value })} /></Field>
          <Field label="Set status"><select className="input-field" value={mt.status} onChange={e => setMt({ ...mt, status: e.target.value as AssetStatus | '' })}><option value="">Unchanged</option><option value="under_repair">Under repair</option><option value="in_use">Back in use</option><option value="in_store">In store</option><option value="condemned">Condemned</option></select></Field>
        </div>
      )}
      {mode === 'dispose' && (
        <div className="space-y-3">
          <p className="text-sm text-amber-600 dark:text-amber-400 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /> Disposal removes the asset from the active register (it stays in history and reports).</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Date"><input type="date" className="input-field" value={dp.date} onChange={e => setDp({ ...dp, date: e.target.value })} /></Field>
            <Field label="Method"><select className="input-field" value={dp.method} onChange={e => setDp({ ...dp, method: e.target.value as typeof dp.method })}><option value="scrapped">Scrapped / e-waste</option><option value="sold">Sold / auctioned</option><option value="donated">Donated</option><option value="written_off">Written off</option><option value="lost">Lost / stolen</option></select></Field>
            <Field label="Amount realised (₹)"><input type="number" min={0} className="input-field" value={dp.amount || ''} onChange={e => setDp({ ...dp, amount: Number(e.target.value) || 0 })} /></Field>
            <Field label="Approval / condemnation ref." className="sm:col-span-2"><input className="input-field" value={dp.approvalRef} onChange={e => setDp({ ...dp, approvalRef: e.target.value })} placeholder="e.g. Condemnation committee resolution no." /></Field>
            <Field label="Note"><input className="input-field" value={dp.note} onChange={e => setDp({ ...dp, note: e.target.value })} /></Field>
          </div>
        </div>
      )}
    </Modal>
  )
}
