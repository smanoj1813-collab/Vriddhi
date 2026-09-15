import UniversalQuestionBank from '@/modules/admin/components/UniversalQuestionBank';
import { Box, Typography, Alert } from '@mui/material';

// Faculty universal bank — shows public + own-college + shared_with
// via UniversalQuestionBank's viewerIsSuperadmin=false + collegeId gate.
export default function FacultyUniversalBank() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Universal Question Bank
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse the shared platform pool plus your college’s approved questions. Use filters
          or search by keywords, subject, or topic. College-private questions from other colleges stay hidden.
        </Typography>
      </Box>
      <UniversalQuestionBank showSubmitButton={false} />
    </Box>
  );
}
