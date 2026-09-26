// functions/src/routes/questionImport.ts
//
// HTTP surface for the bulk question-paper import (PYQ corpus → question bank
// drafts). Mounted at BOTH /api/question-import and /question-import, like every
// other router in index.ts.
//
//   POST /question-import/jobs                 superadmin — reserve a job + its archive path
//   POST /question-import/jobs/:jobId/run      superadmin — ONE unit of work (unpack batch | one document)
//   GET  /question-import/jobs/:jobId          superadmin — job status (resume/refresh)
//   POST /question-import/jobs/:jobId/retry    superadmin — re-queue failed documents
//
// Why one unit of work per call:
//   * the `api` function runs with a 60 s timeout — a single document (or a
//     40-entry unpack batch) always fits, a whole archive never does;
//   * the browser drives the loop, so progress is visible, resumable and
//     cancellable, and a failure costs one document instead of the whole job.
//
// Nothing here writes to `questionBank_meta` / `questionBank_content` /
// `questionReviews` except through buildImportDraftDocs(), which mirrors the
// shape the client writes for a superadmin submission — imported questions land
// as `status: 'pending'` and go through the existing Review Queue.
//
// Cost guard: the run endpoint is superadmin-only AND behind its own limiter
// (the generic aiGenerationLimiter allows 20 calls / 15 min, which an import
// loop would trip immediately). Every call writes an `ai_generation_logs` row
// with the token counts, exactly like paperParsing does.

import express, { Response } from 'express'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { db } from '../config/firebase'
import { geminiClient } from '../config/aiProviders'
import { generateWithGeminiFallback, readGeminiUsage } from '../config/aiModels'
import { verifyAuth, requireRole, AuthenticatedRequest } from '../middleware/auth'
import { importWorkerLimiter } from '../middleware/rateLimit'
import { extractPaperText } from '../paperParsing'
import {
  IMPORT_AI_MODEL,
  IMPORT_JOBS_COLLECTION,
  IMPORT_MAX_FILE_BYTES,
  IMPORT_QUESTIONS_PER_BATCH,
  IMPORT_RESPONSE_SCHEMA,
  IMPORT_UNPACK_PER_CALL,
  QUESTION_CONTENT_COLLECTION,
  QUESTION_META_COLLECTION,
  QUESTION_REVIEWS_COLLECTION,
  applyFileResult,
  applyUnpackResult,
  buildImportDraftDocs,
  buildImportPrompt,
  buildVisionImportPrompt,
  chunk,
  createImportJob,
  describeJobProgress,
  detectDocumentLanguage,
  extractJsonPayload,
  isArchiveFileName,
  isBufferTooLargeForInline,
  looksLikeLegacyFont,
  nextQueuedFile,
  normalizeDefaults,
  normalizeImportedQuestions,
  singleDocumentRow,
  validateImportUpload,
  type ImportJobDoc,
  type ImportJobFile,
} from '../questionImport'
import { readZipDirectory, readZipEntry, safeEntryName, selectZipDocuments } from '../utils/zipArchive'

export const router = express.Router()

const RUN_TIME_BUDGET_MS = 42_000
const IMPORT_PREFIX = 'question-paper-imports'

function requireSuperadmin(req: AuthenticatedRequest, res: Response): boolean {
  if (req.user?.role !== 'superadmin') {
    res.status(403).json({ error: 'Importing question papers is restricted to the platform superadmin / content team.' })
    return false
  }
  return true
}

function jobRef(jobId: string) {
  return db.collection(IMPORT_JOBS_COLLECTION).doc(jobId)
}

function bucket() {
  return admin.storage().bucket()
}

/** Storage object path for one unpacked document, inside the job's own folder. */
function documentStoragePath(job: ImportJobDoc, index: number, name: string): string {
  const dir = job.archive.storagePath.split('/').slice(0, -1).join('/')
  return `${dir}/files/${String(index).padStart(4, '0')}-${safeEntryName(name, index)}`
}

function publicJob(job: ImportJobDoc) {
  return {
    id: job.id,
    status: job.status,
    archive: { fileName: job.archive.fileName, bytes: job.archive.bytes },
    defaults: job.defaults,
    counters: job.counters,
    files: job.files,
    truncated: Boolean(job.truncated),
    error: job.error || '',
    progressLabel: describeJobProgress(job),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt || '',
  }
}

