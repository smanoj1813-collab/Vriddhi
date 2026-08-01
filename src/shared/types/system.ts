// src/types/system.ts
// ============================================================
// SYSTEM TYPES - Shared across the Vriddhi application
// ============================================================

// --- Template System ---

export interface ValidationRule {
  unique?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface TemplateField {
  key: string;
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select';
  description?: string;
  example?: string;
  options?: string[];
  validation?: ValidationRule;
}

export interface UploadTemplate {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  sampleRow: Record<string, string>;
}

// --- Onboarding System ---

export interface OnboardingError {
  rowNumber: number;
  regNoOrId: string;
  field: string;
  message: string;
}

export interface OnboardingRecord {
  id: string;
  type: 'student' | 'faculty';
  collegeId: string;
  fileName: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: OnboardingError[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedBy: string;
  processedAt: string;
  createdAt: string;
}

// --- Student Types ---

export interface StudentOnboardingData {
  regNo: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  course: string;
  department: string;
  batch: string;
  semester: string;
  division: string;
  mentorId?: string;
  [key: string]: string | undefined;
}

export interface Student {
  id: string;
  regNo: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  collegeId: string;
  collegeName: string;
  courseId: string;
  courseName: string;
  departmentId: string;
  departmentName: string;
  batchId: string;
  batchName: string;
  semester: number;
  division: string;
  mentorId?: string;
  mentorName?: string;
  enrollmentDate: string;
  passwordHash: string;
  status: 'active' | 'inactive' | 'suspended';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- Faculty Types ---

export interface FacultyOnboardingData {
  facultyId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  specialization?: string;
  qualification?: string;
  experience?: string;
  department: string;
  subjects?: string;
  [key: string]: string | undefined;
}

export interface Faculty {
  id: string;
  facultyId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  collegeId: string;
  collegeName: string;
  departmentId: string;
  departmentName: string;
  subjects: string[];
  menteeCount: number;
  passwordHash: string;
  status: 'active' | 'inactive' | 'suspended';
  isHOD: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// --- Parse Result ---

export interface ParseResult<T> {
  data: T[];
  errors: OnboardingError[];
  valid: boolean;
}

// --- User Role ---

export type UserRole = 'student' | 'faculty' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  collegeId?: string;
}