// functions/src/routes/resume.ts
//
// Resume Builder add-on — HTTP surface.
//
//   Student (role student; superadmins may try it with ?collegeId=)
//     GET  /resume/me                    everything the page needs in one call
//     PUT  /resume/me                    autosave { data, templateId }
//     POST /resume/preview               { data?, templateId } → { html }   (watermarked, free, unlimited)
//     POST /resume/pdf                   { templateId, data? } → application/pdf  (costs ONE credit)
//     GET  /resume/downloads             own PDF history (free re-downloads)
//     GET  /resume/downloads/:id/file    stream a previously generated PDF (free)
//     POST /resume/ai/improve            { kind, text, context? } → { text }  (optional, capped)
//
//   College staff / superadmin
//     GET  /resume/admin/settings?collegeId=   settings + usage summary
//     PUT  /resume/admin/settings              superadmin only — enable, cap, templates, AI
//     POST /resume/admin/credits/reset         superadmin only — give a student their credits back
//     GET  /resume/admin/downloads?collegeId=  recent PDFs for the college
//
// Security model
//   • Identity comes from custom claims only (verifyAuth). A student can reach
//     nothing but their own `resumes/{uid}` row and their own downloads.
//   • The credit is reserved inside the SAME Firestore transaction that
//     authorises the render, before Chrome is launched. Two simultaneous clicks
//     cannot both pass; a failed render releases the credit in a second
//     transaction. Nothing about credits is trusted from the request body.
//   • PDFs are real text (Chrome print → embedded fonts). There is deliberately
//     NO client-side raster fallback for resumes: if the renderer is down the
//     student is told to retry and keeps the credit.

import express, { Response } from 'express'
import * as admin from 'firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase'
import { verifyAuth, requireRole, AuthenticatedRequest, resolveCollegeId, assertCollegeAccess } from '../middleware/auth'
import { resumeEditorLimiter, resumePdfLimiter } from '../middleware/rateLimit'
import { renderPdfToBuffer, pdfErrorResponse } from '../utils/pdfRenderer'
import { geminiClient } from '../config/aiProviders'
import {
  RESUME_TEMPLATES,
  countResumeWords,
  creditCycleKey,
  defaultResumeSettings,
  emptyCreditState,
  getResumeTemplate,
  isResumeTemplateId,
  isTemplateEnabled,
  normaliseCreditState,
  normaliseResumeSettings,
  releaseAiCall,
  releaseCredit,
  reserveAiCall,
  reserveCredit,
  resumeFileName,
  sanitizeResumeData,
  summariseCredits,
  type ResumeData,
  type ResumeSettings,
  type ResumeTemplateId,
} from '../resume/model'
import { pdfOptionsForTemplate, renderResumeHtml } from '../resume/templates'

export const router = express.Router()

const RESUMES = 'resumes'
const DOWNLOADS = 'resumeDownloads'
const AUDIT = 'resumeAudit'
const SETTINGS_DOC = 'resumeBuilder'

const STUDENT_ROLES = ['student', 'superadmin']
const STAFF_VIEW_ROLES = ['superadmin', 'admin', 'principal']

const MAX_AI_INPUT_CHARS = 1500
const RENDER_TIMEOUT_MS = 40_000

router.use(verifyAuth)

// ─── Helpers ────────────────────────────────────────────────────────────────

function settingsRef(collegeId: string) {
  return db.collection('colleges').doc(collegeId).collection('config').doc(SETTINGS_DOC)
}

async function loadSettings(collegeId: string): Promise<ResumeSettings> {
  const snap = await settingsRef(collegeId).get()
  return normaliseResumeSettings(snap.exists ? snap.data() : undefined)
}

function publicSettings(settings: ResumeSettings) {
  return {
    downloadsPerTemplate: settings.downloadsPerTemplate,
    aiAssist: settings.aiAssist,
    aiCallsPerStudent: settings.aiCallsPerStudent,
    templates: RESUME_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      tagline: t.tagline,
      bestFor: t.bestFor,
      family: t.family,
      accent: t.accent,
      defaultSectionOrder: t.defaultSectionOrder,
      enabled: isTemplateEnabled(settings, t.id),
    })),
  }
}

