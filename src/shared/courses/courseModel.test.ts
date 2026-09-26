import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  coursePercent,
  emptyProgress,
  flattenTopics,
  formatMinutes,
  gradeBand,
  markComplete,
  markIncomplete,
  minutesSummary,
  modulePercent,
  neighbours,
  quizAverage,
  recordQuizAttempt,
  resumeTopic,
  scoreQuiz,
  touchTopic,
  validateManifest,
} from './courseModel'
import type { CourseManifest, CourseQuizQuestion } from './types'

const here = dirname(fileURLToPath(import.meta.url))
const PACK = resolve(here, '../../../content/courses/genai-certification/course.json')

function fixture(): CourseManifest {
  return {
    schemaVersion: 1,
    id: 'demo',
    code: 'D-1',
    title: 'Demo course',
    shortTitle: 'Demo',
    tagline: '',
    version: '1.0.0',
    audience: '',
    level: '',
    totalHours: 3,
    prerequisites: [],
    outcomes: [],
    assessment: {
      passMark: 50,
      components: [
        { id: 'quizzes', name: 'Quizzes', weight: 40, description: '' },
        { id: 'project', name: 'Project', weight: 60, description: '' },
      ],
      grades: [
        { band: 'Pass', min: 50 },
        { band: 'Distinction', min: 80 },
        { band: 'Not yet', min: 0 },
      ],
    },
    modules: [
      {
        id: 'm1', number: 1, slug: '01-a', title: 'Module A', summary: '', hours: 1, outcomes: [],
        topics: [
          { id: 'm1-t1', number: '1.1', type: 'lesson', title: 'One', minutes: 30, lesson: 'modules/01-a/1.1.md' },
          { id: 'm1-t2', number: '1.2', type: 'lesson', title: 'Two', minutes: 30, lesson: 'modules/01-a/1.2.md' },
        ],
      },
      {
        id: 'm2', number: 2, slug: '02-b', title: 'Module B', summary: '', hours: 2, outcomes: [],
        topics: [
          { id: 'm2-t1', number: '2.1', type: 'lesson', title: 'Three', minutes: 60, lesson: 'modules/02-b/2.1.md' },
          { id: 'm2-pb1', number: 'PB1', type: 'project', title: 'Project', minutes: 60, lesson: 'projects/pb1.md' },
        ],
      },
    ],
  }
}

test('flattenTopics keeps manifest order and annotates module context', () => {
  const seq = flattenTopics(fixture())
  assert.deepEqual(seq.map((t) => t.id), ['m1-t1', 'm1-t2', 'm2-t1', 'm2-pb1'])
  assert.deepEqual(seq.map((t) => t.index), [0, 1, 2, 3])
  assert.equal(seq[2].moduleId, 'm2')
  assert.equal(seq[2].moduleTitle, 'Module B')
  assert.equal(seq[3].type, 'project')
})

test('neighbours: prev/next across module boundaries, none for unknown ids', () => {
  const seq = flattenTopics(fixture())
  assert.equal(neighbours(seq, 'm1-t1').prev, undefined)
  assert.equal(neighbours(seq, 'm1-t1').next?.id, 'm1-t2')
  assert.equal(neighbours(seq, 'm1-t2').next?.id, 'm2-t1')
  assert.equal(neighbours(seq, 'm2-pb1').next, undefined)
  assert.deepEqual(neighbours(seq, 'nope'), {})
})

test('progress percentages round to whole numbers per course and per module', () => {
  const manifest = fixture()
  let p = emptyProgress()
  assert.equal(coursePercent(manifest, p), 0)
  p = markComplete(p, 'm1-t1', new Date('2026-01-01T00:00:00Z'))
  assert.equal(coursePercent(manifest, p), 25)
  assert.equal(modulePercent(manifest.modules[0], p), 50)
  assert.equal(modulePercent(manifest.modules[1], p), 0)
  p = markComplete(p, 'm2-pb1')
  assert.equal(coursePercent(manifest, p), 50)
  assert.deepEqual(minutesSummary(manifest, p), { done: 90, total: 180 })
  // Marking twice is a no-op (same object back), un-marking removes the entry.
  assert.equal(markComplete(p, 'm1-t1'), p)
  const cleared = markIncomplete(p, 'm1-t1')
  assert.equal(cleared.completed['m1-t1'], undefined)
  assert.equal(coursePercent(manifest, cleared), 25)
})

test('resumeTopic prefers the last-visited unfinished topic, then the first incomplete one', () => {
  const seq = flattenTopics(fixture())
  let p = emptyProgress()
  assert.equal(resumeTopic(seq, p)?.id, 'm1-t1')
  p = touchTopic(p, 'm2-t1')
  assert.equal(resumeTopic(seq, p)?.id, 'm2-t1')
  p = markComplete(p, 'm2-t1')
  assert.equal(resumeTopic(seq, p)?.id, 'm1-t1')
  for (const t of seq) p = markComplete(p, t.id)
  assert.equal(resumeTopic(seq, p)?.id, 'm1-t1', 'finished course loops back to the start')
})

