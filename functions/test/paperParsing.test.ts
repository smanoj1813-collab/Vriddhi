import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildParsePrompt,
  canConfirmPaperStructure,
  detStripMarks,
  deterministicParse,
  extractPaperText,
  MIN_DETERMINISTIC_COVERAGE,
  normalizeConfirmSections,
  normalizeParsedStructure,
  normalizeQuestionType,
  SUPPORTED_QUESTION_TYPES,
} from '../src/paperParsing'
import { canDeletePaper, canEditExistingPaper, hasActiveScheduledTest, paperReadiness } from '../src/paperWorkflow'

// ─── Fixtures ───────────────────────────────────────────────────────────────

/** Builds a tiny single-page PDF with a Helvetica text layer (no deps). */
function makePdf(lines: string[]): Buffer {
  const stream = lines.map((line, index) => `BT /F1 11 Tf 50 ${750 - index * 20} Td (${line}) Tj ET`).join('\n')
  const objects: Record<number, string> = {
    1: '<< /Type /Catalog /Pages 2 0 R >>',
    2: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    3: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    4: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    5: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  }
  let out = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (let i = 1; i <= 5; i += 1) {
    offsets[i] = out.length
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = out.length
  out += 'xref\n0 6\n0000000000 65535 f \n'
  for (let i = 1; i <= 5; i += 1) out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n'
  out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(out, 'utf8')
}

/** Minimal valid .docx (zip of word/document.xml) — generated once, embedded. */
const DOCX_BASE64 =
  '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'

const PDF_TYPE = 'application/pdf'
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

describe('paper file text extraction (digital PDF/DOCX only)', () => {
  it('extracts the text layer from a digital PDF', async () => {
    const pdf = makePdf([
      'PRE-ASSESSMENT PAPER',
      'Subject: Financial Accounting. Duration: 60 min. Max Marks: 30',
      'Q1. Define the accounting equation. (5)',
      'Q2. Explain the double entry system. (10)',
    ])
    const extracted = await extractPaperText(pdf, PDF_TYPE)
    assert.equal(extracted.kind, 'pdf')
    assert.equal(extracted.pages, 1)
    assert.match(extracted.text, /PRE-ASSESSMENT PAPER/)
    assert.match(extracted.text, /Define the accounting equation/)
    assert.match(extracted.text, /Explain the double entry system/)
  })

  it('extracts text from a DOCX buffer', async () => {
    const docx = Buffer.from(DOCX_BASE64, 'base64')
    const extracted = await extractPaperText(docx, DOCX_TYPE)
    assert.equal(extracted.kind, 'docx')
    assert.match(extracted.text, /Mid Sem Test/)
    assert.match(extracted.text, /Big-O notation/)
  })

  it('refuses content types that are not digital PDF/DOCX', async () => {
    await assert.rejects(
      () => extractPaperText(Buffer.from('whatever'), 'image/png'),
      /Only digital PDF and DOCX files can be parsed/
    )
    await assert.rejects(
      () => extractPaperText(Buffer.from('whatever'), 'application/msword'),
      /Only digital PDF and DOCX files can be parsed/
    )
  })
})

describe('Gemini parse structuring', () => {
  it('normalises a model response, caps sizes and never keeps answers', () => {
    const parsed = normalizeParsedStructure({
      meta: { title: '  Test  ', subject: 'FA', durationMinutes: '60', totalMarks: 30 },
      sections: [
        {
          name: 'Section A',
          questions: [
            { text: 'Define the accounting equation.', type: 'short', marks: 5, topic: 'Basics' },
            {
              text: 'Which is a current asset?',
              type: 'mcq',
              marks: 2,
              topic: 'Assets',
              options: ['Building', 'Inventory', 'Goodwill', 'Land'],
              correctAnswer: 'B',
              isCorrect: true,
            },
            { text: '   ', type: 'mcq', marks: 1 },
          ],
        },
      ],
    })
    assert.equal(parsed.questionCount, 2)
    assert.equal(parsed.sections.length, 1)
    assert.equal(parsed.meta.title, 'Test')
    assert.equal(parsed.meta.durationMinutes, 60)
    // unknown-ish aliases collapse to the agreed manual-graded defaults
    assert.equal(parsed.sections[0].questions[0].type, 'short_answer')
    // MCQ options are transcribed...
    assert.deepEqual(parsed.sections[0].questions[1].options, ['Building', 'Inventory', 'Goodwill', 'Land'])
    // ...but any answer-bearing material is stripped, never carried forward
    const mcq = parsed.sections[0].questions[1]
    assert.equal((mcq as Record<string, unknown>).correctAnswer, undefined)
    assert.equal((mcq as Record<string, unknown>).isCorrect, undefined)
  })

  it('caps questions at 400 and warns', () => {
    const questions = Array.from({ length: 420 }, (_, index) => ({
      text: `Question ${index + 1}`,
      type: 'long_answer',
      marks: 1,
    }))
    const parsed = normalizeParsedStructure({ sections: [{ name: 'A', questions }] })
    assert.equal(parsed.questionCount, 400)
    assert.ok(parsed.warnings.some((warning) => warning.includes('400')))
  })

  it('keeps zero marks instead of inventing them', () => {
    const parsed = normalizeParsedStructure({
      sections: [{ name: 'A', questions: [{ text: 'Explain ledger.', type: 'long', marks: null }] }],
    })
    assert.equal(parsed.sections[0].questions[0].marks, 0)
    assert.equal(parsed.sections[0].questions[0].type, 'long_answer')
  })

  it('maps unknown types to short/long answer instead of objective formats', () => {
    assert.equal(normalizeQuestionType('Essay'), 'long_answer')
    assert.equal(normalizeQuestionType('MCQ'), 'mcq')
    assert.equal(normalizeQuestionType('weird-type'), 'long_answer')
    assert.ok(SUPPORTED_QUESTION_TYPES.has(normalizeQuestionType('long_answer')))
  })

  it('builds a prompt that forbids inventing answers and marks', () => {
    const prompt = buildParsePrompt('Q1. Define cash. (5)', {
      subject: 'Financial Accounting',
      examType: 'Class Test',
      title: 'Sample',
    })
    assert.match(prompt, /Financial Accounting/)
    assert.match(prompt, /Class Test/)
    assert.match(prompt, /Q1\. Define cash\. \(5\)/)
    assert.match(prompt, /NEVER output correct answers/i)
    assert.match(prompt, /answer key/i)
    assert.match(prompt, /short_answer/)
    assert.match(prompt, /transcribe/i)
  })
})

describe('confirm structure validation (the one server Confirm)', () => {
  it('accepts a clean structure and normalises it', () => {
    const sections = normalizeConfirmSections([
      {
        id: 'section-a',
        name: 'Section A',
        questions: [
          { text: 'Define the accounting equation.', type: 'short_answer', marks: 5, topic: 'Basics' },
          { text: 'Explain double entry.', type: 'long_answer', marks: 10, topic: 'Entries' },
        ],
      },
    ])
    assert.equal(sections.length, 1)
    assert.equal(sections[0].questions.length, 2)
    assert.equal(sections[0].id, 'section-a')
    assert.equal(sections[0].questions[0].marks, 5)
  })

  it('rejects questions without marks (no invented values)', () => {
    assert.throws(
      () =>
        normalizeConfirmSections([
          { name: 'A', questions: [{ text: 'Question one', type: 'long_answer', marks: 0 }] },
        ]),
      /has no marks/
    )
  })

  it('rejects question types the assessment engine cannot schedule', () => {
    assert.throws(
      () =>
        normalizeConfirmSections([
          { name: 'A', questions: [{ text: 'Question one', type: 'handwriting_sample', marks: 5 }] },
        ]),
      /cannot be scheduled online/
    )
  })

  it('rejects empty structures', () => {
    assert.throws(() => normalizeConfirmSections([]), /Nothing to confirm/)
    assert.throws(() => normalizeConfirmSections(null), /Nothing to confirm/)
  })

  it('rejects question papers over 400 questions', () => {
    const questions = Array.from({ length: 401 }, (_, index) => ({
      text: `Q${index + 1}`,
      type: 'long_answer',
      marks: 1,
    }))
    assert.throws(() => normalizeConfirmSections([{ name: 'A', questions }]), /at most 400/)
  })

  it('normalises MCQ options stored as objects and drops them for other types', () => {
    const sections = normalizeConfirmSections([
      {
        name: 'A',
        questions: [
          { text: 'Pick one.', type: 'mcq', marks: 1, options: [{ text: 'A' }, 'B'] },
          { text: 'Explain.', type: 'long_answer', marks: 5, options: ['ignored'] },
        ],
      },
    ])
    assert.deepEqual(sections[0].questions[0].options, ['A', 'B'])
    assert.equal(sections[0].questions[1].options, undefined)
  })
})

describe('confirm + edit state gates', () => {
  const author = { role: 'faculty' }
  const reviewer = { role: 'hod' }

  it('lets the author or a reviewer confirm not-required and in-review papers', () => {
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'not-required', createdBy: 'u1' }, author, 'u1'), true)
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'not-required', createdBy: 'u1' }, reviewer, 'u9'), true)
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'submitted-for-approval', createdBy: 'u1' }, author, 'u1'), true)
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'draft', createdBy: 'u1' }, author, 'u1'), true)
  })

  it('keeps approved papers reviewer-only', () => {
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'approved-by-hod', createdBy: 'u1' }, reviewer, 'u9'), true)
    assert.equal(canConfirmPaperStructure({ verificationStatus: 'approved-by-hod', createdBy: 'u1' }, author, 'u1'), false)
  })

  it('allows the author to re-open a file-only not-required paper (the Slice 1 unblock)', () => {
    const staff = { role: 'faculty', uid: 'u1' }
    assert.equal(canEditExistingPaper({ verificationStatus: 'not-required', totalQuestions: 0, createdBy: 'u1' }, staff), true)
    // but not once it has structured questions, and not for other authors
    assert.equal(canEditExistingPaper({ verificationStatus: 'not-required', totalQuestions: 3, createdBy: 'u1' }, staff), false)
    assert.equal(canEditExistingPaper({ verificationStatus: 'not-required', totalQuestions: 0, createdBy: 'u2' }, staff), false)
    // submitted / approved states stay locked for the author
    assert.equal(canEditExistingPaper({ verificationStatus: 'submitted-for-approval', totalQuestions: 0, createdBy: 'u1' }, staff), false)
    assert.equal(canEditExistingPaper({ verificationStatus: 'approved-by-hod', totalQuestions: 0, createdBy: 'u1' }, staff), false)
    // plain editable states are untouched
    assert.equal(canEditExistingPaper({ verificationStatus: 'draft', totalQuestions: 5, createdBy: 'u2' }, staff), true)
  })
})

