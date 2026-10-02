import assert from 'node:assert/strict'
import fs from 'node:fs'
import { describe, it } from 'node:test'
import {
  expandPrepPaperFileSeed, isSafePaperUrl, planNewPaperFileSeeds, paperFileSeedResultMessage,
  prepareDrivePyqFiles, pyqLanguageSelection, sourcePdfPaperId,
  type PrepPaperFileSeed,
} from '../src/prepPaperFiles.ts'
import { expandPrepPaperSeed, normalisePrepPaperInput, prepPaperFacets, validatePrepPapers } from '../src/prepPapers.ts'
import { PREP_PAPER_SEEDS } from '../src/data/prepPapers/index.ts'
import { DRIVE_PYQ_PREPARATION, SEEDED_DRIVE_PYQ_FILES } from '../src/data/prepPapers/drivePyqFiles.ts'
import { PREP_SEED_CODES } from '../src/prepShared.ts'
import { collectPaperQuestions } from '../src/prepModelAnswers.ts'

function fileSeed(overrides: Partial<PrepPaperFileSeed> = {}): PrepPaperFileSeed {
  return {
    contentType: 'source_pdf', program: 'languages', semester: 1, language: 'kn',
    sourceFile: { fileName: 'BKN-04 OE-215.pdf', url: 'https://drive.google.com/file/d/sample-id/view', driveFileId: 'sample-id', folderPath: 'LANGUAGES/1ST SEM' },
    source: { title: 'Original Kannada PYQ', url: 'https://drive.google.com/file/d/sample-id/view', publisher: 'User-provided PYQ collection', retrievedOn: '2026-10-02' },
    ...overrides,
  }
}

describe('original-PDF PYQ file mode', () => {
  it('accepts an original PDF with no university or inferred exam details', () => {
    const paper = expandPrepPaperFileSeed(fileSeed())
    const report = validatePrepPapers([paper])
    assert.equal(report.valid, true, JSON.stringify(report.issues))
    assert.equal(paper.universityName, '')
    assert.equal(paper.universityCode, '')
    assert.equal(paper.examYear, 0)
    assert.equal(paper.examLabel, '')
    assert.equal(paper.durationMinutes, 0)
    assert.equal(paper.maxMarks, 0)
    assert.equal(paper.language, 'kn')
    assert.equal(paper.isPYQ, true)
    assert.equal(paper.contentType, 'source_pdf')
    assert.deepEqual(paper.sections, [])
    assert.equal(paper.questionCount, 0)
    assert.deepEqual(collectPaperQuestions(paper), [])
  })

  it('does not invent unknown script, date, scheme, subject title or answers', () => {
    const paper = expandPrepPaperFileSeed(fileSeed({ program: 'bba', language: undefined }))
    assert.equal(paper.language, 'und')
    assert.equal(paper.scheme, '')
    assert.equal(paper.subjectName, 'BKN-04 OE-215')
    assert.deepEqual(paper.instructions, [])
    assert.ok(!paper.tags.includes('0'))
  })

  it('round-trips a stored PDF and preserves an edited title and draft status', () => {
    const stored = expandPrepPaperFileSeed(fileSeed({ subject: 'Kannada — original PYQ', status: 'draft' }))
    const result = normalisePrepPaperInput(stored)
    assert.equal(result.report.valid, true)
    assert.equal(result.paper?.subjectName, stored.subjectName)
    assert.equal(result.paper?.status, 'draft')
    assert.deepEqual(result.paper?.sourceFile, stored.sourceFile)
    assert.equal(result.paper?.language, 'kn')
  })

  it('uses stable, case-sensitive file IDs and ignores display-name changes', () => {
    const ref = fileSeed().sourceFile
    assert.equal(sourcePdfPaperId(ref), sourcePdfPaperId({ ...ref, fileName: 'Renamed paper.pdf' }))
    assert.notEqual(sourcePdfPaperId(ref), sourcePdfPaperId({ ...ref, driveFileId: 'SAMPLE-ID' }))
    assert.match(sourcePdfPaperId(ref), /^pyq-file-[a-f0-9]{24}$/)
  })

  it('rejects unsafe source links, invalid PDF names and mismatched Drive IDs', () => {
    for (const overrides of [
      { sourceFile: { ...fileSeed().sourceFile, url: 'javascript:alert(1)' } },
      { sourceFile: { ...fileSeed().sourceFile, fileName: 'archive.zip' } },
      { sourceFile: { ...fileSeed().sourceFile, driveFileId: 'another-id' } },
      { source: { ...fileSeed().source, url: 'https://user:password@example.com/paper.pdf' } },
    ]) assert.equal(normalisePrepPaperInput(fileSeed(overrides)).paper, null)
    assert.equal(isSafePaperUrl('https://example.com/paper.pdf'), true)
    assert.equal(isSafePaperUrl('ftp://example.com/paper.pdf'), false)
  })

  it('rejects malformed numeric metadata rather than turning it into unknown', () => {
    for (const field of ['examYear', 'semester', 'durationMinutes', 'maxMarks']) {
      const result = normalisePrepPaperInput({ ...fileSeed(), [field]: 'not-a-number' })
      assert.equal(result.paper, null, field)
    }
    assert.equal(normalisePrepPaperInput(fileSeed({ examYear: 2099 })).paper, null)
  })

  it('does not permit file-only records to pretend to contain structured questions', () => {
    const paper = expandPrepPaperFileSeed(fileSeed())
    paper.questionCount = 1
    assert.equal(validatePrepPapers([paper]).valid, false)
    paper.questionCount = 0
    paper.universityName = 'Invented university'
    assert.equal(validatePrepPapers([paper]).valid, false)
  })

  it('does not expose blank universities or unknown years as facets', () => {
    const paper = expandPrepPaperFileSeed(fileSeed())
    const facets = prepPaperFacets([paper])
    assert.deepEqual(facets.universities, [])
    assert.deepEqual(facets.years, [])
    assert.deepEqual(facets.semesters, [1])
  })

  it('supports university-free reviewed text papers without weakening marks checks', () => {
    const paper = expandPrepPaperSeed({ ...PREP_PAPER_SEEDS[0], university: undefined, language: 'kn' })
    assert.equal(paper.universityName, '')
    assert.equal(validatePrepPapers([paper]).valid, true)
    paper.maxMarks += 1
    assert.equal(validatePrepPapers([paper]).valid, false)
  })
})

