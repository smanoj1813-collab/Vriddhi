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
import type { Student, Faculty } from '../types/system';

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
    { name: 'Course', key: 'course', label: 'Course', required: true, type: 'text', description: 'Course name', example: 'B.Tech Computer Science' },
    { name: 'Department', key: 'department', label: 'Department', required: true, type: 'text', description: 'Department code', example: 'CSE' },
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
    course: 'B.Tech Computer Science',
    department: 'CSE',
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
    { name: 'Specialization', key: 'specialization', label: 'Specialization', required: false, type: 'text', description: 'Area of specialization', example: 'Machine Learning' },
    { name: 'Qualification', key: 'qualification', label: 'Qualification', required: false, type: 'text', description: 'Highest qualification', example: 'Ph.D. CS' },
    { name: 'Experience (Years)', key: 'experience', label: 'Experience (Years)', required: false, type: 'number', description: 'Years of experience', example: '15', validation: { min: 0, max: 50 } },
    { name: 'Department', key: 'department', label: 'Department', required: true, type: 'text', description: 'Department code', example: 'CSE' },
    { name: 'Subjects', key: 'subjects', label: 'Subjects', required: false, type: 'text', description: 'Comma-separated subject codes', example: 'CS201,CS301' },
  ],
  sampleRow: {
    facultyId: 'FAC001',
    name: 'Dr. Priya Nair',
    email: 'priya.nair@college.edu',
    phone: '+919876543210',
    designation: 'professor',
    specialization: 'Machine Learning',
    qualification: 'Ph.D. CS',
    experience: '15',
    department: 'CSE',
    subjects: 'CS201,CS301',
  },
};

