// Every library rule is the college's own: loan periods, limits, fines,
// closed days, lost-book policy, reservations, numbering and how fines are
// settled. Saved to colleges/{id}/config/library.

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, RotateCcw, Save, X } from 'lucide-react'
import { Field, btn, errMsg } from '../officeUi'
import { useNotification } from '@/shared/providers/NotificationProvider'
import { saveLibrarySettings } from '../../api/libraryApi'
import { DEFAULT_LIBRARY_SETTINGS, formatAccession, type LibrarySettings, type MemberPolicy, type MemberType } from '../../utils/libraryEngine'
import { libraryKeys, useCollegeId } from '../../hooks/useLibrary'

const POLICY_FIELDS: Array<{ key: keyof MemberPolicy; label: string; hint?: string }> = [
  { key: 'maxBooks', label: 'Max books at a time' },
  { key: 'loanDays', label: 'Loan period (days)' },
  { key: 'maxRenewals', label: 'Renewals allowed' },
  { key: 'renewDays', label: 'Days per renewal' },
  { key: 'finePerDay', label: 'Fine per day (₹)', hint: '0 = no fine' },
  { key: 'maxFine', label: 'Max fine per book (₹)', hint: '0 = no cap' },
  { key: 'graceDays', label: 'Grace days' },
]
const MEMBER_LABEL: Record<MemberType, string> = { student: 'Students', faculty: 'Faculty', staff: 'Non-teaching staff' }

