import React, { useMemo, useState } from 'react'
import { Check, Copy, Download, Eye, EyeOff, Key, Mail, ShieldAlert } from 'lucide-react'
import {
  credentialsToCsv,
  downloadCsv,
  sendPasswordResetEmailTo,
  type CredentialRow,
} from '@/shared/services/identityBackend'

interface CredentialsTableProps {
  rows: CredentialRow[]
  /** Filename stem for the CSV download. */
  filename?: string
  /** Heading shown above the table. */
  title?: string
}

/**
 * One-time credential panel shared by the student and faculty importers.
 *
 * Rules this encodes:
 *  - passwords are masked by default and never persisted (no Firestore write,
 *    no localStorage) — the table exists only for as long as the result state;
 *  - every row that already had an account exposes "send reset link" instead of
 *    pretending to know a password;
 *  - a row the backend could not verify against Firebase Authentication is
 *    flagged, because that is the state where a login will fail.
 */
export default function CredentialsTable({
  rows,
  filename = 'vriddhi-credentials',
  title = 'Login credentials',
}: CredentialsTableProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [sent, setSent] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  const counts = useMemo(() => {
    const created = rows.filter((r) => r.status !== 'skipped' && (r.password || r.resetLink)).length
    const skipped = rows.filter((r) => r.status === 'skipped').length
    const unverified = rows.filter((r) => r.authVerified === false).length
    return { created, skipped, unverified }
  }, [rows])

  if (!rows.length) return null

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(text)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      window.prompt('Copy this value', text)
    }
  }

  const sendReset = async (email: string) => {
    setSent((prev) => ({ ...prev, [email]: 'sending' }))
    try {
      await sendPasswordResetEmailTo(email)
      setSent((prev) => ({ ...prev, [email]: 'sent' }))
    } catch {
      setSent((prev) => ({ ...prev, [email]: 'error' }))
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-teal-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {counts.created} issued · {counts.skipped} existing
            {counts.unverified ? ` · ${counts.unverified} NOT verified in Auth` : ''}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            {revealed ? 'Hide' : 'Show'} passwords
          </button>
          {counts.created > 0 && (
            <button
              type="button"
              onClick={() => {
                let total = 0
                rows.forEach((r) => {
                  total += r.email.length + (r.password?.length || 0) + (r.name?.length || 0)
                })
                // Refuse to export an obviously huge credential sheet: copy it
                // per row instead so it does not end up in a downloads folder.
                if (total > 200_000) {
                  window.alert('Too many credentials to export safely. Copy rows individually.')
                  return
                }
                downloadCsv(`${filename}.csv`, credentialsToCsv(rows))
              }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              <Download size={14} />
              Download CSV
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
        These credentials are shown once and are not stored anywhere in the app. Share them over a
        channel you control, then have each user set their own password — the “reset link” column
        works without you ever knowing it.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/70 sticky top-0">
            <tr className="text-slate-600 dark:text-slate-400 text-xs">
              <th className="text-left px-3 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">Role</th>
              <th className="text-left px-3 py-2 font-medium">Credential</th>
              <th className="text-right px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row, index) => {
              const secret = revealed ? row.password : row.password ? '••••••••••••' : undefined
              const key = `${row.email}-${index}`
              return (
                <tr key={key} className={row.authVerified === false ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                  <td className="px-3 py-2 text-slate-900 dark:text-white text-xs">
                    {row.name || '—'}
                    {row.status === 'reclaimed' && (
                      <span className="ml-1 text-[10px] uppercase text-amber-600">reclaimed</span>
                    )}
                    {row.status === 'skipped' && (
                      <span className="ml-1 text-[10px] uppercase text-slate-500">existing</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 text-xs font-mono">{row.email}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">{row.role || '—'}</td>
                  <td className="px-3 py-2 text-xs">
                    {row.password ? (
                      <button
                        type="button"
                        onClick={() => copy(row.password!)}
                        className="inline-flex items-center gap-1 font-mono text-teal-700 dark:text-teal-300"
                        title="Copy password"
                      >
                        {secret}
                        {copied === row.password ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    ) : row.resetLink ? (
                      <button
                        type="button"
                        onClick={() => copy(row.resetLink!)}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-300"
                        title="Copy reset link"
                      >
                        {revealed ? 'reset link' : '•••• (link)'}
                        {copied === row.resetLink ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-500">unchanged — send a reset link</span>
                    )}
                    {row.authVerified === false && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300">
                        <ShieldAlert size={12} /> not verified in Auth
                      </span>
                    )}
                    {row.error && <div className="text-[11px] text-rose-600 mt-0.5">{row.error}</div>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => sendReset(row.email)}
                      disabled={sent[row.email] === 'sending'}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
                    >
                      <Mail size={13} />
                      {sent[row.email] === 'sent'
                        ? 'Email sent'
                        : sent[row.email] === 'sending'
                          ? 'Sending…'
                          : sent[row.email] === 'error'
                            ? 'Failed — retry'
                            : 'Send reset link'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
