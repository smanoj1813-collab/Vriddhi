// ═══════════════════════════════════════════════════════════════════════
// hooks/useAcademicCalendar.ts — Calendar state, filters & grid generation
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
  CalendarEventType,
  CalendarEventStatus,
  CalendarViewMode,
  CalendarStats,
  DayCell,
} from '@/shared/types/academicCalendar';

import {
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  computeCalendarStats,
  toISODate,
} from '@/shared/api/academicCalendarApi';

// ─── Date utilities ────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - x.getDay()); // Sunday-first
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

/** True when `iso` (YYYY-MM-DD) falls inside the event's date span. */
export function eventCoversDate(event: CalendarEvent, iso: string): boolean {
  const end = event.endDate || event.startDate;
  return event.startDate <= iso && end >= iso;
}

function sortEvents(a: CalendarEvent, b: CalendarEvent): number {
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
  const at = a.startTime || '00:00';
  const bt = b.startTime || '00:00';
  if (at !== bt) return at.localeCompare(bt);
  return a.title.localeCompare(b.title);
}

// ─── Hook ──────────────────────────────────────────────────────────────

export function useAcademicCalendar(collegeId: string | undefined) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<CalendarEventStatus | 'all'>('all');
  const [facultyFilter, setFacultyFilter] = useState<string>('all');

  // ─── Fetch ───────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    if (!collegeId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await listCalendarEvents({ collegeId });
      setEvents(items);
    } catch (err) {
      console.error('[useAcademicCalendar] fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ─── Mutations ───────────────────────────────────────────────────────
  const addEvent = useCallback(async (input: CreateCalendarEventInput) => {
    setSaving(true);
    setError(null);
    try {
      const created = await createCalendarEvent(input);
      setEvents(prev => [...prev, created]);
      return created;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create event';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const editEvent = useCallback(async (id: string, input: UpdateCalendarEventInput) => {
    setSaving(true);
    setError(null);
    try {
      await updateCalendarEvent(id, input);
      setEvents(prev => prev.map(e =>
        e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } as CalendarEvent : e
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update event';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await deleteCalendarEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete event';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── Filtered events ─────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter(e => {
      if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (facultyFilter !== 'all' && e.facultyId !== facultyFilter) return false;
      if (term) {
        const haystack = [
          e.title, e.description, e.courseName, e.courseCode,
          e.facultyName, e.room, e.branch, e.batch,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    }).sort(sortEvents);
  }, [events, search, typeFilter, statusFilter, facultyFilter]);

  const stats: CalendarStats = useMemo(
    () => computeCalendarStats(events),
    [events]
  );

  // ─── Lookups ─────────────────────────────────────────────────────────
  const eventsForDate = useCallback((date: Date): CalendarEvent[] => {
    const iso = toISODate(date);
    return filteredEvents.filter(e => eventCoversDate(e, iso)).sort(sortEvents);
  }, [filteredEvents]);

  // ─── Month grid (always 6 rows × 7 cols) ─────────────────────────────
  const monthGrid: DayCell[] = useMemo(() => {
    const today = startOfDay(new Date());
    const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const gridStart = startOfWeek(firstOfMonth);

    return Array.from({ length: 42 }, (_, i) => {
      const date = addDays(gridStart, i);
      const iso = toISODate(date);
      return {
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(date, today),
        events: filteredEvents.filter(e => eventCoversDate(e, iso)).sort(sortEvents),
      };
    });
  }, [currentDate, filteredEvents]);

  // ─── Week grid (7 days) ──────────────────────────────────────────────
  const weekGrid: DayCell[] = useMemo(() => {
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(currentDate);

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const iso = toISODate(date);
      return {
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: isSameDay(date, today),
        events: filteredEvents.filter(e => eventCoversDate(e, iso)).sort(sortEvents),
      };
    });
  }, [currentDate, filteredEvents]);

  // ─── Day list ────────────────────────────────────────────────────────
  const dayEvents: CalendarEvent[] = useMemo(
    () => eventsForDate(currentDate),
    [eventsForDate, currentDate]
  );

  // ─── Upcoming list (list view) ───────────────────────────────────────
  const listEvents: CalendarEvent[] = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
      return sortEvents(a, b);
    });
  }, [filteredEvents]);

  // ─── Navigation ──────────────────────────────────────────────────────
  const goToToday = useCallback(() => {
    const today = startOfDay(new Date());
    setCurrentDate(today);
    setSelectedDate(today);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(prev.getMonth() - 1);
      else if (viewMode === 'week') next.setDate(prev.getDate() - 7);
      else next.setDate(prev.getDate() - 1);
      return next;
    });
  }, [viewMode]);

  const goNext = useCallback(() => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (viewMode === 'month') next.setMonth(prev.getMonth() + 1);
      else if (viewMode === 'week') next.setDate(prev.getDate() + 7);
      else next.setDate(prev.getDate() + 1);
      return next;
    });
  }, [viewMode]);

  const periodLabel = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'week') {
      const ws = startOfWeek(currentDate);
      const we = addDays(ws, 6);
      const sameMonth = ws.getMonth() === we.getMonth();
      const left = ws.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const right = we.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: sameMonth ? undefined : 'short',
        year: 'numeric',
      });
      return `${left} – ${right}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
    }
    return 'All Events';
  }, [viewMode, currentDate]);

  return {
    // data
    events,
    filteredEvents,
    stats,
    loading,
    saving,
    error,

    // view state
    viewMode, setViewMode,
    currentDate, setCurrentDate,
    selectedDate, setSelectedDate,
    periodLabel,

    // filters
    search, setSearch,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    facultyFilter, setFacultyFilter,

    // grids
    monthGrid,
    weekGrid,
    dayEvents,
    listEvents,
    eventsForDate,

    // actions
    refresh: fetchEvents,
    addEvent,
    editEvent,
    removeEvent,
    goToday: goToToday,
    goPrev,
    goNext,
  };
}

export type UseAcademicCalendarReturn = ReturnType<typeof useAcademicCalendar>;
