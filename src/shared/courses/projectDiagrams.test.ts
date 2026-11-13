import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { CourseDiagram, CourseIllustrationBank, CourseScheduleDiagram, CourseScheduleTask } from './illustrationTypes'
import type { CourseManifest } from './types'
import { analyseCourseSchedule, applyCourseResourceConstraint, summariseCourseBoard } from './projectDiagrams'
import { validateIllustrationBank } from './courseIllustrations'

const root = fileURLToPath(new URL('../../../content/courses/project-management/', import.meta.url))
const manifest: CourseManifest = JSON.parse(readFileSync(`${root}course.json`, 'utf8'))
const readBank = (index: number): CourseIllustrationBank => JSON.parse(readFileSync(`${root}modules/${manifest.modules[index].slug}/illustrations.json`, 'utf8'))
const fixture = readBank(1).topics['m2-t2'].sections[2].diagram as CourseScheduleDiagram
const copy = <T,>(value: T): T => structuredClone(value)
const task = (id: string, duration: number, predecessors: string[] = []): CourseScheduleTask => ({ id, label: id, detail: 'Synthetic task', duration, predecessors })
const four = [task('A', 2), task('B', 4, ['A']), task('C', 3, ['A']), task('D', 2, ['B', 'C'])]

function diagramProblems(diagram: unknown, caption = 'Synthetic teaching example') {
  const bank = readBank(0)
  bank.topics['m1-t1'].sections[0].diagram = diagram as CourseDiagram
  bank.topics['m1-t1'].sections[0].caption = caption
  return validateIllustrationBank(bank, manifest.modules[0])
}

test('four-task lesson computes both passes, one-day C float and eight-day finish', () => {
  const result = analyseCourseSchedule(four)
  assert.equal(result.duration, 8)
  assert.deepEqual(result.criticalTaskIds, ['A', 'B', 'D'])
  assert.deepEqual(result.tasks.map((item) => [item.id, item.earliestStart, item.earliestFinish, item.latestStart, item.latestFinish, item.totalFloat]), [
    ['A', 0, 2, 0, 2, 0], ['B', 2, 6, 2, 6, 0], ['C', 2, 5, 3, 6, 1], ['D', 6, 8, 6, 8, 0],
  ])
})

test('eight-task fixture has fourteen-day finish; it is not the four-task lesson', () => {
  const result = analyseCourseSchedule(fixture.items)
  assert.equal(result.duration, 14)
  assert.deepEqual(result.criticalTaskIds, ['A', 'B', 'D', 'E', 'F', 'G', 'H'])
  assert.equal(result.tasks.find((item) => item.id === 'C')?.totalFloat, 1)
  assert.equal(result.tasks.find((item) => item.id === 'H')?.earliestFinish, 14)
  assert.deepEqual(diagramProblems(fixture), [])
})

test('explicit B-before-C specialist constraint gives seventeen days without mutating inputs', () => {
  const original = copy(fixture.items)
  const levelled = applyCourseResourceConstraint(fixture.items, { before: 'B', after: 'C' })
  const result = analyseCourseSchedule(levelled)
  assert.equal(result.duration, 17)
  assert.equal(result.tasks.find((item) => item.id === 'C')?.earliestStart, 6)
  assert.equal(result.tasks.find((item) => item.id === 'D')?.earliestStart, 9)
  assert.ok(result.tasks.every((item) => item.critical))
  assert.deepEqual(fixture.items, original)
  assert.deepEqual(analyseCourseSchedule(fixture.items).duration, 14)
  assert.deepEqual(applyCourseResourceConstraint(levelled, { before: 'B', after: 'C' }), levelled)
})

