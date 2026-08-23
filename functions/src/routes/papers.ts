// src/routes/papers.ts
// Backend routes for papers + PDF generation

import express from 'express'
import puppeteer from 'puppeteer'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase'
import { verifyAuth, requireRole, AuthenticatedRequest, resolveCollegeId, assertCollegeAccess } from '../middleware/auth'

const router = express.Router()

const PAPERS_COLLECTION = 'papers'
const QUESTIONS_COLLECTION = 'questions'

const DRAFT_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor']
const APPROVE_ROLES = ['superadmin', 'admin', 'hod']
const DELETE_ROLES = ['superadmin', 'admin']

function getCollegeId(req: AuthenticatedRequest): string | undefined {
  return resolveCollegeId(req)
}

function toISO(v: unknown): string | unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString()
  return v
}

function normalizePaperDoc(docSnap: FirebaseFirestore.DocumentSnapshot): any {
  const data = docSnap.data() || {}
  return {
    ...data,
    id: docSnap.id,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  }
}

function paperQuestionIds(paper: any): string[] {
  const ids = paper?.questionIds || []
  if (Array.isArray(ids)) return ids.map(String)
  return []
}

/**
 * GET /api/papers
 * List papers for the current college.
 */
router.get('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    let snap
    if (collegeId) {
      snap = await db.collection(PAPERS_COLLECTION).where('collegeId', '==', collegeId).orderBy('createdAt', 'desc').get()
    } else if (req.user?.role === 'superadmin') {
      snap = await db.collection(PAPERS_COLLECTION).orderBy('createdAt', 'desc').get()
    } else {
      res.status(400).json({ error: 'collegeId is required' })
      return
    }
    const papers = snap.docs.map((doc) => normalizePaperDoc(doc))
    res.json({ data: papers, total: papers.length })
  } catch (err: any) {
    console.error('[papers/list]', err)
    res.status(500).json({ error: err.message || 'Failed to fetch papers' })
  }
})

/**
 * GET /api/papers/:id
 * Get a single paper.
 */
router.get('/:id', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const docRef = db.collection(PAPERS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }
    const paper = normalizePaperDoc(docSnap)
    if (!assertCollegeAccess(req, paper.collegeId)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    res.json(paper)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch paper' })
  }
})

/**
 * POST /api/papers
 * Create a paper and link its question ids on both sides.
 */
