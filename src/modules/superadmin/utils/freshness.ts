// src/modules/superadmin/utils/freshness.ts
//
// Clause A11 of docs/HANDOFF_REVIEW_2026-09-25.md: "whenever a number's
// freshness changes, the UI must say so".
//
// Items 2.4 / 3.1 / 3.2 all move superadmin and dashboard numbers from
// "computed live on every view" to "refreshed every N minutes". Without a
// visible timestamp the support cost of "the dashboard is wrong" eats the
// saving, so every such surface renders this label next to a Refresh button.

export interface FreshnessLabel {
  /** Ready-to-render text, e.g. "Updated 4 min ago". */
  label: string
  /** True when the data is older than the expected refresh window. */
  stale: boolean
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE

/**
 * @param updatedAt ISO timestamp of the data (snapshot doc, or the client's own
 *                  last fetch), or null when unknown.
 * @param options.staleAfterMs how old is "stale" — usually the refresh interval
 *                  plus a small slack.
 * @param options.now injectable clock for tests.
 */
export function describeFreshness(
  updatedAt: string | null | undefined,
  options: { staleAfterMs?: number; now?: number } = {},
): FreshnessLabel {
  const now = options.now ?? Date.now()
  const staleAfterMs = options.staleAfterMs ?? 20 * MINUTE
  if (!updatedAt) return { label: 'Updated time unknown', stale: true }

  const at = Date.parse(updatedAt)
  if (!Number.isFinite(at)) return { label: 'Updated time unknown', stale: true }

  const age = now - at
  // A clock skew in the other direction should not read as "in 3 minutes".
  if (age < 0) return { label: 'Updated just now', stale: false }

  if (age < MINUTE) return { label: 'Updated just now', stale: age > staleAfterMs }
  if (age < HOUR) {
    const minutes = Math.floor(age / MINUTE)
    return { label: `Updated ${minutes} min ago`, stale: age > staleAfterMs }
  }
  if (age < 24 * HOUR) {
    const hours = Math.floor(age / HOUR)
    return { label: `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`, stale: age > staleAfterMs }
  }
  const days = Math.floor(age / (24 * HOUR))
  return { label: `Updated ${days} day${days === 1 ? '' : 's'} ago`, stale: true }
}
