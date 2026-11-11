import { useEffect, useState } from 'react'
import type { CourseAssignment } from './courseCloud'

// Loaded inside the effect: this hook is reached from modules/courses/routes.tsx,
// which the entry imports statically, so a top-level import of either module put
// the Firestore SDK on the login screen's preload. Both are used exclusively
// inside the async block below, which already runs after mount.
const loadCourseData = () =>
  Promise.all([import('./courseCloud'), import('@/modules/student/services/studentRecordResolver')])

export interface UseCourseAssignmentsResult {
  loading: boolean
  error: string | null
  assignedCourseIds: string[]
  assignments: Record<string, CourseAssignment>
}

/** Student catalog visibility. Missing assignment documents fail closed. */
export function useCourseAssignments(
  uid: string | undefined,
  collegeId: string | undefined,
  email?: string | null,
): UseCourseAssignmentsResult {
  const [state, setState] = useState<UseCourseAssignmentsResult>({
    loading: true,
    error: null,
    assignedCourseIds: [],
    assignments: {},
  })

  useEffect(() => {
    let cancelled = false
    if (!uid || !collegeId) {
      setState({ loading: false, error: null, assignedCourseIds: [], assignments: {} })
      return () => { cancelled = true }
    }

    setState((previous) => ({ ...previous, loading: true, error: null }))
    void (async () => {
      try {
        const [{ loadCourseAssignments, isCourseAssignedToStudent }, { resolveStudentRecord }] =
          await loadCourseData()
        const settings = await loadCourseAssignments(collegeId)
        const needsProgram = Object.values(settings.assignments).some(
          (assignment) => assignment.enabled && !!assignment.cohort?.programs?.length,
        )
        let student: Record<string, unknown> | null = null
        if (needsProgram) {
          const resolved = await resolveStudentRecord(uid, email || undefined)
          student = resolved.record?.data || null
          if (!student && resolved.permissionDenied) {
            throw new Error('We could not verify your programme against the course assignment. Please try again or contact your college administrator.')
          }
        }
        const assignedCourseIds = Object.entries(settings.assignments)
          .filter(([courseId]) => isCourseAssignedToStudent(settings, courseId, student))
          .map(([courseId]) => courseId)
        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            assignedCourseIds,
            assignments: settings.assignments,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : 'Could not load course assignments.',
            assignedCourseIds: [],
            assignments: {},
          })
        }
      }
    })()

    return () => { cancelled = true }
  }, [uid, collegeId, email])

  return state
}
