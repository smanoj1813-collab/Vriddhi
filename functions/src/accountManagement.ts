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
import {
  IDENTITY_API_VERSION,
  generateRandomPassword as sharedGeneratePassword,
  secretFieldDeletes,
  verifyAuthAccount,
} from './identityShared'
import * as logger from 'firebase-functions/logger'

const db = admin.firestore()
const auth = admin.auth()

const COLLEGE_MANAGER_ROLES = ['admin', 'hod', 'principal']

// Profile collections that map 1:1 (or near) to a person and carry a uid.
const PROFILE_COLLECTIONS = ['faculty', 'students', 'admins', 'hods', 'mentors'] as const

const generateTemporaryPassword = sharedGeneratePassword

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

    // Clear any legacy plaintext password kept on the target's profile documents.
    // After a rotation those fields are both stale and a leak: staff in the same
    // college can read these collections, and the presence of the field is what
    // kept the "open Firestore and copy the password" workflow alive.
    let secretsStripped = 0
    for (const collection of PROFILE_COLLECTIONS) {
      try {
        const snap = await db.collection(collection).where('uid', '==', target.uid).limit(5).get()
        for (const doc of snap.docs) {
          const deletes = secretFieldDeletes(doc.data() as Record<string, unknown>)
          if (!Object.keys(deletes).length) continue
          await doc.ref.update(deletes)
          secretsStripped += Object.keys(deletes).length
        }
      } catch {
        // Best effort: the credential itself has already been rotated.
      }
    }

    const verification = await verifyAuthAccount({ uid: target.uid, email: target.email || '' })

    return {
      apiVersion: IDENTITY_API_VERSION,
      success: true,
      uid: target.uid,
      email: target.email,
      temporaryPassword,
      authVerified: verification.ok,
      reauthenticateRequired: true,
      secretsStripped,
      // A reset link is the no-shared-secret alternative: hand this to the user
      // instead of a password whenever the mail template is configured.
      resetLink: target.email
        ? await auth.generatePasswordResetLink(target.email).catch(() => null)
        : null,
    }
  }
)

// Profile collections (in claim-resolution order) used to derive an account's
// role/college during the one-time claims backfill.
const BACKFILL_ROLE_COLLECTIONS: Array<{ name: string; role: string }> = [
  { name: 'admins', role: 'admin' },
  { name: 'faculty', role: 'faculty' },
  { name: 'hods', role: 'hod' },
  { name: 'mentors', role: 'mentor' },
  { name: 'students', role: 'student' },
]

/**
 * One-time migration: stamp role/collegeId custom claims on accounts that were
 * provisioned before claims were authoritative (so the claim-only rules don't
 * lock them out). Superadmin only. It only ever FILLS accounts that have no
 * existing role claim (never downgrades or overwrites), and the college is
 * taken from the tenant profile document.
 */
export const syncIdentityClaims = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 540, maxInstances: 3 },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required')
    const caller = await getCallerIdentity(request.auth.uid)
    if (caller.role !== 'superadmin') {
      throw new HttpsError('permission-denied', 'Only a superadmin can backfill claims')
    }

    let scanned = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []

    // Index every tenant profile doc by the uid it references.
    const profileByUid = new Map<string, { role: string; collegeId: string | null }>()
    for (const { name, defaultRole } of BACKFILL_ROLE_COLLECTIONS.map((c) => ({
      name: c.name,
      defaultRole: c.role,
    }))) {
      try {
        const snap = await db.collection(name).get()
        for (const doc of snap.docs) {
          const d = doc.data() as Record<string, unknown>
          const uid = typeof d.uid === 'string' ? d.uid : typeof d.userId === 'string' ? d.userId : null
          if (!uid || profileByUid.has(uid)) continue
          const role = String(d.role || defaultRole).toLowerCase()
          const collegeId = typeof d.collegeId === 'string' ? d.collegeId : null
          profileByUid.set(uid, { role, collegeId })
        }
      } catch (err: any) {
        errors.push(`${name}: ${err?.message || err}`)
      }
    }

    let pageToken: string | undefined
    do {
      const page = await auth.listUsers(1000, pageToken)
      for (const record of page.users) {
        scanned++
        const claims = (record.customClaims || {}) as Record<string, unknown>
        if (claims.role) {
          skipped++
          continue
        }
        const profile = profileByUid.get(record.uid)
        // Superadmin accounts may only exist as a superadmins/{uid} doc.
        const isSuper = (await db.doc(`superadmins/${record.uid}`).get()).exists
        const role = isSuper ? 'superadmin' : profile?.role
        if (!role) {
          skipped++
          continue
        }
        const collegeId = isSuper ? claims.collegeId ?? null : profile?.collegeId ?? null
        try {
          await auth.setCustomUserClaims(record.uid, { role, collegeId })
          updated++
        } catch (err: any) {
          errors.push(`claims(${record.uid}): ${err?.message || err}`)
        }
      }
      pageToken = page.pageToken
    } while (pageToken)

    try {
      await db.collection('logs').add({
        action: 'SYNC_IDENTITY_CLAIMS',
        performedBy: request.auth.uid,
        scanned,
        updated,
        skipped,
        errors,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      })
    } catch (logError) {
      logger.error('[syncIdentityClaims] failed to write audit log', logError)
    }

    return {
      apiVersion: IDENTITY_API_VERSION,
      success: errors.length === 0,
      scanned,
      updated,
      skipped,
      errors,
      reauthenticateRequired: updated > 0,
    }
  }
)
