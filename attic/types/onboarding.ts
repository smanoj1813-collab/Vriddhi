// src/types/onboarding.ts

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

// === Onboarding system types (defined directly — no re-export from ./system) ===

export interface OnboardingRecord {
  id: string;
  type: 'student' | 'faculty' | 'schedule' | 'assessment';
  collegeId: string;
  fileName: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: OnboardingError[];
  status: 'processing' | 'completed' | 'failed';
  processedBy: string;
  processedAt: string;
  createdAt: string;
}

export interface OnboardingError {
  rowNumber: number;
  regNoOrId: string;
  field: string;
  message: string;
}

export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  sampleRow: Record<string, string>;
}

export interface TemplateField {
  name: string;
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select';
  description: string;
  example: string;
  options?: string[];
  validation?: {
    unique?: boolean;
    min?: number;
    max?: number;
  };
}

export interface ParseResult<T extends Record<string, string>> {
  data: T[];
  errors: OnboardingError[];
  valid: boolean;
}

// === Legacy / other types ===

export interface OnboardingState {
  step: number;
  collegeId?: string;
  completed: boolean;
}

export type OnboardingStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface SystemConfig {
  id: string;
  key: string;
  value: string | number | boolean;
  updatedAt?: string;
}