function toISO(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function serialiseDownload(doc: FirebaseFirestore.DocumentSnapshot) {
  const d = doc.data() || {}
  return {
    id: doc.id,
    uid: d.uid,
    templateId: d.templateId,
    templateName: d.templateName,
    version: d.version,
    cycle: d.cycle,
    fileName: d.fileName,
    sizeBytes: d.sizeBytes ?? null,
    status: d.status,
    createdAt: toISO(d.createdAt),
    readyAt: toISO(d.readyAt),
    studentName: d.studentName,
    studentEmail: d.studentEmail,
  }
}

function sortByCreatedDesc<T extends { createdAt: string | null }>(rows: T[]): T[] {
  return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

/** Student context: who they are and which college's settings apply. */
function studentContext(req: AuthenticatedRequest, res: Response): { uid: string; collegeId: string } | null {
  const uid = req.user?.uid
  const collegeId = resolveCollegeId(req)
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  if (!collegeId) {
    res.status(403).json({
      error: 'no_college',
      message: 'Your account is not linked to a college. Ask your college admin to repair your access.',
    })
    return null
  }
  return { uid, collegeId }
}

function refuseDisabled(res: Response): void {
  res.status(403).json({
    error: 'addon_disabled',
    message: 'The Resume Builder add-on is not enabled for your college yet. Ask your placement cell or college admin.',
  })
}

function refuseTemplate(res: Response, templateId: string): void {
  res.status(403).json({
    error: 'template_disabled',
    message: `The "${templateId}" template is switched off for your college.`,
  })
}

function parseTemplateId(value: unknown, res: Response): ResumeTemplateId | null {
  if (isResumeTemplateId(value)) return value
  res.status(400).json({ error: 'invalid_template', message: 'Choose one of the five resume templates.' })
  return null
}

interface StoredResume {
  data: ResumeData
  templateId: ResumeTemplateId
  credits: unknown
  updatedAt: string | null
  exists: boolean
}

function readStoredResume(snap: FirebaseFirestore.DocumentSnapshot): StoredResume {
  const d = snap.exists ? snap.data() || {} : {}
  return {
    exists: snap.exists,
    data: sanitizeResumeData(d.data),
    templateId: isResumeTemplateId(d.templateId) ? d.templateId : 'classic',
    credits: d.credits,
    updatedAt: toISO(d.updatedAt),
  }
}

async function listOwnDownloads(uid: string) {
  const snap = await db.collection(DOWNLOADS).where('uid', '==', uid).limit(200).get()
  return sortByCreatedDesc(snap.docs.map(serialiseDownload).filter((row) => row.status !== 'failed'))
}

// ─── Student: state ─────────────────────────────────────────────────────────

router.get('/me', requireRole(...STUDENT_ROLES), resumeEditorLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  try {
    const cycle = creditCycleKey()
    const settings = await loadSettings(ctx.collegeId)
    if (!settings.enabled) {
      res.json({ enabled: false, cycle, settings: publicSettings(settings), resume: null, credits: [], aiCredits: null, downloads: [] })
      return
    }
    const [snap, downloads] = await Promise.all([db.collection(RESUMES).doc(ctx.uid).get(), listOwnDownloads(ctx.uid)])
    const stored = readStoredResume(snap)
    const state = normaliseCreditState(stored.credits, cycle)
    res.json({
      enabled: true,
      cycle,
      settings: publicSettings(settings),
      resume: stored.exists ? { data: stored.data, templateId: stored.templateId, updatedAt: stored.updatedAt } : null,
      credits: summariseCredits(state, settings),
      aiCredits: {
        used: state.aiUsed,
        allowed: settings.aiAssist ? settings.aiCallsPerStudent : 0,
        remaining: settings.aiAssist ? Math.max(0, settings.aiCallsPerStudent - state.aiUsed) : 0,
      },
      downloads,
    })
  } catch (err) {
    console.error('[resume/me]', err)
    res.status(500).json({ error: 'resume_load_failed', message: 'Could not load your resume. Please retry.' })
  }
})

router.put('/me', requireRole(...STUDENT_ROLES), resumeEditorLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  const templateId = parseTemplateId(req.body?.templateId, res)
  if (!templateId) return
  try {
    const settings = await loadSettings(ctx.collegeId)
    if (!settings.enabled) return refuseDisabled(res)
    const data = sanitizeResumeData(req.body?.data)
    const ref = db.collection(RESUMES).doc(ctx.uid)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      tx.set(
        ref,
        {
          uid: ctx.uid,
          collegeId: ctx.collegeId,
          studentName: req.user?.name || data.contact.fullName || null,
          studentEmail: (req.user?.email || data.contact.email || '').toLowerCase() || null,
          templateId,
          data,
          updatedAt: FieldValue.serverTimestamp(),
          ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp(), credits: emptyCreditState(creditCycleKey()) }),
        },
        { merge: true },
      )
    })
    res.json({ ok: true, savedAt: new Date().toISOString(), words: countResumeWords(data) })
  } catch (err) {
    console.error('[resume/save]', err)
    res.status(500).json({ error: 'resume_save_failed', message: 'Could not save your resume. Your latest edits are kept in this browser; please retry.' })
  }
})

