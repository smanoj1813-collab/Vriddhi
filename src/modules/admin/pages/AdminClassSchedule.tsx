// src/pages/AdminClassSchedule.tsx
import React, { useState, useMemo, useCallback } from 'react'
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
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material'
import { useAdminSchedule } from '../hooks/useAdminSchedule'
import type { WeeklyScheduleFormData, DayOfWeek, ClassType } from '../types/schedule'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const CLASS_TYPES: ClassType[] = ['lecture', 'lab', 'tutorial', 'seminar', 'workshop']

const EMPTY_FORM: WeeklyScheduleFormData = {
  subject: '',
  subjectCode: '',
  facultyId: '',
  branch: '',
  batch: '',
  semester: 1,
  division: '',
  section: '',
  room: '',
  dayOfWeek: 'monday',
  startTime: '09:00',
  endTime: '10:00',
  type: 'lecture',
}

// ─── Helper: Get actual date for a day of week ────────
function getDateForDayOfWeek(dayOfWeek: DayOfWeek): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = days.indexOf(dayOfWeek)
  const today = new Date()
  const currentDay = today.getDay()
  const diff = targetDay - currentDay
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + diff)
  return targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Helper: Get next occurrence date ──────────────────
function getNextOccurrence(dayOfWeek: DayOfWeek): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const targetDay = days.indexOf(dayOfWeek)
  const today = new Date()
  const currentDay = today.getDay()
  let diff = targetDay - currentDay
  if (diff < 0) diff += 7
  if (diff === 0) diff = 7 // if today, show next week
  const targetDate = new Date(today)
  targetDate.setDate(today.getDate() + diff)
  return targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ─── CSV Template ─────────────────────────────────────
const CSV_TEMPLATE = `subject,subjectCode,facultyId,facultyName,branch,batch,semester,division,section,room,dayOfWeek,startTime,endTime,type
Business Statistics,BST101,faculty_id_here,Dr. Smith,B.Com,2024,4,A,A,301,monday,09:00,10:00,lecture
Financial Accounting,FAC101,faculty_id_here,Dr. Jones,B.Com,2024,4,A,A,302,monday,10:00,11:00,lecture
Computer Applications,CAP101,faculty_id_here,Dr. Lee,BCA,2024,4,B,B,303,tuesday,09:00,10:00,lab`

