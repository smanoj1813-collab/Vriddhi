import {
  extractStudentCohortFields,
  matchStudentToCohort,
  type CohortCriteria,
} from '@/shared/utils/cohortMatching';

export interface StudentScheduleCohort {
  collegeId: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
}

/** Match one weekly-schedule record against the canonical student/cohort rules. */
export function scheduleMatchesStudentDocument(
  schedule: Record<string, unknown>,
  student: Record<string, unknown>,
  profile: StudentScheduleCohort,
): boolean {
  const criteria: CohortCriteria = {
    collegeId: String(schedule.collegeId ?? profile.collegeId),
    branch: String(schedule.branch ?? ''),
    batch: String(schedule.batch ?? ''),
    semester: Number(schedule.semester ?? 0) || 0,
    division: String(schedule.division ?? ''),
    section: String(schedule.section ?? ''),
    subject: String(schedule.subject ?? schedule.courseName ?? ''),
    ...(schedule.subjectCode ? { subjectCode: String(schedule.subjectCode) } : {}),
  };
  const fields = extractStudentCohortFields(student);
  // Schedule records without a subject label should still be cohort-visible;
  // do not accidentally reject students who do have an elective list.
  if (!criteria.subject && !criteria.subjectCode) fields.subjects = [];
  return matchStudentToCohort(fields, criteria).match;
}
