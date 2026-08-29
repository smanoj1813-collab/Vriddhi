// src/modules/student/hooks/useStudentSchedule.ts
// Real weekly schedule for a student, read from `weeklySchedules`
// (same collection faculty/admin write recurring classes to).
import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type { ClassSchedule, WeeklySchedule } from '../../../types/schedule';

export interface StudentScheduleProfile {
  collegeId: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
}

function initials(name?: string): string {
  if (!name) return '';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function useStudentSchedule(profile: StudentScheduleProfile | null) {
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || !profile.collegeId || !profile.branch || !profile.batch) {
      setRows([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        // Tenant scope is mandatory; remaining cohort fields are filtered from
        // this already-isolated result until the canonical schedule schema is
        // migrated in the next milestone.
        const q = query(
          collection(db, 'weeklySchedules'),
          where('collegeId', '==', profile.collegeId),
          where('branch', '==', profile.branch),
          limit(500)
        );
        const snap = await getDocs(q);
        if (cancelled) return;

        const matched = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Record<string, any>))
          .filter((row) => {
            if (String(row.batch || '') !== String(profile.batch)) return false;
            if (Number(row.semester || 0) !== Number(profile.semester)) return false;
            const div = row.division || row.section || '';
            if (div && div !== profile.division && div !== profile.section) return false;
            return true;
          });

        setRows(matched);
      } catch (err) {
        console.error('[useStudentSchedule] load failed:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [
    profile?.collegeId,
    profile?.branch,
    profile?.batch,
    profile?.semester,
    profile?.division,
    profile?.section,
  ]);

  const schedule = useMemo<ClassSchedule[]>(() => {
    return rows.map((row) => {
      const startTime = row.startTime || row.timeSlot?.startTime || '';
      const endTime = row.endTime || row.timeSlot?.endTime || '';
      return {
        id: row.id,
        subject: row.subject || '',
        subjectCode: row.subjectCode || '',
        faculty: row.facultyName || row.faculty || '',
        facultyName: row.facultyName || row.faculty || '',
        facultyInitials: row.facultyInitials || initials(row.facultyName || row.faculty),
        day: (row.dayOfWeek || row.day || 'Monday'),
        startTime,
        endTime,
        room: row.room || '',
        type: row.type || 'lecture',
        status: row.status || 'scheduled',
        className: row.className || row.subject || '',
        timeSlot: row.timeSlot || { startTime, endTime },
      } as ClassSchedule;
    });
  }, [rows]);

  const weeklySchedule = useMemo<WeeklySchedule>(() => {
    const map: WeeklySchedule = {};
    schedule.forEach((cls) => {
      if (!cls.day) return;
      // Normalize capitalization (Monday vs monday)
      const day = cls.day.charAt(0).toUpperCase() + cls.day.slice(1).toLowerCase();
      if (!map[day]) map[day] = [];
      map[day].push(cls);
    });
    // Sort each day by startTime
    Object.values(map).forEach((list) =>
      list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    );
    return map;
  }, [schedule]);

  const todayClasses = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return weeklySchedule[today] || [];
  }, [weeklySchedule]);

  return { schedule, weeklySchedule, todayClasses, isLoading, error };
}

export default useStudentSchedule;
