// functions/src/promotion.ts
//
// Semester promotion / year rollover. Before this, a college had to
// bulk-edit every student's `semester` by hand at the session change —
// with no backlog check, no detain list and no record of who graduated.
//
//   previewPromotion — evaluates a cohort against college policy
//                      (carryover limit + all-clear-to-graduate) using
//                      PUBLISHED grade records; nothing is written.
//   runPromotion     — applies staff-confirmed decisions (the preview's
//                      verdicts, possibly overridden, with backlogs
//                      recomputed server-side) to BOTH student mirrors
//                      and records the run for the audit trail.
//
// Graduates become Alumni with a passing year; detained students keep
// their semester with the live backlog list recorded on the student doc.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { evaluatePromotion, normalizePolicy, type GradeLite, type PromotionAction } from './promotionCore'

const CALLABLE = { region: 'asia-south1' as const, memory: '512MiB' as const, timeoutSeconds: 300, minInstances: 0, maxInstances: 5 }
const getDb = () => admin.firestore()
const MAX_STUDENTS = 3000

async function resolveStaff(uid: string, token: Record<string, unknown>, roles: string[]) {
  const userDoc = await getDb().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '').toLowerCase()
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !roles.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', `Requires one of: ${roles.join(', ')}`)
  }
  return { uid, role, collegeId, name: String(user?.name || user?.email || uid) }
}

function resolveCollege(staff: { role: string; collegeId: string }, input: Record<string, unknown>): string {
  const collegeId = staff.role === 'superadmin' ? String(input.collegeId || staff.collegeId || '') : staff.collegeId
  if (!collegeId) throw new HttpsError('invalid-argument', 'College is required')
  if (staff.role !== 'superadmin' && input.collegeId && String(input.collegeId) !== collegeId) {
    throw new HttpsError('permission-denied', "Cannot access another college's data")
  }
  return collegeId
}

async function loadCohort(collegeId: string, filter: { batch?: string; branch?: string; semester?: number }) {
  const snap = await getDb().collection('students').where('collegeId', '==', collegeId).limit(MAX_STUDENTS).get()
  return snap.docs
    .map(d => ({ ...(d.data() as Record<string, unknown>), id: d.id }) as Record<string, unknown> & { id: string })
    .filter(s => {
      if (filter.batch && String(s.batch || s.academicYear || '') !== filter.batch) return false
      if (filter.branch && ![s.branch, s.department, s.course].some(x => String(x || '') === filter.branch)) return false
      if (filter.semester && Number(s.semester) !== filter.semester) return false
      return true
    })
}

async function loadPublishedRecords(collegeId: string, studentIds: Set<string>): Promise<Map<string, GradeLite[]>> {
  const byStudent = new Map<string, GradeLite[]>()
  let last: FirebaseFirestore.QueryDocumentSnapshot | undefined
  for (let guard = 0; guard < 20; guard += 1) {
    let q = getDb().collection('gradeRecords').where('collegeId', '==', collegeId).orderBy('createdAt').limit(4000)
    if (last) q = q.startAfter(last)
    const page = await q.get()
    if (page.empty) break
    for (const doc of page.docs) {
      const r = doc.data() as Record<string, unknown>
      if (String(r.status || 'published') !== 'published') continue
      const sid = String(r.studentId || '')
      if (!studentIds.has(sid)) continue
      const list = byStudent.get(sid) || []
      list.push({
        subjectCode: String(r.subjectCode || ''), subjectName: String(r.subjectName || ''),
        semester: Number(r.semester) || 0, grade: String(r.grade || ''),
        gradePoint: Number(r.gradePoint) || 0, result: String(r.result || ''),
        createdAt: String(r.createdAt || ''), updatedAt: String(r.updatedAt || ''),
      })
      byStudent.set(sid, list)
    }
    last = page.docs[page.docs.length - 1]
    if (page.size < 4000) break
  }
  return byStudent
}

function parseFilter(input: Record<string, unknown>) {
  const f = (input.filter && typeof input.filter === 'object' ? input.filter : {}) as Record<string, unknown>
  return {
    batch: String(f.batch || input.batch || '').trim(),
    branch: String(f.branch || input.branch || '').trim(),
    semester: Number(f.semester || input.semester) || 0,
  }
}

