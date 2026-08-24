// src/hooks/useStudentIndex.ts
// ============================================================
// React Hook — Student Index CRUD + Bulk Import + Stats
// ============================================================

import { useState, useCallback, useRef } from 'react';
import {
  getStudentIndex,
  getStudentByRegNo,
  listStudentIndex,
  searchStudentIndex,
  upsertStudentIndex,
  deactivateStudentIndex,
  deleteStudentIndex,
  deleteAllStudentIndex,
  importStudentIndexBulk,
  getStudentIndexStats,
} from '../api/studentIndexApi';
import type {
  StudentIndex,
  StudentImportRow,
  StudentImportResult,
  StudentIndexFilter,
  StudentIndexListItem,
  StudentIndexStats,
} from '../types/students';

export type IndexPhase = 'idle' | 'loading' | 'importing' | 'deleting' | 'done' | 'error';

interface UseStudentIndexReturn {
  phase: IndexPhase;
  loading: boolean;
  error: string | null;
  progress: number;
  student: StudentIndex | null;
  items: StudentIndexListItem[];
  stats: StudentIndexStats | null;
  importResult: StudentImportResult | null;
  fetchStudent: (collegeId: string, studentId: string) => Promise<void>;
  fetchByRegNo: (collegeId: string, regNo: string) => Promise<void>;
  fetchList: (filter: StudentIndexFilter) => Promise<void>;
  fetchNextPage: (filter: StudentIndexFilter) => Promise<void>;
  search: (collegeId: string, term: string) => Promise<void>;
  createOrUpdate: (collegeId: string, studentId: string, data: Partial<StudentIndex>) => Promise<void>;
  deactivate: (collegeId: string, studentId: string) => Promise<void>;
  remove: (collegeId: string, studentId: string) => Promise<void>;
  removeAll: (collegeId: string) => Promise<number>;
  importBulk: (collegeId: string, rows: StudentImportRow[]) => Promise<void>;
  reimportAll: (collegeId: string, rows: StudentImportRow[]) => Promise<void>;
  fetchStats: (collegeId: string) => Promise<void>;
  reset: () => void;
}

export function useStudentIndex(): UseStudentIndexReturn {
  const [phase, setPhase] = useState<IndexPhase>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [student, setStudent] = useState<StudentIndex | null>(null);
  const [items, setItems] = useState<StudentIndexListItem[]>([]);
  const [stats, setStats] = useState<StudentIndexStats | null>(null);
  const [importResult, setImportResult] = useState<StudentImportResult | null>(null);
  const lastDocRef = useRef<any>(null);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current = false;
    setPhase('idle');
    setLoading(false);
    setError(null);
    setProgress(0);
    setStudent(null);
    setItems([]);
    setStats(null);
    setImportResult(null);
    lastDocRef.current = null;
  }, []);

  const wrap = useCallback(
    async <T,>(fn: () => Promise<T>, phaseLabel: IndexPhase = 'loading'): Promise<T | undefined> => {
      setLoading(true);
      setPhase(phaseLabel);
      setError(null);
      try {
        const res = await fn();
        setPhase('done');
        return res;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Operation failed';
        setError(msg);
        setPhase('error');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchStudent = useCallback(async (collegeId: string, studentId: string) => {
    const res = await wrap(() => getStudentIndex(collegeId, studentId));
    if (res) setStudent(res);
  }, [wrap]);

  const fetchByRegNo = useCallback(async (collegeId: string, regNo: string) => {
    const res = await wrap(() => getStudentByRegNo(collegeId, regNo));
    if (res) setStudent(res);
  }, [wrap]);

  const fetchList = useCallback(async (filter: StudentIndexFilter) => {
    lastDocRef.current = null;
    const res = await wrap(() => listStudentIndex(filter));
    if (res) {
      setItems(res.items);
      lastDocRef.current = res.lastDoc;
    }
  }, [wrap]);

  const fetchNextPage = useCallback(async (filter: StudentIndexFilter) => {
    const res = await wrap(() => listStudentIndex(filter, lastDocRef.current));
    if (res) {
      setItems((prev) => [...prev, ...res.items]);
      lastDocRef.current = res.lastDoc;
    }
  }, [wrap]);

  const search = useCallback(async (collegeId: string, term: string) => {
    const res = await wrap(() => searchStudentIndex(collegeId, term));
    if (res) setItems(res);
  }, [wrap]);

  const createOrUpdate = useCallback(async (collegeId: string, studentId: string, data: Partial<StudentIndex>) => {
    await wrap(() => upsertStudentIndex(collegeId, studentId, data));
  }, [wrap]);

  const deactivate = useCallback(async (collegeId: string, studentId: string) => {
    await wrap(() => deactivateStudentIndex(collegeId, studentId));
  }, [wrap]);

  const remove = useCallback(async (collegeId: string, studentId: string) => {
    await wrap(() => deleteStudentIndex(collegeId, studentId));
    setItems((prev) => prev.filter((i) => i.id !== studentId));
  }, [wrap]);

  const removeAll = useCallback(async (collegeId: string) => {
    setPhase('deleting');
    setProgress(0);
    const count = await deleteAllStudentIndex(collegeId);
    setItems([]);
    setPhase('done');
    return count;
  }, []);

  const importBulk = useCallback(async (collegeId: string, rows: StudentImportRow[]) => {
    reset();
    abortRef.current = false;
    setPhase('importing');
    setProgress(10);
    try {
      const res = await importStudentIndexBulk(collegeId, rows, { skipExisting: true });
      if (abortRef.current) return;
      setProgress(100);
      setImportResult(res);
      setPhase(res.failed > 0 ? 'error' : 'done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setPhase('error');
    }
  }, [reset]);

  const reimportAll = useCallback(async (collegeId: string, rows: StudentImportRow[]) => {
    reset();
    abortRef.current = false;
    setPhase('deleting');
    setProgress(5);
    try {
      await deleteAllStudentIndex(collegeId);
      if (abortRef.current) return;
      setProgress(20);
      setPhase('importing');
      const res = await importStudentIndexBulk(collegeId, rows, { skipExisting: false });
      if (abortRef.current) return;
      setProgress(100);
      setImportResult(res);
      setPhase(res.failed > 0 ? 'error' : 'done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-import failed');
      setPhase('error');
    }
  }, [reset]);

  const fetchStats = useCallback(async (collegeId: string) => {
    const res = await wrap(() => getStudentIndexStats(collegeId));
    if (res) setStats(res);
  }, [wrap]);

  return {
    phase,
    loading,
    error,
    progress,
    student,
    items,
    stats,
    importResult,
    fetchStudent,
    fetchByRegNo,
    fetchList,
    fetchNextPage,
    search,
    createOrUpdate,
    deactivate,
    remove,
    removeAll,
    importBulk,
    reimportAll,
    fetchStats,
    reset,
  };
}