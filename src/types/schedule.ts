export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

/**
 * Shared class schedule shape.
 * - Faculty pages use `timeSlot` (nested).
 * - Student pages may use flat `startTime` / `endTime`.
 * - All optional fields are safe-guarded in UI with fallbacks.
 */
export interface ClassSchedule {
  id: string;
  day: DayOfWeek;
  timeSlot: TimeSlot;
  subject: string;
  subjectCode?: string;
  className: string;
  room?: string;
  facultyId?: string;
  facultyName?: string;
  facultyInitials?: string;
  type?: 'lecture' | 'lab' | 'tutorial';
  status?: 'scheduled' | 'completed' | 'cancelled' | 'ongoing' | 'upcoming';
  /** Flat time fields — populated by student schedule APIs */
  startTime?: string;
  endTime?: string;
  topics?: string[];
  topicsPlanned?: string[];
  notes?: string;
}

export interface FacultyScheduleClass {
  id: string;
  subject: string;
  subjectCode?: string;
  startTime: string;
  endTime: string;
  room: string;
  className: string;
  section?: string;
  semester?: number;
  batch?: string;
  type: 'lecture' | 'lab' | 'tutorial';
  status: 'scheduled' | 'completed' | 'cancelled' | 'ongoing';
  topics?: string[];
  topicsPlanned?: string[];
  notes?: string;
  facultyId?: string;
}

export interface WeeklySchedule {
  [day: string]: ClassSchedule[];
}

export interface FacultySchedule {
  id: string;
  facultyId: string;
  weekStart: Date;
  sessions: ClassSchedule[];
}