test('shortening non-critical work does not move the finish; a tie exposes multiple critical branches', () => {
  const shorter = four.map((item) => ({ ...item, duration: item.id === 'C' ? 2 : item.duration }))
  assert.equal(analyseCourseSchedule(shorter).duration, 8)
  assert.equal(analyseCourseSchedule(shorter).tasks.find((item) => item.id === 'C')?.totalFloat, 2)
  const tied = four.map((item) => ({ ...item, duration: item.id === 'C' ? 4 : item.duration }))
  assert.equal(analyseCourseSchedule(tied).duration, 8)
  assert.deepEqual(analyseCourseSchedule(tied).criticalTaskIds, ['A', 'B', 'C', 'D'])
  const longer = four.map((item) => ({ ...item, duration: item.id === 'C' ? 5 : item.duration }))
  assert.equal(analyseCourseSchedule(longer).duration, 9)
  assert.equal(analyseCourseSchedule(longer).tasks.find((item) => item.id === 'B')?.totalFloat, 1)
})

test('schedule does not assume input order or invent dependencies between separate ends', () => {
  const ordered = analyseCourseSchedule(four)
  const unordered = analyseCourseSchedule([...four].reverse())
  assert.equal(unordered.duration, ordered.duration)
  for (const item of ordered.tasks) assert.deepEqual(unordered.tasks.find((other) => other.id === item.id), item)
  const separate = analyseCourseSchedule([task('A', 2), task('B', 4)])
  assert.equal(separate.duration, 4)
  assert.equal(separate.tasks[0].totalFloat, 2)
  assert.deepEqual(separate.criticalTaskIds, ['B'])
})

test('schedule rejects cycles, self-dependencies, duplicate and unknown IDs', () => {
  assert.throws(() => analyseCourseSchedule([task('A', 2, ['B']), task('B', 4, ['A'])]), /cycle/)
  assert.throws(() => analyseCourseSchedule([task('A', 2, ['A']), task('B', 4)]), /self-dependency/)
  assert.throws(() => analyseCourseSchedule([task('A', 2), task('A', 4)]), /Duplicate/)
  assert.throws(() => analyseCourseSchedule([task('A', 2), task('B', 4, ['missing'])]), /unknown predecessor/)
  assert.throws(() => analyseCourseSchedule([task('A', 2), task('B', 4, ['A', 'A'])]), /duplicate dependency/)
  assert.throws(() => analyseCourseSchedule([task('', 2), task('B', 4)]), /Task IDs/)
})

test('durations are bounded positive whole working days, not non-finite values or effort', () => {
  for (const duration of [0, -1, 0.5, 61, NaN, Infinity]) {
    assert.throws(() => analyseCourseSchedule([task('A', duration), task('B', 1)]), /whole working days/)
  }
  assert.throws(() => analyseCourseSchedule([]), /2–12/)
  assert.throws(() => analyseCourseSchedule([task('A', 1)]), /2–12/)
  assert.throws(() => analyseCourseSchedule(Array.from({ length: 13 }, (_, index) => task(`T${index}`, 1))), /2–12/)
  assert.equal(analyseCourseSchedule(Array.from({ length: 12 }, (_, index) => task(`T${index}`, 60))).duration, 60)
})

test('invalid or cyclic resource orders are rejected rather than producing a false date', () => {
  assert.throws(() => applyCourseResourceConstraint(four, { before: 'D', after: 'A' }), /cycle/)
  assert.throws(() => applyCourseResourceConstraint(four, { before: 'A', after: 'A' }), /different known tasks/)
  assert.throws(() => applyCourseResourceConstraint(four, { before: 'X', after: 'A' }), /different known tasks/)
})

test('runtime bank validation checks schedule calendar, view, controls, provenance and resource references', () => {
  const invalid = { ...fixture, unit: 'hours', view: 'calendar', interactive: 'yes', resourceConstraint: { before: 'D', after: 'A', label: 'Cyclic order' } }
  const problems = diagramProblems(invalid, 'Real approved plan')
  for (const fragment of ['working days', 'timeline or network', 'boolean', 'labelled synthetic', 'cycle']) {
    assert.ok(problems.some((problem) => problem.includes(fragment)), fragment)
  }
  assert.ok(diagramProblems({ ...fixture, items: fixture.items.map((item, index) => index === 0 ? { ...item, duration: 21 } : item) }).some((problem) => problem.includes('20 days')))
  assert.ok(diagramProblems({ ...fixture, resourceConstraint: { before: 'A' } }).some((problem) => problem.includes('before, after and label')))
  assert.ok(diagramProblems({ ...fixture, items: [null, task('A', 2)] }).some((problem) => problem.includes('Task IDs')))
  assert.ok(diagramProblems({ ...fixture, items: [task('A', 2), { ...task('B', 1), predecessors: 'A' }] }).some((problem) => problem.includes('array of task IDs')))
})

