// functions/src/paperParsing.ts
// Slice 1 of the paper-upload parse handoff.
//
// One paper, two artefacts:
//   • original file (papers.filePath)  → the print artefact (photocopy)
//   • sections[] + question bank        → the online artefact (assessments)
//
// This module provides the two server callables that close the loop:
//
//   1. parsePaperFile — extracts text from a digital PDF / DOCX in Cloud
//      Storage and asks Gemini to structure it. Parsing is ASSISTIVE ONLY:
//      it never writes to the `questions` bank, never touches the paper
//      document, and never auto-publishes anything. The result is returned
//      to the PaperUploadEditor for faculty review.
//
//   2. confirmPaperStructure — the single server-side "Confirm". It reads
//      the paper's reviewed structure from the server (the paper document is
//      the source of truth), writes the question bank documents, points the
//      paper at them via questionIds / linkedQuestionIds, recomputes totals
//      and marks Print / Online / Bank readiness. The original file is kept
//      untouched so the paper stays printable.
//
// Hard constraints implemented here:
//   • Digital PDF / DOCX only. Scanned image files are rejected — OCR is
//     Slice 2 and must never auto-publish.
//   • No invented answers: the model is prompted to transcribe only, and any
//     correctAnswer / isCorrect material it returns is stripped server-side.
//   • Default question type is short/long answer (manual grading).
//   • content/pre-assessment/*.json is content, not a Firestore seed — it is
//     never read here.
//   • Parsing is not seeded into the bank; the bank is written on Confirm.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { extractRawText } from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import { SchemaType, type GenerateContentRequest, type ResponseSchema } from '@google/generative-ai'
import { geminiClient } from './config/aiProviders'
import {
  EDITABLE_STATES,
  REVIEW_ROLES,
  paperReadiness,
  resolvePaperStaff,
} from './paperWorkflow'

const PDF_TYPE = 'application/pdf'
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_PARSE_CHARS = 120_000
const MIN_TEXT_CHARS = 120
const MAX_PARSE_PAGES = 80
const MAX_SECTIONS = 20
const MAX_QUESTIONS = 400
const MAX_QUESTION_TEXT = 20_000
const MAX_OPTIONS = 8
const GEMINI_PARSE_MODEL = 'gemini-2.5-flash'

/** Response types that the assessment engine can schedule online. */
export const SUPPORTED_QUESTION_TYPES = new Set([
  'mcq',
  'multi_select',
  'true_false',
  'fill_in_blank',
  'short_answer',
  'long_answer',
  'numerical',
  'assertion_reason',
  'case_based',
  'matching',
])

const TYPE_ALIASES: Record<string, string> = {
  short: 'short_answer',
  shortanswer: 'short_answer',
  state: 'short_answer',
  long: 'long_answer',
  longanswer: 'long_answer',
  essay: 'long_answer',
  descriptive: 'long_answer',
  explain: 'long_answer',
  mcq: 'mcq',
  objective: 'mcq',
  multiplechoice: 'mcq',
  truefalse: 'true_false',
  tf: 'true_false',
  fillintheblank: 'fill_in_blank',
  fillintheblanks: 'fill_in_blank',
  fib: 'fill_in_blank',
  numerical: 'numerical',
  nat: 'numerical',
  assertionreason: 'assertion_reason',
  casebased: 'case_based',
  casestudy: 'case_based',
  matching: 'matching',
}

// ─── Text extraction ────────────────────────────────────────────────────────

export interface ExtractedPaperText {
  text: string
  kind: 'pdf' | 'docx'
  pages: number
}

/**
 * Pulls readable text out of a digital PDF or DOCX buffer.
 * Throws failed-precondition when no usable text layer exists (i.e. the file
 * is a scanned image — that is Slice 2 territory, never OCR-auto-publish).
 */
