// src/modules/superadmin/services/templateSampleGuards.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Guards against the "uploaded B.Com, shows BBA" failure mode: the Excel
// template used to ship pre-filled with BBA sample data, and a college that
// filled its courses but left the Program Info sheet (or the example rows)
// got its whole upload labelled BBA. These tests pin the parser warnings
// that now surface that at preview time.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  TEMPLATE_SAMPLE_COURSES,
  TEMPLATE_SAMPLE_PROGRAM_INFO,
  TEMPLATE_SAMPLE_FINGERPRINT_THRESHOLD,
  detectTemplateSampleIssues,
} from './templateSampleGuards'

describe('template sample guard — blank Branch / Stream', () => {
  it('warns when Branch / Stream is blank (courses would fall back to General)', () => {
    const issues = detectTemplateSampleIssues(
      { 'Program Name': 'Bachelor of Commerce', 'Branch / Stream': '' },
      [{ code: 'COM 3.1', name: 'Cost Accounting' }]
    )
    const blank = issues.filter((issue) => issue.field === 'Branch / Stream')
    assert.equal(blank.length, 1)
    assert.equal(blank[0].severity, 'warning')
    assert.match(blank[0].message, /blank/i)
    assert.match(blank[0].message, /B\.Com/)
  })

  it('does not warn about Branch / Stream when it is filled', () => {
    const issues = detectTemplateSampleIssues(
      { 'Program Name': 'Bachelor of Commerce', 'Branch / Stream': 'B.Com' },
      [{ code: 'COM 3.1', name: 'Cost Accounting' }]
    )
    assert.equal(issues.filter((issue) => issue.field === 'Branch / Stream').length, 0)
  })
})

describe('template sample guard — untouched Program Info header', () => {
  it('warns when the template header fingerprint survives', () => {
    // The exact sheet a "courses replaced, header forgotten" upload produces:
    // every sample value still in place.
    const issues = detectTemplateSampleIssues(
      { ...TEMPLATE_SAMPLE_PROGRAM_INFO },
      [{ code: 'COM 3.1', name: 'Financial Accounting' }]
    )
    const sampleWarnings = issues.filter((issue) => issue.sheet === 'Program Info' && issue.row === 1)
    assert.equal(sampleWarnings.length, 1)
    assert.equal(sampleWarnings[0].severity, 'warning')
    assert.match(sampleWarnings[0].message, /Bachelor of Business Administration/)
    assert.match(sampleWarnings[0].message, /B\.Com/i)
  })

  it('warns once the fingerprint threshold is crossed, naming the matched fields', () => {
    const fields = Object.entries(TEMPLATE_SAMPLE_PROGRAM_INFO)
    const kept = new Map(fields.slice(0, TEMPLATE_SAMPLE_FINGERPRINT_THRESHOLD))
    const filled = Object.fromEntries([
      ...kept,
      ...fields.slice(TEMPLATE_SAMPLE_FINGERPRINT_THRESHOLD).map(([field]) => [field, 'My Value']),
    ])
    const issues = detectTemplateSampleIssues(filled as Record<string, string>, [])
    const sampleWarnings = issues.filter((issue) => issue.row === 1)
    assert.equal(sampleWarnings.length, 1)
    for (const [field] of kept) {
      assert.match(sampleWarnings[0].field, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
  })

  it('stays quiet when fewer than the threshold of common values match', () => {
    // "Bachelor of Business Administration" + "BBA" is what a genuine BBA
    // curriculum legitimately writes, and "2027-2028" a real academic year:
    // up to two such matches must never flag a real curriculum.
    const issues = detectTemplateSampleIssues(
      {
        'University Name': 'My University',
        'Program Name': 'Bachelor of Business Administration',
        'Branch / Stream': 'BBA',
        'Academic Year': '2027-2028',
        'Scheme / Regulation': 'NEP 2021',
        'Total Semesters': '8',
      },
      []
    )
    assert.equal(issues.filter((issue) => issue.row === 1).length, 0)
  })

  it('stays quiet for a correctly filled non-BBA program', () => {
    const issues = detectTemplateSampleIssues(
      {
        'University Name': 'My University',
        'Program Name': 'Bachelor of Commerce',
        'Branch / Stream': 'B.Com',
        'Academic Year': '2026-2027',
      },
      [{ code: 'COM 3.1', name: 'Financial Accounting' }]
    )
    assert.equal(issues.length, 0)
  })
})

describe('template sample guard — leftover example course rows', () => {
  it('warns when template example rows are still in the Course Matrix', () => {
    const issues = detectTemplateSampleIssues(
      { 'Branch / Stream': 'B.Com' },
      [
        { code: 'COM 3.1', name: 'Financial Accounting' },
        ...TEMPLATE_SAMPLE_COURSES.slice(0, 2).map((sample) => ({ code: sample.code, name: sample.name })),
      ]
    )
    const rowWarnings = issues.filter((issue) => issue.sheet === 'Course Matrix')
    assert.equal(rowWarnings.length, 1)
    assert.match(rowWarnings[0].message, /2 of the template's example rows/)
    assert.match(rowWarnings[0].message, /BBA 3\.1/)
  })

  it('ignores courses that only share a code or only a name with the samples', () => {
    const issues = detectTemplateSampleIssues(
      { 'Branch / Stream': 'B.Com' },
      [
        { code: 'BBA 3.1', name: 'Financial Accounting' }, // code reused, name differs
        { code: 'COM 3.1', name: 'Cost Accounting' }, // name reused, code differs
      ]
    )
    assert.equal(issues.filter((issue) => issue.sheet === 'Course Matrix').length, 0)
  })

  it('is case and whitespace insensitive when matching samples', () => {
    const issues = detectTemplateSampleIssues(
      { 'Branch / Stream': 'B.Com' },
      [{ code: ' bba 3.1 ', name: 'cost accounting' }]
    )
    assert.equal(issues.filter((issue) => issue.sheet === 'Course Matrix').length, 1)
  })
})
