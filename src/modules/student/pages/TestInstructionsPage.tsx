import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, List, ListItem,
  ListItemIcon, ListItemText, Checkbox, FormControlLabel, Alert,
  AlertTitle, Stepper, Step, StepLabel, Paper, CircularProgress,
} from '@mui/material';
import {
  Fullscreen, ContentCopy, Timer, CheckCircle,
  Error as ErrorIcon, Info, PlayArrow, Security, DesktopAccessDisabled,
  ArrowForward, Keyboard, Mouse, Save, Visibility,
} from '@mui/icons-material';
import { useAuth } from '../../auth/context/AuthContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import { fetchTestInstructions, startStudentAssessment } from '../api/testApi';
import type { TestInstructionsData } from '../types/assessment';

const STEPS = ['Read Instructions', 'System Check', 'Start Test'];

const TYPE_LABELS: Record<string, string> = {
  mcq: 'Single-choice MCQ',
  multi_select: 'Multiple-correct MCQ',
  true_false: 'True / False',
  fill_in_blank: 'Fill in the blank',
  short_answer: 'Short answer',
  long_answer: 'Long answer',
  numerical: 'Numerical',
  assertion_reason: 'Assertion–Reason',
  case_based: 'Case-based',
  matching: 'Match the following',
};

const TestInstructionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useStudentProfile(user?.uid);

  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [data, setData] = useState<TestInstructionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const collegeId = profile?.collegeId || user?.collegeId || '';
  const studentId = profile?.id || '';

  useEffect(() => {
    if (!testId || !collegeId || !studentId) return;
    let cancelled = false;
    setLoading(true);
    fetchTestInstructions(collegeId, testId, studentId)
      .then((d) => {
        if (cancelled) return;
        if (!d) setLoadError('This test is not available.');
        else setData(d);
      })
      .catch(() => !cancelled && setLoadError('Could not load this test.'))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [testId, collegeId, studentId]);

  const timeLeft = useMemo(() => {
    if (!data?.endsAt) return null;
    const diff = new Date(data.endsAt).getTime() - Date.now();
    return diff > 0 ? Math.floor(diff / 60000) : 0;
  }, [data?.endsAt]);

  const handleStartTest = async () => {
    if (!agreed || !testId || !collegeId || !studentId) return;
    setStarting(true);
    try {
      await startStudentAssessment(collegeId, testId, {
        id: studentId,
        name: profile?.name || user?.name || '',
        regNo: profile?.regNo || '',
      });
      navigate(`/student/test/${testId}/take`);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not start the test.');
    } finally {
      setStarting(false);
    }
  };

  const handleResume = () => navigate(`/student/test/${testId}/take`);
  const handleViewResult = () => navigate(`/student/test/${testId}/result`);

  if (loading || (!data && !loadError)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError || !data) {
    return (
      <Box sx={{ p: 4, maxWidth: 640, mx: 'auto' }}>
        <Alert severity="warning">{loadError || 'Test not found'}</Alert>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate('/student/assessments')}>
          Back to Assessments
        </Button>
      </Box>
    );
  }

  const isFinished = data.studentStatus === 'submitted' || data.studentStatus === 'graded';
  const isInProgress = data.studentStatus === 'in_progress';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          {data.title}
        </Typography>
        {data.subject && (
          <Typography variant="body1" color="text.secondary">
            {data.subject}
          </Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Timer fontSize="small" />} label={`${data.duration} minutes`} />
          <Chip icon={<Info fontSize="small" />} label={`${data.totalQuestions} questions`} />
          <Chip icon={<CheckCircle fontSize="small" />} label={`${data.totalMarks} marks`} />
          {data.enableProctoring && <Chip icon={<Security fontSize="small" />} label="Proctored" color="warning" />}
          {data.negativeMarking && <Chip label="Negative marking" color="error" variant="outlined" />}
        </Box>
      </Box>

      {isInProgress && (
        <Alert severity={timeLeft && timeLeft <= 5 ? 'error' : 'success'} sx={{ mb: 3 }}>
          <AlertTitle>Test in progress</AlertTitle>
          Your timer is running{timeLeft !== null ? ` — about ${timeLeft} minute${timeLeft === 1 ? '' : 's'} remaining` : ''}.
          Your answers are saved automatically. Re-enter to continue where you left off.
        </Alert>
      )}

      {isFinished && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>
            {data.studentStatus === 'graded' ? 'Already graded' : 'Submitted — awaiting grading'}
          </AlertTitle>
          {data.studentStatus === 'graded'
            ? `You scored ${data.marksObtained ?? 0}/${data.totalMarks} (Grade ${data.grade || '—'}).`
            : 'Your submission has been received. Results appear once grading is complete.'}
        </Alert>
      )}

      <Stepper activeStep={isInProgress ? STEPS.length - 1 : activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }} gutterBottom>
              <Info color="primary" /> General Instructions
            </Typography>
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Important</AlertTitle>
              The timer starts when you begin and cannot be paused. The test auto-submits when time expires.
            </Alert>

            {data.instructions.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <List dense>
                  {data.instructions.map((line, i) => (
                    <ListItem key={i}>
                      <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle fontSize="small" color="primary" /></ListItemIcon>
                      <ListItemText primary={line} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <List>
              <InstructionItem
                icon={<Timer color="primary" />}
                primary="Time Limit"
                secondary={`You have ${data.duration} minutes from the moment you start. Auto-submit on expiry.`}
              />
              <InstructionItem
                icon={<Save color="primary" />}
                primary="Autosave"
                secondary="Answers are saved every few seconds — you can refresh or reconnect and resume without losing work."
              />
              <InstructionItem
                icon={<CheckCircle color="primary" />}
                primary="Marking Scheme"
                secondary={`Total marks: ${data.totalMarks}.${data.negativeMarking ? ' Incorrect objective answers carry negative marks.' : ' No negative marking.'}`}
              />
              {data.questionTypes.length > 0 && (
                <InstructionItem
                  icon={<Info color="primary" />}
                  primary="Question Types"
                  secondary={data.questionTypes.map((t) => TYPE_LABELS[t] || t).join(' • ')}
                />
              )}
              <InstructionItem
                icon={<Visibility color="primary" />}
                primary="Results"
                secondary="Objective questions are scored instantly. If the paper has descriptive questions, final results appear after your faculty completes grading."
              />
              {data.enableProctoring && (
                <>
                  <InstructionItem
                    icon={<Fullscreen color="primary" />}
                    primary="Fullscreen Mode"
                    secondary="The test runs in fullscreen. Exiting triggers a warning and is logged."
                  />
                  <InstructionItem
                    icon={<DesktopAccessDisabled color="error" />}
                    primary="Tab Switching"
                    secondary="Switching tabs or windows is prohibited and will be logged."
                  />
                  <InstructionItem
                    icon={<ContentCopy color="error" />}
                    primary="Copy / Paste Blocked"
                    secondary="Clipboard operations and right-click are disabled during the test."
                  />
                  <InstructionItem
                    icon={<Keyboard color="error" />}
                    primary="Keyboard Restrictions"
                    secondary="Shortcuts like Ctrl+C, Ctrl+V and PrintScreen are blocked."
                  />
                </>
              )}
            </List>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => setActiveStep(1)} endIcon={<ArrowForward />}>
                Next: System Check
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }} gutterBottom>
              <DesktopAccessDisabled color="primary" /> System Compatibility
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ensure your device is ready before you begin.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <SystemCheckItem label="Stable Internet" status icon={<WifiIcon />} description="Required — answers autosave online" />
              <SystemCheckItem label="Fullscreen Support" status icon={<Fullscreen />} description="Your browser supports fullscreen mode" />
              <SystemCheckItem label="Modern Browser" status icon={<Mouse />} description="An up-to-date browser is detected" />
              {data.enableProctoring && (
                <SystemCheckItem label="Single Window" status icon={<Security />} description="Close other tabs/apps before starting" />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} endIcon={<CheckCircle />}>
                All Checks Passed
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }} gutterBottom>
              <Security color="primary" /> Test Rules Agreement
            </Typography>
            {data.enableProctoring && (
              <Alert severity="info" sx={{ mb: 3 }}>
                This is a <strong>proctored test</strong>. The following monitoring will be active:
              </Alert>
            )}

            {data.enableProctoring && (
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><DesktopAccessDisabled fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Tab-switch detection" secondary="Leaving the test tab triggers a warning and is logged" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><Fullscreen fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Fullscreen enforcement" secondary="Exiting fullscreen is logged" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><ContentCopy fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy/paste prevention" secondary="Clipboard operations are disabled" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><Mouse fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Right-click disabled" secondary="Context menus are blocked" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}><Keyboard fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Keyboard shortcuts blocked" secondary="Ctrl+C, Ctrl+V, PrintScreen, etc." />
                  </ListItem>
                </List>
              </Paper>
            )}

            <FormControlLabel
              control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} color="primary" />}
              label={
                <Typography variant="body2">
                  I have read and understood all instructions and agree to abide by the test rules.
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Button variant="outlined" onClick={() => setActiveStep(1)}>Back</Button>
              {isFinished ? (
                <Button variant="contained" color="primary" startIcon={<Visibility />} onClick={handleViewResult}>
                  View Result
                </Button>
              ) : isInProgress ? (
                <Button
                  variant="contained" color="success" size="large" startIcon={<PlayArrow />}
                  onClick={handleResume} sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Resume Test
                </Button>
              ) : (
                <Button
                  variant="contained" color="success" size="large" disabled={!agreed || starting}
                  onClick={handleStartTest} startIcon={<PlayArrow />} sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                >
                  {starting ? 'Starting…' : 'Start Test Now'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

const InstructionItem: React.FC<{ icon: React.ReactNode; primary: string; secondary: string }> = ({ icon, primary, secondary }) => (
  <ListItem sx={{ py: 1 }}>
    <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
    <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>{primary}</Typography>} secondary={secondary} />
  </ListItem>
);

const SystemCheckItem: React.FC<{ label: string; status: boolean; icon: React.ReactNode; description: string }> = ({ label, status, icon, description }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2, bgcolor: status ? '#e8f5e9' : '#ffebee', border: 1, borderColor: status ? 'success.main' : 'error.main' }}>
    <Box sx={{ color: status ? 'success.main' : 'error.main' }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">{description}</Typography>
    </Box>
    {status ? <CheckCircle color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
  </Box>
);

const WifiIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
  </svg>
);

export default TestInstructionsPage;
