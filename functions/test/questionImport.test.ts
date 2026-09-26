// functions/test/questionImport.test.ts
//
// Unit tests for the bulk question-paper import:
//   * functions/src/questionImport.ts  (pure pipeline: prompts, sanitiser, docs, job reducers)
//   * functions/src/utils/zipArchive.ts (dependency-free ZIP reader)
//
// The ZIP fixtures are built in memory here — no archive is committed to git —
// so the reader is proven against real archive bytes, including the
// data-descriptor case (zeroed sizes in the local header) that makes naive
// readers return empty files.

import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import {
  IMPORT_MAX_ARCHIVE_BYTES,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_MAX_QUESTIONS_PER_FILE,
  applyFileResult,
  applyUnpackResult,
  bloomLevelFor,
  buildImportDraftDocs,
  buildImportPrompt,
  buildPreviewText,
  buildSearchKeywords,
  buildSeedFingerprint,
  buildVisionImportPrompt,
  chunk,
  createImportJob,
  describeJobProgress,
  detectDocumentLanguage,
  detectQuestionLanguage,
  emptyCounters,
  extractJsonPayload,
  isArchiveFileName,
  isBufferTooLargeForInline,
  isSingleDocumentFileName,
  looksLikeLegacyFont,
  nextQueuedFile,
  normalizeDefaults,
  normalizeImportedQuestions,
  normalizeQuestionText,
  singleDocumentRow,
  toUniversalDifficulty,
  toUniversalQuestionType,
  validateImportUpload,
  type ImportDraftContext,
  type ImportJobDoc,
  type ImportJobFile,
} from '../src/questionImport'
import { readZipDirectory, readZipEntry, safeEntryName, selectZipDocuments } from '../src/utils/zipArchive'

// ─── in-memory ZIP writer (fixtures only) ───────────────────────────────────

function u16(v: number) {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(v, 0)
  return b
}
function u32(v: number) {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(v, 0)
  return b
}

function makeZip(entries: Array<{ name: string; data: string; method?: number; dataDescriptor?: boolean }>): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8')
    const raw = Buffer.from(e.data)
    const method = e.method === 8 ? 8 : 0
    const payload = method === 8 ? deflateRawSync(raw) : raw
    const flags = e.dataDescriptor ? 0x0008 : 0
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(flags),
      u16(method),
      u16(0),
      u16(0),
      u32(0),
      u32(e.dataDescriptor ? 0 : payload.length),
      u32(e.dataDescriptor ? 0 : raw.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      payload,
    ])
    localParts.push(local)
    centralParts.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(flags),
        u16(method),
        u16(0),
        u16(0),
        u32(0),
        u32(payload.length),
        u32(raw.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ])
    )
    offset += local.length
  }
  const central = Buffer.concat(centralParts)
  const eocd = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(central.length), u32(offset), u16(0)])
  return Buffer.concat([...localParts, central, eocd])
}

// ─── ZIP reader ─────────────────────────────────────────────────────────────

test('zip: reads stored and deflated entries and their real sizes', () => {
  const zip = makeZip([
    { name: 'BCU-BCom-5-Sem-Nov-2024.pdf', data: 'digital-paper' },
    { name: 'kannada-paper.pdf', data: 'PÀ£ÁðlPÀ ¥Àæ±Éß¥ÀwæPÉ', method: 8 },
    { name: '__MACOSX/junk', data: 'x' },
    { name: 'notes.txt', data: 'nope' },
  ])
  const { entries } = readZipDirectory(zip)
  assert.equal(entries.length, 4)
  const docs = selectZipDocuments(entries)
  assert.deepEqual(
    docs.map((d) => d.name),
    ['BCU-BCom-5-Sem-Nov-2024.pdf', 'kannada-paper.pdf']
  )
  assert.equal(readZipEntry(zip, docs[0]).toString('utf8'), 'digital-paper')
  assert.equal(readZipEntry(zip, docs[1]).toString('utf8'), 'PÀ£ÁðlPÀ ¥Àæ±Éß¥ÀwæPÉ')
})

