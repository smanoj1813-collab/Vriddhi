import UniversalQuestionBank from '@/modules/admin/components/UniversalQuestionBank';
import { Box, Typography, Alert } from '@mui/material';

// Superadmin sees the entire universal pool (public + private via isSuperadmin gate)
// collegeId is intentionally empty — the gate bypasses visibility when viewerIsSuperadmin is true.
export default function SuperAdminQuestionBank() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Question Bank — Platform View
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse every question in the universal pool. As superadmin you see all visibilities
          (public, college_only, shared_with) without college scoping.
        </Typography>
        <Alert severity="info" sx={{ mt: 1.5 }}>
          Superadmin bypass is active — visibility gating is disabled. Use filters to narrow by
          subject, topic, difficulty or search keywords.
        </Alert>
      </Box>
      <UniversalQuestionBank />
    </Box>
  );
}