const QUESTIONS: CourseQuizQuestion[] = [
  { id: 'q1', question: 'A?', options: ['a', 'b', 'c', 'd'], answerIndex: 1 },
  { id: 'q2', question: 'B?', options: ['a', 'b', 'c', 'd'], answerIndex: 2 },
  { id: 'q3', question: 'C?', options: ['a', 'b', 'c', 'd'], answerIndex: 0 },
]

test('scoreQuiz counts exact matches only', () => {
  assert.deepEqual(scoreQuiz(QUESTIONS, { q1: 1, q2: 2, q3: 0 }), { score: 3, total: 3 })
  assert.deepEqual(scoreQuiz(QUESTIONS, { q1: 1, q2: 0 }), { score: 1, total: 3 })
  assert.deepEqual(scoreQuiz([], {}), { score: 0, total: 0 })
})

test('recordQuizAttempt keeps the best score while counting every attempt', () => {
  const t0 = new Date('2026-02-01T10:00:00Z')
  let p = recordQuizAttempt(emptyProgress(), 'm1-t1', { score: 2, total: 5 }, t0)
  assert.deepEqual(p.quiz['m1-t1'], { score: 2, total: 5, at: t0.toISOString(), attempts: 1 })
  const t1 = new Date('2026-02-01T11:00:00Z')
  p = recordQuizAttempt(p, 'm1-t1', { score: 1, total: 5 }, t1)
  assert.equal(p.quiz['m1-t1'].score, 2, 'worse attempt does not overwrite the best')
  assert.equal(p.quiz['m1-t1'].attempts, 2)
  assert.equal(p.quiz['m1-t1'].at, t0.toISOString())
  const t2 = new Date('2026-02-01T12:00:00Z')
  p = recordQuizAttempt(p, 'm1-t1', { score: 4, total: 5 }, t2)
  assert.equal(p.quiz['m1-t1'].score, 4)
  assert.equal(p.quiz['m1-t1'].attempts, 3)
  assert.equal(p.updatedAt, t2.toISOString())
  p = recordQuizAttempt(p, 'm2-t1', { score: 5, total: 5 }, t2)
  assert.equal(quizAverage(p), 90)
  assert.equal(quizAverage(emptyProgress()), null)
})

test('gradeBand picks the highest band whose minimum is met, regardless of declared order', () => {
  const m = fixture()
  assert.equal(gradeBand(m, 95), 'Distinction')
  assert.equal(gradeBand(m, 80), 'Distinction')
  assert.equal(gradeBand(m, 79), 'Pass')
  assert.equal(gradeBand(m, 49), 'Not yet')
})

test('formatMinutes', () => {
  assert.equal(formatMinutes(0), '0m')
  assert.equal(formatMinutes(45), '45m')
  assert.equal(formatMinutes(60), '1h')
  assert.equal(formatMinutes(90), '1h 30m')
  assert.equal(formatMinutes(3600), '60h')
})

test('validateManifest: a well-formed manifest passes', () => {
  assert.deepEqual(validateManifest(fixture()), [])
})

test('validateManifest: reports duplicate ids, bad weights, hour mismatches and bad lesson paths', () => {
  const m = fixture()
  m.modules[1].topics[0].id = 'm1-t1'
  m.assessment.components[0].weight = 50
  m.modules[0].hours = 3 // topics sum to 60 min, not 180
  m.modules[0].topics[1].lesson = 'modules/01-a/1.2.txt'
  const problems = validateManifest(m)
  assert.ok(problems.some((p) => p.includes('duplicate id "m1-t1"')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('weights sum to 110')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('declares 3h')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('needs a .md lesson path')), problems.join('\n'))
  assert.ok(problems.some((p) => p.includes('exceed totalHours')), problems.join('\n'))
})

test('validateManifest: empty modules short-circuits with a single clear problem', () => {
  const m = fixture()
  m.modules = []
  assert.deepEqual(validateManifest(m), ['manifest.modules must be a non-empty array'])
})

test('the bundled GenAI certification manifest is valid and matches its published shape', () => {
  const manifest = JSON.parse(readFileSync(PACK, 'utf8')) as CourseManifest
  assert.deepEqual(validateManifest(manifest), [])
  const seq = flattenTopics(manifest)
  assert.equal(manifest.modules.length, 8)
  assert.equal(seq.filter((t) => t.type === 'lesson').length, 35)
  assert.equal(seq.filter((t) => t.type === 'project').length, 6)
  assert.equal(manifest.totalHours, 60)
  assert.equal(manifest.assessment.components.reduce((n, c) => n + c.weight, 0), 100)
  // Topic ids are unique and every lesson path lives under the pack.
  assert.equal(new Set(seq.map((t) => t.id)).size, seq.length)
  assert.ok(seq.every((t) => /^(modules|projects)\//.test(t.lesson)))
})
