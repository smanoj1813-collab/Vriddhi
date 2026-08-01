import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RoleRoute, PageLoader } from './components';
import FacultyImport from '../modules/superadmin/components/FacultyImport';

const SuperAdminDashboard = lazy(() => import('../modules/superadmin/pages/SuperAdminDashboard'));
const SuperAdminColleges = lazy(() => import('../modules/superadmin/pages/SuperAdminColleges'));
const SuperAdminAdmins = lazy(() => import('../modules/superadmin/pages/SuperAdminAdmins'));
const SuperAdminStudents = lazy(() => import('../modules/superadmin/pages/SuperAdminStudents'));
const CreateCollege = lazy(() => import('../modules/superadmin/pages/CreateCollege'));
const SuperAdminFaculty = lazy(() => import('../modules/superadmin/pages/SuperAdminFaculty'));
const SuperAdminFacultyDetail = lazy(() => import('../modules/superadmin/pages/SuperAdminFacultyDetail'));
const CreateCollegeAdmin = lazy(() => import('../modules/superadmin/pages/CreateCollegeAdmin'));
const UserImport = lazy(() => import('../modules/superadmin/pages/UserImport'));
const SuperAdminCollegeDetail = lazy(() => import('../modules/superadmin/pages/SuperAdminCollegeDetail'));
const SuperAdminUniversities = lazy(() => import('../modules/superadmin/pages/SuperAdminUniversities'));
const SuperAdminUniversityDetail = lazy(() => import('../modules/superadmin/pages/SuperAdminUniversityDetail'));
const SuperAdminCurriculum = lazy(() => import('../modules/superadmin/pages/SuperAdminCurriculum'));
const MultiCollegeComparison = lazy(() => import('../modules/superadmin/pages/MultiCollegeComparison'));
const SubscriptionBilling = lazy(() => import('../modules/superadmin/pages/SubscriptionBilling'));
const SystemHealthMonitor = lazy(() => import('../modules/superadmin/pages/SystemHealthMonitor'));

export function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/superadmin" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminDashboard /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/colleges" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminColleges /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/college/:id" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminCollegeDetail /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/colleges/create" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><CreateCollege /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/create-admin" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><CreateCollegeAdmin /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/admins" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminAdmins /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/students" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminStudents /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/user-import" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><UserImport /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/faculty-import" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><FacultyImport /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/faculty" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminFaculty /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/faculty/:id" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminFacultyDetail /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/comparison" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><MultiCollegeComparison /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/billing" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SubscriptionBilling /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/health" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SystemHealthMonitor /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/universities" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminUniversities /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/university/:id" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminUniversityDetail /></Suspense>
        </RoleRoute>
      } />
      <Route path="/superadmin/curriculum" element={
        <RoleRoute allowedRoles={['superadmin']}>
          <Suspense fallback={<PageLoader />}><SuperAdminCurriculum /></Suspense>
        </RoleRoute>
      } />
    </Routes>
  );
}