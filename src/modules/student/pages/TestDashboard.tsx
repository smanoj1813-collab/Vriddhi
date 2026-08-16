// src/modules/student/pages/TestDashboard.tsx
// Student dashboard showing upcoming, available, and completed tests

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  PlayArrow as StartIcon,
  Visibility as ViewIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useStudentTests } from '../hooks/useStudentTests';
import { useAuth } from '../../auth/context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const TestDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showStartConfirm, setShowStartConfirm] = useState(false);

  const {
    tests,
    upcomingTests,
    availableTests,
    completedTests,
    loading,
    error,
    refresh,
  } = useStudentTests(user?.collegeId, user?.id);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStartTest = (testId: string) => {
    setSelectedTest(testId);
    setShowStartConfirm(true);
  };

  const confirmStart = () => {
    if (selectedTest) {
      navigate(`/student/tests/${selectedTest}/take`);
    }
    setShowStartConfirm(false);
  };

  const handleViewResult = (testId: string) => {
    navigate(`/student/tests/${testId}/result`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m > 0 ? m + 'm' : ''}`;
    }
    return `${minutes} min`;
  };

  const renderTestCard = (test: typeof tests[0], actions: React.ReactNode) => (
    <Card key={test.id} variant="outlined" sx={{ mb: 2, transition: 'all 0.2s', '&:hover': { boxShadow: 2 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {test.title}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              <Chip label={test.subject} size="small" color="primary" variant="outlined" />
              <Chip label={`${test.totalMarks} marks`} size="small" variant="outlined" />
              <Chip label={`${test.totalQuestions} Qs`} size="small" variant="outlined" />
              <Chip label={formatDuration(test.duration)} size="small" icon={<TimeIcon fontSize="small" />} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
              <CalendarIcon fontSize="small" />
              <Typography variant="body2">
                {formatDate(test.startDateTime)} — {formatDate(test.endDateTime)}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={test.status}
            color={
              test.status === 'available' || test.status === 'ongoing' ? 'success' :
              test.status === 'completed' || test.status === 'graded' ? 'info' :
              test.status === 'missed' ? 'error' : 'warning'
            }
            size="small"
          />
        </Box>

        {test.marksObtained !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Score: {test.marksObtained} / {test.totalMarks}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {test.percentage?.toFixed(1)}% {test.grade ? `(${test.grade})` : ''}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={((test.marksObtained || 0) / test.totalMarks) * 100}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  bgcolor: (test.percentage || 0) >= 40 ? 'success.main' : 'error.main',
                },
              }}
            />
          </Box>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        {actions}
      </CardActions>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        My Assessments
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and take your scheduled tests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
          <Typography variant="h4" color="warning.main">{upcomingTests.length}</Typography>
          <Typography variant="body2" color="text.secondary">Upcoming</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
          <Typography variant="h4" color="success.main">{availableTests.length}</Typography>
          <Typography variant="body2" color="text.secondary">Available Now</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: '1 1 200px', textAlign: 'center' }}>
          <Typography variant="h4" color="info.main">{completedTests.length}</Typography>
          <Typography variant="body2" color="text.secondary">Completed</Typography>
        </Paper>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={`Available (${availableTests.length})`} icon={<StartIcon />} iconPosition="start" />
          <Tab label={`Upcoming (${upcomingTests.length})`} icon={<CalendarIcon />} iconPosition="start" />
          <Tab label={`Completed (${completedTests.length})`} icon={<CompletedIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {availableTests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No tests available right now.</Typography>
          </Paper>
        ) : (
          availableTests.map((test) =>
            renderTestCard(test, (
              <Button
                variant="contained"
                color="success"
                startIcon={<StartIcon />}
                onClick={() => handleStartTest(test.assessmentId)}
                size="large"
              >
                Start Test
              </Button>
            ))
          )
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {upcomingTests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No upcoming tests scheduled.</Typography>
          </Paper>
        ) : (
          upcomingTests.map((test) =>
            renderTestCard(test, (
              <Button variant="outlined" disabled startIcon={<TimeIcon />}>
                Starts {formatDate(test.startDateTime)}
              </Button>
            ))
          )
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {completedTests.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No completed tests yet.</Typography>
          </Paper>
        ) : (
          completedTests.map((test) =>
            renderTestCard(test, (
              <Button
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() => handleViewResult(test.assessmentId)}
              >
                View Result
              </Button>
            ))
          )
        )}
      </TabPanel>

      <Dialog open={showStartConfirm} onClose={() => setShowStartConfirm(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Start Test?
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Once started, the timer will begin and cannot be paused.
          </Alert>
          <Typography variant="body1">
            You are about to start <strong>{tests.find(t => t.assessmentId === selectedTest)?.title}</strong>.
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Duration:</strong> {formatDuration(tests.find(t => t.assessmentId === selectedTest)?.duration || 0)}
            </Typography>
            <Typography variant="body2">
              <strong>Total Marks:</strong> {tests.find(t => t.assessmentId === selectedTest)?.totalMarks}
            </Typography>
            <Typography variant="body2">
              <strong>Questions:</strong> {tests.find(t => t.assessmentId === selectedTest)?.totalQuestions}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStartConfirm(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={confirmStart} variant="contained" color="success">
            Start Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestDashboard;