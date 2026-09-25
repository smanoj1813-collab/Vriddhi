// Inventory settings — the college's own asset categories (tag code,
// depreciation method & rate), locations, departments, stores, fund
// sources, units and alert windows.

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { Field, btn, errMsg } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { saveInventorySettings } from '../../api/inventoryApi'
import { formatAssetTag, type DepMethod, type InventorySettings } from '../../utils/inventoryEngine'
import { useCollegeId } from '../../hooks/useLibrary'
import { inventoryKeys } from '../../hooks/useInventory'

type ListKey = 'locations' | 'departments' | 'stores' | 'fundSources' | 'consumableCategories' | 'units'

export default function InventorySettingsTab({ settings }: { settings: InventorySettings }) {
  const { showSuccess, showError } = useNotification()
  const qc = useQueryClient()
  const cid = useCollegeId()
  const [s, setS] = useState(settings)
  const [saving, setSaving] = useState(false)
  useEffect(() => setS(settings), [settings])
  const dirty = JSON.stringify(s) !== JSON.stringify(settings)

  async function save() {
    setSaving(true)
    try {
      await saveInventorySettings(s)
      await qc.invalidateQueries({ queryKey: inventoryKeys.settings(cid) })
      showSuccess('Inventory settings saved.')
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-20">
      <section className="glass-card p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Asset categories &amp; depreciation</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="table-header">Category</th><th className="table-header">Tag code</th><th className="table-header">Method</th><th className="table-header">Rate % / yr</th><th className="table-header" /></tr></thead>
            <tbody>
              {s.categories.map((c, i) => (
                <tr key={i} className="border-t border-vriddhi-border/50">
                  <td className="table-cell"><input className="input-field !py-1" value={c.name} onChange={e => setS({ ...s, categories: s.categories.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></td>
                  <td className="table-cell"><input className="input-field !py-1 !w-24 font-mono" value={c.code} onChange={e => setS({ ...s, categories: s.categories.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)) })} /></td>
                  <td className="table-cell"><select className="input-field !py-1 !w-auto" value={c.method} onChange={e => setS({ ...s, categories: s.categories.map((x, j) => (j === i ? { ...x, method: e.target.value as DepMethod } : x)) })}><option value="WDV">WDV</option><option value="SLM">SLM</option><option value="none">None</option></select></td>
                  <td className="table-cell"><input type="number" min={0} max={100} step={0.01} className="input-field !py-1 !w-24" value={c.rate} onChange={e => setS({ ...s, categories: s.categories.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)) })} /></td>
                  <td className="table-cell"><button onClick={() => setS({ ...s, categories: s.categories.filter((_, j) => j !== i) })} className={btn.small}><Trash2 className="w-3 h-3" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setS({ ...s, categories: [...s.categories, { name: 'New category', code: 'NEW', method: 'WDV', rate: 15 }] })} className={`${btn.ghost} mt-2`}><Plus className="w-4 h-4" /> Add category</button>
        <p className="text-xs text-vriddhi-muted mt-2">Changing a rate affects newly registered assets; existing assets keep the method and rate they were registered with (edit them individually if needed).</p>
      </section>

      <section className="glass-card p-4 grid sm:grid-cols-3 gap-3">
        <Field label="Asset tag prefix"><input className="input-field font-mono" value={s.assetTagPrefix} onChange={e => setS({ ...s, assetTagPrefix: e.target.value.toUpperCase() })} /></Field>
        <Field label="Digits"><input type="number" min={2} max={8} className="input-field" value={s.tagPadding} onChange={e => setS({ ...s, tagPadding: Number(e.target.value) || 5 })} /></Field>
        <Field label="Preview"><div className="input-field font-mono">{formatAssetTag(s.assetTagPrefix, s.categories[0]?.code || 'IT', 42, s.tagPadding)}</div></Field>
        <Field label="Warranty / AMC alert (days before)"><input type="number" min={0} className="input-field" value={s.expiryAlertDays} onChange={e => setS({ ...s, expiryAlertDays: Number(e.target.value) || 0 })} /></Field>
        <Field label="Physical verification cycle (days)"><input type="number" min={1} className="input-field" value={s.verificationCycleDays} onChange={e => setS({ ...s, verificationCycleDays: Number(e.target.value) || 365 })} /></Field>
        <Field label="Write off fully if cost below (₹)" hint="0 = always depreciate"><input type="number" min={0} className="input-field" value={s.fullWriteOffBelow} onChange={e => setS({ ...s, fullWriteOffBelow: Number(e.target.value) || 0 })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.requireIssueApproval} onChange={e => setS({ ...s, requireIssueApproval: e.target.checked })} /> Store issues need an approver’s name</label>
      </section>

      <section className="glass-card p-4 grid md:grid-cols-2 gap-4">
        <ListEditor k="departments" label="Departments" s={s} setS={setS} />
        <ListEditor k="locations" label="Locations / rooms" s={s} setS={setS} />
        <ListEditor k="stores" label="Stores" s={s} setS={setS} />
        <ListEditor k="fundSources" label="Fund sources" s={s} setS={setS} />
        <ListEditor k="consumableCategories" label="Consumable categories" s={s} setS={setS} />
        <ListEditor k="units" label="Units" s={s} setS={setS} />
      </section>

      <div className="fixed bottom-4 right-4 z-40">
        <button onClick={save} disabled={!dirty || saving} className={`${btn.primary} shadow-lg`}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings</button>
      </div>
    </div>
  )
}

function ListEditor({ k, label, s, setS }: { k: ListKey; label: string; s: InventorySettings; setS: (v: InventorySettings) => void }) {
  const [v, setV] = useState('')
  return (
    <div>
      <p className="text-xs font-medium text-vriddhi-muted mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">{s[k].map(x => <span key={x} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-vriddhi-card border border-vriddhi-border">{x}<button onClick={() => setS({ ...s, [k]: s[k].filter(y => y !== x) })}><X className="w-3 h-3" /></button></span>)}</div>
      <input className="input-field" value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && v.trim()) { setS({ ...s, [k]: Array.from(new Set([...s[k], v.trim()])) }); setV('') } }} placeholder="Add and press Enter" />
    </div>
  )
}
