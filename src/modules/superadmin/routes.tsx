import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from '@/routes/components/RoleRoute';
import Layout from '@/shared/components/Layout';

const CreateCollege = lazy(() => import('./pages/CreateCollege'));
const CreateCollegeAdmin = lazy(() => import('./pages/CreateCollegeAdmin'));
const FacultyImport = lazy(() => import('./pages/FacultyImport'));
const MultiCollegeComparison = lazy(() => import('./pages/MultiCollegeComparison'));
const SubscriptionBilling = lazy(() => import('./pages/SubscriptionBilling'));
const SuperAdminAdmins = lazy(() => import('./pages/SuperAdminAdmins'));
const SuperAdminCollegeDetail = lazy(() => import('./pages/SuperAdminCollegeDetail'));
const SuperAdminColleges = lazy(() => import('./pages/SuperAdminColleges'));
const SuperAdminCurriculum = lazy(() => import('./pages/SuperAdminCurriculum'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminFaculty = lazy(() => import('./pages/SuperAdminFaculty'));
const SuperAdminFacultyDetail = lazy(() => import('./pages/SuperAdminFacultyDetail'));
const SuperAdminStudents = lazy(() => import('./pages/SuperAdminStudents'));
const SuperAdminUniversities = lazy(() => import('./pages/SuperAdminUniversities'));
const SuperAdminUniversityDetail = lazy(() => import('./pages/SuperAdminUniversityDetail'));
const SystemHealthMonitor = lazy(() => import('./pages/SystemHealthMonitor'));
const UserImport = lazy(() => import('./pages/UserImport'));

export const superadminRoutes: RouteObject[] = [
  {
    path: '/superadmin',
    element: (
      <RoleRoute allowedRoles={['superadmin']}>
        <Layout />
      </RoleRoute>
    ),
    children: [
      { index: true, element: <SuperAdminDashboard /> },
      { path: 'dashboard', element: <SuperAdminDashboard /> },
      { path: 'colleges', element: <SuperAdminColleges /> },
      { path: 'colleges/new', element: <CreateCollege /> },
      { path: 'colleges/:id', element: <SuperAdminCollegeDetail /> },
      { path: 'universities', element: <SuperAdminUniversities /> },
      { path: 'universities/:id', element: <SuperAdminUniversityDetail /> },
      { path: 'admins', element: <SuperAdminAdmins /> },
      { path: 'admins/new', element: <CreateCollegeAdmin /> },
      { path: 'students', element: <SuperAdminStudents /> },
      { path: 'students/import', element: <UserImport /> },
      { path: 'faculty', element: <SuperAdminFaculty /> },
      { path: 'faculty/:id', element: <SuperAdminFacultyDetail /> },
      { path: 'faculty/import', element: <FacultyImport /> },
      { path: 'curriculum', element: <SuperAdminCurriculum /> },
      { path: 'comparison', element: <MultiCollegeComparison /> },
      { path: 'billing', element: <SubscriptionBilling /> },
      { path: 'health', element: <SystemHealthMonitor /> },
    ],
  },
];