// src/modules/admin/api/assignmentAnalyticsApi.ts
// ─── Client wrapper for the assignment completion report ────────────────────
//
// The heavy lifting (cohort matching, resubmission dedupe, grouping, overdue
// detection) is server-side in functions/src/assignmentAnalytics.ts so the
// percentages always match what students see. This module only types the
// response and translates callable errors into admin-facing copy.

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'

export interface AssignmentCompletionRow {
  assignmentId: string
  title: string
  status: string
  subject: string
  subjectCode: string
  courseName: string
  moduleId: string
  moduleTitle: string
  batch: string
  division: string
  deadline: string | null
  deadlinePassed: boolean
  overdue: boolean
  overdueDays: number
  expected: number
  submitted: number
  late: number
  graded: number
  missing: number
  completionPct: number
}

export interface GroupCompletion {
  key: string
  label: string
  assignments: number
  expected: number
  submitted: number
  late: number
  graded: number
  missing: number
  pct: number
}

export interface AssignmentAnalyticsResult {
  collegeId: string
  scope: 'own' | 'college'
  generatedAt: string
  rosterSize: number
  overall: {
    assignments: number
    expected: number
    submitted: number
    late: number
    graded: number
    missing: number
    pct: number
    overdue: number
    ungraded: number
  }
  groups: {
    byCourse: GroupCompletion[]
    byModule: GroupCompletion[]
    byBatch: GroupCompletion[]
    byDivision: GroupCompletion[]
  }
  overdueAlerts: AssignmentCompletionRow[]
  rows: AssignmentCompletionRow[]
}

const MESSAGES: Record<string, string> = {
  'functions/unauthenticated': 'Your session has expired. Sign out and back in, then try again.',
  'functions/permission-denied': 'Academic staff access (admin, principal, HOD or faculty) is required.',
  'functions/failed-precondition': 'This account is not linked to a valid student/college identity.',
}

function toMessage(error: unknown, fallback: string): string {
  const code = String((error as { code?: string } | null)?.code || '')
  return MESSAGES[code] || (error instanceof Error ? error.message : fallback)
}

/**
 * Completion report for the caller's scope: faculty see their own
 * assignments, admin/principal/HOD/superadmin see the whole college.
 */
export async function getAssignmentAnalytics(): Promise<AssignmentAnalyticsResult> {
  const call = httpsCallable<Record<string, never>, AssignmentAnalyticsResult>(
    functions,
    'getAssignmentAnalytics'
  )
  try {
    const response = await call({})
    return response.data
  } catch (error) {
    throw new Error(toMessage(error, 'The assignment report could not be loaded.'))
  }
}
