// src/modules/admin/pages/FinanceSettings.tsx
//
// Admin UI to customise the college's finance rules — the "flexible for
// customization" surface for the whole payments module: discount rules
// (category / academic-score / management / custom), the discount stacking
// policy, the late-payment-fine policy, and payment terms / installments.
// Backed by colleges/{id}/config/finance via useFinanceRules.

import { useEffect, useState } from 'react'
import { useFinanceRules } from '../hooks/useFinanceRules'
import type { FinanceRulesDoc } from '../api/financeApi'
import { buildSchedule } from '../utils/financeRules'
import type {
  Bracket,
  DiscountRule,
  DiscountType,
  DiscountValueType,
  LateFineType,
  StackPolicy,
} from '../utils/financeRules'
import { useNotification } from '../../../shared/providers/NotificationProvider'

const uid = () => Math.random().toString(36).slice(2, 9)

function emptyRule(): DiscountRule {
  return { id: uid(), type: 'category', label: '', enabled: true, valueType: 'percent', value: 0, categories: [] }
}

const inputCls = 'input-field'
const labelCls = 'text-sm text-vriddhi-muted mb-1 block'
const cardCls = 'p-4 rounded-xl border border-vriddhi-border bg-vriddhi-dark/30 space-y-3'

export default function FinanceSettings() {
  const { rules, loading, saving, save } = useFinanceRules()
  const { showSuccess, showError } = useNotification()
  const [draft, setDraft] = useState<FinanceRulesDoc | null>(null)

  useEffect(() => {
    if (!loading) setDraft(structuredClone(rules))
  }, [loading, rules])

  if (loading || !draft) {
    return <div className="p-6 text-vriddhi-muted">Loading finance settings…</div>
  }

  const patchPolicy = (p: Partial<FinanceRulesDoc['discountPolicy']>) =>
    setDraft(d => (d ? { ...d, discountPolicy: { ...d.discountPolicy, ...p } } : d))

  const patchLateFine = (p: Partial<FinanceRulesDoc['lateFinePolicy']>) =>
    setDraft(d => (d ? { ...d, lateFinePolicy: { ...d.lateFinePolicy, ...p } } : d))

  const updateRule = (id: string, p: Partial<DiscountRule>) =>
    setDraft(d => (d ? { ...d, discountRules: d.discountRules.map(r => (r.id === id ? { ...r, ...p } : r)) } : d))

  const addRule = () => setDraft(d => (d ? { ...d, discountRules: [...d.discountRules, emptyRule()] } : d))
  const removeRule = (id: string) =>
    setDraft(d => (d ? { ...d, discountRules: d.discountRules.filter(r => r.id !== id) } : d))

  const onSave = async () => {
    if (!draft) return
    try {
      await save(draft)
      showSuccess('Finance settings saved.')
    } catch {
      showError('Could not save finance settings.')
    }
  }

  const preview = buildSchedule(draft.terms, 50000)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance Settings</h1>
          <p className="text-sm text-vriddhi-muted">Customise discounts, late fines and payment terms for this college.</p>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* ── Discount rules ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Discount rules</h2>
          <button onClick={addRule} className="text-xs px-3 py-1.5 rounded-lg bg-vriddhi-accent/20 text-vriddhi-accent hover:bg-vriddhi-accent/30">
            + Add rule
          </button>
        </div>

        {draft.discountRules.length === 0 && (
          <p className="text-sm text-vriddhi-muted">No discount rules yet. Add one to offer category, merit (academic-score) or management discounts.</p>
        )}

        {draft.discountRules.map(rule => (
          <div key={rule.id} className={cardCls}>
            <div className="flex items-center gap-2">
              <select
                value={rule.type}
                onChange={e => updateRule(rule.id, { type: e.target.value as DiscountType })}
                className={inputCls}
              >
                <option value="category">Category</option>
                <option value="academic_score">Academic score</option>
                <option value="management">Management</option>
                <option value="custom">Custom</option>
              </select>
              <input
                placeholder="Label (e.g. SC concession)"
                value={rule.label}
                onChange={e => updateRule(rule.id, { label: e.target.value })}
                className={`${inputCls} flex-1`}
              />
              <label className="flex items-center gap-1.5 text-xs text-vriddhi-muted whitespace-nowrap">
                <input type="checkbox" checked={rule.enabled} onChange={e => updateRule(rule.id, { enabled: e.target.checked })} />
                Enabled
              </label>
              <button onClick={() => removeRule(rule.id)} className="text-xs text-red-500 hover:text-red-600 px-2">Remove</button>
            </div>

            {rule.type !== 'academic_score' && rule.type !== 'management' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Value type</label>
                  <select value={rule.valueType} onChange={e => updateRule(rule.id, { valueType: e.target.value as DiscountValueType })} className={inputCls}>
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{rule.valueType === 'percent' ? 'Percent' : 'Amount (₹)'}</label>
                  <input type="number" value={rule.value} onChange={e => updateRule(rule.id, { value: Number(e.target.value) })} className={inputCls} />
                </div>
              </div>
            )}

            {(rule.type === 'category' || rule.type === 'custom') && (
              <div>
                <label className={labelCls}>Applies to categories (comma-separated; blank = all)</label>
                <input
                  value={(rule.categories ?? []).join(', ')}
                  onChange={e => updateRule(rule.id, { categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className={inputCls}
                  placeholder="SC, ST, OBC"
                />
              </div>
            )}

            {(rule.type === 'category' || rule.type === 'custom') && (
              <div>
                <label className={labelCls}>Courses (comma-separated; blank = all)</label>
                <input
                  value={(rule.courses ?? []).join(', ')}
                  onChange={e => updateRule(rule.id, { courses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className={inputCls}
                  placeholder="BCA, BCom"
                />
              </div>
            )}

            {rule.type === 'academic_score' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Score brackets (score ≥ min and ≤ max → discount %)</label>
                  <select
                    value={rule.scoreSource ?? 'profile'}
                    onChange={e => updateRule(rule.id, { scoreSource: e.target.value as DiscountRule['scoreSource'] })}
                    className={`${inputCls} max-w-[180px]`}
                  >
                    <option value="profile">Score from profile (CGPA)</option>
                    <option value="assessment">Score from assessments</option>
                    <option value="manual">Entered manually</option>
                  </select>
                </div>
                <BracketEditor
                  brackets={rule.brackets ?? []}
                  onChange={brackets => updateRule(rule.id, { brackets })}
                />
              </div>
            )}
          </div>
        ))}

        {/* Stacking policy */}
        <div className={cardCls}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">How multiple discounts combine</h3>
          <div className="flex gap-4">
            {(['best_of', 'cumulative'] as StackPolicy[]).map(s => (
              <label key={s} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                <input type="radio" checked={draft.discountPolicy.stack === s} onChange={() => patchPolicy({ stack: s })} />
                {s === 'best_of' ? 'Best single discount' : 'Cumulative (stack)'}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Max total discount (%)</label>
              <input type="number" value={draft.discountPolicy.maxPercent ?? ''} onChange={e => patchPolicy({ maxPercent: e.target.value === '' ? undefined : Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Max total discount (₹)</label>
              <input type="number" value={draft.discountPolicy.maxFlat ?? ''} onChange={e => patchPolicy({ maxFlat: e.target.value === '' ? undefined : Number(e.target.value) })} className={inputCls} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Late fine ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Late payment fine</h2>
        <div className={cardCls}>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={draft.lateFinePolicy.enabled} onChange={e => patchLateFine({ enabled: e.target.checked })} />
            Charge a fine on overdue fees
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Grace days</label>
              <input type="number" value={draft.lateFinePolicy.graceDays} onChange={e => patchLateFine({ graceDays: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select value={draft.lateFinePolicy.type} onChange={e => patchLateFine({ type: e.target.value as LateFineType })} className={inputCls}>
                <option value="per_day_percent">Per day %</option>
                <option value="per_day_flat">Per day ₹</option>
                <option value="fixed">Fixed ₹</option>
                <option value="bracket">By days bracket</option>
              </select>
            </div>
            {draft.lateFinePolicy.type !== 'bracket' && (
              <div>
                <label className={labelCls}>{draft.lateFinePolicy.type === 'per_day_percent' ? 'Rate (%/day)' : 'Rate (₹)'}</label>
                <input type="number" value={draft.lateFinePolicy.rate} onChange={e => patchLateFine({ rate: Number(e.target.value) })} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Max fine (₹)</label>
              <input type="number" value={draft.lateFinePolicy.maxFine ?? ''} onChange={e => patchLateFine({ maxFine: e.target.value === '' ? undefined : Number(e.target.value) })} className={inputCls} />
            </div>
          </div>
          {draft.lateFinePolicy.type === 'bracket' && (
            <BracketEditor brackets={draft.lateFinePolicy.brackets ?? []} onChange={brackets => patchLateFine({ brackets })} />
          )}
        </div>
      </section>

      {/* ── Payment terms ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment terms &amp; installments</h2>
        <div className={cardCls}>
          <div>
            <label className={labelCls}>Terms text (shown to students)</label>
            <textarea rows={2} value={draft.terms.termsText ?? ''} onChange={e => setDraft(d => (d ? { ...d, terms: { ...d.terms, termsText: e.target.value } } : d))} className={inputCls} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Installments</label>
              <button
                onClick={() => setDraft(d => (d ? { ...d, terms: { ...d.terms, installments: [...d.terms.installments, { label: `Installment ${d.terms.installments.length + 1}`, percent: 0, dueDate: '' }] } } : d))}
                className="text-xs px-3 py-1.5 rounded-lg bg-vriddhi-accent/20 text-vriddhi-accent hover:bg-vriddhi-accent/30"
              >
                + Add installment
              </button>
            </div>
            {draft.terms.installments.map((inst, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input placeholder="Label" value={inst.label} onChange={e => setDraft(d => d ? { ...d, terms: { ...d.terms, installments: d.terms.installments.map((x, i) => i === idx ? { ...x, label: e.target.value } : x) } } : d)} className={`${inputCls} col-span-4`} />
                <input type="number" placeholder="%" value={inst.percent ?? ''} onChange={e => setDraft(d => d ? { ...d, terms: { ...d.terms, installments: d.terms.installments.map((x, i) => i === idx ? { ...x, percent: e.target.value === '' ? undefined : Number(e.target.value), amount: undefined } : x) } } : d)} className={`${inputCls} col-span-2`} />
                <input type="number" placeholder="₹" value={inst.amount ?? ''} onChange={e => setDraft(d => d ? { ...d, terms: { ...d.terms, installments: d.terms.installments.map((x, i) => i === idx ? { ...x, amount: e.target.value === '' ? undefined : Number(e.target.value), percent: undefined } : x) } } : d)} className={`${inputCls} col-span-2`} />
                <input type="date" value={inst.dueDate} onChange={e => setDraft(d => d ? { ...d, terms: { ...d.terms, installments: d.terms.installments.map((x, i) => i === idx ? { ...x, dueDate: e.target.value } : x) } } : d)} className={`${inputCls} col-span-3`} />
                <button onClick={() => setDraft(d => d ? { ...d, terms: { ...d.terms, installments: d.terms.installments.filter((_, i) => i !== idx) } } : d)} className="col-span-1 text-xs text-red-500 hover:text-red-600">✕</button>
              </div>
            ))}
            {preview.length > 0 && (
              <p className="text-xs text-vriddhi-muted">
                Preview on ₹50,000: {preview.map(r => `${r.label} ₹${r.amount.toLocaleString('en-IN')}`).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Bracket editor ──────────────────────────────────────
function BracketEditor({ brackets, onChange }: { brackets: Bracket[]; onChange: (b: Bracket[]) => void }) {
  const set = (idx: number, p: Partial<Bracket>) => onChange(brackets.map((b, i) => (i === idx ? { ...b, ...p } : b)))
  return (
    <div className="space-y-2">
      {brackets.map((b, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <input type="number" placeholder="Min" value={b.min} onChange={e => set(idx, { min: Number(e.target.value) })} className={`${inputCls} col-span-3`} />
          <input type="number" placeholder="Max (blank = ∞)" value={b.max ?? ''} onChange={e => set(idx, { max: e.target.value === '' ? undefined : Number(e.target.value) })} className={`${inputCls} col-span-3`} />
          <input type="number" placeholder="Value" value={b.value} onChange={e => set(idx, { value: Number(e.target.value) })} className={`${inputCls} col-span-4`} />
          <button onClick={() => onChange(brackets.filter((_, i) => i !== idx))} className="col-span-2 text-xs text-red-500 hover:text-red-600">Remove</button>
        </div>
      ))}
      <button onClick={() => onChange([...brackets, { min: 0, value: 0 }])} className="text-xs px-3 py-1.5 rounded-lg bg-vriddhi-border/50 text-vriddhi-muted hover:bg-vriddhi-border">
        + Add bracket
      </button>
    </div>
  )
}
