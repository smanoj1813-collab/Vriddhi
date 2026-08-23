// src/modules/student/hooks/useTestResult.ts
// Thin adapter over the Phase 2 engine (api/testApi.fetchTestResult).
import { useState, useEffect, useCallback } from 'react';
import { fetchTestResult } from '../api/testApi';
import type { TestResultDetail } from '../types/assessment';

export interface UseTestResultReturn {
  result: (TestResultDetail & {
    pendingManualGrading?: boolean;
    autoScore?: number;
    autoMax?: number;
    manualPending?: boolean;
  }) | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useTestResult = (
  collegeId?: string,
  testId?: string,
  studentId?: string
): UseTestResultReturn => {
  const [result, setResult] = useState<UseTestResultReturn['result']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!testId || !studentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const detail = await fetchTestResult(collegeId || '', testId, studentId);
      if (!detail) {
        setError('No submission found for this test yet.');
        setResult(null);
      } else {
        setResult(detail as NonNullable<UseTestResultReturn['result']>);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load result');
    } finally {
      setLoading(false);
    }
  }, [collegeId, testId, studentId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { result, loading, error, refresh: fetchData };
};

export default useTestResult;
