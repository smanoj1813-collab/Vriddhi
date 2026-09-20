// src/modules/faculty/components/FacultyAcademicPlanner.tsx
// ------------------------------------------------------------------
// Faculty academic planning surface on the faculty dashboard, powered by the
// `getFacultyAcademicContext` callable (asia-south1).
//
// Everything shown is college-scoped and computed server-side: curriculum
// courses, upcoming sessions, assignment and assessment history. A course
// filter re-issues the bounded callable read with `courseId` so a faculty
// member teaching several courses can distinguish them — no client-side
// guessing, no listeners, no AI.
//
// State contract mirrors StudentAcademicSummary:
//   disabled (`{ enabled:false }`) → renders nothing, dashboard unaffected
//   error / unauthorized role      → clean alert with retry where useful
// ------------------------------------------------------------------
import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, Grid, InputLabel,
  LinearProgress, MenuItem, Paper, Select, Typography, Tooltip,
} from '@mui/material';
import {
  Assessment as AssessmentIcon, Assignment as AssignmentIcon,
  BookOutlined as BookIcon, EventNote as EventIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useFacultyAcademicContext } from '../hooks/useFacultyAcademicContext';
import {
  isFacultyAssignmentPending,
  isFacultyAssessmentUpcoming,
} from '@/shared/api/academicContext';

const MAX_PER_PANEL = 5;

function formatDate(value: string | undefined, fallback = 'Date pending'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const scheduledMs = (value: string | undefined): number => {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

/** Soonest-first, purely on stored schedule data (missing dates sort last). */
const sortBySchedule = <T extends { scheduledAt?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => scheduledMs(a.scheduledAt) - scheduledMs(b.scheduledAt));

interface RowProps {
  primary: string;
  secondary: string;
  chip?: { label: string; color: 'primary' | 'success' | 'warning' | 'error' | 'default' };
}

function ContextRow({ primary, secondary, chip }: RowProps) {
  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
        p: 1.25, mb: 1, borderRadius: 2, bgcolor: 'background.paper',
        border: '1px solid', borderColor: 'divider',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{primary}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{secondary}</Typography>
      </Box>
      {chip && <Chip label={chip.label} size="small" color={chip.color} variant="outlined" sx={{ shrink: 0 }} />}
    </Box>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {title}
      </Typography>
      <Chip label={count} size="small" variant="outlined" />
    </Box>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 2, textAlign: 'center' }}>
      {text}
    </Typography>
  );
}

