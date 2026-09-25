// functions/src/questionImport.ts
//
// Bulk import of previous-year question papers (PDF/DOCX, English + Kannada)
// into the SHARED question bank as PENDING drafts.
//
// Why a queue and not one call:
//   * the paper corpus is hundreds of files and the `api` function has a 60 s
//     timeout — one document per call keeps every call short, resumable and
//     cheap to retry;
//   * parsing must never write straight into the pool: it stages drafts with
//     `status: 'pending'`, which the existing Review Queue (questionReviews)
//     already knows how to approve or reject.
//
// Pipeline (one call = one unit of work, see routes/questionImport.ts):
//   awaiting-upload → unpacking (≤ N archive entries per call)
//                   → parsing    (one document per call)
//                   → complete | failed
//
// THIS FILE IS PURE — no Firebase, no network, no disk. Everything here is
// unit-tested in functions/test/questionImport.test.ts.
//
// The document shapes below deliberately mirror
// `src/modules/admin/api/cloudStorageApi.ts buildQuestionDocs()` so an imported
// question is indistinguishable from a seeded or manually submitted one, and
// the client-side dedupe (`fingerprintMetaDoc` in
// src/modules/superadmin/data/questionBankSeed.ts) recognises it. The two
// fingerprint helpers are pinned by a shared fixture in both test suites.

import { SchemaType, type ResponseSchema } from '@google/generative-ai'

import { geminiModelsFor } from './config/aiModels'

// ─── Limits ─────────────────────────────────────────────────────────────────

/** Never trust an upload: these bounds are enforced before any work happens. */
export const IMPORT_MAX_ARCHIVE_BYTES = 80 * 1024 * 1024
export const IMPORT_MAX_FILE_BYTES = 25 * 1024 * 1024
export const IMPORT_MAX_FILES = 1_000
/** Documents unpacked from the archive per call (keeps every call well inside 60 s). */
export const IMPORT_UNPACK_PER_CALL = 40
/** Questions kept from one document (a 200-question paper is already unusual). */
export const IMPORT_MAX_QUESTIONS_PER_FILE = 250
export const IMPORT_MAX_QUESTION_CHARS = 4_000
/** Mirrors MIN_TEXT_CHARS in paperParsing.ts: below this the file is treated as a scan. */
export const IMPORT_MIN_TEXT_CHARS = 120
/** Inline (base64) parts are capped by the Gemini API; stay well under the 20 MB request limit. */
export const IMPORT_MAX_INLINE_BYTES = 12 * 1024 * 1024
/** Questions per Firestore batch: 400 writes, 3 documents per question → 133 is the hard ceiling. */
export const IMPORT_QUESTIONS_PER_BATCH = 120

/**
 * Model for the import pipeline.
 *
 * Deliberately its own constant: the 2.1 hand-off item introduces a tier map
 * (`GEMINI_MODELS.quality`); when that lands, point this at it. Until then the
 * env var lets the operator move it without a redeploy of the call sites.
 */
// Resolved through config/aiModels.ts so no call site carries a model literal:
// QUESTION_IMPORT_AI_MODEL (if set) wins, then the quality tier, then the tier's
// own in-Gemini fallbacks. Parsing a paper is always a quality-tier job.
export const IMPORT_AI_MODEL = geminiModelsFor('quality', [process.env.QUESTION_IMPORT_AI_MODEL])[0]

export const IMPORT_JOBS_COLLECTION = 'questionBankImportJobs'
export const QUESTION_META_COLLECTION = 'questionBank_meta'
export const QUESTION_CONTENT_COLLECTION = 'questionBank_content'
export const QUESTION_REVIEWS_COLLECTION = 'questionReviews'

export const IMPORT_CANDIDATE_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'] as const

// ─── Types ──────────────────────────────────────────────────────────────────

export type ImportJobStatus = 'awaiting-upload' | 'unpacking' | 'parsing' | 'complete' | 'failed'
export type ImportFileStatus = 'queued' | 'parsing' | 'done' | 'failed' | 'skipped'

