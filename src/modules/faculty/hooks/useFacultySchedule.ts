import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { fetchFacultyWeeklySchedule } from '../../admin/api/scheduleApi';
import type { WeeklyClassSchedule } from '../../admin/types/schedule';
import type {
  ClassSchedule,
  DayOfWeek,
  WeeklySchedule,
} from '../../../types/schedule';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function toFacultySchedule(item: WeeklyClassSchedule): ClassSchedule {
  const day = `${item.dayOfWeek.charAt(0).toUpperCase()}${item.dayOfWeek.slice(1)}` as DayOfWeek;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const status = day !== today
    ? 'scheduled'
    : currentTime < item.startTime
      ? 'upcoming'
      : currentTime > item.endTime
        ? 'completed'
        : 'ongoing';

  const cohort = [item.branch, item.batch, item.division || item.section]
    .filter(Boolean)
    .join(' · ');

  return {
    id: item.id,
    day,
    timeSlot: { startTime: item.startTime, endTime: item.endTime },
    startTime: item.startTime,
    endTime: item.endTime,
    subject: item.subject,
    subjectCode: item.subjectCode,
    className: cohort,
    room: item.room,
    facultyId: item.facultyId,
    facultyName: item.facultyName,
    facultyInitials: item.facultyInitials,
    type: item.type,
    status,
  };
}

export function useFacultySchedule() {
  const { user } = useAuth();
  const facultyId = user?.uid || user?.id || '';
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    if (!facultyId) {
      setSchedule([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const weekly = await fetchFacultyWeeklySchedule(facultyId);
      setSchedule(weekly.map(toFacultySchedule));
    } catch (err) {
      setSchedule([]);
      setError(err instanceof Error ? err.message : 'Failed to load your schedule.');
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const weeklySchedule = useMemo<WeeklySchedule>(() => {
    const map: WeeklySchedule = {};
    DAYS.forEach((day) => (map[day] = []));

    schedule.forEach((cls) => {
      if (cls.day && map[cls.day]) map[cls.day].push(cls);
    });

    DAYS.forEach((day) => {
      map[day].sort((a, b) =>
        a.timeSlot.startTime.localeCompare(b.timeSlot.startTime)
      );
    });

    return map;
  }, [schedule]);

  const todayClasses = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
    }) as DayOfWeek;
    return weeklySchedule[today] || [];
  }, [weeklySchedule]);

  return {
    weeklySchedule,
    todayClasses,
    totalClasses: schedule.length,
    isLoading: loading,
    error,
    refetch: loadSchedule,
  };
}
