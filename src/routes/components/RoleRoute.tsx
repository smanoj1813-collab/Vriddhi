import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/modules/auth/context/AuthContext';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!hasRole(allowedRoles)) {
    // One line, at the only point where a role actually costs someone a page:
    // which route, who they are, and what the route accepts. Every other role
    // question on the app is a render decision and stays quiet.
    console.warn('[RoleRoute] access denied', {
      path: location.pathname,
      role: user.role,
      allowedRoles,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}