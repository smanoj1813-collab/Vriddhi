import { useAuth } from '@/hooks/useAuth';
import React, { useState, useMemo } from 'react'
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
  paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-500/15', icon: CheckCircle, description: 'Payment completed successfully' },
  pending: { label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Clock, description: 'Payment not yet made' },
  overdue: { label: 'Overdue', color: 'text-red-400', bg: 'bg-red-500/15', icon: AlertTriangle, description: 'Payment deadline has passed' },
  partial: { label: 'Partial', color: 'text-blue-400', bg: 'bg-blue-500/15', icon: Wallet, description: 'Partial payment received' },
  waived: { label: 'Waived', color: 'text-purple-400', bg: 'bg-purple-500/15', icon: Shield, description: 'Fee waived by administration' },
}

const COLORS = {
  paid: '#22c55e',
  pending: '#f59e0b',
  overdue: '#ef4444',
  partial: '#3b82f6',
  waived: '#a855f7',
  primary: '#14b8a6',
}

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  tuition: { icon: GraduationCap, color: 'bg-blue-500/20 text-blue-400', label: 'Tuition' },
  exam: { icon: BookOpen, color: 'bg-red-500/20 text-red-400', label: 'Exam' },
  library: { icon: Library, color: 'bg-purple-500/20 text-purple-400', label: 'Library' },
  lab: { icon: Beaker, color: 'bg-orange-500/20 text-orange-400', label: 'Lab' },
  hostel: { icon: Activity, color: 'bg-pink-500/20 text-pink-400', label: 'Hostel' },
  transport: { icon: Activity, color: 'bg-green-500/20 text-green-400', label: 'Transport' },
  misc: { icon: DollarSign, color: 'bg-slate-500/20 text-slate-400', label: 'Misc' },
}

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-vriddhi-card border border-vriddhi-border rounded-xl p-3 shadow-xl z-50">
      <p className="text-sm font-semibold text-white mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-vriddhi-muted">{entry.name}:</span>
          <span className="text-white font-medium">
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
    <div className="stat-card p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 -mr-6 -mt-6 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-vriddhi-muted" />
      ) : (
        <p className="text-2xl font-bold text-white">{value}</p>
      )}
      <p className="text-xs text-vriddhi-muted mt-1">{label}</p>
      {subtext && <p className="text-[10px] text-vriddhi-muted/60 mt-0.5">{subtext}</p>}
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
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-sm text-vriddhi-muted mb-6">
              Your payment of ₹{amount.toLocaleString('en-IN')} has been processed successfully.
            </p>
            <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Transaction ID</span>
                <span className="text-xs font-mono text-white">TXN{Date.now()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Receipt No</span>
                <span className="text-xs font-mono text-white">RCP{100000 + Math.floor(Math.random() * 90000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-vriddhi-muted">Date</span>
                <span className="text-xs text-white">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-vriddhi-accent" />
                Pay Fee
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-vriddhi-muted" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-vriddhi-muted">Fee Type</span>
                  <span className="text-sm font-medium text-white capitalize">{payment.category} Fee</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-vriddhi-muted">Total Amount</span>
                  <span className="text-sm font-bold text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-vriddhi-muted">Already Paid</span>
                  <span className="text-sm font-medium text-green-400">₹{payment.paidAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-vriddhi-border">
                  <span className="text-sm text-vriddhi-muted">Remaining</span>
                  <span className="text-sm font-bold text-amber-400">₹{remaining.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-vriddhi-muted mb-2 block">Payment Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  max={remaining}
                  min={1}
                  className="input-field"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setAmount(remaining)} className="text-xs px-2 py-1 bg-vriddhi-accent/20 text-vriddhi-accent rounded-lg hover:bg-vriddhi-accent/30 transition-colors">
                    Pay Full
                  </button>
                  <button onClick={() => setAmount(Math.floor(remaining / 2))} className="text-xs px-2 py-1 bg-vriddhi-border/50 text-vriddhi-muted rounded-lg hover:bg-vriddhi-border transition-colors">
                    Pay Half
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-vriddhi-muted mb-2 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'card', 'netbanking'] as PaymentMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                        mode === m
                          ? 'bg-vriddhi-accent text-white ring-1 ring-vriddhi-accent'
                          : 'bg-vriddhi-dark border border-vriddhi-border text-vriddhi-muted hover:text-white'
                      }`}
                    >
                      {m === 'upi' ? 'UPI' : m === 'netbanking' ? 'Net Banking' : 'Card'}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'upi' && (
                <div className="p-4 bg-vriddhi-dark/30 rounded-xl border border-vriddhi-border/50">
                  <p className="text-xs text-vriddhi-muted mb-2">Scan QR code or use UPI ID</p>
                  <div className="w-32 h-32 bg-white rounded-xl mx-auto flex items-center justify-center">
                    <div className="w-24 h-24 bg-vriddhi-dark rounded-lg flex items-center justify-center">
                      <div className="grid grid-cols-5 grid-rows-5 gap-0.5 w-16 h-16">
                        {Array.from({ length: 25 }).map((_, i) => (
                          <div key={i} className={`w-full h-full rounded-[1px] ${Math.random() > 0.5 ? 'bg-vriddhi-accent' : 'bg-transparent'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-vriddhi-muted mt-2 font-mono">vriddhi@upi</p>
                </div>
              )}

              {mode === 'card' && (
                <div className="p-4 bg-vriddhi-dark/30 rounded-xl border border-vriddhi-border/50 space-y-3">
                  <input type="text" placeholder="Card Number" className="input-field text-sm" maxLength={16} />
                  <div className="flex gap-3">
                    <input type="text" placeholder="MM/YY" className="input-field text-sm flex-1" maxLength={5} />
                    <input type="text" placeholder="CVV" className="input-field text-sm w-24" maxLength={3} />
                  </div>
                  <input type="text" placeholder="Card Holder Name" className="input-field text-sm" />
                </div>
              )}

              {mode === 'netbanking' && (
                <div className="p-4 bg-vriddhi-dark/30 rounded-xl border border-vriddhi-border/50">
                  <p className="text-xs text-vriddhi-muted mb-3">Select your bank</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['SBI', 'HDFC', 'ICICI', 'Axis', 'PNB', 'BOB'].map(bank => (
                      <button key={bank} className="px-3 py-2 rounded-lg bg-vriddhi-dark border border-vriddhi-border text-xs text-vriddhi-muted hover:text-white hover:border-vriddhi-accent transition-colors">
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-vriddhi-border">
              <button
                onClick={handlePay}
                disabled={processing || amount <= 0 || amount > remaining}
                className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {processing ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-vriddhi-accent" />
            Fee Receipt
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Print">
              <Printer className="w-5 h-5 text-vriddhi-muted" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-vriddhi-muted" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center pb-4 border-b border-vriddhi-border">
            <h3 className="text-lg font-bold text-white">Vriddhi Educational Institute</h3>
            <p className="text-xs text-vriddhi-muted">Fee Payment Receipt</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Receipt No</p>
              <p className="text-sm font-mono text-white">{payment.receiptNo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Date</p>
              <p className="text-sm text-white">{payment.paidDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Student Name</p>
              <p className="text-sm font-medium text-white">{payment.studentName}</p>
            </div>
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Reg No</p>
              <p className="text-sm text-white">{payment.regNo}</p>
            </div>
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Course</p>
              <p className="text-sm text-white">{payment.course} - {payment.batch}</p>
            </div>
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Status</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                <status.icon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
          </div>

          <div className="p-4 bg-vriddhi-dark/30 rounded-xl border border-vriddhi-border/50">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted capitalize">{payment.category} Fee</span>
              <span className="text-sm font-medium text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
            </div>
            {payment.paidAmount > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-vriddhi-muted">Paid Amount</span>
                <span className="text-sm font-medium text-green-400">- ₹{payment.paidAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-vriddhi-border">
              <span className="text-sm font-medium text-white">{payment.status === 'paid' ? 'Total Paid' : 'Remaining'}</span>
              <span className={`text-sm font-bold ${payment.status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                ₹{(payment.status === 'paid' ? payment.paidAmount : payment.amount - payment.paidAmount).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {payment.transactionId && (
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Transaction ID</p>
              <p className="text-sm font-mono text-white">{payment.transactionId}</p>
            </div>
          )}
          {payment.paymentMode && (
            <div>
              <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Payment Mode</p>
              <p className="text-sm text-white capitalize">{payment.paymentMode}</p>
            </div>
          )}

          <div className="text-center pt-4 border-t border-vriddhi-border">
            <p className="text-[10px] text-vriddhi-muted/50">This is a computer-generated receipt. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function StudentFeePortal({ studentId: studentIdProp }: { studentId?: string }) {
  const { user } = useAuth();
  const studentId = studentIdProp || user?.id || '';
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
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1 flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-vriddhi-accent" />
            My Fees
          </h1>
          <p className="text-vriddhi-muted">View your fee details, make payments, and download receipts</p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors self-start"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Fee Due"
          value={summary ? `₹${summary.totalDue.toLocaleString('en-IN')}` : '₹0'}
          subtext="For current academic year"
          icon={DollarSign}
          color="bg-blue-500 text-blue-400"
          loading={loading}
        />
        <StatCard
          label="Total Paid"
          value={summary ? `₹${summary.totalPaid.toLocaleString('en-IN')}` : '₹0'}
          subtext={summary ? `${Math.round((summary.totalPaid / summary.totalDue) * 100)}% of total` : ''}
          icon={CheckCircle}
          color="bg-green-500 text-green-400"
          loading={loading}
        />
        <StatCard
          label="Pending"
          value={summary ? `₹${(summary.totalPending + summary.totalOverdue).toLocaleString('en-IN')}` : '₹0'}
          subtext={`${summary ? summary.countPending + summary.countOverdue : 0} fees pending`}
          icon={Clock}
          color="bg-amber-500 text-amber-400"
          loading={loading}
        />
        <StatCard
          label="Overdue"
          value={summary ? `₹${summary.totalOverdue.toLocaleString('en-IN')}` : '₹0'}
          subtext={`${summary ? summary.countOverdue : 0} overdue fees`}
          icon={AlertTriangle}
          color="bg-red-500 text-red-400"
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payment Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Payment Status</h3>
          <p className="text-xs text-vriddhi-muted mb-4">Breakdown of your fee records</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
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
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[11px] text-vriddhi-muted">{item.name}</span>
                    <span className="text-[11px] text-white font-medium">({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly Payment Trend */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-1">Payment Trend</h3>
          <p className="text-xs text-vriddhi-muted mb-4">Due vs Paid by month</p>
          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="due" name="Due" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="Paid" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fee Records Tabs */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-vriddhi-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All Fees', count: studentPayments.length },
              { id: 'pending', label: 'Pending', count: studentPayments.filter(p => p.status === 'pending' || p.status === 'overdue' || p.status === 'partial').length },
              { id: 'paid', label: 'Paid / Waived', count: studentPayments.filter(p => p.status === 'paid' || p.status === 'waived').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-vriddhi-accent text-white'
                    : 'bg-vriddhi-dark text-vriddhi-muted hover:text-white hover:bg-vriddhi-border/50'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-vriddhi-border/50 text-vriddhi-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-vriddhi-border">
                  <th className="table-header">Fee Type</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header text-right">Paid</th>
                  <th className="table-header text-right">Balance</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center">Due Date</th>
                  <th className="table-header text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const status = STATUS_CONFIG[payment.status]
                  const StatusIcon = status.icon
                  const remaining = payment.amount - payment.paidAmount
                  const isPayable = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial'
                  const catConfig = CATEGORY_CONFIG[payment.category] || CATEGORY_CONFIG.misc
                  const CatIcon = catConfig.icon

                  return (
                    <tr key={payment.id} className="hover:bg-vriddhi-dark/30 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg ${catConfig.color} flex items-center justify-center`}>
                            <CatIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white capitalize">{payment.category} Fee</p>
                            <p className="text-[10px] text-vriddhi-muted">{payment.dueDate}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-right font-medium text-white">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="table-cell text-right">
                        <span className={payment.paidAmount > 0 ? 'text-green-400 font-medium' : 'text-vriddhi-muted'}>
                          ₹{payment.paidAmount.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <span className={remaining > 0 ? 'text-amber-400 font-bold' : 'text-green-400 font-medium'}>
                          ₹{remaining.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="table-cell text-center text-vriddhi-muted">
                        {payment.dueDate}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isPayable && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setModalMode('pay') }}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent/20 text-vriddhi-accent hover:bg-vriddhi-accent/30 transition-colors"
                            >
                              Pay Now
                            </button>
                          )}
                          {(payment.status === 'paid' || payment.status === 'partial' || payment.status === 'waived') && (
                            <button
                              onClick={() => { setSelectedPayment(payment); setModalMode('receipt') }}
                              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                              title="View Receipt"
                            >
                              <Receipt className="w-4 h-4 text-vriddhi-muted" />
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
            <FileText className="w-12 h-12 text-vriddhi-muted/30 mx-auto mb-3" />
            <p className="text-vriddhi-muted">No fee records found</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="glass-card p-5 flex items-center gap-4 hover:bg-vriddhi-dark/40 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-vriddhi-accent/10 flex items-center justify-center group-hover:bg-vriddhi-accent/20 transition-colors">
            <Download className="w-6 h-6 text-vriddhi-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Download All Receipts</p>
            <p className="text-xs text-vriddhi-muted">Get PDF of all paid fees</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4 hover:bg-vriddhi-dark/40 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Info className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Fee Structure</p>
            <p className="text-xs text-vriddhi-muted">View complete fee breakdown</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4 hover:bg-vriddhi-dark/40 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Payment Schedule</p>
            <p className="text-xs text-vriddhi-muted">Upcoming due dates</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-vriddhi-muted/40 py-6">
        Last updated {new Date().toLocaleString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        · Contact admin office for any fee-related queries
      </div>

      {/* Modals */}
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
