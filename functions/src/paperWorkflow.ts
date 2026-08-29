import * as admin from 'firebase-admin'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

interface PaperStaff {
  uid: string
  role: string
  collegeId: string
  name: string
}

const PAPER_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor']
const REVIEW_ROLES = ['superadmin', 'admin', 'principal', 'hod']
const HIGH_STAKES_EXAMS = ['Mid Semester', 'Semester End', 'Model Exam']
const EDITABLE_STATES = ['draft', 'modification-requested', 'rejected-by-hod']
const FILE_CONTENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
])

async function resolvePaperStaff(uid: string, token: Record<string, unknown>): Promise<PaperStaff> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !PAPER_ROLES.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', 'Academic staff access is required')
  }
  return { uid, role, collegeId, name: String(user?.name || user?.displayName || '') }
}

function boundedString(value: unknown, field: string, maximum: number, required = false): string {
  const text = String(value || '').trim()
  if ((required && !text) || text.length > maximum) {
    throw new HttpsError('invalid-argument', `${field} is invalid`)
  }
  return text
}

interface PaperInput {
  title: string
  subject: string
  branch: string
  batch: string
  semester: string
  examType: string
  date: string
  duration: number
  totalMarks: number
  instructions: string
  sections: Array<{
    id: string
    name: string
    questions: Array<{
      number: number
      text: string
      type: string
      marks: number
      topic: string
    }>
  }>
  totalQuestions: number
  requiresApproval: boolean
  filePath?: string
  fileName?: string
  fileUrl?: string
  answerKeyPath?: string
  answerKeyName?: string
  answerKeyUrl?: string
}

export function validatePaperInput(value: unknown): PaperInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Paper data is required')
  }
  const input = value as Record<string, unknown>
  const title = boundedString(input.title, 'title', 200, true)
  const subject = boundedString(input.subject, 'subject', 200, true)
  const branch = boundedString(input.branch, 'branch', 100)
  const batch = boundedString(input.batch, 'batch', 100)
  const semester = boundedString(input.semester, 'semester', 10)
  const examType = boundedString(input.examType, 'examType', 100, true)
  const date = boundedString(input.date, 'date', 10)
  const instructions = boundedString(input.instructions, 'instructions', 10_000)
  const duration = Number(input.duration)
  const declaredMarks = Number(input.totalMarks)
  if (semester && (!Number.isInteger(Number(semester)) || Number(semester) < 1 || Number(semester) > 20)) {
    throw new HttpsError('invalid-argument', 'semester is invalid')
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpsError('invalid-argument', 'date is invalid')
  }
  if (!Number.isFinite(duration) || duration < 0 || duration > 1440) {
    throw new HttpsError('invalid-argument', 'duration is invalid')
  }

  const sourceSections = Array.isArray(input.sections) ? input.sections : []
  if (sourceSections.length > 20) throw new HttpsError('invalid-argument', 'Too many paper sections')
  let questionCount = 0
  let calculatedMarks = 0
  const sections = sourceSections.map((rawSection, sectionIndex) => {
    if (!rawSection || typeof rawSection !== 'object' || Array.isArray(rawSection)) {
      throw new HttpsError('invalid-argument', 'Paper section is invalid')
    }
    const section = rawSection as Record<string, unknown>
    const sourceQuestions = Array.isArray(section.questions) ? section.questions : []
    const questions = sourceQuestions.map((rawQuestion, questionIndex) => {
      if (!rawQuestion || typeof rawQuestion !== 'object' || Array.isArray(rawQuestion)) {
        throw new HttpsError('invalid-argument', 'Paper question is invalid')
      }
      const question = rawQuestion as Record<string, unknown>
      const text = boundedString(question.text || question.questionText, 'question text', 20_000, true)
      const type = boundedString(question.type, 'question type', 50, true)
      const topic = boundedString(question.topic, 'question topic', 200)
      const marks = Number(question.marks)
      if (!Number.isFinite(marks) || marks < 0 || marks > 1000) {
        throw new HttpsError('invalid-argument', 'Question marks are invalid')
      }
      questionCount += 1
      calculatedMarks += marks
      if (questionCount > 400) throw new HttpsError('invalid-argument', 'A paper can contain at most 400 questions')
      return { number: questionIndex + 1, text, type, marks, topic }
    })
    return {
      id: boundedString(section.id, 'section id', 100) || `section-${sectionIndex + 1}`,
      name: boundedString(section.name, 'section name', 200) || `Section ${sectionIndex + 1}`,
      questions,
    }
  })
  const totalMarks = questionCount > 0 ? calculatedMarks : declaredMarks
  if (!Number.isFinite(totalMarks) || totalMarks < 0 || totalMarks > 10_000) {
    throw new HttpsError('invalid-argument', 'totalMarks is invalid')
  }
  return {
    title,
    subject,
    branch,
    batch,
    semester,
    examType,
    date,
    duration,
    totalMarks,
    instructions,
    sections,
    totalQuestions: questionCount,
    requiresApproval: Boolean(input.requiresApproval) || HIGH_STAKES_EXAMS.includes(examType),
    ...(input.filePath ? { filePath: boundedString(input.filePath, 'filePath', 1000) } : {}),
    ...(input.fileName ? { fileName: boundedString(input.fileName, 'fileName', 500) } : {}),
    ...(input.fileUrl ? { fileUrl: boundedString(input.fileUrl, 'fileUrl', 3000) } : {}),
    ...(input.answerKeyPath ? { answerKeyPath: boundedString(input.answerKeyPath, 'answerKeyPath', 1000) } : {}),
    ...(input.answerKeyName ? { answerKeyName: boundedString(input.answerKeyName, 'answerKeyName', 500) } : {}),
    ...(input.answerKeyUrl ? { answerKeyUrl: boundedString(input.answerKeyUrl, 'answerKeyUrl', 3000) } : {}),
  }
}

