import React from 'react';
import { useAuth, type UserRole } from '../../auth/context/AuthContext';

type Permission = string;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, requiredPermission, fallback = null }: RoleGuardProps) {
  const { user, hasRole, hasPermission } = useAuth();

  if (allowedRoles && user) {
    if (!hasRole(allowedRoles)) {
      return <>{fallback}</>;
    }
  }

  if (requiredPermission) {
    if (!user || !hasPermission(requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}