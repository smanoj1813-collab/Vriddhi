import { useState, useEffect } from 'react';

export interface TestCard {
  id: string;
  title: string;
  subject: string;
  duration: number;
  totalMarks: number;
  scheduledDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface CompletedTest {
  id: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  completedAt: string;
}

export interface UseStudentTestsReturn {
  testCards: TestCard[];
  completedTests: CompletedTest[];
  loading: boolean;
  error: string | null;
}

export function useStudentTests(collegeId?: string, studentId?: string): UseStudentTestsReturn {
  const [testCards, setTestCards] = useState<TestCard[]>([]);
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from API
    setLoading(false);
  }, [collegeId, studentId]);

  return { testCards, completedTests, loading, error };
}

export default useStudentTests;
