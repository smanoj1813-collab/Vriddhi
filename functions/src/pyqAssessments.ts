// functions/src/pyqAssessments.ts
//
// Previous-year question papers (prep_papers, isPYQ / transcribed) as
// PLATFORM-ASSIGNED assessment sources.
//
//   1. The superadmin assigns papers to a college, exactly like course packs:
//      colleges/{collegeId}/config/pyqPapers  { assignments: { [paperId]: {...} } }
//      (Firestore rules: superadmin-only writes, college staff may read.)
//   2. College staff open the assigned paper in the Question Bank, pick the
//      questions they want (to honour "answer any N" rubrics) and call
//      createPyqAssessmentPaper. The server re-checks the assignment, copies
//      the selected questions VERBATIM into a college-owned papers/{id}
//      document, and returns its id.
//   3. That paper is a normal approved paper: /admin/schedule-tests (or
//      /faculty/assessments) schedules it through scheduleAssessmentTest,
//      students take it, descriptive answers go to the manual grading queue.
//
// Copy-on-use keeps the platform paper immutable, needs no change to the
// papers rules, scheduler or grading, and each test freezes its own snapshot.
// Question text is never generated or rewritten here — only copied.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { firstPaperSchedulingProblem, paperReadiness, resolvePaperStaff, validatePaperInput } from './paperWorkflow'

export const PYQ_ASSIGNMENT_CONFIG_DOC = 'pyqPapers'
/** Who may turn an assigned PYQ into a schedulable paper (same set that may schedule tests). */
export const PYQ_ASSESSMENT_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty']
/** Not one of HIGH_STAKES_EXAMS, so validatePaperInput does not force HOD approval. */
export const PYQ_EXAM_TYPE = 'PYQ Practice'
const MAX_DURATION_MINUTES = 480
const DEFAULT_DURATION_MINUTES = 60

export interface PyqAssignment {
  enabled: boolean
  assignedAt?: string
  assignedBy?: string
  notes?: string
}

export interface PyqAssignmentSettings {
  assignments: Record<string, PyqAssignment>
  updatedAt?: string
  updatedBy?: string
}

