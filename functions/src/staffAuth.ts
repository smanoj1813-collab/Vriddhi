// functions/src/staffAuth.ts
// Staff (faculty / HOD / principal / admin) bulk provisioning.
//
// This is the staff counterpart of bulkCreateStudentAccounts. It exists so
// that bulk import runs through the Admin SDK instead of the client-side
// Identity Toolkit signup. The Admin SDK is the only place that can:
//
//   1. Detect an *orphaned* Firebase Auth account — one whose Firestore
//      profile was wiped by a college reset but whose Auth account survived
//      (created by an older client-side import, a half-finished import, etc).
//   2. Reclaim it safely: verify it does not belong to another college, then
//      RESET its password and custom claims and rewrite the profile docs.
//
// Without this, a re-import after "Reset College Data" either failed with
// "email already exists" (students) or silently re-used the stale account
// with an old password (faculty), so the freshly-shown temporary password
// never worked.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import * as logger from 'firebase-functions/logger'

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

type StaffRole = 'faculty' | 'hod' | 'principal' | 'admin'

interface StaffImportRow {
  // Identity
  facultyId?: string
  firstName?: string
  name?: string
  lastName?: string
  email: string
  phone?: string
  gender?: string
  // Organisation
  collegeCode?: string
  collegeName?: string
  department?: string
  designation?: string
  employmentType?: string
  joiningDate?: string
  qualification?: string
  specialization?: string
  subjectsUG?: string[]
  subjectsPG?: string[]
  experienceYears?: number
  isHOD?: boolean
  isPrincipal?: boolean
  // Optional role override (defaults from isHOD/isPrincipal flags).
  role?: StaffRole
  profilePhotoUrl?: string
}

interface BulkStaffPayload {
  collegeId: string
  staff: StaffImportRow[]
  defaultPassword?: string
}

interface StaffResult {
  id: string
  email: string
  name: string
  role: StaffRole
  success: boolean
  uid?: string
  password?: string
  reclaimed?: boolean
  error?: string
}

interface BulkStaffResult {
  success: boolean
  total: number
  created: number
  reclaimed: number
  failed: number
  errors: Array<{ row: number; email: string; message: string }>
  staff: StaffResult[]
  collegeId: string
}

const STAFF_PROFILE_COLLECTION = 'faculty'
const STAFF_CREATOR_ROLES = ['superadmin', 'admin', 'hod']
// Roles that may land in the staff profile collection.
const ALLOWED_STAFF_ROLES: StaffRole[] = ['faculty', 'hod', 'principal', 'admin']

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function verifyCaller(
  request: any
): Promise<{ uid: string; role: string; collegeId?: string; name?: string }> {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }
  const db = admin.firestore()
  const userDoc = await db.doc(`users/${request.auth.uid}`).get()
  let userData = userDoc.data()
  if (!userData) {
    // Legacy superadmins may only have a superadmins/{uid} profile doc.
    const superadminDoc = await db.doc(`superadmins/${request.auth.uid}`).get()
    if (superadminDoc.exists) {
      userData = { role: 'superadmin' } as { role: string }
    }
  }
  if (!userData) {
    throw new HttpsError('not-found', 'Caller profile not found')
  }
  const role = String(userData.role || '').toLowerCase()
  if (!STAFF_CREATOR_ROLES.includes(role)) {
    throw new HttpsError('permission-denied', 'Only admins can import staff')
  }
  return {
    uid: request.auth.uid,
    role,
    collegeId: userData.collegeId as string | undefined,
    name: userData.name as string | undefined,
  }
}

/**
 * Find an existing Auth user by email. Returns null when none exists.
 * getUserByEmail throws (not-found) when the email is unknown.
 */
async function findAuthUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  try {
    return await admin.auth().getUserByEmail(email)
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') return null
    throw err
  }
}

/**
 * Make sure an Auth account exists for `email` and that it belongs to the
 * importing college (or is orphaned — no college linkage at all). An account
 * already bound to a *different* college is never hijacked.
 *
 * Returns the uid and whether a pre-existing account was reclaimed. The
 * returned password is the credential the importer should hand out: for a
 * newly created or reclaimed account it is the freshly-set password.
 */
