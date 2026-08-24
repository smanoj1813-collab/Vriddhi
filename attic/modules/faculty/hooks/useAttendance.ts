
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, getDocs, limit, Timestamp
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type {
  AttendanceRecord,
  CalendarDayData,
  DailyAttendanceSummary,
  AttendanceStatus,
} from '../types/attendance';

// ─── Types ────────────────────────────────────────────────────────────────

export interface AttendanceFilters {
  collegeId: string;
  date?: string;
  branch?: string;
  batch?: string;
  division?: string;
  subject?: string;
  studentId?: string;
}

export interface MarkAttendancePayload {
  collegeId: string;
  studentId: string;
  sessionId: string;
  date: string;
  subject: string;
  subjectCode: string;
  status: AttendanceStatus;
  notes?: string;
  markedBy: string;
  branch: string;
  batch: string;
  division: string;
  usn?: string;
  regNo?: string;
}

// ─── Read Budget ───────────────────────────────────────────────────────────

const READ_LOG_KEY = 'vriddhi_attendance_reads';
const MAX_READS_PER_SESSION = 500;

function logRead(count: number) {
  try {
    const current = parseInt(sessionStorage.getItem(READ_LOG_KEY) || '0', 10);
    sessionStorage.setItem(READ_LOG_KEY, String(current + count));
  } catch { /* ignore */ }
}

function canRead(): boolean {
  try {
    return parseInt(sessionStorage.getItem(READ_LOG_KEY) || '0', 10) < MAX_READS_PER_SESSION;
  } catch { return true; }
}

// ─── Helper: Fetch attendance records ────────────────────────────────────

async function getAttendanceRecords(filters: AttendanceFilters): Promise<AttendanceRecord[]> {
  const { collegeId, date, branch, batch, division, subject, studentId } = filters;
  if (!collegeId) return [];

  const constraints: any[] = [where('collegeId', '==', collegeId)];
  if (date) constraints.push(where('date', '==', date));
  if (branch && branch !== 'all') constraints.push(where('branch', '==', branch));
  if (batch && batch !== 'all') constraints.push(where('batch', '==', batch));
  if (division && division !== 'all') constraints.push(where('division', '==', division));
  if (subject) constraints.push(where('subject', '==', subject));
  if (studentId) constraints.push(where('studentId', '==', studentId));

  const q = query(collection(db, 'attendanceRecords'), ...constraints, limit(500));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      sessionId: data.sessionId || '',
      date: data.date || '',
      subject: data.subject || '',
      subjectCode: data.subjectCode || '',
      status: (data.status as AttendanceStatus) || 'Present',
      checkInTime: data.checkInTime,
      notes: data.notes,
      markedBy: data.markedBy || '',
      markedAt: data.markedAt || '',
      branch: data.branch,
      batch: data.batch,
      division: data.division,
      usn: data.usn,
      regNo: data.regNo,
    } as AttendanceRecord;
  });
}

// ─── Helper: Get daily summary ───────────────────────────────────────────

async function getDailySummary(
  collegeId: string,
  date: string,
  branch?: string,
  batch?: string,
  division?: string
): Promise<DailyAttendanceSummary | null> {
  if (!collegeId || !date) return null;

  const constraints: any[] = [
    where('collegeId', '==', collegeId),
    where('date', '==', date)
  ];
  if (branch && branch !== 'all') constraints.push(where('branch', '==', branch));
  if (batch && batch !== 'all') constraints.push(where('batch', '==', batch));
  if (division && division !== 'all') constraints.push(where('division', '==', division));

  const q = query(collection(db, 'attendanceSummary'), ...constraints, limit(1));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  if (snap.empty) {
    return {
      date,
      branch: branch || 'all',
      batch: batch || 'all',
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      leave: 0,
      onDuty: 0,
      medicalLeave: 0,
      percentage: 0,
    };
  }

  const data = snap.docs[0].data();
  return {
    date: data.date || date,
    branch: data.branch || branch || 'all',
    batch: data.batch || batch || 'all',
    total: data.total || 0,
    present: data.present || 0,
    absent: data.absent || 0,
    late: data.late || 0,
    leave: data.leave || 0,
    onDuty: data.onDuty || 0,
    medicalLeave: data.medicalLeave || 0,
    percentage: data.percentage || 0,
  };
}

