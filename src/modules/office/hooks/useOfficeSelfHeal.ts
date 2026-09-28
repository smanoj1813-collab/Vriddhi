// src/modules/office/hooks/useOfficeSelfHeal.ts
//
// The accounts and operations desks read collections that the security rules
// authorise from the ID-token CLAIM — `isOffice()` is literally
// `role() in ['accounts','operations'] && collegeId() != null`. An account whose
// collegeId claim was never issued therefore signs in fine, sees its college
// name in the header (that is read from the profile document), and is refused
// every tenant read.
//
// The app already has the repair: `ensureIdentityClaims` compares the token
// against the resolved identity and calls `syncMyIdentity` when they disagree.
// The faculty pages call it on demand (useFacultyAttendance, useMyStaffAttendance
// — one attempt, then one retry, then actionable copy). The office desks did
// not, so their only remedy was "sign out and sign back in", and if that failed
// nothing on the page could say why.
//
// `ensureIdentityClaims` is itself a no-op when the token already agrees (it
// reads the claims and returns 'current' without calling the backend), so the
// desk can call this before every retry without cost. The one-shot guard keeps
// a genuinely broken account from looping a callable on every click.

import { useCallback, useRef } from 'react'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { ensureIdentityClaims } from '@/shared/services/identitySelfHeal'

/**
 * @returns true when the claims were re-issued, i.e. a retry is worth making.
 */
export function useOfficeSelfHeal(): () => Promise<boolean> {
  const { user } = useAuth()
  const attempted = useRef(false)

  return useCallback(async () => {
    if (!user || attempted.current) return false
    attempted.current = true
    try {
      const outcome = await ensureIdentityClaims({
        role: user.role,
        collegeId: user.collegeId ?? null,
      })
      if (outcome !== 'refreshed') {
        console.warn(
          '[useOfficeSelfHeal] claim refresh did not re-issue claims:',
          outcome,
          '— the desk reads what the rules authorise, which comes from the token, not the profile.',
        )
      }
      return outcome === 'refreshed'
    } catch (err) {
      console.warn('[useOfficeSelfHeal] claim refresh failed:', err)
      return false
    }
  }, [user])
}
