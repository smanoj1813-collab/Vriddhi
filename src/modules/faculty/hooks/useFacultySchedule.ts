import { useCallback, useEffect, useState } from 'react';

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface FacultyScheduleItem {
  id: string;
  subject: string;
  subjectCode?: string;
  className: string;
  section?: string;
  semester?: number;
  batch?: string;
  room: string;
  startTime: string;
  endTime: string;
  day: DayOfWeek;
  type: 'lecture' | 'lab' | 'tutorial';
  status: 'scheduled' | 'completed' | 'cancelled' | 'ongoing';
  topics?: string[];
  topicsPlanned?: string[];
}

export interface UseFacultyScheduleReturn {
  todayClasses: FacultyScheduleItem[];
  weekSchedule: Record<DayOfWeek, FacultyScheduleItem[]>;
  classes: FacultyScheduleItem[]; // alias for legacy comps
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useFacultySchedule = (facultyId?: string): UseFacultyScheduleReturn => {
  const [todayClasses, setTodayClasses] = useState<FacultyScheduleItem[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<Record<DayOfWeek, FacultyScheduleItem[]>>({
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allClasses = Object.values(weekSchedule).flat();

  const fetchData = useCallback(async () => {
    if (!facultyId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { 
    todayClasses, 
    weekSchedule, 
    classes: allClasses, // alias
    loading, 
    error, 
    refresh: fetchData 
  };
};

export default useFacultySchedule;