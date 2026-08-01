import { useState, useEffect } from 'react';

export interface StudentProfileInput {
  branch: string;
  batch: string;
  semester: number;
  division?: string;
  section?: string;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  day: string;
}

export interface UseStudentScheduleReturn {
  weeklySchedule: ClassSchedule[];
  todayClasses: ClassSchedule[];
  isLoading: boolean;
  error: string | null;
}

export function useStudentSchedule(profile: StudentProfileInput | string | null | undefined): UseStudentScheduleReturn {
  const [weeklySchedule, setWeeklySchedule] = useState<ClassSchedule[]>([]);
  const [todayClasses, setTodayClasses] = useState<ClassSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from API
    setIsLoading(false);
  }, [profile]);

  return { weeklySchedule, todayClasses, isLoading, error };
}

export default useStudentSchedule;
