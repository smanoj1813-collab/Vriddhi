// src/modules/office/api/officeDb.ts
// Shared helpers for the college office modules (library, inventory,
// procurement, accounts). Every collection lives under colleges/{collegeId}/
// so the PATH is the tenant boundary the security rules check.

import { collection, doc, runTransaction, type DocumentData } from 'firebase/firestore'
import { auth, db } from '@/Firebase/config'
import { stripUndefined } from '@/shared/utils/firestoreClean'

export function officeCollegeId(explicit?: string | null): string {
  const id = (explicit && explicit.trim()) || localStorage.getItem('vriddhi_college_id') || ''
  if (!id) throw new Error('No college selected. Sign out and back in.')
  return id
}

export const officeCol = (name: string, cid?: string | null) => collection(db, 'colleges', officeCollegeId(cid), name)
export const officeDoc = (name: string, id: string, cid?: string | null) => doc(db, 'colleges', officeCollegeId(cid), name, id)

export const nowIso = () => new Date().toISOString()
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Who is acting — stamped on every ledger row for audit. */
export function actor(): { uid: string; name: string } {
  const u = auth.currentUser
  return { uid: u?.uid || 'unknown', name: u?.displayName || u?.email || 'Staff' }
}

export function clean<T extends Record<string, unknown>>(data: T): DocumentData {
  return stripUndefined(data) as DocumentData
}

export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}
export const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : v == null ? fallback : String(v))

/**
 * Reserve the next value of a per-college counter atomically
 * (colleges/{cid}/counters/{key}). Used for accession numbers and
 * PR / PO / GRN / bill numbers so two desks never issue the same number.
 */
export async function nextCounter(key: string, count = 1): Promise<number> {
  const ref = officeDoc('counters', key)
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? num(snap.data().value) : 0
    tx.set(ref, { value: current + count, updatedAt: nowIso() }, { merge: true })
    return current + 1
  })
}

/** Financial-year label for Indian colleges (April–March), e.g. "2026-27". */
export function financialYear(date = new Date()): string {
  const y = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

/** PREFIX/2026-27/0007 */
export function formatDocNo(prefix: string, seq: number, date = new Date()): string {
  return `${(prefix || 'DOC').trim().toUpperCase()}/${financialYear(date)}/${String(seq).padStart(4, '0')}`
}
