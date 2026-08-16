// components/student/StudentAssessmentPortal.tsx
import React, { useState } from 'react';
import {
  Box, Typography, Button, Stack, Card, CardContent, Chip, Tabs, Tab,
  Alert, CircularProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon, AccessTime as TimeIcon,
  School as SchoolIcon, TrendingUp as TrendIcon,
} from '@mui/icons-material';
import type { StudentTestCard } from '../../../types/assessment';

/** Safely convert Timestamp | Date | string to Date */
const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return new Date();
};

// ═══════════════════════════════════════════════════════
// DEMO DATA — Remove this block after testing
// ═══════════════════════════════════════════════════════
const demoTests: StudentTestCard[] = [
  {
    id: 'demo-001',
    title: 'Data Structures & Algorithms — Mid Term',
    subjectName: 'Computer Science',
    startDateTime: new Date(Date.now() + 2 * 86400000),
    endDateTime: new Date(Date.now() + 2 * 86400000 + 2 * 3600000),
    durationMinutes: 120,
    totalMarks: 100,
    status: 'upcoming',
    paperType: 'objective',
  },
  {
    id: 'demo-002',
    title: 'Database Management Systems — Quiz 3',
    subjectName: 'DBMS',
    startDateTime: new Date(Date.now() + 5 * 86400000),
    endDateTime: new Date(Date.now() + 5 * 86400000 + 3600000),
    durationMinutes: 60,
    totalMarks: 20,
    status: 'upcoming',
    paperType: 'objective',
  },
  {
    id: 'demo-003',
    title: 'Operating Systems — End Semester',
    subjectName: 'OS',
    startDateTime: new Date(),
    endDateTime: new Date(Date.now() + 3 * 3600000),
    durationMinutes: 180,
    totalMarks: 100,
    status: 'ongoing',
    paperType: 'mixed',
  },
  {
    id: 'demo-004',
    title: 'Mathematics — Unit Test 1',
    subjectName: 'Mathematics',
    startDateTime: new Date(Date.now() - 7 * 86400000),
    endDateTime: new Date(Date.now() - 7 * 86400000 + 3600000),
    durationMinutes: 60,
    totalMarks: 50,
    status: 'completed',
    score: 42,
    percentage: 84,
    paperType: 'objective',
  },
  {
    id: 'demo-005',
    title: 'Computer Networks — Surprise Test',
    subjectName: 'CN',
    startDateTime: new Date(Date.now() - 3 * 86400000),
    endDateTime: new Date(Date.now() - 3 * 86400000 + 1800000),
    durationMinutes: 30,
    totalMarks: 15,
    status: 'completed',
    score: 10,
    percentage: 66.7,
    paperType: 'subjective',
  },
];

const upcomingTests = demoTests.filter(t => t.status === 'upcoming');
const availableTests = demoTests.filter(t => t.status === 'ongoing' || t.status === 'upcoming');
const completedTests = demoTests.filter(t => t.status === 'completed' || t.status === 'graded');
const tests = demoTests;
// ═══════════════════════════════════════════════════════
// END DEMO DATA
// ═══════════════════════════════════════════════════════

const StudentAssessmentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const loading = false;
  const error = null;
  const refresh = () => {};

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
            <Chip size="small" icon={<TimeIcon fontSize="small" />} label={`${test.durationMinutes ?? test.duration ?? 0} min`} />
            <Chip size="small" icon={<SchoolIcon fontSize="small" />} label={`${test.totalMarks ?? 0} marks`} />
            {test.paperType && (
              <Chip size="small" label={test.paperType.replace(/_/g, ' ').toUpperCase()} variant="outlined" />
            )}
          </Stack>
          {test.score !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <TrendIcon color="primary" fontSize="small" />
              <Typography variant="body2">
                Score: <strong>{test.score}</strong> / {test.totalMarks ?? 0}
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