export interface ImportJobFile {
  index: number
  /** Original name inside the archive (display only). */
  name: string
  /** Storage object holding this document's bytes (filled during unpack). */
  storagePath?: string
  bytes: number
  status: ImportFileStatus
  /** 'deterministic' | 'ai-text' | 'ai-vision' — how the questions were read. */
  method?: string
  pages?: number
  /** Dominant script of the extracted text / model answer: 'en' | 'kn' | 'mixed'. */
  language?: string
  questionCount?: number
  drafted?: number
  duplicates?: number
  error?: string
}

export interface ImportJobCounters {
  files: number
  unpacked: number
  parsed: number
  failed: number
  skippedFiles: number
  drafted: number
  duplicates: number
}

export interface ImportJobDefaults {
  program: string
  /** Programme label printed on the paper, e.g. 'B.Com' — becomes meta.branch. */
  branch: string
  semester: number
  subjectId: string
  topicId: string
  difficulty: 'easy' | 'medium' | 'hard'
  examYear: number | null
  universityCode: string
}

export interface ImportJobDoc {
  id: string
  status: ImportJobStatus
  archive: { storagePath: string; fileName: string; bytes: number }
  defaults: ImportJobDefaults
  files: ImportJobFile[]
  counters: ImportJobCounters
  /** Set when the archive held more documents than IMPORT_MAX_FILES. */
  truncated?: boolean
  error?: string
  createdBy: { uid: string; name: string }
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type ImportedQuestionType =
  | 'mcq'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_answer'
  | 'long_answer'
  | 'matching'
  | 'assertion_reason'
  | 'case_based'
  | 'numerical'

export interface ImportedQuestion {
  text: string
  type: ImportedQuestionType
  marks: number
  section: string
  topic: string
  parts: string[]
  options: string[]
  /** Only ever populated when the paper itself printed the answer. */
  correctAnswer: string
}

export interface ImportedPaperMeta {
  title: string
  subject: string
  university: string
  paperCode: string
  examMonth: string
  examYear: number
  durationMinutes: number
  maxMarks: number
  language: string
}

export interface ImportDraftContext {
  jobId: string
  fileIndex: number
  fileName: string
  defaults: ImportJobDefaults
  paper: ImportedPaperMeta
  author: { uid: string; name: string }
  now: string
  /** Id generator (Firestore document id), injected so this module stays pure. */
  newId: () => string
}

export interface ImportDraftDocs {
  fingerprint: string
  meta: Record<string, unknown>
  content: Record<string, unknown>
  review: Record<string, unknown>
}

// ─── Text normalisation + fingerprints (mirrors of the client source) ───────

/**
 * Mirrors `normalizeQuestionText` in src/modules/superadmin/data/questionBankSeed.ts
 * CHARACTER FOR CHARACTER — that equivalence is what makes the client-side
 * duplicate check recognise imported rows, and it is pinned by a fixture in both
 * test suites.
 *
 * Known caveat (deliberately preserved for now): `\p{L}` does not match Kannada
 * combining marks (vowel signs are Unicode Mark, `\p{M}`), so a Kannada question
 * normalises with its matras stripped — "ಭಾರತದ" → "ಭರತದ". Deduplication still
 * works (both sides mangle identically), but the fingerprint is unreadable and
 * two Kannada questions that differ ONLY in matras would collide. Fixing it
 * means adding `\p{M}` to BOTH copies in one change, and re-fingerprinting the
 * existing pool — a separate item, not this slice. See
 * docs/QUESTION_PAPER_IMPORT.md → "Known limitations".
 */
export function normalizeQuestionText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
}

/** Mirrors `buildSeedFingerprint` (same four components, same order, same separator). */
export function buildSeedFingerprint(input: {
  text: string
  subject: string
  topic: string
  branch?: string | null
}): string {
  return [
    normalizeQuestionText(input.text),
    String(input.subject || '').trim().toLowerCase(),
    String(input.topic || '').trim().toLowerCase(),
    String(input.branch || '').trim().toLowerCase(),
  ].join('|')
}

