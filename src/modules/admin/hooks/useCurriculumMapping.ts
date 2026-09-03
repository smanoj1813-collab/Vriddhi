// ═══════════════════════════════════════════════════════════════════════
// hooks/useCurriculumMapping.ts — Admin: Map curriculum to faculty & schedule
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/Firebase/config';
import {
  collection, getDocs, query, where,
} from 'firebase/firestore';

import type {
  CurriculumDoc,
  ParsedCourse,
  CurriculumFacultyMapping,
  CreateMappingInput,
  UpdateMappingInput,
  MappingFilterOptions,
} from '@/shared/types/curriculum';

import {
  createMapping,
  listMappings,
  updateMapping,
  deleteMapping,
  bulkCreateMappings,
  getMappingStats,
} from '../api/curriculumMappingApi';

import { listCurriculumDocs } from '../../../modules/superadmin/api/curriculumApi';

// ─── Faculty type from Firestore ───────────────────────────────────────
export interface FacultyOption {
  id: string;
  name: string;
  email: string;
  department: string;
  firstName?: string;
  lastName?: string;
  /** Subjects the faculty can teach (UG + PG). Used to guide course mapping,
   *  NOT to restrict — a faculty may teach across branches/batches/years. */
  subjectsUG?: unknown[];
  subjectsPG?: unknown[];
}

// ─── Hook: Admin Curriculum Mapping ────────────────────────────────────

