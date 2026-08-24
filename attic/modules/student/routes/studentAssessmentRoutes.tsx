import React, { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

const StudentTestDashboard = lazy(() => import('../pages/StudentTestDashboard'));
const TestInstructionsPage = lazy(() => import('../pages/TestInstructionsPage'));
const ActiveTestPage = lazy(() => import('../pages/ActiveTestPage'));
const TestResultPage = lazy(() => import('../pages/TestResultPage'));

const PageLoader: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress size={50} />
  </Box>
);

const StudentAssessmentRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/student/assessments" element={<StudentTestDashboard />} />
        <Route path="/student/assessments/:testId/instructions" element={<TestInstructionsPage />} />
        <Route path="/student/assessments/:testId/take" element={<ActiveTestPage />} />
        <Route path="/student/assessments/:testId/result" element={<TestResultPage />} />
      </Routes>
    </Suspense>
  );
};

export default StudentAssessmentRoutes;