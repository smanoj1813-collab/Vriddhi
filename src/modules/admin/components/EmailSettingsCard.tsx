// Email delivery status + test send (admin Settings → Notifications).
// Transactional email is provider-configured at the platform level
// (functions/.env — see .env.example); this card shows whether delivery
// is live for this college and how the queue is doing. Until keys are
// set, messages are recorded as "skipped" instead of failing silently.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Loader2, MailCheck, MailWarning, Send } from 'lucide-react'
import { getMailStatus, sendTestEmail } from '@/shared/utils/mailApi'
import { useNotification } from '@/shared/providers/NotificationProvider'

export default function EmailSettingsCard() {
  const { showSuccess, showError } = useNotification()
  const [testing, setTesting] = useState(false)
  const statusQ = useQuery({ queryKey: ['mailStatus'], queryFn: getMailStatus, staleTime: 60_000 })
  const s = statusQ.data

  const runTest = async () => {
    setTesting(true)
    try {
      const r = await sendTestEmail()
      if (!r.configured) showError('Email is not configured yet — ask your Vriddhi administrator to set MAIL_FROM and provider keys.')
      else if (r.sent) showSuccess(`Test email sent via ${r.provider}. Check your inbox.`)
      else showError('Test email could not be sent.')
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Test email failed')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
          {s?.configured ? <MailCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" /> : <MailWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-white">Transactional Email</p>
          {statusQ.isLoading ? (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking delivery status…</p>
          ) : s?.configured ? (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
              Live via {s.provider} · from {s.from} · {s.counts.sent} sent, {s.counts.queued} queued, {s.counts.failed} failed
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5">
              Not configured yet. Fee receipts, hall-ticket, certificate and deadline emails are being recorded ({s?.counts.skipped ?? 0} skipped so far) and will deliver once the platform email keys are set. Announcements still reach students inside the app.
            </p>
          )}
        </div>
        <button
          onClick={runTest}
          disabled={testing || statusQ.isLoading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50 shrink-0"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send test email
        </button>
      </div>
    </div>
  )
}
