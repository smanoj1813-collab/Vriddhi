import { useState } from 'react'
import {
  Receipt, Search, Filter, RefreshCw, Download, CheckCircle, Clock, AlertTriangle, XCircle,
  FileText, IndianRupee, Building2, CreditCard, Eye, Check, X, Loader2, Plus, Upload,
  Landmark, GraduationCap, BookOpen
} from 'lucide-react'
import { useChallanData } from '../hooks/useChallanData'
import { useFeeData } from '../hooks/useFeeData'
import type { Challan, ChallanStatus, ChallanType, CreateChallanInput } from '../api/feeApi'
import { useNotification } from '@/shared/providers/NotificationProvider'

const STATUS_CONFIG: Record<ChallanStatus, { label: string; color: string; bg: string; icon: any }> = {
  generated: { label: 'Generated', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  paid_at_bank: { label: 'Paid at Bank', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Building2 },
  verified: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
  expired: { label: 'Expired', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: AlertTriangle },
}

const TYPE_CONFIG: Record<ChallanType, { label: string; color: string }> = {
  university_exam: { label: 'University Exam', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  eligibility: { label: 'Eligibility', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  revaluation: { label: 'Revaluation', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  marks_card: { label: 'Marks Card', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  other: { label: 'Other', color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

function ChallanDetailModal({ challan, onClose, onVerify, onReject }: {
  challan: Challan
  onClose: () => void
  onVerify: (bankRef: string, remarks?: string) => Promise<boolean>
  onReject: (reason: string) => Promise<boolean>
}) {
  const [bankRef, setBankRef] = useState('')
  const [remarks, setRemarks] = useState('')
  const [action, setAction] = useState<'view' | 'verify' | 'reject'>('view')
  const [processing, setProcessing] = useState(false)
  const status = STATUS_CONFIG[challan.status]

  const handleVerify = async () => {
    if (!bankRef.trim()) return
    setProcessing(true)
    const success = await onVerify(bankRef.trim(), remarks.trim() || undefined)
    setProcessing(false)
    if (success) onClose()
  }

  const handleReject = async () => {
    if (!remarks.trim()) return
    setProcessing(true)
    const success = await onReject(remarks.trim())
    setProcessing(false)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#131b2e] z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Challan {challan.challanNo}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className={`p-4 rounded-xl border ${status.bg} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <status.icon className={`w-6 h-6 ${status.color}`} />
              <div>
                <p className={`font-bold ${status.color}`}>{status.label}</p>
                <p className="text-xs text-slate-600">Generated {new Date(challan.generatedAt).toLocaleDateString('en-IN')} • Due {challan.dueDate}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${TYPE_CONFIG[challan.type].color}`}>
              {TYPE_CONFIG[challan.type].label}
            </span>
          </div>

          {/* Student */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-slate-500">Student</p>
              <p className="font-bold text-sm mt-1">{challan.studentName}</p>
              <p className="text-xs text-slate-500 font-mono">{challan.regNo} {challan.usn && `• ${challan.usn}`}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-slate-500">Course & Sem</p>
              <p className="font-bold text-sm mt-1">{challan.course} • Sem {challan.semester}</p>
              <p className="text-xs text-slate-500">{challan.batch}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-slate-500">Exam</p>
              <p className="font-bold text-sm mt-1">{challan.examTitle || challan.type}</p>
              <p className="text-xs text-slate-500">{challan.examType} • {challan.university}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl">
              <p className="text-[10px] uppercase font-bold text-slate-500">College</p>
              <p className="font-bold text-sm mt-1">{challan.collegeCode}</p>
              <p className="text-xs text-slate-500">{challan.collegeName}</p>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Amount Breakdown</p>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {challan.breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between p-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-sm">{item.label}</span>
                  <span className="font-bold text-sm">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900/60 font-black">
                <span>Total</span>
                <span>₹{challan.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2">
              <Landmark size={12} /> University Bank Account (Pay at Bank)
            </p>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-bold">{challan.bankDetails.bankName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Account Name</span><span className="font-bold">{challan.bankDetails.accountName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Account No</span><span className="font-mono font-bold">{challan.bankDetails.accountNo}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">IFSC</span><span className="font-mono font-bold">{challan.bankDetails.ifsc}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-bold">{challan.bankDetails.branch}</span></div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Student must pay at bank, get stamp, and upload stamped challan. Admin verifies with bank reference number.</p>
          </div>

          {/* Subjects */}
          {challan.subjects && challan.subjects.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {challan.subjects.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold">
                    {s.code} - {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification */}
          {challan.status === 'verified' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-xs font-bold text-emerald-700">Verified</p>
              <p className="text-sm mt-1">Bank Ref: <span className="font-mono font-bold">{challan.bankReferenceNo}</span></p>
              <p className="text-xs text-slate-500 mt-1">Verified at {challan.verifiedAt ? new Date(challan.verifiedAt).toLocaleString('en-IN') : ''} by {challan.verifiedBy}</p>
            </div>
          )}

          {/* Actions */}
          {action === 'view' && challan.status !== 'verified' && challan.status !== 'rejected' && (
            <div className="flex gap-3">
              <button onClick={() => setAction('verify')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Verify Payment
              </button>
              <button onClick={() => setAction('reject')} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">
                Reject
              </button>
            </div>
          )}

          {action === 'verify' && (
            <div className="space-y-4 p-4 border border-emerald-200 dark:border-emerald-800 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10">
              <h4 className="font-bold text-sm">Verify Bank Payment</h4>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Bank Reference No *</label>
                <input value={bankRef} onChange={e => setBankRef(e.target.value)} placeholder="e.g. SBIN1234567890" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Remarks (optional)</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Verified at bank counter, stamp OK" className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAction('view')} className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={() => void handleVerify()} disabled={!bankRef.trim() || processing} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Verify & Mark Paid
                </button>
              </div>
            </div>
          )}

          {action === 'reject' && (
            <div className="space-y-4 p-4 border border-rose-200 dark:border-rose-800 rounded-xl bg-rose-50/50 dark:bg-rose-950/10">
              <h4 className="font-bold text-sm">Reject Challan</h4>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Reason *</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder="Reason for rejection..." className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAction('view')} className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={() => void handleReject()} disabled={!remarks.trim() || processing} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                  {processing ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GenerateChallanModal({ onClose, onGenerate, students }: {
  onClose: () => void
  onGenerate: (inputs: CreateChallanInput[]) => Promise<{ created: number; failed: number; errors: string[] }>
  students: Array<{ id: string; name: string; regNo: string; course: string; batch: string; semester?: string }>
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [type, setType] = useState<ChallanType>('university_exam')
  const [amount, setAmount] = useState('1500')
  const [examTitle, setExamTitle] = useState('BCA 3rd Sem Regular - SEP 2024')
  const [semester, setSemester] = useState('3')
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [university, setUniversity] = useState<'BCU' | 'BNU' | 'Davangere' | 'Rani Channamma'>('BCU')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null)

  const toggleStudent = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleGenerate = async () => {
    const amt = Number(amount)
    if (!amt || selectedIds.length === 0) return
    setProcessing(true)
    const inputs: CreateChallanInput[] = selectedIds.map(id => {
      const s = students.find(x => x.id === id)!
      return {
        type,
        studentId: s.id,
        studentName: s.name,
        regNo: s.regNo,
        course: s.course,
        batch: s.batch,
        semester: s.semester || semester,
        examTitle,
        examType: 'regular',
        amount: amt,
        breakdown: [
          { label: 'Examination Fee', amount: amt - 200 },
          { label: 'Marks Card Fee', amount: 150 },
          { label: 'Processing Fee', amount: 50 },
        ],
        dueDate,
        university,
      }
    })
    const res = await onGenerate(inputs)
    setResult(res)
    setProcessing(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600" /> Generate Challans - University Exam Fee
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {result ? (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result.failed === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">Generated {result.created} Challans</h3>
              <p className="text-sm text-slate-500 mt-1">{result.failed} failed</p>
              {result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs">
                  {result.errors.slice(0, 5).map((e, i) => <p key={i} className="text-rose-700">{e}</p>)}
                </div>
              )}
              <button onClick={onClose} className="mt-6 px-6 py-2.5 bg-teal-600 text-white rounded-xl font-bold text-sm">Done</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as ChallanType)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                    <option value="university_exam">University Exam</option>
                    <option value="eligibility">Eligibility</option>
                    <option value="revaluation">Revaluation</option>
                    <option value="marks_card">Marks Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">University</label>
                  <select value={university} onChange={e => setUniversity(e.target.value as any)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                    <option value="BCU">BCU - Bangalore City University</option>
                    <option value="BNU">BNU - Bengaluru North</option>
                    <option value="Davangere">Davangere University</option>
                    <option value="Rani Channamma">Rani Channamma University</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Exam Title</label>
                  <input value={examTitle} onChange={e => setExamTitle(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Amount (₹)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Semester</label>
                  <input value={semester} onChange={e => setSemester(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Students ({selectedIds.length}/{students.length})</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIds(students.map(s => s.id))} className="text-xs px-2 py-1 bg-teal-50 text-teal-700 rounded-full font-bold">Select All</button>
                    <button onClick={() => setSelectedIds([])} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full font-bold">Clear</button>
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-[240px] overflow-y-auto">
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleStudent(s.id)} className="w-4 h-4 rounded border-slate-300 text-teal-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{s.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{s.regNo} • {s.course} • Sem {s.semester || semester}</p>
                      </div>
                    </label>
                  ))}
                  {students.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No students found. Import students first.</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {!result && (
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">Cancel</button>
            <button onClick={() => void handleGenerate()} disabled={processing || selectedIds.length === 0 || !amount} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {processing ? <Loader2 size={16} className="animate-spin" /> : <Receipt size={16} />} Generate {selectedIds.length} Challans
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChallanManagement() {
  const { challans, loading, error, filters, summary, updateFilters, refresh, createBulkChallans, verifyChallan, rejectChallan } = useChallanData()
  const { students } = useFeeData()
  const { showSuccess, showError } = useNotification()
  const [selected, setSelected] = useState<Challan | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)

  const handleVerify = async (bankRef: string, remarks?: string) => {
    if (!selected) return false
    const success = await verifyChallan(selected.id, bankRef, remarks)
    if (success) showSuccess(`Challan ${selected.challanNo} verified - Bank Ref ${bankRef}`)
    else showError('Verification failed')
    return success
  }

  const handleReject = async (reason: string) => {
    if (!selected) return false
    const success = await rejectChallan(selected.id, reason)
    if (success) showSuccess(`Challan ${selected.challanNo} rejected`)
    else showError('Reject failed')
    return success
  }

  const handleBulkGenerate = async (inputs: CreateChallanInput[]) => {
    const result = await createBulkChallans(inputs)
    if (result.created > 0) showSuccess(`${result.created} challans generated`)
    if (result.failed > 0) showError(`${result.failed} failed: ${result.errors.slice(0, 2).join(', ')}`)
    return result
  }

  const exportCSV = () => {
    const header = ['Challan No', 'Student', 'Reg No', 'Course', 'Semester', 'Type', 'Amount', 'Status', 'Due Date', 'Bank Ref', 'Exam Title']
    const rows = challans.map(c => [c.challanNo, c.studentName, c.regNo, c.course, c.semester, c.type, c.amount, c.status, c.dueDate, c.bankReferenceNo || '', c.examTitle || ''])
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `challans-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900/60 dark:bg-rose-950/30">
          <p className="font-bold text-rose-800 dark:text-rose-200">Challans could not be loaded</p>
          <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="text-teal-600" /> Challan Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">BCU/BNU university exam fee challans - Bank payment slips (3 copies: Bank, University, Student)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refresh()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} disabled={challans.length === 0} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowGenerate(true)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
            <Plus size={16} /> Generate Challans
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-slate-500">Total Challans</p>
          <p className="text-2xl font-black mt-1">{summary.total}</p>
          <p className="text-xs text-slate-500 mt-1">₹{summary.totalAmount.toLocaleString('en-IN')} total</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-amber-700">Generated</p>
          <p className="text-2xl font-black mt-1 text-amber-700">{summary.generated}</p>
          <p className="text-xs text-amber-600 mt-1">Awaiting bank payment</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-blue-700">Paid at Bank</p>
          <p className="text-2xl font-black mt-1 text-blue-700">{summary.paidAtBank}</p>
          <p className="text-xs text-blue-600 mt-1">Needs verification</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-emerald-700">Verified</p>
          <p className="text-2xl font-black mt-1 text-emerald-700">{summary.verified}</p>
          <p className="text-xs text-emerald-600 mt-1">₹{summary.verifiedAmount.toLocaleString('en-IN')} collected</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-slate-500">Pending Amount</p>
          <p className="text-2xl font-black mt-1">₹{summary.pendingAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.generated + summary.paidAtBank} pending</p>
        </div>
      </div>

      {/* Info Banner - How Challan Works */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Landmark size={20} /> How University Exam Fee Challan Works (BCU/BNU Pattern)
        </h3>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <p className="font-bold flex items-center gap-2"><FileText size={16} /> 1. Generate Challan</p>
            <p className="text-sm text-blue-100 mt-1">Admin generates challan with challanNo CH-YYYY-COURSE-xxxxxx, student details, amount breakdown (exam fee + marks card + processing), university bank account (SBI BCU Campus Branch). 3 copies: Bank, University, Student.</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <p className="font-bold flex items-center gap-2"><Building2 size={16} /> 2. Pay at Bank</p>
            <p className="text-sm text-blue-100 mt-1">Student downloads challan PDF, goes to SBI bank, pays amount, bank stamps all 3 copies, gives student copy + bank reference number. Student uploads stamped copy or enters bank ref.</p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-4">
            <p className="font-bold flex items-center gap-2"><CheckCircle size={16} /> 3. Verify & Mark Paid</p>
            <p className="text-sm text-blue-100 mt-1">Admin verifies bank reference, marks challan verified, auto-creates feePayment as paid with receiptNo RCP-CH-..., transactionId TXN-CH-..., student can download official receipt. Eligible for hall ticket.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={filters.search} onChange={e => updateFilters({ search: e.target.value })} placeholder="Search challanNo, student, regNo, exam..." className="bg-transparent text-sm focus:outline-none w-full" />
        </div>
        <select value={filters.status} onChange={e => updateFilters({ status: e.target.value as any })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
          <option value="all">All Status</option>
          <option value="generated">Generated</option>
          <option value="paid_at_bank">Paid at Bank</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filters.type} onChange={e => updateFilters({ type: e.target.value as any })} className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
          <option value="all">All Types</option>
          <option value="university_exam">University Exam</option>
          <option value="eligibility">Eligibility</option>
          <option value="revaluation">Revaluation</option>
          <option value="marks_card">Marks Card</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Challan No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Course • Sem</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {challans.map(challan => {
                  const status = STATUS_CONFIG[challan.status]
                  const StatusIcon = status.icon
                  return (
                    <tr key={challan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-bold text-xs">{challan.challanNo}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-sm">{challan.studentName}</p>
                        <p className="text-xs text-slate-500 font-mono">{challan.regNo}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-xs">{challan.course}</p>
                        <p className="text-xs text-slate-500">Sem {challan.semester} • {challan.batch}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${TYPE_CONFIG[challan.type].color}`}>
                          {TYPE_CONFIG[challan.type].label}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 truncate max-w-[150px]">{challan.examTitle}</p>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">₹{challan.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" /> {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">{challan.dueDate}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => setSelected(challan)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {challans.length === 0 && (
              <div className="p-12 text-center">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-600">No challans found</p>
                <p className="text-sm text-slate-500 mt-1">Generate challans for university exam fees. Students pay at bank, admin verifies.</p>
                <button onClick={() => setShowGenerate(true)} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">Generate Challans</button>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && (
        <ChallanDetailModal challan={selected} onClose={() => setSelected(null)} onVerify={handleVerify} onReject={handleReject} />
      )}

      {showGenerate && (
        <GenerateChallanModal
          onClose={() => setShowGenerate(false)}
          onGenerate={handleBulkGenerate}
          students={students.map(s => ({ id: s.id, name: s.name, regNo: s.regNo, course: s.course, batch: s.batch }))}
        />
      )}
    </div>
  )
}
