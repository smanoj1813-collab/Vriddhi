export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

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
  type?: "lecture" | "lab" | "tutorial";
  status?: "scheduled" | "completed" | "cancelled";
}

export interface FacultySchedule {
  id: string;
  facultyId: string;
  weekStart: Date;
  sessions: ClassSchedule[];
}
