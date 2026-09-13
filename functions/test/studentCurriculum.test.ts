import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { classifyTopics, sessionMatchesCohort } from '../src/studentCurriculum.ts'

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
