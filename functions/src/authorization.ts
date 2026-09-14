// functions/src/authorization.ts
// ─────────────────────────────────────────────────────────────────────────────
// Backend authorization primitives shared by every employee-portal callable.
//
// WHY THIS FILE EXISTS
// Authorization for the employee portal must be server-side and claim-first.
// The Firestore rules (current-firestore.rules) already take role/collegeId
// exclusively from verified ID-token custom claims; callables must hold the
// same line, or the API becomes the soft underbelly next to a hardened
// database. `identityShared.verifyCaller` reads the role from `users/{uid}`
// (a document a compromised profile write could influence in older tenants),
// so this module resolves identity from the verified token FIRST and only
// falls back to the profile document for legacy accounts — never the other
// way round.
//
// THE THREE PRIMITIVES
//   1. resolveCaller()      — who is calling, from the verified token.
//   2. resolveCollegeScope()— which college the operation acts on. College
//                             staff are PINNED to their claim; only a
//                             superadmin may target another college, and then
//                             only explicitly. A client-supplied collegeId
//                             from a non-superadmin that disagrees with the
//                             claim is rejected, not silently corrected.
//   3. writeAuditLog()      — append-only trail in the `logs` collection,
//                             same convention as grantUserRole so the
//                             superadmin System Management viewer and the
//                             new admin Audit Log page read one collection.
// ─────────────────────────────────────────────────────────────────────────────

import { HttpsError } from 'firebase-functions/v2/https'
import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { normalizeRole } from './identityShared'

/** Every role an "employee" of a college can hold. Students/parents are not
 * employees; superadmin is a platform role, not a college employee. */
export const EMPLOYEE_ROLES = ['admin', 'principal', 'hod', 'mentor', 'faculty'] as const
export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number]

/** Roles that may manage the employee directory of their own college. */
export const EMPLOYEE_MANAGER_ROLES = ['superadmin', 'admin', 'principal'] as const

/** Roles allowed to read audit logs. HOD is deliberately excluded: the trail
 * contains provisioning and credential actions across the whole college. */
export const AUDIT_READER_ROLES = ['superadmin', 'admin', 'principal'] as const

export interface CallerContext {
  uid: string
  email: string
  name: string
  role: string
  collegeId: string | null
  /** True when identity came from verified custom claims (preferred path). */
  fromClaims: boolean
}

const clean = (value: unknown, max = 200): string =>
  String(value ?? '').trim().slice(0, max)

/**
 * Resolve the caller from the verified ID token. Claims win; the users/{uid}
 * profile is a fallback for legacy accounts whose claims were never minted
 * (those accounts are flagged so callables can require a re-sign-in when the
 * operation is sensitive).
 */
export async function resolveCaller(
  request: { auth?: { uid: string; token?: Record<string, unknown> } },
  allowedRoles: readonly string[]
): Promise<CallerContext> {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in is required for this operation')
  }
  const token = (request.auth.token || {}) as Record<string, unknown>
  const claimRole = normalizeRole(token.role, '')
  const claimCollege = clean(token.collegeId, 120) || null

  const db = admin.firestore()
  const userDoc = await db.doc(`users/${request.auth.uid}`).get()
  const user = userDoc.data() as Record<string, unknown> | undefined

  const role = claimRole || normalizeRole(user?.role, '')
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError(
      'permission-denied',
      `Role "${role || 'unknown'}" is not allowed to perform this operation`
    )
  }
  if (role !== 'superadmin' && !(claimCollege || clean(user?.collegeId, 120))) {
    throw new HttpsError(
      'permission-denied',
      'Your account has no college attached. Ask a superadmin to repair it (Access Control → Identity repair), then sign in again.'
    )
  }

  return {
    uid: request.auth.uid,
    email: clean(user?.email || token.email, 320).toLowerCase(),
    name: clean(user?.name || token.name, 200),
    role,
    collegeId: claimCollege || clean(user?.collegeId, 120) || null,
    fromClaims: Boolean(claimRole),
  }
}

/**
 * Decide which college an operation acts on.
 *
 * - College staff are pinned to the collegeId in their verified claim. A
 *   disagreeing `inputCollegeId` is rejected outright — never silently
 *   rewritten — so a misrouted client surfaces as an error instead of
 *   touching the wrong tenant.
 * - A superadmin has no claim college; they must pass `inputCollegeId`
 *   explicitly (or omit it for college-agnostic operations like audit reads).
 */
export function resolveCollegeScope(
  caller: CallerContext,
  inputCollegeId?: unknown,
  opts: { required?: boolean } = {}
): string | null {
  const requested = clean(inputCollegeId, 120) || null
  if (caller.role === 'superadmin') {
    if (opts.required && !requested) {
      throw new HttpsError('invalid-argument', 'collegeId is required for this operation')
    }
    return requested
  }
  if (requested && requested !== caller.collegeId) {
    throw new HttpsError('permission-denied', 'You can only operate on your own college')
  }
  if (opts.required && !caller.collegeId) {
    throw new HttpsError('failed-precondition', 'Your account is not attached to a college')
  }
  return caller.collegeId
}

/** A single audit-trail entry, `logs` collection convention. */
export interface AuditEntry {
  action: string
  actorUid: string
  actorRole?: string
  actorName?: string
  collegeId?: string | null
  targetUid?: string
  targetEmail?: string
  targetId?: string
  targetType?: string
  details?: Record<string, unknown>
}

/** Pure builder kept separate so unit tests can assert the shape without an
 * emulator, and so secrets never enter a log line by construction. */
export function buildAuditEntry(entry: AuditEntry, at: unknown = null): Record<string, unknown> {
  const out: Record<string, unknown> = {
    action: clean(entry.action, 80),
    actorUid: clean(entry.actorUid, 120),
    actorRole: clean(entry.actorRole, 40),
    actorName: clean(entry.actorName, 200),
    collegeId: entry.collegeId ?? null,
    createdAt: at ?? null,
  }
  if (entry.targetUid) out.targetUid = clean(entry.targetUid, 120)
  if (entry.targetEmail) out.targetEmail = clean(entry.targetEmail, 320).toLowerCase()
  if (entry.targetId) out.targetId = clean(entry.targetId, 200)
  if (entry.targetType) out.targetType = clean(entry.targetType, 40)
  if (entry.details && Object.keys(entry.details).length > 0) {
    // Drop anything that even looks like a credential before it is persisted.
    const safe: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(entry.details)) {
      if (/password|secret|token|credential/i.test(key)) continue
      safe[key] = value
    }
    out.details = safe
  }
  return out
}

/**
 * Append an entry to the audit trail. Best-effort by design: an audit write
 * must never fail the primary operation (the alternative — rolling back a
 * provisioning because the log write throttled — is worse), but a failure is
 * logged loudly so it cannot vanish silently.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const doc = buildAuditEntry(entry, admin.firestore.FieldValue.serverTimestamp())
    await admin.firestore().collection('logs').add(doc)
  } catch (err) {
    logger.error('[authorization] audit write failed', {
      action: entry.action,
      actorUid: entry.actorUid,
      error: String((err as Error)?.message || err),
    })
  }
}
