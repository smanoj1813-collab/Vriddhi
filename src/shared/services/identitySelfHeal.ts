// src/shared/services/identitySelfHeal.ts
//
// Mid-session identity self-heal.
//
// The sign-in self-heal in AuthContext covers the common case, but a token
// can go stale AFTER sign-in: a superadmin runs Identity Repair while the
// user has the tab open, an older deployment minted the token before the
// claim existed, or the sign-in self-heal raced a cold function start and
// gave up. When that happens the user sits on a page reading
// "Missing or insufficient permissions" and signs out/back in is the only
// documented remedy — which they do, and the page still fails if the
// underlying cause is a backend that is too old to repair anything.
//
// ensureIdentityClaims() is the on-demand version of the same decision:
// read the token, compare role AND collegeId against the resolved identity,
// and only when they disagree call syncMyIdentity and force a re-mint of
// the token. It is safe to call repeatedly (idempotent, at most one
// callable round trip per stale token) and it reports WHAT happened so the
// calling page can retry once, then stop and show actionable copy.

import { auth } from '@/Firebase/config';
import { syncMyIdentity } from './identityBackend';
import { detectClaimStaleness, type ClaimSnapshot } from '@/shared/utils/identityClaims';

/**
 * 'current'      — the token already agrees; nothing was called.
 * 'refreshed'    — syncMyIdentity re-issued the claims and the force-refreshed
 *                  token now agrees. The page may retry the failed operation ONCE.
 * 'unchanged'    — the callable ran but the claims were not (re)issued (the
 *                  deployed function considers them correct, or it refused the
 *                  role change). Retrying the page's operation will not help.
 * 'unavailable'  — the callable could not be reached or returned nothing
 *                  (stale deployment, or no users/profile document at all).
 */
export type SelfHealOutcome = 'current' | 'refreshed' | 'unchanged' | 'unavailable';

/** Read the caller's ID-token claims without ever throwing. */
export async function currentTokenClaims(): Promise<ClaimSnapshot | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const result = await user.getIdTokenResult();
    return { role: result.claims.role, collegeId: result.claims.collegeId };
  } catch {
    return null;
  }
}

export async function ensureIdentityClaims(expected: {
  role: string;
  collegeId?: string | null;
}): Promise<SelfHealOutcome> {
  const before = await currentTokenClaims();
  if (before && !detectClaimStaleness(before, expected).stale) return 'current';

  let sync;
  try {
    sync = await syncMyIdentity();
  } catch {
    return 'unavailable';
  }
  if (!sync) return 'unavailable';

  if (sync.updated) {
    const user = auth.currentUser;
    if (user) {
      // Force a re-mint: an ID token only carries the claims that existed
      // when it was minted, so the next read must use a fresh token.
      try {
        await user.getIdToken(true);
      } catch {
        // The refresh failed; the next check below reports it honestly.
      }
    }
  }

  const after = await currentTokenClaims();
  if (after) return detectClaimStaleness(after, expected).stale ? 'unchanged' : 'refreshed';
  return sync.updated ? 'refreshed' : 'unchanged';
}