export const previewPromotion = onCall(CALLABLE, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveStaff(uid, request.auth?.token || {}, ['superadmin', 'principal', 'admin', 'hod'])
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollege(staff, input)
  const policy = normalizePolicy(input.policy)
  const cohort = await loadCohort(collegeId, parseFilter(input))
  const records = await loadPublishedRecords(collegeId, new Set(cohort.map(s => s.id)))

  const rows = cohort.map(s => {
    const verdict = evaluatePromotion(
      { semester: Number(s.semester), status: String(s.status || '') },
      records.get(s.id) || [], policy,
    )
    return {
      studentId: s.id,
      name: String(s.name || ''),
      regNo: String(s.registrationNumber || s.rollNumber || s.regNo || ''),
      branch: String(s.branch || s.department || s.course || ''),
      batch: String(s.batch || s.academicYear || ''),
      ...verdict,
    }
  }).sort((a, b) => a.fromSemester - b.fromSemester || a.name.localeCompare(b.name))

  const counts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.action] = (acc[r.action] || 0) + 1
    return acc
  }, {})
  return { policy, counts, rows }
})

interface Decision { studentId: string; action: PromotionAction }

export const runPromotion = onCall(CALLABLE, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
  const staff = await resolveStaff(uid, request.auth?.token || {}, ['superadmin', 'principal', 'admin'])
  const input = (request.data || {}) as Record<string, unknown>
  const collegeId = resolveCollege(staff, input)
  const policy = normalizePolicy(input.policy)
  const runId = String(input.runId || '').trim()
  if (!runId) throw new HttpsError('invalid-argument', 'runId is required (idempotency key)')
  const decisions: Decision[] = (Array.isArray(input.decisions) ? input.decisions : [])
    .map((d: Record<string, unknown>) => ({ studentId: String(d?.studentId || ''), action: String(d?.action || '') as PromotionAction }))
    .filter(d => d.studentId && ['promote', 'detain', 'graduate', 'repeat_final', 'skip'].includes(d.action))
    .slice(0, MAX_STUDENTS)
  if (!decisions.length) throw new HttpsError('invalid-argument', 'No promotion decisions supplied')

  const db = getDb()
  const runRef = db.collection('colleges').doc(collegeId).collection('promotionRuns').doc(runId)
  const existing = await runRef.get()
  if (existing.exists && String(existing.data()?.status) === 'completed') {
    return { alreadyApplied: true, counts: (existing.data()?.counts as Record<string, number>) || {} }
  }

  const docs = await db.getAll(...decisions.map(d => db.collection('students').doc(d.studentId)))
  const byId = new Map(docs.filter(d => d.exists).map(d => [d.id, d.data() as Record<string, unknown>]))
  const records = await loadPublishedRecords(collegeId, new Set(byId.keys()))
  const now = new Date()
  const nowIso = now.toISOString()
  const passingYear = String(now.getFullYear())
  const counts: Record<string, number> = {}

  for (let i = 0; i < decisions.length; i += 200) {
    const batch = db.batch()
    for (const d of decisions.slice(i, i + 200)) {
      const s = byId.get(d.studentId)
      if (!s || String(s.collegeId || '') !== collegeId) continue
      if (String(s.lastPromotionRunId || '') === runId) continue // idempotent re-run
      if (d.action === 'skip') { counts.skip = (counts.skip || 0) + 1; continue }
      // Recompute the verdict server-side: the client's action is honoured,
      // but backlogs and target semester never come from the client.
      const verdict = evaluatePromotion({ semester: Number(s.semester), status: String(s.status || '') }, records.get(d.studentId) || [], policy)
      const update: Record<string, unknown> = {
        backlogs: verdict.backlogs,
        backlogsUpdatedAt: nowIso,
        lastPromotionRunId: runId,
        lastPromotionAt: nowIso,
        lastPromotionAction: d.action,
        updatedAt: nowIso,
      }
      if (d.action === 'promote') {
        update.semester = Math.min((Number(s.semester) || 1) + 1, policy.programmeSemesters)
      } else if (d.action === 'graduate') {
        update.status = 'Alumni'
        update.graduatedAt = nowIso
        update.passingYear = passingYear
      } else if (d.action === 'detain') {
        update.detainedCount = (Number(s.detainedCount) || 0) + 1
        update.lastDetainedAt = nowIso
      }
      batch.update(db.collection('students').doc(d.studentId), update)
      const regNo = String(s.registrationNumber || s.rollNumber || s.regNo || '').trim()
      if (regNo) {
        batch.set(db.collection('colleges').doc(collegeId).collection('students').doc(regNo), update, { merge: true })
      }
      counts[d.action] = (counts[d.action] || 0) + 1
    }
    await batch.commit()
  }

  await runRef.set({
    status: 'completed', policy, counts,
    decisions: decisions.map(d => ({ studentId: d.studentId, action: d.action })),
    createdBy: staff.uid, createdByName: staff.name,
    note: String(input.note || '').slice(0, 500),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  logger.info('[Promotion] run applied', { collegeId, runId, counts, by: staff.uid })
  return { alreadyApplied: false, counts }
})
