import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import {
  gradeAssessmentPaper,
  gradeFromPercentage,
  type ServerAnswer,
  type ServerQuestion,
} from './assessmentGrading'
import { canonicalQuestionType, findSchedulingProblem } from './questionTypes'

const VISIBLE_TEST_STATUSES = ['published', 'ongoing', 'completed']
const STARTABLE_TEST_STATUSES = ['published', 'ongoing']
const MAX_QUESTIONS = 400
const MAX_ANSWER_TEXT = 20_000
const MAX_PROCTOR_DETAILS_BYTES = 4_000
// Bounded size of the compact answer index (400 q x ~10 options). Larger indexes
// move to a studentAssessments/{id}/meta/answerIndex subdocument.
const MAX_ANSWER_INDEX_BYTES = 200_000
// Caps for the proctor-event batching path.
const MAX_BATCH_PROCTOR_EVENTS = 100
const MAX_STORED_PROCTOR_EVENTS = 500
const MAX_LOGGED_BATCH_EVENTS = 50

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

interface StudentIdentity {
  uid: string
  id: string
  collegeId: string
  name: string
  regNo: string
  branch: string
  batch: string
  division: string
  section: string
  semester: number
}

interface StaffIdentity {
  uid: string
  role: string
  collegeId: string
  name: string
}

function timestampToDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof admin.firestore.Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const converted = (value as { toDate: () => Date }).toDate()
    return converted instanceof Date ? converted : null
  }
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function iso(value: unknown): string {
  return timestampToDate(value)?.toISOString() || ''
}

function parseRequiredDate(value: unknown, field: string): Date {
  const parsed = timestampToDate(value)
  if (!parsed) throw new HttpsError('invalid-argument', `${field} must be a valid date`)
  return parsed
}

async function resolveStudent(uid: string, token: Record<string, unknown>): Promise<StudentIdentity> {
  const db = admin.firestore()
  const [userDoc, students] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('students').where('userId', '==', uid).limit(2).get(),
  ])
  const user = userDoc.data()
  if (!userDoc.exists || String(token.role || user?.role || '') !== 'student') {
    throw new HttpsError('permission-denied', 'A linked student account is required')
  }
  if (students.size !== 1) {
    throw new HttpsError(
      'failed-precondition',
      students.empty
        ? 'Your account is not linked to a student profile. Contact your college administrator.'
        : 'Multiple student profiles are linked to this account. Contact your college administrator.'
    )
  }
  const studentDoc = students.docs[0]
  const student = studentDoc.data()
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!collegeId || student.collegeId !== collegeId) {
    throw new HttpsError('failed-precondition', 'Student account tenant linkage is invalid')
  }
  return {
    uid,
    id: studentDoc.id,
    collegeId,
    name: String(student.name || user?.name || ''),
    regNo: String(student.regNo || student.registrationNumber || ''),
    branch: String(student.branch || student.department || ''),
    batch: String(student.batch || student.academicYear || ''),
    division: String(student.division || student.section || ''),
    section: String(student.section || student.division || ''),
    semester: Number(student.semester) || 0,
  }
}

function requireAssessmentManager(staff: StaffIdentity): void {
  if (!['superadmin', 'admin', 'principal', 'hod', 'faculty'].includes(staff.role)) {
    throw new HttpsError('permission-denied', 'Assessment management access is required')
  }
}

async function resolveStaff(uid: string, token: Record<string, unknown>): Promise<StaffIdentity> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (
    !userDoc.exists
    || !['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor'].includes(role)
    || (role !== 'superadmin' && !collegeId)
  ) {
    throw new HttpsError('permission-denied', 'Academic staff access is required')
  }
  return { uid, role, collegeId, name: String(user?.name || '') }
}

// canonicalQuestionType now lives in ./questionTypes (single source of truth
// shared with the paper pipeline); it is imported above.

function normalizeQuestion(data: admin.firestore.DocumentData, id: string, order: number): ServerQuestion {
  // AI-generated papers store embedded questions as { questionId, question }
  // wrappers — unwrap so text/options/type normalise from the inner object
  // (bank documents and editor papers are flat and are unaffected).
  const raw = (data?.question && typeof data.question === 'object' && !Array.isArray(data.question))
    ? (data.question as admin.firestore.DocumentData)
    : data
  const questionType = canonicalQuestionType(raw.type || raw.questionType)
  let options = Array.isArray(raw.options)
    ? raw.options.map((option: unknown, index: number) => {
        if (typeof option === 'string') {
          return { id: `opt-${index}`, text: option }
        }
        const value = (option || {}) as Record<string, unknown>
        return {
          id: String(value.id || value.key || `opt-${index}`),
          text: String(value.text ?? value.label ?? ''),
          ...(value.isCorrect === undefined ? {} : { isCorrect: Boolean(value.isCorrect) }),
        }
      })
    : []
  if (questionType === 'assertion_reason' && options.length === 0) {
    options = [
      { id: 'A', text: 'Both Assertion and Reason are true and Reason is the correct explanation' },
      { id: 'B', text: 'Both Assertion and Reason are true but Reason is not the correct explanation' },
      { id: 'C', text: 'Assertion is true but Reason is false' },
      { id: 'D', text: 'Assertion is false but Reason is true' },
    ]
  }
  const questionId = String(data.questionId || raw.questionId || raw.id || id)
  return {
    id,
    questionId,
    order: Number(raw.order) || order,
    text: String(raw.text || raw.questionText || raw.content || ''),
    type: questionType,
    marks: Math.max(0, Number(raw.marks) || 1),
    negativeMarks: Math.max(0, Number(raw.negativeMarks) || 0),
    options,
    ...(raw.correctAnswer === undefined ? {} : { correctAnswer: raw.correctAnswer }),
    ...(raw.tolerance === undefined ? {} : { tolerance: Math.max(0, Number(raw.tolerance) || 0) }),
    ...(raw.explanation ? { explanation: String(raw.explanation) } : {}),
    ...(raw.sectionId ? { sectionId: String(raw.sectionId) } : {}),
    ...(raw.sectionName ? { sectionName: String(raw.sectionName) } : {}),
    ...(raw.difficulty ? { difficulty: String(raw.difficulty) } : {}),
    ...(raw.imageUrl ? { imageUrl: String(raw.imageUrl) } : {}),
    ...(raw.caseText ? { caseText: String(raw.caseText) } : {}),
    ...(Array.isArray(raw.matchPairs) ? { matchPairs: raw.matchPairs } : {}),
  }
}

async function loadTestQuestions(
  testId: string,
  test: admin.firestore.DocumentData
): Promise<ServerQuestion[]> {
  const db = admin.firestore()
  const snapshot = await db
    .collection('scheduledTests')
    .doc(testId)
    .collection('assessmentQuestions')
    .get()
  if (!snapshot.empty) {
    return snapshot.docs
      .map((question, index) => normalizeQuestion(question.data(), question.id, index + 1))
      .sort((left, right) => left.order - right.order)
  }

  // Legacy fallback runs only on the trusted server. Answer-bearing paper and
  // question documents are never returned directly to the student.
  if (Array.isArray(test.questions) && test.questions.length > 0) {
    return test.questions
      .slice(0, MAX_QUESTIONS)
      .map((question: admin.firestore.DocumentData, index: number) =>
        normalizeQuestion(question, String(question.id || question.questionId || `q-${index + 1}`), index + 1)
      )
  }
  const paperId = String(test.paperId || '')
  if (!paperId) return []
  const paperDoc = await db.collection('papers').doc(paperId).get()
  const paper = paperDoc.data()
  if (!paperDoc.exists || !paper) return []

  const embedded: ServerQuestion[] = []
  if (Array.isArray(paper.sections)) {
    paper.sections.forEach((section: admin.firestore.DocumentData) => {
      if (!Array.isArray(section.questions)) return
      section.questions.forEach((question: admin.firestore.DocumentData) => {
        if (embedded.length >= MAX_QUESTIONS) return
        embedded.push(normalizeQuestion(
          {
            ...question,
            sectionId: question.sectionId || section.id,
            sectionName: question.sectionName || section.name || section.title,
          },
          String(question.id || question.questionId || `q-${embedded.length + 1}`),
          embedded.length + 1
        ))
      })
    })
  }
  if (embedded.length > 0) return embedded

  const questionIds = Array.isArray(paper.linkedQuestionIds)
    ? paper.linkedQuestionIds
    : Array.isArray(paper.questionIds) ? paper.questionIds : []
  if (questionIds.length === 0 || questionIds.length > MAX_QUESTIONS) return []
  const refs = questionIds.map((id: unknown) => db.collection('questions').doc(String(id)))
  const docs = await db.getAll(...refs)
  return docs
    .filter((question) => question.exists)
    .map((question, index) => normalizeQuestion(question.data() || {}, question.id, index + 1))
}

function publicQuestion(question: ServerQuestion) {
  return {
    id: question.id,
    questionId: question.questionId,
    order: question.order,
    marks: question.marks,
    text: question.text,
    type: question.type,
    difficulty: question.difficulty || 'medium',
    options: question.options.map(({ id, text }) => ({ id, text })),
    hasImage: Boolean(question.imageUrl),
    imageUrl: question.imageUrl,
    sectionId: question.sectionId,
    sectionName: question.sectionName,
    negativeMarks: question.negativeMarks || undefined,
    caseText: question.caseText,
    matchPairs: question.type === 'matching'
      ? question.matchPairs?.map(({ left }) => ({ left, right: '' }))
      : undefined,
    questionText: question.text,
    questionType: question.type,
  }
}

function testTargetsStudent(test: admin.firestore.DocumentData, student: StudentIdentity): boolean {
  if (test.collegeId !== student.collegeId) return false
  const visibility = String(test.visibility || '')
  if (visibility === 'public' || visibility === 'college') return true

  const targetStudents = Array.isArray(test.targetStudents) ? test.targetStudents.map(String) : []
  if ([student.id, student.uid, student.regNo].some((id) => id && targetStudents.includes(id))) {
    return true
  }
  const targetSections = Array.isArray(test.targetSections) ? test.targetSections : []
  if (targetSections.some((target: unknown) => {
    const value = (target || {}) as Record<string, unknown>
    const normalizeSection = (entry: unknown) => String(entry || '').trim().toLowerCase().replace(/^section\s+/, '')
    const expectedSection = normalizeSection(value.section || value.division || value.sectionName || value.sectionId)
    if (!expectedSection || ![student.section, student.division].map(normalizeSection).includes(expectedSection)) {
      return false
    }
    if (value.branch && String(value.branch) !== student.branch) return false
    if (value.batch && String(value.batch) !== student.batch) return false
    if (value.semester && Number(value.semester) !== student.semester) return false
    return true
  })) return true

  const fields = [
    ['branch', student.branch],
    ['batch', student.batch],
    ['division', student.division],
    ['section', student.section],
  ] as const
  const hasCohort = fields.some(([field]) => Boolean(test[field])) || Boolean(test.semester)
  if (!hasCohort) return false
  if (fields.some(([field, actual]) => test[field] && String(test[field]) !== actual)) return false
  if (test.semester && Number(test.semester) !== student.semester) return false
  return true
}

