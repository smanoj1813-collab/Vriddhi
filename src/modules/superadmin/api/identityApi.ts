// src/modules/superadmin/api/identityApi.ts
// Superadmin-only identity tooling: bulk repair of already-broken accounts.
// The shared pieces (version handshake, error copy, credential helpers, claim
// self-heal) live in src/shared/services/identityBackend.ts because the auth
// context needs them too.

import { functions } from '@/Firebase/config'
import { httpsCallable } from 'firebase/functions'
import { describeIdentityError, identityBackendMismatch } from '@/shared/services/identityBackend'
import type { CredentialDelivery } from '@/shared/services/identityBackend'

export {
  DEPLOY_COMMAND,
  EXPECTED_IDENTITY_API_VERSION,
  credentialsToCsv,
  describeIdentityError,
  downloadCsv,
  identityBackendMismatch,
  sendPasswordResetEmailTo,
  syncMyIdentity,
} from '@/shared/services/identityBackend'
export type { CredentialRow, CredentialDelivery } from '@/shared/services/identityBackend'

export interface RepairInput {
  collegeId?: string
  collections?: Array<'students' | 'faculty' | 'admins' | 'hods' | 'mentors' | 'superadmins'>
  /** Report only; no writes. Defaults to true (server-side as well). */
  dryRun?: boolean
  limit?: number
  deliveryMode?: CredentialDelivery
  continueUrl?: string
  /** Also re-issue claims for accounts whose claims already match. */
  forceClaims?: boolean
}

export interface RepairItem {
  collection: string
  docId: string
  email: string | null
  name: string | null
  role: string | null
  collegeId: string | null
  uid: string | null
  findings: string[]
  actions: string[]
  created?: boolean
  password?: string
  resetLink?: string
  error?: string
}

export interface RepairResult {
  success: boolean
  dryRun: boolean
  scanned: number
  broken: number
  repaired: number
  authCreated: number
  claimsIssued: number
  usersDocsCreated: number
  secretsStripped: number
  authOnlyCount: number
  counts: Record<string, number>
  errors: string[]
  items: RepairItem[]
  itemsTruncated: boolean
  credentials: Array<{ email: string; password?: string; resetLink?: string }>
  message: string
  apiVersion: string
}

/**
 * Bulk-reconcile Firestore profiles with Firebase Authentication.
 *
 * Use this when accounts exist in Firestore but not in Authentication (or have
 * no role claim, or no `users/{uid}` document): CSV uploads that never created a
 * login, faculty created through the REST signup path, accounts orphaned by a
 * college reset. It defaults to a dry run so the plan can be reviewed first.
 */
export async function runIdentityRepair(input: RepairInput): Promise<RepairResult> {
  const call = httpsCallable<RepairInput, RepairResult>(functions, 'auditAndRepairIdentities')
  let result: Awaited<ReturnType<typeof call>>
  try {
    result = await call({ limit: 500, ...input })
  } catch (err: any) {
    throw new Error(describeIdentityError(err, 'auditAndRepairIdentities'))
  }
  const data = result.data
  const mismatch = identityBackendMismatch(data, 'auditAndRepairIdentities')
  if (mismatch) throw new Error(mismatch.message)
  return data
}
