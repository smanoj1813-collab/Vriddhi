import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildMailMessage, escapeHtml, isValidEmail, parseMailConfig } from '../src/mailCore'

describe('parseMailConfig', () => {
  it('is null until keys are provided (flow now, keys later)', () => {
    assert.equal(parseMailConfig({}), null)
    assert.equal(parseMailConfig({ MAIL_FROM: 'not-an-email', SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p' }), null)
    assert.equal(parseMailConfig({ MAIL_FROM: 'a@b.in' }), null)
  })
  it('prefers SMTP and defaults the port', () => {
    const c = parseMailConfig({ MAIL_FROM: 'notify@college.edu.in', SMTP_HOST: 'smtp.x', SMTP_USER: 'u', SMTP_PASS: 'p', RESEND_API_KEY: 'rk' })
    assert.equal(c?.provider, 'smtp')
    assert.equal(c?.smtp?.port, 587)
    assert.equal(c?.smtp?.secure, false)
  })
  it('falls back to Resend; port 465 implies secure', () => {
    assert.equal(parseMailConfig({ MAIL_FROM: 'a@b.in', RESEND_API_KEY: 'rk' })?.provider, 'resend')
    assert.equal(parseMailConfig({ MAIL_FROM: 'a@b.in', SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_PORT: '465' })?.smtp?.secure, true)
  })
})

describe('buildMailMessage', () => {
  it('renders a fee receipt with subject, text and html', () => {
    const m = buildMailMessage('fee_receipt', 'A@Example.com', { studentName: 'Ananya Rao', collegeName: 'GFGC Mysuru', amount: '12,500', receiptNo: 'RCP/2026-27/0042', feeName: 'Tuition fee — Sem 3', balance: '0' })
    assert.equal(m.to, 'a@example.com')
    assert.match(m.subject, /RCP\/2026-27\/0042/)
    assert.match(m.text, /Rs\. 12,500/)
    assert.match(m.html, /GFGC Mysuru/)
  })
  it('escapes HTML in user-supplied values', () => {
    const m = buildMailMessage('announcement', 'a@b.in', { title: '<script>alert(1)</script>', message: 'Fees <b>due</b>', studentName: 'X' })
    assert.ok(!m.html.includes('<script>'))
    assert.match(m.html, /&lt;script&gt;/)
    assert.equal(escapeHtml(`a&<>"'`), 'a&amp;&lt;&gt;&quot;&#39;')
  })
  it('renders deadline + certificate kinds', () => {
    const d = buildMailMessage('exam_deadline', 'a@b.in', { studentName: 'Kiran Kumar', examName: 'BCU Sem 3 exams', lastDate: '22 Nov 2026', detail: 'Pay your university exam fee on UUCMS.' })
    assert.match(d.text, /22 Nov 2026/)
    const c = buildMailMessage('certificate_issued', 'a@b.in', { studentName: 'Kiran Kumar', certificateKind: 'Bonafide certificate', certificateNo: 'BC/2026-27/0001' })
    assert.match(c.subject, /Bonafide/)
  })
  it('validates email addresses', () => {
    assert.equal(isValidEmail('a@b.in'), true)
    assert.equal(isValidEmail('nope'), false)
    assert.equal(isValidEmail(''), false)
  })
})
