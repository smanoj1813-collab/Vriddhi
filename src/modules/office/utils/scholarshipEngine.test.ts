import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEFAULT_SCHOLARSHIP_SETTINGS, academicYearOf, daysToDeadline, hasDuplicateApplication,
  isLikelyEligible, normalizeScholarshipSettings, validateApplication,
} from './scholarshipEngine'

describe('normalizeScholarshipSettings', () => {
  it('ships SSP/NSP defaults and keeps custom schemes', () => {
    assert.ok(DEFAULT_SCHOLARSHIP_SETTINGS.schemes.some(s => s.portal === 'SSP'))
    assert.ok(DEFAULT_SCHOLARSHIP_SETTINGS.schemes.some(s => s.portal === 'NSP'))
    const s = normalizeScholarshipSettings({ schemes: [{ name: 'Alumni Trust Scholarship', portal: 'Private', lastDate: '2026-11-30' }] })
    assert.equal(s.schemes.length, 1)
    assert.equal(s.schemes[0].id, 'alumni-trust-scholarship')
    assert.equal(s.schemes[0].lastDate, '2026-11-30')
  })
})

describe('isLikelyEligible', () => {
  const scScheme = DEFAULT_SCHOLARSHIP_SETTINGS.schemes[0]
  it('matches category and income', () => {
    assert.equal(isLikelyEligible(scScheme, { category: 'SC', annualIncome: 180000 }), 'eligible')
    assert.equal(isLikelyEligible(scScheme, { category: 'General', annualIncome: 100000 }), 'unlikely')
    assert.equal(isLikelyEligible(scScheme, { category: 'SC', annualIncome: 900000 }), 'unlikely')
    assert.equal(isLikelyEligible(scScheme, {}), 'unknown')
  })
})

describe('duplicates, deadlines, validation', () => {
  it('blocks a second live application for the same scheme-year', () => {
    const apps = [{ schemeId: 'ssp', academicYear: '2026-27', status: 'applied' as const }]
    assert.equal(hasDuplicateApplication(apps, 'ssp', '2026-27'), true)
    assert.equal(hasDuplicateApplication(apps, 'ssp', '2025-26'), false)
    assert.equal(hasDuplicateApplication([{ schemeId: 'ssp', academicYear: '2026-27', status: 'rejected' as const }], 'ssp', '2026-27'), false)
  })
  it('computes deadline distance and academic year', () => {
    const s = { ...DEFAULT_SCHOLARSHIP_SETTINGS.schemes[0], lastDate: '2026-11-30' }
    assert.equal(daysToDeadline(s, new Date(2026, 10, 20)), 10)
    assert.equal(daysToDeadline(s, new Date(2026, 11, 5)), -5)
    assert.equal(academicYearOf(new Date(2026, 9, 21)), '2026-27')
    assert.equal(academicYearOf(new Date(2027, 1, 10)), '2026-27')
  })
  it('validates the application form', () => {
    assert.equal(validateApplication({ schemeId: '', academicYear: '2026-27', applicationNo: '' }).length, 1)
    assert.equal(validateApplication({ schemeId: 'ssp', academicYear: '2026-27', applicationNo: 'SSP2026/1234' }).length, 0)
  })
})
