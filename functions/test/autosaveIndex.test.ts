import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  gradeAssessmentPaper,
  type ServerQuestion,
} from '../src/assessmentGrading'
import {
  mergeAnswers,
  questionsToIndex,
  sanitizeAnswers,
  sanitizeAnswersWithIndex,
  sanitizeProctorEvents,
} from '../src/studentAssessments'

// The autosave cost cut (HANDOFF_exam_autosave_cost) replaces "load all N
// question docs + validate" with "validate the delta against the compact
// answer index frozen on the attempt". These tests pin the contract that makes
// that swap safe: index validation must produce byte-identical answers to the
// legacy path, and the merge must keep the stored set coherent.

function questions(): ServerQuestion[] {
  return [
    {
      id: 'q-0001',
      questionId: 'q-0001',
      order: 1,
      text: 'Single choice',
      type: 'mcq',
      marks: 2,
      negativeMarks: 0.5,
      options: [
        { id: 'a', text: 'A', isCorrect: true },
        { id: 'b', text: 'B' },
        { id: 'c', text: 'C' },
      ],
    },
    {
      id: 'q-0002',
      questionId: 'legacy-alias-2',
      order: 2,
      text: 'Multi select',
      type: 'multi_select',
      marks: 3,
      negativeMarks: 0,
      options: [
        { id: 'x', text: 'X', isCorrect: true },
        { id: 'y', text: 'Y', isCorrect: true },
        { id: 'z', text: 'Z' },
      ],
    },
    {
      id: 'q-0003',
      questionId: 'q-0003',
      order: 3,
      text: 'Fill in the blank',
      type: 'fill_in_blank',
      marks: 1,
      negativeMarks: 0,
      options: [],
      correctAnswer: 'Mumbai',
    },
    {
      id: 'q-0004',
      questionId: 'q-0004',
      order: 4,
      text: 'Numerical',
      type: 'numerical',
      marks: 1,
      negativeMarks: 0,
      options: [],
      correctAnswer: '42',
      tolerance: 0,
    },
    {
      id: 'q-0005',
      questionId: 'q-0005',
      order: 5,
      text: 'Short answer (manual)',
      type: 'short_answer',
      marks: 5,
      negativeMarks: 0,
      options: [],
    },
  ]
}

/** Same shape the start-time writer freezes onto the attempt doc. */
function indexFor(questionsList: ServerQuestion[]) {
  return questionsToIndex(questionsList)
}

const DELTA_INPUT: Record<string, Record<string, unknown>> = {
  'q-0001': { questionId: 'q-0001', selectedOptionId: 'a', isFlagged: true },
  // Unknown option id + valid multi-select: invalid ids must be dropped, cap applied.
  'q-0002': { questionId: 'q-0002', selectedOptionIds: ['x', 'nope', 'y', 'z', 'x'], isFlagged: false },
  // Oversized text must be sliced, not rejected.
  'q-0003': { questionId: 'q-0003', textAnswer: '  ' + 'M'.repeat(20_001) + '  ' },
  'q-0004': { questionId: 'q-0004', numericalAnswer: '42' },
  // Non-object entries and unknown questions are dropped.
  'q-0005': 'not-an-object',
  'q-9999': { questionId: 'q-9999', selectedOptionId: 'a' },
}

