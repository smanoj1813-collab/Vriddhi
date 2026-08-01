import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Checkbox, FormControlLabel,
  Alert, AlertTitle, LinearProgress, Chip, List, ListItem, ListItemIcon,
  ListItemText, Stepper, Step, StepLabel, Paper, Divider,
} from "@mui/material";
import {
  Warning, Fullscreen, ContentCopy, CameraAlt, Mic, Timer,
  CheckCircle, Error, Info, PlayArrow, Security, Visibility,
  DesktopAccessDisabled, ArrowForward, Keyboard, Mouse,
} from "@mui/icons-material";
import { useActiveTest } from './../hooks/useAssessment';

const STEPS = ["Read Instructions", "System Check", "Proctoring Setup", "Start Test"];

const TestInstructionsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const collegeId = localStorage.getItem("collegeId") || "";
  const studentId = localStorage.getItem("studentId") || "";
  const { activeTest: test, loading, error } = useActiveTest(collegeId);
  const [activeStep, setActiveStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [systemChecks, setSystemChecks] = useState({
    camera: false, microphone: false, fullscreen: false, internet: true,
  });
  const [checkInProgress, setCheckInProgress] = useState(false);

  const enterFullscreen = useCallback(async () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) { await elem.requestFullscreen(); }
      else if ((elem as any).webkitRequestFullscreen) { await (elem as any).webkitRequestFullscreen(); }
      else if ((elem as any).msRequestFullscreen) { await (elem as any).msRequestFullscreen(); }
      return true;
    } catch (err) { console.error("Fullscreen error:", err); return false; }
  }, []);

  const checkFullscreen = useCallback(() => {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement);
  }, []);

  const runSystemCheck = async () => {
    setCheckInProgress(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setSystemChecks((prev) => ({ ...prev, camera: true }));
    } catch { setSystemChecks((prev) => ({ ...prev, camera: false })); }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setSystemChecks((prev) => ({ ...prev, microphone: true }));
    } catch { setSystemChecks((prev) => ({ ...prev, microphone: false })); }

    const fs = await enterFullscreen();
    setSystemChecks((prev) => ({ ...prev, fullscreen: fs }));
    if (fs) { setTimeout(() => { if (document.exitFullscreen) document.exitFullscreen(); }, 1000); }

    setCheckInProgress(false);
    setActiveStep(2);
  };

  const handleStartTest = async () => {
    if (!agreed || !testId) return;
    const fsSuccess = await enterFullscreen();
    if (!fsSuccess) {
      alert("Fullscreen mode is required for this test.");
      return;
    }
    navigate(`/student/assessments/${testId}/take`);
  };

  useEffect(() => {
    const handleFsChange = () => {
      setSystemChecks((prev) => ({ ...prev, fullscreen: checkFullscreen() }));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, [checkFullscreen]);

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading test details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
        <Alert severity="error"><AlertTitle>Error</AlertTitle>{error}</Alert>
      </Box>
    );
  }

  const allChecksPass = systemChecks.camera && systemChecks.microphone && systemChecks.internet;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: "auto", minHeight: "100vh" }}>
      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Test Instructions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please read the instructions carefully before starting the test.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Chip icon={<Timer fontSize="small" />} label="Timed Assessment" />
          <Chip icon={<Visibility fontSize="small" />} label={`${test?.questions?.length || 0} questions`} />
          <Chip icon={<Security fontSize="small" />} label="Proctored" color="warning" />
        </Box>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
      </Stepper>

      {activeStep === 0 && (
        <FadeIn>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }} gutterBottom>
                <Info color="primary" />Test Instructions
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Important</AlertTitle>
                Once you start the test, the timer will begin and cannot be paused.
              </Alert>

              <List>
                <InstructionItem icon={<Timer color="primary" />} primary="Time Limit"
                  secondary="Auto-submit on expiry." />
                <InstructionItem icon={<Visibility color="primary" />} primary="Navigation"
                  secondary="Navigate using the question palette. Flag questions to review later." />
                <InstructionItem icon={<CheckCircle color="primary" />} primary="Marking Scheme"
                  secondary="Full marks for correct answers. No negative marking." />
                <InstructionItem icon={<Fullscreen color="primary" />} primary="Fullscreen Mode"
                  secondary="Test runs in fullscreen. Exiting may auto-submit." />
                <InstructionItem icon={<CameraAlt color="error" />} primary="Camera Required"
                  secondary="Camera must remain on. Face detection active." />
                <InstructionItem icon={<DesktopAccessDisabled color="error" />} primary="Tab Switching"
                  secondary="Switching tabs is prohibited and will be logged." />
                <InstructionItem icon={<ContentCopy color="error" />} primary="Copy/Paste Blocked"
                  secondary="Clipboard operations are disabled." />
                <InstructionItem icon={<Keyboard color="error" />} primary="Keyboard Restrictions"
                  secondary="Alt+Tab, Ctrl+C, PrintScreen blocked." />
              </List>

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={() => setActiveStep(1)} endIcon={<ArrowForward />}>
                  Next: System Check
                </Button>
              </Box>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {activeStep === 1 && (
        <FadeIn>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }} gutterBottom>
                <DesktopAccessDisabled color="primary" />System Compatibility Check
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Verify your device meets the requirements for this test.
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 4 }}>
                <SystemCheckItem label="Camera Access" status={systemChecks.camera} icon={<CameraAlt />}
                  description="Required for proctoring" />
                <SystemCheckItem label="Microphone Access" status={systemChecks.microphone} icon={<Mic />}
                  description="Required for proctoring" />
                <SystemCheckItem label="Fullscreen Support" status={systemChecks.fullscreen} icon={<Fullscreen />}
                  description="Browser must support fullscreen API" />
                <SystemCheckItem label="Internet Connection" status={systemChecks.internet} icon={<WifiIcon />}
                  description="Stable connection required" />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>Back</Button>
                <Button variant="contained" onClick={runSystemCheck} disabled={checkInProgress}
                  startIcon={checkInProgress ? <Spinner size={16} /> : <CheckCircle />}>
                  {checkInProgress ? "Checking..." : "Run System Check"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {activeStep === 2 && (
        <FadeIn>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }} gutterBottom>
                <Security color="primary" />Proctoring Agreement
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                This is a <strong>proctored test</strong>. The following monitoring will be active:
              </Alert>
              <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <List dense>
                  <ListItem>
                    <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><CameraAlt fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Continuous webcam monitoring" secondary="Video feed recorded and analyzed" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><TabIcon /></ListItemIcon>
                    <ListItemText primary="Tab switching detection" secondary="Leaving test tab triggers warning" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><ContentCopy fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Copy/paste prevention" secondary="Clipboard operations disabled" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><Mouse fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Right-click disabled" secondary="Context menus blocked" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon sx={{ color: "error.main", minWidth: 36 }}><Keyboard fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Keyboard shortcuts blocked" secondary="Alt+Tab, Ctrl+C, PrintScreen, etc." />
                  </ListItem>
                </List>
              </Paper>
              <FormControlLabel
                control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} color="primary" />}
                label={<Typography variant="body2">
                  I have read and understood all instructions. I agree to abide by test rules.
                </Typography>}
                sx={{ mb: 3 }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={() => setActiveStep(1)}>Back</Button>
                <Button variant="contained" color="success" size="large" disabled={!agreed || !allChecksPass}
                  onClick={handleStartTest} startIcon={<PlayArrow />} sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                  Start Test Now
                </Button>
              </Box>
              {!allChecksPass && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <AlertTitle>System Check Failed</AlertTitle>
                  Ensure camera, microphone, and fullscreen are working.
                </Alert>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      )}
    </Box>
  );
};

