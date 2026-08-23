import { useAuth } from '@/hooks/useAuth';
import React, { useState, useMemo } from 'react'
import { useStudentProfile } from '../hooks/useStudentProfile';
import {
  DollarSign, CreditCard, CheckCircle, Clock, AlertTriangle,
  Download, Receipt, Calendar, ChevronDown, ChevronUp, Wallet,
  ArrowUpRight, ArrowDownRight, Loader2, GraduationCap, BookOpen,
  Activity, X, Printer, FileText, TrendingUp, Shield, Info,
  IndianRupee, Beaker, Library, RefreshCw
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { useFeeData, FeePayment, FeeStatus, PaymentMode } from '../hooks/useFeeData'

// ─── Status Config ─────────────────────────────────────
const STATUS_CONFIG: Record<FeeStatus, { label: string; color: string; bg: string; icon: React.ElementType; description: string }> = {
  paid: { label: 'Paid', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800', icon: CheckCircle, description: 'Payment completed successfully' },
  pending: { label: 'Pending', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800', icon: Clock, description: 'Payment not yet made' },
  overdue: { label: 'Overdue', color: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800', icon: AlertTriangle, description: 'Payment deadline has passed' },
  partial: { label: 'Partial', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800', icon: Wallet, description: 'Partial payment received' },
  waived: { label: 'Waived', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800', icon: Shield, description: 'Fee waived by administration' },
}

const COLORS = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
  partial: '#3b82f6',
  waived: '#8b5cf6',
  primary: '#0d9488',
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  tuition: { icon: GraduationCap, color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', label: 'Tuition' },
  exam: { icon: BookOpen, color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300', label: 'Exam' },
  library: { icon: Library, color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', label: 'Library' },
  lab: { icon: Beaker, color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', label: 'Lab' },
  hostel: { icon: Activity, color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300', label: 'Hostel' },
  transport: { icon: Activity, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', label: 'Transport' },
  misc: { icon: DollarSign, color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Misc' },
}

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-lg z-50">
      <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name}:</span>
          <span className="text-slate-900 dark:text-white font-bold">
            {typeof entry.value === 'number' ? `₹${entry.value.toLocaleString('en-IN')}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────
function StatCard({ label, value, subtext, icon: Icon, color, loading }: any) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      ) : (
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
      )}
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      {subtext && <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{subtext}</p>}
    </div>
  )
}

// ─── Pay Fee Modal ─────────────────────────────────────
function PayFeeModal({
  payment, onClose, onPay
}: {
  payment: FeePayment
  onClose: () => void
  onPay: (amount: number, mode: PaymentMode) => void
}) {
  const [amount, setAmount] = useState(payment.amount - payment.paidAmount)
  const [mode, setMode] = useState<PaymentMode>('upi')
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState<'amount' | 'confirm' | 'success'>('amount')

  const remaining = payment.amount - payment.paidAmount

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      onPay(amount, mode)
      setProcessing(false)
      setStep('success')
    }, 1200)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in duration-150">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-xs text-slate-500 mb-6">
              Your payment of ₹{amount.toLocaleString('en-IN')} has been acknowledged.
            </p>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-6 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">TXN{Date.now()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Receipt No</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">RCP{100000 + Math.floor(Math.random() * 90000)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-900 dark:text-white">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                Fee Payment
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Category</span>
                  <span className="font-bold text-slate-900 dark:text-white capitalize">{payment.category} Fee</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Invoice</span>
                  <span className="font-bold text-slate-900 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Paid so far</span>
                  <span className="font-bold text-emerald-600">₹{payment.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Balance</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">₹{remaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Amount to Pay (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  max={remaining}
                  min={1}
                  className="input-field text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 block">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'card', 'netbanking'] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        mode === m
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {m === 'upi' ? 'UPI / QR' : m === 'netbanking' ? 'NetBanking' : 'Debit/Credit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handlePay}
                disabled={processing || amount <= 0 || amount > remaining}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {processing ? 'Processing Securely...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Receipt Modal ─────────────────────────────────────
function ReceiptModal({ payment, onClose }: { payment: FeePayment; onClose: () => void }) {
  const status = STATUS_CONFIG[payment.status]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Official Fee Receipt
          </h2>
          <div className="flex items-center gap-1.5">
            <button onClick={() => window.print()} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Print Receipt">
              <Printer className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Vriddhi Educational Institute</h3>
            <p className="text-slate-500 font-medium mt-0.5">Student E-Receipt for Academic Fees</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt No</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white mt-0.5">{payment.receiptNo || 'RCP-884920'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Date</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{payment.paidDate || new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Name</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">{payment.studentName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reg. No</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{payment.regNo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Program</p>
              <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{payment.course} &bull; {payment.batch}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold border mt-0.5 ${status.bg} ${status.color}`}>
                <status.icon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 capitalize">{payment.category} Fee</span>
              <span className="font-bold text-slate-900 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold">
              <span className="text-slate-700 dark:text-slate-300">Amount Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">₹{payment.paidAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            This is a computer-verified institutional fee receipt. No physical signature required.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function StudentFeePortal({ studentId: studentIdProp }: { studentId?: string }) {
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const studentId = studentIdProp || profile?.id || user?.uid || '';
  const {
    loading,
    studentPayments,
    studentSummary,
    refreshData,
    collectPayment,
  } = useFeeData(studentId)

  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)
  const [modalMode, setModalMode] = useState<'pay' | 'receipt' | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all')

  const handlePay = (amount: number, mode: PaymentMode) => {
    if (selectedPayment) {
      collectPayment(selectedPayment.id, amount, mode)
    }
  }

  const filteredPayments = studentPayments.filter(p => {
    if (activeTab === 'pending') return p.status === 'pending' || p.status === 'overdue' || p.status === 'partial'
    if (activeTab === 'paid') return p.status === 'paid' || p.status === 'waived'
    return true
  })

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    studentPayments.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_CONFIG[status as FeeStatus]?.label || status,
      value: count,
      color: COLORS[status as keyof typeof COLORS] || COLORS.primary,
    }))
  }, [studentPayments])

  const monthlyData = useMemo(() => {
    const map: Record<string, { paid: number; due: number }> = {}
    studentPayments.forEach(p => {
      const month = new Date(p.dueDate).toLocaleString('en-US', { month: 'short' })
      if (!map[month]) map[month] = { paid: 0, due: 0 }
      map[month].due += p.amount
      map[month].paid += p.paidAmount
    })
    return Object.entries(map).map(([month, data]) => ({ month, ...data }))
  }, [studentPayments])

  const summary = studentSummary

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <DollarSign className="text-teal-600" /> Student Fee Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review academic dues, complete online fee payments, and download official receipts
          </p>
        </div>
        <button
          onClick={refreshData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-xs self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Records
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Assessed"
          value={summary ? `₹${summary.totalDue.toLocaleString('en-IN')}` : '₹0'}
          subtext="Annual academic dues"
          icon={DollarSign}
          color="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
          loading={loading}
        />
        <StatCard
          label="Cleared Amount"
          value={summary ? `₹${summary.totalPaid.toLocaleString('en-IN')}` : '₹0'}
          subtext={summary && summary.totalDue > 0 ? `${Math.round((summary.totalPaid / summary.totalDue) * 100)}% of invoice settled` : 'Fully cleared'}
          icon={CheckCircle}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
          loading={loading}
        />
        <StatCard
          label="Pending Due"
          value={summary ? `₹${(summary.totalPending + summary.totalOverdue).toLocaleString('en-IN')}` : '₹0'}
          subtext={`${summary ? summary.countPending + summary.countOverdue : 0} open fee categories`}
          icon={Clock}
          color="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
          loading={loading}
        />
        <StatCard
          label="Overdue Balance"
          value={summary ? `₹${summary.totalOverdue.toLocaleString('en-IN')}` : '₹0'}
          subtext={`${summary ? summary.countOverdue : 0} past due deadline`}
          icon={AlertTriangle}
          color="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Distribution */}
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Fee Status Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Distribution by payment settlement category</p>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{item.name}:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly Payment Trend */}
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Monthly Billing Trend</h3>
          <p className="text-xs text-slate-500 mb-4">Monthly billed vs paid comparison</p>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="due" name="Due" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fee Records Table */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Invoices', count: studentPayments.length },
              { id: 'pending', label: 'Pending / Due', count: studentPayments.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial').length },
              { id: 'paid', label: 'Paid & Cleared', count: studentPayments.filter(p => p.status === 'paid' || p.status === 'waived').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-5">Fee Category</th>
                  <th className="py-3 px-5 text-right">Total Invoice</th>
                  <th className="py-3 px-5 text-right">Paid</th>
                  <th className="py-3 px-5 text-right">Balance Due</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-center">Due Date</th>
                  <th className="py-3 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((payment) => {
                  const status = STATUS_CONFIG[payment.status]
                  const StatusIcon = status.icon
                  const remaining = payment.amount - payment.paidAmount
                  const isPayable = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial'
                  const catConfig = CATEGORY_CONFIG[payment.category] || CATEGORY_CONFIG.misc
                  const CatIcon = catConfig.icon

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${catConfig.color} flex items-center justify-center shrink-0`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white capitalize">{payment.category} Fee</p>
                            <p className="text-[11px] text-slate-400 font-medium">{payment.dueDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right text-emerald-600 font-bold">
                        ₹{payment.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-amber-600 dark:text-amber-400">
                        ₹{remaining.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center text-slate-500 font-medium">
                        {payment.dueDate}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isPayable && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setModalMode('pay') }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                          {(payment.status === 'paid' || payment.status === 'partial' || payment.status === 'waived') && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setModalMode('receipt') }}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                              title="View Official Receipt"
                            >
                              <Receipt className="w-4 h-4 text-teal-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredPayments.length === 0 && !loading && (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No invoices under this category</p>
          </div>
        )}
      </div>

      {modalMode === 'pay' && selectedPayment && (
        <PayFeeModal
          payment={selectedPayment}
          onClose={() => { setModalMode(null); setSelectedPayment(null) }}
          onPay={handlePay}
        />
      )}

      {modalMode === 'receipt' && selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => { setModalMode(null); setSelectedPayment(null) }}
        />
      )}
    </div>
  )
}
