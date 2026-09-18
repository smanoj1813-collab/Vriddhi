import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  derivePaperState,
  validatePaperInput,
  submissionReadiness,
  normalizeQuestionOptions,
  firstPaperSchedulingProblem,
  reopenReadiness,
} from '../src/paperWorkflow'

function paper(examType = 'Class Test') {
  return validatePaperInput({
    title: 'Data Structures Test',
    subject: 'Computer Applications',
    branch: 'BCA',
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

// ─── submissionReadiness — the gate behind submitPaperForReview ────────────
// Only editable papers (draft / returned) may be moved into the review queue.
// Papers already awaiting review, or approved/published, are locked.
describe('submissionReadiness (submitPaperForReview gate)', () => {
  it('allows editable papers (draft, returned)', () => {
    assert.deepEqual(submissionReadiness({ status: 'draft' }), { currentStatus: 'draft', submittable: true })
    assert.equal(submissionReadiness({ verificationStatus: 'modification-requested' }).submittable, true)
    assert.equal(submissionReadiness({ verificationStatus: 'rejected-by-hod' }).submittable, true)
    // A paper with no explicit status defaults to draft → editable.
    assert.equal(submissionReadiness(undefined).submittable, true)
  })

  it('blocks papers already in the review queue', () => {
    assert.equal(submissionReadiness({ verificationStatus: 'submitted-for-approval' }).submittable, false)
    assert.equal(submissionReadiness({ verificationStatus: 'pending-verification' }).submittable, false)
  })

  it('blocks approved / published papers', () => {
    // verificationStatus is authoritative and must win over status.
    assert.equal(submissionReadiness({ verificationStatus: 'approved-by-hod', status: 'published' }).submittable, false)
    assert.equal(submissionReadiness({ verificationStatus: 'not-required', status: 'published' }).submittable, false)
  })
})

// ─── normalizeQuestionOptions — options must survive savePaper ─────────────
describe('normalizeQuestionOptions (options round-trip)', () => {
  it('normalises strings to { id, text } with A/B/C labels', () => {
    assert.deepEqual(normalizeQuestionOptions(['One', 'Two', 'Three']), [
      { id: 'A', text: 'One' },
      { id: 'B', text: 'Two' },
      { id: 'C', text: 'Three' },
    ])
  })

  it('accepts { text } / { label } objects and trims them', () => {
    assert.deepEqual(normalizeQuestionOptions([{ text: '  Alpha  ' }, { label: 'beta' }]), [
      { id: 'A', text: 'Alpha' },
      { id: 'B', text: 'beta' },
    ])
  })

  it('drops blank options (keeping input-position labels) and caps at 10', () => {
    // A blank middle option keeps the surrounding labels as the user typed
    // them (A and C), so the stored paper matches the editor's display.
    assert.deepEqual(normalizeQuestionOptions(['A', '  ', 'B']), [
      { id: 'A', text: 'A' },
      { id: 'C', text: 'B' },
    ])
    const many = normalizeQuestionOptions(Array.from({ length: 14 }, (_, i) => `Opt ${i}`))
    assert.equal(many.length, 10)
  })

  it('returns [] for non-arrays (missing options stay empty, not dropped)', () => {
    assert.deepEqual(normalizeQuestionOptions(undefined), [])
    assert.deepEqual(normalizeQuestionOptions(null), [])
    assert.deepEqual(normalizeQuestionOptions('not-an-array'), [])
  })

  it('validatePaperInput keeps options on every question', () => {
    const input = validatePaperInput({
      title: 'T', subject: 'S', examType: 'Class Test', duration: 30, totalMarks: 1,
      requiresApproval: false,
      sections: [{
        name: 'A',
        questions: [{ text: 'Pick one', type: 'mcq', marks: 1, options: ['X', 'Y', 'Z'] }],
      }],
    })
    assert.deepEqual(input.sections[0].questions[0].options, [
      { id: 'A', text: 'X' },
      { id: 'B', text: 'Y' },
      { id: 'C', text: 'Z' },
    ])
  })
})

// ─── firstPaperSchedulingProblem — the savePaper non-draft gate ────────────
describe('firstPaperSchedulingProblem (savePaper gate)', () => {
  const section = (questions: Array<Record<string, unknown>>) => [{ questions: questions.map((q) => ({ options: [], ...q })) }]

  it('flags an MCQ with fewer than two options, with the question number', () => {
    const problem = firstPaperSchedulingProblem(section([
      { text: 'Fine question', type: 'short_answer', marks: 5 },
      { text: 'Which of these?', type: 'mcq', marks: 1, options: [{ id: 'A', text: 'Only one' }] },
    ]))
    assert.equal(problem, 'Question 2 is a mcq question but has fewer than two options — add the missing options in the paper.')
  })

  it('returns null when every question is schedulable', () => {
    const problem = firstPaperSchedulingProblem(section([
      { text: 'Q1', type: 'mcq', marks: 1, options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }] },
      { text: 'Q2', type: 'short_answer', marks: 5 },
    ]))
    assert.equal(problem, null)
  })

  it('flags zero-mark and missing-text questions', () => {
    assert.match(firstPaperSchedulingProblem(section([{ text: 'Q', type: 'mcq', marks: 0, options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }] }]))!, /no marks/)
    assert.match(firstPaperSchedulingProblem(section([{ text: '   ', type: 'short_answer', marks: 5 }]))!, /no question text/)
  })
})

// ─── reopenReadiness — the recovery gate behind reopenPaperForEditing ──────
describe('reopenReadiness (reopenPaperForEditing gate)', () => {
  const faculty = { role: 'faculty' }
  const hod = { role: 'hod' }
  const author = 'uid-1'
  const other = 'uid-2'

  it('lets the author re-open papers they submitted or self-published', () => {
    assert.equal(reopenReadiness({ verificationStatus: 'submitted-for-approval' }, faculty, author, author).allowed, true)
    assert.equal(reopenReadiness({ verificationStatus: 'pending-verification' }, faculty, author, author).allowed, true)
    assert.equal(reopenReadiness({ verificationStatus: 'not-required', status: 'published' }, faculty, author, author).allowed, true)
  })

  it('lets a reviewer re-open a reviewer-approved paper too', () => {
    assert.equal(reopenReadiness({ verificationStatus: 'approved-by-hod' }, hod, other, author).allowed, true)
    // ...but a plain faculty member may not un-approve someone else's paper.
    assert.equal(reopenReadiness({ verificationStatus: 'approved-by-hod' }, faculty, other, author).allowed, false)
  })

  it('blocks non-authors and already-editable states', () => {
    assert.equal(reopenReadiness({ verificationStatus: 'submitted-for-approval' }, faculty, other, author).allowed, false)
    assert.equal(reopenReadiness({ verificationStatus: 'draft' }, faculty, author, author).allowed, false)
    assert.equal(reopenReadiness({ verificationStatus: 'modification-requested' }, faculty, author, author).allowed, false)
  })
})
