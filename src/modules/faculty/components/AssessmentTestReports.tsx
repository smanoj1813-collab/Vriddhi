import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  BarChart,
  CheckCircle,
  HourglassTop,
  Public,
  Warning,
} from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useScheduledTests } from '../../../hooks/useAssessment';
import type {
  AssessmentTestReport,
  ScheduledTest,
} from '../../../types/assessment';

/*
 * Shared test completion + report view.
 *
 * Used by:
 *  - /faculty/assessments → "My tests" tab (faculty, hod, mentor)
 *  - /admin/test-reports  (admin, principal, hod, superadmin)
 *
 * The server (listManagedAssessmentTests / getAssessmentTestReport) serves the
 * college-wide list and reports to every assessment manager, so every faculty
 * member, principal, and admin sees the same completed-test + report data.
 */

/* ─── helpers ── */

const toMs = (value: string | Date | { toDate?: () => Date } | undefined | null): number => {
  if (!value) return NaN;
  const d = value instanceof Date ? value : typeof value === 'string' ? new Date(value) : (value as { toDate?: () => Date }).toDate ? (value as { toDate: () => Date }).toDate() : new Date(String(value));
  return d.getTime();
};

const fmtDateTime = (value: Date | string | null | undefined): string => {
  if (!value) return '—';
  const ms = toMs(value);
  if (Number.isNaN(ms)) return '—';
  return new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.max(0, Math.round(seconds));
  if (s >= 3600) return `${Math.floor(s / 3600)}h ${Math.round((s % 3600) / 60)}m`;
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
};

type TestPhase = 'cancelled' | 'upcoming' | 'live' | 'completed';

const derivePhase = (test: ScheduledTest, now: number): TestPhase => {
  if (test.status === 'cancelled') return 'cancelled';
  const start = toMs(test.startDateTime);
  const end = toMs(test.endDateTime);
  if (!Number.isNaN(start) && now < start) return 'upcoming';
  if (!Number.isNaN(end) && now > end) return 'completed';
  return 'live';
};

