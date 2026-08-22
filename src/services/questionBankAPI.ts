// src/services/questionBankAPI.ts
// Re-exports the real Firestore-backed question bank API. This replaces the
// previous in-memory mock so FacultyQuestionBank and other consumers persist
// questions and paper links through the same repository as the admin UI.

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
} from '../modules/admin/api/questionBankApi'

export type { BatchBranchConfig } from '../modules/admin/api/questionBankApi'
