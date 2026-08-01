// src/modules/faculty/hooks/useFacultyCurriculum.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ParsedModule,
  FacultyCurriculumView,
  FacultyScheduleItem,
  FacultyCurriculumStats,
} from '../types/curriculum';

export interface UseFacultyCurriculumReturn {
  curriculum: FacultyCurriculumView[];
  schedules: FacultyScheduleItem[];
  stats: FacultyCurriculumStats | null;
  loading: boolean;
  error: string | null;
  selectedCourse: string | null;
  setSelectedCourse: (id: string | null) => void;
  refresh: () => void;
  refreshSchedule: () => void;
  getCourseModules: () => ParsedModule[];
  getCourseSchedule: () => FacultyScheduleItem[];
  getTodaySchedule: () => FacultyScheduleItem[];
  getUpcomingSchedule: () => FacultyScheduleItem[];
}

export function useFacultyCurriculum(
  facultyId: string,
  collegeId: string,
): UseFacultyCurriculumReturn {
  const [curriculum, setCurriculum] = useState<FacultyCurriculumView[]>([]);
  const [schedules, setSchedules] = useState<FacultyScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!facultyId || !collegeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // TODO: Wire to Firestore / API
      setCurriculum([]);
      setSchedules([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [facultyId, collegeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const courseModules = useMemo(() => {
    if (!selectedCourse) return [];
    return curriculum.find(c => c.courseId === selectedCourse)?.modules || [];
  }, [curriculum, selectedCourse]);

  const courseSchedule = useMemo(() => {
    if (!selectedCourse) return [];
    const course = curriculum.find(c => c.courseId === selectedCourse);
    if (!course) return [];
    return schedules.filter(
      s =>
        s.subject === course.courseName || s.subjectCode === course.courseCode,
    );
  }, [curriculum, schedules, selectedCourse]);

  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.filter(s => s.date === today);
  }, [schedules]);

  const upcomingSchedule = useMemo(() => {
    const now = new Date().toISOString();
    return schedules
      .filter(s => s.date >= now.split('T')[0] && s.status === 'scheduled')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules]);

  return {
    curriculum,
    schedules,
    stats:
      curriculum.length > 0
        ? {
            totalCourses: curriculum.length,
            totalModules: curriculum.reduce(
              (sum, c) => sum + c.modules.length,
              0,
            ),
            totalHours: curriculum.reduce(
              (sum, c) => sum + c.totalHours,
              0,
            ),
            totalCredits: curriculum.reduce(
              (sum, c) => sum + c.credits,
              0,
            ),
          }
        : null,
    loading,
    error,
    selectedCourse,
    setSelectedCourse,
    refresh: fetchData,
    refreshSchedule: fetchData,
    getCourseModules: () => courseModules,
    getCourseSchedule: () => courseSchedule,
    getTodaySchedule: () => todaySchedule,
    getUpcomingSchedule: () => upcomingSchedule,
  };
}

export default useFacultyCurriculum;