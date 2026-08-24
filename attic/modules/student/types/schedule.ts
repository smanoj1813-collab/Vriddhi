export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ScheduleClass {
  id: string;
  subject: string;
  subjectCode?: string;
  startTime: string;
  endTime: string;
  room: string;
  facultyName: string;
  facultyId?: string;
  facultyInitials?: string;
  day: DayOfWeek;
  type: 'lecture' | 'lab' | 'tutorial';
  status: 'scheduled' | 'completed' | 'cancelled' | 'ongoing';
  topics?: string[];
  topic?: string;
  notes?: string;
}

export type WeeklyClassSchedule = Record<DayOfWeek, ScheduleClass[]>;

export interface ClassScheduleFilters {
  day?: DayOfWeek;
  subject?: string;
  facultyId?: string;
  room?: string;
  status?: string;
}