export default function LibrarySettingsTab({ settings }: { settings: LibrarySettings }) {
  const { showSuccess, showError } = useNotification()
  const qc = useQueryClient()
  const cid = useCollegeId()
  const [s, setS] = useState<LibrarySettings>(settings)
  const [saving, setSaving] = useState(false)
  const [holiday, setHoliday] = useState('')
  const [category, setCategory] = useState('')
  useEffect(() => setS(settings), [settings])

  const set = <K extends keyof LibrarySettings>(k: K, v: LibrarySettings[K]) => setS(p => ({ ...p, [k]: v }))
  const setPolicy = (t: MemberType, k: keyof MemberPolicy, v: number) => setS(p => ({ ...p, policies: { ...p.policies, [t]: { ...p.policies[t], [k]: v } } }))
  const dirty = JSON.stringify(s) !== JSON.stringify(settings)

  async function save() {
    setSaving(true)
    try {
      await saveLibrarySettings(s)
      await qc.invalidateQueries({ queryKey: libraryKeys.settings(cid) })
      showSuccess('Library settings saved.')
    } catch (e) {
      showError(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  const Toggle = ({ k, label, hint }: { k: 'sundayClosed' | 'dueDateSkipsClosedDays' | 'skipClosedDaysInFines' | 'allowReservations' | 'allowRenewalRequests'; label: string; hint?: string }) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={s[k]} onChange={e => set(k, e.target.checked)} />
      <span><span className="text-vriddhi-text">{label}</span>{hint && <span className="block text-xs text-vriddhi-muted">{hint}</span>}</span>
    </label>
  )

  return (
    <div className="space-y-5 pb-20">
      <section className="glass-card p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">General</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Library name"><input className="input-field" value={s.libraryName} onChange={e => set('libraryName', e.target.value)} /></Field>
          <Field label="Opening hours (shown to members)"><input className="input-field" value={s.openingHours} onChange={e => set('openingHours', e.target.value)} /></Field>
        </div>
      </section>

      <section className="glass-card p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Borrowing rules by member type</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr><th className="table-header">Rule</th>{(Object.keys(MEMBER_LABEL) as MemberType[]).map(t => <th key={t} className="table-header">{MEMBER_LABEL[t]}</th>)}</tr></thead>
            <tbody>
              {POLICY_FIELDS.map(f => (
                <tr key={f.key} className="border-t border-vriddhi-border/50">
                  <td className="table-cell">{f.label}{f.hint && <span className="block text-[11px] text-vriddhi-muted">{f.hint}</span>}</td>
                  {(Object.keys(MEMBER_LABEL) as MemberType[]).map(t => (
                    <td key={t} className="table-cell"><input type="number" min={0} className="input-field !py-1 !w-24" value={s.policies[t][f.key]} onChange={e => setPolicy(t, f.key, Number(e.target.value) || 0)} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Closed days</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Toggle k="sundayClosed" label="Closed on Sundays" />
          <Toggle k="dueDateSkipsClosedDays" label="Due date moves to next open day" hint="If a due date falls on a closed day" />
          <Toggle k="skipClosedDaysInFines" label="No fine for closed days" />
        </div>
        <div>
          <p className="text-xs font-medium text-vriddhi-muted mb-1">Holidays &amp; vacations</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {s.holidays.map(h => <span key={h} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-vriddhi-card border border-vriddhi-border">{h}<button onClick={() => set('holidays', s.holidays.filter(x => x !== h))}><X className="w-3 h-3" /></button></span>)}
            {!s.holidays.length && <span className="text-xs text-vriddhi-muted">None added</span>}
          </div>
          <div className="flex gap-2"><input type="date" className="input-field !w-auto" value={holiday} onChange={e => setHoliday(e.target.value)} /><button className={btn.ghost} disabled={!holiday} onClick={() => { set('holidays', Array.from(new Set([...s.holidays, holiday])).sort()); setHoliday('') }}><Plus className="w-4 h-4" /> Add</button></div>
        </div>
      </section>

      <section className="glass-card p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Fines, lost &amp; damaged books</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="How fines are settled">
            <select className="input-field" value={s.fineHandling} onChange={e => set('fineHandling', e.target.value as LibrarySettings['fineHandling'])}>
              <option value="both">At the desk or on the fee account</option>
              <option value="desk">Only at the library desk</option>
              <option value="fee_account">Students: fee account only</option>
            </select>
          </Field>
          <Field label="Block issue when unpaid fines exceed (₹)" hint="0 = never block"><input type="number" min={0} className="input-field" value={s.blockIssueAboveFine} onChange={e => set('blockIssueAboveFine', Number(e.target.value) || 0)} /></Field>
          <Field label="Library receipt prefix"><input className="input-field font-mono" value={s.receiptPrefix} onChange={e => set('receiptPrefix', e.target.value.toUpperCase())} /></Field>
          <Field label="Lost book charge">
            <select className="input-field" value={s.lostBookPolicy} onChange={e => set('lostBookPolicy', e.target.value as LibrarySettings['lostBookPolicy'])}>
              <option value="price_plus_fee">Book price + processing fee</option>
              <option value="price">Book price only</option>
              <option value="multiple">A multiple of the price</option>
            </select>
          </Field>
          {s.lostBookPolicy === 'price_plus_fee' && <Field label="Processing fee (₹)"><input type="number" min={0} className="input-field" value={s.lostProcessingFee} onChange={e => set('lostProcessingFee', Number(e.target.value) || 0)} /></Field>}
          {s.lostBookPolicy === 'multiple' && <Field label="Multiple of price"><input type="number" min={1} step={0.5} className="input-field" value={s.lostMultiplier} onChange={e => set('lostMultiplier', Number(e.target.value) || 1)} /></Field>}
          <Field label="Default damage charge (₹)"><input type="number" min={0} className="input-field" value={s.damageCharge} onChange={e => set('damageCharge', Number(e.target.value) || 0)} /></Field>
        </div>
      </section>

      <section className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Reservations &amp; renewals</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle k="allowReservations" label="Members can reserve books online" hint="When every copy is on loan" />
          <Toggle k="allowRenewalRequests" label="Members can request renewals online" />
          <Field label="Hold a returned copy for (days)"><input type="number" min={1} className="input-field" value={s.reservationHoldDays} onChange={e => set('reservationHoldDays', Number(e.target.value) || 1)} /></Field>
          <Field label="Max open reservations per member"><input type="number" min={0} className="input-field" value={s.maxReservationsPerMember} onChange={e => set('maxReservationsPerMember', Number(e.target.value) || 0)} /></Field>
        </div>
      </section>

      <section className="glass-card p-4 space-y-3">
        <h3 className="font-semibold text-slate-900 dark:text-white">Accession numbers &amp; categories</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Accession prefix"><input className="input-field font-mono" value={s.accessionPrefix} onChange={e => set('accessionPrefix', e.target.value.toUpperCase())} /></Field>
          <Field label="Digits"><input type="number" min={1} max={10} className="input-field" value={s.accessionPadding} onChange={e => set('accessionPadding', Number(e.target.value) || 6)} /></Field>
          <Field label="Preview"><div className="input-field font-mono bg-transparent">{formatAccession(s.accessionPrefix, 42, s.accessionPadding)}</div></Field>
        </div>
        <div>
          <p className="text-xs font-medium text-vriddhi-muted mb-1">Categories</p>
          <div className="flex flex-wrap gap-1.5 mb-2">{s.categories.map(c => <span key={c} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-vriddhi-card border border-vriddhi-border">{c}<button onClick={() => set('categories', s.categories.filter(x => x !== c))}><X className="w-3 h-3" /></button></span>)}</div>
          <div className="flex gap-2"><input className="input-field !w-64" value={category} onChange={e => setCategory(e.target.value)} placeholder="New category" /><button className={btn.ghost} disabled={!category.trim()} onClick={() => { set('categories', Array.from(new Set([...s.categories, category.trim()]))); setCategory('') }}><Plus className="w-4 h-4" /> Add</button></div>
        </div>
      </section>

      <div className="fixed bottom-4 right-4 z-40 flex gap-2">
        <button onClick={() => setS(DEFAULT_LIBRARY_SETTINGS)} className={btn.ghost} title="Load recommended defaults"><RotateCcw className="w-4 h-4" /> Defaults</button>
        <button onClick={save} disabled={!dirty || saving} className={`${btn.primary} shadow-lg`}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings</button>
      </div>
    </div>
  )
}
