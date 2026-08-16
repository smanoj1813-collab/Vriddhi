// ═══════════════════════════════════════════════════════════════════════
// hooks/useCurriculum.ts — Legacy Curriculum/Topics + Syllabus Parser Lists
// FIXED: Defensive API response checks, ensure arrays never undefined
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/Firebase/config';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, limit, Timestamp,
} from 'firebase/firestore';

import type {
  SyllabusExtract, CurriculumDoc, AssignCurriculumInput,
  CurriculumStats, ListSyllabusOptions, ListCurriculumOptions,
} from '../types/curriculum';

// ═══════════════════════════════════════════════════════════════════════
// LEGACY: Curriculum & Topics (for pages/Curriculum.tsx)
// ═══════════════════════════════════════════════════════════════════════

export interface Curriculum {
  id: string;
  course: string;
  semester: number;
  subjects: string[];
  uploadedAt: string;
  status: 'active' | 'inactive' | 'archived';
}

export interface Topic {
  id: string;
  name: string;
  subject: string;
  course: string;
  semester: number;
  questionCount?: number;
  status: 'active' | 'archived';
}

export function useCurriculum() {
  const [loading, setLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [curriculumSnap, topicsSnap] = await Promise.all([
        getDocs(collection(db, 'curriculum')),
        getDocs(collection(db, 'topics')),
      ]);
      setCurriculum(curriculumSnap.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum)));
      setTopics(topicsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Topic)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  const uploadCurriculum = useCallback(async (course: string, semester: number, subjects: string[]) => {
    await addDoc(collection(db, 'curriculum'), {
      course, semester, subjects,
      uploadedAt: new Date().toISOString(),
      status: 'active',
    });
    await refreshData();
  }, [refreshData]);

  const addTopic = useCallback(async (data: Omit<Topic, 'id'>) => {
    await addDoc(collection(db, 'topics'), {
      ...data,
      createdAt: new Date().toISOString(),
    });
    await refreshData();
  }, [refreshData]);

  const editTopic = useCallback(async (id: string, updates: Partial<Topic>) => {
    await updateDoc(doc(db, 'topics', id), { ...updates, updatedAt: new Date().toISOString() });
    await refreshData();
  }, [refreshData]);

  const deleteTopic = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'topics', id), { status: 'archived', updatedAt: new Date().toISOString() });
    await refreshData();
  }, [refreshData]);

  const restoreTopicById = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'topics', id), { status: 'active', updatedAt: new Date().toISOString() });
    await refreshData();
  }, [refreshData]);

  return { loading, curriculum, topics, refreshData, uploadCurriculum, addTopic, editTopic, deleteTopic, restoreTopicById };
}

// ═══════════════════════════════════════════════════════════════════════
// SYLLABUS PARSER: List hooks (for components/superadmin/SuperAdminCurriculum.tsx)
// FIXED: Never let items become undefined; coerce API results to arrays
// ═══════════════════════════════════════════════════════════════════════

function coerceArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val;
  return [];
}

export function useSyllabusList(options: ListSyllabusOptions = {}) {
  const [items, setItems] = useState<SyllabusExtract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q: any = query(collection(db, 'syllabusExtracts'), orderBy('extractedAt', 'desc'), limit(options.limit || 50));
      if (options.status && options.status !== 'all') {
        q = query(collection(db, 'syllabusExtracts'), where('status', '==', options.status), orderBy('extractedAt', 'desc'), limit(options.limit || 50));
      }
      const snap = await getDocs(q);
      const mapped = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as SyllabusExtract));
      setItems(coerceArray(mapped));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load syllabus list');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.limit]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, error, refresh };
}

export function useCurriculumList(options: ListCurriculumOptions = {}) {
  const [items, setItems] = useState<CurriculumDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q: any = query(collection(db, 'curriculum'), where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(options.limit || 50));
      if (options.collegeId) {
        q = query(collection(db, 'curriculum'), where('collegeId', '==', options.collegeId), where('status', '==', 'active'));
      }
      const snap = await getDocs(q);
      const mapped = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as CurriculumDoc));
      setItems(coerceArray(mapped));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load curriculum list');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [options.collegeId, options.status, options.limit]);

  useEffect(() => { refresh(); }, [refresh]);
  return { items, loading, error, refresh };
}

