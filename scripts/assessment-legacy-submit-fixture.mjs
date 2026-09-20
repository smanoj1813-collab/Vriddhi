#!/usr/bin/env node
/** Legacy-attempt and authoritative-submit emulator fixture. */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const admin = require('../functions/node_modules/firebase-admin')
const project = 'demo-vriddhi-assessment'
const base = `http://127.0.0.1:5001/${project}/asia-south1`
const authApi = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const runId = `legacy-${Date.now()}`
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
admin.initializeApp({ projectId: project })
const db = admin.firestore()
const auth = admin.auth()
const report = { runId, checks: [], errors: [] }
function check(name, passed, detail = '') { report.checks.push({ name, passed, detail }); if (!passed) throw new Error(`${name}: ${detail}`) }
async function call(name, token, data) {
  const response = await fetch(`${base}/${name}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ data }) })
  const value = await response.json()
  if (!response.ok || value.error) throw new Error(`${name}: ${JSON.stringify(value)}`)
  return value.data ?? value.result
}
try {
  const email = `${runId}@example.test`
  const user = await auth.createUser({ email, password: 'Legacy-fixture-password-123!' })
  await auth.setCustomUserClaims(user.uid, { role: 'student', collegeId: 'legacy-college' })
  await db.collection('users').doc(user.uid).set({ role: 'student', collegeId: 'legacy-college', name: 'Legacy Student' })
  const studentId = `${runId}-student`
  await db.collection('students').doc(studentId).set({ userId: user.uid, collegeId: 'legacy-college', name: 'Legacy Student', regNo: 'LEG-001', branch: 'BCA', batch: '2026', semester: 3, division: 'A', section: 'A' })
  const signIn = await fetch(`${authApi}/accounts:signInWithPassword?key=fake-api-key`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'Legacy-fixture-password-123!', returnSecureToken: true }) })
  const token = (await signIn.json()).idToken
  const testId = `${runId}-test`
  const now = new Date(); const end = new Date(now.getTime() + 3_600_000)
  await db.collection('scheduledTests').doc(testId).set({ collegeId: 'legacy-college', visibility: 'college', status: 'ongoing', title: 'Legacy fixture', subject: 'Fixture', startDateTime: new Date(now.getTime() - 60_000), endDateTime: end, durationMinutes: 60, totalMarks: 2, totalQuestions: 2 })
  const questions = ['q1', 'q2']
  const batch = db.batch()
  questions.forEach((id, index) => batch.set(db.collection('scheduledTests').doc(testId).collection('assessmentQuestions').doc(id), { questionId: id, order: index + 1, text: id, type: 'mcq', marks: 1, options: [{ id: 'a', text: 'A', isCorrect: true }, { id: 'b', text: 'B', isCorrect: false }] }))
  await batch.commit()
  const attemptId = `${testId}_${studentId}`
  // Deliberately old shape: no studentUid, answerIndex or questionChunksVersion.
  await db.collection('studentAssessments').doc(attemptId).set({ testId, assessmentId: testId, collegeId: 'legacy-college', studentId, title: 'Legacy fixture', subject: 'Fixture', totalMarks: 2, totalQuestions: 2, duration: 60, status: 'in_progress', answers: [], startedAt: admin.firestore.Timestamp.fromDate(now), endsAt: admin.firestore.Timestamp.fromDate(end) })
  const answers = { q1: { questionId: 'q1', selectedOptionId: 'a' }, q2: { questionId: 'q2', selectedOptionId: 'a' } }
  const saved = await call('autosaveMyStudentTest', token, { studentAssessmentId: attemptId, answers })
  check('legacy full-answer autosave succeeds', saved.success === true)
  const direct = await call('logMyStudentTestEvent', token, { studentAssessmentId: attemptId, event: { type: 'fullscreen_exit', at: new Date().toISOString(), details: {} } })
  check('high-severity direct event succeeds', direct.success === true)
  const submitted = await call('submitMyStudentTest', token, { testId, studentAssessmentId: attemptId, answers, autoSubmitted: false })
  check('authoritative submission succeeds', ['graded', 'submitted'].includes(submitted.status))
  check('objective score is preserved', Number(submitted.autoScore) === 2)
  const stored = (await db.collection('studentAssessments').doc(attemptId).get()).data() || {}
  check('attempt is finalized', ['graded', 'submitted'].includes(String(stored.status)))
  report.success = true
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error)); report.success = false
}
await mkdir('artifacts', { recursive: true })
await writeFile(`artifacts/${runId}.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (!report.success) process.exitCode = 1
