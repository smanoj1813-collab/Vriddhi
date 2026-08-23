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

/** @deprecated — replaced by bulkCreateStudentAccounts. Keep for backward compat. */
export const syncStudentsToAuth = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    // TODO: migrate logic to bulkCreateStudentAccounts or keep as-is
    logger.info('syncStudentsToAuth called', { uid: request.auth?.uid })
    return { success: true, message: 'Use bulkCreateStudentAccounts instead' }
  }
)

/** @deprecated — replaced by bulkCreateStudentAccounts. Keep for backward compat. */
export const createStudentAuth = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    logger.info('createStudentAuth called', { uid: request.auth?.uid })
    return { success: true, message: 'Use bulkCreateStudentAccounts instead' }
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
    timeoutSeconds: 120,
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

    // ── Pre-check duplicates in one shot ──
    const emails = students.map((s) => s.email.trim().toLowerCase())
    const regNos = students.map((s) => s.regNo.trim())

    const [existingEmailSnap, existingRegNoSnap, existingUsersSnap] = await Promise.all([
      db.collection('students').where('email', 'in', emails).limit(500).get(),
      db.collection('students').where('regNo', 'in', regNos).limit(500).get(),
      db.collection('users').where('email', 'in', emails).limit(500).get(),
    ])

    const existingEmails = new Set(existingEmailSnap.docs.map((d) => d.data().email?.toLowerCase()))
    const existingRegNos = new Set(existingRegNoSnap.docs.map((d) => d.data().regNo))
    const existingUserEmails = new Set(existingUsersSnap.docs.map((d) => d.data().email?.toLowerCase()))

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

      try {
        // Generate password
        const password =
          passwordStrategy === 'default'
            ? defaultPassword || `${regNo}@123`
            : generateRandomPassword()

        // 1. Create Firebase Auth user
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: row.name.trim(),
          phoneNumber: row.phone ? `+91${row.phone.replace(/\D/g, '').slice(-10)}` : undefined,
          disabled: false,
        })

        // 2. Create student doc in /students
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
        await studentRef.set(studentData)

        // 3. Create user doc in /users (for auth context resolution)
        await db.collection('users').doc(userRecord.uid).set({
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
        })

        // 4. Create college sub-collection index (for fast college-scoped queries)
        await db
          .collection('colleges')
          .doc(collegeId)
          .collection('students')
          .doc(regNo)
          .set({
            ...studentData,
            studentDocId: studentRef.id,
          })

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

        // Attempt cleanup if auth was created but Firestore failed
        try {
          const user = await auth.getUserByEmail(email)
          if (user) await auth.deleteUser(user.uid)
          logger.info(`[StudentAuth] Rolled back auth user for ${email}`)
        } catch {
          // User might not exist, ignore
        }
      }
    }

    // ── Update college student count ──
    if (createdCount > 0) {
      await db.collection('colleges').doc(collegeId).update({
        studentCount: admin.firestore.FieldValue.increment(createdCount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    // ── Log action ──
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