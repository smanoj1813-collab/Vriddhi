import { lazy, Suspense, Component, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/routes/components/RoleRoute';
import Layout from '@/shared/components/Layout';

const AIAgentPage = lazy(() => import('./pages/AIAgentPage'));
const AdminClassSchedule = lazy(() => import('./pages/AdminClassSchedule'));
const AdminCurriculum = lazy(() => import('./pages/AdminCurriculum'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminFeeManagement = lazy(() => import('./pages/AdminFeeManagement'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Assessments = lazy(() => import('./pages/Assessments'));
const Attendance = lazy(() => import('./pages/Attendance'));
const CollegeOnboarding = lazy(() => import('./pages/CollegeOnboarding'));
const HODDashboard = lazy(() => import('./pages/HODDashboard'));
const Journey = lazy(() => import('./pages/Journey'));
const PaperBuilder = lazy(() => import('./pages/PaperBuilder'));
const PaperGeneratorAdmin = lazy(() => import('./pages/PaperGeneratorPage'));
const QuestionBank = lazy(() => import('./pages/QuestionBank'));
const Settings = lazy(() => import('./pages/Settings'));
const View360 = lazy(() => import('./pages/View360'));

// ═══════════════════════════════════════════════════════════════════════════
// Lazy loading wrappers
// ═══════════════════════════════════════════════════════════════════════════
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
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 text-sm hover:bg-teal-500/30 transition-colors">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </LazyErrorBoundary>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Admin Routes — paths MUST match Layout.tsx navItems exactly
// ═══════════════════════════════════════════════════════════════════════════
export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: (
      <RoleRoute allowedRoles={['admin', 'principal', 'hod', 'superadmin']}>
        <Layout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <LazyPage><AdminDashboard /></LazyPage> },
      { path: 'dashboard', element: <LazyPage><AdminDashboard /></LazyPage> },
      { path: 'students', element: <LazyPage><AdminDashboard /></LazyPage> },
      { path: 'view360', element: <LazyPage><View360 /></LazyPage> },
      { path: 'attendance', element: <LazyPage><Attendance /></LazyPage> },
      { path: 'assessments', element: <LazyPage><Assessments /></LazyPage> },
      { path: 'fee-management', element: <LazyPage><AdminFeeManagement /></LazyPage> },
      { path: 'question-bank', element: <LazyPage><QuestionBank /></LazyPage> },
      { path: 'paper-generator', element: <LazyPage><PaperGeneratorAdmin /></LazyPage> },
      { path: 'class-schedule', element: <LazyPage><AdminClassSchedule /></LazyPage> },
      { path: 'curriculum', element: <LazyPage><AdminCurriculum /></LazyPage> },
      { path: 'analytics', element: <LazyPage><Analytics /></LazyPage> },
      { path: 'journey', element: <LazyPage><Journey /></LazyPage> },
      { path: 'settings', element: <LazyPage><Settings /></LazyPage> },
      { path: 'hod-dashboard', element: <LazyPage><HODDashboard /></LazyPage> },
      { path: 'ai-agent', element: <LazyPage><AIAgentPage /></LazyPage> },
      { path: 'onboarding', element: <LazyPage><CollegeOnboarding /></LazyPage> },
      { path: 'papers/builder', element: <LazyPage><PaperBuilder /></LazyPage> },
      { path: 'papers/generator', element: <LazyPage><PaperGeneratorAdmin /></LazyPage> },
    ],
  },
];