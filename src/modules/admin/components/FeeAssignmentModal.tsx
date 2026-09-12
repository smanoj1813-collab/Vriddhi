import { useEffect, useMemo, useState } from 'react'
import { Calendar, Check, Loader2, X } from 'lucide-react'
import type { CreateFeePaymentInput, FeeCategory, FeeStudent, FeeStructure } from '../api/feeApi'

const CATEGORIES: FeeCategory[] = ['tuition', 'exam', 'library', 'lab', 'hostel', 'transport', 'misc']

export default function FeeAssignmentModal({
  students,
  structures,
  onClose,
  onSubmit,
}: {
  students: FeeStudent[]
  structures: FeeStructure[]
  onClose: () => void
  onSubmit: (input: CreateFeePaymentInput) => Promise<boolean>
}) {
  const [studentId, setStudentId] = useState(students[0]?.id || '')
  const [structureId, setStructureId] = useState('')
  const [category, setCategory] = useState<FeeCategory>('tuition')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const student = useMemo(() => students.find(item => item.id === studentId), [studentId, students])

  useEffect(() => {
    if (!studentId && students[0]) setStudentId(students[0].id)
  }, [studentId, students])

  useEffect(() => {
    const structure = structures.find(item => item.id === structureId)
    if (!structure) return
    setCategory(structure.category)
    setAmount(String(structure.amount))
    setDueDate(structure.dueDate || new Date().toISOString().slice(0, 10))
    setRemarks(structure.description || '')
  }, [structureId, structures])

  const submit = async () => {
    const numericAmount = Number(amount)
    if (!student || !Number.isFinite(numericAmount) || numericAmount <= 0 || !dueDate) return
    setSaving(true)
    const success = await onSubmit({
      studentId: student.id,
      studentName: student.name,
      regNo: student.regNo,
      course: student.course,
      batch: student.batch,
      structureId: structureId || undefined,
      category,
      amount: numericAmount,
      dueDate,
      remarks: remarks.trim() || undefined,
    })
    setSaving(false)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-vriddhi-border p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assign a fee</h2>
            <p className="mt-0.5 text-xs text-vriddhi-muted">Create a trackable invoice in the college ledger.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-vriddhi-card-muted" aria-label="Close">
            <X className="h-4 w-4 text-vriddhi-muted" />
          </button>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center text-sm text-vriddhi-muted">
            No students were found for this college. Import students before assigning fees.
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Student</label>
              <select value={studentId} onChange={event => setStudentId(event.target.value)} className="input-field">
                {students.map(item => <option key={item.id} value={item.id}>{item.name} · {item.regNo || 'No registration number'}</option>)}
              </select>
              {student && <p className="mt-1 text-xs text-vriddhi-muted">{student.course || 'Course not set'} · {student.batch || 'Batch not set'}</p>}
            </div>

            {structures.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Use saved template (optional)</label>
                <select value={structureId} onChange={event => setStructureId(event.target.value)} className="input-field">
                  <option value="">Manual invoice</option>
                  {structures.map(item => <option key={item.id} value={item.id}>{item.name} · ₹{item.amount.toLocaleString('en-IN')}</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Category</label>
                <select value={category} onChange={event => setCategory(event.target.value as FeeCategory)} className="input-field">
                  {CATEGORIES.map(item => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Amount (₹)</label>
                <input value={amount} onChange={event => setAmount(event.target.value)} type="number" min="1" step="0.01" placeholder="0" className="input-field" autoFocus />
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-vriddhi-muted"><Calendar className="h-3.5 w-3.5" /> Due date</label>
              <input value={dueDate} onChange={event => setDueDate(event.target.value)} type="date" className="input-field" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vriddhi-muted">Reference / remarks</label>
              <textarea value={remarks} onChange={event => setRemarks(event.target.value)} rows={3} placeholder="e.g. Semester 1 tuition fee" className="input-field resize-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3 border-t border-vriddhi-border p-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          {students.length > 0 && (
            <button onClick={() => void submit()} disabled={saving || !student || !amount || Number(amount) <= 0} className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Create invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