async function resolveOwnTest(
  routeId: string,
  student: StudentIdentity
): Promise<{ testId: string; testRef: FirebaseFirestore.DocumentReference; test: admin.firestore.DocumentData }> {
  if (!routeId || routeId.includes('/')) throw new HttpsError('invalid-argument', 'A valid test ID is required')
  const db = admin.firestore()
  let testRef = db.collection('scheduledTests').doc(routeId)
  let testDoc = await testRef.get()
  if (!testDoc.exists) {
    const rowDoc = await db.collection('studentAssessments').doc(routeId).get()
    const row = rowDoc.data()
    if (!rowDoc.exists || row?.studentId !== student.id) throw new HttpsError('not-found', 'Test not found')
    const linkedId = String(row.testId || row.assessmentId || '')
    if (!linkedId) throw new HttpsError('not-found', 'Test not found')
    testRef = db.collection('scheduledTests').doc(linkedId)
    testDoc = await testRef.get()
  }
  const test = testDoc.data()
  if (!testDoc.exists || !test || !testTargetsStudent(test, student)) {
    throw new HttpsError('permission-denied', 'This test is not assigned to your account')
  }
  return { testId: testDoc.id, testRef, test }
}

function rowRef(testId: string, studentId: string): FirebaseFirestore.DocumentReference {
  return admin.firestore().collection('studentAssessments').doc(`${testId}_${studentId}`)
}

/**
 * Compact per-question validation data frozen on the attempt at start:
 * `{ [key]: { id, optionIds, type } }` where key is the canonical question id
 * (plus the `questionId` alias when it differs). Autosave validates deltas
 * against this instead of loading all N question documents.
 */
export interface AnswerIndexEntry {
  id: string
  optionIds: string[]
  type: string
}

export function questionsToIndex(questions: ServerQuestion[]): Record<string, AnswerIndexEntry> {
  const index: Record<string, AnswerIndexEntry> = {}
  questions.forEach((question) => {
    const entry: AnswerIndexEntry = {
      id: question.id,
      optionIds: question.options.map((option) => option.id),
      type: question.type,
    }
    index[question.id] = entry
    if (question.questionId && question.questionId !== question.id) index[question.questionId] = entry
  })
  return index
}

function buildSanitizedAnswer(
  canonicalId: string,
  input: Record<string, unknown>,
  optionIds: string[]
): ServerAnswer {
  const optionIdSet = new Set(optionIds)
  const selectedOptionId = input.selectedOptionId && optionIdSet.has(String(input.selectedOptionId))
    ? String(input.selectedOptionId)
    : undefined
  const selectedOptionIds = Array.isArray(input.selectedOptionIds)
    ? [...new Set(input.selectedOptionIds.map(String).filter((id) => optionIdSet.has(id)))].slice(0, optionIdSet.size)
    : undefined
  const textAnswer = typeof input.textAnswer === 'string'
    ? input.textAnswer.trim().slice(0, MAX_ANSWER_TEXT)
    : undefined
  const numeric = input.numericalAnswer === undefined ? undefined : Number(input.numericalAnswer)
  const numericalAnswer = numeric !== undefined && Number.isFinite(numeric) ? numeric : undefined
  const matchedPairs = Array.isArray(input.matchedPairs)
    ? input.matchedPairs.slice(0, 100).map((pair: unknown) => {
        const value = (pair || {}) as Record<string, unknown>
        return { left: String(value.left || '').slice(0, 500), right: String(value.right || '').slice(0, 500) }
      })
    : undefined
  return {
    questionId: canonicalId,
    ...(selectedOptionId ? { selectedOptionId } : {}),
    ...(selectedOptionIds?.length ? { selectedOptionIds } : {}),
    ...(textAnswer ? { textAnswer } : {}),
    ...(numericalAnswer === undefined ? {} : { numericalAnswer }),
    ...(matchedPairs?.length ? { matchedPairs } : {}),
    isFlagged: Boolean(input.isFlagged),
  }
}

export function sanitizeAnswers(value: unknown, questions: ServerQuestion[]): ServerAnswer[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const source = value as Record<string, unknown>
  const knownQuestions = new Map<string, ServerQuestion>()
  questions.forEach((question) => {
    knownQuestions.set(question.id, question)
    knownQuestions.set(question.questionId, question)
  })
  const answers: ServerAnswer[] = []
  const seen = new Set<string>()

  Object.entries(source).forEach(([mapId, raw]) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const input = raw as Record<string, unknown>
    const question = knownQuestions.get(String(input.questionId || mapId))
    if (!question || seen.has(question.id)) return
    seen.add(question.id)
    answers.push(buildSanitizedAnswer(question.id, input, question.options.map((option) => option.id)))
  })
  return answers
}

/**
 * Validates answers against the compact answer index stored on the attempt.
 * Output is byte-identical to `sanitizeAnswers` for the same input, so grades
 * are unaffected — it just avoids the question-document reads.
 */
export function sanitizeAnswersWithIndex(
  value: unknown,
  index: Record<string, AnswerIndexEntry>
): ServerAnswer[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  const source = value as Record<string, unknown>
  const answers: ServerAnswer[] = []
  const seen = new Set<string>()

  Object.entries(source).forEach(([mapId, raw]) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const input = raw as Record<string, unknown>
    const entry = index[String(input.questionId || mapId)]
    if (!entry || seen.has(entry.id)) return
    seen.add(entry.id)
    answers.push(buildSanitizedAnswer(entry.id, input, entry.optionIds))
  })
  return answers
}

/** Merges incoming answers into the stored set keyed by questionId (latest wins). */
export function mergeAnswers(existing: ServerAnswer[], incoming: ServerAnswer[]): ServerAnswer[] {
  const byQuestion = new Map<string, ServerAnswer>()
  existing.forEach((answer) => {
    if (answer?.questionId) byQuestion.set(answer.questionId, answer)
  })
  incoming.forEach((answer) => {
    if (answer?.questionId) byQuestion.set(answer.questionId, answer)
  })
  return [...byQuestion.values()]
}

interface SanitizedProctorEvent {
  type: string
  at: string
  details: Record<string, unknown>
}

/** Bounds each client-provided proctor event before it is stored on the attempt. */
export function sanitizeProctorEvents(value: unknown): SanitizedProctorEvent[] {
  if (!Array.isArray(value)) return []
  const events: SanitizedProctorEvent[] = []
  for (const raw of value.slice(0, MAX_BATCH_PROCTOR_EVENTS)) {
    if (!isPlainObject(raw)) continue
    const type = String(raw.type || '').slice(0, 80)
    if (!type) continue
    const details = isPlainObject(raw.details) ? raw.details : {}
    const boundedDetails = Buffer.byteLength(JSON.stringify(details), 'utf8') > MAX_PROCTOR_DETAILS_BYTES
      ? {}
      : details
    events.push({ type, at: String(raw.at || '').slice(0, 40), details: boundedDetails })
  }
  return events
}

/**
 * Reads the compact answer index for an attempt: inline field on the row, or
 * the meta/answerIndex subdocument for oversized indexes. Null for attempts
 * started before the index existed (caller falls back to the question load).
 */
async function readAnswerIndex(
  assessmentId: string,
  row: admin.firestore.DocumentData
): Promise<Record<string, AnswerIndexEntry> | null> {
  const inline = row.answerIndex
  if (isPlainObject(inline) && Object.keys(inline).length > 0) {
    return inline as Record<string, AnswerIndexEntry>
  }
  if (row.answerIndexRef) {
    const sub = await admin.firestore()
      .collection('studentAssessments')
      .doc(assessmentId)
      .collection('meta')
      .doc(String(row.answerIndexRef))
      .get()
    const index = sub.data()?.index
    if (isPlainObject(index) && Object.keys(index).length > 0) {
      return index as Record<string, AnswerIndexEntry>
    }
  }
  return null
}

/**
 * One-time heal: persist the answer index on an attempt that started before
 * the fast path existed. Without it, EVERY autosave re-loads the paper and
 * all N question documents to validate a delta — one 20-minute session with
 * a noisy-focus client produced ~30k reads this way. Best-effort: a failed
 * heal must never break the autosave itself.
 */