// ─── Helper: Get calendar data ───────────────────────────────────────────

async function getCalendarData(
  collegeId: string,
  year: number,
  month: number,
  branch?: string,
  batch?: string
): Promise<CalendarDayData[]> {
  if (!collegeId) return [];

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`;

  const constraints: any[] = [
    where('collegeId', '==', collegeId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  ];
  if (branch && branch !== 'all') constraints.push(where('branch', '==', branch));
  if (batch && batch !== 'all') constraints.push(where('batch', '==', batch));

  const q = query(collection(db, 'attendanceSummary'), ...constraints, limit(100));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result: CalendarDayData[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = snap.docs.find(d => d.data().date === dateStr);

    if (dayData) {
      const data = dayData.data();
      result.push({
        date: dateStr,
        present: data.present || 0,
        absent: data.absent || 0,
        total: data.total || 0,
        percentage: data.percentage || 0,
        hasData: true,
        sessions: data.sessions || 0,
      });
    } else {
      result.push({
        date: dateStr,
        present: 0,
        absent: 0,
        total: 0,
        percentage: 0,
        hasData: false,
        sessions: 0,
      });
    }
  }

  return result;
}

// ─── Helper: Get branch stats ────────────────────────────────────────────

async function getBranchStats(collegeId: string, date: string, batch?: string): Promise<{ branch: string; present: number; absent: number; total: number; percentage: number }[]> {
  if (!collegeId || !date) return [];

  const constraints: any[] = [
    where('collegeId', '==', collegeId),
    where('date', '==', date)
  ];
  if (batch && batch !== 'all') constraints.push(where('batch', '==', batch));

  const q = query(collection(db, 'attendanceSummary'), ...constraints, limit(100));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  const branchMap: Record<string, { present: number; absent: number; total: number }> = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const branch = data.branch || 'Unknown';
    if (!branchMap[branch]) {
      branchMap[branch] = { present: 0, absent: 0, total: 0 };
    }
    branchMap[branch].present += data.present || 0;
    branchMap[branch].absent += data.absent || 0;
    branchMap[branch].total += data.total || 0;
  });

  return Object.entries(branchMap).map(([branch, stats]) => ({
    branch,
    present: stats.present,
    absent: stats.absent,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
  }));
}

// ─── Helper: Get batch stats ───────────────────────────────────────────

async function getBatchStats(collegeId: string, date: string, branch?: string): Promise<{ batch: string; present: number; absent: number; total: number; percentage: number }[]> {
  if (!collegeId || !date) return [];

  const constraints: any[] = [
    where('collegeId', '==', collegeId),
    where('date', '==', date)
  ];
  if (branch && branch !== 'all') constraints.push(where('branch', '==', branch));

  const q = query(collection(db, 'attendanceSummary'), ...constraints, limit(100));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  const batchMap: Record<string, { present: number; absent: number; total: number }> = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const batch = data.batch || 'Unknown';
    if (!batchMap[batch]) {
      batchMap[batch] = { present: 0, absent: 0, total: 0 };
    }
    batchMap[batch].present += data.present || 0;
    batchMap[batch].absent += data.absent || 0;
    batchMap[batch].total += data.total || 0;
  });

  return Object.entries(batchMap).map(([batch, stats]) => ({
    batch,
    present: stats.present,
    absent: stats.absent,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
  }));
}

// ─── Helper: Get monthly trend ───────────────────────────────────────────

async function getMonthlyTrend(collegeId: string, year: number, branch?: string, batch?: string): Promise<{ month: string; rate: number }[]> {
  if (!collegeId) return [];

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const constraints: any[] = [
    where('collegeId', '==', collegeId),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  ];
  if (branch && branch !== 'all') constraints.push(where('branch', '==', branch));
  if (batch && batch !== 'all') constraints.push(where('batch', '==', batch));

  const q = query(collection(db, 'attendanceSummary'), ...constraints, limit(500));
  const snap = await getDocs(q);
  logRead(snap.size + 1);

  const monthMap: Record<string, { present: number; total: number }> = {};

  snap.docs.forEach(d => {
    const data = d.data();
    const month = data.date?.substring(0, 7) || 'Unknown';
    if (!monthMap[month]) {
      monthMap[month] = { present: 0, total: 0 };
    }
    monthMap[month].present += data.present || 0;
    monthMap[month].total += data.total || 0;
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, stats]) => ({
      month,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
    }));
}

// ─── Main Hook ───────────────────────────────────────────────────────────

export function useAttendance(options: {
  collegeId: string;
  date?: string;
  branch?: string;
  batch?: string;
  division?: string;
  subject?: string;
  studentId?: string;
  enableRealtime?: boolean;
}) {
  const {
    collegeId,
    date: initialDate = new Date().toISOString().split('T')[0],
    branch: initialBranch = 'all',
    batch: initialBatch = 'all',
    division: initialDivision = 'all',
    subject: initialSubject,
    studentId: initialStudentId,
  } = options;

  const [date, setDate] = useState(initialDate);
  const [branch, setBranch] = useState(initialBranch);
  const [batch, setBatch] = useState(initialBatch);
  const [division, setDivision] = useState(initialDivision);
  const [subject, setSubject] = useState(initialSubject);
  const [studentId, setStudentId] = useState(initialStudentId);

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyAttendanceSummary | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [branchStats, setBranchStats] = useState<{ branch: string; present: number; absent: number; total: number; percentage: number }[]>([]);
  const [batchStats, setBatchStats] = useState<{ batch: string; present: number; absent: number; total: number; percentage: number }[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; rate: number }[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const buildFilters = useCallback((): AttendanceFilters => {
    const filters: AttendanceFilters = { collegeId };
    if (date) filters.date = date;
    if (branch && branch !== 'all') filters.branch = branch;
    if (batch && batch !== 'all') filters.batch = batch;
    if (division && division !== 'all') filters.division = division;
    if (subject) filters.subject = subject;
    if (studentId) filters.studentId = studentId;
    return filters;
  }, [collegeId, date, branch, batch, division, subject, studentId]);

  const fetchAllData = useCallback(async () => {
    if (!collegeId) return;
    if (!canRead()) {
      setError('Read budget exceeded for this session. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters = buildFilters();

      const [recordsData, summary, branches, batches, trend] = await Promise.all([
        getAttendanceRecords(filters),
        getDailySummary(collegeId, date, branch, batch, division),
        getBranchStats(collegeId, date, batch),
        getBatchStats(collegeId, date, branch),
        getMonthlyTrend(collegeId, new Date().getFullYear(), branch, batch),
      ]);

      logRead(5);

      if (isMountedRef.current) {
        setRecords(recordsData);
        setDailySummary(summary);
        setBranchStats(branches);
        setBatchStats(batches);
        setMonthlyTrend(trend);
      }
    } catch (err: any) {
      console.error('Attendance fetch error:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load attendance data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [collegeId, date, branch, batch, division, buildFilters]);

  const fetchCalendarData = useCallback(async () => {
    if (!collegeId) return;
    if (!canRead()) return;

    try {
      const year = new Date(date).getFullYear();
      const month = new Date(date).getMonth();
      const data = await getCalendarData(collegeId, year, month, branch, batch);
      logRead(data.filter(d => d.hasData).length + 1);

      if (isMountedRef.current) {
        setCalendarData(data);
      }
    } catch (err: any) {
      console.error('Calendar fetch error:', err);
    }
  }, [collegeId, date, branch, batch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllData();
      fetchCalendarData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchAllData, fetchCalendarData]);

  const refresh = useCallback(async () => {
    await fetchAllData();
    await fetchCalendarData();
  }, [fetchAllData, fetchCalendarData]);

  const setFilters = useCallback((filters: Partial<AttendanceFilters>) => {
    if (filters.date !== undefined) setDate(filters.date);
    if (filters.branch !== undefined) setBranch(filters.branch || 'all');
    if (filters.batch !== undefined) setBatch(filters.batch || 'all');
    if (filters.division !== undefined) setDivision(filters.division || 'all');
    if (filters.subject !== undefined) setSubject(filters.subject);
    if (filters.studentId !== undefined) setStudentId(filters.studentId);
  }, []);

  return {
    records,
    dailySummary,
    calendarData,
    branchStats,
    batchStats,
    monthlyTrend,
    loading,
    error,
    refresh,
    setFilters,
  };
}