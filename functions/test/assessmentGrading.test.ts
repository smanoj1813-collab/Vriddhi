import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  gradeAssessmentPaper,
  gradeFromPercentage,
  type ServerQuestion,
} from '../src/assessmentGrading'

function question(overrides: Partial<ServerQuestion>): ServerQuestion {
  return {
    id: 'q1',
    questionId: 'q1',
    order: 1,
    text: 'Question',
    type: 'mcq',
    marks: 2,
    negativeMarks: 0.5,
    options: [
      { id: 'a', text: 'A', isCorrect: true },
      { id: 'b', text: 'B' },
    ],
    ...overrides,
  }
}

describe('server assessment grading', () => {
  it('grades objective answers and applies configured negative marks', () => {
    const graded = gradeAssessmentPaper(
      [question({ id: 'correct', questionId: 'correct' }), question({ id: 'wrong', questionId: 'wrong' })],
      [
        { questionId: 'correct', selectedOptionId: 'a', isFlagged: false },
        { questionId: 'wrong', selectedOptionId: 'b', isFlagged: false },
      ]
    )
    assert.equal(graded.autoScore, 1.5)
    assert.equal(graded.correctCount, 1)
    assert.equal(graded.incorrectCount, 1)
  })

  it('requires an exact set for multi-select questions', () => {
    const q = question({
      type: 'multi_select',
      options: [
        { id: 'a', text: 'A', isCorrect: true },
        { id: 'b', text: 'B', isCorrect: true },
        { id: 'c', text: 'C' },
      ],
    })
    assert.equal(
      gradeAssessmentPaper([q], [{ questionId: 'q1', selectedOptionIds: ['b', 'a'], isFlagged: false }]).correctCount,
      1
    )
    assert.equal(
      gradeAssessmentPaper([q], [{ questionId: 'q1', selectedOptionIds: ['a'], isFlagged: false }]).incorrectCount,
      1
    )
  })

  it('normalizes exact fill-in answers and respects numerical tolerance', () => {
    const fill = question({ id: 'fill', questionId: 'fill', type: 'fill_in_blank', correctAnswer: ['New Delhi', 'Delhi'], options: [] })
    const number = question({ id: 'number', questionId: 'number', type: 'numerical', correctAnswer: '3.14', tolerance: 0.01, options: [] })
    const graded = gradeAssessmentPaper([fill, number], [
      { questionId: 'fill', textAnswer: '  new   delhi ', isFlagged: false },
      { questionId: 'number', numericalAnswer: 3.145, isFlagged: false },
    ])
    assert.equal(graded.correctCount, 2)
  })

  it('leaves subjective and unsupported matching answers for manual grading', () => {
    const graded = gradeAssessmentPaper(
      [
        question({ id: 'essay', questionId: 'essay', type: 'long_answer', marks: 10, options: [] }),
        question({ id: 'match', questionId: 'match', type: 'matching', marks: 4, options: [] }),
      ],
      [{ questionId: 'essay', textAnswer: 'Response', isFlagged: false }]
    )
    assert.equal(graded.needsManualGrading, true)
    assert.equal(graded.manualMax, 14)
    assert.equal(graded.perQuestion[0].status, 'pending_manual')
  })

  it('does not require faculty grading when subjective questions were not attempted', () => {
    const graded = gradeAssessmentPaper(
      [question({ id: 'essay', questionId: 'essay', type: 'long_answer', marks: 10, options: [] })],
      []
    )
    assert.equal(graded.needsManualGrading, false)
    assert.equal(graded.manualMax, 10)
    assert.equal(graded.unattemptedCount, 1)
  })

  it('derives grade bands only on the server', () => {
    assert.deepEqual(gradeFromPercentage(90), { grade: 'A+', gradePoint: 10 })
    assert.deepEqual(gradeFromPercentage(39.99), { grade: 'F', gradePoint: 0 })
  })
})
