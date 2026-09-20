// src/shared/api/academicContextApi.ts
// ------------------------------------------------------------------
// Firebase callable client for the Phase 1 deterministic academic context.
//
// All three callables are deployed in asia-south1 and reached through the
// single shared `functions` instance from @/Firebase/config — no duplicated
// Firebase initialisation, no direct REST calls, no listeners. Each function
// returns the callable's discriminated union verbatim, so a feature-gated
// `{ enabled: false }` backend response is a normal (non-throwing) result the
// hooks and UI can branch on.
// ------------------------------------------------------------------

import { httpsCallable } from 'firebase/functions'
import { functions } from '@/Firebase/config'
import {
  normaliseDateKey,
  normaliseFacultyAcademicContextResponse,
  normalisePaperAcademicContextResponse,
  normaliseStudentAcademicContextResponse,
  todayDateKey,
  describeAcademicContextError,
  type FacultyAcademicContextParams,
  type FacultyAcademicContextResponse,
  type PaperAcademicContextParams,
  type PaperAcademicContextResponse,
  type StudentAcademicContextParams,
  type StudentAcademicContextResponse,
} from './academicContext'

/** The student's own cohort-scoped context: classes, pending work, tests, curriculum, attendance. */
export async function fetchMyStudentAcademicContext(
  params: StudentAcademicContextParams = {}
): Promise<StudentAcademicContextResponse> {
  const call = httpsCallable<StudentAcademicContextParams, StudentAcademicContextResponse>(
    functions,
    'getMyStudentAcademicContext'
  )
  const payload: StudentAcademicContextParams = {
    // The backend filters "today" by this local calendar date; sending it
    // keeps late-evening/early-morning IST requests on the student's day
    // rather than the server's UTC date.
    date: normaliseDateKey(params.date) ?? todayDateKey(),
  }
  try {
    const response = await call(payload)
    return normaliseStudentAcademicContextResponse(response.data)
  } catch (error) {
    throw new Error(describeAcademicContextError(error, 'Your academic summary could not be loaded.', 'student'))
  }
}

/** College-scoped planning context for faculty/HOD/principal/admin/superadmin, with an optional course filter. */
export async function fetchFacultyAcademicContext(
  params: FacultyAcademicContextParams = {}
): Promise<FacultyAcademicContextResponse> {
  const call = httpsCallable<FacultyAcademicContextParams, FacultyAcademicContextResponse>(
    functions,
    'getFacultyAcademicContext'
  )
  const payload: FacultyAcademicContextParams = {
    date: normaliseDateKey(params.date) ?? todayDateKey(),
    ...(params.courseId ? { courseId: String(params.courseId) } : {}),
  }
  try {
    const response = await call(payload)
    return normaliseFacultyAcademicContextResponse(response.data)
  } catch (error) {
    throw new Error(describeAcademicContextError(error, 'The faculty academic context could not be loaded.', 'faculty'))
  }
}

/** Approved-question candidates + blueprint/distribution context for paper authoring. Metadata only. */
export async function fetchPaperAcademicContext(
  params: PaperAcademicContextParams = {}
): Promise<PaperAcademicContextResponse> {
  const call = httpsCallable<PaperAcademicContextParams, PaperAcademicContextResponse>(
    functions,
    'getPaperAcademicContext'
  )
  const payload: PaperAcademicContextParams = {
    ...(params.courseId ? { courseId: String(params.courseId) } : {}),
    ...(params.blueprint ? { blueprint: params.blueprint } : {}),
  }
  try {
    const response = await call(payload)
    return normalisePaperAcademicContextResponse(response.data)
  } catch (error) {
    throw new Error(describeAcademicContextError(error, 'The paper context could not be loaded.', 'paper'))
  }
}
