// /admin/vendors — approved vendor master (GST, PAN, bank, MSME, default TDS).

import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { Download, Edit2, Plus, Search, Store } from 'lucide-react'
import { Badge, Empty, Field, Loading, Modal, PageHeader, btn, downloadCsv, errMsg } from '../components/officeUi'
import { saveVendor, type Vendor, type VendorInput } from '../api/procurementApi'
import { useProcurementRefresh, useProcurementSettings, useVendors } from '../hooks/useProcurement'
import { isValidGstin } from '../utils/procurementEngine'

const EMPTY: VendorInput = {
  name: '', gstin: '', pan: '', state: '', address: '', contactPerson: '', phone: '', email: '',
  categories: [], msme: false, udyam: '', tdsSection: 'none',
  bank: { accountName: '', accountNo: '', ifsc: '', bankName: '' }, active: true, note: '',
}

export default function VendorsPage() {
  const vendorsQ = useVendors()
  const { settings } = useProcurementSettings()
  const [q, setQ] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [edit, setEdit] = useState<{ id?: string; v: VendorInput } | null>(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return (vendorsQ.data || []).filter(v => (showInactive || v.active) && (!s || [v.name, v.gstin, v.phone, v.contactPerson, v.categories.join(' ')].join(' ').toLowerCase().includes(s)))
  }, [vendorsQ.data, q, showInactive])

  const exportCsv = () =>
    downloadCsv('vendors.csv', list.map(v => ({ Name: v.name, GSTIN: v.gstin, PAN: v.pan, State: v.state, Contact: v.contactPerson, Phone: v.phone, Email: v.email, Categories: v.categories.join('; '), MSME: v.msme ? `Yes ${v.udyam}` : 'No', TDS: v.tdsSection, Bank: v.bank.bankName, 'A/c': v.bank.accountNo, IFSC: v.bank.ifsc, Active: v.active ? 'Yes' : 'No' })))

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Vendors"
        subtitle="Approved suppliers for purchase orders and bills"
        icon={<Store className="w-5 h-5" />}
        actions={<>
          <button className={btn.ghost} onClick={exportCsv}><Download className="w-4 h-4" />CSV</button>
          <button className={btn.primary} onClick={() => setEdit({ v: { ...EMPTY, state: settings.collegeState } })}><Plus className="w-4 h-4" />Add vendor</button>
        </>}
      />
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-vriddhi-muted" />
          <input className="input-field pl-9" placeholder="Search name, GSTIN, phone, category" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-vriddhi-muted"><input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />Show inactive</label>
      </div>
      {vendorsQ.isLoading ? <Loading /> : !list.length ? (
        <Empty icon={<Store className="w-8 h-8" />} title="No vendors yet" hint="Add the suppliers you buy from — GSTIN decides CGST/SGST vs IGST on orders." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map(v => (
            <div key={v.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-vriddhi-text">{v.name}</p>
                  <p className="text-xs text-vriddhi-muted">{v.gstin || 'Unregistered'}{v.state ? ` · ${v.state}` : ''}</p>
                </div>
                <button className={btn.small} onClick={() => setEdit({ id: v.id, v: strip(v) })}><Edit2 className="w-3 h-3" />Edit</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {!v.active && <Badge tone="red">Inactive</Badge>}
                {v.msme && <Badge tone="purple">MSME</Badge>}
                {v.tdsSection !== 'none' && <Badge tone="amber">TDS {v.tdsSection}</Badge>}
                {v.categories.map(c => <Badge key={c}>{c}</Badge>)}
              </div>
              <p className="text-xs text-vriddhi-muted mt-2">{[v.contactPerson, v.phone, v.email].filter(Boolean).join(' · ')}</p>
            </div>
          ))}
        </div>
      )}
      {edit && <VendorModal init={edit.v} id={edit.id} tdsOptions={settings.tdsSections.map(s => ({ code: s.code, label: s.label }))} onClose={() => setEdit(null)} />}
    </div>
  )
}

function strip(v: Vendor): VendorInput {
  const { id: _id, ...rest } = v
  return rest
}