async function loadJob(req: AuthenticatedRequest, res: Response): Promise<ImportJobDoc | null> {
  const jobId = String(req.params.jobId || '')
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(jobId)) {
    res.status(400).json({ error: 'Invalid job id.' })
    return null
  }
  const snap = await jobRef(jobId).get()
  if (!snap.exists) {
    res.status(404).json({ error: 'Import job not found.' })
    return null
  }
  const job = { ...(snap.data() as ImportJobDoc), id: snap.id }
  if (job.createdBy?.uid !== req.user!.uid && req.user!.role !== 'superadmin') {
    res.status(403).json({ error: 'This import job belongs to another operator.' })
    return null
  }
  return job
}

// ─── POST /jobs — reserve a job + the archive path ──────────────────────────

router.post('/jobs', verifyAuth, requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return
  try {
    const fileName = String(req.body?.fileName || '').trim()
    const bytes = Number(req.body?.bytes) || 0
    const uploadProblem = validateImportUpload(fileName, bytes)
    if (uploadProblem) {
      res.status(400).json({ error: uploadProblem })
      return
    }

    const jobId = db.collection(IMPORT_JOBS_COLLECTION).doc().id
    const storagePath = `${IMPORT_PREFIX}/${req.user!.uid}/${jobId}/${safeEntryName(fileName, 0)}`
    const now = new Date().toISOString()
    const job = createImportJob({
      id: jobId,
      storagePath,
      fileName,
      bytes,
      defaults: normalizeDefaults(req.body?.defaults),
      author: { uid: req.user!.uid, name: req.user!.name || req.user!.email || 'Superadmin' },
      now,
    })

    await jobRef(jobId).set({ ...job, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
    logger.info('[QuestionImport] job reserved', { jobId, bytes, fileName })
    res.json({ success: true, jobId, storagePath, job: publicJob(job) })
  } catch (err: any) {
    logger.error('[QuestionImport] POST /jobs failed', err)
    res.status(500).json({ error: 'Could not start the import job.', detail: err.message })
  }
})

// ─── POST /jobs/:jobId/run — one unit of work ───────────────────────────────

router.post(
  '/jobs/:jobId/run',
  verifyAuth,
  requireRole('superadmin'),
  importWorkerLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!requireSuperadmin(req, res)) return
    const deadline = Date.now() + RUN_TIME_BUDGET_MS
    try {
      const job = await loadJob(req, res)
      if (!job) return

      if (job.status === 'complete') {
        res.json({ success: true, done: true, job: publicJob(job) })
        return
      }

      // First call after upload: confirm the file is really there.
      if (job.status === 'awaiting-upload') {
        const [metadata] = await bucket().file(job.archive.storagePath).getMetadata()
        const size = Number(metadata?.size) || 0
        if (!size) {
          res.status(400).json({ error: 'The file has not finished uploading yet. Wait for the upload to reach 100 % and try again.' })
          return
        }
        const sizeProblem = validateImportUpload(job.archive.fileName, size)
        if (sizeProblem) {
          await jobRef(job.id).update({ status: 'failed', error: sizeProblem, updatedAt: FieldValue.serverTimestamp() })
          res.status(400).json({ error: sizeProblem })
          return
        }
        if (isArchiveFileName(job.archive.fileName)) {
          await jobRef(job.id).update({ status: 'unpacking', updatedAt: FieldValue.serverTimestamp() })
          job.status = 'unpacking'
        } else {
          // A single document IS the whole upload: seed its one file row (the
          // uploaded object is the document's bytes) and go straight to parsing.
          const seeded = applyUnpackResult(
            job,
            [
              singleDocumentRow({
                name: job.archive.fileName,
                bytes: size,
                storagePath: job.archive.storagePath,
              }),
            ],
            { now: new Date().toISOString() }
          )
          await jobRef(job.id).update({
            files: seeded.files,
            counters: seeded.counters,
            status: seeded.status,
            updatedAt: FieldValue.serverTimestamp(),
          })
          job.files = seeded.files
          job.counters = seeded.counters
          job.status = seeded.status
        }
      }

      if (job.status === 'unpacking') {
        const outcome = await unpackNextBatch(job, deadline)
        const updated = outcome.job
        await jobRef(job.id).update({
          files: updated.files,
          counters: updated.counters,
          status: updated.status,
          truncated: Boolean(updated.truncated),
          error: updated.error || '',
          updatedAt: FieldValue.serverTimestamp(),
          ...(updated.status === 'complete' ? { completedAt: FieldValue.serverTimestamp() } : {}),
        })
        res.json({ success: true, done: updated.status === 'complete', job: publicJob(updated), note: outcome.note })
        return
      }

      // status === 'parsing'
      const target = nextQueuedFile(job)
      if (!target) {
        const finalised = applyFileResult(job, -1, { status: 'skipped' }, new Date().toISOString())
        await jobRef(job.id).update({
          status: 'complete',
          counters: finalised.counters,
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        res.json({ success: true, done: true, job: publicJob({ ...finalised, status: 'complete' }) })
        return
      }

      const result = await parseOneDocument(job, target, deadline)
      const updated = applyFileResult(job, target.index, result.outcome, new Date().toISOString())
      await jobRef(job.id).update({
        files: updated.files,
        counters: updated.counters,
        status: updated.status,
        error: updated.error || '',
        updatedAt: FieldValue.serverTimestamp(),
        ...(updated.status === 'complete' ? { completedAt: FieldValue.serverTimestamp() } : {}),
      })

      logger.info('[QuestionImport] document processed', {
        jobId: job.id,
        file: target.name,
        status: result.outcome.status,
        method: result.outcome.method,
        drafted: result.outcome.drafted || 0,
      })

      res.json({ success: true, done: updated.status === 'complete', job: publicJob(updated), note: result.note })
    } catch (err: any) {
      logger.error('[QuestionImport] run failed', err)
      res.status(500).json({ error: 'The import step failed. Press Continue to retry this document.', detail: err.message })
    }
  }
)

// ─── GET /jobs/:jobId ───────────────────────────────────────────────────────

router.get('/jobs/:jobId', verifyAuth, requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  if (!requireSuperadmin(req, res)) return
  try {
    const job = await loadJob(req, res)
    if (!job) return
    res.json({ success: true, job: publicJob(job) })
  } catch (err: any) {
    logger.error('[QuestionImport] GET job failed', err)
    res.status(500).json({ error: 'Could not read the import job.', detail: err.message })
  }
})

