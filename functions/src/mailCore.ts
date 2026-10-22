// functions/src/mailCore.ts
//
// Pure transactional-email core: provider config parsing and the mail
// templates a college actually sends (fee receipts, hall tickets, exam
// deadline reminders, certificates, announcements). Kept dependency-free
// so unit tests pin the rendered output; delivery lives in mail.ts.

export type MailProvider = 'smtp' | 'resend'

export interface MailConfig {
  provider: MailProvider
  from: string
  /** Display name used when a college has no name on the message. */
  fromName: string
  smtp?: { host: string; port: number; secure: boolean; user: string; pass: string }
  resendApiKey?: string
}

/**
 * "Flow now, keys later" (same contract as payments.ts): with no provider
 * keys the config is null, mail is recorded as skipped_unconfigured, and
 * the product keeps working. SMTP wins when both are configured.
 *
 * Env: MAIL_FROM (required), MAIL_FROM_NAME,
 *      SMTP_HOST / SMTP_PORT (default 587) / SMTP_SECURE / SMTP_USER / SMTP_PASS,
 *      or RESEND_API_KEY.
 */
export function parseMailConfig(env: Record<string, string | undefined>): MailConfig | null {
  const from = String(env.MAIL_FROM || '').trim()
  if (!from || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) return null
  const fromName = String(env.MAIL_FROM_NAME || 'Vriddhi').trim() || 'Vriddhi'
  const host = String(env.SMTP_HOST || '').trim()
  const user = String(env.SMTP_USER || '').trim()
  const pass = String(env.SMTP_PASS || '')
  if (host && user && pass) {
    const port = Number(env.SMTP_PORT) || 587
    return {
      provider: 'smtp', from, fromName,
      smtp: { host, port, secure: String(env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465, user, pass },
    }
  }
  const resendApiKey = String(env.RESEND_API_KEY || '').trim()
  if (resendApiKey) return { provider: 'resend', from, fromName, resendApiKey }
  return null
}

export const MAIL_KINDS = [
  'fee_receipt', 'fee_reminder', 'hall_ticket_ready', 'result_published',
  'certificate_issued', 'exam_deadline', 'announcement', 'generic', 'test',
] as const
export type MailKind = (typeof MAIL_KINDS)[number]

export interface MailMessage { to: string; subject: string; text: string; html: string }

export function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

const v = (vars: Record<string, string>, key: string, fallback = '') => String(vars[key] ?? fallback)

function wrap(college: string, title: string, paragraphs: string[], cta?: { label: string; url: string }): { text: string; html: string } {
  const text = [title, '', ...paragraphs, ...(cta?.url ? ['', `${cta.label}: ${cta.url}`] : []), '', `— ${college}`].join('\n')
  const paras = paragraphs.map(p => `<p style="margin:0 0 12px;font-size:14px;line-height:1.55;color:#1e293b">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`).join('')
  const button = cta?.url
    ? `<p style="margin:18px 0"><a href="${escapeHtml(cta.url)}" style="background:#0d9488;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:600">${escapeHtml(cta.label)}</a></p>`
    : ''
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif">
<div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<div style="background:#0d9488;padding:16px 22px"><p style="margin:0;color:#ffffff;font-size:15px;font-weight:700">${escapeHtml(college)}</p></div>
<div style="padding:22px"><h1 style="margin:0 0 14px;font-size:18px;color:#0f172a">${escapeHtml(title)}</h1>${paras}${button}
<p style="margin:18px 0 0;font-size:12px;color:#64748b">Sent by your college via Vriddhi. Please do not reply to this automated email — contact the college office for help.</p>
</div></div></body></html>`
  return { text, html }
}

/**
 * Render one templated message. Vars by kind (all strings):
 *  common: studentName, collegeName, appUrl
 *  fee_receipt: amount, receiptNo, feeName, balance
 *  fee_reminder: amount, feeName, dueDate
 *  hall_ticket_ready: examName
 *  result_published: examName
 *  certificate_issued: certificateKind, certificateNo
 *  exam_deadline: examName, lastDate, detail
 *  announcement/generic: title, message
 *  test: (none)
 */
export function buildMailMessage(kind: MailKind, to: string, vars: Record<string, string>): MailMessage {
  const college = v(vars, 'collegeName', 'Your College')
  const name = v(vars, 'studentName', 'Student')
  const appUrl = v(vars, 'appUrl')
  const greet = `Dear ${name},`
  let subject = ''
  let title = ''
  let paras: string[] = []
  let cta: { label: string; url: string } | undefined = appUrl ? { label: 'Open Vriddhi', url: appUrl } : undefined

  switch (kind) {
    case 'fee_receipt':
      subject = `Fee receipt ${v(vars, 'receiptNo')} — payment received`
      title = 'Payment received'
      paras = [greet, `We have received your payment of Rs. ${v(vars, 'amount')}${v(vars, 'feeName') ? ` towards ${v(vars, 'feeName')}` : ''}. Receipt number: ${v(vars, 'receiptNo')}.${v(vars, 'balance') ? ` Balance remaining: Rs. ${v(vars, 'balance')}.` : ''} You can download the receipt PDF any time from Fees in your student portal.`]
      break
    case 'fee_reminder':
      subject = `Fee payment reminder${v(vars, 'feeName') ? ` — ${v(vars, 'feeName')}` : ''}`
      title = 'Fee payment reminder'
      paras = [greet, `This is a reminder that ${v(vars, 'feeName', 'your fee')} of Rs. ${v(vars, 'amount')} is due${v(vars, 'dueDate') ? ` by ${v(vars, 'dueDate')}` : ''}. Please pay at the college office or through the student portal before the due date to avoid late fees. If you have already paid, please ignore this message.`]
      break
    case 'hall_ticket_ready':
      subject = `Your hall ticket is ready — ${v(vars, 'examName', 'examination')}`
      title = 'Hall ticket ready'
      paras = [greet, `Your hall ticket for ${v(vars, 'examName', 'the upcoming examination')} is ready. Download it from Hall Tickets in your student portal and carry a printed copy with your college ID card to every examination.`]
      break
    case 'result_published':
      subject = `Results published — ${v(vars, 'examName', 'examination')}`
      title = 'Results published'
      paras = [greet, `Results for ${v(vars, 'examName', 'your examination')} have been published. View your marks and grades under Grades in your student portal.`]
      break
    case 'certificate_issued':
      subject = `Your ${v(vars, 'certificateKind', 'certificate')} is ready`
      title = 'Certificate issued'
      paras = [greet, `Your ${v(vars, 'certificateKind', 'certificate')} (${v(vars, 'certificateNo')}) has been issued. Download the PDF from My Certificates in your student portal. Collect the signed original from the college office if you need a physical copy.`]
      break
    case 'exam_deadline':
      subject = `Last date approaching — ${v(vars, 'examName', 'examination')}`
      title = 'Examination deadline reminder'
      paras = [greet, `${v(vars, 'detail', 'Please complete your examination formalities')} The last date is ${v(vars, 'lastDate')}. Students who miss this date may not be able to appear for ${v(vars, 'examName', 'the examination')}, so act today and keep your acknowledgement safe.`]
      break
    case 'announcement':
    case 'generic':
      subject = v(vars, 'title', 'College announcement')
      title = v(vars, 'title', 'College announcement')
      paras = [greet, v(vars, 'message')]
      break
    case 'test':
      subject = 'Vriddhi email delivery test'
      title = 'Email delivery works'
      paras = ['This is a test message confirming that transactional email is configured correctly for your college. Students will receive fee receipts, hall-ticket and deadline emails from this sender.']
      cta = undefined
      break
  }
  const { text, html } = wrap(college, title, paras, cta)
  return { to: String(to || '').trim().toLowerCase(), subject, text, html }
}

export function isValidEmail(to: unknown): boolean {
  const s = String(to || '').trim()
  return s.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)
}