// ─── Student: preview (free) ────────────────────────────────────────────────

router.post('/preview', requireRole(...STUDENT_ROLES), resumeEditorLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  const templateId = parseTemplateId(req.body?.templateId, res)
  if (!templateId) return
  try {
    const settings = await loadSettings(ctx.collegeId)
    if (!settings.enabled) return refuseDisabled(res)
    if (!isTemplateEnabled(settings, templateId)) return refuseTemplate(res, templateId)
    let data: ResumeData
    if (req.body?.data && typeof req.body.data === 'object') {
      data = sanitizeResumeData(req.body.data)
    } else {
      data = readStoredResume(await db.collection(RESUMES).doc(ctx.uid).get()).data
    }
    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ html: renderResumeHtml(data, { templateId, mode: 'preview', watermark: true }), words: countResumeWords(data) })
  } catch (err) {
    console.error('[resume/preview]', err)
    res.status(500).json({ error: 'resume_preview_failed', message: 'Could not build the preview.' })
  }
})

// ─── Student: PDF (one credit) ──────────────────────────────────────────────

class CreditsExhaustedError extends Error {
  constructor(readonly used: number, readonly allowed: number) {
    super('credits_exhausted')
  }
}

router.post('/pdf', requireRole(...STUDENT_ROLES), resumePdfLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  const templateId = parseTemplateId(req.body?.templateId, res)
  if (!templateId) return

  const cycle = creditCycleKey()
  const resumeRef = db.collection(RESUMES).doc(ctx.uid)
  const downloadRef = db.collection(DOWNLOADS).doc()
  let settings: ResumeSettings
  let data: ResumeData
  let version = 0
  let remaining = 0

  try {
    settings = await loadSettings(ctx.collegeId)
    if (!settings.enabled) return refuseDisabled(res)
    if (!isTemplateEnabled(settings, templateId)) return refuseTemplate(res, templateId)

    const incoming = req.body?.data && typeof req.body.data === 'object' ? sanitizeResumeData(req.body.data) : null

    // 1. Reserve the credit and open the ledger row — atomically.
    data = await db.runTransaction(async (tx) => {
      const snap = await tx.get(resumeRef)
      const stored = readStoredResume(snap)
      const effective = incoming ?? stored.data
      if (!effective.contact.fullName) {
        throw Object.assign(new Error('empty_resume'), { code: 'empty_resume' })
      }
      const reserved = reserveCredit(stored.credits, templateId, settings.downloadsPerTemplate, cycle)
      if (!reserved.ok) throw new CreditsExhaustedError(reserved.used, reserved.allowed)
      version = reserved.version
      remaining = reserved.remaining
      const fileName = resumeFileName(effective, templateId, version)
      tx.set(
        resumeRef,
        {
          uid: ctx.uid,
          collegeId: ctx.collegeId,
          studentName: req.user?.name || effective.contact.fullName || null,
          studentEmail: (req.user?.email || effective.contact.email || '').toLowerCase() || null,
          templateId,
          data: effective,
          credits: reserved.state,
          lastDownloadAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      )
      tx.set(downloadRef, {
        uid: ctx.uid,
        collegeId: ctx.collegeId,
        studentName: req.user?.name || effective.contact.fullName || null,
        studentEmail: (req.user?.email || effective.contact.email || '').toLowerCase() || null,
        templateId,
        templateName: getResumeTemplate(templateId).name,
        version,
        cycle,
        fileName,
        storagePath: `resumes/${ctx.collegeId}/${ctx.uid}/${downloadRef.id}.pdf`,
        status: 'rendering',
        createdAt: FieldValue.serverTimestamp(),
      })
      return effective
    })
  } catch (err) {
    if (err instanceof CreditsExhaustedError) {
      res.status(409).json({
        error: 'credits_exhausted',
        used: err.used,
        allowed: err.allowed,
        templateId,
        message: `You have used all ${err.allowed} PDF downloads for the ${getResumeTemplate(templateId).name} template this year. Re-download an earlier version below, or pick another template.`,
      })
      return
    }
    if ((err as { code?: string })?.code === 'empty_resume') {
      res.status(400).json({ error: 'empty_resume', message: 'Add at least your name before downloading.' })
      return
    }
    console.error('[resume/pdf] reserve failed', err)
    res.status(500).json({ error: 'resume_pdf_failed', message: 'Could not start the download. No credit was used.' })
    return
  }

  // 2. Render + store. Any failure here gives the credit back.
  const storagePath = `resumes/${ctx.collegeId}/${ctx.uid}/${downloadRef.id}.pdf`
  const fileName = resumeFileName(data, templateId, version)
  try {
    const html = renderResumeHtml(data, { templateId, mode: 'print', watermark: false })
    const buffer = await renderPdfToBuffer(html, {
      pdf: pdfOptionsForTemplate(templateId),
      waitUntil: 'load',
      renderTimeoutMs: RENDER_TIMEOUT_MS,
    })

    const file = admin.storage().bucket().file(storagePath)
    await file.save(buffer, {
      contentType: 'application/pdf',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=0, no-transform',
        metadata: { uid: ctx.uid, collegeId: ctx.collegeId, templateId, version: String(version), cycle },
      },
    })

    await downloadRef.set(
      { status: 'ready', sizeBytes: buffer.length, readyAt: FieldValue.serverTimestamp() },
      { merge: true },
    )

    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', String(buffer.length))
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Resume-Download-Id', downloadRef.id)
    res.setHeader('X-Resume-Version', String(version))
    res.setHeader('X-Resume-Credits-Remaining', String(remaining))
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Resume-Download-Id, X-Resume-Version, X-Resume-Credits-Remaining')
    res.end(buffer)
  } catch (err) {
    console.error('[resume/pdf] render failed — releasing credit', err)
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(resumeRef)
        tx.set(resumeRef, { credits: releaseCredit(snap.data()?.credits, templateId, cycle) }, { merge: true })
        tx.set(downloadRef, { status: 'failed', error: err instanceof Error ? err.message.slice(0, 500) : String(err) }, { merge: true })
      })
    } catch (rollbackErr) {
      console.error('[resume/pdf] credit rollback failed', rollbackErr)
    }
    if (res.headersSent) return
    const { status, body } = pdfErrorResponse(err)
    // Resumes are never rasterised in the browser: strip the client-fallback
    // hint the paper routes use and tell the student the credit is intact.
    res.status(status).json({
      ...body,
      fallback: 'none',
      creditReleased: true,
      message:
        status === 503
          ? 'The PDF service is warming up or temporarily unavailable. Your download credit has NOT been used — please try again in a minute.'
          : `${body.message} Your download credit has NOT been used.`,
    })
  }
})