describe('readiness flags (print / online / bank)', () => {
  it('flags a file-only paper as print-ready only', () => {
    const flags = paperReadiness({ filePath: 'paper-files/c/u/p/paper.pdf', sections: [] })
    assert.deepEqual(flags, { printReady: true, onlineReady: false, bankReady: false })
  })

  it('flags a structured paper as online-ready once sections exist', () => {
    const flags = paperReadiness({
      filePath: 'paper-files/c/u/p/paper.pdf',
      sections: [{ questions: [{ text: 'Q1' }, { text: 'Q2' }] }],
    })
    assert.deepEqual(flags, { printReady: true, onlineReady: true, bankReady: false })
  })

  it('flags bank-ready only when question documents are linked', () => {
    const flags = paperReadiness({
      sections: [{ questions: [{ text: 'Q1' }] }],
      questionIds: ['q1', 'q2'],
    })
    assert.deepEqual(flags, { printReady: false, onlineReady: true, bankReady: true })
  })

  it('treats legacy bank-linked papers (questionIds, no sections) as online-ready', () => {
    const flags = paperReadiness({ linkedQuestionIds: ['q1'] })
    assert.deepEqual(flags, { printReady: false, onlineReady: true, bankReady: true })
  })
})

// ─── Deterministic-first parse (no AI needed) ───────────────────────────────

