export interface Assessment {
  id: string;
  title: string;
  description?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  status: 'draft' | 'published' | 'archived';
  collegeId: string;
  courseId?: string;
  maxScore?: number;
  passingScore?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}