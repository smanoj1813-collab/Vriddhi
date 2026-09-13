// src/modules/admin/api/admissionApi.ts
// ------------------------------------------------------------------
// Admission Center client. Every call is a Cloud Function: the stage machine,
// the merit maths and the tenant scoping all live server-side, so the browser
// never decides whether a transition is legal or how an applicant ranks.
// ------------------------------------------------------------------
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';

export const ADMISSION_STAGES = ['enquiry', 'application', 'screening', 'offer', 'fee', 'enrolled'] as const;
export const ADMISSION_OUTCOMES = ['rejected', 'withdrawn'] as const;
export type AdmissionStage = (typeof ADMISSION_STAGES)[number];
export type AdmissionOutcome = (typeof ADMISSION_OUTCOMES)[number];
export type AdmissionStatus = AdmissionStage | AdmissionOutcome;

export interface MeritWeights {
  qualifying: number;
  entrance: number;
  interview: number;
}

export interface MeritComponent {
  key: string;
  label: string;
  normalized: number;
  /** Share of the score after re-normalising across recorded components. */
  weight: number;
}

export interface MeritResult {
  score: number | null;
  components: MeritComponent[];
  missing: string[];
}

export interface AdmissionNote {
  at: string | null;
  by: string;
  text: string;
}

/** A stage move. Distinct from a note: it carries the stage, not free text. */
export interface StageHistoryEntry {
  stage: string;
  at: string | null;
  by: string;
}

export interface AdmissionApplication {
  id: string;
  applicationNo: string;
  status: AdmissionStatus;
  applicantName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  guardianName: string;
  guardianPhone: string;
  city: string;
  program: string;
  department: string;
  batch: string;
  division: string;
  regNo: string;
  mentorId: string;
  previousSchool: string;
  previousQualification: string;
  yearOfPassing: string;
  source: string;
  assignedTo: string;
  assignedToName: string;
  entranceExamType: string;
  entranceRegistrationNo: string;
  interviewNotes: string;
  merit: MeritResult;
  meritWeights: MeritWeights;
  feeAmount: number;
  feePaid: number;
  offerIssuedAt: string | null;
  enrolledStudentId: string;
  notes: AdmissionNote[];
  stageHistory: StageHistoryEntry[];
  createdAt: string | null;
  updatedAt: string | null;
  createdByName: string;
}

export interface AdmissionFunnelTotals {
  total: number;
  inPipeline: number;
  reachedOffer: number;
  enrolled: number;
  conversionRate: number;
}

export interface AdmissionExportResult {
  csv: string;
  rowCount: number;
  blocked: string[];
  exportedIds: string[];
  columns: string[];
}

/** Payload for create and update; `applicationId` present means update. */
export interface AdmissionApplicationInput {
  applicationId?: string;
  collegeId?: string;
  applicantName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  guardianName?: string;
  guardianPhone?: string;
  city?: string;
  program?: string;
  department?: string;
  batch?: string;
  division?: string;
  regNo?: string;
  mentorId?: string;
  previousSchool?: string;
  previousQualification?: string;
  yearOfPassing?: string;
  source?: string;
  assignedTo?: string;
  assignedToName?: string;
  entranceExamType?: string;
  entranceRegistrationNo?: string;
  interviewNotes?: string;
  qualifyingPercentage?: number | null;
  entranceScore?: number | null;
  entranceMaxScore?: number | null;
  interviewRating?: number | null;
  feeAmount?: number | null;
  feePaid?: number | null;
  note?: string;
}

export function describeError(err: unknown): string {
  const message = (err as { message?: unknown })?.message;
  return typeof message === 'string' && message.length > 0
    ? message
    : 'Something went wrong. Please try again.';
}

export async function saveApplication(
  input: AdmissionApplicationInput
): Promise<AdmissionApplication> {
  const call = httpsCallable<AdmissionApplicationInput, { application: AdmissionApplication }>(
    functions,
    'saveAdmissionApplication'
  );
  const result = await call(input);
  return result.data.application;
}

export interface TransitionInput {
  applicationId: string;
  to: AdmissionStatus;
  reason?: string;
  collegeId?: string;
}

export async function transitionStage(
  applicationId: string,
  to: AdmissionStatus,
  reason?: string,
  collegeId?: string
): Promise<AdmissionApplication> {
  const call = httpsCallable<TransitionInput, { application: AdmissionApplication }>(
    functions,
    'transitionAdmissionStage'
  );
  const result = await call({ applicationId, to, reason, collegeId });
  return result.data.application;
}

export async function listApplications(
  collegeId?: string
): Promise<{
  applications: AdmissionApplication[];
  counts: Record<string, number>;
  totals: AdmissionFunnelTotals;
}> {
  const call = httpsCallable<
    { collegeId?: string },
    {
      applications: AdmissionApplication[];
      counts: Record<string, number>;
      totals: AdmissionFunnelTotals;
    }
  >(functions, 'listAdmissionApplications');
  const result = await call({ collegeId });
  return result.data;
}

export async function deleteApplication(applicationId: string, collegeId?: string): Promise<void> {
  const call = httpsCallable<{ applicationId: string; collegeId?: string }, { deleted: boolean }>(
    functions,
    'deleteAdmissionApplication'
  );
  await call({ applicationId, collegeId });
}

export async function exportAdmitted(
  status: AdmissionStatus,
  collegeId?: string
): Promise<AdmissionExportResult> {
  const call = httpsCallable<{ status: AdmissionStatus; collegeId?: string }, AdmissionExportResult>(
    functions,
    'exportAdmittedApplicants'
  );
  const result = await call({ status, collegeId });
  return result.data;
}

export async function markExported(applicationIds: string[], collegeId?: string): Promise<number> {
  const call = httpsCallable<{ applicationIds: string[]; collegeId?: string }, { marked: number }>(
    functions,
    'markAdmissionExported'
  );
  const result = await call({ applicationIds, collegeId });
  return Number(result.data.marked) || 0;
}
