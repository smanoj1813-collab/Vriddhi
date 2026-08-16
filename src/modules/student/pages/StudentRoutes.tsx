import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';

// ── Lazy-loaded student pages ─────────────────────────────────────────
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const StudentGrades = lazy(() => import('./StudentGrades'));
const StudentSettings = lazy(() => import('./StudentSettings'));
const StudentMaterials = lazy(() => import('./StudentMaterials'));
const StudentTimetable = lazy(() => import('./StudentTimetable'));
const StudentLibrary = lazy(() => import('./StudentLibrary'));
const StudentEvents = lazy(() => import('./StudentEvents'));
const StudentNotificationsPage = lazy(() => import('./StudentNotificationsPage'));
const StudentFeePortal = lazy(() => import('./StudentFeePortal'));
const StudentTestDashboard = lazy(() => import('./StudentTestDashboard'));
const TestInstructionsPage = lazy(() => import('./TestInstructionsPage'));
const ActiveTestPage = lazy(() => import('./ActiveTestPage'));
const TestResultPage = lazy(() => import('./TestResultPage'));
const Students = lazy(() => import('./Students'));

// ── Component wrappers (default export safe) ──────────────────────────
const SchedulingPageWrapper = lazy(() =>
  import('../components/SchedulingPage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.SchedulingPage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const UpcomingAssessmentsWrapper = lazy(() =>
  import('../components/UpcomingAssessments').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.UpcomingAssessments;
      return <Comp assessments={[]} />;
    },
  }))
);

const PendingAssignmentsWrapper = lazy(() =>
  import('../components/PendingAssignments').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.PendingAssignments;
      return <Comp assignments={[]} onSubmit={(id: string) => console.log('Submit assignment', id)} />;
    },
  }))
);

const AttendancePageWrapper = lazy(() =>
  import('../components/AttendancePage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.AttendancePage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const FeeManagementPageWrapper = lazy(() =>
  import('../components/FeeManagementPage').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.FeeManagementPage;
      return <Comp studentId={localStorage.getItem('studentToken') || ''} />;
    },
  }))
);

const NotificationsPanelWrapper = lazy(() =>
  import('../components/NotificationsPanel').then((m: any) => ({
    default: () => {
      const Comp = m.default || m.NotificationsPanel;
      return <Comp />;
    },
  }))
);

// ── Page Loader Fallback ────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400" />
    </div>
  );
}

// ── Auth Guard ──────────────────────────────────────────────────────
function StudentAuthGuard({ children }: { children: React.ReactNode }) {
  const studentToken = localStorage.getItem('studentToken');
  const studentRole = localStorage.getItem('studentRole');

  if (!studentToken || studentRole !== 'student') {
    return <Navigate to="/student/login" replace />;
  }

  return <>{children}</>;
}

// ── Student Layout ──────────────────────────────────────────────────
export default function StudentRoutes() {
  return (
    <StudentAuthGuard>
      <div className="flex min-h-screen bg-slate-950">
        <StudentSidebar />
        <main className="flex-1 overflow-auto pb-20 md:pb-0 pt-16 md:pt-0">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/attendance" element={<AttendancePageWrapper />} />
              <Route path="/assessments" element={<StudentTestDashboard />} />
              <Route path="/assignments" element={<PendingAssignmentsWrapper />} />
              <Route path="/grades" element={<StudentGrades />} />
              <Route path="/materials" element={<StudentMaterials />} />
              <Route path="/timetable" element={<StudentTimetable />} />
              <Route path="/schedule" element={<SchedulingPageWrapper />} />
              <Route path="/fees" element={<FeeManagementPageWrapper />} />
              <Route path="/fee-portal" element={<StudentFeePortal />} />
              <Route path="/library" element={<StudentLibrary />} />
              <Route path="/events" element={<StudentEvents />} />
              <Route path="/notifications" element={<StudentNotificationsPage />} />
              <Route path="/settings" element={<StudentSettings />} />
              <Route path="/directory" element={<Students />} />
              <Route path="/tests" element={<StudentTestDashboard />} />
              <Route path="/tests/active" element={<ActiveTestPage />} />
              <Route path="/tests/instructions" element={<TestInstructionsPage />} />
              <Route path="/tests/results" element={<TestResultPage />} />
              <Route path="/test/:testId/instructions" element={<TestInstructionsPage />} />
              <Route path="/test/:testId/take" element={<ActiveTestPage />} />
              <Route path="/test/:testId/result" element={<TestResultPage />} />
              <Route path="/upcoming-assessments" element={<UpcomingAssessmentsWrapper />} />
              <Route path="/notifications-panel" element={<NotificationsPanelWrapper />} />
              <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </StudentAuthGuard>
  );
}