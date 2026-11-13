import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collegeSchemeFields,
  normalizeCollegeSchemeSelection,
  readPinnedCollegeSchemes,
  selectCollegeScheme,
  type CollegeSchemeConfiguration,
  type CollegeSchemeSelection,
} from '../src/academic/collegeSchemes'
import { readCollegeSchemes } from '../src/academic/schemeResolution'
import { auditAssignedProgrammeCredits, summarizeCredits } from '../src/academic/creditEngine'
import { academicFixture } from './helpers/academicFixture'

function configuration(): CollegeSchemeConfiguration {
  const first = academicFixture()
  const second = { ...academicFixture(), id: 'college-a__SECOND', code: 'SECOND', revision: 3 }
  return {
    assignments: [first, second].map(snapshot => ({ schemePackId: snapshot.id, revision: snapshot.revision!, snapshot })),
    primarySchemePackId: first.id,
    routes: [{ programme: 'MCA', schemePackId: second.id }],
    revision: 4,
    needsReconfirmation: false,
  }
}
function selection(): CollegeSchemeSelection {
  const c = configuration()
  return { assignments: c.assignments.map(({ snapshot: _, ...choice }) => choice), primarySchemePackId: c.primarySchemePackId, routes: c.routes }
}

describe('explicit multi-pack college scheme selection', () => {
  it('allows an explicitly unconfigured college and one or many reviewed assignments', () => {
    assert.deepEqual(normalizeCollegeSchemeSelection({ assignments: [], primarySchemePackId: null, routes: [] }), { assignments: [], primarySchemePackId: null, routes: [] })
    assert.deepEqual(normalizeCollegeSchemeSelection(selection()), selection())
    assert.throws(() => selectCollegeScheme({ ...configuration(), assignments: [] }), /configuration required/)
  })
  it('requires exactly one primary from the assigned list; never picks the first automatically', () => {
    for (const primarySchemePackId of [undefined, '', 'NOT_ASSIGNED']) {
      assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), primarySchemePackId }), /primary/)
    }
    assert.throws(() => normalizeCollegeSchemeSelection({ assignments: [], primarySchemePackId: 'ANY', routes: [] }), /primary/)
  })
  it('rejects duplicate packs, unreviewed revisions, malformed IDs and oversized selections', () => {
    const s = selection()
    assert.throws(() => normalizeCollegeSchemeSelection({ ...s, assignments: [s.assignments[0], s.assignments[0]] }), /Duplicate/)
    for (const revision of [0, -1, 1.5, NaN, Infinity, '1', undefined]) {
      assert.throws(() => normalizeCollegeSchemeSelection({ ...s, assignments: [{ ...s.assignments[0], revision }] }), /revision/)
    }
    assert.throws(() => normalizeCollegeSchemeSelection({ ...s, assignments: [{ schemePackId: 'colleges/x', revision: 1 }] }), /identifier/)
    assert.throws(() => normalizeCollegeSchemeSelection({ ...s, assignments: Array.from({ length: 11 }, (_, i) => ({ schemePackId: `P${i}`, revision: 1 })) }), /at most 10/)
  })
  it('requires routes to target assigned packs and to narrow an actual scope', () => {
    for (const route of [{ schemePackId: 'MISSING', programme: 'BCA' }, { schemePackId: configuration().primarySchemePackId }, { schemePackId: configuration().primarySchemePackId, programme: '---' }]) {
      assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), routes: [route] }))
    }
    for (const semester of [0, 21, 1.5, NaN, '1']) {
      assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), routes: [{ schemePackId: configuration().primarySchemePackId, semester }] }), /semester/)
    }
  })
  it('rejects normalized duplicate scopes and intersecting equal-specificity targets', () => {
    const [a, b] = selection().assignments
    assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), routes: [{ schemePackId: a.schemePackId, programme: 'B.Com' }, { schemePackId: b.schemePackId, programme: 'bcom' }] }), /Duplicate/)
    assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), routes: [{ schemePackId: a.schemePackId, programme: 'BCA' }, { schemePackId: b.schemePackId, batch: '2024-25' }] }), /overlap/)
    const s = normalizeCollegeSchemeSelection({ ...selection(), routes: [{ schemePackId: a.schemePackId, programme: 'BCA' }, { schemePackId: b.schemePackId, programme: 'MCA' }] })
    assert.equal(s.routes.length, 2)
    assert.throws(() => normalizeCollegeSchemeSelection({ ...selection(), routes: Array.from({ length: 101 }, () => ({ schemePackId: a.schemePackId, programme: 'BCA' })) }), /100/)
  })
  it('returns the explicit primary only for settings or genuinely unmatched complete context', () => {
    const c = configuration()
    assert.equal(selectCollegeScheme(c).selection, 'primary')
    const result = selectCollegeScheme(c, { programme: 'BCA', batch: '2026-27', semester: 1 })
    assert.equal(result.schemePackId, c.primarySchemePackId)
    assert.equal(result.configurationRevision, 4)
    assert.equal(result.revision, 1)
    assert.equal(selectCollegeScheme(c, { programme: 'm.c.a', batch: '2026-27', semester: 1 }).schemePackId, c.assignments[1].schemePackId)
  })
  it('uses the most-specific programme/batch/semester route, independent of array order', () => {
    const c = configuration()
    c.routes.push({ programme: 'MCA', batch: '2024-25', semester: 2, schemePackId: c.primarySchemePackId! })
    assert.equal(selectCollegeScheme(c, { programme: 'MCA', batch: '2024-25', semester: 2 }).revision, 1)
    c.routes.reverse()
    assert.equal(selectCollegeScheme(c, { programme: 'MCA', batch: '2024-25', semester: 1 }).revision, 3)
    assert.equal(selectCollegeScheme(c, { programme: 'MCA', batch: '2024-25', semester: 2 }).selection, 'route')
  })
  it('fails closed when missing context could select a different assignment', () => {
    const c = configuration()
    assert.throws(() => selectCollegeScheme(c, {}), /missing/)
    c.routes = [{ batch: '2024-25', semester: 2, schemePackId: c.assignments[1].schemePackId }]
    assert.throws(() => selectCollegeScheme(c, { batch: '2024-25' }), /missing/)
    assert.equal(selectCollegeScheme(c, { batch: '2023-24' }).selection, 'primary')
  })
  it('never collapses Kannada vowel signs in route scopes', () => {
    const c = configuration()
    c.routes = [{ programme: 'ಬೀ', schemePackId: c.assignments[1].schemePackId }]
    assert.equal(selectCollegeScheme(c, { programme: 'ಬಿ' }).selection, 'primary')
    assert.equal(selectCollegeScheme(c, { programme: 'ಬೀ' }).selection, 'route')
  })
  it('round-trips each independently pinned snapshot and legacy primary mirrors', () => {
    const c = configuration()
    const fields = collegeSchemeFields(c)
    assert.equal(fields.schemePackId, c.primarySchemePackId)
    assert.equal(fields.schemePackRevision, 1)
    assert.deepEqual(readPinnedCollegeSchemes('college-a', fields), c)
    fields.schemePackSnapshot!.name = 'An explicit snapshot'
    assert.equal(readPinnedCollegeSchemes('college-a', fields)!.assignments[0].snapshot.name, 'An explicit snapshot')
  })
  it('rejects corrupted pins, cross-tenant ownership and route corruption instead of falling back', () => {
    const fields = collegeSchemeFields(configuration())
    assert.throws(() => readPinnedCollegeSchemes('college-b', fields), /not owned/)
    assert.throws(() => readPinnedCollegeSchemes('college-a', { ...fields, schemeConfigurationRevision: 0 }), /revision/)
    assert.throws(() => readPinnedCollegeSchemes('college-a', { ...fields, schemePackRoutes: [{ schemePackId: 'MISSING', programme: 'BCA' }] }), /assigned/)
    for (const snapshot of [{ ...fields.schemePackSnapshot, revision: 99 }, { ...fields.schemePackSnapshot, status: 'draft' }]) {
      assert.throws(() => readPinnedCollegeSchemes('college-a', { ...fields, schemePackAssignments: [{ schemePackId: snapshot.id, revision: 1, snapshot }] }))
    }
  })
  it('adapts only explicit legacy bindings and does not reread mutable sources for pinned assignments', async () => {
    const unconfigured = await readCollegeSchemes('college-a', { college: async () => ({}), customPack: async () => { throw new Error('must not read') } })
    assert.equal(unconfigured.assignments.length, 0)
    assert.equal(unconfigured.revision, 0)
    const c = configuration()
    const pinned = await readCollegeSchemes('college-a', { college: async () => collegeSchemeFields(c), customPack: async () => { throw new Error('must not read') } })
    assert.deepEqual(pinned, c)
    const oldPin = await readCollegeSchemes('college-a', { college: async () => ({ schemePackId: c.primarySchemePackId, schemePackRevision: 1, schemePackSnapshot: c.assignments[0].snapshot }), customPack: async () => undefined })
    assert.equal(oldPin.assignments.length, 1)
    assert.equal(oldPin.revision, 0)
    assert.equal(oldPin.needsReconfirmation, false)
  })
})


