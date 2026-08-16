export type CurriculumStatus = 'parsing' | 'review' | 'approved' | 'assigned' | 'archived';
export type ParseConfidence = 'high' | 'medium' | 'low';

export interface ParsedModule {
  id: string;
  moduleNo: string | number;
  title?: string;
  moduleName?: string;
  name?: string;
  description?: string | null;
  hours: number;
  marks?: number;
  type?: string;
  topics: string[];
  learningOutcomes?: string[] | null;
  confidence?: ParseConfidence;
  isEdited?: boolean;
  subject?: string;
  course?: string;
  semester?: number;
  resources?: string[];
}

export interface FacultyCurriculumView {
  courseId: string;
  courseName: string;
  courseCode: string;
  branch: string;
  semester: number;
  batch: string;
  division?: string | null;
  section?: string | null;
  totalHours: number;
  credits: number;
  modules: ParsedModule[];
  mappingId?: string;
  curriculumId?: string;
  curriculumTitle?: string;
  assignedAt?: string;
}

export interface FacultyScheduleItem {
  id: string;
  subject: string;
  subjectCode: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  startTime: string;
  endTime: string;
  room: string;
  branch: string;
  batch: string;
  semester: number;
  type: string;
  date: string;
  attendanceMarked?: boolean;
  division?: string;
  section?: string;
  topicsPlanned?: string[];
}

export interface FacultyCurriculumStats {
  totalCourses: number;
  totalModules: number;
  totalHours: number;
  totalCredits: number;
}