// src/components/assessment/index.ts
// Assessment barrel — exports only hooks that actually exist in useAssessment.ts

export {
  useStudentTests,
  useActiveTest,
  useTestResult,
} from '../../hooks/useAssessment';

export type {
  AssessmentQuestion,
  AssessmentPaper,
  PaperSection,
  StudentSubmission,
  StudentTest,
  StudentTestCard,
  TestAnalytics,
  ReviewQueueItem,
  TestNotification,
  CreateQuestionInput,
  CreatePaperInput,
  ScheduleTestInput,
  ScheduledTest,
  SubmitTestInput,
  QuestionFilter,
  TestFilter,
  ActiveTest,
  ActiveTestState,
  QuestionDifficulty,
  QuestionStatus,
} from '../../types/assessment';