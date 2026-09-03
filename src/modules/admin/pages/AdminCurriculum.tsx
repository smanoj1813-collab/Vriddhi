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
  Card,
  CardContent,
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
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Book as BookIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material'
import { useAuth } from '../../auth/context/AuthContext'
import { useCurriculumMapping } from '../hooks/useCurriculumMapping'
import type { CurriculumDoc, ParsedCourse, FacultyOption } from '../../../shared/types/curriculum'

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
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  // ─── Derived Data ────────────────────────────────────────────────────
  const selectedCurriculumData = useMemo(() =>
    curriculumList.find(c => c.id === selectedCurriculum),
  [curriculumList, selectedCurriculum])

  const unmappedCourses = useMemo(() =>
    selectedCurriculumData ? getUnmappedCourses(selectedCurriculumData) : [],
  [selectedCurriculumData, getUnmappedCourses])

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

    if (!curriculum || !course || !faculty) {
      setSnackbar({ open: true, message: 'Invalid selection', severity: 'error' })
      return
    }

    if (editingMapping) {
      const result = await updateFacultyAssignment(editingMapping, {
        facultyId: faculty.id,
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
          <LinearProgress sx={{ width: 200, mb: 2 }} />
          <Typography color="text.secondary">Loading curriculum data...</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Curriculum Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Map curriculum courses to faculty and manage class schedules
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { refreshCurriculum(); refresh(); }}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Card variant="outlined" sx={{ flex: '1 1 180px', minWidth: 160 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Curriculum</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                {curriculumList.length}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: '1 1 180px', minWidth: 160 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Active Mappings</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'success.main' }}>
                {stats.activeMappings}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: '1 1 180px', minWidth: 160 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Faculty Assigned</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'primary.main' }}>
                {stats.facultyCount}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: '1 1 180px', minWidth: 160 }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Courses Mapped</Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, color: 'info.main' }}>
                {stats.courseCount}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            value="curriculum"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookIcon fontSize="small" />
                Curriculum
                <Chip label={curriculumList.length} size="small" sx={{ height: 20, fontSize: 11 }} />
              </Box>
            }
          />
          <Tab
            value="mappings"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" />
                Faculty Mappings
                <Chip label={mappings.filter(m => m.status === 'active').length} size="small" sx={{ height: 20, fontSize: 11 }} />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* ─── TAB: CURRICULUM ─── */}
      {activeTab === 'curriculum' && (
        <Box>
          {curriculumList.length === 0 ? (
            <Card variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary" gutterBottom>
                No curriculum assigned to your college yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact your super admin to assign curriculum from the syllabus parser.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {curriculumList.map(curriculum => {
                const isExpanded = expandedCurriculum === curriculum.id
                const mappedCount = curriculum.courses.filter(c =>
                  mappings.some(m => m.curriculumId === curriculum.id && m.courseId === c.id && m.status === 'active')
                ).length
                const totalCourses = curriculum.courses.length
                const progress = totalCourses > 0 ? (mappedCount / totalCourses) * 100 : 0

                return (
                  <Accordion
                    key={curriculum.id}
                    expanded={isExpanded}
                    onChange={() => setExpandedCurriculum(isExpanded ? null : curriculum.id)}
                    variant="outlined"
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          <BookIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {curriculum.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {curriculum.branch} · Semester {curriculum.semester} · {curriculum.scheme}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {mappedCount}/{totalCourses} mapped
                            </Typography>
                          </Box>
                          <Chip
                            label={`${curriculum.totalCourses} courses`}
                            size="small"
                            variant="outlined"
                            color={progress === 100 ? 'success' : 'default'}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Divider sx={{ mb: 2 }} />

                      {/* Curriculum Overview */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                        <Chip icon={<BookIcon />} label={`${curriculum.totalModules} modules`} size="small" />
                        <Chip icon={<ScheduleIcon />} label={`${curriculum.totalHours} hours`} size="small" />
                        <Chip icon={<SchoolIcon />} label={`${curriculum.totalMarks} marks`} size="small" />
                        <Chip label={`Assigned: ${new Date(curriculum.assignedAt).toLocaleDateString()}`} size="small" variant="outlined" />
                      </Box>

                      {/* Courses Table */}
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Courses
                      </Typography>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Credits</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Modules</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned Faculty</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {curriculum.courses.map(course => {
                            const mapping = mappings.find(m =>
                              m.curriculumId === curriculum.id &&
                              m.courseId === course.id &&
                              m.status === 'active'
                            )
                            return (
                              <TableRow key={course.id} hover>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                                    {course.code}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 14 }}>{course.name}</Typography>
                                  {course.shortName && (
                                    <Typography variant="caption" color="text.secondary">
                                      {course.shortName}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>{course.credits}</TableCell>
                                <TableCell>{course.totalHours}h</TableCell>
                                <TableCell>{course.modules.length}</TableCell>
                                <TableCell>
                                  {mapping ? (
                                    <Chip
                                      icon={<PersonIcon fontSize="small" />}
                                      label={mapping.facultyName}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                    />
                                  ) : (
                                    <Chip
                                      label="Not assigned"
                                      size="small"
                                      color="warning"
                                      variant="outlined"
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {mapping ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                      <Tooltip title="Edit Assignment">
                                        <IconButton size="small" onClick={() => handleEditMapping(mapping)}>
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Schedule Class">
                                        <IconButton size="small" color="primary" onClick={() => handleScheduleClass(mapping)}>
                                          <CalendarIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Remove">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteMapping(mapping.id)}>
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  ) : (
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => handleOpenMapping(curriculum, course)}
                                    >
                                      Assign Faculty
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </Stack>
          )}
        </Box>
      )}

      {/* ─── TAB: MAPPINGS ─── */}
      {activeTab === 'mappings' && (
        <Box>
          {/* Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Curriculum</InputLabel>
              <Select
                value={selectedCurriculum}
                onChange={e => setSelectedCurriculum(e.target.value)}
                label="Curriculum"
              >
                <MenuItem value="all">All Curriculum</MenuItem>
                {curriculumList.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                label="Branch"
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map(b => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value as number | 'all')}
                label="Semester"
              >
                <MenuItem value="all">All</MenuItem>
                {semesters.map(s => (
                  <MenuItem key={s} value={s}>Sem {s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Batch</InputLabel>
              <Select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                label="Batch"
              >
                <MenuItem value="all">All Batches</MenuItem>
                {batches.map(b => (
                  <MenuItem key={b} value={b}>{b}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Mappings Table */}
          <Card variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Course</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Faculty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Branch / Batch</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Division</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.filter(m => m.status === 'active').length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        No faculty mappings found. Assign faculty from the Curriculum tab.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {mappings.filter(m => m.status === 'active').map(mapping => (
                  <TableRow key={mapping.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                        {mapping.courseName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mapping.courseCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                          {mapping.facultyName.charAt(0)}
                        </Avatar>
                        <Typography sx={{ fontSize: 14 }}>{mapping.facultyName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {mapping.branch}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {mapping.batch} · Sem {mapping.semester}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {mapping.division || mapping.section ? (
                        <Chip
                          label={`${mapping.division || ''} ${mapping.section || ''}`.trim()}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>{mapping.totalHours}h</TableCell>
                    <TableCell>
                      <Chip
                        label={mapping.status}
                        size="small"
                        color={mapping.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Schedule Class">
                          <IconButton size="small" color="primary" onClick={() => handleScheduleClass(mapping)}>
                            <CalendarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEditMapping(mapping)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error" onClick={() => handleDeleteMapping(mapping.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </Box>
      )}

      {/* ─── MAPPING DIALOG ─── */}
      <Dialog open={openMappingDialog} onClose={handleCloseMapping} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingMapping ? 'Edit Faculty Assignment' : 'Assign Faculty to Course'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Curriculum (read-only when editing) */}
            <FormControl fullWidth size="small">
              <InputLabel>Curriculum *</InputLabel>
              <Select
                value={formData.curriculumId}
                onChange={e => setFormData(prev => ({ ...prev, curriculumId: e.target.value, courseId: '' }))}
                label="Curriculum *"
                disabled={!!editingMapping}
              >
                {curriculumList.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Course */}
            <FormControl fullWidth size="small">
              <InputLabel>Course *</InputLabel>
              <Select
                value={formData.courseId}
                onChange={e => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                label="Course *"
                disabled={!!editingMapping}
              >
                {editingMapping ? (
                  curriculumList
                    .find(c => c.id === formData.curriculumId)
                    ?.courses.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
                    ))
                ) : (
                  unmappedCourses.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
                  ))
                )}
                {unmappedCourses.length === 0 && !editingMapping && (
                  <MenuItem value="" disabled>All courses already mapped</MenuItem>
                )}
              </Select>
            </FormControl>

            {/* Faculty */}
            <FormControl fullWidth size="small">
              <InputLabel>Faculty *</InputLabel>
              <Select
                value={formData.facultyId}
                onChange={e => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}
                label="Faculty *"
              >
                {facultyOptions.map(f => (
                  <MenuItem key={f.id} value={f.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: 14 }}>{f.name}</Typography>
                        {f.department && (
                          <Typography variant="caption" color="text.secondary">({f.department})</Typography>
                        )}
                        {f.matches && (
                          <Chip
                            label="Teaches this subject"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11 }}
                          />
                        )}
                      </Box>
                      {f.subjects.length > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                          {f.subjects.slice(0, 6).join(' · ')}
                          {f.subjects.length > 6 ? ` +${f.subjects.length - 6} more` : ''}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.facultyId && selectedCourseName && !facultyOptions.find(f => f.id === formData.facultyId)?.matches && (
              <Typography variant="caption" color="warning.main" sx={{ mt: -1 }}>
                Selected faculty hasn't listed “{selectedCourseName}” in their subjects — double-check before assigning.
              </Typography>
            )}

            {/* Batch */}
            <TextField
              fullWidth
              size="small"
              label="Batch *"
              value={formData.batch}
              onChange={e => setFormData(prev => ({ ...prev, batch: e.target.value }))}
              placeholder="e.g. 2024-2025"
            />

            {/* Division */}
            <TextField
              fullWidth
              size="small"
              label="Division"
              value={formData.division}
              onChange={e => setFormData(prev => ({ ...prev, division: e.target.value.toUpperCase() }))}
              placeholder="A, B, C"
            />

            {/* Section */}
            <TextField
              fullWidth
              size="small"
              label="Section"
              value={formData.section}
              onChange={e => setFormData(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
              placeholder="A, B"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMapping}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitMapping}
            disabled={!formData.curriculumId || !formData.courseId || !formData.facultyId || !formData.batch}
          >
            {editingMapping ? 'Update' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default AdminCurriculum
