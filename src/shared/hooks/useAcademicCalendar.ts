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
 * change rarely). Degrades to an empty list on rules/network hiccups so a
 * banner never sinks the page it decorates.
 */
export function useAcademicCalendar(collegeId?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['academicCalendar', collegeId ?? 'current'],
    queryFn: () => fetchCalendarEvents(collegeId).catch(() => [] as CalendarEvent[]),
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
): { title: string; startDate: string; endDate: string } | null {
  const events = useAcademicCalendar(collegeId);
  return useMemo(() => {
    if (!dateKey || !events.data) return null;
    return suspendingEventOn(events.data, dateKey);
  }, [events.data, dateKey]);
}
