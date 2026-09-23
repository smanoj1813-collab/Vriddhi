// src/modules/superadmin/data/questionBankSeed.test.ts
//
// Run with: npm run test:unit   (node --import ./scripts/raw-asset-hooks.mjs --import tsx --test)
//
// Pins the platform question-bank seeder: the bundled CSVs must parse clean,
// the validation must catch rows that could never be graded, dedupe
// fingerprints must be stable across runs, and the MCQ option shuffle must be
// deterministic — otherwise re-seeding would silently rewrite the pool.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  SEED_BRANCHES,
  SEED_FILES,
  buildSeedOptions,
  buildSeedPayload,
  buildSeedTags,
  detectSeedLanguage,
  fingerprintMetaDoc,
  fingerprintSeedRow,
  normalizeQuestionText,
  parseSeedCsv,
  resolveSeedRows,
  seededShuffle,
  toUniversalDifficulty,
  toUniversalQuestionType,
  validateSeedRow,
  validateSeedRows,
  type SeedRow,
} from './questionBankSeed'

const HEADERS =
  'text,subject,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName'

const csv = (...lines: string[]) => [HEADERS, ...lines].join('\n')

const AUTHOR = { userId: 'sa-1', userName: 'Platform Admin' }

/** Runs a single CSV line through the real parser so tests build SeedRows the
 *  same way production does (column order is then irrelevant to the test). */
function row(line: string): SeedRow {
  const rows = parseSeedCsv(csv(line))
  assert.equal(rows.length, 1, 'expected exactly one parsed row')
  return rows[0]
}

const MCQ_LINE =
  'The accounting equation is stated as:,Financial Accounting,mcq,easy,Journal and Accounting Equation,1,Assets = Liabilities + Capital|Assets + Capital = Liabilities|Capital = Assets + Liabilities|Assets = Capital - Liabilities,A,Assets equal liabilities plus capital.,financial,2026-27,B.Com,false,,'

describe('bundled seed datasets', () => {
  it('bundles all four CSVs with content', () => {
    assert.equal(SEED_FILES.length, 4)
    for (const file of SEED_FILES) {
      assert.ok(file.csv.length > 1000, `${file.key} csv looks empty`)
      assert.ok(file.csv.startsWith('text,subject,type,'), `${file.key} csv lost its header`)
    }
  })

  it('parses the combined dataset with zero invalid rows (240 = 3 × 80)', () => {
    const resolved = resolveSeedRows('all', [])
    assert.equal(resolved.rows.length, 240)
    assert.equal(resolved.invalid.length, 0, JSON.stringify(resolved.invalid.slice(0, 3)))
    assert.equal(resolved.filteredOut, 0)
    assert.deepEqual(resolved.branches, [
      { name: 'B.Com', count: 80 },
      { name: 'B.Sc', count: 80 },
      { name: 'BA', count: 80 },
    ])
    assert.equal(resolved.subjects.length, 12)
    assert.ok(resolved.totalMarks > 240, 'marks should accumulate across rows')
  })

  it('every per-branch file matches the combined count for that branch', () => {
    for (const branch of SEED_BRANCHES) {
      const key = branch === 'B.Com' ? 'bcom' : branch === 'BA' ? 'ba' : 'bsc'
      const single = resolveSeedRows(key, [])
      const filtered = resolveSeedRows('all', [branch])
      assert.equal(single.rows.length, 80, `${branch} file`)
      assert.equal(single.invalid.length, 0)
      assert.equal(filtered.rows.length, 80, `${branch} filtered out of All`)
      assert.equal(filtered.filteredOut, 160)
      assert.deepEqual(
        single.rows.map((r) => fingerprintSeedRow(r)).sort(),
        filtered.rows.map((r) => fingerprintSeedRow(r)).sort(),
        `${branch}: per-branch file and filtered combined file must hold the same questions`
      )
    }
  })

  it('no row would be written with an ungradable answer key', () => {
    // Regression guard for the shipped seed, which once carried a true_false row
    // keyed "Is the same on the original cost" instead of True/False.
    const resolved = resolveSeedRows('all', [])
    for (const r of resolved.rows) {
      const type = toUniversalQuestionType(r.type, r.options.length > 0)
      if (type === 'true_false') {
        assert.ok(
          ['true', 'false'].includes(r.correctAnswer.trim().toLowerCase()),
          `line ${r.line}: true_false key must be True/False, got "${r.correctAnswer}"`
        )
      }
      if (type === 'mcq') {
        assert.match(r.correctAnswer.trim(), /^[A-D]$/, `line ${r.line}: mcq key`)
        assert.equal(r.options.length, 4, `line ${r.line}: mcq option count`)
      }
    }
  })

  it('the combined dataset has no duplicate questions', () => {
    const resolved = resolveSeedRows('all', [])
    const seen = new Set<string>()
    for (const r of resolved.rows) {
      const fp = fingerprintSeedRow(r)
      assert.ok(!seen.has(fp), `duplicate seed row at line ${r.line}: ${r.text}`)
      seen.add(fp)
    }
  })
})

