// functions/src/registration.ts
//
// Student course (elective) registration. Students read window configs
// client-side, but seat counts and submission run here: a student can
// only ever read their own registration under the rules, so capacity
// ("12 of 60 seats left") and basket validation must be computed with
// the Admin SDK or they can be bypassed entirely.
//
//   getMyRegistrationWindow — the open window for my semester/batch,
//                             my current submission, live seat counts.
//   submitCourseRegistration — validate baskets + capacity, one doc
//                             per student+window (amendable while open).

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  computeSeatCounts, fullOptions, isWindowOpen, normalizeWindows,
  validateSelections, windowMatchesStudent, type RegWindow, type Selections,
} from './registrationCore'

const CALLABLE = { region: 'asia-south1' as const, memory: '256MiB' as const, timeoutSeconds: 120, minInstances: 0, maxInstances: 20 }
const getDb = () => admin.firestore()

interface CallerStudent {
  id: string
  collegeId: string
  name: string
  regNo: string
  programme: string
  batch: string
  semester: number
}

async function resolveStudent(uid: string): Promise<CallerStudent> {
  const byUser = await getDb().collection('students').where('userId', '==', uid).limit(1).get()
  let doc = byUser.docs[0]
  if (!doc) {
    const direct = await getDb().collection('students').doc(uid).get()
    if (direct.exists) doc = direct as FirebaseFirestore.QueryDocumentSnapshot
  }
  if (!doc) throw new HttpsError('not-found', 'No student record is linked to your account. Contact the college office.')
  const s = doc.data()
  return {
    id: doc.id,
    collegeId: String(s.collegeId || ''),
    name: String(s.name || ''),
    regNo: String(s.registrationNumber || s.rollNumber || s.regNo || ''),
    programme: String(s.course || s.branch || s.department || ''),
    batch: String(s.batch || s.academicYear || ''),
    semester: Number(s.semester) || 0,
  }
}

async function loadWindows(collegeId: string): Promise<RegWindow[]> {
  const snap = await getDb().collection('colleges').doc(collegeId).collection('config').doc('registration').get()
  return normalizeWindows(snap.exists ? snap.data() : null)
}

const regDocId = (windowId: string, studentId: string) => `${windowId}_${studentId}`

async function loadWindowState(collegeId: string, windowId: string, excludeStudentId?: string) {
  const snap = await getDb().collection('colleges').doc(collegeId).collection('courseRegistrations')
    .where('windowId', '==', windowId).limit(5000).get()
  const regs = snap.docs
    .filter(d => d.data().studentId !== excludeStudentId)
    .map(d => ({ selections: (d.data().selections || {}) as Selections, status: String(d.data().status || '') }))
  return computeSeatCounts(regs)
}

export const getMyRegistrationWindow = onCall(CALLABLE, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const student = await resolveStudent(uid)
  if (!student.collegeId) throw new HttpsError('failed-precondition', 'Your student record has no college. Contact the office.')
  const windows = await loadWindows(student.collegeId)
  const mine = windows.filter(w => windowMatchesStudent(w, student))
  if (!mine.length) return { window: null, mine: null, counts: {}, open: false }
  // Prefer an open window; otherwise show the most recent matching one.
  const win = mine.find(w => isWindowOpen(w)) || mine[mine.length - 1]
  const mySnap = await getDb().collection('colleges').doc(student.collegeId).collection('courseRegistrations')
    .doc(regDocId(win.id, student.id)).get()
  const counts = await loadWindowState(student.collegeId, win.id)
  return {
    window: win,
    open: isWindowOpen(win),
    counts,
    mine: mySnap.exists ? { selections: (mySnap.data()?.selections || {}) as Selections, status: String(mySnap.data()?.status || 'submitted'), updatedAt: String(mySnap.data()?.updatedAt || '') } : null,
    student: { name: student.name, regNo: student.regNo, programme: student.programme, batch: student.batch, semester: student.semester },
  }
})

export const submitCourseRegistration = onCall(CALLABLE, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const student = await resolveStudent(uid)
  const input = (request.data || {}) as Record<string, unknown>
  const windowId = String(input.windowId || '')
  const rawSelections = (input.selections && typeof input.selections === 'object' ? input.selections : {}) as Record<string, unknown>
  const selections: Selections = {}
  for (const [k, v] of Object.entries(rawSelections)) {
    selections[k] = Array.isArray(v) ? v.map(String) : []
  }

  const windows = await loadWindows(student.collegeId)
  const win = windows.find(w => w.id === windowId)
  if (!win) throw new HttpsError('not-found', 'This registration window does not exist.')
  if (!windowMatchesStudent(win, student)) throw new HttpsError('permission-denied', 'This window is not for your semester/batch.')
  if (!isWindowOpen(win)) throw new HttpsError('failed-precondition', 'This registration window is not open.')

  const errors = validateSelections(win, student.programme, selections)
  if (errors.length) throw new HttpsError('invalid-argument', errors.join(' '))

  // Capacity check excluding my own earlier submission, so amending a
  // choice never blocks on my own seat.
  const counts = await loadWindowState(student.collegeId, win.id, student.id)
  const full = fullOptions(win, selections, counts)
  if (full.length) {
    throw new HttpsError('failed-precondition', `Seats are full for: ${full.map(f => f.name).join(', ')}. Please choose another subject.`)
  }

  const now = new Date().toISOString()
  const ref = getDb().collection('colleges').doc(student.collegeId).collection('courseRegistrations').doc(regDocId(win.id, student.id))
  const existing = await ref.get()
  if (existing.exists && String(existing.data()?.status) === 'confirmed') {
    throw new HttpsError('failed-precondition', 'Your registration is already confirmed by the college. Contact the office to change it.')
  }
  await ref.set({
    windowId: win.id, windowTitle: win.title,
    studentId: student.id, studentUid: uid,
    name: student.name, regNo: student.regNo, programme: student.programme,
    batch: student.batch, semester: student.semester,
    selections, status: 'submitted',
    createdAt: existing.exists ? String(existing.data()?.createdAt || now) : now,
    updatedAt: now,
  })
  logger.info('[Registration] submitted', { collegeId: student.collegeId, windowId: win.id, studentId: student.id })
  return { ok: true, status: 'submitted' }
})
