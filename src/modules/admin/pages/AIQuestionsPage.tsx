// src/modules/admin/pages/AIQuestionsPage.tsx
// ─── Standalone AI Question Generator page for admin/principal/HOD ───
import { Box, Container, Typography, Paper } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import AIQuestionGenerator from '../components/question-bank/AIQuestionGenerator';
import type { GeneratedQuestion } from '../types/questionBank';

export default function AIQuestionsPage() {
  const handleQuestionsSaved = (questions: GeneratedQuestion[]) => {
    console.log('[AIQuestionsPage] Saved', questions.length, 'questions to bank');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            AI Question Generator
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate custom questions using AI, edit them, and save to the question bank
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <AIQuestionGenerator onQuestionsSaved={handleQuestionsSaved} />
      </Paper>
    </Container>
  );
}
