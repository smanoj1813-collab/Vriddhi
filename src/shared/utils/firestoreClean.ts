// src/shared/utils/firestoreClean.ts
//
// The Firestore web SDK rejects `undefined` field values ("Unsupported field
// value: undefined") unless ignoreUndefinedProperties is enabled, which this
// app does not do globally. Settings forms naturally produce undefined for
// blank optional inputs (e.g. "Max fine"), so every finance write runs its
// payload through this first. Only plain objects/arrays are walked — Firestore
// sentinels (serverTimestamp, Timestamp, …) pass through untouched.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter(v => v !== undefined).map(v => stripUndefined(v)) as unknown as T
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue
      out[k] = stripUndefined(v)
    }
    return out as T
  }
  return value
}
