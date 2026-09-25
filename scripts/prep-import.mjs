#!/usr/bin/env node
// scripts/prep-import.mjs
//
// Triage tool for a ZIP (or folder) of previous-year question papers.
//
//   node scripts/prep-import.mjs --zip "C:\papers\bcu-pyq.zip"
//   node scripts/prep-import.mjs --zip corpus.zip --limit 25 --dump-text ./tmp/text
//   node scripts/prep-import.mjs --dir "C:\papers\bcu-pyq"
//
// It reads every PDF/DOCX, extracts the text layer when there is one, detects
// the script (English / Kannada / mixed) and Karnataka legacy-font (Nudi / KGP)
// mojibake, guesses university / program / semester / exam year+month from the
// filename, and writes a manifest JSON. It prints what the importer can do with
// each file:
//
//   digital-en    → deterministic parse, no AI, no cost
//   digital-kn    → AI text parse (Kannada)
//   digital-mixed → AI text parse
//   legacy-font   → AI VISION parse (render pages; the text layer is unusable)
//   scanned       → AI VISION parse (OCR)
//
// It never writes to Firestore or Storage, never calls an AI provider and never
// modifies the corpus. The manifest is the input to the next step (extraction),
// not a publish.
//
// PDF text extraction needs pdfjs-dist, which already ships with the functions
// workspace: run it from the repo root after `npm ci --prefix functions`, or
// from functions/ (`node ../scripts/prep-import.mjs ...`). Without pdfjs the
// tool still runs and reports sizes/metadata, marking every PDF as
// "text-unavailable" for a second pass.

import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  classifyDocument,
  detectLegacyFont,
  detectScript,
  guessPaperMetadata,
  isCandidateEntry,
  readZipEntries,
  readZipEntryData,
  summariseManifest,
} from './prep-import-lib.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '..')

// ─── args ───────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { limit: 0, out: '', dumpText: '', zip: '', dir: '', maxPages: 40, quiet: false }
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '--zip') args.zip = next()
    else if (a === '--dir') args.dir = next()
    else if (a === '--out') args.out = next()
    else if (a === '--dump-text') args.dumpText = next()
    else if (a === '--limit') args.limit = Number(next()) || 0
    else if (a === '--max-pages') args.maxPages = Number(next()) || 40
    else if (a === '--quiet') args.quiet = true
    else if (a === '--help' || a === '-h') args.help = true
  }
  return args
}

const USAGE = `
Prep paper corpus triage — reads a ZIP/folder and writes a manifest. No uploads, no AI calls.

  node scripts/prep-import.mjs --zip <corpus.zip> [options]
  node scripts/prep-import.mjs --dir <folder>     [options]

Options
  --out <file>         manifest path (default: prep-import-manifest.json next to the corpus)
  --limit <n>          stop after n documents (use 25 for a first look at a big corpus)
  --max-pages <n>      pages of text to read per PDF (default 40)
  --dump-text <dir>    also write each extracted text file there (QA of Kannada / review)
  --quiet              only print the summary

Buckets: digital-en (free parse) · digital-kn · digital-mixed · legacy-font · scanned · empty · unsupported
`

// ─── pdfjs (optional dependency already present in functions/) ──────────────

let pdfjs = null
let pdfjsPath = ''
async function loadPdfJs() {
  if (pdfjs !== null) return pdfjs
  const candidates = [
    path.join(repoRoot, 'functions', 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs'),
    path.join(repoRoot, 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.mjs'),
  ]
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue
    try {
      const mod = await import(pathToFileURL(c).href)
      pdfjs = mod.default || mod
      pdfjsPath = c
      return pdfjs
    } catch (err) {
      console.error(`  (pdfjs found at ${c} but failed to load: ${err.message})`)
    }
  }
  pdfjs = false
  return pdfjs
}

// mammoth is an optional nicety for .docx; PDFs are the expected format.
let mammoth = null
async function loadMammoth() {
  if (mammoth !== null) return mammoth
  const candidates = [
    path.join(repoRoot, 'functions', 'node_modules', 'mammoth', 'lib', 'index.js'),
    path.join(repoRoot, 'node_modules', 'mammoth', 'lib', 'index.js'),
  ]
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue
    try {
      const mod = await import(pathToFileURL(c).href)
      mammoth = mod.default || mod
      return mammoth
    } catch {
      /* fall through */
    }
  }
  mammoth = false
  return mammoth
}