test('zip: trusts the central directory when a data descriptor is used', () => {
  const zip = makeZip([{ name: 'scan.pdf', data: 'real-bytes-here', method: 8, dataDescriptor: true }])
  const { entries } = readZipDirectory(zip)
  assert.equal(entries.length, 1)
  // The local header says 0 — the central directory says the truth.
  assert.equal(readZipEntry(zip, entries[0]).toString('utf8'), 'real-bytes-here')
})

test('zip: drops Office lock files, macOS forks and directories', () => {
  const zip = makeZip([
    { name: 'papers/', data: '' },
    { name: 'papers/._BCU.pdf', data: 'fork' },
    { name: 'papers/~$draft.docx', data: 'lock' },
    { name: 'papers/BCU.pdf', data: 'ok' },
    { name: '.DS_Store', data: 'x' },
  ])
  const docs = selectZipDocuments(readZipDirectory(zip).entries)
  assert.deepEqual(
    docs.map((d) => d.name),
    ['papers/BCU.pdf']
  )
})

test('zip: rejects non-archives and unsupported compression instead of guessing', () => {
  assert.throws(() => readZipDirectory(Buffer.from('not a zip at all')), /Not a ZIP archive/)
  const zip = makeZip([{ name: 'a.pdf', data: 'x' }])
  const [entry] = readZipDirectory(zip).entries
  assert.throws(() => readZipEntry(zip, { ...entry, method: 99 }), /Unsupported ZIP compression/)
  assert.throws(() => readZipEntry(zip, { ...entry, zip64: true }), /ZIP64/)
})

test('zip: safeEntryName keeps names usable and bounded', () => {
  assert.equal(safeEntryName('papers/BCU B.Com — Nov 2024.pdf', 0), 'BCU-B.Com-Nov-2024.pdf'.replace(/\./g, '.'))
  assert.equal(safeEntryName('../../etc/passwd', 3).includes('/'), false)
  assert.equal(safeEntryName('', 7), 'document-7')
  assert.ok(safeEntryName('x'.repeat(400) + '.pdf', 1).length <= 120)
})

// ─── prompt + sanitizer ─────────────────────────────────────────────────────

test('prompt: text mode carries the paper text and the never-translate rules', () => {
  const prompt = buildImportPrompt({ fileName: 'bcu-2024.pdf', text: 'Q1. Explain demand.', totalPages: 3 })
  assert.match(prompt, /transcribing a university question paper/)
  assert.match(prompt, /Explain demand\./)
  assert.match(prompt, /3 page/)
  assert.match(prompt, /NEVER transliterate Kannada/)
  assert.match(prompt, /Never solve the question/)
  assert.match(prompt, /Return JSON only/)
})

test('prompt: vision mode tells the model to read visually and never emit mojibake', () => {
  const prompt = buildVisionImportPrompt({ fileName: 'scan.pdf' })
  assert.match(prompt, /Read the pages VISUALLY/)
  assert.match(prompt, /real Unicode Kannada/)
  assert.match(prompt, /Nudi \/ KGP/)
})

test('sanitizer: keeps Kannada, drops invented answers, demotes optionless MCQs', () => {
  const raw = {
    meta: { title: 'V Semester B.Com', examYear: 2024, language: 'kn' },
    questions: [
      { text: 'ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ.', type: 'long_answer', marks: 10, section: 'B' },
      { text: 'Define poverty line.', type: 'mcq', marks: 1, options: [], correctAnswer: 'B' },
      { text: 'Which is the capital of Karnataka?', type: 'mcq', marks: 1, options: ['Bengaluru', 'Mysuru'], correctAnswer: 'Bengaluru' },
      { text: '   ', type: 'short_answer', marks: 2 },
    ],
  }
  const { questions, meta } = normalizeImportedQuestions(raw)
  assert.equal(questions.length, 3)
  assert.equal(questions[0].text, 'ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ.')
  assert.equal(questions[0].type, 'long_answer')
  assert.equal(detectQuestionLanguage(questions[0].text), 'kn')
  // Optionless "mcq" must not become an unanswerable MCQ, and its fake answer is dropped.
  assert.equal(questions[1].type, 'short_answer')
  assert.equal(questions[1].correctAnswer, '')
  assert.equal(questions[2].type, 'mcq')
  assert.equal(questions[2].correctAnswer, 'Bengaluru')
  assert.equal(meta.examYear, 2024)
  assert.equal(meta.language, 'kn')
})

