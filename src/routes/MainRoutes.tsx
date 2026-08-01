import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/context/AuthContext';
import { PageLoader } from './components';
import FacultyRoutes from './FacultyRoutes';
import { AdminRoutes } from './AdminRoutes';
import { SuperAdminRoutes } from './SuperAdminRoutes';
import Unauthorized from '../modules/auth/pages/Unauthorized';

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Cast to string to avoid strict UserRole union comparison issues
  const role = user.role as string;

  switch (role) {
    case 'student':
      return <Navigate to="/student" replace />;
    case 'faculty':
      return <Navigate to="/faculty" replace />;
    case 'admin':
    case 'principal':
    case 'hod':
      return <Navigate to="/admin" replace />;
    case 'superadmin':
      return <Navigate to="/superadmin" replace />;
    default:
      return <Navigate to="/unauthorized" replace />;
  }
}

export default function MainRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/faculty/*" element={<FacultyRoutes />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/superadmin/*" element={<SuperAdminRoutes />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}