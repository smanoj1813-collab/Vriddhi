// functions/test/prepPapers.test.ts
//
// Integrity tests for the previous-year question paper bundle (prep_papers):
// every seeded paper validates, marks add up, sources are cited, the agreed
// program mix is present, and the pure helpers behave.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PREP_PAPER_SEED_CODE,
  PREP_PAPER_UNIVERSITY_CODES,
  expandPrepPaperSeed,
  filterPrepPapers,
  normalisePrepPaperInput,
  prepPaperFacets,
  sortPrepPapers,
  toPrepPaperSummary,
  validatePrepPapers,
  type PrepPaperSeed,
} from '../src/prepPapers.ts'
import { PREP_SEED_CODES, PREP_PROGRAM_CODES } from '../src/prepShared.ts'
import { PREP_PAPER_SEEDS, SEEDED_PREP_PAPERS } from '../src/data/prepPapers/index.ts'
import { BBA_SUBJECTS } from '../src/data/bbaSeedData.ts'
import { BCOM_SUBJECTS } from '../src/data/bcomSeedData.ts'
import { BSC_SUBJECTS } from '../src/data/bscSeedData.ts'
import { BA_SUBJECTS } from '../src/data/baSeedData.ts'

const KNOWN_SUBJECTS = new Set([...BBA_SUBJECTS, ...BCOM_SUBJECTS, ...BSC_SUBJECTS, ...BA_SUBJECTS].map((s) => s.id))

/** The mix agreed with the platform team: commerce-heavy, BBM from the older scheme. */
const EXPECTED_MIX: Record<string, number> = { bcom: 18, bba: 18, bsc: 6, ba: 6, bbm: 2 }

function sample(overrides: Partial<PrepPaperSeed> = {}): PrepPaperSeed {
  return {
    id: 'bcu-bba-1-marketing-management-2024-02',
    program: 'bba',
    university: 'bcu',
    scheme: 'NEP 2021-22 onwards (F+R)',
    semester: 1,
    subject: 'Marketing Management',
    paperCode: 'DCBB103',
    examMonth: 'February/March',
    examYear: 2024,
    durationMinutes: 150,
    maxMarks: 60,
    instructions: ['Answers should be written in English only.'],
    sections: [
      { id: 'A', instruction: 'Answer any FIVE of the following questions. Each question carries 2 marks.', answer: 5, marksEach: 2, subLabels: true,
        questions: ['Define marketing.', 'What is demographic environment?', 'What do you mean by market segmentation?', 'Give the meaning of marketing mix.', 'What is service marketing?', 'What is channel of distribution?', 'Give the meaning of Service Blue Print.'] },
      { id: 'B', instruction: 'Answer any FOUR of the following questions. Each question carries 5 marks.', answer: 4, marksEach: 5,
        questions: ['Briefly explain the characteristics of green marketing.', 'What are the steps in environmental scanning?', 'Explain the bases of market segmentation.', 'What are the steps in New Product Development?', 'Briefly explain the features of services.'] },
      { id: 'C', instruction: 'Answer any TWO of the following questions. Each question carries 12 marks.', answer: 2, marksEach: 12,
        questions: ['Briefly explain the functions of marketing.', 'What is consumer behaviour? Explain the factors influencing consumer behaviour.', 'Briefly explain the components of marketing mix of services.'] },
      { id: 'D', instruction: 'Answer any ONE of the following questions. Each question carries 6 marks.', answer: 1, marksEach: 6,
        questions: ['Which channel of distribution do you select for your product? Give reasons.', 'Write a marketing mix for your product.'] },
    ],
    prepSubjectId: 'bba-karnataka-marketing',
    source: { title: 'I Sem BBA Feb/Mar 2024 bundle', url: 'https://example.edu/papers/2024-1st-sem-bba.pdf', publisher: 'Example College', retrievedOn: '2026-09-25' },
    ...overrides,
  }
}

