import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { derivePaperState, validatePaperInput } from '../src/paperWorkflow'

function paper(examType = 'Class Test') {
  return validatePaperInput({
    title: 'Data Structures Test',
    subject: 'Computer Science',
    branch: 'CSE',
    batch: '2026',
    semester: '3',
    examType,
    date: '2026-09-01',
    duration: 60,
    totalMarks: 999,
    instructions: 'Answer all questions.',
    requiresApproval: false,
    sections: [{
      id: 'a',
      name: 'Section A',
      questions: [
        { text: 'Explain stacks.', type: 'long_answer', marks: 10, topic: 'Stacks' },
        { text: 'Explain queues.', type: 'long_answer', marks: 5, topic: 'Queues' },
      ],
    }],
  })
}

describe('paper workflow validation', () => {
  it('recalculates marks and question numbering on the server', () => {
    const result = paper()
    assert.equal(result.totalMarks, 15)
    assert.equal(result.totalQuestions, 2)
    assert.deepEqual(result.sections[0].questions.map((question) => question.number), [1, 2])
  })

  it('requires high-stakes exams to enter review', () => {
    const result = paper('Semester End')
    assert.equal(result.requiresApproval, true)
    assert.throws(() => derivePaperState('save', result, false), /requires approval/)
    assert.deepEqual(derivePaperState('submitted', result, false), {
      status: 'draft',
      verificationStatus: 'submitted-for-approval',
      requiresApproval: true,
    })
  })

  it('does not allow faculty to claim direct reviewer publication', () => {
    assert.throws(() => derivePaperState('published', paper(), false), /authorized reviewer/)
    assert.equal(derivePaperState('published', paper(), true).verificationStatus, 'approved-by-hod')
  })

  it('rejects excessive question marks and malformed semesters', () => {
    assert.throws(() => validatePaperInput({
      title: 'Paper', subject: 'Subject', semester: '99', examType: 'Test',
      duration: 30, totalMarks: 10, sections: [],
    }), /semester is invalid/)
    assert.throws(() => validatePaperInput({
      title: 'Paper', subject: 'Subject', semester: '1', examType: 'Test',
      duration: 30, totalMarks: 10,
      sections: [{ questions: [{ text: 'Question', type: 'mcq', marks: 1001 }] }],
    }), /Question marks are invalid/)
  })
})
