// functions/src/routes/questions.ts
// Questions CRUD, linking, stats, PYQ config and PDF export.
// All routes require a verified Firebase auth user.

import express from 'express'
import puppeteer from 'puppeteer'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db } from '../config/firebase'
import { verifyAuth, requireRole, AuthenticatedRequest, resolveCollegeId, assertCollegeAccess } from '../middleware/auth'

const router = express.Router()

const QUESTIONS_COLLECTION = 'questions'
const PAPERS_COLLECTION = 'papers'

const DRAFT_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor']
const BULK_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty']
const DELETE_ROLES = ['superadmin', 'admin']

function getCollegeId(req: AuthenticatedRequest): string | undefined {
  return resolveCollegeId(req)
}

function toISO(v: unknown): string | unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString()
  return v
}

function normalizeSnapshotDoc(docSnap: FirebaseFirestore.DocumentSnapshot): any {
  const data = docSnap.data() || {}
  return {
    ...data,
    id: docSnap.id,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
    createdBy: data.createdBy || data.generatedBy || 'unknown',
    createdByName: data.createdByName || data.generatedByName || 'Unknown',
    status: data.status || 'active',
    text: data.text || data.questionText || data.content || '',
    type: data.type || data.questionType || 'mcq',
    marks: data.marks ?? data.marksPerQuestion ?? 1,
    tags: data.tags || data.tagList || [],
    subject: data.subject || data.course || '',
    difficulty: data.difficulty || 'medium',
  }
}

function buildSearchKeywords(q: any): string[] {
  return [
    q?.text,
    q?.subject,
    q?.topic,
    q?.chapter,
    q?.unit,
    ...(Array.isArray(q?.tags) ? q.tags : []),
  ]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase())
}

async function fetchCollegeQuestions(collegeId?: string, isSuperadmin = false): Promise<any[]> {
  const ref = db.collection(QUESTIONS_COLLECTION)
  let snap: FirebaseFirestore.QuerySnapshot
  if (collegeId) {
    snap = await ref.where('collegeId', '==', collegeId).orderBy('createdAt', 'desc').get()
  } else if (isSuperadmin) {
    snap = await ref.orderBy('createdAt', 'desc').get()
  } else {
    return []
  }
  return snap.docs.map((doc) => normalizeSnapshotDoc(doc))
}

// ═══════════════════════════════════════════════════════════════════════
// STATIC ROUTES (registered before /:id)
// ═══════════════════════════════════════════════════════════════════════

// GET /api/questions/stats
router.get('/stats', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const all = await fetchCollegeQuestions(collegeId, req.user?.role === 'superadmin')
    const stats = {
      total: 0,
      bySubject: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byBatch: {} as Record<string, number>,
      byBranch: {} as Record<string, number>,
      pyqCount: 0,
      linkedCount: 0,
      unusedCount: 0,
    }

    for (const q of all) {
      const subject = q.subject || q.course || 'Unknown'
      const type = q.type || q.questionType || 'unknown'
      const difficulty = q.difficulty || 'medium'
      const batch = q.batch || 'Unspecified'
      const branch = q.branch || 'Unspecified'

      stats.total++
      stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1
      stats.byType[type] = (stats.byType[type] || 0) + 1
      stats.byBatch[batch] = (stats.byBatch[batch] || 0) + 1
      stats.byBranch[branch] = (stats.byBranch[branch] || 0) + 1
      if (q.isPYQ) stats.pyqCount++
      if ((q.linkedPaperIds || []).length > 0) stats.linkedCount++
      if ((q.usageCount || 0) === 0) stats.unusedCount++
    }

    res.json(stats)
  } catch (err: any) {
    console.error('[questions/stats]', err)
    res.status(500).json({ error: err.message || 'Failed to fetch stats' })
  }
})

// GET /api/questions/batch-branch
router.get('/batch-branch', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (!collegeId) {
      res.status(400).json({ error: 'collegeId is required' })
      return
    }

    const configDoc = await db.collection('college_configs').doc(collegeId).get()
    const config = configDoc.data()
    res.json({
      batches: config?.batches || ['2021-22', '2022-23', '2023-24', '2024-25'],
      branches: config?.branches || ['CSE', 'ECE', 'ME', 'CE', 'IT', 'EEE'],
      academicYears: config?.academicYears || ['1st Year', '2nd Year', '3rd Year', '4th Year'],
    })
  } catch (err: any) {
    console.error('[questions/batch-branch]', err)
    res.status(500).json({ error: err.message || 'Failed to load config' })
  }
})

