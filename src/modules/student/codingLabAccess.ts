import { normalizeProgramName } from '@/shared/utils/cohortMatching'

export interface StudentProgramIdentity {
  course?: unknown
  branch?: unknown
  department?: unknown
}

const BCA_PROGRAM_NAMES = new Set([
  'bca',
  'bachelor of computer applications',
  'bachelor of computer application',
])

/** True only when a student's linked programme is BCA (not simply any computer-science course). */
export function isBcaStudent(identity: StudentProgramIdentity | null | undefined): boolean {
  if (!identity) return false
  return [identity.course, identity.branch, identity.department].some((value) => {
    const normalized = normalizeProgramName(value)
    return BCA_PROGRAM_NAMES.has(normalized) || /(^| )bca( |$)/.test(normalized)
  })
}

/** The college assignment and the student's BCA profile are both required. */
export function canStudentUseCodingLab(
  identity: StudentProgramIdentity | null | undefined,
  collegeAssigned: unknown,
): boolean {
  return isBcaStudent(identity) && collegeAssigned === true
}
