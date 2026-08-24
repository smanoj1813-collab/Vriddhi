// src/hooks/useFacultyStudentIndex.ts
// ============================================================
// Faculty Hook — Fetches students from Student Index
// Replaces/extends the stub useFacultyData
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  fetchFacultyStudentsUnified,
  fetchStudentsForClassSession,
  getFacultyStudentStats,
  getFacultyProfile,
} from '../api/facultyStudentIndexApi';
import type { FacultyStudent } from '../modules/faculty/types/attendance';

interface UseFacultyStudentIndexReturn {
  loading: boolean;
  error: string | null;
  students: FacultyStudent[];
  stats: {
    total: number;
    byDepartment: Record<string, number>;
    byBatch: Record<string, number>;
    byDivision: Record<string, number>;
  } | null;
  refetch: () => void;
}

export function useFacultyStudentIndex(
  facultyId: string | undefined,
  collegeId: string | undefined,
  opts?: {
    facultyName?: string;
    department?: string;
    batch?: number;
  }
): UseFacultyStudentIndexReturn {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [stats, setStats] = useState<UseFacultyStudentIndexReturn['stats']>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!facultyId || !collegeId) {
      setStudents([]);
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [studentList, studentStats] = await Promise.all([
        fetchFacultyStudentsUnified(facultyId, collegeId, opts),
        getFacultyStudentStats(facultyId, collegeId),
      ]);

      setStudents(studentList);
      setStats(studentStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [facultyId, collegeId, opts?.facultyName, opts?.department, opts?.batch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    error,
    students,
    stats,
    refetch: fetchData,
  };
}

/** Hook for fetching students for a specific class session */
export function useClassSessionStudents(
  collegeId: string | undefined,
  department: string | undefined,
  batch: number | undefined,
  division: string | undefined
) {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!collegeId || !department || !batch || !division) {
      setStudents([]);
      return;
    }

    setLoading(true);
    try {
      const list = await fetchStudentsForClassSession(collegeId, department, batch, division);
      setStudents(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [collegeId, department, batch, division]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}