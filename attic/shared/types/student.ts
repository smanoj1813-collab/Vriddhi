// src/types/student.ts
// Comprehensive type definitions for Student Dashboard

export interface StudentProfile {
  id: string;
  name: string;
  regNo: string;
  email: string;
  phone: string;
  avatar?: string;
  batch: string;
  division: string;
  mentor: string;
  semester: number;
  course: string;
  enrollmentDate: string;
  cgpa: number;
  attendancePercentage: number;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  teacher: string;          // ← ADDED: alias for faculty (used by ScheduleCard)
  facultyName: string;      // ← ADDED: alias for faculty (used by Timetable)
  facultyInitials?: string; // ← ADDED (used by Timetable)
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  topic?: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'exam' | 'event';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  description?: string;
  isMandatory?: boolean;
  instructor?: string;
}

export interface Assessment {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  type: 'quiz' | 'midterm' | 'final' | 'assignment' | 'project' | 'practical';
  date: string;
  time: string;
  duration: number;
  venue: string;
  maxMarks: number;
  syllabus: string[];
  status: 'upcoming' | 'ongoing' | 'completed';
  instructions?: string;
  materials?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  maxMarks: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue' | 'late-submitted';
  submissionType: 'document' | 'image' | 'code' | 'video' | 'presentation' | 'mixed';
  attachments?: AssignmentAttachment[];
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  plagiarismScore?: number;
  allowLateSubmission: boolean;
  latePenalty?: number;
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface AssignmentSubmission {
  assignmentId: string;
  studentId: string;
  files: SubmissionFile[];
  comment: string;
  submittedAt: string;
  status: 'submitted' | 'under-review' | 'graded' | 'rejected';
  marksObtained?: number;
  feedback?: string;
}

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
}

export interface FeeStructure {
  id: string;
  type: 'tuition' | 'exam' | 'library' | 'lab' | 'transport' | 'hostel' | 'miscellaneous';
  description: string;
  amount: number;
  academicYear: string;
  semester: number;
  dueDate: string;
  lateFee?: number;
  isMandatory: boolean;
  dueAmount?: number;
  paidAmount?: number;
  totalAmount?: number;
  status?: 'paid' | 'partial' | 'pending' | 'overdue';
  items?: FeeItem[];
}

export interface FeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isMandatory: boolean;
}

export interface FeeDetail {
  id: string;
  type: 'tuition' | 'exam' | 'library' | 'lab' | 'transport' | 'hostel' | 'miscellaneous';
  description: string;
  amount: number;
  dueDate: string;
  paidAmount: number;
  balance: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  lateFee?: number;
  paymentDate?: string;
  transactionId?: string;
  paymentMethod?: string;
  receiptUrl?: string;
}

export interface PaymentRecord {
  id: string;
  feeId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'cheque';
  transactionId: string;
  status: 'success' | 'pending' | 'failed';
  receiptUrl?: string;
  remarks?: string;
  paidAt?: string;
  method?: string;
}

export interface FeeSummary {
  totalFees: number;
  paidFees: number;      // ← ADDED (used by StudentDashboard progress bars)
  pendingFees: number;   // ← ADDED (used by StudentDashboard progress bars)
  totalPaid: number;
  totalBalance: number;
  totalOverdue: number;
  upcomingDue: FeeDetail[];
  overdueFees: FeeDetail[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  subjectCode: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'holiday';
  timeIn?: string;
  timeOut?: string;
  checkInTime?: string;
  topic?: string;
  notes?: string;
}

export interface MonthlyAttendance {
  month: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export interface AttendanceSummary {
  subject: string;
  subjectCode: string;
  totalClasses: number;
  totalDays?: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  requiredPercentage: number;
  isShortage: boolean;
  monthlyBreakdown?: MonthlyAttendance[];
}

export interface GradeRecord {
  id: string;
  subject: string;
  subjectCode: string;
  assessmentType: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  semester: number;
  date: string;
  remarks?: string;
}

export interface AcademicProgress {
  semester: number;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  earnedCredits: number;
  status: 'completed' | 'ongoing' | 'upcoming';
  subjects: GradeRecord[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'academic' | 'fee' | 'general' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  type: 'notes' | 'ppt' | 'pdf' | 'video' | 'link' | 'reference';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
  thumbnail?: string;
  description?: string;
}

export interface TimeTable {
  day: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  time: string;
  subject: string;
  subjectCode: string;
  faculty: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: 'academic' | 'cultural' | 'sports' | 'seminar' | 'workshop' | 'holiday';
  isMandatory: boolean;
  registrationRequired: boolean;
  registered?: boolean;
}

export interface LeaveApplication {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type: 'sick' | 'personal' | 'family' | 'official' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  documents?: string[];
}

export interface LibraryRecord {
  id: string;
  bookTitle: string;
  bookId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine: number;
  status: 'issued' | 'returned' | 'overdue';
  renewals: number;
}

export interface StudentDashboardStats {
  upcomingClasses: number;
  pendingAssignments: number;
  upcomingAssessments: number;
  attendancePercentage: number;
  feeDue: number;
  newNotifications: number;
  overdueAssignments: number;
  lowAttendanceSubjects: number;
}