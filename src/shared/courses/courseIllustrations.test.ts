import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { costPerAcquisition, forecastFunnel, validateIllustrationBank } from './courseIllustrations'
import { validateManifest } from './courseModel'
import { assembleCoursePrompt, calculateCourseWorkforce } from './courseVisualLabs'
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
  'genai-certification': { topics: 41, sections: 237, kinds: ['compare', 'cycle', 'flow', 'hub', 'prompt'] },
  'hr-analytics': { topics: 29, sections: 117, kinds: ['bars', 'compare', 'cycle', 'flow', 'funnel', 'hub', 'matrix', 'workforce'] },
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
        companion.sections.forEach((section) => {
          kinds.add(section.diagram.kind)
          if (['genai-certification', 'hr-analytics'].includes(course.id)) {
            assert.equal(section.walkthrough, true, `${topic.id}: learner-controlled walkthrough`)
          }
        })
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


test('workforce lab keeps all exits and the fixed opening cohort distinct', () => {
  const scenario = { opening: 100, joiners: 31, openingLeavers: 8, joinerLeavers: 3 }
  assert.deepEqual(calculateCourseWorkforce(scenario), {
    leavers: 11, retained: 92, closing: 120, average: 110, turnover: 10, retention: 92,
  })
  assert.deepEqual(scenario, { opening: 100, joiners: 31, openingLeavers: 8, joinerLeavers: 3 })
  const changed = calculateCourseWorkforce({ ...scenario, joinerLeavers: 4 })
  assert.equal(changed.retention, 92)
  assert.equal(changed.closing, 119)
  assert.equal(changed.turnover, 12 / 109.5 * 100)
})

test('workforce zero exposure is undefined, never a misleading zero rate', () => {
  assert.deepEqual(calculateCourseWorkforce({ opening: 0, joiners: 0, openingLeavers: 0, joinerLeavers: 0 }), {
    leavers: 0, retained: 0, closing: 0, average: 0, turnover: null, retention: null,
  })
  const newCohort = calculateCourseWorkforce({ opening: 0, joiners: 10, openingLeavers: 0, joinerLeavers: 5 })
  assert.equal(newCohort.retention, null)
  assert.equal(newCohort.turnover, 200)
  const everyoneLeft = calculateCourseWorkforce({ opening: 10, joiners: 0, openingLeavers: 10, joinerLeavers: 0 })
  assert.equal(everyoneLeft.retention, 0)
  assert.equal(everyoneLeft.turnover, 200)
})

test('workforce accepts only bounded whole people and cohort-valid exits', () => {
  const base = { opening: 100, joiners: 31, openingLeavers: 8, joinerLeavers: 3 }
  for (const field of Object.keys(base)) {
    for (const invalid of [-1, 201, 0.5, NaN, Infinity, undefined, '4']) {
      assert.throws(() => calculateCourseWorkforce({ ...base, [field]: invalid } as typeof base), RangeError)
    }
  }
  assert.throws(() => calculateCourseWorkforce({ ...base, openingLeavers: 101 }), RangeError)
  assert.throws(() => calculateCourseWorkforce({ ...base, joinerLeavers: 32 }), RangeError)
  assert.throws(() => calculateCourseWorkforce({ ...base, transfers: 1 } as typeof base), RangeError)
  // Across this grid, the bridge always reconciles and fixed-cohort retention stays within bounds.
  for (const opening of [0, 1, 50, 200]) for (const joiners of [0, 1, 50, 200]) {
    for (const openingLeavers of [0, opening]) for (const joinerLeavers of [0, joiners]) {
      const result = calculateCourseWorkforce({ opening, joiners, openingLeavers, joinerLeavers })
      assert.equal(result.closing, opening + joiners - result.leavers)
      assert.ok(result.retention === null || (result.retention >= 0 && result.retention <= 100))
    }
  }
})