// ─── Student: history + free re-download ────────────────────────────────────

router.get('/downloads', requireRole(...STUDENT_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  try {
    res.json({ downloads: await listOwnDownloads(ctx.uid) })
  } catch (err) {
    console.error('[resume/downloads]', err)
    res.status(500).json({ error: 'resume_downloads_failed' })
  }
})

router.get('/downloads/:id/file', requireRole(...STUDENT_ROLES, ...STAFF_VIEW_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    const snap = await db.collection(DOWNLOADS).doc(String(req.params.id)).get()
    if (!snap.exists) {
      res.status(404).json({ error: 'not_found', message: 'That download no longer exists.' })
      return
    }
    const d = snap.data() || {}
    const isOwner = d.uid === uid
    const isStaffOfCollege = STAFF_VIEW_ROLES.includes(req.user?.role || '') && assertCollegeAccess(req, d.collegeId)
    if (!isOwner && !isStaffOfCollege) {
      res.status(403).json({ error: 'forbidden' })
      return
    }
    if (d.status !== 'ready' || !d.storagePath) {
      res.status(409).json({ error: 'not_ready', message: 'That PDF was not generated successfully.' })
      return
    }
    const file = admin.storage().bucket().file(String(d.storagePath))
    const [exists] = await file.exists()
    if (!exists) {
      res.status(410).json({ error: 'gone', message: 'That PDF has expired. Generate a fresh one.' })
      return
    }
    res.status(200)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${String(d.fileName || 'Resume.pdf')}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    if (d.sizeBytes) res.setHeader('Content-Length', String(d.sizeBytes))
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
    if (isOwner) {
      snap.ref.set({ redownloads: FieldValue.increment(1), lastDownloadedAt: FieldValue.serverTimestamp() }, { merge: true }).catch(() => undefined)
    }
    file
      .createReadStream()
      .on('error', (streamErr) => {
        console.error('[resume/downloads/file] stream error', streamErr)
        if (!res.headersSent) res.status(500).json({ error: 'download_failed' })
        else res.end()
      })
      .pipe(res)
  } catch (err) {
    console.error('[resume/downloads/file]', err)
    if (!res.headersSent) res.status(500).json({ error: 'download_failed' })
  }
})

