// src/pages/faculty/FacultySchedule.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  Button,
  Badge,
} from '@mui/material'
import {
  AccessTime as TimeIcon,
  Room as RoomIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayArrow as OngoingIcon,
} from '@mui/icons-material'
import { useFacultySchedule } from '../../../hooks/useFacultySchedule'
import type { DayOfWeek } from '../../../types/schedule'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

interface StatusConfigItem {
  color: 'primary' | 'success' | 'default';
  icon: React.ReactNode;
  label: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  upcoming: { color: 'primary', icon: <PendingIcon fontSize="small" />, label: 'Upcoming' },
  ongoing: { color: 'success', icon: <OngoingIcon fontSize="small" />, label: 'In Progress' },
  completed: { color: 'default', icon: <CheckIcon fontSize="small" />, label: 'Completed' },
}

interface ClassItem {
  id: string;
  subject: string;
  subjectCode: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  room: string;
  branch: string;
  batch: string;
  semester: number;
  division?: string;
  section?: string;
}

const FacultySchedule: React.FC = () => {
  const { weeklySchedule, todayClasses, totalClasses, isLoading } = useFacultySchedule()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading your schedule...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            My Teaching Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalClasses} classes per week
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<CalendarIcon />}
          onClick={() => navigate('/faculty/calendar')}
        >
          Full Calendar
        </Button>
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
            {todayClasses.map((cls: ClassItem) => {
              const status = cls.status as keyof typeof STATUS_CONFIG
              const config = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming

              return (
                <Card
                  key={cls.id}
                  variant="outlined"
                  sx={{
                    borderLeft: 4,
                    borderLeftColor: status === 'ongoing' ? 'success.main' : status === 'upcoming' ? 'primary.main' : 'grey.400',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                      boxShadow: 1,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {cls.subject}
                          </Typography>
                          <Chip
                            icon={config.icon as React.ReactElement}
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

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {status === 'ongoing' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => navigate(`/faculty/mark-attendance`)}
                          >
                            Mark Attendance
                          </Button>
                        )}
                        {status === 'upcoming' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => navigate(`/faculty/mark-attendance`)}
                          >
                            Prepare
                          </Button>
                        )}
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
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.branch} &middot; {cls.batch} &middot; Sem {cls.semester}
                          {cls.division ? ` · ${cls.division}` : ''}
                          {cls.section ? ` · ${cls.section}` : ''}
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
        Weekly Schedule
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {DAYS.map(day => {
          const classes = (weeklySchedule[day] || []) as ClassItem[]
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
                <Badge
                  badgeContent={classes.length}
                  color={classes.length > 0 ? 'primary' : 'default'}
                  sx={{ '& .MuiBadge-badge': { fontSize: 12 } }}
                />
              </Box>

              {classes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No classes
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {classes.map((cls: ClassItem) => (
                    <Card
                      key={cls.id}
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => navigate('/faculty/mark-attendance')}
                    >
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
                            {cls.branch} {cls.batch}
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

export default FacultySchedule
