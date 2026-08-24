// src/modules/student/assessment/index.ts
// Barrel exports for the student assessment module.
// Phase 2: the legacy parallel engines (useActiveTest, useAssessment) were
// removed — the engine lives in api/testApi.ts and the list source of truth
// is api/studentDataApi.ts (fetchStudentTests).

// Types
export * from '../types/assessment';

// Hooks
export { useStudentTests } from '../hooks/useStudentTests';
export { useTestResult } from '../hooks/useTestResult';

// Components
export { default as QuestionRenderer } from '../components/QuestionRenderer';

// Pages
export { default as ActiveTestPage } from '../pages/ActiveTestPage';
export { default as TestResultPage } from '../pages/TestResultPage';

// Routes
export { default as StudentAssessmentRoutes } from '../routes/studentAssessmentRoutes';
