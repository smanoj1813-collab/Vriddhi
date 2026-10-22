// functions/src/mail.ts
//
// Transactional email delivery.
//
//   colleges/{collegeId}/mail/{id} — one queued message per recipient.
//   Created by enqueueMail() (server-side) or queueTransactionalEmail
//   (staff callable). The onDocumentCreated trigger delivers through the
//   configured provider (SMTP via nodemailer, or Resend over fetch) and
//   stamps the outcome on the document: queued → sent | failed |
//   skipped_unconfigured.
//
// "Flow now, keys later" (same contract as payments.ts): until
// MAIL_FROM + provider keys are set (see mailCore.parseMailConfig),
// messages are recorded and skipped — nothing else breaks.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { buildMailMessage, isValidEmail, parseMailConfig, MAIL_KINDS, type MailConfig, type MailKind, type MailMessage } from './mailCore'

const getDb = () => admin.firestore()
const QUEUE_ROLES = ['superadmin', 'principal', 'admin', 'hod', 'accounts', 'operations', 'employee', 'faculty', 'mentor']
const MAX_RECIPIENTS_PER_CALL = 500

export function mailConfig(): MailConfig | null {
  return parseMailConfig(process.env as Record<string, string | undefined>)
}

export interface EnqueueMailInput {
  collegeId: string
  kind: MailKind
  to: string
  vars: Record<string, string>
  studentId?: string
  source?: string
}

/** Queue one templated message for the delivery trigger. Never throws on a bad address — it records and skips. */
export async function enqueueMail(input: EnqueueMailInput): Promise<string | null> {
  if (!input.collegeId || !isValidEmail(input.to)) return null
  const msg = buildMailMessage(input.kind, input.to, input.vars)
  const ref = await getDb().collection('colleges').doc(input.collegeId).collection('mail').add({
    kind: input.kind,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
    ...(input.studentId ? { studentId: input.studentId } : {}),
    ...(input.source ? { source: input.source } : {}),
    status: 'queued',
    attempts: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  return ref.id
}

async function sendViaSmtp(cfg: MailConfig, msg: MailMessage, fromHeader: string): Promise<string> {
  const nodemailer = (await import('nodemailer')).default
  const transport = nodemailer.createTransport({
    host: cfg.smtp!.host, port: cfg.smtp!.port, secure: cfg.smtp!.secure,
    auth: { user: cfg.smtp!.user, pass: cfg.smtp!.pass },
  })
  const info = await transport.sendMail({ from: fromHeader, to: msg.to, subject: msg.subject, text: msg.text, html: msg.html })
  return String(info.messageId || '')
}

async function sendViaResend(cfg: MailConfig, msg: MailMessage, fromHeader: string): Promise<string> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromHeader, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
  })
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!res.ok) throw new Error(`Resend ${res.status}: ${data.message || 'send failed'}`)
  return String(data.id || '')
}

/** Deliver one queued message now. Shared by the trigger and the test callable. */
export async function deliverMail(cfg: MailConfig, msg: MailMessage, collegeName?: string): Promise<string> {
  const fromHeader = `${collegeName || cfg.fromName} <${cfg.from}>`
  return cfg.provider === 'smtp' ? sendViaSmtp(cfg, msg, fromHeader) : sendViaResend(cfg, msg, fromHeader)
}

