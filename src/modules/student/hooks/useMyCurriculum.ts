// src/modules/student/hooks/useMyCurriculum.ts
// ------------------------------------------------------------------
// The signed-in student's curriculum: every subject assigned to their cohort,
// its modules and topics, and — per topic — whether it has been taught
// (completed), is being taught now (current) or is still ahead (upcoming).
//
// Everything comes from the `getMyCurriculum` callable. The student cannot
// read `curriculum`, `curriculumFacultyMappings` or `facultyTopics` directly
// (rules make them staff-only), so the join is done server-side for exactly
// the caller's own cohort. Nothing here is defaulted or invented: when no
// curriculum is mapped to the cohort the result says so and the page explains.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';

export type TopicState = 'completed' | 'current' | 'upcoming';

export interface StudentTopic {
  title: string;
  state: TopicState;
  coveredOn: string | null;
  plannedOn: string | null;
}

export interface StudentModule {
  moduleNo: string;
  moduleName: string;
  hours: number;
  topics: StudentTopic[];
  total: number;
  completed: number;
  current: number;
  upcoming: number;
  pct: number;
  state: TopicState;
}

export interface StudentSessionSummary {
  id: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  subjectCode: string;
  facultyName: string;
  room: string;
  status: string;
  topics: string[];
}

export interface StudentSubject {
  curriculumId: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  credits: number;
  totalHours: number;
  modules: StudentModule[];
  totals: { total: number; completed: number; current: number; upcoming: number; pct: number };
  recentSessions: StudentSessionSummary[];
  upcomingSessions: StudentSessionSummary[];
}

export interface StudentCurriculumResult {
  generatedAt: string;
  student: { branch: string; batch: string; semester: number; division: string };
  subjects: StudentSubject[];
  totals: { subjects: number; topics: number; completed: number; current: number; upcoming: number; pct: number };
  upcomingClasses: StudentSessionSummary[];
  noCurriculumAssigned: boolean;
}

const callable = httpsCallable<Record<string, never>, StudentCurriculumResult>(functions, 'getMyCurriculum');

export function useMyCurriculum(enabled = true) {
  const [data, setData] = useState<StudentCurriculumResult | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await callable({} as Record<string, never>);
      setData(result.data);
    } catch (err: any) {
      setError(err?.message || 'Could not load your curriculum');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  return { data, loading, error, refetch: load };
}

export default useMyCurriculum;