export async function extractPaperText(buffer: Buffer, contentType: string): Promise<ExtractedPaperText> {
  if (contentType === PDF_TYPE) {
    // maxPages is honoured by the runtime but missing from the published
    // typings, so the params are widened for the call.
    const params = {
      data: new Uint8Array(buffer),
      verbosity: 0,
      maxPages: MAX_PARSE_PAGES,
    } as unknown as Parameters<typeof pdfjsLib.getDocument>[0]
    const task = pdfjsLib.getDocument(params)
    const doc = await task.promise
    try {
      const pageParts: string[] = []
      for (let page = 1; page <= doc.numPages; page += 1) {
        const pageObj = await doc.getPage(page)
        const content = await pageObj.getTextContent()
        let pageText = ''
        for (const item of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
          if (typeof item.str === 'string') pageText += item.str
          pageText += item.hasEOL ? '\n' : ' '
        }
        pageParts.push(pageText)
      }
      return { text: pageParts.join('\n'), kind: 'pdf', pages: doc.numPages }
    } finally {
      await doc.destroy().catch(() => undefined)
    }
  }
  if (contentType === DOCX_TYPE) {
    const result = await extractRawText({ buffer })
    return { text: result.value, kind: 'docx', pages: 1 }
  }
  throw new HttpsError('invalid-argument', 'Only digital PDF and DOCX files can be parsed')
}

// ─── Gemini structuring ─────────────────────────────────────────────────────

export interface ParsedQuestion {
  text: string
  type: string
  marks: number
  topic: string
  options?: string[]
}

export interface ParsedSection {
  name: string
  instructions: string
  questions: ParsedQuestion[]
}

export interface ParsedMeta {
  title: string
  subject: string
  instructions: string
  durationMinutes: number
  totalMarks: number
}

const EMPTY_META: ParsedMeta = { title: '', subject: '', instructions: '', durationMinutes: 0, totalMarks: 0 }

const PAPER_STRUCTURE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    meta: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        subject: { type: SchemaType.STRING },
        instructions: { type: SchemaType.STRING },
        durationMinutes: { type: SchemaType.NUMBER },
        totalMarks: { type: SchemaType.NUMBER },
      },
    },
    note: { type: SchemaType.STRING },
    sections: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          instructions: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
                type: {
                  type: SchemaType.STRING,
                  format: 'enum',
                  enum: ['short_answer', 'long_answer', 'mcq', 'true_false', 'fill_in_blank', 'numerical'],
                },
                marks: { type: SchemaType.NUMBER },
                topic: { type: SchemaType.STRING },
                options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
              },
              required: ['text', 'type', 'marks'],
            },
          },
        },
        required: ['name', 'questions'],
      },
    },
  },
  required: ['meta', 'sections'],
}

export function buildParsePrompt(extractedText: string, paper: admin.firestore.DocumentData): string {
  const context = [
    `Subject (from the paper record): ${paper.subject || 'not set'}`,
    `Exam type (from the paper record): ${paper.examType || 'not set'}`,
    `Title (from the paper record): ${paper.title || 'not set'}`,
  ].join('\n')
  return `You are transcribing the structure of a question paper that a faculty member uploaded to Vriddhi, an academic platform. A text layer was extracted from the file; it is below between === markers.

${context}

=== EXTRACTED TEXT
${extractedText}
=== END OF EXTRACTED TEXT

TASK
Transcribe the question paper structure EXACTLY as printed in the extracted text. You are a transcription tool, not an author.

Respond with ONLY a JSON object in this shape:
{
  "meta": { "title": "", "subject": "", "instructions": "", "durationMinutes": 0, "totalMarks": 0 },
  "note": "",
  "sections": [
    {
      "name": "Section A",
      "instructions": "",
      "questions": [
        { "text": "", "type": "short_answer", "marks": 0, "topic": "", "options": [] }
      ]
    }
  ]
}

RULES — follow all of them exactly:
1. Include every question exactly as printed, in order. Keep sub-parts (a, b, c) inside the same question text.
2. "type" per question:
   - "short_answer" for define / state / list / give / mention / any-two / difference-type questions.
   - "long_answer" for explain / describe / discuss / derive / prove / essay-type questions.
   - "mcq" ONLY when option texts are literally printed in the extracted text; transcribe the option texts verbatim, in order, into "options".
   - "true_false", "fill_in_blank" or "numerical" only when the printed question clearly uses that format.
3. "marks": copy the marks exactly as printed next to or under the question, e.g. "(5)" or "[10 marks]". If a group of questions shares one marks figure, repeat it for each question. If no marks are printed for a question, use 0.
4. NEVER output correct answers, answer keys, model answers, or any indication of which option is right — even if the file contains an answer key, ignore it completely. The "options" array holds option texts only. Do not add "correctAnswer" or similar fields.
5. "topic": a short topic or chapter label the question covers, or "" when unclear.
6. Sections: keep printed section headings (Section A, Part B, ...). If the paper has no printed sections, return a single section named "Section A".
7. "meta": fill from printed header information (title, subject, instructions, duration in minutes, total marks). Use 0 / "" when not printed.
8. If the extracted text is NOT a question paper (a notice, a syllabus, a blank page, an image with no text), return sections: [] and a one-line "note" saying why.
9. Do not invent, complete, shorten or rewrite question text. Do not add questions that are not printed.
10. Respond with the JSON object only — no markdown fences, no commentary.`
}

