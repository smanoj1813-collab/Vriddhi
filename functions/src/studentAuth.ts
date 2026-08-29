// functions/src/studentAuth.ts
// Student Auth Management — Bulk creation + sync utilities

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import * as logger from 'firebase-functions/logger'

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface StudentImportRow {
  regNo: string
  name: string
  email: string
  phone?: string
  department: string
  batch: string
  division: string
  semester?: number | string
  dob?: string
  gender?: string
  address?: string
  mentorId?: string
}

interface BulkStudentPayload {
  collegeId: string
  students: StudentImportRow[]
  passwordStrategy?: 'auto' | 'default'
  defaultPassword?: string
}

interface StudentResult {
  regNo: string
  name: string
  email: string
  success: boolean
  uid?: string
  password?: string
  error?: string
}

interface BulkResult {
  success: boolean
  total: number
  created: number
  failed: number
  errors: Array<{ row: number; regNo: string; message: string }>
  students: StudentResult[]
  collegeId: string
}

// ═════════════════════════════════════════════════════════════════════════════
// EXISTING STUBS (preserve your current logic here)
// ═════════════════════════════════════════════════════════════════════════════

/** @deprecated — retained only to return an explicit migration error. */
export const syncStudentsToAuth = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
    throw new HttpsError(
      'failed-precondition',
      'syncStudentsToAuth is retired. Use bulkCreateStudentAccounts.'
    )
  }
)

/** @deprecated — retained only to return an explicit migration error. */
export const createStudentAuth = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication is required')
    throw new HttpsError(
      'failed-precondition',
      'createStudentAuth is retired. Use bulkCreateStudentAccounts.'
    )
  }
)

