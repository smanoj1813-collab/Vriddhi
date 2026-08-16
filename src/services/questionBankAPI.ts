// src/services/questionBankAPI.ts
// Unified Question Bank API — uses types from src/modules/admin/types/questionBank

import { Timestamp } from 'firebase/firestore';
import type {
  Question,
  QuestionFilters,
  QuestionBankStats,
  BulkImportResult,
} from '../modules/admin/types/questionBank';

// ─── Local Types (API-specific shapes) ───

export interface BatchBranchConfig {
  batches: string[];
  branches: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: unknown;
  hasMore: boolean;
}

// ─── Stub implementations (replace with real Firestore calls) ───

let mockQuestions: Question[] = [];
let mockLinkedPapers: Record<string, string[]> = {};

export async function getQuestions(
  collegeId: string,
  filters: QuestionFilters = {},
  limit = 20,
  lastDoc?: unknown
): Promise<PaginatedResult<Question>> {
  let data = mockQuestions.filter((q) => q.collegeId === collegeId);

  if (filters.subject) data = data.filter((q) => q.subject === filters.subject);
  if (filters.difficulty) data = data.filter((q) => q.difficulty === filters.difficulty);
  if (filters.type) data = data.filter((q) => q.type === filters.type);
  if (filters.batch) data = data.filter((q) => q.batch === filters.batch);
  if (filters.branch) data = data.filter((q) => q.branch === filters.branch);
  if (filters.unit) data = data.filter((q) => q.unit === filters.unit);
  if (filters.isPYQ) data = data.filter((q) => q.isPYQ);
  if (filters.examYear) data = data.filter((q) => q.examYear === filters.examYear);
  if (filters.examName) data = data.filter((q) => q.examName === filters.examName);
  if (filters.linkedToPaper) data = data.filter((q) => (q.linkedPaperIds?.length || 0) > 0);
  if (filters.searchQuery || filters.search) {
    const q = (filters.searchQuery || filters.search || '').toLowerCase();
    data = data.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters.createdBy) data = data.filter((q) => q.createdBy === filters.createdBy);
  if (filters.status) data = data.filter((q) => q.status === filters.status);

  const startIdx = typeof lastDoc === 'number' ? lastDoc : 0;
  const page = data.slice(startIdx, startIdx + limit);
  const nextLastDoc = startIdx + page.length < data.length ? startIdx + page.length : null;

  return { data: page, lastDoc: nextLastDoc, hasMore: !!nextLastDoc };
}

export async function getQuestionById(id: string): Promise<Question | null> {
  return mockQuestions.find((q) => q.id === id) || null;
}

export async function createQuestion(
  collegeId: string,
  data: Omit<Question, 'id' | 'createdAt'>
): Promise<Question> {
  const q: Question = {
    ...data,
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    collegeId,
  } as Question;
  mockQuestions.push(q);
  return q;
}

export async function updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
  const idx = mockQuestions.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error('Question not found');
  mockQuestions[idx] = { ...mockQuestions[idx], ...data };
  return mockQuestions[idx];
}

export async function deleteQuestion(id: string): Promise<void> {
  mockQuestions = mockQuestions.filter((q) => q.id !== id);
}

export async function getBatchBranchConfig(collegeId: string): Promise<BatchBranchConfig> {
  // TODO: wire to college config doc
  void collegeId;
  return { batches: ['2023', '2024', '2025'], branches: ['CSE', 'ECE', 'ME', 'CE'] };
}

export async function getPYQExamYears(collegeId: string): Promise<string[]> {
  void collegeId;
  return ['2023', '2024', '2025', '2026'];
}

export async function getPYQExamNames(collegeId: string, year: string): Promise<string[]> {
  void collegeId;
  return [`Mid-Term ${year}`, `End-Term ${year}`, `Quiz 1 ${year}`, `Quiz 2 ${year}`];
}

export async function getQuestionStats(collegeId: string): Promise<QuestionBankStats> {
  const data = mockQuestions.filter((q) => q.collegeId === collegeId);
  const bySubject: Record<string, number> = {};
  const byDifficulty: Record<string, number> = {};
  const byBatch: Record<string, number> = {};
  const byBranch: Record<string, number> = {};

  data.forEach((q) => {
    bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1;
    if (q.batch) byBatch[q.batch] = (byBatch[q.batch] || 0) + 1;
    if (q.branch) byBranch[q.branch] = (byBranch[q.branch] || 0) + 1;
  });

  return {
    totalQuestions: data.length,
    total: data.length,
    pyqCount: data.filter((q) => q.isPYQ).length,
    linkedCount: data.filter((q) => (q.linkedPaperIds?.length || 0) > 0).length,
    unusedCount: data.filter((q) => !(q.linkedPaperIds?.length || 0)).length,
    bySubject,
    byDifficulty: byDifficulty as Record<'easy' | 'medium' | 'hard', number>,
    byBatch,
    byBranch,
  } as QuestionBankStats;
}

export async function bulkImportQuestions(
  collegeId: string,
  questions: Omit<Question, 'id' | 'createdAt'>[]
): Promise<BulkImportResult> {
  let success = 0;
  const importedIds: string[] = [];
  const createdIds: string[] = [];
  const errors: string[] = [];
  const imported: Question[] = [];

  for (const q of questions) {
    try {
      const created = await createQuestion(collegeId, q);
      success++;
      importedIds.push(created.id);
      createdIds.push(created.id);
      imported.push(created);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return {
    success,
    total: questions.length,
    failed: questions.length - success,
    errors,
    importedIds,
    createdIds,
    imported: imported.length > 0 ? imported : undefined,
  };
}

export async function linkQuestionToPaper(questionId: string, paperId: string): Promise<void> {
  if (!mockLinkedPapers[questionId]) mockLinkedPapers[questionId] = [];
  if (!mockLinkedPapers[questionId].includes(paperId)) {
    mockLinkedPapers[questionId].push(paperId);
  }
  const q = mockQuestions.find((x) => x.id === questionId);
  if (q) {
    q.linkedPaperIds = mockLinkedPapers[questionId];
  }
}

export async function unlinkQuestionFromPaper(questionId: string, paperId: string): Promise<void> {
  if (mockLinkedPapers[questionId]) {
    mockLinkedPapers[questionId] = mockLinkedPapers[questionId].filter((p) => p !== paperId);
  }
  const q = mockQuestions.find((x) => x.id === questionId);
  if (q) {
    q.linkedPaperIds = mockLinkedPapers[questionId] || [];
  }
}

// ─── Legacy object export (keep for backward compat) ───
export const questionBankAPI = {
  getQuestions: async (filters?: unknown) => {
    const res = await getQuestions('', filters as QuestionFilters);
    return res.data;
  },
  getQuestionById,
  createQuestion: async (data: Omit<Question, 'id' | 'createdAt'>) => createQuestion('', data),
  updateQuestion,
  deleteQuestion,
  importQuestions: async (_file: File) =>
    ({ success: 0, failed: 0, errors: [], importedIds: [], createdIds: [] } as BulkImportResult),
};

export default questionBankAPI;