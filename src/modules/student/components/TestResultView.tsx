// components/student/TestResultView.tsx
import React from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent, Chip, Divider,
  Paper, LinearProgress, Accordion, AccordionSummary, AccordionDetails, Avatar,
} from '@mui/material';
import {
  ExpandMore as ExpandIcon,
  CheckCircle as CorrectIcon,
  Cancel as WrongIcon,
  TrendingUp as TrendIcon,
  Timer as TimerIcon,
  EmojiEvents as RankIcon,
  School as GradeIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import type { TestResultSummary } from '../../../types/assessment';

interface TestResultViewProps {
  result: TestResultSummary;
  onBack?: () => void;
}

const TestResultView: React.FC<TestResultViewProps> = ({ result, onBack }) => {
  const {
    title, subject, totalMarks, marksObtained, percentage,
    passed, grade, gradePoint, timeSpent, facultyFeedback,
    rank, totalParticipants, classAverage, classHighest,
    averageTimePerQuestion, questionScores, sectionScores,
  } = result;

  const safePercentage = percentage ?? 0;
  const safeClassAverage = classAverage ?? 0;
  const safeAvgTime = averageTimePerQuestion ?? 0;

  const scores = questionScores ?? [];
  const correctCount = scores.filter((q) => q.isCorrect).length;
  const wrongCount = scores.filter((q) => !q.isCorrect && q.yourAnswer).length;
  const unansweredCount = scores.filter((q) => !q.yourAnswer).length;

  const getGradeColor = (g?: string | null) => {
    if (!g) return 'default';
    if (['A+', 'A', 'A-'].includes(g)) return 'success';
    if (['B+', 'B', 'B-'].includes(g)) return 'info';
    if (['C+', 'C', 'C-'].includes(g)) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subject}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />}>Download</Button>
          <Button variant="outlined" size="small" startIcon={<PrintIcon />}>Print</Button>
          {onBack && <Button variant="outlined" size="small" onClick={onBack}>Back</Button>}
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Card sx={{ flex: '1 1 300px', borderRadius: 3, textAlign: 'center', p: 2 }}>
          <CardContent>
            <Avatar sx={{ width: 120, height: 120, fontSize: '2.5rem', fontWeight: 700, bgcolor: passed ? 'success.main' : 'error.main', mx: 'auto', mb: 2 }}>
              {safePercentage.toFixed(1)}%
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{marksObtained} / {totalMarks}</Typography>
            <Chip label={passed ? 'PASSED' : 'FAILED'} color={passed ? 'success' : 'error'} sx={{ fontWeight: 600, fontSize: '1rem', px: 1, mb: 1 }} />
            {grade && <Chip label={`Grade: ${grade}`} color={getGradeColor(grade) as any} sx={{ fontWeight: 600, ml: 1 }} />}
            {gradePoint !== undefined && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Grade Point: {gradePoint}</Typography>}
          </CardContent>
        </Card>

        <Box sx={{ flex: '2 1 400px', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <StatCard icon={<CorrectIcon color="success" />} label="Correct" value={correctCount} color="success" />
          <StatCard icon={<WrongIcon color="error" />} label="Wrong" value={wrongCount} color="error" />
          <StatCard icon={<TimerIcon color="info" />} label="Time Spent" value={`${Math.floor((timeSpent || 0) / 60)}m`} color="info" />
          <StatCard icon={<RankIcon color="primary" />} label="Rank" value={`#${rank || '-'}`} color="primary" />
          <StatCard icon={<TrendIcon color="secondary" />} label="Class Avg" value={`${safeClassAverage.toFixed(1)}%`} color="secondary" />
          <StatCard icon={<GradeIcon color="warning" />} label="Highest" value={`${classHighest || 0}%`} color="warning" />
        </Box>
      </Box>

      {facultyFeedback && (
        <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, bgcolor: 'info.50' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'info.dark', mb: 1 }}>Faculty Feedback</Typography>
            <Typography variant="body2" color="info.dark">{facultyFeedback}</Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Question-wise Analysis</Typography>
      <Stack spacing={1}>
        {scores.map((q, idx) => {
          const yourScore = q.yourScore ?? q.marksObtained ?? 0;
          const maxScore = q.maxScore ?? q.maxMarks ?? 1;
          return (
            <Accordion key={q.questionId} sx={{
              borderRadius: 2, border: 1,
              borderColor: q.isCorrect ? 'success.light' : q.yourAnswer ? 'error.light' : 'warning.light',
              '&:before': { display: 'none' }, overflow: 'hidden',
            }}>
              <AccordionSummary expandIcon={<ExpandIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem', bgcolor: q.isCorrect ? 'success.main' : q.yourAnswer ? 'error.main' : 'warning.main' }}>
                    {idx + 1}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 200, sm: 400 } }}>{q.questionText || 'Question'}</Typography>
                  </Box>
                  <Chip size="small" label={`${yourScore}/${maxScore}`}
                    color={q.isCorrect ? 'success' : q.yourAnswer ? 'error' : 'warning'} sx={{ mr: 2 }} />
                  {q.isCorrect ? <CorrectIcon color="success" /> : q.yourAnswer ? <WrongIcon color="error" /> : <TrendIcon color="warning" />}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom><strong>Your Answer:</strong></Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: q.isCorrect ? 'success.50' : 'error.50' }}>
                      <Typography>{q.yourAnswer || 'Not answered'}</Typography>
                    </Paper>
                  </Box>
                  {q.correctAnswer && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom><strong>Correct Answer:</strong></Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}><Typography>{q.correctAnswer}</Typography></Paper>
                    </Box>
                  )}
                  {q.feedback && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom><strong>Feedback:</strong></Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}><Typography>{q.feedback}</Typography></Paper>
                    </Box>
                  )}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {sectionScores && sectionScores.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Section Scores</Typography>
          <Stack spacing={1}>
            {sectionScores.map((section) => (
              <Card key={section.sectionId} variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{section.sectionTitle || section.sectionName}</Typography>
                  <Chip label={`${section.score} / ${section.maxScore}`} color="primary" />
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>
      )}

      <Card variant="outlined" sx={{ borderRadius: 2, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Performance Metrics</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 250px' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Accuracy</Typography>
              <LinearProgress variant="determinate" value={safePercentage} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
              <Typography variant="body2">{safePercentage.toFixed(1)}% correct</Typography>
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Time per Question</Typography>
              <LinearProgress variant="determinate" value={Math.min((safeAvgTime / 120) * 100, 100)} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
              <Typography variant="body2">{safeAvgTime.toFixed(1)}s avg</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; color: string }> = ({ icon, label, value, color }) => (
  <Card variant="outlined" sx={{ flex: '1 1 140px', borderRadius: 2 }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>{icon}<Typography variant="caption" color="text.secondary">{label}</Typography></Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color: `${color}.main` }}>{value}</Typography>
    </CardContent>
  </Card>
);

export default TestResultView;