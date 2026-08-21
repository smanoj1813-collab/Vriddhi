// ═══════════════════════════════════════════════════════════════════════
// types/academicCalendar.ts — Academic Calendar Events & Scheduling
// ═══════════════════════════════════════════════════════════════════════

export type CalendarEventType = 'class' | 'exam' | 'holiday' | 'event' | 'deadline' | 'meeting';
export type CalendarEventStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
export type EventPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CalendarViewMode = 'month' | 'week' | 'day' | 'list';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: CalendarEventType;
  status: CalendarEventStatus;
  priority: EventPriority;

  // Timing
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;   // ISO date YYYY-MM-DD
  allDay: boolean;
  startTime: string | null; // HH:mm (24h)
  endTime: string | null;   // HH:mm (24h)

  // Academic context
  collegeId: string;
  curriculumId: string | null;
  courseId: string | null;
  courseName: string | null;
  courseCode: string | null;
  moduleId: string | null;
  moduleName: string | null;
  facultyId: string | null;
  facultyName: string | null;
  branch: string | null;
  semester: number | null;
  batch: string | null;
  division: string | null;
  section: string | null;

  // Location
  room: string | null;
  building: string | null;

  // Metadata
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string | null;
  attendees: string[] | null;
  color: string | null; // hex override
  isRecurring: boolean;
  recurringRule: string | null;
  parentEventId: string | null;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  status?: CalendarEventStatus;
  priority?: EventPriority;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  collegeId: string;
  curriculumId?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  courseCode?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  facultyId?: string | null;
  facultyName?: string | null;
  branch?: string | null;
  semester?: number | null;
  batch?: string | null;
  division?: string | null;
  section?: string | null;
  room?: string | null;
  building?: string | null;
  createdBy: string;
  createdByName?: string | null;
  attendees?: string[] | null;
  color?: string | null;
  isRecurring?: boolean;
  recurringRule?: string | null;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  eventType?: CalendarEventType;
  status?: CalendarEventStatus;
  priority?: EventPriority;
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  startTime?: string | null;
  endTime?: string | null;
  curriculumId?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  courseCode?: string | null;
  moduleId?: string | null;
  moduleName?: string | null;
  facultyId?: string | null;
  facultyName?: string | null;
  branch?: string | null;
  semester?: number | null;
  batch?: string | null;
  division?: string | null;
  section?: string | null;
  room?: string | null;
  building?: string | null;
  attendees?: string[] | null;
  color?: string | null;
  isRecurring?: boolean;
  recurringRule?: string | null;
}

export interface CalendarFilterOptions {
  collegeId?: string;
  eventType?: CalendarEventType | 'all';
  status?: CalendarEventStatus | 'all';
  branch?: string | 'all';
  semester?: number | 'all';
  batch?: string | 'all';
  facultyId?: string | 'all';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CalendarStats {
  totalEvents: number;
  upcomingEvents: number;
  classesToday: number;
  examsThisWeek: number;
  holidaysThisMonth: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}
