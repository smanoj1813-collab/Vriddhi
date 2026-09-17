// functions/test/paperSchedulingCheck.test.ts
//
// Pins the question-resolution order behind the scheduler's "check paper"
// gate: embedded `sections` win over linked question-bank ids, and the
// resolved questions feed the SAME findSchedulingProblem validator the real
// schedule uses. This is the gap that let a bank-linked paper of option-less
// MCQs show up as "ready-to-use" and only fail at Publish.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolvePaperSchedulableQuestions } from '../src/studentAssessments'
import { findSchedulingProblem } from '../src/questionTypes'

const MCQ_WITH_OPTIONS = {
  text: 'Which account normally has a credit balance?',
  type: 'mcq',
  marks: 1,
  options: ['Cash', 'Capital', 'Creditors', 'Debtors'],
}
const MCQ_NO_OPTIONS = {
  text: 'A payment of $5,000 for repair is incorrectly debited to Office Furniture. This is:',
  type: 'mcq',
  marks: 1,
  options: [],
}
const SHORT_ANSWER = {
  text: 'Differentiate Capital and Revenue expenditure with two examples each.',
  type: 'short_answer',
  marks: 5,
}

describe('resolvePaperSchedulableQuestions', () => {
  it('resolves embedded sections in order with options normalised', async () => {
    const paper = {
      sections: [
        {
          id: 'sec-a',
          name: 'Section A (MCQs)',
          questions: [MCQ_WITH_OPTIONS, SHORT_ANSWER],
        },
      ],
      // Bank ids must be IGNORED when embedded sections exist.
      questionIds: ['bank-1', 'bank-2'],
    }
    const questions = await resolvePaperSchedulableQuestions(paper)
    assert.equal(questions.length, 2)
    assert.equal(questions[0].type, 'mcq')
    assert.equal(questions[0].options.length, 4)
    assert.equal(questions[0].options[0].text, 'Cash')
    assert.equal(questions[0].sectionId, 'sec-a')
    assert.equal(questions[1].type, 'short_answer')
  })

  it('returns [] for a paper with no sections and no linked questions', async () => {
    const questions = await resolvePaperSchedulableQuestions({})
    assert.deepEqual(questions, [])
  })

  it('feeds the same validator the schedule gate uses', async () => {
    const paper = {
      sections: [{ id: 'sec-a', name: 'Section A', questions: [MCQ_NO_OPTIONS] }],
    }
    const questions = await resolvePaperSchedulableQuestions(paper)
    assert.equal(questions.length, 1)
    const problem = findSchedulingProblem(questions[0])
    assert.ok(problem)
    assert.match(problem!, /fewer than two options/i)

    // With options present, the same question passes cleanly.
    const fixed = await resolvePaperSchedulableQuestions({
      sections: [{ id: 'sec-a', name: 'Section A', questions: [MCQ_WITH_OPTIONS] }],
    })
    assert.equal(findSchedulingProblem(fixed[0]), null)
  })
})
