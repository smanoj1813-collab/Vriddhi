// functions/test/prepFrequentQuestions.test.ts
//
// Item 3.3. What a student is told is "the question that keeps coming" depends
// entirely on this grouping, so the rules are pinned on hand-made cases.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  frequentQuestionsForSubject,
  groupFrequentQuestions,
  isSameQuestion,
  jaccardSimilarity,
  prefixAgreement,
  questionKey,
  subjectsWithRepeats,
  tokenizeQuestion,
  type FrequentQuestionInput,
} from '../src/prepFrequentQuestions'

function question(overrides: Partial<FrequentQuestionInput> = {}): FrequentQuestionInput {
  return {
    paperId: 'bcu-bcom-5-2024',
    examLabel: 'February/March 2024',
    examYear: 2024,
    subjectName: 'Financial Accounting',
    program: 'bcom',
    semester: 5,
    universityCode: 'bcu',
    label: '1',
    text: 'Explain the objectives of financial accounting.',
    marks: 5,
    ...overrides,
  }
}

describe('tokenisation', () => {
  it('drops verbs and function words that every question shares', () => {
    assert.deepEqual(tokenizeQuestion('Explain the objectives of financial accounting'), [
      'objectives',
      'financial',
      'accounting',
    ])
  })

  it('keeps Kannada matras attached to their letters', () => {
    // Two spellings that differ only by a case ending must still overlap.
    const a = tokenizeQuestion('ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ')
    const b = tokenizeQuestion('ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳ')
    assert.ok(a.length > 0 && b.length > 0)
    assert.equal(b.every((token) => token.length > 1), true)
    // Two of three shared tokens (the case ending differs) — above the point
    // where the prefix rule recognises the same question.
    // A Kannada case ending changes the last token: the two wordings stay
    // RELATED (not identical), which is the honest statement of what the shared
    // pipeline achieves. Kannada's own normaliser is a separate item (§5.4
    // item 8 in the review) and is not claimed here.
    assert.ok(jaccardSimilarity(a, b) >= 0.33, `expected overlap, got ${jaccardSimilarity(a, b)}`)
    assert.equal(
      isSameQuestion({ tokens: a, marks: 5 }, { tokens: b, marks: 5 }),
      true,
      'a two-token shared opening is still strong evidence',
    )
  })

  it('ignores numbering, punctuation and digits', () => {
    assert.deepEqual(
      tokenizeQuestion('1) State five (5) features of GST?'),
      tokenizeQuestion('State five features of GST'),
    )
  })

  it('produces a stable key regardless of word order', () => {
    assert.equal(
      questionKey('State the features of the Indian economy'),
      questionKey('features of the Indian economy, state'),
    )
  })
})

describe('similarity rules', () => {
  it('scores identical sets as 1 and disjoint sets as 0', () => {
    assert.equal(jaccardSimilarity(['a', 'b'], ['b', 'a']), 1)
    assert.equal(jaccardSimilarity(['a'], ['b']), 0)
    assert.equal(jaccardSimilarity([], ['b']), 0)
  })

  it('counts an agreed stem in order', () => {
    assert.equal(prefixAgreement(['objectives', 'financial', 'accounting'], ['objectives', 'financial', 'law']), 2)
    assert.equal(prefixAgreement(['financial', 'objectives'], ['objectives', 'financial']), 0)
  })

  it('merges the same question asked with a different tail', () => {
    assert.equal(
      isSameQuestion(
        { tokens: tokenizeQuestion('Explain the objectives of financial accounting with examples'), marks: 5 },
        { tokens: tokenizeQuestion('Explain the objectives of financial accounting with suitable illustrations'), marks: 5 },
      ),
      true,
    )
  })

  it('keeps questions with different marks apart even when the words match', () => {
    assert.equal(
      isSameQuestion(
        { tokens: tokenizeQuestion('Explain cost audit'), marks: 2 },
        { tokens: tokenizeQuestion('Explain cost audit'), marks: 10 },
      ),
      false,
    )
    // …but a missing mark on one side is not a veto.
    assert.equal(
      isSameQuestion(
        { tokens: tokenizeQuestion('Explain cost audit'), marks: null },
        { tokens: tokenizeQuestion('Explain cost audit'), marks: 10 },
      ),
      true,
    )
  })

  it('does not merge questions that merely share a subject', () => {
    assert.equal(
      isSameQuestion(
        { tokens: tokenizeQuestion('Prepare a trading account from the following balances'), marks: 10 },
        { tokens: tokenizeQuestion('Explain the difference between fixed and working capital'), marks: 10 },
      ),
      false,
    )
  })

  it('recognises short questions that share their first two words', () => {
    assert.equal(
      isSameQuestion(
        { tokens: tokenizeQuestion('Cost audit meaning'), marks: 2 },
        { tokens: tokenizeQuestion('Cost audit meaning and scope'), marks: null },
      ),
      true,
    )
  })
})

