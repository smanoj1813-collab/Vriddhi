// Per-college purchase settings: approval chain, numbering, GST identity,
// quotation rule, PO terms, budget heads and TDS sections.
// Written by operations or accounts (config/procurement).

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Field, btn, errMsg } from '../officeUi'
import { saveProcurementSettings } from '../../api/procurementApi'
import { useProcurementRefresh } from '../../hooks/useProcurement'
import { isValidGstin, type ApproverRole, type ProcurementSettings } from '../../utils/procurementEngine'

const ROLE_LABEL: Record<ApproverRole, string> = { hod: 'Head of department', principal: 'Principal', accounts: 'Accounts', operations: 'Operations' }

export default function ProcurementSettingsForm({ settings }: { settings: ProcurementSettings }) {
  const [s, setS] = useState<ProcurementSettings>(settings)
  const [head, setHead] = useState('')
  const refresh = useProcurementRefresh()
  const { showSuccess, showError } = useNotification()
  const set = <K extends keyof ProcurementSettings>(k: K, v: ProcurementSettings[K]) => setS(p => ({ ...p, [k]: v }))
  const save = useMutation({
    mutationFn: () => {
      if (s.collegeGstin && !isValidGstin(s.collegeGstin)) throw new Error('College GSTIN looks invalid.')
      const roles = s.approvalChain.map(x => x.role)
      if (new Set(roles).size !== roles.length) throw new Error('Each role can appear only once in the approval chain.')
      return saveProcurementSettings(s)
    },
    onSuccess: () => { showSuccess('Purchase settings saved'); refresh() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <div className="space-y-5 pb-20">
      <section className="glass-card p-4">
        <h3 className="font-semibold mb-1">Approval chain</h3>
        <p className="text-xs text-vriddhi-muted mb-3">Steps run in order. A step applies only when the request is at least its amount. The HOD step is skipped when a HOD raises the request; the principal may act on any step.</p>
        <div className="space-y-2">
          {s.approvalChain.map((st, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-xs text-vriddhi-muted">{i + 1}.</span>
              <select className="input-field col-span-4" value={st.role} onChange={e => set('approvalChain', s.approvalChain.map((x, j) => (j === i ? { ...x, role: e.target.value as ApproverRole, label: ROLE_LABEL[e.target.value as ApproverRole] } : x)))}>
                {(Object.keys(ROLE_LABEL) as ApproverRole[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <input className="input-field col-span-3" value={st.label} onChange={e => set('approvalChain', s.approvalChain.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input-field col-span-3" type="number" min={0} placeholder="From ₹" value={st.minAmount} onChange={e => set('approvalChain', s.approvalChain.map((x, j) => (j === i ? { ...x, minAmount: Number(e.target.value) || 0 } : x)))} />
              <button className="col-span-1 text-red-500" onClick={() => set('approvalChain', s.approvalChain.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button className={`${btn.small} mt-2`} onClick={() => set('approvalChain', [...s.approvalChain, { role: 'accounts', minAmount: 50000, label: 'Accounts' }])}><Plus className="w-3 h-3" />Add step</button>
      </section>

      <section className="glass-card p-4 grid sm:grid-cols-4 gap-3">
        <h3 className="font-semibold sm:col-span-4">Numbering <span className="text-xs font-normal text-vriddhi-muted">— PREFIX/2026-27/0001, restarts every financial year</span></h3>
        <Field label="Purchase request"><input className="input-field" value={s.prPrefix} onChange={e => set('prPrefix', e.target.value)} /></Field>
        <Field label="Purchase order"><input className="input-field" value={s.poPrefix} onChange={e => set('poPrefix', e.target.value)} /></Field>
        <Field label="Goods receipt"><input className="input-field" value={s.grnPrefix} onChange={e => set('grnPrefix', e.target.value)} /></Field>
        <Field label="Vendor bill"><input className="input-field" value={s.billPrefix} onChange={e => set('billPrefix', e.target.value)} /></Field>
      </section>

      <section className="glass-card p-4 grid sm:grid-cols-2 gap-3">
        <h3 className="font-semibold sm:col-span-2">GST & delivery</h3>
        <Field label="College GSTIN" hint="Leave blank if unregistered; the state is then compared by name"><input className="input-field uppercase" value={s.collegeGstin} onChange={e => set('collegeGstin', e.target.value)} /></Field>
        <Field label="College state"><input className="input-field" value={s.collegeState} onChange={e => set('collegeState', e.target.value)} /></Field>
        <Field label="GST rates offered (%)" hint="Comma separated"><input className="input-field" defaultValue={s.gstRates.join(', ')} onBlur={e => set('gstRates', e.target.value.split(',').map(Number).filter(n => Number.isFinite(n) && n >= 0))} /></Field>
        <Field label="Default GST rate (%)"><input className="input-field" type="number" value={s.defaultGstRate} onChange={e => set('defaultGstRate', Number(e.target.value) || 0)} /></Field>
        <Field label="Default delivery address" className="sm:col-span-2"><textarea className="input-field" rows={2} value={s.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} /></Field>
      </section>

      <section className="glass-card p-4 grid sm:grid-cols-3 gap-3">
        <h3 className="font-semibold sm:col-span-3">Quotations & terms</h3>
        <Field label="Quotations required from (₹)" hint="0 = never"><input className="input-field" type="number" min={0} value={s.quotationsAbove} onChange={e => set('quotationsAbove', Number(e.target.value) || 0)} /></Field>
        <Field label="Number of quotations"><input className="input-field" type="number" min={1} value={s.quotationsRequired} onChange={e => set('quotationsRequired', Number(e.target.value) || 1)} /></Field>
        <Field label="Payment terms (days)"><input className="input-field" type="number" min={0} value={s.paymentTermsDays} onChange={e => set('paymentTermsDays', Number(e.target.value) || 0)} /></Field>
        <Field label="Standard PO terms" className="sm:col-span-3"><textarea className="input-field" rows={4} value={s.poTerms} onChange={e => set('poTerms', e.target.value)} /></Field>
      </section>

      <section className="glass-card p-4">
        <h3 className="font-semibold mb-2">Budget heads</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">{s.budgetHeads.map(h => <span key={h} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-vriddhi-card border border-vriddhi-border">{h}<button onClick={() => set('budgetHeads', s.budgetHeads.filter(x => x !== h))}><X className="w-3 h-3" /></button></span>)}</div>
        <input className="input-field" value={head} onChange={e => setHead(e.target.value)} placeholder="Add and press Enter" onKeyDown={e => { if (e.key === 'Enter' && head.trim()) { set('budgetHeads', Array.from(new Set([...s.budgetHeads, head.trim()]))); setHead('') } }} />
      </section>

      <section className="glass-card p-4">
        <h3 className="font-semibold mb-1">TDS sections</h3>
        <p className="text-xs text-vriddhi-muted mb-3">Deducted on the amount before GST when a bill reaches the threshold. Confirm rates with your auditor.</p>
        <div className="space-y-2">
          {s.tdsSections.map((t, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input className="input-field col-span-2" placeholder="Code" value={t.code} onChange={e => set('tdsSections', s.tdsSections.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} />
              <input className="input-field col-span-5" placeholder="Label" value={t.label} onChange={e => set('tdsSections', s.tdsSections.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input-field col-span-2" type="number" step="0.1" placeholder="Rate %" value={t.rate} onChange={e => set('tdsSections', s.tdsSections.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) || 0 } : x)))} />
              <input className="input-field col-span-2" type="number" placeholder="Threshold ₹" value={t.threshold} onChange={e => set('tdsSections', s.tdsSections.map((x, j) => (j === i ? { ...x, threshold: Number(e.target.value) || 0 } : x)))} />
              <button className="col-span-1 text-red-500" onClick={() => set('tdsSections', s.tdsSections.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <button className={`${btn.small} mt-2`} onClick={() => set('tdsSections', [...s.tdsSections, { code: '', label: '', rate: 0, threshold: 0 }])}><Plus className="w-3 h-3" />Add section</button>
      </section>

      <div className="fixed bottom-4 right-4 md:right-8 z-20">
        <button className={`${btn.primary} shadow-lg`} disabled={save.isPending} onClick={() => save.mutate()}><Save className="w-4 h-4" />{save.isPending ? 'Saving…' : 'Save settings'}</button>
      </div>
    </div>
  )
}