describe('answer index validation (autosave fast path)', () => {
  it('produces byte-identical answers to the legacy question-based validation', () => {
    const list = questions()
    const legacy = sanitizeAnswers(DELTA_INPUT, list)
    const indexed = sanitizeAnswersWithIndex(DELTA_INPUT, indexFor(list))
    assert.deepEqual(indexed, legacy)
    assert.ok(legacy.length >= 4)
  })

  it('resolves the questionId alias and stores the canonical question id', () => {
    const list = questions()
    const indexed = sanitizeAnswersWithIndex(
      { 'legacy-alias-2': { questionId: 'legacy-alias-2', selectedOptionIds: ['x'] } },
      indexFor(list)
    )
    assert.equal(indexed.length, 1)
    assert.equal(indexed[0].questionId, 'q-0002') // canonical id, not the alias
  })

  it('drops unknown questions, invalid option ids, and non-object entries', () => {
    const indexed = sanitizeAnswersWithIndex(DELTA_INPUT, indexFor(questions()))
    const ids = indexed.map((answer) => answer.questionId).sort()
    assert.deepEqual(ids, ['q-0001', 'q-0002', 'q-0003', 'q-0004'])
    const multi = indexed.find((answer) => answer.questionId === 'q-0002')
    assert.deepEqual(multi?.selectedOptionIds, ['x', 'y', 'z'])
    const blank = indexed.find((answer) => answer.questionId === 'q-0003')
    assert.equal(blank?.textAnswer?.length, 20_000)
  })

  it('grades delta-validated answers exactly like the legacy path (same autoScore)', () => {
    const list = questions()
    const legacy = gradeAssessmentPaper(list, sanitizeAnswers(DELTA_INPUT, list))
    const indexed = gradeAssessmentPaper(list, sanitizeAnswersWithIndex(DELTA_INPUT, indexFor(list)))
    assert.equal(indexed.autoScore, legacy.autoScore)
    assert.equal(indexed.autoMax, legacy.autoMax)
    assert.equal(indexed.needsManualGrading, legacy.needsManualGrading)
    assert.deepEqual(indexed.perQuestion, legacy.perQuestion)
  })
})

describe('answer merge (delta autosave)', () => {
  it('overwrites the changed question, keeps the rest, appends new ones', () => {
    const existing = [
      { questionId: 'q1', selectedOptionId: 'a', isFlagged: false },
      { questionId: 'q2', textAnswer: 'old', isFlagged: true },
    ]
    const incoming = [
      { questionId: 'q2', textAnswer: 'new', isFlagged: false },
      { questionId: 'q3', selectedOptionId: 'b', isFlagged: false },
    ]
    const merged = mergeAnswers(existing, incoming)
    assert.deepEqual(
      merged.map((answer) => [answer.questionId, answer.isFlagged]),
      [
        ['q1', false],
        ['q2', false],
        ['q3', false],
      ]
    )
    assert.equal(merged.find((answer) => answer.questionId === 'q2')?.textAnswer, 'new')
  })

  it('treats a later empty flag toggle as a real change (unflag wins)', () => {
    const merged = mergeAnswers(
      [{ questionId: 'q1', isFlagged: true }],
      [{ questionId: 'q1', isFlagged: false }]
    )
    assert.equal(merged.length, 1)
    assert.equal(merged[0].isFlagged, false)
  })

  it('ignores entries without a questionId instead of corrupting the set', () => {
    const merged = mergeAnswers(
      [{ questionId: 'q1', isFlagged: false }],
      [{ questionId: '', isFlagged: true } as never]
    )
    assert.equal(merged.length, 1)
  })
})

describe('batched proctor events', () => {
  it('keeps valid events, bounds type/at, and drops malformed ones', () => {
    const events = sanitizeProctorEvents([
      { type: 'tab_switch', at: new Date().toISOString(), details: { hidden: true } },
      { type: 'x'.repeat(90), at: 'y'.repeat(50) },
      { at: '2026-01-01T00:00:00.000Z' }, // no type → dropped
      'garbage',
      { type: 'keyboard_shortcut', at: '2026-01-01T00:00:00.000Z', details: { key: 'f12' } },
    ])
    assert.equal(events.length, 3)
    assert.equal(events[0].type, 'tab_switch')
    assert.equal(events[1].type.length, 80)
    assert.equal(events[1].at.length, 40)
    assert.deepEqual(events[1].details, {})
    assert.deepEqual(events[2].details, { key: 'f12' })
  })

  it('resets oversized details to {} instead of failing the whole save', () => {
    const events = sanitizeProctorEvents([
      { type: 'paste_attempt', at: '2026-01-01T00:00:00.000Z', details: { blob: 'z'.repeat(5_000) } },
    ])
    assert.equal(events.length, 1)
    assert.deepEqual(events[0].details, {})
  })

  it('caps the batch at 100 events', () => {
    const events = sanitizeProctorEvents(
      Array.from({ length: 150 }, (_, i) => ({ type: 'window_blur', at: `t${i}` }))
    )
    assert.equal(events.length, 100)
  })
})