describe('parseSeedCsv', () => {
  it('maps columns by header name and splits options on the pipe', () => {
    const r = row(MCQ_LINE)
    assert.equal(r.text, 'The accounting equation is stated as:')
    assert.equal(r.subject, 'Financial Accounting')
    assert.equal(r.type, 'mcq')
    assert.equal(r.difficulty, 'easy')
    assert.equal(r.unit, 'Journal and Accounting Equation')
    assert.equal(r.marks, 1)
    assert.equal(r.options.length, 4)
    assert.equal(r.options[0], 'Assets = Liabilities + Capital')
    assert.equal(r.correctAnswer, 'A')
    assert.deepEqual(r.tags, ['financial'])
    assert.equal(r.batch, '2026-27')
    assert.equal(r.branch, 'B.Com')
    assert.equal(r.isPYQ, false)
    assert.equal(r.line, 2, 'line numbers are 1-based and include the header')
  })

  it('tolerates CRLF, blank lines, surrounding quotes and a reordered header', () => {
    const reordered = [
      'subject,text,type,difficulty,unit,marks,options,correctAnswer,explanation,tags,batch,branch,isPYQ,examYear,examName',
      'Economics,"Demand falls when price rises (ceteris paribus)",true_false,medium,Demand and Supply,1,,True,Because of the law of demand.,economics,2026-27,BA,false,,',
      '',
    ].join('\r\n')
    const rows = parseSeedCsv(reordered)
    assert.equal(rows.length, 1, 'blank lines must not create rows')
    assert.equal(rows[0].subject, 'Economics', 'columns are matched by header name not position')
    assert.equal(rows[0].text, 'Demand falls when price rises (ceteris paribus)')
    assert.equal(rows[0].correctAnswer, 'True')
    assert.equal(rows[0].isPYQ, false)
  })

  it('does NOT support quoted commas — such a row shifts columns and fails validation', () => {
    // The generator forbids commas inside fields precisely because of this: the
    // parser (like the college BulkImportModal it mirrors) splits on a raw comma.
    // Pinning the behaviour keeps a future "let's add real CSV quoting" change
    // from silently diverging from the college-side importer.
    const rows = parseSeedCsv(
      csv('"Demand falls when price rises, ceteris paribus",Economics,true_false,medium,Demand,1,,True,,econ,2026-27,BA,false,,')
    )
    assert.equal(rows.length, 1)
    // The embedded comma splits the quoted field in two, so every later column
    // shifts one place: the question is truncated and its subject lands in `type`.
    assert.equal(rows[0].text, 'Demand falls when price rises')
    assert.equal(rows[0].type, 'Economics')
    const errors = validateSeedRow(rows[0])
    assert.ok(
      errors.length > 0,
      'a row with an embedded comma must be rejected rather than imported wrong'
    )
    // Which rule fires depends on how far the columns shifted — the point is that
    // it cannot pass. Here the row reads as an MCQ whose options/answer key are
    // actually the difficulty and marks cells.
    assert.ok(
      errors.some((e) => /correctAnswer|options/i.test(e)),
      `expected the shifted answer/options to be caught, got: ${errors.join('; ')}`
    )
  })

  it('defaults a missing marks cell to 1 — never to the 10 the legacy importer uses', () => {
    const r = row('What is 2 plus 2?,Business Mathematics,mcq,easy,Arithmetic,,2|3|4|5,C,Basic addition.,maths,2026-27,B.Com,false,,')
    assert.equal(r.marks, 1)
  })

  it('returns nothing for a header-only or empty file', () => {
    assert.deepEqual(parseSeedCsv(HEADERS), [])
    assert.deepEqual(parseSeedCsv(''), [])
  })
})

