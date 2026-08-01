// ═══════════════════════════════════════════════════════════════════════
// hooks/useSyllabusCurriculum.ts — Syllabus & Curriculum Hooks
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/syllabusCurriculumApi';
import type {
  SyllabusExtract, ParsedCourse, CurriculumDoc, AssignCurriculumInput,
  CurriculumStats, ListSyllabusOptions, ListCurriculumOptions,
} from '../types/curriculum';

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
      setExtract(data);
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
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load extracts');
    } finally {
      setLoading(false);
    }
  }, [options.status, options.collegeId, options.search, options.format, options.limit]);

  useEffect(() => { refresh(); }, [refresh]);

  const approveExtract = useCallback(async (id: string) => {
    await api.updateSyllabusExtractStatus(id, 'approved');
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
      setItems(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum docs');
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
      return result;
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
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}
