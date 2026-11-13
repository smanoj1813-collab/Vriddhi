import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { KARNATAKA_SCHEME_RESEARCH, researchForUniversity } from '../src/academic/schemeResearch'
import { normalizeSchemePack } from '../src/academic/schemeValidation'
import { normalizeCollegeSchemeSelection } from '../src/academic/collegeSchemes'
import { KARNATAKA_UNIVERSITIES } from '../../src/shared/data/karnatakaUniversities'

// The seed file is the identity inventory, NOT a source of regulatory numbers.
describe('evidence-backed Karnataka scheme preparation catalogue', () => {
  it('covers every seeded university exactly once without guessing Firestore university IDs', () => {
    assert.equal(KARNATAKA_SCHEME_RESEARCH.length, 23)
    assert.deepEqual(KARNATAKA_SCHEME_RESEARCH.map(p => p.universityCode).sort(), KARNATAKA_UNIVERSITIES.map(u => u.code).sort())
    assert.equal(new Set(KARNATAKA_SCHEME_RESEARCH.map(p => p.code)).size, 23)
    for (const p of KARNATAKA_SCHEME_RESEARCH) {
      assert.equal(p.universityName, KARNATAKA_UNIVERSITIES.find(u => u.code === p.universityCode)!.name)
      assert.equal('universityId' in p, false)
    }
  })
  it('keeps every incomplete/unapproved research pack non-assignable and outside the engine schema', () => {
    for (const p of KARNATAKA_SCHEME_RESEARCH) {
      assert.equal(p.assignable, false)
      assert.equal(p.status, 'draft')
      assert.ok(p.blockers.length > 0)
      assert.equal(p.reviewedOn, '2026-11-13')
      assert.throws(() => normalizeSchemePack(p), p.code)
      assert.throws(() => normalizeCollegeSchemeSelection({ assignments: [p], primarySchemePackId: p.code, routes: [] }), p.code)
    }
  })
  it('attaches access limitations, locators and traceable source IDs to every observation/course row', () => {
    for (const p of KARNATAKA_SCHEME_RESEARCH) {
      assert.ok(p.sources.length > 0, p.code)
      assert.equal(new Set(p.sources.map(s => s.id)).size, p.sources.length)
      for (const s of p.sources) {
        assert.match(s.url, /^https?:\/\//); assert.ok(s.readScope)
        assert.ok(['university', 'university-linked', 'college-mirror', 'candidate', 'seed'].includes(s.authority))
        assert.ok(['read-partial', 'index-only', 'unavailable', 'search-only', 'linked-not-read'].includes(s.access))
      }
      for (const o of p.observations) {
        assert.ok(o.detail && o.locator && o.sourceIds.length)
        for (const id of o.sourceIds) assert.ok(p.sources.some(s => s.id === id), `${p.code}: ${id}`)
        if (o.value !== undefined) assert.ok(o.sourceIds.some(id => p.sources.some(s => s.id === id && s.access === 'read-partial')), `${p.code}: numeric evidence requires a read document`)
      }
      for (const c of p.courseRows) {
        assert.ok(p.sources.some(s => s.id === c.sourceId && s.access === 'read-partial'), p.code)
        assert.ok(c.code && c.semester >= 1 && c.credits >= 0)
        assert.ok(c.internalMaxMarks + c.externalMaxMarks > 0)
      }
    }
    assert.equal(KARNATAKA_SCHEME_RESEARCH.reduce((n, p) => n + p.courseRows.length, 0), 43)
  })
  it('records materially different GP/credit systems and conflicts instead of cloning generic presets', () => {
    const bcu = researchForUniversity('BCU')!
    const kud = researchForUniversity('KU')!
    assert.equal(bcu.verification, 'conflict')
    assert.match(kud.blockers.join(' '), /Chancellor/)
    assert.notDeepEqual(bcu.observations.find(o => o.topic === 'grade-points')!.value, kud.observations.find(o => o.topic === 'grade-points')!.value)
    assert.match(researchForUniversity('BU')!.observations.find(o => o.topic === 'grade-points')!.detail, /divided by10/)
    assert.match(researchForUniversity('KSOU')!.observations.find(o => o.topic === 'assessment')!.detail, /30IA\/70/)
    assert.equal(researchForUniversity('KSWU')!.courseRows[0].credits, 5)
    assert.equal(researchForUniversity('VIJ')!.verification, 'identity-review')
    assert.match(researchForUniversity('KOP')!.observations.find(o => o.topic === 'completion-only')!.detail, /zero marks/)
    assert.equal(researchForUniversity('VTU'), undefined)
  })
})
