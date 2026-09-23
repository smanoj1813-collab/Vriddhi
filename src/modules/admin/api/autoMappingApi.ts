// ═══════════════════════════════════════════════════════════════════════════════
// api/autoMappingApi.ts — Auto curriculum ↔ faculty mapping (client wrapper)
//
// The algorithm lives server-side (functions/src/autoCurriculumMapping.ts) so
// the proposal is always computed from the full college roster + all active
// mappings — exactly what the HOD will approve. This module only types the
// round-trip and translates callable errors into admin-facing copy.
// ═══════════════════════════════════════════════════════════════════════════════

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

// ─── Shared request shape ────────────────────────────────────────────────────

export interface AutoMapRequest {
  curriculumId: string
  /** Batch this run covers, e.g. "2026". */
  batch: string
  division?: string
  section?: string
  /** Faculty weekly capacity in periods (default 24 — UGC regular). */
  capacity?: number
  /** Weeks per semester for the hours→weekly conversion (default 15). */
  semesterWeeks?: number
  /** Apply only: restrict writes to these course ids (empty = all proposed). */
  courseIds?: string[]
  /** Superadmin only: target college. Ignored for college accounts. */
  collegeId?: string
}

// ─── Response shape (mirrors functions AutoMapResult) ───────────────────────

export interface AutoMapProposalFaculty {
  uid: string
  profileId: string
  name: string
  email: string
}

export interface AutoMapProposal {
  courseId: string
  courseCode: string
  courseName: string
  credits: number
  totalHours: number
  hoursPerWeek: number
  faculty: AutoMapProposalFaculty | null
  score: number
  breakdown: { subject: number; branch: number; experience: number; balance: number }
  reasons: string[]
  flags: Array<'overload-risk' | 'no-subject-match'>
  status: 'proposed' | 'unassigned'
}

export interface AutoMapFacultyLoad {
  uid: string
  name: string
  currentWeeklyHours: number
  proposedWeeklyHours: number
  totalWeeklyHours: number
  capacity: number
}

export interface AutoMapResult {
  curriculumId: string
  branch: string
  batch: string
  division: string
  section: string
  capacity: number
  semesterWeeks: number
  generatedAt: string
  proposals: AutoMapProposal[]
  summary: {
    totalCourses: number
    proposed: number
    unassigned: number
    overloadFlags: number
    facultyInvolved: number
  }
  facultyLoad: AutoMapFacultyLoad[]
}

export interface ApplyAutoMappingResult {
  created: number
  createdCourseNames: string[]
  skipped: Array<{ courseId: string; courseName: string; reason: string }>
  result: AutoMapResult
}

function toError(err: unknown): Error {
  const code = (err as { code?: string })?.code || ''
  const message = err instanceof Error ? err.message : String(err)
  const clean = message.replace(/^FirebaseError:\s*/, '')
  if (code.includes('permission-denied')) return new Error('You do not have permission to run this')
  if (code.includes('unauthenticated')) return new Error('Sign in again to run this')
  return new Error(clean || 'Auto-mapping failed')
}

/** PREVIEW — computes the mapping plan. Writes nothing. */
export async function autoMapCurriculum(req: AutoMapRequest): Promise<AutoMapResult> {
  try {
    const fn = httpsCallable(functions, 'autoMapCurriculum')
    const res = await fn(req)
    return res.data as AutoMapResult
  } catch (err) {
    throw toError(err)
  }
}

/** APPLY — writes the approved subset as ordinary active mappings. */
export async function applyAutoMapping(req: AutoMapRequest): Promise<ApplyAutoMappingResult> {
  try {
    const fn = httpsCallable(functions, 'applyAutoMapping')
    const res = await fn(req)
    return res.data as ApplyAutoMappingResult
  } catch (err) {
    throw toError(err)
  }
}
