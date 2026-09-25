// Consumable stores — items with running balance, receipts, departmental
// issues (indents) and physical-count adjustments, all in one stock ledger.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Download, History, Pencil, Plus, Scale, Search } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, PillTabs, btn, downloadCsv, errMsg, fmtDate, inr } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { fetchMovements, recordMovement, saveItem, type InventoryItem } from '../../api/inventoryApi'
import { needsReorder, type InventorySettings } from '../../utils/inventoryEngine'
import { todayIso } from '../../api/officeDb'
import { useCollegeId } from '../../hooks/useLibrary'
import { useInventoryRefresh, useItems } from '../../hooks/useInventory'

type MoveKind = 'in' | 'out' | 'adjust'

export default function StockTab({ settings }: { settings: InventorySettings }) {
  const itemsQ = useItems()
  const refresh = useInventoryRefresh()
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [view, setView] = useState<'all' | 'reorder'>('all')
  const [editing, setEditing] = useState<InventoryItem | 'new' | null>(null)
  const [moving, setMoving] = useState<{ item: InventoryItem; kind: MoveKind } | null>(null)
  const [ledger, setLedger] = useState<InventoryItem | null>(null)

  const items = (itemsQ.data || []).filter(i => i.active)
  const reorder = items.filter(needsReorder)
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i => (view === 'all' || needsReorder(i)) && (cat === 'all' || i.category === cat) && (!q || `${i.name} ${i.sku} ${i.store}`.toLowerCase().includes(q)))
  }, [items, search, cat, view])
  const value = items.reduce((s, i) => s + i.qty * i.avgCost, 0)

  if (itemsQ.isLoading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <PillTabs value={view} onChange={setView} options={[{ id: 'all', label: 'All items', count: items.length }, { id: 'reorder', label: 'Reorder now', count: reorder.length }]} />
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items" className="input-field !pl-9" />
        </div>
        <select className="input-field !w-auto" value={cat} onChange={e => setCat(e.target.value)}><option value="all">All categories</option>{settings.consumableCategories.map(c => <option key={c}>{c}</option>)}</select>
        <button onClick={() => setEditing('new')} className={btn.primary}><Plus className="w-4 h-4" /> New item</button>
        <button onClick={() => downloadCsv(`stock-${todayIso()}.csv`, rows.map(i => ({ item: i.name, sku: i.sku, category: i.category, store: i.store, unit: i.unit, qty: i.qty, avgCost: i.avgCost, value: Math.round(i.qty * i.avgCost * 100) / 100, reorderLevel: i.reorderLevel })))} disabled={!rows.length} className={btn.ghost}><Download className="w-4 h-4" /> CSV</button>
      </div>
      <p className="text-xs text-vriddhi-muted">Stock value {inr(value)} (moving-average cost) · {reorder.length} item(s) at or below reorder level</p>

      {rows.length === 0 ? (
        <Empty title={items.length ? 'No items match' : 'No consumables yet'} hint="Add stationery, lab consumables, housekeeping and other store items, then record receipts and issues." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Item</th><th className="table-header text-right">In stock</th><th className="table-header text-right">Avg cost / value</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map(i => (
                  <tr key={i.id} className="border-b border-vriddhi-border/50">
                    <td className="table-cell"><p className="font-medium text-slate-900 dark:text-white">{i.name}</p><p className="text-xs text-vriddhi-muted">{[i.sku, i.category, i.store].filter(Boolean).join(' · ')}</p></td>
                    <td className="table-cell text-right">
                      <span className="font-semibold">{i.qty}</span> <span className="text-xs text-vriddhi-muted">{i.unit}</span>
                      {needsReorder(i) && <span className="block"><Badge tone="red"><AlertTriangle className="w-3 h-3" /> reorder ≤ {i.reorderLevel}</Badge></span>}
                    </td>
                    <td className="table-cell text-right text-sm">{inr(i.avgCost)}<span className="block text-xs text-vriddhi-muted">{inr(i.qty * i.avgCost)}</span></td>
                    <td className="table-cell text-right whitespace-nowrap space-x-1">
                      <button onClick={() => setMoving({ item: i, kind: 'in' })} className={btn.small}><ArrowDownToLine className="w-3 h-3" /> Receive</button>
                      <button onClick={() => setMoving({ item: i, kind: 'out' })} disabled={i.qty <= 0} className={btn.small}><ArrowUpFromLine className="w-3 h-3" /> Issue</button>
                      <button onClick={() => setMoving({ item: i, kind: 'adjust' })} className={btn.small} title="Physical count"><Scale className="w-3 h-3" /></button>
                      <button onClick={() => setLedger(i)} className={btn.small} title="Ledger"><History className="w-3 h-3" /></button>
                      <button onClick={() => setEditing(i)} className={btn.small}><Pencil className="w-3 h-3" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && <ItemEditor item={editing === 'new' ? null : editing} settings={settings} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh() }} />}
      {moving && <MovementModal item={moving.item} kind={moving.kind} settings={settings} onClose={() => setMoving(null)} onDone={() => { setMoving(null); refresh() }} />}
      {ledger && <LedgerModal item={ledger} onClose={() => setLedger(null)} />}
    </div>
  )
}