/** A standard-layout PRE-ASSESSMENT paper: header block + MCQs + short answers. */
const STANDARD_LAYOUT = [
  'KRISHNAPUR UNIVERSITY',
  'B.Com Semester I — PRE-ASSESSMENT Examination 2025-26',
  'Subject: Financial Accounting',
  'Date: 12/09/2025',
  'Time: 1 Hour',
  'Max. Marks: 30',
  'SECTION A — Multiple Choice Questions',
  'Answer ALL questions. Each question carries 1 mark.',
  '1. Which of the following is a current asset?',
  'A. Land',
  'B. Inventory',
  'C. Goodwill',
  'D. Building',
  '2. The accounting equation is best stated as:',
  'A. Assets = Liabilities + Capital',
  'B. Assets = Liabilities - Capital',
  'C. Capital = Assets + Liabilities',
  'D. None of the above',
  '3. The double entry system was described by:',
  'A. Adam Smith',
  'B. Luca Pacioli',
  'C. Karl Marx',
  'D. J.M. Keynes',
  'SECTION B — Short Answer Questions',
  'Answer ANY TWO questions. Each question carries 10 marks.',
  '4. Explain the rules of debit and credit. (10)',
  '5. Distinguish between capital and revenue expenditure. [10]',
].join('\n')

