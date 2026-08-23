// src/modules/student/types/student.ts

/* ─── Submission / File ─── */
export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type?: string;
  size?: number;
}

/* ─── Assignment ─── */
export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  subjectCode?: string;
  dueDate: string;
  dueTime?: string;
  maxMarks?: number;
  totalMarks?: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue' | 'late-submitted' | string;
  attachments?: SubmissionFile[];
  createdAt?: string;
  submissionType?: string;
  marksObtained?: number;
  feedback?: string;
  submittedAt?: string;
}

/* ─── Assignment Submission ─── */
export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  files?: SubmissionFile[];
  remarks?: string;
  status: 'submitted' | 'graded' | 'pending' | string;
  submittedAt?: string;
  marksObtained?: number;
  feedback?: string;
  gradedAt?: string;
}

/* ─── Notification ─── */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp?: string;
  createdAt?: string;
  read: boolean;
  priority?: string;
}

/* ─── Fee ─── */
export interface FeeItem {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
  balance?: number;
  status?: string;
}

export interface FeeSummary {
  totalBalance?: number;
  pendingFees?: number;
  totalOverdue?: number;
  totalPaid?: number;
  paidFees?: number;
  totalFees?: number;
  upcomingDue?: FeeItem[];
}

/* ─── Attendance ─── */
export interface AttendanceSummary {
  presentClasses?: number;
  totalClasses?: number;
  absentClasses?: number;
  percentage?: number;
}

/* ─── Schedule ─── */
export interface ClassSchedule {
  id?: string;
  subject: string;
  startTime: string;
  endTime?: string;
  room?: string;
  faculty?: string;
  type?: string;
  day?: string;
  topic?: string;
  teacher?: string;
  facultyName?: string;
}

/* ─── Assessment (lightweight card) ─── */
export interface Assessment {
  id: string;
  title: string;
  subject: string;
  date: string;
  type?: string;
  status?: string;
  totalMarks?: number;
  time?: string;
  venue?: string;
}

/* ─── Dashboard Stats ─── */
export interface StudentDashboardStats {
  cgpa?: number;
  rank?: number;
  totalStudents?: number;
  attendancePercentage?: number;
  pendingAssignments?: number;
  upcomingTests?: number;
  upcomingClasses?: number;
  upcomingAssessments?: number;
  feeDue?: number;
  newNotifications?: number;
  overdueAssignments?: number;
  lowAttendanceSubjects?: number;
}

/* ─── Profile ─── */
export interface StudentProfile {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  regNo?: string;
  rollNumber?: string;
  branch?: string;
  semester?: number;
  division?: string;
  section?: string;
  batch?: string;
  avatar?: string;
  collegeId?: string;
  course?: string;
}