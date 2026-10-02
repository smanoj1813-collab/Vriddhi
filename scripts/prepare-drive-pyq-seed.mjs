#!/usr/bin/env node
// Offline, deterministic seed preparation. No Firebase/Drive/AI requests.
// Run via `npm run pyq:prepare`, which registers tsx for the shared validator.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sources from '../functions/src/data/prepPapers/drivePyqSources.json' with { type: 'json' }
import { DRIVE_PYQ_PREPARATION } from '../functions/src/data/prepPapers/drivePyqFiles.ts'
import { validatePrepPapers } from '../functions/src/prepPapers.ts'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const out = path.join(root, 'data', 'pyq')
const { papers, excluded, duplicateFileIds } = DRIVE_PYQ_PREPARATION
const validation = validatePrepPapers(papers)
if (!validation.valid) {
  console.error('PYQ seed failed validation; no output written.', validation.issues)
  process.exit(1)
}
const programs = Object.fromEntries([...new Set(papers.map((p) => p.program))].map((code) => [code, papers.filter((p) => p.program === code).length]))
const languagePapers = papers.filter((p) => p.program === 'languages')
const seed = {
  schemaVersion: 1,
  seedCode: 'pyq-files',
  targetCollection: 'prep_papers',
  mode: 'original-pdf-links',
  sourceFolderUrl: sources.sourceFolderUrl,
  recordedOn: sources.recordedOn,
  coverage: sources.coverage,
  pendingCollections: sources.pendingCollections,
  directoryChecks: sources.directoryChecks,
  excludedFolders: sources.excludedFolders,
  counts: { included: papers.length, excluded: excluded.length, duplicateFileIds: duplicateFileIds.length, programs,
    checkedMaSemesterFolders: sources.directoryChecks.length, excludedMaProgrammeFolders: sources.excludedFolders.length,
    languageSubjects: { english: languagePapers.filter((p) => p.language === 'en').length, kannada: languagePapers.filter((p) => p.language === 'kn').length } },
  // Compact source-PDF authoring records. Unknown metadata and university
  // properties are OMITTED, not filled with made-up labels/year/marks.
  papers: papers.map((p) => ({
    id: p.id, contentType: 'source_pdf', isPYQ: true, program: p.program,
    semester: p.semester, subject: p.subjectName, language: p.language,
    sourceFile: p.sourceFile, source: p.source, status: p.status,
  })),
  excluded,
}
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'drive-pyq.seed.json'), `${JSON.stringify(seed, null, 2)}\n`)
const report = `# Prepared original-PDF PYQ seed\n\n${papers.length} paper links are ready; ${excluded.length} other-language entries were excluded.\n\n` +
  `## Included\n\n| Group | Papers |\n|---|---:|\n${Object.entries(programs).map(([code, count]) => `| ${code} | ${count} |`).join('\n')}\n\n` +
  `Languages: **${seed.counts.languageSubjects.english} English + ${seed.counts.languageSubjects.kannada} Kannada**.\n\n` +
  `## Content policy\n\n- Original public Google Drive PDF links only, labelled PYQ.\n- No university assigned or displayed.\n- No generated questions, answer keys or OCR transcriptions.\n- Unknown exam year, scheme, marks and duration are not inferred.\n- Other-language subjects are excluded from this seed, not deleted from Drive.\n- Existing Firestore rows are preserved when re-seeding.\n\n` +
  `## Coverage\n\n${sources.coverage}\n\nAll 46 eligible MA semester folders were checked; the returned empty-state pages exposed no public PDFs. This does not certify private/unlisted folder contents. Empty directories are audit entries only, never question-paper records. ZIP archives were not seeded alongside their individual PDFs. Identical filenames with different Drive IDs are retained; byte-level duplicate checks need the originals.\n\n` +
  `## How to seed\n\nAfter merging and deploying these changes, open **Superadmin → Prep Content Studio**. Deselect the other bundles, select **Shared PYQ PDFs (English / Kannada languages)**, and confirm **Seed Selected**. This writes only missing entries into \`prep_papers\`. No cloud data is written by \`npm run pyq:prepare\`.\n\n` +
  `Full instructions: \`docs/PYQ_DRIVE_SEEDING.md\`.\n`
fs.writeFileSync(path.join(out, 'README.md'), report)
console.log(`Prepared ${papers.length} original-PDF PYQ links; excluded ${excluded.length} other-language entries.`)
console.log(programs)
console.log('Output: data/pyq/drive-pyq.seed.json and data/pyq/README.md')
console.log('Validation passed. No Firebase, Drive or AI requests were made.')
