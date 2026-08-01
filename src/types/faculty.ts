// src/types/faculty.ts

export interface FacultyProfile {
  title: string;
  name: string;
  email?: string;
  department?: string;
  avatar?: string;
}

export interface FacultyStudent {
  id: string;
  name: string;
  regNo?: string;
  course?: string;
  batch?: string;
  attendancePercentage?: number;
  avgScore?: number;
}

export interface FacultyTopic {
  id: string;
  title: string;
  unit?: string;
  duration?: number;
  dateCovered?: string;
  status?: "pending" | "completed" | "in-progress";
}

export interface ClassSession {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  room?: string;
  type?: string;
  topic?: string;
  faculty?: string;
  status?: string;
}

export interface UseFacultyDataReturn {
  loading: boolean;
  students: FacultyStudent[];
  topics: FacultyTopic[];
  sessions: ClassSession[];
  papers?: any[];
  stats?: any;
  todayDate?: string;
  error?: string | null;
}