// ═════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function generateRandomPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const nums = '23456789'
  const special = '!@#$%^&*'
  const all = upper + lower + nums + special
  const pick = (set: string) => set[crypto.randomInt(0, set.length)]
  const chars = [pick(upper), pick(lower), pick(nums), pick(special)]
  for (let i = chars.length; i < length; i++) chars.push(pick(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

function normalizeSemester(val: number | string | undefined): number {
  if (val === undefined || val === null) return 1
  const parsed = typeof val === 'string' ? parseInt(val, 10) : val
  return isNaN(parsed) ? 1 : parsed
}

async function verifyCaller(
  request: any
): Promise<{ uid: string; role: string; collegeId?: string; name?: string }> {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }
  const userDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get()
  const userData = userDoc.data()
  if (!userData) {
    throw new HttpsError('not-found', 'User record not found')
  }
  const role = (userData.role as string) || ''
  if (!['superadmin', 'admin', 'hod'].includes(role)) {
    throw new HttpsError('permission-denied', 'Only admins can import students')
  }
  return {
    uid: request.auth.uid,
    role,
    collegeId: userData.collegeId as string | undefined,
    name: userData.name as string | undefined,
  }
}

async function getCollegeData(collegeId: string) {
  const collegeDoc = await admin.firestore().doc(`colleges/${collegeId}`).get()
  if (!collegeDoc.exists) {
    throw new HttpsError('not-found', `College ${collegeId} not found`)
  }
  return collegeDoc.data() as {
    code: string
    name: string
    studentCount: number
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN: bulkCreateStudentAccounts
// ═════════════════════════════════════════════════════════════════════════════

export const bulkCreateStudentAccounts = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 540,
    minInstances: 0,
    maxInstances: 5,
  },
  async (request): Promise<BulkResult> => {
    const startTime = Date.now()
    const { collegeId, students, passwordStrategy = 'auto', defaultPassword } =
      request.data as BulkStudentPayload

    // ── Validate input ──
    if (!collegeId || typeof collegeId !== 'string') {
      throw new HttpsError('invalid-argument', 'collegeId is required')
    }
    if (!Array.isArray(students) || students.length === 0) {
      throw new HttpsError('invalid-argument', 'students array is required and must not be empty')
    }
    if (students.length > 500) {
      throw new HttpsError('invalid-argument', 'Maximum 500 students per batch')
    }
    if (!['auto', 'default'].includes(passwordStrategy)) {
      throw new HttpsError('invalid-argument', 'Unsupported password strategy')
    }
    if (passwordStrategy === 'default' && (!defaultPassword || defaultPassword.length < 12)) {
      throw new HttpsError(
        'invalid-argument',
        'A default password of at least 12 characters is required'
      )
    }
    students.forEach((student, index) => {
      const required = ['regNo', 'name', 'email', 'department', 'batch', 'division'] as const
      const missing = required.filter(
        (field) => typeof student?.[field] !== 'string' || !student[field].trim()
      )
      if (missing.length > 0) {
        throw new HttpsError(
          'invalid-argument',
          `Row ${index + 1} is missing valid fields: ${missing.join(', ')}`
        )
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email.trim())) {
        throw new HttpsError('invalid-argument', `Row ${index + 1} has an invalid email address`)
      }
      const semester = normalizeSemester(student.semester)
      if (semester < 1 || semester > 12) {
        throw new HttpsError('invalid-argument', `Row ${index + 1} has an invalid semester`)
      }
    })

    // ── Verify caller ──
    const caller = await verifyCaller(request)
    if (caller.role !== 'superadmin' && caller.collegeId !== collegeId) {
      throw new HttpsError(
        'permission-denied',
        'You can only import students into your own college'
      )
    }

    // ── Load college data ──
    const college = await getCollegeData(collegeId)
    const db = admin.firestore()
    const auth = admin.auth()

    // ── Pre-check duplicates ──
    // Firestore `in` filters accept at most 30 values. Chunk the checks so the
    // callable's documented 500-row limit actually works. Registration
    // numbers are college-scoped; Auth/email ownership is global.
    const emails = students.map((s) => s.email.trim().toLowerCase())
    const regNos = students.map((s) => s.regNo.trim())
    const chunks = <T>(values: T[], size = 30): T[][] => {
      const result: T[][] = []
      for (let i = 0; i < values.length; i += size) result.push(values.slice(i, i + size))
      return result
    }

    const [existingEmailSnaps, existingRegNoSnaps, existingUserSnaps] = await Promise.all([
      Promise.all(
        chunks(emails).map((values) =>
          db.collection('students').where('email', 'in', values).limit(500).get()
        )
      ),
      Promise.all(
        chunks(regNos).map((values) =>
          db
            .collection('students')
            .where('collegeId', '==', collegeId)
            .where('regNo', 'in', values)
            .limit(500)
            .get()
        )
      ),
      Promise.all(
        chunks(emails).map((values) =>
          db.collection('users').where('email', 'in', values).limit(500).get()
        )
      ),
    ])

    const existingEmails = new Set(
      existingEmailSnaps.flatMap((snap) =>
        snap.docs.map((d) => String(d.data().email || '').toLowerCase()).filter(Boolean)
      )
    )
    const existingRegNos = new Set(
      existingRegNoSnaps.flatMap((snap) =>
        snap.docs.map((d) => String(d.data().regNo || '')).filter(Boolean)
      )
    )
    const existingUserEmails = new Set(
      existingUserSnaps.flatMap((snap) =>
        snap.docs.map((d) => String(d.data().email || '').toLowerCase()).filter(Boolean)
      )
    )

    const results: StudentResult[] = []
    const errors: Array<{ row: number; regNo: string; message: string }> = []
    let createdCount = 0
    let failedCount = 0

    // ── Process each student sequentially (auth creation is not batchable) ──
    for (let i = 0; i < students.length; i++) {
      const row = students[i]
      const rowNum = i + 1
      const email = row.email.trim().toLowerCase()
      const regNo = row.regNo.trim()

      // Skip duplicates
      if (existingEmails.has(email)) {
        failedCount++
        errors.push({ row: rowNum, regNo, message: `Email ${email} already exists in students` })
        results.push({ regNo, name: row.name, email, success: false, error: 'Email already exists' })
        continue
      }
      if (existingRegNos.has(regNo)) {
        failedCount++
        errors.push({ row: rowNum, regNo, message: `RegNo ${regNo} already exists` })
        results.push({ regNo, name: row.name, email, success: false, error: 'RegNo already exists' })
        continue
      }
      if (existingUserEmails.has(email)) {
        failedCount++
        errors.push({ row: rowNum, regNo, message: `Email ${email} already has an auth account` })
        results.push({ regNo, name: row.name, email, success: false, error: 'Auth account already exists' })
        continue
      }

      // Only a UID created by this iteration is eligible for rollback. Looking
      // up by email in a catch block can delete a pre-existing Auth-only user.
      let createdAuthUid: string | null = null

      try {
        // Generate password
        const password =
          passwordStrategy === 'default'
            ? defaultPassword as string
            : generateRandomPassword()

        // 1. Create Firebase Auth user
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: row.name.trim(),
          phoneNumber: row.phone ? `+91${row.phone.replace(/\D/g, '').slice(-10)}` : undefined,
          disabled: false,
        })
        createdAuthUid = userRecord.uid

        // 2. Prepare the canonical student doc in /students
        const studentRef = db.collection('students').doc()
        const studentData = {
          id: studentRef.id,
          regNo,
          name: row.name.trim(),
          email,
          phone: row.phone || '',
          collegeId,
          collegeCode: college.code,
          department: row.department.trim(),
          batch: row.batch.trim(),
          division: row.division.trim(),
          semester: normalizeSemester(row.semester),
          mentorId: row.mentorId || '',
          dob: row.dob || '',
          gender: row.gender || '',
          address: row.address || '',
          userId: userRecord.uid,
          avatar: '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          importedBy: caller.uid,
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
        }

        // 3. Prepare the user doc in /users (for auth context resolution)
        const userRef = db.collection('users').doc(userRecord.uid)
        const userData = {
          uid: userRecord.uid,
          id: userRecord.uid,
          name: row.name.trim(),
          email,
          phone: row.phone || '',
          role: 'student',
          collegeId,
          collegeCode: college.code,
          department: row.department.trim(),
          batch: row.batch.trim(),
          division: row.division.trim(),
          regNo,
          avatar: '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
        }

        // 4. Write all Firestore representations atomically. If this commit
        // fails, no orphan student/user/index document is left behind and the
        // Auth user can be safely rolled back below.
        const collegeStudentRef = db
          .collection('colleges')
          .doc(collegeId)
          .collection('students')
          .doc(regNo)
        const batch = db.batch()
        batch.create(studentRef, studentData)
        batch.create(userRef, userData)
        batch.create(collegeStudentRef, {
          ...studentData,
          studentDocId: studentRef.id,
        })
        batch.update(db.collection('colleges').doc(collegeId), {
          studentCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        await batch.commit()

        // Track success
        existingEmails.add(email)
        existingRegNos.add(regNo)
        existingUserEmails.add(email)
        createdCount++

        results.push({
          regNo,
          name: row.name,
          email,
          success: true,
          uid: userRecord.uid,
          password,
        })

        logger.info(`[StudentAuth] Created student`, {
          regNo,
          uid: userRecord.uid,
          collegeId,
          by: caller.uid,
        })
      } catch (err: any) {
        failedCount++
        const message = err.message || 'Unknown error'
        errors.push({ row: rowNum, regNo, message })
        results.push({ regNo, name: row.name, email, success: false, error: message })
        logger.error(`[StudentAuth] Failed to create student ${regNo}:`, err)

        // Roll back only the Auth UID created by this loop iteration. If
        // createUser itself failed (for example email-already-exists), this is
        // null and a pre-existing user is never touched.
        if (createdAuthUid) {
          try {
            await auth.deleteUser(createdAuthUid)
            logger.info(`[StudentAuth] Rolled back auth user`, {
              uid: createdAuthUid,
              email,
            })
          } catch (rollbackError) {
            logger.error(`[StudentAuth] Failed to roll back auth user`, {
              uid: createdAuthUid,
              email,
              rollbackError,
            })
          }
        }
      }
    }

    // ── Log action ──
    // Do not report the completed import as failed solely because the
    // diagnostic log could not be written.
    try {
      await db.collection('logs').add({
        action: 'BULK_STUDENT_IMPORT',
        collegeId,
        performedBy: caller.uid,
        performedByName: caller.name,
        total: students.length,
        created: createdCount,
        failed: failedCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        elapsedMs: Date.now() - startTime,
      })
    } catch (logError) {
      logger.error('[StudentAuth] Failed to write import audit log', {
        collegeId,
        performedBy: caller.uid,
        created: createdCount,
        failed: failedCount,
        logError,
      })
    }

    return {
      success: failedCount === 0,
      total: students.length,
      created: createdCount,
      failed: failedCount,
      errors,
      students: results,
      collegeId,
    }
  }
)