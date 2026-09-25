// functions/src/officeStaff.ts
//
// College office staff — the ACCOUNTS team (fees, payments, vendor bills and,
// when the college allows it, payroll) and the OPERATIONS team (library,
// inventory, stores, procurement). A principal manages these people for their
// own college; a superadmin may act for any college.
//
//   manageOfficeStaff({ action: 'create', email, name, role, phone? })
//       → creates (or re-roles an existing non-privileged) account, stamps the
//         custom claim { role, collegeId }, writes users/{uid} and the roster
//         row colleges/{cid}/officeStaff/{uid}, returns a one-time password
//         for brand-new accounts.
//   manageOfficeStaff({ action: 'deactivate' | 'reactivate', uid })
//       → disables / re-enables sign-in and flags the roster row.
//   manageOfficeStaff({ action: 'resetPassword', uid })
//       → issues a new temporary password.
//
// Authorisation is decided from the caller's verified custom claim, exactly
// like the Firestore rules — never from a client-writable profile document.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { OFFICE_ROLES, generateRandomPassword } from './identityShared'

type Action = 'create' | 'deactivate' | 'reactivate' | 'resetPassword'

/** Pure authorisation decision — unit tested. */
export function decideOfficeStaffAccess(input: {
  callerRole: string
  callerCollegeId: string | null
  targetCollegeId: string | null
  targetRole?: string
}): { ok: true; collegeId: string } | { ok: false; reason: string } {
  const role = String(input.callerRole || '').toLowerCase()
  if (role !== 'principal' && role !== 'superadmin') {
    return { ok: false, reason: 'Only the principal can manage office staff.' }
  }
  if (input.targetRole !== undefined && !OFFICE_ROLES.includes(String(input.targetRole))) {
    return { ok: false, reason: 'Role must be accounts or operations.' }
  }
  const collegeId = role === 'superadmin' ? (input.targetCollegeId || input.callerCollegeId) : input.callerCollegeId
  if (!collegeId) return { ok: false, reason: 'No college is associated with this request.' }
  if (role !== 'superadmin' && input.targetCollegeId && input.targetCollegeId !== input.callerCollegeId) {
    return { ok: false, reason: 'You can only manage staff of your own college.' }
  }
  return { ok: true, collegeId }
}

/** Roles that can never be silently converted into an office role. */
const PROTECTED_ROLES = ['superadmin', 'admin', 'principal', 'hod', 'faculty', 'mentor', 'student', 'parent']

const clean = (v: unknown, max = 160) => String(v ?? '').trim().slice(0, max)