async function extractPdfText(buf, maxPages) {
  const lib = await loadPdfJs()
  if (!lib) return { supported: false, pages: 0, chars: 0, text: '', note: 'pdfjs-dist not installed' }
  let doc = null
  try {
    doc = await lib.getDocument({
      data: new Uint8Array(buf),
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: true,
      verbosity: 0,
    }).promise
  } catch (err) {
    return { supported: true, pages: 0, chars: 0, text: '', note: `unreadable: ${err.message}` }
  }
  const pages = doc.numPages || 0
  const readPages = Math.min(pages, maxPages)
  let text = ''
  for (let i = 1; i <= readPages; i += 1) {
    try {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((it) => it.str || '').join(' ') + '\n'
      if (typeof page.cleanup === 'function') page.cleanup()
    } catch {
      // A single broken page must not kill the triage pass.
    }
  }
  const chars = text.replace(/\s+/g, ' ').trim().length
  return {
    supported: true,
    pages,
    chars,
    text,
    note: pages > readPages ? `read ${readPages}/${pages} pages` : '',
  }
}

async function extractDocxText(buf) {
  const lib = await loadMammoth()
  if (!lib) return { supported: false, pages: 0, chars: 0, text: '', note: 'mammoth not installed' }
  try {
    const out = await lib.extractRawText({ buffer: buf })
    const text = String(out?.value || '')
    return { supported: true, pages: 0, chars: text.replace(/\s+/g, ' ').trim().length, text, note: '' }
  } catch (err) {
    return { supported: true, pages: 0, chars: 0, text: '', note: `unreadable: ${err.message}` }
  }
}

// ─── corpus walking ─────────────────────────────────────────────────────────

function* walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
      yield* walkDir(full)
    } else {
      yield full
    }
  }
}