// ─── POST /jobs/:jobId/retry — re-queue failed documents ────────────────────

router.post(
  '/jobs/:jobId/retry',
  verifyAuth,
  requireRole('superadmin'),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!requireSuperadmin(req, res)) return
    try {
      const job = await loadJob(req, res)
      if (!job) return
      const files = job.files.map((f) => (f.status === 'failed' ? { ...f, status: 'queued' as const, error: undefined } : f))
      const requeued = files.filter((f) => f.status === 'queued').length
      const updated: ImportJobDoc = {
        ...job,
        files,
        status: files.some((f) => f.status === 'queued') ? 'parsing' : 'complete',
        error: '',
      }
      await jobRef(job.id).update({ files: updated.files, status: updated.status, error: '', updatedAt: FieldValue.serverTimestamp() })
      res.json({ success: true, requeued, job: publicJob(updated) })
    } catch (err: any) {
      logger.error('[QuestionImport] retry failed', err)
      res.status(500).json({ error: 'Could not re-queue the failed documents.', detail: err.message })
    }
  }
)

// ─── Unpacking ──────────────────────────────────────────────────────────────

/**
 * Reads the archive, unpacks the next IMPORT_UNPACK_PER_CALL documents into
 * their own Storage objects and appends them to the job.
 *
 * The selection is deterministic (central-directory order, junk filtered), so
 * the number of files already appended is a valid cursor — no extra state, and
 * a re-run after a crash simply continues where it stopped.
 */
async function unpackNextBatch(
  job: ImportJobDoc,
  deadline: number
): Promise<{ job: ImportJobDoc; note: string }> {
  const [archive] = await bucket().file(job.archive.storagePath).download()
  const { entries, zip64 } = readZipDirectory(archive)
  const documents = selectZipDocuments(entries)
  const alreadyUnpacked = job.files.length
  const batch = documents.slice(alreadyUnpacked, alreadyUnpacked + IMPORT_UNPACK_PER_CALL)

  if (documents.length === 0) {
    const failed = applyUnpackResult(job, [], { now: new Date().toISOString() })
    return {
      job: { ...failed, status: 'complete', error: 'No PDF or DOCX documents were found inside the archive.' },
      note: 'The archive held no readable documents.',
    }
  }

  const now = new Date().toISOString()
  const rows: ImportJobFile[] = []
  for (const entry of batch) {
    const index = alreadyUnpacked + rows.length
    const row: ImportJobFile = {
      index,
      name: entry.name,
      bytes: entry.size,
      status: 'queued',
    }
    try {
      if (entry.zip64) throw new Error('ZIP64 entries are not supported — re-zip this document separately.')
      if (entry.size > IMPORT_MAX_FILE_BYTES) {
        throw new Error(
          `Document is ${(entry.size / 1024 / 1024).toFixed(1)} MB; the per-document limit is ${Math.round(
            IMPORT_MAX_FILE_BYTES / 1024 / 1024
          )} MB.`
        )
      }
      if (Date.now() > deadline) throw new Error('Timed out while unpacking — press Continue to resume from here.')
      const data = readZipEntry(archive, entry)
      const storagePath = documentStoragePath(job, index, entry.name)
      await bucket().file(storagePath).save(data, {
        contentType: guessContentType(entry.name),
        resumable: false,
        metadata: { cacheControl: 'private, max-age=0, no-transform', metadata: { importJobId: job.id } },
      })
      row.storagePath = storagePath
    } catch (err: any) {
      row.status = 'failed'
      row.error = err.message || 'Could not unpack this document.'
    }
    rows.push(row)
  }

  const updated = applyUnpackResult(job, rows, { now })
  const note = zip64
    ? 'The archive uses ZIP64 — very large entries may have been skipped.'
    : `Unpacked ${rows.length} of ${documents.length} document(s).`
  return { job: updated, note }
}