// ─── Student: AI assist (optional, capped) ──────────────────────────────────

const AI_KINDS = ['summary', 'bullet', 'headline'] as const
type AiKind = (typeof AI_KINDS)[number]

function aiPrompt(kind: AiKind, text: string, context: { role?: string; program?: string }): string {
  const target = context.role ? ` for a "${context.role}" role` : ''
  const program = context.program ? ` The student is studying ${context.program}.` : ''
  const common =
    'You are an expert resume editor for Indian undergraduate students applying through campus placements and ATS portals. ' +
    'Rewrite the text below. Keep facts exactly as given — never invent numbers, employers, tools or achievements. ' +
    'Use plain ATS-friendly text: no markdown, no emojis, no quotation marks, no bullet symbols. Return ONLY the rewritten text.' +
    program
  switch (kind) {
    case 'summary':
      return `${common} Produce a professional summary${target} of 45–70 words, third person implied (no "I"), leading with the degree and strongest skills.\n\nTEXT:\n${text}`
    case 'headline':
      return `${common} Produce a one-line resume headline${target} under 12 words, e.g. "B.Com Final Year | Aspiring Financial Analyst | Tally, Excel".\n\nTEXT:\n${text}`
    case 'bullet':
    default:
      return `${common} Produce ONE achievement bullet${target} under 28 words that starts with a strong past-tense action verb and keeps any numbers from the original.\n\nTEXT:\n${text}`
  }
}

function cleanAiReply(reply: string): string {
  return reply
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\s+\n/g, '\n')
    .trim()
}