async function validatedStorageFile(
  path: string | undefined,
  existingPath: unknown,
  collegeId: string,
  uid: string,
  paperId: string
): Promise<{ path: string } | undefined> {
  if (!path) return undefined
  if (path === existingPath) return undefined
  const prefix = `paper-files/${collegeId}/${uid}/${paperId}/`
  if (!path.startsWith(prefix) || path.length <= prefix.length) {
    throw new HttpsError('invalid-argument', 'Paper file path is invalid')
  }
  const bucket = admin.storage().bucket()
  const file = bucket.file(path)
  let metadata
  try {
    const metadataResult = await file.getMetadata()
    metadata = metadataResult[0]
  } catch {
    throw new HttpsError('failed-precondition', 'Uploaded paper file was not found')
  }
  const contentType = String(metadata.contentType || '')
  const size = Number(metadata.size || 0)
  if (!FILE_CONTENT_TYPES.has(contentType) || size <= 0 || size > 20 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'Paper file type or size is invalid')
  }
  return { path }
}

export function derivePaperState(action: string, paper: PaperInput, canReview: boolean) {
  if (!['draft', 'save', 'submitted', 'published'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Paper action is invalid')
  }
  if (action === 'published' && !canReview) {
    throw new HttpsError('permission-denied', 'Only an authorized reviewer may publish directly')
  }
  if (paper.requiresApproval && action === 'save') {
    throw new HttpsError('failed-precondition', 'This exam type requires approval before publication')
  }
  if (action !== 'draft' && (paper.totalMarks <= 0 || paper.duration <= 0)) {
    throw new HttpsError('failed-precondition', 'Duration and total marks must be greater than zero')
  }
  if (action === 'submitted') {
    return { status: 'draft', verificationStatus: 'submitted-for-approval', requiresApproval: true }
  }
  if (action === 'published') {
    return { status: 'published', verificationStatus: 'approved-by-hod', requiresApproval: false }
  }
  if (action === 'save') {
    return { status: 'published', verificationStatus: 'not-required', requiresApproval: false }
  }
  return { status: 'draft', verificationStatus: 'draft', requiresApproval: paper.requiresApproval }
}

export const savePaper = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 120, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    const paperId = String(request.data?.paperId || '')
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    const action = String(request.data?.action || '')
    if (!paperId || paperId.includes('/') || paperId.length > 200 || !collegeId) {
      throw new HttpsError('invalid-argument', 'Paper and college identifiers are required')
    }
    const paper = validatePaperInput(request.data?.paper)
    const canReview = REVIEW_ROLES.includes(staff.role)
    const state = derivePaperState(action, paper, canReview)
    const db = admin.firestore()
    const ref = db.collection('papers').doc(paperId)
    const before = await ref.get()
    const existing = before.data()
    if (before.exists) {
      if (staff.role !== 'superadmin' && existing?.collegeId !== collegeId) {
        throw new HttpsError('permission-denied', 'Paper belongs to another college')
      }
      if (!canReview && existing?.createdBy !== uid) {
        throw new HttpsError('permission-denied', 'Staff may edit only papers they authored')
      }
      const verificationStatus = String(existing?.verificationStatus || existing?.status || 'draft')
      if (!EDITABLE_STATES.includes(verificationStatus)) {
        throw new HttpsError('failed-precondition', 'Submitted or published papers cannot be edited')
      }
    }
    const [uploadedPaper, uploadedKey] = await Promise.all([
      validatedStorageFile(paper.filePath, existing?.filePath, collegeId, uid, paperId),
      validatedStorageFile(paper.answerKeyPath, existing?.answerKeyPath, collegeId, uid, paperId),
    ])
    const filePath = uploadedPaper?.path || paper.filePath || existing?.filePath
    const answerKeyPath = uploadedKey?.path || paper.answerKeyPath || existing?.answerKeyPath
    if (action !== 'draft' && paper.totalQuestions === 0 && !filePath) {
      throw new HttpsError('failed-precondition', 'Add a paper file or at least one question')
    }
    const auditRef = db.collection('paperReviewAudit').doc()
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref)
      if (current.exists !== before.exists || (current.exists && current.updateTime?.isEqual(before.updateTime!) !== true)) {
        throw new HttpsError('aborted', 'Paper changed while it was being saved; reload and try again')
      }
      const createdAt = existing?.createdAt || admin.firestore.FieldValue.serverTimestamp()
      transaction.set(ref, {
        ...paper,
        ...state,
        collegeId,
        filePath: filePath || null,
        fileUrl: uploadedPaper
          ? null
          : (filePath === existing?.filePath ? existing?.fileUrl || null : null),
        fileName: uploadedPaper
          ? paper.fileName || null
          : (filePath === existing?.filePath ? existing?.fileName || null : null),
        answerKeyPath: answerKeyPath || null,
        answerKeyUrl: uploadedKey
          ? null
          : (answerKeyPath === existing?.answerKeyPath ? existing?.answerKeyUrl || null : null),
        answerKeyName: uploadedKey
          ? paper.answerKeyName || null
          : (answerKeyPath === existing?.answerKeyPath ? existing?.answerKeyName || null : null),
        questionIds: Array.isArray(existing?.questionIds) ? existing.questionIds : [],
        linkedQuestionIds: Array.isArray(existing?.linkedQuestionIds) ? existing.linkedQuestionIds : [],
        usageCount: Number(existing?.usageCount || 0),
        isManual: true,
        createdBy: existing?.createdBy || uid,
        createdByName: existing?.createdByName || staff.name,
        createdAt,
        updatedBy: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(action === 'submitted' ? { submittedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
        ...(action === 'published' ? {
          reviewedBy: uid,
          reviewedByName: staff.name,
          reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        } : {}),
        ...(action === 'save' ? { finalisedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
      })
      transaction.create(auditRef, {
        paperId,
        collegeId,
        action: before.exists ? `paper_${action}_updated` : `paper_${action}_created`,
        fromStatus: existing?.verificationStatus || null,
        toStatus: state.verificationStatus,
        performedBy: uid,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })
    return { id: paperId, status: state.status, verificationStatus: state.verificationStatus }
  }
)

export const reviewPaper = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    if (!REVIEW_ROLES.includes(staff.role)) throw new HttpsError('permission-denied', 'Paper reviewer access is required')
    const paperId = String(request.data?.paperId || '')
    const action = String(request.data?.action || '')
    if (!paperId || paperId.includes('/') || !['approve', 'request_modification', 'reject'].includes(action)) {
      throw new HttpsError('invalid-argument', 'Paper review request is invalid')
    }
    const topic = boundedString(request.data?.topic, 'topic', 200)
    const questionNumbers = boundedString(request.data?.questionNumbers, 'questionNumbers', 200)
    const remarks = boundedString(request.data?.remarks, 'remarks', 2000, action !== 'approve')
    const db = admin.firestore()
    const ref = db.collection('papers').doc(paperId)
    const auditRef = db.collection('paperReviewAudit').doc()
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(ref)
      const paper = current.data()
      if (!current.exists || !paper) throw new HttpsError('not-found', 'Paper not found')
      if (staff.role !== 'superadmin' && paper.collegeId !== staff.collegeId) {
        throw new HttpsError('permission-denied', 'Paper belongs to another college')
      }
      const currentStatus = String(paper.verificationStatus || paper.status || '')
      if (!['submitted-for-approval', 'pending-verification'].includes(currentStatus)) {
        throw new HttpsError('failed-precondition', 'Only submitted papers can be reviewed')
      }
      const approved = action === 'approve'
      const nextStatus = approved
        ? 'approved-by-hod'
        : action === 'reject' ? 'rejected-by-hod' : 'modification-requested'
      transaction.update(ref, {
        status: approved ? 'published' : 'draft',
        verificationStatus: nextStatus,
        reviewedBy: uid,
        reviewedByName: staff.name,
        reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvalRemarks: remarks,
        requestedChanges: approved ? null : { topic, questionNumbers, remarks },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(approved ? { publishedAt: admin.firestore.FieldValue.serverTimestamp() } : {}),
      })
      transaction.create(auditRef, {
        paperId,
        collegeId: paper.collegeId,
        action,
        fromStatus: currentStatus,
        toStatus: nextStatus,
        remarks,
        requestedChanges: approved ? null : { topic, questionNumbers, remarks },
        performedBy: uid,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })
    return { success: true }
  }
)

