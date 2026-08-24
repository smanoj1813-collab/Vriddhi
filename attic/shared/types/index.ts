// ═══════════════════════════════════════════════════════════════════════
// User & Authentication Types
// ═══════════════════════════════════════════════════════════════════════

export type UserRole = 'superadmin' | 'admin' | 'hod' | 'faculty' | 'mentor' | 'student';
export * from './faculty';

export type Permission =
  | 'users:read' | 'users:write' | 'users:delete'
  | 'students:read' | 'students:write' | 'students:delete'
  | 'faculty:read' | 'faculty:write'
  | 'assessments:read' | 'assessments:write' | 'assessments:approve'
  | 'attendance:read' | 'attendance:write'
  | 'fees:read' | 'fees:write'
  | 'settings:read' | 'settings:write'
  | 'reports:read' | 'reports:write'
  | 'analytics:read'
  | 'questionbank:read' | 'questionbank:write'
  | 'papers:read' | 'papers:write' | 'papers:approve'
  | 'schedule:read' | 'schedule:write'
  | 'materials:read' | 'materials:write'
  | 'superadmin:full';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;        // Required for HOD/Faculty/Mentor filtering
  avatar?: string;
  collegeId?: string;
  permissions?: Permission[];
  createdAt?: string;
  lastLogin?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Student Types
// ═══════════════════════════════════════════════════════════════════════

export interface StudentProfile {
  id: string;
  name: string;
  regNo: string;
  email: string;
  phone?: string;
  department: string;
  batch: string;
  year: string;
  section: string;
  avatar?: string;
  dob?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  mentorId?: string;
  mentorName?: string;
  status: 'active' | 'inactive' | 'probation';
  feesPaid: boolean;
  joinedAt: string;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  faculty: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  type: 'quiz' | 'midterm' | 'final' | 'assignment';
  date: string;
  duration: number;
  maxMarks: number;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'overdue' | 'graded';
  maxMarks: number;
  submittedAt?: string;
}

export interface FeeSummary {
  totalFees: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'pending';
  transactions: FeeTransaction[];
}

export interface FeeTransaction {
  id: string;
  amount: number;
  date: string;
  method: string;
  status: 'success' | 'pending' | 'failed';
}

export interface AttendanceSummary {
  subject: string;
  totalClasses: number;
  attended: number;
  percentage: number;
  month: string;
}

export interface GradeRecord {
  subject: string;
  assessment: string;
  marks: number;
  maxMarks: number;
  grade: string;
  semester: string;
}

export interface AcademicProgress {
  semester: string;
  sgpa: number;
  cgpa: number;
  credits: number;
  status: 'completed' | 'ongoing';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'video' | 'link';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TimeTable {
  id: string;
  day: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  subject: string;
  faculty: string;
  room: string;
  type: 'lecture' | 'lab';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: 'academic' | 'cultural' | 'sports';
  registered: boolean;
}

export interface LeaveApplication {
  id: string;
  type: 'sick' | 'personal' | 'academic';
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedBy?: string;
}

export interface LibraryRecord {
  id: string;
  bookTitle: string;
  author: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string;
  fine: number;
  status: 'issued' | 'returned' | 'overdue';
}

export interface StudentDashboardStats {
  totalSubjects: number;
  pendingAssignments: number;
  upcomingAssessments: number;
  attendancePercentage: number;
  cgpa: number;
  semester: string;
}

export interface AssignmentSubmission {
  assignmentId: string;
  files: string[];
  comments?: string;
  submittedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Faculty Types
// ═══════════════════════════════════════════════════════════════════════

export interface FacultyProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  subjects: string[];
  avatar?: string;
  phone?: string;
  joiningDate: string;
}

export interface FacultyWorkload {
  subject: string;
  hoursPerWeek: number;
  studentsCount: number;
  batches: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// HOD Types
// ═══════════════════════════════════════════════════════════════════════

export interface DepartmentStats {
  department: string;
  totalStudents: number;
  totalFaculty: number;
  totalBatches: number;
  avgAttendance: number;
  avgScore: number;
  activeStudents: number;
  probationStudents: number;
  pendingApprovals: number;
}

export interface HODApproval {
  id: string;
  type: 'schedule' | 'assessment' | 'material' | 'leave' | 'paper';
  title: string;
  requester: string;
  requesterRole: string;
  description?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// ═══════════════════════════════════════════════════════════════════════
// Super Admin Types
// ═══════════════════════════════════════════════════════════════════════

export interface College {
  id: string;
  name: string;
  code: string;
  location: string;
  adminEmail: string;
  adminName: string;
  status: 'active' | 'inactive' | 'suspended';
  studentCount: number;
  facultyCount: number;
  subscriptionPlan: 'basic' | 'standard' | 'premium';
  subscriptionExpiry: string;
  createdAt: string;
}

export interface CollegeAdmin {
  id: string;
  name: string;
  email: string;
  collegeId: string;
  collegeName: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: string;
  responseTime: number;
  lastChecked: string;
}

export interface BillingRecord {
  id: string;
  collegeId: string;
  collegeName: string;
  plan: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  billingDate: string;
  dueDate: string;
}

// ═══════════════════════════════════════════════════════════════════════
// Common / Shared Types
// ═══════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FilterParams {
  search?: string;
  department?: string;
  batch?: string;
  year?: string;
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}