router.post('/ai/improve', requireRole(...STUDENT_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const ctx = studentContext(req, res)
  if (!ctx) return
  const kind = AI_KINDS.includes(req.body?.kind) ? (req.body.kind as AiKind) : null
  const text = typeof req.body?.text === 'string' ? req.body.text.trim().slice(0, MAX_AI_INPUT_CHARS) : ''
  if (!kind || text.length < 8) {
    res.status(400).json({ error: 'invalid_request', message: 'Give AI a sentence or two to work with.' })
    return
  }
  const context = {
    role: typeof req.body?.context?.role === 'string' ? req.body.context.role.slice(0, 120) : undefined,
    program: typeof req.body?.context?.program === 'string' ? req.body.context.program.slice(0, 120) : undefined,
  }

  const cycle = creditCycleKey()
  const resumeRef = db.collection(RESUMES).doc(ctx.uid)
  try {
    const settings = await loadSettings(ctx.collegeId)
    if (!settings.enabled) return refuseDisabled(res)
    if (!settings.aiAssist || settings.aiCallsPerStudent <= 0) {
      res.status(403).json({ error: 'ai_disabled', message: 'AI suggestions are switched off for your college.' })
      return
    }
    const gemini = geminiClient()
    if (!gemini) {
      res.status(503).json({ error: 'ai_unavailable', message: 'AI suggestions are not configured on this server.' })
      return
    }

    let remaining = 0
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(resumeRef)
        const reserved = reserveAiCall(snap.data()?.credits, settings.aiCallsPerStudent, cycle)
        if (!reserved.ok) throw new CreditsExhaustedError(reserved.used, reserved.allowed)
        remaining = reserved.remaining
        tx.set(
          resumeRef,
          {
            uid: ctx.uid,
            collegeId: ctx.collegeId,
            credits: reserved.state,
            updatedAt: FieldValue.serverTimestamp(),
            ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
          },
          { merge: true },
        )
      })
    } catch (err) {
      if (err instanceof CreditsExhaustedError) {
        res.status(409).json({ error: 'ai_exhausted', used: err.used, allowed: err.allowed, message: `You have used all ${err.allowed} AI suggestions for this year.` })
        return
      }
      throw err
    }

    try {
      const model = gemini.getGenerativeModel({ model: process.env.RESUME_AI_MODEL || 'gemini-2.5-flash' })
      const result = await model.generateContent(aiPrompt(kind, text, context))
      const reply = cleanAiReply(result.response.text() || '')
      if (!reply) throw new Error('empty AI reply')
      res.json({ text: reply.slice(0, kind === 'summary' ? 1200 : 400), remaining })
    } catch (aiErr) {
      console.warn('[resume/ai] provider failed — releasing AI credit', aiErr)
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(resumeRef)
        tx.set(resumeRef, { credits: releaseAiCall(snap.data()?.credits, cycle) }, { merge: true })
      }).catch(() => undefined)
      res.status(502).json({ error: 'ai_failed', message: 'The AI service did not answer. Your AI credit was not used — try again.' })
    }
  } catch (err) {
    console.error('[resume/ai]', err)
    res.status(500).json({ error: 'ai_failed', message: 'AI suggestion failed.' })
  }
})

// ─── Staff / superadmin ─────────────────────────────────────────────────────

function adminCollege(req: AuthenticatedRequest, res: Response): string | null {
  const collegeId = resolveCollegeId(req)
  if (!collegeId) {
    res.status(400).json({ error: 'college_required', message: 'collegeId is required.' })
    return null
  }
  if (!assertCollegeAccess(req, collegeId)) {
    res.status(403).json({ error: 'forbidden', message: 'You can only manage your own college.' })
    return null
  }
  return collegeId
}

async function usageSummary(collegeId: string, cycle: string) {
  const [resumeCount, downloadsSnap] = await Promise.all([
    db.collection(RESUMES).where('collegeId', '==', collegeId).count().get(),
    db.collection(DOWNLOADS).where('collegeId', '==', collegeId).where('cycle', '==', cycle).limit(2000).get(),
  ])
  const byTemplate: Record<string, number> = {}
  const students = new Set<string>()
  let ready = 0
  let failed = 0
  const rows = downloadsSnap.docs.map(serialiseDownload)
  for (const row of rows) {
    if (row.status === 'ready') {
      ready += 1
      byTemplate[row.templateId] = (byTemplate[row.templateId] || 0) + 1
      if (row.uid) students.add(String(row.uid))
    } else if (row.status === 'failed') failed += 1
  }
  return {
    cycle,
    resumes: resumeCount.data().count,
    downloads: ready,
    failedRenders: failed,
    studentsWithDownloads: students.size,
    byTemplate,
    recent: sortByCreatedDesc(rows.filter((r) => r.status !== 'rendering')).slice(0, 25),
  }
}

router.get('/admin/settings', requireRole(...STAFF_VIEW_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const collegeId = adminCollege(req, res)
  if (!collegeId) return
  try {
    const cycle = creditCycleKey()
    const [settingsSnap, usage] = await Promise.all([settingsRef(collegeId).get(), usageSummary(collegeId, cycle)])
    const raw = settingsSnap.exists ? settingsSnap.data() || {} : {}
    res.json({
      collegeId,
      settings: normaliseResumeSettings(raw),
      configured: settingsSnap.exists,
      updatedAt: toISO(raw.updatedAt),
      updatedBy: raw.updatedBy || null,
      templates: RESUME_TEMPLATES.map((t) => ({ id: t.id, name: t.name, tagline: t.tagline, bestFor: t.bestFor })),
      usage,
    })
  } catch (err) {
    console.error('[resume/admin/settings]', err)
    res.status(500).json({ error: 'settings_load_failed' })
  }
})

