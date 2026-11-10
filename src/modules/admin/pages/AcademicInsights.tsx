// src/modules/admin/pages/AcademicInsights.tsx
// ─── Academic Insights — overview → semester → subject → student ──────────
//
// The principal's "Academics" surface used to offer workflow queues only
// (curriculum approvals, timetable, inbox) with no answer to "what is
// assigned to whom, how many classes happened, how much of the syllabus is
// covered, what is the attendance, how are the students doing". This page is
// the dig-deeper view the portal was missing:
//
//   Level 1  semesters           — rollup cards
//   Level 2  subjects (all)      — assigned faculty, classes, coverage,
//                                  attendance, assessments, average score
//   Level 3  one subject         — attendance, completion, assignments,
//                                  scores/marks/quizzes
//   Level 4  individual students — ranked rows with their own marks
//
// All numbers come from the getAcademicInsights callable (computed from the
// topic ledger, sessions, attendance and submissions — never hand-typed).

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Link,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material'
import {
  getAcademicInsights,
  type AcademicInsightsResult,
  type AssessmentInsight,
  type AssessmentRollup,
  type SemesterInsight,
  type StudentInsightRow,
  type SubjectDrill,
  type SubjectInsight,
} from '../api/academicInsightsApi'
import { defaultTermWindow } from '../api/classSessionApi'
import { useAuth } from '../../auth/context/AuthContext'

// ─── Presentation helpers ──────────────────────────────────────────────────

function pctColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 85) return 'success'
  if (pct >= 60) return 'warning'
  return 'error'
}

function pctText(pct: number): string {
  if (pct >= 85) return '#15803d'
  if (pct >= 60) return '#b45309'
  return '#b91c1c'
}

