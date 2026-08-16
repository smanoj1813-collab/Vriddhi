import type { RouteObject } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { authRoutes } from '@/modules/auth/routes';
import { studentRoutes } from '@/modules/student/routes';
import { facultyRoutes } from '@/modules/faculty/routes';
import { adminRoutes } from '@/modules/admin/routes';
import { superadminRoutes } from '@/modules/superadmin/routes';

const ROLE_DASHBOARD: Record<string, string> = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  principal: '/admin/dashboard',   // ← legacy admin basis
  faculty: '/faculty/dashboard',
  hod: '/faculty/dashboard',
  mentor: '/faculty/dashboard',
  student: '/student/dashboard',
};

function RootRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
      return;
    }

    const target = ROLE_DASHBOARD[user.role];
    if (target && location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [isLoading, user, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  return null;
}

function NotFoundHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [isLoading, location.pathname, navigate]);

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
  // NO principalRoutes — principal uses adminRoutes
  { path: '*', element: <NotFoundHandler /> },
];