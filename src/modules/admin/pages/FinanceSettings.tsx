// src/modules/admin/pages/FinanceSettings.tsx
//
// Admin UI to customise the WHOLE finance module per college — nothing here
// needs a code change:
//   • Receipts & letterhead  — college name/address/contact, receipt title,
//                               number prefix, footer, signatory (config/branding)
//   • Fees & discounts        — accepted payment modes, discount rules + stacking
//   • Late fine & terms       — late-payment fine policy, installments
//   • Guest billing           — rates by engagement type, deduction (TDS), approval, cap
//   • Payroll                 — salary components (earnings/deductions), LOP basis,
//                               approval, payslip prefix/footer
//   • Salary certificate      — editable wording with {{placeholders}} + live preview
// Backed by colleges/{id}/config/finance + config/branding via useFinanceRules.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgePercent, Building2, CalendarClock, FileSignature, Loader2, Plus, Receipt,
  RotateCcw, Save, Trash2, Users, Wallet,
} from 'lucide-react'
import { useFinanceRules } from '../hooks/useFinanceRules'
import { ALL_PAYMENT_MODES, type BrandingSettings, type FinanceRulesDoc } from '../api/financeApi'
import type { PaymentMode } from '../api/feeApi'
import { buildSchedule } from '../utils/financeRules'
import type {
  Bracket,
  DiscountRule,
  DiscountType,
  DiscountValueType,
  LateFineType,
  StackPolicy,
} from '../utils/financeRules'
import {
  CERTIFICATE_PLACEHOLDERS,
  amountInWords,
  computePayslip,
  formatINR,
  renderTemplate,
  type ComponentCalc,
  type ComponentKind,
  type SalaryComponent,
} from '../utils/payrollEngine'
import { computeGuestBill } from '../utils/guestBilling'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import PayrollAccessCard from '../components/PayrollAccessCard'

const uid = () => Math.random().toString(36).slice(2, 9)

function emptyRule(): DiscountRule {
  return { id: uid(), type: 'category', label: '', enabled: true, valueType: 'percent', value: 0, categories: [] }
}

function emptyComponent(kind: ComponentKind): SalaryComponent {
  return { id: uid(), name: '', code: '', kind, calc: kind === 'earning' ? 'percent_of_basic' : 'fixed', value: 0, prorate: kind === 'earning', enabled: true }
}

const inputCls = 'input-field'
const labelCls = 'text-xs font-medium text-vriddhi-muted mb-1 block'
const cardCls = 'glass-card p-5 space-y-4'
const subCardCls = 'p-4 rounded-xl border border-vriddhi-border bg-vriddhi-dark/20 space-y-3'
const chipBtn = 'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25 transition-colors'

const MODE_LABELS: Record<PaymentMode, string> = {
  cash: 'Cash', upi: 'UPI', card: 'Card', netbanking: 'Net banking', cheque: 'Cheque', dd: 'Demand draft',
}

const EMPLOYMENT_TYPES = ['PART_TIME', 'ADJUNCT', 'VISITING', 'GUEST', 'CONTRACT']

type TabId = 'branding' | 'fees' | 'latefine' | 'guest' | 'payroll' | 'certificate'

const TABS: { id: TabId; label: string; hint: string; icon: typeof Receipt }[] = [
  { id: 'branding', label: 'Receipts & letterhead', hint: 'College name, address, receipt numbering', icon: Building2 },
  { id: 'fees', label: 'Fees & discounts', hint: 'Payment modes, discount rules', icon: BadgePercent },
  { id: 'latefine', label: 'Late fine & terms', hint: 'Overdue fines, installments', icon: CalendarClock },
  { id: 'guest', label: 'Guest billing', hint: 'Per-period rates, TDS, approval', icon: Users },
  { id: 'payroll', label: 'Payroll', hint: 'Salary components, LOP, payslips', icon: Wallet },
  { id: 'certificate', label: 'Salary certificate', hint: 'Wording, signatory', icon: FileSignature },
]

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-vriddhi-accent' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>
        {hint && <span className="block text-xs text-vriddhi-muted">{hint}</span>}
      </span>
    </label>
  )
}

