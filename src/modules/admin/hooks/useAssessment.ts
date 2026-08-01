// hooks/useAssessment.ts
// ============================================
// UNIFIED ASSESSMENT HOOKS — Fixed for Vriddhi
// ============================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../auth/context/AuthContext';

// Firebase imports — ADJUST THIS PATH to match your project structure
let db: any;
try {
  const firebaseMod = require('../firebase');
  db = firebaseMod.db;
} catch {
  try {
    const firebaseMod = require('../config/firebase');
    db = firebaseMod.db;
  } catch {
    console.warn('[useAssessment] Firebase db import failed. Ensure firebase config path is correct.');
  }
}

import {
  doc, getDoc, getDocs, query, collection, where, orderBy,
  updateDoc, Timestamp, writeBatch
} from 'firebase/firestore';

import type {
  Assessment, StudentAssessment, StudentAnswer,
  CreateAssessmentInput, UpdateAssessmentInput,
  AssessmentFilterOptions, AssessmentStats, AssessmentSection,
  AIGenerationConfig, BulkGradeInput,
  AssessmentPaper, CreatePaperInput, PaperSection, PaperQuestion,
  ScheduledTest, ScheduleTestInput, ReviewQueueItem,
  StudentTestCard, TestResultSummary, TestAnalytics, TestNotification,
  ActiveTestState, QuestionType, PaperType,
} from '../types/assessment';

import type { FacultyCurriculumView } from '../../../../superadmin/types/curriculum';
import type { Question, QuestionFilters, PaginatedResult, BulkImportResult } from '../../admin/types/questionBank';

import {
  createAssessment, getAssessmentById, listAssessments, updateAssessment, deleteAssessment,
  publishAssessment, activateAssessment, completeAssessment, archiveAssessment,
  createStudentAssessment, getStudentAssessment, listStudentAssessments,
  submitAssessment, startAssessment, gradeAssessment, autoGradeStudentAssessment,
  bulkCreateStudentAssessments, bulkGradeAssessments, recalculateAssessmentStats,
  getAssessmentStats,
  getPendingReviews, approveQuestion, rejectQuestion, approvePaper, rejectPaper,
  createPaper, getPaperById, listPapers, updatePaper, deletePaper,
  scheduleTest, listScheduledTests, updateScheduledTest, deleteScheduledTest,
} from '../api/assessmentsApi';

import { getFacultyCurriculum } from '../api/curriculumMappingApi';
import { getQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion, getQuestionStats, generateQuestionsWithAI } from '../api/questions';

// ═══════════════════════════════════════════════════════════════════════
// useAssessment — Main Admin/Faculty Hook
// ═══════════════════════════════════════════════════════════════════════

export interface UseAssessmentReturn {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  studentAssessments: StudentAssessment[];
  currentStudentAssessment: StudentAssessment | null;
  stats: AssessmentStats | null;
  facultyCurriculum: FacultyCurriculumView[];
  availableQuestions: Question[];
  loading: boolean;
  error: string | null;
  filters: AssessmentFilterOptions;
  fetchAssessments: (overrideFilters?: AssessmentFilterOptions) => Promise<void>;
  fetchAssessmentById: (id: string) => Promise<Assessment | null>;
  createNewAssessment: (input: CreateAssessmentInput) => Promise<Assessment | null>;
  updateAssessmentById: (id: string, updates: UpdateAssessmentInput) => Promise<Assessment | null>;
  deleteAssessmentById: (id: string) => Promise<boolean>;
  publish: (id: string) => Promise<Assessment | null>;
  activate: (id: string) => Promise<Assessment | null>;
  complete: (id: string) => Promise<Assessment | null>;
  archive: (id: string) => Promise<Assessment | null>;
  fetchStats: () => Promise<void>;
  fetchStudentAssessments: (assessmentId: string) => Promise<void>;
  fetchStudentAssessment: (studentId: string, assessmentId: string) => Promise<StudentAssessment | null>;
  startStudentAssessment: (studentAssessmentId: string) => Promise<StudentAssessment | null>;
  submitStudentAssessment: (studentAssessmentId: string, answers: StudentAnswer[], timeSpent: number) => Promise<StudentAssessment | null>;
  gradeStudentAssessment: (studentAssessmentId: string, marksObtained: number, percentage: number, grade: string, gradePoint: number, feedback?: string, gradedBy?: string) => Promise<StudentAssessment | null>;
  autoGrade: (studentAssessmentId: string, questions: Question[]) => Promise<StudentAssessment | null>;
  bulkGrade: (inputs: BulkGradeInput[]) => Promise<void>;
  enrollStudents: (assessment: Assessment, students: Array<{ id: string; name: string; regNo: string }>) => Promise<StudentAssessment[]>;
  fetchFacultyCurriculum: (facultyId: string) => Promise<void>;
  fetchQuestionsForAssessment: (filters: QuestionFilters, limit?: number) => Promise<Question[]>;
  buildAssessmentSections: (config: AIGenerationConfig, existingQuestionIds?: string[]) => Promise<AssessmentSection[]>;
  generateAIQuestions: (config: AIGenerationConfig) => Promise<AssessmentSection[]>;
  setFilter: (key: keyof AssessmentFilterOptions, value: unknown) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
}

