// src/services/onboardingService.ts
// Student & Faculty Onboarding with CSV/Excel parsing

import Papa from 'papaparse';
import type { 
  StudentOnboardingData, 
  FacultyOnboardingData, 
  OnboardingRecord, 
  OnboardingError, 
  UploadTemplate,
  TemplateField,
  ParseResult,
} from '../types/onboarding';
// Local system type stubs — TODO: move to shared types when available
interface Student {
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
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Faculty {
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
  status: string;
  isHOD: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


// ============================================================
// TEMPLATE DEFINITIONS
// ============================================================

export const STUDENT_TEMPLATE: UploadTemplate = {
  id: 'student_onboarding',
  name: 'Student Onboarding',
  description: 'Bulk upload students to a college. Each student gets a unique Reg No.',
  fields: [
    { name: 'Registration Number', key: 'regNo', label: 'Registration Number', required: true, type: 'text', description: 'Unique student registration number', example: 'R2024001', validation: { unique: true } },
    { name: 'Full Name', key: 'name', label: 'Full Name', required: true, type: 'text', description: 'Student full name', example: 'Rahul Sharma' },
    { name: 'Email', key: 'email', label: 'Email', required: true, type: 'email', description: 'Student email address', example: 'rahul.sharma@student.edu', validation: { unique: true } },
    { name: 'Phone', key: 'phone', label: 'Phone', required: true, type: 'phone', description: 'Phone number with country code', example: '+919876543210' },
    { name: 'Date of Birth', key: 'dateOfBirth', label: 'Date of Birth', required: false, type: 'date', description: 'YYYY-MM-DD format', example: '2005-03-15' },
    { name: 'Gender', key: 'gender', label: 'Gender', required: false, type: 'select', options: ['male', 'female', 'other'], description: 'Student gender', example: 'male' },
    { name: 'Blood Group', key: 'bloodGroup', label: 'Blood Group', required: false, type: 'text', description: 'Blood group', example: 'B+' },
    { name: 'Course', key: 'course', label: 'Course', required: true, type: 'text', description: 'Course name', example: 'B.Com (Computer Applications)' },
    { name: 'Department', key: 'department', label: 'Department', required: true, type: 'text', description: 'Department name', example: 'Commerce' },
    { name: 'Batch', key: 'batch', label: 'Batch', required: true, type: 'text', description: 'Batch year range', example: '2024-2028' },
    { name: 'Semester', key: 'semester', label: 'Semester', required: true, type: 'number', description: 'Current semester number', example: '2', validation: { min: 1, max: 10 } },
    { name: 'Division', key: 'division', label: 'Division', required: true, type: 'text', description: 'Class division', example: 'A' },
    { name: 'Mentor ID', key: 'mentorId', label: 'Mentor ID', required: false, type: 'text', description: 'Assigned faculty ID', example: 'FAC001' },
  ],
  sampleRow: {
    regNo: 'R2024001',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@student.edu',
    phone: '+919876543210',
    dateOfBirth: '2005-03-15',
    gender: 'male',
    bloodGroup: 'B+',
    course: 'B.Com (Computer Applications)',
    department: 'Commerce',
    batch: '2024-2028',
    semester: '2',
    division: 'A',
    mentorId: 'FAC001',
  },
};

export const FACULTY_TEMPLATE: UploadTemplate = {
  id: 'faculty_onboarding',
  name: 'Faculty Onboarding',
  description: 'Bulk upload faculty members to a college.',
  fields: [
    { name: 'Faculty ID', key: 'facultyId', label: 'Faculty ID', required: true, type: 'text', description: 'Unique faculty ID', example: 'FAC001', validation: { unique: true } },
    { name: 'Full Name', key: 'name', label: 'Full Name', required: true, type: 'text', description: 'Faculty full name', example: 'Dr. Priya Nair' },
    { name: 'Email', key: 'email', label: 'Email', required: true, type: 'email', description: 'Faculty email', example: 'priya.nair@college.edu', validation: { unique: true } },
    { name: 'Phone', key: 'phone', label: 'Phone', required: true, type: 'phone', description: 'Phone number', example: '+919876543210' },
    { name: 'Designation', key: 'designation', label: 'Designation', required: true, type: 'select', options: ['professor', 'associate_professor', 'assistant_professor', 'lecturer'], description: 'Faculty designation', example: 'professor' },
    { name: 'Specialization', key: 'specialization', label: 'Specialization', required: false, type: 'text', description: 'Area of specialization', example: 'Finance & Taxation' },
    { name: 'Qualification', key: 'qualification', label: 'Qualification', required: false, type: 'text', description: 'Highest qualification', example: 'Ph.D. Commerce' },
    { name: 'Experience (Years)', key: 'experience', label: 'Experience (Years)', required: false, type: 'number', description: 'Years of experience', example: '15', validation: { min: 0, max: 50 } },
    { name: 'Department', key: 'department', label: 'Department', required: true, type: 'text', description: 'Department name', example: 'Commerce' },
    { name: 'Subjects', key: 'subjects', label: 'Subjects', required: false, type: 'text', description: 'Comma-separated subject codes', example: 'FAC201,BST301' },
  ],
  sampleRow: {
    facultyId: 'FAC001',
    name: 'Dr. Priya Nair',
    email: 'priya.nair@college.edu',
    phone: '+919876543210',
    designation: 'professor',
    specialization: 'Finance & Taxation',
    qualification: 'Ph.D. Commerce',
    experience: '15',
    department: 'Commerce',
    subjects: 'FAC201,BST301',
  },
};

export const SCHEDULE_TEMPLATE: UploadTemplate = {
  id: 'class_schedule',
  name: 'Class Schedule',
  description: 'Upload weekly class schedule for a division/batch.',
  fields: [
    { name: 'Subject', key: 'subject', label: 'Subject', required: true, type: 'text', description: 'Subject name', example: 'Financial Accounting' },
    { name: 'Subject Code', key: 'subjectCode', label: 'Subject Code', required: true, type: 'text', description: 'Subject code', example: 'FAC201' },
    { name: 'Faculty ID', key: 'facultyId', label: 'Faculty ID', required: true, type: 'text', description: 'Faculty ID who teaches this', example: 'FAC001' },
    { name: 'Day', key: 'day', label: 'Day', required: true, type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], description: 'Day of week', example: 'Monday' },
    { name: 'Start Time', key: 'startTime', label: 'Start Time', required: true, type: 'text', description: '24-hour format HH:MM', example: '09:00' },
    { name: 'End Time', key: 'endTime', label: 'End Time', required: true, type: 'text', description: '24-hour format HH:MM', example: '10:30' },
    { name: 'Room', key: 'room', label: 'Room', required: true, type: 'text', description: 'Classroom/Lab name', example: 'LH-301' },
    { name: 'Type', key: 'type', label: 'Type', required: true, type: 'select', options: ['lecture', 'lab', 'tutorial', 'seminar'], description: 'Class type', example: 'lecture' },
    { name: 'Topic', key: 'topic', label: 'Topic', required: false, type: 'text', description: 'Topic for this session', example: 'Depreciation & Reserves' },
    { name: 'Division', key: 'division', label: 'Division', required: true, type: 'text', description: 'Student division', example: 'A' },
    { name: 'Batch', key: 'batch', label: 'Batch', required: true, type: 'text', description: 'Batch year range', example: '2024-2028' },
    { name: 'Semester', key: 'semester', label: 'Semester', required: true, type: 'number', description: 'Semester number', example: '2' },
  ],
  sampleRow: {
    subject: 'Financial Accounting',
    subjectCode: 'FAC201',
    facultyId: 'FAC001',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'LH-301',
    type: 'lecture',
    topic: 'Depreciation & Reserves',
    division: 'A',
    batch: '2024-2028',
    semester: '2',
  },
};

export const ASSESSMENT_TEMPLATE: UploadTemplate = {
  id: 'assessment_reports',
  name: 'Assessment Reports',
  description: 'Upload student assessment marks and grades.',
  fields: [
    { name: 'Student Reg No', key: 'studentRegNo', label: 'Student Reg No', required: true, type: 'text', description: 'Student registration number', example: 'R2024001' },
    { name: 'Subject Code', key: 'subjectCode', label: 'Subject Code', required: true, type: 'text', description: 'Subject code', example: 'FAC201' },
    { name: 'Assessment Type', key: 'assessmentType', label: 'Assessment Type', required: true, type: 'select', options: ['internal_1', 'internal_2', 'midterm', 'final', 'quiz', 'assignment', 'practical', 'project'], description: 'Type of assessment', example: 'internal_1' },
    { name: 'Assessment Name', key: 'assessmentName', label: 'Assessment Name', required: true, type: 'text', description: 'Name of the assessment', example: 'Internal Assessment 1' },
    { name: 'Marks Obtained', key: 'marks', label: 'Marks Obtained', required: true, type: 'number', description: 'Marks obtained by student', example: '42', validation: { min: 0 } },
    { name: 'Max Marks', key: 'maxMarks', label: 'Max Marks', required: true, type: 'number', description: 'Maximum marks', example: '50', validation: { min: 1 } },
    { name: 'Date', key: 'date', label: 'Date', required: true, type: 'date', description: 'Assessment date YYYY-MM-DD', example: '2026-05-15' },
    { name: 'Remarks', key: 'remarks', label: 'Remarks', required: false, type: 'text', description: 'Optional remarks', example: 'Excellent problem solving' },
    { name: 'Graded By', key: 'gradedBy', label: 'Graded By', required: true, type: 'text', description: 'Faculty ID who graded', example: 'FAC001' },
  ],
  sampleRow: {
    studentRegNo: 'R2024001',
    subjectCode: 'FAC201',
    assessmentType: 'internal_1',
    assessmentName: 'Internal Assessment 1',
    marks: '42',
    maxMarks: '50',
    date: '2026-05-15',
    remarks: 'Excellent problem solving',
    gradedBy: 'FAC001',
  },
};

export const ALL_TEMPLATES = [
  STUDENT_TEMPLATE,
  FACULTY_TEMPLATE,
  SCHEDULE_TEMPLATE,
  ASSESSMENT_TEMPLATE,
];

// ============================================================
// CSV PARSING & VALIDATION
// ============================================================

export { type ParseResult };

/**
 * Parse CSV file and validate against template
 * All fields are normalized to string (empty string for missing/optional values)
 */
export function parseCSV<T extends Record<string, string>>(
  file: File,
  template: UploadTemplate
): Promise<ParseResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data: T[] = [];
        const errors: OnboardingError[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNumber = index + 2; // +2 because header is row 1
          const rowErrors: OnboardingError[] = [];

          // Check required fields
          template.fields.forEach((field: TemplateField) => {
            const value = row[field.key]?.trim();

            if (field.required && (!value || value === '')) {
              rowErrors.push({
                rowNumber,
                regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                field: field.name,
                message: `${field.name} is required`,
              });
            }

            // Type validation
            if (value && field.type === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                rowErrors.push({
                  rowNumber,
                  regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                  field: field.name,
                  message: `Invalid email format: ${value}`,
                });
              }
            }

            if (value && field.type === 'number') {
              const num = Number(value);
              if (isNaN(num)) {
                rowErrors.push({
                  rowNumber,
                  regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                  field: field.name,
                  message: `${field.name} must be a number`,
                });
              } else if (field.validation) {
                if (field.validation.min !== undefined && num < field.validation.min) {
                  rowErrors.push({
                    rowNumber,
                    regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                    field: field.name,
                    message: `${field.name} must be at least ${field.validation.min}`,
                  });
                }
                if (field.validation.max !== undefined && num > field.validation.max) {
                  rowErrors.push({
                    rowNumber,
                    regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                    field: field.name,
                    message: `${field.name} must be at most ${field.validation.max}`,
                  });
                }
              }
            }

            if (value && field.type === 'select' && field.options) {
              if (!field.options.includes(value.toLowerCase())) {
                rowErrors.push({
                  rowNumber,
                  regNoOrId: row[template.fields[0].key] || `Row ${rowNumber}`,
                  field: field.name,
                  message: `${field.name} must be one of: ${field.options.join(', ')}`,
                });
              }
            }
          });

