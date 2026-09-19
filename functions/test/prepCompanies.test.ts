// functions/test/prepCompanies.test.ts
//
// Integrity tests for the company-specific placement prep catalogue:
// every company section maps to real aptitude topics, patterns carry a
// verification date and sources, and the validator catches the common
// authoring mistakes.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  validateCompanyCatalog,
  companyTopicIds,
  normaliseCompanyPrepSettings,
  applyCompanyPrepSettings,
  isCompanyVisibleForCollege,
  resolveSeedPrograms,
  PREP_PROGRAM_CODES,
  PREP_SEED_CODES,
  type PrepCompany,
} from '../src/prepShared.ts'
import { SEEDED_COMPANIES, COMPANY_TOPIC_GROUPS } from '../src/data/companySeedData.ts'
import { SEEDED_APTITUDE_TOPICS, APTITUDE_SUBJECTS } from '../src/data/aptitudeSeedData.ts'

const KNOWN = new Set(Object.values(SEEDED_APTITUDE_TOPICS).flat().map((t) => t.id))

describe('company prep catalogue (seeded)', () => {
  it('reports zero integrity errors against the aptitude catalogue', () => {
    const report = validateCompanyCatalog({ companies: SEEDED_COMPANIES, knownTopicIds: KNOWN })
    const errors = report.issues.filter((i) => i.level === 'error').map((i) => `${i.code}: ${i.message}`)
    assert.deepEqual(errors, [], errors.join('\n'))
    assert.equal(report.valid, true)
    assert.equal(report.subjectCount, 6)
  })

  it('covers the six target recruiters with unique, URL-safe codes', () => {
    assert.deepEqual(
      SEEDED_COMPANIES.map((c) => c.code),
      ['tcs-nqt', 'infosys', 'wipro-nlth', 'accenture', 'capgemini', 'cognizant-genc'],
    )
    for (const c of SEEDED_COMPANIES) {
      assert.match(c.code, /^[a-z0-9-]+$/)
      assert.equal(c.status, 'published')
      assert.ok(c.strategyMd.length >= 1500, `${c.code} strategy is thin (${c.strategyMd.length})`)
      assert.ok(c.quickTips.length >= 4, `${c.code} needs quick tips`)
      assert.ok(c.sources.length >= 1, `${c.code} needs sources`)
      assert.equal(c.patternVerifiedOn, '2026-09-19')
    }
  })

  it('every company maps at least one section to each of QA, LR and VA', () => {
    for (const c of SEEDED_COMPANIES) {
      const ids = companyTopicIds(c)
      assert.ok(ids.some((t) => t.startsWith('qa-')), `${c.code} maps no quant topics`)
      assert.ok(ids.some((t) => t.startsWith('lr-')), `${c.code} maps no reasoning topics`)
      assert.ok(ids.some((t) => t.startsWith('va-')), `${c.code} maps no verbal topics`)
      assert.ok(ids.length >= 15, `${c.code} maps only ${ids.length} topics`)
      for (const t of ids) assert.ok(KNOWN.has(t), `${c.code} maps unknown topic ${t}`)
    }
  })

  it('sections without catalogue coverage explain what to do instead', () => {
    for (const c of SEEDED_COMPANIES) {
      for (const sec of c.sections) {
        if (sec.coverage === 'catalogue') {
          assert.ok(sec.topicIds.length > 0, `${c.code}/${sec.id} claims coverage but maps nothing`)
        } else {
          assert.ok((sec.coverageNote || '').length >= 40, `${c.code}/${sec.id} needs a coverage note`)
        }
      }
    }
  })

  it('eligibility programs are valid catalogue codes and non-tech programs appear for mass recruiters', () => {
    for (const c of SEEDED_COMPANIES) {
      for (const p of c.eligibility.programs) assert.ok(PREP_PROGRAM_CODES.includes(p), `${c.code}: unknown program ${p}`)
    }
    // BBA / B.Com learners must find at least three relevant guides.
    const forBba = SEEDED_COMPANIES.filter((c) => c.eligibility.programs.includes('bba'))
    assert.ok(forBba.length >= 3, `only ${forBba.length} guides list BBA`)
    const forBca = SEEDED_COMPANIES.filter((c) => c.eligibility.programs.includes('bca'))
    assert.equal(forBca.length, SEEDED_COMPANIES.length, 'every guide should be relevant to BCA')
  })

  it('the shared topic groups reference only real aptitude topics', () => {
    for (const [name, group] of Object.entries(COMPANY_TOPIC_GROUPS)) {
      for (const t of group) assert.ok(KNOWN.has(t), `${name} has unknown topic ${t}`)
      assert.equal(new Set(group).size, group.length, `${name} repeats a topic`)
    }
  })

  it('companyTopicIds preserves section order and de-duplicates', () => {
    const tcs = SEEDED_COMPANIES[0]
    const ids = companyTopicIds(tcs)
    assert.equal(new Set(ids).size, ids.length)
    assert.equal(ids[0], tcs.sections[0].topicIds[0])
    assert.deepEqual(companyTopicIds({ sections: [] }), [])
  })

  it('aptitude subjects referenced by cards exist', () => {
    const subjectIds = new Set(APTITUDE_SUBJECTS.map((s) => s.id))
    for (const t of Object.values(SEEDED_APTITUDE_TOPICS).flat()) assert.ok(subjectIds.has(t.subjectId))
  })
})