export function useCurriculumStats() {
  const [stats, setStats] = useState<CurriculumStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const extractsSnap = await getDocs(collection(db, 'syllabusExtracts'));
      const extracts = extractsSnap.docs.map((d: any) => d.data());
      const byFormat: Record<string, number> = { docx: 0, pdf: 0, txt: 0 };
      const byStatus: Record<string, number> = { parsing: 0, review: 0, approved: 0, assigned: 0, archived: 0 };
      let totalCourses = 0, totalModules = 0, confidenceSum = 0;
      for (const e of extracts) {
        const fmt = e?.format || 'docx';
        const st = e?.status || 'review';
        byFormat[fmt] = (byFormat[fmt] || 0) + 1;
        byStatus[st] = (byStatus[st] || 0) + 1;
        totalCourses += e?.totalCourses || 0;
        totalModules += e?.totalModules || 0;
        confidenceSum += e?.confidenceScore || 0;
      }
      setStats({
        totalExtracts: extracts.length,
        pendingReview: byStatus.review || 0,
        approved: byStatus.approved || 0,
        assigned: byStatus.assigned || 0,
        totalCourses,
        totalModules,
        averageConfidence: extracts.length > 0 ? Math.round(confidenceSum / extracts.length) : 0,
        byFormat,
        byStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      // Keep previous stats on error, don't wipe them
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { stats, loading, error, refresh };
}

export function useCurriculumAssignment() {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assign = useCallback(async (input: AssignCurriculumInput) => {
    setAssigning(true);
    setError(null);
    try {
      const extractSnap = await getDocs(query(collection(db, 'syllabusExtracts'), where('__name__', '==', input.syllabusExtractId)));
      if (extractSnap.empty) throw new Error('Extract not found');
      const extract = extractSnap.docs[0].data();
      const now = Timestamp.now();
      const allCourses = Array.isArray(extract.courses) ? extract.courses : [];
      const selectedCourses = input.selectedCourseIds
        ? allCourses.filter((c: any) => input.selectedCourseIds?.includes(c?.id))
        : allCourses;
      if (selectedCourses.length === 0) throw new Error('No courses selected');
      const firstCourse = selectedCourses[0] || {};
      const totalModules = selectedCourses.reduce((sum: number, c: any) => sum + (Array.isArray(c?.modules) ? c.modules.length : 0), 0);
      const totalHours = selectedCourses.reduce((sum: number, c: any) => sum + (c?.totalHours || 0), 0);
      const totalMarks = selectedCourses.reduce((sum: number, c: any) => sum + (c?.totalMarks || 0), 0);
      await addDoc(collection(db, 'curriculum'), {
        collegeId: input.collegeId,
        collegeName: input.collegeName,
        syllabusExtractId: input.syllabusExtractId,
        title: `${firstCourse?.branch || 'Curriculum'} - Semester ${firstCourse?.semester || ''}`,
        description: input.reviewNotes || null,
        scheme: firstCourse?.scheme || '',
        branch: firstCourse?.branch || '',
        semester: firstCourse?.semester || 0,
        courses: selectedCourses,
        totalCourses: selectedCourses.length,
        totalModules,
        totalHours,
        totalMarks,
        status: 'active',
        createdBy: extract.extractedBy || '',
        assignedBy: extract.extractedBy || '',
        assignedAt: now,
        createdAt: now,
      });
      await updateDoc(doc(db, 'syllabusExtracts', input.syllabusExtractId), {
        status: 'assigned',
        collegeId: input.collegeId,
        collegeName: input.collegeName,
        assignedAt: now,
        updatedAt: now,
      });
      return { id: 'assigned', collegeId: input.collegeId } as CurriculumDoc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
      return null;
    } finally {
      setAssigning(false);
    }
  }, []);

  return { assign, assigning, error };
}

export function useDeleteExtract() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteExtract = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'syllabusExtracts', id), { status: 'archived', updatedAt: Timestamp.now() });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteExtract, loading, error };
}