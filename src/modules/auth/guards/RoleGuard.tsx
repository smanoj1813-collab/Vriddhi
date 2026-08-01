import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';

// Self-contained types — swap to canonical imports once AuthContext exports stabilize
type UserRole = 'student' | 'faculty' | 'admin' | 'principal' | 'superadmin' | 'hod';
type Permission = string;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, requiredPermission, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();
  
  // Inline role check — no dependency on hasRole() from AuthContext
  if (allowedRoles && user) {
    const userRole = user.role as string;
    if (!allowedRoles.includes(userRole as UserRole)) {
      return <>{fallback}</>;
    }
  }
  
  // Inline permission check — stub until permission system is implemented
  if (requiredPermission) {
    // TODO: Wire up to AuthContext once hasPermission() is available
    if (!user) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

// Usage example inside any component:
// <RoleGuard allowedRoles={['principal']}>
//   <DeleteButton />
// </RoleGuard>