test('sanitizer: clamps marks, length, option count and the question ceiling', () => {
  const many = Array.from({ length: IMPORT_MAX_QUESTIONS_PER_FILE + 25 }, (_, i) => ({
    text: `Question ${i + 1} about accounting?`,
    type: 'short_answer',
    marks: 5,
  }))
  const { questions, warnings } = normalizeImportedQuestions({ questions: many })
  assert.equal(questions.length, IMPORT_MAX_QUESTIONS_PER_FILE)
  assert.ok(warnings.some((w) => /Only the first/.test(w)))

  const wild = normalizeImportedQuestions({
    questions: [
      { text: 'A'.repeat(9_000), type: 'mcq', marks: 9_999, options: Array.from({ length: 20 }, (_, i) => `opt ${i}`) },
      { text: 'Negative marks', marks: -4 },
    ],
  })
  assert.equal(wild.questions[0].text.length, 4_000)
  assert.equal(wild.questions[0].marks, 200)
  assert.ok(wild.questions[0].options.length <= 8)
  // A question with no marks keeps 0 here; the draft builder stores the bank's minimum of 1.
  assert.equal(wild.questions[1].marks, 0)
})

test('sanitizer: rejects an implausible exam year instead of storing it', () => {
  const { meta } = normalizeImportedQuestions({ meta: { examYear: 1902 }, questions: [{ text: 'Real question?' }] })
  assert.equal(meta.examYear, 0)
})

test('extractJsonPayload: tolerates fences and prose around the JSON', () => {
  assert.deepEqual(extractJsonPayload('{"questions":[]}'), { questions: [] })
  assert.deepEqual(extractJsonPayload('```json\n{"questions":[{"text":"x"}]}\n```'), { questions: [{ text: 'x' }] })
  assert.deepEqual(extractJsonPayload('Here is the result:\n{"questions":[]}\nDone.'), { questions: [] })
  assert.equal(extractJsonPayload('no json here'), null)
  assert.equal(extractJsonPayload(''), null)
})

// ─── fingerprint parity with the client seeder ──────────────────────────────

test('fingerprint: normalisation matches the client seeder exactly', () => {
  // These fixtures are duplicated verbatim in
  // src/modules/superadmin/data/questionBankSeed.test.ts — if either side's
  // normalisation drifts, one of the two suites fails. That equivalence is the
  // contract that lets the client's duplicate scan recognise imported rows.
  const fixtures: Array<{ input: string; expected: string }> = [
    { input: 'Explain the  Demographic   Features of India!', expected: 'explain the demographic features of india' },
    // NOTE: Kannada combining marks are stripped by \p{L} (matras are \p{M}).
    // Preserved deliberately so both copies stay in lockstep — see the caveat in
    // functions/src/questionImport.ts.
    { input: 'ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ?', expected: 'ಭರತದ ಜನಸಖಯ ಲಕಷಣಗಳನನ ವವರಸ' },
    { input: 'What is 2+2 ?', expected: 'what is 22' },
  ]
  for (const f of fixtures) assert.equal(normalizeQuestionText(f.input), f.expected)
})

test('fingerprint: same wording → same key, different subject → different key', () => {
  const a = buildSeedFingerprint({ text: 'Define demand.', subject: 'Economics', topic: 'Unit 1', branch: 'B.Com' })
  const b = buildSeedFingerprint({ text: '  define   DEMAND ', subject: 'economics', topic: 'unit 1', branch: 'b.com' })
  const c = buildSeedFingerprint({ text: 'Define demand.', subject: 'Commerce', topic: 'Unit 1', branch: 'B.Com' })
  assert.equal(a, b)
  assert.notEqual(a, c)
  assert.equal(a.split('|').length, 4)
})

