import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useSubscriptionPlans,
  useCollegeSubscriptions,
  usePaymentHistory,
  useRenewalAlerts,
  useUpdateSubscriptionPlan,
  useToggleAutoRenew,
  useSendRenewalReminder,
} from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import {
  CreditCard, Calendar, AlertTriangle, CheckCircle2, XCircle,
  Clock, ArrowLeft, Download, Bell, RefreshCw, ChevronDown,
  ChevronUp, Eye, Zap, Shield, Crown, Building2, IndianRupee,
  Mail, TrendingUp, TrendingDown, Minus, Filter, Search
} from 'lucide-react'
import type { SubscriptionPlan, CollegeSubscription, PaymentHistory, RenewalAlert, PaymentStatus } from '../api/superAdminApi'

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  basic: { bg: 'bg-slate-800', border: 'border-slate-600', text: 'text-slate-300', icon: 'text-slate-400' },
  standard: { bg: 'bg-blue-900/30', border: 'border-blue-600/50', text: 'text-blue-300', icon: 'text-blue-400' },
  premium: { bg: 'bg-purple-900/30', border: 'border-purple-600/50', text: 'text-purple-300', icon: 'text-purple-400' },
  enterprise: { bg: 'bg-amber-900/30', border: 'border-amber-600/50', text: 'text-amber-300', icon: 'text-amber-400' },
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400' },
  trial: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  trialing: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  expired: { bg: 'bg-red-500/10', text: 'text-red-400' },
  suspended: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  cancelled: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
  past_due: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  canceled: { bg: 'bg-slate-500/10', text: 'text-slate-400' },
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; icon: any }> = {
  paid: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle2 },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
  overdue: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  refunded: { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: Minus },
}

const PlanCard: React.FC<{ plan: SubscriptionPlan; isPopular?: boolean }> = ({ plan, isPopular }) => {
  const colors = PLAN_COLORS[plan.type]
  const Icon = plan.type === 'enterprise' ? Crown : plan.type === 'premium' ? Shield : plan.type === 'standard' ? Zap : Building2

  return (
    <div className={`relative rounded-xl border p-5 ${colors.bg} ${colors.border} ${isPopular ? 'ring-2 ring-blue-500/50' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-slate-900 dark:text-white text-xs font-bold rounded-full">
          Most Popular
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${colors.text}`}>{plan.name}</h3>
          <p className="text-xs text-slate-500 capitalize">{plan.billingCycle} billing</p>
        </div>
      </div>
      <div className="mb-4">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">₹{plan.price.toLocaleString()}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
      </div>
      <ul className="space-y-2 mb-5">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
          <p className="text-slate-900 dark:text-white font-semibold">{plan.maxStudents === 999999 ? '∞' : plan.maxStudents.toLocaleString()}</p>
          <p className="text-slate-500 dark:text-slate-400">Students</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
          <p className="text-slate-900 dark:text-white font-semibold">{plan.maxFaculty === 999999 ? '∞' : plan.maxFaculty}</p>
          <p className="text-slate-500 dark:text-slate-400">Faculty</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2">
          <p className="text-slate-900 dark:text-white font-semibold">{plan.maxStorageGB === 999999 ? '∞' : `${plan.maxStorageGB}GB`}</p>
          <p className="text-slate-500 dark:text-slate-400">Storage</p>
        </div>
      </div>
    </div>
  )
}

