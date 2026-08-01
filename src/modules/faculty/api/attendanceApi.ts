import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  DocumentData,
  onSnapshot,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import {
  AttendanceRecord,
  AttendanceStatus,
  DailyAttendanceSummary,
  StudentAttendanceSummary,
  CalendarDayData,
} from '../../../modules/faculty/types/attendance';

const ATTENDANCE_COLLECTION = 'attendance';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AttendanceFilters {
  collegeId: string;
  date?: string;
  branch?: string;
  batch?: string;
  division?: string;
  subject?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface MarkAttendancePayload {
  collegeId: string;
  studentId: string;
  studentName: string;
  regNo: string;
  date: string;
  status: AttendanceStatus;
  subject: string;
  department: string;
  batch: string;
  division: string;
  markedBy: string;
  checkInTime?: string;
  notes?: string;
}

export interface BulkMarkPayload {
  collegeId: string;
  records: Omit<MarkAttendancePayload, 'collegeId'>[];
  markedBy: string;
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function docToAttendanceRecord(docSnap: DocumentData): AttendanceRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    studentId: data.studentId,
    studentName: data.studentName,
    sessionId: data.sessionId || '',
    date: data.date,
    subject: data.subject,
    subjectCode: data.subjectCode || '',
    status: data.status,
    checkInTime: data.checkInTime,
    notes: data.notes,
    markedBy: data.markedBy,
    markedAt: data.markedAt?.toDate?.().toISOString() || data.markedAt,
    branch: data.department || data.branch,
    batch: data.batch,
    division: data.division,
    usn: data.regNo,
    regNo: data.regNo,
  };
}

// ═══════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Mark attendance for a single student
 */
export async function markAttendance(payload: MarkAttendancePayload): Promise<AttendanceRecord> {
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION);

  const existingQuery = query(
    attendanceRef,
    where('collegeId', '==', payload.collegeId),
    where('studentId', '==', payload.studentId),
    where('date', '==', payload.date),
    where('subject', '==', payload.subject)
  );

  const existingSnap = await getDocs(existingQuery);

  if (!existingSnap.empty) {
    const docRef = existingSnap.docs[0].ref;
    await updateDoc(docRef, {
      status: payload.status,
      checkInTime: payload.checkInTime || null,
      notes: payload.notes || null,
      markedBy: payload.markedBy,
      markedAt: Timestamp.now(),
    });
    const updated = await getDoc(docRef);
    return docToAttendanceRecord({ id: updated.id, ...updated.data() } as DocumentData);
  }

  const newDoc = await addDoc(attendanceRef, {
    collegeId: payload.collegeId,
    studentId: payload.studentId,
    studentName: payload.studentName,
    regNo: payload.regNo,
    date: payload.date,
    status: payload.status,
    subject: payload.subject,
    department: payload.department,
    batch: payload.batch,
    division: payload.division,
    markedBy: payload.markedBy,
    markedAt: Timestamp.now(),
    checkInTime: payload.checkInTime || null,
    notes: payload.notes || null,
    createdAt: Timestamp.now(),
  });

  const created = await getDoc(newDoc);
  return docToAttendanceRecord({ id: created.id, ...created.data() } as DocumentData);
}

/**
 * Mark attendance in bulk
 */
export async function markAttendanceBulk(payload: BulkMarkPayload): Promise<AttendanceRecord[]> {
  const batch = writeBatch(db);
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION);

  for (const record of payload.records) {
    const existingQuery = query(
      attendanceRef,
      where('collegeId', '==', payload.collegeId),
      where('studentId', '==', record.studentId),
      where('date', '==', record.date),
      where('subject', '==', record.subject)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      const docRef = existingSnap.docs[0].ref;
      batch.update(docRef, {
        status: record.status,
        checkInTime: record.checkInTime || null,
        notes: record.notes || null,
        markedBy: payload.markedBy,
        markedAt: Timestamp.now(),
      });
    } else {
      const newDocRef = doc(attendanceRef);
      batch.set(newDocRef, {
        collegeId: payload.collegeId,
        studentId: record.studentId,
        studentName: record.studentName,
        regNo: record.regNo,
        date: record.date,
        status: record.status,
        subject: record.subject,
        department: record.department,
        batch: record.batch,
        division: record.division,
        markedBy: payload.markedBy,
        markedAt: Timestamp.now(),
        checkInTime: record.checkInTime || null,
        notes: record.notes || null,
        createdAt: Timestamp.now(),
      });
    }
  }

  await batch.commit();

  const allStudentIds = payload.records.map((r) => r.studentId);
  const fetchQuery = query(
    attendanceRef,
    where('collegeId', '==', payload.collegeId),
    where('date', '==', payload.records[0]?.date),
    where('subject', '==', payload.records[0]?.subject),
    where('studentId', 'in', allStudentIds)
  );
  const fetchSnap = await getDocs(fetchQuery);
  return fetchSnap.docs.map((d) => docToAttendanceRecord({ id: d.id, ...d.data() } as DocumentData));
}

/**
 * Get attendance records with filters - NO orderBy to avoid index requirements
 * All sorting is done client-side
 */