test('preview + search keywords: Kannada words survive, nothing overflows', () => {
  assert.equal(buildPreviewText('a'.repeat(400)).length, 160)
  const keywords = buildSearchKeywords('ಭಾರತದ ಜನಸಂಖ್ಯೆ Define poverty line', 'Economics', 'Unit 1', ['pyq'])
  assert.ok(keywords.includes('define'))
  assert.ok(keywords.includes('economics'))
  assert.ok(keywords.some((k) => k.startsWith('ಭಾರತದ')), 'Kannada token missing')
})

test('type/difficulty mapping never invents an MCQ', () => {
  assert.equal(toUniversalQuestionType('short'), 'short_answer')
  assert.equal(toUniversalQuestionType('CASE STUDY'), 'case_based')
  assert.equal(toUniversalQuestionType('mystery_label'), 'short_answer')
  assert.equal(toUniversalQuestionType('mystery_label', true), 'mcq')
  assert.equal(toUniversalQuestionType('TRUE-FALSE'), 'true_false')
  assert.equal(toUniversalDifficulty('HARD'), 'hard')
  assert.equal(toUniversalDifficulty('impossible'), 'medium')
  assert.equal(bloomLevelFor('long_answer', 'medium'), 'create')
  assert.equal(bloomLevelFor('numerical', 'easy'), 'apply')
  assert.equal(bloomLevelFor('mcq', 'easy'), 'remember')
})

// ─── script + legacy-font detection ─────────────────────────────────────────

test('language detection: Kannada wins over a bilingual paper, legacy fonts are flagged', () => {
  assert.equal(detectQuestionLanguage('Explain demand.'), 'en')
  assert.equal(detectQuestionLanguage('ಬೇಡಿಕೆಯನ್ನು ವಿವರಿಸಿ.'), 'kn')
  assert.equal(detectQuestionLanguage('ಭಾರತದ ಜನಸಂಖ್ಯೆ Explain population'), 'kn')
  assert.equal(detectDocumentLanguage('Answer any five questions of the following set.'), 'en')
  assert.equal(detectDocumentLanguage('ಭಾರತದ ಜನಸಂಖ್ಯಾ ಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ.'), 'kn')
  assert.equal(detectDocumentLanguage('ಭಾರತದ ಜನಸಂಖ್ಯೆ Answer in Kannada or English about the population of India'), 'mixed')

  const nudi = 'PÀ£ÁðlPÀ ¸ÀPÁðgÀ ¥Àæ±Éß¥ÀwæPÉ - 2024 F ¥Àæ±ÉßUÉ GvÀÛgÀ §gÉ¬Äj'
  assert.equal(looksLikeLegacyFont(nudi), true)
  assert.equal(looksLikeLegacyFont('ಕರ್ನಾಟಕ ಸರ್ಕಾರ ಪ್ರಶ್ನೆಪತ್ರಿಕೆ 2024'), false)
  assert.equal(looksLikeLegacyFont('Answer any five of the following questions.'), false)
})

// ─── draft documents ────────────────────────────────────────────────────────

function draftContext(overrides: Partial<ImportDraftContext> = {}): ImportDraftContext {
  let n = 0
  return {
    jobId: 'job-1',
    fileIndex: 0,
    fileName: 'BCU-BCom-5-Sem-Nov-2024.pdf',
    defaults: normalizeDefaults({
      program: 'bcom',
      branch: 'B.Com',
      semester: 5,
      subjectId: 'Financial Accounting',
      topicId: 'Depreciation',
      difficulty: 'medium',
      examYear: 2024,
      universityCode: 'bcu',
    }),
    paper: {
      title: 'V Semester B.Com Examination',
      subject: 'Financial Accounting',
      university: 'Bengaluru City University',
      paperCode: 'DCBB503',
      examMonth: 'November',
      examYear: 2024,
      durationMinutes: 150,
      maxMarks: 60,
      language: 'en',
    },
    author: { uid: 'sa-1', name: 'Content Team' },
    now: '2026-09-25T10:00:00.000Z',
    newId: () => `id-${++n}`,
    ...overrides,
  }
}