// GET /api/questions/pyq/years
router.get('/pyq/years', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const all = await fetchCollegeQuestions(collegeId)
    const years = new Set<string>()
    for (const q of all) {
      if (q.isPYQ && q.examYear) years.add(String(q.examYear))
    }
    res.json(Array.from(years).sort().reverse())
  } catch (err: any) {
    console.error('[questions/pyq/years]', err)
    res.status(500).json({ error: err.message || 'Failed to fetch PYQ years' })
  }
})

// GET /api/questions/pyq/names
router.get('/pyq/names', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const examYear = (req.query.examYear as string | undefined)?.trim()
    const all = await fetchCollegeQuestions(collegeId)
    const names = new Set<string>()
    for (const q of all) {
      if (q.isPYQ && q.examName && (!examYear || String(q.examYear) === examYear)) {
        names.add(String(q.examName))
      }
    }
    res.json(Array.from(names).sort())
  } catch (err: any) {
    console.error('[questions/pyq/names]', err)
    res.status(500).json({ error: err.message || 'Failed to fetch PYQ names' })
  }
})

// GET /api/questions/duplicates
router.get('/duplicates', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    const text = (req.query.text as string || '').trim()
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (!text) {
      res.json([])
      return
    }

    const all = await fetchCollegeQuestions(collegeId)
    const textWords = new Set(text.toLowerCase().split(/\s+/))
    const candidates = all.filter((q: any) => {
      const qText = String(q.text || '').toLowerCase()
      if (!qText) return false
      const qWords = new Set(qText.split(/\s+/))
      const intersection = new Set([...textWords].filter((x) => qWords.has(x)))
      const union = new Set([...textWords, ...qWords])
      return intersection.size / (union.size || 1) >= 0.85
    })
    res.json(candidates.slice(0, 50))
  } catch (err: any) {
    console.error('[questions/duplicates]', err)
    res.status(500).json({ error: err.message || 'Failed to detect duplicates' })
  }
})

// GET /api/questions
router.get('/', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const collegeId = getCollegeId(req)
    if (!assertCollegeAccess(req, collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const pageSize = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10) || 20, 1), 100)
    const filters = req.query as any
    let all = await fetchCollegeQuestions(collegeId)

    const subject = (filters.subject || '').toString().trim()
    const type = (filters.type || '').toString().trim()
    const difficulty = (filters.difficulty || '').toString().trim()
    const unit = (filters.unit || '').toString().trim()
    const batch = (filters.batch || '').toString().trim()
    const branch = (filters.branch || '').toString().trim()
    const status = (filters.status || '').toString().trim()
    const examYear = (filters.examYear || '').toString().trim()
    const examName = (filters.examName || '').toString().trim()
    const createdBy = (filters.createdBy || '').toString().trim()
    const tag = (filters.tag || '').toString().trim()
    const tags = Array.isArray(filters.tags) ? filters.tags.map(String) : []
    const searchTerm = (filters.searchQuery || filters.search || '').toString().trim().toLowerCase()
    const hasPYQ = filters.isPYQ !== undefined && filters.isPYQ !== ''
    const isPYQ = filters.isPYQ === 'true' || filters.isPYQ === true

    if (subject) all = all.filter((q) => q.subject === subject)
    if (type) all = all.filter((q) => q.type === type)
    if (difficulty) all = all.filter((q) => q.difficulty === difficulty)
    if (unit) all = all.filter((q) => q.unit === unit)
    if (batch) all = all.filter((q) => q.batch === batch)
    if (branch) all = all.filter((q) => q.branch === branch)
    if (status) all = all.filter((q) => q.status === status)
    if (examYear) all = all.filter((q) => q.examYear === examYear)
    if (examName) all = all.filter((q) => q.examName === examName)
    if (createdBy) all = all.filter((q) => q.createdBy === createdBy)
    if (hasPYQ) all = all.filter((q) => !!q.isPYQ === isPYQ)
    if (tag || tags.length) {
      const value = tag || tags[0]
      all = all.filter((q) => (q.tags || []).includes(value))
    }
    if (searchTerm) {
      all = all.filter((q) =>
        String(q.text || '').toLowerCase().includes(searchTerm) ||
        String(q.subject || '').toLowerCase().includes(searchTerm) ||
        String(q.topic || '').toLowerCase().includes(searchTerm) ||
        (q.tags || []).some((t: string) => String(t).toLowerCase().includes(searchTerm))
      )
    }

    const data = all.slice(0, pageSize)
    res.json({
      data,
      total: all.length,
      page: 1,
      limit: pageSize,
      totalPages: Math.ceil(all.length / pageSize) || 1,
      lastDoc: data.length > 0 ? data[data.length - 1].id : null,
      lastDocRef: null,
      hasMore: all.length > pageSize,
    })
  } catch (err: any) {
    console.error('[questions/list]', err)
    res.status(500).json({ error: err.message || 'Failed to fetch questions' })
  }
})

