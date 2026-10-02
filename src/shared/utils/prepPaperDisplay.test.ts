import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isOriginalPdfPaper, originalPaperUrl, paperLanguageLabel, paperMetadataLine } from './prepPaperDisplay.ts'

describe('original-PDF PYQ display', () => {
  const file = { contentType: 'source_pdf', universityName: '', examLabel: '', semester: 1, maxMarks: 0, questionCount: 0,
    sourceFile: { url: 'https://drive.google.com/file/d/example/view' } }
  it('labels original PDFs, not generated questions, and omits unknown values', () => {
    assert.equal(isOriginalPdfPaper(file), true)
    const line = paperMetadataLine(file)
    assert.equal(line, 'Semester 1 · PYQ · Original PDF')
    assert.ok(!line.includes('0 marks') && !line.includes('0 questions'))
    assert.ok(!line.startsWith(' · '))
  })
  it('keeps structured-paper metadata and omits blank values', () => {
    assert.equal(paperMetadataLine({ universityName: 'BCU', semester: 3, examLabel: '2024', maxMarks: 60, questionCount: 17 }),
      'BCU · 2024 · Semester 3 · 60 marks · 17 questions')
    assert.equal(paperMetadataLine({ contentType: 'source_pdf' }), 'PYQ · Original PDF')
  })
  it('renders only safe original-paper URLs', () => {
    assert.equal(originalPaperUrl(file), file.sourceFile.url)
    assert.equal(originalPaperUrl({ ...file, sourceFile: { url: 'javascript:alert(1)' } }), null)
    assert.equal(originalPaperUrl({ ...file, sourceFile: { url: 'https://user:password@example.com/x' } }), null)
    assert.equal(originalPaperUrl({ ...file, contentType: 'structured' }), null)
  })
  it('uses English/Kannada labels and does not invent an unknown language', () => {
    assert.equal(paperLanguageLabel('en'), 'English')
    assert.equal(paperLanguageLabel('kn'), 'Kannada')
    assert.equal(paperLanguageLabel('und'), '')
  })
})
