/** Invocation-scoped promise memoization: coalesces concurrent paper loads,
 * never persists answers or shares one test's questions with another test. */
export function memoizeRunLoad<T>(load: (id: string) => Promise<T>): (id: string) => Promise<T> {
  const entries = new Map<string, Promise<T>>()
  return id => {
    const old = entries.get(id)
    if (old) return old
    const pending = load(id).catch(error => { entries.delete(id); throw error })
    entries.set(id, pending)
    return pending
  }
}

export const REPORT_FULL_REFRESH_MS = 5 * 60_000

export function canReuseAssessmentReport(request: { knownRevision?: unknown; loadedAt?: unknown }, revision: string, now = Date.now()): boolean {
  const loadedAt = Number(request.loadedAt)
  return revision.length > 0 && request.knownRevision === revision
    && Number.isFinite(loadedAt) && loadedAt > 0 && loadedAt <= now
    && now - loadedAt < REPORT_FULL_REFRESH_MS
}
