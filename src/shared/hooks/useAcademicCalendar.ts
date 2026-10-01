// src/shared/hooks/useAcademicCalendar.ts
// Shared academic-calendar read model for the timetable "Holiday" banners
// (Auto-Scheduler v2 — P4). AdminClassSchedule, the student timetable and the
// faculty schedule all ask the same question — "is the date I'm showing
// blocked, and by what?" — so they share this hook.

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCalendarEvents } from '@/modules/admin/api/calendarApi';
import {
  suspendingEventOn,
  type CalendarEvent,
} from '@/shared/types/calendarEvent';

/**
 * The college's calendar events (bounded; stale for 5 minutes — holidays
 * change rarely). Read failures remain visible so a timetable does not imply
 * that a date was verified as a teaching day when the calendar was unavailable.
 */
export function useAcademicCalendar(collegeId?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['academicCalendar', collegeId ?? 'current'],
    queryFn: () => fetchCalendarEvents(collegeId),
    staleTime: 5 * 60_000,
  });
}

/**
 * The suspendsClasses event blocking `dateKey` (yyyy-mm-dd), if any. Fests
 * (suspendsClasses:false) never block — they show on the calendar page only.
 */
export function useHolidayForDate(
  dateKey: string | undefined,
  collegeId?: string,
): {
  holiday: { title: string; startDate: string; endDate: string } | null;
  isLoading: boolean;
  isError: boolean;
} {
  const events = useAcademicCalendar(collegeId);
  const holiday = useMemo(() => {
    if (!dateKey || !events.data) return null;
    return suspendingEventOn(events.data, dateKey);
  }, [events.data, dateKey]);
  return { holiday, isLoading: events.isLoading, isError: events.isError };
}