export function normalizeQuestionType(value: unknown): string {
  const compact = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (TYPE_ALIASES[compact]) return TYPE_ALIASES[compact]
  if (SUPPORTED_QUESTION_TYPES.has(compact)) return compact
  // Never invent an objective format from an unknown label — default to the
  // agreed manual-graded types.
  return compact.startsWith('short') ? 'short_answer' : 'long_answer'
}

/** True when the raw label is recognised (alias or supported type). */
export function isKnownQuestionType(value: unknown): boolean {
  const compact = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return Boolean(TYPE_ALIASES[compact]) || SUPPORTED_QUESTION_TYPES.has(compact)
}

function normalizeMarks(value: unknown): number {
  const marks = Number(value)
  if (!Number.isFinite(marks) || marks < 0) return 0
  const rounded = Math.round(marks * 100) / 100
  return Math.min(rounded, 1000)
}

export interface NormalizedParse {
  meta: ParsedMeta
  sections: ParsedSection[]
  questionCount: number
  warnings: string[]
  note: string
}

/**
 * Defensively normalises the Gemini response. Any answer-bearing material the
 * model may have slipped in (correctAnswer, isCorrect, explanation) is dropped
 * on purpose — parsing must never carry answers into the platform.
 */
export function normalizeParsedStructure(raw: unknown): NormalizedParse {
  const warnings: string[] = []
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { meta: { ...EMPTY_META }, sections: [], questionCount: 0, warnings: ['The AI response could not be read.'], note: '' }
  }
  const input = raw as Record<string, unknown>

  const rawMeta = (input.meta && typeof input.meta === 'object' && !Array.isArray(input.meta) ? input.meta : {}) as Record<string, unknown>
  const meta: ParsedMeta = {
    title: String(rawMeta.title || '').trim().slice(0, 200),
    subject: String(rawMeta.subject || '').trim().slice(0, 200),
    instructions: String(rawMeta.instructions || '').trim().slice(0, 10_000),
    durationMinutes: Math.max(0, Math.min(1440, Math.round(Number(rawMeta.durationMinutes) || 0))),
    totalMarks: Math.max(0, Math.min(10_000, Math.round(Number(rawMeta.totalMarks) || 0))),
  }

  const rawSections = Array.isArray(input.sections) ? input.sections : []
  if (rawSections.length > MAX_SECTIONS) {
    warnings.push(`Only the first ${MAX_SECTIONS} sections were kept.`)
  }

  const sections: ParsedSection[] = []
  let questionCount = 0
  let droppedTypes = 0

  for (const rawSection of rawSections.slice(0, MAX_SECTIONS)) {
    if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) continue
    const section = rawSection as Record<string, unknown>
    const sourceQuestions = Array.isArray(section.questions) ? section.questions : []
    const questions: ParsedQuestion[] = []

    for (const rawQuestion of sourceQuestions) {
      if (questionCount >= MAX_QUESTIONS) break
      if (!rawQuestion || typeof rawQuestion !== 'object' || Array.isArray(rawQuestion)) continue
      const question = rawQuestion as Record<string, unknown>
      const text = String(question.text || '').replace(/\s+/g, ' ').trim()
      if (!text) continue
      const type = normalizeQuestionType(question.type)
      if (!isKnownQuestionType(question.type)) droppedTypes += 1
      const marks = normalizeMarks(question.marks)
      const topic = String(question.topic || '').trim().slice(0, 200)
      const options = ['mcq', 'multi_select', 'true_false'].includes(type) && Array.isArray(question.options)
        ? question.options.map((option) => String(option || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, MAX_OPTIONS)
        : undefined
      questions.push({
        text: text.slice(0, MAX_QUESTION_TEXT),
        type,
        marks,
        topic,
        ...(options && options.length > 0 ? { options } : {}),
      })
      questionCount += 1
    }

    if (questions.length === 0) continue
    sections.push({
      name: String(section.name || section.title || '').trim().slice(0, 200) || `Section ${sections.length + 1}`,
      instructions: String(section.instructions || '').trim().slice(0, 2_000),
      questions,
    })
  }

  if (droppedTypes > 0) {
    warnings.push(`${droppedTypes} question(s) had an unrecognised type and were kept as short/long answer.`)
  }
  if (questionCount >= MAX_QUESTIONS) {
    warnings.push(`Only the first ${MAX_QUESTIONS} questions were kept.`)
  }

  return {
    meta,
    sections,
    questionCount,
    warnings,
    note: String(input.note || '').trim().slice(0, 500),
  }
}

