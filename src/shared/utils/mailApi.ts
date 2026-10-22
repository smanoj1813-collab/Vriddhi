// Client wrappers for the transactional-email callables (functions/src/mail.ts).
// Delivery is "flow now, keys later": when no provider is configured the
// callable still records the mail and reports configured:false, so callers
// must treat email as best-effort and never block the main workflow on it.
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

export type MailKind = 'fee_receipt' | 'fee_reminder' | 'hall_ticket_ready' | 'result_published' | 'certificate_issued' | 'exam_deadline' | 'announcement' | 'generic'

const queueFn = httpsCallable<
  { kind: MailKind; studentIds: string[]; vars?: Record<string, string> },
  { queued: number; skippedNoEmail: number; configured: boolean }
>(functions, 'queueTransactionalEmail')

const statusFn = httpsCallable<
  Record<string, never>,
  { configured: boolean; provider: string | null; from: string | null; counts: { queued: number; sent: number; failed: number; skipped: number } }
>(functions, 'getMailStatus')

const testFn = httpsCallable<Record<string, never>, { configured: boolean; sent: boolean; provider: string | null; messageId?: string }>(functions, 'sendTestEmail')

/** Queue a templated email to students (addresses resolve server-side). */
export async function queueTransactionalEmail(kind: MailKind, studentIds: string[], vars?: Record<string, string>) {
  const res = await queueFn({ kind, studentIds, vars })
  return res.data
}

/** Best-effort variant for fire-and-forget hooks (never throws). */
export async function queueEmailQuietly(kind: MailKind, studentIds: string[], vars?: Record<string, string>): Promise<void> {
  try { await queueFn({ kind, studentIds, vars }) } catch { /* email is best-effort */ }
}

export async function getMailStatus() {
  const res = await statusFn({})
  return res.data
}

export async function sendTestEmail() {
  const res = await testFn({})
  return res.data
}
