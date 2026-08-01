// components/assessment/index.ts
// ============================================
// ASSESSMENT MODULE EXPORTS
// ============================================

// Student Portal Components
export { default as StudentAssessmentPortal } from '../../modules/student/components/StudentAssessmentPortal';
export { default as TestInterface } from '../../modules/student/components/TestInterface';
export { default as TestResultView } from '../../modules/student/components/TestResultView';

// Faculty Components
export { default as QuestionManager } from '../../modules/faculty/components/QuestionManager';
export { default as PaperBuilder } from '../../modules/faculty/components/PaperBuilder';
export { default as TestScheduler } from '../../modules/faculty/components/TestScheduler';

// Admin Components
export { default as ReviewQueue } from '../../components/ReviewQueue';

// Re-export hooks for convenience
export {
  useQuestions,
  useQuestion,
  usePapers,
  usePaper,
  useScheduledTests,
  useStudentTests,
  useActiveTest,
  useTestResult,
  useTestResults,
  useTestAnalytics,
  useReviewQueue,
  useTestNotifications,
  useBulkImport,
} from '../../hooks/useAssessment';

// Re-export types
export type {
  AssessmentQuestion,
  AssessmentPaper,
  ScheduledTest,
  StudentSubmission,
  StudentTestCard,
  TestResultSummary,
  TestAnalytics,
  ReviewQueueItem,
  TestNotification,
  CreateQuestionInput,
  CreatePaperInput,
  ScheduleTestInput,
  SubmitTestInput,
  QuestionFilter,
  TestFilter,
  ActiveTestState,
  StudentAnswer,
  QuestionType,
  QuestionDifficulty,
  QuestionStatus,
  PaperStatus,
  TestStatus,
  PaperType,
  TestVisibility,
} from '../../types/assessment';