export const SCHEDULE_TEMPLATE: UploadTemplate = {
  id: 'class_schedule',
  name: 'Class Schedule',
  description: 'Upload weekly class schedule for a division/batch.',
  fields: [
    { name: 'Subject', key: 'subject', label: 'Subject', required: true, type: 'text', description: 'Subject name', example: 'Data Structures & Algorithms' },
    { name: 'Subject Code', key: 'subjectCode', label: 'Subject Code', required: true, type: 'text', description: 'Subject code', example: 'CS201' },
    { name: 'Faculty ID', key: 'facultyId', label: 'Faculty ID', required: true, type: 'text', description: 'Faculty ID who teaches this', example: 'FAC001' },
    { name: 'Day', key: 'day', label: 'Day', required: true, type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], description: 'Day of week', example: 'Monday' },
    { name: 'Start Time', key: 'startTime', label: 'Start Time', required: true, type: 'text', description: '24-hour format HH:MM', example: '09:00' },
    { name: 'End Time', key: 'endTime', label: 'End Time', required: true, type: 'text', description: '24-hour format HH:MM', example: '10:30' },
    { name: 'Room', key: 'room', label: 'Room', required: true, type: 'text', description: 'Classroom/Lab name', example: 'LH-301' },
    { name: 'Type', key: 'type', label: 'Type', required: true, type: 'select', options: ['lecture', 'lab', 'tutorial', 'seminar'], description: 'Class type', example: 'lecture' },
    { name: 'Topic', key: 'topic', label: 'Topic', required: false, type: 'text', description: 'Topic for this session', example: 'Binary Trees & Traversals' },
    { name: 'Division', key: 'division', label: 'Division', required: true, type: 'text', description: 'Student division', example: 'A' },
    { name: 'Batch', key: 'batch', label: 'Batch', required: true, type: 'text', description: 'Batch year range', example: '2024-2028' },
    { name: 'Semester', key: 'semester', label: 'Semester', required: true, type: 'number', description: 'Semester number', example: '2' },
  ],
  sampleRow: {
    subject: 'Data Structures & Algorithms',
    subjectCode: 'CS201',
    facultyId: 'FAC001',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:30',
    room: 'LH-301',
    type: 'lecture',
    topic: 'Binary Trees & Traversals',
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
    { name: 'Subject Code', key: 'subjectCode', label: 'Subject Code', required: true, type: 'text', description: 'Subject code', example: 'CS201' },
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
    subjectCode: 'CS201',
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
            template.fields.forEach((field) => {
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
  return `${headers}
${sampleValues}`;
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
// STUDENT ONBOARDING
// ============================================================

export { type StudentOnboardingData };

/**
 * Onboard a single student
 */
export async function onboardStudent(
  data: StudentOnboardingData,
  collegeId: string,
  collegeName: string,
  createdBy: string
): Promise<{ success: boolean; student?: Student; error?: string }> {
  try {
    // Generate default password (first 4 letters of name + last 4 of regNo)
    const defaultPassword = `${data.name.replace(/\s/g, '').slice(0, 4).toLowerCase()}${data.regNo.slice(-4)}`;

    const student: Student = {
      id: `STU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      regNo: data.regNo,
      name: data.name,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender as any,
      bloodGroup: data.bloodGroup || undefined,
      collegeId,
      collegeName,
      courseId: data.course,
      courseName: data.course,
      departmentId: data.department,
      departmentName: data.department,
      batchId: data.batch,
      batchName: data.batch,
      semester: Number(data.semester),
      division: data.division,
      mentorId: data.mentorId || undefined,
      mentorName: data.mentorId ? undefined : undefined, // Will be resolved
      enrollmentDate: new Date().toISOString(),
      passwordHash: await hashPassword(defaultPassword),
      status: 'active',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to Firebase/API
    // await firebaseDb.collection('students').doc(student.id).set(student);

    // TODO: Send welcome email with credentials
    // await sendWelcomeEmail(student.email, student.regNo, defaultPassword);

    return { success: true, student };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Bulk onboard students from CSV
 */
export async function bulkOnboardStudents(
  file: File,
  collegeId: string,
  collegeName: string,
  createdBy: string
): Promise<OnboardingRecord> {
  const parseResult = await parseCSV<StudentOnboardingData>(file, STUDENT_TEMPLATE);

  const record: OnboardingRecord = {
    id: `ONB_${Date.now()}`,
    type: 'student',
    collegeId,
    fileName: file.name,
    totalRecords: parseResult.data.length + parseResult.errors.length,
    successCount: 0,
    errorCount: parseResult.errors.length,
    errors: parseResult.errors,
    status: 'processing',
    processedBy: createdBy,
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Process valid records
  for (const data of parseResult.data) {
    const result = await onboardStudent(data, collegeId, collegeName, createdBy);
    if (result.success) {
      record.successCount++;
    } else {
      record.errorCount++;
      record.errors.push({
        rowNumber: 0,
        regNoOrId: data.regNo,
        field: 'General',
        message: result.error || 'Failed to create student',
      });
    }
  }

  record.status = record.errorCount > 0 ? 'completed' : 'completed';
  // TODO: Save record to Firebase
  // await firebaseDb.collection('onboarding_records').doc(record.id).set(record);

  return record;
}

// ============================================================
// FACULTY ONBOARDING
// ============================================================

export { type FacultyOnboardingData };

/**
 * Onboard a single faculty
 */
export async function onboardFaculty(
  data: FacultyOnboardingData,
  collegeId: string,
  collegeName: string,
  createdBy: string
): Promise<{ success: boolean; faculty?: Faculty; error?: string }> {
  try {
    const defaultPassword = `${data.name.replace(/\s/g, '').slice(0, 4).toLowerCase()}${data.facultyId.slice(-4)}`;

    const faculty: Faculty = {
      id: `FAC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      facultyId: data.facultyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      designation: data.designation as any,
      specialization: data.specialization || undefined,
      qualification: data.qualification || undefined,
      experience: data.experience ? Number(data.experience) : undefined,
      collegeId,
      collegeName,
      departmentId: data.department,
      departmentName: data.department,
      subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
      menteeCount: 0,
      passwordHash: await hashPassword(defaultPassword),
      status: 'active',
      isHOD: false,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to Firebase/API
    // await firebaseDb.collection('faculty').doc(faculty.id).set(faculty);

    return { success: true, faculty };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Bulk onboard faculty from CSV
 */
export async function bulkOnboardFaculty(
  file: File,
  collegeId: string,
  collegeName: string,
  createdBy: string
): Promise<OnboardingRecord> {
  const parseResult = await parseCSV<FacultyOnboardingData>(file, FACULTY_TEMPLATE);

  const record: OnboardingRecord = {
    id: `ONB_${Date.now()}`,
    type: 'faculty',
    collegeId,
    fileName: file.name,
    totalRecords: parseResult.data.length + parseResult.errors.length,
    successCount: 0,
    errorCount: parseResult.errors.length,
    errors: parseResult.errors,
    status: 'processing',
    processedBy: createdBy,
    processedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  for (const data of parseResult.data) {
    const result = await onboardFaculty(data, collegeId, collegeName, createdBy);
    if (result.success) {
      record.successCount++;
    } else {
      record.errorCount++;
      record.errors.push({
        rowNumber: 0,
        regNoOrId: data.facultyId,
        field: 'General',
        message: result.error || 'Failed to create faculty',
      });
    }
  }

  record.status = 'completed';
  return record;
}

// ============================================================
// PASSWORD UTILS
// ============================================================

async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or Firebase Auth
  // This is a simple hash for demo
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'vriddhi-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

export function generateDefaultPassword(name: string, id: string): string {
  return `${name.replace(/\s/g, '').slice(0, 4).toLowerCase()}${id.slice(-4)}`;
}