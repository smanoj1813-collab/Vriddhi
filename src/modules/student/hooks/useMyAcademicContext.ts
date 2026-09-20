// src/modules/student/hooks/useMyAcademicContext.ts
// ------------------------------------------------------------------
// The signed-in student's deterministic academic context, served by the
// `getMyStudentAcademicContext` callable (asia-south1).
//
// The callable is the single source of truth: it resolves the linked student
// profile, checks the college linkage, filters classes/assignments/tests by
// the student's cohort targeting, and computes the attendance summary
// server-side. Nothing here re-derives those figures from Firestore, and
// nothing calls an AI — when the backend feature gate is off
// (`{ enabled: false }`) the hook reports `disabled` and the UI quietly
// hides the surface instead of breaking.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { fetchMyStudentAcademicContext } from '@/shared/api/academicContextApi';
import type { StudentAcademicContext, StudentAcademicContextResponse } from '@/shared/api/academicContext';
// Same aliased specifier the faculty hooks use, so the render-check stub of
// AuthContext applies here too.
import { useAuth } from '@/modules/auth/context/AuthContext';

export interface UseMyAcademicContextResult {
  /** The typed context when enabled and loaded, otherwise null. */
  context: StudentAcademicContext | null;
  /** True when the backend answered `{ enabled: false }` (feature gate off). */
  disabled: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMyAcademicContext(date?: string): UseMyAcademicContextResult {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [response, setResponse] = useState<StudentAcademicContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyStudentAcademicContext(date ? { date } : {});
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your academic summary could not be loaded.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  // Only students with a resolved authenticated identity can call the
  // callable; anything else would be a guaranteed unauthenticated rejection.
  const isStudent = String(user?.role || '') === 'student';

  useEffect(() => {
    if (authLoading || !isAuthenticated || !isStudent) return;
    void load();
  }, [authLoading, isAuthenticated, isStudent, load]);

  const refetch = useCallback(() => {
    if (authLoading || !isAuthenticated || !isStudent) return;
    void load();
  }, [authLoading, isAuthenticated, isStudent, load]);

  return {
    context: response && response.enabled ? response.context : null,
    disabled: response ? !response.enabled : false,
    loading: authLoading ? false : loading,
    error,
    refetch,
  };
}

export default useMyAcademicContext;
