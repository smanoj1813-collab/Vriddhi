import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../context/AuthContext';
import PageLoader from '@/shared/components/PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  fallback = '/',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    const isStudentRoute = location.pathname.startsWith('/student');
    return <Navigate to={isStudentRoute ? '/student-login' : '/'} replace />;
  }

  if (!hasRole(allowedRoles)) {
    console.error(
      `[ProtectedRoute] Access denied to ${location.pathname}. ` +
      `User role: ${user.role}, required: ${allowedRoles.join(', ')}`
    );
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
