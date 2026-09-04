// functions/src/identityShared.ts
// Shared primitives for every account-provisioning callable.
//
// WHY THIS FILE EXISTS
// Before this, password generation, caller authorisation and (crucially) the
// "did the Auth account actually get created?" check were duplicated in
// studentAuth.ts, staffAuth.ts, userProvisioning.ts and roleManagement.ts.
// Duplicated provisioning logic is how an import could write the Firestore
// profile but silently skip the Auth account: the copies drifted apart and no
// layer ever verified the end state.
//
// THE HANDSHAKE
// Every provisioning/identity callable returns `apiVersion`. The web client
// compares it with its own expectation and refuses to report success when the
// deployed backend is older than the frontend it is talking to. Hosting,
// Firestore rules and Cloud Functions are deployed independently in this
// project (CI builds but never deploys), so a frontend that expects
// "create Auth + profile + users doc + claims" silently running against an
// older function is a real, repeated failure mode — it is exactly the
// "students were created in Firestore but not in Authentication" symptom.

import { HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

/**
 * Bump this whenever the Auth/profile write contract changes, then deploy
 * functions AND hosting together. The client refuses to call an import a
 * success unless it matches.
 */
export const IDENTITY_API_VERSION = 'identity-2026.09.04-a'

/** Roles that may create or repair other accounts. */
export const STAFF_CREATOR_ROLES = ['superadmin', 'admin', 'hod', 'principal']
/** Every role the identity model knows about. */
export const PROVISIONABLE_ROLES = [
  'superadmin',
  'admin',
  'principal',
  'hod',
  'mentor',
  'faculty',
  'student',
  'parent',
]

// Profile collections that hold a person, in role-resolution order.
export const PROFILE_COLLECTIONS = [
  'superadmins',
  'admins',
  'hods',
  'mentors',
  'faculty',
  'students',
] as const

/** Collection name -> role implied by membership of that collection. */
export const COLLECTION_ROLE: Record<string, string> = {
  superadmins: 'superadmin',
  admins: 'admin',
  hods: 'hod',
  mentors: 'mentor',
  faculty: 'faculty',
  students: 'student',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

/**
 * Cryptographically secure temporary password.
 *
 * Ambiguous glyphs (0/O, 1/l/I) are excluded because these credentials are
 * read out loud and typed by hand. The alphabet always yields a password that
 * satisfies the Firebase Auth minimum (upper, lower, digit, symbol).
 */
export function generateRandomPassword(length = 14): string {
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

export function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase()
}

export function normalizeRole(value: unknown, fallback = ''): string {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return fallback
  // Kept in sync with canonicalRole() in current-firestore.rules: the same
  // spreadsheet spelling has to mean the same thing in the importer and in the
  // rules that authorise the resulting account, or a row is accepted with one
  // role and enforced as another.
  const canonical: Record<string, string> = {
    teacher: 'faculty',
    professor: 'faculty',
    lecturer: 'faculty',
    instructor: 'faculty',
    'teaching staff': 'faculty',
    'teaching-staff': 'faculty',
    'teaching_staff': 'faculty',
    'faculty member': 'faculty',
    'faculty-member': 'faculty',
    'assistant professor': 'faculty',
    'associate professor': 'faculty',
    'head of department': 'hod',
    'head of dept': 'hod',
    'head-of-department': 'hod',
    'head_of_department': 'hod',
    'dept head': 'hod',
    'department head': 'hod',
    depthead: 'hod',
    'vice principal': 'principal',
    'vice-principal': 'principal',
    'vice_principal': 'principal',
    administrator: 'admin',
    'admin staff': 'admin',
    'college admin': 'admin',
    'super admin': 'superadmin',
    'super-admin': 'superadmin',
    super_admin: 'superadmin',
    superuser: 'superadmin',
    superadmin: 'superadmin',
    owner: 'superadmin',
    learner: 'student',
    pupil: 'student',
    guardian: 'parent',
  }
  return canonical[raw] ?? (PROVISIONABLE_ROLES.includes(raw) ? raw : fallback)
}

/**
 * Resolve the caller's authoritative identity.
 *
 * The role comes from the ID-token custom claim when present. Accounts that
 * predate the claims work are recognised through `superadmins/{uid}` only —
 * never through an arbitrary profile document, because those documents are
 * client-writable and would let a caller mint privileges for themselves.
 */
export async function verifyCaller(
  request: { auth?: { uid: string } },
  allowedRoles: string[] = STAFF_CREATOR_ROLES
): Promise<{ uid: string; role: string; collegeId?: string; name?: string }> {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated')
  }
  const db = admin.firestore()
  const userDoc = await db.doc(`users/${request.auth.uid}`).get()
  const userData = userDoc.data() as Record<string, unknown> | undefined
  if (!userData) {
    const superadminDoc = await db.doc(`superadmins/${request.auth.uid}`).get()
    if (!superadminDoc.exists) {
      throw new HttpsError(
        'permission-denied',
        'Caller identity could not be resolved. Ask a superadmin to run Access Control → Identity audit for this account.'
      )
    }
    return { uid: request.auth.uid, role: 'superadmin', collegeId: undefined }
  }

  const role = normalizeRole(userData.role, String(userData.role || '').toLowerCase())
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', `Role "${role || 'unknown'}" cannot perform this operation`)
  }
  return {
    uid: request.auth.uid,
    role,
    collegeId: (userData.collegeId as string | undefined) || undefined,
    name: (userData.name as string | undefined) || undefined,
  }
}

