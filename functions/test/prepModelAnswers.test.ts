// functions/test/prepModelAnswers.test.ts
//
// Items 3.4 and 3.5. The sanitiser is the boundary between "a model said
// something" and "a student is shown it", so it is pinned hardest here: a
// refusal, a code fence, a chatty sign-off and a five-option MCQ all have to be
// caught BEFORE anyone reviews, not after a student complains.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ANSWER_GENERATE_BATCH_LIMIT,
  MODEL_ANSWER_LABEL,
  answerDocId,
  answerLengthGuidance,
  buildMcqSetPrompt,
  buildModelAnswerPrompt,
  collectPaperQuestions,
  isPublishable,
  mcqSetDocId,
  safeIdPart,
  sanitiseMcqSet,
  sanitiseModelAnswer,
} from '../src/prepModelAnswers'

const paper = {
  sections: [
    {
      id: 'A',
      title: 'Answer any five',
      marksEach: 2,
      questions: [{ label: '1', text: 'Define cost audit.' }],
    },
    {
      id: 'B',
      title: 'Answer any three',
      marksEach: 10,
      questions: [
        { label: '7', text: 'Explain the objectives of cost accounting.', parts: ['with examples'] },
        { label: '8', text: 'Prepare a cost sheet.', marks: 12 },
      ],
    },
  ],
}

describe('document ids', () => {
  it('strips path separators so a label can never create a nested path', () => {
    assert.equal(safeIdPart('BCom 5/2024'), 'BCom_5-2024')
    assert.equal(answerDocId('bcu-bcom-5', 'B__1 (a/b)').includes('/'), false)
  })

  it('is stable and collision-free enough for (paper, question)', () => {
    assert.equal(answerDocId('p1', 'A__1'), answerDocId('p1', 'A__1'))
    assert.notEqual(answerDocId('p1', 'A__1'), answerDocId('p2', 'A__1'))
    assert.notEqual(answerDocId('p1', 'A__1'), answerDocId('p1', 'A__2'))
    assert.equal(mcqSetDocId('p1', 'A__1'), answerDocId('p1', 'A__1'))
  })

  it('caps an absurd id at a Firestore-legal length', () => {
    assert.equal(safeIdPart('x'.repeat(500)).length, 100)
  })
})

describe('collecting a paper’s questions', () => {
  it('walks sections in order and applies the section default marks', () => {
    const questions = collectPaperQuestions(paper)
    assert.deepEqual(
      questions.map((q) => [q.qid, q.marks]),
      [
        ['A__1', 2],
        ['B__7', 10],
        ['B__8', 12],
      ],
    )
  })

  it('keeps sub-parts so the answer covers them', () => {
    const seven = collectPaperQuestions(paper).find((q) => q.label === '7')
    assert.deepEqual(seven?.parts, ['with examples'])
  })

  it('skips a question with no label or no text instead of producing a bad doc id', () => {
    const questions = collectPaperQuestions({
      sections: [{ id: 'A', marksEach: 5, questions: [{ label: '', text: 'orphan' }, { label: '2', text: '' }] }],
    })
    assert.deepEqual(questions, [])
  })

  it('survives a paper with no sections', () => {
    assert.deepEqual(collectPaperQuestions({}), [])
  })
})

describe('answer length guidance', () => {
  it('scales with the marks on offer', () => {
    assert.match(answerLengthGuidance(2).words, /40–60/)
    assert.match(answerLengthGuidance(5).bullets, /4–6/)
    assert.match(answerLengthGuidance(10).words, /250–350/)
    assert.match(answerLengthGuidance(15).words, /400–550/)
  })
})

describe('model answer prompt', () => {
  const prompt = buildModelAnswerPrompt({
    question: 'Explain the objectives of cost accounting.',
    parts: ['with examples'],
    marks: 10,
    subjectName: 'Cost Accounting',
    programLabel: 'B.Com',
    universityName: 'Bengaluru City University',
    examYear: 2024,
  })

  it('carries the question, the marks and the paper context', () => {
    assert.match(prompt, /Explain the objectives of cost accounting\./)
    assert.match(prompt, /\(10 marks\)/)
    assert.match(prompt, /B\.Com/)
    assert.match(prompt, /Bengaluru City University/)
    assert.match(prompt, /Paper year: 2024/)
    assert.match(prompt, /with examples/)
  })

  it('tells the model the length, the structure and to stop chatting', () => {
    assert.match(prompt, /250–350 words/)
    assert.match(prompt, /short headings and bullet points/)
    assert.match(prompt, /Do NOT repeat the question/)
  })

  it('omits context it was not given', () => {
    const bare = buildModelAnswerPrompt({ question: 'Define cost audit.', marks: 2, subjectName: 'Cost Accounting' })
    assert.doesNotMatch(bare, /University:/)
    assert.doesNotMatch(bare, /Programme:/)
    assert.match(bare, /40–60 words/)
  })
})

describe('MCQ set prompt', () => {
  const prompt = buildMcqSetPrompt({
    subjectName: 'Cost Accounting',
    programLabel: 'B.Com',
    questions: ['Define cost audit.', 'Prepare a cost sheet.'],
    perTopic: 5,
  })

  it('asks for exactly the requested count and the JSON shape', () => {
    assert.match(prompt, /exactly 5 MCQs/)
    assert.match(prompt, /"correctIndex"/)
    assert.match(prompt, /Define cost audit\./)
  })

  it('forbids the options that make a set untrustworthy', () => {
    assert.match(prompt, /All of the above/)
    assert.match(prompt, /exactly one correct answer/)
  })
})