describe('previous-year paper bundle (seeded)', () => {
  it('reports zero integrity errors', () => {
    const report = validatePrepPapers(SEEDED_PREP_PAPERS, { knownSubjectIds: KNOWN_SUBJECTS })
    const errors = report.issues.filter((i) => i.level === 'error').map((i) => `${i.code}: ${i.message}`)
    assert.deepEqual(errors, [], errors.join('\n'))
    assert.equal(report.valid, true)
    assert.equal(report.programCode, PREP_PAPER_SEED_CODE)
    assert.equal(report.subjectCount, SEEDED_PREP_PAPERS.length)
  })

  it('links only to study packs that exist (no unknown-subject warnings)', () => {
    const report = validatePrepPapers(SEEDED_PREP_PAPERS, { knownSubjectIds: KNOWN_SUBJECTS })
    const unknown = report.issues.filter((i) => i.code === 'PAPER_UNKNOWN_SUBJECT').map((i) => i.message)
    assert.deepEqual(unknown, [], unknown.join('\n'))
  })

  it('ships the agreed program mix (B.Com 18 · BBA 18 · B.Sc 6 · BA 6 · BBM 2 = 50)', () => {
    const counts: Record<string, number> = {}
    for (const p of SEEDED_PREP_PAPERS) {
      const key = p.legacyProgram || p.program
      counts[key] = (counts[key] || 0) + 1
    }
    assert.deepEqual(counts, EXPECTED_MIX)
    assert.equal(SEEDED_PREP_PAPERS.length, 50)
  })

  it('draws on more than one Karnataka university and more than two exam years', () => {
    const universities = new Set(SEEDED_PREP_PAPERS.map((p) => p.universityCode))
    const years = new Set(SEEDED_PREP_PAPERS.map((p) => p.examYear))
    assert.ok(universities.size >= 3, `only ${universities.size} universities: ${[...universities].join(', ')}`)
    assert.ok(years.size >= 3, `only ${years.size} exam years`)
    for (const code of universities) assert.ok(PREP_PAPER_UNIVERSITY_CODES.includes(code), code)
  })

  it('files BBM papers under the BBA catalogue with the old name as the badge', () => {
    const bbm = SEEDED_PREP_PAPERS.filter((p) => p.legacyProgram === 'bbm')
    assert.equal(bbm.length, EXPECTED_MIX.bbm)
    for (const p of bbm) {
      assert.equal(p.program, 'bba')
      assert.equal(p.programLabel, 'BBM')
    }
  })

  it('keeps every paper complete enough to practise from', () => {
    for (const p of SEEDED_PREP_PAPERS) {
      assert.ok(p.questionCount >= 8, `${p.id} has only ${p.questionCount} questions`)
      assert.ok(p.sections.length >= 2, `${p.id} has ${p.sections.length} section(s)`)
      assert.ok(p.source.url.startsWith('http'), `${p.id} source url`)
      assert.equal(p.status, 'published')
      assert.equal(p.language, 'en')
    }
  })

  it('has unique ids that encode university, program, semester and year', () => {
    const ids = new Set<string>()
    for (const seed of PREP_PAPER_SEEDS) {
      assert.ok(!ids.has(seed.id), `duplicate id ${seed.id}`)
      ids.add(seed.id)
      assert.ok(seed.id.startsWith(`${seed.university}-`), `${seed.id} should start with the university code`)
      assert.ok(seed.id.includes(String(seed.examYear)), `${seed.id} should include the exam year`)
    }
  })

  it('is reachable through the seed codes', () => {
    assert.ok(PREP_SEED_CODES.includes(PREP_PAPER_SEED_CODE))
    for (const p of SEEDED_PREP_PAPERS) assert.ok(PREP_PROGRAM_CODES.includes(p.program), p.program)
  })
})