/** The fields of a prep_papers document this module reads. */
export interface PyqSourcePaper {
  id: string
  contentType?: string
  status?: string
  program?: string
  programLabel?: string
  semester?: number
  subjectName?: string
  examLabel?: string
  durationMinutes?: number
  language?: string
  contentVersion?: number
  instructions?: string[]
  sections?: Array<{
    id: string
    title?: string
    instruction?: string
    answerCount?: number
    marksEach?: number
    questions?: Array<{ label?: string; text?: string; marks?: number; parts?: string[] }>
  }>
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export function normalizePyqAssignments(value: unknown): PyqAssignmentSettings {
  if (!isRecord(value) || !isRecord(value.assignments)) return { assignments: {} }
  const assignments: Record<string, PyqAssignment> = {}
  for (const [paperId, raw] of Object.entries(value.assignments)) {
    if (!isRecord(raw) || !paperId) continue
    assignments[paperId] = {
      enabled: raw.enabled === true,
      assignedAt: typeof raw.assignedAt === 'string' ? raw.assignedAt : undefined,
      assignedBy: typeof raw.assignedBy === 'string' ? raw.assignedBy : undefined,
      notes: typeof raw.notes === 'string' ? raw.notes : undefined,
    }
  }
  return {
    assignments,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
    updatedBy: typeof value.updatedBy === 'string' ? value.updatedBy : undefined,
  }
}

/** Missing settings / missing record = not assigned (fail closed). */
export function isPyqAssigned(settings: PyqAssignmentSettings, paperId: string): boolean {
  return settings.assignments[paperId]?.enabled === true
}

/** Stable key for one question: `${sectionId}#${index within the section}`. */
export function pyqQuestionKey(sectionId: string, index: number): string {
  return `${sectionId}#${index}`
}

/** A file-only (original PDF) paper has no transcribed questions to copy. */
export function isAssessmentReadyPyq(paper: Pick<PyqSourcePaper, 'contentType' | 'sections'>): boolean {
  if (paper.contentType === 'source_pdf') return false
  return (paper.sections || []).some((section) => (section.questions || []).some((q) => String(q.text || '').trim()))
}

/** Stem plus sub-parts / "OR" alternatives, exactly as transcribed. */
export function pyqQuestionText(question: { text?: string; parts?: string[] }): string {
  const stem = String(question.text || '').trim()
  const parts = Array.isArray(question.parts)
    ? question.parts.map((part) => String(part ?? '').trim()).filter(Boolean)
    : []
  return parts.length ? [stem, ...parts].join('\n') : stem
}

export function pyqQuestionType(marks: number): 'short_answer' | 'long_answer' {
  return marks <= 3 ? 'short_answer' : 'long_answer'
}

export interface BuildPyqPaperOptions {
  /** Question keys to include; omitted/empty = every question. */
  selectedKeys?: string[]
  title?: string
  durationMinutes?: number
}

/**
 * Builds the raw papers/{id} payload (before validatePaperInput) from a
 * structured prep paper. Throws invalid-argument / failed-precondition with
 * a message the faculty can act on.
 */
export function buildPyqPaperInput(source: PyqSourcePaper, options: BuildPyqPaperOptions = {}) {
  if (!isAssessmentReadyPyq(source)) {
    throw new HttpsError(
      'failed-precondition',
      'This paper is only available as the original PDF — its questions have not been transcribed yet, so it cannot be used for an online assessment.'
    )
  }
  const wanted = new Set((options.selectedKeys || []).map(String))
  const useAll = wanted.size === 0
  const sections: Array<{ id: string; name: string; questions: Array<Record<string, unknown>> }> = []
  const rubric: string[] = []
  for (const section of source.sections || []) {
    const questions: Array<Record<string, unknown>> = []
    ;(section.questions || []).forEach((question, index) => {
      if (!useAll && !wanted.has(pyqQuestionKey(section.id, index))) return
      const text = pyqQuestionText(question)
      if (!text) return
      const marks = Number(question.marks ?? section.marksEach) || 0
      questions.push({ text, type: pyqQuestionType(marks), marks, topic: '', options: [] })
    })
    if (questions.length === 0) continue
    const name = String(section.title || `Section ${section.id}`).trim()
    sections.push({ id: String(section.id), name, questions })
    if (section.instruction) rubric.push(`${name}: ${String(section.instruction).trim()}`)
  }
  if (sections.length === 0) {
    throw new HttpsError('invalid-argument', 'Select at least one question for the assessment.')
  }

  const subject = String(source.subjectName || source.programLabel || 'Previous year paper').trim()
  const defaultTitle = `PYQ: ${subject}${source.examLabel ? ` (${source.examLabel})` : ''}`
  const title = String(options.title || '').trim().slice(0, 200) || defaultTitle.slice(0, 200)
  const requestedDuration = Number(options.durationMinutes)
  const duration = Number.isInteger(requestedDuration) && requestedDuration >= 1 && requestedDuration <= MAX_DURATION_MINUTES
    ? requestedDuration
    : Math.min(MAX_DURATION_MINUTES, Math.max(1, Number(source.durationMinutes) || DEFAULT_DURATION_MINUTES))
  const semester = Number(source.semester)
  const instructions = [
    ...(Array.isArray(source.instructions) ? source.instructions.map((line) => String(line).trim()).filter(Boolean) : []),
    ...rubric,
  ].join('\n')

  return {
    title,
    subject: subject.slice(0, 200),
    branch: '',
    batch: '',
    semester: Number.isInteger(semester) && semester >= 1 && semester <= 20 ? String(semester) : '',
    examType: PYQ_EXAM_TYPE,
    date: '',
    duration,
    totalMarks: 0,
    instructions: instructions.slice(0, 10_000),
    sections,
    requiresApproval: false,
  }
}

export const createPyqAssessmentPaper = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolvePaperStaff(uid, request.auth?.token || {})
    if (!PYQ_ASSESSMENT_ROLES.includes(staff.role)) {
      throw new HttpsError('permission-denied', 'Only faculty, HODs, principals and admins can create assessments')
    }
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = staff.role === 'superadmin' ? String(input.collegeId || '') : staff.collegeId
    const prepPaperId = String(input.prepPaperId || '')
    if (!collegeId || collegeId.includes('/')) throw new HttpsError('invalid-argument', 'College is required')
    if (!prepPaperId || prepPaperId.includes('/') || prepPaperId.length > 200) {
      throw new HttpsError('invalid-argument', 'Previous year paper is required')
    }
    const selectedKeys = Array.isArray(input.selectedKeys)
      ? input.selectedKeys.slice(0, 400).map((key) => String(key).slice(0, 120))
      : []

