import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import AssessmentTestReports from '../../faculty/components/AssessmentTestReports';
import AssessmentGradingQueue from '../../faculty/components/AssessmentGradingQueue';

/**
 * Standalone "My tests" page for admin / principal / hod / superadmin:
 * the same college-wide test completion list + per-test reports the faculty
 * see under Assessments → My tests, plus the college-wide manual grading
 * queue (the server allows these roles to grade any test in the college).
 */
export default function AssessmentTestReportsPage() {
  const [tab, setTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Assessments</Typography>
        <Typography color="text.secondary">
          All scheduled tests for this college — completion status, student result reports, and manual grading.
        </Typography>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 2 }}>
          <Tab label="All tests" />
          <Tab label={`Manual grading${pendingCount ? ` (${pendingCount})` : ''}`} />
        </Tabs>
      </Box>
      {tab === 0 && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <AssessmentTestReports />
        </Box>
      )}
      {tab === 1 && (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <AssessmentGradingQueue onCountChange={setPendingCount} />
        </Box>
      )}
    </Box>
  );
}