describe('expandPrepPaperSeed', () => {
  it('numbers questions the way the printed paper does', () => {
    const paper = expandPrepPaperSeed(sample())
    assert.equal(paper.sections[0].questions[0].label, '1(a)')
    assert.equal(paper.sections[0].questions[6].label, '1(g)')
    assert.equal(paper.sections[1].questions[0].label, '2')
    assert.equal(paper.sections[2].questions[0].label, '7')
    assert.equal(paper.sections[3].questions[1].label, '11')
    assert.equal(paper.questionCount, 17)
    assert.equal(paper.examLabel, 'February/March 2024')
    assert.equal(paper.programLabel, 'BBA')
    assert.equal(paper.universityName, 'Bengaluru City University')
    assert.deepEqual(paper.sections.map((s) => s.totalMarks), [10, 20, 24, 6])
    assert.ok(paper.tags.includes('sem-1') && paper.tags.includes('2024') && paper.tags.includes('bcu'))
  })

  it('files a BBM paper under BBA and labels it BBM', () => {
    const paper = expandPrepPaperSeed(sample({ id: 'bu-bbm-5-strategic-management-2016-05', program: 'bbm', legacyProgram: 'bbm', university: 'bu', examYear: 2016 }))
    assert.equal(paper.program, 'bba')
    assert.equal(paper.programLabel, 'BBM')
    assert.equal(paper.legacyProgram, 'bbm')
    assert.ok(paper.tags.includes('bbm'))
  })

  it('honours explicit labels and marks overrides', () => {
    const paper = expandPrepPaperSeed(
      sample({
        maxMarks: 20,
        sections: [
          { id: 'A', instruction: 'Answer all questions. Marks as indicated.', answer: 0, marksEach: 10,
            questions: [{ label: '1', text: 'Compulsory case study on pricing decisions.' }, { label: '2', text: 'Compulsory case study on channel conflict.', parts: ['(a) Identify the issue.', '(b) Recommend a fix.'] }] },
        ],
      }),
    )
    assert.deepEqual(paper.sections[0].questions.map((q) => q.label), ['1', '2'])
    assert.deepEqual(paper.sections[0].questions[1].parts, ['(a) Identify the issue.', '(b) Recommend a fix.'])
    assert.equal(paper.sections[0].totalMarks, 20)
    assert.equal(validatePrepPapers([paper]).valid, true)
  })
})

describe('validatePrepPapers', () => {
  it('accepts a well-formed paper', () => {
    const report = validatePrepPapers([expandPrepPaperSeed(sample())], { knownSubjectIds: KNOWN_SUBJECTS })
    assert.equal(report.valid, true, report.issues.map((i) => i.message).join('\n'))
    assert.equal(report.questionCount, 17)
  })

  it('catches the common authoring mistakes', () => {
    const good = expandPrepPaperSeed(sample())
    const dup = expandPrepPaperSeed(sample())
    const badMarks = expandPrepPaperSeed(sample({ id: 'bcu-bba-1-x-2024', maxMarks: 70 }))
    const badUni = expandPrepPaperSeed(sample({ id: 'xyz-bba-1-x-2024', university: 'xyz' }))
    const noSource = expandPrepPaperSeed(sample({ id: 'bcu-bba-1-y-2024', source: { title: '', url: 'ftp://x', publisher: '', retrievedOn: 'yesterday' } }))
    const tooMany = expandPrepPaperSeed(sample({ id: 'bcu-bba-1-z-2024', sections: [{ id: 'A', instruction: 'Answer any TEN of the following questions.', answer: 10, marksEach: 6, questions: ['Only one question here.'] }] }))
    const future = expandPrepPaperSeed(sample({ id: 'bcu-bba-1-w-2099', examYear: 2099 }))
    const report = validatePrepPapers([good, dup, badMarks, badUni, noSource, tooMany, future], { now: new Date('2026-09-25') })
    const codes = new Set(report.issues.map((i) => i.code))
    for (const expected of [
      'DUPLICATE_PAPER_ID',
      'PAPER_MARKS_MISMATCH',
      'PAPER_BAD_UNIVERSITY',
      'PAPER_NO_SOURCE',
      'PAPER_BAD_SOURCE_URL',
      'PAPER_BAD_RETRIEVED_DATE',
      'SECTION_ANSWER_COUNT',
      'PAPER_BAD_YEAR',
    ]) {
      assert.ok(codes.has(expected), `expected ${expected} in ${[...codes].join(', ')}`)
    }
    assert.equal(report.valid, false)
  })

  it('warns (not errors) when a study-pack link is unknown', () => {
    const paper = expandPrepPaperSeed(sample({ prepSubjectId: 'bba-does-not-exist' }))
    const report = validatePrepPapers([paper], { knownSubjectIds: KNOWN_SUBJECTS })
    assert.equal(report.valid, true)
    assert.ok(report.issues.some((i) => i.code === 'PAPER_UNKNOWN_SUBJECT' && i.level === 'warning'))
  })
})

