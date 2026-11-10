// src/modules/admin/pages/CurriculumProgress.tsx
// ─── Slice 2 S2.4 — the Lesson-Planner-plus view ───────────────────────────
//
// Replaces the coverage numbers admins used to see in Journey, which were a
// static `faculty.topicsCovered` field, a hardcoded `classesThisWeek: 0` and an
// `avgAttendance` default of 85 (audit finding F4). Everything on this page is
// computed by the getCurriculumProgress callable from the topic ledger, the
// delivered sessions and the curriculum mapping.
//
// Plan ↔ actual ↔ coverage: what the timetable promised, what was actually
// delivered, and how much of the syllabus that covers.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { useAuth } from '../../auth/context/AuthContext'
import {
  getCurriculumProgress,
  defaultTermWindow,
  type CurriculumProgressResult,
  type FacultyProgress,
} from '../api/classSessionApi'
import DrillDown, { type DrillLevelSpec } from '@/shared/components/DrillDown'

// ─── Presentation helpers ──────────────────────────────────────────────────

function pctColor(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 85) return 'success'
  if (pct >= 60) return 'warning'
  return 'error'
}

/** Colour the number, not just the bar, so the gauge is legible at a glance. */
function pctText(pct: number): string {
  if (pct >= 85) return '#15803d'
  if (pct >= 60) return '#b45309'
  return '#b91c1c'
}

