// ═══════════════════════════════════════════════════════════════════════
// pages/AdminCurriculum.tsx — College Admin: Curriculum Mapping & Scheduling
// MUI v5 — matches AdminClassSchedule.tsx patterns
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Snackbar,
  Divider,
  Stack,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AutoAwesome as AIIcon,
  Sync as SyncIcon,
} from '@mui/icons-material'
import { useAuth } from '../../auth/context/AuthContext'
import { useCurriculumMapping } from '../hooks/useCurriculumMapping'
import AutoMapDialog from '../components/AutoMapDialog'
import type { CurriculumDoc, ParsedCourse } from '../../../shared/types/curriculum'

// ─── Tabs ──────────────────────────────────────────────────────────────
type AdminTab = 'curriculum' | 'mappings' | 'schedule'

// ─── Empty Form State ──────────────────────────────────────────────────
interface MappingFormData {
  curriculumId: string;
  courseId: string;
  facultyId: string;
  batch: string;
  division: string;
  section: string;
}

const EMPTY_FORM: MappingFormData = {
  curriculumId: '',
  courseId: '',
  facultyId: '',
  batch: '',
  division: '',
  section: '',
}

// ─── Component ─────────────────────────────────────────────────────────

const AdminCurriculum: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const collegeId = user?.collegeId || ''

  const {
    curriculumList,
    mappings,
    facultyList,
    stats,
    loading,
    error,
    selectedCurriculum,
    setSelectedCurriculum,
    selectedBranch,
    setSelectedBranch,
    selectedSemester,
    setSelectedSemester,
    selectedBatch,
    setSelectedBatch,
    assignFaculty,
    updateFacultyAssignment,
    removeMapping,
    refresh,
    refreshCurriculum,
    getUnmappedCourses,
    getCurriculumMappings,
    getFacultySubjects,
    branches,
    semesters,
    batches,
  } = useCurriculumMapping(collegeId)

  const [activeTab, setActiveTab] = useState<AdminTab>('curriculum')
  const [openMappingDialog, setOpenMappingDialog] = useState(false)
  const [editingMapping, setEditingMapping] = useState<string | null>(null)
  const [formData, setFormData] = useState<MappingFormData>({ ...EMPTY_FORM })
  // Curriculum whose courses are being auto-mapped (preview → approve flow).
  const [autoMapFor, setAutoMapFor] = useState<CurriculumDoc | null>(null)
  // True while the "Sync Semesters" bulk rewrite is running.
  const [syncing, setSyncing] = useState(false)
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false, message: '', severity: 'success',
  })

  // ─── Derived Data ────────────────────────────────────────────────────
  const selectedCurriculumData = useMemo(() =>
    curriculumList.find(c => c.id === selectedCurriculum),
  [curriculumList, selectedCurriculum])

  const unmappedCourses = useMemo(() =>
    selectedCurriculumData ? getUnmappedCourses(selectedCurriculumData) : [],
  [selectedCurriculumData, getUnmappedCourses])

  const editingMappingData = useMemo(() =>
    editingMapping ? mappings.find(m => m.id === editingMapping) : undefined,
  [editingMapping, mappings])

  const curriculumMappings = useMemo(() =>
    selectedCurriculumData ? getCurriculumMappings(selectedCurriculumData.id) : [],
  [selectedCurriculumData, getCurriculumMappings])

  // ─── Subject-guided faculty options ──────────────────────────────────
  // Faculty are NOT pinned to a branch/batch — one person may teach across
  // years and branches. So we don't filter by branch; we sort/suggest by the
  // subjects each faculty listed, matching the schedule form's behaviour.
  const selectedCourseName = useMemo(() => {
    if (!formData.courseId) return ''
    const curriculum = curriculumList.find(c => c.id === formData.curriculumId)
    const course = curriculum?.courses.find(c => c.id === formData.courseId)
    return course?.name || ''
  }, [formData.courseId, formData.curriculumId, curriculumList])

  const facultyOptions = useMemo(() => {
    const q = selectedCourseName.trim().toLowerCase()
    return facultyList
      .map(f => {
        const subjects = getFacultySubjects(f.id)
        const matches = q.length > 0 && subjects.some(s => s.toLowerCase() === q)
        return { ...f, subjects, matches }
      })
      .sort((a, b) => {
        if (a.matches !== b.matches) return a.matches ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [facultyList, getFacultySubjects, selectedCourseName])

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleOpenMapping = (curriculum: CurriculumDoc, course?: ParsedCourse) => {
    setEditingMapping(null)
    setFormData({
      ...EMPTY_FORM,
      curriculumId: curriculum.id,
      courseId: course?.id || '',
      batch: selectedBatch !== 'all' ? selectedBatch : '',
      division: '',
      section: '',
    })
    setOpenMappingDialog(true)
  }

  const handleEditMapping = (mapping: typeof mappings[0]) => {
    setEditingMapping(mapping.id)
    setFormData({
      curriculumId: mapping.curriculumId,
      courseId: mapping.courseId,
      facultyId: mapping.facultyId,
      batch: mapping.batch,
      division: mapping.division || '',
      section: mapping.section || '',
    })
    setOpenMappingDialog(true)
  }

  const handleCloseMapping = () => {
    setOpenMappingDialog(false)
    setEditingMapping(null)
    setFormData({ ...EMPTY_FORM })
  }

  const handleSubmitMapping = async () => {
    if (!formData.curriculumId || !formData.courseId || !formData.facultyId || !formData.batch) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' })
      return
    }

    const curriculum = curriculumList.find(c => c.id === formData.curriculumId)
    const course = curriculum?.courses.find(c => c.id === formData.courseId)
    const faculty = facultyList.find(f => f.id === formData.facultyId)

    if (!faculty) {
      setSnackbar({ open: true, message: 'Please select a faculty member', severity: 'error' })
      return
    }

    if (editingMapping) {
      // An edit keeps the mapping's curriculum/course and only changes who
      // teaches it (and batch/division/section), so it must not depend on the
      // curriculum list having loaded.
      const result = await updateFacultyAssignment(editingMapping, {
        // Same rule as create: the Auth uid is the canonical faculty key, so
        // an edit cannot silently re-key the mapping back to the profile doc
        // id the faculty app cannot match.
        facultyId: faculty.uid || faculty.id,
        facultyName: faculty.name,
        facultyEmail: faculty.email || null,
        batch: formData.batch,
        division: formData.division || null,
        section: formData.section || null,
      })
      if (result) {
        setSnackbar({ open: true, message: 'Assignment updated successfully', severity: 'success' })
        handleCloseMapping()
      } else {
        setSnackbar({ open: true, message: error || 'Failed to update', severity: 'error' })
      }
    } else {
      if (!curriculum || !course) {
        setSnackbar({ open: true, message: 'Please select a curriculum and course', severity: 'error' })
        return
      }
      const result = await assignFaculty(
        curriculum,
        course,
        faculty,
        formData.batch,
        formData.division || undefined,
        formData.section || undefined,
        user?.name || user?.email || 'Admin'
      )
      if (result) {
        setSnackbar({ open: true, message: 'Faculty assigned successfully', severity: 'success' })
        handleCloseMapping()
      } else {
        setSnackbar({ open: true, message: error || 'Failed to assign', severity: 'error' })
      }
    }
  }

  const handleDeleteMapping = async (mappingId: string) => {
    if (window.confirm('Are you sure you want to remove this faculty assignment?')) {
      const success = await removeMapping(mappingId)
      if (success) {
        setSnackbar({ open: true, message: 'Assignment removed', severity: 'success' })
      } else {
        setSnackbar({ open: true, message: error || 'Failed to remove', severity: 'error' })
      }
    }
  }

  /**
   * Rewrite every mapping on the selected curriculum so it carries the
   * semester of the course it points at, rather than the curriculum's own
   * (primary) semester.
   *
   * A parsed curriculum can bundle courses from more than one semester — the
   * doc's `semester` is only the one the syllabus header named — but mappings
   * were historically written with that header value. Downstream surfaces
   * (student "my curriculum", faculty filtering, timetable prefill) read
   * `mapping.semester`, so they file a 5th-semester elective under semester 6
   * and it never shows up for the students who actually take it.
   */
  const handleSyncSemesters = async () => {
    if (!selectedCurriculumData) return

    const semesterByCourse = new Map(
      selectedCurriculumData.courses.map(c => [c.id, c.semester])
    )

    const stale = curriculumMappings.filter(m => {
      const courseSemester = semesterByCourse.get(m.courseId)
      return courseSemester !== undefined && courseSemester !== m.semester
    })

    if (stale.length === 0) {
      setSnackbar({
        open: true,
        message: 'Semesters are already in sync with each course.',
        severity: 'info',
      })
      return
    }

    const preview = stale
      .slice(0, 5)
      .map(m => `${m.courseCode}: Sem ${m.semester} → Sem ${semesterByCourse.get(m.courseId)}`)
      .join('\n')
    const overflow = stale.length > 5 ? `\n…and ${stale.length - 5} more` : ''

    if (!window.confirm(
      `${stale.length} mapping${stale.length === 1 ? '' : 's'} will be moved to their course's own semester:\n\n${preview}${overflow}\n\nContinue?`
    )) return

    setSyncing(true)
    let updated = 0
    try {
      for (const mapping of stale) {
        // `stale` is a snapshot taken before the loop, so the re-renders that
        // each update triggers cannot make us skip or re-visit an entry.
        const result = await updateFacultyAssignment(mapping.id, {
          semester: semesterByCourse.get(mapping.courseId)!,
        })
        if (result) updated += 1
      }
    } finally {
      setSyncing(false)
    }

    if (updated === stale.length) {
      setSnackbar({
        open: true,
        message: `${updated} mapping${updated === 1 ? '' : 's'} synced to their course semester.`,
        severity: 'success',
      })
    } else if (updated > 0) {
      setSnackbar({
        open: true,
        message: `Synced ${updated} of ${stale.length} — ${stale.length - updated} failed. ${error || ''}`.trim(),
        severity: 'warning',
      })
    } else {
      setSnackbar({ open: true, message: error || 'Failed to sync semesters', severity: 'error' })
    }
  }

  const handleScheduleClass = (mapping: typeof mappings[0]) => {
    navigate('/admin/class-schedule', {
      state: {
        prefill: {
          subject: mapping.courseName,
          subjectCode: mapping.courseCode,
          facultyId: mapping.facultyId,
          branch: mapping.branch,
          batch: mapping.batch,
          semester: mapping.semester,
          division: mapping.division || '',
          section: mapping.section || '',
        }
      }
    })
  }

  // ─── Loading State ───────────────────────────────────────────────────
  if (loading && curriculumList.length === 0) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>Loading curriculum centre…</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 1 }}>Fetching curriculum list, mappings & faculty.</Typography>
        </Box>
      </Box>
    )
  }

  // ─── Error State ─────────────────────────────────────────────────────
  if (error && curriculumList.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Could not load curriculum data</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 2 }}>Reload page</Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon sx={{ color: 'primary.main' }} /> Curriculum & Mappings
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Map faculty to syllabus, auto-suggest, then schedule classes.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={refreshCurriculum}>Refresh</Button>
          <Button variant="contained" startIcon={<AIIcon />} onClick={() => setAutoMapFor(selectedCurriculumData!)} disabled={!selectedCurriculumData}>Auto-Map</Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Curriculum" icon={<SchoolIcon />} />
        <Tab label="Mappings" icon={<BookIcon />} />
        <Tab label="Class Schedule" icon={<ScheduleIcon />} />
      </Tabs>

      {/* ────────────────────── Curriculum Tab ────────────────────── */}
      {activeTab === 'curriculum' && (
        <Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="branch-label">Branch</InputLabel>
              <Select
                labelId="branch-label"
                value={selectedBranch}
                label="Branch"
                onChange={e => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="all">All branches</MenuItem>
                {branches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="semester-label">Semester</InputLabel>
              <Select
                labelId="semester-label"
                value={selectedSemester}
                label="Semester"
                onChange={e => setSelectedSemester(e.target.value)}
              >
                <MenuItem value="all">All semesters</MenuItem>
                {semesters.map(s => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="batch-label">Batch</InputLabel>
              <Select
                labelId="batch-label"
                value={selectedBatch}
                label="Batch"
                onChange={e => setSelectedBatch(e.target.value)}
              >
                <MenuItem value="all">All batches</MenuItem>
                {batches.map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedCurriculumData ? `${selectedCurriculumData.branch} · Semester ${selectedCurriculumData.semester} · ${selectedCurriculumData.scheme}` : 'Select a curriculum'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {selectedCurriculumData?.courses.map(course => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                    <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{course.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {course.code} · Sem {course.semester} · {course.credits} credits
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />}
                          onClick={() => handleOpenMapping(selectedCurriculumData!, course)}
                          disabled={!selectedCurriculumData}
                        >Assign Faculty</Button>
                        <Button size="small" variant="outlined" startIcon={<ScheduleIcon />}
                          onClick={() => handleScheduleClass({ ...course, curriculumId: selectedCurriculumData!.id } as any)}
                          disabled={!selectedCurriculumData}
                        >Schedule Class</Button>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
                {selectedCurriculumData?.courses.length === 0 && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>No courses in this curriculum.</Typography>
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" sx={{ mb: 2 }}>All Curricula</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Branch</TableCell>
                <TableCell>Semester</TableCell>
                <TableCell>Scheme</TableCell>
                <TableCell>Courses</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {curriculumList.map(c => (
                <TableRow key={c.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>{c.branch}</TableCell>
                  <TableCell>Semester {c.semester}</TableCell>
                  <TableCell>{c.scheme}</TableCell>
                  <TableCell>{c.courses.length}</TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text" onClick={() => setSelectedCurriculum(c.id)}>
                      <EditIcon fontSize="small" /> Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ────────────────────── Mappings Tab ────────────────────── */}
      {activeTab === 'mappings' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6">
              Faculty Assignments {selectedCurriculumData && ` — ${selectedCurriculumData.branch} · Sem ${selectedCurriculumData.semester}`}
            </Typography>
            <Tooltip title="Rewrite each mapping's semester to match the course it points at, instead of the curriculum's semester">
              <span>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SyncIcon />}
                  onClick={handleSyncSemesters}
                  disabled={!selectedCurriculumData || syncing}
                >
                  {syncing ? 'Syncing…' : 'Sync Semesters'}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {curriculumMappings.length === 0 ? (
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>No faculty assigned to this curriculum yet.</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenMapping(selectedCurriculumData!)} sx={{ mt: 2 }} disabled={!selectedCurriculumData}>
                Add First Mapping
              </Button>
            </Paper>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Subject</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {curriculumMappings.map(m => (
                  <TableRow key={m.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.courseName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{m.courseCode}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{m.facultyName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={
                        m.semester === selectedCurriculumData?.semester
                          ? "Matches the curriculum's semester"
                          : `Course is taught in semester ${m.semester}`
                      }>
                        <Chip
                          size="small"
                          label={`Sem ${m.semester}`}
                          color={m.semester === selectedCurriculumData?.semester ? 'default' : 'warning'}
                          variant={m.semester === selectedCurriculumData?.semester ? 'outlined' : 'filled'}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>{m.batch}</TableCell>
                    <TableCell>{m.division || '-'}</TableCell>
                    <TableCell>{m.section || '-'}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditMapping(m)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Schedule class">
                        <IconButton size="small" onClick={() => handleScheduleClass(m)}>
                          <ScheduleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDeleteMapping(m.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleOpenMapping(selectedCurriculumData!)} disabled={!selectedCurriculumData}>
              Add New Mapping
            </Button>
          </Box>
        </Box>
      )}

      {/* ────────────────────── Class Schedule Tab ────────────────────── */}
      {activeTab === 'schedule' && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Schedule a Class {selectedCurriculumData && ` — ${selectedCurriculumData.branch} · Sem ${selectedCurriculumData.semester}`}
          </Typography>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Select a mapping from the <strong>Mappings</strong> tab, then click the <ScheduleIcon fontSize="small" color="action" /> icon to prefill and jump to the Class Schedule page.
            </Typography>
            {curriculumMappings.map(m => (
              <Button key={m.id} variant="outlined" startIcon={<ScheduleIcon />} onClick={() => handleScheduleClass(m)} sx={{ mr: 1, mb: 1 }}>
                {m.courseName} ({m.batch} · Div {m.division || '–'})
              </Button>
            ))}
            {curriculumMappings.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No mappings yet. Go to the Mappings tab to assign faculty first.</Typography>
            )}
          </Paper>
        </Box>
      )}

      {/* ────────────────────── Mapping Dialog ────────────────────── */}
      <Dialog open={openMappingDialog} onClose={handleCloseMapping} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMapping ? 'Edit Faculty Assignment' : 'Assign Faculty'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <FormControl fullWidth>
              <InputLabel id="curriculum-label">Curriculum</InputLabel>
              <Select labelId="curriculum-label" value={formData.curriculumId} label="Curriculum" onChange={e => setFormData(prev => ({ ...prev, curriculumId: e.target.value }))} disabled={!!editingMapping}>
                {curriculumList.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.branch} · Sem {c.semester}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="course-label">Course</InputLabel>
              <Select labelId="course-label" value={formData.courseId} label="Course" onChange={e => setFormData(prev => ({ ...prev, courseId: e.target.value }))} disabled={!!editingMapping}>
                {selectedCurriculumData?.courses.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="faculty-label">Faculty</InputLabel>
              <Select labelId="faculty-label" value={formData.facultyId} label="Faculty" onChange={e => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}>
                {facultyOptions.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name} {f.matches && <Chip label="match" size="small" variant="outlined" sx={{ ml: 1 }} />}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField size="small" fullWidth label="Batch" value={formData.batch} onChange={e => setFormData(prev => ({ ...prev, batch: e.target.value }))} />
              <TextField size="small" fullWidth label="Division" value={formData.division} onChange={e => setFormData(prev => ({ ...prev, division: e.target.value }))} />
              <TextField size="small" fullWidth label="Section" value={formData.section} onChange={e => setFormData(prev => ({ ...prev, section: e.target.value }))} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMapping}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitMapping}>{editingMapping ? 'Update' : 'Assign'}</Button>
        </DialogActions>
      </Dialog>

      {/* ────────────────────── Auto-Map Dialog ────────────────────── */}
      {autoMapFor && (
        <AutoMapDialog
          curriculum={autoMapFor}
          knownBatches={batches}
          onClose={() => setAutoMapFor(null)}
          onApplied={(created) => {
            refresh()
            setSnackbar({
              open: true,
              message: created > 0
                ? `${created} course${created === 1 ? '' : 's'} auto-mapped — review them in Faculty Mappings`
                : 'No new mappings were applied',
              severity: created > 0 ? 'success' : 'info',
            })
          }}
        />
      )}

      {/* ────────────────────── Snackbar ────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AdminCurriculum
