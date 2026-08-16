import { useState, useEffect, useMemo } from 'react';
import type { ClassSchedule, WeeklySchedule } from '../../../types/schedule';

interface StudentProfile {
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
}

export function useStudentSchedule(studentProfile: StudentProfile | null) {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentProfile) return;
    setIsLoading(true);
    // TODO: wire to real API using studentProfile filters
    setSchedule([]);
    setIsLoading(false);
  }, [studentProfile]);

  const weeklySchedule = useMemo<WeeklySchedule>(() => {
    const map: WeeklySchedule = {};
    schedule.forEach((cls) => {
      if (cls.day) {
        if (!map[cls.day]) map[cls.day] = [];
        map[cls.day].push(cls);
      }
    });
    return map;
  }, [schedule]);

  const todayClasses = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return weeklySchedule[today] || [];
  }, [weeklySchedule]);

  return { weeklySchedule, todayClasses, isLoading, error };
}