describe('list helpers', () => {
  const papers = [
    expandPrepPaperSeed(sample()),
    expandPrepPaperSeed(sample({ id: 'bcu-bcom-3-income-tax-2023-11', program: 'bcom', semester: 3, subject: 'Income Tax', examYear: 2023, examMonth: 'November/December', prepSubjectId: undefined })),
    expandPrepPaperSeed(sample({ id: 'kud-bba-1-marketing-2022-04', university: 'kud', examYear: 2022, examMonth: 'April/May' })),
    expandPrepPaperSeed(sample({ id: 'bu-bbm-5-strategic-management-2016-05', program: 'bbm', legacyProgram: 'bbm', university: 'bu', semester: 5, subject: 'Strategic Management', examYear: 2016 })),
  ]

  it('filters by program, legacy program, semester, university, year, subject and text', () => {
    assert.equal(filterPrepPapers(papers, { program: 'bba' }).length, 3)
    assert.equal(filterPrepPapers(papers, { program: 'bbm' }).length, 1)
    assert.equal(filterPrepPapers(papers, { program: 'bcom' }).length, 1)
    assert.equal(filterPrepPapers(papers, { semester: '1' }).length, 2)
    assert.equal(filterPrepPapers(papers, { university: 'kud' }).length, 1)
    assert.equal(filterPrepPapers(papers, { year: 2023 }).length, 1)
    assert.equal(filterPrepPapers(papers, { subjectId: 'bba-karnataka-marketing' }).length, 3)
    assert.equal(filterPrepPapers(papers, { q: 'dcbb' }).length, 4)
    assert.equal(filterPrepPapers(papers, { q: 'income' }).length, 1)
    assert.equal(filterPrepPapers(papers, { scheme: 'nep' }).length, 4)
  })

  it('sorts program → semester → subject → newest exam first', () => {
    const sorted = sortPrepPapers(papers).map((p) => p.id)
    assert.deepEqual(sorted, [
      'bcu-bba-1-marketing-management-2024-02',
      'kud-bba-1-marketing-2022-04',
      'bu-bbm-5-strategic-management-2016-05',
      'bcu-bcom-3-income-tax-2023-11',
    ])
  })

  it('builds facets and strips sections for summaries', () => {
    const facets = prepPaperFacets(papers)
    assert.deepEqual(facets.years, [2024, 2023, 2022, 2016])
    assert.deepEqual(facets.semesters, [1, 3, 5])
    assert.equal(facets.universities[0].code, 'bcu')
    assert.ok(facets.programs.some((p) => p.code === 'bbm' && p.count === 1))
    const summary = toPrepPaperSummary(papers[0])
    assert.equal((summary as any).sections, undefined)
    assert.equal(summary.sectionCount, 4)
    assert.equal(summary.questionCount, 17)
  })
})

describe('normalisePrepPaperInput', () => {
  it('accepts the compact seed shape from the studio JSON box', () => {
    const { paper, report } = normalisePrepPaperInput(sample())
    assert.ok(paper)
    assert.equal(report.valid, true)
    assert.equal(paper?.sections.length, 4)
  })

  it('rejects an incomplete record with readable issues', () => {
    const { paper, report } = normalisePrepPaperInput({ id: 'Bad Id', program: 'bba', sections: [] })
    assert.equal(paper, null)
    assert.ok(report.issues.some((i) => i.code === 'PAPER_BAD_ID'))
  })

  it('round-trips a full stored paper', () => {
    const stored = expandPrepPaperSeed(sample())
    const { paper, report } = normalisePrepPaperInput(stored)
    assert.equal(report.valid, true)
    assert.equal(paper?.id, stored.id)
    assert.equal(paper?.questionCount, 17)
  })
})