function guessContentType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (lower.endsWith('.doc')) return 'application/msword'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

// ─── One document → pending questions ───────────────────────────────────────

interface RunOutcome {
  status: 'done' | 'failed' | 'skipped'
  method?: string
  pages?: number
  language?: string
  questionCount?: number
  drafted?: number
  duplicates?: number
  error?: string
}

async function parseOneDocument(
  job: ImportJobDoc,
  file: ImportJobFile,
  deadline: number
): Promise<{ outcome: RunOutcome; note: string }> {
  const now = new Date().toISOString()
  if (!file.storagePath) {
    return { outcome: { status: 'failed', error: 'The document was not unpacked — retry the archive.' }, note: '' }
  }

  const startedAt = Date.now()
  let buffer: Buffer
  try {
    const [data] = await bucket().file(file.storagePath).download()
    buffer = data
  } catch (err: any) {
    return { outcome: { status: 'failed', error: `Could not read the document from storage: ${err.message}` }, note: '' }
  }

  const contentType = guessContentType(file.name)
  const isPdf = contentType === 'application/pdf'

  // 1. Digital text first — free, no tokens, and it is what most modern papers need.
  let text = ''
  let pages = 0
  let legacyFont = false
  if (isPdf || contentType.includes('wordprocessing')) {
    try {
      const extracted = await extractPaperText(buffer, contentType)
      text = String(extracted.text || '')
      pages = Number(extracted.pages) || 0
      legacyFont = looksLikeLegacyFont(text)
    } catch (err: any) {
      logger.warn('[QuestionImport] text extraction failed; falling back to the model', { file: file.name, err: err.message })
    }
  }

  const needsVision = !text || text.trim().length < 120 || legacyFont
  if (needsVision && !isPdf) {
    return {
      outcome: {
        status: 'failed',
        error: 'No usable text was found and this file type cannot be read visually. Re-export it as a PDF.',
        pages,
        language: text ? detectDocumentLanguage(text) : undefined,
      },
      note: '',
    }
  }
  if (needsVision && isBufferTooLargeForInline(buffer.length)) {
    return {
      outcome: {
        status: 'failed',
        error: `This looks like a scan but is ${(buffer.length / 1024 / 1024).toFixed(1)} MB — too large to read visually in one call. Split it (e.g. 5 pages per file) and re-import.`,
        pages,
        language: text ? detectDocumentLanguage(text) : undefined,
      },
      note: '',
    }
  }

  const client = geminiClient()
  if (!client) {
    return {
      outcome: {
        status: 'failed',
        error: 'AI is not configured on the server (GEMINI_API_KEY missing), so nothing could be transcribed.',
        pages,
      },
      note: '',
    }
  }

  const method = needsVision ? 'ai-vision' : 'ai-text'
  const prompt = needsVision
    ? buildVisionImportPrompt({ fileName: file.name })
    : buildImportPrompt({ fileName: file.name, text: text.slice(0, 120_000), totalPages: pages })

  const parts: Array<Record<string, unknown>> = [{ text: prompt }]
  if (needsVision) {
    parts.push({ inlineData: { mimeType: contentType, data: buffer.toString('base64') } })
  }

  let rawText = ''
  let usedModel = IMPORT_AI_MODEL
  let tokensIn = 0
  let tokensOut = 0
  let thoughts = 0
  try {
    // Tier + in-Gemini fallback: a retired model id moves to the next entry
    // instead of failing every document in the corpus.
    const generated = await generateWithGeminiFallback('quality', (modelId) =>
      client
        .getGenerativeModel({
          model: modelId,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: IMPORT_RESPONSE_SCHEMA,
          },
        })
        .generateContent(parts as never),
    {
      onFallback: ({ failedModel, nextModel, error }) =>
        logger.warn('[QuestionImport] Gemini model unavailable, trying next tier entry', {
          failedModel,
          nextModel,
          error: (error as Error)?.message,
        }),
    },
    )
    rawText = generated.result.response.text()
    usedModel = generated.model
    const usage = readGeminiUsage((generated.result.response as any).usageMetadata)
    tokensIn = usage.tokensIn
    tokensOut = usage.tokensOut
    // 3.x models bill thinking tokens as output — count them so the log is honest.
    thoughts = usage.thinkingTokens
  } catch (err: any) {
    logger.error('[QuestionImport] transcription failed', { file: file.name, err: err?.message })
    return {
      outcome: {
        status: 'failed',
        method,
        pages,
        error: `The model could not read this document (${err?.message || 'unknown error'}). Press Retry failed documents to try again.`,
      },
      note: '',
    }
  }

  const parsed = extractJsonPayload(rawText)
  const { questions, meta, warnings } = normalizeImportedQuestions(parsed, {})
  if (questions.length === 0) {
    return {
      outcome: {
        status: 'failed',
        method,
        pages,
        language: meta.language || (text ? detectDocumentLanguage(text) : undefined),
        error: 'No questions could be found in this document. Check that it is a question paper and retry.',
      },
      note: warnings.join(' '),
    }
  }

  const paperMeta = {
    ...meta,
    examYear: meta.examYear || job.defaults.examYear || 0,
  }

  // 2. Within-document duplicates: the same question printed twice in one paper
  //    would otherwise create two drafts the reviewer has to reject by hand.
  const seen = new Set<string>()
  const drafts = []
  for (const question of questions) {
    const docs = buildImportDraftDocs(
      question,
      {
        jobId: job.id,
        fileIndex: file.index,
        fileName: file.name,
        defaults: job.defaults,
        paper: paperMeta,
        author: job.createdBy,
        now,
        newId: () => db.collection(QUESTION_META_COLLECTION).doc().id,
      },
      { pages, method, language: meta.language || detectDocumentLanguage(text) }
    )
    if (seen.has(docs.fingerprint)) continue
    seen.add(docs.fingerprint)
    drafts.push(docs)
  }

  // 3. Write the drafts. 3 documents per question, 400 writes per batch.
  try {
    for (const group of chunk(drafts, IMPORT_QUESTIONS_PER_BATCH)) {
      const batch = db.batch()
      for (const docs of group) {
        batch.set(db.collection(QUESTION_META_COLLECTION).doc(String(docs.meta.id)), docs.meta)
        batch.set(db.collection(QUESTION_CONTENT_COLLECTION).doc(String(docs.content.id)), docs.content)
        batch.set(db.collection(QUESTION_REVIEWS_COLLECTION).doc(String(docs.review.id)), docs.review)
      }
      await batch.commit()
      if (Date.now() > deadline) break
    }
  } catch (err: any) {
    logger.error('[QuestionImport] draft write failed', { file: file.name, err: err.message })
    return {
      outcome: {
        status: 'failed',
        method,
        pages,
        language: meta.language,
        questionCount: questions.length,
        drafted: 0,
        error: `Questions were read but could not be saved as drafts (${err.message}).`,
      },
      note: warnings.join(' '),
    }
  }

  // 4. Audit trail — the same shape paperParsing writes, including thinking tokens.
  await db.collection('ai_generation_logs').add({
    userId: job.createdBy.uid,
    collegeId: null,
    provider: 'gemini',
    model: usedModel,
    method,
    kind: 'question-paper-import',
    importJobId: job.id,
    fileName: file.name,
    numQuestions: drafts.length,
    config: { pages, textLength: text.length, legacyFont, language: meta.language },
    tokensIn,
    tokensOut,
    thoughts,
    generationTime: Date.now() - startedAt,
    savedIds: [],
    createdAt: FieldValue.serverTimestamp(),
  })

  const note = warnings.length ? warnings.join(' ') : ''
  return {
    outcome: {
      status: 'done',
      method,
      pages,
      language: meta.language || (text ? detectDocumentLanguage(text) : undefined),
      questionCount: drafts.length,
      drafted: drafts.length,
      duplicates: questions.length - drafts.length,
    },
    note,
  }
}
