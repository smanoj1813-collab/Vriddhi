// src/types/students.ts
// ============================================================
// Student Types — Original dashboard types + Master Index types
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ════════════════════════════════════════════════════════════
// ORIGINAL TYPES (dashboard / UI)
// ════════════════════════════════════════════════════════════

export interface StudentProfile {
  name: string;
  regNo: string;
  course: string;
  batch: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface AttendanceSummary {
  percentage: number;
  presentClasses: number;
  totalClasses: number;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: string;
  date: string;
  duration?: number;
  totalMarks?: number;
  status?: "upcoming" | "active" | "completed";
  time?: string;
  venue?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status?: "pending" | "submitted" | "graded" | "overdue";
  subjectCode?: string;
  description?: string;
  dueTime?: string;
  maxMarks?: number;
  attachments?: SubmissionFile[];
  submissionType?: "online" | "offline" | "file";
}

export interface SubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  files: SubmissionFile[];
  submittedAt: string;
  status: "submitted" | "graded" | "late";
  remarks?: string;
  score?: number;
  marksObtained?: number;
}

export interface FeeSummary {
  paidFees: number;
  pendingFees: number;
  totalFees: number;
  totalBalance?: number;
  totalOverdue?: number;
  totalPaid?: number;
  upcomingDue?: Array<{ label: string; amount: number; dueDate: string }>;
  lastPaidDate?: string;
  nextDueDate?: string;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  room: string;
  startTime: string;
  endTime: string;
  teacher?: string;
  facultyName?: string;
  facultyInitials?: string;
  day?: string;
  status?: "scheduled" | "ongoing" | "completed" | "cancelled";
  subjectCode?: string;
  type?: "lecture" | "lab" | "tutorial" | "seminar";
  topic?: string;
  faculty?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "academic" | "fee" | "general" | "alert";
  read: boolean;
  createdAt?: string;
  priority?: "low" | "medium" | "high";
  timestamp?: string;
}

export interface StudentDashboardStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalAssignments: number;
  pendingAssignments: number;
  attendanceRate: number;
  attendancePercentage?: number;
  feePaidPercentage: number;
}

export interface UseStudentDataReturn {
  loading: boolean;
  profile: StudentProfile | null;
  attendance: AttendanceSummary | null;
  assessments: Assessment[];
  assignments: Assignment[];
  fees: FeeSummary | null;
  schedule: ClassSchedule[];
  notifications: Notification[];
  unreadNotifications: number;
  todayDate: string;
}

// ════════════════════════════════════════════════════════════
// STUDENT INDEX TYPES (Firestore master record)
// ════════════════════════════════════════════════════════════

/** Master student document stored in colleges/{collegeId}/students/{regNo} */
export interface StudentIndex {
  id: string;
  collegeId: string;
  name: string;
  email: string;
  registrationNumber: string;
  phoneNumber: string;
  department: string;
  course: string;
  batch: number;
  batchString: string;
  division: string;
  mentorName: string;
  mentorId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  importedAt?: Timestamp;
  isActive: boolean;
  userId?: string;
  avatar?: string;
}

/** CSV row shape before import */
export interface StudentImportRow {
  name: string;
  email: string;
  registrationNumber: string;
  phoneNumber: string;
  division: string;
  batch: number;
  mentorName: string;
  department: string;
}

/** Bulk import result */
export interface StudentImportResult {
  success: boolean;
  total: number;
  created: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; regNo: string; message: string }>;
  elapsedMs: number;
}

/** Filter for listing students */
export interface StudentIndexFilter {
  collegeId: string;
  department?: string;
  batch?: number;
  division?: string;
  mentorName?: string;
  searchQuery?: string;
  isActive?: boolean;
}

/** Lightweight list item for tables */
export interface StudentIndexListItem {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
  batch: number;
  division: string;
  mentorName: string;
}

/** Dashboard stats from the index */
export interface StudentIndexStats {
  total: number;
  byDepartment: Record<string, number>;
  byBatch: Record<string, number>;
  byDivision: Record<string, number>;
  byMentor: Record<string, number>;
}