const PHASE_CHIP: Record<TestPhase, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  upcoming: { label: 'Upcoming', color: 'info' },
  live: { label: 'In progress', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

/* ─── single-test report ─── */

function TestReport({ testId, onBack }: { testId: string; onBack: () => void }) {
  const [report, setReport] = useState<AssessmentTestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const fn = httpsCallable<{ testId: string }, AssessmentTestReport>(functions, 'getAssessmentTestReport');
      const res = await fn({ testId });
      setReport(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The test report could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  // While the test window is open, keep the report live.
  useEffect(() => {
    if (!report) return;
    const now = Date.now();
    const start = toMs(report.test.startDateTime);
    const end = toMs(report.test.endDateTime);
    const live = !Number.isNaN(start) && !Number.isNaN(end) && now >= start && now <= end;
    if (!live) return;
    const id = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(id);
  }, [report, load]);

  if (loading && !report) {
    return (
      <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error && !report) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={onBack}>Back to my tests</Button>
      </>
    );
  }
  if (!report) return null;

  const { test, summary, students } = report;
  const stat = (label: string, value: ReactNode, hint?: string) => (
    <Box key={label} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, minWidth: 120, flex: '1 1 120px' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Button startIcon={<ArrowBack />} variant="outlined" onClick={onBack}>Back</Button>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{test.title || 'Test report'}</Typography>
          <Typography variant="body2" color="text.secondary">
            {test.subject}
            {[test.branch, test.batch].filter(Boolean).length > 0
              ? ` · ${[test.branch, test.batch].filter(Boolean).join(' · ')}`
              : ''}
            {test.facultyName ? ` · by ${test.facultyName}` : ''} · {test.totalQuestions} questions · {test.totalMarks} marks · {fmtDateTime(test.startDateTime)} – {fmtDateTime(test.endDateTime)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {test.enableProctoring && <Chip size="small" label="Proctored" color="warning" />}
          {test.maxTabSwitches > 0 && <Chip size="small" label={`Max ${test.maxTabSwitches} tab switches`} color="warning" />}
          {(test.shuffleQuestions || test.shuffleSections || test.shuffleOptions) && <Chip size="small" label="Shuffled" />}
        </Box>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        {stat('Submitted', `${summary.submitted} / ${test.totalStarted || summary.submitted || '—'}`, 'of students who started')}
        {stat('Graded', summary.graded)}
        {stat('Awaiting grading', summary.pendingManual, 'manual marks due')}
        {stat('In progress', summary.inProgress)}
        {stat('Average', summary.avgPercentage === null ? '—' : `${summary.avgPercentage}%`)}
        {stat('Highest', summary.maxPercentage === null ? '—' : `${summary.maxPercentage}%`)}
        {stat('Lowest', summary.minPercentage === null ? '—' : `${summary.minPercentage}%`)}
        {stat('Late', summary.lateSubmissions, 'with penalty')}
        {stat('Auto-submitted', summary.autoSubmittedCount, 'time/tab limit')}
      </Box>

      {summary.pendingManual > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {summary.pendingManual} submission{summary.pendingManual > 1 ? 's' : ''} awaiting manual grading — the scheduling faculty (or an admin) can complete it in the manual grading flow.
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Student results ({students.length})</Typography>
          {students.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No student attempts recorded for this test yet.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="right">%</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.studentId} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{s.studentName}</Typography>
                        {s.regNo && <Typography variant="caption" color="text.secondary">{s.regNo}</Typography>}
                      </TableCell>
                      <TableCell>
                        {s.status === 'graded' && <Chip size="small" color="success" label="Graded" />}
                        {s.status === 'submitted' && (s.needsManualGrading
                          ? <Chip size="small" color="info" label="Awaiting grading" />
                          : <Chip size="small" color="info" label="Submitted" />)}
                        {s.status === 'in_progress' && <Chip size="small" color="warning" label="In progress" />}
                        {s.status === 'not_started' && <Chip size="small" label="Not started" />}
                      </TableCell>
                      <TableCell align="right">
                        {s.status === 'graded' && s.marksObtained !== null
                          ? `${s.marksObtained} / ${s.totalMarks}`
                          : s.status === 'submitted' && s.autoScore !== null
                            ? `${s.autoScore} auto + manual`
                            : '—'}
                      </TableCell>
                      <TableCell align="right">{s.percentage === null ? '—' : `${s.percentage}%`}</TableCell>
                      <TableCell>{s.grade || '—'}</TableCell>
                      <TableCell align="right">{fmtDuration(s.timeSpent)}</TableCell>
                      <TableCell>
                        {s.submittedAt ? fmtDateTime(s.submittedAt) : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {s.isLateSubmission && <Chip size="small" color="warning" label={`Late −${s.latePenaltyPercentage}%`} />}
                          {s.autoSubmitted && <Chip size="small" color="error" icon={<HourglassTop />} label="Auto" />}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

/* ─── list + report entry ─── */

export default function AssessmentTestReports({ showScheduleHint = false }: { showScheduleHint?: boolean }) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const { tests, loading, error, refresh, publish, cancel } = useScheduledTests(collegeId);
  const [reportTestId, setReportTestId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);

  // Keep phase chips (upcoming → in progress → completed) current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (reportTestId) {
    return <TestReport testId={reportTestId} onBack={() => setReportTestId(null)} />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          My tests ({tests.length})
        </Typography>
        <Button variant="outlined" size="small" onClick={() => { void refresh(); }}>Refresh</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && tests.length === 0 && (
        <Alert severity="info">
          No tests scheduled yet{showScheduleHint ? ' — use the “Schedule a test” tab' : ''}.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {tests.map((test) => {
          const phase = derivePhase(test, now);
          const chip = PHASE_CHIP[phase];
          const submitted = Number(test.totalSubmitted) || 0;
          const graded = Number(test.totalGraded) || 0;
          const started = Number(test.totalStarted) || 0;
          // Server policy: faculty may publish/cancel only their own tests;
          // hod/principal/admin/superadmin may manage any test in the college.
          const canManage = !user?.role
            || user.role === 'faculty'
              ? test.facultyId === user?.uid
              : true;
          return (
            <Card key={test.id} variant="outlined">
              <CardContent sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, p: 2.5 }}>
                <Box sx={{ flex: '1 1 260px', minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700 }}>{test.title || 'Test'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {test.subject} · {test.totalQuestions} questions · {test.totalMarks} marks
                  </Typography>
                  {test.facultyName && (
                    <Typography variant="body2" color="text.secondary">
                      Scheduled by {test.facultyName}
                      {user?.name && test.facultyName === user.name ? ' (you)' : ''}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {fmtDateTime(test.startDateTime)} – {fmtDateTime(test.endDateTime)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {test.branch && <Chip size="small" label={test.branch} />}
                    {test.batch && <Chip size="small" label={`Batch ${test.batch}`} />}
                    {test.enableProctoring && <Chip size="small" label="Proctored" color="warning" />}
                    {Number(test.maxTabSwitches) > 0 && <Chip size="small" label={`Max ${test.maxTabSwitches} tab switches`} />}
                    {(test.shuffleQuestions || test.shuffleSections || test.shuffleOptions) && <Chip size="small" label="Shuffled" />}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'flex-end' }}>
                  <Chip label={chip.label} color={chip.color} size="small" icon={phase === 'live' ? <Warning /> : phase === 'completed' ? <CheckCircle /> : <HourglassTop />} />
                  <Typography variant="body2" color="text.secondary">
                    {started} started · {submitted} submitted{graded > 0 ? ` · ${graded} graded` : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button variant="contained" size="small" startIcon={<BarChart />} onClick={() => setReportTestId(test.id)}>
                    Report
                  </Button>
                  {test.status === 'scheduled' && canManage && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Public />}
                      disabled={busyId === test.id}
                      onClick={async () => {
                        setBusyId(test.id);
                        try {
                          await publish(test.id);
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      Publish
                    </Button>
                  )}
                  {(test.status === 'scheduled' || test.status === 'published') && canManage && (
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={busyId === test.id}
                      onClick={async () => {
                        if (!window.confirm('Cancel this test? Students will no longer be able to take it.')) return;
                        setBusyId(test.id);
                        try {
                          await cancel(test.id, 'Cancelled by faculty');
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
