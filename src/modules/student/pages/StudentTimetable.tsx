// src/pages/student/StudentTimetable.tsx
import React from 'react'
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
} from '@mui/icons-material'
import { useStudentSchedule } from '../hooks/useStudentSchedule'
import type { DayOfWeek } from '../types/schedule'

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
}

// Student profile from localStorage or auth context
function getStudentProfile() {
  const studentToken = localStorage.getItem('studentToken')
  if (!studentToken) return null

  // Try to get from stored student data
  try {
    const studentData = JSON.parse(localStorage.getItem('studentData') || '{}')
    return {
      branch: studentData.branch || studentData.department || studentData.course || '',
      batch: studentData.batch || studentData.yearOfAdmission || '',
      semester: Number(studentData.semester) || Number(studentData.currentSemester) || 1,
      division: studentData.division || '',
      section: studentData.section || '',
    }
  } catch {
    return null
  }
}

const StudentTimetable: React.FC = () => {
  const studentProfile = getStudentProfile()
  const { weeklySchedule, todayClasses, isLoading } = useStudentSchedule(studentProfile)

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading your timetable...</Typography>
      </Box>
    )
  }

  if (!studentProfile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Student profile not found. Please log in again.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
            {todayClasses.map(cls => {
              const status = cls.status as keyof typeof STATUS_CONFIG
              const config = STATUS_CONFIG[status]

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
                          {cls.subjectCode} &middot; {cls.type.charAt(0).toUpperCase() + cls.type.slice(1)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.startTime} - {cls.endTime}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <RoomIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          Room {cls.room}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.facultyName}
                          {cls.facultyInitials && ` (${cls.facultyInitials})`}
                        </Typography>
                      </Box>
                    </Box>
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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {DAYS.map(day => {
          const classes = weeklySchedule[day] || []
          const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

          return (
            <Box key={day} sx={{ flex: '1 1 300px', minWidth: 280 }}>
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
                  {classes.map(cls => (
                    <Card key={cls.id} variant="outlined">
                      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                            {cls.startTime} - {cls.endTime}
                          </Typography>
                          <Chip
                            label={cls.type}
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
                            Room {cls.room}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cls.facultyInitials || cls.facultyName}
                          </Typography>
                        </Box>
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
