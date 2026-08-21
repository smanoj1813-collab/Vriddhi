import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  ParsedModule,
  FacultyCurriculumView,
  FacultyScheduleItem,
  FacultyCurriculumStats,
} from '../types/curriculum';
import { getFacultyCurriculum } from '../../admin/api/curriculumMappingApi';
import { fetchFacultyWeeklySchedule } from '../../admin/api/scheduleApi';

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

// ─── Helpers ────────────────────────────────────────────────────────────

function localISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Next occurrence of a weekday (today counts) as a local YYYY-MM-DD date. */
function nextOccurrenceISO(dayOfWeek: string): string {
  const target = DAYS.indexOf(String(dayOfWeek).toLowerCase());
  if (target < 0) return localISO(new Date());
  const today = new Date();
  let diff = target - today.getDay();
  if (diff < 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return localISO(d);
}

function deriveStatus(date: string, startTime: string, endTime: string): FacultyScheduleItem['status'] {
  if (date !== localISO(new Date())) return 'scheduled';
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (current < startTime) return 'scheduled';
  if (current > endTime) return 'completed';
  return 'ongoing';
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
      setCurriculum([]);
      setSchedules([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Curriculum: fetch mappings for this faculty and resolve course modules
      const views = await getFacultyCurriculum(facultyId, collegeId);
      setCurriculum(views as FacultyCurriculumView[]);

      // Schedule: weekly recurring classes for this faculty
      const weekly = await fetchFacultyWeeklySchedule(facultyId);
      const mapped: FacultyScheduleItem[] = weekly.map((w) => {
        const date = nextOccurrenceISO(w.dayOfWeek);
        return {
          id: w.id,
          subject: w.subject || '',
          subjectCode: w.subjectCode || '',
          status: deriveStatus(date, w.startTime, w.endTime),
          startTime: w.startTime,
          endTime: w.endTime,
          room: w.room || '',
          branch: w.branch || '',
          batch: w.batch || '',
          semester: w.semester || 0,
          type: w.type || 'lecture',
          date,
          attendanceMarked: false,
          division: w.division,
          section: w.section,
          topicsPlanned: [],
        };
      });
      setSchedules(mapped);
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
    const today = localISO(new Date());
    return schedules.filter(s => s.date === today);
  }, [schedules]);

  const upcomingSchedule = useMemo(() => {
    const today = localISO(new Date());
    return schedules
      .filter(s => s.date >= today && s.status === 'scheduled')
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
              (sum, c) => sum + (c.modules?.length || 0),
              0,
            ),
            totalHours: curriculum.reduce(
              (sum, c) => sum + (c.totalHours || 0),
              0,
            ),
            totalCredits: curriculum.reduce(
              (sum, c) => sum + (c.credits || 0),
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
