// src/modules/admin/api/questions.ts
// Bridge layer that connects the existing admin/faculty question bank UI to
// the real Firestore-backed implementation in ./questionBankApi.
//
// AI generation is delegated to ./aiQuestionApi.

import {
  getQuestions,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  getQuestionStats as getFirestoreStats,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  getLinkedPapers,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  findDuplicateQuestions,
} from './questionBankApi';
import { generateQuestionsWithAI as aiGenerateQuestionsWithAI } from './aiQuestionApi';
import type { Question, QuestionFilters, PaginatedResult, BulkImportResult } from '../../admin/types/questionBank';

export {
  getQuestions,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  getLinkedPapers,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  findDuplicateQuestions,
};

// ─── Legacy HTTP-shaped interfaces kept for backward compatibility ───────
export interface AIGenerateRequest {
  subject: string
  topic: string
  questionType: string
  difficulty: string
  count?: number
  numQuestions?: number
  course?: string
  courseName?: string
  courseId?: string
  courseCode?: string
  curriculumId?: string
  moduleId?: string
  moduleName?: string
  moduleNo?: number
  unit?: string
  chapter?: string
  learningOutcomes?: string[]
  branch?: string
  batch?: string
  marks?: number
  language?: string
  provider?: 'gemini' | 'openai' | 'deepseek'
  collegeId?: string
}

export interface AIGenerateResponse {
  success: boolean
  questions: Array<Question & { firestoreId: string }>
  provider: string
  generationTime: number
  savedCount: number
  savedIds: string[]
}

export async function generateQuestionsWithAI(
  config: AIGenerateRequest
): Promise<AIGenerateResponse> {
  const result = await aiGenerateQuestionsWithAI(config as any);
  const questions = (result.questions || []).map((q, i) => ({
    ...q,
    firestoreId: (q as any).firestoreId || (q as any).id || `ai-gen-${Date.now()}-${i}`,
  }));
  return {
    success: true,
    questions: questions as Array<Question & { firestoreId: string }>,
    provider: (config.provider || 'gemini'),
    generationTime: 0,
    savedCount: questions.length,
    savedIds: [],
  };
}

// ─── Stats shape used by the UI ──────────────────────────────────────────
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
  return getFirestoreStats(collegeId) as Promise<QuestionStats>;
}