async function healAnswerIndex(
  assessmentRef: FirebaseFirestore.DocumentReference,
  assessmentId: string,
  index: Record<string, AnswerIndexEntry>
): Promise<void> {
  if (!isPlainObject(index) || Object.keys(index).length === 0) return
  const db = admin.firestore()
  if (Buffer.byteLength(JSON.stringify(index), 'utf8') > MAX_ANSWER_INDEX_BYTES) {
    await db
      .collection('studentAssessments')
      .doc(assessmentId)
      .collection('meta')
      .doc('answerIndex')
      .set({ index, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    await assessmentRef.update({ answerIndexRef: 'meta/answerIndex' })
  } else {
    await assessmentRef.update({ answerIndex: index, answerIndexRef: null })
  }
}

function answerText(question: ServerQuestion, answer: ServerAnswer | undefined): string {
  if (!answer) return ''
  if (answer.selectedOptionId) {
    return question.options.find((option) => option.id === answer.selectedOptionId)?.text || ''
  }
  if (answer.selectedOptionIds?.length) {
    return answer.selectedOptionIds
      .map((id) => question.options.find((option) => option.id === id)?.text || '')
      .filter(Boolean)
      .join(', ')
  }
  if (answer.numericalAnswer !== undefined) return String(answer.numericalAnswer)
  if (answer.textAnswer) return answer.textAnswer
  if (answer.matchedPairs?.length) return answer.matchedPairs.map((pair) => `${pair.left}: ${pair.right}`).join(', ')
  return ''
}

function correctAnswerText(question: ServerQuestion): string {
  const options = question.options.filter((option) => option.isCorrect).map((option) => option.text)
  if (options.length > 0) return options.join(', ')
  if (Array.isArray(question.correctAnswer)) return question.correctAnswer.join(', ')
  return question.correctAnswer === undefined ? '' : String(question.correctAnswer)
}

function testWindow(test: admin.firestore.DocumentData) {
  const start = timestampToDate(test.startDateTime || test.scheduledAt)
  const end = timestampToDate(test.endDateTime)
  const duration = Math.max(1, Math.min(480, Number(test.durationMinutes || test.duration) || 60))
  if (!start || !end || end <= start) {
    throw new HttpsError('failed-precondition', 'Test schedule is invalid')
  }
  return { start, end, duration }
}

function serializeCard(
  testId: string,
  test: admin.firestore.DocumentData,
  row?: admin.firestore.DocumentData
) {
  const { start, end, duration } = testWindow(test)
  const now = Date.now()
  const studentStatus = String(row?.status || 'not_started')
  const releaseAt = timestampToDate(test.resultPublishDate) || end
  const resultReleased = studentStatus === 'graded' && now >= releaseAt.getTime()
  let status = 'upcoming'
  if (resultReleased) status = 'graded'
  else if (studentStatus === 'graded') status = 'completed'
  else if (studentStatus === 'submitted') status = 'completed'
  else if (studentStatus === 'in_progress') status = 'ongoing'
  else if (now > end.getTime()) status = 'missed'
  else if (now >= start.getTime()) status = 'available'

  return {
    id: testId,
    assessmentId: testId,
    testId,
    title: String(test.title || test.paperTitle || 'Assessment'),
    subject: String(test.subject || test.subjectName || ''),
    totalMarks: Number(test.totalMarks) || 0,
    duration,
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    status,
    studentStatus,
    canStart: studentStatus === 'not_started' && status === 'available',
    canResume: studentStatus === 'in_progress',
    marksObtained: resultReleased ? Number(row?.marksObtained) || 0 : undefined,
    percentage: resultReleased ? Number(row?.percentage) || 0 : undefined,
    grade: resultReleased ? String(row?.grade || '') : undefined,
    timeSpent: Number(row?.timeSpent) || 0,
    submittedAt: iso(row?.submittedAt) || undefined,
    totalQuestions: Number(test.totalQuestions) || 0,
    needsManualGrading: Boolean(row?.needsManualGrading),
    resultReleased,
  }
}

export const getMyStudentTests = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const db = admin.firestore()
    const [tests, rows] = await Promise.all([
      db.collection('scheduledTests')
        .where('collegeId', '==', student.collegeId)
        .where('status', 'in', VISIBLE_TEST_STATUSES)
        .limit(200)
        .get(),
      db.collection('studentAssessments').where('studentId', '==', student.id).limit(500).get(),
    ])
    const byTest = new Map<string, admin.firestore.DocumentData>()
    rows.docs.forEach((row) => {
      const value = row.data()
      const testId = String(value.testId || value.assessmentId || '')
      if (testId && value.collegeId === student.collegeId) byTest.set(testId, value)
    })
    const cards = tests.docs
      .filter((test) => testTargetsStudent(test.data(), student))
      .map((test) => serializeCard(test.id, test.data(), byTest.get(test.id)))
      .sort((left, right) => left.startDateTime.localeCompare(right.startDateTime))
    return { tests: cards }
  }
)

export const getMyTestInstructions = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const resolved = await resolveOwnTest(String(request.data?.testId || ''), student)
    if (!VISIBLE_TEST_STATUSES.includes(String(resolved.test.status || ''))) {
      throw new HttpsError('failed-precondition', 'Test is not published')
    }
    const questions = await loadTestQuestions(resolved.testId, resolved.test)
    if (questions.length === 0) throw new HttpsError('failed-precondition', 'Test has no published questions')
    const row = await rowRef(resolved.testId, student.id).get()
    const rowData = row.data()
    const { start, end, duration } = testWindow(resolved.test)
    const resultReleaseAt = timestampToDate(resolved.test.resultPublishDate) || end
    const resultReleased = rowData?.status === 'graded' && Date.now() >= resultReleaseAt.getTime()
    return {
      testId: resolved.testId,
      studentAssessmentId: row.exists ? row.id : null,
      title: String(resolved.test.title || resolved.test.paperTitle || 'Assessment'),
      subject: String(resolved.test.subject || resolved.test.subjectName || ''),
      totalMarks: Number(resolved.test.totalMarks) || questions.reduce((sum, question) => sum + question.marks, 0),
      totalQuestions: questions.length,
      duration,
      instructions: Array.isArray(resolved.test.instructions)
        ? resolved.test.instructions.map(String)
        : resolved.test.instructions ? [String(resolved.test.instructions)] : [],
      negativeMarking: questions.some((question) => question.negativeMarks > 0),
      enableProctoring: resolved.test.enableProctoring === true,
      maxTabSwitches: Number(resolved.test.maxTabSwitches) || 0,
      shuffleQuestions: resolved.test.shuffleQuestions === true,
      shuffleOptions: resolved.test.shuffleOptions === true,
      shuffleSections: resolved.test.shuffleSections === true,
      questionTypes: [...new Set(questions.map((question) => question.type))],
      studentStatus: String(rowData?.status || 'not_started'),
      startedAt: iso(rowData?.startedAt) || undefined,
      endsAt: iso(rowData?.endsAt) || end.toISOString(),
      submittedAt: iso(rowData?.submittedAt) || undefined,
      marksObtained: resultReleased ? Number(rowData?.marksObtained) || 0 : undefined,
      grade: resultReleased ? String(rowData?.grade || '') : undefined,
      needsManualGrading: Boolean(rowData?.needsManualGrading),
      resultReleased,
      scheduledStart: start.toISOString(),
    }
  }
)

