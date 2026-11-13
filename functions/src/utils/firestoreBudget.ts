import { DocumentReference, FieldValue, GeoPoint, Timestamp } from 'firebase-admin/firestore'
import { HttpsError } from 'firebase-functions/v2/https'

// Firestore's document limit is 1 MiB, not JSON length. Keep headroom for the
// document name/metadata and count UTF-8, fixed-width numbers, nested maps and
// arrays. This is deliberately a conservative upper bound, not a wire serializer.
export const ACADEMIC_DOCUMENT_BUDGET_BYTES = 900_000
const textBytes = (s: string) => Buffer.byteLength(s, 'utf8') + 1
export function documentBytesUpperBound(value: unknown, depth = 0): number {
  if (depth > 20) return Infinity
  if (value === null || typeof value === 'boolean') return 1
  if (value === undefined) return 0
  if (typeof value === 'string') return textBytes(value)
  if (typeof value === 'number') return 8
  if (value instanceof Date || value instanceof Timestamp) return 8
  if (value instanceof GeoPoint) return 16
  if (value instanceof Uint8Array) return value.byteLength + 32
  if (value instanceof DocumentReference) return textBytes(value.path) + 2048
  // Academic writes use serverTimestamp only. Other transforms must not be
  // mistaken for small values (e.g. a large arrayUnion).
  if (value instanceof FieldValue) return value.isEqual(FieldValue.serverTimestamp()) ? 64 : Infinity
  if (Array.isArray(value)) return 32 + value.reduce((n, v) => n + 8 + documentBytesUpperBound(v, depth + 1), 0)
  if (typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)) {
    return 32 + Object.entries(value).reduce((n, [k, v]) => n + textBytes(k) + documentBytesUpperBound(v, depth + 1), 0)
  }
  return Infinity // Never under-count an unknown SDK/custom type.
}
export function assertAcademicDocumentBudget(value: Record<string, unknown>, label = 'College scheme configuration') {
  if (documentBytesUpperBound(value) + 4096 > ACADEMIC_DOCUMENT_BUDGET_BYTES) {
    throw new HttpsError('invalid-argument', `${label} is too large for safe document storage. The budget includes all assigned snapshots, the legacy primary mirror and existing metadata. Split course catalogues or reduce stored metadata before saving.`)
  }
}