describe('answer sanitiser', () => {
  it('keeps a normal answer and reports no problems', () => {
    const text = [
      '**Objectives of cost accounting**',
      '- To ascertain the cost per unit of production and control it.',
      '- To fix selling prices on a reliable, data-backed basis.',
      '- To identify and eliminate waste in material, labour and overheads.',
      '- To help management decide between alternative courses of action, for example replacing manual packing with an automated line at a mid-size Indian manufacturer.',
      '- To provide the data used in cost sheets, budgets and standard costing.',
    ].join('\n')
    const result = sanitiseModelAnswer(text, 5)
    assert.equal(result.ok, true)
    assert.equal(result.issues.length, 0)
    assert.match(result.answerMd, /Objectives of cost accounting/)
  })

  it('rejects empty output and a refusal', () => {
    assert.equal(sanitiseModelAnswer('', 5).ok, false)
    assert.equal(sanitiseModelAnswer('   ', 5).ok, false)
    assert.equal(sanitiseModelAnswer('I cannot answer this question.', 5).ok, false)
    assert.equal(sanitiseModelAnswer('I am unable to help with that request in a useful way.', 5).ok, false)
  })

  it('strips a code fence and says so', () => {
    const result = sanitiseModelAnswer('```markdown\n' + 'Definition is the first line.\n' + 'x'.repeat(120) + '\n```', 5)
    assert.equal(result.ok, true)
    assert.doesNotMatch(result.answerMd, /```/)
    assert.ok(result.issues.some((issue) => /code fence/.test(issue)))
  })

  it('removes a conversational preamble', () => {
    const body = 'Cost audit is the verification of cost records. ' + 'It checks accuracy and adherence to standards. '.repeat(5)
    const result = sanitiseModelAnswer(`Sure! Here is a model answer for that question.\n\n${body}`, 5)
    assert.equal(result.ok, true)
    assert.doesNotMatch(result.answerMd, /Sure!/)
  })

  it('removes a trailing chat line that must not be published', () => {
    const body = 'Cost audit is the verification of the cost records of an organisation against the standards set by management. '.repeat(2)
    const result = sanitiseModelAnswer(`${body}\n\nLet me know if you want this in Kannada!`, 5)
    assert.equal(result.ok, true)
    assert.doesNotMatch(result.answerMd, /Let me know/)
  })

  it('flags a too-short answer for its marks instead of hiding it', () => {
    const result = sanitiseModelAnswer('Cost audit is a check of cost records.', 10)
    assert.equal(result.ok, true)
    assert.ok(result.issues.some((issue) => /shorter than expected for 10 marks/.test(issue)))
  })
})

describe('MCQ sanitiser', () => {
  const good = {
    question: 'Which document records the total cost of a job?',
    options: ['Cost sheet', 'Balance sheet', 'Cash book', 'Ledger'],
    correctIndex: 0,
    explanation: 'A cost sheet accumulates the cost elements of a job.',
  }

  it('parses a JSON array and an { items } object', () => {
    assert.equal(sanitiseMcqSet(JSON.stringify([good])).items.length, 1)
    assert.equal(sanitiseMcqSet(JSON.stringify({ items: [good] })).items.length, 1)
  })

  it('parses JSON wrapped in a code fence', () => {
    const result = sanitiseMcqSet('```json\n' + JSON.stringify([good]) + '\n```')
    assert.equal(result.items.length, 1)
  })

  it('fails cleanly on prose instead of throwing', () => {
    const result = sanitiseMcqSet('Here are five questions about cost accounting.')
    assert.equal(result.ok, false)
    assert.deepEqual(result.items, [])
  })

  it('drops an item that does not have four options', () => {
    const result = sanitiseMcqSet(JSON.stringify([{ ...good, options: ['A', 'B', 'C'] }]))
    assert.equal(result.ok, false)
    assert.ok(result.issues.some((issue) => /four option texts/.test(issue)))
  })

  it('drops an item whose correctIndex is out of range', () => {
    const result = sanitiseMcqSet(JSON.stringify([{ ...good, correctIndex: 4 }]))
    assert.equal(result.items.length, 0)
    assert.ok(result.issues.some((issue) => /not one of the four options/.test(issue)))
  })

  it('drops "all of the above" items and duplicates', () => {
    const allOfTheAbove = { ...good, options: ['Cost sheet', 'Balance sheet', 'Cash book', 'All of the above'], correctIndex: 3 }
    const result = sanitiseMcqSet(JSON.stringify([allOfTheAbove, good, good]))
    assert.equal(result.items.length, 1)
    assert.ok(result.issues.some((issue) => /all\/none of the above/.test(issue)))
    assert.ok(result.issues.some((issue) => /duplicate/.test(issue)))
  })

  it('keeps the good items when one is bad — a partial set beats a retry', () => {
    const bad = { question: 'x' }
    const result = sanitiseMcqSet(JSON.stringify([good, bad]))
    assert.equal(result.items.length, 1)
    assert.equal(result.ok, true)
  })
})

describe('review flow contract', () => {
  it('only a draft may be published', () => {
    assert.equal(isPublishable('draft'), true)
    assert.equal(isPublishable('published'), false)
    assert.equal(isPublishable('rejected'), false)
    assert.equal(isPublishable(undefined), false)
  })

  it('labels reviewed content honestly', () => {
    assert.equal(MODEL_ANSWER_LABEL, 'Model answer · AI-generated, reviewed')
  })

  it('keeps the batch limit at the plan’s value', () => {
    assert.equal(ANSWER_GENERATE_BATCH_LIMIT, 25)
  })
})