async function ensureCollegeAuthUser(opts: {
  email: string
  name: string
  password: string
  collegeId: string
  role: StaffRole
}): Promise<{ uid: string; reclaimed: boolean }> {
  const { email, name, password, collegeId, role } = opts
  const existing = await findAuthUserByEmail(email)

  if (existing) {
    const claims = (existing.customClaims || {}) as Record<string, unknown>
    const linkedCollege = claims.collegeId ? String(claims.collegeId) : ''
    if (linkedCollege && linkedCollege !== collegeId) {
      throw new HttpsError(
        'failed-precondition',
        `Email ${email} already belongs to another college and cannot be reused`
      )
    }
    // Same college, or an orphaned account (no college claim). Reset the
    // password so the credential we return actually works, and refresh claims.
    await Promise.all([
      admin.auth().updateUser(existing.uid, { email, password, displayName: name, disabled: false }),
      admin.auth().setCustomUserClaims(existing.uid, { role, collegeId }),
    ])
    return { uid: existing.uid, reclaimed: true }
  }

  const created = await admin.auth().createUser({ email, password, displayName: name })
  await admin.auth().setCustomUserClaims(created.uid, { role, collegeId })
  return { uid: created.uid, reclaimed: false }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN: bulkProvisionStaff
// ═════════════════════════════════════════════════════════════════════════════

export const bulkProvisionStaff = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 540,
    minInstances: 0,
    maxInstances: 5,
  },
  async (request): Promise<BulkStaffResult> => {
    const startTime = Date.now()
    const { collegeId, staff, defaultPassword } = (request.data || {}) as BulkStaffPayload

    // ── Validate payload ──
    if (!collegeId || typeof collegeId !== 'string') {
      throw new HttpsError('invalid-argument', 'collegeId is required')
    }
    if (!Array.isArray(staff) || staff.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one staff row is required')
    }
    if (staff.length > 500) {
      throw new HttpsError('invalid-argument', 'At most 500 staff rows per import')
    }
    if (defaultPassword && String(defaultPassword).length < 10) {
      throw new HttpsError('invalid-argument', 'A default password must be at least 10 characters')
    }

    // ── Verify caller ──
    const caller = await verifyCaller(request)
    // Non-superadmins may only import into their own college.
    if (caller.role !== 'superadmin' && caller.collegeId && caller.collegeId !== collegeId) {
      throw new HttpsError(
        'permission-denied',
        'You can only import staff into your own college'
      )
    }

    // ── Load college data ──
    const collegeRef = admin.firestore().collection('colleges').doc(collegeId)
    const collegeSnap = await collegeRef.get()
    if (!collegeSnap.exists) {
      throw new HttpsError('not-found', `College ${collegeId} not found`)
    }
    const college = collegeSnap.data() as { code?: string; name?: string }

    const results: StaffResult[] = []
    const errors: Array<{ row: number; email: string; message: string }> = []
    let createdCount = 0
    let reclaimedCount = 0
    let failedCount = 0

    // Track emails/ids we have already written in THIS batch so duplicate rows
    // inside the same CSV don't collide with one another.
    const seenEmails = new Set<string>()
    const seenFacultyIds = new Set<string>()

    for (let i = 0; i < staff.length; i++) {
      const row = staff[i]
      const rowNum = i + 1

      const email = String(row.email || '').trim().toLowerCase()
      const firstName = String(row.firstName || row.name || '').trim()
      const lastName = String(row.lastName || '').trim()
      const name = `${firstName} ${lastName}`.trim() || email.split('@')[0]

      const fail = (message: string) => {
        failedCount++
        errors.push({ row: rowNum, email, message })
        results.push({
          id: '',
          email,
          name,
          role: 'faculty',
          success: false,
          error: message,
        })
      }

      // ── Per-row validation: name + email are the only hard requirements.
      if (!firstName) {
        fail('Missing name')
        continue
      }
      if (!EMAIL_RE.test(email)) {
        fail('Invalid email address')
        continue
      }

      const role: StaffRole = ALLOWED_STAFF_ROLES.includes(row.role as StaffRole)
        ? (row.role as StaffRole)
        : row.isPrincipal
          ? 'principal'
          : row.isHOD
            ? 'hod'
            : 'faculty'

      const department = String(row.department || '').trim()
      const facultyId = String(row.facultyId || `FAC${Date.now()}${i}`).trim()
      const password = defaultPassword ? String(defaultPassword) : generateRandomPassword()

      if (seenEmails.has(email)) {
        fail('Duplicate email in the uploaded file')
        continue
      }
      if (seenFacultyIds.has(facultyId)) {
        fail('Duplicate faculty ID in the uploaded file')
        continue
      }

      try {
        // ── Reuse an existing profile doc for this college (genuine duplicate
        //    that already has working credentials). We do NOT reset its
        //    password, so we cannot hand one back — report it as skipped.
        const existingProfile = await admin
          .firestore()
          .collection(STAFF_PROFILE_COLLECTION)
          .where('email', '==', email)
          .limit(1)
          .get()
        if (!existingProfile.empty) {
          const doc = existingProfile.docs[0]
          const data = doc.data()
          if (String(data.collegeId || '') === collegeId) {
            fail(`${email} already exists in this college — skipped (password unchanged)`)
            continue
          }
        }

        // ── Create or reclaim the Auth account.
        const { uid, reclaimed } = await ensureCollegeAuthUser({
          email,
          name,
          password,
          collegeId,
          role,
        })

        const now = admin.firestore.FieldValue.serverTimestamp()

        const profileData = {
          id: facultyId,
          facultyId,
          firstName,
          lastName,
          name,
          email,
          phone: String(row.phone || '').trim(),
          gender: String(row.gender || '').trim(),
          collegeId,
          collegeName: String(row.collegeName || college.name || '').trim(),
          collegeCode: String(row.collegeCode || college.code || '').trim(),
          department,
          designation: String(row.designation || (role === 'principal' ? 'Principal' : 'Assistant Professor')),
          employmentType: String(row.employmentType || 'FULL_TIME'),
          joiningDate: String(row.joiningDate || ''),
          qualification: String(row.qualification || ''),
          specialization: String(row.specialization || ''),
          subjectsUG: Array.isArray(row.subjectsUG) ? row.subjectsUG : [],
          subjectsPG: Array.isArray(row.subjectsPG) ? row.subjectsPG : [],
          experienceYears: Number(row.experienceYears || 0),
          isHOD: role === 'hod' || !!row.isHOD,
          isPrincipal: role === 'principal' || !!row.isPrincipal,
          profilePhotoUrl: String(row.profilePhotoUrl || ''),
          role,
          status: 'active',
          uid,
          // Temporary credential mirrored for the admin "show passwords" /
          // reset UI. Login itself is authenticated against Firebase Auth.
          password,
          createdAt: now,
          updatedAt: now,
        }

        const db = admin.firestore()
        const batch = db.batch()

        // Profile doc keyed by the stable facultyId (matches client import).
        batch.set(db.collection(STAFF_PROFILE_COLLECTION).doc(facultyId), profileData, {
          merge: true,
        })

        // Role-resolution lookup doc keyed by the Auth uid.
        batch.set(
          db.collection('users').doc(uid),
          {
            uid,
            id: uid,
            email,
            name,
            role,
            collegeId,
            collegeCode: String(row.collegeCode || college.code || '').trim(),
            department,
            phone: String(row.phone || '').trim(),
            avatar: String(row.profilePhotoUrl || ''),
            status: 'active',
            updatedAt: now,
          },
          { merge: true }
        )

        // HOD directory doc (mirrors the client import).
        if (role === 'hod' && department) {
          batch.set(
            db.collection('hods').doc(`${collegeId}_${department}`),
            {
              facultyId,
              uid,
              collegeId,
              department,
              name,
              email,
              role: 'hod',
              assignedAt: now,
            },
            { merge: true }
          )
        }

        batch.update(collegeRef, {
          facultyCount: admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        })

        await batch.commit()

        seenEmails.add(email)
        seenFacultyIds.add(facultyId)

        if (reclaimed) reclaimedCount++
        else createdCount++

        results.push({
          id: facultyId,
          email,
          name,
          role,
          success: true,
          uid,
          password,
          reclaimed,
        })

        logger.info('[StaffAuth] provisioned staff', {
          facultyId,
          uid,
          email,
          role,
          reclaimed,
          collegeId,
          by: caller.uid,
        })
      } catch (err: any) {
        const message = err?.message || 'Unknown error'
        fail(message)
        logger.error(`[StaffAuth] Failed to provision ${email}:`, err)
      }
    }

    // ── Audit log ──
    try {
      await admin.firestore().collection('logs').add({
        action: 'BULK_STAFF_IMPORT',
        collegeId,
        performedBy: caller.uid,
        performedByName: caller.name,
        total: staff.length,
        created: createdCount,
        reclaimed: reclaimedCount,
        failed: failedCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        elapsedMs: Date.now() - startTime,
      })
    } catch (logError) {
      logger.error('[StaffAuth] Failed to write import audit log', logError)
    }

    return {
      success: failedCount === 0,
      total: staff.length,
      created: createdCount,
      reclaimed: reclaimedCount,
      failed: failedCount,
      errors,
      staff: results,
      collegeId,
    }
  }
)