describe('English/Kannada language-subject selection', () => {
  it('keeps only BEN/BKN in LANGUAGES and excludes unknown language subjects', () => {
    for (const prefix of ['BEN', 'BKN']) assert.equal(pyqLanguageSelection('LANGUAGES/1ST SEM', `${prefix}-04.pdf`).include, true)
    for (const prefix of ['BHN', 'BSN', 'BTU', 'BUR', 'UNKNOWN']) assert.equal(pyqLanguageSelection('LANGUAGES/1ST SEM', `${prefix}-04.pdf`).include, false)
    assert.equal(pyqLanguageSelection('languages/english', 'paper.pdf').language, 'en')
    assert.equal(pyqLanguageSelection('languages/kannada', 'paper.pdf').language, 'kn')
  })

  it('excludes other named language subjects but not business or science PDFs', () => {
    assert.equal(pyqLanguageSelection('MA/HINDI/1ST', 'MHN-1.pdf').include, false)
    assert.equal(pyqLanguageSelection('MA/URDU/1ST', 'paper.pdf').include, false)
    assert.equal(pyqLanguageSelection('OPEN ELECTIVES/1ST SEM', 'ELMHN-01.pdf').include, false)
    assert.deepEqual(pyqLanguageSelection('BBA/1ST SEM', 'BBHC-103.pdf'), { include: true, language: 'und' })
    assert.equal(pyqLanguageSelection('MA/KANNADA/1ST', 'paper.pdf').include, true)
  })

  it('applies the restriction to manual source-file saves as well as the bundle', () => {
    const sourceFile = { ...fileSeed().sourceFile, fileName: 'BHN-04.pdf' }
    assert.equal(normalisePrepPaperInput(fileSeed({ sourceFile })).paper, null)
    assert.equal(normalisePrepPaperInput(fileSeed({ language: 'en' })).paper, null)
  })

  it('prepares without mutating source data and deduplicates only identical Drive IDs', () => {
    const group = { folderPath: 'LANGUAGES/1ST SEM', program: 'languages', semester: 1,
      files: [['BEN-04.pdf', 'file-a'], ['BKN-04.pdf', 'file-b'], ['BHN-04.pdf', 'file-c'], ['BEN-duplicate.pdf', 'file-a'], ['archive.zip', 'file-d']] as Array<[string, string]> }
    const before = JSON.stringify(group)
    const result = prepareDrivePyqFiles([group], '2026-10-02')
    assert.equal(JSON.stringify(group), before)
    assert.equal(result.papers.length, 2)
    assert.equal(result.excluded.length, 2)
    assert.deepEqual(result.duplicateFileIds, ['file-a'])
  })
})