export const startMyStudentTest = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const resolved = await resolveOwnTest(String(request.data?.testId || ''), student)
    const { start, end, duration } = testWindow(resolved.test)
    const now = new Date()
    if (!STARTABLE_TEST_STATUSES.includes(String(resolved.test.status || ''))) {
      throw new HttpsError('failed-precondition', 'Test is not open')
    }
    if (now < start) throw new HttpsError('failed-precondition', 'Test has not started yet')
    if (now > end) throw new HttpsError('deadline-exceeded', 'Test window has closed')
    const questions = await loadTestQuestions(resolved.testId, resolved.test)
    if (questions.length === 0) throw new HttpsError('failed-precondition', 'Test has no published questions')

    const assessmentRef = rowRef(resolved.testId, student.id)
    // Compact validation data frozen at start so autosave never has to load
    // the N question documents. Oversized indexes go to a meta subdocument.
    const answerIndex = questionsToIndex(questions)
    const answerIndexExternal = Buffer.byteLength(JSON.stringify(answerIndex), 'utf8') > MAX_ANSWER_INDEX_BYTES
    const answerIndexSubRef = answerIndexExternal
      ? assessmentRef.collection('meta').doc('answerIndex')
      : null
    const writeAnswerIndex = (transaction: FirebaseFirestore.Transaction) => {
      if (answerIndexExternal && answerIndexSubRef) {
        transaction.set(answerIndexSubRef, {
          index: answerIndex,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    }
    const result = await admin.firestore().runTransaction(async (transaction) => {
      const [freshTest, existingRow] = await Promise.all([
        transaction.get(resolved.testRef),
        transaction.get(assessmentRef),
      ])
      const freshTestData = freshTest.data()
      if (!freshTestData || !STARTABLE_TEST_STATUSES.includes(String(freshTestData.status || ''))) {
        throw new HttpsError('failed-precondition', 'Test is no longer open')
      }
      const row = existingRow.data()
      if (row?.status === 'submitted' || row?.status === 'graded') {
        throw new HttpsError('already-exists', 'This test has already been submitted')
      }
      if (row?.status === 'in_progress') {
        // One-time heal for attempts started before the answer index existed:
        // the fast autosave path becomes available from the next save onward.
        const hasIndex = (isPlainObject(row?.answerIndex) && Object.keys(row.answerIndex).length > 0)
          || Boolean(row?.answerIndexRef)
        if (!hasIndex) {
          writeAnswerIndex(transaction)
          transaction.update(assessmentRef, {
            ...(answerIndexExternal ? { answerIndexRef: 'meta/answerIndex' } : { answerIndex }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          })
        }
        return {
          startedAt: iso(row.startedAt),
          endsAt: iso(row.endsAt),
          resumed: true,
        }
      }

      const endsAt = new Date(Math.min(now.getTime() + duration * 60_000, end.getTime()))
      const attemptData = {
        testId: resolved.testId,
        assessmentId: resolved.testId,
        collegeId: student.collegeId,
        studentId: student.id,
        studentUid: student.uid,
        studentName: student.name,
        regNo: student.regNo,
        title: String(freshTestData.title || freshTestData.paperTitle || ''),
        subject: String(freshTestData.subject || freshTestData.subjectName || ''),
        totalMarks: Number(freshTestData.totalMarks) || questions.reduce((sum, question) => sum + question.marks, 0),
        totalQuestions: questions.length,
        duration,
        status: 'in_progress',
        answers: [],
        ...(answerIndexExternal ? { answerIndexRef: 'meta/answerIndex' } : { answerIndex }),
        startedAt: admin.firestore.Timestamp.fromDate(now),
        endsAt: admin.firestore.Timestamp.fromDate(endsAt),
        autoSubmitAt: admin.firestore.Timestamp.fromDate(
          freshTestData.allowLateSubmission === true ? end : endsAt
        ),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      writeAnswerIndex(transaction)
      if (existingRow.exists) {
        transaction.update(assessmentRef, attemptData)
      } else {
        transaction.create(assessmentRef, {
          ...attemptData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
      transaction.update(resolved.testRef, {
        ...(!existingRow.exists
          ? { totalRegistered: admin.firestore.FieldValue.increment(1) }
          : {}),
        totalStarted: admin.firestore.FieldValue.increment(1),
        status: 'ongoing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return { startedAt: now.toISOString(), endsAt: endsAt.toISOString(), resumed: false }
    })

    return {
      studentAssessmentId: assessmentRef.id,
      testId: resolved.testId,
      ...result,
    }
  }
)

export const getMyActiveStudentTest = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const resolved = await resolveOwnTest(String(request.data?.testId || ''), student)
    if (resolved.test.status === 'cancelled') {
      throw new HttpsError('failed-precondition', 'This test has been cancelled')
    }
    const assessment = await rowRef(resolved.testId, student.id).get()
    const row = assessment.data()
    if (!assessment.exists || row?.status !== 'in_progress') {
      throw new HttpsError('failed-precondition', 'Start the test before loading questions')
    }
    const questions = await loadTestQuestions(resolved.testId, resolved.test)
    const savedAnswers = Array.isArray(row.answers) ? row.answers : []
    const answers: Record<string, ServerAnswer> = {}
    savedAnswers.forEach((answer: ServerAnswer) => { if (answer.questionId) answers[answer.questionId] = answer })
    return {
      studentAssessmentId: assessment.id,
      assessmentId: resolved.testId,
      testId: resolved.testId,
      paperId: String(resolved.test.paperId || ''),
      title: String(resolved.test.title || resolved.test.paperTitle || ''),
      subject: String(resolved.test.subject || resolved.test.subjectName || ''),
      totalMarks: Number(row.totalMarks) || 0,
      duration: Number(row.duration) || 0,
      startedAt: iso(row.startedAt),
      endsAt: iso(row.endsAt),
      questions: questions.map(publicQuestion),
      flaggedQuestions: savedAnswers.filter((answer: ServerAnswer) => answer.isFlagged).map((answer: ServerAnswer) => answer.questionId),
      instructions: Array.isArray(resolved.test.instructions)
        ? resolved.test.instructions.map(String)
        : resolved.test.instructions ? [String(resolved.test.instructions)] : [],
      negativeMarking: questions.some((question) => question.negativeMarks > 0),
      collegeId: student.collegeId,
      totalQuestions: questions.length,
      studentStatus: 'in_progress',
      answers,
      resumed: true,
      enableProctoring: resolved.test.enableProctoring === true,
      allowResume: true,
      maxTabSwitches: Number(resolved.test.maxTabSwitches) || 0,
      shuffleQuestions: resolved.test.shuffleQuestions === true,
      shuffleOptions: resolved.test.shuffleOptions === true,
      shuffleSections: resolved.test.shuffleSections === true,
      scheduledStart: iso(resolved.test.startDateTime || resolved.test.scheduledAt),
    }
  }
)

/**
 * Identity check for autosave/log: the attempt row already carries `studentUid`
 * (written at start), so the common path costs 1 read instead of the
 * resolveStudent pair. Rows predating that field fall back to the legacy lookup.
 */
async function assertAttemptOwnership(
  uid: string,
  token: Record<string, unknown>,
  row: admin.firestore.DocumentData
): Promise<{ legacyStudentId: string | null }> {
  if (row.studentUid) {
    if (String(row.studentUid) !== uid || row.status !== 'in_progress') {
      throw new HttpsError('permission-denied', 'Active attempt not found')
    }
    return { legacyStudentId: null }
  }
  const student = await resolveStudent(uid, token)
  if (row.studentId !== student.id || row.status !== 'in_progress') {
    throw new HttpsError('permission-denied', 'Active attempt not found')
  }
  return { legacyStudentId: student.id }
}

/**
 * Saves answer deltas (or, for pre-deploy clients, the full keyed map) plus
 * batched proctor events.
 *
 * Cost profile per call:
 *  - fast path (attempt has an answerIndex): 1 attempt read + 1 txn read + 1
 *    write (+1 write for the proctoringLogs summary when the batch is non-empty).
 *    No scheduledTests read, no question reads, no resolveStudent pair.
 *  - legacy path (attempt predates the answer index, or an old client sends
 *    the full `answers` map): same as before — test + N question reads.
 */
export const autosaveMyStudentTest = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const assessmentId = String(request.data?.studentAssessmentId || '')
    if (!assessmentId || assessmentId.includes('/')) throw new HttpsError('invalid-argument', 'Invalid attempt ID')
    const db = admin.firestore()
    const assessmentRef = db.collection('studentAssessments').doc(assessmentId)
    const assessment = await assessmentRef.get()
    const row = assessment.data()
    if (!assessment.exists || !row) throw new HttpsError('permission-denied', 'Active attempt not found')
    const { legacyStudentId } = await assertAttemptOwnership(uid, request.auth?.token || {}, row)

    const proctorEvents = sanitizeProctorEvents(request.data?.proctorEvents)
    const deltaRaw = request.data?.delta
    const legacyRaw = request.data?.answers
    const hasDelta = isPlainObject(deltaRaw)
    const hasLegacy = isPlainObject(legacyRaw)

    let validated: ServerAnswer[] = []
    let replaceAll = false
    if (hasDelta) {
      const index = await readAnswerIndex(assessmentId, row)
      if (index) {
        validated = sanitizeAnswersWithIndex(deltaRaw, index)
      } else {
        // Attempt started before the answer index existed: fall back to the
        // question load so validation stays authoritative — then persist the
        // index so this expensive path runs at most ONCE per attempt.
        const testRef = db.collection('scheduledTests').doc(String(row.testId || ''))
        const test = await testRef.get()
        const testData = test.data()
        if (!test.exists || !testData) throw new HttpsError('failed-precondition', 'Scheduled test not found')
        if (testData.status === 'cancelled') throw new HttpsError('failed-precondition', 'This test has been cancelled')
        const questions = await loadTestQuestions(test.id, testData)
        const index = questionsToIndex(questions)
        validated = sanitizeAnswersWithIndex(deltaRaw, index)
        void healAnswerIndex(assessmentRef, assessmentId, index).catch(() => undefined)
      }
    } else if (hasLegacy) {
      // Pre-deploy client sends the full keyed answer map: unchanged semantics
      // (full replace, validated against the live questions).
      const testRef = db.collection('scheduledTests').doc(String(row.testId || ''))
      const test = await testRef.get()
      const testData = test.data()
      if (!test.exists || !testData) throw new HttpsError('failed-precondition', 'Scheduled test not found')
      if (testData.status === 'cancelled') throw new HttpsError('failed-precondition', 'This test has been cancelled')
      const questions = await loadTestQuestions(test.id, testData)
      validated = sanitizeAnswers(legacyRaw, questions)
      replaceAll = true
    }

    const startedAt = timestampToDate(row.startedAt)
    const timeSpent = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)) : 0
    await db.runTransaction(async (transaction) => {
      const freshAttempt = await transaction.get(assessmentRef)
      const freshRow = freshAttempt.data()
      if (!freshAttempt.exists || !freshRow || freshRow.status !== 'in_progress') {
        throw new HttpsError('failed-precondition', 'Attempt is no longer active')
      }
      if (legacyStudentId
        ? freshRow.studentId !== legacyStudentId
        : String(freshRow.studentUid || '') !== uid) {
        throw new HttpsError('failed-precondition', 'Attempt is no longer active')
      }
      const existing = Array.isArray(freshRow.answers) ? (freshRow.answers as ServerAnswer[]) : []
      const update: admin.firestore.DocumentData = {
        answers: replaceAll ? validated : mergeAnswers(existing, validated),
        timeSpent,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      if (proctorEvents.length > 0) {
        const stored = Array.isArray(freshRow.proctorEvents) ? (freshRow.proctorEvents as unknown[]) : []
        update.proctorEvents = [...stored, ...proctorEvents].slice(-MAX_STORED_PROCTOR_EVENTS)
      }
      transaction.update(assessmentRef, update)
    })

    // Blur-only batches are focus noise (a screen recorder or extension
    // stealing focus fires them continuously): they still ride along in the
    // row's proctorEvents, but they do not earn their own summary document.
    const meaningfulEvents = proctorEvents.filter((event) => event.type !== 'window_blur')
    if (proctorEvents.length > 0 && meaningfulEvents.length > 0) {
      // One summary doc per flush (was: one doc per event). `proctoringLogs`
      // has no readers today; the `kind` marker keeps future queries able to
      // tell batches apart from the high-severity direct-log docs.
      await db.collection('proctoringLogs').add({
        kind: 'autosave_batch',
        collegeId: String(row.collegeId || ''),
        testId: String(row.testId || ''),
        studentAssessmentId: assessmentId,
        studentId: String(row.studentId || ''),
        studentUid: uid,
        count: proctorEvents.length,
        events: proctorEvents.slice(0, MAX_LOGGED_BATCH_EVENTS),
        firstOccurredAt: proctorEvents[0]?.at || '',
        lastOccurredAt: proctorEvents[proctorEvents.length - 1]?.at || '',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
    return { success: true, savedAt: new Date().toISOString(), timeSpent }
  }
)

function outcome(row: admin.firestore.DocumentData) {
  return {
    studentAssessmentId: String(row.id || ''),
    testId: String(row.testId || ''),
    status: row.status,
    autoScore: Number(row.autoScore) || 0,
    autoMax: Number(row.autoMax) || 0,
    manualMax: Number(row.manualMax) || 0,
    needsManualGrading: Boolean(row.needsManualGrading),
    marksObtained: row.status === 'graded' ? Number(row.marksObtained) || 0 : null,
    percentage: row.status === 'graded' ? Number(row.percentage) || 0 : null,
    grade: row.status === 'graded' ? String(row.grade || '') : null,
    correctCount: Number(row.objectiveCorrectCount) || 0,
    incorrectCount: Number(row.objectiveIncorrectCount) || 0,
    unattemptedCount: Number(row.unattemptedCount) || 0,
    answeredCount: Number(row.answeredCount) || 0,
    timeSpent: Number(row.timeSpent) || 0,
  }
}

export const submitMyStudentTest = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 60 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const routeId = String(request.data?.testId || request.data?.studentAssessmentId || '')
    const resolved = await resolveOwnTest(routeId, student)
    const questions = await loadTestQuestions(resolved.testId, resolved.test)
    if (questions.length === 0) throw new HttpsError('failed-precondition', 'Test has no questions')
    const answers = sanitizeAnswers(request.data?.answers, questions)
    const graded = gradeAssessmentPaper(questions, answers)
    const assessmentRef = rowRef(resolved.testId, student.id)
    const auditRef = admin.firestore().collection('studentSubmissions').doc()

    const result = await admin.firestore().runTransaction(async (transaction) => {
      const [attempt, freshTestDoc] = await Promise.all([
        transaction.get(assessmentRef),
        transaction.get(resolved.testRef),
      ])
      const row = attempt.data()
      const freshTest = freshTestDoc.data()
      if (!attempt.exists || row?.studentId !== student.id) {
        throw new HttpsError('failed-precondition', 'Active attempt not found')
      }
      if (row.status === 'submitted' || row.status === 'graded') {
        return outcome({ id: attempt.id, ...row })
      }
      if (row.status !== 'in_progress') throw new HttpsError('failed-precondition', 'Attempt is not active')
      if (!freshTestDoc.exists || !freshTest || freshTest.status === 'cancelled') {
        throw new HttpsError('failed-precondition', 'Test is no longer accepting submissions')
      }

      const nowMs = Date.now()
      const attemptEnd = timestampToDate(row.endsAt)
      const scheduleEnd = timestampToDate(freshTest.endDateTime)
      const isLate = Boolean(attemptEnd && nowMs > attemptEnd.getTime() + 120_000)
      if (isLate && (
        freshTest.allowLateSubmission !== true
        || !scheduleEnd
        || nowMs > scheduleEnd.getTime()
      )) {
        throw new HttpsError('deadline-exceeded', 'The submission deadline has passed')
      }
      const latePenaltyPercentage = isLate
        ? Math.max(0, Math.min(100, Number(freshTest.lateSubmissionPenalty) || 0))
        : 0
      const startedAt = timestampToDate(row.startedAt)
      const timeSpent = startedAt ? Math.max(0, Math.floor((nowMs - startedAt.getTime()) / 1000)) : 0
      const totalMarks = Number(row.totalMarks)
        || questions.reduce((sum, question) => sum + question.marks, 0)
      const fullyObjective = !graded.needsManualGrading && graded.manualMax === 0
      const marksBeforePenalty = Math.max(0, graded.autoScore)
      const marksObtained = fullyObjective
        ? Math.round(marksBeforePenalty * (1 - latePenaltyPercentage / 100) * 100) / 100
        : null
      const percentage = marksObtained === null || totalMarks <= 0
        ? null
        : Math.round((marksObtained / totalMarks) * 10_000) / 100
      const finalGrade = percentage === null ? null : gradeFromPercentage(percentage)
      const status = fullyObjective ? 'graded' : 'submitted'
      const submittedAt = admin.firestore.FieldValue.serverTimestamp()
      const answerIds = new Set(answers.map((answer) => answer.questionId))
      const pendingManualIds = new Set(
        graded.perQuestion
          .filter((item) => item.status === 'pending_manual')
          .map((item) => item.questionId)
      )
      const manualGradeableMax = questions
        .filter((question) => pendingManualIds.has(question.id))
        .reduce((sum, question) => sum + question.marks, 0)
      const update: admin.firestore.DocumentData = {
        status,
        answers,
        timeSpent,
        submittedAt,
        updatedAt: submittedAt,
        autoScore: graded.autoScore,
        autoMax: graded.autoMax,
        manualMax: graded.manualMax,
        manualGradeableMax,
        needsManualGrading: !fullyObjective,
        objectiveCorrectCount: graded.correctCount,
        objectiveIncorrectCount: graded.incorrectCount,
        unattemptedCount: questions.filter((question) => !answerIds.has(question.id)).length,
        answeredCount: answers.length,
        gradingBreakdown: graded.perQuestion,
        autoSubmitted: Boolean(request.data?.autoSubmitted),
        isLateSubmission: isLate,
        latePenaltyPercentage,
      }
      if (fullyObjective && finalGrade) {
        Object.assign(update, {
          marksObtained,
          percentage,
          grade: finalGrade.grade,
          gradePoint: finalGrade.gradePoint,
          gradedAt: submittedAt,
          gradedBy: 'server-auto-grader',
        })
      }
      transaction.update(assessmentRef, update)
      transaction.create(auditRef, {
        kind: 'test',
        collegeId: student.collegeId,
        testId: resolved.testId,
        studentAssessmentId: assessmentRef.id,
        studentId: student.id,
        studentUid: uid,
        answers,
        timeSpent,
        autoScore: graded.autoScore,
        autoMax: graded.autoMax,
        manualMax: graded.manualMax,
        status,
        autoSubmitted: Boolean(request.data?.autoSubmitted),
        submittedAt,
      })
      transaction.update(resolved.testRef, {
        totalSubmitted: admin.firestore.FieldValue.increment(1),
        // Fully objective papers are graded at submission time.
        ...(fullyObjective ? { totalGraded: admin.firestore.FieldValue.increment(1) } : {}),
        updatedAt: submittedAt,
      })
      return outcome({ id: assessmentRef.id, testId: resolved.testId, ...row, ...update })
    })

    logger.info('[StudentAssessments] Test submitted', {
      uid,
      studentId: student.id,
      testId: resolved.testId,
      status: result.status,
    })
    const releaseAt = timestampToDate(resolved.test.resultPublishDate)
      || timestampToDate(resolved.test.endDateTime)
    if (result.status === 'graded' && (!releaseAt || Date.now() < releaseAt.getTime())) {
      return { ...result, marksObtained: null, percentage: null, grade: null }
    }
    return result
  }
)

/**
 * Direct log for severity-high proctor events (fullscreen_exit, auto_submit,
 * fullscreen_denied) — the faculty live view reads these. All other event
 * types are batched into autosave. Cost: 1 attempt read + 1 write.
 */
export const logMyStudentTestEvent = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 15, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const assessmentId = String(request.data?.studentAssessmentId || '')
    const type = String(request.data?.event?.type || '').slice(0, 80)
    const details = request.data?.event?.details
    if (!assessmentId || assessmentId.includes('/') || !type) {
      throw new HttpsError('invalid-argument', 'Attempt and event type are required')
    }
    const serializedDetails = JSON.stringify(details || {})
    if (Buffer.byteLength(serializedDetails, 'utf8') > MAX_PROCTOR_DETAILS_BYTES) {
      throw new HttpsError('invalid-argument', 'Event details are too large')
    }
    const attempt = await admin.firestore().collection('studentAssessments').doc(assessmentId).get()
    const row = attempt.data()
    if (!attempt.exists || !row) {
      throw new HttpsError('permission-denied', 'Active attempt not found')
    }
    await assertAttemptOwnership(uid, request.auth?.token || {}, row)
    await admin.firestore().collection('proctoringLogs').add({
      collegeId: String(row.collegeId || ''),
      testId: String(row.testId || ''),
      studentAssessmentId: assessmentId,
      studentId: String(row.studentId || ''),
      studentUid: uid,
      eventType: type,
      details: JSON.parse(serializedDetails),
      clientOccurredAt: String(request.data?.event?.at || '').slice(0, 40),
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true }
  }
)

export const getMyStudentTestResult = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const resolved = await resolveOwnTest(String(request.data?.testId || ''), student)
    const attempt = await rowRef(resolved.testId, student.id).get()
    const row = attempt.data()
    if (!attempt.exists || !['submitted', 'graded'].includes(String(row?.status || ''))) {
      throw new HttpsError('failed-precondition', 'A submitted attempt was not found')
    }
    const questions = await loadTestQuestions(resolved.testId, resolved.test)
    const answers = Array.isArray(row?.answers) ? row.answers as ServerAnswer[] : []
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]))
    const gradeMap = new Map(
      (Array.isArray(row?.gradingBreakdown) ? row.gradingBreakdown : [])
        .map((grade: admin.firestore.DocumentData) => [String(grade.questionId), grade])
    )
    const publishDate = timestampToDate(resolved.test.resultPublishDate)
    const endDate = timestampToDate(resolved.test.endDateTime)
    const reviewReleased = row?.status === 'graded'
      && Date.now() >= (publishDate || endDate || new Date(8640000000000000)).getTime()
    if (row?.status === 'graded' && !reviewReleased) {
      throw new HttpsError('failed-precondition', 'Result has been graded but is not released yet')
    }

    const sectionMap = new Map<string, { total: number; correct: number; incorrect: number; score: number; totalMarks: number }>()
    const questionResults = questions.map((question) => {
      const answer = answerMap.get(question.id)
      const grade = gradeMap.get(question.id)
      const sectionName = question.sectionName || 'General'
      const section = sectionMap.get(sectionName) || { total: 0, correct: 0, incorrect: 0, score: 0, totalMarks: 0 }
      section.total += 1
      section.totalMarks += question.marks
      if (grade?.status === 'correct') section.correct += 1
      if (grade?.status === 'incorrect') section.incorrect += 1
      section.score += Number(grade?.marksObtained) || 0
      sectionMap.set(sectionName, section)
      return {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        marks: question.marks,
        options: reviewReleased ? question.options.map((option) => option.text) : undefined,
        correctAnswer: reviewReleased ? correctAnswerText(question) : undefined,
        studentAnswer: reviewReleased ? answerText(question, answer) : undefined,
        isCorrect: reviewReleased && grade?.status === 'correct',
        isAttempted: Boolean(answerText(question, answer)),
        explanation: reviewReleased ? question.explanation : undefined,
        status: String(grade?.status || (answer ? 'pending_manual' : 'unattempted')),
        marksObtained: row?.status === 'graded' ? grade?.marksObtained ?? null : null,
        sectionName,
      }
    })
    const sectionScores = [...sectionMap.entries()].map(([sectionName, section]) => ({
      sectionName,
      ...section,
      percentage: section.totalMarks > 0 ? Math.round((section.score / section.totalMarks) * 100) : 0,
      timeTaken: 0,
      accuracy: section.total > 0 ? Math.round((section.correct / section.total) * 100) : 0,
    }))
    const totalMarks = Number(row?.totalMarks) || 0
    const marksObtained = row?.status === 'graded' ? Number(row.marksObtained) || 0 : 0
    return {
      studentAssessmentId: attempt.id,
      assessmentId: resolved.testId,
      title: String(row?.title || resolved.test.title || 'Assessment'),
      subject: String(row?.subject || resolved.test.subject || resolved.test.subjectName || ''),
      totalMarks,
      marksObtained,
      percentage: row?.status === 'graded' ? Number(row.percentage) || 0 : 0,
      grade: row?.status === 'graded' ? String(row.grade || '') : '',
      gradePoint: row?.status === 'graded' ? Number(row.gradePoint) || 0 : 0,
      timeSpent: Number(row?.timeSpent) || 0,
      totalQuestions: questions.length,
      answeredCount: Number(row?.answeredCount) || answers.length,
      correctCount: Number(row?.objectiveCorrectCount) || 0,
      incorrectCount: Number(row?.objectiveIncorrectCount) || 0,
      unattemptedCount: Number(row?.unattemptedCount) || 0,
      sectionScores,
      questionResults,
      leaderboard: [],
      rank: 0,
      totalStudents: 0,
      facultyFeedback: row?.facultyFeedback ? String(row.facultyFeedback) : undefined,
      submittedAt: iso(row?.submittedAt),
      gradedAt: iso(row?.gradedAt) || undefined,
      passingPercentage: Number(resolved.test.passingPercentage || resolved.test.passingMarks) || 40,
      percentile: 0,
      completedAt: iso(row?.submittedAt),
      flaggedCount: answers.filter((answer) => answer.isFlagged).length,
      pendingManualGrading: row?.status !== 'graded',
      autoScore: Number(row?.autoScore) || 0,
      autoMax: Number(row?.autoMax) || 0,
      manualPending: Boolean(row?.needsManualGrading),
      reviewReleased,
    }
  }
)