export function useCurriculumMapping(collegeId: string | undefined) {
  const [curriculumList, setCurriculumList] = useState<CurriculumDoc[]>([]);
  const [mappings, setMappings] = useState<CurriculumFacultyMapping[]>([]);
  const [facultyList, setFacultyList] = useState<FacultyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalMappings: number;
    activeMappings: number;
    facultyCount: number;
    courseCount: number;
    byBranch: Record<string, number>;
    bySemester: Record<string, number>;
  } | null>(null);

  // Filters
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  // ─── Fetch Faculty List ──────────────────────────────────────────────
  const fetchFaculty = useCallback(async () => {
    if (!collegeId) return;
    try {
      // FIX: single-equality query + client-side filter/sort (no composite index)
      const q = query(collection(db, 'faculty'), where('collegeId', '==', collegeId));
      const snap = await getDocs(q);
      const list = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.name || 'Unknown',
            email: data.email || '',
            department: data.department || 'General',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            subjectsUG: Array.isArray(data.subjectsUG) ? data.subjectsUG : [],
            subjectsPG: Array.isArray(data.subjectsPG) ? data.subjectsPG : [],
            status: data.status || 'active',
          } as FacultyOption & { status: string };
        })
        .filter(f => f.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name));
      setFacultyList(list);
    } catch (err) {
      console.error('Error fetching faculty:', err);
    }
  }, [collegeId]);

  // ─── Fetch Curriculum List ───────────────────────────────────────────
  const fetchCurriculum = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const result = await listCurriculumDocs({ collegeId, status: 'active', limit: 100 });
      setCurriculumList(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  // ─── Fetch Mappings ──────────────────────────────────────────────────
  const fetchMappings = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true);
    setError(null);
    try {
      const opts: MappingFilterOptions = { collegeId, status: 'active' };
      if (selectedCurriculum !== 'all') opts.curriculumId = selectedCurriculum;
      if (selectedBranch !== 'all') opts.branch = selectedBranch;
      if (selectedSemester !== 'all') opts.semester = selectedSemester;
      if (selectedBatch !== 'all') opts.batch = selectedBatch;

      const items = await listMappings(opts);
      setMappings(items);

      // Fetch stats
      const statData = await getMappingStats(collegeId);
      setStats(statData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load mappings');
    } finally {
      setLoading(false);
    }
  }, [collegeId, selectedCurriculum, selectedBranch, selectedSemester, selectedBatch]);

  // ─── Initial Load ────────────────────────────────────────────────────
  useEffect(() => {
    if (collegeId) {
      fetchFaculty();
      fetchCurriculum();
    }
  }, [collegeId, fetchFaculty, fetchCurriculum]);

  useEffect(() => {
    if (collegeId) {
      fetchMappings();
    }
  }, [collegeId, fetchMappings]);

  // ─── Create Mapping ──────────────────────────────────────────────────
  const assignFaculty = useCallback(async (
    curriculum: CurriculumDoc,
    course: ParsedCourse,
    faculty: FacultyOption,
    batch: string,
    division?: string,
    section?: string,
    assignedBy?: string
  ) => {
    setError(null);
    try {
      const input: CreateMappingInput = {
        curriculumId: curriculum.id,
        collegeId: curriculum.collegeId,
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyEmail: faculty.email || null,
        branch: course.branch,
        semester: course.semester,
        batch,
        division: division || null,
        section: section || null,
        totalHours: course.totalHours,
        credits: course.credits,
        modulesCount: course.modules.length,
        assignedBy: assignedBy || '',
      };
      const result = await createMapping(input);
      setMappings(prev => [result, ...prev]);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign faculty');
      return null;
    }
  }, []);

  // ─── Update Mapping ──────────────────────────────────────────────────
  const updateFacultyAssignment = useCallback(async (mappingId: string, updates: UpdateMappingInput) => {
    setError(null);
    try {
      const result = await updateMapping(mappingId, updates);
      setMappings(prev => prev.map(m => m.id === mappingId ? result : m));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update assignment');
      return null;
    }
  }, []);

  // ─── Remove Mapping ──────────────────────────────────────────────────
  const removeMapping = useCallback(async (mappingId: string) => {
    setError(null);
    try {
      await deleteMapping(mappingId);
      setMappings(prev => prev.map(m => m.id === mappingId ? { ...m, status: 'removed' } : m));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
      return false;
    }
  }, []);

  // ─── Bulk Assign ─────────────────────────────────────────────────────
  const bulkAssign = useCallback(async (inputs: CreateMappingInput[]) => {
    setError(null);
    try {
      const results = await bulkCreateMappings(inputs);
      setMappings(prev => [...results, ...prev]);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk assign');
      return [];
    }
  }, []);

  // ─── Get unmapped courses for a curriculum ───────────────────────────
  const getUnmappedCourses = useCallback((curriculum: CurriculumDoc): ParsedCourse[] => {
    const mappedCourseIds = new Set(
      mappings
        .filter(m => m.curriculumId === curriculum.id && m.status === 'active')
        .map(m => m.courseId)
    );
    return curriculum.courses.filter(c => !mappedCourseIds.has(c.id));
  }, [mappings]);

  // ─── Get mappings for a specific curriculum ──────────────────────────
  const getCurriculumMappings = useCallback((curriculumId: string): CurriculumFacultyMapping[] => {
    return mappings.filter(m => m.curriculumId === curriculumId && m.status === 'active');
  }, [mappings]);

  // ─── Subjects a faculty can teach (normalized, de-duplicated) ────────
  // Subject entries may be plain strings ("Financial Accounting") or objects
  // ({ name, code }). Normalize both into a clean list of subject names.
  const getFacultySubjects = useCallback((facultyId: string): string[] => {
    const f = facultyList.find(x => x.id === facultyId);
    if (!f) return [];

    const normalize = (s: unknown): string => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        return String(o.name || o.subjectName || o.code || '').trim();
      }
      return '';
    };

    const seen = new Set<string>();
    const out: string[] = [];
    [...(f.subjectsUG || []), ...(f.subjectsPG || [])].forEach(s => {
      const name = normalize(s);
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        out.push(name);
      }
    });
    return out;
  }, [facultyList]);

  // ─── Derived options ─────────────────────────────────────────────────
  const branches = useCallback(() => {
    const set = new Set<string>();
    curriculumList.forEach(c => set.add(c.branch));
    return Array.from(set).sort();
  }, [curriculumList]);

  const semesters = useCallback(() => {
    const set = new Set<number>();
    curriculumList.forEach(c => set.add(c.semester));
    return Array.from(set).sort((a, b) => a - b);
  }, [curriculumList]);

  const batches = useCallback(() => {
    const set = new Set<string>();
    mappings.forEach(m => set.add(m.batch));
    // Also add common batches if empty
    if (set.size === 0) {
      ['2023-2024', '2024-2025', '2025-2026'].forEach(b => set.add(b));
    }
    return Array.from(set).sort();
  }, [mappings]);

  return {
    // Data
    curriculumList,
    mappings,
    facultyList,
    stats,
    loading,
    error,

    // Filters
    selectedCurriculum,
    setSelectedCurriculum,
    selectedBranch,
    setSelectedBranch,
    selectedSemester,
    setSelectedSemester,
    selectedBatch,
    setSelectedBatch,

    // Actions
    assignFaculty,
    updateFacultyAssignment,
    removeMapping,
    bulkAssign,
    refresh: fetchMappings,
    refreshCurriculum: fetchCurriculum,
    refreshFaculty: fetchFaculty,

    // Helpers
    getUnmappedCourses,
    getCurriculumMappings,
    getFacultySubjects,
    branches: branches(),
    semesters: semesters(),
    batches: batches(),
  };
}