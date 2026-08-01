import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PageLoader } from './components'

// ── Lazy-loaded student pages ─────────────────────────────────────────
const StudentSidebar = lazy(() => import('../modules/student/components/StudentSidebar'))
const StudentDashboard = lazy(() => import('../modules/student/pages/StudentDashboard'))
const SchedulingPage = lazy(() => import('../modules/student/components/SchedulingPage').then(m => ({ default: m.SchedulingPage })))
const UpcomingAssessments = lazy(() => import('../modules/student/components/UpcomingAssessments'))
const PendingAssignments = lazy(() => import('../modules/student/components/PendingAssignments'))
const AttendancePage = lazy(() => import('../modules/student/components/AttendancePage').then(m => ({ default: m.AttendancePage })))
const FeeManagementPage = lazy(() => import('../modules/student/components/FeeManagementPage').then(m => ({ default: m.FeeManagementPage })))
const NotificationsPanel = lazy(() => import('../modules/student/components/NotificationsPanel'))
const StudentGrades = lazy(() => import('../modules/student/pages/StudentGrades'))
const StudentSettings = lazy(() => import('../modules/student/pages/StudentSettings'))
const StudentMaterials = lazy(() => import('../modules/student/pages/StudentMaterials'))
const StudentTimetable = lazy(() => import('../modules/student/pages/StudentTimetable'))
const StudentLibrary = lazy(() => import('../modules/student/pages/StudentLibrary'))
const StudentEvents = lazy(() => import('../modules/student/pages/StudentEvents'))
const StudentNotificationsPage = lazy(() => import('../modules/student/pages/StudentNotificationsPage'))
const StudentTestDashboard = lazy(() => import('../modules/student/pages/StudentTestDashboard'))
const TestInstructionsPage = lazy(() => import('../modules/student/pages/TestInstructionsPage'))
const ActiveTestPage = lazy(() => import('../modules/student/pages/ActiveTestPage'))
const TestResultPage = lazy(() => import('../modules/student/pages/TestResultPage'))

// ── Student Layout ────────────────────────────────────────────────────
function StudentLayout() {
  const studentToken = localStorage.getItem('studentToken')
  const studentRole = localStorage.getItem('studentRole')
  if (!studentToken || studentRole !== 'student') return <Navigate to="/student/login" replace />

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Suspense fallback={<div className="w-72 bg-slate-900" />}>
        <StudentSidebar />
      </Suspense>
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/schedule" element={
            <Suspense fallback={<PageLoader />}>
              <SchedulingPage studentId={studentToken} />
            </Suspense>
          } />
          <Route path="/assessments" element={
            <Suspense fallback={<PageLoader />}>
              <StudentTestDashboard />
            </Suspense>
          } />
          <Route path="/test/:testId/instructions" element={
            <Suspense fallback={<PageLoader />}>
              <TestInstructionsPage />
            </Suspense>
          } />
          <Route path="/test/:testId/take" element={
            <Suspense fallback={<PageLoader />}>
              <ActiveTestPage />
            </Suspense>
          } />
          <Route path="/test/:testId/result" element={
            <Suspense fallback={<PageLoader />}>
              <TestResultPage />
            </Suspense>
          } />
          <Route path="/upcoming-assessments" element={
            <Suspense fallback={<PageLoader />}>
              <UpcomingAssessments assessments={[]} />
            </Suspense>
          } />
          <Route path="/assignments" element={
            <Suspense fallback={<PageLoader />}>
              <PendingAssignments
                assignments={[]}
                onSubmit={(assignmentId: string) => {
                  console.log('Submit assignment', assignmentId)
                }}
              />
            </Suspense>
          } />
          <Route path="/attendance" element={
            <Suspense fallback={<PageLoader />}>
              <AttendancePage studentId={studentToken} />
            </Suspense>
          } />
          <Route path="/grades" element={
            <Suspense fallback={<PageLoader />}>
              <StudentGrades />
            </Suspense>
          } />
          <Route path="/fees" element={
            <Suspense fallback={<PageLoader />}>
              <FeeManagementPage studentId={studentToken} />
            </Suspense>
          } />
          <Route path="/materials" element={
            <Suspense fallback={<PageLoader />}>
              <StudentMaterials />
            </Suspense>
          } />
          <Route path="/timetable" element={
            <Suspense fallback={<PageLoader />}>
              <StudentTimetable />
            </Suspense>
          } />
          <Route path="/library" element={
            <Suspense fallback={<PageLoader />}>
              <StudentLibrary />
            </Suspense>
          } />
          <Route path="/events" element={
            <Suspense fallback={<PageLoader />}>
              <StudentEvents />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={<PageLoader />}>
              <StudentNotificationsPage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<PageLoader />}>
              <StudentSettings />
            </Suspense>
          } />
        </Routes>
      </main>
    </div>
  )
}

export function StudentRoutes() {
  return <StudentLayout />
}