describe('deterministic parse (server-side layout rules, no AI)', () => {
  it('parses a standard question paper layout end-to-end', () => {
    const parsed = deterministicParse(STANDARD_LAYOUT)
    assert.equal(parsed.accepted, true)
    assert.ok(parsed.coverage >= MIN_DETERMINISTIC_COVERAGE, 'coverage should clear the guard')
    assert.equal(parsed.questionCount, 5)
    assert.equal(parsed.sections.length, 2)
    assert.match(parsed.sections[0].name, /SECTION A/)

    const mcqs = parsed.sections[0].questions
    assert.equal(mcqs.length, 3)
    assert.equal(mcqs[0].type, 'mcq')
    assert.equal(mcqs[0].marks, 1, 'default marks from "Each question carries 1 mark"')
    assert.deepEqual(mcqs[0].options, ['Land', 'Inventory', 'Goodwill', 'Building'])
    assert.equal(mcqs[1].options?.[0], 'Assets = Liabilities + Capital')
    assert.equal(mcqs[2].options?.length, 4)
    // transcribed options are text only — nothing answer-bearing exists or is invented
    assert.equal(parsed.warnings.length, 0)

    const shorts = parsed.sections[1].questions
    assert.equal(shorts[0].type, 'long_answer')
    assert.equal(shorts[0].marks, 10, 'printed (10) wins over the section default')
    assert.equal(shorts[1].marks, 10, 'printed [10] is honoured too')
    assert.equal(shorts[0].text.includes('(10)'), false, 'the marks token is stripped from the text')

    assert.equal(parsed.meta.subject, 'Financial Accounting')
    assert.equal(parsed.meta.durationMinutes, 60)
    assert.equal(parsed.meta.totalMarks, 30)
    assert.match(parsed.meta.title, /PRE-ASSESSMENT/)
  })

  it('never invents marks and flags what is missing', () => {
    const parsed = deterministicParse([
      'Section A (20 marks)',
      '1. Define accounting.',
      '2. Give two examples of Current Assets. (2)',
      '3. Write short note on: (a) GST (b) Depreciation',
    ].join('\n'))
    assert.equal(parsed.accepted, true)
    const questions = parsed.sections[0].questions
    assert.equal(questions[0].marks, 0, 'no printed marks → 0, decided by the faculty at review')
    assert.equal(questions[1].marks, 2)
    assert.ok(questions[2].text.includes('(a) GST (b) Depreciation'), 'sub-parts stay in the question text')
    assert.equal(questions[2].options, undefined, 'lowercase sub-parts are not MCQ options')
    assert.ok(parsed.warnings.some((w) => w.includes('no printed marks')))
  })

  it('takes marks from a standalone bracketed line', () => {
    const parsed = deterministicParse([
      'Section A',
      '1. Pick one.',
      'A. x',
      'B. y',
      'C. z',
      'D. w',
      '[1]',
    ].join('\n'))
    assert.equal(parsed.accepted, true)
    assert.equal(parsed.sections[0].questions[0].marks, 1)
    assert.equal(parsed.sections[0].questions[0].type, 'mcq')
  })

  it('defers non-question documents to the AI fallback', () => {
    const parsed = deterministicParse([
      'NOTICE',
      'All students are informed that the central library will remain closed on Saturday on account of the',
      'annual inspection. The sports meet will be held on 15/09/2025 at the main ground, and students should',
      'report to their wardens for instructions about transport arrangements and the roll of participants.',
      'Library timings will be revised from next Monday. The examination cell will publish the revised calendar',
      'on the notice board and on the college portal before the end of this week. No separate communication',
      'will be issued to individual students or parents regarding these changes at this stage of the semester.',
    ].join('\n'))
    assert.equal(parsed.accepted, false)
    assert.equal(parsed.questionCount, 0)
    assert.ok(parsed.warnings.some((w) => w.includes('did not match')))
  })

  it('rejects a few question-like lines buried in unrelated text (coverage guard)', () => {
    const prose = 'The syllabus committee met to discuss the outcome-based curriculum framework. '.repeat(12)
    const parsed = deterministicParse(`${prose}\n1. Explain inflation. (5)\n${prose}`)
    assert.equal(parsed.questionCount, 1)
    assert.equal(parsed.accepted, false, 'recognised lines must cover a meaningful share of the document')
    assert.ok(parsed.warnings.some((w) => w.includes('deferring to the AI fallback')))
  })

  it('caps option lists at the eight letters it recognises, like the AI path', () => {
    const lines = ['Section A', '1. Select every correct alternative below.']
    for (const letter of 'ABCDEFGHI') lines.push(`${letter}. Option ${letter}`)
    const parsed = deterministicParse(lines.join('\n'))
    assert.equal(parsed.accepted, true)
    assert.equal(parsed.sections[0].questions[0].options?.length, 8)
  })

  it('caps questions at 400 like the AI path', () => {
    const lines = ['Section A']
    for (let i = 1; i <= 420; i += 1) lines.push(`${i}. Question number ${i}. (1)`)
    const parsed = deterministicParse(lines.join('\n'))
    assert.equal(parsed.questionCount, 400)
    assert.ok(parsed.warnings.some((w) => w.includes('400')))
  })

  it('strips trailing marks tokens only when they are marks', () => {
    assert.deepEqual(detStripMarks('Explain X (10 marks)'), { rest: 'Explain X', marks: 10 })
    assert.deepEqual(detStripMarks('Define X [2]'), { rest: 'Define X', marks: 2 })
    assert.deepEqual(detStripMarks('Estimate for FY (2025)'), { rest: 'Estimate for FY (2025)', marks: null })
    assert.deepEqual(detStripMarks('Plain question without marks'), { rest: 'Plain question without marks', marks: null })
  })

  it('parses numbered-cell layouts (float-right marks, "N." alone on its line)', () => {
    // The text layer of table/flex-printed papers looks like this: the number
    // is its own line and the right-aligned marks span leads the question text.
    const parsed = deterministicParse([
      'Section A — Accountancy',
      '[10 marks]',
      'Choose the correct option. Each question carries 1 mark.',
      '1.',
      '[1]The accounting equation is:',
      'A. Assets = Liabilities − Capital',
      'B. Assets = Liabilities + Capital',
      '2.',
      '[1]Which of the following is a current asset?',
      'A. Goodwill',
      'B. Inventory',
      '3.',
      '[2]State the golden rules of accounting.',
    ].join('\n'))
    assert.equal(parsed.accepted, true)
    assert.equal(parsed.questionCount, 3)
    const [first, second, third] = parsed.sections[0].questions
    assert.match(first.text, /^The accounting equation is:$/, 'trailing colon survives the marks strip (same on both question paths)')
    assert.equal(first.marks, 1)
    assert.equal(first.type, 'mcq')
    assert.deepEqual(first.options, ['Assets = Liabilities − Capital', 'Assets = Liabilities + Capital'])
    assert.equal(second.marks, 1)
    assert.equal(third.marks, 2)
    assert.equal(third.type, 'short_answer')
    // a lone section-total "[10 marks]" must not leak into any question's marks
    assert.ok(parsed.sections[0].questions.every((q) => q.marks <= 2))
  })

  it('drops stray "N." openers that never receive a question body', () => {
    const parsed = deterministicParse([
      'Section A',
      '1.',
      '[1]Explain the ledger.',
      '2.',
      '3.',
      '[1]Define journal.',
    ].join('\n'))
    assert.equal(parsed.questionCount, 2)
    assert.equal(parsed.accepted, true)
    const texts = parsed.sections[0].questions.map((q) => q.text)
    assert.deepEqual(texts, ['Explain the ledger.', 'Define journal.'])
  })

  it('handles "All questions carry N marks" wording and empty documents', () => {
    const parsed = deterministicParse([
      'Section A (Objective Type)',
      'All questions carry 2 marks.',
      '1. Choose the correct alternative: Accounting period assumes the business:',
      'A. Has an indefinite life',
      'B. Closes every year',
      'C. Is owned by the government',
      'D. Has no liabilities',
      '2. Define bank reconciliation statement. [2 Marks]',
    ].join('\n'))
    assert.equal(parsed.accepted, true)
    assert.equal(parsed.sections[0].questions[0].marks, 2, 'carry-wording sets the section default')
    assert.equal(parsed.sections[0].questions[1].marks, 2, 'printed [2 Marks] is honoured')

    const empty = deterministicParse('')
    assert.equal(empty.accepted, false)
    assert.equal(empty.questionCount, 0)
    assert.equal(empty.coverage, 0)
  })

  it('parses straight from a generated PDF text layer (the faculty upload path)', async () => {
    const pdf = makePdf([
      'PRE-ASSESSMENT PAPER - B.Com Semester I',
      'Time: 60 Minutes',
      'Max. Marks: 30',
      'Section A - Objective Questions',
      'All questions carry 10 marks.',
      '1. Define the accounting equation.',
      '2. Explain the double entry system.',
    ])
    const extracted = await extractPaperText(pdf, PDF_TYPE)
    const parsed = deterministicParse(extracted.text)
    assert.equal(parsed.accepted, true, 'the extracted layout must be trusted without any AI call')
    assert.equal(parsed.questionCount, 2)
    assert.equal(parsed.sections[0].questions[0].marks, 10)
    assert.match(parsed.sections[0].questions[1].text, /double entry/)
    assert.equal(parsed.meta.durationMinutes, 60)
    assert.equal(parsed.meta.totalMarks, 30)
    assert.equal(parsed.meta.title, 'PRE-ASSESSMENT PAPER - B.Com Semester I')
  })
})