router.put('/admin/settings', requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  const collegeId = adminCollege(req, res)
  if (!collegeId) return
  try {
    const ref = settingsRef(collegeId)
    const current = await ref.get()
    const base = normaliseResumeSettings(current.exists ? current.data() : undefined, defaultResumeSettings())
    const next = normaliseResumeSettings(req.body?.settings ?? req.body, base)
    await ref.set(
      {
        ...next,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: req.user?.email || req.user?.uid || null,
      },
      { merge: true },
    )
    await db.collection(AUDIT).add({
      type: 'settings',
      collegeId,
      by: req.user?.email || req.user?.uid || null,
      at: FieldValue.serverTimestamp(),
      settings: next,
    })
    res.json({ collegeId, settings: next })
  } catch (err) {
    console.error('[resume/admin/settings:put]', err)
    res.status(500).json({ error: 'settings_save_failed' })
  }
})

router.post('/admin/credits/reset', requireRole('superadmin'), async (req: AuthenticatedRequest, res: Response) => {
  const collegeId = adminCollege(req, res)
  if (!collegeId) return
  const uid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : ''
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  const rawTemplate: unknown = req.body?.templateId
  const templateId: ResumeTemplateId | null | undefined = rawTemplate ? (isResumeTemplateId(rawTemplate) ? rawTemplate : null) : undefined
  const scope: 'pdf' | 'ai' | 'all' = req.body?.scope === 'ai' ? 'ai' : req.body?.scope === 'all' ? 'all' : 'pdf'
  if (templateId === null) {
    res.status(400).json({ error: 'invalid_template' })
    return
  }
  if (!uid && !email) {
    res.status(400).json({ error: 'student_required', message: 'Give the student\'s email or uid.' })
    return
  }
  try {
    let ref: FirebaseFirestore.DocumentReference | null = null
    if (uid) {
      const snap = await db.collection(RESUMES).doc(uid).get()
      if (snap.exists && snap.data()?.collegeId === collegeId) ref = snap.ref
    } else {
      const snap = await db.collection(RESUMES).where('collegeId', '==', collegeId).where('studentEmail', '==', email).limit(1).get()
      if (!snap.empty) ref = snap.docs[0].ref
    }
    if (!ref) {
      res.status(404).json({ error: 'not_found', message: 'No resume found for that student in this college (they may not have opened the builder yet).' })
      return
    }
    const cycle = creditCycleKey()
    const settings = await loadSettings(collegeId)
    let summary: ReturnType<typeof summariseCredits> = []
    let aiUsed = 0
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref as FirebaseFirestore.DocumentReference)
      const state = normaliseCreditState(snap.data()?.credits, cycle)
      const used = { ...state.used }
      if (scope !== 'ai') {
        if (templateId) delete used[templateId]
        else for (const key of Object.keys(used)) delete used[key as ResumeTemplateId]
      }
      const next = { cycle, used, aiUsed: scope === 'pdf' ? state.aiUsed : 0 }
      tx.set(ref as FirebaseFirestore.DocumentReference, { credits: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
      summary = summariseCredits(next, settings)
      aiUsed = next.aiUsed
    })
    await db.collection(AUDIT).add({
      type: 'credit_reset',
      collegeId,
      uid: ref.id,
      templateId: templateId || null,
      scope,
      by: req.user?.email || req.user?.uid || null,
      at: FieldValue.serverTimestamp(),
    })
    res.json({ ok: true, uid: ref.id, credits: summary, aiUsed })
  } catch (err) {
    console.error('[resume/admin/credits/reset]', err)
    res.status(500).json({ error: 'credit_reset_failed' })
  }
})

router.get('/admin/downloads', requireRole(...STAFF_VIEW_ROLES), async (req: AuthenticatedRequest, res: Response) => {
  const collegeId = adminCollege(req, res)
  if (!collegeId) return
  try {
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50))
    const cycle = typeof req.query.cycle === 'string' && req.query.cycle ? req.query.cycle : creditCycleKey()
    const snap = await db.collection(DOWNLOADS).where('collegeId', '==', collegeId).where('cycle', '==', cycle).limit(2000).get()
    res.json({ collegeId, cycle, downloads: sortByCreatedDesc(snap.docs.map(serialiseDownload)).slice(0, limit) })
  } catch (err) {
    console.error('[resume/admin/downloads]', err)
    res.status(500).json({ error: 'downloads_load_failed' })
  }
})

export default router
