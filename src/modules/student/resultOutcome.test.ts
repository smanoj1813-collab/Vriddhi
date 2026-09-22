import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveQuestionOutcomeStatus,
  resolveResultPerformance,
  resolveSectionSummaries,
  summarizeQuestionOutcomes,
  summarizeSections,
} from './utils/resultOutcome'

const question = (overrides: Record<string, unknown>) => ({
  questionId: 'q1',
  sectionName: 'Section A',
  marks: 1,
  marksObtained: 1,
  status: 'correct',
  isAttempted: true,
  ...overrides,
}) as Parameters<typeof resolveQuestionOutcomeStatus>[0]

test('outcomes: manually graded answers count by the marks they earned', () => {
  assert.equal(resolveQuestionOutcomeStatus(question({ marks: 5, marksObtained: 5, status: 'manual_graded' })), 'correct')
  assert.equal(resolveQuestionOutcomeStatus(question({ marks: 5, marksObtained: 4, status: 'manual_graded' })), 'partial')
  assert.equal(resolveQuestionOutcomeStatus(question({ marks: 5, marksObtained: 0, status: 'manual_graded' })), 'incorrect')
  assert.equal(resolveQuestionOutcomeStatus(question({ marks: 5, marksObtained: 0, status: 'incorrect' })), 'incorrect')
})

test('outcomes: a blank answer is unattempted, a waiting one is pending', () => {
  assert.equal(resolveQuestionOutcomeStatus(question({ isAttempted: false, marksObtained: 0, status: 'unattempted' })), 'unattempted')
  assert.equal(resolveQuestionOutcomeStatus(question({ marksObtained: null, status: 'pending_manual' })), 'pending_manual')
  assert.equal(resolveQuestionOutcomeStatus(question({ marksObtained: null, status: 'pending' })), 'pending_manual')
})

test('outcomes: negative marking never reads as a partial credit', () => {
  assert.equal(resolveQuestionOutcomeStatus(question({ marks: 2, marksObtained: -0.5, status: 'incorrect' })), 'incorrect')
})

test('summary: the reported paper reads 5/5 correct in section A and 3 partial in section B', () => {
  // The exact shape of the report that started this: 5 one-mark MCQs awarded
  // full marks by manual grading + 3 short answers worth 5 each awarded 10
  // marks in total. It used to render as "0/8 correct, 0/8 incorrect,
  // 0/8 unattempted" next to a 15/20 score.
  const questions = [
    ...['a1', 'a2', 'a3', 'a4', 'a5'].map((id) =>
      question({ questionId: id, sectionName: 'Section A — MCQ', marks: 1, marksObtained: 1, status: 'manual_graded' })
    ),
    question({ questionId: 'b1', sectionName: 'Section B — Short answers', marks: 5, marksObtained: 4, status: 'manual_graded' }),
    question({ questionId: 'b2', sectionName: 'Section B — Short answers', marks: 5, marksObtained: 3, status: 'manual_graded' }),
    question({ questionId: 'b3', sectionName: 'Section B — Short answers', marks: 5, marksObtained: 3, status: 'manual_graded' }),
  ]

  const performance = resolveResultPerformance({ questionResults: questions })
  assert.equal(performance.correct, 5)
  assert.equal(performance.partial, 3)
  assert.equal(performance.incorrect, 0)
  assert.equal(performance.unattempted, 0)
  assert.equal(performance.correctMarks, 5)
  assert.equal(performance.awardedMarks, 15)
  assert.equal(performance.totalMarks, 20)
  assert.equal(performance.answered, 8)

  const sections = resolveSectionSummaries({ questionResults: questions })
  assert.equal(sections.length, 2)
  assert.deepEqual(
    { name: sections[0].sectionName, correct: sections[0].correct, total: sections[0].total, score: sections[0].score, totalMarks: sections[0].totalMarks, correctMarks: sections[0].correctMarks },
    { name: 'Section A — MCQ', correct: 5, total: 5, score: 5, totalMarks: 5, correctMarks: 5 }
  )
  assert.deepEqual(
    { correct: sections[1].correct, partial: sections[1].partial, score: sections[1].score, totalMarks: sections[1].totalMarks, percentage: sections[1].percentage },
    { correct: 0, partial: 3, score: 10, totalMarks: 15, percentage: 67 }
  )
})

test('buckets always add up to the number of questions', () => {
  const questions = [
    question({ questionId: 'c', marks: 2, marksObtained: 2 }),
    question({ questionId: 'p', marks: 4, marksObtained: 2, status: 'manual_graded' }),
    question({ questionId: 'w', marks: 2, marksObtained: -0.5, status: 'incorrect' }),
    question({ questionId: 'u', marks: 2, marksObtained: null, status: 'unattempted', isAttempted: false }),
    question({ questionId: 'm', marks: 10, marksObtained: null, status: 'pending_manual' }),
  ]
  const counts = summarizeQuestionOutcomes(questions)
  assert.equal(
    counts.correct + counts.partial + counts.incorrect + counts.unattempted + counts.pending,
    questions.length
  )
  assert.deepEqual(
    { correct: counts.correct, partial: counts.partial, incorrect: counts.incorrect, unattempted: counts.unattempted, pending: counts.pending, answered: counts.answered },
    { correct: 1, partial: 1, incorrect: 1, unattempted: 1, pending: 1, answered: 4 }
  )
})

test('sections: rows keep first-seen order and roll the same numbers up', () => {
  const questions = [
    question({ questionId: 'b1', sectionName: 'Section B', marks: 5, marksObtained: 5 }),
    question({ questionId: 'b2', sectionName: 'Section B', marks: 5, marksObtained: 0, status: 'manual_graded' }),
    question({ questionId: 'a1', sectionName: 'Section A', marks: 1, marksObtained: 1 }),
  ]
  const sections = summarizeSections(questions)
  assert.deepEqual(sections.map((section) => section.sectionName), ['Section B', 'Section A'])
  assert.equal(sections[0].score, 5)
  assert.equal(sections[0].totalMarks, 10)
  assert.equal(sections[0].percentage, 50)
  assert.equal(sections[0].incorrect, 1)
})

test('without per-question data the server totals are used as given', () => {
  const performance = resolveResultPerformance({
    correctCount: 3,
    incorrectCount: 1,
    unattemptedCount: 0,
    correctMarks: 6,
    awardedMarks: 7,
    totalMarks: 8,
    totalQuestions: 4,
  })
  assert.equal(performance.derivedFromQuestions, false)
  assert.equal(performance.correct, 3)
  assert.equal(performance.correctMarks, 6)
  assert.equal(performance.partialMarks, 1)
  assert.equal(performance.totalQuestions, 4)
})