    const db = admin.firestore()
    const [configSnap, prepSnap] = await Promise.all([
      db.collection('colleges').doc(collegeId).collection('config').doc(PYQ_ASSIGNMENT_CONFIG_DOC).get(),
      db.collection('prep_papers').doc(prepPaperId).get(),
    ])
    if (!isPyqAssigned(normalizePyqAssignments(configSnap.data()), prepPaperId)) {
      throw new HttpsError('permission-denied', 'This previous year paper is not assigned to your college')
    }
    const prep = prepSnap.data()
    if (!prepSnap.exists || !prep || prep.status !== 'published') {
      throw new HttpsError('not-found', 'Previous year paper was not found')
    }
    const source = { ...(prep as PyqSourcePaper), id: prepSnap.id }
    const paper = validatePaperInput(buildPyqPaperInput(source, {
      selectedKeys,
      title: typeof input.title === 'string' ? input.title : undefined,
      durationMinutes: Number(input.durationMinutes) || undefined,
    }))
    const problem = firstPaperSchedulingProblem(paper.sections)
    if (problem) throw new HttpsError('failed-precondition', problem)

    const ref = db.collection('papers').doc()
    const auditRef = db.collection('paperReviewAudit').doc()
    const readiness = paperReadiness({ sections: paper.sections })
    const now = admin.firestore.FieldValue.serverTimestamp()
    const batch = db.batch()
    batch.create(ref, {
      ...paper,
      // Same state savePaper gives a non-high-stakes paper saved as "Ready to
      // use": schedulable without a separate HOD paper approval. Marks still
      // go through the normal grading/HOD publication flow.
      status: 'published',
      verificationStatus: 'not-required',
      requiresApproval: false,
      collegeId,
      filePath: null,
      printReady: readiness.printReady,
      onlineReady: readiness.onlineReady,
      bankReady: readiness.bankReady,
      questionIds: [],
      linkedQuestionIds: [],
      usageCount: 0,
      isManual: false,
      source: 'platform-pyq',
      sourcePrepPaperId: prepPaperId,
      sourcePrepPaperVersion: Number(source.contentVersion) || 1,
      language: String(source.language || ''),
      createdBy: uid,
      createdByName: staff.name,
      createdAt: now,
      updatedBy: uid,
      updatedAt: now,
      finalisedAt: now,
    })
    batch.create(auditRef, {
      paperId: ref.id,
      collegeId,
      action: 'paper_created_from_pyq',
      sourcePrepPaperId: prepPaperId,
      fromStatus: null,
      toStatus: 'not-required',
      performedBy: uid,
      performedAt: now,
    })
    await batch.commit()
    logger.info('[PyqAssessments] paper created from PYQ', {
      paperId: ref.id,
      prepPaperId,
      collegeId,
      uid,
      questionCount: paper.totalQuestions,
    })
    return {
      id: ref.id,
      title: paper.title,
      totalQuestions: paper.totalQuestions,
      totalMarks: paper.totalMarks,
      duration: paper.duration,
    }
  }
)
