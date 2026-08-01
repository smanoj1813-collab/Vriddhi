import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RoleRoute, PageLoader } from './components';

const Students = lazy(() => import('../modules/student/pages/Students'));
const View360 = lazy(() => import('../modules/admin/pages/View360'));
const Attendance = lazy(() => import('../modules/faculty/pages/Attendance'));  // ← fixed path
const Assessments = lazy(() => import('../modules/admin/pages/Assessments'));
const Settings = lazy(() => import('../modules/admin/pages/Settings'));
const AdminDashboard = lazy(() => import('../modules/admin/pages/AdminDashboard'));
const AdminClassSchedule = lazy(() => import('../modules/admin/pages/AdminClassSchedule'));
const AdminFeeManagement = lazy(() => import('../modules/admin/pages/AdminFeeManagement'));
const AdminCurriculum = lazy(() => import('../modules/admin/pages/AdminCurriculum'));
const HODDashboard = lazy(() => import('../modules/admin/pages/HODDashboard'));
const QuestionBank = lazy(() => import('../modules/admin/pages/QuestionBank'));
const QuestionBankAdmin = lazy(() => import('../modules/admin/components/question-bank/FacultyBankAdmin'));
const PaperGeneratorAdmin = lazy(() => import('../modules/admin/pages/PaperGeneratorAdmin'));
const Analytics = lazy(() => import('../modules/admin/pages/Analytics'));
const Journey = lazy(() => import('../modules/admin/pages/Journey'));

export function AdminRoutes() {
  return (
    <Routes>
      {/* Admin-only */}
      <Route path="/admin" element={
        <RoleRoute allowedRoles={['admin']}>
          <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/fees" element={
        <RoleRoute allowedRoles={['admin']}>
          <Suspense fallback={<PageLoader />}><AdminFeeManagement /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/settings" element={
        <RoleRoute allowedRoles={['admin']}>
          <Suspense fallback={<PageLoader />}><Settings /></Suspense>
        </RoleRoute>
      } />

      {/* Admin + HOD + Mentor */}
      <Route path="/admin/students" element={
        <RoleRoute allowedRoles={['admin', 'hod', 'mentor']}>
          <Suspense fallback={<PageLoader />}><Students /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/attendance" element={
        <RoleRoute allowedRoles={['admin', 'hod', 'mentor']}>
          <Suspense fallback={<PageLoader />}><Attendance /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/assessments" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><Assessments /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/class-schedule" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><AdminClassSchedule /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/question-bank" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><QuestionBank /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/question-bank/admin" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><QuestionBankAdmin /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/paper-generator" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><PaperGeneratorAdmin /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/analytics" element={
        <RoleRoute allowedRoles={['admin', 'hod', 'mentor']}>
          <Suspense fallback={<PageLoader />}><Analytics /></Suspense>
        </RoleRoute>
      } />
      <Route path="/admin/journey" element={
        <RoleRoute allowedRoles={['admin', 'hod', 'mentor', 'faculty']}>
          <Suspense fallback={<PageLoader />}><Journey /></Suspense>
        </RoleRoute>
      } />

      {/* Admin + HOD + Mentor + Faculty */}
      <Route path="/admin/360-view" element={
        <RoleRoute allowedRoles={['admin', 'hod', 'mentor', 'faculty']}>
          <Suspense fallback={<PageLoader />}><View360 /></Suspense>
        </RoleRoute>
      } />

      {/* Curriculum */}
      <Route path="/admin/curriculum" element={
        <RoleRoute allowedRoles={['admin', 'hod']}>
          <Suspense fallback={<PageLoader />}><AdminCurriculum /></Suspense>
        </RoleRoute>
      } />

      {/* HOD-only */}
      <Route path="/admin/hod" element={
        <RoleRoute allowedRoles={['hod']}>
          <Suspense fallback={<PageLoader />}><HODDashboard /></Suspense>
        </RoleRoute>
      } />
    </Routes>
  );
}