// ─── Paper deletion gates ───────────────────────────────────────────────────

describe('delete paper gates (who/when may remove a paper)', () => {
  const author = { role: 'faculty', uid: 'u1' }
  const reviewer = { role: 'hod', uid: 'u9' }
  const otherFaculty = { role: 'faculty', uid: 'u2' }

  it('lets authors and reviewers delete editable / not-required papers', () => {
    assert.deepEqual(canDeletePaper({ verificationStatus: 'draft', createdBy: 'u1' }, author), { ok: true })
    assert.deepEqual(canDeletePaper({ verificationStatus: 'not-required', createdBy: 'u1' }, author), { ok: true })
    assert.deepEqual(canDeletePaper({ verificationStatus: 'modification-requested', createdBy: 'u1' }, reviewer), { ok: true })
    assert.deepEqual(canDeletePaper({ verificationStatus: 'rejected-by-hod', createdBy: 'u1' }, reviewer), { ok: true })
  })

  it('blocks everyone while the paper is under review', () => {
    assert.deepEqual(canDeletePaper({ verificationStatus: 'submitted-for-approval', createdBy: 'u1' }, author), { ok: false, reason: 'under-review' })
    assert.deepEqual(canDeletePaper({ verificationStatus: 'pending-verification', createdBy: 'u1' }, reviewer), { ok: false, reason: 'under-review' })
  })

  it('keeps approved/published papers reviewer-only', () => {
    assert.deepEqual(canDeletePaper({ verificationStatus: 'approved-by-hod', createdBy: 'u1' }, reviewer), { ok: true })
    assert.deepEqual(canDeletePaper({ verificationStatus: 'approved-by-hod', createdBy: 'u1' }, author), { ok: false, reason: 'reviewer-only' })
    assert.deepEqual(canDeletePaper({ status: 'published', createdBy: 'u1' }, author), { ok: false, reason: 'reviewer-only' })
  })

  it('forbids staff who neither authored nor review the paper', () => {
    assert.deepEqual(canDeletePaper({ verificationStatus: 'draft', createdBy: 'u1' }, otherFaculty), { ok: false, reason: 'forbidden' })
  })

  it('counts every non-cancelled scheduled test as an active link', () => {
    assert.equal(hasActiveScheduledTest([]), false)
    assert.equal(hasActiveScheduledTest([{ status: 'scheduled' }]), true)
    assert.equal(hasActiveScheduledTest([{ status: 'published' }, { status: 'cancelled' }]), true)
    assert.equal(hasActiveScheduledTest([{ status: 'cancelled' }]), false)
    assert.equal(hasActiveScheduledTest([null]), false)
  })
})
