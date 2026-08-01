// src/modules/admin/types/attendance.ts

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'leave'
  | 'late'
  | 'onDuty'
  | 'medicalLeave';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  regNo: string;
  status: AttendanceStatus;
  date: string;
  classSessionId: string;
  subject: string;
  markedBy: string;
  markedAt: string;
  note?: string;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  regNo: string;
  totalClasses: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  onDuty: number;
  medicalLeave: number;
  percentage: number;
}

export interface ClassSession {
  id: string;
  subject: string;
  topic?: string;
  date: string;
  startTime: string;
  endTime: string;
  facultyId: string;
  facultyName: string;
  batch: string;
  branch: string;
  collegeId: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  attendanceMarked?: boolean;
  markedAt?: string;
}