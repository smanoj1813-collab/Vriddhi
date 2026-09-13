import React, { useEffect, useMemo, useState } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Alert,
} from '@mui/material'
import {
  AccessTime as TimeIcon,
  Room as RoomIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  PlayArrow as OngoingIcon,
  Schedule as UpcomingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
} from '@mui/icons-material'
import { useStudentSchedule } from '../hooks/useStudentSchedule'
import type { DayOfWeek, ClassSchedule } from '../../../types/schedule'
import { useStudentProfile } from '../hooks/useStudentProfile'
import { useAuth } from '../../auth/context/AuthContext'
import { fetchTodaySchedule, type StudentClassSession } from '../api/studentDataApi'
import { useMyCurriculum, type StudentSessionSummary } from '../hooks/useMyCurriculum'

function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtShort(key: string): string {
  const d = new Date(`${key}T12:00:00`)
  return Number.isNaN(d.getTime()) ? key : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Topic chips shown under a class card. */
function TopicChips({ topics, label }: { topics: string[]; label?: string }) {
  if (!topics.length) return null
  return (
    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
      {label && <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>{label}</Typography>}
      {topics.map((t, i) => (
        <Chip key={i} label={t} size="small" sx={{ height: 20, fontSize: 11 }} />
      ))}
    </Box>
  )
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_CONFIG = {
  upcoming: {
    color: 'primary' as const,
    icon: <UpcomingIcon fontSize="small" />,
    label: 'Upcoming',
    borderColor: 'primary.main',
  },
  ongoing: {
    color: 'success' as const,
    icon: <OngoingIcon fontSize="small" />,
    label: 'In Progress',
    borderColor: 'success.main',
  },
  completed: {
    color: 'default' as const,
    icon: <CompletedIcon fontSize="small" />,
    label: 'Completed',
    borderColor: 'grey.400',
  },
  scheduled: {
    color: 'default' as const,
    icon: <UpcomingIcon fontSize="small" />,
    label: 'Scheduled',
    borderColor: 'grey.400',
  },
  cancelled: {
    color: 'error' as const,
    icon: <CancelledIcon fontSize="small" />,
    label: 'Cancelled',
    borderColor: 'error.main',
  },
}

interface StudentProfile {
  collegeId: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
}

const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useStudentProfile(user?.uid);

  const studentProfile: StudentProfile | null = profile
    ? {
        collegeId: profile.collegeId || user?.collegeId || '',
        branch: profile.branch || profile.department || '',
        batch: profile.batch || '',
        semester: Number(profile.semester) || 1,
        division: profile.division || '',
        section: profile.section || profile.division || '',
      }
    : null;

  const { weeklySchedule, todayClasses: weeklyToday, isLoading, error: scheduleError } = useStudentSchedule(studentProfile);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // On phones the weekly grid becomes a day picker; default to today
  // (Sunday falls back to Monday).
  const [mobileDay, setMobileDay] = useState<DayOfWeek>(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;
    return DAYS.includes(today) ? today : 'Monday';
  });

  // Today's list merges the recurring template with the actual `classSessions`
  // rows (cancellations, in-progress/completed status, topics taught) — the
  // same merge the dashboard uses — so a class the faculty cancelled or
  // completed no longer shows as plain "Scheduled" here.
  const [todaySessions, setTodaySessions] = useState<StudentClassSession[] | null>(null)
  useEffect(() => {
    if (!studentProfile?.collegeId || !studentProfile.branch || !studentProfile.batch) { setTodaySessions(null); return }
    let cancelled = false
    fetchTodaySchedule(studentProfile, localDateKey())
      .then((rows) => { if (!cancelled) setTodaySessions(rows) })
      .catch(() => { if (!cancelled) setTodaySessions(null) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentProfile?.collegeId, studentProfile?.branch, studentProfile?.batch, studentProfile?.semester, studentProfile?.division, studentProfile?.section])

  const todayClasses: ClassSchedule[] = useMemo(() => {
    if (!todaySessions) return weeklyToday
    return todaySessions.map((s) => ({
      id: s.id,
      subject: s.subject,
      subjectCode: s.subjectCode,
      facultyName: s.facultyName,
      faculty: s.facultyName,
      startTime: s.startTime,
      endTime: s.endTime,
      room: s.room,
      type: (s.type as ClassSchedule['type']) || 'lecture',
      status: (s.status as ClassSchedule['status']) || 'scheduled',
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek,
      className: s.subject,
      timeSlot: { startTime: s.startTime, endTime: s.endTime || '' },
      topics: s.topic ? s.topic.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }))
  }, [todaySessions, weeklyToday])

  // Planned/covered topics per weekly slot for the next two weeks, from the
  // curriculum callable (it already joins classSessions for this cohort).
  const { data: curriculum } = useMyCurriculum(!!studentProfile)
  const topicsBySlot = useMemo(() => {
    const map = new Map<string, { date: string; topics: string[]; status: string }[]>()
    const list: StudentSessionSummary[] = curriculum?.upcomingClasses || []
    for (const s of list) {
      const day = (s.dayOfWeek || new Date(`${s.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })).toLowerCase()
      const key = `${day}|${(s.subjectCode || s.subject).toLowerCase()}|${s.startTime}`
      const arr = map.get(key) || []
      arr.push({ date: s.date, topics: s.topics, status: s.status })
      map.set(key, arr)
    }
    return map
  }, [curriculum])
  const slotTopics = (day: string, cls: ClassSchedule) => {
    const key = `${day.toLowerCase()}|${(cls.subjectCode || cls.subject).toLowerCase()}|${cls.startTime || cls.timeSlot?.startTime || ''}`
    const next = (topicsBySlot.get(key) || []).sort((a, b) => a.date.localeCompare(b.date))[0]
    return next
  }

  const loading = profileLoading || isLoading;
  const error = profileError || scheduleError;

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading your timetable...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!studentProfile) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        <Alert severity="warning">
          Your account is not linked to a complete class profile. Contact your college administrator.
        </Alert>
      </Box>
    )
  }

  const todayDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <Box sx={{ p: { xs: 0, md: 1 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          My Class Schedule
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {studentProfile.branch} &middot; Batch {studentProfile.batch} &middot; Semester {studentProfile.semester}
          {studentProfile.division && ` &middot; Division ${studentProfile.division}`}
          {studentProfile.section && ` &middot; Section ${studentProfile.section}`}
        </Typography>
        <Typography
          variant="caption"
          color="primary"
          sx={{ cursor: 'pointer', fontWeight: 600, display: 'inline-block', mt: 0.5 }}
          onClick={() => navigate('/student/curriculum')}
        >
          See what each subject covers → My Curriculum
        </Typography>
      </Box>

      {/* Today's Classes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarIcon fontSize="small" />
          Today's Classes
        </Typography>

        {todayClasses.length === 0 ? (
          <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No classes scheduled for today. Enjoy your day!
            </Typography>
          </Card>
        ) : (
          <Stack spacing={2}>
            {todayClasses.map((cls: ClassSchedule) => {
              const status = (cls.status || 'scheduled') as keyof typeof STATUS_CONFIG
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled

              return (
                <Card
                  key={cls.id}
                  variant="outlined"
                  sx={{
                    borderLeft: 4,
                    borderLeftColor: config.borderColor,
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {cls.subject}
                          </Typography>
                          <Chip
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            color={config.color}
                            sx={{ height: 24 }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {cls.subjectCode || '—'} &middot; {(cls.type || 'lecture').charAt(0).toUpperCase() + (cls.type || 'lecture').slice(1)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.startTime || cls.timeSlot?.startTime || '—'} - {cls.endTime || cls.timeSlot?.endTime || '—'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoomIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Room {cls.room || 'TBD'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.facultyName || 'TBD'}
                          {cls.facultyInitials && ` (${cls.facultyInitials})`}
                        </Typography>
                      </Box>
                    </Box>
                    {(() => {
                      const topics = cls.topics && cls.topics.length ? cls.topics : (slotTopics(todayDayName, cls)?.topics || [])
                      return topics.length
                        ? <TopicChips topics={topics} label={status === 'completed' ? 'Covered:' : 'Topic:'} />
                        : <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>Topic not announced yet</Typography>
                    })()}
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        )}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Weekly Schedule */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
        Weekly Timetable
      </Typography>

      {isMobile && (
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 1, mx: -2, px: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {DAYS.map(day => {
            const isToday = day.toLowerCase() === todayDayName.toLowerCase()
            const active = day === mobileDay
            return (
              <Chip
                key={day}
                label={`${day.slice(0, 3)}${isToday ? ' •' : ''}`}
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => setMobileDay(day)}
                sx={{ textTransform: 'capitalize', fontWeight: 600, minHeight: 36, flexShrink: 0 }}
              />
            )
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {(isMobile ? DAYS.filter(d => d === mobileDay) : DAYS).map(day => {
          const classes: ClassSchedule[] = weeklySchedule[day] || []
          const isToday = day.toLowerCase() === todayDayName.toLowerCase()

          return (
            <Box key={day} sx={{ flex: '1 1 300px', minWidth: { xs: 0, sm: 280 }, width: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  pb: 1,
                  borderBottom: 2,
                  borderColor: isToday ? 'primary.main' : 'divider',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    textTransform: 'capitalize',
                    fontWeight: isToday ? 600 : 500,
                    color: isToday ? 'primary.main' : 'text.primary',
                  }}
                >
                  {day}
                  {isToday && (
                    <Chip
                      label="Today"
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: 11 }}
                    />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {classes.length} {classes.length === 1 ? 'class' : 'classes'}
                </Typography>
              </Box>

              {classes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No classes
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {classes.map((cls: ClassSchedule) => (
                    <Card key={cls.id} variant="outlined">
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                            {cls.startTime || cls.timeSlot?.startTime || '—'} - {cls.endTime || cls.timeSlot?.endTime || '—'}
                          </Typography>
                          <Chip
                            label={cls.type || 'lecture'}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: 11, textTransform: 'capitalize' }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {cls.subject}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Room {cls.room || 'TBD'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cls.facultyInitials || cls.facultyName || 'TBD'}
                          </Typography>
                        </Box>
                        {(() => {
                          const next = slotTopics(day, cls)
                          if (!next) return null
                          return next.status === 'cancelled'
                            ? <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>Cancelled on {fmtShort(next.date)}</Typography>
                            : <TopicChips topics={next.topics} label={`${fmtShort(next.date)}:`} />
                        })()}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default StudentTimetable