test('board summary keeps blocked cards in WIP and excludes only completed columns', () => {
  const diagram = readBank(3).topics['m4-t1'].sections[1].diagram
  assert.equal(diagram.kind, 'board')
  if (diagram.kind !== 'board') return
  const result = summariseCourseBoard(diagram.items)
  assert.deepEqual(result.map((column) => column.count), [2, 1, 2, 1])
  assert.equal(result.reduce((total, column) => total + column.activeCount, 0), 5)
  assert.equal(result.reduce((total, column) => total + column.blocked, 0), 2)
  const overload = readBank(3).topics['m4-t3'].sections[0].diagram
  assert.equal(overload.kind, 'board')
  if (overload.kind !== 'board') return
  const review = summariseCourseBoard(overload.items)[1]
  assert.equal(review.count, 4)
  assert.equal(review.blocked, 1)
  assert.equal(review.overLimit, true)
  assert.deepEqual(diagramProblems(overload), [])
})

test('board validation rejects duplicate cards, invalid limits, missing details and non-boolean flags', () => {
  const diagram = { kind: 'board', items: [
    { label: 'Review', detail: 'First', wipLimit: 0, cards: [{ id: 'A', label: 'Card', detail: 'Known', blocked: 'yes' }, { id: 'missing' }] },
    { label: 'Done', detail: 'Second', complete: true, wipLimit: 2, cards: [{ id: 'A', label: 'Duplicate', detail: 'Elsewhere' }] },
  ] }
  const problems = diagramProblems(diagram)
  for (const fragment of ['positive integers', 'duplicate board card', 'id, label and detail', 'blocked must be a boolean', 'completed column']) {
    assert.ok(problems.some((problem) => problem.includes(fragment)), fragment)
  }
  assert.ok(diagramProblems({ kind: 'board', items: [{ label: 'A', detail: 'A', cards: null }, { label: 'B', detail: 'B', cards: [], complete: 'yes' }] }).some((problem) => problem.includes('0–12 cards')))
})

test('RACI validates one accountable role, a responsible role and correct column shape', () => {
  const valid = readBank(0).topics['m1-t3'].sections[1].diagram
  assert.deepEqual(diagramProblems(valid), [])
  const invalid = { kind: 'raci', roles: ['Sponsor', 'Coordinator'], items: [
    { label: 'Two A', detail: 'Ambiguous', assignments: ['A', 'A'] },
    { label: 'No A', detail: 'Missing owner', assignments: ['R', 'C'] },
  ] }
  const problems = diagramProblems(invalid)
  assert.equal(problems.filter((problem) => problem.includes('exactly one accountable')).length, 2)
  assert.ok(problems.some((problem) => problem.includes('responsible role')))
  assert.ok(diagramProblems({ ...invalid, roles: ['Same', 'Same'] }).some((problem) => problem.includes('distinct role labels')))
  assert.ok(diagramProblems({ ...invalid, items: [{ label: 'A', detail: 'A', assignments: ['RA'] }, { label: 'B', detail: 'B', assignments: ['RA', ['C']] }] }).some((problem) => problem.includes('invalid RACI code')))
  assert.ok(diagramProblems({ ...invalid, roles: null }).some((problem) => problem.includes('role columns')))
})

test('malformed project diagrams return problems without crashing the lazy loader', () => {
  for (const kind of ['schedule', 'board', 'raci']) {
    for (const items of [null, 42, [], [null, null], [{ label: 'A' }, { detail: 'B' }]]) {
      assert.ok(diagramProblems({ kind, items }).length > 0)
    }
  }
})
