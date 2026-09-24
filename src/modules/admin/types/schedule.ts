// src/types/schedule.ts
// ─── Schedule Types (isolatedModules-safe) ──────────────

export type ClassStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type ClassType = 'lecture' | 'lab' | 'tutorial' | 'seminar' | 'workshop'

export interface ClassSchedule {
  id: string
  subject: string
  subjectCode: string
  facultyId: string
  facultyName: string
  facultyInitials: string
  branch: string
  batch: string
  semester: number
  division: string
  section: string
  room: string
  date: string
  timeSlot: string
  duration: number
  type: ClassType
  status: ClassStatus
  topicsCovered: string[]
  attendanceCount: number
  totalStudents: number
  notes: string
  createdAt: string
  updatedAt: string
  // ─── Slice 2 ────────────────────────────────────────────────────────────
  // Backlink to the recurring slot this session was generated from. Absent on
  // ad-hoc sessions; present on everything the timetable produced.
  weeklyScheduleId?: string
  /** Real topic references (S2.3); `topicsCovered` stays the display text. */
  topicIds?: string[]
  /** Scheduled contact minutes, derived from startTime/endTime. */
  durationMinutes?: number
  /** 'weekly-schedule' when materialised from the timetable, else 'adhoc'. */
  source?: string
  attendanceMarked?: boolean
  presentCount?: number
}

export interface BulkScheduleRow {
  subject: string
  subjectCode: string
  facultyName: string
  branch: string
  batch: string
  semester: string
  division: string
  section: string
  room: string
  date: string
  timeSlot: string
  duration: string
  type: string
  topicName?: string
  topicWeightage?: string
}

export interface ScheduleFilters {
  branch: string
  batch: string
  faculty: string
  status: string
  dateFrom: string
  dateTo: string
}

// Subject info extracted from faculty docs
export interface SubjectInfo {
  name: string
  code: string
  facultyId: string
  facultyName: string
  ug: boolean
  pg: boolean
}

// ─── NEW: Weekly recurring schedule types ────────────────────────

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface WeeklyClassSchedule {
  id: string
  collegeId: string
  subject: string
  subjectCode: string
  facultyId: string
  facultyName: string
  facultyInitials: string
  branch: string
  batch: string
  semester: number
  division: string
  section: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string    // "09:00"
  endTime: string      // "10:30"
  type: ClassType
  isActive: boolean
  createdAt: string
  updatedAt: string
  /**
   * P1 (Auto-Scheduler v2): applicability window (yyyy-mm-dd, inclusive).
   * LEGACY DOCS WITHOUT THESE FIELDS ARE ALWAYS ACTIVE — mirrors
   * `WeeklySlot.effectiveFrom/To` in functions/src/classSchedule.ts.
   */
  effectiveFrom?: string
  effectiveTo?: string
  /**
   * P2: ordered module ids copied from the curriculum course at
   * auto-schedule time (session-topics "next module" hint). v3 auto-advances.
   */
  moduleQueue?: string[]
  /**
   * Optional "Attach an assignment" config. When present, `generateClassSessions`
   * materialises one draft assignment for this slot (targeting the slot's
   * cohort) for the faculty to review and publish.
   */
  assignment?: { title: string; maxScore: number; deadline: string }
  /** Assignment doc id once the slot's assignment has been materialised. */
  assignmentId?: string
}

// For student view
export interface StudentClassView {
  id: string
  subject: string
  subjectCode: string
  facultyName: string
  facultyInitials: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  type: ClassType
  isUpcoming: boolean
  isOngoing: boolean
  isCompleted: boolean
}

// For faculty view
export interface FacultyClassView {
  id: string
  subject: string
  subjectCode: string
  branch: string
  batch: string
  semester: number
  division: string
  section: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  type: ClassType
  studentCount: number
  attendanceMarked: boolean
}

// Form data for creating weekly schedule
export interface WeeklyScheduleFormData {
  subject: string
  subjectCode: string
  facultyId: string
  branch: string
  batch: string
  semester: number
  division: string
  section: string
  room: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  type: ClassType
  /**
   * Optional assignment to attach to this slot (same toggle as the faculty's
   * curriculum link, but from the timetable side). `null` clears an existing
   * attachment; omitting leaves it untouched on update.
   */
  assignment?: { title: string; maxScore: number; deadline: string } | null
}