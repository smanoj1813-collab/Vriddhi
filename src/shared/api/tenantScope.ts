import { auth } from '@/Firebase/config'
import { where, type QueryConstraint } from 'firebase/firestore'
import { canonicalizeRole } from '@/shared/utils/identityClaims'

/** Query selection, not authorization. Firestore rules are the security boundary.
 * An explicit college is a selected tenant (also used by Super Admin); otherwise
 * use cached, verified Auth claims, never an unattributed localStorage value. */
async function resolveCollegeScope(collegeId?: string | null): Promise<string | null> {
  const explicit = collegeId?.trim()
  if (explicit) {
    if (explicit.includes('/')) throw new Error('Invalid college scope.')
    return explicit
  }
  const user = auth.currentUser
  if (!user) throw new Error('Sign in to load college records.')
  const { claims } = await user.getIdTokenResult()
  if (auth.currentUser?.uid !== user.uid) throw new Error('Your account changed. Reload this page.')
  const college = typeof claims.collegeId === 'string' ? claims.collegeId.trim() : ''
  if (college && !college.includes('/')) return college
  if (canonicalizeRole(claims.role) === 'superadmin') return null
  throw new Error('Your sign-in has no college scope. Sign out and back in or ask an administrator to repair your account.')
}

export async function collegeReadConstraints(collegeId?: string | null): Promise<QueryConstraint[]> {
  const college = await resolveCollegeScope(collegeId)
  return college ? [where('collegeId', '==', college)] : []
}

/** College-path and write workflows always require a concrete selected tenant,
 * including for Super Admin. They must never construct an empty/global path. */
export async function requireCollegeId(collegeId?: string | null): Promise<string> {
  const college = await resolveCollegeScope(collegeId)
  if (!college) throw new Error('Select a college before using this workflow.')
  return college
}