// POST /api/questions
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

    const docRef = db.collection(QUESTIONS_COLLECTION).doc()
    const data = {
      ...raw,
      searchKeywords: buildSearchKeywords(raw),
      usageCount: raw.usageCount ?? 0,
      linkedPaperIds: raw.linkedPaperIds || [],
      createdBy: req.user?.uid,
      createdByName: req.user?.name || 'Unknown',
      createdAt: raw.createdAt || now,
      updatedAt: now,
    }
    await docRef.set(data)
    res.status(201).json({ id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() })
  } catch (err: any) {
    console.error('[questions/create]', err)
    res.status(500).json({ error: err.message || 'Failed to create question' })
  }
})

// POST /api/questions/bulk
router.post('/bulk', verifyAuth, requireRole(...BULK_ROLES), async (req: AuthenticatedRequest, res) => {
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

    const questions = Array.isArray(req.body?.questions) ? req.body.questions : []
    if (questions.length === 0) {
      res.status(400).json({ error: 'questions array is required' })
      return
    }

    const batch = db.batch()
    const ids: string[] = []
    const now = Timestamp.now()

    for (const q of questions) {
      const docRef = db.collection(QUESTIONS_COLLECTION).doc()
      const raw = { ...q, collegeId }
      delete raw.id
      const data = {
        ...raw,
        searchKeywords: buildSearchKeywords(raw),
        usageCount: raw.usageCount ?? 0,
        linkedPaperIds: raw.linkedPaperIds || [],
        createdBy: req.user?.uid,
        createdByName: req.user?.name || 'Unknown',
        createdAt: raw.createdAt || now,
        updatedAt: now,
      }
      batch.set(docRef, data)
      ids.push(docRef.id)
    }

    await batch.commit()
    res.json({
      success: ids.length,
      total: questions.length,
      failed: questions.length - ids.length,
      errors: [],
      importedIds: ids,
      createdIds: ids,
    })
  } catch (err: any) {
    console.error('[questions/bulk]', err)
    res.status(500).json({ error: err.message || 'Failed to bulk create questions' })
  }
})

// POST /api/questions/export/pdf
router.post('/export/pdf', verifyAuth, requireRole(...DRAFT_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const { questionIds, title } = req.body || {}
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      res.status(400).json({ message: 'questionIds array required' })
      return
    }

    const questions: any[] = []
    for (const qid of questionIds) {
      const qDoc = await db.collection(QUESTIONS_COLLECTION).doc(String(qid)).get()
      if (qDoc.exists) {
        const q = qDoc.data()
        if (assertCollegeAccess(req, q?.collegeId)) {
          questions.push(normalizeSnapshotDoc(qDoc))
        }
      }
    }

    const html = buildQuestionsHTML(questions, title || 'Question Export')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    })
    await browser.close()

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${(title || 'questions').replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (error: any) {
    console.error('[Questions PDF] Error:', error)
    res.status(500).json({ message: error.message || 'Failed to generate PDF' })
  }
})

// ═══════════════════════════════════════════════════════════════════════
// DYNAMIC ROUTES
// ═══════════════════════════════════════════════════════════════════════

