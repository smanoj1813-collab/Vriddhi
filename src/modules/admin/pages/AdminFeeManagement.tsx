import React, { useState, useEffect } from 'react'
import {
  DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, Search, Filter, RefreshCw, Download, ChevronDown,
  ChevronUp, CreditCard, Wallet, Receipt, ArrowUpRight, ArrowDownRight,
  Loader2, GraduationCap, Calendar, BookOpen, Activity, Eye, Check, X,
  Upload, ShieldCheck, FileText, Image as ImageIcon, PlusCircle, Settings as SettingsIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts'
import { useFeeData, FeePayment, FeeStatus, PaymentMode } from '../hooks/useFeeData'
import {
  fetchFeePayments,
  fetchFeeTransactions,
  setReceiptPrefix,
  type CollectPaymentResult,
  type FeeCategory,
  type FeeStructure,
  type FeeStudent,
  type FeeTransaction,
} from '../api/feeApi'
import { ALL_PAYMENT_MODES, type BrandingSettings } from '../api/financeApi'
import { useFinanceRules } from '../hooks/useFinanceRules'
import { uploadPaymentProof } from '../api/feeProofStorage'
import { suggestTransactionId } from '../utils/feeReference'
import { feeNetPayable } from '../utils/financeRules'
import { buildReceiptModel } from '../utils/financeReceipt'
import { downloadReceiptPdf } from '../../../shared/utils/receiptPdf'
import { useThemeMode } from '../../../shared/contexts/ThemeProvider'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import FeeAssignmentModal from '../components/FeeAssignmentModal'
import FeeStructureModal from '../components/FeeStructureModal'

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
  university_exam: BookOpen,
  eligibility: GraduationCap,
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
interface CollectDetails {
  transactionId: string
  bankReference: string
  paidOn: string
  remarks: string
  screenshotUrl?: string
}

function CollectPaymentModal({
  payment, onClose, onCollect, onApplyDiscount, paymentModes = ALL_PAYMENT_MODES,
}: {
  payment: FeePayment
  onClose: () => void
  onCollect: (amount: number, mode: PaymentMode, details: CollectDetails) => Promise<CollectPaymentResult | null>
  onApplyDiscount?: (amount: number, label: string) => Promise<boolean>
  paymentModes?: PaymentMode[]
}) {
  const [amount, setAmount] = useState(() => feeNetPayable(payment))
  const [mode, setMode] = useState<PaymentMode>(() => paymentModes[0] || 'cash')
  const [transactionId, setTransactionId] = useState(() => suggestTransactionId())
  const [paidOn, setPaidOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [bankReference, setBankReference] = useState('')
  const [remarks, setRemarks] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState('')
  const [discountLabel, setDiscountLabel] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)

  const remaining = feeNetPayable(payment)

  const applyDiscountNow = async () => {
    const value = Number(discountAmount)
    if (!onApplyDiscount || !Number.isFinite(value) || value <= 0) {
      setError('Enter a discount amount greater than zero.')
      return
    }
    setApplyingDiscount(true)
    setError(null)
    try {
      const ok = await onApplyDiscount(value, discountLabel.trim() || 'Discount')
      if (ok) { setDiscountAmount(''); setDiscountLabel('') }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not apply the discount.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  const pickScreenshot = (file: File | null) => {
    setError(null)
    if (preview) URL.revokeObjectURL(preview)
    setScreenshot(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSubmit = async () => {
    setError(null)
    if (amount <= 0 || amount > remaining) {
      setError('Enter an amount between ₹1 and the remaining balance.')
      return
    }
    setProcessing(true)
    try {
      let screenshotUrl: string | undefined
      if (screenshot) {
        screenshotUrl = await uploadPaymentProof(
          localStorage.getItem('vriddhi_college_id') || '',
          payment.id,
          screenshot,
        )
      }
      const success = await onCollect(amount, mode, {
        transactionId: transactionId.trim(),
        bankReference: bankReference.trim(),
        paidOn,
        remarks: remarks.trim(),
        screenshotUrl,
      })
      if (success) onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be recorded. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-vriddhi-accent" />
            Record Payment
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
            {(payment.discountTotal ?? 0) > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-vriddhi-muted">Discount</span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">− ₹{(payment.discountTotal ?? 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            {(payment.lateFine ?? 0) > 0 && (
              <div className="flex justify-between mb-2">
                <span className="text-sm text-vriddhi-muted">Late fine</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">+ ₹{(payment.lateFine ?? 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-vriddhi-border">
              <span className="text-sm text-vriddhi-muted">Net Payable</span>
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
              {(paymentModes.length ? paymentModes : ALL_PAYMENT_MODES).map((m) => (
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

          {onApplyDiscount && (
            <div className="p-3 rounded-xl border border-vriddhi-border bg-vriddhi-dark/30 space-y-2">
              <label className="text-sm text-vriddhi-muted block">Apply discount (category / merit / management)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="Amount ₹"
                  min={1}
                  className="input-field"
                />
                <input
                  type="text"
                  value={discountLabel}
                  onChange={(e) => setDiscountLabel(e.target.value)}
                  placeholder="Reason (e.g. SC concession)"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={applyDiscountNow}
                  disabled={applyingDiscount}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {applyingDiscount ? 'Applying…' : 'Apply'}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-vriddhi-muted mb-2 block">Transaction / Reference ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Bank / UPI reference"
                className="input-field font-mono"
              />
              <button
                type="button"
                onClick={() => setTransactionId(suggestTransactionId())}
                title="Generate a new reference"
                className="px-3 rounded-xl border border-vriddhi-border text-vriddhi-muted hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-vriddhi-muted/70 mt-1">Auto-filled — overwrite with the real reference from the bank/UPI receipt.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-vriddhi-muted mb-2 block">Bank Reference (optional)</label>
              <input
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm text-vriddhi-muted mb-2 block">Paid On</label>
              <input
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-vriddhi-muted mb-2 block">Payment Screenshot (optional)</label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-vriddhi-border">
                <img src={preview} alt="Payment proof preview" className="w-full max-h-48 object-contain bg-black/20" />
                <button
                  type="button"
                  onClick={() => pickScreenshot(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-dashed border-vriddhi-border cursor-pointer hover:border-vriddhi-accent/50 transition-colors">
                <Upload className="w-6 h-6 text-vriddhi-muted" />
                <span className="text-sm text-vriddhi-muted">Click to upload a payment screenshot</span>
                <span className="text-[11px] text-vriddhi-muted/60">PNG, JPG, WEBP or GIF · up to 5 MB</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => pickScreenshot(e.target.files?.[0] ?? null)}
                />
              </label>
            )}
          </div>

          <div>
            <label className="text-sm text-vriddhi-muted mb-2 block">Remarks (optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="input-field"
              placeholder="Note for the receipt / audit trail"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
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
            {processing ? 'Recording…' : 'Record Payment'}
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
  onWaive: (remarks: string) => Promise<boolean>
}) {
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async () => {
    setProcessing(true)
    try {
      const success = await onWaive(remarks || 'Fee waived by admin')
      if (success) onClose()
    } finally {
      setProcessing(false)
    }
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
/** A transaction that represents money actually credited and so deserves a receipt. */
function isReceiptable(txn: FeeTransaction): boolean {
  return txn.type === 'payment'
    && Boolean(txn.receiptNo)
    && txn.submissionStatus !== 'pending_verification'
    && txn.submissionStatus !== 'rejected'
}

const SUBMISSION_BADGES: Record<string, { label: string; className: string }> = {
  recorded: { label: 'Recorded', className: 'bg-green-500/15 text-green-600 dark:text-green-400' },
  pending_verification: { label: 'Awaiting verification', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  verified: { label: 'Verified', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-600 dark:text-red-400' },
}

function PaymentDetailModal({
  payment, onClose, onVerifyProof, branding, onCollect,
}: {
  payment: FeePayment
  onClose: () => void
  onVerifyProof?: (transactionId: string, decision: 'approve' | 'reject') => Promise<void>
  branding?: BrandingSettings
  onCollect?: () => void
}) {
  const status = STATUS_CONFIG[payment.status]
  const StatusIcon = status.icon
  const [transactions, setTransactions] = useState<FeeTransaction[]>([])
  const [loadingTxns, setLoadingTxns] = useState(true)
  const [reviewing, setReviewing] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoadingTxns(true)
    fetchFeeTransactions(payment.id)
      .then(rows => { if (active) setTransactions(rows) })
      .catch(() => { if (active) setTransactions([]) })
      .finally(() => { if (active) setLoadingTxns(false) })
    return () => { active = false }
  }, [payment.id])

  const review = async (transactionId: string, decision: 'approve' | 'reject') => {
    if (!onVerifyProof) return
    setReviewing(transactionId)
    try {
      await onVerifyProof(transactionId, decision)
      setTransactions(await fetchFeeTransactions(payment.id))
    } catch {
      /* parent surfaces the toast */
    } finally {
      setReviewing(null)
    }
  }

  const downloadReceipt = async (txn: FeeTransaction) => {
    try {
      await downloadReceiptPdf(buildReceiptModel({
        payment,
        transaction: txn,
        branding,
        discountTotal: payment.discountTotal,
        lateFine: payment.lateFine,
        remarks: txn.remarks || undefined,
      }))
    } catch {
      /* rendering is best-effort */
    }
  }

  const receiptTxns = transactions.filter(isReceiptable)
  const canCollect = payment.status === 'pending' || payment.status === 'overdue' || payment.status === 'partial'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-vriddhi-card flex items-center justify-between p-6 border-b border-vriddhi-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-vriddhi-accent" />
            Payment Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {(receiptTxns.length > 0 || (onCollect && canCollect)) && (
            <div className="flex flex-wrap gap-2">
              {receiptTxns.length > 0 && (
                <button
                  onClick={() => downloadReceipt(receiptTxns[0])}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download latest receipt
                </button>
              )}
              {onCollect && canCollect && (
                <button
                  onClick={onCollect}
                  className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Record payment
                </button>
              )}
            </div>
          )}
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

          {payment.screenshotUrl && (
            <div>
              <p className="text-xs text-vriddhi-muted mb-2">Latest payment screenshot</p>
              <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-vriddhi-border">
                <img src={payment.screenshotUrl} alt="Payment proof" className="w-full max-h-56 object-contain bg-black/20" />
              </a>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-vriddhi-accent" /> Payment history
            </p>
            {loadingTxns ? (
              <div className="flex items-center gap-2 text-sm text-vriddhi-muted py-3">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-vriddhi-muted py-2">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map(txn => {
                  const badge = txn.submissionStatus ? SUBMISSION_BADGES[txn.submissionStatus] : undefined
                  return (
                    <div key={txn.id} className="p-3 rounded-xl border border-vriddhi-border bg-vriddhi-dark/30 flex gap-3">
                      {txn.screenshotUrl ? (
                        <a href={txn.screenshotUrl} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={txn.screenshotUrl} alt="Proof" className="w-14 h-14 rounded-lg object-cover border border-vriddhi-border" />
                        </a>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-vriddhi-dark border border-vriddhi-border flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-vriddhi-muted/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold ${txn.type === 'discount' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                            {txn.type === 'discount' ? '− ' : ''}₹{txn.amount.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {badge && <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>}
                            {isReceiptable(txn) && (
                              <button
                                onClick={() => downloadReceipt(txn)}
                                title="Download receipt PDF"
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" /> Receipt
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-vriddhi-muted capitalize">
                          {txn.type === 'waiver' ? 'Waiver' : txn.type === 'discount' ? 'Discount' : (txn.paymentMode || 'payment')} · {txn.paidOn || (txn.createdAt ? txn.createdAt.slice(0, 10) : '—')}
                        </p>
                        {(txn.transactionId || txn.receiptNo) && (
                          <p className="text-[11px] text-vriddhi-muted/80 font-mono truncate">
                            {txn.transactionId}{txn.receiptNo ? ` · ${txn.receiptNo}` : ''}
                          </p>
                        )}
                        {txn.rejectionReason && (
                          <p className="text-[11px] text-red-500 mt-0.5">{txn.rejectionReason}</p>
                        )}
                        {txn.submissionStatus === 'pending_verification' && onVerifyProof && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => review(txn.id, 'approve')}
                              disabled={reviewing === txn.id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/25 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => review(txn.id, 'reject')}
                              disabled={reviewing === txn.id}
                              className="text-xs px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Record Payment (student picker) ───────────────────
// The finance counter usually starts from a STUDENT, not from an invoice row.
// Pick the student → pick one of their open fees (or raise a new one on the
// spot) → the regular Collect Payment form opens pre-filled.
const FEE_CATEGORY_OPTIONS: { id: FeeCategory; label: string }[] = [
  { id: 'tuition', label: 'Tuition' },
  { id: 'exam', label: 'Exam' },
  { id: 'university_exam', label: 'University Exam' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'library', label: 'Library' },
  { id: 'lab', label: 'Lab' },
  { id: 'hostel', label: 'Hostel' },
  { id: 'transport', label: 'Transport' },
  { id: 'misc', label: 'Miscellaneous' },
]

function RecordPaymentModal({
  students, structures, onClose, onPick, onCreateInvoice,
}: {
  students: FeeStudent[]
  structures: FeeStructure[]
  onClose: () => void
  onPick: (payment: FeePayment) => void
  onCreateInvoice: (input: import('../api/feeApi').CreateFeePaymentInput) => Promise<FeePayment | null>
}) {
  const [search, setSearch] = useState('')
  const [student, setStudent] = useState<FeeStudent | null>(null)
  const [fees, setFees] = useState<FeePayment[]>([])
  const [loadingFees, setLoadingFees] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [category, setCategory] = useState<FeeCategory>('tuition')
  const [amount, setAmount] = useState('')
  const [remarks, setRemarks] = useState('')
  const [structureId, setStructureId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const matches = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? students.filter(st => `${st.name} ${st.regNo} ${st.course} ${st.batch}`.toLowerCase().includes(q))
      : students
    return list.slice(0, 50)
  }, [search, students])

  useEffect(() => {
    if (!student) return
    let active = true
    setLoadingFees(true)
    setError(null)
    fetchFeePayments({ studentId: student.id })
      .then(rows => { if (active) setFees(rows) })
      .catch(() => { if (active) setError('Could not load this student\u2019s fees.') })
      .finally(() => { if (active) setLoadingFees(false) })
    return () => { active = false }
  }, [student])

  const open = fees.filter(f => f.status === 'pending' || f.status === 'overdue' || f.status === 'partial')
  const closed = fees.filter(f => !open.includes(f))

  const applyStructure = (id: string) => {
    setStructureId(id)
    const st = structures.find(x => x.id === id)
    if (st) { setCategory(st.category); setAmount(String(st.amount)); setRemarks(st.name) }
  }

  const createAndCollect = async () => {
    if (!student) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) { setError('Enter the fee amount.'); return }
    setSaving(true)
    setError(null)
    try {
      const created = await onCreateInvoice({
        studentId: student.id,
        studentName: student.name,
        regNo: student.regNo,
        course: student.course,
        batch: student.batch,
        structureId: structureId || undefined,
        category,
        amount: value,
        dueDate: new Date().toISOString().slice(0, 10),
        remarks: remarks.trim() || undefined,
      })
      if (created) onPick(created)
      else setError('Could not create the fee entry.')
    } finally {
      setSaving(false)
    }
  }

  const relevantStructures = student
    ? structures.filter(st => !st.course || !student.course || st.course === student.course)
    : structures

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-vriddhi-card flex items-center justify-between p-6 border-b border-vriddhi-border">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-vriddhi-accent" /> Record Payment
            </h2>
            <p className="text-xs text-vriddhi-muted mt-0.5">
              {student ? 'Choose the fee this payment is for.' : 'Search the student who is paying.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-vriddhi-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!student ? (
            <>
              <div className="flex items-center gap-2 bg-vriddhi-dark/50 border border-vriddhi-border rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-vriddhi-muted" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, registration number, course…"
                  className="bg-transparent text-sm text-vriddhi-text focus:outline-none w-full placeholder:text-vriddhi-muted/50"
                />
              </div>
              {students.length === 0 ? (
                <p className="text-sm text-vriddhi-muted py-6 text-center">No students found for this college.</p>
              ) : (
                <div className="divide-y divide-vriddhi-border rounded-xl border border-vriddhi-border overflow-hidden">
                  {matches.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setStudent(st)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-vriddhi-accent/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-vriddhi-accent/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-vriddhi-accent">{st.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{st.name}</p>
                          <p className="text-xs text-vriddhi-muted truncate">{st.regNo || '—'} · {st.course || '—'} {st.batch ? `· ${st.batch}` : ''}</p>
                        </div>
                      </div>
                      <span className="text-xs text-vriddhi-accent font-medium whitespace-nowrap">Select →</span>
                    </button>
                  ))}
                  {matches.length === 0 && <p className="text-sm text-vriddhi-muted p-4">No match for “{search}”.</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-vriddhi-dark/40 border border-vriddhi-border">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                  <p className="text-xs text-vriddhi-muted">{student.regNo || '—'} · {student.course || '—'} {student.batch ? `· ${student.batch}` : ''}</p>
                </div>
                <button onClick={() => { setStudent(null); setFees([]); setShowNew(false) }} className="text-xs text-vriddhi-accent hover:underline">
                  Change student
                </button>
              </div>

              {loadingFees ? (
                <div className="flex items-center gap-2 text-sm text-vriddhi-muted py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading fees…</div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Outstanding fees</p>
                  {open.length === 0 && <p className="text-sm text-vriddhi-muted">No outstanding fees. Raise a new fee below to record a payment.</p>}
                  {open.map(f => {
                    const st = STATUS_CONFIG[f.status]
                    return (
                      <div key={f.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-vriddhi-border bg-vriddhi-dark/20">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">{f.category.replace(/_/g, ' ')} fee</p>
                          <p className="text-xs text-vriddhi-muted">Due {f.dueDate || '—'} · Paid ₹{f.paidAmount.toLocaleString('en-IN')} of ₹{f.amount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">₹{feeNetPayable(f).toLocaleString('en-IN')}</span>
                          <button onClick={() => onPick(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors">
                            Collect
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {closed.length > 0 && (
                    <p className="text-[11px] text-vriddhi-muted">{closed.length} settled / waived fee{closed.length === 1 ? '' : 's'} hidden.</p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-dashed border-vriddhi-border p-4 space-y-3">
                <button onClick={() => setShowNew(v => !v)} className="flex items-center gap-2 text-sm font-medium text-vriddhi-accent">
                  <PlusCircle className="w-4 h-4" /> {showNew ? 'Hide new fee' : 'Record a payment for a new / ad-hoc fee'}
                </button>
                {showNew && (
                  <div className="space-y-3">
                    {relevantStructures.length > 0 && (
                      <div>
                        <label className="text-sm text-vriddhi-muted mb-1 block">Start from a fee template (optional)</label>
                        <select value={structureId} onChange={e => applyStructure(e.target.value)} className="input-field">
                          <option value="">— None —</option>
                          {relevantStructures.map(st => (
                            <option key={st.id} value={st.id}>{st.name} · ₹{st.amount.toLocaleString('en-IN')}{st.course ? ` · ${st.course}` : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-vriddhi-muted mb-1 block">Fee type</label>
                        <select value={category} onChange={e => setCategory(e.target.value as FeeCategory)} className="input-field">
                          {FEE_CATEGORY_OPTIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-vriddhi-muted mb-1 block">Fee amount (₹)</label>
                        <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} className="input-field" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-vriddhi-muted mb-1 block">Description (printed on the receipt)</label>
                      <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. ID card replacement" className="input-field" />
                    </div>
                    <button
                      onClick={createAndCollect}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Create fee &amp; continue to payment
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Receipt ready (after a payment is recorded) ───────
function ReceiptReadyModal({
  payment, result, onDownload, onClose,
}: {
  payment: FeePayment
  result: CollectPaymentResult
  onDownload: () => Promise<void>
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md p-6 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-green-500/15 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Payment recorded</h2>
          <p className="text-sm text-vriddhi-muted mt-1">
            ₹{result.amount.toLocaleString('en-IN')} from {payment.studentName} · {result.paymentMode.toUpperCase()}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left">
          <div className="p-3 rounded-xl bg-vriddhi-dark/30">
            <p className="text-[10px] uppercase tracking-wider text-vriddhi-muted">Receipt No</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white">{result.receiptNo}</p>
          </div>
          <div className="p-3 rounded-xl bg-vriddhi-dark/30">
            <p className="text-[10px] uppercase tracking-wider text-vriddhi-muted">Transaction ID</p>
            <p className="text-sm font-mono text-slate-900 dark:text-white truncate">{result.transactionId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-vriddhi-muted bg-vriddhi-dark border border-vriddhi-border hover:bg-vriddhi-border/50 transition-colors">
            Done
          </button>
          <button
            onClick={async () => { setBusy(true); try { await onDownload() } finally { setBusy(false) } }}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-vriddhi-accent hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download receipt
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function AdminFeeManagement() {
  const { resolvedMode } = useThemeMode()
  const { showSuccess, showError } = useNotification()
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
    students,
    feeStructures,
    updateFilters,
    refreshData,
    collectPayment,
    verifyPaymentProof,
    applyDiscount,
    waiveFee,
    createFeePayment,
    createFeeStructure,
  } = useFeeData()

  const { rules: financeRules, branding } = useFinanceRules()
  const paymentModes = financeRules.enabledPaymentModes?.length ? financeRules.enabledPaymentModes : ALL_PAYMENT_MODES

  useEffect(() => {
    setReceiptPrefix(branding.receiptPrefix)
  }, [branding.receiptPrefix])

  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null)
  const [modalMode, setModalMode] = useState<'collect' | 'waive' | 'detail' | null>(null)
  const [showRecordPayment, setShowRecordPayment] = useState(false)
  const [receiptReady, setReceiptReady] = useState<{ payment: FeePayment; result: CollectPaymentResult } | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'overdue'>('overview')
  const [showAssignment, setShowAssignment] = useState(false)
  const [showStructure, setShowStructure] = useState(false)

  const handleCollect = async (
    amount: number,
    mode: PaymentMode,
    details: { transactionId: string; bankReference: string; paidOn: string; remarks: string; screenshotUrl?: string },
  ) => {
    if (!selectedPayment) return null
    const result = await collectPayment(selectedPayment.id, amount, mode, details.remarks, {
      transactionId: details.transactionId,
      bankReference: details.bankReference,
      paidOn: details.paidOn,
      screenshotUrl: details.screenshotUrl,
    })
    if (result) {
      showSuccess(`Payment recorded — receipt ${result.receiptNo}.`)
      // Snapshot the ledger as it will read after this credit, for the receipt.
      const paidAfter = Math.min(selectedPayment.amount, selectedPayment.paidAmount + result.amount)
      setReceiptReady({
        payment: { ...selectedPayment, paidAmount: paidAfter, status: paidAfter >= feeNetPayable({ ...selectedPayment, paidAmount: 0 }) ? 'paid' : 'partial' },
        result,
      })
    }
    return result
  }

  /** Build + download the receipt for one credited transaction. */
  const downloadTxnReceipt = async (payment: FeePayment, txn: {
    receiptNo?: string; transactionId?: string; bankReference?: string; paymentMode?: PaymentMode;
    amount: number; paidOn?: string; createdAt?: string; submissionStatus?: string; remarks?: string
  }) => {
    await downloadReceiptPdf(buildReceiptModel({
      payment,
      transaction: txn,
      branding,
      discountTotal: payment.discountTotal,
      lateFine: payment.lateFine,
      remarks: txn.remarks || undefined,
    }))
  }

  /** Row action: download the most recent receipt of a fee. */
  const downloadLatestReceipt = async (payment: FeePayment) => {
    setDownloadingId(payment.id)
    try {
      const txns = await fetchFeeTransactions(payment.id)
      const latest = txns.find(isReceiptable)
      if (latest) {
        await downloadTxnReceipt(payment, latest)
      } else if (payment.receiptNo) {
        // Legacy rows credited before the transactions trail existed.
        await downloadTxnReceipt(payment, {
          receiptNo: payment.receiptNo,
          transactionId: payment.transactionId,
          bankReference: payment.bankReference,
          paymentMode: payment.paymentMode,
          amount: payment.paidAmount,
          paidOn: payment.paidDate,
        })
      } else {
        showError('No receipt yet — record a payment for this fee first.')
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not generate the receipt.')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleVerifyProof = async (transactionId: string, decision: 'approve' | 'reject') => {
    if (!selectedPayment) return
    try {
      await verifyPaymentProof(selectedPayment.id, transactionId, decision)
      showSuccess(decision === 'approve' ? 'Payment verified and credited to the ledger.' : 'Submission rejected.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not update the submission.')
    }
  }

  const handleApplyDiscount = async (amount: number, label: string) => {
    if (!selectedPayment) return false
    try {
      const ok = await applyDiscount(selectedPayment.id, { amount, label })
      if (ok) showSuccess(`Discount of ₹${amount.toLocaleString('en-IN')} applied.`)
      return ok
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not apply the discount.')
      return false
    }
  }

  const handleWaive = async (remarks: string) => {
    if (!selectedPayment) return false
    const success = await waiveFee(selectedPayment.id, remarks)
    if (success) showSuccess('Fee waived and audit transaction recorded.')
    else showError('Fee could not be waived. Refresh the ledger and try again.')
    return success
  }

  const handleCreateInvoice = async (input: import('../api/feeApi').CreateFeePaymentInput) => {
    const created = await createFeePayment(input)
    if (created) showSuccess(`Fee invoice created for ${created.studentName}.`)
    else showError('Could not create the fee invoice.')
    return Boolean(created)
  }

  const handleCreateStructure = async (input: Omit<import('../api/feeApi').FeeStructure, 'id'>) => {
    const created = await createFeeStructure(input)
    if (created) showSuccess(`Fee template “${created.name}” saved.`)
    else showError('Could not save the fee template.')
    return Boolean(created)
  }

  const exportPayments = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const header = ['Student', 'Registration No', 'Course', 'Batch', 'Category', 'Amount', 'Paid', 'Outstanding', 'Status', 'Due Date', 'Receipt No']
    const rows = allPayments.map(payment => [
      payment.studentName, payment.regNo, payment.course, payment.batch, payment.category,
      payment.amount, payment.paidAmount, Math.max(0, payment.amount - payment.paidAmount),
      payment.status, payment.dueDate, payment.receiptNo || '',
    ])
    const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `fee-ledger-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Filter options come from the college's own data, not a hard-coded list.
  const courseOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const st of students) if (st.course) set.add(st.course)
    for (const p of allPayments) if (p.course) set.add(p.course)
    for (const f of feeStructures) if (f.course) set.add(f.course)
    if (filters.course !== 'all') set.add(filters.course)
    return [...set].sort()
  }, [students, allPayments, feeStructures, filters.course])
  const batchOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const st of students) if (st.batch) set.add(st.batch)
    for (const p of allPayments) if (p.batch) set.add(p.batch)
    if (filters.batch !== 'all') set.add(filters.batch)
    return [...set].sort()
  }, [students, allPayments, filters.batch])

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
            onClick={() => setShowRecordPayment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            <Wallet size={16} />
            Record payment
          </button>
          <button
            onClick={() => setShowStructure(true)}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border text-vriddhi-text rounded-xl text-sm hover:bg-vriddhi-border/50 transition-colors"
          >
            <BookOpen size={16} />
            New template
          </button>
          <button
            onClick={() => setShowAssignment(true)}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-accent text-white rounded-xl text-sm hover:bg-teal-600 transition-colors"
          >
            <CreditCard size={16} />
            Assign fee
          </button>
          <button
            onClick={exportPayments}
            disabled={allPayments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-vriddhi-card border border-vriddhi-border text-vriddhi-text rounded-xl text-sm hover:bg-vriddhi-border/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
          <Link
            to="/admin/finance-settings"
            title="Finance settings"
            className="flex items-center gap-2 px-3 py-2 bg-vriddhi-card border border-vriddhi-border text-vriddhi-text rounded-xl text-sm hover:bg-vriddhi-border/50 transition-colors"
          >
            <SettingsIcon size={16} />
          </Link>
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
                  {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
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
                  {batchOptions.map(b => (
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
                  <option value="university_exam">University Exam (BCU/BNU)</option>
                  <option value="eligibility">Eligibility (UUCMS)</option>
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
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/25 transition-colors"
                                    title="Record a payment against this fee"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" /> Collect
                                  </button>
                                )}
                                {payment.paidAmount > 0 && (
                                  <button
                                    onClick={() => downloadLatestReceipt(payment)}
                                    disabled={downloadingId === payment.id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-vriddhi-accent/15 text-vriddhi-accent hover:bg-vriddhi-accent/25 transition-colors disabled:opacity-50"
                                    title="Download the latest receipt (PDF)"
                                  >
                                    {downloadingId === payment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Receipt
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
              value={`₹${overduePayments.reduce((sum, p) => sum + Math.max(0, p.amount - p.paidAmount), 0).toLocaleString('en-IN')}`}
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
              value={`₹${overduePayments.length ? Math.round(overduePayments.reduce((sum, p) => sum + Math.max(0, p.amount - p.paidAmount), 0) / overduePayments.length).toLocaleString('en-IN') : 0}`}
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
                            ₹{Math.max(0, payment.amount - payment.paidAmount).toLocaleString('en-IN')}
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
          onApplyDiscount={handleApplyDiscount}
          paymentModes={paymentModes}
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
          onVerifyProof={handleVerifyProof}
          branding={branding}
          onCollect={() => setModalMode('collect')}
        />
      )}
      {showRecordPayment && (
        <RecordPaymentModal
          students={students}
          structures={feeStructures}
          onClose={() => setShowRecordPayment(false)}
          onPick={(payment) => { setShowRecordPayment(false); setSelectedPayment(payment); setModalMode('collect') }}
          onCreateInvoice={async (input) => {
            const created = await createFeePayment(input)
            if (!created) showError('Could not create the fee entry.')
            return created
          }}
        />
      )}
      {receiptReady && (
        <ReceiptReadyModal
          payment={receiptReady.payment}
          result={receiptReady.result}
          onClose={() => setReceiptReady(null)}
          onDownload={async () => {
            try {
              await downloadTxnReceipt(receiptReady.payment, { ...receiptReady.result, submissionStatus: 'recorded' })
            } catch {
              showError('Could not generate the receipt PDF.')
            }
          }}
        />
      )}
      {showAssignment && (
        <FeeAssignmentModal
          students={students}
          structures={feeStructures}
          onClose={() => setShowAssignment(false)}
          onSubmit={handleCreateInvoice}
        />
      )}
      {showStructure && (
        <FeeStructureModal
          onClose={() => setShowStructure(false)}
          onSubmit={handleCreateStructure}
        />
      )}
    </div>
  )
}