function extractJsonObject(raw: string): unknown {
  let text = String(raw || '').trim()
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new HttpsError('internal', 'The AI response could not be read. Try parsing again.')
  }
  const candidate = text.slice(start, end + 1)
  try {
    return JSON.parse(candidate)
  } catch {
    throw new HttpsError('internal', 'The AI response could not be read. Try parsing again.')
  }
}

// ─── parsePaperFile — assistive parse, NO bank write, NO auto-publish ──────

export interface ParsePaperFileResult {
  status: 'parsed' | 'scanned' | 'unrecognized'
  message: string
  sections: ParsedSection[]
  meta: ParsedMeta
  questionCount: number
  warnings: string[]
  fileKind: 'pdf' | 'docx'
  textLength: number
}

export const parsePaperFile = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 180, minInstances: 0, maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    const paperId = String(request.data?.paperId || '')
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    if (!paperId || paperId.includes('/') || paperId.length > 200 || !collegeId) {
      throw new HttpsError('invalid-argument', 'Paper and college identifiers are required')
    }

    const db = admin.firestore()
    const ref = db.collection('papers').doc(paperId)
    const snapshot = await ref.get()
    const paper = snapshot.data()
    if (!snapshot.exists || !paper) throw new HttpsError('not-found', 'Paper not found')
    if (staff.role !== 'superadmin' && paper.collegeId !== collegeId) {
      throw new HttpsError('permission-denied', 'Paper belongs to another college')
    }
    const isReviewer = REVIEW_ROLES.includes(staff.role)
    if (!isReviewer && paper.createdBy !== uid) {
      throw new HttpsError('permission-denied', 'Only the paper author or an authorized reviewer can parse this paper')
    }

    const path = String(paper.filePath || '')
    if (!path) {
      throw new HttpsError('failed-precondition', 'Attach a paper file first, save the paper, then parse it')
    }
    const bucket = admin.storage().bucket()
    const file = bucket.file(path)
    let metadata: Record<string, unknown>
    try {
      const metadataResult = await file.getMetadata()
      metadata = metadataResult[0]
    } catch {
      throw new HttpsError('failed-precondition', 'The attached paper file is no longer available')
    }
    const contentType = String(metadata.contentType || '')
    const size = Number(metadata.size || 0)
    if (size <= 0 || size > MAX_FILE_BYTES) {
      throw new HttpsError('invalid-argument', 'The paper file is empty or too large to parse')
    }
    if (contentType === 'image/jpeg' || contentType === 'image/png') {
      throw new HttpsError(
        'failed-precondition',
        'This file looks like a scanned image. Only digital PDF and DOCX can be parsed for now — upload the digital file or add the questions manually.'
      )
    }
    if (contentType !== PDF_TYPE && contentType !== DOCX_TYPE) {
      throw new HttpsError(
        'failed-precondition',
        'Only digital PDF and DOCX files can be parsed. Scanned images and legacy .doc files are not supported yet.'
      )
    }

    const [fileData] = await file.download()
    const extracted = await extractPaperText(Buffer.from(fileData), contentType)
    const text = extracted.text.replace(/\u0000/g, '').trim()
    if (text.length < MIN_TEXT_CHARS) {
      const result: ParsePaperFileResult = {
        status: 'scanned',
        message:
          'No readable text was found in this file — it looks like a scanned image or an image-based PDF. ' +
          'Upload the digital PDF/DOCX instead, or type the questions in manually. Scanned-image support is planned for a later update.',
        sections: [],
        meta: { ...EMPTY_META },
        questionCount: 0,
        warnings: [],
        fileKind: extracted.kind,
        textLength: text.length,
      }
      return result
    }

    const client = geminiClient()
    if (!client) {
      throw new HttpsError('failed-precondition', 'AI parsing is not configured on the server yet. Add the questions manually for now.')
    }

    const startedAt = Date.now()
    const prompt = buildParsePrompt(text.length > MAX_PARSE_CHARS ? text.slice(0, MAX_PARSE_CHARS) : text, paper)
    const parseRequest: GenerateContentRequest = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: PAPER_STRUCTURE_SCHEMA,
      },
    }
    let rawResponse: string
    try {
      const model = client.getGenerativeModel({ model: GEMINI_PARSE_MODEL })
      const response = await model.generateContent(parseRequest)
      rawResponse = response.response.text()
    } catch (err) {
      logger.error('[PaperParsing] Gemini parse failed', err)
      throw new HttpsError('internal', 'Parsing failed right now. Try again in a moment, or add the questions manually.')
    }

    const parsed = normalizeParsedStructure(extractJsonObject(rawResponse))

    // Audit trail: parsing never saves anything (savedIds stays empty).
    await db.collection('ai_generation_logs').add({
      userId: uid,
      collegeId,
      provider: 'gemini',
      model: GEMINI_PARSE_MODEL,
      kind: 'paper-parse',
      paperId,
      numQuestions: parsed.questionCount,
      config: { fileKind: extracted.kind, textLength: text.length },
      generationTime: Date.now() - startedAt,
      savedIds: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    logger.info('[PaperParsing] Paper parsed (no writes)', {
      paperId,
      collegeId,
      questionCount: parsed.questionCount,
      status: parsed.sections.length > 0 ? 'parsed' : parsed.note ? 'unrecognized' : 'scanned',
    })

    const result: ParsePaperFileResult = {
      status: parsed.sections.length > 0 ? 'parsed' : 'unrecognized',
      message:
        parsed.sections.length > 0
          ? `Transcribed ${parsed.questionCount} question(s) from the file. Review every question — especially marks — before you confirm.`
          : parsed.note || 'No questions could be found in this file. Add the questions manually, or check that the file is a digital question paper.',
      sections: parsed.sections,
      meta: parsed.meta,
      questionCount: parsed.questionCount,
      warnings: parsed.warnings,
      fileKind: extracted.kind,
      textLength: text.length,
    }
    return result
  }
)