/** Mirrors `buildPreviewText` (list views read this and never the content doc). */
export function buildPreviewText(text: string, maxLen = 160): string {
  if (!text) return ''
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

/**
 * Mirrors `buildSearchKeywords`. The `raw` branch is what makes this work for
 * Kannada: the ASCII-only token is empty, the raw lowercased word is kept.
 */
export function buildSearchKeywords(text: string, subjectId: string, topicId: string, tags: string[]): string[] {
  const tokens = new Set<string>()
  const add = (value: string) => {
    if (!value) return
    value
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        const cleaned = word.replace(/[^a-z0-9]/g, '')
        if (cleaned) tokens.add(cleaned.substring(0, 20))
        const raw = word.toLowerCase().substring(0, 20)
        if (raw && raw !== cleaned.substring(0, 20)) tokens.add(raw)
      })
  }
  add(text)
  add(subjectId)
  add(topicId)
  ;(tags || []).forEach((t) => add(t))
  return Array.from(tokens).filter(Boolean)
}

/** Mirrors `toUniversalQuestionType` — unknown labels never become `mcq`. */
export function toUniversalQuestionType(raw: unknown, hasOptions = false): ImportedQuestionType {
  const t = String(raw || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const map: Record<string, ImportedQuestionType> = {
    mcq: 'mcq',
    multiple_choice: 'mcq',
    multiple_choice_question: 'mcq',
    objective: 'mcq',
    true_false: 'true_false',
    truefalse: 'true_false',
    tf: 'true_false',
    short_answer: 'short_answer',
    short: 'short_answer',
    brief: 'short_answer',
    long_answer: 'long_answer',
    long: 'long_answer',
    essay: 'long_answer',
    descriptive: 'long_answer',
    fill_in_blank: 'fill_in_blank',
    fill_in_the_blank: 'fill_in_blank',
    fill_in_the_blanks: 'fill_in_blank',
    blank: 'fill_in_blank',
    match: 'matching',
    matching: 'matching',
    numerical: 'numerical',
    nat: 'numerical',
    case_based: 'case_based',
    case_study: 'case_based',
    assertion_reason: 'assertion_reason',
  }
  if (map[t]) return map[t]
  return hasOptions ? 'mcq' : 'short_answer'
}

export function toUniversalDifficulty(raw: unknown): 'easy' | 'medium' | 'hard' {
  const d = String(raw || '').trim().toLowerCase()
  if (d === 'easy' || d === 'medium' || d === 'hard') return d
  return 'medium'
}

/** Mirrors `bloomLevelFor` (keeps the bank's Bloom filter non-empty for imports). */
export function bloomLevelFor(type: ImportedQuestionType, difficulty: 'easy' | 'medium' | 'hard'): string {
  if (type === 'long_answer' || type === 'case_based') return 'create'
  if (type === 'short_answer') return 'understand'
  if (type === 'assertion_reason' || type === 'matching') return 'analyze'
  if (type === 'numerical') return 'apply'
  return difficulty === 'hard' ? 'analyze' : difficulty === 'medium' ? 'apply' : 'remember'
}

// ─── Script detection (English / Kannada / mixed) ───────────────────────────

const KANNADA_RE = /[\u0C80-\u0CFF]/
const DEVANAGARI_RE = /[\u0900-\u097F]/

/**
 * Dominant language of a question, using the same codes the bank stores
 * (`en | hi | kn | ta | te | ml`, see detectSeedLanguage in questionBankSeed.ts).
 * Kannada is checked first: a bilingual paper is still a Kannada paper for
 * cataloguing, and mixing the two would hide it from a Kannada filter.
 */
export function detectQuestionLanguage(text: string, fallback = 'en'): string {
  if (KANNADA_RE.test(text)) return 'kn'
  if (DEVANAGARI_RE.test(text)) return 'hi'
  return fallback
}

/** 'en' | 'kn' | 'mixed' for a whole document — used for the job's file rows. */
export function detectDocumentLanguage(text: string): 'en' | 'kn' | 'mixed' {
  const sample = String(text || '').slice(0, 20_000)
  const kannada = (sample.match(/[\u0C80-\u0CFF]/g) || []).length
  const latin = (sample.match(/[A-Za-z]/g) || []).length
  if (kannada === 0) return 'en'
  if (latin === 0) return 'kn'
  return latin > kannada * 4 ? 'en' : 'mixed'
}

/**
 * Karnataka's legacy-font mojibake (Nudi / KGP). The page *looks* like Kannada
 * but the text layer is Latin-1 gibberish, so the text path must not be used —
 * the document has to be read visually.
 */
export function looksLikeLegacyFont(text: string): boolean {
  const s = String(text || '')
  if (!s) return false
  if (/(PÀ£ÁðlPÀ|¥Àæ±Éß|¸ÀA¸ÉÜ|«zÁåyð)/.test(s)) return true
  const latinExt = (s.match(/[\u00C0-\u024F]/g) || []).length
  const hints = (s.match(/(PÀ|ªÀ|£À|¥À|§À|¸À|ºÀ|AiÀ|UÀ|zÀ|æÀ|jÀ|«À|qÀ)/g) || []).length
  return latinExt >= 40 && hints >= 3
}

// ─── Prompt + response schema ───────────────────────────────────────────────

/** Structured output the extraction call must return. */
export const IMPORT_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    meta: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        subject: { type: SchemaType.STRING },
        university: { type: SchemaType.STRING },
        paperCode: { type: SchemaType.STRING },
        examMonth: { type: SchemaType.STRING },
        examYear: { type: SchemaType.NUMBER },
        durationMinutes: { type: SchemaType.NUMBER },
        maxMarks: { type: SchemaType.NUMBER },
        language: { type: SchemaType.STRING },
      },
    },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          type: { type: SchemaType.STRING },
          marks: { type: SchemaType.NUMBER },
          section: { type: SchemaType.STRING },
          topic: { type: SchemaType.STRING },
          parts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
        },
        required: ['text'],
      },
    },
  },
  required: ['questions'],
}