export const listManagedAssessmentTests = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    if (!collegeId) throw new HttpsError('invalid-argument', 'collegeId is required')
    // Every assessment manager (faculty, hod, principal, admin) sees the
    // college-wide list — "My tests" is shared, not creator-only.
    const snapshot = await admin.firestore().collection('scheduledTests')
      .where('collegeId', '==', collegeId)
      .orderBy('createdAt', 'desc').limit(200)
      .get()
    return {
      tests: snapshot.docs.map((test) => {
        const data = test.data()
        return {
          id: test.id,
          ...data,
          startDateTime: iso(data.startDateTime),
          endDateTime: iso(data.endDateTime),
          resultPublishDate: iso(data.resultPublishDate) || null,
          createdAt: iso(data.createdAt),
          updatedAt: iso(data.updatedAt),
        }
      }),
    }
  }
)

/**
 * Resolve the questions a paper would actually schedule: embedded `sections`
 * first (the Confirm pipeline stores the reviewed structure there), otherwise
 * the linked question-bank documents, in the paper's own order. Mirrors the
 * resolution order `loadTestQuestions` uses at schedule time, so a "check"
 * and a real schedule can never disagree about which questions are in play.
 */
export async function resolvePaperSchedulableQuestions(paper: admin.firestore.DocumentData): Promise<ServerQuestion[]> {
  const embedded: ServerQuestion[] = []
  if (Array.isArray(paper.sections)) {
    paper.sections.forEach((section: admin.firestore.DocumentData) => {
      if (!Array.isArray(section.questions)) return
      section.questions.forEach((question: admin.firestore.DocumentData) => {
        if (embedded.length >= MAX_QUESTIONS) return
        embedded.push(normalizeQuestion(
          {
            ...question,
            sectionId: question.sectionId || section.id,
            sectionName: question.sectionName || section.name || section.title,
          },
          String(question.id || question.questionId || `q-${embedded.length + 1}`),
          embedded.length + 1
        ))
      })
    })
  }
  if (embedded.length > 0) return embedded

  const questionIds = Array.isArray(paper.linkedQuestionIds)
    ? paper.linkedQuestionIds
    : Array.isArray(paper.questionIds) ? paper.questionIds : []
  if (questionIds.length === 0 || questionIds.length > MAX_QUESTIONS) return []

  const db = admin.firestore()
  const refs = questionIds.map((id: unknown) => db.collection('questions').doc(String(id)))
  const out: ServerQuestion[] = []
  for (let i = 0; i < refs.length; i += 100) {
    const docs = await db.getAll(...refs.slice(i, i + 100))
    docs.forEach((snap) => {
      if (!snap.exists || out.length >= MAX_QUESTIONS) return
      out.push(normalizeQuestion(snap.data() || {}, snap.id, out.length + 1))
    })
  }
  return out
}

