// src/api/questions.ts
// Bridge to the real Firestore-backed question bank implementation.
// Kept for backward compatibility with older imports.

export {
  getQuestions,
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions as bulkCreateQuestions,
  getQuestionStats,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  getLinkedPapers,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  findDuplicateQuestions,
} from '../modules/admin/api/questionBankApi'