// ─── confirmPaperStructure — the one server-side Confirm ───────────────────

export interface ConfirmSectionQuestion {
  text: string
  type: string
  marks: number
  topic: string
  options?: string[]
}

export interface ConfirmSection {
  id: string
  name: string
  questions: ConfirmSectionQuestion[]
}

/**
 * Validates the paper's stored sections into a strict confirm shape.
 * Marks must be > 0 and types must be online-schedulable — a confirmed
 * structure is what Assessments will schedule, so incomplete questions are
 * rejected here rather than surfacing later at schedule time.
 */
export function normalizeConfirmSections(sections: unknown): ConfirmSection[] {
  const source = Array.isArray(sections) ? sections.slice(0, MAX_SECTIONS) : []
  const result: ConfirmSection[] = []
  let questionCount = 0
  let order = 0
  source.forEach((rawSection, sectionIndex) => {
    if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) return
    const section = rawSection as Record<string, unknown>
    const sourceQuestions = Array.isArray(section.questions) ? section.questions : []
    const questions: ConfirmSectionQuestion[] = []
    sourceQuestions.forEach((rawQuestion) => {
      if (!rawQuestion || typeof rawQuestion !== 'object' || Array.isArray(rawQuestion)) return
      const question = rawQuestion as Record<string, unknown>
      order += 1
      const text = String(question.text || question.questionText || '').replace(/\s+/g, ' ').trim()
      if (!text) {
        throw new HttpsError('failed-precondition', `Question ${order} has no text. Open the paper editor and fix it.`)
      }
      // Confirm is strict: an unrecognised type is a data problem the faculty
      // must fix in the editor, not something to silently rewrite.
      if (!isKnownQuestionType(question.type)) {
        throw new HttpsError(
          'failed-precondition',
          `Question ${order} uses "${String(question.type || '')}", which cannot be scheduled online. Change it to a supported type.`
        )
      }
      const type = normalizeQuestionType(question.type)
      const marks = Number(question.marks)
      if (!Number.isFinite(marks) || marks <= 0) {
        throw new HttpsError('failed-precondition', `Question ${order} has no marks. Set marks before confirming.`)
      }
      if (marks > 1000) {
        throw new HttpsError('failed-precondition', `Question ${order} has more than 1000 marks.`)
      }
      if (questionCount >= MAX_QUESTIONS) {
        throw new HttpsError('failed-precondition', `A paper can contain at most ${MAX_QUESTIONS} questions.`)
      }
      const topic = String(question.topic || question.chapter || '').trim().slice(0, 200)
      const options = ['mcq', 'multi_select', 'true_false'].includes(type) && Array.isArray(question.options)
        ? question.options
            .map((option: unknown) => {
              if (typeof option === 'string') return option.trim()
              const value = (option || {}) as Record<string, unknown>
              return String(value.text || value.label || '').trim()
            })
            .filter(Boolean)
            .slice(0, MAX_OPTIONS)
        : undefined
      questions.push({
        text: text.slice(0, MAX_QUESTION_TEXT),
        type,
        marks: Math.round(marks * 100) / 100,
        topic,
        ...(options && options.length > 0 ? { options } : {}),
      })
      questionCount += 1
    })
    if (questions.length === 0) return
    result.push({
      id: String(section.id || '').trim().slice(0, 100) || `section-${sectionIndex + 1}`,
      name: String(section.name || section.title || '').trim().slice(0, 200) || `Section ${sectionIndex + 1}`,
      questions,
    })
  })
  if (result.length === 0) {
    throw new HttpsError('failed-precondition', 'Nothing to confirm — the paper has no structured questions yet.')
  }
  return result
}