describe('grouping', () => {
  it('counts repeats across years and keeps them newest-first', () => {
    const groups = groupFrequentQuestions([
      question({ paperId: 'p2022', examYear: 2022, examLabel: 'September 2022' }),
      question({ paperId: 'p2023', examYear: 2023, examLabel: 'February/March 2023' }),
      question({
        paperId: 'p2024',
        examYear: 2024,
        text: 'Explain the objectives of financial accounting with examples.',
      }),
    ])
    assert.equal(groups.length, 1)
    assert.equal(groups[0].count, 3)
    assert.deepEqual(groups[0].years, [2024, 2023, 2022])
    assert.deepEqual(groups[0].examLabels, ['February/March 2024', 'February/March 2023', 'September 2022'])
    assert.equal(groups[0].paperIds.length, 3)
    // The longest wording becomes the title, so a truncated variant never wins.
    assert.match(groups[0].question, /with examples/)
  })

  it('keeps one-off questions out of the list', () => {
    const groups = groupFrequentQuestions([
      question({ text: 'Explain the objectives of financial accounting.' }),
      question({ text: 'Prepare a cash flow statement for the year ended.' }),
    ])
    assert.deepEqual(groups, [])
  })

  it('can be asked for single appearances too', () => {
    const groups = groupFrequentQuestions(
      [question({ text: 'Prepare a cash flow statement for the year ended.' })],
      { minCount: 1 },
    )
    assert.equal(groups.length, 1)
    assert.equal(groups[0].count, 1)
  })

  it('never merges across subjects', () => {
    const groups = groupFrequentQuestions([
      question({ subjectName: 'Financial Accounting' }),
      question({ subjectName: 'Business Law' }),
    ])
    assert.deepEqual(groups, [], 'same wording in two subjects is two one-offs, not one repeat')
  })

  it('ranks the most repeated question first', () => {
    const groups = groupFrequentQuestions([
      question({ text: 'Explain the objectives of financial accounting.' }),
      question({ text: 'Explain the objectives of the financial accounting.' }),
      question({ text: 'Prepare a trading account from the given balances.', marks: 10 }),
      question({ text: 'Prepare a trading account from the given balances.', marks: 10 }),
      question({ text: 'Prepare a trading account from the following balances.', marks: 10 }),
    ])
    assert.equal(groups.length, 2)
    assert.equal(groups[0].count, 3)
    assert.match(groups[0].question, /trading account/)
    assert.equal(groups[1].count, 2)
  })

  it('records the alternative wordings as variants', () => {
    const groups = groupFrequentQuestions([
      question({ text: 'Explain the objectives of financial accounting.' }),
      question({ text: 'Explain the objectives of financial accounting briefly.' }),
    ])
    // The longest wording ("…briefly.") becomes the title…
    assert.match(groups[0].question, /briefly/)
    // …and the shorter spelling is kept as the variant.
    assert.equal(groups[0].variants.length, 1)
    assert.doesNotMatch(groups[0].variants[0], /briefly/)
  })

  it('honours the limit and the threshold', () => {
    // Distinct WORDING per topic — digits are stripped as numbering, so a
    // numeric placeholder would collapse all thirty into one group.
    const words = Array.from({ length: 30 }, (_, index) => `topic${'abcdefghijklmnopqrstuvwxyz'[index] ?? 'z'}`)
    const many = words.flatMap((word) => [
      question({ text: `Explain ${word} in detail.` }),
      question({ text: `Explain ${word} in detail.` }),
    ])
    assert.equal(groupFrequentQuestions(many, { limit: 5 }).length, 5)
    // Threshold 0.99 refuses the near-duplicates the default merges: the pair
    // below is 0.75-similar, which the default accepts via the tail tie-breaker
    // and the strict threshold rejects. ("briefly" would NOT work here — it is a
    // stop word, so those two wordings are identical after tokenisation.)
    const pair = [
      question({ text: 'Explain the objectives of financial accounting.' }),
      question({ text: 'Explain the objectives of financial accounting with examples.' }),
    ]
    assert.equal(groupFrequentQuestions(pair).length, 1)
    assert.equal(groupFrequentQuestions(pair, { threshold: 0.99 }).length, 0)
  })

  it('skips questions that are nothing but stop words', () => {
    assert.deepEqual(groupFrequentQuestions([question({ text: 'Explain the following' })]), [])
  })
})

