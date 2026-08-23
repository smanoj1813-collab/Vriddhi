import React, { useState } from 'react'
import {
  DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, Search, Filter, RefreshCw, Download, ChevronDown,
  ChevronUp, CreditCard, Wallet, Receipt, ArrowUpRight, ArrowDownRight,
  Loader2, GraduationCap, Calendar, BookOpen, Activity, Eye, Check, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { useFeeData, FeePayment, FeeStatus, PaymentMode } from '../hooks/useFeeData'
import { useThemeMode } from '../../../shared/contexts/ThemeProvider'

// ─── Status Config ─────────────────────────────────────
const STATUS_CONFIG: Record<FeeStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paid: { label: 'Paid', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/15', icon: CheckCircle },
  pending: { label: 'Pending', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/15', icon: Clock },
  overdue: { label: 'Overdue', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/15', icon: AlertTriangle },
  partial: { label: 'Partial', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/15', icon: Wallet },
  waived: { label: 'Waived', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/15', icon: XCircle },
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  tuition: GraduationCap,
  exam: BookOpen,
  library: BookOpen,
  lab: Activity,
  hostel: Users,
  transport: Activity,
  misc: DollarSign,
}

const COLORS = {
  paid: '#22c55e',
  pending: '#f59e0b',
  overdue: '#ef4444',
  partial: '#3b82f6',
  waived: '#a855f7',
  primary: '#14b8a6',
  accent: '#6366f1',
}

// ─── Custom Tooltip ──────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-vriddhi-card border border-vriddhi-border rounded-xl p-3 shadow-xl z-50">
      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-vriddhi-muted">{entry.name}:</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ─────────────────────────────────────────
function StatCard({ label, value, subtext, icon: Icon, color, trend, trendUp, loading }: any) {
  return (
    <div className="stat-card relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -mr-6 -mt-6 ${color}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-20 flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-vriddhi-muted" />
      ) : (
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      )}
      <p className="text-xs text-vriddhi-muted mt-0.5">{label}</p>
      {subtext && <p className="text-[10px] text-vriddhi-muted/60 mt-0.5">{subtext}</p>}
    </div>
  )
}

// ─── Collect Payment Modal ─────────────────────────────
function CollectPaymentModal({
  payment, onClose, onCollect
}: {
  payment: FeePayment
  onClose: () => void
  onCollect: (amount: number, mode: PaymentMode) => void
}) {
  const [amount, setAmount] = useState(payment.amount - payment.paidAmount)
  const [mode, setMode] = useState<PaymentMode>('cash')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = () => {
    setProcessing(true)
    setTimeout(() => {
      onCollect(amount, mode)
      setProcessing(false)
      onClose()
    }, 800)
  }

  const remaining = payment.amount - payment.paidAmount

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-vriddhi-accent" />
            Collect Payment
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted">Student</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{payment.studentName}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted">Reg No</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">{payment.regNo}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted">Fee Type</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white capitalize">{payment.category}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted">Total Amount</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-vriddhi-muted">Paid So Far</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">₹{payment.paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-vriddhi-border">
              <span className="text-sm text-vriddhi-muted">Remaining</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">₹{remaining.toLocaleString('en-IN')}</span>
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
                Full Amount
              </button>
              <button onClick={() => setAmount(Math.floor(remaining / 2))} className="text-xs px-2 py-1 bg-vriddhi-border/50 text-vriddhi-muted rounded-lg hover:bg-vriddhi-border transition-colors">
                Half Amount
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-vriddhi-muted mb-2 block">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cash', 'upi', 'card', 'netbanking', 'cheque', 'dd'] as PaymentMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                    mode === m
                      ? 'bg-vriddhi-accent text-white ring-1 ring-vriddhi-accent'
                      : 'bg-vriddhi-dark border border-vriddhi-border text-vriddhi-muted hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {m === 'netbanking' ? 'Net Banking' : m === 'dd' ? 'DD' : m}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-vriddhi-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border hover:bg-vriddhi-border/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || amount <= 0 || amount > remaining}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {processing ? 'Processing...' : 'Collect Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Waive Fee Modal ───────────────────────────────────
function WaiveFeeModal({
  payment, onClose, onWaive
}: {
  payment: FeePayment
  onClose: () => void
  onWaive: (remarks: string) => void
}) {
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = () => {
    setProcessing(true)
    setTimeout(() => {
      onWaive(remarks || 'Fee waived by admin')
      setProcessing(false)
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Waive Fee
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <p className="text-sm text-purple-300">
              You are about to waive <span className="font-bold">₹{payment.amount.toLocaleString('en-IN')}</span> for{' '}
              <span className="font-bold">{payment.studentName}</span> ({payment.regNo}).
            </p>
          </div>
          <div>
            <label className="text-sm text-vriddhi-muted mb-2 block">Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Reason for waiver..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-vriddhi-border flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border hover:bg-vriddhi-border/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {processing ? 'Processing...' : 'Waive Fee'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Detail Modal ────────────────────────────────
function PaymentDetailModal({ payment, onClose }: { payment: FeePayment; onClose: () => void }) {
  const status = STATUS_CONFIG[payment.status]
  const StatusIcon = status.icon

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-vriddhi-accent" />
            Payment Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-vriddhi-dark/50 rounded-xl border border-vriddhi-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${status.bg} flex items-center justify-center`}>
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.studentName}</p>
                <p className="text-xs text-vriddhi-muted">{payment.regNo}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Course</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.course}</p>
            </div>
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Batch</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.batch}</p>
            </div>
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Category</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{payment.category}</p>
            </div>
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Due Date</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.dueDate}</p>
            </div>
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Total Amount</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">₹{payment.amount.toLocaleString('en-IN')}</p>
            </div>
            <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
              <p className="text-xs text-vriddhi-muted">Paid Amount</p>
              <p className={`text-sm font-bold ${payment.paidAmount > 0 ? 'text-green-600 dark:text-green-400' : 'text-vriddhi-muted'}`}>
                ₹{payment.paidAmount.toLocaleString('en-IN')}
              </p>
            </div>
            {payment.paidDate && (
              <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
                <p className="text-xs text-vriddhi-muted">Paid Date</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{payment.paidDate}</p>
              </div>
            )}
            {payment.paymentMode && (
              <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
                <p className="text-xs text-vriddhi-muted">Payment Mode</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{payment.paymentMode}</p>
              </div>
            )}
            {payment.transactionId && (
              <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
                <p className="text-xs text-vriddhi-muted">Transaction ID</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">{payment.transactionId}</p>
              </div>
            )}
            {payment.receiptNo && (
              <div className="p-3 bg-vriddhi-dark/30 rounded-lg">
                <p className="text-xs text-vriddhi-muted">Receipt No</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">{payment.receiptNo}</p>
              </div>
            )}
            {payment.remarks && (
              <div className="p-3 bg-vriddhi-dark/30 rounded-lg col-span-2">
                <p className="text-xs text-vriddhi-muted">Remarks</p>
                <p className="text-sm text-slate-900 dark:text-white">{payment.remarks}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function AdminFeeManagement() {
  const { resolvedMode } = useThemeMode()
  const chartGrid = resolvedMode === 'dark' ? '#334155' : '#e2e8f0'
  const chartAxis = resolvedMode === 'dark' ? '#94a3b8' : '#64748b'
  const {
    loading,
    filters,
    allPayments,
    summary,
    courseSummary,
    categorySummary,
    monthlyCollection,
    overduePayments,
    updateFilters,
    refreshData,
    collectPayment,
    waiveFee,
  } = useFeeData()

  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)
  const [modalMode, setModalMode] = useState<'collect' | 'waive' | 'detail' | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'overdue'>('overview')

  const handleCollect = (amount: number, mode: PaymentMode) => {
    if (selectedPayment) {
      collectPayment(selectedPayment.id, amount, mode)
    }
  }

  const handleWaive = (remarks: string) => {
    if (selectedPayment) {
      waiveFee(selectedPayment.id, remarks)
    }
  }

  const statusData = [
    { name: 'Paid', value: summary.countPaid, color: COLORS.paid },
    { name: 'Pending', value: summary.countPending, color: COLORS.pending },
    { name: 'Overdue', value: summary.countOverdue, color: COLORS.overdue },
    { name: 'Partial', value: summary.countPartial, color: COLORS.partial },
  ].filter(s => s.value > 0)

  const collectionRate = summary.totalDue > 0
    ? Math.round((summary.totalPaid / summary.totalDue) * 1000) / 10
    : 0

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="section-title mb-1 flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-vriddhi-accent" />
            Fee Management
          </h1>
          <p className="text-vriddhi-muted">Manage student fees, collect payments, and track financial status</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border rounded-xl text-sm text-vriddhi-text hover:bg-vriddhi-border/50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => console.log('Export fees')}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-accent text-white rounded-xl text-sm hover:bg-teal-600 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'payments', label: 'All Payments', icon: CreditCard },
          { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'bg-vriddhi-accent text-white' : 'bg-vriddhi-card text-vriddhi-muted hover:text-slate-900 dark:hover:text-white hover:bg-vriddhi-border/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'overdue' && overduePayments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                  {overduePayments.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── OVERVIEW TAB ───────────────────────────────── */}
      {activeTab === 'overview' && (
                <div className="space-y-6">
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Fee Due"
              value={`₹${summary.totalDue.toLocaleString('en-IN')}`}
              subtext="Across all students"
              icon={DollarSign}
              color="bg-blue-500 text-blue-600 dark:text-blue-400"
              loading={loading}
            />
            <StatCard
              label="Total Collected"
              value={`₹${summary.totalPaid.toLocaleString('en-IN')}`}
              subtext={`${collectionRate}% collection rate`}
              icon={CheckCircle}
              color="bg-green-500 text-green-600 dark:text-green-400"
              trend="+8.2%"
              trendUp={true}
              loading={loading}
            />
            <StatCard
              label="Pending Amount"
              value={`₹${(summary.totalPending + summary.totalOverdue).toLocaleString('en-IN')}`}
              subtext={`${summary.countPending + summary.countOverdue} pending records`}
              icon={Clock}
              color="bg-amber-500 text-amber-600 dark:text-amber-400"
              loading={loading}
            />
            <StatCard
              label="Overdue Amount"
              value={`₹${summary.totalOverdue.toLocaleString('en-IN')}`}
              subtext={`${summary.countOverdue} overdue records`}
              icon={AlertTriangle}
              color="bg-red-500 text-red-600 dark:text-red-400"
              trend="-2.1%"
              trendUp={false}
              loading={loading}
            />
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Paid Records</span>
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.countPaid}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Partial Payments</span>
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{summary.countPartial}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Waived</span>
                <XCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">₹{summary.totalWaived.toLocaleString('en-IN')}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-vriddhi-muted">Collection Rate</span>
                <TrendingUp className="w-4 h-4 text-vriddhi-accent" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{collectionRate}%</p>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course-wise Summary */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Course-wise Fee Collection</h3>
              <p className="text-xs text-vriddhi-muted mb-4">Total due vs collected by course</p>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={courseSummary} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="course" stroke={chartAxis} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxis} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="totalDue" name="Total Due" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalPaid" name="Total Paid" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Distribution */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Payment Status Distribution</h3>
              <p className="text-xs text-vriddhi-muted mb-4">Breakdown of all fee records</p>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
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
                        <span className="text-[11px] text-slate-900 dark:text-white font-medium">({item.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category-wise Summary */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Fee Category Breakdown</h3>
              <p className="text-xs text-vriddhi-muted mb-4">Distribution by fee type</p>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
                </div>
              ) : (
                <div className="space-y-3">
                  {categorySummary.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.category] || DollarSign
                    const percent = cat.totalDue > 0 ? Math.round((cat.totalPaid / cat.totalDue) * 100) : 0
                    return (
                      <div key={cat.category} className="flex items-center gap-4 p-3 rounded-xl bg-vriddhi-dark/30 hover:bg-vriddhi-dark/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-vriddhi-accent/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-vriddhi-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{cat.category} Fee</p>
                            <span className="text-xs text-vriddhi-muted">{cat.count} records</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-vriddhi-dark rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-vriddhi-accent transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-900 dark:text-white font-medium w-10 text-right">{percent}%</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">₹{cat.totalDue.toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-green-600 dark:text-green-400">₹{cat.totalPaid.toLocaleString('en-IN')} collected</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Monthly Collection Trend */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Monthly Collection</h3>
              <p className="text-xs text-vriddhi-muted mb-4">Fee collection trend over the year</p>
              {loading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-vriddhi-muted" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyCollection}>
                    <defs>
                      <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="month" stroke={chartAxis} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxis} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="collected" name="Collected" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorCollected)" strokeWidth={2} />
                    <Area type="monotone" dataKey="target" name="Target" stroke={COLORS.accent} strokeDasharray="5 5" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ALL PAYMENTS TAB ───────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="glass-card p-4">
            <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-vriddhi-muted" />
                <input
                  type="text"
                  placeholder="Search by name, reg no..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none w-full placeholder:text-vriddhi-muted/50"
                />
              </div>
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2">
                <Filter className="w-4 h-4 text-vriddhi-muted" />
                <select
                  value={filters.course}
                  onChange={(e) => updateFilters({ course: e.target.value })}
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none cursor-pointer"
                >
                  <option value="all">All Courses</option>
                  <option value="BCom">BCom</option>
                  <option value="BA">BA</option>
                  <option value="BSc">BSc</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4 text-vriddhi-muted" />
                <select
                  value={filters.batch}
                  onChange={(e) => updateFilters({ batch: e.target.value })}
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none cursor-pointer"
                >
                  <option value="all">All Batches</option>
                  {['2026', '2025', '2024', '2023', '2022'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2">
                <Activity className="w-4 h-4 text-vriddhi-muted" />
                <select
                  value={filters.status}
                  onChange={(e) => updateFilters({ status: e.target.value as any })}
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                  <option value="waived">Waived</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2">
                <DollarSign className="w-4 h-4 text-vriddhi-muted" />
                <select
                  value={filters.category}
                  onChange={(e) => updateFilters({ category: e.target.value as any })}
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="tuition">Tuition</option>
                  <option value="exam">Exam</option>
                  <option value="library">Library</option>
                  <option value="lab">Lab</option>
                  <option value="hostel">Hostel</option>
                  <option value="transport">Transport</option>
                  <option value="misc">Misc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-vriddhi-border flex items-center justify-between">
              <p className="text-sm text-vriddhi-muted">
                Showing <span className="text-slate-900 dark:text-white font-medium">{allPayments.length}</span> records
              </p>
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
                      <th className="table-header">Student</th>
                      <th className="table-header">Reg No</th>
                      <th className="table-header">Course</th>
                      <th className="table-header">Category</th>
                      <th className="table-header text-right">Amount</th>
                      <th className="table-header text-right">Paid</th>
                      <th className="table-header text-center">Status</th>
                      <th className="table-header text-center">Due Date</th>
                      <th className="table-header text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((payment) => {
                      const status = STATUS_CONFIG[payment.status]
                      const StatusIcon = status.icon
                      const remaining = payment.amount - payment.paidAmount
                      return (
                        <React.Fragment key={payment.id}>
                          <tr className="hover:bg-vriddhi-dark/30 transition-colors group">
                            <td className="table-cell">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-vriddhi-accent/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-vriddhi-accent">
                                    {payment.studentName.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <span className="font-medium text-slate-900 dark:text-white">{payment.studentName}</span>
                              </div>
                            </td>
                            <td className="table-cell text-vriddhi-muted">{payment.regNo}</td>
                            <td className="table-cell">
                              <span className="px-2 py-0.5 rounded-md text-xs bg-vriddhi-dark border border-vriddhi-border text-vriddhi-muted">
                                {payment.course}
                              </span>
                            </td>
                            <td className="table-cell">
                              <span className="capitalize text-vriddhi-muted">{payment.category}</span>
                            </td>
                            <td className="table-cell text-right font-medium text-slate-900 dark:text-white">
                              ₹{payment.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="table-cell text-right">
                              <span className={payment.paidAmount > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-vriddhi-muted'}>
                                ₹{payment.paidAmount.toLocaleString('en-IN')}
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
                                <button
                                  onClick={() => { setSelectedPayment(payment); setModalMode('detail') }}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4 text-vriddhi-muted" />
                                </button>
                                {(payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial') && (
                                  <button
                                    onClick={() => { setSelectedPayment(payment); setModalMode('collect') }}
                                    className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                                    title="Collect Payment"
                                  >
                                    <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </button>
                                )}
                                {(payment.status === 'pending' || payment.status === 'overdue') && (
                                  <button
                                    onClick={() => { setSelectedPayment(payment); setModalMode('waive') }}
                                    className="p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
                                    title="Waive Fee"
                                  >
                                    <XCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedRow(expandedRow === payment.id ? null : payment.id)}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                  {expandedRow === payment.id ? (
                                    <ChevronUp className="w-4 h-4 text-vriddhi-muted" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-vriddhi-muted" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRow === payment.id && (
                            <tr>
                              <td colSpan={9} className="px-6 py-4 bg-vriddhi-dark/20">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Remaining</p>
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">₹{remaining.toLocaleString('en-IN')}</p>
                                  </div>
                                  {payment.paidDate && (
                                    <div>
                                      <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Paid Date</p>
                                      <p className="text-sm text-slate-900 dark:text-white">{payment.paidDate}</p>
                                    </div>
                                  )}
                                  {payment.paymentMode && (
                                    <div>
                                      <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Payment Mode</p>
                                      <p className="text-sm text-slate-900 dark:text-white capitalize">{payment.paymentMode}</p>
                                    </div>
                                  )}
                                  {payment.transactionId && (
                                    <div>
                                      <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Transaction ID</p>
                                      <p className="text-sm text-slate-900 dark:text-white font-mono">{payment.transactionId}</p>
                                    </div>
                                  )}
                                  {payment.receiptNo && (
                                    <div>
                                      <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Receipt No</p>
                                      <p className="text-sm text-slate-900 dark:text-white font-mono">{payment.receiptNo}</p>
                                    </div>
                                  )}
                                  {payment.remarks && (
                                    <div className="col-span-2 md:col-span-4">
                                      <p className="text-[10px] text-vriddhi-muted uppercase tracking-wider">Remarks</p>
                                      <p className="text-sm text-slate-900 dark:text-white">{payment.remarks}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── OVERDUE TAB ────────────────────────────────── */}
      {activeTab === 'overdue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Overdue Count"
              value={overduePayments.length}
              icon={AlertTriangle}
              color="bg-red-500 text-red-600 dark:text-red-400"
              loading={loading}
            />
            <StatCard
              label="Overdue Amount"
              value={`₹${overduePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}`}
              icon={DollarSign}
              color="bg-red-500 text-red-600 dark:text-red-400"
              loading={loading}
            />
            <StatCard
              label="Students Affected"
              value={new Set(overduePayments.map(p => p.studentId)).size}
              icon={Users}
              color="bg-amber-500 text-amber-600 dark:text-amber-400"
              loading={loading}
            />
            <StatCard
              label="Avg Overdue"
              value={`₹${overduePayments.length ? Math.round(overduePayments.reduce((sum, p) => sum + p.amount, 0) / overduePayments.length).toLocaleString('en-IN') : 0}`}
              icon={TrendingUp}
              color="bg-blue-500 text-blue-600 dark:text-blue-400"
              loading={loading}
            />
          </div>

          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-vriddhi-border">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                Overdue Payments
              </h3>
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
                      <th className="table-header">Student</th>
                      <th className="table-header">Reg No</th>
                      <th className="table-header">Course</th>
                      <th className="table-header">Category</th>
                      <th className="table-header text-right">Amount</th>
                      <th className="table-header text-center">Due Date</th>
                      <th className="table-header text-center">Days Overdue</th>
                      <th className="table-header text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overduePayments.map((payment) => {
                      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
                      return (
                        <tr key={payment.id} className="hover:bg-vriddhi-dark/30 transition-colors">
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                  {payment.studentName.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">{payment.studentName}</span>
                            </div>
                          </td>
                          <td className="table-cell text-vriddhi-muted">{payment.regNo}</td>
                          <td className="table-cell">
                            <span className="px-2 py-0.5 rounded-md text-xs bg-vriddhi-dark border border-vriddhi-border text-vriddhi-muted">
                              {payment.course}
                            </span>
                          </td>
                          <td className="table-cell">
                            <span className="capitalize text-vriddhi-muted">{payment.category}</span>
                          </td>
                          <td className="table-cell text-right font-bold text-red-600 dark:text-red-400">
                            ₹{payment.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="table-cell text-center text-vriddhi-muted">{payment.dueDate}</td>
                          <td className="table-cell text-center">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-600 dark:text-red-400">
                              {daysOverdue} days
                            </span>
                          </td>
                          <td className="table-cell text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setSelectedPayment(payment); setModalMode('collect') }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 transition-colors"
                              >
                                Collect
                              </button>
                              <button
                                onClick={() => { setSelectedPayment(payment); setModalMode('waive') }}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-600 dark:text-purple-400 hover:bg-purple-500/25 transition-colors"
                              >
                                Waive
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalMode === 'collect' && selectedPayment && (
        <CollectPaymentModal
          payment={selectedPayment}
          onClose={() => { setModalMode(null); setSelectedPayment(null) }}
          onCollect={handleCollect}
        />
      )}
      {modalMode === 'waive' && selectedPayment && (
        <WaiveFeeModal
          payment={selectedPayment}
          onClose={() => { setModalMode(null); setSelectedPayment(null) }}
          onWaive={handleWaive}
        />
      )}
      {modalMode === 'detail' && selectedPayment && (
        <PaymentDetailModal
          payment={selectedPayment}
          onClose={() => { setModalMode(null); setSelectedPayment(null) }}
        />
      )}
    </div>
  )
}