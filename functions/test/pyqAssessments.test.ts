// functions/test/pyqAssessments.test.ts
//
// Platform-assigned previous-year papers → college assessment papers.
// Pins: fail-closed assignment reads, verbatim question copy (stem + parts),
// selection by question key, file-only PDFs refused, the produced payload
// passing the SAME validatePaperInput + scheduling check the paper pipeline
// and scheduler use, and no university attribution leaking into the paper.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PYQ_EXAM_TYPE,
  buildPyqPaperInput,
  isAssessmentReadyPyq,
  isPyqAssigned,
  normalizePyqAssignments,
  pyqQuestionKey,
  pyqQuestionText,
  pyqQuestionType,
  type PyqSourcePaper,
} from '../src/pyqAssessments'
import { firstPaperSchedulingProblem, validatePaperInput } from '../src/paperWorkflow'
import { SEEDED_PREP_PAPERS } from '../src/data/prepPapers/index'
import { SEEDED_DRIVE_PYQ_FILES } from '../src/data/prepPapers/drivePyqFiles'

const PAPER: PyqSourcePaper = {
  id: 'bba-test-paper',
  contentType: 'structured',
  status: 'published',
  program: 'bba',
  programLabel: 'BBA',
  semester: 3,
  subjectName: 'Business Law',
  examLabel: 'March 2024',
  durationMinutes: 150,
  instructions: ['Answer all sections.'],
  sections: [
    {
      id: 'A',
      title: 'Section A',
      instruction: 'Answer any FIVE of the following. Each question carries 2 marks.',
      answerCount: 5,
      marksEach: 2,
      questions: [
        { label: '1(a)', text: 'Define contract.' },
        { label: '1(b)', text: 'What is consideration?' },
        { label: '1(c)', text: '   ' },
      ],
    },
    {
      id: 'B',
      title: 'Section B',
      instruction: 'Answer any THREE. Each question carries 6 marks.',
      answerCount: 3,
      marksEach: 6,
      questions: [
        { label: '2', text: 'Write short notes on:', parts: ['(a) Consumer', '(b) Defect'] },
        { label: '3', text: 'Explain the essentials of a valid contract.', marks: 8 },
      ],
    },
  ],
}

describe('PYQ assignment settings', () => {
  it('normalises the config doc and fails closed', () => {
    assert.deepEqual(normalizePyqAssignments(null), { assignments: {} })
    assert.deepEqual(normalizePyqAssignments({ assignments: 'x' }), { assignments: {} })
    const settings = normalizePyqAssignments({
      assignments: {
        a: { enabled: true, assignedAt: '2026-10-02T00:00:00.000Z', assignedBy: 'sa' },
        b: { enabled: 'yes' },
        c: 'junk',
      },
      updatedBy: 'sa',
    })
    assert.equal(isPyqAssigned(settings, 'a'), true)
    assert.equal(isPyqAssigned(settings, 'b'), false, 'only a literal true enables')
    assert.equal(isPyqAssigned(settings, 'c'), false)
    assert.equal(isPyqAssigned(settings, 'missing'), false)
    assert.equal(settings.updatedBy, 'sa')
  })
})

describe('PYQ → assessment paper', () => {
  it('copies stem and parts verbatim and picks a descriptive type from marks', () => {
    assert.equal(pyqQuestionText({ text: ' Write notes on: ', parts: ['(a) X', '', ' (b) Y '] }), 'Write notes on:\n(a) X\n(b) Y')
    assert.equal(pyqQuestionType(2), 'short_answer')
    assert.equal(pyqQuestionType(3), 'short_answer')
    assert.equal(pyqQuestionType(6), 'long_answer')
  })

  it('builds a payload that passes validatePaperInput and the scheduling check', () => {
    const paper = validatePaperInput(buildPyqPaperInput(PAPER))
    assert.equal(paper.examType, PYQ_EXAM_TYPE)
    assert.equal(paper.requiresApproval, false, 'PYQ practice is not a high-stakes exam type')
    assert.equal(paper.totalQuestions, 4, 'blank question text is skipped')
    assert.equal(paper.totalMarks, 2 + 2 + 6 + 8, 'per-question marks override the section default')
    assert.equal(paper.duration, 150)
    assert.equal(paper.semester, '3')
    assert.equal(paper.title, 'PYQ: Business Law (March 2024)')
    assert.match(paper.instructions, /Section A: Answer any FIVE/)
    assert.equal(paper.sections[1].questions[0].text, 'Write short notes on:\n(a) Consumer\n(b) Defect')
    assert.equal(paper.sections[1].questions[1].type, 'long_answer')
    assert.equal(firstPaperSchedulingProblem(paper.sections), null)
  })

  it('honours the faculty selection and drops empty sections', () => {
    const paper = validatePaperInput(buildPyqPaperInput(PAPER, {
      selectedKeys: [pyqQuestionKey('B', 1)],
      title: '  Mid-term practice  ',
      durationMinutes: 45,
    }))
    assert.equal(paper.sections.length, 1)
    assert.equal(paper.sections[0].name, 'Section B')
    assert.equal(paper.totalQuestions, 1)
    assert.equal(paper.totalMarks, 8)
    assert.equal(paper.title, 'Mid-term practice')
    assert.equal(paper.duration, 45)
  })

  it('rejects an empty selection and out-of-range durations fall back to the paper', () => {
    assert.throws(() => buildPyqPaperInput(PAPER, { selectedKeys: ['Z#9'] }), /at least one question/)
    assert.equal(buildPyqPaperInput(PAPER, { durationMinutes: 9999 }).duration, 150)
    assert.equal(buildPyqPaperInput({ ...PAPER, durationMinutes: undefined }).duration, 60)
  })

  it('refuses original-PDF papers that have no transcribed questions', () => {
    const fileOnly = SEEDED_DRIVE_PYQ_FILES[0] as unknown as PyqSourcePaper
    assert.equal(isAssessmentReadyPyq(fileOnly), false)
    assert.throws(() => buildPyqPaperInput(fileOnly), /only available as the original PDF/)
  })

  it('every transcribed seed paper converts into a schedulable paper with no university name', () => {
    assert.ok(SEEDED_PREP_PAPERS.length > 0)
    for (const seeded of SEEDED_PREP_PAPERS) {
      const source = seeded as unknown as PyqSourcePaper
      if (!isAssessmentReadyPyq(source)) continue
      const paper = validatePaperInput(buildPyqPaperInput(source))
      assert.equal(firstPaperSchedulingProblem(paper.sections), null, `${seeded.id} should be schedulable`)
      assert.ok(paper.totalMarks > 0, `${seeded.id} should carry marks`)
      if (seeded.universityName) {
        assert.ok(!paper.title.includes(seeded.universityName), `${seeded.id} title must not name the university`)
        assert.ok(!paper.instructions.includes(seeded.universityName), `${seeded.id} instructions must not name the university`)
      }
    }
  })
})
