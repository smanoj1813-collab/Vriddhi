import { useState, useEffect } from "react";
import { ClassSchedule, FacultySchedule } from "../types/schedule";

export function useFacultySchedule(facultyId?: string) {
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSchedule([]);
    setLoading(false);
    setError(null);
  }, [facultyId]);

  return { schedule, loading, error, refetch: () => {} };
}

export function useFacultyWeeklySchedule(facultyId?: string, weekStart?: Date) {
  const [weeklySchedule, setWeeklySchedule] = useState<FacultySchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWeeklySchedule(null);
    setLoading(false);
    setError(null);
  }, [facultyId, weekStart]);

  return { weeklySchedule, loading, error };
}
