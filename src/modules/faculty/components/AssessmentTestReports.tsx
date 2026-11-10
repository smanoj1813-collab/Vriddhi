import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as XLSX from '@e965/xlsx';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  BarChart,
  CheckCircle,
  Delete,
  FileDownload,
  HourglassTop,
  Public,
  Tune,
  Warning,
} from '@mui/icons-material';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { useScheduledTests } from '../../../hooks/useAssessment';
import type {
  AssessmentTestReport,
  PerformanceCategory,
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
 *
 * Report extras:
 *  - Status categories ("Good to Go ≥ 70%" etc.) are college-configured
 *    (getAssessmentConfig / saveAssessmentConfig), never hardcoded.
 *  - One-click Excel export of the conducted test: student, roll no, course,
 *    class section, exam section, score earned, total score, percentage,
 *    category and attempt status (multi-section tests export one row per
 *    student per exam section, like the legacy CSV report).
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

const CATEGORY_TONES: Array<'success' | 'warning' | 'error' | 'info' | 'default'> = [
  'success', 'warning', 'error', 'info', 'default', 'default',
];

const sortCategories = (categories: PerformanceCategory[]): PerformanceCategory[] =>
  [...categories].sort((a, b) => b.minPercent - a.minPercent);

/* ─── status-category settings dialog ── */

function CategorySettingsDialog({
  open,
  onClose,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  categories: PerformanceCategory[];
  onSaved: (categories: PerformanceCategory[]) => void;
}) {
  const [rows, setRows] = useState<Array<{ label: string; minPercent: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRows(sortCategories(categories).map((category) => ({ label: category.label, minPercent: String(category.minPercent) })));
      setError(null);
    }
  }, [open, categories]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const fn = httpsCallable<
        { performanceCategories: Array<{ label: string; minPercent: number }> },
        { success: boolean; performanceCategories: PerformanceCategory[] }
      >(functions, 'saveAssessmentConfig');
      const res = await fn({
        performanceCategories: rows.map((row) => ({ label: row.label.trim(), minPercent: Number(row.minPercent) })),
      });
      onSaved(res.data.performanceCategories);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The settings could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Status categories</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Applied to every test report and Excel export in this college. A student&rsquo;s
          percentage is matched against the first category whose minimum it meets —
          list the highest range first.
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {rows.map((row, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Label"
                value={row.label}
                onChange={(event) => setRows((current) => current.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Min %"
                type="number"
                value={row.minPercent}
                onChange={(event) => setRows((current) => current.map((item, i) => (i === index ? { ...item, minPercent: event.target.value } : item)))}
                slotProps={{ htmlInput: { min: 0, max: 100, step: 1 } }}
                sx={{ width: 110 }}
              />
              <IconButton
                aria-label="Remove category"
                size="small"
                color="error"
                disabled={rows.length <= 1}
                onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Button
          size="small"
          startIcon={<Add />}
          sx={{ mt: 1.5 }}
          disabled={rows.length >= 6}
          onClick={() => setRows((current) => [...current, { label: '', minPercent: '' }])}
        >
          Add category
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save categories'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── single-test report ─── */

function TestReport({ testId, onBack }: { testId: string; onBack: () => void }) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [report, setReport] = useState<AssessmentTestReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PerformanceCategory[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Student-wise filters — the overview analytics recompute on the filtered set.
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

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

  // College-configured status categories (defaults applied server-side when
  // the college has not customised them).
  useEffect(() => {
    let active = true;
    const fn = httpsCallable<
      { collegeId?: string },
      { performanceCategories: PerformanceCategory[] }
    >(functions, 'getAssessmentConfig');
    fn({ collegeId }).then((res) => { if (active) setCategories(res.data.performanceCategories); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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
  const sortedCategories = sortCategories(categories);
  const categoryFor = (percentage: number | null | undefined): { label: string; tone: (typeof CATEGORY_TONES)[number] } | null => {
    if (percentage === null || percentage === undefined || !Number.isFinite(percentage)) return null;
    const index = sortedCategories.findIndex((category) => percentage >= category.minPercent);
    if (index === -1) return null;
    return { label: sortedCategories[index].label, tone: CATEGORY_TONES[index] || 'default' };
  };
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.trim().toLowerCase();
    const matchSearch = !q || s.studentName.toLowerCase().includes(q) || String(s.regNo || '').toLowerCase().includes(q);
    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'awaiting'
          ? s.status === 'submitted' && s.needsManualGrading
          : s.status === statusFilter;
    const label = categoryFor(s.percentage)?.label || '';
    const matchCategory =
      categoryFilter === 'all' ? true : categoryFilter === 'none' ? !label : label === categoryFilter;
    const matchSection = sectionFilter === 'all' || String(s.section || '') === sectionFilter;
    return matchSearch && matchStatus && matchCategory && matchSection;
  });

  // Overview analytics over the filtered cohort (identical to the server
  // summary semantics, recomputed so filters change the numbers).
  const viewStats = (() => {
    const rows = filteredStudents;
    const percentages = rows
      .map((s) => s.percentage)
      .filter((p): p is number => p !== null && p !== undefined && Number.isFinite(p));
    return {
      submitted: rows.filter((s) => s.status === 'submitted' || s.status === 'graded').length,
      graded: rows.filter((s) => s.status === 'graded').length,
      pendingManual: rows.filter((s) => s.status === 'submitted' && s.needsManualGrading).length,
      inProgress: rows.filter((s) => s.status === 'in_progress').length,
      notStarted: rows.filter((s) => s.status === 'not_started').length,
      late: rows.filter((s) => s.isLateSubmission).length,
      autoSubmitted: rows.filter((s) => s.autoSubmitted).length,
      avgPercentage: percentages.length
        ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10
        : null,
      maxPercentage: percentages.length ? Math.max(...percentages) : null,
      minPercentage: percentages.length ? Math.min(...percentages) : null,
    };
  })();

  // Performance spread — how the filtered cohort lands across the college's
  // configured status categories.
  const spread = sortedCategories.map((category, index) => {
    const upper = index === 0 ? Infinity : sortedCategories[index - 1].minPercent;
    const count = filteredStudents.filter((s) => {
      const p = s.percentage;
      return p !== null && p !== undefined && Number.isFinite(p) && p >= category.minPercent && p < upper;
    }).length;
    return { label: category.label, count, tone: CATEGORY_TONES[index] || 'default' as const };
  });

  const canEditCategories = ['superadmin', 'admin', 'principal', 'hod'].includes(user?.role || '');

  const attemptLabel = (status: string, needsManualGrading: boolean): string => {
    if (status === 'graded') return 'Graded';
    if (status === 'in_progress') return 'In progress';
    if (status === 'submitted') return needsManualGrading ? 'Awaiting grading' : 'Submitted';
    return 'Not started';
  };

  const exportExcel = () => {
    setExporting(true);
    try {
      const rows: Array<Record<string, string | number>> = [];
      let serial = 0;
      for (const s of filteredStudents) {
        const category = categoryFor(s.percentage)?.label || '';
        const base: Record<string, string | number> = {
          'Student Name': s.studentName,
          'Roll No': s.regNo || '',
          'Course': s.branch || '',
          'Class Section': s.section || '',
          'Semester': s.semester || '',
          'Total Score': s.totalMarks,
          'Percentage': s.percentage === null ? '' : `${s.percentage}%`,
          'Status': category,
          'Attempt': attemptLabel(s.status, s.needsManualGrading),
        };
        const sections = s.sectionScores && s.sectionScores.length > 0 ? s.sectionScores : null;
        if (sections) {
          // Multi-section test: one row per student per exam section,
          // mirroring the legacy per-section CSV report.
          for (const section of sections) {
            serial += 1;
            rows.push({
              'S.No': serial,
              ...base,
              'Exam Section': section.sectionName,
              'Score Earned': `${section.score} / ${section.max}`,
            });
          }
        } else {
          serial += 1;
          const score = s.marksObtained !== null
            ? s.marksObtained
            : s.status === 'submitted' && s.autoScore !== null
              ? `${s.autoScore} auto (manual pending)`
              : '';
          rows.push({
            'S.No': serial,
            ...base,
            'Exam Section': test.sections && test.sections.length === 1 ? test.sections[0].name : '—',
            'Score Earned': score,
          });
        }
      }
      const header = ['S.No', 'Student Name', 'Roll No', 'Course', 'Class Section', 'Semester', 'Exam Section', 'Score Earned', 'Total Score', 'Percentage', 'Status', 'Attempt'];
      const ws = XLSX.utils.json_to_sheet(rows, { header });
      ws['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 13 }, { wch: 10 }, { wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 18 }];

      const summaryRows: Array<Array<string | number>> = [
        ['Test', test.title],
        ['Subject', test.subject],
        ['Faculty', test.facultyName || ''],
        ['Branch', test.branch || ''],
        ['Batch', test.batch || ''],
        ['Window', `${fmtDateTime(test.startDateTime)} – ${fmtDateTime(test.endDateTime)}`],
        ['Total marks', test.totalMarks],
        ['Questions', test.totalQuestions],
        [],
        ['Rows in export', filteredStudents.length],
        ['Started', test.totalStarted || ''],
        ['Submitted', viewStats.submitted],
        ['Graded', viewStats.graded],
        ['Awaiting grading', viewStats.pendingManual],
        ['Average %', viewStats.avgPercentage === null ? '' : `${viewStats.avgPercentage}%`],
        ['Highest %', viewStats.maxPercentage === null ? '' : `${viewStats.maxPercentage}%`],
        ['Lowest %', viewStats.minPercentage === null ? '' : `${viewStats.minPercentage}%`],
        [],
        ['Status categories', '(percentage must be at least)'],
        ...sortedCategories.map((category) => [category.label, `>= ${category.minPercent}%`]),
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary['!cols'] = [{ wch: 22 }, { wch: 56 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'Results');
      XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary');
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `${(test.title || 'test-report').replace(/[^\w\- ]+/g, '').trim()}_${date}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
        {stat('Submitted', `${viewStats.submitted} / ${test.totalStarted || viewStats.submitted || '—'}`, 'of students who started')}
        {stat('Graded', viewStats.graded)}
        {stat('Awaiting grading', viewStats.pendingManual, 'manual marks due')}
        {stat('In progress', viewStats.inProgress)}
        {stat('Not started', viewStats.notStarted)}
        {stat('Average', viewStats.avgPercentage === null ? '—' : `${viewStats.avgPercentage}%`)}
        {stat('Highest', viewStats.maxPercentage === null ? '—' : `${viewStats.maxPercentage}%`)}
        {stat('Lowest', viewStats.minPercentage === null ? '—' : `${viewStats.minPercentage}%`)}
        {stat('Late', viewStats.late, 'with penalty')}
        {stat('Auto-submitted', viewStats.autoSubmitted, 'time/tab limit')}
      </Box>
      {filteredStudents.length !== students.length && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Showing {filteredStudents.length} of {students.length} students — the numbers above follow the filters below.
        </Typography>
      )}

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Performance spread</Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {spread.map((band) => (
              <Box key={band.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body2" sx={{ minWidth: 180 }}>{band.label}</Typography>
                <Box sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: 'action.hover', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width: `${filteredStudents.length ? (band.count / filteredStudents.length) * 100 : 0}%`,
                      height: '100%',
                      bgcolor:
                        band.tone === 'success' ? 'success.main'
                        : band.tone === 'warning' ? 'warning.main'
                        : band.tone === 'error' ? 'error.main'
                        : 'info.main',
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ minWidth: 32, textAlign: 'right', fontWeight: 600 }}>{band.count}</Typography>
              </Box>
            ))}
            {spread.length === 0 && (
              <Typography variant="body2" color="text.secondary">No status categories configured.</Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mr: 1 }}>Filters</Typography>
          <TextField
            size="small"
            label="Search student / reg no"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            sx={{ minWidth: 210 }}
          />
          <TextField size="small" select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="graded">Graded</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="awaiting">Awaiting grading</MenuItem>
            <MenuItem value="in_progress">In progress</MenuItem>
            <MenuItem value="not_started">Not started</MenuItem>
          </TextField>
          <TextField size="small" select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="all">All categories</MenuItem>
            {sortedCategories.map((c) => (
              <MenuItem key={c.label} value={c.label}>{c.label} (≥ {c.minPercent}%)</MenuItem>
            ))}
            <MenuItem value="none">No category</MenuItem>
          </TextField>
          <TextField size="small" select label="Section" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} sx={{ minWidth: 140 }}>
            <MenuItem value="all">All sections</MenuItem>
            {[...new Set(students.map((s) => s.section).filter(Boolean))].map((sec) => (
              <MenuItem key={sec} value={sec}>{sec}</MenuItem>
            ))}
          </TextField>
          <Button
            size="small"
            onClick={() => { setStudentSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setSectionFilter('all'); }}
          >
            Clear
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownload />}
          disabled={students.length === 0 || exporting}
          onClick={exportExcel}
        >
          {exporting ? 'Preparing…' : 'Download Excel report'}
        </Button>
        {canEditCategories && (
          <Button variant="outlined" size="small" startIcon={<Tune />} onClick={() => setCategoryDialogOpen(true)}>
            Status categories
          </Button>
        )}
      </Box>

      {summary.pendingManual > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {summary.pendingManual} submission{summary.pendingManual > 1 ? 's' : ''} awaiting manual grading — the scheduling faculty (or an admin) can complete it in the manual grading flow.
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Student results ({filteredStudents.length}{filteredStudents.length !== students.length ? ` of ${students.length}` : ''})
          </Typography>
          {students.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No student attempts recorded for this test yet.
            </Typography>
          ) : filteredStudents.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No students match the current filters.
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
                    <TableCell>Category</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell align="right">Time</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map((s) => {
                    const category = categoryFor(s.percentage);
                    return (
                      <TableRow key={s.studentId} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600 }}>{s.studentName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.regNo}{s.branch ? ` · ${s.branch}` : ''}{s.semester ? ` · Sem ${s.semester}` : ''}{s.batch ? ` · Batch ${s.batch}` : ''}{s.section ? ` · Sec ${s.section}` : ''}
                          </Typography>
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
                        <TableCell>
                          {category ? <Chip size="small" color={category.tone} label={category.label} /> : '—'}
                        </TableCell>
                        <TableCell>{s.grade || '—'}</TableCell>
                        <TableCell align="right">{s.status === 'in_progress' ? '—' : fmtDuration(s.timeSpent)}</TableCell>
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
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <CategorySettingsDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        categories={categories}
        onSaved={setCategories}
      />
    </Box>
  );
}

/* ─── list + report entry ─── */

export default function AssessmentTestReports({
  showScheduleHint = false,
  defaultDrill = false,
  listTitle = 'My tests',
}: {
  showScheduleHint?: boolean;
  defaultDrill?: boolean;
  listTitle?: string;
}) {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const { tests, loading, error, refresh, publish, cancel } = useScheduledTests(collegeId);
  const [reportTestId, setReportTestId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  // Drill-down: programmes (side by side) → semesters → assessments → report.
  const [drillMode, setDrillMode] = useState(defaultDrill);
  const [drillPath, setDrillPath] = useState<
    { level: 'programmes' } | { level: 'semesters'; branch: string } | { level: 'assessments'; branch: string; semester: number }
  >({ level: 'programmes' });
  const [listSearch, setListSearch] = useState('');
  // Subject name/code → semester, joined from the curriculum mappings.
  const [subjectSemesters, setSubjectSemesters] = useState<Map<string, number>>(new Map());

  // Keep phase chips (upcoming → in progress → completed) current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Subject → semester from the college's curriculum mappings.
  useEffect(() => {
    if (!collegeId) return;
    let cancelled = false;
    getDocs(query(collection(db, 'curriculumFacultyMappings'), where('collegeId', '==', collegeId), limit(500)))
      .then((snap) => {
        if (cancelled) return;
        const map = new Map<string, number>();
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const sem = Number(data.semester) || 0;
          [data.courseName, data.courseCode].forEach((value) => {
            const key = String(value || '').trim().toLowerCase();
            if (key && !map.has(key)) map.set(key, sem);
          });
        });
        setSubjectSemesters(map);
      })
      .catch(() => setSubjectSemesters(new Map()));
    return () => {
      cancelled = true;
    };
  }, [collegeId]);

  const visibleTests = useMemo(
    () =>
      tests.filter((test) => {
        const q = listSearch.trim().toLowerCase();
        return (
          !q ||
          [test.title, test.subject, test.facultyName].some((v) => String(v || '').toLowerCase().includes(q))
        );
      }),
    [tests, listSearch]
  );

  // Programme → semester → the tests of that semester.
  const drillTree = useMemo(() => {
    const semFor = (test: ScheduledTest): number => {
      const key = String(test.subject || '').trim().toLowerCase();
      if (!key) return 0;
      if (subjectSemesters.has(key)) return subjectSemesters.get(key) ?? 0;
      for (const [name, sem] of subjectSemesters) {
        if (name && key && (name.includes(key) || key.includes(name))) return sem;
      }
      return 0;
    };
    const byBranch = new Map<string, ScheduledTest[]>();
    visibleTests.forEach((test) => {
      const key = test.branch || 'All programmes';
      const rows = byBranch.get(key) || [];
      rows.push(test);
      byBranch.set(key, rows);
    });
    return [...byBranch.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([branch, rows]) => {
        const bySemester = new Map<number, ScheduledTest[]>();
        rows.forEach((test) => {
          const sem = semFor(test);
          const list = bySemester.get(sem) || [];
          list.push(test);
          bySemester.set(sem, list);
        });
        const semesters = [...bySemester.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([semester, semTests]) => ({
            semester,
            tests: semTests.slice().sort((a, b) => toMs(b.startDateTime) - toMs(a.startDateTime)),
            subjects: [...new Set(semTests.map((test) => test.subject).filter(Boolean))],
          }));
        return {
          branch,
          tests: rows,
          semesters,
          completed: rows.filter((test) => derivePhase(test, now) === 'completed').length,
        };
      });
  }, [visibleTests, subjectSemesters, now]);

  if (reportTestId) {
    return <TestReport testId={reportTestId} onBack={() => setReportTestId(null)} />;
  }

  const renderTestCard = (test: ScheduledTest) => {
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
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {listTitle} ({visibleTests.length}{visibleTests.length !== tests.length ? ` of ${tests.length}` : ''})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Search tests"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setDrillMode(!drillMode);
              setDrillPath({ level: 'programmes' });
            }}
          >
            {drillMode ? 'Flat list' : 'Drill-down'}
          </Button>
          <Button variant="outlined" size="small" onClick={() => { void refresh(); }}>Refresh</Button>
        </Box>
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
      {!loading && tests.length > 0 && visibleTests.length === 0 && (
        <Alert severity="info">No tests match the current search.</Alert>
      )}

      {drillMode && visibleTests.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
            <Button
              size="small"
              onClick={() => setDrillPath({ level: 'programmes' })}
              sx={{ color: drillPath.level === 'programmes' ? 'primary.main' : 'text.secondary', fontWeight: drillPath.level === 'programmes' ? 700 : 400 }}
            >
              All programmes
            </Button>
            {drillPath.level !== 'programmes' && (
              <>
                <Typography color="text.secondary">›</Typography>
                <Button
                  size="small"
                  onClick={() => setDrillPath({ level: 'semesters', branch: drillPath.branch })}
                  sx={{ color: drillPath.level === 'semesters' ? 'primary.main' : 'text.secondary', fontWeight: drillPath.level === 'semesters' ? 700 : 400 }}
                >
                  {drillPath.branch}
                </Button>
              </>
            )}
            {drillPath.level === 'assessments' && (
              <>
                <Typography color="text.secondary">›</Typography>
                <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {drillPath.semester === 0 ? 'Unassigned semester' : `Semester ${drillPath.semester}`}
                </Typography>
              </>
            )}
          </Box>

          {drillPath.level === 'programmes' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {drillTree.map((programme) => (
                <Card
                  key={programme.branch}
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                  onClick={() => setDrillPath({ level: 'semesters', branch: programme.branch })}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700 }}>{programme.branch}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {programme.tests.length} assessments · {programme.completed} completed
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                      {programme.semesters.map((sem) => (
                        <Chip
                          key={sem.semester}
                          size="small"
                          label={sem.semester === 0 ? `Unassigned · ${sem.tests.length}` : `Sem ${sem.semester} · ${sem.tests.length}`}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {drillPath.level === 'semesters' && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {(drillTree.find((p) => p.branch === drillPath.branch)?.semesters || []).map((sem) => (
                <Card
                  key={sem.semester}
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                  onClick={() => setDrillPath({ level: 'assessments', branch: drillPath.branch, semester: sem.semester })}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700 }}>
                      {sem.semester === 0 ? 'Unassigned semester' : `Semester ${sem.semester}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {sem.tests.length} assessments · {sem.subjects.length} subjects
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sem.subjects.slice(0, 3).join(', ')}{sem.subjects.length > 3 ? ' …' : ''}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {drillPath.level === 'assessments' && (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {((drillTree.find((p) => p.branch === drillPath.branch)?.semesters || []).find((sem) => sem.semester === drillPath.semester)?.tests || []).map((test) =>
                renderTestCard(test)
              )}
            </Box>
          )}
        </Box>
      )}

      {!drillMode && visibleTests.length > 0 && (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {visibleTests.map((test) => renderTestCard(test))}
        </Box>
      )}
    </Box>
  );
}
