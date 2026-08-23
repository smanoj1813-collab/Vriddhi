import { lazy, Suspense, Component, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/routes/components/RoleRoute';
import { useAuth } from '@/modules/auth/context/AuthContext';
import Layout from '@/shared/components/Layout';

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG: RouteTracer logs which route component is actually rendering.
// Open browser DevTools (F12) → Console to verify.
// ═══════════════════════════════════════════════════════════════════════════
function RouteTracer({ label, children }: { label: string; children: ReactNode }) {
  console.log(`[RouteTracer] ✅ Rendering: ${label} at ${window.location.pathname}`);
  return <>{children}</>;
}

const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const FacultyAttendance = lazy(() => import('./pages/FacultyAttendance'));
const FacultyAttendanceMarking = lazy(() => import('./components/FacultyAttendanceMarking'));
const FacultyTopics = lazy(() => import('./pages/FacultyTopics'));
const FacultyPapers = lazy(() => import('./pages/FacultyPapers'));
const FacultyQuestionBank = lazy(() => import('./pages/FacultyQuestionBank'));
const FacultyPaperGenerator = lazy(() => import('./pages/FacultyPaperGenerator'));
const FacultyStudentAnalysis = lazy(() => import('./pages/FacultyStudentAnalysis'));
const FacultyReschedule = lazy(() => import('./pages/FacultyReschedule'));
const FacultyUploadMaterial = lazy(() => import('./pages/FacultyUploadMaterial'));
const FacultyLibrary = lazy(() => import('./pages/FacultyLibrary'));
const FacultyAnnouncements = lazy(() => import('./pages/FacultyAnnouncements'));
const FacultyAssignments = lazy(() => import('./pages/FacultyAssignments'));
const FacultyCalendar = lazy(() => import('./pages/FacultyCalendar'));
const FacultyCurriculum = lazy(() => import('./pages/FacultyCurriculum'));
const FacultySchedule = lazy(() => import('./pages/FacultySchedule'));
const FacultyAIQuestions = lazy(() => import('./pages/FacultyAIQuestions'));
const FacultySettings = lazy(() => import('./pages/FacultySettings'));
const View360 = lazy(() => import('../admin/pages/View360'));

function FacultyAttendanceMarkingWrapper() {
  const { user } = useAuth();
  return (
    <FacultyAttendanceMarking
      collegeId={user?.collegeId ?? ''}
      facultyId={user?.uid ?? user?.id ?? ''}
      facultyName={user?.name ?? ''}
    />
  );
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading page...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Boundary: catches lazy import failures so you see the error
// instead of a blank white screen or wrong component.
// ═══════════════════════════════════════════════════════════════════════════
class LazyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[LazyErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-rose-400 text-4xl mb-3">⚠</div>
            <h3 className="text-lg font-bold text-white mb-2">Failed to load page</h3>
            <p className="text-sm text-slate-400 mb-2 font-mono bg-slate-800 p-2 rounded">{this.state.error?.message || 'Unknown error'}</p>
            <p className="text-xs text-slate-500 mb-4">Check console for stack trace</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 text-sm hover:bg-teal-500/30 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LazyPage({ label, children }: { label: string; children: ReactNode }) {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <RouteTracer label={label}>{children}</RouteTracer>
      </Suspense>
    </LazyErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Faculty Routes — ONLY faculty, hod, and mentor can access these pages.
// Principals, admins, and superadmins should use /admin/* routes instead.
// ═══════════════════════════════════════════════════════════════════════════
export const facultyRoutes: RouteObject[] = [
  {
    path: '/faculty',
    element: (
      <RoleRoute allowedRoles={['faculty', 'hod', 'mentor']}>
        <Layout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <LazyPage label="faculty/index"><FacultyDashboard /></LazyPage> },
      { path: 'dashboard', element: <LazyPage label="faculty/dashboard"><FacultyDashboard /></LazyPage> },
      { path: 'attendance', element: <LazyPage label="faculty/attendance"><FacultyAttendance /></LazyPage> },
      { path: 'attendance-marking', element: <LazyPage label="faculty/attendance-marking"><FacultyAttendanceMarkingWrapper /></LazyPage> },
      { path: 'topics', element: <LazyPage label="faculty/topics"><FacultyTopics /></LazyPage> },
      { path: 'papers', element: <LazyPage label="faculty/papers"><FacultyPapers /></LazyPage> },
      { path: 'question-bank', element: <LazyPage label="faculty/question-bank"><FacultyQuestionBank /></LazyPage> },
      { path: 'paper-generator', element: <LazyPage label="faculty/paper-generator"><FacultyPaperGenerator /></LazyPage> },
      { path: 'student-analysis', element: <LazyPage label="faculty/student-analysis"><FacultyStudentAnalysis /></LazyPage> },
      { path: 'reschedule', element: <LazyPage label="faculty/reschedule"><FacultyReschedule /></LazyPage> },
      { path: 'upload-material', element: <LazyPage label="faculty/upload-material"><FacultyUploadMaterial /></LazyPage> },
      { path: 'library', element: <LazyPage label="faculty/library"><FacultyLibrary /></LazyPage> },
      { path: 'announcements', element: <LazyPage label="faculty/announcements"><FacultyAnnouncements /></LazyPage> },
      { path: 'assignments', element: <LazyPage label="faculty/assignments"><FacultyAssignments /></LazyPage> },
      { path: 'calendar', element: <LazyPage label="faculty/calendar"><FacultyCalendar /></LazyPage> },
      { path: 'curriculum', element: <LazyPage label="faculty/curriculum"><FacultyCurriculum /></LazyPage> },
      { path: 'schedule', element: <LazyPage label="faculty/schedule"><FacultySchedule /></LazyPage> },
      { path: 'ai-questions', element: <LazyPage label="faculty/ai-questions"><FacultyAIQuestions /></LazyPage> },
      { path: 'view360', element: <LazyPage label="faculty/view360"><View360 /></LazyPage> },
      { path: 'settings', element: <LazyPage label="faculty/settings"><FacultySettings /></LazyPage> },
    ],
  },
];