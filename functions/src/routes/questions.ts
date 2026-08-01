// src/api/questions.ts
// Questions CRUD API — connects to backend Express server (fetch-based)

import { apiClient } from './client'
import type {
  Question,
  QuestionFilters,
  PaginatedResult,
  BulkImportResult,
} from '../types/questionBank'

// Helper: Remove undefined values from object
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined).filter(v => v !== null)
  }
  if (typeof obj === 'object') {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value)
      }
    }
    return cleaned
  }
  return obj
}

// ═══════════════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════════════

export async function createQuestion(
  collegeId: string,
  data: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>
): Promise<Question> {
  if (!collegeId) {
    throw new Error('collegeId is required to create a question');
  }

  // ═══ FIX: Remove duplicate collegeId from data before sending ═══
  const { collegeId: _removed, ...cleanData } = data as any;

  const res = await apiClient.post<Question>('/questions', { ...cleanUndefined(cleanData), collegeId });
  return res.data;
}

export async function bulkCreateQuestions(
  collegeId: string,
  questions: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>[]
): Promise<BulkImportResult> {
  if (!collegeId) {
    throw new Error('collegeId is required for bulk creation');
  }

  // ═══ FIX: Remove duplicate collegeId from each question and clean undefined ═══
  const cleanQuestions = questions.map((q) => {
    const { collegeId: _removed, ...rest } = q as any;
    return cleanUndefined(rest);
  });

  const res = await apiClient.post<BulkImportResult>('/questions/bulk', {
    collegeId,
    questions: cleanQuestions,
  });
  return res.data;
}

// ═══════════════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════════════

export async function getQuestions(
  collegeId: string,
  filters: QuestionFilters = {},
  limit = 20,
  cursor?: string | null
): Promise<PaginatedResult<Question>> {
  const params: Record<string, any> = {
    collegeId,
    limit,
    ...filters,
  }
  if (cursor) params.cursor = cursor

  const res = await apiClient.get<PaginatedResult<Question>>('/questions', params)
  return res.data
}

export async function getQuestionById(id: string): Promise<Question> {
  const res = await apiClient.get<Question>(`/questions/${id}`)
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════

export async function updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
  const res = await apiClient.put<Question>(`/questions/${id}`, cleanUndefined(data))
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════════════

export async function deleteQuestion(id: string): Promise<void> {
  await apiClient.delete(`/questions/${id}`)
}

// ═══════════════════════════════════════════════════════════════════════
// CLONE
// ═══════════════════════════════════════════════════════════════════════

export async function cloneQuestion(id: string): Promise<Question> {
  const res = await apiClient.post<Question>(`/questions/${id}/clone`, {})
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════

export interface QuestionStats {
  total: number
  bySubject: Record<string, number>
  byType: Record<string, number>
  byDifficulty: Record<string, number>
  byBatch: Record<string, number>
  byBranch: Record<string, number>
  pyqCount: number
  linkedCount: number
  unusedCount: number
}

export async function getQuestionStats(collegeId: string): Promise<QuestionStats> {
  const res = await apiClient.get<QuestionStats>('/questions/stats', {
    collegeId,
  })
  return res.data
}

// ═══════════════════════════════════════════════════════════════════════
// PAPER LINKING
// ═══════════════════════════════════════════════════════════════════════

export async function linkQuestionToPaper(questionId: string, paperId: string): Promise<void> {
  await apiClient.post(`/questions/${questionId}/link`, { paperId })
}

export async function unlinkQuestionFromPaper(questionId: string, paperId: string): Promise<void> {
  await apiClient.post(`/questions/${questionId}/unlink`, { paperId })
}

// ═══════════════════════════════════════════════════════════════════════
// STUBS — implement backend endpoints when ready
// ═══════════════════════════════════════════════════════════════════════

export async function getLinkedPapers(questionId: string): Promise<any[]> {
  console.warn('[STUB] getLinkedPapers — implement GET /api/questions/:id/papers on backend')
  return []
}

export async function getBatchBranchConfig(collegeId: string): Promise<any> {
  console.warn('[STUB] getBatchBranchConfig — implement GET /api/config/batch-branch on backend')
  return { batches: [], branches: [] }
}

export async function getPYQExamYears(collegeId: string): Promise<string[]> {
  console.warn('[STUB] getPYQExamYears — implement GET /api/questions/pyq/years on backend')
  return []
}

export async function getPYQExamNames(collegeId: string, year?: string): Promise<string[]> {
  console.warn('[STUB] getPYQExamNames — implement GET /api/questions/pyq/names on backend')
  return []
}

export async function findDuplicateQuestions(collegeId: string, text: string): Promise<Question[]> {
  console.warn('[STUB] findDuplicateQuestions — implement GET /api/questions/duplicates on backend')
  return []
}