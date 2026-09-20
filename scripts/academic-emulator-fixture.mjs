#!/usr/bin/env node
/** Academic Phase 1/2 fixture runner. Requires Auth, Firestore and Functions emulators. */
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const admin = require('../functions/node_modules/firebase-admin')
const PROJECT_ID = 'demo-vriddhi-assessment'
const BASE = `http://127.0.0.1:5001/${PROJECT_ID}/asia-south1`
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1'
const runId = `academic-${Date.now()}`
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
admin.initializeApp({ projectId: PROJECT_ID })
const db = admin.firestore()
const auth = admin.auth()
const report = { runId, errors: [], checks: [] }
function check(name, passed, detail = '') { report.checks.push({ name, passed, detail }); if (!passed) throw new Error(`${name}: ${detail}`) }
async function createIdentity({ email, role, collegeId, student }) {
  const user = await auth.createUser({ email, password: 'Academic-fixture-password-123!' })
  await auth.setCustomUserClaims(user.uid, { role, collegeId })
  await db.collection('users').doc(user.uid).set({ role, collegeId, name: student?.name || role })
  if (student) await db.collection('students').doc(student.id).set({ ...student, userId: user.uid, collegeId })
  const response = await fetch(`${AUTH}/accounts:signInWithPassword?key=fake-api-key`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'Academic-fixture-password-123!', returnSecureToken: true }),
  })
  const value = await response.json()
  if (!response.ok) throw new Error(JSON.stringify(value))
  return { user, token: value.idToken }
}
async function call(name, token, data) {
  const response = await fetch(`${BASE}/${name}`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ data }),
  })
  const value = await response.json()
  if (!response.ok || value.error) throw new Error(`${name}: ${JSON.stringify(value)}`)
  return value.data ?? value.result
}
try {
  const student = await createIdentity({
    email: `${runId}-student@example.test`, role: 'student', collegeId: 'academic-college',
    student: { id: 'academic-student-a', name: 'Academic Student A', branch: 'BCA', batch: '2026', semester: 3, division: 'A', section: 'A' },
  })
  const faculty = await createIdentity({ email: `${runId}-faculty@example.test`, role: 'faculty', collegeId: 'academic-college' })
  await db.collection('classSessions').doc(`${runId}-class-a`).set({ collegeId: 'academic-college', date: '2026-09-21', startTime: '09:00', section: 'A', subject: 'DBMS' })
  await db.collection('classSessions').doc(`${runId}-class-b`).set({ collegeId: 'academic-college', date: '2026-09-21', startTime: '10:00', section: 'B', subject: 'Hidden' })
  await db.collection('assignments').doc(`${runId}-assignment-a`).set({ collegeId: 'academic-college', title: 'Visible assignment', status: 'published', dueDate: '2026-09-20', targetSections: [{ section: 'A' }] })
  await db.collection('assignments').doc(`${runId}-assignment-b`).set({ collegeId: 'academic-college', title: 'Hidden assignment', status: 'published', dueDate: '2026-09-20', targetSections: [{ section: 'B' }] })
  await db.collection('assignments').doc(`${runId}-assignment-submitted`).set({ collegeId: 'academic-college', title: 'Submitted', status: 'submitted', dueDate: '2026-09-19', targetSections: [{ section: 'A' }] })
  await db.collection('scheduledTests').doc(`${runId}-test`).set({ collegeId: 'academic-college', title: 'Fixture test', status: 'published', startDateTime: '2026-09-25T09:00:00Z' })
  await db.collection('curriculum').doc(`${runId}-curriculum`).set({ collegeId: 'academic-college', courseCode: 'CS301', courseName: 'DBMS', status: 'approved', semester: 3, modules: [] })
  await db.collection('attendance').doc(`${runId}-present`).set({ collegeId: 'academic-college', studentId: 'academic-student-a', date: '2026-09-19', status: 'present' })
  await db.collection('attendance').doc(`${runId}-absent`).set({ collegeId: 'academic-college', studentId: 'academic-student-a', date: '2026-09-20', status: 'absent' })
  await db.collection('questions').doc(`${runId}-approved`).set({ collegeId: 'academic-college', approved: true, difficulty: 'easy', bloomsLevel: 'remember' })
  await db.collection('questions').doc(`${runId}-rejected`).set({ collegeId: 'academic-college', approved: false, difficulty: 'hard', bloomsLevel: 'apply' })
  const context = await call('getMyStudentAcademicContext', student.token, { date: '2026-09-21' })
  check('student context enabled', context.enabled === true, JSON.stringify(context))
  check('student sees only cohort class', context.context.classes.length === 1 && context.context.classes[0].id.endsWith('class-a'))
  check('student sees only cohort assignment', context.context.pendingAssignments.length === 1 && context.context.pendingAssignments[0].id.endsWith('assignment-a'))
  check('submitted assignment excluded', !context.context.pendingAssignments.some((item) => item.id.endsWith('submitted')))
  check('attendance calculated', context.context.attendance.percentage === 50)
  const facultyContext = await call('getFacultyAcademicContext', faculty.token, { date: '2026-09-21' })
  check('faculty context enabled', facultyContext.enabled === true)
  check('faculty context is college scoped', facultyContext.context.collegeId === 'academic-college')
  const paperContext = await call('getPaperAcademicContext', faculty.token, {})
  check('paper context enabled', paperContext.enabled === true)
  check('unapproved question excluded', paperContext.context.candidates.length === 1 && paperContext.context.candidates[0].id.endsWith('approved'))
  report.success = true
} catch (error) {
  report.errors.push(error instanceof Error ? error.message : String(error))
  report.success = false
}
await mkdir('artifacts', { recursive: true })
await writeFile(`artifacts/${runId}.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (!report.success) process.exitCode = 1
