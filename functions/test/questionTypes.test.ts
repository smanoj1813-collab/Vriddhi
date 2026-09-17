// functions/test/questionTypes.test.ts
//
// Pins the single source of truth for online-schedulable response types — the
// module that closed the gap where the paper pipeline's Confirm accepted
// case_based papers and the schedule-time check in studentAssessments.ts then
// failed them with "Question 1 is incomplete or uses an unsupported online
// response type".

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  canonicalQuestionType,
  findSchedulingProblem,
  isKnownQuestionType,
  isSchedulableOnlineType,
  SCHEDULABLE_ONLINE_TYPES,
  type SchedulableQuestionShape,
} from '../src/questionTypes'

function question(overrides: Partial<SchedulableQuestionShape> = {}): SchedulableQuestionShape {
  return {
    order: 1,
    text: 'Define the accounting equation.',
    type: 'short_answer',
    marks: 5,
    options: [],
    ...overrides,
  }
}

describe('canonicalQuestionType', () => {
  it('normalises the legacy spellings', () => {
    assert.equal(canonicalQuestionType('MCQ'), 'mcq')
    assert.equal(canonicalQuestionType('Multiple Choice'), 'mcq')
    assert.equal(canonicalQuestionType('MSQ'), 'multi_select')
    assert.equal(canonicalQuestionType('True False'), 'true_false')
    assert.equal(canonicalQuestionType('Fill In The Blanks'), 'fill_in_blank')
    assert.equal(canonicalQuestionType('Short Answer'), 'short_answer')
    assert.equal(canonicalQuestionType('Long Answer'), 'long_answer')
    assert.equal(canonicalQuestionType('NAT'), 'numerical')
    assert.equal(canonicalQuestionType('Assertion Reason'), 'assertion_reason')
    assert.equal(canonicalQuestionType('Case Based'), 'case_based')
    assert.equal(canonicalQuestionType('Matching'), 'matching')
  })

  it('never invents an objective format for an unknown label', () => {
    assert.equal(canonicalQuestionType('weird-type'), 'weirdtype')
    assert.equal(canonicalQuestionType(''), 'mcq')
  })
})

describe('isKnownQuestionType / isSchedulableOnlineType', () => {
  it('recognises every canonical type as known', () => {
    for (const type of [
      'mcq', 'multi_select', 'true_false', 'fill_in_blank', 'short_answer',
      'long_answer', 'numerical', 'assertion_reason', 'case_based', 'matching',
    ]) {
      assert.ok(isKnownQuestionType(type), `${type} should be known`)
    }
    assert.equal(isKnownQuestionType('handwriting_sample'), false)
  })

  it('includes case_based in the schedulable set (the reported bug)', () => {
    assert.ok(SCHEDULABLE_ONLINE_TYPES.has('case_based'))
    assert.ok(isSchedulableOnlineType('case_based'))
    assert.ok(isSchedulableOnlineType('Case Based'))
  })

  it('excludes matching (the student UI does not render it online)', () => {
    assert.ok(!SCHEDULABLE_ONLINE_TYPES.has('matching'))
    assert.equal(isSchedulableOnlineType('matching'), false)
  })
})

describe('findSchedulingProblem', () => {
  it('returns null for a healthy short-answer question', () => {
    assert.equal(findSchedulingProblem(question()), null)
  })

  it('accepts every schedulable type with the right shape', () => {
    assert.equal(
      findSchedulingProblem(question({ type: 'case_based' })),
      null,
    )
    assert.equal(
      findSchedulingProblem(
        question({
          type: 'mcq',
          options: [{ id: 'A', text: 'A' }, { id: 'B', text: 'B' }],
        }),
      ),
      null,
    )
    assert.equal(
      findSchedulingProblem(
        question({
          type: 'assertion_reason',
          options: [
            { id: 'A', text: 'A' }, { id: 'B', text: 'B' },
            { id: 'C', text: 'C' }, { id: 'D', text: 'D' },
          ],
        }),
      ),
      null,
    )
  })

  it('names the missing text', () => {
    const problem = findSchedulingProblem(question({ text: '   ' }))
    assert.match(problem as string, /has no question text/)
  })

  it('names the missing marks', () => {
    const problem = findSchedulingProblem(question({ marks: 0 }))
    assert.match(problem as string, /has no marks/)
  })

  it('names an unsupported type generically', () => {
    const problem = findSchedulingProblem(question({ type: 'weirdtype' }))
    assert.match(problem as string, /uses type "weirdtype"/)
    assert.match(problem as string, /cannot schedule/)
  })

  it('gives matching its own specific message', () => {
    const problem = findSchedulingProblem(question({ type: 'matching' }))
    assert.match(problem as string, /Match the following/)
    assert.match(problem as string, /does not render yet/)
  })

  it('names a choice question missing options', () => {
    const problem = findSchedulingProblem(
      question({ type: 'true_false', options: [{ id: 'A', text: 'Only' }] }),
    )
    assert.match(problem as string, /fewer than two options/)
  })
})