const InstructionItem: React.FC<{ icon: React.ReactNode; primary: string; secondary: string }> =
  ({ icon, primary, secondary }) => (
    <ListItem sx={{ py: 1 }}>
      <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={<Typography sx={{ fontWeight: 600 }}>{primary}</Typography>}
        secondary={secondary}
      />
    </ListItem>
  );

const SystemCheckItem: React.FC<{ label: string; status: boolean; icon: React.ReactNode; description: string }> =
  ({ label, status, icon, description }) => (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 2,
      bgcolor: status ? "success.light" : "error.light",
      opacity: 0.1,
      border: 1, borderColor: status ? "success.light" : "error.light",
    }}>
      <Box sx={{ color: status ? "success.main" : "error.main" }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{description}</Typography>
      </Box>
      {status ? <CheckCircle color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
    </Box>
  );

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 50); return () => clearTimeout(t); }, []);
  return <Box sx={{ opacity: show ? 1 : 0, transition: "opacity 0.3s ease" }}>{children}</Box>;
};

const Spinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Box component="span" sx={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderRightColor: "transparent", borderRadius: "50%",
    animation: "spin 1s linear infinite",
    "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
  }} />
);

const WifiIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
  </svg>
);

const TabIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
  </svg>
);

export default TestInstructionsPage;
