// src/modules/admin/api/accessApi.ts
// Per-college access choices (colleges/{id}/config/access). Principal-only
// write in the security rules; the rules read the same doc to decide whether
// the accounts team may touch payroll collections.

import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import type { UserRole } from '@/modules/auth/context/auth'
import { DEFAULT_ACCESS_SETTINGS, PAYROLL_GRANTABLE_ROLES, type AccessSettings } from '@/modules/auth/permissions'

function ref(collegeId: string) {
  return doc(db, 'colleges', collegeId, 'config', 'access')
}

export function normalizeAccessSettings(raw: Record<string, unknown> | undefined | null): AccessSettings {
  const roles = Array.isArray(raw?.payrollRoles) ? (raw!.payrollRoles as unknown[]) : []
  return {
    payrollRoles: roles
      .map(r => String(r).trim().toLowerCase())
      .filter((r): r is UserRole => (PAYROLL_GRANTABLE_ROLES as readonly string[]).includes(r)),
  }
}

export async function fetchAccessSettings(collegeId: string): Promise<AccessSettings> {
  if (!collegeId) return DEFAULT_ACCESS_SETTINGS
  const snap = await getDoc(ref(collegeId))
  return normalizeAccessSettings(snap.exists() ? (snap.data() as Record<string, unknown>) : null)
}

export async function saveAccessSettings(collegeId: string, settings: AccessSettings, by: string): Promise<void> {
  const clean = normalizeAccessSettings(settings as unknown as Record<string, unknown>)
  await setDoc(ref(collegeId), { ...clean, updatedAt: new Date().toISOString(), updatedBy: by })
}