const TRANSCRIPTION_RULES = `Rules that must never be broken:
1. Transcribe EXACTLY what is printed. Never invent, translate, rephrase, summarise, complete or correct a question.
2. Keep each question in the language it is printed in: English questions stay English, Kannada questions stay in Kannada script (ಕನ್ನಡ). NEVER transliterate Kannada into Latin letters and NEVER translate between the two.
3. One entry per question. If a question has parts — (a)/(b)/(c), sub-parts, or an "OR" alternative — keep the stem in "text" and each part in "parts". Do not split a printed group into separate questions.
4. "marks": the marks printed beside or under the question. When the paper says "each question carries N marks", repeat N for every question in that section. Use 0 when no marks are printed anywhere.
5. "type": one of mcq, true_false, fill_in_blank, short_answer, long_answer, numerical, case_based, assertion_reason, matching. Use short_answer or long_answer unless the paper really prints options.
6. "options": ONLY for questions the paper prints with choices. Copy them verbatim without the letter labels (A/B/C/D). Otherwise return an empty list.
7. "correctAnswer": leave EMPTY unless the paper itself prints the answer (rare). Never solve the question.
8. "section": the section/part label printed above the question ("A", "B", "I"), else "".
9. "topic": copy a printed unit/chapter heading when one is visible, else "".
10. Skip page headers, footers, page numbers, invigilator instructions, seat numbers and "P.T.O." markers.
11. Do not add commentary, marks summaries or questions that are not printed on the paper.`

/** Text-mode prompt: a digital PDF/DOCX whose text layer was extracted. */
export function buildImportPrompt(input: { fileName: string; text: string; totalPages?: number }): string {
  const pages = input.totalPages && input.totalPages > 0 ? ` The document has ${input.totalPages} page(s).` : ''
  return `You are transcribing a university question paper into structured JSON for a question bank.
The file is titled "${input.fileName}".${pages} The full extracted text follows between the markers.

${TRANSCRIPTION_RULES}

Also fill "meta" from what is printed on the page: title, subject, university, paper code, exam month, exam year (4 digits), duration in minutes, maximum marks, and the language of the majority of the questions ("en", "kn" or "mixed").

Return JSON only, matching the schema.

--- BEGIN EXTRACTED TEXT ---
${input.text}
--- END EXTRACTED TEXT ---`
}