test('draft docs: identical field contract to a manual superadmin submission', () => {
  const docs = buildImportDraftDocs(
    { text: 'Explain the causes of depreciation.', type: 'long_answer', marks: 10, section: 'B', topic: '', parts: [], options: [], correctAnswer: '' },
    draftContext()
  )
  const meta = docs.meta as Record<string, any>
  const content = docs.content as Record<string, any>
  const review = docs.review as Record<string, any>

  // Status contract: drafts are pending and go through the Review Queue.
  assert.equal(meta.status, 'pending')
  assert.equal(content.status, 'pending')
  assert.equal(review.status, 'pending')
  assert.equal(review.questionId, meta.id)

  // Visibility contract: platform content, no college.
  assert.equal(meta.visibility, 'public')
  assert.equal(meta.source, 'platform')
  assert.deepEqual(meta.sharedWith, [])
  assert.equal(meta.createdBy.collegeId, null)
  assert.equal(meta.createdBy.role, 'superadmin')

  // List-view contract: the files the client's fingerprint/dedupe reads.
  assert.equal(meta.previewText, 'Explain the causes of depreciation.')
  assert.equal(meta.questionText, undefined)
  assert.equal(content.questionText, 'Explain the causes of depreciation.')
  assert.equal(content.text, 'Explain the causes of depreciation.')
  assert.equal(content.unit, 'Depreciation')
  assert.equal(meta.branch, 'B.Com')
  assert.equal(content.branch, 'B.Com')
  assert.equal(meta.marks, 10)
  assert.equal(meta.subjectId, 'Financial Accounting')
  assert.equal(meta.topicId, 'Depreciation')
  assert.equal(meta.language, 'en')
  assert.deepEqual(content.options, [])
  assert.equal(content.storagePath, `questionBank_content/${meta.id}.json`)
  assert.equal(content.metadataDocId, meta.id)
  assert.equal(Array.isArray(meta.searchKeywords), true)
  assert.ok(meta.tags.includes('pyq'))
  assert.ok(meta.tags.includes('exam-2024'))
  assert.ok(meta.tags.includes('university-bcu'))

  // Provenance + the fingerprint the client-side duplicate check re-derives.
  assert.equal(meta.importJobId, 'job-1')
  assert.equal(docs.fingerprint, meta.importFingerprint)
  assert.equal(docs.fingerprint.split('|')[3], 'b.com')
  assert.notEqual(meta.id, review.id)
})

test('draft docs: an MCQ keeps letters and only the printed answer', () => {
  const docs = buildImportDraftDocs(
    {
      text: 'Which of these is a current asset?',
      type: 'mcq',
      marks: 1,
      section: 'A',
      topic: '',
      parts: [],
      options: ['Cash', 'Building', 'Machinery'],
      correctAnswer: 'Cash',
    },
    draftContext()
  )
  const content = docs.content as Record<string, any>
  assert.deepEqual(
    content.options.map((o: any) => [o.id, o.text]),
    [
      ['A', 'Cash'],
      ['B', 'Building'],
      ['C', 'Machinery'],
    ]
  )
  assert.equal(content.correctAnswer, 'Cash')
})

test('draft docs: Kannada question gets kn language and a Kannada fingerprint', () => {
  const docs = buildImportDraftDocs(
    { text: 'ಬೇಡಿಕೆಯ ನಿಯಮವನ್ನು ವಿವರಿಸಿ.', type: 'short_answer', marks: 5, section: 'A', topic: '', parts: [], options: [], correctAnswer: '' },
    draftContext()
  )
  assert.equal((docs.meta as Record<string, any>).language, 'kn')
  // Fingerprint parity with the client: it starts with the SAME normalised text
  // (matras stripped today — see the caveat above), so dedupe matches.
  assert.ok(docs.fingerprint.startsWith(normalizeQuestionText('ಬೇಡಿಕೆಯ ನಿಯಮವನ್ನು ವಿವರಿಸಿ.')))
  assert.ok(docs.fingerprint.split('|')[0].length > 0)
})

