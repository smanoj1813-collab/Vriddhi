// src/modules/superadmin/api/accessProductsApi.ts
// ─── Platform-access products: catalogue CRUD + assignment + MIS ─────────────
//
// The catalogue itself is a small superadmin-owned collection
// (`accessProducts`) written straight from the client, like the rest of the
// superadmin master data (colleges, subscription plans). Anything that touches
// STUDENT records goes through a callable instead, because those writes have to
// be atomic with `users/{uid}` and are college-scoped:
//
//   bulkUpdateStudentAccess   assign / reassign / clear a window
//   getAccessMis              server-side aggregation for the MIS tab
//
// Pure date maths lives in src/shared/utils/accessWindow.ts (mirrored on the
// server in functions/src/accessProducts.ts), so the "valid till" preview in
// the dialog is the same arithmetic the server will stamp.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/Firebase/config'
import {
  SuperAdminApiError,
  type AccessMisResponse,
  type AccessProduct,
  type AccessProductInput,
  type BulkAccessUpdateInput,
  type BulkAccessUpdateResult,
} from '../types/superAdmin'

const PRODUCTS = 'accessProducts'

function docToProduct(id: string, data: Record<string, unknown>): AccessProduct {
  const iso = (value: unknown): string | undefined => {
    if (!value) return undefined
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString()
    return typeof value === 'string' ? value : undefined
  }
  return {
    id,
    name: String(data.name ?? '').trim(),
    code: String(data.code ?? '').trim(),
    durationMonths: Math.trunc(Number(data.durationMonths)) || 0,
    price: Number(data.price) || 0,
    currency: String(data.currency ?? 'INR'),
    description: String(data.description ?? ''),
    active: data.active !== false,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  }
}

/** A short table-friendly code derived from the name and duration. */
export function deriveProductCode(name: string, durationMonths: number): string {
  const slug = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24)
  const duration = Number.isFinite(durationMonths) && durationMonths > 0 ? `-${Math.trunc(durationMonths)}M` : ''
  return `${slug || 'ACCESS'}${duration}`
}

export async function listAccessProducts(): Promise<AccessProduct[]> {
  try {
    const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('durationMonths', 'asc')))
    return snap.docs.map((d) => docToProduct(d.id, d.data() as Record<string, unknown>))
  } catch (error) {
    // A missing orderBy index must not make the whole page look empty.
    console.warn('[accessProducts] ordered read failed, falling back to unordered:', error)
    const snap = await getDocs(collection(db, PRODUCTS))
    return snap.docs.map((d) => docToProduct(d.id, d.data() as Record<string, unknown>))
  }
}

export function validateAccessProductInput(input: AccessProductInput): string | null {
  if (!String(input.name || '').trim()) return 'Give the product a name (e.g. "1-Year Platform Access").'
  const months = Number(input.durationMonths)
  if (!Number.isInteger(months) || months < 1 || months > 120) {
    return 'Duration must be a whole number of months between 1 and 120.'
  }
  const price = Number(input.price)
  if (!Number.isFinite(price) || price < 0) return 'Price must be zero or a positive amount.'
  if (price > 10_000_000) return 'Price looks too large — enter the amount in rupees per student.'
  return null
}

export async function createAccessProduct(input: AccessProductInput): Promise<string> {
  const problem = validateAccessProductInput(input)
  if (problem) throw new SuperAdminApiError(problem)
  const months = Math.trunc(Number(input.durationMonths))
  const ref = await addDoc(collection(db, PRODUCTS), {
    name: String(input.name).trim(),
    code: String(input.code || '').trim() || deriveProductCode(input.name, months),
    durationMonths: months,
    price: Number(input.price) || 0,
    currency: String(input.currency || 'INR'),
    description: String(input.description || '').trim(),
    active: input.active !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateAccessProduct(productId: string, input: Partial<AccessProductInput>): Promise<void> {
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (input.name !== undefined) updates.name = String(input.name).trim()
  if (input.code !== undefined) updates.code = String(input.code).trim()
  if (input.durationMonths !== undefined) updates.durationMonths = Math.trunc(Number(input.durationMonths)) || 0
  if (input.price !== undefined) updates.price = Number(input.price) || 0
  if (input.currency !== undefined) updates.currency = String(input.currency || 'INR')
  if (input.description !== undefined) updates.description = String(input.description).trim()
  if (input.active !== undefined) updates.active = input.active
  await updateDoc(doc(db, PRODUCTS, productId), updates)
}

/**
 * Products already sold are ARCHIVED, never deleted: a student's window is a
 * denormalised copy, but the catalogue row is what the MIS names the product
 * by. (Deleting is offered only for a product nobody is on — see the page.)
 */
export async function archiveAccessProduct(productId: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, PRODUCTS, productId), { active, updatedAt: serverTimestamp() })
}

export async function deleteAccessProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, PRODUCTS, productId))
}

// ─── Assignment (callable: touches students + users, superadmin-only) ───────

export async function bulkUpdateStudentAccess(
  input: BulkAccessUpdateInput,
): Promise<BulkAccessUpdateResult> {
  const fn = httpsCallable<BulkAccessUpdateInput, BulkAccessUpdateResult>(functions, 'bulkUpdateStudentAccess')
  try {
    const result = await fn(input)
    return result.data
  } catch (error: any) {
    throw new SuperAdminApiError(
      error?.message || 'Students could not be updated. Check that Cloud Functions are deployed.',
    )
  }
}

// ─── MIS (server-side aggregation) ──────────────────────────────────────────

export async function getAccessMis(collegeId?: string): Promise<AccessMisResponse> {
  const fn = httpsCallable<{ collegeId?: string }, AccessMisResponse>(functions, 'getAccessMis')
  try {
    const result = await fn(collegeId ? { collegeId } : {})
    return result.data
  } catch (error: any) {
    throw new SuperAdminApiError(
      error?.message || 'Could not load the access MIS. Check that Cloud Functions are deployed.',
    )
  }
}
