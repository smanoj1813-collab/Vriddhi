// src/pages/AdminClassSchedule.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
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
  Checkbox,
  FormControlLabel,
  Slider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  UploadFile as UploadIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  EventBusy as EventBusyIcon,
  AutoAwesomeMotion as MaterialiseIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as AutoIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Schedule as ScheduleIcon,
  Balance as BalanceIcon,
  Coffee as BreakIcon,
} from '@mui/icons-material'
import { useAdminSchedule } from '../hooks/useAdminSchedule'
import { useAuth } from '../../auth/context/AuthContext'
import {
  generateClassSessions,
  cancelWeeklySchedule,
  defaultTermWindow,
  isValidDateKey,
  SessionConflictError,
  type GenerateSessionsResult,
  type SessionConflict,
} from '../api/classSessionApi'
import { autoGenerateTimetable, type CohortDemand } from '../api/autoTimetableApi'
import { generateWeeklyTimetable, buildTimeSlots, type BreakSlot, type SlotConfig } from '@/shared/utils/timetableGenerator'
import {
  toSchedulePdfBlob,
  triggerDownload,
  schedulePdfFilename,
  downloadScheduleAsImage,
} from '@/shared/utils/scheduleExport'
import type { WeeklyScheduleFormData, DayOfWeek, ClassType, WeeklyClassSchedule } from '../types/schedule'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const CLASS_TYPES: ClassType[] = ['lecture', 'lab', 'tutorial', 'seminar', 'workshop']
const DAY_LABELS: Record<DayOfWeek,string> = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' }

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
Business Statistics,BST101,faculty_id_here,Dr. Smith,B.Com,2026,4,A,A,301,monday,09:00,10:00,lecture
Financial Accounting,FAC101,faculty_id_here,Dr. Jones,B.Com,2026,4,A,A,302,monday,10:00,11:00,lecture
Computer Applications,CAP101,faculty_id_here,Dr. Lee,BCA,2026,4,B,B,303,tuesday,09:00,10:00,lab`

const AdminClassSchedule: React.FC = () => {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
  const location = useLocation()

  // ─── Prefill from AdminCurriculum "Schedule Class" ────────────────────
  // AdminCurriculum navigates here with state.prefill for the selected mapping.
  const prefill = useMemo(() => {
    const state = location.state as { prefill?: Partial<WeeklyScheduleFormData> } | null
    return state?.prefill ?? null
  }, [location.state])

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
  // Optional "attach an assignment" toggle — the timetable-side equivalent of
  // the faculty's curriculum link. generateClassSessions turns it into one
  // draft assignment per slot for the faculty to publish.
  const [attachAssignment, setAttachAssignment] = useState(false)
  const [assignTitle, setAssignTitle] = useState('')
  const [assignMaxScore, setAssignMaxScore] = useState(20)
  const [assignDeadline, setAssignDeadline] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning'
  }>({
    open: false,
    message: '',
    severity: 'success',
  })
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [csvText, setCsvText] = useState('')

  // ─── Slice 2: materialise weekly slots into real class sessions ────────
  // The grid above is the *plan*; classSessions are the *actual*. Until Slice 2
  // nothing connected them, so a class only existed once somebody typed it in.
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateWindow, setGenerateWindow] = useState(() => defaultTermWindow())
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateSessionsResult | null>(null)
  const [generateConflicts, setGenerateConflicts] = useState<SessionConflict[]>([])
  const [skipConflicting, setSkipConflicting] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // ─── Automatic scheduling (equal distribution + breaks) ───────────────
  const [autoOpen, setAutoOpen] = useState(false)
  const [autoStep, setAutoStep] = useState<1|2|3>(1)
  const [autoRooms, setAutoRooms] = useState('101, 102, 201, 202, Lab-1, LH-301')
  const [autoDayStart, setAutoDayStart] = useState('09:00')
  const [autoDayEnd, setAutoDayEnd] = useState('16:00')
  const [autoPeriodMins, setAutoPeriodMins] = useState(50)
  const [autoBreaks, setAutoBreaks] = useState<BreakSlot[]>([
    { start: '10:40', end: '11:00', label: 'Short Break' },
    { start: '13:00', end: '14:00', label: 'Lunch Break' },
  ])
  const [autoEqualDist, setAutoEqualDist] = useState(true)
  const [autoMaxFacultyPerDay, setAutoMaxFacultyPerDay] = useState(4)
  const [autoPeriodsPerWeek, setAutoPeriodsPerWeek] = useState(3)
  const [autoScope, setAutoScope] = useState<'all'|'filtered'>('all')
  const [autoPreview, setAutoPreview] = useState<ReturnType<typeof generateWeeklyTimetable> | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoResult, setAutoResult] = useState<{created:number;warnings:string[]}|null>(null)
  const autoPreviewRef = useRef<HTMLDivElement>(null)

  // ─── Printable refs for export (daily / weekly) ───────────────────────
  const dailyPrintRef = useRef<HTMLDivElement>(null)
  const weeklyPrintRef = useRef<HTMLDivElement>(null)

  // ─── Apply prefill from AdminCurriculum "Schedule Class" ──────────────
  useEffect(() => {
    if (!prefill || !prefill.subject) return
    setFormData({
      ...EMPTY_FORM,
      subject: prefill.subject || '',
      subjectCode: prefill.subjectCode || '',
      facultyId: prefill.facultyId || '',
      branch: prefill.branch || '',
      batch: prefill.batch || '',
      semester: prefill.semester ?? 1,
      division: prefill.division || '',
      section: prefill.section || '',
      dayOfWeek: 'monday',
      startTime: '09:00',
      endTime: '10:00',
      type: 'lecture',
      room: '',
    })
    resetAssignmentForm()
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  const daySchedules = weeklySchedule[selectedDay] || []

  // Get subjects for selected faculty only
  const facultySubjects = useMemo(() => {
    if (!formData.facultyId) return []
    return subjects.filter(s => s.facultyId === formData.facultyId)
  }, [formData.facultyId, subjects])

  const resetAssignmentForm = () => {
    setAttachAssignment(false)
    setAssignTitle('')
    setAssignMaxScore(20)
    setAssignDeadline('')
  }

  const applyAssignmentForm = (schedule?: typeof daySchedules[0]) => {
    setAttachAssignment(Boolean(schedule?.assignment))
    setAssignTitle(schedule?.assignment?.title || '')
    setAssignMaxScore(schedule?.assignment?.maxScore || 20)
    setAssignDeadline(schedule?.assignment?.deadline || '')
  }

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
      applyAssignmentForm(schedule)
    } else {
      setEditingId(null)
      setFormData({ ...EMPTY_FORM, dayOfWeek: selectedDay })
      resetAssignmentForm()
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingId(null)
    setFormData({ ...EMPTY_FORM })
    resetAssignmentForm()
  }

  const handleSubmit = () => {
    if (!formData.subject || !formData.facultyId || !formData.branch || !formData.batch || !formData.room) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' })
      return
    }

    if (attachAssignment) {
      if (!assignTitle.trim() || !assignDeadline || !(Number(assignMaxScore) > 0)) {
        setSnackbar({ open: true, message: 'Attach assignment needs a title, max score and deadline', severity: 'error' })
        return
      }
      if (assignDeadline < new Date().toISOString().slice(0, 10)) {
        setSnackbar({ open: true, message: 'The assignment deadline must be in the future', severity: 'error' })
        return
      }
    }

    // Editing a slot that previously had an attachment: unchecking the toggle
    // clears it. Creating without the toggle leaves the field out entirely.
    const assignmentPayload = attachAssignment
      ? { title: assignTitle.trim(), maxScore: Number(assignMaxScore), deadline: assignDeadline }
      : editingId ? null : undefined

    if (editingId) {
      updateSchedule(
        { id: editingId, data: { ...formData, assignment: assignmentPayload ?? null } },
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
      createSchedule(
        {
          ...formData,
          ...(assignmentPayload ? { assignment: assignmentPayload } : {}),
        },
        {
          onSuccess: () => {
            setSnackbar({ open: true, message: 'Schedule created successfully', severity: 'success' })
            handleClose()
          },
          onError: () => {
            setSnackbar({ open: true, message: 'Failed to create schedule', severity: 'error' })
          },
        }
      )
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
    // The copy starts unattached; the admin can re-enable the same config.
    applyAssignmentForm(undefined)
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

  // ─── Slice 2 S2.1: generate / cancel real class sessions ────────────────
  // Server-side callables: the college is taken from the caller's auth claim,
  // not from localStorage, and generation is idempotent so a double-click
  // cannot double-book a term.

  const handleOpenGenerate = () => {
    setGenerateWindow(defaultTermWindow())
    setGenerateResult(null)
    setGenerateConflicts([])
    setSkipConflicting(false)
    setGenerateOpen(true)
  }

  const handleGenerate = async () => {
    const { from, to } = generateWindow
    if (!isValidDateKey(from) || !isValidDateKey(to)) {
      setSnackbar({ open: true, message: 'Enter both dates as yyyy-mm-dd', severity: 'error' })
      return
    }
    if (from > to) {
      setSnackbar({ open: true, message: 'The start date must be on or before the end date', severity: 'error' })
      return
    }
    setGenerating(true)
    setGenerateResult(null)
    setGenerateConflicts([])
    try {
      const result = await generateClassSessions({ from, to, skipConflicting })
      setGenerateResult(result)
      setGenerateConflicts(result.conflicts || [])
      const skipped = result.skippedConflicts || 0
      const linked = result.assignmentsLinked || 0
      const linkedNote =
        linked > 0
          ? ` ${linked} attached assignment draft(s) were created — the faculty publishes them from Assignments.`
          : ''
      setSnackbar({
        open: true,
        severity: skipped > 0 ? 'warning' : 'success',
        message:
          result.created === 0 && skipped === 0
            ? `Already up to date — ${result.skippedExisting} session(s) existed for ${result.slotsScanned} slot(s), nothing new created.${linkedNote}`
            : skipped > 0
              ? `Created ${result.created} session(s) and skipped ${skipped} that would double-book a faculty member or a room.${linkedNote}`
              : `Created ${result.created} class session(s) from ${result.slotsScanned} weekly slot(s).${linkedNote}`,
      })
    } catch (error) {
      // S2.5: the server refuses to materialise a timetable that double-books.
      // Surface the individual clashes so the admin can fix the slot rather
      // than guess which one blocked the run.
      if (error instanceof SessionConflictError) {
        setGenerateConflicts(error.conflicts)
        setSnackbar({ open: true, severity: 'error', message: error.message })
      } else {
        setSnackbar({
          open: true,
          severity: 'error',
          message: error instanceof Error ? error.message : 'Failed to generate class sessions',
        })
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleCancelSlot = async (schedule: typeof daySchedules[0]) => {
    const confirmed = window.confirm(
      `Cancel "${schedule.subject}" (${schedule.dayOfWeek} ${schedule.startTime})?\n\n` +
        'Every unmarked session it generated from today onwards will be cancelled and the slot ' +
        'will be switched off. Past and already-marked sessions are left untouched.'
    )
    if (!confirmed) return
    setCancellingId(schedule.id)
    try {
      const result = await cancelWeeklySchedule({
        weeklyScheduleId: schedule.id,
        reason: 'Cancelled from the timetable manager',
      })
      setSnackbar({
        open: true,
        severity: 'success',
        message:
          result.cancelled === 0
            ? 'Slot switched off — no future unmarked sessions needed cancelling.'
            : `Slot switched off and ${result.cancelled} future session(s) cancelled.`,
      })
    } catch (error) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: error instanceof Error ? error.message : 'Failed to cancel the weekly schedule',
      })
    } finally {
      setCancellingId(null)
    }
  }

  // ─── Automatic scheduling helpers ─────────────────────────────────────

  const autoRoomsList = useMemo(()=> autoRooms.split(',').map(s=> s.trim()).filter(Boolean), [autoRooms])
  const autoCohortDemands: CohortDemand[] = useMemo(()=>{
    const brs = autoScope==='filtered' ? branches.slice(0,1) : branches.slice(0,4)
    const bats = autoScope==='filtered' ? batches.slice(0,1) : batches.slice(0,3)
    const divs = divisions.length ? (autoScope==='filtered'? divisions.slice(0,1): divisions.slice(0,2)) : ['A'] as string[]
    if (!brs.length || !bats.length || subjects.length===0) return []
    const demands: CohortDemand[]=[]
    for (const branch of brs) for (const batch of bats) for (const division of divs) {
      const subSlice = subjects.slice(0, 6)
      if (subSlice.length===0) continue
      demands.push({
        branch, batch, semester: 1, division,
        subjects: subSlice.map(s=> ({
          subject: s.name, subjectCode: s.code, facultyId: s.facultyId, facultyName: s.facultyName,
          periodsPerWeek: autoPeriodsPerWeek, type: 'lecture' as ClassType,
        }))
      })
    }
    return demands
  }, [branches, batches, divisions, subjects, autoPeriodsPerWeek, autoScope])

  const autoSlotConfig: SlotConfig = useMemo(()=> ({
    workingDays: ['monday','tuesday','wednesday','thursday','friday','saturday'] as DayOfWeek[],
    dayStart: autoDayStart, dayEnd: autoDayEnd, periodMinutes: autoPeriodMins, breaks: autoBreaks
  }), [autoDayStart, autoDayEnd, autoPeriodMins, autoBreaks])

  const handleAutoPreview = () => {
    if (autoCohortDemands.length===0) { setSnackbar({open:true, message:'No cohorts/subjects to schedule — add faculty + subjects first', severity:'error'}); return }
    if (autoRoomsList.length===0) { setSnackbar({open:true, message:'Add at least one room', severity:'error'}); return }
    try {
      const preview = generateWeeklyTimetable({
        cohorts: autoCohortDemands,
        slotConfig: autoSlotConfig,
        rooms: autoRoomsList,
        maxPeriodsPerDayPerFaculty: autoMaxFacultyPerDay,
        equalDistribution: autoEqualDist,
      })
      setAutoPreview(preview)
      setAutoStep(2)
    } catch (e:any){
      setSnackbar({open:true, message: e.message||'Preview failed', severity:'error'})
    }
  }

  const handleAutoConfirm = async () => {
    if (!autoPreview || autoCohortDemands.length===0) return
    setAutoGenerating(true)
    try {
      const res = await autoGenerateTimetable({
        cohorts: autoCohortDemands,
        slotConfig: autoSlotConfig,
        rooms: autoRoomsList,
        maxPeriodsPerDayPerFaculty: autoMaxFacultyPerDay,
        equalDistribution: autoEqualDist,
        dryRun: false,
        replace: false,
      })
      setAutoResult({created: res.created||0, warnings: res.warnings||[]})
      setAutoStep(3)
      setSnackbar({open:true, message:`Created ${res.created} class slots — timetable is live. Now Generate Sessions for dates.`, severity:'success'})
    } catch (e:any){
      setSnackbar({open:true, message: e.message||'Auto-generation failed', severity:'error'})
    } finally { setAutoGenerating(false) }
  }

  const handleAutoReset = () => { setAutoPreview(null); setAutoResult(null); setAutoStep(1) }

  // ─── Exports ─────────────────────────────────────────────────────────

  const exportTitle = useMemo(()=> `Class Schedule — ${user?.collegeId || collegeId || ''}`.trim(), [user, collegeId])
  const weeklySlotsForExport = useMemo(()=>{
    const all: WeeklyClassSchedule[] = []
    DAYS.forEach(d=> (weeklySchedule[d]||[]).forEach((s:any)=> all.push(s)))
    return all
  }, [weeklySchedule])

  const handleDownloadDailyPdf = async () => {
    try {
      const daily = weeklySlotsForExport.filter(s=> s.dayOfWeek?.toLowerCase()===selectedDay)
      if (daily.length===0){ setSnackbar({open:true, message:`No classes on ${DAY_LABELS[selectedDay]} to export`, severity:'warning'}); return }
      const blob = toSchedulePdfBlob({ mode:'daily', schedules: daily as any, options:{ day:selectedDay, collegeName: exportTitle, title:`Daily Schedule — ${DAY_LABELS[selectedDay]}`, subtitle:`${daySchedules.length} classes • ${getDateForDayOfWeek(selectedDay)}` } })
      const filename = schedulePdfFilename('daily',{day:selectedDay},'pdf')
      triggerDownload(blob, filename)
      setSnackbar({open:true, message:`Daily PDF downloaded — ${filename}`, severity:'success'})
    } catch(e:any){ setSnackbar({open:true, message:e.message||'PDF export failed', severity:'error'}) }
  }
  const handleDownloadWeeklyPdf = async () => {
    try {
      if (weeklySlotsForExport.length===0){ setSnackbar({open:true, message:'No timetable to export — create or auto-generate classes first', severity:'warning'}); return }
      const blob = toSchedulePdfBlob({ mode:'weekly', schedules: weeklySlotsForExport as any, options:{ collegeName: exportTitle, title:'Weekly Class Schedule', subtitle:`${weeklySlotsForExport.length} classes • Mon–Sat • Generated ${new Date().toLocaleDateString('en-IN')}` } })
      const filename = schedulePdfFilename('weekly',{},'pdf')
      triggerDownload(blob, filename)
      setSnackbar({open:true, message:`Weekly PDF downloaded — ${filename}`, severity:'success'})
    } catch(e:any){ setSnackbar({open:true, message:e.message||'PDF export failed', severity:'error'}) }
  }
  const handleDownloadDailyImage = async () => {
    const el = dailyPrintRef.current
    const daily = weeklySlotsForExport.filter(s=> s.dayOfWeek?.toLowerCase()===selectedDay)
    if (daily.length===0){ setSnackbar({open:true, message:`No classes on ${DAY_LABELS[selectedDay]} to export`, severity:'warning'}); return }
    if(!el){ setSnackbar({open:true, message:'Preview not ready — scroll to the table and try again', severity:'warning'}); return }
    try{
      const filename = schedulePdfFilename('daily',{day:selectedDay},'png')
      await downloadScheduleAsImage(el, filename)
      setSnackbar({open:true, message:`Daily image downloaded — ${filename}`, severity:'success'})
    }catch(e:any){ setSnackbar({open:true, message:e.message||'Image export failed', severity:'error'})}
  }
  const handleDownloadWeeklyImage = async () => {
    const el = weeklyPrintRef.current
    if (weeklySlotsForExport.length===0){ setSnackbar({open:true, message:'No timetable to export', severity:'warning'}); return }
    if(!el){ setSnackbar({open:true, message:'Preview not ready', severity:'warning'}); return }
    try{
      const filename = schedulePdfFilename('weekly',{},'png')
      await downloadScheduleAsImage(el, filename)
      setSnackbar({open:true, message:`Weekly image downloaded — ${filename}`, severity:'success'})
    }catch(e:any){ setSnackbar({open:true, message:e.message||'Image export failed', severity:'error'})}
  }
  const handleDownloadAutoPreviewPdf = async () => {
    if(!autoPreview) return
    const blob = toSchedulePdfBlob({ mode:'weekly', schedules: autoPreview.slots as any, options:{ collegeName: exportTitle, title:'Auto-Generated Timetable — Preview', subtitle:`${autoPreview.slots.length} classes • Equal distribution ${autoEqualDist?'ON':'OFF'}` } })
    triggerDownload(blob, schedulePdfFilename('weekly',{},'pdf'))
    setSnackbar({open:true, message:'Preview PDF downloaded', severity:'success'})
  }
  const handleDownloadAutoPreviewImage = async () => {
    const el = autoPreviewRef.current
    if(!el || !autoPreview) return
    await downloadScheduleAsImage(el, schedulePdfFilename('weekly',{},'png'))
    setSnackbar({open:true, message:'Preview image downloaded', severity:'success'})
  }

  // Grid helpers for printable preview
  const allDays = DAYS
  const slotKeysWeekly = useMemo(()=>{
    const keys = Array.from(new Set(weeklySlotsForExport.map(s=> `${s.startTime}–${s.endTime}`))).sort()
    return keys
  }, [weeklySlotsForExport])
  const weeklyCellMap = useMemo(()=>{
    const m=new Map<string, WeeklyClassSchedule>()
    weeklySlotsForExport.forEach(s=> m.set(`${s.dayOfWeek?.toLowerCase()}|${s.startTime}–${s.endTime}`, s as WeeklyClassSchedule))
    return m
  }, [weeklySlotsForExport])

  const slotKeysPreview = useMemo(()=>{
    if(!autoPreview) return [] as string[]
    return Array.from(new Set(autoPreview.slots.map(s=> `${s.startTime}–${s.endTime}`))).sort()
  }, [autoPreview])

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

  if (!collegeId) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <Typography variant="h6" color="warning.main">⚠ College ID not found</Typography>
        <Typography color="text.secondary" sx={{ textAlign: 'center', maxWidth: 480 }}>
          Your account does not have a college ID linked. Please log out and log back in,
          or contact your administrator to link your account to a college.
        </Typography>
      </Box>
    )
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
          <Typography variant="h5" sx={{ fontWeight: 500 }}>Class Schedule Manager</Typography>
          <Typography variant="body2" color="text.secondary">Manage weekly recurring class schedules — manual or ⚡ auto-generated with equal distribution</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap:'wrap' }}>
          <Button variant="contained" color="secondary" startIcon={<AutoIcon />} onClick={()=> { setAutoOpen(true); setAutoStep(1); setAutoPreview(null); setAutoResult(null) }}>
            Auto Generate
          </Button>
          <Button variant="outlined" startIcon={<MaterialiseIcon />} onClick={handleOpenGenerate}>Generate Sessions</Button>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setBulkDialogOpen(true)}>Bulk Upload</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()} disabled={isCreating}>Add Class</Button>
        </Box>
      </Box>

      {/* Scalability / Distribution explainers */}
      <Paper variant="outlined" sx={{ p:2, mb:2, bgcolor:'rgba(13,148,136,0.04)', borderColor:'rgba(13,148,136,0.25)' }}>
        <Box sx={{ display:'flex', gap:2, alignItems:'flex-start', flexWrap:'wrap' }}>
          <Box sx={{ display:'flex', gap:1, alignItems:'center' }}><BalanceIcon color="primary" fontSize="small" /><Typography variant="subtitle2" sx={{fontWeight:700}}>Equal distribution</Typography></Box>
          <Typography variant="caption" color="text.secondary" sx={{flex:'1 1 260px'}}>Auto-generation spreads each subject evenly across Mon–Sat, levels faculty load (no teacher with 6 periods Monday), respects breaks, and never double-books rooms — the same greedy + rebalance that powers the server preview.</Typography>
          <Box sx={{ display:'flex', gap:1, alignItems:'center' }}><BreakIcon color="action" fontSize="small" /><Typography variant="caption" color="text.secondary">Breaks are blocked slots — no class can cross lunch or the short break.</Typography></Box>
        </Box>
      </Paper>

      {/* Quick Exports — visible to admin/principal/HOD (page is already role-guarded) */}
      <Paper variant="outlined" sx={{ p:1.5, mb:3, display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
        <ScheduleIcon fontSize="small" color="action" />
        <Typography variant="subtitle2" sx={{fontWeight:600, mr:1}}>Downloads (admin / principal):</Typography>
        <Button size="small" variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadDailyPdf}>Daily PDF ({DAY_LABELS[selectedDay]})</Button>
        <Button size="small" variant="outlined" startIcon={<ImageIcon />} onClick={handleDownloadDailyImage}>Daily Image</Button>
        <Divider orientation="vertical" flexItem sx={{mx:0.5}}/>
        <Button size="small" variant="outlined" color="secondary" startIcon={<PdfIcon />} onClick={handleDownloadWeeklyPdf}>Weekly PDF</Button>
        <Button size="small" variant="outlined" color="secondary" startIcon={<ImageIcon />} onClick={handleDownloadWeeklyImage}>Weekly Image</Button>
        <Typography variant="caption" color="text.secondary" sx={{ml:1}}>PNGs are notice-board ready; PDFs are print-quality.</Typography>
      </Paper>

      {/* Empty-data banners */}
      {facultyList.length === 0 && (
        <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'warning.main', color: 'warning.contrastText' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ⚠ No faculty found for this college. Add faculty members before creating schedules.
          </Typography>
        </Box>
      )}

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

      {/* Daily Print Target (captured for Image exports) */}
      <Card variant="outlined" ref={dailyPrintRef} sx={{ bgcolor:'#fff' }}>
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
                  {schedule.assignment && (
                    <Tooltip
                      title={
                        schedule.assignmentId
                          ? 'A draft assignment has been created for this slot — the faculty publishes it from Assignments.'
                          : 'Generate Sessions will create a draft assignment for this slot (due ' +
                            schedule.assignment.deadline + ') for the faculty to publish.'
                      }
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        color="secondary"
                        icon={<AssignmentIcon />}
                        label={
                          schedule.assignmentId
                            ? `Assignment · ${schedule.assignment.deadline}`
                            : `Assigns · due ${schedule.assignment.deadline}`
                        }
                        sx={{ height: 20, fontSize: 11, mt: 0.5 }}
                      />
                    </Tooltip>
                  )}
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
                    <Tooltip title="Cancel slot and its future sessions">
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={cancellingId === schedule.id}
                          onClick={() => handleCancelSlot(schedule)}
                        >
                          <EventBusyIcon fontSize="small" />
                        </IconButton>
                      </span>
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

      {/* Weekly printable (captured for Weekly Image/PDF) */}
      <Box ref={weeklyPrintRef} sx={{ mt:3, p:2, bgcolor:'#fff', border:'1px solid #e2e8f0', borderRadius:2 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1 }}>
          <Typography variant="subtitle1" sx={{fontWeight:700, color:'#0f766e'}}>Weekly Schedule — Mon to Sat</Typography>
          <Typography variant="caption" color="text.secondary">{weeklySlotsForExport.length} classes • {new Date().toLocaleDateString('en-IN')}</Typography>
        </Box>
        <Table size="small" sx={{ '& th, & td': { fontSize: 11, py:0.6 } }}>
          <TableHead>
            <TableRow sx={{bgcolor:'#0f766e'}}>
              <TableCell sx={{color:'#fff', fontWeight:700, minWidth:90}}>Time</TableCell>
              {allDays.map(d=> <TableCell key={d} sx={{color:'#fff', fontWeight:700, textAlign:'center', textTransform:'capitalize'}}>{d.slice(0,3)}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {slotKeysWeekly.length===0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{py:4}}><Typography variant="caption" color="text.secondary">No weekly timetable yet — create classes or use Auto Generate.</Typography></TableCell></TableRow>
            ) : slotKeysWeekly.map(key=> (
              <TableRow key={key} hover>
                <TableCell sx={{fontWeight:600, bgcolor:'#f8fafc', whiteSpace:'nowrap'}}>{key}</TableCell>
                {allDays.map(d=>{
                  const cell = weeklyCellMap.get(`${d}|${key}`)
                  return (
                    <TableCell key={d} sx={{ textAlign:'center', verticalAlign:'top', minWidth:110 }}>
                      {cell ? (
                        <Box>
                          <Typography variant="caption" sx={{fontWeight:600, display:'block', lineHeight:1.2}}>{cell.subject}</Typography>
                          {cell.room && <Typography variant="caption" sx={{color:'#0f766e', display:'block'}}>@{cell.room}</Typography>}
                          <Typography variant="caption" sx={{color:'text.secondary', display:'block'}}>{cell.facultyName}</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{color:'#cbd5e1'}}>—</Typography>}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Typography variant="caption" color="text.secondary" sx={{display:'block', mt:1, borderTop:'1px solid #e2e8f0', pt:1}}>Vriddhi Academic Cloud — scalable, equal-distribution scheduling</Typography>
      </Box>

      {/* ─── AUTO GENERATE WIZARD ──────────────────────────────────────── */}
      <Dialog open={autoOpen} onClose={()=> setAutoOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display:'flex', alignItems:'center', gap:1 }}>
          <AutoIcon color="secondary" />
          Auto-Generate Timetable — Equal Distribution &amp; Break-Aware
          <Chip size="small" label={`Step ${autoStep}/3`} color="secondary" variant="outlined" sx={{ml:1}} />
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display:'flex', gap:1, mb:2 }}>
            {[
              {n:1,label:'Configure'},
              {n:2,label:'Preview & Balance Check'},
              {n:3,label:'Done'},
            ].map(s=> (
              <Chip key={s.n} label={`${s.n}. ${s.label}`} color={autoStep===s.n ? 'secondary' : autoStep> s.n ? 'success' : 'default'} variant={autoStep===s.n ? 'filled' : 'outlined'} size="small" />
            ))}
          </Box>

          {autoStep===1 && (
            <Stack spacing={2}>
              <Alert severity="info">
                One click builds a fair week: each subject spread evenly Mon→Sat (not 3 on Monday), faculty load levelled (max {autoMaxFacultyPerDay}/day), breaks blocked. A live preview shows balance before anything is saved.
              </Alert>

              <Box sx={{ display:'flex', gap:2, flexWrap:'wrap' }}>
                <Box sx={{ flex:'1 1 280px', minWidth:280 }}>
                  <Card variant="outlined" sx={{p:1.5}}>
                    <Typography variant="subtitle2" sx={{fontWeight:700, display:'flex', alignItems:'center', gap:1}}><ScheduleIcon fontSize="small"/> Daily window &amp; periods</Typography>
                    <Stack direction="row" spacing={1} sx={{mt:1}}>
                      <TextField label="Day start" type="time" size="small" value={autoDayStart} onChange={e=> setAutoDayStart(e.target.value)} slotProps={{inputLabel:{shrink:true}}} />
                      <TextField label="Day end" type="time" size="small" value={autoDayEnd} onChange={e=> setAutoDayEnd(e.target.value)} slotProps={{inputLabel:{shrink:true}}} />
                      <TextField label="Period (mins)" type="number" size="small" value={autoPeriodMins} onChange={e=> setAutoPeriodMins(Number(e.target.value)||50)} sx={{maxWidth:120}} slotProps={{htmlInput:{min:30,max:90}}} />
                    </Stack>
                    <Box sx={{mt:2}}>
                      <Typography variant="caption" sx={{fontWeight:600}}>Max periods per faculty per day: {autoMaxFacultyPerDay}</Typography>
                      <Slider min={2} max={6} step={1} value={autoMaxFacultyPerDay} onChange={(_,v)=> setAutoMaxFacultyPerDay(v as number)} valueLabelDisplay="auto" />
                    </Box>
                  </Card>
                </Box>
                <Box sx={{ flex:'1 1 280px', minWidth:280 }}>
                  <Card variant="outlined" sx={{p:1.5}}>
                    <Typography variant="subtitle2" sx={{fontWeight:700, display:'flex', alignItems:'center', gap:1}}><BreakIcon fontSize="small"/> Breaks — blocked, not teachable</Typography>
                    {autoBreaks.map((br,i)=> (
                      <Stack key={i} direction="row" spacing={1} sx={{mt:1}} style={{alignItems:'center'}}>
                        <TextField size="small" label="Start" type="time" value={br.start} onChange={e=> setAutoBreaks(prev=> prev.map((b,idx)=> idx===i? {...b, start:e.target.value}: b))} slotProps={{inputLabel:{shrink:true}}} />
                        <TextField size="small" label="End" type="time" value={br.end} onChange={e=> setAutoBreaks(prev=> prev.map((b,idx)=> idx===i? {...b, end:e.target.value}: b))} slotProps={{inputLabel:{shrink:true}}} />
                        <TextField size="small" label="Label" value={br.label} onChange={e=> setAutoBreaks(prev=> prev.map((b,idx)=> idx===i? {...b, label:e.target.value}: b))} sx={{flex:1}} />
                        <IconButton size="small" onClick={()=> setAutoBreaks(prev=> prev.filter((_,idx)=> idx!==i))}><DeleteIcon fontSize="small"/></IconButton>
                      </Stack>
                    ))}
                    <Button size="small" sx={{mt:1}} onClick={()=> setAutoBreaks(prev=> [...prev, {start:'15:00', end:'15:15', label:'Evening Break'}])}>+ Add break</Button>
                  </Card>
                </Box>
              </Box>

              <Card variant="outlined" sx={{p:1.5}}>
                <Box sx={{display:'flex', gap:2, flexWrap:'wrap', alignItems:'center'}}>
                  <FormControl size="small" sx={{minWidth:140}}>
                    <InputLabel>Periods / subject / week</InputLabel>
                    <Select value={autoPeriodsPerWeek} label="Periods / subject / week" onChange={e=> setAutoPeriodsPerWeek(Number(e.target.value))}>
                      {[2,3,4,5,6].map(n=> <MenuItem key={n} value={n}>{n} / week — {n<=3?'light':'balanced'}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControlLabel control={<Checkbox checked={autoEqualDist} onChange={e=> setAutoEqualDist(e.target.checked)} />} label="Equal distribution (recommended)" />
                  <FormControl size="small" sx={{minWidth:180}}>
                    <InputLabel>Scope</InputLabel>
                    <Select value={autoScope} label="Scope" onChange={e=> setAutoScope(e.target.value as any)}>
                      <MenuItem value="all">All branches & batches</MenuItem>
                      <MenuItem value="filtered">First cohort only (quick test)</MenuItem>
                    </Select>
                  </FormControl>
                  <Chip label={`${autoCohortDemands.length} cohorts • ${autoCohortDemands.reduce((s,c)=> s+c.subjects.length,0)} subject-assignments`} color="secondary" variant="outlined" />
                </Box>
                <TextField fullWidth size="small" label="Rooms (comma-separated)" value={autoRooms} onChange={e=> setAutoRooms(e.target.value)} placeholder="101, 102, Lab-1, LH-301" sx={{mt:2}} helperText="Pool the generator picks from; preferredRoom on a subject still wins if free" />
                {autoCohortDemands.length>0 && (
                  <Alert severity="success" sx={{mt:2}}>
                    Preview will generate <strong>{(() => {
                      try {
                        const g=buildTimeSlots(autoSlotConfig); const spd=g.get('monday')?.length||0; return `${spd} slots/day × ${autoSlotConfig.workingDays.length} days = ${spd*autoSlotConfig.workingDays.length} weekly slots`; 
                      } catch(e:any){ return e.message }
                    })()}</strong> • {autoCohortDemands.length} cohorts • Rooms: {autoRoomsList.length}
                  </Alert>
                )}
                {facultyList.length===0 && <Alert severity="warning" sx={{mt:1}}>No faculty found — preview will be empty. Add faculty (or seed subjects) first.</Alert>}
              </Card>
            </Stack>
          )}

          {autoStep===2 && autoPreview && (
            <Stack spacing={2}>
              <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', alignItems:'center' }}>
                <Chip icon={<BalanceIcon />} label={`Faculty variance σ=${autoPreview.stats.facultyVariance} — ${autoPreview.stats.facultyVariance<0.8?'Excellent': autoPreview.stats.facultyVariance<1.4?'Good':'Needs review'}`} color={autoPreview.stats.facultyVariance<1.4?'success':'warning'} size="small" />
                <Chip label={`${autoPreview.slots.length} classes proposed`} color="secondary" size="small" />
                <Chip label={autoPreview.stats.breaksRespected? 'Breaks respected ✓' : 'Breaks violated'} color={autoPreview.stats.breaksRespected?'success':'error'} size="small" />
                <Chip label={`Clashes: ${autoPreview.hardClashes.length}`} color={autoPreview.hardClashes.length===0?'success':'error'} size="small" />
                <Box sx={{flex:1}}/>
                <Button size="small" variant="outlined" startIcon={<PdfIcon/>} onClick={handleDownloadAutoPreviewPdf}>Preview PDF</Button>
                <Button size="small" variant="outlined" startIcon={<ImageIcon/>} onClick={handleDownloadAutoPreviewImage}>Preview Image</Button>
              </Box>

              {autoPreview.warnings.length>0 && <Alert severity="warning" sx={{whiteSpace:'pre-wrap'}}>{autoPreview.warnings.join('\n')}</Alert>}
              {autoPreview.hardClashes.length>0 && <Alert severity="error">{autoPreview.hardClashes.slice(0,4).map(c=> c.message).join('\n')}</Alert>}

              <Paper variant="outlined" ref={autoPreviewRef} sx={{p:1.5, overflowX:'auto', bgcolor:'#fff'}}>
                <Typography variant="subtitle2" sx={{fontWeight:700, color:'#0f766e'}}>Preview — Weekly Matrix (sample by start time)</Typography>
                <Typography variant="caption" color="text.secondary">Each cell = one cohort&apos;s class. For multi-cohort colleges the table scrolls horizontally; PDF will paginate cleanly.</Typography>
                <Table size="small" sx={{mt:1, '& th, & td': {fontSize:10, py:0.5}}}>
                  <TableHead>
                    <TableRow sx={{bgcolor:'#0f766e'}}>
                      <TableCell sx={{color:'#fff', fontWeight:700, minWidth:90}}>Time</TableCell>
                      {autoSlotConfig.workingDays.map(d=> <TableCell key={d} sx={{color:'#fff', fontWeight:700, textTransform:'capitalize', textAlign:'center'}}>{d.slice(0,3)}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {slotKeysPreview.map(key=> (
                      <TableRow key={key}>
                        <TableCell sx={{fontWeight:600, bgcolor:'#f8fafc', whiteSpace:'nowrap'}}>{key}</TableCell>
                        {autoSlotConfig.workingDays.map(d=>{
                          const cell = autoPreview.slots.find(s=> s.dayOfWeek===d && `${s.startTime}–${s.endTime}`===key)
                          return (
                            <TableCell key={d} sx={{textAlign:'center', verticalAlign:'top'}}>
                              {cell ? (
                                <Box sx={{border:1, borderColor:'divider', borderRadius:1, p:0.5, bgcolor:'rgba(13,148,136,0.06)'}}>
                                  <Typography variant="caption" sx={{fontWeight:700, display:'block', lineHeight:1.2}}>{cell.subject}</Typography>
                                  <Typography variant="caption" sx={{display:'block', color:'#0f766e'}}>{cell.room} • {cell.branch} {cell.division}</Typography>
                                  <Typography variant="caption" sx={{display:'block', color:'text.secondary'}}>{cell.facultyName}</Typography>
                                </Box>
                              ) : <Typography variant="caption" sx={{color:'#cbd5e1'}}>—</Typography>}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{display:'block', mt:1}}>Scrolled view shows one cohort per day-slot for readability — weekly PDF loops over cohorts if needed.</Typography>
              </Paper>

              <Paper variant="outlined" sx={{p:1.5}}>
                <Typography variant="subtitle2" sx={{fontWeight:700}}>Per-cohort distribution</Typography>
                {autoPreview.stats.cohorts.map(c=> (
                  <Box key={c.cohortKey} sx={{display:'flex', gap:1, alignItems:'center', flexWrap:'wrap', mt:1, p:1, borderRadius:1, bgcolor:'action.hover'}}>
                    <Typography variant="caption" sx={{fontWeight:600, minWidth:160}}>{c.cohortKey}</Typography>
                    <Chip size="small" label={`needed ${c.needed} • placed ${c.placed}${c.unmet?` • unmet ${c.unmet}`:''}`} color={c.unmet?'error':'success'} />
                    {autoSlotConfig.workingDays.map(d=> <Chip key={d} size="small" variant="outlined" label={`${d.slice(0,2)}:${c.perDay[d]||0}`} sx={{height:20, fontSize:10}} />)}
                  </Box>
                ))}
              </Paper>
            </Stack>
          )}

          {autoStep===2 && !autoPreview && (
            <Alert severity="warning">No preview yet — go back and click “Generate Preview”.</Alert>
          )}

          {autoStep===3 && (
            <Box sx={{ display:'flex', flexDirection:'column', gap:2, alignItems:'center', py:2 }}>
              <Typography variant="h6" sx={{fontWeight:700, color:'success.main'}}>✓ Timetable is live</Typography>
              <Typography variant="body2" color="text.secondary" sx={{textAlign:'center'}}>
                {autoResult?.created} weekly slots were created. <br/> Next: <strong>Generate Sessions</strong> for your term dates so faculty attendance &amp; coverage can start.
              </Typography>
              {autoResult && autoResult.warnings.length>0 && <Alert severity="warning" sx={{width:'100%'}}>{autoResult.warnings.join('\n')}</Alert>}
              <Box sx={{ display:'flex', gap:1 }}>
                <Button variant="outlined" onClick={()=> setAutoOpen(false)}>Close</Button>
                <Button variant="contained" startIcon={<MaterialiseIcon/>} onClick={()=> { setAutoOpen(false); setGenerateOpen(true)}}>Generate Sessions</Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {autoStep===1 && <>
            <Button onClick={()=> setAutoOpen(false)}>Cancel</Button>
            <Button variant="contained" color="secondary" startIcon={<AutoIcon/>} onClick={handleAutoPreview} disabled={autoCohortDemands.length===0}>Generate Preview →</Button>
          </>}
          {autoStep===2 && <>
            <Button onClick={()=> setAutoStep(1)}>← Back</Button>
            <Box sx={{flex:1}}/>
            <Button onClick={()=> setAutoOpen(false)}>Cancel</Button>
            <Button variant="contained" color="secondary" disabled={autoGenerating} onClick={handleAutoConfirm}>{autoGenerating ? 'Creating…' : `Confirm & Create ${autoPreview? autoPreview.slots.length:0} slots`}</Button>
          </>}
          {autoStep===3 && <Button variant="outlined" onClick={handleAutoReset}>Create another</Button>}
        </DialogActions>
      </Dialog>

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
                  {formData.subject && !facultySubjects.some(s => s.name === formData.subject) && (
                    <MenuItem value={formData.subject}>{formData.subject}</MenuItem>
                  )}
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

          {/* Optional assignment attachment — timetable-side one-stop link */}
          <Box sx={{ mt: 2, p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={attachAssignment}
                  onChange={e => setAttachAssignment(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Attach an assignment to this class (optional)
                </Typography>
              }
            />
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: attachAssignment ? 1.5 : 0 }}>
              “Generate Sessions” creates one draft assignment for this slot — same subject and cohort as the
              class above — and the faculty publishes it from Assignments. Students get the deadline
              notification on publish. Leave off for a plain class.
            </Typography>
            {attachAssignment && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                <Box sx={{ flex: '2 1 260px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Assignment title *"
                    value={assignTitle}
                    onChange={e => setAssignTitle(e.target.value)}
                    placeholder="e.g., Week 4 worksheet"
                  />
                </Box>
                <Box sx={{ flex: '1 1 120px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Max score *"
                    type="number"
                    value={assignMaxScore}
                    onChange={e => setAssignMaxScore(Number(e.target.value) || 0)}
                    slotProps={{ htmlInput: { min: 1, max: 500 } }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 160px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Deadline *"
                    type="date"
                    value={assignDeadline}
                    onChange={e => setAssignDeadline(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </Box>
            )}
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

      {/* ─── Slice 2: Generate class sessions from the weekly timetable ──── */}
      <Dialog open={generateOpen} onClose={() => setGenerateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate class sessions</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Turns the active weekly timetable into real class sessions that faculty can mark
            attendance and topic coverage against. Running it twice over the same range is safe —
            each slot-day maps to one session, so nothing is duplicated.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="From"
              type="date"
              value={generateWindow.from}
              onChange={e => setGenerateWindow(prev => ({ ...prev, from: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              label="To (max 92 days)"
              type="date"
              value={generateWindow.to}
              onChange={e => setGenerateWindow(prev => ({ ...prev, to: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Stack>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={skipConflicting}
                onChange={event => setSkipConflicting(event.target.checked)}
              />
            }
            label="Skip slots that clash instead of stopping"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Faculty and room double-bookings are refused by default so a bad timetable is not
            scattered across the whole term. Tick this to generate everything else and list what was
            skipped.
          </Typography>

          {generateResult && (
            <Alert severity={(generateResult.skippedConflicts || 0) > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              {generateResult.created} created · {generateResult.skippedExisting} already existed
              {(generateResult.skippedConflicts || 0) > 0 && ` · ${generateResult.skippedConflicts} skipped (clash)`} ·{' '}
              {generateResult.slotsScanned} active slot(s) × {generateResult.scheduledOccurrences} occurrence(s)
              in range.
              {(generateResult.assignmentsLinked || 0) > 0 && (
                <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                  {generateResult.assignmentsLinked} assignment draft(s) linked for faculty review & publish.
                </Typography>
              )}
            </Alert>
          )}

          {generateConflicts.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {generateConflicts.length} clash(es) found
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                {generateConflicts.slice(0, 8).map((conflict, index) => (
                  <li key={`${conflict.sessionId}-${conflict.kind}-${index}`}>
                    <Typography variant="caption">
                      {conflict.message}
                      {conflict.conflictsWith && ` (${conflict.conflictsWith})`}
                    </Typography>
                  </li>
                ))}
              </Box>
              {generateConflicts.length > 8 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  …and {generateConflicts.length - 8} more.
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : generateResult ? 'Generate again' : 'Generate'}
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