export async function getAttendanceRecords(filters: AttendanceFilters): Promise<AttendanceRecord[]> {
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
  const constraints: any[] = [where('collegeId', '==', filters.collegeId)];

  if (filters.date) constraints.push(where('date', '==', filters.date));
  if (filters.startDate && filters.endDate) {
    constraints.push(where('date', '>=', filters.startDate));
    constraints.push(where('date', '<=', filters.endDate));
  }
  if (filters.branch) constraints.push(where('department', '==', filters.branch));
  if (filters.batch) constraints.push(where('batch', '==', filters.batch));
  if (filters.division) constraints.push(where('division', '==', filters.division));
  if (filters.subject) constraints.push(where('subject', '==', filters.subject));
  if (filters.studentId) constraints.push(where('studentId', '==', filters.studentId));

  // NO orderBy - Firestore will return in document ID order
  // We sort client-side below
  const q = query(attendanceRef, ...constraints);
  const snap = await getDocs(q);
  const records = snap.docs.map((d) => docToAttendanceRecord({ id: d.id, ...d.data() } as DocumentData));

  // Client-side sort by date DESC, then studentName ASC
  return records.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.studentName || '').localeCompare(b.studentName || '');
  });
}

/**
 * Get daily attendance summary
 */
export async function getDailySummary(
  collegeId: string,
  date: string,
  branch?: string,
  batch?: string,
  division?: string
): Promise<DailyAttendanceSummary> {
  const filters: AttendanceFilters = { collegeId, date };
  if (branch && branch !== 'all') filters.branch = branch;
  if (batch && batch !== 'all') filters.batch = batch;
  if (division && division !== 'all') filters.division = division;

  const records = await getAttendanceRecords(filters);

  const summary: DailyAttendanceSummary = {
    date,
    branch: branch || 'all',
    batch: batch || 'all',
    total: records.length,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    onDuty: 0,
    medicalLeave: 0,
    percentage: 0,
  };

  records.forEach((r) => {
    switch (r.status) {
      case 'Present': summary.present++; break;
      case 'Absent': summary.absent++; break;
      case 'Late': summary.late++; break;
      case 'Leave': summary.leave++; break;
      case 'OnDuty': summary.onDuty++; break;
      case 'MedicalLeave': summary.medicalLeave++; break;
    }
  });

  summary.percentage = summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
  return summary;
}

/**
 * Get calendar data for a month
 */
export async function getCalendarData(
  collegeId: string,
  year: number,
  month: number,
  branch?: string,
  batch?: string
): Promise<CalendarDayData[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const filters: AttendanceFilters = {
    collegeId,
    startDate,
    endDate,
  };
  if (branch && branch !== 'all') filters.branch = branch;
  if (batch && batch !== 'all') filters.batch = batch;

  const records = await getAttendanceRecords(filters);

  const byDate: Record<string, AttendanceRecord[]> = {};
  records.forEach((r) => {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  });

  const result: CalendarDayData[] = [];
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayRecords = byDate[dateStr] || [];

    if (dayRecords.length === 0) {
      result.push({
        date: dateStr,
        present: 0,
        absent: 0,
        total: 0,
        percentage: 0,
        hasData: false,
        sessions: 0,
      });
      continue;
    }

    const present = dayRecords.filter((r) => r.status === 'Present').length;
    const subjects = new Set(dayRecords.map((r) => r.subject));

    result.push({
      date: dateStr,
      present,
      absent: dayRecords.filter((r) => r.status === 'Absent').length,
      total: dayRecords.length,
      percentage: Math.round((present / dayRecords.length) * 100),
      hasData: true,
      sessions: subjects.size,
    });
  }

  return result;
}

/**
 * Get branch-wise statistics
 */
export async function getBranchStats(
  collegeId: string,
  date: string,
  batch?: string
): Promise<{ branch: string; present: number; absent: number; total: number; percentage: number }[]> {
  const filters: AttendanceFilters = { collegeId, date };
  if (batch && batch !== 'all') filters.batch = batch;

  const records = await getAttendanceRecords(filters);

  const byBranch: Record<string, { present: number; absent: number; total: number }> = {};

  records.forEach((r) => {
    const branch = r.branch || 'Unknown';
    if (!byBranch[branch]) byBranch[branch] = { present: 0, absent: 0, total: 0 };
    byBranch[branch].total++;
    if (r.status === 'Present') byBranch[branch].present++;
    else if (r.status === 'Absent') byBranch[branch].absent++;
  });

  return Object.entries(byBranch).map(([branch, stats]) => ({
    branch,
    present: stats.present,
    absent: stats.absent,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
  }));
}

/**
 * Get batch-wise statistics
 */