function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <Box sx={{ minWidth: 120 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {label || 'Progress'}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600, color: pctText(value) }}>
          {value}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.max(0, Math.min(100, value))}
        color={pctColor(value)}
        sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
      />
    </Box>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card variant="outlined" sx={{ flex: '1 1 180px' }}>
      <CardContent sx={{ py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

const BUCKET_LABEL: Record<AssessmentInsight['bucket'], string> = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  exam: 'Exam / IA',
  other: 'Other',
}

function bucketChip(bucket: AssessmentInsight['bucket']): React.ReactElement {
  const color =
    bucket === 'quiz' ? 'info' : bucket === 'assignment' ? 'primary' : bucket === 'exam' ? 'warning' : 'default'
  return <Chip size="small" variant="outlined" color={color} label={BUCKET_LABEL[bucket]} sx={{ height: 22 }} />
}

function assessmentCounts(rollup: AssessmentRollup): string {
  const parts: string[] = []
  if (rollup.byType.quiz) parts.push(`${rollup.byType.quiz} quiz`)
  if (rollup.byType.assignment) parts.push(`${rollup.byType.assignment} assignment`)
  if (rollup.byType.exam) parts.push(`${rollup.byType.exam} exam/IA`)
  if (rollup.byType.other) parts.push(`${rollup.byType.other} other`)
  return parts.join(' · ') || '—'
}

// ─── Page ──────────────────────────────────────────────────────────────────

type View =
  | { level: 'overview' }
  | { level: 'semester'; semester: number }
  | {
      level: 'subject'
      curriculumId: string
      /** Exact course identity — a curriculum doc holds many courses. */
      courseId: string
      courseCode: string
      courseName: string
      semester: number
      facultyId: string
      batch: string
    }

export default function AcademicInsights() {
  const { user } = useAuth()
  const role = String((user as { role?: string } | null)?.role || '')
  const isSelfService = role === 'faculty' || role === 'mentor'
  const isDepartmentScoped = role === 'hod' || role === 'admin'
  const scopeLine = isSelfService
    ? 'Your programme — the subjects you teach, from syllabus coverage and attendance down to your individual students’ scores.'
    : isDepartmentScoped
      ? 'Your department’s teaching — dig from the semester overview down to one subject and its individual students, all computed.'
      : 'Dig from the semester overview down to one subject and its individual students — assigned curriculum, classes delivered, syllabus coverage, attendance and scores, all computed.'
  const [window, setWindow] = useState(() => defaultTermWindow())
  const [view, setView] = useState<View>({ level: 'overview' })
  const [data, setData] = useState<AcademicInsightsResult | null>(null)
  const [drill, setDrill] = useState<SubjectDrill | null>(null)
  const [loading, setLoading] = useState(false)
  const [drillLoading, setDrillLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subjectTab, setSubjectTab] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAcademicInsights({ from: window.from, to: window.to })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Academic insights could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [window.from, window.to])

  useEffect(() => {
    void load()
  }, [load])

  // Level 3/4 — one subject, down to the individual students.
  useEffect(() => {
    if (view.level !== 'subject') {
      setDrill(null)
      return
    }
    let cancelled = false
    setDrillLoading(true)
    setDrill(null)
    setSubjectTab(0)
    ;(async () => {
      try {
        const result = await getAcademicInsights({
          curriculumId: view.curriculumId,
          courseId: view.courseId,
          courseCode: view.courseCode,
          facultyId: view.facultyId,
          batch: view.batch,
          from: window.from,
          to: window.to,
        })
        if (!cancelled) setDrill(result.subject || null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Subject insights could not be loaded.')
        }
      } finally {
        if (!cancelled) setDrillLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [view, window.from, window.to])

  const semesters = useMemo(() => data?.semesters || [], [data])
  const activeSemester = useMemo(
    () => (view.level === 'overview' ? null : semesters.find((row) => row.semester === view.semester) || null),
    [semesters, view]
  )

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Academic Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {scopeLine}
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="From"
            type="date"
            value={window.from}
            onChange={(event) => setWindow((prev) => ({ ...prev, from: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
          />
          <TextField
            label="To"
            type="date"
            value={window.to}
            onChange={(event) => setWindow((prev) => ({ ...prev, to: event.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            size="small"
          />
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </Stack>
      </Box>

      {/* Breadcrumb drill path */}
      <Breadcrumbs separator={<ChevronRightIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button"
          underline="hover"
          color={view.level === 'overview' ? 'text.primary' : 'inherit'}
          onClick={() => setView({ level: 'overview' })}
          sx={{ fontWeight: view.level === 'overview' ? 600 : 400 }}
        >
          All semesters
        </Link>
        {view.level !== 'overview' && (
          <Link
            component="button"
            underline="hover"
            color={view.level === 'semester' ? 'text.primary' : 'inherit'}
            onClick={() => setView({ level: 'semester', semester: view.semester })}
            sx={{ fontWeight: view.level === 'semester' ? 600 : 400 }}
          >
            {view.semester > 0 ? `Semester ${view.semester}` : 'Unassigned semester'}
          </Link>
        )}
        {view.level === 'subject' && (
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            {view.courseName}
          </Typography>
        )}
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* College-wide totals — the "how are we doing" strip */}
      {data && view.level !== 'subject' && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <StatCard
            label="Syllabus covered"
            value={`${data.totals.topics.covered} / ${data.totals.topics.total} topics`}
            hint={`${data.totals.topics.pct}% complete across ${data.totals.subjectCount} subjects`}
          />
          <StatCard
            label="Classes delivered"
            value={`${data.totals.sessions.completed} / ${data.totals.sessions.total}`}
            hint={`${data.totals.sessions.scheduled} scheduled · ${data.totals.sessions.cancelled} cancelled · ${data.totals.hoursDelivered}h of ${data.totals.hoursPlanned}h`}
          />
          <StatCard
            label="Attendance"
            value={data.totals.attendance.marked ? `${data.totals.attendance.pct}%` : '—'}
            hint={
              data.totals.attendance.marked
                ? `${data.totals.attendance.present} of ${data.totals.attendance.marked} marked present`
                : 'No attendance marked yet'
            }
          />
          <StatCard
            label="Assessments & scores"
            value={data.totals.assessments.graded ? `${data.totals.assessments.avgPct}% avg` : '—'}
            hint={`${data.totals.assessments.total} assessments · ${data.totals.assessments.graded} graded submissions`}
          />
        </Box>
      )}

      {/* ─── Level 1: semesters ─── */}
      {view.level === 'overview' && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {semesters.length === 0 && !loading && (
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {isSelfService
                    ? 'No subjects are mapped to you yet. Once the office assigns curriculum to you, your programme insights appear here.'
                    : 'No curriculum has been mapped to faculty yet. Assign curriculum under Academics → Curriculum Mapping, then insights appear here.'}
                </Typography>
              </CardContent>
            </Card>
          )}
          {semesters.map((semester) => (
            <Card
              key={semester.semester}
              variant="outlined"
              sx={{ flex: '1 1 300px', cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
              onClick={() => setView({ level: 'semester', semester: semester.semester })}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon color="action" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {semester.label}
                    </Typography>
                  </Box>
                  <Chip size="small" label={`${semester.subjectCount} subjects`} />
                </Box>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Bar value={semester.topics.pct} label={`Syllabus ${semester.topics.covered}/${semester.topics.total}`} />
                  <Bar
                    value={semester.attendance.pct}
                    label={semester.attendance.marked ? 'Attendance' : 'Attendance (none)'}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                  {semester.sessions.completed} of {semester.sessions.total} classes delivered ·{' '}
                  {semester.assessments.total} assessments
                  {semester.assessments.graded ? ` · ${semester.assessments.avgPct}% avg score` : ''}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* ─── Level 2: subjects of one semester ─── */}
      {view.level === 'semester' && activeSemester && (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {activeSemester.label} — all subjects
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Assigned curriculum, delivered classes, syllabus progress, attendance and scores.
                Click a subject to drill into its modules, assessments and students.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Bar value={activeSemester.topics.pct} label={`Syllabus ${activeSemester.topics.covered}/${activeSemester.topics.total}`} />
                <Bar value={activeSemester.attendance.pct} label="Attendance" />
                <Bar value={activeSemester.hoursPct} label={`Hours ${activeSemester.hoursDelivered}/${activeSemester.hoursPlanned}`} />
              </Box>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned to</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Classes</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Syllabus completion</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assessments</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Avg score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeSemester.subjects.map((subject) => (
                  <TableRow
                    key={`${subject.curriculumId}-${subject.courseCode}-${subject.batch}`}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() =>
                      setView({
                        level: 'subject',
                        curriculumId: subject.curriculumId,
                        courseId: subject.courseId,
                        courseCode: subject.courseCode,
                        courseName: subject.courseName || subject.courseCode || 'Subject',
                        semester: subject.semester,
                        facultyId: subject.facultyId,
                        batch: subject.batch,
                      })
                    }
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                        {subject.courseName || subject.courseCode || 'Subject'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subject.courseCode}
                        {subject.batch ? ` · Batch ${subject.batch}` : ''}
                        {subject.branch ? ` · ${subject.branch}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{subject.facultyName || subject.facultyId || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>
                        {subject.sessions.completed} done · {subject.sessions.scheduled} scheduled
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {subject.hoursDelivered}h of {subject.hoursPlanned}h
                        {subject.pace.expected > 0 ? ` · pace ${subject.pace.pct}%` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`${subject.topics.pending} topic(s) still pending`}>
                        <Box>
                          <Bar value={subject.topics.pct} label={`${subject.topics.covered}/${subject.topics.total} topics`} />
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: pctText(subject.attendance.pct), fontWeight: 600 }}>
                        {subject.attendance.marked ? `${subject.attendance.pct}%` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{subject.assessments.total || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assessmentCounts(subject.assessments)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                        {subject.assessments.graded ? `${subject.assessments.avgPct}%` : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ─── Level 3/4: one subject ─── */}
      {view.level === 'subject' && (
        <>
          {drillLoading && <LinearProgress sx={{ mb: 2 }} />}
          {drill && (
            <>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <StatCard
                  label="Syllabus completion"
                  value={`${drill.subject.topics.pct}%`}
                  hint={`${drill.subject.topics.covered} of ${drill.subject.topics.total} topics covered`}
                />
                <StatCard
                  label="Classes & hours"
                  value={`${drill.subject.sessions.completed} delivered`}
                  hint={`${drill.subject.sessions.scheduled} scheduled · ${drill.subject.hoursDelivered}h of ${drill.subject.hoursPlanned}h`}
                />
                <StatCard
                  label="Attendance"
                  value={drill.subject.attendance.marked ? `${drill.subject.attendance.pct}%` : '—'}
                  hint={
                    drill.subject.attendance.marked
                      ? `${drill.subject.attendance.present} of ${drill.subject.attendance.marked} present`
                      : 'No attendance marked yet'
                  }
                />
                <StatCard
                  label="Average score"
                  value={drill.subject.assessments.graded ? `${drill.subject.assessments.avgPct}%` : '—'}
                  hint={`${drill.assessmentDetail.length} assessments · ${drill.students.length} students`}
                />
              </Box>

              <Card variant="outlined">
                <CardContent sx={{ p: 0 }}>
                  <Tabs
                    value={subjectTab}
                    onChange={(_, value: number) => setSubjectTab(value)}
                    sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Coverage" />
                    <Tab icon={<CalendarIcon fontSize="small" />} iconPosition="start" label="Attendance & classes" />
                    <Tab icon={<AssignmentIcon fontSize="small" />} iconPosition="start" label="Assignments & scores" />
                    <Tab icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" label="Individual students" />
                  </Tabs>

                  {/* Coverage */}
                  {subjectTab === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Module-wise syllabus completion
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Planned classes are derived from the syllabus hours; the classes actually
                        delivered are listed under “Attendance &amp; classes”.
                      </Typography>
                      {drill.subject.modules.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No modules recorded for this subject yet.
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {drill.subject.modules.map((module) => (
                          <Bar
                            key={module.moduleNo || module.moduleName}
                            value={module.pct}
                            label={`${module.moduleName} (${module.covered}/${module.total}${
                              module.classesNeeded > 0 ? ` · ${module.hours}h ≈ ${module.classesNeeded} planned classes` : ''
                            })`}
                          />
                        ))}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                        Assigned to {drill.subject.facultyName || drill.subject.facultyId || '—'}
                        {drill.subject.credits ? ` · ${drill.subject.credits} credits` : ''}
                        {drill.subject.pace.expected > 0
                          ? ` · pace: ${drill.subject.pace.completed} of ${drill.subject.pace.expected} planned classes delivered (${drill.subject.pace.pct}%)`
                          : ''}
                      </Typography>
                    </Box>
                  )}

                  {/* Attendance & classes */}
                  {subjectTab === 1 && (
                    <Box sx={{ p: 0 }}>
                      {drill.attendanceTrend.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                          No classes recorded for this subject in the selected window.
                        </Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Topic taken</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {drill.attendanceTrend.map((point, index) => (
                              <TableRow key={`${point.date}-${point.startTime}-${index}`} hover>
                                <TableCell sx={{ fontSize: 13 }}>{point.date}</TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{point.startTime || '—'}</TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{point.topic || '—'}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    color={
                                      point.status === 'completed'
                                        ? 'success'
                                        : point.status === 'cancelled'
                                          ? 'error'
                                          : 'default'
                                    }
                                    label={point.status || 'scheduled'}
                                    sx={{ height: 22 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13 }}>
                                    {point.marked ? `${point.present}/${point.marked} · ${point.pct}%` : 'Not marked'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  )}

                  {/* Assignments & scores */}
                  {subjectTab === 2 && (
                    <Box sx={{ p: 0 }}>
                      {drill.assessmentDetail.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                          No assessments created for this subject yet.
                        </Typography>
                      ) : (
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Assessment</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Submissions</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Average</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Highest</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Lowest</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {drill.assessmentDetail.map((assessment) => (
                              <TableRow key={assessment.id} hover>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{assessment.title}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {assessment.scheduledDate || 'No date'}
                                    {assessment.totalMarks ? ` · out of ${assessment.totalMarks}` : ''}
                                  </Typography>
                                </TableCell>
                                <TableCell>{bucketChip(assessment.bucket)}</TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    variant="outlined"
                                    color={assessment.status === 'published' || assessment.status === 'completed' ? 'success' : 'default'}
                                    label={assessment.status || 'draft'}
                                    sx={{ height: 22 }}
                                  />
                                </TableCell>
                                <TableCell sx={{ fontSize: 13 }}>
                                  {assessment.submissions} submitted · {assessment.graded} graded
                                </TableCell>
                                <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                                  {assessment.graded ? `${assessment.avgPct}%` : '—'}
                                  {assessment.graded ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {assessment.avgMarks} marks
                                    </Typography>
                                  ) : null}
                                </TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{assessment.graded ? assessment.highest : '—'}</TableCell>
                                <TableCell sx={{ fontSize: 13 }}>{assessment.graded ? assessment.lowest : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  )}

                  {/* Individual students (level 4) */}
                  {subjectTab === 3 && (
                    <Box sx={{ p: 0 }}>
                      {drill.students.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                          No students found for this cohort yet.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: 'auto' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Attendance</TableCell>
                                {drill.assessmentDetail.map((assessment) => (
                                  <TableCell key={assessment.id} sx={{ fontWeight: 600 }}>
                                    <Tooltip title={assessment.title}>
                                      <span>{assessment.title.length > 14 ? `${assessment.title.slice(0, 13)}…` : assessment.title}</span>
                                    </Tooltip>
                                  </TableCell>
                                ))}
                                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Average</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {drill.students.map((student, index) => (
                                <StudentRow key={student.studentId || index} student={student} rank={index + 1} assessments={drill.assessmentDetail} />
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

function StudentRow({
  student,
  rank,
  assessments,
}: {
  student: StudentInsightRow
  rank: number
  assessments: AssessmentInsight[]
}) {
  return (
    <TableRow hover>
      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>{rank}</TableCell>
      <TableCell>
        <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{student.name || 'Unnamed student'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {student.regNo || '—'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: pctText(student.attendance.pct) }}>
          {student.attendance.marked ? `${student.attendance.pct}%` : '—'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {student.attendance.marked ? `${student.attendance.present}/${student.attendance.marked}` : 'none'}
        </Typography>
      </TableCell>
      {assessments.map((assessment) => {
        const submission = student.submissions.find((row) => row.assessmentId === assessment.id)
        return (
          <TableCell key={assessment.id} sx={{ fontSize: 13 }}>
            {submission ? (
              submission.status === 'graded' ? (
                <Typography sx={{ fontWeight: 600 }}>
                  {submission.marksObtained}
                  <Typography component="span" variant="caption" color="text.secondary">
                    /{submission.totalMarks}
                  </Typography>
                </Typography>
              ) : (
                <Chip size="small" variant="outlined" label={submission.status || 'submitted'} sx={{ height: 20 }} />
              )
            ) : (
              <Typography variant="caption" color="text.secondary">
                —
              </Typography>
            )}
          </TableCell>
        )
      })}
      <TableCell sx={{ fontSize: 13 }}>
        {student.totals.max > 0 ? `${student.totals.obtained}/${student.totals.max}` : '—'}
      </TableCell>
      <TableCell>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: student.avgPct !== null ? pctText(student.avgPct) : 'text.secondary' }}>
          {student.avgPct !== null ? `${student.avgPct}%` : '—'}
        </Typography>
      </TableCell>
    </TableRow>
  )
}
