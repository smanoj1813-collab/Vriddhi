import { Shield, Monitor } from 'lucide-react'

/** Do not confuse a saved preference with an enrolled authentication factor. */
export default function AccountSecurityNotice({ showSessions = false }: { showSessions?: boolean }) {
  return (
    <div className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-700/50">
      <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40" aria-label="Two-factor authentication availability">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Two-Factor Authentication</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Enrollment and status verification are not available in this portal.</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">A saved preference does not enable MFA. Contact your platform administrator to verify your account’s second-factor enrollment and sign-in requirements.</p>
        </div>
      </section>
      {showSessions && (
        <section className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40" aria-label="Session management availability">
          <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Session Management</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Session inventory and remote revocation are not available here.</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Use Sign out to end this browser’s session. For account-wide session revocation, contact your platform administrator. No example devices are shown as active sessions.</p>
          </div>
        </section>
      )}
    </div>
  )
}
