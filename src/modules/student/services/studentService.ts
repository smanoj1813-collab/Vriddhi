import type { Assignment, AssignmentSubmission, SubmissionFile } from '../types/student';

export interface GetAssignmentsOptions {
  studentId: string;
  status?: string;
  subject?: string;
}

export const getStudentAssignments = async (options: GetAssignmentsOptions): Promise<Assignment[]> => {
  // TODO: Implement Firestore fetch
  console.log('Fetching assignments for', options.studentId);
  return [];
};

export const getAssignmentSubmission = async (assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> => {
  // TODO: Implement Firestore fetch
  console.log('Fetching submission for', assignmentId, studentId);
  return null;
};

export interface SubmitAssignmentData {
  assignmentId: string;
  studentId: string;
  files: SubmissionFile[];
  comments?: string;
}

export const submitAssignment = async (data: SubmitAssignmentData): Promise<AssignmentSubmission> => {
  // TODO: Implement Firestore write + Cloud Storage upload
  console.log('Submitting assignment', data);
  return {
    id: crypto.randomUUID(),
    assignmentId: data.assignmentId,
    studentId: data.studentId,
    submittedAt: new Date().toISOString(),
    files: data.files,
    comments: data.comments,
    status: 'submitted',
  };
};
