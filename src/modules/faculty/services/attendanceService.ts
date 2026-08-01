// src/services/attendanceService.ts
import { 
  AttendanceRecord, 
  ClassSession, 
  DailyAttendanceSummary,
  StudentAttendanceSummary,
  CalendarDayData,
  AttendanceStatus 
} from '../types/attendance';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ── Faculty: Mark / Save Attendance ───────────────────────────────────

export async function saveAttendance(
  sessionId: string, 
  records: Record<string, AttendanceStatus>
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/attendance/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, records, markedAt: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error('Failed to save attendance');
  return res.json();
}

export async function submitAttendance(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/attendance/submit/${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to submit attendance');
}

// ── Admin: Fetch Aggregated Data ──────────────────────────────────────

export async function getAttendanceByDateService(
  date: string, 
  branch?: string, 
  batch?: string
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams({ date });
  if (branch) params.append('branch', branch);
  if (batch) params.append('batch', batch);
  const res = await fetch(`${API_BASE}/attendance/by-date?${params}`);
  if (!res.ok) throw new Error('Failed to fetch attendance');
  return res.json();
}

export async function getDailySummary(
  date: string,
  branch?: string,
  batch?: string
): Promise<DailyAttendanceSummary> {
  const params = new URLSearchParams({ date });
  if (branch) params.append('branch', branch);
  if (batch) params.append('batch', batch);
  const res = await fetch(`${API_BASE}/attendance/daily-summary?${params}`);
  if (!res.ok) throw new Error('Failed to fetch daily summary');
  return res.json();
}

export async function getCalendarData(
  year: number,
  month: number,      // 0-11
  branch?: string,
  batch?: string
): Promise<CalendarDayData[]> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (branch) params.append('branch', branch);
  if (batch) params.append('batch', batch);
  const res = await fetch(`${API_BASE}/attendance/calendar?${params}`);
  if (!res.ok) throw new Error('Failed to fetch calendar data');
  return res.json();
}

export async function getBranchWiseStats(
  date: string,
  batch?: string
): Promise<{ branch: string; present: number; absent: number; total: number; percentage: number }[]> {
  const params = new URLSearchParams({ date });
  if (batch) params.append('batch', batch);
  const res = await fetch(`${API_BASE}/attendance/branch-stats?${params}`);
  if (!res.ok) throw new Error('Failed to fetch branch stats');
  return res.json();
}

export async function getBatchWiseStats(
  date: string,
  branch?: string
): Promise<{ batch: string; present: number; absent: number; total: number; percentage: number }[]> {
  const params = new URLSearchParams({ date });
  if (branch) params.append('branch', branch);
  const res = await fetch(`${API_BASE}/attendance/batch-stats?${params}`);
  if (!res.ok) throw new Error('Failed to fetch batch stats');
  return res.json();
}

export async function getMonthlyTrend(
  year: number,
  branch?: string,
  batch?: string
): Promise<{ month: string; rate: number }[]> {
  const params = new URLSearchParams({ year: String(year) });
  if (branch) params.append('branch', branch);
  if (batch) params.append('batch', batch);
  const res = await fetch(`${API_BASE}/attendance/monthly-trend?${params}`);
  if (!res.ok) throw new Error('Failed to fetch monthly trend');
  return res.json();
}

// ── Student: Individual Report ────────────────────────────────────────

export async function getStudentAttendance(
  studentId: string,
  month?: string       // "2026-06"
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams({ studentId });
  if (month) params.append('month', month);
  const res = await fetch(`${API_BASE}/attendance/student?${params}`);
  if (!res.ok) throw new Error('Failed to fetch student attendance');
  return res.json();
}

export async function getStudentSummary(studentId: string): Promise<StudentAttendanceSummary> {
  const res = await fetch(`${API_BASE}/attendance/student-summary/${studentId}`);
  if (!res.ok) throw new Error('Failed to fetch student summary');
  return res.json();
}

// ── Export / Download ─────────────────────────────────────────────────

export async function exportAttendance(
  format: 'csv' | 'pdf' | 'excel',
  filters: { dateFrom?: string; dateTo?: string; branch?: string; batch?: string }
): Promise<Blob> {
  const params = new URLSearchParams({ format });
  Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
  const res = await fetch(`${API_BASE}/attendance/export?${params}`);
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}