// src/modules/student/types/student.ts

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
  time?: string;
  venue?: string;
  duration?: number;
  totalMarks?: number;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectCode?: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  maxMarks?: number;
  totalMarks?: number;
  status?: "pending" | "submitted" | "graded" | "overdue";
  submissionType?: 'online' | 'offline' | 'file' | 'text';
  attachments?: AssignmentAttachment[];
  createdAt?: string;
}

export interface SubmissionFile {
  id: string;
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
  remarks?: string;
  marksObtained?: number;
  submittedAt?: string;
  status?: 'submitted' | 'graded' | 'pending';
}

export interface FeeItem {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export interface FeeSummary {
  paidFees: number;
  pendingFees: number;
  totalFees: number;
  totalPaid?: number;
  totalBalance?: number;
  totalOverdue?: number;
  upcomingDue?: FeeItem[];
  lastPaidDate?: string;
  nextDueDate?: string;
}

export interface StudentDashboardStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalAssignments: number;
  pendingAssignments: number;
  attendanceRate: number;
  feePaidPercentage: number;
  attendancePercentage?: number;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  subjectCode?: string;
  room: string;
  startTime: string;
  endTime: string;
  teacher?: string;
  faculty?: string;
  facultyName?: string;
  facultyInitials?: string;
  day?: string;
  type?: 'lecture' | 'lab' | 'tutorial';
  topic?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "academic" | "fee" | "general" | "alert";
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  timestamp?: string;
  createdAt?: string;
}