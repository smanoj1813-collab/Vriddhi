import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, AlertTriangle, CheckCircle2, Database, FileClock, Gauge,
  Loader2, RefreshCw, Save, Settings2, ShieldCheck, Wrench, XCircle,
} from 'lucide-react'
import {
  useSystemAuditLogs,
  useSystemConfig,
  useSystemHealth,
  useUpdateSystemConfig,
} from '../hooks/useSuperAdmin'
import { useNotification } from '../../../shared/providers/NotificationProvider'
import type { SystemConfig } from '../types/superAdmin'

const DEFAULT_CONFIG: SystemConfig = {
  id: 'app',
  maintenanceMode: false,
  maintenanceMessage: 'Vriddhi is temporarily under maintenance. Please try again shortly.',
  allowCollegeOnboarding: true,
  defaultAcademicYear: new Date().getFullYear().toString(),
  feePolicy: {
    currency: 'INR',
    defaultLateFeePerDay: 0,
    gracePeriodDays: 7,
    enabledPaymentModes: ['cash', 'upi', 'card', 'netbanking', 'cheque', 'dd'],
  },
}

function statusStyles(status: string) {
  if (status === 'operational' || status === 'healthy') return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Operational' }
  if (status === 'degraded') return { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', label: 'Degraded' }
  return { icon: XCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', label: status === 'critical' ? 'Critical' : 'Unavailable' }
}

export default function SystemManagement() {
  const { showSuccess, showError } = useNotification()
  const health = useSystemHealth()
  const config = useSystemConfig()
  const audit = useSystemAuditLogs()
  const updateConfig = useUpdateSystemConfig()
  const [draft, setDraft] = useState<SystemConfig>(DEFAULT_CONFIG)

  useEffect(() => {
    if (config.data) setDraft(config.data)
  }, [config.data])

  const saveSettings = async () => {
    try {
      await updateConfig.mutateAsync({
        maintenanceMode: draft.maintenanceMode,
        maintenanceMessage: draft.maintenanceMessage,
        allowCollegeOnboarding: draft.allowCollegeOnboarding,
        defaultAcademicYear: draft.defaultAcademicYear,
        feePolicy: draft.feePolicy,
      })
      showSuccess('System settings saved to Firestore and added to the audit trail.')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'System settings could not be saved.')
    }
  }

  const overall = statusStyles(health.data?.overallStatus || 'degraded')
  const OverallIcon = overall.icon

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <Settings2 className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">System Management</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live Firestore diagnostics, platform controls and an accountable change history.</p>
        </div>
        <button onClick={() => { void health.refetch(); void audit.refetch() }} className="btn-secondary shrink-0">
          <RefreshCw className={`h-4 w-4 ${health.isFetching ? 'animate-spin' : ''}`} /> Refresh diagnostics
        </button>
      </div>

      <div className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${overall.bg} border-slate-200 dark:border-slate-800`}>
        <div className="flex items-center gap-3">
          <OverallIcon className={`h-7 w-7 ${overall.color}`} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Platform status</p>
            <p className={`text-lg font-extrabold ${overall.color}`}>{overall.label}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-right">
          <div><p className="text-xs text-slate-500">Firestore latency</p><p className="font-bold text-slate-900 dark:text-white">{health.data?.avgResponseTime || 0}ms</p></div>
          <div><p className="text-xs text-slate-500">24h error rate</p><p className="font-bold text-slate-900 dark:text-white">{(health.data?.errorRate24h || 0).toFixed(2)}%</p></div>
          <div><p className="text-xs text-slate-500">Tracked requests</p><p className="font-bold text-slate-900 dark:text-white">{(health.data?.totalRequests24h || 0).toLocaleString()}</p></div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="section-title mb-0 text-lg">Firestore connection map</h2><p className="text-xs text-slate-500">These checks are real reads against the collections used by the platform.</p></div>
          <Database className="h-5 w-5 text-teal-600" />
        </div>
        {health.isLoading ? <Loading /> : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(health.data?.services || []).map(service => {
              const style = statusStyles(service.status)
              const Icon = style.icon
              return <div key={service.name} className="vriddhi-card p-4">
                <div className="mb-3 flex items-start justify-between gap-2"><div className="rounded-xl bg-teal-50 p-2 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400"><Database className="h-4 w-4" /></div><span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${style.bg} ${style.color}`}><Icon className="h-3 w-3" />{style.label}</span></div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{service.name}</p>
                <div className="mt-3 flex justify-between text-xs text-slate-500"><span>Response</span><span className="font-semibold text-slate-700 dark:text-slate-300">{service.responseTime}ms</span></div>
                <div className="mt-1 flex justify-between text-xs text-slate-500"><span>Last checked</span><span>{new Date(service.lastChecked).toLocaleTimeString()}</span></div>
              </div>
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <section className="vriddhi-card p-5">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Wrench className="h-5 w-5 text-teal-600" />Operational controls</h2><p className="mt-1 text-xs text-slate-500">Saved in <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">systemConfig/app</code>. Changes are restricted to super admins.</p></div><ShieldCheck className="h-5 w-5 text-slate-400" /></div>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"><span><span className="block text-sm font-semibold text-slate-900 dark:text-white">Maintenance mode</span><span className="block text-xs text-slate-500">Signal to clients that a planned maintenance window is active.</span></span><input type="checkbox" checked={draft.maintenanceMode} onChange={event => setDraft({ ...draft, maintenanceMode: event.target.checked })} className="h-4 w-4 accent-teal-600" /></label>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"><span><span className="block text-sm font-semibold text-slate-900 dark:text-white">Allow college onboarding</span><span className="block text-xs text-slate-500">Controls whether new institutions can be created from the console.</span></span><input type="checkbox" checked={draft.allowCollegeOnboarding} onChange={event => setDraft({ ...draft, allowCollegeOnboarding: event.target.checked })} className="h-4 w-4 accent-teal-600" /></label>
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Maintenance message</label><textarea value={draft.maintenanceMessage} onChange={event => setDraft({ ...draft, maintenanceMessage: event.target.value })} rows={2} className="input-field resize-none" /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Default academic year</label><input value={draft.defaultAcademicYear} onChange={event => setDraft({ ...draft, defaultAcademicYear: event.target.value })} className="input-field" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Late fee / day (₹)</label><input type="number" min="0" value={draft.feePolicy.defaultLateFeePerDay} onChange={event => setDraft({ ...draft, feePolicy: { ...draft.feePolicy, defaultLateFeePerDay: Number(event.target.value) || 0 } })} className="input-field" /></div>
              <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Grace period (days)</label><input type="number" min="0" value={draft.feePolicy.gracePeriodDays} onChange={event => setDraft({ ...draft, feePolicy: { ...draft.feePolicy, gracePeriodDays: Number(event.target.value) || 0 } })} className="input-field" /></div>
            </div>
            <button onClick={() => void saveSettings()} disabled={updateConfig.isPending || config.isLoading} className="btn-primary w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{updateConfig.isPending ? 'Saving…' : 'Save settings'}</button>
          </div>
        </section>

        <section className="vriddhi-card p-5">
          <div className="mb-5 flex items-start justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><FileClock className="h-5 w-5 text-teal-600" />Recent audit trail</h2><p className="mt-1 text-xs text-slate-500">Who changed a platform control and when.</p></div><Activity className="h-5 w-5 text-slate-400" /></div>
          <div className="max-h-[370px] space-y-3 overflow-y-auto pr-1">
            {audit.isLoading ? <Loading /> : audit.data?.length ? audit.data.map(item => <div key={item.id} className="border-l-2 border-teal-200 pl-3 dark:border-teal-900"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.summary}</p><span className="whitespace-nowrap text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></div><p className="mt-0.5 text-xs text-slate-500">{item.actorName} · {item.area}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-900/50">No system changes recorded yet.</p>}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <span className="mr-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Gauge className="h-4 w-4" />Useful next actions</span>
        <Link to="/admin/fee-management" className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 dark:bg-teal-950/30 dark:text-teal-300">Open fee ledger</Link>
        <Link to="/superadmin/access" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Repair identities</Link>
        <Link to="/superadmin/health" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Detailed telemetry</Link>
      </div>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center py-10 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
}
