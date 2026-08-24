export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

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
  [day: string]: FacultyScheduleClass[];
}
