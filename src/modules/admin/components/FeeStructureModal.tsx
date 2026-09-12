import { useState } from 'react'
import { BookOpen, Check, Loader2, X } from 'lucide-react'
import type { FeeCategory, FeeStructure } from '../api/feeApi'

const CATEGORIES: FeeCategory[] = ['tuition', 'exam', 'library', 'lab', 'hostel', 'transport', 'misc']
const EMPTY: Omit<FeeStructure, 'id'> = {
  name: '', category: 'tuition', amount: 0, course: '', batch: '', dueDate: new Date().toISOString().slice(0, 10),
  academicYear: new Date().getFullYear().toString(), semester: '', description: '', lateFeePerDay: 0,
}

export default function FeeStructureModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (input: Omit<FeeStructure, 'id'>) => Promise<boolean>
}) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm(current => ({ ...current, [key]: value }))

  const submit = async () => {
    if (!form.name.trim() || form.amount <= 0 || !form.dueDate) return
    setSaving(true)
    const success = await onSubmit({ ...form, name: form.name.trim(), description: form.description?.trim() || undefined })
    setSaving(false)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-vriddhi-border p-5">
          <div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><BookOpen className="h-5 w-5 text-teal-600" />New fee template</h2><p className="mt-0.5 text-xs text-vriddhi-muted">Save a reusable fee definition for future invoices.</p></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-vriddhi-card-muted" aria-label="Close"><X className="h-4 w-4 text-vriddhi-muted" /></button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Template name</label><input value={form.name} onChange={event => update('name', event.target.value)} placeholder="e.g. BCom Semester 1 Tuition" className="input-field" autoFocus /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Category</label><select value={form.category} onChange={event => update('category', event.target.value as FeeCategory)} className="input-field">{CATEGORIES.map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Amount (₹)</label><input type="number" min="1" value={form.amount || ''} onChange={event => update('amount', Number(event.target.value) || 0)} className="input-field" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Course</label><input value={form.course} onChange={event => update('course', event.target.value)} placeholder="e.g. BCom" className="input-field" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Batch</label><input value={form.batch} onChange={event => update('batch', event.target.value)} placeholder="e.g. 2026" className="input-field" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Due date</label><input type="date" value={form.dueDate} onChange={event => update('dueDate', event.target.value)} className="input-field" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Semester</label><input value={form.semester} onChange={event => update('semester', event.target.value)} placeholder="e.g. 1" className="input-field" /></div>
          <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Late fee / day (₹)</label><input type="number" min="0" value={form.lateFeePerDay || ''} onChange={event => update('lateFeePerDay', Number(event.target.value) || 0)} className="input-field" /></div>
          <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Description</label><textarea value={form.description} onChange={event => update('description', event.target.value)} rows={2} className="input-field resize-none" placeholder="What does this fee cover?" /></div>
        </div>
        <div className="flex gap-3 border-t border-vriddhi-border p-5"><button onClick={onClose} className="btn-secondary flex-1">Cancel</button><button onClick={() => void submit()} disabled={saving || !form.name.trim() || form.amount <= 0} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? 'Saving…' : 'Save template'}</button></div>
      </div>
    </div>
  )
}
