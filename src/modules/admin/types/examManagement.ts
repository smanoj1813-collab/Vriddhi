// src/modules/admin/types/examManagement.ts
// Karnataka University Examination Management - Hall Tickets, Room Allotment, Seating

export type ExamType = 'regular' | 'supplementary' | 'improvement' | 'revaluation';
export type ExamStatus = 'draft' | 'scheduled' | 'hall_tickets_generated' | 'ongoing' | 'completed' | 'results_published';
export type HallTicketStatus = 'not_generated' | 'generated' | 'downloaded' | 'blocked' | 'withheld';

export interface ExamSession {
  id: string;
  collegeId: string;
  universityId?: string;
  universityName?: string;
  academicYear: string; // e.g., 2024-25
  semester: number;
  examType: ExamType;
  title: string; // e.g., "BCA 3rd Sem Regular - SEP 2024"
  scheme: string; // SEP 2024, NEP 2020, CBCS
  status: ExamStatus;
  
  // Dates
  applicationStartDate: string;
  applicationEndDate: string;
  feeLastDate: string;
  feeLastDateWithFine?: string;
  examStartDate: string;
  examEndDate: string;
  hallTicketReleaseDate?: string;
  resultDate?: string;

  // Courses
  course: string; // BCA, BBA, BCom etc
  branch?: string;
  batch?: string;

  // Stats
  totalStudents?: number;
  totalSubjects?: number;
  hallTicketsGenerated?: number;
  hallTicketsDownloaded?: number;

  // Meta
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  notificationSent?: boolean;
}

export interface ExamSubject {
  id: string;
  examSessionId: string;
  subjectCode: string;
  subjectName: string;
  subjectShortName?: string;
  credits?: number;
  maxMarks: number; // 80 for BCU theory
  internalMarks: number; // 20 for BCU
  totalMarks: number; // 100
  examDate: string;
  examTime: string; // e.g., "10:00 AM - 1:00 PM"
  duration: string; // e.g., "3 Hours"
  type: 'theory' | 'practical' | 'viva' | 'project';
  medium?: 'en' | 'kn' | 'both'; // BCU allows English or Kannada
}

export interface HallTicket {
  id: string;
  examSessionId: string;
  collegeId: string;
  studentId: string;
  
  // Student snapshot
  studentName: string;
  regNo: string; // USN
  uucmsCandidateId?: string;
  uucmsUSN?: string;
  course: string;
  semester: number;
  branch?: string;
  batch: string;
  photoUrl?: string;
  signatureUrl?: string;

  // Exam details
  examTitle: string;
  academicYear: string;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    examDate: string;
    examTime: string;
    isAppearing: boolean; // For supplementary - only failed subjects
  }>;

  // Hall ticket meta
  hallTicketNo: string; // Unique HT number
  status: HallTicketStatus;
  blockedReason?: string;
  attendanceEligibility?: {
    isEligible: boolean;
    overallPercentage: number;
    subjectWise: Array<{
      subject: string;
      percentage: number;
      isEligible: boolean;
    }>;
    remarks?: string;
  };

  // Center & Seating
  examCenter?: string;
  examCenterCode?: string;
  roomNo?: string;
  building?: string;
  floor?: string;
  seatNo?: string;
  block?: string;

  // QR & Verification
  qrCodeData?: string; // JSON for verification
  verificationUrl?: string;

  // Tracking
  generatedAt?: string;
  generatedBy?: string;
  downloadedAt?: string;
  downloadCount?: number;
  lastDownloadedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ExamRoom {
  id: string;
  collegeId: string;
  roomNo: string;
  building: string;
  floor?: string;
  block?: string;
  capacity: number;
  rows: number;
  columns: number;
  type: 'classroom' | 'hall' | 'lab' | 'auditorium';
  facilities?: string[]; // CCTV, AC etc
  isAvailable: boolean;
  createdAt: string;
}

export interface RoomAllotment {
  id: string;
  examSessionId: string;
  collegeId: string;
  roomId: string;
  roomNo: string;
  building: string;
  
  // Exam slot
  examDate: string;
  examTime: string;
  subjectCode: string;
  subjectName: string;

  // Allotment
  totalSeats: number;
  allottedSeats: number;
  students: Array<{
    studentId: string;
    studentName: string;
    regNo: string;
    seatNo: string;
    hallTicketNo: string;
  }>;

  // Invigilator
  invigilatorId?: string;
  invigilatorName?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SeatingArrangement {
  examSessionId: string;
  examDate: string;
  examTime: string;
  subjectCode: string;
  rooms: RoomAllotment[];
  totalStudents: number;
  totalRooms: number;
  generatedAt: string;
  generatedBy: string;
}

// For notifications - matches Uniclare's killer features
export type UniversityNotificationType =
  | 'admission_confirmation'
  | 'exam_date'
  | 'timetable'
  | 'exam_fee_paid'
  | 'fee_last_date_alert'
  | 'hall_ticket_download'
  | 'room_allotment'
  | 'result_announcement'
  | 'revaluation'
  | 'general';

export interface UniversityNotification {
  id: string;
  collegeId: string;
  universityId?: string;
  type: UniversityNotificationType;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Targeting
  targetCourses?: string[];
  targetSemesters?: number[];
  targetBatches?: string[];
  targetStudentIds?: string[]; // For individual
  
  // Scheduling
  scheduledAt?: string;
  sentAt?: string;
  expiryAt?: string;

  // Tracking
  totalRecipients?: number;
  deliveredCount?: number;
  readCount?: number;
  clickedCount?: number;

  // Action
  actionUrl?: string;
  actionLabel?: string; // "Download Hall Ticket", "Pay Fee" etc

  createdBy: string;
  createdAt: string;
}

// Result import
export interface UniversityResult {
  id: string;
  examSessionId: string;
  collegeId: string;
  studentId: string;
  studentName: string;
  regNo: string;
  usn: string;
  course: string;
  semester: number;
  academicYear: string;
  
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    internalMarks: number;
    externalMarks: number;
    totalMarks: number;
    maxMarks: number;
    grade?: string;
    gradePoint?: number;
    result: 'P' | 'F' | 'A' | 'W'; // Pass, Fail, Absent, Withheld
  }>;

  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  sgpa?: number;
  cgpa?: number;
  result: 'PASS' | 'FAIL' | 'ATKT' | 'WITHHELD';
  creditsEarned?: number;
  totalCredits?: number;

  // Marks card
  marksCardUrl?: string;
  marksCardNo?: string;

  // Revaluation
  revaluationEligible?: boolean;
  revaluationApplied?: boolean;
  revaluationStatus?: 'not_applied' | 'applied' | 'in_process' | 'completed';

  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamSessionInput {
  title: string;
  academicYear: string;
  semester: number;
  examType: ExamType;
  scheme: string;
  course: string;
  branch?: string;
  batch?: string;
  applicationStartDate: string;
  applicationEndDate: string;
  feeLastDate: string;
  feeLastDateWithFine?: string;
  examStartDate: string;
  examEndDate: string;
  universityId?: string;
}

export interface GenerateHallTicketsInput {
  examSessionId: string;
  studentIds?: string[]; // If empty, all eligible
  checkAttendanceEligibility?: boolean;
  minAttendancePercentage?: number; // 75% for BCU
  examCenter?: string;
  examCenterCode?: string;
}

export interface AllotRoomsInput {
  examSessionId: string;
  examDate: string;
  examTime: string;
  subjectCode: string;
  roomIds: string[];
  allocationStrategy?: 'sequential' | 'random' | 'branch_wise' | 'regNo_wise';
}