// GET /api/questions/:id/papers
router.get('/:id/papers', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const qDoc = await db.collection(QUESTIONS_COLLECTION).doc(req.params.id).get()
    if (!qDoc.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const q = qDoc.data() || {}
    if (!assertCollegeAccess(req, q.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const ids = q.linkedPaperIds || []
    const papers: any[] = []
    for (const pid of ids) {
      const pDoc = await db.collection(PAPERS_COLLECTION).doc(String(pid)).get()
      if (pDoc.exists) papers.push({ id: pDoc.id, ...pDoc.data() })
    }
    res.json(papers)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch linked papers' })
  }
})

// POST /api/questions/:id/link
router.post('/:id/link', verifyAuth, requireRole(...BULK_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const { paperId } = req.body || {}
    if (!paperId) {
      res.status(400).json({ error: 'paperId is required' })
      return
    }
    const qDoc = await db.collection(QUESTIONS_COLLECTION).doc(req.params.id).get()
    if (!qDoc.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const pDoc = await db.collection(PAPERS_COLLECTION).doc(String(paperId)).get()
    if (!pDoc.exists) {
      res.status(404).json({ error: 'Paper not found' })
      return
    }
    const q = qDoc.data() || {}
    if (!assertCollegeAccess(req, q.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const batch = db.batch()
    batch.update(db.collection(QUESTIONS_COLLECTION).doc(req.params.id), {
      linkedPaperIds: FieldValue.arrayUnion(String(paperId)),
      updatedAt: FieldValue.serverTimestamp(),
    })
    batch.update(db.collection(PAPERS_COLLECTION).doc(String(paperId)), {
      questionIds: FieldValue.arrayUnion(req.params.id),
      linkedQuestionIds: FieldValue.arrayUnion(req.params.id),
      updatedAt: FieldValue.serverTimestamp(),
    })
    await batch.commit()
    res.json({ success: true, questionId: req.params.id, paperId })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to link question' })
  }
})

// POST /api/questions/:id/unlink
router.post('/:id/unlink', verifyAuth, requireRole(...BULK_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const { paperId } = req.body || {}
    if (!paperId) {
      res.status(400).json({ error: 'paperId is required' })
      return
    }
    const qDoc = await db.collection(QUESTIONS_COLLECTION).doc(req.params.id).get()
    if (!qDoc.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const q = qDoc.data() || {}
    if (!assertCollegeAccess(req, q.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const batch = db.batch()
    batch.update(db.collection(QUESTIONS_COLLECTION).doc(req.params.id), {
      linkedPaperIds: FieldValue.arrayRemove(String(paperId)),
      updatedAt: FieldValue.serverTimestamp(),
    })
    batch.update(db.collection(PAPERS_COLLECTION).doc(String(paperId)), {
      questionIds: FieldValue.arrayRemove(req.params.id),
      linkedQuestionIds: FieldValue.arrayRemove(req.params.id),
      updatedAt: FieldValue.serverTimestamp(),
    })
    await batch.commit()
    res.json({ success: true, questionId: req.params.id, paperId })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to unlink question' })
  }
})

// POST /api/questions/:id/clone
router.post('/:id/clone', verifyAuth, requireRole(...BULK_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const sourceDoc = await db.collection(QUESTIONS_COLLECTION).doc(req.params.id).get()
    if (!sourceDoc.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const source = sourceDoc.data() || {}
    if (!assertCollegeAccess(req, source.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const now = Timestamp.now()
    const docRef = db.collection(QUESTIONS_COLLECTION).doc()
    const { createdAt: _c, updatedAt: _u, usageCount: _us, linkedPaperIds: _lp, ...rest } = source
    const overrides = { ...(req.body?.overrides || {}) }
    delete overrides.collegeId
    delete overrides.createdBy
    const data = {
      ...rest,
      ...overrides,
      collegeId: source.collegeId,
      createdBy: req.user?.uid,
      createdByName: req.user?.name || 'Unknown',
      searchKeywords: buildSearchKeywords(rest),
      linkedPaperIds: [],
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    await docRef.set(data)
    res.status(201).json({ id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clone question' })
  }
})

// GET /api/questions/:id
router.get('/:id', verifyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const docSnap = await db.collection(QUESTIONS_COLLECTION).doc(req.params.id).get()
    if (!docSnap.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const normalized = normalizeSnapshotDoc(docSnap)
    if (!assertCollegeAccess(req, normalized.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    res.json(normalized)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch question' })
  }
})

// PUT /api/questions/:id
router.put('/:id', verifyAuth, requireRole(...DRAFT_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const docRef = db.collection(QUESTIONS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const current = docSnap.data() || {}
    if (!assertCollegeAccess(req, current.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const updates = { ...(req.body || {}) }
    delete updates.id
    delete updates.collegeId
    const merged = { ...current, ...updates }
    updates.updatedAt = FieldValue.serverTimestamp()
    if (updates.text || updates.subject || updates.topic || updates.chapter || updates.tags) {
      updates.searchKeywords = buildSearchKeywords(merged)
    }

    await docRef.update(updates)
    const updated = await docRef.get()
    res.json(normalizeSnapshotDoc(updated))
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update question' })
  }
})

// DELETE /api/questions/:id
router.delete('/:id', verifyAuth, requireRole(...DELETE_ROLES), async (req: AuthenticatedRequest, res) => {
  try {
    const docRef = db.collection(QUESTIONS_COLLECTION).doc(req.params.id)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      res.status(404).json({ error: 'Question not found' })
      return
    }
    const current = docSnap.data() || {}
    if (!assertCollegeAccess(req, current.collegeId)) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const batch = db.batch()
    for (const paperId of current.linkedPaperIds || []) {
      batch.update(db.collection(PAPERS_COLLECTION).doc(String(paperId)), {
        questionIds: FieldValue.arrayRemove(req.params.id),
        linkedQuestionIds: FieldValue.arrayRemove(req.params.id),
        updatedAt: FieldValue.serverTimestamp(),
      })
    }
    batch.delete(docRef)
    await batch.commit()
    res.json({ success: true, id: req.params.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete question' })
  }
})

// ═══════════════════════════════════════════════════════════════════════
// PDF helper
// ═══════════════════════════════════════════════════════════════════════

function buildQuestionsHTML(questions: any[], title: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
    .container { max-width: 180mm; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
    .title { font-size: 16pt; font-weight: bold; }
    .subtitle { font-size: 11pt; color: #666; margin-top: 4px; }
    .question { margin: 15px 0; padding: 10px; border: 1px solid #ddd; page-break-inside: avoid; }
    .question-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .question-meta { font-size: 9pt; color: #666; }
    .question-text { font-weight: 500; margin-bottom: 6px; }
    .options { margin-left: 20px; }
    .option { margin: 3px 0; }
    .answer { margin-top: 6px; padding: 6px; background: #f0f8f0; border-left: 3px solid #006400; }
    .explanation { margin-top: 4px; font-size: 10pt; color: #444; font-style: italic; }
    .footer { margin-top: 20px; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${escapeHtml(title)}</div>
      <div class="subtitle">${questions.length} Questions | Generated on ${new Date().toLocaleDateString()}</div>
    </div>

    ${questions.map((q, idx) => `
      <div class="question">
        <div class="question-header">
          <span class="question-meta">#${idx + 1} | ${escapeHtml(q.type)} | ${escapeHtml(q.difficulty)} | ${q.marks} marks</span>
          <span class="question-meta">${escapeHtml(q.subject)}${q.chapter ? ' > ' + escapeHtml(q.chapter) : ''}</span>
        </div>
        <div class="question-text">${escapeHtml(q.text)}</div>

        ${q.options ? `
          <div class="options">
            ${(Array.isArray(q.options) ? q.options : Object.values(q.options)).map((opt: any, oIdx: number) => `
              <div class="option">${String.fromCharCode(65 + oIdx)}. ${escapeHtml(opt.text || opt)} ${opt.isCorrect ? '✓' : ''}</div>
            `).join('')}
          </div>
        ` : ''}

        ${q.correctAnswer ? `<div class="answer"><strong>Answer:</strong> ${escapeHtml(String(q.correctAnswer))}</div>` : ''}
        ${q.explanation ? `<div class="explanation">${escapeHtml(q.explanation)}</div>` : ''}
      </div>
    `).join('')}

    <div class="footer">
      Generated via VRIDDHI Platform | Confidential
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  if (!text) return ''
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export { router }
