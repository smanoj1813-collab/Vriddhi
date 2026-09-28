import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import {
  canTakeModuleAssessment,
  certificateEligibility,
  coursePercent,
  emptyProgress,
  flattenTopics,
  formatMinutes,
  gradeBand,
  markComplete,
  isModuleUnlocked,
  isTopicUnlocked,
  markIncomplete,
  mergeCourseProgress,
  minutesSummary,
  modulePercent,
  neighbours,
  quizAverage,
  recordModuleAssessmentAttempt,
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

test('topics unlock sequentially only after content is read and the prior lesson quiz is submitted', () => {
  const manifest = fixture()
  const p0 = emptyProgress()
  assert.equal(isTopicUnlocked(manifest, p0, 'm1-t1'), true)
  assert.equal(isTopicUnlocked(manifest, p0, 'm1-t2'), false)

  const readFirst = markComplete(p0, 'm1-t1')
  assert.equal(isTopicUnlocked(manifest, readFirst, 'm1-t2'), false, 'reading alone does not unlock the next lesson')
  const quizFirst = recordQuizAttempt(readFirst, 'm1-t1', { score: 0, total: 15 })
  assert.equal(isTopicUnlocked(manifest, quizFirst, 'm1-t2'), true, 'any submitted lesson quiz unlocks the next topic')
  assert.equal(isTopicUnlocked(manifest, quizFirst, 'm2-t1'), false, 'a new module needs its gate')
})

test('module mini-assessments require every topic and quiz, and 60% unlocks the next module', () => {
  const manifest = fixture()
  manifest.modules[0].assessment = { title: 'Gate A', passMark: 60, questionCount: 10 }
  manifest.modules[1].assessment = { title: 'Gate B', passMark: 60, questionCount: 10 }
  let progress = emptyProgress()
  assert.equal(canTakeModuleAssessment(manifest.modules[0], progress), false)

  for (const topic of manifest.modules[0].topics) {
    progress = markComplete(progress, topic.id)
    if (topic.type === 'lesson') progress = recordQuizAttempt(progress, topic.id, { score: 12, total: 15 })
  }
  assert.equal(canTakeModuleAssessment(manifest.modules[0], progress), true)
  assert.equal(isModuleUnlocked(manifest, progress, 1), false)

  progress = recordModuleAssessmentAttempt(progress, 'm1', { score: 5, total: 10 })
  assert.equal(isModuleUnlocked(manifest, progress, 1), false)
  progress = recordModuleAssessmentAttempt(progress, 'm1', { score: 6, total: 10 })
  assert.equal(isModuleUnlocked(manifest, progress, 1), true)
  assert.equal(isTopicUnlocked(manifest, progress, 'm2-t1'), true)
})

test('offline/cloud progress merge unions reads and preserves each highest quiz and assessment score', () => {
  let local = recordQuizAttempt(markComplete(emptyProgress(), 'm1-t1'), 'm1-t1', { score: 12, total: 15 }, new Date('2026-01-01T00:00:00Z'))
  local = recordQuizAttempt(local, 'm1-t1', { score: 8, total: 15 }, new Date('2026-01-01T01:00:00Z'))
  const remote = recordQuizAttempt(markComplete(emptyProgress(), 'm1-t2'), 'm1-t1', { score: 10, total: 15 }, new Date('2026-01-02T00:00:00Z'))
  const remoteWithAssessment = recordModuleAssessmentAttempt(remote, 'm1', { score: 8, total: 10 }, new Date('2026-01-03T00:00:00Z'))
  const merged = mergeCourseProgress(local, remoteWithAssessment)
  assert.ok(merged.read?.['m1-t1'])
  assert.ok(merged.read?.['m1-t2'])
  assert.equal(merged.quiz['m1-t1'].score, 12)
  assert.equal(merged.quiz['m1-t1'].attempts, 2)
  assert.equal(merged.moduleAssessments?.m1.score, 8)
})

test('certificate eligibility requires all content, all lesson quizzes, the minimum average and every module pass', () => {
  const manifest = fixture()
  manifest.certificateEligibility = {
    minimumQuizAverage: 60,
    moduleAssessmentPassMark: 60,
    requireAllTopicsRead: true,
    requireAllLessonQuizzes: true,
  }
  manifest.modules[0].assessment = { title: 'Gate A', passMark: 60, questionCount: 10 }
  manifest.modules[1].assessment = { title: 'Gate B', passMark: 60, questionCount: 10 }
  let progress = emptyProgress()
  for (const module of manifest.modules) {
    for (const topic of module.topics) {
      progress = markComplete(progress, topic.id)
      if (topic.type === 'lesson') progress = recordQuizAttempt(progress, topic.id, { score: 12, total: 15 })
    }
  }
  progress = recordModuleAssessmentAttempt(progress, 'm1', { score: 6, total: 10 })
  progress = recordModuleAssessmentAttempt(progress, 'm2', { score: 9, total: 10 })
  assert.equal(certificateEligibility(manifest, progress).eligible, true)
  assert.equal(certificateEligibility(manifest, emptyProgress()).eligible, false)
  const failedGate = { ...progress, moduleAssessments: { ...progress.moduleAssessments, m2: { score: 5, total: 10, at: '2026-01-01T00:00:00Z', attempts: 1 } } }
  assert.equal(certificateEligibility(manifest, failedGate).eligible, false)
})

test('gradeBand picks the highest band whose minimum is met, regardless of declared order', () => {
  const m = fixture()
  assert.equal(gradeBand(m, 95), 'Distinction')
  assert.equal(gradeBand(m, 80), 'Distinction')
  assert.equal(gradeBand(m, 79), 'Pass')
  assert.equal(gradeBand(m, 49), 'Not yet')
})

test('gradeBand degrades to an em dash when the pack declares no grade bands', () => {
  // Regression: a manifest without assessment.grades used to throw
  // "grades is not iterable" on the course overview page.
  const m = fixture()
  delete m.assessment.grades
  assert.equal(gradeBand(m, 95), '—')
  assert.equal(gradeBand(m, 0), '—')
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

test('validateManifest: a manifest without grade bands is flagged, not silently accepted', () => {
  // Regression guard: the digital-marketing pack shipped without
  // assessment.grades and crashed the overview page ("grades is not
  // iterable") because nothing validated the field.
  const m = fixture()
  delete m.assessment.grades
  const problems = validateManifest(m)
  assert.ok(problems.some((p) => p.includes('assessment.grades')), problems.join('\n'))
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
  assert.equal(manifest.lessonQuizQuestionCount, 15)
  assert.equal(manifest.assessment.components.reduce((n, c) => n + c.weight, 0), 100)
  for (const mod of manifest.modules) {
    const bankPath = resolve(dirname(PACK), 'modules', mod.slug, 'quiz.json')
    const bank = JSON.parse(readFileSync(bankPath, 'utf8'))
    for (const topic of mod.topics.filter((item) => item.type === 'lesson')) {
      assert.equal(bank.questions[topic.id]?.length, 15, `${topic.id} has 15 lesson questions`)
    }
    assert.equal(bank.moduleAssessment.questions.length, mod.assessment?.questionCount)
    assert.ok(bank.moduleAssessment.questions.every((question: { difficulty?: string }) => question.difficulty === 'advanced'))
  }
  // Topic ids are unique and every lesson path lives under the pack.
  assert.equal(new Set(seq.map((t) => t.id)).size, seq.length)
  assert.ok(seq.every((t) => /^(modules|projects)\//.test(t.lesson)))
})

for (const [courseId, code] of [['project-management', 'VPM-101'], ['hr-analytics', 'VHR-101']]) {
  const packDir = resolve(dirname(PACK), '..', courseId)
  const manifest = JSON.parse(readFileSync(resolve(packDir, 'course.json'), 'utf8')) as CourseManifest

  test(`${courseId}: complete 60-hour pack with consistent grading and support documents`, () => {
    assert.deepEqual(validateManifest(manifest), [])
    assert.equal(manifest.code, code)
    assert.equal(manifest.totalHours, 60)
    assert.equal(manifest.durationWeeks, 10)
    assert.equal(manifest.modules.length, 8)
    const topics = flattenTopics(manifest)
    assert.equal(topics.filter((topic) => topic.type === 'lesson').length, 24)
    assert.equal(topics.filter((topic) => topic.type === 'project').length, 5)
    assert.equal(topics.reduce((sum, topic) => sum + topic.minutes, 0), 3600)
    assert.equal(new Set(topics.map((topic) => topic.id)).size, topics.length)
    for (const mod of manifest.modules) {
      assert.equal(mod.topics.reduce((sum, topic) => sum + topic.minutes, 0), mod.hours * 60)
      assert.equal(mod.assessment?.passMark, 60)
      assert.equal(mod.assessment?.questionCount, 10)
    }
    assert.deepEqual(manifest.assessment.grades, [
      { band: 'Distinction', min: 80 }, { band: 'Merit', min: 65 },
      { band: 'Pass', min: 50 }, { band: 'Not yet', min: 0 },
    ])
    for (const [percent, band] of [[80, 'Distinction'], [65, 'Merit'], [50, 'Pass'], [49, 'Not yet']] as const) {
      assert.equal(gradeBand(manifest, percent), band)
    }
    for (const topic of topics) {
      const body = readFileSync(resolve(packDir, topic.lesson), 'utf8')
      assert.ok(body.startsWith(`# ${topic.number} `), topic.lesson)
      if (topic.type === 'lesson') assert.ok(body.split(/\s+/).length >= 900, topic.lesson)
    }
    for (const path of [...Object.values(manifest.documents || {}), manifest.finalAssessment!.blueprint!]) {
      assert.ok(readFileSync(resolve(packDir, path), 'utf8').startsWith('# '), path)
    }
  })

  test(`${courseId}: 200 scoreable questions and 72 lesson slides with no project quiz banks`, () => {
    let questions = 0
    let slides = 0
    const ids = new Set<string>()
    for (const mod of manifest.modules) {
      const bank = JSON.parse(readFileSync(resolve(packDir, 'modules', mod.slug, 'quiz.json'), 'utf8')) as import('./types').CourseQuizBank
      const deck = JSON.parse(readFileSync(resolve(packDir, 'modules', mod.slug, 'slides.json'), 'utf8')) as import('./types').CourseSlideBank
      assert.equal(bank.moduleId, mod.id)
      assert.equal(deck.moduleId, mod.id)
      for (const topic of mod.topics) {
        if (topic.type === 'project') {
          assert.equal(bank.questions[topic.id], undefined)
          continue
        }
        assert.equal(bank.questions[topic.id].length, manifest.lessonQuizQuestionCount)
        assert.equal(deck.topics[topic.id].length, 3)
        slides += deck.topics[topic.id].length
      }
      assert.equal(bank.moduleAssessment?.title, mod.assessment?.title)
      assert.equal(bank.moduleAssessment?.questions.length, 10)
      assert.ok(bank.moduleAssessment?.questions.every((q) => q.difficulty === 'advanced'))
      for (const list of [...Object.values(bank.questions), bank.moduleAssessment!.questions]) {
        const answers = Object.fromEntries(list.map((q) => [q.id, q.answerIndex]))
        const result = scoreQuiz(list, answers)
        assert.equal(result.score, list.length)
        assert.equal(result.total, list.length)
        for (const q of list) {
          assert.ok(!ids.has(q.id), q.id)
          ids.add(q.id)
          assert.equal(new Set(q.options).size, 4, q.id)
          assert.ok(q.options[q.answerIndex], q.id)
          assert.ok(q.explanation, q.id)
        }
        questions += list.length
      }
    }
    assert.equal(questions, 200)
    assert.equal(slides, 72)
  })

  test(`${courseId}: all module gates and platform eligibility work at the declared 60% boundary`, () => {
    let progress = emptyProgress()
    assert.equal(certificateEligibility(manifest, progress).eligible, false)
    for (const [index, mod] of manifest.modules.entries()) {
      assert.equal(isModuleUnlocked(manifest, progress, index), true)
      assert.equal(canTakeModuleAssessment(mod, progress), false)
      for (const topic of mod.topics) {
        assert.equal(isTopicUnlocked(manifest, progress, topic.id), true, topic.id)
        progress = markComplete(progress, topic.id)
        if (topic.type === 'lesson') progress = recordQuizAttempt(progress, topic.id, { score: 3, total: 5 })
      }
      assert.equal(canTakeModuleAssessment(mod, progress), true)
      progress = recordModuleAssessmentAttempt(progress, mod.id, { score: 5, total: 10 })
      if (index < manifest.modules.length - 1) assert.equal(isModuleUnlocked(manifest, progress, index + 1), false)
      assert.equal(certificateEligibility(manifest, progress).eligible, false)
      progress = recordModuleAssessmentAttempt(progress, mod.id, { score: 6, total: 10 })
    }
    assert.equal(coursePercent(manifest, progress), 100)
    assert.equal(quizAverage(progress), 60)
    assert.equal(certificateEligibility(manifest, progress).eligible, true)
  })
}

// These simple teaching fixtures deliberately contain no quoted commas. Keep
// their published checkpoints executable so content edits cannot silently
// invalidate the portfolio projects' expected results.
function practiceTables(courseId: string): Record<string, string>[][] {
  const source = readFileSync(resolve(dirname(PACK), '..', courseId, 'resources/practice-data.md'), 'utf8')
  return [...source.matchAll(/```csv\n([\s\S]*?)\n```/g)].map((match) => {
    const [header, ...rows] = match[1].trim().split('\n').map((row) => row.split(','))
    return rows.map((row) => Object.fromEntries(header.map((field, index) => [field, row[index]])))
  })
}

test('project-management: synthetic schedule, cost and board checkpoints reconcile', () => {
  const [tasks, costs, board] = practiceTables('project-management')
  assert.equal(tasks.length, 8)
  const finishes = new Map<string, number>()
  for (const task of tasks) {
    const predecessors = task.predecessors ? task.predecessors.split(';') : []
    assert.ok(predecessors.every((id) => finishes.has(id)))
    finishes.set(task.id, Math.max(0, ...predecessors.map((id) => finishes.get(id)!)) + Number(task.duration_days))
  }
  assert.equal(finishes.get('H'), 14)
  const amounts = Object.fromEntries(costs.map((row) => [row.measure, Number(row.rupees)]))
  assert.equal(amounts['Actual cost at cutoff'] + amounts['Current bottom-up estimate to complete'], 40000)
  assert.deepEqual(board.filter((row) => row.status !== 'Done' && row.due_date && row.due_date < '2026-09-28').map((row) => row.id), ['PILOT-2', 'PILOT-3'])
  assert.equal(board.filter((row) => !row.owner_role).length, 1)
  assert.equal(board.filter((row) => !row.due_date).length, 1)
})

test('hr-analytics: synthetic funnel, duration and contracted-FTE checkpoints reconcile', () => {
  const [applications, events, employees] = practiceTables('hr-analytics')
  assert.equal(new Set(applications.map((row) => row.application_id)).size, 24)
  const sum = (rows: Record<string, string>[], key: string) => rows.reduce((n, row) => n + Number(row[key]), 0)
  assert.deepEqual(['screen_passed', 'interviewed', 'offered', 'accepted', 'joined'].map((field) => sum(applications, field)), [18, 16, 12, 9, 7])
  for (const row of applications) {
    const stages = ['screen_passed', 'interviewed', 'offered', 'accepted', 'joined'].map((field) => Number(row[field]))
    assert.ok(stages.every((value, i) => (value === 0 || value === 1) && (i === 0 || value <= stages[i - 1])))
  }
  assert.equal(sum(applications.filter((row) => row.source === 'A'), 'joined'), 4)
  assert.equal(sum(applications.filter((row) => row.source === 'B'), 'joined'), 3)
  const days = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / 86400000
  assert.equal(days(events[0].approved_date, events[0].accepted_date), 20)
  assert.equal(days(events[0].application_date, events[0].accepted_date), 10)
  assert.equal(days(events[1].approved_date, events[1].accepted_date), 25)
  assert.equal(events[2].accepted_date, '')
  assert.equal(new Set(employees.map((row) => row.employee_id)).size, 30)
  assert.equal(sum(employees, 'contracted_weekly_hours') / 40, 27)
})
