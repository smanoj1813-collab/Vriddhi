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

/** Due-time indexes may still be building during a rolling deployment. Only
 * index/precondition errors use the old compatible path; real outages surface. */
export async function loadEndedTestPages<T>(
  due: (status: string, format: 'timestamp' | 'legacy-string') => Promise<T[]>,
  fallback: (status: string) => Promise<T[]>,
  onFallback: (error: unknown) => void,
): Promise<T[]> {
  const pages = await Promise.all(['published', 'ongoing'].map(async status => {
    try {
      const [modern, legacy] = await Promise.all([due(status, 'timestamp'), due(status, 'legacy-string')])
      return [...modern, ...legacy]
    } catch (error) {
      const code = (error as { code?: unknown })?.code
      if (code !== 9 && code !== 'failed-precondition' && code !== 'FAILED_PRECONDITION') throw error
      onFallback(error)
      return fallback(status)
    }
  }))
  return pages.flat()
}