/**
 * Which (state, actor) pairs may run the Confirm. Drafts and review-bounced
 * states behave like savePaper; "Ready to use" papers may be resynced by
 * their author or a reviewer; papers inside the approval queue may be
 * resynced by whoever is driving the submission; already-approved papers
 * may only be resynced by a reviewer.
 */
export function canConfirmPaperStructure(
  paper: { verificationStatus?: unknown; status?: unknown; createdBy?: unknown },
  staff: { role: string },
  uid: string
): boolean {
  const verificationStatus = String(paper.verificationStatus || paper.status || 'draft')
  const isReviewer = REVIEW_ROLES.includes(staff.role)
  const isAuthor = String(paper.createdBy || '') === uid
  if (EDITABLE_STATES.includes(verificationStatus)) return isReviewer || isAuthor
  if (verificationStatus === 'not-required' || verificationStatus === 'submitted-for-approval' || verificationStatus === 'pending-verification') {
    return isReviewer || isAuthor
  }
  if (verificationStatus === 'approved-by-hod' || verificationStatus === 'published') {
    return isReviewer
  }
  return false
}

export const confirmPaperStructure = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 180, minInstances: 0, maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    const paperId = String(request.data?.paperId || '')
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    if (!paperId || paperId.includes('/') || paperId.length > 200 || !collegeId) {
      throw new HttpsError('invalid-argument', 'Paper and college identifiers are required')
    }

    const db = admin.firestore()
    const ref = db.collection('papers').doc(paperId)
    const before = await ref.get()
    const paper = before.data()
    if (!before.exists || !paper) throw new HttpsError('not-found', 'Paper not found')
    if (staff.role !== 'superadmin' && paper.collegeId !== collegeId) {
      throw new HttpsError('permission-denied', 'Paper belongs to another college')
    }
    if (!canConfirmPaperStructure(paper, staff, uid)) {
      throw new HttpsError('failed-precondition', 'This paper cannot have its structure confirmed in its current state')
    }

    // The paper document is the source of truth — never trust a client-supplied
    // structure here; the faculty already reviewed it through the editor.
    const sections = normalizeConfirmSections(paper.sections)
    const questionCount = sections.reduce((sum, section) => sum + section.questions.length, 0)
    const totalMarks = sections.reduce(
      (sum, section) => sum + section.questions.reduce((sectionSum, question) => sectionSum + question.marks, 0),
      0
    )

    // Figure out what the paper currently points at so owned bank documents
    // are cleaned up and shared bank documents are only unlinked.
    const previousIds = (Array.isArray(paper.questionIds) ? paper.questionIds : [])
      .map((id: unknown) => String(id))
      .filter(Boolean)
    const owned: string[] = []
    const shared: string[] = []
    for (let i = 0; i < previousIds.length; i += 100) {
      const chunk = previousIds.slice(i, i + 100)
      if (chunk.length === 0) break
      const docs = await db.getAll(...chunk.map((id) => db.collection('questions').doc(id)))
      docs.forEach((docSnap) => {
        const data = docSnap.data()
        if (!data) return
        if (data.source === 'paper-confirm' && String(data.paperId || '') === paperId) owned.push(docSnap.id)
        else shared.push(docSnap.id)
      })
    }

    const questionRefs: Array<FirebaseFirestore.DocumentReference> = []
    const newIds: string[] = []
    sections.forEach((section) => {
      section.questions.forEach(() => {
        const questionRef = db.collection('questions').doc()
        questionRefs.push(questionRef)
        newIds.push(questionRef.id)
      })
    })

    // ── Write plan ─────────────────────────────────────────────────────
    // Firestore transactions cap at 500 operations and a re-confirm replaces
    // the whole owned set (deletes + creates + paper update + audit). For
    // typical papers everything therefore runs in ONE atomic transaction, so
    // a failure cannot leave orphaned bank documents behind. Only unusually
    // large papers fall back to a two-phase write (batch, then the guarded
    // paper update); their owned documents carry source/paperId tags, so a
    // subsequent confirm still cleans them up.
    const operationCount = owned.length + shared.length + questionCount + 2
    const atomic = operationCount <= 480

    const questionDocData = (
      question: ConfirmSectionQuestion,
      section: ConfirmSection,
      order: number
    ): admin.firestore.DocumentData => ({
      text: question.text,
      questionText: question.text,
      type: question.type,
      questionType: question.type,
      marks: question.marks,
      negativeMarks: 0,
      topic: question.topic,
      chapter: question.topic,
      unit: question.topic,
      subject: String(paper.subject || ''),
      branch: String(paper.branch || ''),
      batch: String(paper.batch || ''),
      semester: paper.semester,
      sectionId: section.id,
      sectionName: section.name,
      order,
      difficulty: 'medium',
      status: 'active',
      reviewed: true,
      isAIGenerated: false,
      source: 'paper-confirm',
      paperId,
      linkedPaperIds: [paperId],
      usageCount: 0,
      searchKeywords: [question.text, question.topic, paper.subject]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase()),
      createdBy: uid,
      createdByName: staff.name,
      collegeId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    interface BankWriter {
      create: (target: FirebaseFirestore.DocumentReference, data: admin.firestore.DocumentData) => void
      update: (target: FirebaseFirestore.DocumentReference, data: admin.firestore.DocumentData) => void
      delete: (target: FirebaseFirestore.DocumentReference) => void
    }
    const writeBankDocs = (writer: BankWriter) => {
      owned.forEach((id) => writer.delete(db.collection('questions').doc(id)))
      shared.forEach((id) => {
        writer.update(db.collection('questions').doc(id), {
          linkedPaperIds: admin.firestore.FieldValue.arrayRemove(paperId),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      })
      let order = 0
      sections.forEach((section) => {
        section.questions.forEach((question) => {
          order += 1
          writer.create(questionRefs[order - 1], questionDocData(question, section, order))
        })
      })
    }

    const auditRef = db.collection('paperReviewAudit').doc()
    const verificationStatus = String(paper.verificationStatus || paper.status || 'draft')
    const readiness = paperReadiness({ filePath: paper.filePath, sections, questionIds: newIds })
    const paperUpdate: admin.firestore.DocumentData = {
      // The original file (print artefact) is untouched on purpose.
      sections,
      questionIds: newIds,
      linkedQuestionIds: newIds,
      totalQuestions: questionCount,
      totalMarks,
      printReady: readiness.printReady,
      onlineReady: readiness.onlineReady,
      bankReady: readiness.bankReady,
      updatedBy: uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    const auditData = {
      paperId,
      collegeId,
      action: 'paper_structure_confirmed',
      fromStatus: verificationStatus,
      toStatus: verificationStatus,
      performedBy: uid,
      performedAt: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (atomic) {
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(ref)
        if (!current.exists || current.updateTime?.isEqual(before.updateTime!) !== true) {
          throw new HttpsError('aborted', 'Paper changed while it was being confirmed; reload and try again')
        }
        writeBankDocs(transaction)
        transaction.update(ref, paperUpdate)
        transaction.create(auditRef, auditData)
      })
    } else {
      // Two-phase write for papers too large for one transaction. The owned
      // deletes are DELAYED until after the paper update succeeds, so an
      // aborted paper transaction can never leave the paper pointing at
      // deleted documents. Batch commits are chunked below the 500-operation
      // batch limit.
      type BankOp = (batch: FirebaseFirestore.WriteBatch) => void
      const ops: BankOp[] = []
      shared.forEach((id) => {
        ops.push((batch) => {
          batch.update(db.collection('questions').doc(id), {
            linkedPaperIds: admin.firestore.FieldValue.arrayRemove(paperId),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        })
      })
      let order = 0
      sections.forEach((section) => {
        section.questions.forEach((question) => {
          order += 1
          const data = questionDocData(question, section, order)
          const target = questionRefs[order - 1]
          ops.push((batch) => batch.create(target, data))
        })
      })
      for (let i = 0; i < ops.length; i += 450) {
        const batch = db.batch()
        ops.slice(i, i + 450).forEach((op) => op(batch))
        await batch.commit()
      }
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(ref)
        if (!current.exists || current.updateTime?.isEqual(before.updateTime!) !== true) {
          throw new HttpsError('aborted', 'Paper changed while it was being confirmed; reload and try again')
        }
        transaction.update(ref, paperUpdate)
        transaction.create(auditRef, auditData)
      })
      const cleanup = db.batch()
      owned.forEach((id) => cleanup.delete(db.collection('questions').doc(id)))
      await cleanup.commit().catch((err) => {
        // Non-fatal: the stale docs are no longer referenced by the paper and
        // carry the source/paperId tags, so the next confirm removes them.
        logger.warn('[PaperParsing] Deferred cleanup of old question docs failed', err)
      })
    }

    logger.info('[PaperParsing] Paper structure confirmed', {
      paperId,
      collegeId,
      questionCount,
      replaced: previousIds.length,
    })

    return {
      status: 'confirmed',
      paperId,
      questionCount,
      questionIds: newIds,
      totalMarks,
      readiness,
    }
  }
)
