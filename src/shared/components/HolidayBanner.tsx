// src/shared/components/HolidayBanner.tsx
// "⛔ Holiday — no classes" (Auto-Scheduler v2 — P4). One banner, three
// timetable screens: AdminClassSchedule (next occurrence of the selected
// weekday), StudentTimetable (today) and FacultySchedule (today).

import { Alert, AlertTitle } from '@mui/material';
import { EventBusy } from '@mui/icons-material';
import { useHolidayForDate } from '@/shared/hooks/useAcademicCalendar';

function fmt(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(d.getTime())
    ? dateKey
    : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  /** yyyy-mm-dd — the date being presented. */
  date?: string;
  collegeId?: string;
}

export default function HolidayBanner({ date, collegeId }: Props) {
  const { holiday, isError } = useHolidayForDate(date, collegeId);
  if (!date) return null;
  if (isError) {
    return (
      <Alert severity="error" icon={<EventBusy />} sx={{ mb: 2 }}>
        <AlertTitle>Calendar could not be checked</AlertTitle>
        Holiday status for {fmt(date)} is unavailable. Refresh or contact an administrator before relying on this timetable.
      </Alert>
    );
  }
  if (!holiday) return null;
  return (
    <Alert severity="warning" icon={<EventBusy />} sx={{ mb: 2 }}>
      <AlertTitle>Holiday — no classes</AlertTitle>
      {holiday.title} · {fmt(date)}
      {holiday.startDate !== holiday.endDate
        ? ` (continues through ${fmt(holiday.endDate)})`
        : ''}
    </Alert>
  );
}