router.post('/', verifyAuth, requireRole(...DRAFT_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!collegeId) {
      res.status(400).json({ error: 'collegeId is required' })
      return
    }
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const body = req.body || {}
    const now = Timestamp.now()
    const raw = { ...body, collegeId }
    delete raw.id
    const questionIds = Array.isArray(raw.questionIds || raw.linkedQuestionIds)
      ? (raw.questionIds || raw.linkedQuestionIds).map(String)
      : []
    delete raw.questionIds
    delete raw.linkedQuestionIds

    const docRef = db.collection(PAPERS_COLLECTION).doc()
    const data = {
      ...raw,
      questionIds,
      linkedQuestionIds: questionIds,
      totalQuestions: questionIds.length,
      usageCount: raw.usageCount ?? 0,
      status: raw.status || 'draft',
      createdBy: req.user?.uid,
      createdByName: req.user?.name || 'Unknown',
      createdAt: raw.createdAt || now,
      updatedAt: now,
    }
    await docRef.set(data)

    // Link question docs back to the paper.
    const batch = db.batch()
    for (const qid of questionIds) {
      batch.update(db.collection(QUESTIONS_COLLECTION).doc(qid), {
        linkedPaperIds: FieldValue.arrayUnion(docRef.id),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    await batch.commit()

    res.status(201).json({ id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() })
  } catch (err: any) {
    console.error('[papers/create]', err)
    res.status(500).json({ error: err.message || 'Failed to create paper' })
  }
})

/**
 * PUT /api/papers/:id
 * Update a paper.
 */
router.put('/:id', verifyAuth, requireRole(...DRAFT_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const docRef = db.collection(PAPERS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }
    const current = docSnap.data() || {}
    if (!assertCollegeAccess(req, current.collegeId)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const updates = { ...(req.body || {}) }
    delete updates.id
    delete updates.collegeId
    if (updates.questionIds) {
      const ids = updates.questionIds.map(String)
      updates.questionIds = ids
      updates.linkedQuestionIds = ids
      updates.totalQuestions = ids.length
    }
    updates.updatedAt = FieldValue.serverTimestamp()
    await docRef.update(updates)
    const updated = await docRef.get()
    res.json(normalizePaperDoc(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update paper' })
  }
})

/**
 * DELETE /api/papers/:id
 * Delete a paper and unlink its questions.
 */
router.delete('/:id', verifyAuth, requireRole(...DELETE_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const docRef = db.collection(PAPERS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }
    const current = docSnap.data() || {}
    if (!assertCollegeAccess(req, current.collegeId)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const batch = db.batch()
    for (const qid of paperQuestionIds(current)) {
      batch.update(db.collection(QUESTIONS_COLLECTION).doc(qid), {
        linkedPaperIds: FieldValue.arrayRemove(req.params.id),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    batch.delete(docRef)
    await batch.commit()
    res.json({ success: true, id: req.params.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete paper' })
  }
})

/**
 * POST /api/papers/:id/duplicate
 * Duplicate a paper into a draft.
 */
router.post('/:id/duplicate', verifyAuth, requireRole(...DRAFT_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const sourceDoc = await db.collection(PAPERS_COLLECTION).doc(req.params.id).get()
    if (!sourceDoc.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }
    const source = sourceDoc.data() || {}
    if (!assertCollegeAccess(req, source.collegeId)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    const collegeId = source.collegeId || getCollegeId(req) || ''
    const now = Timestamp.now()
    const docRef = db.collection(PAPERS_COLLECTION).doc()
    const { createdAt: _c, updatedAt: _u, id: _i, status: _s, usageCount: _us, ...rest } = source
    const data = {
      ...rest,
      title: req.body?.title || `${source.title || 'Paper'} (Copy)`,
      status: 'draft',
      usageCount: 0,
      collegeId,
      createdBy: req.user?.uid,
      createdByName: req.user?.name || 'Unknown',
      createdAt: now,
      updatedAt: now,
    }
    await docRef.set(data)
    res.status(201).json({ id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to duplicate paper' })
  }
})

/**
 * POST /api/papers/:id/status
 * Update status (draft | published | archived).
 */
router.post('/:id/status', verifyAuth, requireRole(...APPROVE_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.body?.status
    if (!['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({ error: 'status must be draft, published or archived' })
      return
    }
    const docRef = db.collection(PAPERS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }
    const current = docSnap.data() || {}
    if (!assertCollegeAccess(req, current.collegeId)) {
      res.status(403).json({ message: 'Access denied' })
      return
    }
    await docRef.update({ status, updatedAt: FieldValue.serverTimestamp() })
    const updated = await docRef.get()
    res.json(normalizePaperDoc(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update status' })
  }
})

/**
 * GET /api/papers/:id/pdf
 * Generate and download a paper as proper text-based PDF
 * Requires: auth
 */
router.get('/:id/pdf', verifyAuth, async (req, res) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    // Fetch paper from Firestore
    const paperDoc = await db.collection('papers').doc(id).get()
    if (!paperDoc.exists) {
      res.status(404).json({ message: 'Paper not found' })
      return
    }

    const paper = paperDoc.data()!

    // Ownership check
    if (paper.collegeId !== user.collegeId && user.role !== 'superadmin') {
      res.status(403).json({ message: 'Access denied' })
      return
    }

    // Fetch college name
    let collegeName = 'VRIDDHI INSTITUTION'
    try {
      const collegeDoc = await db.collection('colleges').doc(paper.collegeId).get()
      if (collegeDoc.exists) {
        collegeName = collegeDoc.data()?.name || collegeName
      }
    } catch {
      // ignore
    }

    // Build HTML for PDF
    const html = buildPaperHTML(paper, collegeName, user)

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()

    // FIX: Use 'load' instead of 'networkidle0' for setContent
    await page.setContent(html, { waitUntil: 'load' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9px; width:100%; text-align:center; color:#666; padding:5px 0;">${escapeHtml(collegeName)} — ${escapeHtml(paper.title || 'Paper')}</div>`,
      footerTemplate: `<div style="font-size:9px; width:100%; text-align:center; color:#666; padding:5px 0;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated via VRIDDHI</div>`,
    })

    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${paper.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'paper'}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
    return

  } catch (error: any) {
    console.error('[PDF Generation] Error:', error)
    res.status(500).json({ message: error.message || 'Failed to generate PDF' })
    return
  }
})

// ═══════════════════════════════════════════════════════════════════════
// HTML Builders
// ═══════════════════════════════════════════════════════════════════════

function buildPaperHTML(paper: any, collegeName: string, user: any): string {
  const sections = paper.sections || []

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.6; color: #000; }
    .paper-container { max-width: 180mm; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 18px; }
    .college-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
    .exam-title { font-size: 14pt; font-weight: bold; margin-top: 6px; }
    .meta-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 11pt; }
    .meta-box { border: 1px solid #333; padding: 6px 10px; min-width: 100px; text-align: center; }
    .instructions { background: #f8f8f8; border: 1px solid #ddd; padding: 10px; margin: 12px 0; font-size: 10pt; }
    .section { margin-top: 20px; page-break-inside: avoid; }
    .section-header { font-size: 13pt; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 10px; display: flex; justify-content: space-between; }
    .question { margin: 12px 0; padding-left: 8px; page-break-inside: avoid; }
    .question-header { display: flex; align-items: flex-start; }
    .question-num { font-weight: bold; margin-right: 8px; min-width: 30px; }
    .question-text { flex: 1; }
    .marks { font-weight: bold; margin-left: 10px; white-space: nowrap; }
    .options { margin: 6px 0 6px 38px; }
    .option { margin: 3px 0; }
    .correct-answer { margin: 6px 0 6px 38px; color: #006400; font-weight: bold; }
    .explanation { margin: 6px 0 6px 38px; color: #444; font-size: 10pt; font-style: italic; }
    .footer { margin-top: 25px; text-align: center; font-size: 10pt; border-top: 1px solid #ccc; padding-top: 8px; color: #666; }
  </style>
</head>
<body>
  <div class="paper-container">
    <div class="header">
      <div class="college-name">${escapeHtml(collegeName)}</div>
      <div class="exam-title">${escapeHtml(paper.title || 'Internal Assessment')}</div>
      <div style="margin-top: 4px; font-size: 11pt;">
        Subject: ${escapeHtml(paper.subject)} | Duration: ${paper.duration} min | Max Marks: ${paper.totalMarks}
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-box">Name: _______________</div>
      <div class="meta-box">Roll No: _______________</div>
      <div class="meta-box">Date: _______________</div>
    </div>

    ${paper.instructions ? `
    <div class="instructions">
      <strong>Instructions:</strong><br/>
      ${Array.isArray(paper.instructions) ? paper.instructions.map((i: string) => escapeHtml(i)).join('<br/>• ') : escapeHtml(paper.instructions)}
      ${paper.negativeMarking ? '<br/>• Negative marking applies for wrong answers.' : ''}
      ${paper.passingPercentage ? `<br/>• Passing marks: ${paper.passingPercentage}%` : ''}
    </div>
    ` : ''}

    ${sections.map((section: any, sIdx: number) => `
      <div class="section">
        <div class="section-header">
          <span>Section ${String.fromCharCode(65 + sIdx)}: ${escapeHtml(section.name || section.title || '')}</span>
          <span>[${section.numQuestions} × ${section.marksPerQuestion} = ${section.numQuestions * section.marksPerQuestion} marks]</span>
        </div>
        ${section.instructions ? `<div style="font-size: 10pt; margin-bottom: 8px; font-style: italic;">${escapeHtml(section.instructions)}</div>` : ''}

        ${(section.questions || []).map((q: any, qIdx: number) => `
          <div class="question">
            <div class="question-header">
              <span class="question-num">Q${qIdx + 1}.</span>
              <span class="question-text">${escapeHtml(q.text)}</span>
              <span class="marks">[${q.marks || section.marksPerQuestion} marks]</span>
            </div>

            ${q.options ? `
              <div class="options">
                ${q.options.map((opt: any, oIdx: number) => `
                  <div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(opt.text || opt)}</div>
                `).join('')}
              </div>
            ` : ''}

            ${q.correctAnswer ? `<div class="correct-answer">Ans: ${escapeHtml(String(q.correctAnswer))}</div>` : ''}
            ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}

    <div class="footer">
      *** END OF QUESTION PAPER ***<br/>
      Generated via VRIDDHI Platform | ${new Date().toLocaleDateString()}
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { router }