// src/modules/faculty/types/index.ts

export interface FacultyClass {
  id: string
  subject: string
  className?: string
  semester?: number
  section?: string
  batchYear?: string | number
  date?: string
  startTime?: string
  endTime?: string
  timeSlot?: string
  room: string
  topicsPlanned?: string[]
  status: 'Pending' | 'Completed' | 'Scheduled' | 'Rescheduled' | 'Cancelled' | 'pending' | 'completed' | 'scheduled' | 'rescheduled' | 'cancelled'
  attendanceMarked?: boolean
  students?: any[]
  attendanceRecord?: Record<string, any>
  completedAt?: string
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late' | 'OnDuty' | 'MedicalLeave'

export const STATUS_CONFIG: Record<AttendanceStatus, { bg: string; color: string; key: string; label: string; description: string }> = {
  Present: { bg: 'bg-emerald-100', color: 'text-emerald-700', key: 'P', label: 'Present', description: 'Student is present' },
  Absent: { bg: 'bg-rose-100', color: 'text-rose-700', key: 'A', label: 'Absent', description: 'Student is absent' },
  Leave: { bg: 'bg-blue-100', color: 'text-blue-700', key: 'L', label: 'Leave', description: 'On leave' },
  Late: { bg: 'bg-amber-100', color: 'text-amber-700', key: 'T', label: 'Late', description: 'Arrived late' },
  OnDuty: { bg: 'bg-purple-100', color: 'text-purple-700', key: 'O', label: 'On Duty', description: 'On official duty' },
  MedicalLeave: { bg: 'bg-cyan-100', color: 'text-cyan-700', key: 'M', label: 'Medical', description: 'Medical leave' },
}

// Alias for components that import ClassSession
export type ClassSession = FacultyClass