describe('validateSeedRow', () => {
  it('accepts a well-formed MCQ row', () => {
    assert.deepEqual(validateSeedRow(row(MCQ_LINE)), [])
  })

  it('requires text, subject and topic', () => {
    const errors = validateSeedRow(
      row(',Financial Accounting,mcq,easy,,1,A|B|C|D,A,,financial,2026-27,B.Com,false,,')
    )
    assert.ok(errors.some((e) => /text is required/i.test(e)))
    assert.ok(errors.some((e) => /Topic/i.test(e)))
  })

  it('rejects an MCQ key that points past the last option', () => {
    const errors = validateSeedRow(
      row('Pick one:,Economics,mcq,easy,Demand,1,Only two|Options here,D,,econ,2026-27,BA,false,,')
    )
    assert.ok(errors.some((e) => /points past the last option/i.test(e)), errors.join('; '))
  })

  it('rejects a non-letter MCQ key', () => {
    const errors = validateSeedRow(
      row('Pick one:,Economics,mcq,easy,Demand,1,A|B|C|D,Assets = Liabilities,,econ,2026-27,BA,false,,')
    )
    assert.ok(errors.some((e) => /single letter A–D/i.test(e)), errors.join('; '))
  })

  it('rejects a free-text true_false key (the shipped-data regression)', () => {
    const errors = validateSeedRow(
      row(
        'Under the straight line method the depreciation charge each year:,Financial Accounting,true_false,easy,Depreciation,1,,Is the same on the original cost,Explanation.,financial,2026-27,B.Com,false,,'
      )
    )
    assert.ok(errors.some((e) => /True" or "False/i.test(e)), errors.join('; '))
  })

  it('accepts True/False keys in any case', () => {
    for (const key of ['True', 'true', 'FALSE', 'False']) {
      const errors = validateSeedRow(
        row(`Statement:,Economics,true_false,easy,Demand,1,,${key},,econ,2026-27,BA,false,,`)
      )
      assert.deepEqual(errors, [], `key "${key}" should validate`)
    }
  })

  it('requires an expected answer for short_answer and a number for numerical', () => {
    assert.ok(
      validateSeedRow(row('Explain demand:,Economics,short_answer,medium,Demand,2,,,,econ,2026-27,BA,false,,')).length > 0
    )
    assert.ok(
      validateSeedRow(
        row('Integral of 3x squared from 0 to 1:,Mathematics,numerical,medium,Integration,1,,one,Because calculus.,maths,2026-27,B.Sc,false,,')
      ).some((e) => /must be a number/i.test(e))
    )
    assert.deepEqual(
      validateSeedRow(
        row('Integral of 3x squared from 0 to 1:,Mathematics,numerical,medium,Integration,1,,1,Because calculus.,maths,2026-27,B.Sc,false,,')
      ),
      []
    )
  })

  it('enforces examYear + examName on PYQ rows', () => {
    const errors = validateSeedRow(
      row('Past paper question:,History,short_answer,medium,Freedom Struggle,2,,Answer text,,history,2026-27,BA,true,,')
    )
    assert.ok(errors.some((e) => /examYear/i.test(e)))
    assert.ok(errors.some((e) => /examName/i.test(e)))
  })

  it('flags every invalid row with its errors and keeps the valid ones', () => {
    const validated = validateSeedRows(
      parseSeedCsv(
        csv(
          MCQ_LINE,
          ',Economics,mcq,easy,Demand,1,A|B|C|D,A,,econ,2026-27,BA,false,,'
        )
      )
    )
    assert.equal(validated.length, 2)
    assert.equal(validated[0].valid, true)
    assert.equal(validated[1].valid, false)
    assert.ok(validated[1].errors.length > 0)
  })
})

