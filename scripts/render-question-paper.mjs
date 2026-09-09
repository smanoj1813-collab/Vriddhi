#!/usr/bin/env node
// scripts/render-question-paper.mjs
// ═══════════════════════════════════════════════════════════════════════
// Renders content/pre-assessment/papers/*.json to printable A4 HTML
// previews (student paper — no answer key).
//
// Usage:
//   node scripts/render-question-paper.mjs --all
//   node scripts/render-question-paper.mjs --all --with-key
//   node scripts/render-question-paper.mjs path/to/paper.json
//
// Writes: content/pre-assessment/previews/<stem>.html
//         content/pre-assessment/previews/<stem>-key.html  (only with --with-key)
// Exit 0 when every paper validates and is written.
// ═══════════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  listPaperFiles,
  loadPaperFile,
  formatReport,
} from './validate-question-paper.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const DEFAULT_DIR = join(ROOT, 'content/pre-assessment/papers');
const PREVIEW_DIR = join(ROOT, 'content/pre-assessment/previews');

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function optionLabel(opt, idx) {
  if (opt && typeof opt.id === 'string' && opt.id.trim()) return opt.id.trim();
  return String.fromCharCode(65 + idx);
}

function nl2br(text) {
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

const PAPER_CSS = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; }
  body {
    font-family: "Times New Roman", Times, serif;
    font-size: 11.5pt;
    line-height: 1.45;
  }
  .sheet { max-width: 190mm; margin: 0 auto; padding: 8mm 6mm 12mm; }
  .kicker { font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: #333; }
  .header { text-align: center; border-bottom: 2.2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
  .college { font-size: 15pt; font-weight: 700; text-transform: uppercase; }
  .exam-title { font-size: 13pt; font-weight: 700; margin-top: 4px; }
  .meta { font-size: 10.5pt; margin-top: 4px; }
  .banner {
    display: flex; justify-content: space-between; gap: 12px;
    border: 1px solid #000; padding: 6px 10px; margin: 10px 0 12px; font-size: 10.5pt;
  }
  .id-row { display: flex; justify-content: space-between; gap: 10px; margin: 8px 0 12px; font-size: 10.5pt; }
  .id-row span { flex: 1; }
  .instructions { border: 1px solid #444; background: #f7f7f7; padding: 8px 12px; margin: 0 0 16px; font-size: 10pt; }
  .instructions ol { margin: 4px 0 0 18px; padding: 0; }
  .instructions li { margin: 2px 0; }
  .section { margin-top: 16px; }
  .section-h {
    font-size: 12pt; font-weight: 700; border-bottom: 1px solid #000;
    padding-bottom: 3px; margin-bottom: 8px; display: flex; justify-content: space-between;
  }
  .section-note { font-size: 10pt; font-style: italic; margin: 0 0 8px; }
  .q { margin: 10px 0 12px; padding-left: 2px; page-break-inside: avoid; }
  .q-head { display: flex; gap: 8px; align-items: flex-start; }
  .q-num { font-weight: 700; min-width: 2.2em; }
  .q-body { flex: 1; }
  .marks { float: right; font-weight: 700; white-space: nowrap; margin-left: 8px; }
  .options { margin: 4px 0 0 1.4em; }
  .opt { margin: 2px 0; }
  .topic { font-size: 8.5pt; color: #555; font-style: italic; }
  .key { margin-top: 6px; padding: 6px 8px; background: #eef6ee; border-left: 3px solid #1b5e20; font-size: 10pt; }
  .footer { margin-top: 22px; text-align: center; font-size: 10pt; border-top: 1px solid #666; padding-top: 8px; }
  .no-print { margin: 12px auto 0; max-width: 190mm; font-family: system-ui, sans-serif; font-size: 12px; color: #444; }
  @media print {
    .no-print { display: none !important; }
    .sheet { padding: 0; max-width: none; }
    a { color: inherit; text-decoration: none; }
  }
`;

function sectionLabel(idx) {
  return String.fromCharCode(65 + idx);
}

function questionHtml(q, idx, withKey) {
  const marks = q.marks != null ? `<span class="marks">[${escapeHtml(q.marks)}]</span>` : '';
  const options = Array.isArray(q.options) && q.options.length
    ? `<div class="options">${q.options.map((opt, oIdx) => {
        const lab = optionLabel(opt, oIdx);
        return `<div class="opt">${escapeHtml(lab)}. ${escapeHtml(opt.text)}</div>`;
      }).join('')}</div>`
    : '';
  let keyBlock = '';
  if (withKey) {
    const bits = [];
    if (q.correctAnswer) bits.push(`<strong>Answer:</strong> ${escapeHtml(q.correctAnswer)}`);
    if (q.modelAnswer) bits.push(`<strong>Model answer:</strong> ${nl2br(q.modelAnswer)}`);
    if (q.explanation) bits.push(`<em>${nl2br(q.explanation)}</em>`);
    if (bits.length) keyBlock = `<div class="key">${bits.join('<br/>')}</div>`;
  }
  const topic = q.topic && withKey ? `<div class="topic">${escapeHtml(q.topic)}${q.bloomLevel ? ` · ${escapeHtml(q.bloomLevel)}` : ''}</div>` : '';
  return `<div class="q">
    <div class="q-head">
      <div class="q-num">${idx}.</div>
      <div class="q-body">${marks}${nl2br(q.text)}${options}${topic}${keyBlock}</div>
    </div>
  </div>`;
}

function attemptNote(section) {
  const n = Number(section?.attempt?.count);
  if (!Number.isInteger(n) || n < 1) return section.instructions || '';
  const total = (section.questions || []).length;
  const extra = `Attempt any ${n} of the ${total} questions.`;
  return section.instructions ? `${section.instructions} ${extra}` : extra;
}

function sectionDisplayMarks(section) {
  const questions = section.questions || [];
  const n = Number(section?.attempt?.count);
  if (Number.isInteger(n) && n > 0 && n < questions.length) {
    return n * (Number(questions[0]?.marks) || 0);
  }
  return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
}

export function renderPaperHtml(paper, { withKey = false, collegeName = 'Vriddhi Affiliated College' } = {}) {
  const sections = paper.sections || [];
  const instructions = (paper.instructions || []).map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  const durationHours = paper.duration >= 60
    ? `${paper.duration} minutes (${(paper.duration / 60).toFixed(paper.duration % 60 ? 1 : 0)} hour${paper.duration === 60 ? '' : 's'})`
    : `${paper.duration} minutes`;

  const sectionHtml = sections.map((section, sIdx) => {
    const letter = sectionLabel(sIdx);
    const note = attemptNote(section);
    const qHtml = (section.questions || []).map((q, qIdx) => questionHtml(q, qIdx + 1, withKey)).join('\n');
    const marks = sectionDisplayMarks(section);
    return `<section class="section">
      <div class="section-h">
        <span>Section ${escapeHtml(letter)} — ${escapeHtml(section.name)}</span>
        <span>[${escapeHtml(marks)} marks]</span>
      </div>
      ${note ? `<p class="section-note">${escapeHtml(note)}</p>` : ''}
      ${qHtml}
    </section>`;
  }).join('\n');

  const keyBanner = withKey
    ? '<p class="kicker">Faculty copy — answer key</p>'
    : '<p class="kicker">Student copy — do not write on this question paper if a separate answer booklet is issued</p>';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(paper.language || 'en')}">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(paper.title)}${withKey ? ' — Answer key' : ''}</title>
  <style>${PAPER_CSS}</style>
</head>
<body>
  <article class="sheet">
    <header class="header">
      ${keyBanner}
      <div class="college">${escapeHtml(collegeName)}</div>
      <div class="meta">${escapeHtml(paper.university || 'Karnataka State University (affiliated college)')}</div>
      <div class="exam-title">${escapeHtml(paper.title)}</div>
      <div class="meta">${escapeHtml(paper.subject)} · ${escapeHtml(paper.program)} Semester ${escapeHtml(paper.semester)} · ${escapeHtml(paper.scheme)}</div>
    </header>

    <div class="banner">
      <div><strong>Time:</strong> ${escapeHtml(durationHours)}</div>
      <div><strong>Max. marks:</strong> ${escapeHtml(paper.totalMarks)}</div>
      <div><strong>Batch:</strong> ${escapeHtml(paper.batch || '2026-27')}</div>
    </div>

    <div class="id-row">
      <span><strong>Name:</strong> ______________________________</span>
      <span><strong>Reg. No:</strong> ____________________</span>
      <span><strong>Date:</strong> ______________</span>
    </div>

    <div class="instructions">
      <strong>Instructions</strong>
      <ol>${instructions}</ol>
    </div>

    ${sectionHtml}

    <footer class="footer">
      *** END OF QUESTION PAPER ***<br/>
      Generated by Vriddhi · content seed · not an official university question paper
    </footer>
  </article>
  <p class="no-print">Print from the browser (A4, default margins). This file is a static preview of <code>${escapeHtml(paper.id)}.json</code>.</p>
</body>
</html>
`;
}

function parseArgs(argv) {
  const files = [];
  let all = false;
  let withKey = false;
  for (const a of argv) {
    if (a === '--all') all = true;
    else if (a === '--with-key') withKey = true;
    else if (a === '--help' || a === '-h') return { help: true };
    else if (a.startsWith('-')) return { error: `Unknown flag: ${a}` };
    else files.push(resolve(process.cwd(), a));
  }
  return { all, withKey, files };
}

function printHelp() {
  console.log(`Render printable HTML previews from paper JSON.

Usage:
  node scripts/render-question-paper.mjs --all
  node scripts/render-question-paper.mjs --all --with-key
  node scripts/render-question-paper.mjs content/pre-assessment/papers/bcom-sem1.json

Writes HTML into content/pre-assessment/previews/.
Papers are validated first; a failed paper is not written.
`);
}

const parsed = parseArgs(process.argv.slice(2));
if (parsed.help) {
  printHelp();
  process.exit(0);
}
if (parsed.error) {
  console.error(parsed.error);
  printHelp();
  process.exit(1);
}

const files = parsed.all || parsed.files.length === 0
  ? listPaperFiles(DEFAULT_DIR)
  : parsed.files;

if (files.length === 0) {
  console.error('No paper JSON files found.');
  process.exit(1);
}

mkdirSync(PREVIEW_DIR, { recursive: true });

let ok = true;
const written = [];
for (const file of files) {
  const { paper, result } = loadPaperFile(file);
  console.log(formatReport(file, result));
  result.warnings.forEach((w) => console.log(`      warn: ${w}`));
  if (!result.ok || !paper) {
    ok = false;
    continue;
  }
  const stem = basename(file, '.json');
  const html = renderPaperHtml(paper, { withKey: false });
  const out = join(PREVIEW_DIR, `${stem}.html`);
  writeFileSync(out, html, 'utf8');
  written.push(out);
  console.log(`Wrote ${out} (${result.stats.marks} marks, ${result.stats.questions} questions)`);
  if (parsed.withKey) {
    const keyHtml = renderPaperHtml(paper, { withKey: true });
    const keyOut = join(PREVIEW_DIR, `${stem}-key.html`);
    writeFileSync(keyOut, keyHtml, 'utf8');
    written.push(keyOut);
    console.log(`Wrote ${keyOut} (faculty key)`);
  }
}

console.log(`\n${ok ? 'Rendered' : 'FAILED'} ${files.length} paper(s); wrote ${written.length} HTML file(s).`);
process.exit(ok ? 0 : 1);
