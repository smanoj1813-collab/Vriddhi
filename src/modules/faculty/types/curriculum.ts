// src/modules/faculty/types/curriculum.ts
export interface ParsedModule {
  id: string;
  moduleNo: string;
  title?: string;
  moduleName?: string;
  hours: number;
  marks?: number;
  topics: string[];
  description?: string;
  learningOutcomes?: string[];
  resources?: string[];
}

export interface FacultyCurriculumView {
  courseId: string;
  courseName: string;
  courseCode: string;
  branch: string;
  semester: number;
  batch: string;
  division?: string;
  section?: string;
  credits: number;
  totalHours: number;
  modules: ParsedModule[];
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