test('draft docs: a question with no marks stores the bank minimum of 1', () => {
  const docs = buildImportDraftDocs(
    { text: 'Define book keeping.', type: 'short_answer', marks: 0, section: '', topic: '', parts: [], options: [], correctAnswer: '' },
    draftContext()
  )
  assert.equal((docs.meta as Record<string, any>).marks, 1)
  assert.equal((docs.content as Record<string, any>).marks, 1)
})

// ─── job reducers ───────────────────────────────────────────────────────────

function baseJob(): ImportJobDoc {
  return createImportJob({
    id: 'job-1',
    storagePath: 'question-paper-imports/uid/job-1/papers.zip',
    fileName: 'papers.zip',
    bytes: 1_000,
    defaults: normalizeDefaults({ program: 'bcom', subjectId: 'Accounting' }),
    author: { uid: 'sa-1', name: 'Content Team' },
    now: '2026-09-25T10:00:00.000Z',
  })
}

test('job: defaults are normalised, never trusted', () => {
  const defaults = normalizeDefaults({ program: 'BCOM', semester: 99, difficulty: 'nope' as never, examYear: 1999 })
  assert.equal(defaults.program, 'bcom')
  assert.equal(defaults.branch, 'BCOM')
  assert.equal(defaults.semester, 10)
  assert.equal(defaults.difficulty, 'medium')
  assert.equal(defaults.examYear, null)
  assert.deepEqual(emptyCounters(), { files: 0, unpacked: 0, parsed: 0, failed: 0, skippedFiles: 0, drafted: 0, duplicates: 0 })
})

test('job: unpack appends rows, switches to parsing, and caps the file list', () => {
  const job = baseJob()
  assert.equal(job.status, 'awaiting-upload')
  const files: ImportJobFile[] = [
    { index: 0, name: 'a.pdf', bytes: 10, status: 'queued', storagePath: 'files/0000-a.pdf' },
    { index: 1, name: 'b.pdf', bytes: 20, status: 'failed', error: 'boom' },
  ]
  const afterUnpack = applyUnpackResult(job, files, { now: '2026-09-25T10:01:00.000Z' })
  assert.equal(afterUnpack.status, 'parsing')
  assert.equal(afterUnpack.counters.files, 2)
  assert.equal(afterUnpack.counters.unpacked, 2)

  const capped = applyUnpackResult(job, files, { maxFiles: 1, now: '2026-09-25T10:01:00.000Z' })
  assert.equal(capped.files.length, 1)
  assert.equal(capped.truncated, true)
})

test('job: upload gate accepts a .zip or one document, and rejects everything else', () => {
  assert.equal(isArchiveFileName('PAPERS.ZIP'), true)
  assert.equal(isSingleDocumentFileName('AMC-106A OE-221.pdf'), true)
  assert.equal(isSingleDocumentFileName('paper.docx'), true)
  assert.equal(isSingleDocumentFileName('scan.jpg'), true)
  assert.equal(isSingleDocumentFileName('notes.txt'), false)

  // Both kinds of upload are welcome at their own size bound.
  assert.equal(validateImportUpload('papers.zip', 100), null)
  assert.equal(validateImportUpload('AMC-106A OE-221.pdf', 100), null)
  assert.equal(validateImportUpload('paper.DOCX', 100), null)

  // …and each is rejected past its bound, with its own message.
  const bigZip = validateImportUpload('papers.zip', IMPORT_MAX_ARCHIVE_BYTES + 1)
  assert.ok(bigZip && /split it into smaller zips/i.test(bigZip))
  const bigDoc = validateImportUpload('paper.pdf', IMPORT_MAX_FILE_BYTES + 1)
  assert.ok(bigDoc && /per-document limit/i.test(bigDoc))

  const wrongKind = validateImportUpload('notes.txt', 10)
  assert.ok(wrongKind && /\.pdf/.test(wrongKind))
  assert.ok(validateImportUpload('', 10))
})