describe('validateCompanyCatalog (decision table)', () => {
  const base: PrepCompany = {
    code: 'demo-co',
    name: 'Demo',
    testName: 'Demo Test',
    tagline: 'x',
    audience: ['ug'],
    tier: 'mass',
    negativeMarking: false,
    sectionalCutoff: true,
    eligibility: { programs: ['bba'], degrees: 'Any' },
    sections: [{ id: 's1', name: 'Quant', topicIds: ['qa-percentages'], coverage: 'catalogue' }],
    rounds: [{ id: 'r1', name: 'Test', detail: 'Online test.' }],
    strategyMd: 'x'.repeat(250),
    quickTips: ['a'],
    patternVerifiedOn: '2026-01-01',
    sources: ['https://example.com'],
    status: 'published',
    order: 1,
  }
  const run = (patch: Partial<PrepCompany>) =>
    validateCompanyCatalog({ companies: [{ ...base, ...patch }], knownTopicIds: ['qa-percentages'] })

  it('accepts a minimal valid guide', () => {
    assert.equal(run({}).valid, true)
  })

  it('rejects unknown topic ids and unmapped catalogue sections', () => {
    const r1 = run({ sections: [{ id: 's1', name: 'Q', topicIds: ['qa-nope'], coverage: 'catalogue' }] })
    assert.ok(r1.issues.some((i) => i.code === 'COMPANY_UNKNOWN_TOPIC'))
    const r2 = run({ sections: [{ id: 's1', name: 'Q', topicIds: [], coverage: 'catalogue' }] })
    assert.ok(r2.issues.some((i) => i.code === 'COMPANY_SECTION_UNMAPPED'))
    assert.ok(r2.issues.some((i) => i.code === 'COMPANY_NOTHING_MAPPED'))
  })

  it('rejects bad codes, unknown programs, thin strategy and bad dates', () => {
    assert.ok(run({ code: 'Bad Code' }).issues.some((i) => i.code === 'COMPANY_BAD_CODE'))
    assert.ok(run({ eligibility: { programs: ['btech'], degrees: 'x' } }).issues.some((i) => i.code === 'COMPANY_UNKNOWN_PROGRAM'))
    assert.ok(run({ strategyMd: 'short' }).issues.some((i) => i.code === 'COMPANY_THIN_STRATEGY'))
    assert.ok(run({ patternVerifiedOn: 'yesterday' }).issues.some((i) => i.code === 'COMPANY_BAD_VERIFIED_DATE'))
  })

  it('flags duplicate codes across the bundle', () => {
    const r = validateCompanyCatalog({ companies: [base, base], knownTopicIds: ['qa-percentages'] })
    assert.ok(r.issues.some((i) => i.code === 'DUPLICATE_COMPANY_CODE'))
  })

  it('warns (not errors) on missing sources and coverage notes', () => {
    const r = run({ sources: [], sections: [{ id: 's1', name: 'Q', topicIds: ['qa-percentages'], coverage: 'partial' }] })
    assert.equal(r.valid, true)
    assert.ok(r.issues.some((i) => i.code === 'COMPANY_NO_SOURCES' && i.level === 'warning'))
    assert.ok(r.issues.some((i) => i.code === 'COMPANY_SECTION_NO_COVERAGE_NOTE' && i.level === 'warning'))
  })
})

describe('seed codes include the company bundle', () => {
  it('resolves "companies" alongside program and track codes', () => {
    assert.ok(PREP_SEED_CODES.includes('companies'))
    assert.deepEqual(resolveSeedPrograms('companies,aptitude').programs, ['companies', 'aptitude'])
    assert.ok(resolveSeedPrograms('all').programs.includes('companies'))
  })
})

describe('company prep per-college visibility', () => {
  const list = SEEDED_COMPANIES.map((c) => ({ code: c.code }))

  it('defaults to everything visible when nothing is stored', () => {
    const s = normaliseCompanyPrepSettings(undefined)
    assert.deepEqual(s, { enabled: true, hiddenCompanies: [] })
    assert.equal(applyCompanyPrepSettings(list, s).length, list.length)
    assert.equal(applyCompanyPrepSettings(list, null).length, list.length)
  })

  it('master switch off hides every company, including deep links', () => {
    const s = normaliseCompanyPrepSettings({ enabled: false, hiddenCompanies: [] })
    assert.deepEqual(applyCompanyPrepSettings(list, s), [])
    assert.equal(isCompanyVisibleForCollege('tcs-nqt', s), false)
  })

  it('hides only the listed companies when enabled', () => {
    const s = normaliseCompanyPrepSettings({ enabled: true, hiddenCompanies: ['Capgemini', ' wipro-nlth '] })
    assert.deepEqual(s.hiddenCompanies, ['capgemini', 'wipro-nlth'])
    const visible = applyCompanyPrepSettings(list, s).map((c) => c.code)
    assert.ok(!visible.includes('capgemini'))
    assert.ok(!visible.includes('wipro-nlth'))
    assert.ok(visible.includes('tcs-nqt'))
    assert.equal(isCompanyVisibleForCollege('capgemini', s), false)
    assert.equal(isCompanyVisibleForCollege('infosys', s), true)
  })

  it('drops junk codes, duplicates and non-string values', () => {
    const s = normaliseCompanyPrepSettings({
      enabled: 'yes',
      hiddenCompanies: ['tcs-nqt', 'tcs-nqt', 42, null, 'bad code!', '../x'],
      updatedBy: 'uid-1',
    })
    assert.equal(s.enabled, true)
    assert.deepEqual(s.hiddenCompanies, ['tcs-nqt'])
    assert.equal(s.updatedBy, 'uid-1')
  })
})