test('prompt assembler includes exactly the selected examples in source order, without generating an answer', () => {
  const parts = [{ label: 'Context', example: 'Fictional event; date unconfirmed.' }, { label: 'Objective', example: 'Ask for interest, not attendance.' }]
  assert.equal(assembleCoursePrompt(parts, [true, true]), 'CONTEXT\nFictional event; date unconfirmed.\n\nOBJECTIVE\nAsk for interest, not attendance.')
  assert.equal(assembleCoursePrompt(parts, [false, true]), 'OBJECTIVE\nAsk for interest, not attendance.')
  assert.equal(assembleCoursePrompt(parts, [false, false]), '')
  assert.equal(parts[0].example, 'Fictional event; date unconfirmed.')
})

test('walkthrough, prompt and workforce JSON safeguards fail closed with useful messages', () => {
  const bank = minimalBank() as unknown as Record<string, any>
  const sections = bank.topics['m1-t1'].sections
  sections[0].walkthrough = 'automatic'
  sections[0].diagram = { kind: 'prompt', items: Array.from({ length: 6 }, () => ({ label: 'Repeated', detail: 'A brief part', example: '' })) }
  sections[1].diagram = { kind: 'workforce', items: [{ label: 'Opening', detail: 'People' }, { label: 'Closing', detail: 'People' }], scenario: { opening: 3, joiners: 1, openingLeavers: 4, joinerLeavers: 0 } }
  const problems = validateIllustrationBank(bank, firstModule)
  assert.ok(problems.some((problem) => problem.includes('walkthrough must be a boolean')))
  assert.ok(problems.some((problem) => problem.includes('six parts with non-empty examples')))
  assert.ok(problems.some((problem) => problem.includes('labels must be distinct')))
  assert.ok(problems.some((problem) => problem.includes('valid cohort leavers')))
  assert.ok(problems.some((problem) => problem.includes('four labelled stages')))
  sections[0].diagram.items = [null, {}]
  sections[1].diagram.scenario = null
  assert.doesNotThrow(() => validateIllustrationBank(bank, firstModule))
  assert.ok(validateIllustrationBank(bank, firstModule).length > 0)
})

test('HR teaching fixtures retain denominators, zero baselines and row-major confusion cells', () => {
  const root = `${packsRoot}hr-analytics/`
  const hr: CourseManifest = JSON.parse(readFileSync(`${root}course.json`, 'utf8'))
  const section = (topicId: string, index: number) => {
    const module = hr.modules.find((item) => item.topics.some((topic) => topic.id === topicId))!
    const bank: CourseIllustrationBank = JSON.parse(readFileSync(`${root}modules/${module.slug}/illustrations.json`, 'utf8'))
    return bank.topics[topicId].sections[index]
  }
  const funnel = section('m3-t1', 1).diagram
  assert.equal(funnel.kind, 'funnel')
  if (funnel.kind === 'funnel') assert.deepEqual(funnel.items.map((item) => item.value), [24, 18, 16, 12, 9, 7])
  const survey = section('m5-t1', 1).diagram
  if (survey.kind === 'funnel') assert.deepEqual(survey.items.map((item) => item.value), [80, 48, 30])
  const matrix = section('m7-t2', 0).diagram
  assert.equal(matrix.kind, 'matrix')
  if (matrix.kind === 'matrix') {
    assert.deepEqual(matrix.columns, ['Predicted exit', 'Predicted stay'])
    assert.deepEqual(matrix.rows, ['Actually exited', 'Actually stayed'])
    assert.deepEqual(matrix.items.map((item) => item.label), ['True positive · 4', 'False negative · 6', 'False positive · 4', 'True negative · 86'])
  }
  const workforce = section('m4-t2', 0).diagram
  assert.equal(workforce.kind, 'workforce')
  if (workforce.kind === 'workforce') assert.equal(calculateCourseWorkforce(workforce.scenario).retention, 92)
})
