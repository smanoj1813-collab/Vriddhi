import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_CERTIFICATE_SETTINGS, academicYearLabel, canTransitionCertificate, certificateType,
  certificateVars, hasOpenRequest, normalizeCertificateSettings, renderCertificateBody, validateIssue,
} from './certificateEngine'

describe('certificate settings normalisation', () => {
  it('falls back to the five default certificate types', () => {
    const s = normalizeCertificateSettings(null)
    assert.equal(s.types.length, 5)
    assert.ok(certificateType(s, 'bonafide'))
    assert.ok(certificateType(s, 'Transfer'))
  })
  it('drops malformed/duplicate types and keeps valid custom ones', () => {
    const s = normalizeCertificateSettings({ types: [
      { kind: 'Bonafide', label: 'Study', prefix: 'bc', bodyTemplate: 'X {{name}}' },
      { kind: 'bonafide', label: 'dup', bodyTemplate: 'Y' },
      { kind: '', label: '', bodyTemplate: '' },
    ] })
    assert.equal(s.types.length, 1)
    assert.equal(s.types[0].prefix, 'BC')
  })
})

describe('issue validation', () => {
  const s = DEFAULT_CERTIFICATE_SETTINGS
  it('bonafide needs a purpose', () => {
    const def = certificateType(s, 'bonafide')!
    assert.match(validateIssue(def, { purpose: '' })!, /purpose/i)
    assert.equal(validateIssue(def, { purpose: 'SSP scholarship' }), null)
  })
  it('transfer needs a leaving reason; fee structure needs fee lines', () => {
    assert.match(validateIssue(certificateType(s, 'transfer')!, { purpose: '' })!, /leaving/i)
    assert.match(validateIssue(certificateType(s, 'fee_structure')!, { purpose: 'loan', feeLines: [] })!, /fee head/i)
    assert.equal(validateIssue(certificateType(s, 'fee_structure')!, { purpose: 'loan', feeLines: [{ label: 'Tuition', amount: 45000 }] }), null)
  })
})

describe('certificate body rendering', () => {
  it('renders a bonafide with student + college vars', () => {
    const def = certificateType(DEFAULT_CERTIFICATE_SETTINGS, 'bonafide')!
    const vars = certificateVars({
      student: { name: 'Ananya Rao', regNo: 'R2027001', programme: 'B.Com', semester: 3, batch: '2027', gender: 'female' },
      collegeName: 'Government First Grade College',
      extras: { purpose: 'SSP post-matric scholarship' },
      certificateNo: 'BC/2026-27/0007', date: '21 Oct 2026', on: new Date(2026, 9, 21),
    })
    const body = renderCertificateBody(def, vars)
    assert.match(body, /Ananya Rao/)
    assert.match(body, /R2027001/)
    assert.match(body, /2026-27/)
    assert.match(body, /SSP post-matric scholarship/)
    assert.ok(!body.includes('{{'), 'no unrendered placeholders')
  })
  it('academic year follows the June-May cycle', () => {
    assert.equal(academicYearLabel(new Date(2026, 5, 1)), '2026-27') // 1 Jun 2026
    assert.equal(academicYearLabel(new Date(2027, 2, 12)), '2026-27') // 12 Mar 2027
    assert.equal(academicYearLabel(new Date(2026, 4, 31)), '2025-26') // 31 May 2026
  })
})

describe('request lifecycle', () => {
  it('only requested → issued/rejected/cancelled', () => {
    assert.equal(canTransitionCertificate('requested', 'issued'), true)
    assert.equal(canTransitionCertificate('issued', 'cancelled'), false)
    assert.equal(canTransitionCertificate('rejected', 'issued'), false)
  })
  it('detects an already-open request of the same kind', () => {
    const existing = [{ studentId: 's1', studentUid: 'u1', kind: 'bonafide', status: 'requested' as const }]
    assert.equal(hasOpenRequest(existing, 's1', 'u1', 'bonafide'), true)
    assert.equal(hasOpenRequest(existing, 's1', 'u1', 'transfer'), false)
  })
})