export const checkPaperScheduling = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = staff.role === 'superadmin' ? String(input.collegeId || '') : staff.collegeId
    const paperId = String(input.paperId || '')
    if (!collegeId) throw new HttpsError('invalid-argument', 'collegeId is required')
    if (!paperId || paperId.includes('/')) throw new HttpsError('invalid-argument', 'paperId is required')

    const paperDoc = await admin.firestore().collection('papers').doc(paperId).get()
    const paper = paperDoc.data()
    if (!paperDoc.exists || !paper || paper.collegeId !== collegeId) {
      throw new HttpsError('not-found', 'Paper was not found in this college')
    }

    // The SAME validator and the SAME resolution order as the schedule-time
    // gate, run read-only — so what the scheduler warns about is exactly
    // what a real schedule would accept, with the same per-question wording.
    const questions = await resolvePaperSchedulableQuestions(paper)
    const issues: string[] = []
    for (const question of questions) {
      const problem = findSchedulingProblem(question)
      if (problem !== null) issues.push(problem)
    }
    return {
      ok: questions.length >= 1 && issues.length === 0,
      questionCount: questions.length,
      issueCount: issues.length,
      firstIssue: issues[0] || null,
      issues: issues.slice(0, 5),
    }
  }
)

export const scheduleAssessmentTest = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 20 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const input = (request.data || {}) as Record<string, unknown>
    const collegeId = staff.role === 'superadmin' ? String(input.collegeId || '') : staff.collegeId
    const title = String(input.title || '').trim()
    const paperId = String(input.paperId || '')
    const start = parseRequiredDate(input.startDateTime || input.scheduledAt, 'startDateTime')
    const end = parseRequiredDate(input.endDateTime, 'endDateTime')
    const duration = Number(input.durationMinutes || input.duration)
    const visibility = String(input.visibility || 'public')
    if (!collegeId || title.length < 2 || title.length > 200 || !paperId || paperId.includes('/')) {
      throw new HttpsError('invalid-argument', 'College, title, and paper are required')
    }
    if (end <= start || end.getTime() <= Date.now()) {
      throw new HttpsError('invalid-argument', 'Test end time must be in the future and after start time')
    }
    if (
      !Number.isInteger(duration)
      || duration < 1
      || duration > 480
      || duration * 60_000 > end.getTime() - start.getTime()
    ) {
      throw new HttpsError('invalid-argument', 'Duration must be 1–480 minutes and fit inside the test window')
    }
    if (!['public', 'college', 'selected'].includes(visibility)) {
      throw new HttpsError('invalid-argument', 'Visibility is invalid')
    }

    const db = admin.firestore()
    const paperDoc = await db.collection('papers').doc(paperId).get()
    const paper = paperDoc.data()
    if (!paperDoc.exists || !paper || paper.collegeId !== collegeId) {
      throw new HttpsError('not-found', 'Paper was not found in this college')
    }
    if (!['approved', 'published'].includes(String(paper.status || ''))) {
      throw new HttpsError('failed-precondition', 'Paper must be approved before scheduling')
    }
    if (staff.role === 'faculty' && paper.createdBy && paper.createdBy !== uid) {
      throw new HttpsError('permission-denied', 'Faculty may schedule only their own approved papers')
    }

    const testRef = db.collection('scheduledTests').doc()
    const questions = await loadTestQuestions(testRef.id, { paperId })
    if (questions.length < 1 || questions.length > MAX_QUESTIONS) {
      throw new HttpsError('failed-precondition', `Paper must contain between 1 and ${MAX_QUESTIONS} questions`)
    }
    // The schedulable set is the SAME one the paper pipeline's Confirm uses
    // (functions/src/questionTypes.ts), and the message now names the exact
    // defect instead of the old blanket "incomplete or unsupported" text that
    // left faculty guessing which question and why.
    let problemMessage: string | null = null
    for (const question of questions) {
      const problem = findSchedulingProblem(question)
      if (problem !== null) {
        problemMessage = problem
        break
      }
    }
    if (problemMessage) {
      throw new HttpsError('failed-precondition', problemMessage)
    }
    const targetSections = Array.isArray(input.targetSections)
      ? input.targetSections.slice(0, 100).map((target: unknown) => {
          const value = (target || {}) as Record<string, unknown>
          return {
            sectionId: String(value.sectionId || '').trim().slice(0, 200),
            sectionName: String(value.sectionName || '').trim().slice(0, 200),
            section: String(value.section || value.division || '').trim().slice(0, 100),
            branch: String(value.branch || '').trim().slice(0, 100),
            batch: String(value.batch || '').trim().slice(0, 100),
            semester: Math.max(0, Math.min(20, Number(value.semester) || 0)),
          }
        }).filter((target) => target.sectionId || target.sectionName || target.section)
      : []
    const targetStudents = Array.isArray(input.targetStudents)
      ? [...new Set(input.targetStudents.map(String).filter(Boolean))].slice(0, 500)
      : []
    if (visibility === 'selected' && targetSections.length === 0 && targetStudents.length === 0) {
      throw new HttpsError('invalid-argument', 'Selected visibility requires a section or student')
    }
    const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0)
    const resultPublishDate = input.resultPublishDate
      ? parseRequiredDate(input.resultPublishDate, 'resultPublishDate')
      : end
    if (resultPublishDate < start) {
      throw new HttpsError('invalid-argument', 'Result publication cannot be before the test starts')
    }

    const batch = db.batch()
    batch.create(testRef, {
      title,
      description: String(input.description || input.instructions || '').slice(0, 10_000),
      instructions: String(input.instructions || input.description || '').slice(0, 10_000),
      paperId,
      subject: String(input.subject || input.subjectName || paper.subject || ''),
      subjectName: String(input.subjectName || input.subject || paper.subject || ''),
      subjectId: String(input.subjectId || paper.subjectId || ''),
      collegeId,
      facultyId: uid,
      facultyName: staff.name,
      // Cohort the faculty selected while scheduling. 'public' visibility
      // still shows the test to every student in the college; these fields
      // act as the fallback filter for 'selected' tests and are displayed on
      // the faculty list and report.
      branch: String(input.branch || '').trim().slice(0, 100),
      batch: String(input.batch || '').trim().slice(0, 100),
      startDateTime: admin.firestore.Timestamp.fromDate(start),
      scheduledAt: admin.firestore.Timestamp.fromDate(start),
      endDateTime: admin.firestore.Timestamp.fromDate(end),
      duration,
      durationMinutes: duration,
      visibility,
      targetSections,
      targetStudents,
      allowLateSubmission: Boolean(input.allowLateSubmission),
      lateSubmissionPenalty: Math.max(0, Math.min(100, Number(input.lateSubmissionPenalty) || 0)),
      enableProctoring: Boolean(input.enableProctoring),
      // 0 = unlimited tab switches; the student engine auto-submits beyond this.
      maxTabSwitches: Math.max(0, Math.min(20, Math.trunc(Number(input.maxTabSwitches) || 0))),
      shuffleQuestions: Boolean(input.shuffleQuestions),
      shuffleOptions: Boolean(input.shuffleOptions),
      shuffleSections: Boolean(input.shuffleSections),
      requireFaceVerification: Boolean(input.requireFaceVerification),
      resultPublishDate: admin.firestore.Timestamp.fromDate(resultPublishDate),
      showResultImmediately: paper.showResultImmediately !== false,
      passingMarks: Number(paper.passingMarks) || Math.ceil(totalMarks * 0.4),
      totalMarks,
      totalQuestions: questions.length,
      status: 'scheduled',
      totalRegistered: 0,
      totalStarted: 0,
      totalSubmitted: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    questions.forEach((question, index) => {
      const questionRef = testRef.collection('assessmentQuestions').doc(`q-${String(index + 1).padStart(4, '0')}`)
      batch.create(questionRef, { ...question, id: questionRef.id, order: index + 1 })
    })
    await batch.commit()
    logger.info('[StudentAssessments] Test scheduled', {
      testId: testRef.id,
      paperId,
      collegeId,
      facultyId: uid,
      questionCount: questions.length,
    })
    return { id: testRef.id, status: 'scheduled' }
  }
)

export const publishAssessmentTest = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const testId = String(request.data?.testId || '')
    if (!testId || testId.includes('/')) throw new HttpsError('invalid-argument', 'A valid testId is required')
    const testRef = admin.firestore().collection('scheduledTests').doc(testId)
    const testDoc = await testRef.get()
    const test = testDoc.data()
    if (!testDoc.exists || !test) throw new HttpsError('not-found', 'Test not found')
    if (staff.role !== 'superadmin' && test.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Test belongs to another college')
    }
    if (staff.role === 'faculty' && test.facultyId !== uid) {
      throw new HttpsError('permission-denied', 'Faculty may publish only their own tests')
    }
    if (String(test.status) !== 'scheduled') throw new HttpsError('failed-precondition', 'Only scheduled tests can be published')
    const end = timestampToDate(test.endDateTime)
    if (!end || end.getTime() <= Date.now()) throw new HttpsError('failed-precondition', 'Test window has already ended')
    const questions = await testRef.collection('assessmentQuestions').limit(1).get()
    if (questions.empty) throw new HttpsError('failed-precondition', 'Test has no frozen question snapshot')
    await testRef.update({
      status: 'published',
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true }
  }
)