export function useAssessment(): UseAssessmentReturn {
  const { user } = useAuth();
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [studentAssessments, setStudentAssessments] = useState<StudentAssessment[]>([]);
  const [currentStudentAssessment, setCurrentStudentAssessment] = useState<StudentAssessment | null>(null);
  const [stats, setStats] = useState<AssessmentStats | null>(null);
  const [facultyCurriculum, setFacultyCurriculum] = useState<FacultyCurriculumView[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AssessmentFilterOptions>({});

  const fetchAssessments = useCallback(async (overrideFilters?: AssessmentFilterOptions) => {
    if (!collegeId) return;
    setLoading(true); setError(null);
    try {
      const merged = { collegeId, ...filters, ...overrideFilters };
      const data = await listAssessments(merged);
      setAssessments(data);
    } catch (err: any) { setError(err.message || 'Failed to fetch assessments'); }
    finally { setLoading(false); }
  }, [collegeId, filters]);

  const fetchAssessmentById = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const data = await getAssessmentById(id);
      setCurrentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message || 'Failed to fetch assessment'); return null; }
    finally { setLoading(false); }
  }, []);

  const createNewAssessment = useCallback(async (input: CreateAssessmentInput) => {
    setLoading(true); setError(null);
    try {
      const data = await createAssessment(input);
      setAssessments(prev => [data, ...prev]);
      setCurrentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message || 'Failed to create assessment'); return null; }
    finally { setLoading(false); }
  }, []);

  const updateAssessmentById = useCallback(async (id: string, updates: UpdateAssessmentInput) => {
    setLoading(true); setError(null);
    try {
      const data = await updateAssessment(id, updates);
      setAssessments(prev => prev.map(a => a.id === id ? data : a));
      if (currentAssessment?.id === id) setCurrentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message || 'Failed to update assessment'); return null; }
    finally { setLoading(false); }
  }, [currentAssessment]);

  const deleteAssessmentById = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      await deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
      if (currentAssessment?.id === id) setCurrentAssessment(null);
      return true;
    } catch (err: any) { setError(err.message || 'Failed to delete assessment'); return false; }
    finally { setLoading(false); }
  }, [currentAssessment]);

  const publish = useCallback(async (id: string) => {
    setLoading(true);
    try { const data = await publishAssessment(id); setAssessments(prev => prev.map(a => a.id === id ? data : a)); if (currentAssessment?.id === id) setCurrentAssessment(data); return data; }
    catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, [currentAssessment]);

  const activate = useCallback(async (id: string) => {
    setLoading(true);
    try { const data = await activateAssessment(id); setAssessments(prev => prev.map(a => a.id === id ? data : a)); if (currentAssessment?.id === id) setCurrentAssessment(data); return data; }
    catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, [currentAssessment]);

  const complete = useCallback(async (id: string) => {
    setLoading(true);
    try { const data = await completeAssessment(id); setAssessments(prev => prev.map(a => a.id === id ? data : a)); if (currentAssessment?.id === id) setCurrentAssessment(data); return data; }
    catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, [currentAssessment]);

  const archive = useCallback(async (id: string) => {
    setLoading(true);
    try { const data = await archiveAssessment(id); setAssessments(prev => prev.map(a => a.id === id ? data : a)); if (currentAssessment?.id === id) setCurrentAssessment(data); return data; }
    catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, [currentAssessment]);

  const fetchStats = useCallback(async () => {
    if (!collegeId) return;
    setLoading(true); setError(null);
    try { const data = await getAssessmentStats(collegeId); setStats(data); }
    catch (err: any) { setError(err.message || 'Failed to fetch stats'); }
    finally { setLoading(false); }
  }, [collegeId]);

  const fetchStudentAssessments = useCallback(async (assessmentId: string) => {
    setLoading(true); setError(null);
    try { const data = await listStudentAssessments({ assessmentId }); setStudentAssessments(data); }
    catch (err: any) { setError(err.message || 'Failed to fetch submissions'); }
    finally { setLoading(false); }
  }, []);

  const fetchStudentAssessment = useCallback(async (studentId: string, assessmentId: string) => {
    setLoading(true); setError(null);
    try {
      const data = await listStudentAssessments({ studentId, assessmentId });
      const sa = data[0] || null;
      setCurrentStudentAssessment(sa);
      return sa;
    } catch (err: any) { setError(err.message || 'Failed to fetch student assessment'); return null; }
    finally { setLoading(false); }
  }, []);

  const startStudentAssessment = useCallback(async (studentAssessmentId: string) => {
    setLoading(true);
    try {
      const data = await startAssessment(studentAssessmentId);
      setStudentAssessments(prev => prev.map(sa => sa.id === studentAssessmentId ? data : sa));
      setCurrentStudentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, []);

  const submitStudentAssessment = useCallback(async (studentAssessmentId: string, answers: StudentAnswer[], timeSpent: number) => {
    setLoading(true);
    try {
      const data = await submitAssessment(studentAssessmentId, answers, timeSpent);
      setStudentAssessments(prev => prev.map(sa => sa.id === studentAssessmentId ? data : sa));
      setCurrentStudentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, []);

  const gradeStudentAssessment = useCallback(async (studentAssessmentId: string, marksObtained: number, percentage: number, grade: string, gradePoint: number, feedback?: string, gradedBy?: string) => {
    setLoading(true);
    try {
      const data = await gradeAssessment(studentAssessmentId, marksObtained, percentage, grade, gradePoint, feedback, gradedBy);
      setStudentAssessments(prev => prev.map(sa => sa.id === studentAssessmentId ? data : sa));
      setCurrentStudentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, []);

  const autoGrade = useCallback(async (studentAssessmentId: string, questions: Question[]) => {
    setLoading(true);
    try {
      const data = await autoGradeStudentAssessment(studentAssessmentId, questions);
      setStudentAssessments(prev => prev.map(sa => sa.id === studentAssessmentId ? data : sa));
      setCurrentStudentAssessment(data);
      return data;
    } catch (err: any) { setError(err.message); return null; } finally { setLoading(false); }
  }, []);

  const bulkGrade = useCallback(async (inputs: BulkGradeInput[]) => {
    setLoading(true);
    try {
      await bulkGradeAssessments(inputs);
      if (currentAssessment) await fetchStudentAssessments(currentAssessment.id);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }, [currentAssessment, fetchStudentAssessments]);

  const enrollStudents = useCallback(async (assessment: Assessment, students: Array<{ id: string; name: string; regNo: string }>) => {
    setLoading(true);
    try {
      const data = await bulkCreateStudentAssessments(assessment, students);
      setStudentAssessments(prev => [...data, ...prev]);
      if (currentAssessment?.id === assessment.id) setCurrentAssessment({ ...currentAssessment, totalStudents: students.length });
      return data;
    } catch (err: any) { setError(err.message); return []; } finally { setLoading(false); }
  }, [currentAssessment]);

  const fetchFacultyCurriculum = useCallback(async (facultyId: string) => {
    setLoading(true); setError(null);
    try { const data = await getFacultyCurriculum(facultyId); setFacultyCurriculum(data); }
    catch (err: any) { setError(err.message || 'Failed to fetch faculty curriculum'); }
    finally { setLoading(false); }
  }, []);

  const fetchQuestionsForAssessment = useCallback(async (qbFilters: QuestionFilters, limitCount: number = 100) => {
    setLoading(true);
    try { const result = await getQuestions(collegeId, qbFilters, limitCount); setAvailableQuestions(result.data); return result.data; }
    catch (err: any) { setError(err.message || 'Failed to fetch questions'); return []; }
    finally { setLoading(false); }
  }, [collegeId]);

  const buildAssessmentSections = useCallback(async (config: AIGenerationConfig, existingQuestionIds: string[] = []) => {
    setLoading(true);
    try {
      const sections: AssessmentSection[] = [];
      const usedQuestionIds = new Set(existingQuestionIds);
      for (const qType of config.questionTypes) {
        const typeCount = Math.ceil((config.difficultyDistribution.easy + config.difficultyDistribution.medium + config.difficultyDistribution.hard) / config.questionTypes.length);
        const section: AssessmentSection = {
          id: `sec_${qType}_${Date.now()}`,
          title: `${qType.replace(/_/g, ' ').toUpperCase()} Section`,
          questionType: qType,
          numQuestions: typeCount,
          marksPerQuestion: Math.floor(config.totalMarks / config.totalQuestions),
          difficulty: 'mixed',
          topicFilter: config.topics[0] || null,
          unitFilter: config.modules[0] || null,
          questionIds: [],
        };
        const filters: QuestionFilters = { subject: config.subject, type: qType as any, topic: config.topics[0], unit: config.modules[0] };
        const questions = await getQuestions(collegeId, filters, typeCount * 3);
        const selected = questions.data.filter(q => !usedQuestionIds.has(q.id)).slice(0, typeCount);
        section.questionIds = selected.map(q => q.id);
        selected.forEach(q => usedQuestionIds.add(q.id));
        sections.push(section);
      }
      return sections;
    } catch (err: any) { setError(err.message || 'Failed to build sections'); return []; }
    finally { setLoading(false); }
  }, [collegeId]);

  const generateAIQuestions = useCallback(async (config: AIGenerationConfig) => {
    if (!collegeId) {
      setError('collegeId is required to generate questions');
      return [];
    }
    setLoading(true); setError(null);
    try {
      const diffEntries = Object.entries(config.difficultyDistribution) as [string, number][];
      const primaryDifficulty = diffEntries.sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

      const apiConfig = {
        subject: config.subject,
        topic: config.topics[0] || '',
        questionType: config.questionTypes[0] || 'mcq',
        difficulty: primaryDifficulty,
        count: config.totalQuestions,
        numQuestions: config.totalQuestions,
        marks: Math.floor(config.totalMarks / Math.max(config.totalQuestions, 1)),
        course: config.courseName,
        courseName: config.courseName,
        courseId: config.courseId,
        courseCode: config.courseCode,
        curriculumId: config.curriculumId,
        moduleId: config.moduleId,
        moduleName: config.moduleName,
        moduleNo: config.moduleNo,
        unit: config.unit,
        chapter: config.chapter,
        learningOutcomes: config.learningOutcomes,
        branch: config.branch,
        batch: config.batch,
        semester: config.semester,
        language: config.language || 'English',
        provider: config.provider || 'gemini',
        collegeId,
      };

      const result = await generateQuestionsWithAI(apiConfig);

      const sections: AssessmentSection[] = [];

      for (const qType of config.questionTypes) {
        const bankType = qType === 'mcq_single' || qType === 'mcq_multiple' ? 'mcq' : qType === 'match_following' ? 'matching' : qType;
        const typeQuestions = result.questions.filter(q => q.type === bankType);
        if (typeQuestions.length === 0) continue;

        const section: AssessmentSection = {
          id: `sec_${qType}_${Date.now()}`,
          title: `${qType.replace(/_/g, ' ').toUpperCase()} Section`,
          questionType: qType,
          numQuestions: typeQuestions.length,
          marksPerQuestion: Math.floor(config.totalMarks / config.totalQuestions),
          difficulty: primaryDifficulty,
          topicFilter: config.topics[0] || null,
          unitFilter: config.modules[0] || null,
          questionIds: typeQuestions.map(q => q.firestoreId || q.id!).filter(Boolean),
        };

        sections.push(section);
      }

      setAvailableQuestions(prev => [...(result.questions as unknown as Question[]), ...prev]);
      return sections;
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI questions');
      return [];
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const setFilter = useCallback((key: keyof AssessmentFilterOptions, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters({}), []);
  const refresh = useCallback(() => fetchAssessments(), [fetchAssessments]);

  return {
    assessments, currentAssessment, studentAssessments, currentStudentAssessment,
    stats, facultyCurriculum, availableQuestions, loading, error, filters,
    fetchAssessments, fetchAssessmentById, createNewAssessment, updateAssessmentById,
    deleteAssessmentById, publish, activate, complete, archive, fetchStats,
    fetchStudentAssessments, fetchStudentAssessment, startStudentAssessment,
    submitStudentAssessment, gradeStudentAssessment, autoGrade, bulkGrade, enrollStudents,
    fetchFacultyCurriculum, fetchQuestionsForAssessment, buildAssessmentSections,
    generateAIQuestions,
    setFilter, clearFilters, refresh,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// useQuestions — Question Bank List Operations
// ═══════════════════════════════════════════════════════════════════════

export interface UseQuestionsReturn {
  questions: Question[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
  filters: QuestionFilters;
  fetchQuestions: (overrideFilters?: QuestionFilters & { page?: number; limit?: number }) => Promise<PaginatedResult<Question>>;
  fetchAllQuestions: (limit?: number) => Promise<Question[]>;
  searchQuestions: (query: string, extraFilters?: QuestionFilters) => Promise<PaginatedResult<Question>>;
  addQuestion: (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => Promise<Question>;
  editQuestion: (id: string, data: Partial<Question>) => Promise<Question>;
  removeQuestion: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<Question>;
  setFilter: (key: keyof QuestionFilters, value: unknown) => void;
  clearFilters: () => void;
  refresh: () => Promise<PaginatedResult<Question>>;
  loadMore: () => Promise<PaginatedResult<Question> | undefined>;
}

export function useQuestions(
  _collegeId?: string,
  _options?: { subjectId?: string; type?: string; status?: string; searchQuery?: string }
): UseQuestionsReturn {
  const { user } = useAuth();
  const collegeId = _collegeId || user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<QuestionFilters>({});
  const lastDocRef = useRef<unknown>(null);
  const pageSizeRef = useRef(20);

  const fetchQuestions = useCallback(async (overrideFilters?: QuestionFilters & { page?: number; limit?: number }) => {
    setLoading(true); setError(null);
    try {
      const merged: any = { ...filters, ..._options, ...overrideFilters };
      const pageSize = overrideFilters?.limit || pageSizeRef.current;
      pageSizeRef.current = pageSize;
      const result = await getQuestions(collegeId, merged, pageSize, lastDocRef.current as any);
      setQuestions(result.data); setTotal(result.total); setHasMore(result.hasMore || false);
      lastDocRef.current = result.lastDoc || null;
      return result;
    } catch (err: any) { setError(err.message || 'Failed to fetch questions'); throw err; }
    finally { setLoading(false); }
  }, [collegeId, filters, _options]);

  const fetchAllQuestions = useCallback(async (limit?: number) => {
    setLoading(true); setError(null);
    try {
      const data = await getQuestions(collegeId, {}, limit || 100);
      setQuestions(data.data); setTotal(data.data.length); setHasMore(false);
      lastDocRef.current = null;
      return data.data;
    } catch (err: any) { setError(err.message || 'Failed to fetch all questions'); throw err; }
    finally { setLoading(false); }
  }, [collegeId]);

  const searchQuestions = useCallback(async (query: string, extraFilters?: QuestionFilters) => {
    setLoading(true); setError(null);
    try {
      const searchFilters = { ...extraFilters, searchQuery: query };
      const result = await getQuestions(collegeId, searchFilters, pageSizeRef.current);
      setQuestions(result.data); setTotal(result.total); setHasMore(result.hasMore || false);
      lastDocRef.current = result.lastDoc || null;
      return result;
    } catch (err: any) { setError(err.message || 'Search failed'); throw err; }
    finally { setLoading(false); }
  }, [collegeId]);

  const addQuestion = useCallback(async (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => {
    setLoading(true); setError(null);
    try {
      const newQ = await createQuestion(collegeId, data as any);
      setQuestions(prev => [newQ, ...prev]); setTotal(prev => prev + 1);
      return newQ;
    } catch (err: any) { setError(err.message || 'Failed to create question'); throw err; }
    finally { setLoading(false); }
  }, [collegeId]);

  const editQuestion = useCallback(async (id: string, data: Partial<Question>) => {
    setLoading(true); setError(null);
    try {
      await updateQuestion(id, data);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
      return { ...questions.find(q => q.id === id), ...data } as Question;
    } catch (err: any) { setError(err.message || 'Failed to update question'); throw err; }
    finally { setLoading(false); }
  }, [questions]);

  const removeQuestion = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try { await deleteQuestion(id); setQuestions(prev => prev.filter(q => q.id !== id)); setTotal(prev => Math.max(0, prev - 1)); }
    catch (err: any) { setError(err.message || 'Failed to delete question'); throw err; }
    finally { setLoading(false); }
  }, []);

  const toggleStatus = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const current = questions.find(q => q.id === id);
      const newStatus = current?.status === 'active' ? 'inactive' : 'active';
      await updateQuestion(id, { status: newStatus });
      const updated = { ...current, status: newStatus } as Question;
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
      return updated;
    } catch (err: any) { setError(err.message || 'Failed to toggle status'); throw err; }
    finally { setLoading(false); }
  }, [questions]);

  const setFilter = useCallback((key: keyof QuestionFilters, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => { setFilters({}); lastDocRef.current = null; }, []);
  const refresh = useCallback(() => { lastDocRef.current = null; return fetchQuestions(); }, [fetchQuestions]);
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return undefined;
    setLoading(true);
    try {
      const result = await getQuestions(collegeId, filters, pageSizeRef.current, lastDocRef.current as any);
      setQuestions(prev => [...prev, ...result.data]); setTotal(prev => prev + result.data.length);
      setHasMore(result.hasMore || false); lastDocRef.current = result.lastDoc || null;
      return result;
    } catch (err: any) { setError(err.message || 'Failed to load more'); throw err; }
    finally { setLoading(false); }
  }, [collegeId, filters, hasMore, loading]);

  return { questions, loading, error, total, hasMore, filters, fetchQuestions, fetchAllQuestions, searchQuestions, addQuestion, editQuestion, removeQuestion, toggleStatus, setFilter, clearFilters, refresh, loadMore };
}

// ═══════════════════════════════════════════════════════════════════════
// useQuestion — Single Question Operations
// ═══════════════════════════════════════════════════════════════════════

export interface UseQuestionReturn {
  question: Question | null;
  loading: boolean;
  error: string | null;
  fetchQuestion: (id: string) => Promise<Question | null>;
  updateQuestionById: (id: string, data: Partial<Question>) => Promise<void>;
  deleteQuestionById: (id: string) => Promise<void>;
  create: (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => Promise<Question>;
  update: (idOrData: string | Partial<Question>, data?: Partial<Question>) => Promise<void>;
}

export function useQuestion(
  _collegeId?: string,
  questionId?: string
): UseQuestionReturn {
  const { user } = useAuth();
  const collegeId = _collegeId || user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const data = await getQuestionById(id);
      setQuestion(data);
      return data;
    } catch (err: any) { setError(err.message || 'Failed to fetch question'); return null; }
    finally { setLoading(false); }
  }, []);

  const updateQuestionById = useCallback(async (id: string, data: Partial<Question>) => {
    setLoading(true); setError(null);
    try { await updateQuestion(id, data); setQuestion(prev => prev ? { ...prev, ...data } : null); }
    catch (err: any) { setError(err.message || 'Failed to update question'); throw err; }
    finally { setLoading(false); }
  }, []);

  const deleteQuestionById = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try { await deleteQuestion(id); setQuestion(null); }
    catch (err: any) { setError(err.message || 'Failed to delete question'); throw err; }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => {
    setLoading(true); setError(null);
    try {
      const newQ = await createQuestion(collegeId, data as any);
      setQuestion(newQ);
      return newQ;
    } catch (err: any) { setError(err.message || 'Failed to create question'); throw err; }
    finally { setLoading(false); }
  }, [collegeId]);

  const update = useCallback(async (idOrData: string | Partial<Question>, data?: Partial<Question>) => {
    if (typeof idOrData === 'string' && data) {
      return updateQuestionById(idOrData, data);
    }
    if (typeof idOrData === 'object' && questionId) {
      return updateQuestionById(questionId, idOrData);
    }
    throw new Error('Invalid update arguments');
  }, [updateQuestionById, questionId]);

  useEffect(() => {
    if (questionId) {
      fetchQuestion(questionId);
    }
  }, [questionId, fetchQuestion]);

  return { question, loading, error, fetchQuestion, updateQuestionById, deleteQuestionById, create, update };
}

// ═══════════════════════════════════════════════════════════════════════
// usePapers — Paper List Operations
// ═══════════════════════════════════════════════════════════════════════

export interface UsePapersReturn {
  papers: AssessmentPaper[];
  loading: boolean;
  error: string | null;
  fetchPapers: (filters?: { status?: string; subject?: string; createdBy?: string }) => Promise<void>;
  createNewPaper: (input: CreatePaperInput) => Promise<AssessmentPaper | null>;
  updatePaperById: (id: string, updates: Partial<AssessmentPaper>) => Promise<AssessmentPaper | null>;
  deletePaperById: (id: string) => Promise<boolean>;
  create: (input: CreatePaperInput) => Promise<AssessmentPaper | null>;
}

export function usePapers(
  _collegeId?: string,
  _filters?: { status?: string; subject?: string; createdBy?: string }
): UsePapersReturn {
  const { user } = useAuth();
  const collegeId = _collegeId || user?.collegeId || '';
  const [papers, setPapers] = useState<AssessmentPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPapers = useCallback(async (filters?: { status?: string; subject?: string; createdBy?: string }) => {
    if (!collegeId) return;
    setLoading(true); setError(null);
    try { const data = await listPapers(collegeId, filters || _filters); setPapers(data); }
    catch (err: any) { setError(err.message || 'Failed to fetch papers'); }
    finally { setLoading(false); }
  }, [collegeId, _filters]);

  const createNewPaper = useCallback(async (input: CreatePaperInput) => {
    setLoading(true); setError(null);
    try { const data = await createPaper(input); setPapers(prev => [data, ...prev]); return data; }
    catch (err: any) { setError(err.message || 'Failed to create paper'); return null; }
    finally { setLoading(false); }
  }, []);

  const updatePaperById = useCallback(async (id: string, updates: Partial<AssessmentPaper>) => {
    setLoading(true); setError(null);
    try { const data = await updatePaper(id, updates); setPapers(prev => prev.map(p => p.id === id ? data : p)); return data; }
    catch (err: any) { setError(err.message || 'Failed to update paper'); return null; }
    finally { setLoading(false); }
  }, []);

  const deletePaperById = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try { await deletePaper(id); setPapers(prev => prev.filter(p => p.id !== id)); return true; }
    catch (err: any) { setError(err.message || 'Failed to delete paper'); return false; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (collegeId) {
      fetchPapers();
    }
  }, [collegeId, fetchPapers]);

  return { papers, loading, error, fetchPapers, createNewPaper, updatePaperById, deletePaperById, create: createNewPaper };
}

// ═══════════════════════════════════════════════════════════════════════
// usePaper — Single Paper Operations
// ═══════════════════════════════════════════════════════════════════════

export interface UsePaperReturn {
  paper: AssessmentPaper | null;
  loading: boolean;
  error: string | null;
  fetchPaper: (id: string) => Promise<AssessmentPaper | null>;
  updatePaper: (id: string, updates: Partial<AssessmentPaper>) => Promise<AssessmentPaper | null>;
}

export function usePaper(): UsePaperReturn {
  const [paper, setPaper] = useState<AssessmentPaper | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaper = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try { const data = await getPaperById(id); setPaper(data); return data; }
    catch (err: any) { setError(err.message || 'Failed to fetch paper'); return null; }
    finally { setLoading(false); }
  }, []);

  const updatePaperFn = useCallback(async (id: string, updates: Partial<AssessmentPaper>) => {
    setLoading(true); setError(null);
    try { const data = await updatePaperApi(id, updates); setPaper(data); return data; }
    catch (err: any) { setError(err.message || 'Failed to update paper'); return null; }
    finally { setLoading(false); }
  }, []);

  return { paper, loading, error, fetchPaper, updatePaper: updatePaperFn };
}

const updatePaperApi = updatePaper;

// ═══════════════════════════════════════════════════════════════════════
// useScheduledTests — Test Scheduling Operations
// ═══════════════════════════════════════════════════════════════════════

export interface UseScheduledTestsReturn {
  scheduledTests: ScheduledTest[];
  tests: ScheduledTest[];
  loading: boolean;
  error: string | null;
  fetchScheduledTests: (filters?: { collegeId?: string; facultyId?: string; status?: string }) => Promise<void>;
  scheduleNewTest: (input: ScheduleTestInput) => Promise<ScheduledTest | null>;
  schedule: (input: ScheduleTestInput) => Promise<ScheduledTest | null>;
  updateScheduledTestById: (id: string, updates: Partial<ScheduledTest>) => Promise<ScheduledTest | null>;
  deleteScheduledTestById: (id: string) => Promise<boolean>;
  publish: (id: string) => Promise<ScheduledTest | null>;
  cancel: (id: string, reason?: string) => Promise<boolean>;
}

export function useScheduledTests(_collegeId?: string): UseScheduledTestsReturn {
  const { user } = useAuth();
  const collegeId = _collegeId || user?.collegeId || '';
  const facultyId = user?.id || '';
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScheduledTests = useCallback(async (filters?: { collegeId?: string; facultyId?: string; status?: string }) => {
    setLoading(true); setError(null);
    try {
      const opts = { collegeId: filters?.collegeId || collegeId, facultyId: filters?.facultyId || facultyId, status: filters?.status };
      const data = await listScheduledTests(opts);
      setScheduledTests(data);
    } catch (err: any) { setError(err.message || 'Failed to fetch scheduled tests'); }
    finally { setLoading(false); }
  }, [collegeId, facultyId]);

  const scheduleNewTest = useCallback(async (input: ScheduleTestInput) => {
    setLoading(true); setError(null);
    try { const data = await scheduleTest(input); setScheduledTests(prev => [data, ...prev]); return data; }
    catch (err: any) { setError(err.message || 'Failed to schedule test'); return null; }
    finally { setLoading(false); }
  }, []);

  const updateScheduledTestById = useCallback(async (id: string, updates: Partial<ScheduledTest>) => {
    setLoading(true); setError(null);
    try { const data = await updateScheduledTest(id, updates); setScheduledTests(prev => prev.map(t => t.id === id ? data : t)); return data; }
    catch (err: any) { setError(err.message || 'Failed to update scheduled test'); return null; }
    finally { setLoading(false); }
  }, []);

  const deleteScheduledTestById = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try { await deleteScheduledTest(id); setScheduledTests(prev => prev.filter(t => t.id !== id)); return true; }
    catch (err: any) { setError(err.message || 'Failed to delete scheduled test'); return false; }
    finally { setLoading(false); }
  }, []);

  const publish = useCallback(async (id: string) => {
    setLoading(true); setError(null);
    try {
      const data = await updateScheduledTest(id, { status: 'published' as any });
      setScheduledTests(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err: any) { setError(err.message || 'Failed to publish test'); return null; }
    finally { setLoading(false); }
  }, []);

  const cancel = useCallback(async (id: string, _reason?: string) => {
    setLoading(true); setError(null);
    try {
      const data = await updateScheduledTest(id, { status: 'cancelled' as any });
      setScheduledTests(prev => prev.map(t => t.id === id ? data : t));
      return true;
    } catch (err: any) { setError(err.message || 'Failed to cancel test'); return false; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (collegeId) {
      fetchScheduledTests();
    }
  }, [collegeId, fetchScheduledTests]);

  return {
    scheduledTests,
    tests: scheduledTests,
    loading,
    error,
    fetchScheduledTests,
    scheduleNewTest,
    schedule: scheduleNewTest,
    updateScheduledTestById,
    deleteScheduledTestById,
    publish,
    cancel,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// useStudentTests — Student Test List
// ═══════════════════════════════════════════════════════════════════════

export interface UseStudentTestsReturn {
  tests: StudentTestCard[];
  testCards: StudentTestCard[];
  upcomingTests: StudentTestCard[];
  availableTests: StudentTestCard[];
  completedTests: StudentTestCard[];
  missedTests: StudentTestCard[];
  loading: boolean;
  error: string | null;
  fetchTests: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStudentTests(
  _collegeId?: string,
  _studentId?: string,
  _sectionId?: string
): UseStudentTestsReturn {
  const { user } = useAuth();
  const studentId = _studentId || user?.id || '';
  const [tests, setTests] = useState<StudentTestCard[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<StudentTestCard[]>([]);
  const [completedTests, setCompletedTests] = useState<StudentTestCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = useCallback(async () => {
    if (!studentId) return;
    setLoading(true); setError(null);
    try {
      const studentAssessments = await listStudentAssessments({ studentId });
      const cards: StudentTestCard[] = studentAssessments.map(sa => ({
        id: sa.id,
        assessmentId: sa.assessmentId,
        title: sa.studentName || 'Untitled Test',
        subject: sa.branch || '',
        type: 'quiz',
        scheduledDate: sa.createdAt,
        startDateTime: sa.startedAt || '',
        endDateTime: sa.submittedAt || '',
        startTime: sa.startedAt || '',
        endTime: sa.submittedAt || '',
        duration: sa.timeSpent || 0,
        durationMinutes: sa.timeSpent || 0,
        totalMarks: sa.totalMarks || 0,
        totalQuestions: 0,
        passingMarks: 0,
        status: sa.status,
        hasResult: sa.status === 'graded',
        score: sa.marksObtained,
        percentage: sa.percentage,
        paperType: 'quiz',
        subjectName: sa.branch || '',
      }));
      setTests(cards);
      setUpcomingTests(cards.filter(c => c.status === 'not_started' || c.status === 'upcoming' || c.status === 'scheduled'));
      setCompletedTests(cards.filter(c => c.status === 'submitted' || c.status === 'graded' || c.status === 'completed'));
    } catch (err: any) { setError(err.message || 'Failed to fetch tests'); }
    finally { setLoading(false); }
  }, [studentId]);

  const refresh = useCallback(() => fetchTests(), [fetchTests]);

  useEffect(() => { if (studentId) fetchTests(); }, [studentId, fetchTests]);

  const availableTests = tests.filter(t => t.status === 'available' || t.status === 'ongoing');
  const missedTests = tests.filter(t => t.status === 'missed');

  return { tests, testCards: tests, upcomingTests, availableTests, completedTests, missedTests, loading, error, fetchTests, refresh };
}

// ═══════════════════════════════════════════════════════════════════════
// useActiveTest — Student Taking a Test
// ═══════════════════════════════════════════════════════════════════════

export interface UseActiveTestReturn {
  testState: ActiveTestState | null;
  activeTest: ActiveTestState | null;
  currentQuestion: PaperQuestion | null;
  questions: PaperQuestion[];
  answers: Record<string, Partial<StudentAnswer>>;
  timeRemaining: number;
  loading: boolean;
  isSubmitting: boolean;
  error: string | null;
  startTest: (assessmentId: string, studentId: string, questions?: PaperQuestion[]) => Promise<void>;
  start: (assessmentId: string, studentId: string, studentName?: string, studentRegNo?: string, sectionId?: string, sectionName?: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: Partial<StudentAnswer>) => void;
  saveCurrentAnswer: (questionIdOrAnswer: string | Partial<StudentAnswer>, answer?: Partial<StudentAnswer>) => void;
  submitTest: (studentAssessmentId?: string, timeSpent?: number) => Promise<StudentAssessment | null>;
  submit: (studentAssessmentId?: string, timeSpent?: number) => Promise<StudentAssessment | null>;
  navigateQuestion: (direction: 'next' | 'prev') => void;
  navigateToQuestion: (index: number) => void;
  toggleFlagQuestion: (questionId: string) => void;
  logProctorEvent: (event: string | { type: string; details: string }, details?: Record<string, unknown>) => void;
}

export function useActiveTest(_collegeId?: string): UseActiveTestReturn {
  const [testState, setTestState] = useState<ActiveTestState | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTest = useCallback(async (assessmentId: string, studentId: string, testQuestions?: PaperQuestion[]) => {
    setLoading(true); setError(null);
    try {
      const qs = testQuestions || [];
      setQuestions(qs);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTestState({
        testId: assessmentId,
        studentId,
        status: 'in_progress',
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining: qs.length * 60,
        startedAt: new Date().toISOString(),
        flaggedQuestions: [],
        questions: qs,
        allowNavigation: true,
      });
      setTimeRemaining(qs.length * 60);
    } catch (err: any) { setError(err.message || 'Failed to start test'); }
    finally { setLoading(false); }
  }, []);

  const start = useCallback(async (assessmentId: string, studentId: string, _studentName?: string, _studentRegNo?: string, _sectionId?: string, _sectionName?: string) => {
    return startTest(assessmentId, studentId);
  }, [startTest]);

  const answerQuestion = useCallback((questionId: string, answer: Partial<StudentAnswer>) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setTestState(prev => prev ? { ...prev, answers: { ...prev.answers, [questionId]: answer } } : null);
  }, []);

  const saveCurrentAnswer = useCallback((questionIdOrAnswer: string | Partial<StudentAnswer>, answer?: Partial<StudentAnswer>) => {
    if (typeof questionIdOrAnswer === 'string' && answer) {
      answerQuestion(questionIdOrAnswer, answer);
    } else if (typeof questionIdOrAnswer === 'object') {
      const qId = questions[currentQuestionIndex]?.questionId;
      if (qId) {
        answerQuestion(qId, questionIdOrAnswer);
      }
    }
  }, [answerQuestion, questions, currentQuestionIndex]);

  const submitTest = useCallback(async (_studentAssessmentId?: string, _timeSpent?: number) => {
    setLoading(true); setError(null);
    try {
      const formattedAnswers: StudentAnswer[] = Object.entries(answers).map(([questionId, ans]) => ({
        questionId,
        answer: ans.selectedOptionIds || ans.textAnswer || ans.matchedPairs || ans.answer || '',
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer,
        matchedPairs: ans.matchedPairs,
      }));
      const studentAssessmentId = _studentAssessmentId || testState?.studentId || '';
      const timeSpent = _timeSpent || (testState ? Math.floor((Date.now() - new Date(testState.startedAt).getTime()) / 1000) : 0);
      const data = await submitAssessment(studentAssessmentId, formattedAnswers, timeSpent);
      setTestState(prev => prev ? { ...prev, status: 'submitted', submittedAt: new Date().toISOString() } : null);
      if (timerRef.current) clearInterval(timerRef.current);
      return data;
    } catch (err: any) { setError(err.message || 'Failed to submit test'); return null; }
    finally { setLoading(false); }
  }, [answers, testState]);

  const submit = useCallback(async (_studentAssessmentId?: string, _timeSpent?: number) => {
    return submitTest(_studentAssessmentId, _timeSpent);
  }, [submitTest]);

  const navigateQuestion = useCallback((direction: 'next' | 'prev') => {
    setCurrentQuestionIndex(prev => {
      const newIndex = direction === 'next' ? Math.min(prev + 1, questions.length - 1) : Math.max(prev - 1, 0);
      setTestState(state => state ? { ...state, currentQuestionIndex: newIndex } : null);
      return newIndex;
    });
  }, [questions.length]);

  const navigateToQuestion = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(index, questions.length - 1));
    setCurrentQuestionIndex(safeIndex);
    setTestState(state => state ? { ...state, currentQuestionIndex: safeIndex } : null);
  }, [questions.length]);

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setTestState(prev => {
      if (!prev) return null;
      const flagged = new Set(prev.flaggedQuestions || []);
      if (flagged.has(questionId)) flagged.delete(questionId);
      else flagged.add(questionId);
      return { ...prev, flaggedQuestions: Array.from(flagged) };
    });
  }, []);

  const logProctorEvent = useCallback((event: string | { type: string; details: string }, _details?: Record<string, unknown>) => {
    if (typeof event === 'object') {
      console.warn(`[Proctor] ${event.type}: ${event.details}`);
    } else {
      console.warn(`[Proctor] ${event}`);
    }
  }, []);

  useEffect(() => {
    if (testState?.status === 'in_progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testState?.status, timeRemaining]);

  const currentQuestion = questions[currentQuestionIndex] || null;

  return {
    testState,
    activeTest: testState,
    currentQuestion,
    questions,
    answers,
    timeRemaining,
    loading,
    isSubmitting: loading,
    error,
    startTest,
    start,
    answerQuestion,
    saveCurrentAnswer,
    submitTest,
    submit,
    navigateQuestion,
    navigateToQuestion,
    toggleFlagQuestion,
    logProctorEvent,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// useTestResult — Single Test Result
// ═══════════════════════════════════════════════════════════════════════

export interface UseTestResultReturn {
  result: TestResultSummary | null;
  loading: boolean;
  error: string | null;
  fetchResult: (studentAssessmentId: string) => Promise<TestResultSummary | null>;
}

export function useTestResult(
  _collegeId?: string,
  _testId?: string,
  _studentId?: string
): UseTestResultReturn {
  const [result, setResult] = useState<TestResultSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = useCallback(async (studentAssessmentId: string) => {
    setLoading(true); setError(null);
    try {
      if (!db) {
        setError('Firebase db not initialized');
        return null;
      }
      const docRef = doc(db, 'studentAssessments', studentAssessmentId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) { setResult(null); return null; }
      const data = docSnap.data() as StudentAssessment;
      const summary: TestResultSummary = {
        assessmentId: data.assessmentId,
        studentAssessmentId: data.id,
        title: data.studentName || 'Test Result',
        testTitle: data.studentName || 'Test Result',
        subject: data.branch || '',
        totalMarks: data.totalMarks || 0,
        totalScore: data.marksObtained,
        maxScore: data.totalMarks,
        marksObtained: data.marksObtained || 0,
        percentage: data.percentage,
        passed: (data.percentage || 0) >= 40,
        grade: data.grade || undefined,
        gradePoint: data.gradePoint || undefined,
        timeSpent: data.timeSpent || 0,
        submittedAt: data.submittedAt || '',
        facultyFeedback: data.facultyFeedback || undefined,
        rank: 0,
        totalParticipants: 0,
        sectionRank: 0,
        totalInSection: 0,
        classAverage: 0,
        classHighest: 0,
        averageTimePerQuestion: 0,
        questionScores: (data.answers || []).map((ans: StudentAnswer) => ({
          questionId: ans.questionId,
          questionText: ans.questionText || '',
          marksObtained: ans.marksObtained || 0,
          yourScore: ans.marksObtained || 0,
          maxMarks: ans.maxMarks || 1,
          maxScore: ans.maxMarks || 1,
          isCorrect: ans.isCorrect || false,
          feedback: ans.feedback || undefined,
          correctAnswer: undefined,
          yourAnswer: ans.answer as string || undefined,
          timeSpent: undefined,
          questionType: undefined,
        })),
        sectionScores: [],
      };
      setResult(summary);
      return summary;
    } catch (err: any) { setError(err.message || 'Failed to fetch result'); return null; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (_testId && _studentId) {
      fetchResult(_testId);
    }
  }, [_testId, _studentId, fetchResult]);

  return { result, loading, error, fetchResult };
}

// ═══════════════════════════════════════════════════════════════════════
// useTestResults — Multiple Test Results
// ═══════════════════════════════════════════════════════════════════════

export interface UseTestResultsReturn {
  results: TestResultSummary[];
  loading: boolean;
  error: string | null;
  fetchResults: (studentId: string) => Promise<void>;
}

export function useTestResults(): UseTestResultsReturn {
  const [results, setResults] = useState<TestResultSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async (studentId: string) => {
    setLoading(true); setError(null);
    try {
      const studentAssessments = await listStudentAssessments({ studentId });
      const summaries: TestResultSummary[] = studentAssessments.map(sa => ({
        assessmentId: sa.assessmentId,
        studentAssessmentId: sa.id,
        title: sa.studentName || 'Test Result',
        testTitle: sa.studentName || 'Test Result',
        subject: sa.branch || '',
        totalMarks: sa.totalMarks || 0,
        totalScore: sa.marksObtained,
        maxScore: sa.totalMarks,
        marksObtained: sa.marksObtained || 0,
        percentage: sa.percentage,
        passed: (sa.percentage || 0) >= 40,
        grade: sa.grade || undefined,
        gradePoint: sa.gradePoint || undefined,
        timeSpent: sa.timeSpent || 0,
        submittedAt: sa.submittedAt || '',
        facultyFeedback: sa.facultyFeedback || undefined,
        rank: 0,
        totalParticipants: 0,
        sectionRank: 0,
        totalInSection: 0,
        classAverage: 0,
        classHighest: 0,
        averageTimePerQuestion: 0,
        questionScores: (sa.answers || []).map((ans: StudentAnswer) => ({
          questionId: ans.questionId,
          questionText: ans.questionText || '',
          marksObtained: ans.marksObtained || 0,
          yourScore: ans.marksObtained || 0,
          maxMarks: ans.maxMarks || 1,
          maxScore: ans.maxMarks || 1,
          isCorrect: ans.isCorrect || false,
          feedback: ans.feedback || undefined,
          correctAnswer: undefined,
          yourAnswer: ans.answer as string || undefined,
          timeSpent: undefined,
          questionType: undefined,
        })),
        sectionScores: [],
      }));
      setResults(summaries);
    } catch (err: any) { setError(err.message || 'Failed to fetch results'); }
    finally { setLoading(false); }
  }, []);

  return { results, loading, error, fetchResults };
}

// ═══════════════════════════════════════════════════════════════════════
// useTestAnalytics — Analytics for a Specific Test
// ═══════════════════════════════════════════════════════════════════════

export interface UseTestAnalyticsReturn {
  analytics: TestAnalytics | null;
  loading: boolean;
  error: string | null;
  fetchAnalytics: (assessmentId: string) => Promise<TestAnalytics | null>;
}

export function useTestAnalytics(): UseTestAnalyticsReturn {
  const [analytics, setAnalytics] = useState<TestAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (assessmentId: string) => {
    setLoading(true); setError(null);
    try {
      const assessment = await getAssessmentById(assessmentId);
      const submissions = await listStudentAssessments({ assessmentId });
      const graded = submissions.filter(s => s.status === 'graded');
      const scores = graded.map(s => s.percentage).filter((p): p is number => p !== undefined);
      const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
      const passCount = graded.filter(s => (s.percentage || 0) >= (assessment?.passingMarks || 40)).length;
      const failCount = graded.length - passCount;

      const gradeDistribution: Record<string, number> = {};
      graded.forEach(s => {
        const g = s.grade || 'N/A';
        gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;
      });

      const questionStats: Array<{
        questionId: string; questionText: string;
        correctCount: number; wrongCount: number; skipCount: number;
      }> = [];

      if (assessment?.questionIds?.length) {
        for (const qId of assessment.questionIds) {
          let correct = 0, wrong = 0, skip = 0;
          submissions.forEach(s => {
            const ans = s.answers.find((a: StudentAnswer) => a.questionId === qId);
            if (!ans) skip++;
            else if (ans.isCorrect) correct++;
            else wrong++;
          });
          questionStats.push({ questionId: qId, questionText: '', correctCount: correct, wrongCount: wrong, skipCount: skip });
        }
      }

      const result: TestAnalytics = {
        assessmentId,
        title: assessment?.title || 'Untitled',
        totalStudents: assessment?.totalStudents || 0,
        submittedCount: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        averageScore: avgScore,
        highestScore,
        lowestScore,
        passCount,
        failCount,
        gradeDistribution,
        questionStats,
      };
      setAnalytics(result);
      return result;
    } catch (err: any) { setError(err.message || 'Failed to fetch analytics'); return null; }
    finally { setLoading(false); }
  }, []);

  return { analytics, loading, error, fetchAnalytics };
}

// ═══════════════════════════════════════════════════════════════════════
// useReviewQueue — Admin Review Queue
// ═══════════════════════════════════════════════════════════════════════

export interface UseReviewQueueReturn {
  reviews: ReviewQueueItem[];
  items: ReviewQueueItem[];
  loading: boolean;
  error: string | null;
  fetchReviews: (collegeId?: string, status?: string) => Promise<void>;
  approveItem: (itemId: string, type: 'question' | 'paper', reviewerId: string, reviewerName: string, comment?: string) => Promise<boolean>;
  rejectItem: (itemId: string, type: 'question' | 'paper', reviewerId: string, reviewerName: string, comment?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useReviewQueue(_collegeId?: string, _status?: string): UseReviewQueueReturn {
  const { user } = useAuth();
  const reviewerId = user?.id || '';
  const reviewerName = user?.name || 'Unknown';
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (collegeId?: string, status?: string) => {
    setLoading(true); setError(null);
    try {
      let data = await getPendingReviews();
      if (status) {
        data = data.filter(r => r.status === status);
      }
      setReviews(data);
    }
    catch (err: any) { setError(err.message || 'Failed to fetch reviews'); }
    finally { setLoading(false); }
  }, []);

  const approveItem = useCallback(async (itemId: string, type: 'question' | 'paper', revId: string, revName: string, comment?: string) => {
    setLoading(true); setError(null);
    try {
      const success = type === 'question'
        ? await approveQuestion(itemId, revId, revName, comment)
        : await approvePaper(itemId, revId, revName, comment);
      if (success) setReviews(prev => prev.filter(r => r.itemId !== itemId));
      return success;
    } catch (err: any) { setError(err.message || 'Failed to approve'); return false; }
    finally { setLoading(false); }
  }, []);

  const rejectItem = useCallback(async (itemId: string, type: 'question' | 'paper', revId: string, revName: string, comment?: string) => {
    setLoading(true); setError(null);
    try {
      const reason = comment || '';
      const success = type === 'question'
        ? await rejectQuestion(itemId, revId, revName, reason)
        : await rejectPaper(itemId, revId, revName, reason);
      if (success) setReviews(prev => prev.filter(r => r.itemId !== itemId));
      return success;
    } catch (err: any) { setError(err.message || 'Failed to reject'); return false; }
    finally { setLoading(false); }
  }, []);

  const refresh = useCallback(() => fetchReviews(_collegeId, _status), [fetchReviews, _collegeId, _status]);

  useEffect(() => { fetchReviews(_collegeId, _status); }, [fetchReviews, _collegeId, _status]);

  return { reviews, items: reviews, loading, error, fetchReviews, approveItem, rejectItem, refresh };
}

// ═══════════════════════════════════════════════════════════════════════
// useTestNotifications — Student Test Notifications
// ═══════════════════════════════════════════════════════════════════════

export interface UseTestNotificationsReturn {
  notifications: TestNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function useTestNotifications(
  _collegeId?: string,
  _studentId?: string
): UseTestNotificationsReturn {
  const { user } = useAuth();
  const studentId = _studentId || user?.id || '';
  const [notifications, setNotifications] = useState<TestNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!studentId || !db) return;
    setLoading(true); setError(null);
    try {
      const q = query(
        collection(db, 'testNotifications'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data: TestNotification[] = snapshot.docs.map(d => {
        const docData = d.data();
        return {
          id: d.id,
          title: docData.title || 'Notification',
          message: docData.message || '',
          type: docData.type || 'general',
          assessmentId: docData.assessmentId,
          studentId: docData.studentId,
          read: docData.read || false,
          createdAt: docData.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        };
      });
      setNotifications(data);
    } catch (err: any) { setError(err.message || 'Failed to fetch notifications'); }
    finally { setLoading(false); }
  }, [studentId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'testNotifications', notificationId), { read: true, updatedAt: Timestamp.now() });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    } catch (err: any) { setError(err.message || 'Failed to mark as read'); }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!db) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'testNotifications', n.id), { read: true, updatedAt: Timestamp.now() });
      });
      await batch.commit();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err: any) { setError(err.message || 'Failed to mark all as read'); }
  }, [notifications]);

  useEffect(() => { if (studentId) fetchNotifications(); }, [studentId, fetchNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, error, fetchNotifications, markAsRead, markAllAsRead };
}

// ═══════════════════════════════════════════════════════════════════════
// useBulkImport — Bulk Import Questions
// ═══════════════════════════════════════════════════════════════════════

export interface UseBulkImportReturn {
  result: BulkImportResult | null;
  loading: boolean;
  error: string | null;
  importQuestions: (questions: Array<Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>>) => Promise<BulkImportResult>;
  clearResult: () => void;
}

export function useBulkImport(): UseBulkImportReturn {
  const { user } = useAuth();
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importQuestions = useCallback(async (questions: Array<Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>>) => {
    setLoading(true); setError(null);
    try {
      const results = await Promise.all(
        questions.map(q => createQuestion(collegeId, q as any))
      );
      const data: BulkImportResult = {
        success: 1,
        total: questions.length,
        imported: results,
        importedIds: results.map(q => q.id),
        createdIds: results.map(q => q.id),
        failed: 0,
        errors: [],
      };
      setResult(data);
      return data;
    } catch (err: any) { setError(err.message || 'Bulk import failed'); throw err; }
    finally { setLoading(false); }
   }, [collegeId]);

  const clearResult = useCallback(() => setResult(null), []);

  return { result, loading, error, importQuestions, clearResult };
}

// ═══════════════════════════════════════════════════════════════════════
// Default export
// ═══════════════════════════════════════════════════════════════════════

export default useAssessment;