describe('corpus helpers', () => {
  const paper = (overrides: Record<string, unknown> = {}) => ({
    id: 'bcu-bcom-5-2023',
    examLabel: 'February/March 2023',
    examYear: 2023,
    subjectName: 'Financial Accounting',
    program: 'bcom',
    semester: 5,
    universityCode: 'bcu',
    sections: [
      {
        marksEach: 5,
        questions: [
          { label: '1', text: 'Explain the objectives of financial accounting.' },
          { label: '2', text: 'Prepare a trading account from the given balances.' },
        ],
      },
    ],
    ...overrides,
  })

  it('applies section marks to questions that carry none', () => {
    const groups = frequentQuestionsForSubject(
      [paper(), paper({ id: 'bcu-bcom-5-2024', examYear: 2024, examLabel: 'February/March 2024' })],
      'Financial Accounting',
    )
    assert.equal(groups.length, 2)
    assert.ok(groups.every((group) => group.marks === 5))
  })

  it('filters to the requested subject and lists the subjects that repeat', () => {
    const papers = [
      paper(),
      paper({ id: 'p2', examYear: 2024, examLabel: 'February/March 2024' }),
      paper({
        id: 'p3',
        subjectName: 'Business Law',
        examYear: 2024,
        sections: [{ marksEach: 5, questions: [{ label: '1', text: 'Explain the essentials of a valid contract.' }] }],
      }),
    ]
    const accounting = frequentQuestionsForSubject(papers, 'Financial Accounting')
    assert.equal(accounting.length, 2)
    assert.ok(accounting.every((group) => group.subjectName === 'Financial Accounting'))
    assert.deepEqual(
      subjectsWithRepeats(papers).map((entry) => entry.subjectName),
      ['Financial Accounting'],
    )
  })

  it('treats a multi-part question as one question, parts included', () => {
    const groups = frequentQuestionsForSubject(
      [
        paper({
          sections: [
            {
              marksEach: 10,
              questions: [
                { label: '1(a)', text: 'Explain the objectives of financial accounting', parts: ['state its scope'] },
              ],
            },
          ],
        }),
        paper({
          id: 'p2',
          examYear: 2024,
          examLabel: 'February/March 2024',
          sections: [
            {
              marksEach: 10,
              questions: [
                {
                  label: '3',
                  text: 'Explain the objectives of financial accounting',
                  parts: ['state its scope clearly'],
                },
              ],
            },
          ],
        }),
      ],
      'Financial Accounting',
    )
    assert.equal(groups.length, 1)
    assert.equal(groups[0].count, 2)
  })
})
