import UniversalQuestionBank from '../components/UniversalQuestionBank';
import { Box, Typography } from '@mui/material';

export default function AdminUniversalBank() {
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Universal Question Bank
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse the platform pool and your college’s approved questions. Visibility is gated:
          you see public + your college’s college_only + rows shared with you. Superadmins see everything.
        </Typography>
      </Box>
      <UniversalQuestionBank />
    </Box>
  );
}