          if (rowErrors.length === 0) {
            // Normalize: ensure every template field exists as a string (empty string if missing)
            const normalizedRow: Record<string, string> = {};
            template.fields.forEach((field: TemplateField) => {
              normalizedRow[field.key] = (row[field.key]?.trim() || '') as string;
            });
            data.push(normalizedRow as T);
          } else {
            errors.push(...rowErrors);
          }
        });

        resolve({
          data,
          errors,
          valid: errors.length === 0,
        });
      },
      error: (error) => {
        resolve({
          data: [],
          errors: [{ rowNumber: 0, regNoOrId: 'N/A', field: 'File', message: error.message }],
          valid: false,
        });
      },
    });
  });
}

/**
 * Generate CSV template file for download
 */
export function generateTemplateCSV(template: UploadTemplate): string {
  const headers = template.fields.map((f: TemplateField) => f.key).join(',');
  const sampleValues = template.fields.map((f: TemplateField) => `"${template.sampleRow[f.key] || ''}"`).join(',');
  return `${headers}\n${sampleValues}`;
}

/**
 * Download template as CSV file
 */
export function downloadTemplate(template: UploadTemplate) {
  const csv = generateTemplateCSV(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${template.id}_template.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============================================================
// ACCOUNT PROVISIONING — NOT HERE, DELIBERATELY
// ============================================================
//
// This module used to contain `onboardStudent` / `onboardFaculty` /
// `bulkOnboardStudents` / `bulkOnboardFaculty`, which built a student or faculty
// object in memory with:
//
//   * a default password of `name.slice(0,4) + regNo.slice(-4)` — guessable by
//     anyone who knows two things printed on a college noticeboard;
//   * `passwordHash: hashPassword(...)` — a client-side SHA-256 over a fixed
//     salt, i.e. a decorative value that no authentication system ever consults;
//   * a `// TODO: Save to Firebase/API` comment where the write should have been.
//
// Nothing was ever persisted and no Auth account was ever created, while the
// screen reported success. A credential that Firebase does not know about is the
// root of the "the user exists but cannot log in" class of bug, so the path back
// to it is closed rather than left in the tree:
//
//   students  -> bulkCreateStudentAccounts  (via src/modules/superadmin/api/importUsers)
//   staff     -> bulkProvisionStaff         (via src/modules/superadmin/api/importFaculty)
//   one admin -> grantUserRole
//
// Those callables create the Auth user, set the role/collegeId custom claims,
// write users/{uid} + the profile document, read the account back to prove it,
// and return the credential once (or a password-reset link). This file stays the
// CSV template + validation layer it is actually used as.
