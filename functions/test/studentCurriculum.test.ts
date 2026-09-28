import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyTopics, sessionMatchesCohort, diagnoseCohortExclusion } from '../src/studentCurriculum.ts'

describe('sessionMatchesCohort', () => {
  const student = { branch: 'BBA', batch: '2027', semester: 3, division: 'A', section: '' }

  it('matches on normalised program, batch, semester and division', () => {
    assert.equal(sessionMatchesCohort({ branch: ' b.b.a ', batch: 2027, semester: '3', division: 'Div A' }, student), true)
  })
  it('treats empty row fields as wildcards', () => {
    assert.equal(sessionMatchesCohort({ branch: 'BBA' }, student), true)
    assert.equal(sessionMatchesCohort({}, student), true)
  })
  it('rejects a different cohort', () => {
    assert.equal(sessionMatchesCohort({ branch: 'BCA', batch: '2027' }, student), false)
    assert.equal(sessionMatchesCohort({ branch: 'BBA', batch: '2026' }, student), false)
    assert.equal(sessionMatchesCohort({ branch: 'BBA', semester: 4 }, student), false)
    assert.equal(sessionMatchesCohort({ branch: 'BBA', division: 'B' }, student), false)
  })
  it('accepts a class taught to the student section letter via the section slot', () => {
    assert.equal(sessionMatchesCohort({ division: '', section: 'A' }, student), true)
  })
  it('does not exclude a student with unknown semester', () => {
    assert.equal(sessionMatchesCohort({ semester: 3 }, { ...student, semester: 0 }), true)
  })
})

describe('classifyTopics', () => {
  const modules = [
    { moduleNo: '1', moduleName: 'Intro', hours: 8, topics: ['What is Accounting', 'Double Entry', 'Journals'] },
    { moduleNo: '2', moduleName: 'Ledgers', hours: 10, topics: ['Posting', 'Trial Balance'] },
    { moduleNo: '3', moduleName: 'Final Accounts', hours: 12, topics: ['P&L', 'Balance Sheet'] },
  ]
  const today = '2026-09-13'
  const horizon = '2026-09-20'

  it('marks covered topics completed, module in progress current, later modules upcoming', () => {
    const covered = new Map([['what is accounting', '2026-09-01'], ['double entry', '2026-09-05']])
    const out = classifyTopics(modules, { covered, planned: new Map(), today, horizon })
    assert.equal(out[0].state, 'current')
    assert.deepEqual(out[0].topics.map((t) => t.state), ['completed', 'completed', 'current'])
    assert.equal(out[0].pct, 67)
    assert.equal(out[1].state, 'upcoming')
    assert.deepEqual(out[1].topics.map((t) => t.state), ['upcoming', 'upcoming'])
    assert.equal(out[2].state, 'upcoming')
  })

  it('a fully covered module is completed and the next one becomes current', () => {
    const covered = new Map([['what is accounting', '2026-09-01'], ['double entry', '2026-09-02'], ['journals', '2026-09-03'], ['posting', '2026-09-10']])
    const out = classifyTopics(modules, { covered, planned: new Map(), today, horizon })
    assert.equal(out[0].state, 'completed')
    assert.equal(out[1].state, 'current')
    assert.equal(out[1].topics[1].state, 'current')
    assert.equal(out[2].state, 'upcoming')
  })

  it('a topic planned within the horizon is current even in a later module', () => {
    const planned = new Map([['p l', '2026-09-15']])
    const out = classifyTopics(modules, { covered: new Map(), planned, today, horizon })
    assert.equal(out[2].topics[0].state, 'current')
    assert.equal(out[2].topics[0].plannedOn, '2026-09-15')
    // Nothing covered yet: the first module is the one being taught.
    assert.equal(out[0].state, 'current')
  })

  it('a topic planned beyond the horizon stays upcoming', () => {
    const planned = new Map([['balance sheet', '2026-10-30']])
    const out = classifyTopics(modules, { covered: new Map(), planned, today, horizon })
    assert.equal(out[2].topics[1].state, 'upcoming')
  })

  it('with no evidence at all the first module is current, the rest upcoming', () => {
    const out = classifyTopics(modules, { covered: new Map(), planned: new Map(), today, horizon })
    assert.deepEqual(out.map((m) => m.state), ['current', 'upcoming', 'upcoming'])
    assert.equal(out[0].current, 3)
  })

  it('de-duplicates topics by normalised title', () => {
    const out = classifyTopics([{ moduleNo: '1', moduleName: 'M', hours: 0, topics: ['Journals', 'journals ', 'JOURNALS.'] }], { covered: new Map(), planned: new Map(), today, horizon })
    assert.equal(out[0].total, 1)
  })
})

