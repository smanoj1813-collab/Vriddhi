import { useState, useEffect, useMemo } from 'react';
import {
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

export function useFacultySchedule() {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: wire to real API
    setSchedule([]);
    setLoading(false);
    setError(null);
  }, []);

  const weeklySchedule = useMemo<WeeklySchedule>(() => {
    const map: WeeklySchedule = {};
    DAYS.forEach((day) => (map[day] = []));

    schedule.forEach((cls) => {
      if (cls.day && map[cls.day]) {
        map[cls.day].push(cls);
      }
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

  const totalClasses = schedule.length;

  return {
    weeklySchedule,
    todayClasses,
    totalClasses,
    isLoading: loading,
    error,
    refetch: () => {},
  };
}