export default function FacultyAcademicPlanner() {
  const [courseFilter, setCourseFilter] = useState<string>('');
  const { context, disabled, unauthorizedRole, loading, error, refetch } =
    useFacultyAcademicContext(courseFilter || undefined);

  const todayKey = useMemo(
    () => (context?.generatedFor || '').slice(0, 10),
    [context?.generatedFor]
  );

  // Feature gate off: render nothing — the rest of the dashboard is
  // independent of this callable (acceptance: disabled must not break UI).
  if (disabled && !error) return null;

  if (unauthorizedRole) {
    return (
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Academic planning is available to faculty, HOD, principal and admin roles.
      </Alert>
    );
  }

  if (error && !context) {
    return (
      <Alert
        severity="warning"
        sx={{ mb: 3, borderRadius: 2 }}
        action={
          <Button color="inherit" size="small" onClick={refetch} startIcon={<RefreshIcon />}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!context) {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5, mb: 3 }}>
          <CircularProgress size={28} sx={{ mr: 2 }} />
          <Typography color="text.secondary">Loading academic planning…</Typography>
        </Box>
      );
    }
    return null;
  }

  const pendingAssignments = context.assignmentHistory.filter(isFacultyAssignmentPending);
  const upcomingAssessments = sortBySchedule(
    context.assessmentHistory.filter((item) => isFacultyAssessmentUpcoming(item, todayKey))
  );

  return (
    <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }} component="section" aria-label="Academic planning">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Academic Planning
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Deterministic college scope{context.generatedFor ? ` · as of ${context.generatedFor}` : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Reload from the academic service">
            <span>
              <Button size="small" onClick={refetch} disabled={loading} startIcon={<RefreshIcon />}>
                Refresh
              </Button>
            </span>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            {/* The filter is a bounded callable re-read, not a client-side guess. */}
            <InputLabel id="academic-planner-course-filter">Filter by course</InputLabel>
            <Select
              labelId="academic-planner-course-filter"
              value={courseFilter}
              label="Filter by course"
              onChange={(event) => setCourseFilter(event.target.value)}
            >
              <MenuItem value="">All courses</MenuItem>
              {context.courses.map((course) => (
                <MenuItem key={course.id} value={course.id}>
                  {course.courseCode} — {course.courseName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      <Grid container spacing={3}>
        {/* Courses */}
        <Grid size={{ xs: 12, md: 3 }}>
          <SectionTitle icon={<BookIcon color="primary" />} title="Courses" count={context.courses.length} />
          {context.courses.length === 0 ? (
            <EmptyNote text="No curriculum courses in your college scope yet." />
          ) : (
            context.courses.slice(0, MAX_PER_PANEL + 3).map((course) => (
              <ContextRow
                key={course.id}
                primary={`${course.courseCode} — ${course.courseName}`}
                secondary={`${course.moduleCount} module${course.moduleCount === 1 ? '' : 's'}`}
              />
            ))
          )}
          {context.completedTopics.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Recently completed topics:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {context.completedTopics.slice(0, 4).map((topic) => (
                  <Chip key={topic} label={topic} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Grid>

        {/* Upcoming sessions */}
        <Grid size={{ xs: 12, md: 3 }}>
          <SectionTitle icon={<EventIcon color="primary" />} title="Upcoming sessions" count={context.upcomingSessions.length} />
          {context.upcomingSessions.length === 0 ? (
            <EmptyNote text="No upcoming sessions scheduled." />
          ) : (
            context.upcomingSessions.slice(0, MAX_PER_PANEL).map((session) => (
              <ContextRow
                key={session.id}
                primary={session.courseCode || session.courseId || 'Session'}
                secondary={formatDate(session.date)}
                chip={session.topicNames?.length ? { label: `${session.topicNames.length} topic${session.topicNames.length === 1 ? '' : 's'}`, color: 'primary' } : undefined}
              />
            ))
          )}
        </Grid>

        {/* Pending assignments */}
        <Grid size={{ xs: 12, md: 3 }}>
          <SectionTitle icon={<AssignmentIcon color="primary" />} title="Open assignments" count={pendingAssignments.length} />
          {pendingAssignments.length === 0 ? (
            <EmptyNote text="No open assignments." />
          ) : (
            pendingAssignments.slice(0, MAX_PER_PANEL).map((assignment) => (
              <ContextRow
                key={assignment.id}
                primary={assignment.title}
                secondary={`${assignment.courseCode || 'Course pending'}${assignment.dueDate ? ` · due ${formatDate(assignment.dueDate)}` : ''}`}
              />
            ))
          )}
        </Grid>

        {/* Upcoming assessments */}
        <Grid size={{ xs: 12, md: 3 }}>
          <SectionTitle icon={<AssessmentIcon color="primary" />} title="Upcoming assessments" count={upcomingAssessments.length} />
          {upcomingAssessments.length === 0 ? (
            <EmptyNote text="No upcoming assessments." />
          ) : (
            upcomingAssessments.slice(0, MAX_PER_PANEL).map((assessment) => (
              <ContextRow
                key={assessment.id}
                primary={assessment.title}
                secondary={`${assessment.courseCode || 'Course pending'}${assessment.scheduledAt ? ` · ${formatDate(assessment.scheduledAt)}` : ''}`}
                chip={assessment.status ? { label: assessment.status, color: 'default' } : undefined}
              />
            ))
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