export const cancelAssessmentTest = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const testId = String(request.data?.testId || '')
    const reason = String(request.data?.reason || '').trim()
    if (!testId || testId.includes('/') || reason.length < 3 || reason.length > 1000) {
      throw new HttpsError('invalid-argument', 'A valid test and cancellation reason are required')
    }
    const testRef = admin.firestore().collection('scheduledTests').doc(testId)
    const testDoc = await testRef.get()
    const test = testDoc.data()
    if (!testDoc.exists || !test) throw new HttpsError('not-found', 'Test not found')
    if (staff.role !== 'superadmin' && test.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Test belongs to another college')
    }
    if (staff.role === 'faculty' && test.facultyId !== uid) {
      throw new HttpsError('permission-denied', 'Faculty may cancel only their own tests')
    }
    if (['completed', 'cancelled'].includes(String(test.status))) {
      throw new HttpsError('failed-precondition', 'Test can no longer be cancelled')
    }
    await testRef.update({
      status: 'cancelled',
      cancellationReason: reason,
      cancelledBy: uid,
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true }
  }
)

export const gradeStudentAssessmentSubmission = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const assessmentId = String(request.data?.studentAssessmentId || '')
    const requestedManualScore = request.data?.manualScore === undefined
      ? null
      : Number(request.data.manualScore)
    const requestedFinalMarks = request.data?.marksObtained === undefined
      ? null
      : Number(request.data.marksObtained)
    const feedback = String(request.data?.feedback || '').trim()
    if (
      !assessmentId
      || assessmentId.includes('/')
      || (requestedManualScore === null && requestedFinalMarks === null)
      || (requestedManualScore !== null && !Number.isFinite(requestedManualScore))
      || (requestedFinalMarks !== null && !Number.isFinite(requestedFinalMarks))
      || feedback.length > 5000
    ) {
      throw new HttpsError('invalid-argument', 'Attempt, score, or feedback is invalid')
    }
    const db = admin.firestore()
    const assessmentRef = db.collection('studentAssessments').doc(assessmentId)
    const result = await db.runTransaction(async (transaction) => {
      const assessmentDoc = await transaction.get(assessmentRef)
      const row = assessmentDoc.data()
      if (!assessmentDoc.exists || !row) throw new HttpsError('not-found', 'Student assessment not found')
      if (staff.role !== 'superadmin' && row.collegeId !== staff.collegeId) {
        throw new HttpsError('permission-denied', 'Attempt belongs to another college')
      }
      if (row.status !== 'submitted' || !row.needsManualGrading) {
        throw new HttpsError('failed-precondition', 'Attempt is not awaiting manual grading')
      }
      const testRef = db.collection('scheduledTests').doc(String(row.testId || row.assessmentId || ''))
      const testDoc = await transaction.get(testRef)
      const test = testDoc.data()
      if (!testDoc.exists || !test) throw new HttpsError('failed-precondition', 'Scheduled test not found')
      if (staff.role === 'faculty' && test.facultyId !== uid) {
        throw new HttpsError('permission-denied', 'Faculty may grade only their own tests')
      }
      const manualMax = row.manualGradeableMax === undefined
        ? Number(row.manualMax) || 0
        : Number(row.manualGradeableMax) || 0
      const totalMarks = Number(row.totalMarks) || Number(test.totalMarks) || 0
      const autoScore = Number(row.autoScore) || 0
      const penalty = Math.max(0, Math.min(100, Number(row.latePenaltyPercentage) || 0))
      const penaltyFactor = 1 - penalty / 100
      const manualScore = requestedManualScore !== null
        ? requestedManualScore
        : (penaltyFactor > 0 ? Number(requestedFinalMarks) / penaltyFactor : 0) - autoScore
      if (manualScore < 0 || manualScore > manualMax) {
        throw new HttpsError('invalid-argument', `Final score is inconsistent with the objective score; manual component must be between 0 and ${manualMax}`)
      }
      const rawMarks = Math.max(0, autoScore + manualScore)
      const marksObtained = Math.round(rawMarks * penaltyFactor * 100) / 100
      const percentage = totalMarks > 0
        ? Math.round((Math.min(marksObtained, totalMarks) / totalMarks) * 10_000) / 100
        : 0
      const derived = gradeFromPercentage(percentage)
      transaction.update(assessmentRef, {
        status: 'graded',
        manualScore,
        marksObtained,
        percentage,
        grade: derived.grade,
        gradePoint: derived.gradePoint,
        facultyFeedback: feedback,
        gradingBreakdown: Array.isArray(row.gradingBreakdown)
          ? row.gradingBreakdown.map((item: admin.firestore.DocumentData) =>
              item.status === 'pending_manual' ? { ...item, status: 'manual_graded' } : item
            )
          : [],
        needsManualGrading: false,
        gradedAt: admin.firestore.FieldValue.serverTimestamp(),
        gradedBy: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      // Keep the faculty list's "graded" counter current (self-maintained,
      // no extra reads anywhere else).
      transaction.update(testRef, {
        totalGraded: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      return { marksObtained, percentage, grade: derived.grade, gradePoint: derived.gradePoint }
    })
    return { success: true, ...result }
  }
)

export const listPendingAssessmentSubmissions = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    if (!collegeId) throw new HttpsError('invalid-argument', 'collegeId is required')
    const snapshot = await admin.firestore().collection('studentAssessments')
      .where('collegeId', '==', collegeId)
      .where('status', '==', 'submitted')
      .limit(100)
      .get()
    const candidates = snapshot.docs.filter((attempt) => attempt.data().needsManualGrading === true)
    const testIds = [...new Set(candidates.map((attempt) => String(attempt.data().testId || '')).filter(Boolean))]
    const testDocs = testIds.length > 0
      ? await admin.firestore().getAll(...testIds.map((id) => admin.firestore().collection('scheduledTests').doc(id)))
      : []
    const tests = new Map(testDocs.filter((test) => test.exists).map((test) => [test.id, test.data() || {}]))
    const visibleCandidates = candidates.filter((attempt) => {
      if (staff.role !== 'faculty') return true
      return tests.get(String(attempt.data().testId || ''))?.facultyId === uid
    })
    const questionCache = new Map<string, ServerQuestion[]>()
    await Promise.all([...new Set(visibleCandidates.map((attempt) => String(attempt.data().testId || '')))].map(async (testId) => {
      const test = tests.get(testId)
      if (test) questionCache.set(testId, await loadTestQuestions(testId, test))
    }))

    return {
      submissions: visibleCandidates.map((attempt) => {
        const row = attempt.data()
        const testId = String(row.testId || '')
        const questions = questionCache.get(testId) || []
        const answers = new Map(
          (Array.isArray(row.answers) ? row.answers : [])
            .map((answer: ServerAnswer) => [answer.questionId, answer])
        )
        const manualIds = new Set(
          (Array.isArray(row.gradingBreakdown) ? row.gradingBreakdown : [])
            .filter((item: admin.firestore.DocumentData) => item.isObjective === false)
            .map((item: admin.firestore.DocumentData) => String(item.questionId))
        )
        return {
          id: attempt.id,
          testId,
          title: String(row.title || tests.get(testId)?.title || 'Assessment'),
          subject: String(row.subject || tests.get(testId)?.subject || ''),
          studentId: String(row.studentId || ''),
          studentName: String(row.studentName || ''),
          regNo: String(row.regNo || ''),
          autoScore: Number(row.autoScore) || 0,
          autoMax: Number(row.autoMax) || 0,
          manualMax: row.manualGradeableMax === undefined
            ? Number(row.manualMax) || 0
            : Number(row.manualGradeableMax) || 0,
          manualPaperMax: Number(row.manualMax) || 0,
          totalMarks: Number(row.totalMarks) || 0,
          submittedAt: iso(row.submittedAt),
          isLateSubmission: Boolean(row.isLateSubmission),
          latePenaltyPercentage: Number(row.latePenaltyPercentage) || 0,
          responses: questions
            .filter((question) => manualIds.has(question.id))
            .map((question) => ({
              questionId: question.id,
              questionText: question.text,
              type: question.type,
              marks: question.marks,
              answer: answerText(question, answers.get(question.id)),
            })),
        }
      }),
    }
  }
)

/**
 * Faculty test report: summary aggregates + per-student outcomes for one
 * scheduled test. One indexed query over the attempt rows (deterministic doc
 * ids, testId filter) with field selection keeps it cheap even for large
 * batches. Also self-heals the legacy counters (tests scheduled before
 * totalSubmitted tracking) with a one-time backfill write.
 */
