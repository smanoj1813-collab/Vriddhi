/** Canonical equality for plain Firestore payloads (including nested maps).
 * Object key order and omitted undefined values are not meaningful changes. */
export function canonicalFirestoreValue(value: unknown): string {
  const normalize = (item: unknown): unknown => {
    if (item === undefined) return undefined
    if (item === null || typeof item !== 'object') return item
    if (item instanceof Date) return { __date: item.toISOString() }
    if ('toMillis' in item && typeof item.toMillis === 'function') {
      const stamp = item as { seconds?: number; nanoseconds?: number; toMillis(): number }
      return { __timestamp: stamp.seconds ?? stamp.toMillis(), nanos: stamp.nanoseconds ?? 0 }
    }
    if (Array.isArray(item)) return item.map(normalize)
    return Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, normalize(value)]))
  }
  return JSON.stringify(normalize(value))
}

export function sameFirestoreValue(left: unknown, right: unknown): boolean {
  return canonicalFirestoreValue(left) === canonicalFirestoreValue(right)
}
