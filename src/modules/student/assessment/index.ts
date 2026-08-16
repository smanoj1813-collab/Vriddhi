// src/modules/student/assessment/index.ts
// Barrel exports for student assessment module
// NOTE: All paths are relative to src/modules/student/assessment/

// Types
export * from '../types/assessment';

// Hooks
export { useStudentTests } from '../hooks/useStudentTests';
export { useActiveTest } from '../hooks/useActiveTest';
export { useTestResult } from '../hooks/useTestResult';

// Components
export { default as QuestionRenderer } from '../components/QuestionRenderer';
export { default as TestInterface } from '../components/TestInterface';

// Pages
export { default as TestDashboard } from '../pages/TestDashboard';
export { default as ActiveTestPage } from '../pages/ActiveTestPage';
export { default as TestResultPage } from '../pages/TestResultPage';

// Routes
export { default as StudentAssessmentRoutes } from '../routes/studentAssessmentRoutes';