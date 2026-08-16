// src/modules/student/hooks/useStudentTests.ts
import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy, getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type { StudentTestCard, TestStatus } from '../types/assessment';

export interface UseStudentTestsReturn {
  tests: StudentTestCard[];
  upcomingTests: StudentTestCard[];
  availableTests: StudentTestCard[];
  completedTests: StudentTestCard[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
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

      const q = query(
        collection(db, 'studentAssessments'),
        where('collegeId', '==', collegeId),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const now = new Date();

      const items: StudentTestCard[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const startDate = data.startDateTime ? new Date(data.startDateTime) : null;
        const endDate = data.endDateTime ? new Date(data.endDateTime) : null;

        let testStatus: TestStatus = 'upcoming';
        let canStart = false;

        if (data.status === 'graded' || data.status === 'submitted') {
          testStatus = 'completed';
        } else if (data.status === 'in_progress') {
          testStatus = 'ongoing';
          canStart = true;
        } else if (startDate && endDate) {
          if (now < startDate) {
            testStatus = 'upcoming';
          } else if (now >= startDate && now <= endDate) {
            testStatus = 'available';
            canStart = data.status === 'not_started';
          } else {
            testStatus = 'missed';
          }
        }

        items.push({
          id: docSnap.id,
          assessmentId: data.assessmentId || '',
          title: data.title || 'Untitled Test',
          subject: data.subject || '',
          courseCode: data.courseCode || '',
          courseName: data.courseName || '',
          totalMarks: data.totalMarks || 0,
          duration: data.duration || 0,
          startDateTime: data.startDateTime || '',
          endDateTime: data.endDateTime || '',
          status: testStatus,
          studentStatus: data.status || 'not_started',
          canStart,
          instructions: data.instructions || [],
          totalQuestions: data.totalQuestions || 0,
          marksObtained: data.marksObtained,
          percentage: data.percentage,
          grade: data.grade,
          timeSpent: data.timeSpent,
          submittedAt: data.submittedAt,
          paperId: data.paperId || '',
          collegeId: data.collegeId || '',
          branch: data.branch || '',
          batch: data.batch || '',
          semester: data.semester || 0,
          division: data.division,
          section: data.section,
        });
      }

      setTests(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upcomingTests = tests.filter((t) => t.status === 'upcoming');
  const availableTests = tests.filter((t) => t.status === 'available' || t.status === 'ongoing');
  const completedTests = tests.filter((t) => t.status === 'completed' || t.status === 'graded');

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