describe('assigned programme credit plans', () => {
  const published = [
    { code: 'CS101', semester: 1, credits: 4, gradePoint: 9, result: 'P', category: 'Core' },
    { code: 'CS102', semester: 1, credits: 2, gradePoint: 6, result: 'P', category: 'Core' },
    { code: 'ZERO', semester: 1, credits: 0, gradePoint: 0, result: 'P', includeInGpa: false },
  ]
  it('audits the batch-routed assigned plan, not always the primary or today’s course-credit values', () => {
    const c = configuration()
    c.assignments[1].snapshot.creditRequirements![0].minimumCredits = 10
    c.assignments[1].snapshot.courses![0].credits = 6 // published credit evidence remains four
    c.routes = [{ batch: '2024-25', schemePackId: c.assignments[1].schemePackId }]
    const primary = auditAssignedProgrammeCredits(published, c, { programme: 'BCA', batch: '2026-27', semester: 1 })
    const routed = auditAssignedProgrammeCredits(published, c, { programme: 'BCA', batch: '2024-25', semester: 1 })
    assert.equal(primary.creditRequirementsMet, true)
    assert.equal(primary.schemePackId, c.primarySchemePackId)
    assert.equal(routed.configured, true)
    if (!routed.configured) throw new Error('Expected explicit batch plan')
    assert.equal(routed.schemePackId, c.assignments[1].schemePackId)
    assert.equal(routed.schemePackRevision, 3)
    assert.equal(routed.schemeConfigurationRevision, 4)
    assert.equal(routed.creditRequirementsMet, false)
    assert.equal(routed.remainingCredits, 4)
    assert.equal(routed.summary.earnedCredits, 6)
    assert.equal(routed.summary.gpa, 8)
  })
  it('does not use the current semester’s pack as a hybrid whole-programme award plan', () => {
    const c = configuration()
    c.routes = [{ programme: 'BCA', semester: 2, schemePackId: c.assignments[1].schemePackId }]
    for (const semester of [1, 2, undefined]) {
      const audit = auditAssignedProgrammeCredits(published, c, { programme: 'BCA', batch: '2026-27', semester })
      assert.equal(audit.configured, false)
      if (audit.configured) throw new Error('Expected an explicit unresolved award plan')
      assert.match(audit.reason, /cross-pack award plan/)
    }
    assert.equal(summarizeCredits(published).gpa, 8) // history remains viewable
  })
  it('reports missing/unconfigured plans rather than inheriting neighbouring policy', () => {
    const c = configuration()
    c.assignments = []; c.primarySchemePackId = null; c.routes = []
    assert.equal(auditAssignedProgrammeCredits(published, c, { programme: 'BCA' }).configured, false)
    const scoped = configuration()
    assert.equal(auditAssignedProgrammeCredits(published, scoped, { programme: 'BCA' }).configured, true)
    assert.equal(auditAssignedProgrammeCredits(published, scoped, { programme: 'MCA' }).configured, false)
  })
})
