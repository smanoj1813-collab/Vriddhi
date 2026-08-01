// components/student/StudentAssessmentPortal.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent, Chip, Tabs, Tab,
  Alert, CircularProgress, Paper,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, AccessTime as TimeIcon,
  School as SchoolIcon, TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useStudentTests } from '../../../hooks/useAssessment';
import { useAuth } from '../../auth/hooks/useAuth';
import { StudentTestCard } from '../../../types/assessment';

/** Safely convert Timestamp | Date | string to Date */
const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return new Date();
};

const StudentAssessmentPortal: React.FC = () => {
  const { user } = useAuth();
  const { tests, upcomingTests, availableTests, completedTests, loading, error, refresh } = useStudentTests(
    user?.collegeId,
    user?.id
  );
  const [activeTab, setActiveTab] = useState(0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={refresh} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const renderTestCard = (test: StudentTestCard) => {
    const start = test.startDateTime ? toDate(test.startDateTime) : null;
    const end = test.endDateTime ? toDate(test.endDateTime) : null;

    return (
      <Card key={test.id} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{test.title}</Typography>
            <Chip size="small" label={test.status} color={
              test.status === 'completed' || test.status === 'graded' ? 'success' :
              test.status === 'ongoing' ? 'primary' :
              test.status === 'upcoming' ? 'warning' : 'default'
            } />
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {test.subjectName || test.subject || 'No subject'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
            {start && <Chip size="small" icon={<CalendarIcon fontSize="small" />} label={start.toLocaleDateString()} />}
            <Chip size="small" icon={<TimeIcon fontSize="small" />} label={`${test.durationMinutes} min`} />
            <Chip size="small" icon={<SchoolIcon fontSize="small" />} label={`${test.totalMarks} marks`} />
            {test.paperType && (
              <Chip size="small" label={test.paperType.replace(/_/g, ' ').toUpperCase()} variant="outlined" />
            )}
          </Stack>
          {test.score !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TrendIcon color="primary" fontSize="small" />
              <Typography variant="body2">
                Score: <strong>{test.score}</strong> / {test.totalMarks}
                {test.percentage !== undefined && ` (${test.percentage.toFixed(1)}%)`}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>My Assessments</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label={`Upcoming (${upcomingTests.length})`} />
          <Tab label={`Available (${availableTests.length})`} />
          <Tab label={`Completed (${completedTests.length})`} />
          <Tab label={`All (${tests.length})`} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        upcomingTests.length === 0 ?
          <Alert severity="info">No upcoming assessments</Alert> :
          upcomingTests.map(renderTestCard)
      )}
      {activeTab === 1 && (
        availableTests.length === 0 ?
          <Alert severity="info">No available assessments right now</Alert> :
          availableTests.map(renderTestCard)
      )}
      {activeTab === 2 && (
        completedTests.length === 0 ?
          <Alert severity="info">No completed assessments yet</Alert> :
          completedTests.map(renderTestCard)
      )}
      {activeTab === 3 && (
        tests.length === 0 ?
          <Alert severity="info">No assessments found</Alert> :
          tests.map(renderTestCard)
      )}
    </Box>
  );
};

export default StudentAssessmentPortal;
