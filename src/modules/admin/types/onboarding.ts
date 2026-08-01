// src/types/onboarding.ts

/**
 * Student Onboarding Data - Raw CSV parsed data
 * All fields are string (empty string for optional/missing values)
 */
export interface StudentOnboardingData {
  [key: string]: string;  // Add this line
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
  [key: string]: string;  // Add this line
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

// Re-export from system.ts if needed
export type { 
  OnboardingRecord, 
  OnboardingError, 
  UploadTemplate,
  TemplateField,
  ParseResult,
} from './system';