describe('type and difficulty mapping', () => {
  it('folds the legacy short/long aliases into the universal vocabulary', () => {
    assert.equal(toUniversalQuestionType('short'), 'short_answer')
    assert.equal(toUniversalQuestionType('long'), 'long_answer')
    assert.equal(toUniversalQuestionType('match'), 'matching')
    assert.equal(toUniversalQuestionType('TRUE_FALSE'), 'true_false')
    assert.equal(toUniversalQuestionType('mcq'), 'mcq')
  })

  it('falls back to short_answer for an unknown type with no options, mcq with options', () => {
    assert.equal(toUniversalQuestionType('essay', false), 'short_answer')
    assert.equal(toUniversalQuestionType('essay', true), 'mcq')
    assert.equal(toUniversalQuestionType('', false), 'short_answer')
  })

  it('clamps an unknown difficulty to medium', () => {
    assert.equal(toUniversalDifficulty('HARD'), 'hard')
    assert.equal(toUniversalDifficulty('nightmare'), 'medium')
    assert.equal(toUniversalDifficulty(''), 'medium')
  })

  it('detects Indic scripts for the language field', () => {
    assert.equal(detectSeedLanguage('What is GDP?'), 'en')
    assert.equal(detectSeedLanguage('ಒಟ್ಟು ಜಿಡಿಪಿ ಎಂದರೇನು?'), 'kn')
    assert.equal(detectSeedLanguage('மொத்த ஜிடிபி என்றால் என்ன?'), 'ta')
    assert.equal(detectSeedLanguage('मोट जीडीपी क्या है?'), 'hi')
  })
})

describe('dedupe fingerprints', () => {
  it('ignores punctuation, case and repeated whitespace', () => {
    assert.equal(
      normalizeQuestionText('  The   Accounting Equation, is stated as: '),
      'the accounting equation is stated as'
    )
  })

  it('matches the same question but separates different topics and programmes', () => {
    const a = fingerprintSeedRow(row(MCQ_LINE))
    const b = fingerprintSeedRow(row(MCQ_LINE))
    assert.equal(a, b)

    const otherTopic = fingerprintSeedRow(
      row(MCQ_LINE.replace('Journal and Accounting Equation', 'Ledger and Trial Balance'))
    )
    assert.notEqual(a, otherTopic)

    const otherBranch = fingerprintSeedRow(row(MCQ_LINE.replace('B.Com', 'BA')))
    assert.notEqual(a, otherBranch)
  })

  it('round-trips: a written meta doc fingerprints back to its source row', () => {
    const source = row(MCQ_LINE)
    const payload = buildSeedPayload(source, { author: AUTHOR })
    // Simulate what Firestore hands back on the next run (id + derived fields).
    const stored = {
      id: 'q1',
      previewText: (payload.meta as any).previewText || source.text,
      questionText: payload.content.questionText,
      subjectId: (payload.meta as any).subjectId,
      topicId: (payload.meta as any).topicId,
      tags: (payload.meta as any).tags,
    }
    assert.equal(fingerprintMetaDoc(stored), fingerprintSeedRow(source))
  })

  it('reads the programme from tags, and from a legacy branch field when present', () => {
    const source = row(MCQ_LINE)
    const fromTags = fingerprintMetaDoc({
      previewText: source.text,
      subjectId: 'Financial Accounting',
      topicId: 'Journal and Accounting Equation',
      tags: ['financial', 'B.Com', 'batch-2026-27', 'vriddhi-curated'],
    })
    assert.equal(fromTags, fingerprintSeedRow(source))

    const fromLegacyField = fingerprintMetaDoc({
      text: source.text,
      subject: 'Financial Accounting',
      unit: 'Journal and Accounting Equation',
      branch: 'B.Com',
    })
    assert.equal(fromLegacyField, fingerprintSeedRow(source))
  })

  it('does not match a different question in the same topic', () => {
    const a = fingerprintMetaDoc({
      previewText: 'The accounting equation is stated as:',
      subjectId: 'Financial Accounting',
      topicId: 'Journal and Accounting Equation',
      tags: ['B.Com'],
    })
    const b = fingerprintMetaDoc({
      previewText: 'Recording a transaction in the journal is called:',
      subjectId: 'Financial Accounting',
      topicId: 'Journal and Accounting Equation',
      tags: ['B.Com'],
    })
    assert.notEqual(a, b)
  })
})

