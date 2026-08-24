export interface FacultyStudent {
  id: string;
  name: string;
  regNo: string;
  email?: string;
  classId?: string;
  className?: string;
  attendancePercentage?: number;
  avgScore?: number;
  status?: 'good' | 'average' | 'weak' | 'excellent';
  rollNo?: string;
  usn?: string;
  branch?: string;
  batch?: string;
  division?: string;
  semester?: number;
}

export interface FacultyTopic {
  id: string;
  name?: string;
  title?: string;
  subject?: string;
  classId?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'delayed' | 'pending' | 'in_progress' | 'covered';
  scheduledDate?: Date | string;
  unit?: string;
  duration?: number;
  dateCovered?: string;
  moduleNo?: string;
}

export interface ClassSession {
  id: string;
  classId?: string;
  className?: string;
  subject: string;
  subjectCode?: string;
  facultyId?: string;
  facultyName?: string;
  date?: Date | string;
  period?: number;
  topic?: string;
  attendanceMarked?: boolean;
  startTime?: string;
  endTime?: string;
  room?: string;
  status?: string;
  type?: string;
  faculty?: string;
  topicsPlanned?: string[];
  branch?: string;
  batch?: string;
  semester?: number;
  division?: string;
  section?: string;
  timeSlot?: string;
  students?: any[];
}

export interface FacultyPaper {
  id: string;
  title: string;
  verificationStatus?: 'pending-verification' | 'submitted-for-approval' | 'approved' | 'verified';
}

export interface FacultyStats {
  totalStudents?: number;
  weakStudentsCount?: number;
  avgAttendance?: number;
  topicsCovered?: number;
  topicsPending?: number;
  papersUploaded?: number;
  papersPendingApproval?: number;
  [key: string]: number | undefined;
}

export interface FacultyProfile {
  title: string;
  name: string;
  email?: string;
  department?: string;
  avatar?: string;
}

export interface FacultyAttendanceRecord {
  studentId: string;
  studentName: string;
  rollNo?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave' | 'OnDuty' | 'MedicalLeave';
  remarks?: string;
}

export interface FacultyAttendanceDoc {
  id: string;
  sessionId: string;
  facultyId: string;
  subject: string;
  subjectCode?: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section?: string;
  room?: string;
  timeSlot?: string;
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

export interface FacultyClassSession {
  id: string;
  subject: string;
  subjectCode?: string;
  facultyId: string;
  facultyName?: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section?: string;
  room?: string;
  timeSlot?: string;
  date: string;
  topicsPlanned?: string[];
  status?: string;
  attendanceMarked?: boolean;
}

export interface TestPaper {
  id: string;
  title: string;
  createdBy: string;
  createdAt?: string;
  status?: string;
  verificationStatus?: string;
  [key: string]: any;
}