import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/routes/components/RoleRoute';
import StudentLayout from './components/StudentLayout';
import { StudentDataProvider } from './hooks/useStudentData';

// ── Lazy-loaded pages (all read identity from AuthContext) ────────────
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentGrades = lazy(() => import('./pages/StudentGrades'));
const StudentSettings = lazy(() => import('./pages/StudentSettings'));
const StudentMaterials = lazy(() => import('./pages/StudentMaterials'));
const StudentTimetable = lazy(() => import('./pages/StudentTimetable'));
const StudentLibrary = lazy(() => import('./pages/StudentLibrary'));
const StudentEvents = lazy(() => import('./pages/StudentEvents'));
const StudentNotificationsPage = lazy(() => import('./pages/StudentNotificationsPage'));
const StudentFeePortal = lazy(() => import('./pages/StudentFeePortal'));
const StudentTestDashboard = lazy(() => import('./pages/StudentTestDashboard'));
const TestInstructionsPage = lazy(() => import('./pages/TestInstructionsPage'));
const ActiveTestPage = lazy(() => import('./pages/ActiveTestPage'));
const TestResultPage = lazy(() => import('./pages/TestResultPage'));
const AttendancePage = lazy(() => import('./components/AttendancePage'));
const StudentAssignments = lazy(() => import('./pages/StudentAssignments'));

export const studentRoutes: RouteObject[] = [
  {
    path: '/student',
    element: (
      // `parent` is accepted only because roleRoutes lands that role here until a
      // parent portal exists; every read is still keyed to the signed-in uid, and
      // Firestore rules, not this guard, decide what is visible.
      <RoleRoute allowedRoles={['student', 'parent']}>
        <StudentDataProvider>
          <StudentLayout />
        </StudentDataProvider>
      </RoleRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'dashboard', element: <StudentDashboard /> },

      // Core pages
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'assessments', element: <StudentTestDashboard /> },
      { path: 'assignments', element: <StudentAssignments /> },
      { path: 'grades', element: <StudentGrades /> },

      // Test flow — both /assessments/:id and /test/:id styles supported
      { path: 'assessments/:testId/instructions', element: <TestInstructionsPage /> },
      { path: 'assessments/:testId/take', element: <ActiveTestPage /> },
      { path: 'assessments/:testId/result', element: <TestResultPage /> },
      { path: 'test/:testId/instructions', element: <TestInstructionsPage /> },
      { path: 'test/:testId/take', element: <ActiveTestPage /> },
      { path: 'test/:testId/result', element: <TestResultPage /> },

      // Secondary pages
      { path: 'materials', element: <StudentMaterials /> },
      { path: 'timetable', element: <StudentTimetable /> },
      { path: 'fees', element: <StudentFeePortal /> },
      { path: 'fee-portal', element: <StudentFeePortal /> },
      { path: 'library', element: <StudentLibrary /> },
      { path: 'events', element: <StudentEvents /> },
      { path: 'notifications', element: <StudentNotificationsPage /> },
      { path: 'settings', element: <StudentSettings /> },
    ],
  },
];
