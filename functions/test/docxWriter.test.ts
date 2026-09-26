// functions/test/docxWriter.test.ts
//
// Tests for the dependency-free .docx writer that archives imported papers as
// compact Word transcripts (replacing the multi-MB source PDFs in Storage):
//   * functions/src/utils/docxWriter.ts (zip container + OOXML + transcript)
//
// Compatibility is proven two ways:
//   1. round-trip through our OWN zip reader (zipArchive.ts), and
//   2. `mammoth.extractRawText` — the same library the pipeline already uses to
//      READ .docx uploads — recognises the package as a Word document.

import test from 'node:test'
import assert from 'node:assert/strict'
import { extractRawText } from 'mammoth'
import {
  buildDocxBuffer,
  buildPaperTranscriptDocx,
  buildZipBuffer,
} from '../src/utils/docxWriter'
import { readZipDirectory, readZipEntry } from '../src/utils/zipArchive'

test('buildZipBuffer produces a directory our own reader parses', () => {
  const zip = buildZipBuffer([
    { name: 'a.txt', data: Buffer.from('hello zip', 'utf8') },
    { name: 'dir/b.txt', data: Buffer.from('second entry', 'utf8') },
  ])
  const { entries, zip64 } = readZipDirectory(zip)
  assert.equal(zip64, false)
  assert.deepEqual(entries.map((e) => e.name), ['a.txt', 'dir/b.txt'])
  assert.equal(entries[0].size, 'hello zip'.length)
  assert.equal(readZipEntry(zip, entries[0]).toString('utf8'), 'hello zip')
  assert.equal(readZipEntry(zip, entries[1]).toString('utf8'), 'second entry')
})

test('buildZipBuffer output is deterministic (fixed timestamps)', () => {
  const make = () => buildZipBuffer([{ name: 'a.txt', data: Buffer.from('same', 'utf8') }])
  assert.equal(make().equals(make()), true)
})

test('buildDocxBuffer emits the three parts a .docx needs', () => {
  const docx = buildDocxBuffer([{ text: 'Hello', heading: true }, { text: 'World' }])
  const { entries } = readZipDirectory(docx)
  assert.deepEqual(entries.map((e) => e.name).sort(), [
    '[Content_Types].xml',
    '_rels/.rels',
    'word/document.xml',
  ])
  const documentXml = readZipEntry(docx, entries.find((e) => e.name === 'word/document.xml')!).toString('utf8')
  assert.match(documentXml, /<w:document xmlns:w="http:\/\/schemas\.openxmlformats\.org\/wordprocessingml\/2006\/main">/)
  assert.match(documentXml, /Hello/)
  assert.match(documentXml, /World/)
})

test('XML special characters are escaped', () => {
  const docx = buildDocxBuffer([{ text: '5 < 6 & "quotes" <tag>' }])
  const { entries } = readZipDirectory(docx)
  const documentXml = readZipEntry(docx, entries.find((e) => e.name === 'word/document.xml')!).toString('utf8')
  assert.match(documentXml, /5 &lt; 6 &amp; &quot;quotes&quot; &lt;tag&gt;/)
  assert.doesNotMatch(documentXml, /<tag>/)
})

test('buildPaperTranscriptDocx writes header, extracted text and parsed questions', () => {
  const docx = buildPaperTranscriptDocx({
    title: 'AMC-106A OE-221',
    metaLines: ['University: BCU', 'Source file: AMC-106A OE-221.pdf'],
    rawText: 'Section A\nWhat is an operating system?',
    questions: [
      {
        text: 'What is an operating system?',
        type: 'mcq',
        marks: 2,
        options: ['A manager', 'Hardware', 'A game'],
        correctAnswer: 'A',
      },
    ],
  })
  const { entries } = readZipDirectory(docx)
  const documentXml = readZipEntry(docx, entries.find((e) => e.name === 'word/document.xml')!).toString('utf8')
  assert.match(documentXml, /AMC-106A OE-221/)
  assert.match(documentXml, /University: BCU/)
  assert.match(documentXml, /Extracted text/)
  assert.match(documentXml, /Section A/)
  assert.match(documentXml, /Parsed questions \(1\)/)
  assert.match(documentXml, /Q1 \[2 marks\] \(mcq\)/)
  assert.match(documentXml, /A\. A manager/)
  assert.match(documentXml, /Answer: A/)
})

test('rawText is truncated to maxTextChars so transcripts stay small', () => {
  const docx = buildPaperTranscriptDocx({
    title: 'Tiny',
    rawText: 'x'.repeat(500),
    maxTextChars: 100,
    questions: [],
  })
  const { entries } = readZipDirectory(docx)
  const documentXml = readZipEntry(docx, entries.find((e) => e.name === 'word/document.xml')!).toString('utf8')
  assert.equal(documentXml.includes('x'.repeat(100)), true)
  assert.equal(documentXml.includes('x'.repeat(101)), false)
})

test('mammoth — the pipeline\'s own .docx reader — accepts the transcript', async () => {
  const docx = buildPaperTranscriptDocx({
    title: 'BZDSC-1 [OE-231]',
    metaLines: ['Exam: Nov 2023'],
    rawText: 'Q. Define process scheduling.',
    questions: [
      { text: 'Define process scheduling.', type: 'short', marks: 5, options: [], correctAnswer: '' },
    ],
  })
  const { value: text } = await extractRawText({ buffer: docx })
  assert.match(text, /BZDSC-1 \[OE-231\]/)
  assert.match(text, /Exam: Nov 2023/)
  assert.match(text, /Define process scheduling\./)
  assert.match(text, /Parsed questions \(1\)/)
})