export interface AuthVerification {
  ok: boolean
  uid?: string
  email?: string | null
  role?: string | null
  collegeId?: string | null
  reason?: string
}

/**
 * Read the Auth account back and confirm it matches what we intended to write.
 *
 * This is the check that turns "students were created in Firestore but not in
 * Authentication" from an invisible state into a hard, per-row failure: a
 * provisioning row is only reported as successful when a live Auth credential
 * exists for the email, is enabled, and carries the expected role claim.
 */
export async function verifyAuthAccount(opts: {
  uid?: string
  email: string
  expectedRole?: string
  expectedCollegeId?: string | null
}): Promise<AuthVerification> {
  const auth = admin.auth()
  let record: admin.auth.UserRecord | null = null
  try {
    record = opts.uid ? await auth.getUser(opts.uid) : await auth.getUserByEmail(opts.email)
  } catch (err: any) {
    return {
      ok: false,
      reason:
        err?.code === 'auth/user-not-found'
          ? `No Firebase Auth account exists for ${opts.email}`
          : err?.message || 'Unable to read the Firebase Auth account',
    }
  }
  if (!record) return { ok: false, reason: `No Firebase Auth account exists for ${opts.email}` }
  if (record.disabled) {
    return { ok: false, uid: record.uid, reason: 'The Firebase Auth account is disabled' }
  }
  const claims = (record.customClaims || {}) as Record<string, unknown>
  const roleClaim = normalizeRole(claims.role)
  const collegeClaim = claims.collegeId ? String(claims.collegeId) : null
  if (opts.expectedRole && roleClaim !== opts.expectedRole) {
    return {
      ok: false,
      uid: record.uid,
      email: record.email,
      role: roleClaim || null,
      collegeId: collegeClaim,
      reason: `Role claim is "${roleClaim || 'missing'}" but "${opts.expectedRole}" was provisioned`,
    }
  }
  if (opts.expectedCollegeId && collegeClaim !== opts.expectedCollegeId) {
    return {
      ok: false,
      uid: record.uid,
      email: record.email,
      role: roleClaim || null,
      collegeId: collegeClaim,
      reason: `College claim is "${collegeClaim || 'missing'}" but "${opts.expectedCollegeId}" was provisioned`,
    }
  }
  return {
    ok: true,
    uid: record.uid,
    email: record.email,
    role: roleClaim || null,
    collegeId: collegeClaim,
  }
}

/** Look up an Auth user by email, returning null instead of throwing. */
export async function findAuthUserByEmail(
  email: string
): Promise<admin.auth.UserRecord | null> {
  try {
    return await admin.auth().getUserByEmail(email)
  } catch (err: any) {
    if (err?.code === 'auth/user-not-found') return null
    throw err
  }
}

/**
 * Normalise a phone into E.164 for the last 10 Indian digits. Kept identical to
 * the previous inline logic so importing behaviour does not change.
 */
export function toPhoneE164(phone: unknown): string | undefined {
  const digits = String(phone ?? '').replace(/\D/g, '').slice(-10)
  return digits.length === 10 ? `+91${digits}` : undefined
}

/** Fields that must never live on a profile document. */
// Kept in sync with noPasswordField() in current-firestore.rules: the callables
// delete these keys when they provision a person, and the rules refuse to write
// them in the first place. A field stripped here but allowed there (or the
// reverse) is how "we removed the plaintext passwords" quietly stops being true.
export const SECRET_PROFILE_FIELDS = [
  'password',
  'passwordHash',
  'passwordhash',
  'tempPassword',
  'temporaryPassword',
  'defaultPassword',
  'plainPassword',
  'pwd',
] as const

/**
 * Remove plaintext credentials that older importers used to persist on profile
 * documents. Profile docs are readable by other staff in the same college, so
 * a stored password is a credential leak — and it is also the reason the
 * workflow "open Firestore and read the password" never went away.
 */
export function secretFieldDeletes(
  data: Record<string, unknown> | undefined
): Record<string, admin.firestore.FieldValue> {
  const deletes: Record<string, admin.firestore.FieldValue> = {}
  if (!data) return deletes
  for (const field of SECRET_PROFILE_FIELDS) {
    if (field in data) deletes[field] = admin.firestore.FieldValue.delete()
  }
  return deletes
}

/** Shape every identity callable returns so the client can detect drift. */
export function withApiVersion<T extends object>(payload: T): T & { apiVersion: string } {
  return { ...payload, apiVersion: IDENTITY_API_VERSION }
}
