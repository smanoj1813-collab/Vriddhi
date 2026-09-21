import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react'
import { useStudentProfile } from '../hooks/useStudentProfile'
import {
  Receipt, Download, Building2, CheckCircle, Clock, AlertTriangle, XCircle,
  Landmark, FileText, IndianRupee, Eye, Upload, Loader2, Printer, X
} from 'lucide-react'
import { useChallanData } from '@/modules/admin/hooks/useChallanData'
import type { Challan, ChallanStatus } from '@/modules/admin/api/feeApi'

const STATUS_CONFIG: Record<ChallanStatus, { label: string; color: string; bg: string; icon: any }> = {
  generated: { label: 'Generated - Pay at Bank', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  paid_at_bank: { label: 'Paid at Bank - Verification Pending', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Building2 },
  verified: { label: 'Verified - Payment Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
  expired: { label: 'Expired', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: AlertTriangle },
}

function ChallanPrintModal({ challan, onClose }: { challan: Challan; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-[#131b2e] z-10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" /> Challan - {challan.challanNo}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <Printer className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 print:p-0">
          {/* 3 Copies Header */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 border-2 border-dashed border-slate-300 rounded-xl">
              <p className="font-black text-xs">BANK COPY</p>
              <p className="text-[10px] text-slate-500">To be retained by Bank</p>
            </div>
            <div className="p-2 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50">
              <p className="font-black text-xs text-blue-700">UNIVERSITY COPY</p>
              <p className="text-[10px] text-slate-500">To be sent to University</p>
            </div>
            <div className="p-2 border-2 border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
              <p className="font-black text-xs text-emerald-700">STUDENT COPY</p>
              <p className="text-[10px] text-slate-500">To be retained by Student</p>
            </div>
          </div>

          {/* University Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-black">{challan.university} - {challan.university === 'BCU' ? 'Bangalore City University' : challan.university}</h1>
            <p className="text-sm font-bold mt-1">University Examination Fee Challan</p>
            <p className="text-xs text-slate-600 mt-1">{challan.examTitle} • {challan.examType?.toUpperCase()} • Academic Year {challan.batch}</p>
          </div>

          {/* Challan No and Date */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Challan Number</p>
              <p className="font-mono font-black text-lg">{challan.challanNo}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Date</p>
              <p className="font-bold">{new Date(challan.generatedAt).toLocaleDateString('en-IN')}</p>
              <p className="text-xs text-slate-500">Due: {challan.dueDate}</p>
            </div>
          </div>

          {/* Student Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Student Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">Name</span><span className="font-bold">{challan.studentName}</span></div>
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">Reg No / USN</span><span className="font-mono font-bold">{challan.regNo} {challan.usn && `/ ${challan.usn}`}</span></div>
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">Course</span><span className="font-bold">{challan.course}</span></div>
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">Semester</span><span className="font-bold">{challan.semester}</span></div>
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">Batch</span><span className="font-bold">{challan.batch}</span></div>
              <div className="flex justify-between p-2 border-b border-slate-100"><span className="text-slate-500">College Code</span><span className="font-bold">{challan.collegeCode}</span></div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Fee Breakdown</p>
            <div className="border border-slate-900 rounded-xl overflow-hidden">
              {challan.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between p-3 border-b border-slate-200 last:border-0 text-sm">
                  <span>{b.label}</span>
                  <span className="font-bold">₹{b.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-slate-900 text-white font-black">
                <span>Total Amount</span>
                <span>₹{challan.amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 bg-amber-50 text-xs">
                <p className="font-bold">Amount in Words: {numberToWords(challan.amount)} Rupees Only</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-2"><Landmark size={12} /> Pay to University Bank Account</p>
            <div className="p-4 border-2 border-blue-600 rounded-xl bg-blue-50/30 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Bank Name</span><span className="font-black">{challan.bankDetails.bankName}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Account Name</span><span className="font-bold">{challan.bankDetails.accountName}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Account Number</span><span className="font-mono font-black text-lg">{challan.bankDetails.accountNo}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">IFSC Code</span><span className="font-mono font-bold">{challan.bankDetails.ifsc}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Branch</span><span className="font-bold">{challan.bankDetails.branch}</span></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
            <p className="font-bold">Instructions:</p>
            <p>1. Take print of this challan (3 copies).</p>
            <p>2. Go to {challan.bankDetails.bankName}, {challan.bankDetails.branch} and pay ₹{challan.amount}.</p>
            <p>3. Bank will stamp all 3 copies and retain Bank Copy.</p>
            <p>4. Submit University Copy to college office.</p>
            <p>5. Keep Student Copy for your records and upload stamped copy in portal for verification.</p>
            <p>6. Last date to pay: {challan.dueDate}. Late fee applicable after due date.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 pt-2 mt-16">Student Signature</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 mt-16">Bank Seal & Signature<br /><span className="text-[10px] text-slate-500">With Bank Reference No</span></div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-2 mt-16">College Seal & Signature</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 pt-4 border-t">
            This is a computer generated challan. No signature required for generation. Bank stamp mandatory for validity. Challan No: {challan.challanNo} • Generated: {new Date(challan.generatedAt).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  )
}

function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  if (num === 0) return 'Zero'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '')
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '')
  return String(num)
}

export default function StudentChallans() {
  const { user } = useAuth()
  const { profile } = useStudentProfile(user?.uid)
  const studentId = profile?.id || user?.uid || ''
  const { challans, loading, summary, refresh } = useChallanData(studentId)
  const [selected, setSelected] = useState<Challan | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="text-teal-600" /> My Challans
          </h1>
          <p className="text-sm text-slate-500 mt-1">University exam fee challans - Pay at bank, get stamped, upload for verification</p>
        </div>
        <button onClick={() => refresh()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 self-start">
          <FileText size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-slate-500">Total Challans</p>
          <p className="text-2xl font-black mt-1">{summary.total}</p>
          <p className="text-xs text-slate-500 mt-1">₹{summary.totalAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-amber-700">To Pay</p>
          <p className="text-2xl font-black mt-1 text-amber-700">{summary.generated}</p>
          <p className="text-xs text-amber-600 mt-1">Pay at bank before due</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-blue-700">Paid - Verifying</p>
          <p className="text-2xl font-black mt-1 text-blue-700">{summary.paidAtBank}</p>
          <p className="text-xs text-blue-600 mt-1">Admin verification pending</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
          <p className="text-xs uppercase font-bold text-emerald-700">Verified</p>
          <p className="text-2xl font-black mt-1 text-emerald-700">{summary.verified}</p>
          <p className="text-xs text-emerald-600 mt-1">Payment confirmed</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h3 className="font-bold flex items-center gap-2"><Landmark size={18} /> How to Pay University Exam Fee via Challan (BCU Pattern)</h3>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white/15 rounded-xl p-4">
            <p className="font-bold">1. Download Challan</p>
            <p className="text-sm text-blue-100 mt-1">Click Download, print 3 copies. Challan has bank account details, amount, your details.</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <p className="font-bold">2. Pay at SBI Bank</p>
            <p className="text-sm text-blue-100 mt-1">Go to SBI BCU Campus Branch, pay cash, bank stamps all 3 copies, gives you student copy + bank reference number.</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4">
            <p className="font-bold">3. Upload & Verify</p>
            <p className="text-sm text-blue-100 mt-1">Upload stamped copy or enter bank ref. College verifies, marks fee as paid, you become eligible for hall ticket.</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold">No challans yet</p>
            <p className="text-sm text-slate-500 mt-1">When college generates university exam fee challan for your semester, it will appear here. Contact finance office if due date near.</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {challans.map(challan => {
              const status = STATUS_CONFIG[challan.status]
              const StatusIcon = status.icon
              return (
                <div key={challan.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-bold text-sm">{challan.challanNo}</p>
                        <p className="font-bold mt-1">{challan.examTitle || challan.type} • {challan.course} Sem {challan.semester}</p>
                        <p className="text-xs text-slate-500 mt-1">Due {challan.dueDate} • ₹{challan.amount.toLocaleString('en-IN')} • {challan.university}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" /> {status.label}
                      </span>
                    </div>
                    {challan.status === 'verified' && challan.bankReferenceNo && (
                      <p className="text-xs mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                        Verified • Bank Ref: <span className="font-mono font-bold">{challan.bankReferenceNo}</span> • Receipt generated
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 self-start md:self-center">
                    <button onClick={() => setSelected(challan)} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                      <Download size={14} /> Download Challan
                    </button>
                    <button onClick={() => setSelected(challan)} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && <ChallanPrintModal challan={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