const AdminClassSchedule: React.FC = () => {
  const collegeId = localStorage.getItem('vriddhi_college_id') || ''
  const {
    weeklySchedule,
    facultyList,
    subjects,
    batches,
    branches,
    divisions,
    isLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    bulkCreate,
    isCreating,
    isUpdating,
    isBulkCreating,
  } = useAdminSchedule(collegeId)

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<WeeklyScheduleFormData>({ ...EMPTY_FORM })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [csvText, setCsvText] = useState('')

  const daySchedules = weeklySchedule[selectedDay] || []

  // Get subjects for selected faculty only
  const facultySubjects = useMemo(() => {
    if (!formData.facultyId) return []
    return subjects.filter(s => s.facultyId === formData.facultyId)
  }, [formData.facultyId, subjects])

  const handleOpen = (schedule?: typeof daySchedules[0]) => {
    if (schedule) {
      setEditingId(schedule.id)
      setFormData({
        subject: schedule.subject,
        subjectCode: schedule.subjectCode,
        facultyId: schedule.facultyId,
        branch: schedule.branch,
        batch: schedule.batch,
        semester: schedule.semester,
        division: schedule.division,
        section: schedule.section || '',
        room: schedule.room,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        type: schedule.type,
      })
    } else {
      setEditingId(null)
      setFormData({ ...EMPTY_FORM, dayOfWeek: selectedDay })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
  }

  const handleSubmit = () => {
    if (!formData.subject || !formData.facultyId || !formData.branch || !formData.batch || !formData.room) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' })
      return
    }

    if (editingId) {
      updateSchedule(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            setSnackbar({ open: true, message: 'Schedule updated successfully', severity: 'success' })
            handleClose()
          },
          onError: () => {
            setSnackbar({ open: true, message: 'Failed to update schedule', severity: 'error' })
          },
        }
      )
    } else {
      createSchedule(formData, {
        onSuccess: () => {
          setSnackbar({ open: true, message: 'Schedule created successfully', severity: 'success' })
          handleClose()
        },
        onError: () => {
          setSnackbar({ open: true, message: 'Failed to create schedule', severity: 'error' })
        },
      })
    }
  }

  const handleDuplicate = (schedule: typeof daySchedules[0]) => {
    setFormData({
      subject: schedule.subject,
      subjectCode: schedule.subjectCode,
      facultyId: schedule.facultyId,
      branch: schedule.branch,
      batch: schedule.batch,
      semester: schedule.semester,
      division: schedule.division,
      section: schedule.section || '',
      room: schedule.room,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      type: schedule.type,
    })
    setEditingId(null)
    setOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      deleteSchedule(id, {
        onSuccess: () => setSnackbar({ open: true, message: 'Schedule deleted', severity: 'success' }),
        onError: () => setSnackbar({ open: true, message: 'Failed to delete', severity: 'error' }),
      })
    }
  }

  // ─── Bulk Upload ──────────────────────────────────────
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'schedule_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleParseCSV = () => {
    try {
      const lines = csvText.trim().split('\n')
      if (lines.length < 2) {
        setSnackbar({ open: true, message: 'CSV is empty or invalid', severity: 'error' })
        return
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const items: WeeklyScheduleFormData[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length < 12) continue

        const row: Record<string, string> = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })

        items.push({
          subject: row.subject,
          subjectCode: row.subjectCode,
          facultyId: row.facultyId,
          branch: row.branch,
          batch: row.batch,
          semester: Number(row.semester) || 1,
          division: row.division,
          section: row.section,
          room: row.room,
          dayOfWeek: (row.dayOfWeek as DayOfWeek) || 'monday',
          startTime: row.startTime || '09:00',
          endTime: row.endTime || '10:00',
          type: (row.type as ClassType) || 'lecture',
        })
      }

      if (items.length === 0) {
        setSnackbar({ open: true, message: 'No valid rows found in CSV', severity: 'error' })
        return
      }

      bulkCreate(items, {
        onSuccess: () => {
          setSnackbar({ open: true, message: `${items.length} schedules created successfully`, severity: 'success' })
          setBulkDialogOpen(false)
          setCsvText('')
        },
        onError: () => {
          setSnackbar({ open: true, message: 'Failed to bulk create schedules', severity: 'error' })
        },
      })
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to parse CSV', severity: 'error' })
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading schedules...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Class Schedule Manager
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage weekly recurring class schedules for all branches and batches
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setBulkDialogOpen(true)}
          >
            Bulk Upload
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
            disabled={isCreating}
          >
            Add Class
          </Button>
        </Box>
      </Box>

      {/* Day Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedDay}
          onChange={(_, v) => setSelectedDay(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {DAYS.map(day => (
            <Tab
              key={day}
              value={day}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ textTransform: 'capitalize' }}>{day}</span>
                  <Chip
                    label={weeklySchedule[day]?.length || 0}
                    size="small"
                    color={weeklySchedule[day]?.length ? 'primary' : 'default'}
                    sx={{ height: 20, fontSize: 12 }}
                  />
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Date indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <CalendarIcon fontSize="small" color="action" />
        <Typography variant="body2" color="text.secondary">
          Next {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}: <strong>{getDateForDayOfWeek(selectedDay)}</strong>
          {' '}&middot; Next occurrence: <strong>{getNextOccurrence(selectedDay)}</strong>
        </Typography>
      </Box>

      {/* Schedule Table */}
      <Card variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Faculty</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Branch / Batch</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {daySchedules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No classes scheduled for {selectedDay}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                    sx={{ mt: 1 }}
                  >
                    Add first class
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {daySchedules.map(schedule => (
              <TableRow key={schedule.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                    {schedule.startTime} - {schedule.endTime}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getNextOccurrence(schedule.dayOfWeek)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                    {schedule.subject}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {schedule.subjectCode}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: 14 }}>{schedule.facultyName}</Typography>
                    {schedule.facultyInitials && (
                      <Chip label={schedule.facultyInitials} size="small" variant="outlined" sx={{ height: 22 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 14 }}>
                    {schedule.branch} &middot; {schedule.batch}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sem {schedule.semester}
                    {schedule.division && ` · ${schedule.division}`}
                    {schedule.section && ` · ${schedule.section}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={schedule.room} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={schedule.type}
                    size="small"
                    color={schedule.type === 'lab' ? 'secondary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => handleDuplicate(schedule)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpen(schedule)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(schedule.id)}>
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

      {/* Weekly Overview Cards */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
          Weekly Overview
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {DAYS.map(day => {
            const count = weeklySchedule[day]?.length || 0
            return (
              <Card
                key={day}
                variant="outlined"
                onClick={() => setSelectedDay(day)}
                sx={{
                  flex: '1 1 140px',
                  minWidth: 140,
                  cursor: 'pointer',
                  borderColor: selectedDay === day ? 'primary.main' : 'divider',
                  bgcolor: selectedDay === day ? 'primary.light' : 'background.paper',
                  transition: 'all 0.2s',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: selectedDay === day ? 600 : 400,
                      color: selectedDay === day ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {day}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, mt: 1 }}>
                    {count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {count === 1 ? 'class' : 'classes'}
                  </Typography>
                  {count > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Next: {getNextOccurrence(day)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Class Schedule' : 'Add New Class Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            {/* Faculty */}
            <Box sx={{ flex: '1 1 250px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Faculty *</InputLabel>
                <Select
                  value={formData.facultyId}
                  onChange={e => {
                    const facultyId = e.target.value
                    setFormData(prev => ({ ...prev, facultyId, subject: '', subjectCode: '' }))
                  }}
                  label="Faculty *"
                >
                  {facultyList.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.name} {f.department && `(${f.department})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Subject */}
            <Box sx={{ flex: '1 1 250px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject *</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={e => {
                    const selected = facultySubjects.find(s => s.name === e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      subject: e.target.value,
                      subjectCode: selected?.code || '',
                    }))
                  }}
                  label="Subject *"
                  disabled={!formData.facultyId || facultySubjects.length === 0}
                >
                  {facultySubjects.length === 0 && (
                    <MenuItem value="" disabled>
                      {formData.facultyId ? 'No subjects found for this faculty' : 'Select a faculty first'}
                    </MenuItem>
                  )}
                  {facultySubjects.map(s => (
                    <MenuItem key={`${s.name}_${s.facultyId}`} value={s.name}>
                      {s.name} {s.code && `(${s.code})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Branch */}
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch *</InputLabel>
                <Select
                  value={formData.branch}
                  onChange={e => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  label="Branch *"
                >
                  {branches.map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Batch */}
            <Box sx={{ flex: '1 1 200px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Batch *</InputLabel>
                <Select
                  value={formData.batch}
                  onChange={e => setFormData(prev => ({ ...prev, batch: e.target.value }))}
                  label="Batch *"
                >
                  {batches.map(b => (
                    <MenuItem key={b} value={b}>{b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Semester */}
            <Box sx={{ flex: '1 1 120px' }}>
              <TextField
                fullWidth
                size="small"
                label="Semester *"
                type="number"
                value={formData.semester}
                onChange={e => setFormData(prev => ({ ...prev, semester: Number(e.target.value) }))}
                slotProps={{ htmlInput: { min: 1, max: 10 } }}
              />
            </Box>

            {/* Division */}
            <Box sx={{ flex: '1 1 120px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Division</InputLabel>
                <Select
                  value={formData.division}
                  onChange={e => setFormData(prev => ({ ...prev, division: e.target.value }))}
                  label="Division"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {divisions.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Section */}
            <Box sx={{ flex: '1 1 120px' }}>
              <TextField
                fullWidth
                size="small"
                label="Section"
                value={formData.section}
                onChange={e => setFormData(prev => ({ ...prev, section: e.target.value.toUpperCase() }))}
                placeholder="A, B, C"
              />
            </Box>

            {/* Day */}
            <Box sx={{ flex: '1 1 150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Day *</InputLabel>
                <Select
                  value={formData.dayOfWeek}
                  onChange={e => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value as DayOfWeek }))}
                  label="Day *"
                >
                  {DAYS.map(d => (
                    <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>
                      {d}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Start Time */}
            <Box sx={{ flex: '1 1 140px' }}>
              <TextField
                fullWidth
                size="small"
                label="Start Time *"
                type="time"
                value={formData.startTime}
                onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* End Time */}
            <Box sx={{ flex: '1 1 140px' }}>
              <TextField
                fullWidth
                size="small"
                label="End Time *"
                type="time"
                value={formData.endTime}
                onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* Room */}
            <Box sx={{ flex: '1 1 150px' }}>
              <TextField
                fullWidth
                size="small"
                label="Room *"
                value={formData.room}
                onChange={e => setFormData(prev => ({ ...prev, room: e.target.value }))}
                placeholder="e.g. 301-A"
              />
            </Box>

            {/* Type */}
            <Box sx={{ flex: '1 1 150px' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ClassType }))}
                  label="Type"
                >
                  {CLASS_TYPES.map(t => (
                    <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isCreating || isUpdating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isCreating || isUpdating || !formData.subject || !formData.facultyId || !formData.branch || !formData.batch || !formData.room}
          >
            {editingId ? (isUpdating ? 'Updating...' : 'Update') : (isCreating ? 'Creating...' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Upload Schedules</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Upload a CSV file with the following columns: subject, subjectCode, facultyId, facultyName, branch, batch, semester, division, section, room, dayOfWeek, startTime, endTime, type
            </Alert>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleDownloadTemplate}
              size="small"
            >
              Download CSV Template
            </Button>
            <TextField
              multiline
              rows={10}
              fullWidth
              label="Paste CSV content here"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={CSV_TEMPLATE}
              sx={{ fontFamily: 'monospace' }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleParseCSV}
            disabled={isBulkCreating || !csvText.trim()}
          >
            {isBulkCreating ? 'Uploading...' : 'Upload'}
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

export default AdminClassSchedule