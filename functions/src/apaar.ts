// functions/src/apaar.ts
//
// APAAR / Academic Bank of Credits operations:
//   • setStudentApaarIds — staff map APAAR IDs onto student records
//     (single inline edits and regNo→APAAR CSV imports from the desk).
//     Writes the canonical /students doc AND the per-college mirror
//     colleges/{cid}/students/{regNo}, exactly like the profile editor.
//   • exportNadAbcRecords — published grade records joined to APAAR IDs,
//     shaped as NAD-ABC award rows for the university's upload. Students
//     without a valid APAAR ID are reported back by name, never dropped.

import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { buildNadAbcRows, isValidApaarId, normalizeApaarId, type NadGradeRecordLike, type NadStudentLike } from './apaarCore'

const SET_ROLES = ['superadmin', 'admin', 'principal', 'hod']
const EXPORT_ROLES = [...SET_ROLES, 'employee']

interface StaffCaller { uid: string; role: string; collegeId: string }

async function resolveStaff(uid: string, token: Record<string, unknown>, allowed: string[]): Promise<StaffCaller> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '').toLowerCase()
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (!userDoc.exists || !allowed.includes(role) || (role !== 'superadmin' && !collegeId)) {
    throw new HttpsError('permission-denied', 'College academic staff access is required')
  }
  return { uid, role, collegeId }
}

function targetCollege(staff: StaffCaller, requested: unknown): string {
  const collegeId = staff.role === 'superadmin' ? String(requested || staff.collegeId || '') : staff.collegeId
  if (!collegeId) throw new HttpsError('invalid-argument', 'College is required')
  return collegeId
}

interface ApaarEntry { studentId?: unknown; regNo?: unknown; apaarId?: unknown }

export const setStudentApaarIds = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 120, minInstances: 0, maxInstances: 10 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {}, SET_ROLES)
    const collegeId = targetCollege(staff, request.data?.collegeId)
    const entries: ApaarEntry[] = Array.isArray(request.data?.entries) ? request.data.entries : []
    if (entries.length < 1 || entries.length > 500) {
      throw new HttpsError('invalid-argument', 'Provide between 1 and 500 APAAR entries')
    }

    const db = admin.firestore()
    const results: Array<{ studentId: string; regNo: string; ok: boolean; error?: string }> = []
    let updated = 0

    for (const entry of entries) {
      const apaarId = normalizeApaarId(entry.apaarId)
      const regNoIn = String(entry.regNo || '').trim()
      const studentIdIn = String(entry.studentId || '').trim()
      if (apaarId !== '' && !isValidApaarId(apaarId)) {
        results.push({ studentId: studentIdIn, regNo: regNoIn, ok: false, error: 'APAAR/ABC ID must be 12 digits' })
        continue
      }
      // Resolve the canonical student doc inside the caller's college only.
      let doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot | undefined
      if (studentIdIn) {
        const snap = await db.collection('students').doc(studentIdIn).get()
        if (snap.exists && String(snap.data()?.collegeId || '') === collegeId) doc = snap
      } else if (regNoIn) {
        const snap = await db.collection('students')
          .where('collegeId', '==', collegeId).where('regNo', '==', regNoIn).limit(1).get()
        if (!snap.empty) doc = snap.docs[0]
      }
      if (!doc) {
        results.push({ studentId: studentIdIn, regNo: regNoIn, ok: false, error: 'Student not found in this college' })
        continue
      }
      const data = doc.data() || {}
      const regNo = String(data.regNo || regNoIn || '')
      const update: Record<string, unknown> = {
        apaarId,
        apaarUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        apaarUpdatedBy: uid,
      }
      const batch = db.batch()
      batch.update(doc.ref, update)
      if (regNo) {
        const mirror = db.collection('colleges').doc(collegeId).collection('students').doc(regNo)
        const mirrorSnap = await mirror.get()
        if (mirrorSnap.exists) batch.update(mirror, update)
      }
      await batch.commit()
      updated += 1
      results.push({ studentId: doc.id, regNo, ok: true })
    }

    logger.info('[APAAR] setStudentApaarIds', { collegeId, by: uid, updated, total: entries.length })
    return { updated, total: entries.length, results }
  }
)

export const exportNadAbcRecords = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 300, minInstances: 0, maxInstances: 5 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveStaff(uid, request.auth?.token || {}, EXPORT_ROLES)
    const collegeId = targetCollege(staff, request.data?.collegeId)
    const examYear = String(request.data?.examYear || '').trim()
    if (!/^\d{4}$/.test(examYear)) throw new HttpsError('invalid-argument', 'examYear must be a 4-digit year')
    const semesterRaw = Number(request.data?.semester)
    const semester = Number.isInteger(semesterRaw) && semesterRaw >= 1 && semesterRaw <= 12 ? semesterRaw : undefined

    const db = admin.firestore()
    // Page through the college's grade records (query is collegeId-scoped;
    // status/semester filtering happens in the pure builder).
    const records: NadGradeRecordLike[] = []
    let last: admin.firestore.QueryDocumentSnapshot | undefined
    const PAGE = 1000
    const CAP = 30000
    for (;;) {
      let q = db.collection('gradeRecords').where('collegeId', '==', collegeId).orderBy('__name__').limit(PAGE)
      if (last) q = q.startAfter(last)
      const snap = await q.get()
      if (snap.empty) break
      for (const d of snap.docs) {
        const r = d.data()
        if (semester && Number(r.semester) !== semester) continue
        records.push({
          studentId: String(r.studentId || ''),
          studentName: String(r.studentName || ''),
          studentRegNo: String(r.studentRegNo || ''),
          semester: Number(r.semester) || 0,
          subject: String(r.subject || ''),
          code: String(r.code || ''),
          credits: typeof r.credits === 'number' ? r.credits : undefined,
          grade: String(r.grade || ''),
          gradePoint: typeof r.gradePoint === 'number' ? r.gradePoint : undefined,
          status: String(r.status || ''),
        })
      }
      last = snap.docs[snap.docs.length - 1]
      if (snap.size < PAGE || records.length >= CAP) break
    }

    // Fetch only the students the records reference.
    const studentIds = [...new Set(records.map(r => r.studentId).filter(Boolean))]
    const students: NadStudentLike[] = []
    for (let i = 0; i < studentIds.length; i += 100) {
      const chunk = studentIds.slice(i, i + 100)
      const docs = await db.getAll(...chunk.map(id => db.collection('students').doc(id)))
      for (const d of docs) {
        if (!d.exists) continue
        const s = d.data() || {}
        if (String(s.collegeId || '') !== collegeId) continue
        students.push({
          id: d.id,
          name: String(s.name || ''),
          regNo: String(s.regNo || ''),
          apaarId: String(s.apaarId || ''),
          dob: String(s.dob || s.dateOfBirth || ''),
          gender: String(s.gender || ''),
          course: String(s.course || s.department || s.branch || ''),
        })
      }
    }

    const out = buildNadAbcRows(records, students, examYear)
    logger.info('[APAAR] exportNadAbcRecords', { collegeId, examYear, rows: out.rows.length, skippedStudents: out.skipped.length })
    return {
      examYear,
      rows: out.rows,
      skipped: out.skipped,
      publishedRecords: out.publishedRecords,
      studentsWithRecords: studentIds.length,
    }
  }
)
