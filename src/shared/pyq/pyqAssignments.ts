// Firestore / callable I/O for platform-assigned previous-year papers.
// colleges/{collegeId}/config/pyqPapers is written by the superadmin only
// (Firestore rules) and read by that college's staff.

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/Firebase/config';
import { stripUndefined } from '@/shared/utils/firestoreClean';
import {
  PYQ_ASSIGNMENT_CONFIG_DOC,
  applyPyqAssignmentChanges,
  normalizePyqAssignments,
  type PyqAssignmentSettings,
} from './pyqAssignmentModel';

export async function loadPyqAssignments(collegeId: string): Promise<PyqAssignmentSettings> {
  const snapshot = await getDoc(doc(db, 'colleges', collegeId, 'config', PYQ_ASSIGNMENT_CONFIG_DOC));
  return snapshot.exists() ? normalizePyqAssignments(snapshot.data()) : { assignments: {} };
}

export async function savePyqAssignments(
  collegeId: string,
  previous: PyqAssignmentSettings,
  enabledIds: Iterable<string>,
): Promise<PyqAssignmentSettings> {
  const next = applyPyqAssignmentChanges(previous, enabledIds, auth.currentUser?.uid || '', new Date().toISOString());
  await setDoc(doc(db, 'colleges', collegeId, 'config', PYQ_ASSIGNMENT_CONFIG_DOC), stripUndefined(next));
  return next;
}

export interface CreatePyqAssessmentInput {
  prepPaperId: string;
  selectedKeys: string[];
  title?: string;
  durationMinutes?: number;
  /** Only honoured for a superadmin caller (college staff are pinned to their own college). */
  collegeId?: string;
}

export interface CreatePyqAssessmentResult {
  id: string;
  title: string;
  totalQuestions: number;
  totalMarks: number;
  duration: number;
}

export async function createPyqAssessmentPaper(input: CreatePyqAssessmentInput): Promise<CreatePyqAssessmentResult> {
  const call = httpsCallable<CreatePyqAssessmentInput, CreatePyqAssessmentResult>(functions, 'createPyqAssessmentPaper');
  const result = await call(input);
  return result.data;
}
