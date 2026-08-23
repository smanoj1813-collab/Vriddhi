// src/modules/student/pages/TestResultPage.tsx
// Phase 2: reads the authoritative studentAssessments row via fetchTestResult.
// - submitted + manual grading pending → "awaiting grading" state (no answers shown)
// - graded → score card, section analysis, question-wise review, leaderboard
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, LinearProgress,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Avatar, Skeleton, Alert, CircularProgress,
} from '@mui/material';
import {
  CheckCircle, Cancel, EmojiEvents, TrendingUp, BarChart,
  Visibility, ArrowBack, School, Timer, NavigateNext, NavigateBefore,
  Assessment, HourglassEmpty,
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { fetchTestResult } from '../api/testApi';
import { MathRenderer } from '../components/MathRenderer';
import type { TestResultDetail } from '../types/assessment';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
    {value === index && children}
  </Box>
);

type ResultDetail = TestResultDetail & {
  pendingManualGrading?: boolean;
  autoScore?: number;
  autoMax?: number;
  manualPending?: boolean;
};

const TestResultPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);
  const collegeId = profile?.collegeId || user?.collegeId || '';
  const studentId = profile?.id || '';

  const [result, setResult] = useState<ResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  useEffect(() => {
    if (!testId || !collegeId || !studentId) return;
    let cancelled = false;
    setLoading(true);
    fetchTestResult(collegeId, testId, studentId)
      .then((r) => {
        if (cancelled) return;
        setResult(r as ResultDetail);
        if (!r) setError('No submission found for this test.');
      })
      .catch(() => !cancelled && setError('Could not load this result.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [testId, collegeId, studentId]);

  if (loading) return <ResultSkeleton />;
  if (error || !result) {
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="info">
          {error || 'This result is not available yet. Results appear once your submission has been graded.'}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/student/assessments')}>Back to Assessments</Button>
        </Box>
      </Box>
    );
  }

  const isGraded = !result.pendingManualGrading && !!result.gradedAt;
  const percentage = isGraded
    ? result.percentage || (result.totalMarks ? Math.round((result.marksObtained / result.totalMarks) * 100) : 0)
    : 0;
  const isPassed = percentage >= result.passingPercentage;
  const grade = isGraded ? result.grade || getGrade(percentage) : '—';

  /* ── Pending manual grading ── */
  if (!isGraded) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', pb: 8 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/assessments')} sx={{ mb: 2 }}>
          Back to Assessments
        </Button>
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
            <HourglassEmpty color="warning" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Submitted — awaiting grading</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              <MathRenderer text={result.title} inline /> · submitted{' '}
              {result.submittedAt ? new Date(result.submittedAt).toLocaleString('en-IN') : 'recently'}
            </Typography>
            <Alert severity="info" sx={{ textAlign: 'left', mb: 3 }}>
              Objective answers are scored instantly. This paper includes descriptive questions that
              your faculty must grade — your final score, grade and answer review will appear here
              once grading is complete.
            </Alert>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
              <ResultStat icon={<CheckCircle color="success" />} label="Answered" value={`${result.answeredCount}/${result.totalQuestions}`} />
              <ResultStat icon={<Timer color="info" />} label="Time Taken" value={formatDuration(result.timeSpent)} />
              <ResultStat icon={<School color="primary" />} label="Status" value="Under review" />
            </Box>
            <Button variant="outlined" sx={{ mt: 4 }} onClick={() => navigate('/student/assessments')}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  /* ── Graded ── */
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto', pb: 8 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/student/assessments')} sx={{ mb: 2 }}>
        Back to Assessments
      </Button>

      {/* Score Card */}
      <Card sx={{ borderRadius: 4, mb: 4, overflow: 'visible', position: 'relative' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <Box sx={{
                width: 160, height: 160, borderRadius: '50%', border: 8,
                borderColor: isPassed ? 'success.main' : 'error.main',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography variant="h3" sx={{ fontWeight: 800 }} color={isPassed ? 'success.main' : 'error.main'}>
                  {percentage}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {result.marksObtained}/{result.totalMarks}
                </Typography>
              </Box>
              <Chip label={isPassed ? 'PASSED' : 'FAILED'} color={isPassed ? 'success' : 'error'}
                sx={{ position: 'absolute', bottom: -10, fontWeight: 700, fontSize: '0.75rem' }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
                <MathRenderer text={result.title} inline />
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} gutterBottom>
                {result.subject} • Completed on{' '}
                {result.completedAt ? new Date(result.completedAt).toLocaleDateString('en-IN') : '—'}
                {result.gradedAt && ` · Graded ${new Date(result.gradedAt).toLocaleDateString('en-IN')}`}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {result.rank ? <ResultStat icon={<EmojiEvents color="warning" />} label="Rank" value={`#${result.rank}`} /> : null}
                <ResultStat icon={<School color="primary" />} label="Grade" value={grade} />
                <ResultStat icon={<Timer color="info" />} label="Time Taken" value={formatDuration(result.timeSpent)} />
                {result.totalStudents ? (
                  <ResultStat icon={<TrendingUp color="success" />} label="Percentile" value={`${result.totalStudents > 0 ? Math.round(((result.totalStudents - (result.rank || result.totalStudents)) / result.totalStudents) * 100) : 0}%`} />
                ) : null}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {result.facultyFeedback && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <strong>Faculty feedback:</strong> {result.facultyFeedback}
        </Alert>
      )}

      {/* Tabs */}
      <Card sx={{ borderRadius: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Overview" icon={<BarChart fontSize="small" />} iconPosition="start" />
          {result.sectionScores?.length > 0 && (
            <Tab label="Section Analysis" icon={<TrendingUp fontSize="small" />} iconPosition="start" />
          )}
          {result.questionResults?.length > 0 && (
            <Tab label="Question-wise" icon={<Visibility fontSize="small" />} iconPosition="start" />
          )}
          {result.leaderboard?.length > 1 && (
            <Tab label="Leaderboard" icon={<EmojiEvents fontSize="small" />} iconPosition="start" />
          )}
        </Tabs>

        {/* Tab 0: Overview */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, px: 2, pb: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Performance Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <PerformanceBar label="Correct" value={result.correctCount} total={result.totalQuestions} color="success" />
                <PerformanceBar label="Incorrect" value={result.incorrectCount} total={result.totalQuestions} color="error" />
                <PerformanceBar label="Unattempted" value={result.unattemptedCount} total={result.totalQuestions} color="grey" />
              </Box>
            </Box>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>Section Performance</Typography>
              {(result.sectionScores || []).map((section) => (
                <Card key={section.sectionName} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        <MathRenderer text={section.sectionName} inline />
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}
                        color={section.percentage >= 60 ? 'success.main' : 'error.main'}>
                        {section.percentage}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={section.percentage}
                      sx={{
                        height: 8, borderRadius: 4, bgcolor: 'grey.100',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: section.percentage >= 60 ? 'success.main' : 'error.main', borderRadius: 4,
                        },
                      }} />
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                      {section.correct}/{section.total} correct · {section.score}/{section.totalMarks} marks
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 1: Section Analysis */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell align="center"><strong>Questions</strong></TableCell>
                  <TableCell align="center"><strong>Correct</strong></TableCell>
                  <TableCell align="center"><strong>Incorrect</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                  <TableCell align="center"><strong>%</strong></TableCell>
                  <TableCell align="center"><strong>Accuracy</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(result.sectionScores || []).map((section) => (
                  <TableRow key={section.sectionName} hover>
                    <TableCell><Typography sx={{ fontWeight: 600 }}><MathRenderer text={section.sectionName} inline /></Typography></TableCell>
                    <TableCell align="center">{section.total}</TableCell>
                    <TableCell align="center" sx={{ color: 'success.main', fontWeight: 600 }}>{section.correct}</TableCell>
                    <TableCell align="center" sx={{ color: 'error.main' }}>{section.incorrect}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{section.score}/{section.totalMarks}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={`${section.percentage}%`} color={section.percentage >= 60 ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell align="center">{section.accuracy}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab 2: Question-wise review */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, px: 2, pb: 2 }}>
            <Box sx={{ flex: '0 0 200px', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} gutterBottom>Questions</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                {result.questionResults.map((q: any, idx: number) => (
                  <Button key={q.questionId} onClick={() => setSelectedQuestion(idx)} sx={{
                    minWidth: 0, width: 40, height: 40, p: 0, borderRadius: 1,
                    bgcolor: q.status === 'correct' ? 'success.main' : q.status === 'pending' || q.status === 'partial' ? 'warning.main' : q.yourAnswer || q.studentAnswer ? 'error.main' : 'grey.300',
                    color: 'white', fontWeight: 700, fontSize: '0.75rem',
                    border: selectedQuestion === idx ? 2 : 0, borderColor: 'primary.main',
                  }}>
                    {idx + 1}
                  </Button>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1, minWidth: 300 }}>
              {result.questionResults[selectedQuestion] && (
                <QuestionDetailCard question={result.questionResults[selectedQuestion]} questionNumber={selectedQuestion + 1} />
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button startIcon={<NavigateBefore />} disabled={selectedQuestion === 0}
                  onClick={() => setSelectedQuestion((p) => p - 1)}>Previous</Button>
                <Button endIcon={<NavigateNext />} disabled={selectedQuestion === result.questionResults.length - 1}
                  onClick={() => setSelectedQuestion((p) => p + 1)}>Next</Button>
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 3: Leaderboard */}
        <TabPanel value={activeTab} index={3}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Rank</strong></TableCell>
                  <TableCell><strong>Student</strong></TableCell>
                  <TableCell align="center"><strong>Score</strong></TableCell>
                  <TableCell align="center"><strong>%</strong></TableCell>
                  <TableCell align="center"><strong>Time</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(result.leaderboard || []).map((entry) => (
                  <TableRow key={entry.studentId} hover sx={entry.isCurrentUser ? { bgcolor: 'action.selected' } : {}}>
                    <TableCell>
                      <Chip size="small" label={`#${entry.rank}`}
                        sx={{
                          fontWeight: 700,
                          bgcolor: entry.rank === 1 ? 'warning.main' : entry.rank <= 3 ? 'grey.300' : undefined,
                          color: entry.rank <= 3 ? 'white' : undefined,
                        }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>{entry.studentName[0]}</Avatar>
                        <Typography variant="body2" sx={{ fontWeight: entry.isCurrentUser ? 700 : 400 }}>
                          {entry.isCurrentUser ? 'You' : entry.studentName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>{entry.score}/{entry.totalMarks}</TableCell>
                    <TableCell align="center">{entry.percentage}%</TableCell>
                    <TableCell align="center">{formatDuration(entry.timeTaken)}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={entry.isPassed ? 'Passed' : 'Failed'} color={entry.isPassed ? 'success' : 'error'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>
    </Box>
  );
};

const ResultStat: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
    {icon}
    <Box>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  </Box>
);

const PerformanceBar: React.FC<{ label: string; value: number; total: number; color: 'success' | 'error' | 'warning' | 'grey' }> =
  ({ label, value, total, color }) => {
    const pct = total > 0 ? (value / total) * 100 : 0;
    const colors = { success: '#4caf50', error: '#f44336', warning: '#ff9800', grey: '#9e9e9e' };
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}/{total}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={pct}
          sx={{
            height: 10, borderRadius: 5, bgcolor: 'grey.100',
            '& .MuiLinearProgress-bar': { bgcolor: colors[color], borderRadius: 5 },
          }} />
      </Box>
    );
  };

const QuestionDetailCard: React.FC<{ question: any; questionNumber: number }> = ({ question, questionNumber }) => (
  <Card variant="outlined" sx={{ borderRadius: 2 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip label={`Q${questionNumber}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
          <Chip
            label={question.status === 'pending' ? 'Manual' : question.status === 'correct' ? 'Correct' : question.status === 'partial' ? 'Partial' : question.yourAnswer || question.studentAnswer ? 'Incorrect' : 'Unattempted'}
            size="small"
            color={question.status === 'correct' ? 'success' : question.status === 'pending' || question.status === 'partial' ? 'warning' : question.yourAnswer || question.studentAnswer ? 'error' : 'default'}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {question.marksObtained ?? '—'} / {question.marks} marks
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <MathRenderer text={question.questionText || ''} />
      </Box>

      {question.options && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          {question.options.map((opt: string, idx: number) => {
            const isCorrect = question.correctAnswer === opt;
            const isSelected = question.studentAnswer === opt;
            return (
              <Box key={idx} sx={{
                p: 1.5, borderRadius: 2, border: 1,
                borderColor: isCorrect ? 'success.main' : isSelected ? 'error.main' : 'divider',
                bgcolor: isCorrect ? 'rgba(76,175,80,0.08)' : isSelected ? 'rgba(244,67,54,0.08)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 1,
              }}>
                <Chip size="small" label={String.fromCharCode(65 + idx)} sx={{ minWidth: 28 }} />
                <Box sx={{ flex: 1 }}><MathRenderer text={opt} inline /></Box>
                {isCorrect && <CheckCircle color="success" fontSize="small" />}
                {isSelected && !isCorrect && <Cancel color="error" fontSize="small" />}
              </Box>
            );
          })}
        </Box>
      )}

      {question.studentAnswer !== undefined && question.studentAnswer !== '' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'rgba(244,67,54,0.05)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom color={question.status === 'correct' ? 'success.main' : 'error.main'}>
            Your Answer:
          </Typography>
          <MathRenderer text={String(question.studentAnswer)} inline />
        </Paper>
      )}

      {question.status !== 'correct' && question.correctAnswer && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'rgba(76,175,80,0.05)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }} gutterBottom>
            Correct Answer:
          </Typography>
          <MathRenderer text={String(question.correctAnswer)} inline />
        </Paper>
      )}

      {question.explanation && (
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(33,150,243,0.05)', borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main' }} gutterBottom>Explanation</Typography>
          <MathRenderer text={question.explanation} />
        </Paper>
      )}
    </CardContent>
  </Card>
);

const ResultSkeleton: React.FC = () => (
  <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
    <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
    <Skeleton variant="rounded" height={200} sx={{ mb: 4 }} />
    <Skeleton variant="rounded" height={400} />
  </Box>
);

const getGrade = (percentage: number): string => {
  if (percentage >= 90) return 'A+'; if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B'; if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D'; return 'F';
};

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) { const h = Math.floor(m / 60); return `${h}h ${m % 60}m`; }
  return `${m}m ${s}s`;
};

export default TestResultPage;
