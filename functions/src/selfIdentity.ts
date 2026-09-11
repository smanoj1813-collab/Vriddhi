// functions/src/selfIdentity.ts
// Self-service identity synchronisation.
//
// THE FAILURE IT REMOVES
// Firestore rules take the *authoritative* role and college from the ID-token
// custom claims, while the web client happily resolves a role from
// `users/{uid}` or a profile document. For an account whose claims were never
// issued — imported before the claims work, created through the Identity
// Toolkit REST API (which cannot set claims), or half-repaired by an older
// importer — that mismatch produces the two most confusing symptoms in this
// project:
//
//     sign-in SUCCEEDS, the dashboard loads, and every list is empty or
//     "Missing or insufficient permissions"
//
// (role claim missing) — or, the subtler one:
//
//     sign-in SUCCEEDS, the dashboard loads, and the faculty's "My
//     Attendance" page can read the month but every save is denied
//
// (role claim present but the collegeId claim missing or stale). The user
// reads either as "login is broken", the admin reads it as "rules are
// broken", and neither is right: the identity exists, only the token lacks
// the claim. This callable lets the account fix itself without a superadmin.
//
// WHERE THE CLAIMS COME FROM (trust order, mirrors the client resolver)
//   1. `superadmins/{uid}`  — membership proves the superadmin role; a
//                              superadmin never carries a college claim.
//   2. `users/{uid}`        — the canonical lookup document: created only by
//                              a superadmin, and the owner's own update rule
//                              pins role/collegeId/uid, so its fields cannot
//                              be self-edited.
//   3. the role profile collection (admins, faculty, hods, mentors, students,
//                              in the client's resolution order) — the legacy
//                              fallback for accounts provisioned before the
//                              users-document work. Documents there can only
//                              be created by a superadmin or a college
//                              manager, and every update rule pins
//                              `collegeId`, so neither field is self-writable.
//                              The role comes from COLLECTION MEMBERSHIP,
//                              never from the document's `role` field — that
//                              field is manager-writable and could not mint
//                              a claim without becoming an escalation path.
// A caller can therefore only obtain the role/college the application has
// already recorded for them — never a higher one.
//
// The callable also refuses to *downgrade* or *change* an existing role
// claim; privilege changes stay with `grantUserRole` /
// `auditAndRepairIdentities`.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {
  COLLECTION_ROLE,
  PROVISIONABLE_ROLES,
  normalizeEmail,
  normalizeRole,
  withApiVersion,
} from './identityShared'

/** Collections whose membership alone proves the superadmin identity. */
const SUPERADMIN_MARKER = 'superadmins'

/**
 * Role profile collections, in the SAME order the web client tries them
 * (src/modules/auth/context/auth.ts PROFILE_SPECS, minus superadmins which
 * the marker check above handles). Keeping the order identical is what makes
 * "what the client resolves" equal "what the sync can issue".
 */
const PROFILE_FALLBACK_COLLECTIONS = ['admins', 'faculty', 'hods', 'mentors', 'students']

/** Fields a profile document may store the Auth uid under, in trust order. */
const PROFILE_UID_FIELDS = ['uid', 'userId', 'email'] as const

// ─── Pure decision (unit-tested in functions/test/selfIdentity.test.ts) ───

export interface IdentityLookupFacts {
  /** A `superadmins/{uid}` document exists. */
  hasSuperadminProfile: boolean
  /** Data of `users/{uid}`, or null when the document does not exist. */
  usersDoc: Record<string, unknown> | null
  /**
   * The first role profile document that describes this account, in the
   * client's resolution order, or null when none was found.
   */
  profileDoc: { collection: string; data: Record<string, unknown> } | null
  /** The collegeId the current ID-token claim carries (null when absent). */
  claimedCollegeId: string | null
}

export interface IdentityTarget {
  role: string | null
  collegeId: string | null
  /** Where the role was decided: the profile fallback source is reported. */
  source: 'none' | 'superadmin' | 'users' | 'profile' | 'claim'
}

/**
 * Decide which claims this account should carry, from the trust-ordered
 * lookup facts. Pure, so the whole decision table — including the two
 * legacy shapes the production "My Attendance" denial came from (no users
 * document at all; users document without a collegeId) — is testable without
 * the Admin SDK.
 */
