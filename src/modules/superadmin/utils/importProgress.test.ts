// src/modules/superadmin/utils/importProgress.test.ts
// Pure helpers behind the question-paper import panel.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  EMPTY_IMPORT_FORM,
  IMPORT_MAX_ARCHIVE_BYTES,
  IMPORT_MAX_FILE_BYTES,
  documentTotal,
  formatBytes,
  formToJobDefaults,
  isArchiveFileName,
  isDocumentFileName,
  jobPercent,
  jobSeverity,
  jobStateLabel,
  problemFiles,
  summariseJob,
  uploadedPercent,
  validateImportFiles,
  validateImportForm,
  type ImportJobView,
} from './importProgress'

function job(overrides: Partial<ImportJobView> = {}): ImportJobView {
  return {
    id: 'job-1',
    status: 'parsing',
    archive: { fileName: 'papers.zip', bytes: 4_000_000 },
    counters: { files: 4, unpacked: 4, parsed: 1, failed: 0, skippedFiles: 0, drafted: 12, duplicates: 1 },
    files: [
      { index: 0, name: 'a.pdf', bytes: 1000, status: 'done', drafted: 12 },
      { index: 1, name: 'b.pdf', bytes: 1000, status: 'queued' },
      { index: 2, name: 'c.pdf', bytes: 1000, status: 'queued' },
      { index: 3, name: 'd.pdf', bytes: 1000, status: 'queued' },
    ],
    truncated: false,
    error: '',
    progressLabel: 'Transcribing document 2 of 4 — 12 question(s) drafted so far.',
    createdAt: '2026-09-25T10:00:00.000Z',
    updatedAt: '2026-09-25T10:01:00.000Z',
    completedAt: '',
    ...overrides,
  }
}

describe('formatting', () => {
  it('formats byte sizes for the chip', () => {
    assert.equal(formatBytes(0), '0 B')
    assert.equal(formatBytes(812), '812 B')
    assert.equal(formatBytes(2048), '2.0 KB')
    assert.equal(formatBytes(20 * 1024), '20 KB')
    assert.equal(formatBytes(12.4 * 1024 * 1024), '12.4 MB')
    assert.equal(formatBytes(2 * 1024 * 1024 * 1024), '2.00 GB')
    assert.equal(formatBytes(Number.NaN), '0 B')
  })

  it('uploadedPercent is bounded', () => {
    assert.equal(uploadedPercent(0, 100), 0)
    assert.equal(uploadedPercent(50, 100), 50)
    assert.equal(uploadedPercent(120, 100), 100)
    assert.equal(uploadedPercent(10, 0), 0)
  })
})

describe('progress', () => {
  it('an upload in flight is 0 %, unpacking is early, parsing tracks documents', () => {
    assert.equal(jobPercent(null), 0)
    assert.equal(jobPercent(job({ status: 'awaiting-upload' })), 0)
    assert.equal(jobPercent(job({ status: 'unpacking' })), 10)
    const parsing = jobPercent(job())
    assert.ok(parsing > 10 && parsing < 100, `expected mid-range, got ${parsing}`)
    assert.equal(jobPercent(job({ status: 'complete' })), 100)
  })

  it('failed documents count as finished, so the bar never sticks below 100 %', () => {
    const failed = job({
      status: 'parsing',
      // counters.files is deliberately stale here: the row list wins.
      counters: { ...job().counters, files: 4, failed: 2 },
      files: [
        { index: 0, name: 'a.pdf', bytes: 1, status: 'failed', error: 'unreadable' },
        { index: 1, name: 'b.pdf', bytes: 1, status: 'failed', error: 'unreadable' },
      ],
    })
    assert.equal(jobPercent(failed), 100)
  })

  it('documentTotal prefers the rows the server sent', () => {
    assert.equal(documentTotal(job()), 4)
    assert.equal(documentTotal(job({ files: [], counters: { ...job().counters, files: 7 } })), 7)
    assert.equal(documentTotal(null), 0)
  })

  it('summariseJob reports the four numbers the operator looks at', () => {
    const lines = summariseJob(job())
    assert.deepEqual(
      lines.map((l) => l.label),
      ['Documents', 'Questions drafted', 'Skipped duplicates', 'Failed']
    )
    assert.equal(lines[0].value, '1/4')
    assert.equal(lines[1].value, '12')
    assert.equal(lines[3].value, '0')
    assert.deepEqual(summariseJob(null), [])
  })

  it('state labels and severities cover every status', () => {
    const statuses: ImportJobView['status'][] = ['awaiting-upload', 'unpacking', 'parsing', 'complete', 'failed']
    for (const status of statuses) {
      assert.ok(jobStateLabel(status).length > 2)
      assert.ok(['info', 'warning', 'success', 'error'].includes(jobSeverity(status)))
    }
    assert.equal(jobSeverity('complete'), 'success')
    assert.equal(jobSeverity('failed'), 'error')
  })

  it('problemFiles lists only the rows needing attention', () => {
    const rows = problemFiles(
      job({
        files: [
          { index: 0, name: 'a.pdf', bytes: 1, status: 'done', drafted: 3 },
          { index: 1, name: 'b.pdf', bytes: 1, status: 'failed', error: 'model could not read it' },
          { index: 2, name: 'c.pdf', bytes: 1, status: 'skipped', error: 'no questions found' },
          { index: 3, name: 'd.pdf', bytes: 1, status: 'queued' },
        ],
      })
    )
    assert.deepEqual(
      rows.map((r) => r.name),
      ['b.pdf', 'c.pdf']
    )
    assert.deepEqual(problemFiles(null), [])
  })
})

