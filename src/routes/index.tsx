import type { RouteObject } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { dashboardPathFor } from '@/modules/auth/roleRoutes';
import { authRoutes } from '@/modules/auth/routes';
import Unauthorized from '@/modules/auth/pages/Unauthorized';
import { studentRoutes } from '@/modules/student/routes';
import { facultyRoutes } from '@/modules/faculty/routes';
import { adminRoutes } from '@/modules/admin/routes';
import { superadminRoutes } from '@/modules/superadmin/routes';
import { prepRoutes } from '@/modules/prep/routes';
import { employeeRoutes } from '@/modules/employee/routes';
import { publicCourseRoutes } from '@/modules/courses/routes';

const LandingPage = lazy(() => import('@/modules/landing/LandingPage'));

function RouteLoading() {
  return (
    <div role="status" aria-live="polite" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#476555', fontSize: 14 }}>
      Loading your workspace…
    </div>
  );
}

/** Anonymous visitors get the public homepage; authenticated users keep their
 * existing role-based dashboard. The landing page never assigns a role. */
function RootRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;
    const target = dashboardPathFor(user.role);
    if (target && target !== '/login') navigate(target, { replace: true });
  }, [isLoading, user, navigate]);

  if (isLoading) return <RouteLoading />;
  if (!user) return <Suspense fallback={<RouteLoading />}><LandingPage /></Suspense>;
  return <RouteLoading />;
}

function NotFoundHandler() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    navigate('/', { replace: true });
  }, [isLoading, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>404 — Page Not Found</h2>
    </div>
  );
}

export const appRoutes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  ...authRoutes,
  ...studentRoutes,
  ...facultyRoutes,
  ...adminRoutes,
  ...superadminRoutes,
  // Vriddhi platform employees (academic work across assigned colleges).
  ...employeeRoutes,
  // NO principalRoutes — principal uses adminRoutes
  // Public Prep catalog (shareable, college-free) — must sit before the
  // catch-all so /prep/... links resolve instead of 404-redirecting home.
  ...prepRoutes,
  // Existing public course previews are unchanged. The landing page does not
  // link to them or import their manifests: course titles stay off the homepage.
  ...publicCourseRoutes,
  { path: '*', element: <NotFoundHandler /> },
];
