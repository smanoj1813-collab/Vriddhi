import { Box, Typography } from '@mui/material';
import AssessmentTestReports from '../../faculty/components/AssessmentTestReports';

/**
 * Standalone "My tests" page for admin / principal / hod / superadmin:
 * the same college-wide test completion list + per-test reports the faculty
 * see under Assessments → My tests.
 */
export default function AssessmentTestReportsPage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>My tests</Typography>
        <Typography color="text.secondary">
          All scheduled tests for this college — completion status and student result reports.
        </Typography>
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <AssessmentTestReports />
      </Box>
    </Box>
  );
}