function VendorModal({ init, id, tdsOptions, onClose }: { init: VendorInput; id?: string; tdsOptions: { code: string; label: string }[]; onClose: () => void }) {
  const [v, setV] = useState<VendorInput>(init)
  const [cats, setCats] = useState(init.categories.join(', '))
  const refresh = useProcurementRefresh()
  const { showSuccess, showError } = useNotification()
  const set = <K extends keyof VendorInput>(k: K, val: VendorInput[K]) => setV(p => ({ ...p, [k]: val }))
  const setBank = (k: keyof VendorInput['bank'], val: string) => setV(p => ({ ...p, bank: { ...p.bank, [k]: val } }))
  const m = useMutation({
    mutationFn: () => {
      if (!v.name.trim()) throw new Error('Vendor name is required.')
      if (v.gstin.trim() && !isValidGstin(v.gstin)) throw new Error('GSTIN looks invalid (15 characters, e.g. 29ABCDE1234F1Z5).')
      if (v.pan.trim() && !/^[A-Z]{5}\d{4}[A-Z]$/i.test(v.pan.trim())) throw new Error('PAN looks invalid.')
      if (v.bank.ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(v.bank.ifsc.trim())) throw new Error('IFSC looks invalid.')
      return saveVendor({ ...v, categories: cats.split(',').map(s => s.trim()).filter(Boolean), bank: { ...v.bank, ifsc: v.bank.ifsc.toUpperCase().trim() } }, id)
    },
    onSuccess: () => { showSuccess('Vendor saved'); refresh(); onClose() },
    onError: e => showError(errMsg(e)),
  })
  return (
    <Modal open onClose={onClose} title={id ? 'Edit vendor' : 'Add vendor'} wide footer={<><button className={btn.ghost} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? 'Saving…' : 'Save'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name *" className="sm:col-span-2"><input className="input-field" value={v.name} onChange={e => set('name', e.target.value)} /></Field>
        <Field label="GSTIN" hint="State code decides CGST/SGST vs IGST"><input className="input-field uppercase" value={v.gstin} onChange={e => set('gstin', e.target.value)} /></Field>
        <Field label="PAN"><input className="input-field uppercase" value={v.pan} onChange={e => set('pan', e.target.value)} /></Field>
        <Field label="State"><input className="input-field" value={v.state} onChange={e => set('state', e.target.value)} /></Field>
        <Field label="Categories" hint="Comma separated, e.g. Books, Furniture"><input className="input-field" value={cats} onChange={e => setCats(e.target.value)} /></Field>
        <Field label="Address" className="sm:col-span-2"><textarea className="input-field" rows={2} value={v.address} onChange={e => set('address', e.target.value)} /></Field>
        <Field label="Contact person"><input className="input-field" value={v.contactPerson} onChange={e => set('contactPerson', e.target.value)} /></Field>
        <Field label="Phone"><input className="input-field" value={v.phone} onChange={e => set('phone', e.target.value)} /></Field>
        <Field label="Email"><input className="input-field" type="email" value={v.email} onChange={e => set('email', e.target.value)} /></Field>
        <Field label="Default TDS section">
          <select className="input-field" value={v.tdsSection} onChange={e => set('tdsSection', e.target.value)}>
            {tdsOptions.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.msme} onChange={e => set('msme', e.target.checked)} />MSME registered (pay within 45 days)</label>
        {v.msme && <Field label="Udyam no."><input className="input-field" value={v.udyam} onChange={e => set('udyam', e.target.value)} /></Field>}
        <p className="sm:col-span-2 text-xs font-semibold text-vriddhi-muted mt-2">Bank details (for the accounts team)</p>
        <Field label="Account name"><input className="input-field" value={v.bank.accountName} onChange={e => setBank('accountName', e.target.value)} /></Field>
        <Field label="Account no."><input className="input-field" value={v.bank.accountNo} onChange={e => setBank('accountNo', e.target.value)} /></Field>
        <Field label="IFSC"><input className="input-field uppercase" value={v.bank.ifsc} onChange={e => setBank('ifsc', e.target.value)} /></Field>
        <Field label="Bank"><input className="input-field" value={v.bank.bankName} onChange={e => setBank('bankName', e.target.value)} /></Field>
        <Field label="Note" className="sm:col-span-2"><input className="input-field" value={v.note} onChange={e => set('note', e.target.value)} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={e => set('active', e.target.checked)} />Active</label>
      </div>
    </Modal>
  )
}
