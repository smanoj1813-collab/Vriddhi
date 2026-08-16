// src/modules/admin/types/onboarding.ts

/**
 * Student Onboarding Data - Raw CSV parsed data
 * All fields are string (empty string for optional/missing values)
 */
export interface StudentOnboardingData {
  [key: string]: string;
  regNo: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  course: string;
  department: string;
  batch: string;
  semester: string;
  division: string;
  mentorId: string;
}

export interface FacultyOnboardingData {
  [key: string]: string;
  facultyId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  specialization: string;
  qualification: string;
  experience: string;
  department: string;
  subjects: string;
}

// ── Onboarding Error (used by parser + UI) ──
export interface OnboardingError {
  rowNumber: number;
  regNoOrId: string;
  field: string;
  message: string;
}

// ── Template Field (rich definition used by templates) ──
export interface FieldValidation {
  min?: number;
  max?: number;
  unique?: boolean;
}

export interface TemplateField {
  name: string;
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'string' | 'number' | 'email' | 'date' | 'phone' | 'select';
  description: string;
  example: string;
  validation?: FieldValidation;
  options?: string[];
}

// ── Upload Template ──
export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  sampleRow: Record<string, string>;
}

// ── Parse Result ──
export interface ParseResult<T = Record<string, string>> {
  data: T[];
  errors: OnboardingError[];
  valid: boolean;
  totalRows?: number;
  validRows?: number;
}

// ── Onboarding Record (DB + UI) ──
export interface OnboardingRecord {
  id: string;
  type: 'student' | 'faculty';
  status: 'pending' | 'processing' | 'completed' | 'error';
  data?: StudentOnboardingData | FacultyOnboardingData;
  createdAt: string;
  updatedAt: string;
  errors: OnboardingError[];

  // Bulk onboarding extras
  collegeId?: string;
  fileName?: string;
  totalRecords?: number;
  successCount: number;
  errorCount: number;
  processedBy?: string;
  processedAt?: string;
}