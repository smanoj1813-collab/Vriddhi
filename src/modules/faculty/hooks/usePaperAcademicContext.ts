// src/modules/faculty/hooks/usePaperAcademicContext.ts
// ------------------------------------------------------------------
// Approved-question candidate context for the paper authoring workflow,
// served by the `getPaperAcademicContext` callable (asia-south1).
//
// The callable returns only APPROVED candidates plus course/blueprint
// metadata; the frontend normaliser additionally whitelists safe metadata
// fields (id, course code, module/topic ids, type, difficulty, Blooms level,
// last-used date) so question text and any restricted answer material can
// never reach this hook's consumers. Nothing here generates questions —
// generation stays with the existing deterministic bank pipeline.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { fetchPaperAcademicContext } from '@/shared/api/academicContextApi';
import type { PaperAcademicContext, PaperAcademicContextResponse } from '@/shared/api/academicContext';
import { useAuth } from '@/modules/auth/context/AuthContext';

const PAPER_CONTEXT_ROLES = ['faculty', 'hod', 'principal', 'admin', 'superadmin'];

export interface UsePaperAcademicContextResult {
  context: PaperAcademicContext | null;
  /** True when the backend answered `{ enabled: false }` (feature gate off). */
  disabled: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePaperAcademicContext(
  courseId: string | undefined,
  enabled = true
): UsePaperAcademicContextResult {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [response, setResponse] = useState<PaperAcademicContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCall =
    isAuthenticated &&
    enabled &&
    Boolean(courseId) &&
    PAPER_CONTEXT_ROLES.includes(String(user?.role || '')) &&
    Boolean(user?.collegeId);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPaperAcademicContext({ courseId });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The paper context could not be loaded.');
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (authLoading || !canCall) return;
    void load();
  }, [authLoading, canCall, load]);

  // A different course invalidates the previous context immediately.
  useEffect(() => {
    if (authLoading || !canCall) return;
    setResponse(null);
    setError(null);
  }, [courseId, authLoading, canCall]);

  const refetch = useCallback(() => {
    if (authLoading || !canCall) return;
    void load();
  }, [authLoading, canCall, load]);

  return {
    context: response && response.enabled ? response.context : null,
    disabled: response ? !response.enabled : false,
    loading: authLoading ? false : loading,
    error,
    refetch,
  };
}

export default usePaperAcademicContext;