describe('prepared public-Drive seed bundle', () => {
  it('contains 153 original PDFs with 22 excluded language papers', () => {
    assert.equal(SEEDED_DRIVE_PYQ_FILES.length, 153)
    assert.equal(DRIVE_PYQ_PREPARATION.excluded.length, 22)
    assert.equal(validatePrepPapers(SEEDED_DRIVE_PYQ_FILES).valid, true)
    assert.equal(new Set(SEEDED_DRIVE_PYQ_FILES.map((p) => p.id)).size, 153)
    assert.ok(PREP_SEED_CODES.includes('pyq-files'))
  })

  it('has 4 English and 6 Kannada papers in Languages; no university attribution anywhere', () => {
    const languages = SEEDED_DRIVE_PYQ_FILES.filter((p) => p.program === 'languages')
    assert.equal(languages.length, 10)
    assert.equal(languages.filter((p) => p.language === 'en').length, 4)
    assert.equal(languages.filter((p) => p.language === 'kn').length, 6)
    for (const paper of SEEDED_DRIVE_PYQ_FILES) {
      assert.equal(paper.universityCode, '')
      assert.equal(paper.universityName, '')
      assert.equal(paper.isPYQ, true)
      assert.equal(paper.sections.length, 0)
    }
  })

  it('exports API-compatible compact records without university or invented metadata', () => {
    const exported = JSON.parse(fs.readFileSync(new URL('../../data/pyq/drive-pyq.seed.json', import.meta.url), 'utf8'))
    assert.equal(exported.papers.length, SEEDED_DRIVE_PYQ_FILES.length)
    for (const record of exported.papers) {
      for (const key of ['university', 'universityCode', 'universityName', 'examYear', 'maxMarks', 'durationMinutes']) assert.equal(key in record, false)
      const result = normalisePrepPaperInput(record)
      assert.equal(result.report.valid, true, record.id)
      const expected = SEEDED_DRIVE_PYQ_FILES.find((p) => p.id === record.id)
      assert.deepEqual(result.paper, expected)
    }
  })

  it('records all 46 eligible MA directory checks without inventing file records', () => {
    const sources = JSON.parse(fs.readFileSync(new URL('../src/data/prepPapers/drivePyqSources.json', import.meta.url), 'utf8'))
    assert.equal(sources.directoryChecks.length, 46)
    assert.equal(new Set(sources.directoryChecks.map((c: { folderId: string }) => c.folderId)).size, 46)
    assert.ok(sources.directoryChecks.every((c: { result: string }) => c.result === 'no_public_pdf_listing'))
    assert.deepEqual(sources.excludedFolders.map((c: { folderPath: string }) => c.folderPath), ['MA/HINDI', 'MA/TELUGU', 'MA/URDU'])
    assert.ok(!SEEDED_DRIVE_PYQ_FILES.some((paper) => paper.sourceFile?.folderPath?.startsWith('MA/')))
  })

  it('reports first-time source seeding clearly', () => {
    assert.equal(paperFileSeedResultMessage(153, 0), 'Added 153 original-PDF PYQ links; preserved 0 existing records.')
  })

  it('reports repeat seeding as preserved records rather than missing questions', () => {
    assert.equal(paperFileSeedResultMessage(0, 153), 'Added 0 original-PDF PYQ links; preserved 153 existing records.')
    assert.equal(paperFileSeedResultMessage(1, 1), 'Added 1 original-PDF PYQ link; preserved 1 existing record.')
  })

  it('preserves reviewed, edited or hidden existing records on re-seeding', () => {
    const all = SEEDED_DRIVE_PYQ_FILES
    const first = planNewPaperFileSeeds(all, [])
    assert.equal(first.papers.length, 153)
    const resumed = planNewPaperFileSeeds(all, all.slice(0, 50).map((paper) => paper.id))
    assert.equal(resumed.papers.length, 103)
    assert.equal(resumed.skipped, 50)
    const repeated = planNewPaperFileSeeds(all, all.map((paper) => paper.id))
    assert.deepEqual(repeated.papers, [])
    assert.equal(repeated.skipped, 153)
  })
})