describe('buildSeedOptions', () => {
  it('keys MCQ options A–D and marks exactly the CSV answer as correct', () => {
    const r = row(MCQ_LINE)
    const built = buildSeedOptions(r, 'mcq', fingerprintSeedRow(r), false)
    assert.equal(built.options.length, 4)
    assert.deepEqual(built.options.map((o) => o.id), ['A', 'B', 'C', 'D'])
    assert.equal(built.correctAnswer, 'A')
    assert.equal(built.options.filter((o) => o.isCorrect).length, 1)
    assert.equal(built.options[0].text, 'Assets = Liabilities + Capital')
  })

  it('keeps the correct option correct after shuffling', () => {
    const r = row(MCQ_LINE)
    const correctText = 'Assets = Liabilities + Capital'
    const built = buildSeedOptions(r, 'mcq', fingerprintSeedRow(r), true)
    const correct = built.options.find((o) => o.isCorrect)!
    assert.equal(correct.text, correctText)
    assert.equal(built.correctAnswer, correct.id)
    assert.equal(built.options.filter((o) => o.isCorrect).length, 1)
  })

  it('shuffles deterministically — re-seeding produces identical documents', () => {
    const r = row(MCQ_LINE)
    const fp = fingerprintSeedRow(r)
    const first = buildSeedOptions(r, 'mcq', fp, true)
    const second = buildSeedOptions(r, 'mcq', fp, true)
    assert.deepEqual(first.options, second.options)
    assert.equal(first.correctAnswer, second.correctAnswer)
    // Different question ⇒ independent permutation seed.
    const other = row(MCQ_LINE.replace('The accounting equation is stated as:', 'Another question entirely:'))
    assert.notDeepEqual(
      buildSeedOptions(other, 'mcq', fingerprintSeedRow(other), true).options.map((o) => o.text),
      first.options.map((o) => o.text)
    )
  })

  it('spreads the answer key across letters over the real dataset', () => {
    // The authored seed keys 44 A / 76 B / 6 C / 0 D — a paper generated from it
    // would be guessable. Shuffling must flatten that without losing correctness.
    const resolved = resolveSeedRows('all', [])
    const distribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 }
    for (const r of resolved.rows) {
      if (toUniversalQuestionType(r.type, r.options.length > 0) !== 'mcq') continue
      const built = buildSeedOptions(r, 'mcq', fingerprintSeedRow(r), true)
      distribution[built.correctAnswer] = (distribution[built.correctAnswer] || 0) + 1
      const keyIndex = 'ABCD'.indexOf(r.correctAnswer.trim().toUpperCase())
      assert.equal(
        built.options.find((o) => o.isCorrect)!.text,
        r.options[keyIndex],
        `shuffling changed the answer for "${r.text}"`
      )
    }
    for (const letter of ['A', 'B', 'C', 'D']) {
      assert.ok(
        distribution[letter] >= 15,
        `answer key still skewed: ${JSON.stringify(distribution)}`
      )
    }
  })

  it('builds an explicit True/False pair for true_false rows', () => {
    const trueRow = row('A journal is a book of original entry:,Financial Accounting,true_false,easy,Journal,1,,True,,financial,2026-27,B.Com,false,,')
    const trueBuilt = buildSeedOptions(trueRow, 'true_false', 'fp1', true)
    assert.deepEqual(trueBuilt.options, [
      { id: 'A', text: 'True', isCorrect: true },
      { id: 'B', text: 'False', isCorrect: false },
    ])
    assert.equal(trueBuilt.correctAnswer, 'A')

    const falseRow = row('Ledger is the book of original entry:,Financial Accounting,true_false,easy,Journal,1,,False,,financial,2026-27,B.Com,false,,')
    const falseBuilt = buildSeedOptions(falseRow, 'true_false', 'fp2', true)
    assert.equal(falseBuilt.correctAnswer, 'B')
    assert.equal(falseBuilt.options[1].isCorrect, true)
    assert.equal(falseBuilt.shuffled, false, 'true/false pairs must not be reordered')
  })

  it('leaves free-text types without options and keeps the answer verbatim', () => {
    const short = row('State any three methods of providing depreciation.,Financial Accounting,short_answer,medium,Depreciation,2,,Straight line method; diminishing balance method; and units of production method.,,financial,2026-27,B.Com,false,,')
    const built = buildSeedOptions(short, 'short_answer', 'fp', true)
    assert.deepEqual(built.options, [])
    assert.match(built.correctAnswer, /Straight line method/)
  })

  it('seededShuffle is a permutation and is stable for a given seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const once = seededShuffle(items, 'seed-key')
    const twice = seededShuffle(items, 'seed-key')
    assert.deepEqual(once, twice)
    assert.deepEqual([...once].sort(), [...items].sort())
    assert.deepEqual(items, ['a', 'b', 'c', 'd', 'e'], 'input must not be mutated')
  })
})

