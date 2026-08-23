// src/modules/student/hooks/useStudentTests.ts
// Delegates to studentDataApi.fetchStudentTests (single source of truth) and
// maps to the StudentTestCard shape used by the test dashboard components.
import { useState, useEffect, useCallback } from 'react';
import { fetchStudentTests, type StudentTestCardData } from '../api/studentDataApi';
import type { StudentTestCard } from '../types/assessment';

export interface UseStudentTestsReturn {
  tests: StudentTestCard[];
  upcomingTests: StudentTestCard[];
  availableTests: StudentTestCard[];
  completedTests: StudentTestCard[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function toCard(t: StudentTestCardData): StudentTestCard {
  return {
    id: t.id,
    assessmentId: t.assessmentId,
    title: t.title,
    subject: t.subject,
    totalMarks: t.totalMarks,
    duration: t.duration,
    startDateTime: t.startDateTime,
    endDateTime: t.endDateTime,
    status: t.status,
    studentStatus: t.studentStatus as StudentTestCard['studentStatus'],
    canStart: t.canStart,
    instructions: [],
    totalQuestions: t.totalQuestions || 0,
    marksObtained: t.marksObtained,
    percentage: t.percentage,
    grade: t.grade,
    timeSpent: t.timeSpent,
    submittedAt: t.submittedAt,
    paperId: '',
    collegeId: '',
    branch: '',
    batch: '',
    semester: 0,
  };
}

export const useStudentTests = (
  collegeId?: string,
  studentId?: string
): UseStudentTestsReturn => {
  const [tests, setTests] = useState<StudentTestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId || !collegeId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const cards = await fetchStudentTests(collegeId, studentId);
      setTests(cards.map(toCard));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, studentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const upcomingTests = tests.filter((t) => t.status === 'upcoming');
  const availableTests = tests.filter(
    (t) => (t.status === 'available' || t.status === 'ongoing') && t.studentStatus !== 'submitted' && t.studentStatus !== 'graded'
  );
  const completedTests = tests.filter(
    (t) => t.status === 'completed' || t.status === 'graded' || t.studentStatus === 'submitted' || t.studentStatus === 'graded'
  );

  return {
    tests,
    upcomingTests,
    availableTests,
    completedTests,
    loading,
    error,
    refresh: fetchData,
  };
};

export default useStudentTests;
