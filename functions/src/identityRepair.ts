// functions/src/identityRepair.ts
// Bulk identity repair for accounts that exist in Firestore but not in
// Firebase Authentication (or exist in Auth without claims / without a
// users/{uid} lookup document).
//
// WHY THIS EXISTS
// This project has had three generations of provisioning code:
//   1. client-side Identity Toolkit `signUp` (creates Auth, no claims, no users doc)
//   2. client-side Firestore-only writes (creates the profile, NO Auth account)
//   3. Admin SDK callables (Auth + claims + users doc + profile)
// Every transition left a cohort of half-provisioned accounts behind: the CSV
// was uploaded, the list page shows the student/faculty, but sign-in fails with
// "account not found" because there is no credential to sign in with. Repairing
// those one-by-one in the console does not scale, so this callable performs the
// same reconciliation a superadmin would do by hand — atomically, per row, and
// with a dry run first.
//
// WHAT IT CONSIDERS A BROKEN IDENTITY
//   MISSING_AUTH          profile doc exists, no Firebase Auth user
//   STALE_UID_LINK        profile points at a uid that no longer exists
//   MISSING_CLAIMS        Auth user exists but has no role claim (rules then
//                         deny every staff read — the classic "logged in but
//                         every page is empty / permission-denied")
//   WRONG_CLAIMS          role or college claim disagrees with the profile
//   MISSING_USERS_DOC     no users/{uid} lookup document
//   MISSING_PROFILE_LINK  users/{uid} does not point back at the profile id,
//                         so the client can only resolve its own profile via a
//                         query, which the rules deny for students
//   ACCOUNT_DISABLED      Auth account disabled (login impossible)
//   PLAINTEXT_SECRET      a legacy `password` field on the profile document
//
// SAFETY
//   - superadmin only;
//   - dryRun defaults to true and reports the plan without writing;
//   - never overwrites an existing role claim with a lower privilege;
//   - never deletes an Auth account;
//   - never reads or copies a legacy plaintext password — it is deleted, and a
//     new credential (or reset link) is issued instead.

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import {
  COLLECTION_ROLE,
  findAuthUserByEmail,
  generateRandomPassword,
  isValidEmail,
  normalizeEmail,
  normalizeRole,
  secretFieldDeletes,
  verifyCaller,
  withApiVersion,
} from './identityShared'

interface RepairInput {
  /** Restrict the sweep to one tenant. Omitted = every college. */
  collegeId?: string
  /** Defaults to students + faculty + admins + hods + mentors + superadmins. */
  collections?: string[]
  /** Report only; no writes. Defaults to true. */
  dryRun?: boolean
  /** Max documents examined per collection. Defaults to 500. */
  limit?: number
  /** 'reset-email' (default) issues a link; 'temp-password' returns a password. */
  deliveryMode?: 'reset-email' | 'temp-password'
  continueUrl?: string
  /** Also re-issue claims for accounts whose claims already match. */
  forceClaims?: boolean
}

type Finding =
  | 'NO_EMAIL'
  | 'MISSING_AUTH'
  | 'STALE_UID_LINK'
  | 'MISSING_CLAIMS'
  | 'WRONG_CLAIMS'
  | 'MISSING_USERS_DOC'
  | 'MISSING_PROFILE_LINK'
  | 'ACCOUNT_DISABLED'
  | 'PLAINTEXT_SECRET'
  | 'AUTH_ONLY_NO_PROFILE'

interface RepairItem {
  collection: string
  docId: string
  email: string | null
  name: string | null
  role: string | null
  collegeId: string | null
  uid: string | null
  findings: Finding[]
  actions: string[]
  created?: boolean
  password?: string
  resetLink?: string
  error?: string
}

const DEFAULT_COLLECTIONS = ['students', 'faculty', 'admins', 'hods', 'mentors', 'superadmins']

/** Profile fields that can carry the Auth uid, in trust order. */
function uidFieldsFor(_collection: string): string[] {
  return ['uid', 'userId']
}

/** How the profile id is published on users/{uid} for owned-get resolution. */
function profileLinkFieldFor(collection: string): string | null {
  if (collection === 'students') return 'studentDocId'
  if (collection === 'faculty') return 'facultyDocId'
  if (collection === 'admins') return 'adminDocId'
  if (collection === 'hods') return 'hodDocId'
  if (collection === 'mentors') return 'mentorDocId'
  return null
}

