// src/modules/faculty/hooks/useFacultyAcademicContext.ts
// ------------------------------------------------------------------
// The college-scoped deterministic planning context for academic staff,
// served by the `getFacultyAcademicContext` callable (asia-south1).
//
// Role + college scope are enforced server-side (faculty, HOD, principal,
// admin, superadmin — the callable rejects anyone else), so the hook's job
// is to (a) only fire once the auth identity has resolved, (b) re-fetch when
// the optional course filter changes, and (c) surface the `{ enabled:false }`
// feature-gate result as a normal state instead of an error.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { fetchFacultyAcademicContext } from '@/shared/api/academicContextApi';
import type { FacultyAcademicContext, FacultyAcademicContextResponse } from '@/shared/api/academicContext';
import { useAuth } from '@/modules/auth/context/AuthContext';

/** Roles the backend accepts for the faculty context callable. */
const FACULTY_CONTEXT_ROLES = ['faculty', 'hod', 'principal', 'admin', 'superadmin'];

export interface UseFacultyAcademicContextResult {
  context: FacultyAcademicContext | null;
  /** True when the backend answered `{ enabled: false }` (feature gate off). */
  disabled: boolean;
  /** True when the signed-in role can never call this callable. */
  unauthorizedRole: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFacultyAcademicContext(
  courseId?: string,
  date?: string
): UseFacultyAcademicContextResult {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [response, setResponse] = useState<FacultyAcademicContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = String(user?.role || '');
  const roleAllowed = FACULTY_CONTEXT_ROLES.includes(role);
  const hasCollege = Boolean(user?.collegeId);
  // Admin/superadmin/principal may legitimately have no personal course
  // assignments; the callable still serves their college-wide scope.
  const canCall = isAuthenticated && roleAllowed && hasCollege;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFacultyAcademicContext({
        ...(courseId ? { courseId } : {}),
        ...(date ? { date } : {}),
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The faculty academic context could not be loaded.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, date]);

  useEffect(() => {
    if (authLoading || !canCall) return;
    void load();
  }, [authLoading, canCall, load]);

  const refetch = useCallback(() => {
    if (authLoading || !canCall) return;
    void load();
  }, [authLoading, canCall, load]);

  return {
    context: response && response.enabled ? response.context : null,
    disabled: response ? !response.enabled : false,
    unauthorizedRole: !authLoading && isAuthenticated && !roleAllowed,
    loading: authLoading ? false : loading,
    error,
    refetch,
  };
}

export default useFacultyAcademicContext;
