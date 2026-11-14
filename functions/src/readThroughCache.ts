/** Small, process-local read coalescer. It never writes Firestore, never serves
 * expired values on failure, and is an optimization only (cold starts load the
 * original authoritative query). Keep keys tenant-scoped. */
export function createReadThroughCache<T>(ttlMs: number, maxEntries: number, now = Date.now) {
  const entries = new Map<string, { promise: Promise<T>; expires: number; pending: boolean }>()
  return {
    get(key: string, load: () => Promise<T>, fresh = false): Promise<T> {
      const existing = entries.get(key)
      if (existing && (existing.pending || (!fresh && existing.expires > now()))) return existing.promise
      const entry = { promise: null as unknown as Promise<T>, expires: 0, pending: true }
      entry.promise = Promise.resolve().then(load).then(value => {
        entry.pending = false
        entry.expires = now() + ttlMs
        return value
      }, error => {
        if (entries.get(key) === entry) entries.delete(key)
        throw error
      })
      entries.delete(key)
      entries.set(key, entry)
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value!)
      return entry.promise
    },
    clear() { entries.clear() },
  }
}