export function resolveIdentityTarget(facts: IdentityLookupFacts): IdentityTarget {
  if (facts.hasSuperadminProfile) {
    // The marker document proves superadmin; a collegeId on any other
    // document must not be laundered into the claims of the account that
    // governs every college.
    return { role: 'superadmin', collegeId: null, source: 'superadmin' }
  }

  let role: string | null = null
  let collegeId: string | null = null
  let source: IdentityTarget['source'] = 'none'

  if (facts.usersDoc) {
    const candidate = normalizeRole(facts.usersDoc.role)
    if (candidate && PROVISIONABLE_ROLES.includes(candidate)) {
      role = candidate
      source = 'users'
    }
    const candidateCollege =
      typeof facts.usersDoc.collegeId === 'string' ? facts.usersDoc.collegeId.trim() : ''
    if (candidateCollege) collegeId = candidateCollege
  }

  const profileDoc = facts.profileDoc
  if (profileDoc && (role === null || collegeId === null)) {
    if (role === null) {
      // Membership, never the document's role field (see the header).
      const membershipRole = COLLECTION_ROLE[profileDoc.collection]
      if (membershipRole && PROVISIONABLE_ROLES.includes(membershipRole)) {
        role = membershipRole
        source = 'profile'
      }
    }
    if (collegeId === null) {
      const candidateCollege =
        typeof profileDoc.data.collegeId === 'string' ? profileDoc.data.collegeId.trim() : ''
      if (candidateCollege) collegeId = candidateCollege
    }
  }

  if (!role) return { role: null, collegeId: null, source: 'none' }

  // A tenant role whose documents simply do not carry a college keeps
  // whatever the token already has — including "nothing". That is the state
  // where nobody has told the system which college this account belongs to;
  // there is nothing to repair, and treating it as broken would loop the
  // self-heal forever.
  if (role !== 'superadmin' && collegeId === null) {
    collegeId = facts.claimedCollegeId
    if (collegeId) source = 'claim'
  }

  return { role, collegeId, source }
}

// ─── Profile lookup ─────────────────────────────────────────────────────────

/**
 * Find the first profile document that describes this account, walking the
 * collections in the client's resolution order. The email anchor is tried
 * last: it is how the identity repair resolves accounts, and a manager-set
 * email on a profile is as trustworthy as the uid link for THIS decision,
 * because both can only have been written by someone who already had
 * manager rights inside a tenant.
 */
async function findProfileDocument(
  db: admin.firestore.Firestore,
  uid: string,
  email: string | null,
): Promise<{ collection: string; data: Record<string, unknown> } | null> {
  const values: Array<{ field: (typeof PROFILE_UID_FIELDS)[number]; value: string }> = [
    { field: 'uid', value: uid },
    { field: 'userId', value: uid },
  ]
  if (email) values.push({ field: 'email', value: email })

  for (const collectionName of PROFILE_FALLBACK_COLLECTIONS) {
    for (const { field, value } of values) {
      try {
        const snap = await db
          .collection(collectionName)
          .where(field, '==', value)
          .limit(1)
          .get()
        if (!snap.empty) {
          const docSnap = snap.docs[0]
          return { collection: collectionName, data: docSnap.data() }
        }
      } catch (err) {
        // A failed lookup must not kill the whole repair: the next field or
        // collection may still find the profile.
        logger.warn('[syncMyIdentity] profile lookup failed', {
          collection: collectionName,
          field,
          error: (err as Error)?.message,
        })
      }
    }
  }
  return null
}

// ─── Callable ───────────────────────────────────────────────────────────────

export const syncMyIdentity = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Authentication required')
    }
    const db = admin.firestore()
    const uid = request.auth.uid

    const auth = admin.auth()
    const current = await auth.getUser(uid)
    const existingClaims = (current.customClaims || {}) as Record<string, unknown>
    const currentRole = normalizeRole(existingClaims.role)
    const currentCollege = existingClaims.collegeId ? String(existingClaims.collegeId) : null
    const email =
      normalizeEmail(current.email) ||
      (request.auth.token.email ? normalizeEmail(request.auth.token.email) : null)

    const marker = await db.collection(SUPERADMIN_MARKER).doc(uid).get()
    const isSuperadminProfile = marker.exists

    const usersDocSnap = await db.doc(`users/${uid}`).get()
    const usersData = (usersDocSnap.data() as Record<string, unknown> | undefined) ?? null

    // The profile lookup is the legacy fallback, so it only runs when the
    // users document is missing a piece the decision still needs — never as
    // a blind extra read on a healthy account.
    const usersComplete =
      !!usersData &&
      !!normalizeRole(usersData.role) &&
      PROVISIONABLE_ROLES.includes(normalizeRole(usersData.role)) &&
      typeof usersData.collegeId === 'string' &&
      usersData.collegeId.trim() !== ''

    let profileDoc: { collection: string; data: Record<string, unknown> } | null = null
    if (!isSuperadminProfile && !usersComplete) {
      profileDoc = await findProfileDocument(db, uid, email)
    }

    const target = resolveIdentityTarget({
      hasSuperadminProfile: isSuperadminProfile,
      usersDoc: usersData,
      profileDoc,
      claimedCollegeId: currentCollege,
    })

    const role = target.role
    const collegeId = target.collegeId

    if (!role) {
      throw new HttpsError(
        'not-found',
        'No identity profile exists for this account. Ask a superadmin to run Superadmin → Access Control → Identity repair (or grant this email a role).'
      )
    }

    const alreadyCorrect = currentRole === role && (currentCollege || null) === collegeId

    if (alreadyCorrect) {
      return withApiVersion({
        updated: false,
        role,
        collegeId,
        reauthenticateRequired: false,
        email: email || null,
        message: 'Your claims already match your profile. Sign out and back in to refresh the token.',
      })
    }

    // Filling a *missing* role claim is self-service. Changing an existing
    // one is an administrative action, and stays that way.
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

    logger.info('[syncMyIdentity] claims issued', { uid, role, collegeId, source: target.source })

    return withApiVersion({
      updated: true,
      role,
      collegeId,
      reauthenticateRequired: true,
      email: email || null,
      message: 'Identity claims refreshed. Sign out and sign in again to load your data.',
    })
  }
)