function ItemEditor({ item, settings, onClose, onSaved }: { item: InventoryItem | null; settings: InventorySettings; onClose: () => void; onSaved: () => void }) {
  const { showError } = useNotification()
  const [d, setD] = useState({ name: item?.name || '', sku: item?.sku || '', category: item?.category || settings.consumableCategories[0] || '', unit: item?.unit || 'nos', store: item?.store || settings.stores[0] || '', reorderLevel: item?.reorderLevel || 0, active: item?.active ?? true })
  const [busy, setBusy] = useState(false)
  async function save() {
    setBusy(true)
    try {
      await saveItem(d, item?.id)
      onSaved()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={item ? 'Edit item' : 'New item'} footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy || !d.name.trim()} className={btn.primary}>Save</button></>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Item name *" className="col-span-2"><input className="input-field" value={d.name} onChange={e => setD({ ...d, name: e.target.value })} placeholder="e.g. A4 paper 75 GSM" /></Field>
        <Field label="Code / SKU"><input className="input-field" value={d.sku} onChange={e => setD({ ...d, sku: e.target.value })} /></Field>
        <Field label="Category"><select className="input-field" value={d.category} onChange={e => setD({ ...d, category: e.target.value })}>{settings.consumableCategories.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Unit"><select className="input-field" value={d.unit} onChange={e => setD({ ...d, unit: e.target.value })}>{settings.units.map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Store"><select className="input-field" value={d.store} onChange={e => setD({ ...d, store: e.target.value })}>{settings.stores.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Reorder level" hint="Alert when stock falls to this"><input type="number" min={0} className="input-field" value={d.reorderLevel} onChange={e => setD({ ...d, reorderLevel: Number(e.target.value) || 0 })} /></Field>
        {item && <label className="flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={d.active} onChange={e => setD({ ...d, active: e.target.checked })} /> Active</label>}
      </div>
    </Modal>
  )
}

function MovementModal({ item, kind, settings, onClose, onDone }: { item: InventoryItem; kind: MoveKind; settings: InventorySettings; onClose: () => void; onDone: () => void }) {
  const { showSuccess, showError } = useNotification()
  const [d, setD] = useState({ qty: 0, counted: item.qty, rate: item.avgCost, date: todayIso(), department: '', issuedTo: '', approvedBy: '', vendor: '', refNo: '', note: '' })
  const [busy, setBusy] = useState(false)
  const title = kind === 'in' ? `Receive · ${item.name}` : kind === 'out' ? `Issue · ${item.name}` : `Physical count · ${item.name}`
  async function save() {
    if (kind === 'out' && settings.requireIssueApproval && !d.approvedBy.trim()) return showError('Enter who approved this issue.')
    setBusy(true)
    try {
      const qty = kind === 'adjust' ? d.counted - item.qty : d.qty
      if (kind === 'adjust' && qty === 0) return onClose()
      await recordMovement(item.id, { type: kind, qty, rate: d.rate, date: d.date, department: d.department, issuedTo: d.issuedTo, approvedBy: d.approvedBy, vendor: d.vendor, refNo: d.refNo, note: d.note })
      showSuccess('Stock updated.')
      onDone()
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={title} footer={<><button onClick={onClose} className={btn.ghost}>Cancel</button><button onClick={save} disabled={busy || (kind !== 'adjust' && d.qty <= 0)} className={btn.primary}>Save</button></>}>
      <p className="text-sm text-vriddhi-muted mb-3">In stock: <b>{item.qty} {item.unit}</b> · avg cost {inr(item.avgCost)}</p>
      <div className="grid grid-cols-2 gap-3">
        {kind === 'adjust' ? (
          <Field label={`Counted quantity (${item.unit})`} hint={`Difference: ${d.counted - item.qty}`}><input type="number" min={0} className="input-field" value={d.counted} onChange={e => setD({ ...d, counted: Number(e.target.value) || 0 })} /></Field>
        ) : (
          <Field label={`Quantity (${item.unit})`}><input type="number" min={0} className="input-field" value={d.qty || ''} onChange={e => setD({ ...d, qty: Number(e.target.value) || 0 })} autoFocus /></Field>
        )}
        <Field label="Date"><input type="date" className="input-field" value={d.date} onChange={e => setD({ ...d, date: e.target.value })} /></Field>
        {kind === 'in' && <>
          <Field label="Rate per unit (₹, incl. GST)"><input type="number" min={0} className="input-field" value={d.rate || ''} onChange={e => setD({ ...d, rate: Number(e.target.value) || 0 })} /></Field>
          <Field label="Vendor"><input className="input-field" value={d.vendor} onChange={e => setD({ ...d, vendor: e.target.value })} /></Field>
          <Field label="Bill / GRN no."><input className="input-field" value={d.refNo} onChange={e => setD({ ...d, refNo: e.target.value })} /></Field>
        </>}
        {kind === 'out' && <>
          <Field label="Department"><input className="input-field" list="stk-depts" value={d.department} onChange={e => setD({ ...d, department: e.target.value })} /></Field>
          <Field label="Issued to"><input className="input-field" value={d.issuedTo} onChange={e => setD({ ...d, issuedTo: e.target.value })} /></Field>
          <Field label={`Approved by${settings.requireIssueApproval ? ' *' : ''}`}><input className="input-field" value={d.approvedBy} onChange={e => setD({ ...d, approvedBy: e.target.value })} /></Field>
          <Field label="Indent no."><input className="input-field" value={d.refNo} onChange={e => setD({ ...d, refNo: e.target.value })} /></Field>
          <datalist id="stk-depts">{settings.departments.map(x => <option key={x} value={x} />)}</datalist>
        </>}
        <Field label="Note" className="col-span-2"><input className="input-field" value={d.note} onChange={e => setD({ ...d, note: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}

function LedgerModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const cid = useCollegeId()
  const q = useQuery({ queryKey: ['inventory', cid, 'ledger', item.id], queryFn: () => fetchMovements({ itemId: item.id }) })
  return (
    <Modal open wide onClose={onClose} title={`Stock ledger · ${item.name}`}>
      {q.isLoading ? <Loading /> : !(q.data || []).length ? <p className="text-sm text-vriddhi-muted">No movements yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-vriddhi-border"><th className="table-header">Date</th><th className="table-header">Type</th><th className="table-header text-right">Qty</th><th className="table-header text-right">Value</th><th className="table-header text-right">Balance</th><th className="table-header">Details</th></tr></thead>
            <tbody>{(q.data || []).map(m => (
              <tr key={m.id} className="border-b border-vriddhi-border/50">
                <td className="table-cell">{fmtDate(m.date)}</td>
                <td className="table-cell"><Badge tone={m.type === 'in' ? 'green' : m.type === 'out' ? 'blue' : 'amber'}>{m.type === 'in' ? 'Received' : m.type === 'out' ? 'Issued' : 'Adjusted'}</Badge></td>
                <td className="table-cell text-right">{m.type === 'out' ? '−' : m.qty > 0 && m.type === 'adjust' ? '+' : ''}{m.qty}</td>
                <td className="table-cell text-right">{inr(m.value)}</td>
                <td className="table-cell text-right font-medium">{m.balanceQty}</td>
                <td className="table-cell text-xs text-vriddhi-muted">{[m.vendor, m.department, m.issuedTo, m.approvedBy && `appr. ${m.approvedBy}`, m.refNo, m.note].filter(Boolean).join(' · ')}<span className="block">by {m.by}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