/** Vision-mode prompt: the PDF itself is attached (scan, photo or legacy-font file). */
export function buildVisionImportPrompt(input: { fileName: string }): string {
  return `You are transcribing a university question paper into structured JSON for a question bank.
The attached document is "${input.fileName}". The pages are typographically poor — they may be a photocopy, a scan, or typeset in a legacy Kannada font (Nudi / KGP) whose characters are not real Unicode.

Read the pages VISUALLY, one by one, exactly as a human examiner would.

${TRANSCRIPTION_RULES}
12. Because the text may be a legacy-font file, always output real Unicode Kannada (ಕನ್ನಡ script) for Kannada questions — never the Latin gibberish a text extractor would produce.

Also fill "meta" from what is printed on the page: title, subject, university, paper code, exam month, exam year (4 digits), duration in minutes, maximum marks, and the language of the majority of the questions ("en", "kn" or "mixed").

Return JSON only, matching the schema.`
}

// ─── Sanitiser ──────────────────────────────────────────────────────────────

function clampString(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, max)
}

function clampMarks(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(200, Math.round(n * 100) / 100)
}

/**
 * Turns the model's JSON into what the bank may hold.
 *
 * Deliberately conservative, in the same spirit as paperParsing.ts: anything
 * invented is stripped (answers), blanks are dropped, sizes are clamped, and a
 * question with options but no printed answer keeps `correctAnswer: ''` so the
 * review screen shows it as "needs an answer key" instead of pretending.
 */
export function normalizeImportedQuestions(
  raw: unknown,
  opts: { maxQuestions?: number; maxOptions?: number } = {}
): { questions: ImportedQuestion[]; meta: ImportedPaperMeta; warnings: string[] } {
  const maxQuestions = opts.maxQuestions ?? IMPORT_MAX_QUESTIONS_PER_FILE
  const maxOptions = opts.maxOptions ?? 8
  const warnings: string[] = []
  const root = (raw ?? {}) as Record<string, any>
  const rawQuestions = Array.isArray(root.questions) ? root.questions : []
  const out: ImportedQuestion[] = []

  for (const item of rawQuestions) {
    if (out.length >= maxQuestions) {
      warnings.push(`Only the first ${maxQuestions} questions were kept.`)
      break
    }
    const source = (item ?? {}) as Record<string, any>
    const text = clampString(source.text ?? source.questionText ?? source.question, IMPORT_MAX_QUESTION_CHARS)
    if (text.length < 3) continue

    const parts = Array.isArray(source.parts)
      ? source.parts.map((p: unknown) => clampString(p, 600)).filter(Boolean).slice(0, 12)
      : []
    const options = Array.isArray(source.options)
      ? source.options.map((o: unknown) => clampString(o, 400)).filter(Boolean).slice(0, maxOptions)
      : []

    // An "mcq" without printed options would be unanswerable — demote it, the
    // same rule the client's toUniversalQuestionType applies.
    let type = toUniversalQuestionType(source.type, options.length > 1)
    if (type === 'mcq' && options.length < 2) type = 'short_answer'

    out.push({
      text,
      type,
      marks: clampMarks(source.marks),
      section: clampString(source.section, 24),
      topic: clampString(source.topic, 160),
      parts,
      options: type === 'mcq' || type === 'true_false' ? options : [],
      // Never trust model-provided answers unless options were printed too.
      correctAnswer:
        type === 'mcq' && options.length > 1 ? clampString(source.correctAnswer, 400) : '',
    })
  }

  const rawMeta = (root.meta ?? {}) as Record<string, any>
  const year = Number(rawMeta.examYear)
  const meta: ImportedPaperMeta = {
    title: clampString(rawMeta.title, 240),
    subject: clampString(rawMeta.subject, 160),
    university: clampString(rawMeta.university, 160),
    paperCode: clampString(rawMeta.paperCode, 40),
    examMonth: clampString(rawMeta.examMonth, 40),
    examYear: Number.isFinite(year) && year >= 2005 && year <= new Date().getFullYear() + 1 ? year : 0,
    durationMinutes: Number(rawMeta.durationMinutes) > 0 ? Math.min(360, Number(rawMeta.durationMinutes)) : 0,
    maxMarks: Number(rawMeta.maxMarks) > 0 ? Math.min(1_000, Number(rawMeta.maxMarks)) : 0,
    language: ['en', 'kn', 'mixed'].includes(String(rawMeta.language)) ? String(rawMeta.language) : '',
  }

  if (rawQuestions.length > out.length) {
    warnings.push(`${rawQuestions.length - out.length} entr${rawQuestions.length - out.length === 1 ? 'y was' : 'ies were'} dropped (blank or unusable).`)
  }
  return { questions: out, meta, warnings }
}

