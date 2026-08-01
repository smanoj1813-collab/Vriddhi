// src/services/questionBankAPI.ts
// Bridge layer: re-exports from src/api/questions.ts for useQuestionBank hook compatibility

export {
  createQuestion,
  bulkCreateQuestions as bulkImportQuestions,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  cloneQuestion,
  // Stubs
  getLinkedPapers,
  getBatchBranchConfig,
  getPYQExamYears,
  getPYQExamNames,
  findDuplicateQuestions,
} from '../api/questions'

export type { QuestionStats } from '../api/questions'