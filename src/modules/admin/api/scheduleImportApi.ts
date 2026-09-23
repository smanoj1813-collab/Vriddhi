// ═══════════════════════════════════════════════════════════════════════════════
// api/scheduleImportApi.ts — Bulk schedule import (client wrapper)
//
// The whole decision (validation, de-duplication, clash detection, curriculum
// cross-reference) happens server-side in functions/src/scheduleImport.ts —
// the same pure clash maths that generateClassSessions enforces. The dialog
// is a two-step flow: preview (dryRun) → apply (dryRun: false).
// ═══════════════════════════════════════════════════════════════════════════════

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

export type ImportRowStatus = 'valid' | 'clash' | 'duplicate' | 'invalid'

export interface ImportRowReport {
  line: number
  subject: string
  facultyId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  status: ImportRowStatus
  reasons: string[]
  warnings: string[]
}

export interface ImportPlan {
  rows: ImportRowReport[]
  writeable: unknown[]
  totals: { total: number; valid: number; clash: number; duplicate: number; invalid: number }
}

export interface ScheduleImportRequest {
  /** Raw CSV text (header row + data rows). */
  csv: string
  /** dryRun: true (default) → preview only. false → write the valid rows.
   *  The preview/apply helpers set this themselves. */
  dryRun?: boolean
  /** Superadmin only. */
  collegeId?: string
}

export interface ScheduleImportResult {
  dryRun: boolean
  plan: ImportPlan
  created?: number
  createdRows?: Array<{ line: number; subject: string; facultyId: string }>
}

function toError(err: unknown): Error {
  const code = (err as { code?: string })?.code || ''
  const message = err instanceof Error ? err.message : String(err)
  const clean = message.replace(/^FirebaseError:\s*/, '')
  if (code.includes('permission-denied')) return new Error('You do not have permission to import schedules')
  if (code.includes('unauthenticated')) return new Error('Sign in again to import schedules')
  return new Error(clean || 'Schedule import failed')
}

async function call(req: ScheduleImportRequest): Promise<ScheduleImportResult> {
  const fn = httpsCallable(functions, 'bulkImportWeeklySchedules')
  const res = await fn(req)
  return res.data as ScheduleImportResult
}

/** PREVIEW — validate + clash-check every row, write nothing. */
export async function previewScheduleImport(req: ScheduleImportRequest): Promise<ScheduleImportResult> {
  try {
    return await call({ ...req, dryRun: true })
  } catch (err) {
    throw toError(err)
  }
}

/** APPLY — re-checks on fresh data and writes only the valid rows. */
export async function applyScheduleImport(req: ScheduleImportRequest): Promise<ScheduleImportResult> {
  try {
    return await call({ ...req, dryRun: false })
  } catch (err) {
    throw toError(err)
  }
}
