// functions/src/utils/docxWriter.ts
//
// Minimal, dependency-free .docx (OOXML word-processing) WRITER for the
// question-paper import pipeline.
//
// Why this exists: imported papers arrive as multi-MB scanned PDFs (or ZIPs of
// them). After transcription the questions live in Firestore — the only thing
// the PDF still carries is the paper's own text. Keeping the original in
// Storage costs megabytes per paper; a Word transcript built from the extracted
// text costs a few kilobytes. So the pipeline stores the transcript and drops
// the source bytes. `mammoth` (already a dependency) reads the result in tests,
// which proves the package shape is one real Word processors accept.
//
// Same philosophy as zipArchive.ts: every new dependency in `functions/` costs
// cold start for ALL functions, so the ZIP container is hand-rolled with
// `node:zlib` (deflateRaw) and a fixed timestamp for deterministic output.

import { deflateRawSync } from 'node:zlib'

export interface DocxParagraph {
  text: string
  /** Bold + larger — titles and section headings. */
  heading?: boolean
  /** Bold run at normal size. */
  bold?: boolean
}

// ─── ZIP container (write-only counterpart of zipArchive.ts) ─────────────────

const SIG_LOCAL = 0x04034b50
const SIG_CENTRAL = 0x02014b50
const SIG_EOCD = 0x06054b50
/** Fixed DOS date (2024-01-01 00:00) so the same input always yields the same bytes. */
const DOS_TIME = 0
const DOS_DATE = 0x5821

let crcTable: number[] | null = null
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = Array.from({ length: 256 }, (_, n) => {
      let c = n
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      return c >>> 0
    })
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i += 1) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

interface ZipInput {
  name: string
  data: Buffer
}

/** Store-style zip with deflate entries — the container every .docx is built from. */
export function buildZipBuffer(entries: ZipInput[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const compressed = deflateRawSync(entry.data)
    const crc = crc32(entry.data)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(SIG_LOCAL, 0)
    local.writeUInt16LE(20, 4) // version needed
    local.writeUInt16LE(0x0800, 6) // UTF-8 names
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(entry.data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28) // extra length
    locals.push(local, name, compressed)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(SIG_CENTRAL, 0)
    central.writeUInt16LE(20, 4) // version made by
    central.writeUInt16LE(20, 6) // version needed
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(entry.data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt16LE(0, 30) // extra
    central.writeUInt16LE(0, 32) // comment
    central.writeUInt16LE(0, 34) // disk
    central.writeUInt16LE(0, 36) // internal attrs
    central.writeUInt32LE(0, 38) // external attrs
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + compressed.length
  }

  const centralBuf = Buffer.concat(centrals)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(SIG_EOCD, 0)
  eocd.writeUInt16LE(0, 4) // disk
  eocd.writeUInt16LE(0, 6) // central dir disk
  eocd.writeUInt16LE(entries.length, 8)
  eocd.writeUInt16LE(entries.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20) // comment length

  return Buffer.concat([...locals, centralBuf, eocd])
}

// ─── OOXML package ──────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // XML 1.0 forbids most control chars; keep \t \n \r.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
}

function paragraphXml(paragraph: DocxParagraph): string {
  const rPr = paragraph.heading
    ? '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr>'
    : paragraph.bold
      ? '<w:rPr><w:b/></w:rPr>'
      : ''
  const pPr = paragraph.heading ? `<w:pPr>${rPr}</w:pPr>` : ''
  return `<w:p>${pPr}<w:r>${paragraph.heading || paragraph.bold ? rPr : ''}<w:t xml:space="preserve">${escapeXml(paragraph.text)}</w:t></w:r></w:p>`
}

/** Builds a whole .docx package from paragraphs — the smallest Word will open. */
export function buildDocxBuffer(paragraphs: DocxParagraph[]): Buffer {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs
    .map(paragraphXml)
    .join('')}<w:sectPr/></w:body></w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes, 'utf8') },
    { name: '_rels/.rels', data: Buffer.from(rels, 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(documentXml, 'utf8') },
  ])
}

// ─── Paper transcript ───────────────────────────────────────────────────────

export interface TranscriptQuestion {
  text: string
  type?: string
  marks?: number
  options?: string[]
  correctAnswer?: string
}

/**
 * A compact Word transcript of one question paper: header, the extracted text,
 * then the parsed questions. This is the archival copy that replaces the source
 * PDF in Storage.
 */
export function buildPaperTranscriptDocx(input: {
  title: string
  metaLines?: string[]
  rawText?: string
  questions?: TranscriptQuestion[]
  /** Safety valve so an enormous OCR dump cannot bloat the transcript. */
  maxTextChars?: number
}): Buffer {
  const maxTextChars = input.maxTextChars ?? 200_000
  const paragraphs: DocxParagraph[] = [{ text: input.title || 'Question paper transcript', heading: true }]

  for (const line of input.metaLines ?? []) {
    if (line.trim()) paragraphs.push({ text: line })
  }

  const rawText = (input.rawText ?? '').slice(0, maxTextChars)
  if (rawText.trim()) {
    paragraphs.push({ text: 'Extracted text', heading: true })
    for (const line of rawText.split(/\r?\n/)) {
      paragraphs.push({ text: line })
    }
  }

  const questions = input.questions ?? []
  if (questions.length > 0) {
    paragraphs.push({ text: `Parsed questions (${questions.length})`, heading: true })
    questions.forEach((question, i) => {
      const marks = Number(question.marks) > 0 ? ` [${question.marks} marks]` : ''
      const kind = question.type ? ` (${question.type})` : ''
      paragraphs.push({ text: `Q${i + 1}${marks}${kind}`, bold: true })
      paragraphs.push({ text: question.text })
      for (const [j, option] of (question.options ?? []).entries()) {
        paragraphs.push({ text: `${String.fromCharCode(65 + j)}. ${option}` })
      }
      if (question.correctAnswer) {
        paragraphs.push({ text: `Answer: ${question.correctAnswer}` })
      }
    })
  }

  return buildDocxBuffer(paragraphs)
}