export const onMailQueued = onDocumentCreated(
  { document: 'colleges/{collegeId}/mail/{mailId}', region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, maxInstances: 20 },
  async (event) => {
    const snap = event.data
    if (!snap) return
    const data = snap.data()
    if (data.status !== 'queued') return
    const cfg = mailConfig()
    if (!cfg) {
      await snap.ref.update({ status: 'skipped_unconfigured', attemptedAt: admin.firestore.FieldValue.serverTimestamp() })
      logger.info('[Mail] skipped (no provider configured)', { collegeId: event.params.collegeId, kind: data.kind })
      return
    }
    try {
      const collegeSnap = await getDb().collection('colleges').doc(event.params.collegeId).get()
      const collegeName = String(collegeSnap.data()?.name || '')
      const messageId = await deliverMail(cfg, { to: String(data.to), subject: String(data.subject), text: String(data.text), html: String(data.html) }, collegeName)
      await snap.ref.update({
        status: 'sent', provider: cfg.provider, providerMessageId: messageId,
        attempts: admin.firestore.FieldValue.increment(1),
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (error) {
      logger.error('[Mail] delivery failed', { collegeId: event.params.collegeId, error: String(error).slice(0, 300) })
      await snap.ref.update({
        status: 'failed', provider: cfg.provider, error: String(error).slice(0, 500),
        attempts: admin.firestore.FieldValue.increment(1),
        attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
      }).catch(() => {})
    }
  }
)

interface MailStaff { uid: string; role: string; collegeId: string; email: string }

async function resolveMailStaff(uid: string, token: Record<string, unknown>): Promise<MailStaff> {
  const userDoc = await getDb().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '').toLowerCase()
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !QUEUE_ROLES.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', 'College staff access is required')
  }
  return { uid, role, collegeId, email: String(user?.email || '') }
}

/** Delivery status for the admin Settings card. Never leaks keys. */
export const getMailStatus = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveMailStaff(uid, request.auth?.token || {})
    const cfg = mailConfig()
    let queued = 0, sent = 0, failed = 0, skipped = 0
    if (staff.collegeId) {
      const snap = await getDb().collection('colleges').doc(staff.collegeId).collection('mail').limit(1000).get()
      for (const d of snap.docs) {
        const s = String(d.data().status || '')
        if (s === 'queued') queued += 1
        else if (s === 'sent') sent += 1
        else if (s === 'failed') failed += 1
        else if (s === 'skipped_unconfigured') skipped += 1
      }
    }
    return {
      configured: !!cfg,
      provider: cfg?.provider || null,
      from: cfg?.from || null,
      counts: { queued, sent, failed, skipped },
    }
  }
)

/** Send the caller a test message immediately (not via the queue). */
export const sendTestEmail = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 5 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveMailStaff(uid, request.auth?.token || {})
    if (!['superadmin', 'principal', 'admin'].includes(staff.role)) {
      throw new HttpsError('permission-denied', 'Only the principal or a college admin can send a test email')
    }
    const cfg = mailConfig()
    if (!cfg) return { configured: false, sent: false, provider: null }
    if (!isValidEmail(staff.email)) throw new HttpsError('failed-precondition', 'Your account has no email address to test with')
    const msg = buildMailMessage('test', staff.email, { collegeName: cfg.fromName })
    const messageId = await deliverMail(cfg, msg)
    return { configured: true, sent: true, provider: cfg.provider, messageId }
  }
)

/**
 * Queue a templated email to students of the caller's college. Recipients
 * resolve server-side from student documents (never from client-supplied
 * addresses), so a staff session cannot turn this into a spam relay.
 */
export const queueTransactionalEmail = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 120, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveMailStaff(uid, request.auth?.token || {})
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = staff.role === 'superadmin' ? String(input.collegeId || staff.collegeId || '') : staff.collegeId
    if (!collegeId) throw new HttpsError('invalid-argument', 'College is required')
    const kind = String(input.kind || '') as MailKind
    if (!(MAIL_KINDS as readonly string[]).includes(kind) || kind === 'test') {
      throw new HttpsError('invalid-argument', 'Unknown email kind')
    }
    const vars = (input.vars && typeof input.vars === 'object' && !Array.isArray(input.vars) ? input.vars : {}) as Record<string, unknown>
    const studentIds = Array.isArray(input.studentIds) ? input.studentIds.map(String).filter(Boolean).slice(0, MAX_RECIPIENTS_PER_CALL) : []
    if (!studentIds.length) throw new HttpsError('invalid-argument', 'Choose at least one student')

    const collegeSnap = await getDb().collection('colleges').doc(collegeId).get()
    const collegeName = String(collegeSnap.data()?.name || '')
    const sharedVars: Record<string, string> = { collegeName, appUrl: String(process.env.APP_URL || '') }
    for (const [k, v] of Object.entries(vars)) sharedVars[k] = String(v ?? '').slice(0, 500)

    let queued = 0
    let skippedNoEmail = 0
    for (let i = 0; i < studentIds.length; i += 100) {
      const chunk = studentIds.slice(i, i + 100)
      const docs = await getDb().getAll(...chunk.map(id => getDb().collection('students').doc(id)))
      for (const doc of docs) {
        if (!doc.exists) continue
        const s = doc.data() || {}
        if (String(s.collegeId || '') !== collegeId) continue
        const email = String(s.email || '')
        if (!isValidEmail(email)) { skippedNoEmail += 1; continue }
        const id = await enqueueMail({
          collegeId, kind, to: email, studentId: doc.id, source: 'queueTransactionalEmail',
          vars: { ...sharedVars, studentName: String(s.name || 'Student') },
        })
        if (id) queued += 1
      }
    }
    logger.info('[Mail] queued transactional email', { collegeId, kind, queued, skippedNoEmail, by: uid })
    return { queued, skippedNoEmail, configured: !!mailConfig() }
  }
)
