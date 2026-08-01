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