describe('buildSeedPayload', () => {
  it('writes platform-curated rows the way a superadmin submission does', () => {
    const payload = buildSeedPayload(row(MCQ_LINE), { author: AUTHOR })
    const meta = payload.meta as any
    assert.equal(meta.status, 'approved')
    assert.equal(meta.visibility, 'public')
    assert.equal(meta.source, 'platform')
    assert.equal(meta.createdBy.role, 'superadmin')
    assert.equal(meta.createdBy.userId, 'sa-1')
    assert.equal(meta.createdBy.collegeId, null, 'platform rows must not be college-owned')
    assert.deepEqual(meta.sharedWith, [])
    assert.equal(meta.usageCount, 0)
    assert.equal(meta.qualityRating, 0)
    assert.equal(meta.hasImage, false)
  })

  it('maps the CSV vocabulary onto the universal schema', () => {
    const payload = buildSeedPayload(row(MCQ_LINE), { author: AUTHOR })
    const meta = payload.meta as any
    assert.equal(meta.subjectId, 'Financial Accounting')
    assert.equal(meta.topicId, 'Journal and Accounting Equation')
    assert.equal(meta.questionType, 'mcq')
    assert.equal(meta.difficulty, 'easy')
    assert.equal(meta.marks, 1)
    assert.equal(meta.language, 'en')
    assert.equal(payload.content.questionText, 'The accounting equation is stated as:')
    assert.match(payload.content.explanation || '', /Assets equal liabilities plus capital/)
  })

  it('honours the visibility / status / shuffle options', () => {
    const r = row(MCQ_LINE)
    const pending = buildSeedPayload(r, {
      author: AUTHOR,
      status: 'pending',
      visibility: 'college_only',
      shuffleOptions: false,
    })
    assert.equal((pending.meta as any).status, 'pending')
    assert.equal((pending.meta as any).visibility, 'college_only')
    assert.equal((pending.content.options as any[])[0].text, 'Assets = Liabilities + Capital')
  })

  it('carries seed provenance so a row can be traced back to its CSV', () => {
    const meta = buildSeedPayload(row(MCQ_LINE), { author: AUTHOR }).meta as any
    assert.equal(meta.seedSource, 'question-bank-seed')
    assert.equal(meta.seedBatch, '2026-27')
    assert.equal(meta.seedBranch, 'B.Com')
    assert.equal(meta.seedIsPYQ, false)
  })

  it('keeps legacy aliases on the content doc for the college-side readers', () => {
    const content = buildSeedPayload(row(MCQ_LINE), { author: AUTHOR }).content as any
    assert.equal(content.text, content.questionText)
    assert.equal(content.subject, 'Financial Accounting')
    assert.equal(content.topic, 'Journal and Accounting Equation')
    assert.equal(content.unit, 'Journal and Accounting Equation')
    assert.equal(content.branch, 'B.Com')
    assert.equal(content.batch, '2026-27')
    assert.equal(content.type, 'mcq')
  })

  it('tags rows with programme, batch and platform ownership', () => {
    const tags = buildSeedTags(row(MCQ_LINE), 'platform')
    for (const expected of ['financial', 'B.Com', 'batch-2026-27', 'vriddhi-curated', 'free', 'seed-import']) {
      assert.ok(tags.includes(expected), `missing tag ${expected} in ${tags.join(',')}`)
    }
    assert.equal(new Set(tags).size, tags.length, 'tags must be deduped')
  })

  it('marks PYQ rows with the pyq tag and keeps the exam metadata', () => {
    const r = row(
      'Explain the causes of the 1857 revolt:,History,long_answer,hard,Freedom Struggle,5,,Military; political; and economic causes.,explanation omitted,history,2026-27,BA,true,2019,Karnataka University'
    )
    assert.deepEqual(validateSeedRow(r), [])
    const payload = buildSeedPayload(r, { author: AUTHOR })
    const meta = payload.meta as any
    assert.ok(meta.tags.includes('pyq'))
    assert.equal(meta.seedExamYear, '2019')
    assert.equal(meta.seedExamName, 'Karnataka University')
    assert.equal(meta.seedBranch, 'BA')
    assert.equal(meta.seedBatch, '2026-27')
    assert.equal(meta.questionType, 'long_answer')
    assert.equal(meta.marks, 5)
  })
})

describe('resolveSeedRows', () => {
  it('filters by programme and reports what the filter hid', () => {
    const bcomOnly = resolveSeedRows('all', ['B.Com'])
    assert.equal(bcomOnly.rows.length, 80)
    assert.equal(bcomOnly.filteredOut, 160)
    assert.ok(bcomOnly.rows.every((r) => r.branch === 'B.Com'))
    assert.deepEqual(bcomOnly.branches, [{ name: 'B.Com', count: 80 }])
  })

  it('treats several selected programmes as a union', () => {
    const two = resolveSeedRows('all', ['BA', 'B.Sc'])
    assert.equal(two.rows.length, 160)
    assert.equal(two.filteredOut, 80)
  })

  it('is case-insensitive about the branch filter', () => {
    assert.equal(resolveSeedRows('all', ['b.com']).rows.length, 80)
  })

  it('keeps invalid rows out of the seed set but reports them', () => {
    const resolved = resolveSeedRows('all', [])
    assert.equal(resolved.rows.length + resolved.invalid.length, 240)
  })
})
