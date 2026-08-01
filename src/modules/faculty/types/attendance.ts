// src/modules/faculty/types/attendance.ts

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late' | 'OnDuty' | 'MedicalLeave';

export const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string }> = {
  Present:       { label: 'Present',       color: 'text-green-700',  bg: 'bg-green-100' },
  Absent:        { label: 'Absent',        color: 'text-red-700',    bg: 'bg-red-100' },
  Leave:         { label: 'Leave',         color: 'text-blue-700',   bg: 'bg-blue-100' },
  Late:          { label: 'Late',          color: 'text-yellow-700', bg: 'bg-yellow-100' },
  OnDuty:        { label: 'On Duty',       color: 'text-orange-700', bg: 'bg-orange-100' },
  MedicalLeave:  { label: 'Medical Leave', color: 'text-purple-700', bg: 'bg-purple-100' },
};

export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Late', label: 'Late' },
  { value: 'OnDuty', label: 'On Duty' },
  { value: 'MedicalLeave', label: 'Medical Leave' },
];

export interface Student {
  id: string;
  name: string;
  usn: string;
  regNo: string;
  avatar?: string;
  branch: string;
  batch: string;
  division: string;
  semester: number;
}

export interface ClassSession {
  id: string;
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
  timeSlot: string;
  date: string;
  students: Student[];
  className: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'rescheduled' | 'cancelled';
  topicsPlanned: string[];
  attendanceMarked: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string;
  sessionId: string;
  date: string;
  subject: string;
  subjectCode: string;
  status: AttendanceStatus;
  checkInTime?: string;
  notes?: string;
  markedBy: string;
  markedAt: string;
  branch?: string;
  batch?: string;
  division?: string;
  usn?: string;
  regNo?: string;
}

export interface DailyAttendanceSummary {
  date: string;
  branch: string;
  batch: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  onDuty: number;
  medicalLeave: number;
  percentage: number;
}

export interface StudentAttendanceSummary {
  studentId: string;
  name: string;
  regNo: string;
  branch: string;
  batch: string;
  division: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  onDuty: number;
  medicalLeave: number;
  percentage: number;
  requiredPercentage: number;
  monthlyBreakdown: MonthlyAttendance[];
}

export interface MonthlyAttendance {
  month: string;
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export interface CalendarDayData {
  date: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
  hasData: boolean;
  sessions: number;
}

export interface FacultyStudent {
  id: string;
  name: string;
  usn: string;
  regNo: string;
  branch: string;
  batch: string;
  division: string;
  semester: number;
  attendancePercentage: number;
  status: 'good' | 'average' | 'weak' | 'excellent';
  avgScore: number;
  rollNo: string;
  email?: string;
  photoUrl?: string;
}

export interface FacultyTopic {
  id: string;
  title: string;
  unit: string;
  moduleNo: string;
  moduleName: string;
  duration: number;
  status: 'covered' | 'in-progress' | 'pending' | 'completed';
  dateCovered?: string;
  facultyNotes?: string;
  description?: string;
  plannedDate?: Date | string;
  completedDate?: Date | string;
  subject?: string;
  facultyId?: string;
}

export interface FacultyClassSession {
  id: string;
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
  timeSlot: string;
  date: string;
  topicsPlanned: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendanceMarked: boolean;
  className?: string;
  startTime?: string;
  endTime?: string;
  time?: string;
  students?: any[];
  topics?: string[];
}

export interface FacultyAttendanceRecord {
  studentId: string;
  name: string;
  usn: string;
  regNo: string;
  status: AttendanceStatus;
  notes: string;
  checkInTime?: string;
  remark?: string;
  markedAt?: string;
}

export interface FacultyAttendanceDoc {
  id: string;
  sessionId: string;
  facultyId: string;
  subject: string;
  subjectCode: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
  room: string;
  timeSlot: string;
  date: string;
  markedAt: string;
  markedBy: string;
  records: FacultyAttendanceRecord[];
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  onDutyCount: number;
  medicalLeaveCount: number;
  totalStudents: number;
}

export interface FacultyStats {
  // Original fields (keep for backward compat)
  totalStudents: number;
  weakStudentsCount: number;
  avgAttendance: number;
  topicsCovered: number;
  topicsPending: number;
  papersUploaded: number;
  papersPendingApproval: number;
  classesThisWeek: number;

  // Additional fields for FacultyDashboard compatibility
  goodStudents: number;
  averageStudents: number;
  weakStudents: number;
  coveredTopics: number;
  pendingTopics: number;
  totalPapers: number;
  pendingVerifications: number;
  pendingApprovals: number;
}

export interface TestPaper {
  id: string;
  title: string;
  subject: string;
  className: string;
  division: string;
  totalMarks: number;
  duration: number;
  fileName: string;
  verificationStatus: 'pending-verification' | 'submitted-for-approval' | 'approved' | 'rejected';
  questions: unknown[];
  createdBy: string;
  createdAt: string;
  submittedAt: string;
  aiGenerated: boolean;
  approvalRemarks?: string;
  type?: string;
}

export interface FacultyExportRow {
  date: string;
  timeSlot: string;
  subject: string;
  subjectCode: string;
  branch: string;
  batch: string;
  division: string;
  section: string;
  room: string;
  studentName: string;
  usn: string;
  regNo: string;
  status: AttendanceStatus;
  notes: string;
  markedBy: string;
}

export type ExportFormat = 'csv' | 'excel';

export interface AttendanceSummary {
  id: string;
  studentId: string;
  subject: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
  month?: string;
  year?: number;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  dateRange?: { from: Date; to: Date };
  subject?: string;
  className?: string;
}

export interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  department: string;
  designation?: string;
  phone?: string;
  avatar?: string;
  photoUrl?: string;
  employeeId?: string;
  joiningDate?: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  status?: 'active' | 'inactive' | 'on-leave';
}