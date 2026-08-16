import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, List, ListItem,
  ListItemIcon, ListItemText, Checkbox, FormControlLabel, Alert,
  AlertTitle, Stepper, Step, StepLabel, Paper,
} from '@mui/material';
import {
  Fullscreen, ContentCopy, CameraAlt, Mic, Timer, CheckCircle,
  Error as ErrorIcon, Info, PlayArrow, Security, DesktopAccessDisabled,
  ArrowForward, Keyboard, Mouse,
} from '@mui/icons-material';

const STEPS = ['Read Instructions', 'System Check', 'Proctoring Setup', 'Start Test'];

const TestInstructionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);

  const testInfo = {
    title: testId?.includes('demo-003')
      ? 'Operating Systems — End Semester'
      : testId?.includes('demo-001')
        ? 'Data Structures & Algorithms — Mid Term'
        : testId?.includes('demo-002')
          ? 'Database Management Systems — Quiz 3'
          : 'Assessment',
    totalQuestions: testId?.includes('demo-003') ? 80 : testId?.includes('demo-001') ? 50 : 30,
    duration: testId?.includes('demo-003') ? 180 : testId?.includes('demo-001') ? 120 : 60,
    totalMarks: testId?.includes('demo-003') ? 100 : testId?.includes('demo-001') ? 100 : 20,
  };

  const handleStartTest = () => {
    if (!agreed || !testId) return;
    navigate(`/student/assessments/${testId}/take`);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto', minHeight: '100vh' }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Test Instructions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please read the instructions carefully before starting.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Timer fontSize="small" />} label={`${testInfo.duration} minutes`} />
          <Chip icon={<Info fontSize="small" />} label={`${testInfo.totalQuestions} questions`} />
          <Chip icon={<Security fontSize="small" />} label="Proctored" color="warning" />
        </Box>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
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
              Once you start the test, the timer will begin and cannot be paused.
            </Alert>

            <List>
              <InstructionItem
                icon={<Timer color="primary" />}
                primary="Time Limit"
                secondary={`You have ${testInfo.duration} minutes to complete ${testInfo.totalQuestions} questions. Auto-submit on expiry.`}
              />
              <InstructionItem
                icon={<Info color="primary" />}
                primary="Navigation"
                secondary="Use the question palette to jump between questions. Flag questions to review later."
              />
              <InstructionItem
                icon={<CheckCircle color="primary" />}
                primary="Marking Scheme"
                secondary={`Total marks: ${testInfo.totalMarks}. Full marks for correct answers. No negative marking.`}
              />
              <InstructionItem
                icon={<Fullscreen color="primary" />}
                primary="Fullscreen Mode"
                secondary="Test runs in fullscreen. Exiting may trigger warnings."
              />
              <InstructionItem
                icon={<CameraAlt color="error" />}
                primary="Camera Required"
                secondary="Your camera must remain on throughout the test."
              />
              <InstructionItem
                icon={<DesktopAccessDisabled color="error" />}
                primary="Tab Switching"
                secondary="Switching tabs or applications is prohibited and will be logged."
              />
              <InstructionItem
                icon={<ContentCopy color="error" />}
                primary="Copy / Paste Blocked"
                secondary="Clipboard operations are disabled during the test."
              />
              <InstructionItem
                icon={<Keyboard color="error" />}
                primary="Keyboard Restrictions"
                secondary="Shortcuts like Alt+Tab, Ctrl+C, PrintScreen are blocked."
              />
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
              Ensure your device meets the requirements.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
              <SystemCheckItem label="Camera Access" status icon={<CameraAlt />} description="Required for proctoring" />
              <SystemCheckItem label="Microphone Access" status icon={<Mic />} description="Required for proctoring" />
              <SystemCheckItem label="Fullscreen Support" status icon={<Fullscreen />} description="Browser supports fullscreen API" />
              <SystemCheckItem label="Internet Connection" status icon={<WifiIcon />} description="Stable connection detected" />
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
              <Security color="primary" /> Proctoring Agreement
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a <strong>proctored test</strong>. The following monitoring will be active:
            </Alert>

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
                    <CameraAlt fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Continuous webcam monitoring" secondary="Video feed recorded and analyzed" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
                    <DesktopAccessDisabled fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Tab switching detection" secondary="Leaving test tab triggers warning" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
                    <ContentCopy fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Copy/paste prevention" secondary="Clipboard operations disabled" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
                    <Mouse fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Right-click disabled" secondary="Context menus blocked" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ color: 'error.main', minWidth: 36 }}>
                    <Keyboard fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Keyboard shortcuts blocked" secondary="Alt+Tab, Ctrl+C, PrintScreen, etc." />
                </ListItem>
              </List>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} color="primary" />
              }
              label={
                <Typography variant="body2">
                  I have read and understood all instructions. I agree to abide by the test rules and proctoring policies.
                </Typography>
              }
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setActiveStep(1)}>Back</Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                disabled={!agreed}
                onClick={handleStartTest}
                startIcon={<PlayArrow />}
                sx={{ px: 4, py: 1.5, fontWeight: 700 }}
              >
                Start Test Now
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

const InstructionItem: React.FC<{ icon: React.ReactNode; primary: string; secondary: string }> = ({
  icon,
  primary,
  secondary,
}) => (
  <ListItem sx={{ py: 1 }}>
    <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
    <ListItemText
      primary={<Typography sx={{ fontWeight: 600 }}>{primary}</Typography>}
      secondary={secondary}
    />
  </ListItem>
);

const SystemCheckItem: React.FC<{ label: string; status: boolean; icon: React.ReactNode; description: string }> = ({
  label,
  status,
  icon,
  description,
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      p: 2,
      borderRadius: 2,
      bgcolor: status ? '#e8f5e9' : '#ffebee',
      border: 1,
      borderColor: status ? 'success.main' : 'error.main',
    }}
  >
    <Box sx={{ color: status ? 'success.main' : 'error.main' }}>{icon}</Box>
    <Box sx={{ flex: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {description}
      </Typography>
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