function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={cardCls}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
          {description && <p className="text-xs text-vriddhi-muted mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

const numOrUndef = (v: string) => (v === '' ? undefined : Number(v))

function SaveControls({ dirty, saving, onReset, onSave, compact = false }: {
  dirty: boolean; saving: boolean; onReset: () => void; onSave: () => void; compact?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {!compact && dirty && <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">Unsaved changes</span>}
      <button
        onClick={onReset}
        disabled={!dirty || saving}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-vriddhi-border text-vriddhi-muted hover:bg-vriddhi-border/40 transition-colors disabled:opacity-40"
      >
        <RotateCcw className="w-4 h-4" /> Discard
      </button>
      <button
        onClick={onSave}
        disabled={saving || !dirty}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}

export default function FinanceSettings() {
  const { rules, branding, loading, saving, save } = useFinanceRules()
  const { showSuccess, showError } = useNotification()
  const [draft, setDraft] = useState<FinanceRulesDoc | null>(null)
  const [brand, setBrand] = useState<BrandingSettings | null>(null)
  const [tab, setTab] = useState<TabId>('branding')

  useEffect(() => {
    if (!loading) {
      setDraft(structuredClone(rules))
      setBrand(structuredClone(branding))
    }
  }, [loading, rules, branding])

  const dirty = useMemo(
    () => !!draft && !!brand && (JSON.stringify(draft) !== JSON.stringify(rules) || JSON.stringify(brand) !== JSON.stringify(branding)),
    [draft, brand, rules, branding],
  )

  if (loading || !draft || !brand) {
    return (
      <div className="page-container flex items-center gap-2 text-vriddhi-muted">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading finance settings…
      </div>
    )
  }

  // ── patch helpers ──
  const patch = (p: Partial<FinanceRulesDoc>) => setDraft(d => (d ? { ...d, ...p } : d))
  const patchBrand = (p: Partial<BrandingSettings>) => setBrand(b => (b ? { ...b, ...p } : b))
  const patchPolicy = (p: Partial<FinanceRulesDoc['discountPolicy']>) =>
    setDraft(d => (d ? { ...d, discountPolicy: { ...d.discountPolicy, ...p } } : d))
  const patchLateFine = (p: Partial<FinanceRulesDoc['lateFinePolicy']>) =>
    setDraft(d => (d ? { ...d, lateFinePolicy: { ...d.lateFinePolicy, ...p } } : d))
  const patchGuest = (p: Partial<FinanceRulesDoc['guestBilling']>) =>
    setDraft(d => (d ? { ...d, guestBilling: { ...d.guestBilling, ...p } } : d))
  const patchPayroll = (p: Partial<FinanceRulesDoc['payroll']>) =>
    setDraft(d => (d ? { ...d, payroll: { ...d.payroll, ...p } } : d))
  const patchCert = (p: Partial<FinanceRulesDoc['payroll']['certificate']>) =>
    setDraft(d => (d ? { ...d, payroll: { ...d.payroll, certificate: { ...d.payroll.certificate, ...p } } } : d))
  const updateRule = (id: string, p: Partial<DiscountRule>) =>
    setDraft(d => (d ? { ...d, discountRules: d.discountRules.map(r => (r.id === id ? { ...r, ...p } : r)) } : d))
  const updateComponent = (id: string, p: Partial<SalaryComponent>) =>
    setDraft(d => (d ? { ...d, payroll: { ...d.payroll, components: d.payroll.components.map(c => (c.id === id ? { ...c, ...p } : c)) } } : d))
  const setInstallments = (fn: (list: FinanceRulesDoc['terms']['installments']) => FinanceRulesDoc['terms']['installments']) =>
    setDraft(d => (d ? { ...d, terms: { ...d.terms, installments: fn(d.terms.installments) } } : d))

  const onSave = async () => {
    try {
      if (!draft.enabledPaymentModes.length) {
        showError('Enable at least one payment mode.')
        setTab('fees')
        return
      }
      await save(draft, brand)
      showSuccess('Finance settings saved.')
    } catch (err) {
      console.error('[FinanceSettings] save failed', err)
      showError('Could not save finance settings. Only college admins can change them.')
    }
  }

  const onReset = () => {
    setDraft(structuredClone(rules))
    setBrand(structuredClone(branding))
  }

  const schedulePreview = buildSchedule(draft.terms, 50000)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="section-title mb-0.5 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-vriddhi-accent" /> Finance Settings
          </h1>
          <p className="text-sm text-vriddhi-muted">Tailor fees, receipts, guest billing and payroll to how your college works.</p>
        </div>
        <SaveControls dirty={dirty} saving={saving} onReset={onReset} onSave={onSave} />
      </div>

      <PayrollAccessCard />

      {/* Floating save bar so changes deep in a long tab are never lost */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-40 glass-card shadow-xl px-4 py-3 flex items-center gap-3">
          <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</span>
          <SaveControls dirty={dirty} saving={saving} onReset={onReset} onSave={onSave} compact />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Tab nav */}
        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-4 lg:self-start">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-start gap-3 text-left px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap lg:whitespace-normal ${
                  active ? 'bg-vriddhi-accent text-white shadow-sm' : 'bg-vriddhi-card border border-vriddhi-border text-vriddhi-muted hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className={`hidden lg:block text-[11px] ${active ? 'text-white/80' : 'text-vriddhi-muted'}`}>{t.hint}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="space-y-6 min-w-0">
          {/* ── Receipts & letterhead ── */}
          {tab === 'branding' && (
            <>
              <Section title="College letterhead" description="Printed at the top of every receipt, payslip, guest bill and salary certificate. Blank fields fall back to the college profile.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="College name"><input className={inputCls} value={brand.collegeName} onChange={e => patchBrand({ collegeName: e.target.value })} /></Field>
                  <Field label="College code"><input className={inputCls} value={brand.collegeCode} onChange={e => patchBrand({ collegeCode: e.target.value })} /></Field>
                  <Field label="Address" className="md:col-span-2"><textarea rows={2} className={inputCls} value={brand.address} onChange={e => patchBrand({ address: e.target.value })} /></Field>
                  <Field label="Phone"><input className={inputCls} value={brand.phone} onChange={e => patchBrand({ phone: e.target.value })} /></Field>
                  <Field label="Email"><input className={inputCls} value={brand.email} onChange={e => patchBrand({ email: e.target.value })} /></Field>
                  <Field label="Website"><input className={inputCls} value={brand.website} onChange={e => patchBrand({ website: e.target.value })} /></Field>
                  <Field label="Registration / affiliation line"><input className={inputCls} placeholder="Affiliated to Bengaluru City University · GSTIN …" value={brand.registrationLine} onChange={e => patchBrand({ registrationLine: e.target.value })} /></Field>
                </div>
              </Section>

              <Section title="Fee receipts" description="How receipts are numbered and worded.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Receipt title"><input className={inputCls} value={brand.receiptTitle} onChange={e => patchBrand({ receiptTitle: e.target.value })} /></Field>
                  <Field label="Receipt number prefix">
                    <input className={`${inputCls} font-mono`} value={brand.receiptPrefix} onChange={e => patchBrand({ receiptPrefix: e.target.value.toUpperCase() })} />
                    <p className="text-[11px] text-vriddhi-muted mt-1">Next receipt looks like <span className="font-mono">{(brand.receiptPrefix || 'RCP').replace(/[^A-Z0-9/-]/g, '')}-{new Date().getFullYear()}-482913</span></p>
                  </Field>
                  <Field label="Signatory name"><input className={inputCls} value={brand.signatoryName} onChange={e => patchBrand({ signatoryName: e.target.value })} /></Field>
                  <Field label="Signatory designation"><input className={inputCls} value={brand.signatoryDesignation} onChange={e => patchBrand({ signatoryDesignation: e.target.value })} /></Field>
                  <Field label="Footer note" className="md:col-span-2"><input className={inputCls} value={brand.receiptFooter} onChange={e => patchBrand({ receiptFooter: e.target.value })} /></Field>
                </div>
                <Toggle checked={brand.showBalanceOnReceipt} onChange={v => patchBrand({ showBalanceOnReceipt: v })} label="Show balance due on receipts" />

                {/* Mini preview */}
                <div className="rounded-xl border border-vriddhi-border bg-white dark:bg-slate-950 p-5 text-slate-800 dark:text-slate-200">
                  <p className="text-center font-bold text-base">{brand.collegeName || 'Your College Name'}</p>
                  {brand.address && <p className="text-center text-[11px] text-slate-500">{brand.address}</p>}
                  {(brand.phone || brand.email || brand.website) && <p className="text-center text-[11px] text-slate-500">{[brand.phone && `Ph: ${brand.phone}`, brand.email, brand.website].filter(Boolean).join(' · ')}</p>}
                  {brand.registrationLine && <p className="text-center text-[11px] text-slate-500">{brand.registrationLine}</p>}
                  <div className="h-0.5 bg-teal-500 my-3" />
                  <p className="text-center text-xs font-bold tracking-wide">{brand.receiptTitle || 'FEE PAYMENT RECEIPT'}</p>
                  <div className="flex justify-between text-[11px] mt-3"><span>Amount received</span><span className="font-semibold">Rs. 25,000.00</span></div>
                  {brand.showBalanceOnReceipt && <div className="flex justify-between text-[11px]"><span>Balance due</span><span>Rs. 5,000.00</span></div>}
                  <div className="text-right text-[11px] mt-6"><p className="font-semibold">{brand.signatoryName || 'Authorised Signatory'}</p><p className="text-slate-500">{brand.signatoryDesignation}</p></div>
                  <p className="text-center text-[10px] italic text-slate-400 mt-3">{brand.receiptFooter}</p>
                </div>
              </Section>
            </>
          )}

          {/* ── Fees & discounts ── */}
          {tab === 'fees' && (
            <>
              <Section title="Accepted payment modes" description="Only these appear in Record Payment at the finance counter.">
                <div className="flex flex-wrap gap-2">
                  {ALL_PAYMENT_MODES.map(m => {
                    const on = draft.enabledPaymentModes.includes(m)
                    return (
                      <button
                        key={m}
                        onClick={() => patch({ enabledPaymentModes: on ? draft.enabledPaymentModes.filter(x => x !== m) : [...draft.enabledPaymentModes, m] })}
                        className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${on ? 'bg-vriddhi-accent text-white border-vriddhi-accent' : 'border-vriddhi-border text-vriddhi-muted hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        {on ? '✓ ' : ''}{MODE_LABELS[m]}
                      </button>
                    )
                  })}
                </div>
              </Section>

              <Section
                title="Discount rules"
                description="Category (SC/ST/OBC…), merit (academic-score brackets), management or custom concessions."
                action={<button onClick={() => patch({ discountRules: [...draft.discountRules, emptyRule()] })} className={chipBtn}><Plus className="w-3.5 h-3.5" /> Add rule</button>}
              >
                {draft.discountRules.length === 0 && (
                  <p className="text-sm text-vriddhi-muted">No discount rules yet.</p>
                )}
                {draft.discountRules.map(rule => (
                  <div key={rule.id} className={subCardCls}>
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={rule.type} onChange={e => updateRule(rule.id, { type: e.target.value as DiscountType })} className={`${inputCls} max-w-[170px]`}>
                        <option value="category">Category</option>
                        <option value="academic_score">Academic score</option>
                        <option value="management">Management</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input placeholder="Label (e.g. SC concession)" value={rule.label} onChange={e => updateRule(rule.id, { label: e.target.value })} className={`${inputCls} flex-1 min-w-[160px]`} />
                      <Toggle checked={rule.enabled} onChange={v => updateRule(rule.id, { enabled: v })} label="Enabled" />
                      <button onClick={() => patch({ discountRules: draft.discountRules.filter(r => r.id !== rule.id) })} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Remove rule"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {rule.type !== 'academic_score' && rule.type !== 'management' && (
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Value type">
                          <select value={rule.valueType} onChange={e => updateRule(rule.id, { valueType: e.target.value as DiscountValueType })} className={inputCls}>
                            <option value="percent">Percent (%)</option>
                            <option value="flat">Flat (₹)</option>
                          </select>
                        </Field>
                        <Field label={rule.valueType === 'percent' ? 'Percent' : 'Amount (₹)'}>
                          <input type="number" value={rule.value} onChange={e => updateRule(rule.id, { value: Number(e.target.value) })} className={inputCls} />
                        </Field>
                      </div>
                    )}
                    {rule.type === 'management' && (
                      <p className="text-xs text-vriddhi-muted">Management discounts are entered case-by-case while recording a payment.</p>
                    )}
                    {(rule.type === 'category' || rule.type === 'custom') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Student categories (comma-separated; blank = all)">
                          <input value={(rule.categories ?? []).join(', ')} onChange={e => updateRule(rule.id, { categories: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} className={inputCls} placeholder="SC, ST, OBC" />
                        </Field>
                        <Field label="Courses (comma-separated; blank = all)">
                          <input value={(rule.courses ?? []).join(', ')} onChange={e => updateRule(rule.id, { courses: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} className={inputCls} placeholder="BCA, BCom" />
                        </Field>
                      </div>
                    )}
                    {rule.type === 'academic_score' && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className={labelCls}>Score brackets (score ≥ min and ≤ max → discount %)</label>
                          <select value={rule.scoreSource ?? 'profile'} onChange={e => updateRule(rule.id, { scoreSource: e.target.value as DiscountRule['scoreSource'] })} className={`${inputCls} max-w-[210px]`}>
                            <option value="profile">Score from profile (CGPA)</option>
                            <option value="assessment">Score from assessments</option>
                            <option value="manual">Entered manually</option>
                          </select>
                        </div>
                        <BracketEditor brackets={rule.brackets ?? []} onChange={brackets => updateRule(rule.id, { brackets })} valueLabel="Discount %" />
                      </div>
                    )}
                  </div>
                ))}

                <div className={subCardCls}>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">When several discounts apply</h3>
                  <div className="flex flex-wrap gap-4">
                    {(['best_of', 'cumulative'] as StackPolicy[]).map(st => (
                      <label key={st} className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                        <input type="radio" checked={draft.discountPolicy.stack === st} onChange={() => patchPolicy({ stack: st })} />
                        {st === 'best_of' ? 'Give the single best discount' : 'Add them up (stack)'}
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cap total discount at (%)"><input type="number" value={draft.discountPolicy.maxPercent ?? ''} onChange={e => patchPolicy({ maxPercent: numOrUndef(e.target.value) })} className={inputCls} placeholder="No cap" /></Field>
                    <Field label="Cap total discount at (₹)"><input type="number" value={draft.discountPolicy.maxFlat ?? ''} onChange={e => patchPolicy({ maxFlat: numOrUndef(e.target.value) })} className={inputCls} placeholder="No cap" /></Field>
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ── Late fine & terms ── */}
          {tab === 'latefine' && (
            <>
              <Section title="Late payment fine" description="Assessed on overdue fees after the grace period.">
                <Toggle checked={draft.lateFinePolicy.enabled} onChange={v => patchLateFine({ enabled: v })} label="Charge a fine on overdue fees" />
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${draft.lateFinePolicy.enabled ? '' : 'opacity-50 pointer-events-none'}`}>
                  <Field label="Grace days"><input type="number" value={draft.lateFinePolicy.graceDays} onChange={e => patchLateFine({ graceDays: Number(e.target.value) })} className={inputCls} /></Field>
                  <Field label="Fine type">
                    <select value={draft.lateFinePolicy.type} onChange={e => patchLateFine({ type: e.target.value as LateFineType })} className={inputCls}>
                      <option value="per_day_percent">Per day %</option>
                      <option value="per_day_flat">Per day ₹</option>
                      <option value="fixed">One-time ₹</option>
                      <option value="bracket">By days-late bracket</option>
                    </select>
                  </Field>
                  {draft.lateFinePolicy.type !== 'bracket' && (
                    <Field label={draft.lateFinePolicy.type === 'per_day_percent' ? 'Rate (%/day)' : 'Rate (₹)'}>
                      <input type="number" value={draft.lateFinePolicy.rate} onChange={e => patchLateFine({ rate: Number(e.target.value) })} className={inputCls} />
                    </Field>
                  )}
                  <Field label="Maximum fine (₹)"><input type="number" value={draft.lateFinePolicy.maxFine ?? ''} onChange={e => patchLateFine({ maxFine: numOrUndef(e.target.value) })} className={inputCls} placeholder="No cap" /></Field>
                </div>
                {draft.lateFinePolicy.enabled && draft.lateFinePolicy.type === 'bracket' && (
                  <BracketEditor brackets={draft.lateFinePolicy.brackets ?? []} onChange={brackets => patchLateFine({ brackets })} minLabel="From day" maxLabel="To day" valueLabel="Fine ₹" />
                )}
              </Section>

              <Section
                title="Payment terms & installments"
                description="Shown to students on their fee portal."
                action={<button onClick={() => setInstallments(list => [...list, { label: `Installment ${list.length + 1}`, percent: 0, dueDate: '' }])} className={chipBtn}><Plus className="w-3.5 h-3.5" /> Add installment</button>}
              >
                <Field label="Terms text">
                  <textarea rows={3} value={draft.terms.termsText ?? ''} onChange={e => setDraft(d => (d ? { ...d, terms: { ...d.terms, termsText: e.target.value } } : d))} className={inputCls} />
                </Field>
                {draft.terms.installments.length > 0 && (
                  <div className="space-y-2">
                    <div className="hidden md:grid grid-cols-12 gap-2 text-[11px] text-vriddhi-muted px-1">
                      <span className="col-span-4">Label</span><span className="col-span-2">% of fee</span><span className="col-span-2">or ₹ fixed</span><span className="col-span-3">Due date</span>
                    </div>
                    {draft.terms.installments.map((inst, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input placeholder="Label" value={inst.label} onChange={e => setInstallments(l => l.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))} className={`${inputCls} col-span-12 md:col-span-4`} />
                        <input type="number" placeholder="%" value={inst.percent ?? ''} onChange={e => setInstallments(l => l.map((x, i) => (i === idx ? { ...x, percent: numOrUndef(e.target.value), amount: undefined } : x)))} className={`${inputCls} col-span-4 md:col-span-2`} />
                        <input type="number" placeholder="₹" value={inst.amount ?? ''} onChange={e => setInstallments(l => l.map((x, i) => (i === idx ? { ...x, amount: numOrUndef(e.target.value), percent: undefined } : x)))} className={`${inputCls} col-span-4 md:col-span-2`} />
                        <input type="date" value={inst.dueDate} onChange={e => setInstallments(l => l.map((x, i) => (i === idx ? { ...x, dueDate: e.target.value } : x)))} className={`${inputCls} col-span-3`} />
                        <button onClick={() => setInstallments(l => l.filter((_, i) => i !== idx))} className="col-span-1 p-2 text-red-500 hover:bg-red-500/10 rounded-lg justify-self-center"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {schedulePreview.length > 0 && (
                  <p className="text-xs text-vriddhi-muted">Preview on ₹50,000: {schedulePreview.map(r => `${r.label} ₹${r.amount.toLocaleString('en-IN')}`).join(' · ')}</p>
                )}
              </Section>
            </>
          )}

          {/* ── Guest billing ── */}
          {tab === 'guest' && (
            <GuestBillingSettingsPanel draft={draft} patchGuest={patchGuest} />
          )}

          {/* ── Payroll ── */}
          {tab === 'payroll' && (
            <>
              <Section title="Payroll rules" description="How payslips are calculated and approved.">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Loss-of-pay (LOP) basis">
                    <select value={draft.payroll.lopBasis} onChange={e => patchPayroll({ lopBasis: e.target.value as FinanceRulesDoc['payroll']['lopBasis'] })} className={inputCls}>
                      <option value="calendar_days">Calendar days in the month</option>
                      <option value="fixed_days">Fixed days per month</option>
                    </select>
                  </Field>
                  {draft.payroll.lopBasis === 'fixed_days' && (
                    <Field label="Days per month"><input type="number" value={draft.payroll.fixedDaysPerMonth} onChange={e => patchPayroll({ fixedDaysPerMonth: Number(e.target.value) })} className={inputCls} /></Field>
                  )}
                  <Field label="Round net pay to (₹)">
                    <select value={draft.payroll.roundNetTo} onChange={e => patchPayroll({ roundNetTo: Number(e.target.value) })} className={inputCls}>
                      <option value={0}>Exact (paise)</option><option value={1}>Nearest ₹1</option><option value={10}>Nearest ₹10</option><option value={100}>Nearest ₹100</option>
                    </select>
                  </Field>
                  <Field label="Payslip number prefix"><input className={`${inputCls} font-mono`} value={draft.payroll.payslipPrefix} onChange={e => patchPayroll({ payslipPrefix: e.target.value.toUpperCase() })} /></Field>
                  <Field label="Payslip footer" className="md:col-span-2"><input className={inputCls} value={draft.payroll.payslipFooter} onChange={e => patchPayroll({ payslipFooter: e.target.value })} /></Field>
                </div>
                <Toggle checked={draft.payroll.requireApproval} onChange={v => patchPayroll({ requireApproval: v })} label="Payslips must be approved before they are marked paid" hint="Faculty only see approved or paid payslips." />
              </Section>

              <SalaryComponentsEditor
                components={draft.payroll.components}
                onChange={components => patchPayroll({ components })}
                onUpdate={updateComponent}
              />

              <PayrollPreview draft={draft} />
            </>
          )}

          {/* ── Salary certificate ── */}
          {tab === 'certificate' && (
            <CertificateSettingsPanel draft={draft} brand={brand} patchCert={patchCert} />
          )}

          <p className="text-xs text-vriddhi-muted">
            Changes apply to new receipts, bills and payslips. Go to{' '}
            <Link className="text-vriddhi-accent hover:underline" to="/admin/fee-management">Fee Management</Link>,{' '}
            <Link className="text-vriddhi-accent hover:underline" to="/admin/guest-faculty-billing">Guest Faculty Billing</Link> or{' '}
            <Link className="text-vriddhi-accent hover:underline" to="/admin/payroll">Faculty Payroll</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Guest billing panel ──────────────────────────────────
function GuestBillingSettingsPanel({ draft, patchGuest }: { draft: FinanceRulesDoc; patchGuest: (p: Partial<FinanceRulesDoc['guestBilling']>) => void }) {
  const g = draft.guestBilling
  const [newType, setNewType] = useState('')
  const preview = computeGuestBill({ scheduledPeriods: 20, extraPeriods: 2, absentPeriods: 1, rate: g.defaultPeriodRate || 500 }, g)
  const types = Array.from(new Set([...EMPLOYMENT_TYPES, ...Object.keys(g.rateByEmploymentType || {})]))
  return (
    <>
      <Section title="Per-period rates" description="A rate on the faculty’s guest contract always wins; otherwise the engagement-type rate, then the college default.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="College default rate (₹ / period)"><input type="number" value={g.defaultPeriodRate} onChange={e => patchGuest({ defaultPeriodRate: Number(e.target.value) })} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {types.map(t => (
            <Field key={t} label={`${t.replace(/_/g, ' ')} (₹ / period)`}>
              <input
                type="number"
                placeholder="Use default"
                value={g.rateByEmploymentType?.[t] ?? ''}
                onChange={e => {
                  const next = { ...(g.rateByEmploymentType || {}) }
                  if (e.target.value === '') delete next[t]
                  else next[t] = Number(e.target.value)
                  patchGuest({ rateByEmploymentType: next })
                }}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <Field label="Add engagement type" className="flex-1 max-w-xs"><input value={newType} onChange={e => setNewType(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="e.g. RESOURCE_PERSON" className={inputCls} /></Field>
          <button
            onClick={() => { if (newType) { patchGuest({ rateByEmploymentType: { ...(g.rateByEmploymentType || {}), [newType]: g.defaultPeriodRate || 0 } }); setNewType('') } }}
            className={chipBtn}
          ><Plus className="w-3.5 h-3.5" /> Add</button>
        </div>
      </Section>

      <Section title="Deductions, limits & approval">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Deduction label"><input value={g.deductionLabel} onChange={e => patchGuest({ deductionLabel: e.target.value })} className={inputCls} /></Field>
          <Field label="Deduction (%)"><input type="number" value={g.deductionPercent} onChange={e => patchGuest({ deductionPercent: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="Max periods / month (0 = no cap)"><input type="number" value={g.maxPeriodsPerMonth} onChange={e => patchGuest({ maxPeriodsPerMonth: Number(e.target.value) })} className={inputCls} /></Field>
          <Field label="Round net to (₹)">
            <select value={g.roundTo} onChange={e => patchGuest({ roundTo: Number(e.target.value) })} className={inputCls}>
              <option value={0}>Exact</option><option value={1}>₹1</option><option value={10}>₹10</option>
            </select>
          </Field>
          <Field label="Bill number prefix"><input value={g.billPrefix} onChange={e => patchGuest({ billPrefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} /></Field>
          <Field label="Bill footer / certification" className="md:col-span-3"><input value={g.billFooter} onChange={e => patchGuest({ billFooter: e.target.value })} className={inputCls} /></Field>
        </div>
        <Toggle checked={g.requireApproval} onChange={v => patchGuest({ requireApproval: v })} label="Bills must be approved before they can be marked recorded" />
        <div className="text-xs text-vriddhi-muted p-3 rounded-xl bg-vriddhi-dark/20 border border-vriddhi-border">
          Example — 20 timetable periods + 2 extra − 1 not engaged at ₹{(g.defaultPeriodRate || 500).toLocaleString('en-IN')}:
          {' '}gross ₹{preview.grossAmount.toLocaleString('en-IN')}
          {preview.deductionAmount > 0 && <> − {g.deductionLabel} ₹{preview.deductionAmount.toLocaleString('en-IN')}</>}
          {' '}= <span className="font-semibold text-slate-900 dark:text-white">net ₹{preview.netAmount.toLocaleString('en-IN')}</span>
          {preview.capped && ' (capped)'}
        </div>
      </Section>
    </>
  )
}

// ── Salary components editor ─────────────────────────────
const CALC_LABELS: Record<ComponentCalc, string> = {
  fixed: 'Fixed ₹ / month',
  percent_of_basic: '% of basic',
  percent_of_gross: '% of gross',
  slab_on_gross: 'Slab on gross (₹)',
}

function SalaryComponentsEditor({ components, onChange, onUpdate }: {
  components: SalaryComponent[]
  onChange: (c: SalaryComponent[]) => void
  onUpdate: (id: string, p: Partial<SalaryComponent>) => void
}) {
  const block = (kind: ComponentKind) => (
    <Section
      title={kind === 'earning' ? 'Earnings (allowances)' : 'Deductions'}
      description={kind === 'earning'
        ? 'Basic pay is set per faculty. Add DA, HRA, CCA, special allowances… Each faculty can override any component.'
        : 'PF, ESI, professional tax slabs, TDS, society/loan recoveries…'}
      action={<button onClick={() => onChange([...components, emptyComponent(kind)])} className={chipBtn}><Plus className="w-3.5 h-3.5" /> Add {kind}</button>}
    >
      {components.filter(c => c.kind === kind).length === 0 && <p className="text-sm text-vriddhi-muted">None configured.</p>}
      {components.filter(c => c.kind === kind).map(c => (
        <div key={c.id} className={subCardCls}>
          <div className="flex flex-wrap items-center gap-2">
            <input placeholder="Name (e.g. House Rent Allowance)" value={c.name} onChange={e => onUpdate(c.id, { name: e.target.value })} className={`${inputCls} flex-1 min-w-[180px]`} />
            <input placeholder="Code" value={c.code ?? ''} onChange={e => onUpdate(c.id, { code: e.target.value.toUpperCase() })} className={`${inputCls} w-24 font-mono`} />
            <Toggle checked={c.enabled} onChange={v => onUpdate(c.id, { enabled: v })} label="Active" />
            <button onClick={() => onChange(components.filter(x => x.id !== c.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg" title="Remove"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Calculation">
              <select value={c.calc} onChange={e => onUpdate(c.id, { calc: e.target.value as ComponentCalc })} className={inputCls}>
                {(kind === 'earning' ? (['fixed', 'percent_of_basic'] as ComponentCalc[]) : (Object.keys(CALC_LABELS) as ComponentCalc[])).map(k => (
                  <option key={k} value={k}>{CALC_LABELS[k]}</option>
                ))}
              </select>
            </Field>
            {c.calc !== 'slab_on_gross' && (
              <Field label={c.calc === 'fixed' ? 'Amount (₹)' : 'Percent (%)'}><input type="number" value={c.value} onChange={e => onUpdate(c.id, { value: Number(e.target.value) })} className={inputCls} /></Field>
            )}
            <Field label="Monthly cap (₹)"><input type="number" placeholder="No cap" value={c.maxAmount ?? ''} onChange={e => onUpdate(c.id, { maxAmount: numOrUndef(e.target.value) })} className={inputCls} /></Field>
            <Field label="Applies to (blank = all)">
              <input placeholder="FULL_TIME, CONTRACT" value={(c.appliesTo ?? []).join(', ')} onChange={e => onUpdate(c.id, { appliesTo: e.target.value.split(',').map(x => x.trim().toUpperCase()).filter(Boolean) })} className={inputCls} />
            </Field>
          </div>
          {c.calc === 'slab_on_gross' && (
            <BracketEditor brackets={c.brackets ?? []} onChange={brackets => onUpdate(c.id, { brackets })} minLabel="Gross from ₹" maxLabel="Gross to ₹" valueLabel="Deduct ₹" />
          )}
          {(c.calc === 'fixed' || c.kind === 'earning') && (
            <Toggle checked={c.prorate} onChange={v => onUpdate(c.id, { prorate: v })} label="Reduce for loss-of-pay days" />
          )}
        </div>
      ))}
    </Section>
  )
  return <>{block('earning')}{block('deduction')}</>
}

function PayrollPreview({ draft }: { draft: FinanceRulesDoc }) {
  const [basic, setBasic] = useState(30000)
  const [lop, setLop] = useState(0)
  const month = new Date().toISOString().slice(0, 7)
  const r = computePayslip({ basic, monthKey: month, lopDays: lop, employmentType: 'FULL_TIME' }, draft.payroll)
  return (
    <Section title="Try it" description="Live payslip preview with the rules above.">
      <div className="grid grid-cols-2 gap-3 max-w-md">
        <Field label="Basic pay (₹)"><input type="number" value={basic} onChange={e => setBasic(Number(e.target.value))} className={inputCls} /></Field>
        <Field label="LOP days"><input type="number" value={lop} onChange={e => setLop(Number(e.target.value))} className={inputCls} /></Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-xl border border-vriddhi-border overflow-hidden">
          <p className="px-3 py-2 bg-green-500/10 text-green-700 dark:text-green-400 font-medium text-xs">Earnings</p>
          {r.earnings.map((l, i) => <div key={i} className="flex justify-between px-3 py-1.5 border-t border-vriddhi-border/60"><span>{l.label}</span><span>₹{formatINR(l.amount)}</span></div>)}
          <div className="flex justify-between px-3 py-2 border-t border-vriddhi-border font-semibold"><span>Gross</span><span>₹{formatINR(r.gross)}</span></div>
        </div>
        <div className="rounded-xl border border-vriddhi-border overflow-hidden">
          <p className="px-3 py-2 bg-red-500/10 text-red-700 dark:text-red-400 font-medium text-xs">Deductions</p>
          {r.deductions.length === 0 && <p className="px-3 py-1.5 text-vriddhi-muted">None</p>}
          {r.deductions.map((l, i) => <div key={i} className="flex justify-between px-3 py-1.5 border-t border-vriddhi-border/60"><span>{l.label}</span><span>₹{formatINR(l.amount)}</span></div>)}
          <div className="flex justify-between px-3 py-2 border-t border-vriddhi-border font-semibold"><span>Total</span><span>₹{formatINR(r.totalDeductions)}</span></div>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 rounded-xl bg-vriddhi-accent text-white">
        <span className="font-medium">Net pay ({r.paidDays}/{r.daysInPeriod} days)</span>
        <span className="text-lg font-bold">₹{formatINR(r.net)}</span>
      </div>
    </Section>
  )
}

// ── Certificate panel ────────────────────────────────────
function CertificateSettingsPanel({ draft, brand, patchCert }: {
  draft: FinanceRulesDoc
  brand: BrandingSettings
  patchCert: (p: Partial<FinanceRulesDoc['payroll']['certificate']>) => void
}) {
  const c = draft.payroll.certificate
  const sample = computePayslip({ basic: 40000, monthKey: new Date().toISOString().slice(0, 7), employmentType: 'FULL_TIME' }, draft.payroll)
  const vars: Record<string, string> = {
    name: 'Dr. Asha Kumar', staffCode: 'FAC-0042', designation: 'Assistant Professor', department: 'Commerce',
    employmentType: 'Full time', joiningDate: '01-06-2019', collegeName: brand.collegeName || 'Your College',
    collegeAddress: brand.address || '', basic: formatINR(40000), monthlyGross: formatINR(sample.gross),
    monthlyNet: formatINR(sample.net), monthlyDeductions: formatINR(sample.totalDeductions),
    annualGross: formatINR(sample.gross * 12), annualNet: formatINR(sample.net * 12),
    monthlyGrossWords: amountInWords(sample.gross), annualGrossWords: amountInWords(sample.gross * 12),
    purpose: c.defaultPurpose || 'bank loan', date: new Date().toLocaleDateString('en-IN'),
    certificateNo: `${c.certificatePrefix || 'SC'}/${new Date().getFullYear()}/0001`, pan: 'ABCDE1234F',
    bankName: 'State Bank of India', accountNo: 'XXXX1234', salaryMonth: 'this month',
    pronoun: 'She', possessive: 'Her', salutation: 'Ms.',
  }
  const insert = (key: string) => patchCert({ bodyTemplate: `${c.bodyTemplate}{{${key}}}` })
  return (
    <>
      <Section title="Certificate wording" description="Use {{placeholders}} — they are filled from the faculty profile and salary structure when a certificate is issued.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Title"><input value={c.title} onChange={e => patchCert({ title: e.target.value })} className={inputCls} /></Field>
          <Field label="Certificate number prefix"><input value={c.certificatePrefix} onChange={e => patchCert({ certificatePrefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} /></Field>
          <Field label="Default purpose"><input value={c.defaultPurpose} onChange={e => patchCert({ defaultPurpose: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Body">
          <textarea rows={9} value={c.bodyTemplate} onChange={e => patchCert({ bodyTemplate: e.target.value })} className={`${inputCls} font-mono text-xs leading-relaxed`} />
        </Field>
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATE_PLACEHOLDERS.map(p => (
            <button key={p} onClick={() => insert(p)} className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-vriddhi-border text-vriddhi-muted hover:text-vriddhi-accent hover:border-vriddhi-accent transition-colors">
              {`{{${p}}}`}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Signatory name"><input value={c.signatoryName} onChange={e => patchCert({ signatoryName: e.target.value })} className={inputCls} placeholder="Defaults to the receipt signatory" /></Field>
          <Field label="Signatory designation"><input value={c.signatoryDesignation} onChange={e => patchCert({ signatoryDesignation: e.target.value })} className={inputCls} /></Field>
        </div>
        <Toggle checked={c.includeBreakdown} onChange={v => patchCert({ includeBreakdown: v })} label="Include the monthly earnings/deductions table" />
      </Section>

      <Section title="Preview" description="Sample data; the real certificate uses the selected faculty member.">
        <div className="rounded-xl border border-vriddhi-border bg-white dark:bg-slate-950 p-6 text-slate-800 dark:text-slate-200 text-sm">
          <p className="text-center font-bold">{brand.collegeName || 'Your College'}</p>
          {brand.address && <p className="text-center text-[11px] text-slate-500">{brand.address}</p>}
          <div className="h-0.5 bg-teal-500 my-3" />
          <p className="text-center font-bold tracking-wide">{c.title}</p>
          <div className="flex justify-between text-[11px] text-slate-500 my-3"><span>Ref: {vars.certificateNo}</span><span>Date: {vars.date}</span></div>
          {renderTemplate(c.bodyTemplate, vars).split(/\n\s*\n/).map((para, i) => <p key={i} className="mb-3 text-justify leading-relaxed">{para}</p>)}
          {c.includeBreakdown && (
            <div className="text-xs border-t border-slate-200 dark:border-slate-800 pt-2 mt-2 max-w-sm">
              {sample.earnings.map((l, i) => <div key={i} className="flex justify-between"><span>{l.label}</span><span>Rs. {formatINR(l.amount)}</span></div>)}
              <div className="flex justify-between font-semibold"><span>Gross salary</span><span>Rs. {formatINR(sample.gross)}</span></div>
              {sample.deductions.map((l, i) => <div key={i} className="flex justify-between"><span>Less: {l.label}</span><span>Rs. {formatINR(l.amount)}</span></div>)}
              <div className="flex justify-between font-semibold"><span>Net salary</span><span>Rs. {formatINR(sample.net)}</span></div>
            </div>
          )}
          <div className="text-right mt-8"><p className="font-semibold">{c.signatoryName || brand.signatoryName || 'Authorised Signatory'}</p><p className="text-[11px] text-slate-500">{c.signatoryDesignation}</p></div>
        </div>
      </Section>
    </>
  )
}

// ── Bracket editor ───────────────────────────────────────
function BracketEditor({ brackets, onChange, minLabel = 'Min', maxLabel = 'Max (blank = ∞)', valueLabel = 'Value' }: {
  brackets: Bracket[]
  onChange: (b: Bracket[]) => void
  minLabel?: string
  maxLabel?: string
  valueLabel?: string
}) {
  const set = (idx: number, p: Partial<Bracket>) => onChange(brackets.map((b, i) => (i === idx ? { ...b, ...p } : b)))
  return (
    <div className="space-y-2">
      {brackets.length > 0 && (
        <div className="grid grid-cols-12 gap-2 text-[11px] text-vriddhi-muted px-1">
          <span className="col-span-3">{minLabel}</span><span className="col-span-3">{maxLabel}</span><span className="col-span-4">{valueLabel}</span>
        </div>
      )}
      {brackets.map((b, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <input type="number" value={b.min} onChange={e => set(idx, { min: Number(e.target.value) })} className={`${inputCls} col-span-3`} />
          <input type="number" placeholder="∞" value={b.max ?? ''} onChange={e => set(idx, { max: numOrUndef(e.target.value) })} className={`${inputCls} col-span-3`} />
          <input type="number" value={b.value} onChange={e => set(idx, { value: Number(e.target.value) })} className={`${inputCls} col-span-4`} />
          <button onClick={() => onChange(brackets.filter((_, i) => i !== idx))} className="col-span-2 p-2 text-red-500 hover:bg-red-500/10 rounded-lg justify-self-start"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => onChange([...brackets, { min: 0, value: 0 }])} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-vriddhi-border/40 text-vriddhi-muted hover:bg-vriddhi-border/70">
        <Plus className="w-3.5 h-3.5" /> Add bracket
      </button>
    </div>
  )
}
