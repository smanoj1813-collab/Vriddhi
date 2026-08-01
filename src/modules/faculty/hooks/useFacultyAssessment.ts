// hooks/useFacultyAssessment.ts
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { listAssessments, listStudentAssessments } from '../api/assessmentsApi';
import type { Assessment, StudentAssessment, AssessmentFilterOptions } from '../types/assessment';

export function useFacultyAssessment(collegeId: string) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [todayAssessments, setTodayAssessments] = useState<Assessment[]>([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    todayCount: 0,
    upcomingCount: 0,
    averageScore: 0,
    passRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await listAssessments({ collegeId });
      setAssessments(data);

      setTodayAssessments(data.filter((a: Assessment) => {
        const sd = a.scheduledDate || a.startDate;
        return sd && (sd as string).startsWith(today);
      }));

      setUpcomingAssessments(data.filter((a: Assessment) => {
        const sd = a.scheduledDate || a.startDate;
        return sd && (sd as string) > today && a.status === 'published';
      }));

      // Calculate stats
      const subs = await listStudentAssessments({});
      const gradedSubs = subs.filter((sa: StudentAssessment) => sa.status === 'graded');
      const avgScore = gradedSubs.length > 0
        ? gradedSubs.reduce((sum: number, sa: StudentAssessment) => sum + (sa.percentage || 0), 0) / gradedSubs.length
        : 0;

      setStats({
        totalAssessments: data.length,
        todayCount: data.filter((a: Assessment) => {
          const sd = a.scheduledDate || a.startDate;
          return sd && (sd as string).startsWith(today);
        }).length,
        upcomingCount: data.filter((a: Assessment) => {
          const sd = a.scheduledDate || a.startDate;
          return sd && (sd as string) > today && a.status === 'published';
        }).length,
        averageScore: avgScore,
        passRate: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  return { assessments, todayAssessments, upcomingAssessments, stats, loading, error, refresh: fetchAssessments };
}