/** Extracts the first JSON object from a model reply that may carry a code fence. */
export function extractJsonPayload(raw: string): unknown {
  const text = String(raw || '').trim()
  if (!text) return null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : text
  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

// ─── Draft document builder (mirrors cloudStorageApi.buildQuestionDocs) ────

export interface ImportFileObservation {
  pages?: number
  method?: string
  language?: string
}

/**
 * Builds the three documents one imported question writes:
 *
 *   questionBank_meta/{id}      list view + review status
 *   questionBank_content/{id}    full payload (read on use, never in lists)
 *   questionReviews/{id}         the pending entry the Review Queue shows
 *
 * Field names are the contract with the existing readers; see the module header.
 */
export function buildImportDraftDocs(
  question: ImportedQuestion,
  ctx: ImportDraftContext,
  observation: ImportFileObservation = {}
): ImportDraftDocs {
  const { defaults, paper, author } = ctx
  const id = ctx.newId()
  const reviewId = ctx.newId()
  const subjectId = defaults.subjectId.trim() || paper.subject.trim() || 'General'
  const topicId = (question.topic || defaults.topicId).trim() || 'General'
  const branch = defaults.branch || defaults.program.toUpperCase()
  const language = detectQuestionLanguage(question.text, paper.language === 'kn' ? 'kn' : 'en')
  const questionText = question.text

  const tags = [
    'pyq',
    'question-paper-import',
    `program-${defaults.program.toLowerCase()}`,
    defaults.semester ? `semester-${defaults.semester}` : '',
    defaults.universityCode ? `university-${defaults.universityCode.toLowerCase()}` : '',
    (defaults.examYear ?? paper.examYear) ? `exam-${defaults.examYear ?? paper.examYear}` : '',
    paper.examMonth ? `exam-month-${paper.examMonth.toLowerCase().replace(/\s+/g, '-')}` : '',
    'vriddhi-curated',
    'free',
  ]
    .map((t) => String(t || '').trim())
    .filter(Boolean)

  const createdBy = {
    userId: author.uid,
    userName: author.name || 'Vriddhi',
    // null collegeId = platform-wide content, the same rule the seeder uses.
    collegeId: null,
    collegeName: 'Vriddhi',
    role: 'superadmin',
  }

  const options = question.options.map((text, i) => ({
    id: String.fromCharCode(65 + i),
    text,
    isCorrect: false,
  }))

  const fingerprint = buildSeedFingerprint({
    text: questionText,
    subject: subjectId,
    topic: topicId,
    branch,
  })

  const meta = {
    id,
    subjectId,
    topicId,
    subTopicId: '',
    difficulty: defaults.difficulty,
    questionType: question.type,
    marks: question.marks > 0 ? question.marks : 1,
    language,
    tags,
    // Drafts are never public until the Review Queue approves them.
    status: 'pending',
    visibility: 'public',
    sharedWith: [] as string[],
    source: 'platform',
    storagePath: '',
    hasImage: false,
    qualityRating: 0,
    usageCount: 0,
    createdBy,
    subjectName: subjectId,
    topicName: topicId,
    subTopicName: '',
    bloomLevel: bloomLevelFor(question.type, defaults.difficulty),
    branch,
    // Import provenance (mirrors the seeder's seedSource/seedBatch extras) —
    // `fingerprintMetaDoc` reads `branch` and the wording, so provenance is free.
    importJobId: ctx.jobId,
    importFileIndex: ctx.fileIndex,
    importFileName: ctx.fileName,
    importFingerprint: fingerprint,
    importSection: question.section,
    importParts: question.parts,
    importMethod: observation.method || '',
    importPages: observation.pages || 0,
    previewText: buildPreviewText(questionText),
    searchKeywords: buildSearchKeywords(questionText, subjectId, topicId, tags),
    createdAt: ctx.now,
    updatedAt: ctx.now,
  }

  const content = {
    id,
    version: 1,
    questionText,
    options,
    correctAnswer: question.correctAnswer,
    explanation: '',
    hint: '',
    subjectId,
    topicId,
    subTopicId: '',
    difficulty: defaults.difficulty,
    questionType: question.type,
    marks: question.marks > 0 ? question.marks : 1,
    language,
    tags,
    images: [] as string[],
    hasImage: false,
    createdBy,
    source: 'platform',
    status: 'pending',
    visibility: 'public',
    sharedWith: [] as string[],
    quality: { rating: 0, reviewCount: 0, flagged: false },
    usageStats: { usedInPapers: 0, usedInAssessments: 0, collegesUsing: [] as string[] },
    versions: [] as unknown[],
    storagePath: `${QUESTION_CONTENT_COLLECTION}/${id}.json`,
    metadataDocId: id,
    // Legacy-shape aliases: the college-side readers resolve these first.
    text: questionText,
    type: question.type,
    subject: subjectId,
    topic: topicId,
    unit: topicId,
    subTopic: '',
    branch,
    batch: '',
    explanationText: '',
    parts: question.parts,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  }

  const review = {
    id: reviewId,
    questionId: id,
    submittedBy: createdBy,
    submittedAt: ctx.now,
    status: 'pending',
    reviewComment: '',
    importJobId: ctx.jobId,
    importFileName: ctx.fileName,
    createdAt: ctx.now,
    updatedAt: ctx.now,
  }

  return { fingerprint, meta, content, review }
}

// ─── Job doc reducers (pure: the route only does I/O around them) ───────────

export function emptyCounters(): ImportJobCounters {
  return { files: 0, unpacked: 0, parsed: 0, failed: 0, skippedFiles: 0, drafted: 0, duplicates: 0 }
}

export function createImportJob(input: {
  id: string
  storagePath: string
  fileName: string
  bytes: number
  defaults: ImportJobDefaults
  author: { uid: string; name: string }
  now: string
}): ImportJobDoc {
  return {
    id: input.id,
    status: 'awaiting-upload',
    archive: { storagePath: input.storagePath, fileName: input.fileName, bytes: input.bytes },
    defaults: normalizeDefaults(input.defaults),
    files: [],
    counters: emptyCounters(),
    createdBy: input.author,
    createdAt: input.now,
    updatedAt: input.now,
  }
}

/** Coerces operator input into the shape the draft builder expects. */
export function normalizeDefaults(raw: Partial<ImportJobDefaults> | undefined): ImportJobDefaults {
  const program = String(raw?.program || '').trim().toLowerCase() || 'bba'
  return {
    program,
    branch: String(raw?.branch || '').trim() || program.toUpperCase(),
    semester: Number.isFinite(Number(raw?.semester)) ? Math.min(10, Math.max(0, Number(raw?.semester))) : 0,
    subjectId: clampString(raw?.subjectId, 160),
    topicId: clampString(raw?.topicId, 160),
    difficulty: toUniversalDifficulty(raw?.difficulty),
    examYear: Number.isFinite(Number(raw?.examYear)) && Number(raw?.examYear) >= 2005 ? Number(raw?.examYear) : null,
    universityCode: String(raw?.universityCode || '').trim().toLowerCase(),
  }
}

/** Applies one unpack pass to the job (appends file rows, caps the list). */
export function applyUnpackResult(
  job: ImportJobDoc,
  incoming: ImportJobFile[],
  opts: { maxFiles?: number; now: string }
): ImportJobDoc {
  const maxFiles = opts.maxFiles ?? IMPORT_MAX_FILES
  const files = [...job.files]
  let truncated = job.truncated
  for (const entry of incoming) {
    if (files.length >= maxFiles) {
      truncated = true
      break
    }
    files.push(entry)
  }
  const counters = { ...job.counters, files: files.length, unpacked: files.length }
  return {
    ...job,
    files,
    counters,
    truncated,
    status: 'parsing',
    updatedAt: opts.now,
  }
}

/** The next document to parse, or null when the queue is drained. */
export function nextQueuedFile(job: ImportJobDoc): ImportJobFile | null {
  return job.files.find((f) => f.status === 'queued') || null
}

/** Applies one document's parse result (counters + status roll-ups). */
export function applyFileResult(
  job: ImportJobDoc,
  fileIndex: number,
  result: {
    status: ImportFileStatus
    method?: string
    pages?: number
    language?: string
    questionCount?: number
    drafted?: number
    duplicates?: number
    error?: string
    storagePath?: string
  },
  now: string
): ImportJobDoc {
  const files = job.files.map((f) =>
    f.index === fileIndex
      ? {
          ...f,
          storagePath: result.storagePath || f.storagePath,
          status: result.status,
          method: result.method ?? f.method,
          pages: result.pages ?? f.pages,
          language: result.language ?? f.language,
          questionCount: result.questionCount ?? f.questionCount,
          drafted: result.drafted ?? f.drafted,
          duplicates: result.duplicates ?? f.duplicates,
          error: result.error,
        }
      : f
  )

  const counters: ImportJobCounters = {
    files: files.length,
    unpacked: files.filter((f) => f.status !== 'queued').length,
    parsed: files.filter((f) => f.status === 'done').length,
    failed: files.filter((f) => f.status === 'failed').length,
    skippedFiles: files.filter((f) => f.status === 'skipped').length,
    drafted: files.reduce((n, f) => n + (f.drafted || 0), 0),
    duplicates: files.reduce((n, f) => n + (f.duplicates || 0), 0),
  }

  const drained = !files.some((f) => f.status === 'queued' || f.status === 'parsing')
  return {
    ...job,
    files,
    counters,
    status: drained ? 'complete' : 'parsing',
    completedAt: drained ? now : job.completedAt,
    updatedAt: now,
  }
}

/** Human-readable one-liner the UI shows next to the progress bar. */
export function describeJobProgress(job: ImportJobDoc): string {
  const total = job.counters.files
  const finished = job.files.filter((f) => f.status === 'done' || f.status === 'failed' || f.status === 'skipped').length
  switch (job.status) {
    case 'awaiting-upload':
      return 'Waiting for the archive to finish uploading.'
    case 'unpacking':
      return `Reading the archive… ${job.counters.files} document(s) found.`
    case 'parsing':
      return `Transcribing document ${Math.min(finished + 1, Math.max(total, 1))} of ${total} — ${job.counters.drafted} question(s) drafted so far.`
    case 'complete':
      return `Done: ${job.counters.drafted} question(s) drafted from ${job.counters.parsed} document(s)` +
        (job.counters.failed ? `, ${job.counters.failed} failed` : '') +
        (job.counters.duplicates ? `, ${job.counters.duplicates} skipped as duplicates` : '') +
        '.'
    default:
      return job.error || 'The import stopped. Open the file list for details.'
  }
}

/** Wall-clock budget helpers keep each call inside the `api` 60 s timeout. */
export function isBufferTooLargeForInline(bytes: number): boolean {
  return bytes > IMPORT_MAX_INLINE_BYTES
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}
