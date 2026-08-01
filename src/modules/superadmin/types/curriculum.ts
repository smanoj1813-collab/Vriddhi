// ═══════════════════════════════════════════════════════════════════════
// types/curriculum.ts — Syllabus Parser & Curriculum Types
// EXTENDED: Added CurriculumMapping, FacultyAssignment, ScheduleFromCurriculum types
// ═══════════════════════════════════════════════════════════════════════

export type SyllabusFormat = 'docx' | 'pdf' | 'txt';
export type CurriculumStatus = 'parsing' | 'review' | 'approved' | 'assigned' | 'archived';
export type ParseConfidence = 'high' | 'medium' | 'low';

export interface ParsedModule {
  id: string;
  moduleNo: number;
  moduleName: string;
  title: string;
  name?: string;
  description?: string | null;
  hours: number;
  marks: number;
  type: string;
  topics: string[];
  learningOutcomes?: string[] | null;
  confidence: ParseConfidence;
  isEdited?: boolean;
  subject?: string;
  course?: string;
  semester?: number;
}

export interface ParsedCourse {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  credits: number;
  totalHours: number;
  totalMarks: number;
  internalMarks?: number;
  externalMarks?: number;
  semester: number;
  branch: string;
  scheme?: string | null;
  modules: ParsedModule[];
  confidence: ParseConfidence;
  isEdited?: boolean;
  extractedAt?: string;
}

export interface SyllabusExtract {
  id: string;
  fileName: string;
  fileUrl?: string | null;
  fileSize: number;
  format: SyllabusFormat;
  extractedBy: string;
  extractedByName?: string | null;
  extractedAt: string;
  status: CurriculumStatus;
  collegeId?: string | null;
  collegeName?: string | null;
  courses: ParsedCourse[];
  totalCourses: number;
  totalModules: number;
  totalHours: number;
  totalMarks: number;
  averageConfidence: ParseConfidence;
  confidenceScore: number;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  assignedAt?: string | null;
  assignedBy?: string | null;
}

export interface CurriculumDoc {
  id: string;
  collegeId: string;
  collegeName: string;
  syllabusExtractId: string;
  title: string;
  description?: string | null;
  scheme: string;
  branch: string;
  semester: number;
  courses: ParsedCourse[];
  totalCourses: number;
  totalModules: number;
  totalHours: number;
  totalMarks: number;
  status: 'active' | 'inactive' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt?: string | null;
  assignedBy: string;
  assignedAt: string;
}

export interface ParseResult {
  success: boolean;
  extract?: SyllabusExtract;
  courses: ParsedCourse[];
  errors: string[];
  warnings: string[];
  rawText?: string;
  confidenceScore: number;
  totalCourses: number;
  totalModules: number;
  totalHours: number;
  totalMarks: number;
}

export interface ListSyllabusOptions {
  status?: CurriculumStatus | 'all';
  collegeId?: string;
  search?: string;
  format?: SyllabusFormat | 'all';
  limit?: number;
}

export interface ListCurriculumOptions {
  collegeId?: string;
  status?: string;
  branch?: string;
  semester?: number;
  search?: string;
  limit?: number;
}

export interface AssignCurriculumInput {
  syllabusExtractId: string;
  collegeId: string;
  collegeName: string;
  selectedCourseIds?: string[];
  reviewNotes?: string;
}

export interface CurriculumStats {
  totalExtracts: number;
  pendingReview: number;
  approved: number;
  assigned: number;
  totalCourses: number;
  totalModules: number;
  averageConfidence: number;
  byFormat: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface CollegeOption {
  id: string;
  name: string;
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: Curriculum Faculty Mapping Types
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// NEW: Curriculum Faculty Mapping Types
// ═══════════════════════════════════════════════════════════════════════

export interface FacultyOption {
  id: string;
  name: string;
  email: string;
  department: string;
  firstName?: string;
  lastName?: string;
}

export interface CurriculumFacultyMapping {
  id: string;
  curriculumId: string;
  collegeId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyId: string;
  facultyName: string;
  facultyEmail?: string | null;
  branch: string;
  semester: number;
  batch: string;
  division?: string | null;
  section?: string | null;
  totalHours: number;
  credits: number;
  modulesCount: number;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive' | 'removed';
}

export interface CreateMappingInput {
  curriculumId: string;
  collegeId: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  facultyId: string;
  facultyName: string;
  facultyEmail?: string | null;
  branch: string;
  semester: number;
  batch: string;
  division?: string | null;
  section?: string | null;
  totalHours: number;
  credits: number;
  modulesCount: number;
  assignedBy: string;
}

export interface UpdateMappingInput {
  facultyId?: string;
  facultyName?: string;
  facultyEmail?: string | null;
  batch?: string;
  division?: string | null;
  section?: string | null;
  status?: 'active' | 'inactive' | 'removed';
}

export interface FacultyCurriculumView {
  mappingId: string;
  curriculumId: string;
  curriculumTitle: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  branch: string;
  semester: number;
  batch: string;
  division?: string | null;
  section?: string | null;
  totalHours: number;
  credits: number;
  modules: ParsedModule[];
  assignedAt: string;
}

export interface ScheduleFromCurriculumInput {
  mappingId: string;
  curriculumId: string;
  courseId: string;
  subject: string;
  subjectCode: string;
  facultyId: string;
  facultyName: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
  room: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
  topicsPlanned: string[];
}

export interface MappingFilterOptions {
  curriculumId?: string;
  collegeId?: string;
  facultyId?: string;
  branch?: string;
  semester?: number;
  batch?: string;
  status?: string;
}