async function collectJobs(args) {
  const jobs = [] // { displayName, name, read: () => Buffer }
  if (args.dir) {
    const root = path.resolve(args.dir)
    if (!fs.existsSync(root)) throw new Error(`Folder not found: ${root}`)
    for (const full of walkDir(root)) {
      if (!isCandidateEntry(full)) continue
      jobs.push({ name: full, displayName: path.relative(root, full), read: () => fs.readFileSync(full) })
    }
    return jobs
  }
  const zipPath = path.resolve(args.zip)
  if (!fs.existsSync(zipPath)) throw new Error(`ZIP not found: ${zipPath}`)
  const buf = fs.readFileSync(zipPath)
  const { entries, zip64 } = readZipEntries(buf)
  if (zip64) console.warn('  ⚠ ZIP64 archive detected — nested/very large entries may be skipped.')
  const nested = []
  for (const e of entries) {
    if (!isCandidateEntry(e.name)) continue
    if (/\.zip$/i.test(e.name)) {
      nested.push(e.name)
      continue
    }
    jobs.push({ name: e.name, displayName: e.name, read: () => readZipEntryData(buf, e) })
  }
  if (nested.length) {
    // One level of nesting only: people routinely zip a folder of zips.
    for (const e of entries.filter((x) => /\.zip$/i.test(x.name))) {
      try {
        const inner = readZipEntryData(buf, e)
        const { entries: innerEntries } = readZipEntries(inner)
        for (const ie of innerEntries) {
          if (!isCandidateEntry(ie.name)) continue
          jobs.push({
            name: ie.name,
            displayName: `${e.name} :: ${ie.name}`,
            read: () => readZipEntryData(inner, ie),
          })
        }
      } catch (err) {
        console.warn(`  ⚠ could not open nested zip ${e.name}: ${err.message}`)
      }
    }
    console.log(`  (found ${nested.length} nested zip file(s); one level opened)`)
  }
  return jobs
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || (!args.zip && !args.dir)) {
    console.log(USAGE.trim())
    process.exit(args.help ? 0 : 1)
  }

  console.log('\nVriddhi · prep paper corpus triage')
  console.log(`  source        ${args.dir || args.zip}`)
  const pdfjsLoaded = await loadPdfJs()
  console.log(`  pdf text      ${pdfjsLoaded ? path.relative(repoRoot, pdfjsPath) : 'NOT AVAILABLE (metadata only)'}`)

  const jobs = await collectJobs(args)
  const selected = args.limit > 0 ? jobs.slice(0, args.limit) : jobs
  console.log(`  documents     ${jobs.length}${args.limit > 0 ? ` (inspecting first ${selected.length})` : ''}\n`)

  if (args.dumpText) fs.mkdirSync(args.dumpText, { recursive: true })

  const rows = []
  let n = 0
  for (const job of selected) {
    n += 1
    let buf = Buffer.alloc(0)
    let row
    try {
      buf = job.read()
      const ext = (path.extname(job.name).slice(1) || '').toLowerCase()
      const extraction =
        ext === 'pdf' ? await extractPdfText(buf, args.maxPages) : ext === 'docx' ? await extractDocxText(buf) : null

      if (!extraction) {
        row = { file: job.displayName, bytes: buf.length, bucket: 'unsupported', note: `extension .${ext}` }
      } else {
        const text = extraction.text || ''
        const script = detectScript(text)
        const legacyFont = detectLegacyFont(text)
        const bucket = extraction.supported
          ? classifyDocument({ chars: extraction.chars, pages: extraction.pages, script, legacyFont, ext })
          : 'text-unavailable'
        row = {
          file: job.displayName,
          bytes: buf.length,
          pages: extraction.pages,
          chars: extraction.chars,
          bucket,
          sha256: createHash('sha256').update(buf).digest('hex').slice(0, 16),
          script: { primary: script.primary, kn: +(script.ratios.kn || 0).toFixed(3), en: +(script.ratios.en || 0).toFixed(3) },
          legacyFont: legacyFont.suspicious ? { suspicious: true, hints: legacyFont.hints } : undefined,
          guess: guessPaperMetadata(job.displayName),
          note: extraction.note || undefined,
        }
        if (args.dumpText && text) {
          const safe = job.displayName.replace(/[\\/:*?"<>|]/g, '_').replace(/\.(pdf|docx)$/i, '') + '.txt'
          fs.writeFileSync(path.join(args.dumpText, safe), text, 'utf8')
        }
      }
    } catch (err) {
      row = { file: job.displayName, bytes: buf.length, bucket: 'error', note: err.message }
    }
    rows.push(row)
    if (!args.quiet) {
      const flag = row.bucket === 'digital-en' ? ' ' : '!'
      console.log(
        `  [${String(n).padStart(4)}] ${flag} ${String(row.bucket).padEnd(15)} ` +
          `${String(row.pages ?? '-').padStart(3)}p ${String(row.chars ?? '-').padStart(6)}ch  ${row.file}`
      )
    }
  }

  const summary = summariseManifest(rows)
  const outPath = args.out
    ? path.resolve(args.out)
    : path.join(args.dir ? path.resolve(args.dir) : path.dirname(path.resolve(args.zip)), 'prep-import-manifest.json')
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: args.dir || args.zip,
    tool: 'scripts/prep-import.mjs',
    note: 'Triage only. Nothing here is published, uploaded or sent to an AI provider.',
    summary,
    documents: rows,
  }
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 1), 'utf8')

  console.log('\n── summary ─────────────────────────────────────────────')
  console.log(`  documents            ${summary.files}`)
  console.log(`  pages (text read)    ${summary.pages}`)
  console.log(`  extracted characters ${summary.chars}`)
  console.log(`  size                 ${(summary.bytes / 1024 / 1024).toFixed(1)} MB`)
  for (const [bucket, count] of Object.entries(summary.buckets).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${bucket.padEnd(17)} ${count}`)
  }
  if (Object.keys(summary.universities).length) {
    console.log(`  universities seen    ${JSON.stringify(summary.universities)}`)
  }
  if (Object.keys(summary.programs).length) {
    console.log(`  programs seen        ${JSON.stringify(summary.programs)}`)
  }
  console.log(`\n  free (no AI needed)  ${summary.freeDeterministic}`)
  console.log(`  needs AI vision      ${summary.needsAiVision}  (scans + legacy-font files)`)
  console.log(`  manifest written     ${outPath}\n`)
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`)
  process.exit(1)
})