export async function getBatchStats(
  collegeId: string,
  date: string,
  branch?: string
): Promise<{ batch: string; present: number; absent: number; total: number; percentage: number }[]> {
  const filters: AttendanceFilters = { collegeId, date };
  if (branch && branch !== 'all') filters.branch = branch;

  const records = await getAttendanceRecords(filters);

  const byBatch: Record<string, { present: number; absent: number; total: number }> = {};

  records.forEach((r) => {
    const batch = r.batch || 'Unknown';
    if (!byBatch[batch]) byBatch[batch] = { present: 0, absent: 0, total: 0 };
    byBatch[batch].total++;
    if (r.status === 'Present') byBatch[batch].present++;
    else if (r.status === 'Absent') byBatch[batch].absent++;
  });

  return Object.entries(byBatch).map(([batch, stats]) => ({
    batch,
    present: stats.present,
    absent: stats.absent,
    total: stats.total,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
  }));
}

/**
 * Get monthly attendance trend
 */
export async function getMonthlyTrend(
  collegeId: string,
  year: number,
  branch?: string,
  batch?: string
): Promise<{ month: string; rate: number }[]> {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result: { month: string; rate: number }[] = [];

  for (let m = 0; m < 12; m++) {
    const startDate = `${year}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, m + 1, 0).getDate();
    const endDate = `${year}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const filters: AttendanceFilters = { collegeId, startDate, endDate };
    if (branch && branch !== 'all') filters.branch = branch;
    if (batch && batch !== 'all') filters.batch = batch;

    const records = await getAttendanceRecords(filters);
    const present = records.filter((r) => r.status === 'Present').length;
    const rate = records.length > 0 ? Math.round((present / records.length) * 100) : 0;

    result.push({ month: months[m], rate });
  }

  return result;
}

/**
 * Get student attendance summary
 */
export async function getStudentAttendanceSummary(
  collegeId: string,
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<StudentAttendanceSummary | null> {
  const filters: AttendanceFilters = { collegeId, studentId };
  if (startDate && endDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  const records = await getAttendanceRecords(filters);
  if (records.length === 0) return null;

  const firstRecord = records[0];
  const summary: StudentAttendanceSummary = {
    studentId,
    name: firstRecord.studentName || 'Unknown',
    regNo: firstRecord.regNo || '',
    branch: firstRecord.branch || '',
    batch: firstRecord.batch || '',
    division: firstRecord.division || '',
    totalClasses: records.length,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    onDuty: 0,
    medicalLeave: 0,
    percentage: 0,
    requiredPercentage: 75,
    monthlyBreakdown: [],
  };

  const byMonth: Record<string, { total: number; present: number; absent: number }> = {};

  records.forEach((r) => {
    switch (r.status) {
      case 'Present': summary.present++; break;
      case 'Absent': summary.absent++; break;
      case 'Late': summary.late++; break;
      case 'Leave': summary.leave++; break;
      case 'OnDuty': summary.onDuty++; break;
      case 'MedicalLeave': summary.medicalLeave++; break;
    }

    const month = r.date.substring(0, 7);
    if (!byMonth[month]) byMonth[month] = { total: 0, present: 0, absent: 0 };
    byMonth[month].total++;
    if (r.status === 'Present') byMonth[month].present++;
    else if (r.status === 'Absent') byMonth[month].absent++;
  });

  summary.percentage = summary.totalClasses > 0 ? Math.round((summary.present / summary.totalClasses) * 100) : 0;

  summary.monthlyBreakdown = Object.entries(byMonth).map(([month, stats]) => ({
    month,
    total: stats.total,
    present: stats.present,
    absent: stats.absent,
    percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
  })).sort((a, b) => a.month.localeCompare(b.month));

  return summary;
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, ATTENDANCE_COLLECTION, recordId));
}

/**
 * Real-time listener - NO orderBy to avoid index requirements
 */
export function subscribeToAttendance(
  filters: AttendanceFilters,
  callback: (records: AttendanceRecord[]) => void
): () => void {
  const attendanceRef = collection(db, ATTENDANCE_COLLECTION);
  const constraints: any[] = [where('collegeId', '==', filters.collegeId)];

  if (filters.date) constraints.push(where('date', '==', filters.date));
  if (filters.branch) constraints.push(where('department', '==', filters.branch));
  if (filters.batch) constraints.push(where('batch', '==', filters.batch));
  if (filters.division) constraints.push(where('division', '==', filters.division));
  if (filters.subject) constraints.push(where('subject', '==', filters.subject));
  if (filters.studentId) constraints.push(where('studentId', '==', filters.studentId));

  // NO orderBy - client-side sort only
  const q = query(attendanceRef, ...constraints);

  return onSnapshot(q, (snapshot: QuerySnapshot) => {
    const records = snapshot.docs.map((d) =>
      docToAttendanceRecord({ id: d.id, ...d.data() } as DocumentData)
    );
    // Client-side sort
    records.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.studentName || '').localeCompare(b.studentName || '');
    });
    callback(records);
  });
}

/**
 * Export to CSV
 */
export function exportToCSV(records: AttendanceRecord[]): string {
  const headers = ['Date', 'Student Name', 'Reg No', 'Subject', 'Status', 'Branch', 'Batch', 'Division', 'Marked By'];
  const rows = records.map((r) => [
    r.date,
    r.studentName || '',
    r.regNo || '',
    r.subject,
    r.status,
    r.branch || '',
    r.batch || '',
    r.division || '',
    r.markedBy,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '\\"')}"`).join(','))].join('\n');
  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
