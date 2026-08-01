import { useState, useEffect } from 'react';
import type { TestCard } from './useStudentTests';

export interface UseActiveTestReturn {
  activeTest: TestCard | null;
  loading: boolean;
  error: string | null;
}

export function useActiveTest(collegeId?: string, studentId?: string): UseActiveTestReturn {
  const [activeTest, setActiveTest] = useState<TestCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
  }, [collegeId, studentId]);

  return { activeTest, loading, error };
}

export default useActiveTest;