describe('diagnoseCohortExclusion', () => {
  const student = { branch: 'BBA', batch: '2027', semester: 3, division: 'A' }

  it('names the ONE field that is excluding every mapping', () => {
    // Sixteen subjects mapped for the college, every one of them addressed to
    // Division SEP. The student page used to say "your college has not
    // assigned subjects to BBA semester 3 yet" and pointed the reader at
    // sixteen student records instead of one mapping field.
    const mappings = Array.from({ length: 16 }, (_, i) => ({
      branch: 'BBA', batch: '2027', semester: 3, division: 'SEP', courseId: `c${i}`,
    }))
    const d = diagnoseCohortExclusion(mappings, student)
    assert.equal(d.totalActiveMappings, 16)
    assert.equal(d.mismatches.length, 1)
    assert.equal(d.mismatches[0].field, 'division')
    assert.equal(d.mismatches[0].studentValue, 'A')
    assert.deepEqual(d.mismatches[0].mappingValues, ['SEP'])
    assert.equal(d.mismatches[0].wouldMatch, 16)
    assert.equal(d.needsMultipleCorrections, false)
  })

  it('reports a semester mismatch, which is the other one-sided case', () => {
    const mappings = Array.from({ length: 4 }, (_, i) => ({
      branch: 'BBA', batch: '2027', semester: 4, division: 'A', courseId: `c${i}`,
    }))
    const d = diagnoseCohortExclusion(mappings, student)
    assert.equal(d.mismatches.length, 1)
    assert.equal(d.mismatches[0].field, 'semester')
    assert.equal(d.mismatches[0].studentValue, '3')
    assert.deepEqual(d.mismatches[0].mappingValues, ['4'])
  })

  it('surfaces BOTH fields when each one is independently excluding a row', () => {
    // One row is wrong only in semester, one only in division. Blanking either
    // field on its own recovers that row, so the page must show both — a
    // single-field diagnosis here would fix one and leave the student with
    // half a curriculum and no explanation.
    const mappings = [
      { branch: 'BBA', batch: '2027', semester: 4, division: 'A' },
      { branch: 'BBA', batch: '2027', semester: 3, division: 'SEP' },
    ]
    const d = diagnoseCohortExclusion(mappings, student)
    const fields = d.mismatches.map((m) => m.field).sort()
    assert.deepEqual(fields, ['division', 'semester'])
    assert.equal(d.needsMultipleCorrections, true)
  })

  it('never blames a field that is blank on the mapping — a blank is a wildcard', () => {
    // A mapping with no division and no semester addresses EVERY division of
    // that batch, so it cannot be the reason a student is excluded. Naming it
    // would send the reader to "fix" a value that is not wrong.
    const mappings = [{ branch: 'BBA', batch: '2027', semester: 0, division: '' }]
    assert.equal(sessionMatchesCohort(mappings[0], student), true)
    const d = diagnoseCohortExclusion(mappings, student)
    assert.equal(d.mismatches.length, 0)
  })

  it('does not blame a field when ignoring it alone recovers nothing', () => {
    // Every row is wrong in batch AND semester, so no single fix helps. A
    // diagnosis that named only one of them would send the reader through a
    // pointless edit.
    const mappings = [{ branch: 'BBA', batch: '2020', semester: 4, division: 'A' }]
    const d = diagnoseCohortExclusion(mappings, student)
    assert.equal(d.mismatches.length, 0)
    assert.equal(d.totalActiveMappings, 1)
  })

  it('does not count a row that already matched as "recovered"', () => {
    const mappings = [
      { branch: 'BBA', batch: '2027', semester: 3, division: 'A' },  // already matches
      { branch: 'BBA', batch: '2027', semester: 3, division: 'B' },  // excluded on division
    ]
    const d = diagnoseCohortExclusion(mappings, student)
    assert.equal(d.mismatches.length, 1)
    assert.equal(d.mismatches[0].wouldMatch, 1, 'only the excluded row counts')
  })

  it('renders a blank value as (none) rather than an empty cell', () => {
    // Division and section are compared as a SET, so a row with division A is
    // excluded from a student whose only letter is section B. Both sides of
    // that comparison have a blank half, and the page must print "(none)"
    // rather than an empty cell that reads as "nothing to fix here".
    const mappings = [{ branch: 'BBA', batch: '2027', semester: 3, division: 'A' }]
    const d = diagnoseCohortExclusion(mappings, { ...student, division: '', section: 'B' })
    assert.equal(d.mismatches.length, 1)
    assert.equal(d.mismatches[0].field, 'division')
    assert.equal(d.mismatches[0].studentValue, '(none)')
    assert.deepEqual(d.mismatches[0].mappingValues, ['A'])

    // The mirror: the row's blank half is the DIVISION and its section is the
    // letter that conflicts. The decision must be reported against `section` —
    // blanking an already-blank division changes nothing, so naming it would
    // be advice to edit a field that is not wrong.
    const mirrored = diagnoseCohortExclusion(
      [{ branch: 'BBA', batch: '2027', semester: 3, division: '', section: 'X' }],
      { ...student, division: '', section: 'B' }
    )
    assert.equal(mirrored.mismatches[0].field, 'section')
    assert.equal(mirrored.mismatches[0].studentValue, 'B')
    assert.deepEqual(mirrored.mismatches[0].mappingValues, ['X'])
  })

  it('does not blame a field the student leaves blank when nothing else constrains it', () => {
    // The matcher treats an empty student field as "unknown, no constraint" so
    // a freshly-imported profile is not silently excluded from everything.
    // That rule must hold through the diagnosis too.
    const mappings = [{ branch: 'BBA', batch: '2027', semester: 3, division: 'A' }]
    assert.equal(sessionMatchesCohort(mappings[0], { ...student, division: '' }), true)
    assert.equal(diagnoseCohortExclusion(mappings, { ...student, division: '' }).mismatches.length, 0)
  })

  it('reports the distinct values, not one arbitrary row', () => {
    const mappings = [
      { branch: 'BBA', batch: '2027', semester: 3, division: 'SEP' },
      { branch: 'BBA', batch: '2027', semester: 3, division: 'B' },
      { branch: 'BBA', batch: '2027', semester: 3, division: 'SEP' },
    ]
    const d = diagnoseCohortExclusion(mappings, student)
    assert.deepEqual(d.mismatches[0].mappingValues, ['B', 'SEP'])
    assert.equal(d.mismatches[0].wouldMatch, 3)
  })

  it('has nothing to say when there are no mappings at all', () => {
    const d = diagnoseCohortExclusion([], student)
    assert.equal(d.totalActiveMappings, 0)
    assert.equal(d.mismatches.length, 0)
  })

  it('agrees with the matcher: a diagnosis never claims a field the matcher ignores', () => {
    const mappings = [
      { branch: 'BBA', batch: '2027', semester: 3, division: 'SEP' },
      { branch: 'BCA', batch: '2027', semester: 3, division: 'A' },
    ]
    const d = diagnoseCohortExclusion(mappings, student)
    for (const m of d.mismatches) {
      const relaxed = mappings.map((row) => ({ ...row, [m.field]: '' }))
      const recovered = relaxed.filter((row) => sessionMatchesCohort(row, student)).length
      assert.equal(m.wouldMatch, recovered, `field ${m.field}`)
    }
  })
})
