import type { AcademicContext, UniversitySchemePack } from './schemePack'
import {
  calculateProfileInternalMarks,
  evaluateCourseResult,
  resolveSchemeCourse,
  type CourseMarksInput,
} from './schemeEngine'
import { SchemeConfigurationError } from './schemeValidation'

export function studentAcademicContext(student: Record<string, unknown>, semester: number): AcademicContext {
  return {
    programme: String(
      student.course || student.programme || student.program || student.department || student.branch || '',
    ).trim(),
    batch: String(student.batch || student.academicYear || '').trim(),
    semester,
  }
}
/** The server resolves student/cohort scope and the approved syllabus mapping.
 *  Client-supplied credits, labels, totals and letter grades cannot override it. */
export function deriveOfficialGrade(
  input: CourseMarksInput & { code: string; semester: number },
  pack: UniversitySchemePack,
  context: AcademicContext,
) {
  if (!Number.isInteger(input.semester) || input.semester < 1 || input.semester > 20)
    throw new SchemeConfigurationError('A valid semester is required')
  const { course, profile } = resolveSchemeCourse(pack, input.code, { ...context, semester: input.semester })
  const componentResult =
    input.internalComponents === undefined
      ? undefined
      : calculateProfileInternalMarks(input.internalComponents, profile, pack, input.attendancePercentage)
  if (
    componentResult &&
    input.internal !== undefined &&
    Math.abs(input.internal - componentResult.totalIA) > 0.01
  )
    throw new SchemeConfigurationError('Aggregate IA marks do not match the component evidence')
  const result = evaluateCourseResult(
    { ...input, ...(componentResult ? { internal: componentResult.totalIA } : {}) },
    pack,
    course,
    profile,
  )
  return {
    ...result,
    ...(componentResult
      ? {
          assessmentEvidence: {
            internalComponents: input.internalComponents!,
            ...(input.attendancePercentage === undefined
              ? {}
              : { attendancePercentage: input.attendancePercentage }),
            ...componentResult,
          },
        }
      : {}),
    semester: input.semester,
    code: course.code,
    subject: course.name,
    subjectCode: course.code,
    subjectName: course.name,
    programme: context.programme || '',
    batch: context.batch || '',
    schemePackId: pack.id,
    schemePackRevision: pack.revision ?? 1,
    scheme: pack.schemeName,
    schemePolicySnapshot: { course, profile, gradeTable: profile.gradeTable ?? pack.gradeTable, ...((profile.gradePointPolicy ?? pack.gradePointPolicy) ? { gradePointPolicy: profile.gradePointPolicy ?? pack.gradePointPolicy } : {}) },
  }
}
export function assertDraftPolicyCurrent(row: Record<string, unknown>, pack: UniversitySchemePack): void {
  if (
    row.schemePackId !== pack.id ||
    row.schemePackRevision !== (pack.revision ?? 1) ||
    !row.schemePolicySnapshot
  ) {
    throw new SchemeConfigurationError(
      'Draft policy is missing or has changed. Re-save the draft against the active scheme before publishing.',
    )
  }
}