describe('form validation', () => {
  it('requires a programme, a subject and a branch label', () => {
    const errors = validateImportForm(EMPTY_IMPORT_FORM)
    assert.equal(errors.length, 1)
    assert.match(errors[0], /subject/i)

    const noBranch = validateImportForm({ ...EMPTY_IMPORT_FORM, subjectId: 'Accounting', branch: '' })
    assert.equal(noBranch.length, 1)
    assert.match(noBranch[0], /branch/i)

    const ok = validateImportForm({ ...EMPTY_IMPORT_FORM, subjectId: 'Accounting', semester: '5', examYear: '2024' })
    assert.deepEqual(ok, [])
  })

  it('rejects a nonsense semester or year instead of writing it', () => {
    const bad = validateImportForm({ ...EMPTY_IMPORT_FORM, subjectId: 'Accounting', semester: '99', examYear: '24' })
    assert.equal(bad.length, 2)
    assert.ok(bad.some((e) => /Semester/.test(e)))
    assert.ok(bad.some((e) => /year/.test(e)))
  })

  it('converts the form into the number-typed payload the API expects', () => {
    const payload = formToJobDefaults({ ...EMPTY_IMPORT_FORM, program: 'BCOM', subjectId: ' Accounting ', semester: '5', examYear: '2024' })
    assert.equal(payload.program, 'bcom')
    assert.equal(payload.subjectId, 'Accounting')
    assert.equal(payload.semester, 5)
    assert.equal(payload.examYear, 2024)
    assert.equal(payload.difficulty, 'medium')

    const blank = formToJobDefaults(EMPTY_IMPORT_FORM)
    assert.equal(blank.semester, 0)
    assert.equal(blank.examYear, null)
  })
})

describe('file validation', () => {
  it('accepts a .zip or single documents, and names the one that is wrong', () => {
    assert.deepEqual(validateImportFiles([{ name: 'papers.zip', size: 100 }]), [])
    assert.deepEqual(validateImportFiles([{ name: 'AMC-106A OE-221.pdf', size: 29_000 }]), [])
    assert.deepEqual(validateImportFiles([{ name: 'a.pdf', size: 1 }, { name: 'b.docx', size: 2 }]), [])

    const mixed = validateImportFiles([{ name: 'good.pdf', size: 1 }, { name: 'notes.txt', size: 1 }])
    assert.equal(mixed.length, 1)
    assert.match(mixed[0], /notes\.txt/)
  })

  it('enforces each kind’s size bound and refuses an empty selection', () => {
    const tooBig = validateImportFiles([{ name: 'paper.pdf', size: IMPORT_MAX_FILE_BYTES + 1 }])
    assert.equal(tooBig.length, 1)
    assert.match(tooBig[0], /per-document limit/)

    const bigZip = validateImportFiles([{ name: 'papers.zip', size: IMPORT_MAX_ARCHIVE_BYTES + 1 }])
    assert.equal(bigZip.length, 1)
    assert.match(bigZip[0], /archive/)

    const empty = validateImportFiles([])
    assert.equal(empty.length, 1)
    assert.match(empty[0], /Choose question paper files/)
  })

  it('classifies names the same way the server does', () => {
    assert.equal(isArchiveFileName('PAPERS.ZIP'), true)
    assert.equal(isDocumentFileName('scan.JPEG'), true)
    assert.equal(isDocumentFileName('paper.docx'), true)
    assert.equal(isDocumentFileName('notes.txt'), false)
    assert.equal(isArchiveFileName('paper.pdf'), false)
  })
})
