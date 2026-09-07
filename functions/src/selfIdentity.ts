// functions/src/selfIdentity.ts
// Self-service identity synchronisation.
//
// THE FAILURE IT REMOVES
// Firestore rules take the *authoritative* role from the ID-token custom claim,
// while the web client happily resolves a role from `users/{uid}` or a profile
// document. For an account whose claim was never issued — imported before the
// claims work, created through the Identity Toolkit REST API (which cannot set
// claims), or half-repaired by an older importer — that mismatch produces the
// single most confusing symptom in this project:
//
//     sign-in SUCCEEDS, the dashboard loads, and every list is empty or
//     "Missing or insufficient permissions".
//
// The user reads it as "login is broken", the admin reads it as "rules are
// broken", and neither is right: the identity exists, only the token lacks the
// claim. This callable lets the account fix itself without a superadmin.
//
// WHY IT IS SAFE
// The role and college are read from `users/{uid}`, and those fields cannot be
// self-edited: the rules allow the owner to update only non-privileged fields
// (`immutableUserFields()` + an affectedKeys guard on role/collegeId/uid), and
// creating that document requires a superadmin. So a caller can only obtain the
// role the application has already recorded for them — never a higher one.
// The callable also refuses to *downgrade* or *change* an existing role claim;
// privilege changes stay with `grantUserRole` / `auditAndRepairIdentities`.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { PROVISIONABLE_ROLES, normalizeEmail, normalizeRole, withApiVersion } from './identityShared'

/** Collections whose membership alone proves the superadmin identity. */
const SUPERADMIN_MARKER = 'superadmins'

export const syncMyIdentity = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required')
    }
    const db = admin.firestore()
    const uid = request.auth.uid
    const profile = await db.collection(SUPERADMIN_MARKER).doc(uid).get()
    const isSuperadminProfile = profile.exists

    const lookup = await db.doc(`users/${uid}`).get()
    const lookupData = lookup.data() as Record<string, unknown> | undefined

    let role: string | null = null
    let collegeId: string | null = null

    if (isSuperadminProfile) {
      role = 'superadmin'
    }
    if (lookupData) {
      const candidate = normalizeRole(lookupData.role)
      if (candidate && PROVISIONABLE_ROLES.includes(candidate)) role = candidate
      const candidateCollege =
        typeof lookupData.collegeId === 'string' ? lookupData.collegeId : null
      // Never let a lookup document move a superadmin into a tenant.
      if (role !== 'superadmin' && candidateCollege) collegeId = candidateCollege
    }

    if (!role) {
      throw new HttpsError(
        'not-found',
        'No identity profile exists for this account. Ask a superadmin to run Superadmin → Access Control → Identity repair (or grant this email a role).'
      )
    }
    if (role !== 'superadmin' && !collegeId) {
      // Tenancy may legitimately be absent for cross-college roles only.
      const claimed = (request.auth.token.collegeId as string) || null
      collegeId = claimed
    }

    const auth = admin.auth()
    const current = await auth.getUser(uid)
    const existingClaims = (current.customClaims || {}) as Record<string, unknown>
    const currentRole = normalizeRole(existingClaims.role)
    const currentCollege = existingClaims.collegeId ? String(existingClaims.collegeId) : null

    const alreadyCorrect = currentRole === role && (currentCollege || null) === collegeId

    if (alreadyCorrect) {
      return withApiVersion({
        updated: false,
        role,
        collegeId,
        reauthenticateRequired: false,
        email: normalizeEmail(current.email) || null,
        message: 'Your claims already match your profile. Sign out and back in to refresh the token.',
      })
    }

    // Filling a *missing* role claim is self-service. Changing an existing one
    // is an administrative action, and stays that way.
    if (currentRole && currentRole !== role) {
      throw new HttpsError(
        'permission-denied',
        `Your token says "${currentRole}" but your profile says "${role}". A role change must be applied by a superadmin so it is audited.`
      )
    }

    await auth.setCustomUserClaims(uid, {
      ...existingClaims,
      role,
      collegeId: collegeId || null,
    })
    await auth.revokeRefreshTokens(uid)

    logger.info('[syncMyIdentity] claims issued', { uid, role, collegeId })

    return withApiVersion({
      updated: true,
      role,
      collegeId,
      reauthenticateRequired: true,
      email: normalizeEmail(current.email) || null,
      message: 'Identity claims refreshed. Sign out and sign in again to load your data.',
    })
  }
)