export const getPaperFileDownload = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    const paperId = String(request.data?.paperId || '')
    const kind = String(request.data?.kind || 'paper')
    if (!paperId || paperId.includes('/') || !['paper', 'answer-key'].includes(kind)) {
      throw new HttpsError('invalid-argument', 'Paper download request is invalid')
    }
    const snapshot = await admin.firestore().collection('papers').doc(paperId).get()
    const paper = snapshot.data()
    if (!snapshot.exists || !paper) throw new HttpsError('not-found', 'Paper not found')
    if (staff.role !== 'superadmin' && paper.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Paper belongs to another college')
    }
    const path = String(kind === 'answer-key' ? paper.answerKeyPath || '' : paper.filePath || '')
    if (!path) throw new HttpsError('not-found', 'The requested paper file is not attached')
    const file = admin.storage().bucket().file(path)
    const [exists] = await file.exists()
    if (!exists) throw new HttpsError('not-found', 'The requested paper file is unavailable')
    const expiresAt = Date.now() + 5 * 60 * 1000
    const [url] = await file.getSignedUrl({ action: 'read', expires: expiresAt })
    return {
      url,
      fileName: String(kind === 'answer-key' ? paper.answerKeyName || 'answer-key' : paper.fileName || 'paper'),
      expiresAt: new Date(expiresAt).toISOString(),
    }
  }
)