export const auditAndRepairIdentities = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async (request) => {
    const startedAt = Date.now()
    const input = (request.data || {}) as RepairInput
    const dryRun = input.dryRun !== false
    const limit = Math.min(Math.max(Number(input.limit) || 500, 1), 5000)
    const deliveryMode = input.deliveryMode === 'temp-password' ? 'temp-password' : 'reset-email'
    const collections = (input.collections?.length ? input.collections : DEFAULT_COLLECTIONS)
      .map((c) => String(c).trim())
      .filter((c) => COLLECTION_ROLE[c])
    if (!collections.length) {
      throw new HttpsError('invalid-argument', 'No supported collection names supplied')
    }

    const caller = await verifyCaller(request, ['superadmin'])
    const db = admin.firestore()
    const auth = admin.auth()

    const items: RepairItem[] = []
    const counts: Record<string, number> = {}
    let scanned = 0
    let broken = 0
    let repaired = 0
    let authCreated = 0
    let claimsIssued = 0
    let usersDocsCreated = 0
    let secretsStripped = 0
    const errors: string[] = []
    // Credentials minted during this run, returned once to the caller only.
    const credentials: Array<{ email: string; password?: string; resetLink?: string }> = []

    const bump = (finding: Finding) => {
      counts[finding] = (counts[finding] || 0) + 1
    }

    for (const collection of collections) {
      const defaultRole = COLLECTION_ROLE[collection]
      let query: admin.firestore.Query = db.collection(collection).limit(limit)
      if (input.collegeId && collection !== 'superadmins') {
        query = db.collection(collection).where('collegeId', '==', input.collegeId).limit(limit)
      }
      let snapshot: admin.firestore.QuerySnapshot
      try {
        snapshot = await query.get()
      } catch (err: any) {
        errors.push(`${collection}: scan failed — ${err?.message || err}`)
        continue
      }

      for (const docSnap of snapshot.docs) {
        scanned++
        const data = docSnap.data() as Record<string, unknown>
        const email = normalizeEmail(data.email) || null
        const name =
          (typeof data.name === 'string' && data.name.trim()) ||
          [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
          null
        const role = normalizeRole(data.role, defaultRole) || defaultRole
        const collegeId =
          (typeof data.collegeId === 'string' && data.collegeId) ||
          (typeof data.collegeID === 'string' && data.collegeID) ||
          (typeof data.college === 'string' && data.college) ||
          null
        const linkField = uidFieldsFor(collection).find((field) =>
          typeof data[field] === 'string' && (data[field] as string).length > 0
        )
        const linkedUid = linkField ? String(data[linkField]) : null

        const findings: Finding[] = []
        const actions: string[] = []
        let authUser: admin.auth.UserRecord | null = null

        if (!email || !isValidEmail(email)) {
          findings.push('NO_EMAIL')
          bump('NO_EMAIL')
          items.push({
            collection,
            docId: docSnap.id,
            email,
            name,
            role,
            collegeId,
            uid: linkedUid,
            findings,
            actions,
            error: 'Profile has no usable email address — cannot create a credential',
          })
          broken++
          continue
        }

        // Resolve the Auth account: trust the linked uid first, then the email.
        try {
          if (linkedUid) {
            try {
              authUser = await auth.getUser(linkedUid)
            } catch (err: any) {
              if (err?.code !== 'auth/user-not-found') throw err
              findings.push('STALE_UID_LINK')
            }
          }
          if (!authUser) authUser = await findAuthUserByEmail(email)
        } catch (err: any) {
          errors.push(`${collection}/${docSnap.id}: auth lookup failed — ${err?.message || err}`)
          continue
        }

        if (!authUser) {
          findings.push('MISSING_AUTH')
        } else {
          if (authUser.disabled) findings.push('ACCOUNT_DISABLED')
          const claims = (authUser.customClaims || {}) as Record<string, unknown>
          const claimRole = normalizeRole(claims.role)
          const claimCollege = claims.collegeId ? String(claims.collegeId) : null
          if (!claimRole) findings.push('MISSING_CLAIMS')
          else if (claimRole !== role || (collegeId && claimCollege !== collegeId)) {
            findings.push('WRONG_CLAIMS')
          }
          if (linkedUid && authUser.uid !== linkedUid) findings.push('STALE_UID_LINK')
        }

        const usersRef = authUser ? db.doc(`users/${authUser.uid}`) : null
        const usersSnap = usersRef ? await usersRef.get() : null
        if (authUser && !usersSnap?.exists) findings.push('MISSING_USERS_DOC')
        const profileLinkField = profileLinkFieldFor(collection)
        if (
          authUser &&
          usersSnap?.exists &&
          profileLinkField &&
          (usersSnap.data() || {})[profileLinkField] !== docSnap.id
        ) {
          findings.push('MISSING_PROFILE_LINK')
        }
        const secretDeletes = secretFieldDeletes(data)
        if (Object.keys(secretDeletes).length) findings.push('PLAINTEXT_SECRET')

        if (!findings.length && !input.forceClaims) continue
        broken++

        const item: RepairItem = {
          collection,
          docId: docSnap.id,
          email,
          name,
          role,
          collegeId,
          uid: authUser?.uid || linkedUid,
          findings,
          actions,
        }

        if (dryRun) {
          // Describe what applying would do, so the operator can approve it.
          if (findings.includes('MISSING_AUTH')) {
            actions.push(
              deliveryMode === 'reset-email'
                ? `create Auth account + return password-reset link for ${email}`
                : `create Auth account with a generated password for ${email}`
            )
          }
          if (findings.includes('STALE_UID_LINK')) actions.push(`re-point ${linkField} to ${email}'s uid`)
          if (findings.includes('ACCOUNT_DISABLED')) actions.push('re-enable the Auth account')
          if (findings.includes('MISSING_CLAIMS') || findings.includes('WRONG_CLAIMS'))
            actions.push(`set claims { role: ${role}, collegeId: ${collegeId || 'null'} } + revoke refresh tokens`)
          if (findings.includes('MISSING_USERS_DOC')) actions.push(`create users/{uid} lookup document`)
          if (findings.includes('MISSING_PROFILE_LINK'))
            actions.push(`write users/{uid}.${profileLinkField} = ${docSnap.id}`)
          if (findings.includes('PLAINTEXT_SECRET'))
            actions.push(`delete plaintext field(s): ${Object.keys(secretDeletes).join(', ')}`)
          items.push(item)
          continue
        }

        try {
          // ── 1. Auth account ────────────────────────────────────────────
          if (!authUser) {
            const password = generateRandomPassword()
            authUser = await auth.createUser({
              email,
              password,
              displayName: name || email.split('@')[0],
            })
            actions.push('created Firebase Auth account')
            authCreated++
            item.uid = authUser.uid
            item.created = true
            if (deliveryMode === 'temp-password') {
              item.password = password
              credentials.push({ email, password })
            } else {
              // An unknowable password + a reset link: the student/faculty sets
              // their own credential and nobody in the college has to know it.
              try {
                item.resetLink = await auth.generatePasswordResetLink(
                  email,
                  input.continueUrl ? { url: input.continueUrl } : undefined
                )
                credentials.push({ email, resetLink: item.resetLink })
                actions.push('generated password-reset link')
              } catch (linkErr: any) {
                errors.push(
                  `${collection}/${docSnap.id}: account created but reset link failed — ${linkErr?.message || linkErr}`
                )
              }
            }
          } else if (authUser.disabled) {
            await auth.updateUser(authUser.uid, { disabled: false })
            actions.push('re-enabled the Auth account')
          }

          // ── 2. Claims ──────────────────────────────────────────────────
          const existingClaims = (authUser.customClaims || {}) as Record<string, unknown>
          const claimRole = normalizeRole(existingClaims.role)
          const claimCollege = existingClaims.collegeId ? String(existingClaims.collegeId) : null
          const claimsWrong =
            !claimRole || claimRole !== role || (!!collegeId && claimCollege !== collegeId)
          if (claimsWrong || input.forceClaims) {
            await auth.setCustomUserClaims(authUser.uid, {
              ...existingClaims,
              role,
              collegeId: collegeId || null,
            })
            // Force the next sign-in to mint a token carrying the new claims;
            // an hour-old token would otherwise keep the old (absent) role.
            await auth.revokeRefreshTokens(authUser.uid)
            claimsIssued++
            actions.push(`claims set to { role: ${role}, collegeId: ${collegeId || null} }`)
          }

          // ── 3. Firestore documents ─────────────────────────────────────
          const batch = db.batch()
          const now = admin.firestore.FieldValue.serverTimestamp()

          // Re-link the profile to the real uid (both spellings for students,
          // because older code reads `uid` and the portal reads `userId`).
          const profilePatch: Record<string, unknown> = {
            uid: authUser!.uid,
            ...(email ? { email } : {}),
            ...secretDeletes,
            updatedAt: now,
          }
          if (collection === 'students') profilePatch.userId = authUser!.uid
          batch.set(db.collection(collection).doc(docSnap.id), profilePatch, { merge: true })
          if (Object.keys(secretDeletes).length) {
            secretsStripped += Object.keys(secretDeletes).length
            actions.push(`deleted plaintext field(s): ${Object.keys(secretDeletes).join(', ')}`)
          }

          batch.set(
            db.collection('users').doc(authUser.uid),
            {
              uid: authUser.uid,
              id: authUser.uid,
              email,
              name: name || email.split('@')[0],
              role,
              collegeId: collegeId || null,
              status: (data.status as string) || 'active',
              ...(profileLinkField ? { [profileLinkField]: docSnap.id } : {}),
              updatedAt: now,
              repairedBy: caller.uid,
            },
            { merge: true }
          )
          if (!usersSnap?.exists) usersDocsCreated++
          actions.push('users/{uid} lookup document verified')

          await batch.commit()
          repaired++
          item.actions = actions
          item.uid = authUser.uid
        } catch (err: any) {
          item.error = err?.message || String(err)
          errors.push(`${collection}/${docSnap.id}: ${item.error}`)
          logger.error('[identityRepair] row failed', { collection, docId: docSnap.id, err })
        }
        items.push(item)
      }
    }

    // Reverse direction: an account that CAN sign in but has no documents.
    // These are the "orphaned Auth user" rows left by an import whose Firestore
    // write was denied — Authentication has the account, so signIn succeeds, and
    // then the app reports "account not found" because role resolution finds no
    // users/{uid} and no profile document. Report them, and rebuild the lookup
    // document from the claims when applying.
    let authOnlyCount = 0
    if (!input.collegeId) {
      try {
        let pageToken: string | undefined
        let examined = 0
        do {
          const page = await auth.listUsers(500, pageToken)
          for (const record of page.users) {
            examined++
            if (examined > 5000) break
            const claims = (record.customClaims || {}) as Record<string, unknown>
            const claimRole = normalizeRole(claims.role)
            const claimCollege = claims.collegeId ? String(claims.collegeId) : null
            const usersSnap = await db.doc(`users/${record.uid}`).get()
            const profileCollection = COLLECTION_ROLE[claimRole] ? claimRole : null
            const profileSnap = profileCollection
              ? await db.collection(profileCollection).doc(record.uid).get()
              : null
            if (usersSnap.exists || profileSnap?.exists) continue

            authOnlyCount++
            bump('AUTH_ONLY_NO_PROFILE')
            if (dryRun || !claimRole) continue
            await db
              .collection('users')
              .doc(record.uid)
              .set(
                {
                  uid: record.uid,
                  id: record.uid,
                  email: record.email,
                  name: record.displayName || (record.email || record.uid).split('@')[0],
                  role: claimRole,
                  collegeId: claimCollege,
                  status: 'active',
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  repairedBy: caller.uid,
                },
                { merge: true }
              )
            usersDocsCreated++
            repaired++
            items.push({
              collection: 'users',
              docId: record.uid,
              email: record.email ?? null,
              name: record.displayName ?? null,
              role: claimRole,
              collegeId: claimCollege,
              uid: record.uid,
              findings: ['AUTH_ONLY_NO_PROFILE'],
              actions: ['rebuilt users/{uid} from the verified custom claims'],
            })
          }
          pageToken = page.pageToken
        } while (pageToken && examined <= 5000)
      } catch (err: any) {
        errors.push(`auth-side sweep skipped: ${err?.message || err}`)
      }
    }

    try {
      await db.collection('logs').add({
        action: 'IDENTITY_REPAIR',
        dryRun,
        collegeId: input.collegeId || null,
        collections,
        scanned,
        broken,
        repaired,
        authCreated,
        claimsIssued,
        usersDocsCreated,
        secretsStripped,
        performedBy: caller.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        elapsedMs: Date.now() - startedAt,
      })
    } catch (logError) {
      logger.error('[identityRepair] audit log failed', logError)
    }

    return withApiVersion({
      success: errors.length === 0,
      dryRun,
      scanned,
      broken,
      repaired,
      authCreated,
      claimsIssued,
      usersDocsCreated,
      secretsStripped,
      authOnlyCount,
      counts,
      errors,
      // Keep the response bounded; large colleges get a summary plus the first
      // `items` rows and are asked to re-run per collection.
      items: items.slice(0, 300),
      itemsTruncated: items.length > 300,
      // Only present when this run actually minted credentials, and only ever
      // visible to the superadmin who pressed the button.
      credentials: deliveryMode === 'temp-password' ? credentials : credentials.map((c) => ({ email: c.email, resetLink: c.resetLink })),
      message: dryRun
        ? `Dry run: ${broken} identity/identities need repair. Re-run with dryRun=false to apply.`
        : `Repaired ${repaired} of ${broken} affected identities. Affected users must sign out and sign in again to receive their new claims.`,
    })
  }
)
