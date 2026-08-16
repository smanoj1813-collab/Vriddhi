import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  CalendarToday,
  School,
} from '@mui/icons-material';
import { useFacultySchedule } from '../hooks/useFacultySchedule';
import type { DayOfWeek } from '../../../types/schedule';

const DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const dayColors: Record<DayOfWeek, string> = {
  Monday: '#3b82f6',
  Tuesday: '#8b5cf6',
  Wednesday: '#10b981',
  Thursday: '#f59e0b',
  Friday: '#ef4444',
  Saturday: '#6366f1',
  Sunday: '#64748b',
};

export default function FacultySchedule() {
  const { weeklySchedule, todayClasses, totalClasses, isLoading, error } =
    useFacultySchedule();

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" width={280} height={120} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
        Weekly Schedule
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={<CalendarToday />}
          label={`${totalClasses} total classes`}
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<AccessTime />}
          label={`${todayClasses.length} today`}
          color="success"
          variant="outlined"
        />
      </Box>

      {DAYS.map((day) => {
        const classes = weeklySchedule[day] || [];
        return (
          <Box key={day} sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: dayColors[day], mb: 1 }}
            >
              {day}
            </Typography>
            {classes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No classes scheduled
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {classes.map((cls) => (
                  <Card
                    key={cls.id}
                    variant="outlined"
                    sx={{
                      minWidth: 260,
                      borderLeft: `4px solid ${dayColors[day]}`,
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {cls.subject}
                      </Typography>
                      {cls.subjectCode && (
                        <Typography variant="caption" color="text.secondary">
                          {cls.subjectCode}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mt: 1,
                        }}
                      >
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cls.timeSlot.startTime} – {cls.timeSlot.endTime}
                        </Typography>
                      </Box>
                      {cls.room && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mt: 0.5,
                          }}
                        >
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">{cls.room}</Typography>
                        </Box>
                      )}
                      {cls.type && (
                        <Chip
                          size="small"
                          icon={<School fontSize="small" />}
                          label={cls.type}
                          sx={{ mt: 1, textTransform: 'capitalize' }}
                        />
                      )}
                      {cls.status && (
                        <Chip
                          size="small"
                          label={cls.status}
                          color={
                            cls.status === 'completed'
                              ? 'success'
                              : cls.status === 'ongoing'
                              ? 'warning'
                              : 'default'
                          }
                          sx={{ mt: 1, ml: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}