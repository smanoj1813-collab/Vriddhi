import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { listAssessments, listStudentAssessments } from '../api/assessmentsApi';
import type { Assessment } from '../../../types/assessment';

interface StudentAssessment {
  id: string;
  status: string;
  percentage?: number;
  score?: number;
  studentId?: string;
  assessmentId?: string;
}

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
      const data = await listAssessments({ collegeId } as any);
      setAssessments(data);

      setTodayAssessments(data.filter((a: Assessment) => {
        const sd = a.startTime;
        if (!sd) return false;
        const dateStr = typeof sd === 'string' ? sd : sd.toISOString();
        return dateStr.startsWith(today);
      }));

      setUpcomingAssessments(data.filter((a: Assessment) => {
        const sd = a.startTime;
        if (!sd) return false;
        const dateStr = typeof sd === 'string' ? sd : sd.toISOString();
        return dateStr > today && a.status === 'published';
      }));

      // Calculate stats
      const subs = await listStudentAssessments({} as any) as StudentAssessment[];
      const gradedSubs = subs.filter((sa: StudentAssessment) => sa.status === 'graded');
      const avgScore = gradedSubs.length > 0
        ? gradedSubs.reduce((sum: number, sa: StudentAssessment) => sum + (sa.percentage || 0), 0) / gradedSubs.length
        : 0;

      setStats({
        totalAssessments: data.length,
        todayCount: data.filter((a: Assessment) => {
          const sd = a.startTime;
          if (!sd) return false;
          const dateStr = typeof sd === 'string' ? sd : sd.toISOString();
          return dateStr.startsWith(today);
        }).length,
        upcomingCount: data.filter((a: Assessment) => {
          const sd = a.startTime;
          if (!sd) return false;
          const dateStr = typeof sd === 'string' ? sd : sd.toISOString();
          return dateStr > today && a.status === 'published';
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