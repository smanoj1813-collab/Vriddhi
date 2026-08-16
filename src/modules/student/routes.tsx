import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/routes/components/RoleRoute';
import StudentLayout from './components/StudentLayout';

// ── Lazy-loaded pages ────────────────────────────────────────────────
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
const Students = lazy(() => import('./pages/Students'));

// ── Component wrappers (default export safe) ────────────────────────
const SchedulingPage = lazy(() =>
  import('./components/SchedulingPage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.SchedulingPage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const UpcomingAssessments = lazy(() =>
  import('./components/UpcomingAssessments').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.UpcomingAssessments;
      return <Comp assessments={[]} />;
    },
  }))
);

const PendingAssignments = lazy(() =>
  import('./components/PendingAssignments').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.PendingAssignments;
      return <Comp assignments={[]} onSubmit={(id: string) => console.log('Submit', id)} />;
    },
  }))
);

const AttendancePage = lazy(() =>
  import('./components/AttendancePage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.AttendancePage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const FeeManagementPage = lazy(() =>
  import('./components/FeeManagementPage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.FeeManagementPage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const NotificationsPanel = lazy(() =>
  import('./components/NotificationsPanel').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.NotificationsPanel;
      return <Comp />;
    },
  }))
);

export const studentRoutes: RouteObject[] = [
  {
    path: '/student',
    element: (
      <RoleRoute allowedRoles={['student']}>
        <StudentLayout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: 'dashboard', element: <StudentDashboard /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'assessments', element: <StudentTestDashboard /> },
      { path: 'assignments', element: <PendingAssignments /> },
      { path: 'grades', element: <StudentGrades /> },
      { path: 'materials', element: <StudentMaterials /> },
      { path: 'timetable', element: <StudentTimetable /> },
      { path: 'schedule', element: <SchedulingPage /> },
      { path: 'fees', element: <FeeManagementPage /> },
      { path: 'fee-portal', element: <StudentFeePortal /> },
      { path: 'library', element: <StudentLibrary /> },
      { path: 'events', element: <StudentEvents /> },
      { path: 'notifications', element: <StudentNotificationsPage /> },
      { path: 'settings', element: <StudentSettings /> },
      { path: 'directory', element: <Students /> },

      // Test flow
      { path: 'tests', element: <StudentTestDashboard /> },
      { path: 'tests/active', element: <ActiveTestPage /> },
      { path: 'tests/instructions', element: <TestInstructionsPage /> },
      { path: 'tests/results', element: <TestResultPage /> },
      { path: 'test/:testId/instructions', element: <TestInstructionsPage /> },
      { path: 'test/:testId/take', element: <ActiveTestPage /> },
      { path: 'test/:testId/result', element: <TestResultPage /> },

      // Legacy aliases
      { path: 'upcoming-assessments', element: <UpcomingAssessments /> },
      { path: 'notifications-panel', element: <NotificationsPanel /> },
    ],
  },
];