export const getAssessmentTestReport = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {})
    requireAssessmentManager(staff)
    const testId = String(request.data?.testId || '')
    if (!testId) throw new HttpsError('invalid-argument', 'testId is required')
    const db = admin.firestore()
    const testRef = db.collection('scheduledTests').doc(testId)
    const testDoc = await testRef.get()
    const test = testDoc.data()
    if (!testDoc.exists || !test) throw new HttpsError('not-found', 'Scheduled test not found')
    // Any assessment manager of the test's college may open the report
    // (faculty, hod, principal, admin; superadmin for any college).
    if (staff.role !== 'superadmin' && test.collegeId && test.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Test belongs to another college')
    }

    const snapshot = await db.collection('studentAssessments')
      .where('testId', '==', testId)
      .select(
        'studentId', 'studentName', 'regNo', 'status',
        'totalMarks', 'autoScore', 'autoMax', 'manualMax', 'manualScore',
        'marksObtained', 'percentage', 'grade', 'timeSpent',
        'submittedAt', 'gradedAt', 'isLateSubmission', 'latePenaltyPercentage',
        'autoSubmitted', 'needsManualGrading'
      )
      .limit(500)
      .get()
    const rows = snapshot.docs.map((doc) => doc.data() || {})

    let submitted = 0
    let graded = 0
    let pendingManual = 0
    let inProgress = 0
    let notStarted = 0
    let lateSubmissions = 0
    let autoSubmittedCount = 0
    const percentages: number[] = []
    const marksObtainedList: number[] = []
    rows.forEach((row) => {
      const status = String(row.status || 'not_started')
      if (status === 'submitted' || status === 'graded') {
        submitted += 1
        if (row.isLateSubmission === true) lateSubmissions += 1
        if (row.autoSubmitted === true) autoSubmittedCount += 1
        if (typeof row.marksObtained === 'number') marksObtainedList.push(row.marksObtained)
        if (status === 'graded') {
          graded += 1
          if (typeof row.percentage === 'number') percentages.push(row.percentage)
        } else if (row.needsManualGrading === true) {
          pendingManual += 1
        }
      } else if (status === 'in_progress') {
        inProgress += 1
      } else {
        notStarted += 1
      }
    })
    const round1 = (value: number) => Math.round(value * 10) / 10
    const avgPercentage = percentages.length > 0 ? round1(percentages.reduce((a, b) => a + b, 0) / percentages.length) : null
    const maxPercentage = percentages.length > 0 ? round1(Math.max(...percentages)) : null
    const minPercentage = percentages.length > 0 ? round1(Math.min(...percentages)) : null
    const avgMarksObtained = marksObtainedList.length > 0 ? round1(marksObtainedList.reduce((a, b) => a + b, 0) / marksObtainedList.length) : null

    // One-time self-heal: tests scheduled before counter tracking (or before
    // totalGraded tracking) have missing counters; backfill them so the list
    // view is accurate forever after this first report open.
    const needsSubmittedHeal = test.totalSubmitted === undefined
      || (Number(test.totalSubmitted) === 0 && submitted > 0)
    const needsGradedHeal = test.totalGraded === undefined && graded > 0
    if (needsSubmittedHeal || needsGradedHeal) {
      const heal: admin.firestore.DocumentData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
      if (needsSubmittedHeal) heal.totalSubmitted = admin.firestore.FieldValue.increment(submitted)
      if (needsGradedHeal) heal.totalGraded = admin.firestore.FieldValue.increment(graded)
      void testRef.update(heal).catch(() => undefined)
    }

    return {
      test: {
        id: testId,
        title: String(test.title || ''),
        subject: String(test.subject || ''),
        facultyId: String(test.facultyId || ''),
        facultyName: String(test.facultyName || ''),
        branch: String(test.branch || ''),
        batch: String(test.batch || ''),
        status: String(test.status || 'scheduled'),
        startDateTime: iso(test.startDateTime),
        endDateTime: iso(test.endDateTime),
        resultPublishDate: iso(test.resultPublishDate) || null,
        totalQuestions: Number(test.totalQuestions) || 0,
        totalMarks: Number(test.totalMarks) || 0,
        enableProctoring: Boolean(test.enableProctoring),
        maxTabSwitches: Number(test.maxTabSwitches) || 0,
        shuffleQuestions: test.shuffleQuestions === true,
        shuffleOptions: test.shuffleOptions === true,
        shuffleSections: test.shuffleSections === true,
        totalRegistered: Number(test.totalRegistered) || 0,
        totalStarted: Number(test.totalStarted) || 0,
        totalSubmitted: Number(test.totalSubmitted) || 0,
        totalGraded: Number(test.totalGraded) || 0,
      },
      summary: {
        totalScheduled: Number(test.totalRegistered) || 0,
        submitted,
        graded,
        pendingManual,
        inProgress,
        notStarted,
        lateSubmissions,
        autoSubmittedCount,
        avgPercentage,
        maxPercentage,
        minPercentage,
        avgMarksObtained,
      },
      students: rows.map((row) => ({
        studentId: String(row.studentId || ''),
        studentName: String(row.studentName || 'Student'),
        regNo: String(row.regNo || ''),
        status: String(row.status || 'not_started'),
        totalMarks: Number(row.totalMarks) || 0,
        autoScore: row.autoScore === undefined ? null : Number(row.autoScore) || 0,
        marksObtained: row.marksObtained === undefined || row.marksObtained === null ? null : Number(row.marksObtained),
        percentage: row.percentage === undefined || row.percentage === null ? null : Number(row.percentage),
        grade: row.grade === undefined || row.grade === null ? null : String(row.grade),
        timeSpent: row.timeSpent === undefined ? null : Number(row.timeSpent) || 0,
        submittedAt: row.submittedAt === undefined || row.submittedAt === null ? null : iso(row.submittedAt),
        isLateSubmission: row.isLateSubmission === true,
        latePenaltyPercentage: Number(row.latePenaltyPercentage) || 0,
        autoSubmitted: row.autoSubmitted === true,
        needsManualGrading: row.needsManualGrading === true,
      })),
    }
  }
)

async function finalizeExpiredAttempt(
  attemptDoc: FirebaseFirestore.QueryDocumentSnapshot
): Promise<'submitted' | 'graded' | 'skipped'> {
  const db = admin.firestore()
  const initialRow = attemptDoc.data()
  const testId = String(initialRow.testId || initialRow.assessmentId || '')
  if (!testId) return 'skipped'
  const testRef = db.collection('scheduledTests').doc(testId)
  const testDoc = await testRef.get()
  const test = testDoc.data()
  if (!testDoc.exists || !test || test.status === 'cancelled') return 'skipped'
  const questions = await loadTestQuestions(testId, test)
  if (questions.length === 0) return 'skipped'
  const auditRef = db.collection('studentSubmissions').doc()

  return db.runTransaction(async (transaction) => {
    const [freshAttemptDoc, freshTestDoc] = await Promise.all([
      transaction.get(attemptDoc.ref),
      transaction.get(testRef),
    ])
    const row = freshAttemptDoc.data()
    const freshTest = freshTestDoc.data()
    const autoSubmitAt = timestampToDate(row?.autoSubmitAt || row?.endsAt)
    if (
      !freshAttemptDoc.exists
      || !row
      || row.status !== 'in_progress'
      || !autoSubmitAt
      || autoSubmitAt.getTime() > Date.now()
      || !freshTestDoc.exists
      || !freshTest
      || freshTest.status === 'cancelled'
    ) return 'skipped'

    const storedAnswers = Array.isArray(row.answers) ? row.answers as ServerAnswer[] : []
    const answerObject = Object.fromEntries(storedAnswers.map((answer) => [answer.questionId, answer]))
    const answers = sanitizeAnswers(answerObject, questions)
    const graded = gradeAssessmentPaper(questions, answers)
    const totalMarks = Number(row.totalMarks)
      || questions.reduce((sum, question) => sum + question.marks, 0)
    const attemptEnd = timestampToDate(row.endsAt)
    const isLate = Boolean(attemptEnd && autoSubmitAt.getTime() > attemptEnd.getTime() + 120_000)
    const latePenaltyPercentage = isLate
      ? Math.max(0, Math.min(100, Number(freshTest.lateSubmissionPenalty) || 0))
      : 0
    const answerIds = new Set(answers.map((answer) => answer.questionId))
    const pendingManualIds = new Set(
      graded.perQuestion
        .filter((item) => item.status === 'pending_manual')
        .map((item) => item.questionId)
    )
    const manualGradeableMax = questions
      .filter((question) => pendingManualIds.has(question.id))
      .reduce((sum, question) => sum + question.marks, 0)
    const needsManualGrading = graded.needsManualGrading && manualGradeableMax > 0
    const status = needsManualGrading ? 'submitted' : 'graded'
    const marksBeforePenalty = Math.max(0, graded.autoScore)
    const marksObtained = status === 'graded'
      ? Math.round(marksBeforePenalty * (1 - latePenaltyPercentage / 100) * 100) / 100
      : null
    const percentage = marksObtained === null || totalMarks <= 0
      ? null
      : Math.round((marksObtained / totalMarks) * 10_000) / 100
    const derived = percentage === null ? null : gradeFromPercentage(percentage)
    const startedAt = timestampToDate(row.startedAt)
    const timeSpent = startedAt
      ? Math.max(0, Math.floor((autoSubmitAt.getTime() - startedAt.getTime()) / 1000))
      : Number(row.timeSpent) || 0
    const submittedAt = admin.firestore.FieldValue.serverTimestamp()
    const update: admin.firestore.DocumentData = {
      status,
      answers,
      timeSpent,
      submittedAt,
      updatedAt: submittedAt,
      autoScore: graded.autoScore,
      autoMax: graded.autoMax,
      manualMax: graded.manualMax,
      manualGradeableMax,
      needsManualGrading,
      objectiveCorrectCount: graded.correctCount,
      objectiveIncorrectCount: graded.incorrectCount,
      unattemptedCount: questions.filter((question) => !answerIds.has(question.id)).length,
      answeredCount: answers.length,
      gradingBreakdown: graded.perQuestion,
      autoSubmitted: true,
      isLateSubmission: isLate,
      latePenaltyPercentage,
    }
    if (status === 'graded' && derived) {
      Object.assign(update, {
        marksObtained,
        percentage,
        grade: derived.grade,
        gradePoint: derived.gradePoint,
        gradedAt: submittedAt,
        gradedBy: 'server-expiry-grader',
      })
    }
    transaction.update(attemptDoc.ref, update)
    transaction.create(auditRef, {
      kind: 'test',
      collegeId: String(row.collegeId || ''),
      testId,
      studentAssessmentId: attemptDoc.id,
      studentId: String(row.studentId || ''),
      studentUid: String(row.studentUid || ''),
      answers,
      timeSpent,
      autoScore: graded.autoScore,
      autoMax: graded.autoMax,
      manualMax: graded.manualMax,
      status,
      autoSubmitted: true,
      submittedAt,
    })
    transaction.update(testRef, {
      totalSubmitted: admin.firestore.FieldValue.increment(1),
      ...(status === 'graded' ? { totalGraded: admin.firestore.FieldValue.increment(1) } : {}),
      updatedAt: submittedAt,
    })
    return status
  })
}

/** Finalizes attempts whose browser disconnected before its own timer submitted. */
export const autoSubmitExpiredStudentTests = onSchedule(
  {
    region: 'asia-south1',
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Kolkata',
    memory: '512MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async () => {
    const now = admin.firestore.Timestamp.now()
    const collectionRef = admin.firestore().collection('studentAssessments')
    const [modern, legacy] = await Promise.all([
      collectionRef
        .where('status', '==', 'in_progress')
        .where('autoSubmitAt', '<=', now)
        .limit(100)
        .get(),
      collectionRef
        .where('status', '==', 'in_progress')
        .where('endsAt', '<=', now)
        .limit(100)
        .get(),
    ])
    const attempts = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>()
    modern.docs.forEach((attempt) => attempts.set(attempt.id, attempt))
    legacy.docs.forEach((attempt) => {
      if (!attempt.data().autoSubmitAt) attempts.set(attempt.id, attempt)
    })
    const outcomes = await Promise.allSettled([...attempts.values()].map(finalizeExpiredAttempt))
    const failures = outcomes.filter((outcome) => outcome.status === 'rejected')
    if (failures.length > 0) {
      logger.error('[StudentAssessments] Some expired attempts could not be finalized', {
        scanned: attempts.size,
        failures: failures.length,
      })
    } else if (attempts.size > 0) {
      logger.info('[StudentAssessments] Expired attempts finalized', { scanned: attempts.size })
    }
  }
)
