export const STATS_HEARTBEAT_MS = 30 * 60_000

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, canonical(value)]))
}

/** Do not turn an unchanged snapshot into a stale snapshot that makes every
 * client fall back to expensive live counts. Heartbeat well inside the current
 * one-hour client freshness window, without changing the 15-minute job. */
export function shouldWritePlatformStats(previous: Record<string, unknown> | undefined, next: Record<string, unknown>, now = Date.now()): boolean {
  if (!previous) return true
  const last = Date.parse(String(previous.updatedAt || ''))
  if (!Number.isFinite(last) || last > now || now - last >= STATS_HEARTBEAT_MS) return true
  const content = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'updatedAt'))
  return JSON.stringify(canonical(content(previous))) !== JSON.stringify(canonical(content(next)))
}
