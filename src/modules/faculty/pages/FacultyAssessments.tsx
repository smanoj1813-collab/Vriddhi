import { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useAuth } from '../../auth/context/AuthContext';
import TestScheduler from '../components/TestScheduler';
import AssessmentTestReports from '../components/AssessmentTestReports';
import AssessmentGradingQueue from '../components/AssessmentGradingQueue';

export default function FacultyAssessments() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [tab, setTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Assessments</Typography>
        <Typography color="text.secondary">
          Schedule secure online tests, track completion, and complete manual grading.
        </Typography>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 2 }} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Schedule a test" />
          <Tab label="My tests" />
          <Tab label={`Manual grading${pendingCount ? ` (${pendingCount})` : ''}`} />
        </Tabs>
      </Box>

      {tab === 0 && <TestScheduler collegeId={collegeId} />}
      {tab === 1 && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <AssessmentTestReports showScheduleHint />
        </Box>
      )}
      {tab === 2 && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <AssessmentGradingQueue onCountChange={setPendingCount} />
        </Box>
      )}
    </Box>
  );
}
