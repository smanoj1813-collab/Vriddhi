// ═══════════════════════════════════════════════════════════════════════
// hooks/useSyllabusCurriculum.ts — Syllabus & Curriculum Hooks
// FIXED: Defensive API response checks, never let arrays become undefined
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/syllabusCurriculumApi';
import type {
  SyllabusExtract, ParsedCourse, CurriculumDoc, AssignCurriculumInput,
  CurriculumStats, ListSyllabusOptions, ListCurriculumOptions,
} from '../types/curriculum';

// ─── Helpers ────────────────────────────────────────────────────────────

function coerceArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  return [];
}

function coerceNumber(val: unknown): number {
  return typeof val === 'number' && !isNaN(val) ? val : 0;
}

// ─── Hooks ──────────────────────────────────────────────────────────────

export function useSyllabusExtract(extractId: string | null) {
  const [extract, setExtract] = useState<SyllabusExtract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!extractId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSyllabusExtractById(extractId);
      setExtract(data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extract');
    } finally {
      setLoading(false);
    }
  }, [extractId]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateCourse = useCallback(async (courseId: string, updates: Partial<ParsedCourse>) => {
    if (!extractId) return;
    await api.updateExtractCourse(extractId, { courseId, updates });
    await refresh();
  }, [extractId, refresh]);

  const approve = useCallback(async () => {
    if (!extractId) return;
    await api.updateSyllabusExtractStatus(extractId, 'approved');
    await refresh();
  }, [extractId, refresh]);

  return { extract, setExtract, loading, error, refresh, updateCourse, approve };
}

export function useSyllabusExtracts(options: ListSyllabusOptions = {}) {
  const [items, setItems] = useState<SyllabusExtract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listSyllabusExtracts(options);
      // DEFENSIVE: coerce whatever the API returns into safe shapes
      const safeItems = coerceArray<SyllabusExtract>(result?.items);
      setItems(safeItems);
      setTotal(coerceNumber(result?.total));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extracts');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.collegeId, options.search, options.format, options.limit]);

  useEffect(() => { refresh(); }, [refresh]);

  const approveExtract = useCallback(async (id: string) => {
    try {
      await api.updateSyllabusExtractStatus(id, 'approved');
    } catch (e) {
      console.error('approveExtract failed:', e);
    }
    await refresh();
  }, [refresh]);

  return { items, extracts: items, loading, error, refresh, total, approveExtract };
}

export function useCurriculumDocs(options: ListCurriculumOptions = {}) {
  const [items, setItems] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listCurriculumDocs(options);
      setItems(coerceArray<CurriculumDoc>(result?.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum docs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [options.collegeId, options.status, options.limit]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, error, refresh };
}

export function useCurriculumAssignment() {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = useCallback(async (input: AssignCurriculumInput) => {
    setAssigning(true);
    setError(null);
    try {
      const result = await api.assignCurriculumToCollege(input);
      return result ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
      return null;
    } finally {
      setAssigning(false);
    }
  }, []);

  return { assign, assigning, error };
}

export function useCurriculumStats() {
  const [stats, setStats] = useState<CurriculumStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCurriculumStats();
      // DEFENSIVE: ensure all required fields exist even if API is partial
      setStats({
        totalExtracts: coerceNumber(data?.totalExtracts),
        pendingReview: coerceNumber(data?.pendingReview),
        approved: coerceNumber(data?.approved),
        assigned: coerceNumber(data?.assigned),
        totalCourses: coerceNumber(data?.totalCourses),
        totalModules: coerceNumber(data?.totalModules),
        averageConfidence: coerceNumber(data?.averageConfidence),
        byFormat: data?.byFormat && typeof data.byFormat === 'object' ? data.byFormat : {},
        byStatus: data?.byStatus && typeof data.byStatus === 'object' ? data.byStatus : {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}