test('job: a single document seeds its own row and goes straight to parsing', () => {
  const job = baseJob()
  assert.equal(job.status, 'awaiting-upload')
  const row = singleDocumentRow({ name: 'AMC-106A OE-221.pdf', bytes: 29_000, storagePath: job.archive.storagePath })
  assert.equal(row.index, 0)
  assert.equal(row.status, 'queued')
  // The uploaded object IS the document — no unpack copy is made.
  assert.equal(row.storagePath, job.archive.storagePath)

  const seeded = applyUnpackResult(job, [row], { now: '2026-09-25T10:01:00.000Z' })
  assert.equal(seeded.status, 'parsing')
  assert.equal(seeded.counters.files, 1)
  assert.equal(seeded.counters.unpacked, 1)
  assert.equal(nextQueuedFile(seeded)?.name, 'AMC-106A OE-221.pdf')
})

test('job: next queued file is the first pending one, and drains to null', () => {
  const job = applyUnpackResult(
    baseJob(),
    [
      { index: 0, name: 'a.pdf', bytes: 1, status: 'done' },
      { index: 1, name: 'b.pdf', bytes: 1, status: 'queued' },
      { index: 2, name: 'c.pdf', bytes: 1, status: 'queued' },
    ],
    { now: 'now' }
  )
  assert.equal(nextQueuedFile(job)?.index, 1)
  const done = applyFileResult(job, 1, { status: 'done', drafted: 12 }, 'now')
  assert.equal(nextQueuedFile(done)?.index, 2)
  const finished = applyFileResult(done, 2, { status: 'done', drafted: 3 }, 'now')
  assert.equal(nextQueuedFile(finished), null)
  assert.equal(finished.status, 'complete')
  assert.equal(finished.counters.drafted, 15)
  assert.equal(finished.counters.parsed, 3)
  assert.ok(finished.completedAt)
})

test('job: a failed document is counted, keeps its error and does not block the queue', () => {
  const job = applyUnpackResult(
    baseJob(),
    [
      { index: 0, name: 'a.pdf', bytes: 1, status: 'queued' },
      { index: 1, name: 'b.pdf', bytes: 1, status: 'queued' },
    ],
    { now: 'now' }
  )
  const after = applyFileResult(job, 0, { status: 'failed', error: 'model could not read it', pages: 4 }, 'now')
  assert.equal(after.counters.failed, 1)
  assert.equal(after.files[0].error, 'model could not read it')
  assert.equal(after.files[0].pages, 4)
  assert.equal(after.status, 'parsing', 'one failure must not end the job')
  assert.equal(nextQueuedFile(after)?.index, 1)
})

test('job: progress labels describe each state in plain language', () => {
  const job = baseJob()
  assert.match(describeJobProgress(job), /Waiting for the archive/)
  const unpacking = { ...job, status: 'unpacking' as const, counters: { ...emptyCounters(), files: 12 } }
  assert.match(describeJobProgress(unpacking), /12 document/)
  const parsing = applyUnpackResult(job, [{ index: 0, name: 'a.pdf', bytes: 1, status: 'queued' }], { now: 'now' })
  assert.match(describeJobProgress(parsing), /Transcribing document 1 of 1/)
  const done = applyFileResult(parsing, 0, { status: 'done', drafted: 7 }, 'now')
  assert.match(describeJobProgress(done), /7 question\(s\) drafted/)
})

test('job: chunks respect the Firestore batch ceiling (3 docs per question)', () => {
  const groups = chunk(Array.from({ length: 250 }, (_, i) => i), 120)
  assert.deepEqual(groups.map((g) => g.length), [120, 120, 10])
  assert.ok(groups.every((g) => g.length * 3 <= 400))
})

test('job: inline (vision) guard blocks oversized scans before the API call', () => {
  assert.equal(isBufferTooLargeForInline(2 * 1024 * 1024), false)
  assert.equal(isBufferTooLargeForInline(40 * 1024 * 1024), true)
})