function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <Box sx={{ minWidth: 140 }}>
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

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CurriculumProgress() {
  const { user } = useAuth()
  const collegeId = (user as { collegeId?: string } | null)?.collegeId || ''
  const isHod = String((user as { role?: string } | null)?.role || '') === 'hod'

  const [window, setWindow] = useState(() => defaultTermWindow())
  const [facultyFilter, setFacultyFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [data, setData] = useState<CurriculumProgressResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCurriculumProgress({
        from: window.from,
        to: window.to,
        ...(facultyFilter ? { facultyId: facultyFilter } : {}),
        ...(batchFilter ? { batch: batchFilter } : {}),
      })
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Curriculum progress could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [window.from, window.to, facultyFilter, batchFilter])

  useEffect(() => {
    void load()
  }, [load])

  // Faculty and batch pickers are fed by what came back, so the page needs no
  // extra collections and an HOD sees only their own cohort options.
  const facultyOptions = useMemo(
    () => (data?.faculty || []).filter((row) => row.facultyId),
    [data]
  )
  const batchOptions = useMemo(() => {
    const batches = new Set<string>()
    ;(data?.faculty || []).forEach((row) => row.courses.forEach((course) => {
      if (course.batch) batches.add(course.batch)
    }))
    return [...batches].sort()
  }, [data])

  const rows: FacultyProgress[] = data?.faculty || []

  // Flatten faculty × course into the drill's items: one row per assigned
  // course, carrying its teaching faculty's progress numbers (labelled as
  // faculty-level on the row so the two are never confused).
  type CourseRow = {
    key: string
    facultyName: string
    course: FacultyProgress['courses'][number]
    progress: FacultyProgress
  }
  const courseRows: CourseRow[] = useMemo(
    () =>
      rows.flatMap((row) =>
        row.courses.map((course, index) => ({
          key: `${row.facultyId}-${course.curriculumId}-${index}`,
          facultyName: row.facultyName || row.facultyId,
          course,
          progress: row,
        }))
      ),
    [rows]
  )

  const drillLevels: Array<DrillLevelSpec<CourseRow>> = [
    {
      title: 'Programme',
      group: (items) => {
        const byBranch = new Map<string, CourseRow[]>();
        items.forEach((item) => {
          const key = item.course.branch || 'Unassigned';
          const list = byBranch.get(key) || [];
          list.push(item);
          byBranch.set(key, list);
        });
        return [...byBranch.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([branch, list]) => ({
            label: branch,
            subLabel: `${new Set(list.map((i) => i.facultyName)).size} faculty`,
            chips: [...new Set(list.map((i) => (i.course.semester ? `Sem ${i.course.semester}` : 'Unassigned')))]
              .sort()
              .slice(0, 4),
            items: list,
          }));
      },
    },
    {
      title: 'Semester',
      group: (items) => {
        const bySemester = new Map<number, CourseRow[]>();
        items.forEach((item) => {
          const key = item.course.semester || 0;
          const list = bySemester.get(key) || [];
          list.push(item);
          bySemester.set(key, list);
        });
        return [...bySemester.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([semester, list]) => ({
            label: semester ? `Semester ${semester}` : 'Unassigned semester',
            subLabel: `${new Set(list.map((i) => i.course.courseName || i.course.courseCode)).size} subjects`,
            items: list,
          }));
      },
    },
    {
      title: 'Subject',
      group: (items) => {
        const bySubject = new Map<string, CourseRow[]>();
        items.forEach((item) => {
          const key = `${item.course.courseName || 'Subject'}||${item.course.courseCode || ''}`;
          const list = bySubject.get(key) || [];
          list.push(item);
          bySubject.set(key, list);
        });
        return [...bySubject.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, list]) => {
            const [subject, code] = key.split('||');
            return {
              label: code ? `${subject} (${code})` : subject,
              subLabel: [...new Set(list.map((i) => i.facultyName))].join(', '),
              items: list,
            };
          });
      },
    },
  ]

  const totals = data?.totals

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Curriculum Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Syllabus coverage, delivered hours and pace — computed from the topic ledger and
            completed class sessions, not typed in.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </Box>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
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
            <TextField
              select
              label="Faculty"
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All faculty</MenuItem>
              {facultyOptions.map((row) => (
                <MenuItem key={row.facultyId} value={row.facultyId}>
                  {row.facultyName || row.facultyId}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Batch"
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">All batches</MenuItem>
              {batchOptions.map((batch) => (
                <MenuItem key={batch} value={batch}>
                  {batch}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {isHod && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Showing your department. Narrow by faculty or batch to focus on one cohort.
            </Typography>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* College-wide totals */}
      {totals && (
        <>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <StatCard
              label="Syllabus covered"
              value={`${totals.topics.covered} / ${totals.topics.total}`}
              hint={`${totals.topics.pct}% of topics taught`}
            />
            <StatCard
              label="Hours delivered"
              value={`${totals.hoursDelivered} / ${totals.hoursPlanned}`}
              hint={`${totals.hoursPct}% of planned contact hours · ~${totals.classesNeeded} classes of 50 min`}
            />
            <StatCard
              label="Classes delivered"
              value={`${totals.pace.completed} / ${totals.pace.expected}`}
              hint={`${totals.pace.pct}% of the timetable's plan over ${totals.pace.weeksElapsed} week(s)`}
            />
            <StatCard
              label="Average attendance"
              value={totals.attendance.marked ? `${totals.attendance.pct}%` : '—'}
              hint={totals.attendance.marked ? `${totals.attendance.present} of ${totals.attendance.marked} marked present` : 'No attendance marked yet'}
            />
            <StatCard
              label="Sessions"
              value={String(totals.sessions.total)}
              hint={`${totals.sessions.completed} completed · ${totals.sessions.scheduled} scheduled · ${totals.sessions.cancelled} cancelled`}
            />
          </Box>

          {/* Per-module rollup */}
          {totals.modules.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Coverage by module
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Each class is one 50-minute period. Topics are ticked off across classes as they are
                  taught — one class never covers a whole module. “≈ classes” is the module’s planned
                  hours converted into periods (hours × 60 ÷ 50, rounded up).
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {totals.modules.map((module) => (
                    <Bar
                      key={module.moduleNo || module.moduleName}
                      value={module.pct}
                      label={`${module.moduleName} (${module.covered}/${module.total}${
                        module.classesNeeded > 0 ? ` · ${module.hours}h ≈ ${module.classesNeeded} classes` : ''
                      })`}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Drill: programme → semester → subject → the assigned course rows */}
      <Card variant="outlined">
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            By programme &amp; semester
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {courseRows.length} course assignment(s) across {rows.length} faculty member(s)
            {data?.facultyCount === 0 && ' — assign curriculum to faculty to see coverage here'}.
            Progress bars are the teaching faculty's overall numbers across their courses.
          </Typography>
          {loading && <LinearProgress sx={{ mb: 2 }} />}
          <DrillDown
            items={courseRows}
            levels={drillLevels}
            itemKey={(item) => item.key}
            itemUnit="courses"
            searchPlaceholder="Search course / faculty"
            searchText={(item) => `${item.course.courseName} ${item.course.courseCode} ${item.facultyName}`}
            emptyState={
              <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                {loading ? 'Loading…' : 'No curriculum progress data for this range yet.'}
              </Typography>
            }
            renderItem={(item) => (
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {item.course.courseName || item.course.courseCode || 'Course'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.course.courseCode}
                      {item.course.batch ? ` · Batch ${item.course.batch}` : ''}
                      {item.course.credits ? ` · ${item.course.credits} cr` : ''}
                      {item.course.totalHours ? ` · ${item.course.totalHours}h` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Taught by {item.facultyName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: '1 1 340px' }}>
                    <Bar value={item.progress.topics.pct} label={`Topics ${item.progress.topics.covered}/${item.progress.topics.total}`} />
                    <Bar value={item.progress.hoursPct} label={`Hours ${item.progress.hoursDelivered}h/${item.progress.hoursPlanned}h`} />
                    <Bar value={item.progress.pace.pct} label={`Pace ${item.progress.pace.completed}/${item.progress.pace.expected}`} />
                    <Box sx={{ minWidth: 110 }}>
                      <Typography variant="caption" color="text.secondary">Attendance</Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        {item.progress.attendance.marked ? `${item.progress.attendance.pct}%` : '—'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          />
        </CardContent>
      </Card>

      {data?.generatedAt && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          Computed {new Date(data.generatedAt).toLocaleString()}
          {collegeId ? ` · college ${collegeId}` : ''}
        </Typography>
      )}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
