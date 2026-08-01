// src/types/student.ts

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