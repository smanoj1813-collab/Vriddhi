import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/context/AuthContext';

// ── Loading fallback ─────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400" />
  </div>
);

// ── Faculty pages ──────────────────────────────────────────────────────
const FacultyDashboard = lazy(() => import('../modules/faculty/pages/FacultyDashboard'));
const FacultyAttendance = lazy(() => import('../modules/faculty/pages/FacultyAttendance'));
const FacultyTopics = lazy(() => import('../modules/faculty/pages/FacultyTopics'));
const FacultyPapers = lazy(() => import('../modules/faculty/pages/FacultyPapers'));
const FacultyQuestionBank = lazy(() => import('../modules/faculty/pages/FacultyQuestionBank'));
const FacultyPaperGenerator = lazy(() => import('../modules/faculty/pages/FacultyPaperGenerator'));
const FacultyStudentAnalysis = lazy(() => import('../modules/faculty/pages/FacultyStudentAnalysis'));
const FacultyReschedule = lazy(() => import('../modules/faculty/pages/FacultyReschedule'));
const FacultyUploadMaterial = lazy(() => import('../modules/faculty/pages/FacultyUploadMaterial'));
const FacultyLibrary = lazy(() => import('../modules/faculty/pages/FacultyLibrary'));
const FacultyAnnouncements = lazy(() => import('../modules/faculty/pages/FacultyAnnouncements'));
const FacultyAssignments = lazy(() => import('../modules/faculty/pages/FacultyAssignments'));
const FacultyCalendar = lazy(() => import('../modules/faculty/pages/FacultyCalendar'));
const FacultyCurriculum = lazy(() => import('../modules/faculty/pages/FacultyCurriculum'));
const FacultyAttendanceMarking = lazy(() => import('../modules/faculty/components/FacultyAttendanceMarking'));

// ── Shared / admin pages faculty can access ───────────────────────────
const View360 = lazy(() => import('../modules/admin/pages/View360'));

export default function FacultyRoutes() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<FacultyDashboard />} />
        <Route path="attendance" element={<FacultyAttendance />} />
        <Route 
          path="attendance-marking" 
          element={
            <FacultyAttendanceMarking 
              collegeId={user.collegeId ?? ''} 
              facultyId={user.uid ?? user.id ?? ''} 
              facultyName={user.name ?? ''} 
            />
          } 
        />
        <Route path="topics" element={<FacultyTopics />} />
        <Route path="papers" element={<FacultyPapers />} />
        <Route path="question-bank" element={<FacultyQuestionBank />} />
        <Route path="paper-generator" element={<FacultyPaperGenerator />} />
        <Route path="student-analysis" element={<FacultyStudentAnalysis />} />
        <Route path="reschedule" element={<FacultyReschedule />} />
        <Route path="upload-material" element={<FacultyUploadMaterial />} />
        <Route path="library" element={<FacultyLibrary />} />
        <Route path="announcements" element={<FacultyAnnouncements />} />
        <Route path="assignments" element={<FacultyAssignments />} />
        <Route path="calendar" element={<FacultyCalendar />} />
        <Route path="curriculum" element={<FacultyCurriculum />} />
        <Route path="view360" element={<View360 />} />
        <Route path="*" element={<Navigate to="/faculty" replace />} />
      </Routes>
    </Suspense>
  );
}