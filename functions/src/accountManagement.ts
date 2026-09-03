// functions/src/accountManagement.ts
// Server-side account administration that the client cannot do safely:
// resetting a Firebase Auth password. The client has no Admin SDK, so the old
// resetFacultyPassword() only wrote a new password string into the Firestore
// profile doc — which never changed the actual Auth credential, so the user
// could not log in with it. This callable performs the real Auth update.
//
// Security model:
//   - Authorization is decided from the CALLER's custom claims / superadmins
//     doc (never from client-writable profile fields).
//   - A superadmin may reset any account; a college admin/HOD/principal may
//     only reset accounts that belong to their own college.
//   - The new temporary password is returned to the caller exactly once and is
//     NEVER persisted to Firestore (profile docs are readable by other staff
//     in the same college, so storing plaintext passwords there would be a
//     credential leak).

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'
import * as logger from 'firebase-functions/logger'

const db = admin.firestore()
const auth = admin.auth()

const COLLEGE_MANAGER_ROLES = ['admin', 'hod', 'principal']

// Profile collections that map 1:1 (or near) to a person and carry a uid.
const PROFILE_COLLECTIONS = ['faculty', 'students', 'admins', 'hods', 'mentors'] as const

function generateTemporaryPassword(length = 14): string {
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

async function getCallerIdentity(uid: string): Promise<{ role: string; collegeId: string | null }> {
  const userDoc = await db.doc(`users/${uid}`).get()
  const data = userDoc.data()
  if (data) {
    return {
      role: String(data.role || '').toLowerCase(),
      collegeId: data.collegeId ? String(data.collegeId) : null,
    }
  }
  // Legacy superadmins may only have a superadmins/{uid} profile doc.
  const superDoc = await db.doc(`superadmins/${uid}`).get()
  if (superDoc.exists) return { role: 'superadmin', collegeId: null }
  throw new HttpsError('permission-denied', 'Caller profile not found')
}

interface ResolvedTarget {
  uid: string
  email: string | null
  collegeId: string | null
}

/**
 * Resolve the target account from any of: an Auth uid, an email, or a profile
 * document (collection + id) that carries a uid.
 */
async function resolveTarget(input: {
  uid?: string
  email?: string
  collection?: string
  docId?: string
}): Promise<ResolvedTarget> {
  const email = input.email ? String(input.email).trim().toLowerCase() : null

  if (input.uid) {
    const record = await auth.getUser(String(input.uid))
    const claims = (record.customClaims || {}) as Record<string, unknown>
    return {
      uid: record.uid,
      email: record.email || email,
      collegeId: claims.collegeId ? String(claims.collegeId) : null,
    }
  }

  if (email) {
    const record = await auth.getUserByEmail(email)
    const claims = (record.customClaims || {}) as Record<string, unknown>
    return {
      uid: record.uid,
      email: record.email || email,
      collegeId: claims.collegeId ? String(claims.collegeId) : null,
    }
  }

  if (input.collection && input.docId) {
    const collection = String(input.collection)
    if (!PROFILE_COLLECTIONS.includes(collection as (typeof PROFILE_COLLECTIONS)[number])) {
      throw new HttpsError('invalid-argument', `Unsupported profile collection: ${collection}`)
    }
    const snap = await db.collection(collection).doc(String(input.docId)).get()
    if (!snap.exists) throw new HttpsError('not-found', 'Profile document not found')
    const data = snap.data() as Record<string, unknown>
    const targetUid = data.uid || data.userId
    if (typeof targetUid !== 'string' || !targetUid) {
      throw new HttpsError('failed-precondition', 'Profile document is not linked to an Auth account')
    }
    const record = await auth.getUser(targetUid)
    const claims = (record.customClaims || {}) as Record<string, unknown>
    return {
      uid: record.uid,
      email: record.email || (typeof data.email === 'string' ? data.email : null),
      collegeId: claims.collegeId
        ? String(claims.collegeId)
        : data.collegeId
          ? String(data.collegeId)
          : null,
    }
  }

  throw new HttpsError('invalid-argument', 'Provide a uid, an email, or collection + docId')
}

export const resetUserPassword = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required')

    const caller = await getCallerIdentity(request.auth.uid)
    const target = await resolveTarget(request.data || {})

    const isSuperadmin = caller.role === 'superadmin'
    const isCollegeManager = COLLEGE_MANAGER_ROLES.includes(caller.role)
    if (!isSuperadmin && !(isCollegeManager && caller.collegeId && caller.collegeId === target.collegeId)) {
      throw new HttpsError(
        'permission-denied',
        'You can only reset passwords for accounts in your own college'
      )
    }
    // A non-superadmin must never reset a superadmin account.
    if (!isSuperadmin) {
      const targetClaims = (await auth.getUser(target.uid)).customClaims || {}
      if (String(targetClaims.role || '').toLowerCase() === 'superadmin') {
        throw new HttpsError('permission-denied', 'Only a superadmin can reset a superadmin password')
      }
    }

    const temporaryPassword = generateTemporaryPassword()
    await auth.updateUser(target.uid, { password: temporaryPassword })
    // Force the user to sign in again everywhere with the new credential.
    await auth.revokeRefreshTokens(target.uid)
    // Mark the credential as one-time so a change-password flow can prompt.
    await auth.setCustomUserClaims(target.uid, {
      ...((await auth.getUser(target.uid)).customClaims || {}),
      mustChangePassword: true,
    })

    try {
      await db.collection('logs').add({
        action: 'RESET_USER_PASSWORD',
        targetUid: target.uid,
        targetEmail: target.email,
        targetCollegeId: target.collegeId,
        performedBy: request.auth.uid,
        performerRole: caller.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (logError) {
      logger.error('[resetUserPassword] failed to write audit log', logError)
    }

    logger.info('[resetUserPassword] password reset', {
      targetUid: target.uid,
      by: request.auth.uid,
    })

    return {
      success: true,
      uid: target.uid,
      email: target.email,
      temporaryPassword,
    }
  }
)
