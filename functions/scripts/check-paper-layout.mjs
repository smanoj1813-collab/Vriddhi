#!/usr/bin/env node
// functions/scripts/check-paper-layout.mjs
// Pre-flight check: will the Vriddhi parser read this question paper?
//
// Runs the SAME extractPaperText + deterministicParse code the deployed
// parsePaperFile callable uses, so a PASS here is a PASS in the app.
//
// Usage (from the functions/ directory):
//   npx tsx scripts/check-paper-layout.mjs path/to/paper.docx
//   npx tsx scripts/check-paper-layout.mjs path/to/paper.pdf
//
// Exit codes: 0 = parses deterministically · 1 = would need AI/manual · 2 = usage
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { extractPaperText, deterministicParse } from '../src/paperParsing'

const PDF_TYPE = 'application/pdf'
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MIN_TEXT_CHARS = 120

const file = process.argv[2]
if (!file) {
  console.error('usage: npx tsx scripts/check-paper-layout.mjs <paper.pdf|paper.docx>')
  process.exit(2)
}
const ext = extname(file).toLowerCase()
const contentType = ext === '.pdf' ? PDF_TYPE : ext === '.docx' ? DOCX_TYPE : null
if (!contentType) {
  console.error('Only digital .pdf and .docx are supported (legacy .doc -> re-save as .docx; scanned images = Slice 2).')
  process.exit(2)
}

let extracted
try {
  extracted = await extractPaperText(readFileSync(file), contentType)
} catch (err) {
  console.error('FAIL: file could not be opened for parsing:', err.message)
  process.exit(1)
}
const text = extracted.text.replace(/\u0000/g, '').trim()
if (text.length < MIN_TEXT_CHARS) {
  console.log('FAIL: no text layer found (looks like a scan or image PDF). Export a digital PDF, or type the paper into the Word template.')
  process.exit(1)
}

const parsed = deterministicParse(text)

// Count lines that LOOK like questions, so silent drops are visible.
const numberedLines = text
  .split(/\r?\n/)
  .filter((line) => /^\s*(?:Q(?:uestion)?\s*[.:]?\s*)?\d{1,3}\s*[.)]/i.test(line.trim())).length

console.log('file:', file)
console.log('kind:', extracted.kind, '| characters of text:', text.length)
console.log('coverage:', Math.round(parsed.coverage * 100) + '%',
  '| accepted deterministically:', parsed.accepted ? 'YES' : 'no')
console.log('numbered lines in file:', numberedLines, '| questions recognised:', parsed.questionCount,
  '| sections:', parsed.sections.length)

let marksTotal = 0
let noMarks = 0
for (const section of parsed.sections) {
  console.log('')
  console.log('[' + section.name + ']')
  for (const q of section.questions) {
    marksTotal += q.marks
    if (!q.marks) noMarks += 1
    console.log('  ' + q.type + ', ' + q.marks + ' mark' + (q.marks === 1 ? '' : 's')
      + (q.options ? ', ' + q.options.length + ' options' : '')
      + '  ::  ' + q.text.slice(0, 70) + (q.text.length > 70 ? '…' : ''))
  }
}
console.log('')
console.log('marks total:', marksTotal, '| questions with no marks:', noMarks)
if (parsed.meta.title) console.log('meta: title', JSON.stringify(parsed.meta.title), '| subject', JSON.stringify(parsed.meta.subject), '| duration', parsed.meta.durationMinutes + ' min', '| max marks', parsed.meta.totalMarks)
if (parsed.warnings.length) console.log('warnings:', parsed.warnings.join(' | '))

if (!parsed.accepted) {
  console.log('')
  console.log('=> NOT parser-friendly: it would fall back to AI (or manual entry). Follow content/paper-templates/README.md (the Word template) and re-run this check.')
  process.exit(1)
}
if (numberedLines > 0 && parsed.questionCount < numberedLines) {
  console.log('')
  console.log('=> CAUTION: ' + (numberedLines - parsed.questionCount) + ' numbered line(s) were not understood as questions. Fix them in the file before uploading.')
}
console.log('')
console.log('=> PASS: upload it, review the transcribed rows in the editor (marks especially), then confirm.')
process.exit(0)
