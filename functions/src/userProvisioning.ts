// Server-side account provisioning. Clients must not assign roles.
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import * as logger from 'firebase-functions/logger'

const STAFF_CREATOR_ROLES = ['superadmin', 'admin', 'hod']
const PRIVILEGED_ROLES = ['superadmin', 'admin', 'principal', 'hod']
const ALLOWED_ROLES = [
  'superadmin',
  'admin',
  'principal',
  'hod',
  'faculty',
  'mentor',
  'student',
  'parent',
]

function generatePassword(length = 14): string {
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

export const provisionUser = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required')
    }

    const callerDoc = await admin.firestore().doc(`users/${request.auth.uid}`).get()
    const caller = callerDoc.data()
    if (!caller) {
      throw new HttpsError('permission-denied', 'Caller profile not found')
    }
    const callerRole = String(caller.role || '').toLowerCase()
    if (!STAFF_CREATOR_ROLES.includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Insufficient permissions to provision users')
    }

    const { email, name, role, collegeId, password: providedPassword } = request.data || {}
    if (!email || !name || !role) {
      throw new HttpsError('invalid-argument', 'email, name, and role are required')
    }
    const targetRole = String(role).toLowerCase()
    if (!ALLOWED_ROLES.includes(targetRole)) {
      throw new HttpsError('invalid-argument', 'Invalid role')
    }
    if (targetRole === 'superadmin' && callerRole !== 'superadmin') {
      throw new HttpsError('permission-denied', 'Only a superadmin may create superadmins')
    }
    if (PRIVILEGED_ROLES.includes(targetRole) && callerRole !== 'superadmin' && targetRole !== 'hod') {
      throw new HttpsError('permission-denied', 'Only a superadmin may create administrators')
    }
    if (targetRole === 'hod' && !['superadmin', 'admin'].includes(callerRole)) {
      throw new HttpsError('permission-denied', 'Only admin or superadmin may create HODs')
    }

    const tenantCollegeId =
      callerRole === 'superadmin' ? collegeId || caller.collegeId : caller.collegeId
    if (!tenantCollegeId && targetRole !== 'superadmin') {
      throw new HttpsError('invalid-argument', 'collegeId is required')
    }
    if (callerRole !== 'superadmin' && collegeId && collegeId !== caller.collegeId) {
      throw new HttpsError('permission-denied', 'Cannot provision users for another college')
    }

    const password = providedPassword && String(providedPassword).length >= 10
      ? String(providedPassword)
      : generatePassword()

    const userRecord = await admin.auth().createUser({
      email: String(email).trim().toLowerCase(),
      password,
      displayName: String(name).trim(),
    })

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: targetRole,
      collegeId: tenantCollegeId || null,
      mustChangePassword: true,
    })

    const now = admin.firestore.FieldValue.serverTimestamp()
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: String(email).trim().toLowerCase(),
      name: String(name).trim(),
      role: targetRole,
      collegeId: tenantCollegeId || null,
      createdBy: request.auth.uid,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      mustChangePassword: true,
    })

    logger.info('[provisionUser] created', {
      uid: userRecord.uid,
      role: targetRole,
      by: request.auth.uid,
    })

    return {
      success: true,
      uid: userRecord.uid,
      email: String(email).trim().toLowerCase(),
      temporaryPassword: password,
    }
  }
)
