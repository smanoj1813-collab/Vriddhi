// src/modules/admin/services/questionBankAPI.ts
// Re-exports the real Firestore-backed question bank API so every admin/faculty
// surface uses one consistent implementation instead of HTTP stubs.

export {
  getQuestions,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  getQuestionStats,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  getLinkedPapers,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  findDuplicateQuestions,
} from '../api/questionBankApi'

export type { BatchBranchConfig } from '../api/questionBankApi'