export const manageOfficeStaff = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required')
    const db = admin.firestore()
    const token = request.auth.token as Record<string, unknown>
    let callerRole = String(token.role || '').toLowerCase()
    if (!callerRole && (await db.doc(`superadmins/${request.auth.uid}`).get()).exists) callerRole = 'superadmin'
    const callerCollegeId = token.collegeId ? String(token.collegeId) : null

    const data = (request.data || {}) as Record<string, unknown>
    const action = clean(data.action, 20) as Action
    const targetCollegeId = clean(data.collegeId, 120) || null

    if (action === 'create') {
      const email = clean(data.email, 254).toLowerCase()
      const name = clean(data.name, 120)
      const role = clean(data.role, 30).toLowerCase()
      const phone = clean(data.phone, 20)
      const decision = decideOfficeStaffAccess({ callerRole, callerCollegeId, targetCollegeId, targetRole: role })
      if (!decision.ok) throw new HttpsError('permission-denied', decision.reason)
      if (!email.includes('@') || !name) throw new HttpsError('invalid-argument', 'Name and a valid email are required.')
      const collegeId = decision.collegeId

      let user: admin.auth.UserRecord | null = null
      try { user = await admin.auth().getUserByEmail(email) } catch { user = null }
      let password: string | null = null
      let created = false
      if (user) {
        const existingRole = String(user.customClaims?.role || '').toLowerCase()
        const existingCollege = user.customClaims?.collegeId ? String(user.customClaims.collegeId) : null
        if (existingRole && PROTECTED_ROLES.includes(existingRole)) {
          throw new HttpsError('failed-precondition', `${email} already has the ${existingRole} role. Use a different email for office work.`)
        }
        if (existingCollege && existingCollege !== collegeId) {
          throw new HttpsError('failed-precondition', `${email} belongs to another college.`)
        }
      } else {
        password = generateRandomPassword()
        user = await admin.auth().createUser({ email, password, displayName: name, ...(phone.match(/^\+\d{8,15}$/) ? { phoneNumber: phone } : {}) })
        created = true
      }

      await admin.auth().setCustomUserClaims(user.uid, {
        ...(user.customClaims || {}),
        role,
        collegeId,
        mustChangePassword: created || user.customClaims?.mustChangePassword === true,
      })
      if (!created) await admin.auth().revokeRefreshTokens(user.uid)

      const now = admin.firestore.FieldValue.serverTimestamp()
      const batch = db.batch()
      batch.set(db.doc(`users/${user.uid}`), {
        uid: user.uid, email, name, role, collegeId, phone: phone || null,
        status: 'active', updatedAt: now, ...(created ? { createdAt: now } : {}), managedBy: request.auth.uid,
      }, { merge: true })
      batch.set(db.doc(`colleges/${collegeId}/officeStaff/${user.uid}`), {
        uid: user.uid, email, name, role, collegeId, phone: phone || null,
        status: 'active', updatedAt: now, ...(created ? { createdAt: now } : {}), managedBy: request.auth.uid,
      }, { merge: true })
      batch.create(db.collection('logs').doc(), {
        action: 'manageOfficeStaff.create', targetUid: user.uid, targetEmail: email, role, collegeId,
        actorUid: request.auth.uid, created, createdAt: now,
      })
      await batch.commit()
      logger.info('[manageOfficeStaff] created', { uid: user.uid, role, collegeId, created })
      return { ok: true, uid: user.uid, created, temporaryPassword: password }
    }

    if (action === 'deactivate' || action === 'reactivate' || action === 'resetPassword') {
      const uid = clean(data.uid, 128)
      if (!uid) throw new HttpsError('invalid-argument', 'uid is required')
      const target = await admin.auth().getUser(uid).catch(() => null)
      if (!target) throw new HttpsError('not-found', 'Account not found')
      const targetRole = String(target.customClaims?.role || '').toLowerCase()
      const targetCollege = target.customClaims?.collegeId ? String(target.customClaims.collegeId) : null
      if (!OFFICE_ROLES.includes(targetRole)) throw new HttpsError('failed-precondition', 'Not an office staff account.')
      const decision = decideOfficeStaffAccess({ callerRole, callerCollegeId, targetCollegeId: targetCollege })
      if (!decision.ok) throw new HttpsError('permission-denied', decision.reason)

      const now = admin.firestore.FieldValue.serverTimestamp()
      const rosterRef = db.doc(`colleges/${decision.collegeId}/officeStaff/${uid}`)
      if (action === 'resetPassword') {
        const password = generateRandomPassword()
        await admin.auth().updateUser(uid, { password })
        await admin.auth().setCustomUserClaims(uid, { ...(target.customClaims || {}), mustChangePassword: true })
        await rosterRef.set({ updatedAt: now, passwordResetAt: now }, { merge: true })
        return { ok: true, uid, temporaryPassword: password }
      }
      const disabled = action === 'deactivate'
      await admin.auth().updateUser(uid, { disabled })
      if (disabled) await admin.auth().revokeRefreshTokens(uid)
      const status = disabled ? 'inactive' : 'active'
      await Promise.all([
        rosterRef.set({ status, updatedAt: now }, { merge: true }),
        db.doc(`users/${uid}`).set({ status, updatedAt: now }, { merge: true }),
      ])
      return { ok: true, uid, status }
    }

    throw new HttpsError('invalid-argument', 'Unknown action')
  },
)
