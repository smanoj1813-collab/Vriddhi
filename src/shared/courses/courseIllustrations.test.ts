import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { costPerAcquisition, forecastFunnel, validateIllustrationBank } from './courseIllustrations'
import { validateManifest } from './courseModel'
import type { CourseManifest, CourseModuleManifest } from './types'
import type { CourseIllustrationBank } from './illustrationTypes'

const pack = fileURLToPath(new URL('../../../content/courses/digital-marketing/', import.meta.url))
const manifest: CourseManifest = JSON.parse(readFileSync(`${pack}course.json`, 'utf8'))
const readBank = (module: CourseModuleManifest): CourseIllustrationBank => JSON.parse(readFileSync(`${pack}modules/${module.slug}/illustrations.json`, 'utf8'))
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value))
const firstModule = manifest.modules[0]

function minimalBank(): CourseIllustrationBank {
  return copy(readBank(firstModule))
}

const packsRoot = fileURLToPath(new URL('../../../content/courses/', import.meta.url))
const expectedCoverage: Record<string, { topics: number; sections: number; kinds: string[] }> = {
  'digital-marketing': { topics: 36, sections: 162, kinds: ['bars', 'compare', 'cycle', 'flow', 'funnel', 'hub', 'matrix'] },
  'project-management': { topics: 29, sections: 117, kinds: ['bars', 'board', 'compare', 'cycle', 'flow', 'hub', 'matrix', 'raci', 'schedule'] },
}
for (const directory of readdirSync(packsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
  const root = `${packsRoot}${directory.name}/`
  const course: CourseManifest = JSON.parse(readFileSync(`${root}course.json`, 'utf8'))
  if (!course.illustrations) continue
  test(`${course.shortTitle}: every topic and source section has a valid companion, in order`, () => {
    let topics = 0
    let sections = 0
    const kinds = new Set<string>()
    assert.deepEqual(validateManifest(course), [])
    for (const module of course.modules) {
      const bank: CourseIllustrationBank = JSON.parse(readFileSync(`${root}modules/${module.slug}/illustrations.json`, 'utf8'))
      assert.deepEqual(validateIllustrationBank(bank, module), [])
      for (const topic of module.topics) {
        const source = readFileSync(`${root}${topic.lesson}`, 'utf8')
        const core = source.split(/^## Core ideas.*$/m)[1]?.split(/^## /m)[0] ?? ''
        const headings = [...(topic.type === 'lesson' ? core.matchAll(/^### (.+)$/gm) : source.matchAll(/^## (.+)$/gm))].map((match) => match[1].trim())
        const companion = bank.topics[topic.id]
        assert.deepEqual(companion.sections.map((section) => section.section), headings, topic.id)
        assert.ok(companion.sections.some((section) => section.checkpoint), `${topic.id} needs a checkpoint`)
        companion.sections.forEach((section) => kinds.add(section.diagram.kind))
        topics += 1
        sections += companion.sections.length
      }
    }
    const expected = expectedCoverage[course.id]
    if (expected) {
      assert.equal(topics, expected.topics)
      assert.equal(sections, expected.sections)
      assert.deepEqual([...kinds].sort(), expected.kinds)
    }
  })
}

test('the illustrated-edition declaration is optional but must include meaningful copy', () => {
  assert.deepEqual(validateManifest(manifest), [])
  const broken = copy(manifest)
  broken.illustrations = { title: '', description: ' ' }
  assert.ok(validateManifest(broken).includes('illustrations.title is required'))
  assert.ok(validateManifest(broken).includes('illustrations.description is required'))
  delete broken.illustrations
  assert.deepEqual(validateManifest(broken), [])
})

test('funnel applies each percentage to the preceding stage and does not round early', () => {
  assert.deepEqual(forecastFunnel(1000, [3, 40, 25]), [1000, 30, 12, 3])
  assert.deepEqual(forecastFunnel(1000, [6, 40, 25]), [1000, 60, 24, 6])
  assert.deepEqual(forecastFunnel(1000, [3, 40, 30]), [1000, 30, 12, 3.6])
  assert.equal(costPerAcquisition(3000, 3), 1000)
  assert.equal(costPerAcquisition(3000, 6), 500)
})

test('zero outcomes do not produce an infinite or misleading CPA', () => {
  assert.deepEqual(forecastFunnel(1000, [0, 40, 25]), [1000, 0, 0, 0])
  assert.deepEqual(forecastFunnel(0, [100, 100]), [0, 0, 0])
  assert.equal(costPerAcquisition(3000, 0), null)
  assert.equal(costPerAcquisition(0, 3), 0)
})

test('funnel arithmetic rejects invalid rates and non-finite inputs', () => {
  for (const visitors of [-1, NaN, Infinity]) assert.throws(() => forecastFunnel(visitors, [3]), RangeError)
  for (const rate of [-1, 101, NaN, Infinity]) assert.throws(() => forecastFunnel(1000, [rate]), RangeError)
  for (const spend of [-1, NaN, Infinity]) assert.equal(costPerAcquisition(spend, 3), null)
  for (const customers of [-1, NaN, Infinity]) assert.equal(costPerAcquisition(3000, customers), null)
})

test('visual banks reject missing and unknown topics and duplicate anchors', () => {
  const bank = minimalBank()
  delete bank.topics['m1-t4']
  bank.topics['unknown-topic'] = copy(bank.topics['m1-t1'])
  bank.topics['m1-t1'].sections[1].id = bank.topics['m1-t1'].sections[0].id
  bank.topics['m1-t1'].sections[1].section = bank.topics['m1-t1'].sections[0].section
  const problems = validateIllustrationBank(bank, firstModule)
  assert.ok(problems.some((problem) => problem.includes('missing visual companion')))
  assert.ok(problems.some((problem) => problem.includes('unknown topic')))
  assert.ok(problems.some((problem) => problem.includes('duplicate id')))
  assert.ok(problems.some((problem) => problem.includes('duplicate section heading')))
})

test('numeric diagrams require finite values, a unit and an explicit illustrative-data label', () => {
  const bank = minimalBank()
  const section = bank.topics['m1-t4'].sections[0]
  section.caption = 'Real performance'
  section.diagram = { kind: 'bars', unit: '', items: [
    { label: 'A', detail: 'First series', value: -1 },
    { label: 'B', detail: 'Second series', value: Infinity },
  ] }
  const problems = validateIllustrationBank(bank, firstModule)
  assert.ok(problems.some((problem) => problem.includes('needs a unit')))
  assert.ok(problems.some((problem) => problem.includes('labelled synthetic')))
  assert.equal(problems.filter((problem) => problem.includes('finite and non-negative')).length, 2)
})

test('funnel and matrix shape checks prevent broken diagrams', () => {
  const bank = minimalBank()
  bank.topics['m1-t1'].sections[0].diagram = { kind: 'funnel', unit: 'people', interactive: true, items: [
    { label: 'Start', detail: 'First', value: 0 },
    { label: 'End', detail: 'Second', value: 100 },
  ] }
  bank.topics['m1-t1'].sections[1].diagram = {
    kind: 'matrix', xLabel: '', yLabel: 'Impact', columns: ['', ''], rows: ['High', 'Low'], items: [],
  } as unknown as CourseIllustrationBank['topics'][string]['sections'][number]['diagram']
  const problems = validateIllustrationBank(bank, firstModule)
  assert.ok(problems.some((problem) => problem.includes('funnel counts cannot increase')))
  assert.ok(problems.some((problem) => problem.includes('four positive starting counts')))
  assert.ok(problems.some((problem) => problem.includes('2–6 items')))
})

test('malformed JSON-shaped values return actionable problems instead of throwing', () => {
  for (const bad of [null, [], 12, 'text', {}, { moduleId: 'm1', topics: [] }, { moduleId: 'm1', topics: { 'm1-t1': null } }]) {
    assert.ok(validateIllustrationBank(bad, firstModule).length > 0)
  }
  const bank = minimalBank() as unknown as Record<string, any>
  bank.topics['m1-t1'].sections[0].diagram.items[0] = null
  bank.topics['m1-t1'].sections[1].diagram.items[0].icon = 'not-an-icon'
  bank.topics['m1-t1'].sections[2].checkpoint = { question: 'Why?' }
  const problems = validateIllustrationBank(bank, firstModule)
  assert.ok(problems.some((problem) => problem.includes('needs label and detail')))
  assert.ok(problems.some((problem) => problem.includes('unknown icon')))
  assert.ok(problems.some((problem) => problem.includes('checkpoint needs a question and answer')))
})