const SubscriptionRow: React.FC<{
  sub: CollegeSubscription;
  onToggleAutoRenew: (id: string, enabled: boolean) => void;
  onChangePlan: (collegeId: string) => void;
}> = ({ sub, onToggleAutoRenew, onChangePlan }) => {
  const colors = PLAN_COLORS[sub.plan.type]
  const statusColors = STATUS_COLORS[sub.status]
  const studentsUsed = sub.usage.studentsUsed ?? sub.usage.students.used ?? 0
  const facultyUsed = sub.usage.facultyUsed ?? sub.usage.faculty.used ?? 0
  const storageUsedGB = sub.usage.storageUsedGB ?? sub.usage.storage.used ?? 0
  const studentPercent = Math.min((studentsUsed / sub.plan.maxStudents) * 100, 100)
  const storagePercent = Math.min((storageUsedGB / sub.plan.maxStorageGB) * 100, 100)

  return (
    <div className="glass-card p-5 mb-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <Building2 className={`w-5 h-5 ${colors.icon}`} />
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold">{sub.collegeName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{sub.collegeCode} • {sub.plan.name} Plan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
            {sub.status}
          </span>
          {sub.status === 'trialing' && sub.trialEndsAt && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
              Trial ends {new Date(sub.trialEndsAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400">Students</span>
            <span className={`font-medium ${studentPercent > 90 ? 'text-red-400' : studentPercent > 75 ? 'text-yellow-400' : 'text-slate-300'}`}>
              {studentsUsed.toLocaleString()} / {sub.plan.maxStudents === 999999 ? '∞' : sub.plan.maxStudents.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${studentPercent > 90 ? 'bg-red-500' : studentPercent > 75 ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${studentPercent}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400">Faculty</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {facultyUsed} / {sub.plan.maxFaculty === 999999 ? '∞' : sub.plan.maxFaculty}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${Math.min((facultyUsed / sub.plan.maxFaculty) * 100, 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 dark:text-slate-400">Storage</span>
            <span className={`font-medium ${storagePercent > 90 ? 'text-red-400' : storagePercent > 75 ? 'text-yellow-400' : 'text-slate-300'}`}>
              {storageUsedGB.toFixed(1)}GB / {sub.plan.maxStorageGB === 999999 ? '∞' : `${sub.plan.maxStorageGB}GB`}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${storagePercent > 90 ? 'bg-red-500' : storagePercent > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${storagePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Billing Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Next billing: <span className="text-slate-700 dark:text-slate-300">{new Date(sub.nextBillingDate).toLocaleDateString()}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <IndianRupee className="w-3.5 h-3.5" />
          <span>₹{sub.plan.price.toLocaleString()}/month</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-slate-600 dark:text-slate-400">Auto-renew</span>
            <div
              onClick={() => onToggleAutoRenew(sub.id, !sub.autoRenew)}
              className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${sub.autoRenew ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform absolute top-0.5 left-0.5 ${sub.autoRenew ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
          <button
            onClick={() => onChangePlan(sub.collegeId)}
            className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-100 dark:bg-blue-900/30 rounded-lg transition-colors"
          >
            Change Plan
          </button>
        </div>
      </div>
    </div>
  )
}

const SubscriptionBilling: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments' | 'alerts' | 'plans'>('subscriptions')
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlanCollege, setSelectedPlanCollege] = useState<string | null>(null)

  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans()
  const { data: subscriptions, isLoading: subsLoading } = useCollegeSubscriptions()
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentHistory(paymentFilter === 'all' ? undefined : { status: paymentFilter })
  const { data: alerts, isLoading: alertsLoading } = useRenewalAlerts()

  const updatePlan = useUpdateSubscriptionPlan()
  const toggleRenew = useToggleAutoRenew()
  const sendReminder = useSendRenewalReminder()

  // Extract items array from PaginatedResult
  const payments = paymentsData?.items || paymentsData?.data || []

  const filteredPayments = useMemo(() => {
    if (!payments || payments.length === 0) return []
    return payments.filter((p: PaymentHistory) =>
      searchQuery === '' ||
      p.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [payments, searchQuery])

  const filteredSubscriptions = useMemo(() => {
    if (!subscriptions) return []
    return subscriptions.filter(s =>
      searchQuery === '' ||
      s.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.collegeCode.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [subscriptions, searchQuery])

  const handleToggleAutoRenew = async (subId: string, enabled: boolean) => {
    try {
      await toggleRenew.mutateAsync({ subscriptionId: subId, enabled })
      showSuccess(`Auto-renew ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      showError('Failed to update auto-renew')
    }
  }

  const handleSendReminder = async (collegeId: string) => {
    try {
      await sendReminder.mutateAsync(collegeId)
      showSuccess('Renewal reminder sent')
    } catch {
      showError('Failed to send reminder')
    }
  }

  const handleChangePlan = async (collegeId: string, planId: string) => {
    try {
      await updatePlan.mutateAsync({ collegeId, planId })
      showSuccess('Plan updated successfully')
      setSelectedPlanCollege(null)
    } catch {
      showError('Failed to update plan')
    }
  }

  const handleExportPayments = () => {
    if (!payments || payments.length === 0) return
    const csv = [
      ['Invoice', 'College', 'Amount', 'Status', 'Method', 'Period', 'Paid At'].join(','),
      ...payments.map((p: PaymentHistory) => [
        p.invoiceNumber, p.collegeName, p.amount, p.status, p.method,
        `${p.periodStart} to ${p.periodEnd}`, p.paidAt || '—'
      ].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    showSuccess('Payment history exported')
  }

  const isLoading = subsLoading || plansLoading || paymentsLoading || alertsLoading

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400" />
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription & Billing</h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Manage college plans, payments, and renewals</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search colleges..."
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Renewal Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.filter(a => a.status === 'urgent').map(alert => (
            <div key={alert.id} className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">
                    {alert.collegeName} — {alert.planName} plan expires in {alert.daysUntilExpiry} day{alert.daysUntilExpiry !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-400/70">Amount due: ₹{alert.amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!alert.autoRenewEnabled && (
                  <button
                    onClick={() => handleSendReminder(alert.collegeId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Mail className="w-3 h-3" /> Send Reminder
                  </button>
                )}
                <button
                  onClick={() => setSelectedPlanCollege(alert.collegeId)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Renew Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 mb-6 w-fit">
        {([
          { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
          { key: 'payments', label: 'Payment History', icon: IndianRupee },
          { key: 'alerts', label: 'Renewal Alerts', icon: Bell },
          { key: 'plans', label: 'Plans', icon: Zap },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div>
          {filteredSubscriptions?.map(sub => (
            <SubscriptionRow
              key={sub.id}
              sub={sub}
              onToggleAutoRenew={handleToggleAutoRenew}
              onChangePlan={setSelectedPlanCollege}
            />
          ))}
          {filteredSubscriptions?.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No subscriptions found</p>
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
            <button onClick={handleExportPayments} className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-600 dark:border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left px-4 py-3 font-medium">Invoice</th>
                  <th className="text-left px-4 py-3 font-medium">College</th>
                  <th className="text-left px-4 py-3 font-medium">Description</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Method</th>
                  <th className="text-center px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments?.map((payment: PaymentHistory) => {
                  const statusConfig = PAYMENT_STATUS_COLORS[payment.status]
                  const StatusIcon = statusConfig.icon
                  return (
                    <tr key={payment.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono text-xs">{payment.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">{payment.collegeName}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{payment.description}</td>
                      <td className="px-4 py-3 text-right text-slate-900 dark:text-white font-medium">
                        {payment.amount > 0 ? `₹${payment.amount.toLocaleString()}` : 'Free'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          <StatusIcon className="w-3 h-3" />
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 capitalize">{payment.method}</td>
                      <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 text-xs">
                        {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredPayments?.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No payments found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-600 dark:border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-medium">College</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-center px-4 py-3 font-medium">Days Left</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-center px-4 py-3 font-medium">Auto-Renew</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts?.map((alert: RenewalAlert) => {
                const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
                  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle },
                  warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Clock },
                  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Bell },
                  notice: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Bell },
                }
                const sc = statusColors[alert.status] || statusColors.info
                const Icon = sc.icon
                return (
                  <tr key={alert.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{alert.collegeName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{alert.planName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${alert.daysUntilExpiry < 0 ? 'text-red-400' : alert.daysUntilExpiry <= 7 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {alert.daysUntilExpiry < 0 ? `${Math.abs(alert.daysUntilExpiry)} days overdue` : `${alert.daysUntilExpiry} days`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-900 dark:text-white">₹{alert.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {alert.autoRenewEnabled ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                        <Icon className="w-3 h-3" />
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!alert.autoRenewEnabled && (
                          <button
                            onClick={() => handleSendReminder(alert.collegeId)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Send reminder"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedPlanCollege(alert.collegeId)}
                          className="px-2 py-1 text-xs font-medium text-slate-900 dark:text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          Renew
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {alerts?.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No renewal alerts</p>
            </div>
          )}
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans?.map(plan => (
            <PlanCard key={plan.id} plan={plan} isPopular={plan.isPopular} />
          ))}
        </div>
      )}

      {/* Change Plan Modal */}
      {selectedPlanCollege && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Change Subscription Plan</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Select a new plan for this college</p>
            <div className="space-y-3 mb-6">
              {plans?.map(plan => {
                const colors = PLAN_COLORS[plan.type]
                const Icon = plan.type === 'enterprise' ? Crown : plan.type === 'premium' ? Shield : plan.type === 'standard' ? Zap : Building2
                return (
                  <button
                    key={plan.id}
                    onClick={() => handleChangePlan(selectedPlanCollege, plan.id)}
                    disabled={updatePlan.isPending}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                      colors.bg} ${colors.border} hover:scale-[1.02]`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${colors.text}`}>{plan.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{plan.maxStudents.toLocaleString()} students • {plan.maxFaculty} faculty</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 dark:text-white font-bold">₹{plan.price.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">/month</p>
                    </div>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setSelectedPlanCollege(null)}
              className="w-full py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionBilling
