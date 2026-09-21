// src/modules/admin/types/uucms.ts
// UUCMS Integration Types - Karnataka Government Higher Education Portal
// https://uucms.karnataka.gov.in

export type UUCMSStatus =
  | 'not_registered'
  | 'candidate_generated'
  | 'submitted'
  | 'document_verification'
  | 'pay_fees'
  | 'fee_paid'
  | 'principal_approved'
  | 'active';

export type UUCMSCategory =
  | 'GM'
  | 'SC'
  | 'ST'
  | 'OBC'
  | '2A'
  | '2B'
  | '3A'
  | '3B'
  | 'CAT-1'
  | 'EWS';

export interface UUCMSStudentData {
  // Core UUCMS IDs
  candidateId?: string; // UUCMS Candidate ID - e.g., UUCMS2024XXXX - generated at registration
  usn?: string; // Student Registration Number / USN - final after Principal Approved
  applicationNo?: string;

  // Aadhaar & Identity
  aadhaarNo?: string;
  aadhaarVerified?: boolean;

  // PUC Details for auto-fetch
  puRegistrationNo?: string;
  puCompletionYear?: string;
  puBoard?: 'Karnataka PU Board' | 'CBSE' | 'ICSE' | 'Other State' | 'Other';

  // Category & Reservation
  religion?: string;
  category?: UUCMSCategory;
  caste?: string;
  rdCertificateNo?: string; // RD certificate number (AJSK)
  rdVerified?: boolean;
  incomeCertificateNo?: string;
  incomeVerified?: boolean;
  familyIncomePerAnnum?: number;

  // Quota
  quota?: {
    ncc?: boolean;
    nss?: boolean;
    sports?: boolean;
    exServiceman?: boolean;
    physicallyChallenged?: boolean;
    kannadaMedium?: boolean;
    ruralQuota?: boolean;
  };

  // Bank for scholarships
  bankDetails?: {
    accountNo?: string;
    ifscCode?: string;
    bankName?: string;
    branchName?: string;
  };

  // UUCMS Flow
  uucmsStatus?: UUCMSStatus;
  uucmsRegistrationDate?: string;
  uucmsApplicationDate?: string;
  uucmsFeePaidDate?: string;
  uucmsPrincipalApprovedDate?: string;
  uucmsLastSyncedAt?: string;

  // Eligibility
  eligibilityStatus?: 'pending' | 'eligible' | 'not_eligible' | 'provisional';
  eligibilityFeePaid?: boolean;
  eligibilityFeeAmount?: number;
  eligibilityRemarks?: string;

  // Academic
  academicYear?: string; // e.g., 2024-25
  programLevel?: 'UG' | 'PG' | 'PhD' | 'Diploma';
  universityId?: string; // Reference to University Master
  universityName?: string;
  scheme?: 'SEP 2024' | 'NEP 2020' | 'CBCS' | 'SEP 2024-25'; // Crucial for Karnataka

  // Document verification
  documentsVerified?: boolean;
  documentVerificationDate?: string;
  verifiedBy?: string;
}

export interface UUCMSImportRow {
  candidateId: string;
  usn?: string;
  name: string;
  email?: string;
  phone?: string;
  course: string;
  batch: string;
  semester?: string;
  collegeId?: string;
  status: UUCMSStatus;
  puRegistrationNo?: string;
  category?: string;
  applicationNo?: string;
}

export interface UUCMSImportResult {
  totalRows: number;
  validRows: number;
  imported: number;
  updated: number;
  failed: number;
  errors: Array<{
    rowNumber: number;
    candidateId?: string;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    rowNumber: number;
    message: string;
  }>;
}

export interface UUCMSCollegeSyncStatus {
  collegeId: string;
  collegeName: string;
  universityId: string;
  totalStudentsInUUCMS: number;
  totalStudentsInVriddhi: number;
  syncedStudents: number;
  pendingSync: number;
  notInUUCMS: number;
  notInVriddhi: number;
  lastSyncAt?: string;
  syncPercentage: number;
}

export function getUUCMSStatusLabel(status: UUCMSStatus): string {
  const labels: Record<UUCMSStatus, string> = {
    not_registered: 'Not Registered',
    candidate_generated: 'Candidate ID Generated',
    submitted: 'Application Submitted',
    document_verification: 'Document Verification',
    pay_fees: 'Pay Fees',
    fee_paid: 'Fee Paid',
    principal_approved: 'Principal Approved (USN Generated)',
    active: 'Active',
  };
  return labels[status] || status;
}

export function getUUCMSStatusColor(status: UUCMSStatus): string {
  const colors: Record<UUCMSStatus, string> = {
    not_registered: 'bg-slate-100 text-slate-600 border-slate-200',
    candidate_generated: 'bg-blue-50 text-blue-700 border-blue-200',
    submitted: 'bg-amber-50 text-amber-700 border-amber-200',
    document_verification: 'bg-purple-50 text-purple-700 border-purple-200',
    pay_fees: 'bg-orange-50 text-orange-700 border-orange-200',
    fee_paid: 'bg-teal-50 text-teal-700 border-teal-200',
    principal_approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    active: 'bg-green-50 text-green-700 border-green-200',
  };
  return colors[status] || colors.not_registered;
}
