import { useState, useEffect } from 'react';

export interface TestResult {
  id: string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  sectionScores: any[];
  timeTaken: number;
}

export interface UseTestResultReturn {
  result: TestResult | null;
  loading: boolean;
  error: string | null;
}

export function useTestResult(collegeId?: string, testId?: string, studentId?: string): UseTestResultReturn {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from API
    setLoading(false);
  }, [collegeId, testId, studentId]);

  return { result, loading, error };
}

export default useTestResult;
