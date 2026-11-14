import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

  const teachingGroup = [item.division, item.section]
    .filter(Boolean)
    .map((value) => value.replace(/,/g, '+'))
    .join(' / ');
  const cohort = [item.branch, item.batch, teachingGroup ? `Div ${teachingGroup}` : '']
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
    branch: item.branch,
    batch: item.batch,
    semester: item.semester,
    division: item.division,
    section: item.section,
    room: item.room,
    facultyId: item.facultyId,
    facultyName: item.facultyName,
    facultyInitials: item.facultyInitials,
    type: item.type,
    status,
  };
}

export function useFacultySchedule() {
  const { user, loading: authLoading } = useAuth();
  const facultyId = user?.uid || user?.id || '';
  const collegeId = user?.collegeId || '';
  const email = user?.email || '';
  const identityKey = JSON.stringify([facultyId, collegeId, email]);
  const request = useRef(0);
  const [state, setState] = useState<{ key: string; schedule: ClassSchedule[]; loading: boolean; error: string | null }>({ key: '', schedule: [], loading: true, error: null });
  // Do not display the previous account/college's timetable during a switch.
  const current = !authLoading && state.key === identityKey ? state : { schedule: [], loading: true, error: null };
  const { schedule, loading, error } = current;

  const loadSchedule = useCallback(async () => {
    const run = ++request.current;
    setState({ key: identityKey, schedule: [], loading: true, error: null });
    if (authLoading) return;
    try {
      if (!facultyId) throw new Error('Sign in again to load your weekly schedule.');
      if (!collegeId) throw new Error('Your sign-in is not linked to a college. Ask your administrator to repair your college access, then sign in again.');
      const weekly = await fetchFacultyWeeklySchedule(facultyId, { collegeId, email });
      if (run === request.current) setState({ key: identityKey, schedule: weekly.map(toFacultySchedule), loading: false, error: null });
    } catch (err) {
      if (run === request.current) setState({ key: identityKey, schedule: [], loading: false, error: err instanceof Error ? err.message : 'Failed to load your schedule.' });
    }
  }, [facultyId, collegeId, email, identityKey, authLoading]);

  useEffect(() => {
    void loadSchedule();
    return () => { request.current++; };
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
