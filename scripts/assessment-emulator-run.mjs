#!/usr/bin/env node
/**
 * Disposable assessment callable smoke/load runner.
 * Requires the Auth, Firestore and Functions emulators to be running.
 * It never uses the production project because all endpoints are localhost.
 */
import * as admin from '../functions/node_modules/firebase-admin/lib/index.js'
import { mkdir, writeFile } from 'node:fs/promises'

const PROJECT_ID = 'demo-vriddhi-assessment'
const REGION = 'asia-south1'
const FUNCTIONS_BASE = `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`
const AUTH_API = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const STUDENTS = Number(process.argv[process.argv.indexOf('--students') + 1]) || 10
const runId = `phase0-${Date.now()}`

if (!Number.isInteger(STUDENTS) || STUDENTS < 1 || STUDENTS > 1000) {
  throw new Error('--students must be between 1 and 1000')
}

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
admin.initializeApp({ projectId: PROJECT_ID })
const db = admin.firestore()
const auth = admin.auth()
const now = new Date()
const start = new Date(now.getTime() - 60_000)
const end = new Date(now.getTime() + 3_600_000)
const testId = `${runId}-test`
const questionIds = Array.from({ length: 50 }, (_, index) => `q-${String(index + 1).padStart(3, '0')}`)

function timestamp(date) { return admin.firestore.Timestamp.fromDate(date) }
function callable(name) { return `${FUNCTIONS_BASE}/${name}` }
async function invoke(name, token, data) {
  const response = await fetch(callable(name), {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  })
  const payload = await response.json()
  if (!response.ok || payload.error) throw new Error(`${name}: ${JSON.stringify(payload)}`)
  return payload.data
}
async function signIn(email, password) {
  const response = await fetch(`${AUTH_API}/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(`Auth sign-in failed: ${JSON.stringify(payload)}`)
  return payload.idToken
}

console.log(`Seeding ${STUDENTS} students into local emulators (${runId})`)
await db.collection('scheduledTests').doc(testId).set({
  collegeId: 'fixture-college', visibility: 'college', status: 'ongoing',
  title: 'Phase 0 synthetic assessment', subject: 'Fixture subject',
  startDateTime: timestamp(start), endDateTime: timestamp(end), durationMinutes: 60,
  totalMarks: 50, totalQuestions: 50,
  createdAt: timestamp(now), updatedAt: timestamp(now),
})
const questionBatch = db.batch()
for (const [index, questionId] of questionIds.entries()) {
  questionBatch.set(db.collection('scheduledTests').doc(testId).collection('assessmentQuestions').doc(questionId), {
    questionId, order: index + 1, text: `Synthetic question ${index + 1}`,
    type: 'mcq', marks: 1, options: [
      { id: 'a', text: 'A', isCorrect: index % 2 === 0 },
      { id: 'b', text: 'B', isCorrect: index % 2 !== 0 },
    ],
  })
}
await questionBatch.commit()

const students = []
for (let index = 0; index < STUDENTS; index += 1) {
  const suffix = String(index + 1).padStart(4, '0')
  const email = `phase0-${runId}-${suffix}@example.test`
  const password = 'Phase0-test-password-123!'
  const user = await auth.createUser({ email, password, displayName: `Fixture ${suffix}` })
  await auth.setCustomUserClaims(user.uid, { role: 'student', collegeId: 'fixture-college' })
  await db.collection('users').doc(user.uid).set({ role: 'student', collegeId: 'fixture-college', name: `Fixture ${suffix}` })
  await db.collection('students').doc(`student-${suffix}`).set({
    userId: user.uid, collegeId: 'fixture-college', name: `Fixture ${suffix}`,
    regNo: `FIX-${suffix}`, branch: 'BCA', batch: '2026', semester: 3, division: 'A', section: 'A',
  })
  students.push({ uid: user.uid, email, password, id: `student-${suffix}` })
}

const report = { runId, students: STUDENTS, testId, calls: {}, errors: [], startedAt: new Date().toISOString() }
async function counted(name, token, data) {
  report.calls[name] = (report.calls[name] || 0) + 1
  return invoke(name, token, data)
}
for (const student of students) {
  try {
    const token = await signIn(student.email, student.password)
    const started = await counted('startMyStudentTest', token, { testId })
    const attemptId = started.studentAssessmentId
    await counted('getMyActiveStudentTest', token, { testId })
    // Ten dirty delta saves: the server should use the answer index and avoid
    // scheduledTests/question reads on this path.
    for (let save = 0; save < 10; save += 1) {
      await counted('autosaveMyStudentTest', token, {
        studentAssessmentId: attemptId,
        delta: { [questionIds[save]]: { questionId: questionIds[save], selectedOptionId: save % 2 ? 'b' : 'a' } },
        proctorEvents: save === 0 ? [{ type: 'tab_switch', at: new Date().toISOString(), details: {} }] : [],
      })
    }
    await counted('autosaveMyStudentTest', token, { studentAssessmentId: attemptId, delta: {} })
  } catch (error) {
    report.errors.push({ student: student.id, message: error instanceof Error ? error.message : String(error) })
  }
}
report.finishedAt = new Date().toISOString()
report.successfulStudents = STUDENTS - report.errors.length
await mkdir('artifacts', { recursive: true })
await writeFile(`artifacts/${runId}.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (report.errors.length > 0) process.exitCode = 1
