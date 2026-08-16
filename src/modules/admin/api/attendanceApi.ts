// api/attendanceApi.ts
// ============================================
// ATTENDANCE API — Real Firestore Operations
// ============================================

import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, Timestamp, writeBatch,
  QueryConstraint, onSnapshot, Unsubscribe,
} from 'firebase/firestore';

let db: any;
try {
  const firebaseMod = require('../firebase');
  db = firebaseMod.db;
} catch {
  try {
    const firebaseMod = require('../config/firebase');
    db = firebaseMod.db;
  } catch {
    console.warn('[attendanceApi] Firebase db import failed.');
  }
}

import type {
  AttendanceRecord,
  AttendanceSummary,
  ClassSession,
} from '../types/attendance';

// ─── Helpers ───────────────────────────────

function toISO(ts: any): string {
  if (!ts) return '';
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return '';
}

// ═══════════════════════════════════════════════════════════════════════
// Class Sessions
// ═══════════════════════════════════════════════════════════════════════

export async function createClassSession(data: Omit<ClassSession, 'id'>): Promise<ClassSession> {
  const now = Timestamp.now();
  const payload = { ...data, createdAt: now, updatedAt: now };
  const ref = await addDoc(collection(db, 'classSessions'), payload);
  return { id: ref.id, ...data } as ClassSession;
}

export async function getClassSession(id: string): Promise<ClassSession | null> {
  const snap = await getDoc(doc(db, 'classSessions', id));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    id: snap.id,
    ...d,
    date: d.date || '',
    startTime: d.startTime || '',
    endTime: d.endTime || '',
    markedAt: toISO(d.markedAt),
  } as ClassSession;
}

export interface ListSessionsFilters {
  collegeId?: string;
  branch?: string;
  batch?: string;
  facultyId?: string;
  date?: string;
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export async function listClassSessions(filters: ListSessionsFilters = {}): Promise<ClassSession[]> {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc'), orderBy('startTime', 'desc')];
  if (filters.collegeId) constraints.push(where('collegeId', '==', filters.collegeId));
  if (filters.branch) constraints.push(where('branch', '==', filters.branch));
  if (filters.batch) constraints.push(where('batch', '==', filters.batch));
  if (filters.facultyId) constraints.push(where('facultyId', '==', filters.facultyId));
  if (filters.date) constraints.push(where('date', '==', filters.date));
  if (filters.status) constraints.push(where('status', '==', filters.status));

  const q = query(collection(db, 'classSessions'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      date: data.date || '',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      markedAt: toISO(data.markedAt),
    } as ClassSession;
  });
}

export async function updateClassSession(id: string, updates: Partial<ClassSession>): Promise<void> {
  await updateDoc(doc(db, 'classSessions', id), { ...updates, updatedAt: Timestamp.now() });
}

export async function markAttendanceForSession(
  sessionId: string,
  records: Array<{ studentId: string; status: AttendanceRecord['status']; note?: string }>
): Promise<void> {
  const batch = writeBatch(db);
  const sessionRef = doc(db, 'classSessions', sessionId);
  const now = Timestamp.now();

  for (const r of records) {
    const ref = doc(collection(db, 'attendanceRecords'));
    batch.set(ref, {
      sessionId,
      studentId: r.studentId,
      status: r.status,
      note: r.note || '',
      markedAt: now,
      createdAt: now,
    });
  }

  batch.update(sessionRef, { attendanceMarked: true, markedAt: now, updatedAt: now });
  await batch.commit();
}

// ═══════════════════════════════════════════════════════════════════════
// Attendance Records
// ═══════════════════════════════════════════════════════════════════════

export async function listAttendanceRecords(filters: {
  sessionId?: string;
  studentId?: string;
  date?: string;
  collegeId?: string;
}): Promise<AttendanceRecord[]> {
  const constraints: QueryConstraint[] = [orderBy('markedAt', 'desc')];
  if (filters.sessionId) constraints.push(where('sessionId', '==', filters.sessionId));
  if (filters.studentId) constraints.push(where('studentId', '==', filters.studentId));
  if (filters.collegeId) constraints.push(where('collegeId', '==', filters.collegeId));

  const q = query(collection(db, 'attendanceRecords'), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      markedAt: toISO(data.markedAt),
      date: data.date || '',
    } as AttendanceRecord;
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Student Attendance Summary
// ═══════════════════════════════════════════════════════════════════════

export async function getStudentAttendanceSummary(
  studentId: string,
  classSessionIds?: string[]
): Promise<AttendanceSummary | null> {
  const constraints: QueryConstraint[] = [where('studentId', '==', studentId)];
  if (classSessionIds && classSessionIds.length > 0) {
    // Firestore 'in' supports max 10; chunk if needed
    constraints.push(where('sessionId', 'in', classSessionIds.slice(0, 10)));
  }

  const q = query(collection(db, 'attendanceRecords'), ...constraints);
  const snap = await getDocs(q);

  let present = 0, absent = 0, leave = 0, late = 0, onDuty = 0, medicalLeave = 0;
  snap.docs.forEach((d) => {
    const status = d.data().status as AttendanceRecord['status'];
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'leave') leave++;
    else if (status === 'late') late++;
    else if (status === 'onDuty') onDuty++;
    else if (status === 'medicalLeave') medicalLeave++;
  });

  const total = snap.docs.length;
  return {
    studentId,
    studentName: '', // filled by caller
    regNo: '',
    totalClasses: total,
    present,
    absent,
    leave,
    late,
    onDuty,
    medicalLeave,
    percentage: total > 0 ? ((present + onDuty) / total) * 100 : 0,
  };
}

export async function getAllStudentsAttendanceSummary(filters: {
  collegeId?: string;
  branch?: string;
  batch?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AttendanceSummary[]> {
  // Step 1: get relevant sessions
  const sessionConstraints: QueryConstraint[] = [];
  if (filters.collegeId) sessionConstraints.push(where('collegeId', '==', filters.collegeId));
  if (filters.branch) sessionConstraints.push(where('branch', '==', filters.branch));
  if (filters.batch) sessionConstraints.push(where('batch', '==', filters.batch));

  const sessionQ = query(collection(db, 'classSessions'), ...sessionConstraints);
  const sessionSnap = await getDocs(sessionQ);
  const sessionIds = sessionSnap.docs.map((d) => d.id);
  const sessionMap = new Map(sessionSnap.docs.map((d) => [d.id, d.data()]));

  if (sessionIds.length === 0) return [];

  // Step 2: get all attendance records for those sessions
  // Firestore 'in' max 10 — chunk it
  const allRecords: AttendanceRecord[] = [];
  for (let i = 0; i < sessionIds.length; i += 10) {
    const chunk = sessionIds.slice(i, i + 10);
    const recQ = query(collection(db, 'attendanceRecords'), where('sessionId', 'in', chunk));
    const recSnap = await getDocs(recQ);
    recSnap.docs.forEach((d) => {
      allRecords.push({ id: d.id, ...d.data(), markedAt: toISO(d.data().markedAt) } as AttendanceRecord);
    });
  }

  // Step 3: aggregate per student
  const byStudent = new Map<string, { counts: Record<string, number>; regNo: string; name: string }>();

  for (const rec of allRecords) {
    const sid = rec.studentId;
    if (!byStudent.has(sid)) {
      byStudent.set(sid, { counts: {}, regNo: rec.regNo || '', name: rec.studentName || '' });
    }
    const entry = byStudent.get(sid)!;
    entry.counts[rec.status] = (entry.counts[rec.status] || 0) + 1;
    if (rec.regNo) entry.regNo = rec.regNo;
    if (rec.studentName) entry.name = rec.studentName;
  }

  // Step 4: also fetch student names from users/students collection if missing
  const studentIds = Array.from(byStudent.keys());
  const studentNames = new Map<string, { name: string; regNo: string }>();

  for (let i = 0; i < studentIds.length; i += 10) {
    const chunk = studentIds.slice(i, i + 10);
    try {
      const stQ = query(collection(db, 'students'), where('__name__', 'in', chunk));
      const stSnap = await getDocs(stQ);
      stSnap.docs.forEach((d) => {
        const data = d.data();
        studentNames.set(d.id, { name: data.name || data.displayName || '', regNo: data.regNo || data.registrationNumber || '' });
      });
    } catch {
      // students collection may not exist or have different schema
    }
  }

  return Array.from(byStudent.entries()).map(([studentId, data]) => {
    const c = data.counts;
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    const present = c['present'] || 0;
    const absent = c['absent'] || 0;
    const leave = c['leave'] || 0;
    const late = c['late'] || 0;
    const onDuty = c['onDuty'] || 0;
    const medicalLeave = c['medicalLeave'] || 0;
    const name = data.name || studentNames.get(studentId)?.name || 'Unknown';
    const regNo = data.regNo || studentNames.get(studentId)?.regNo || '';

    return {
      studentId,
      studentName: name,
      regNo,
      totalClasses: total,
      present,
      absent,
      leave,
      late,
      onDuty,
      medicalLeave,
      percentage: total > 0 ? ((present + onDuty) / total) * 100 : 0,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Faculty lookup (for resolving facultyName from facultyId)
// ═══════════════════════════════════════════════════════════════════════

export async function getFacultyMap(collegeId?: string): Promise<Map<string, { name: string; id: string }>> {
  const map = new Map<string, { name: string; id: string }>();
  try {
    const constraints: QueryConstraint[] = [];
    if (collegeId) constraints.push(where('collegeId', '==', collegeId));
    const qry = query(collection(db, 'faculty'), ...constraints);
    const snap = await getDocs(qry);
    snap.docs.forEach((d) => {
      const data = d.data();
      map.set(d.id, { name: data.name || data.displayName || 'Unknown', id: d.id });
    });
  } catch (e) {
    console.warn('[attendanceApi] faculty fetch failed', e);
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════
// Realtime listener for sessions (optional)
// ═══════════════════════════════════════════════════════════════════════

export function subscribeToSessions(
  filters: ListSessionsFilters,
  callback: (sessions: ClassSession[]) => void
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy('date', 'desc'), orderBy('startTime', 'desc')];
  if (filters.collegeId) constraints.push(where('collegeId', '==', filters.collegeId));
  if (filters.branch) constraints.push(where('branch', '==', filters.branch));
  if (filters.batch) constraints.push(where('batch', '==', filters.batch));
  if (filters.facultyId) constraints.push(where('facultyId', '==', filters.facultyId));
  if (filters.date) constraints.push(where('date', '==', filters.date));
  if (filters.status) constraints.push(where('status', '==', filters.status));

  const q = query(collection(db, 'classSessions'), ...constraints);
  return onSnapshot(q, (snap) => {
    const sessions = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        date: data.date || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        markedAt: toISO(data.markedAt),
      } as ClassSession;
    });
    callback(sessions);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Stats aggregation
// ═══════════════════════════════════════════════════════════════════════

export async function getAttendanceStats(filters: {
  collegeId?: string;
  branch?: string;
  batch?: string;
  date?: string;
}): Promise<{
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  avgPercentage: number;
}> {
  const summary = await getAllStudentsAttendanceSummary(filters);
  if (summary.length === 0) {
    return { totalClasses: 0, present: 0, absent: 0, late: 0, leave: 0, avgPercentage: 0 };
  }

  const totalClasses = summary.reduce((acc, s) => acc + s.totalClasses, 0);
  const present = summary.reduce((acc, s) => acc + s.present, 0);
  const absent = summary.reduce((acc, s) => acc + s.absent, 0);
  const late = summary.reduce((acc, s) => acc + s.late, 0);
  const leave = summary.reduce((acc, s) => acc + s.leave + s.medicalLeave, 0);
  const avgPercentage = summary.reduce((acc, s) => acc + s.percentage, 0) / summary.length;

  return { totalClasses, present, absent, late, leave, avgPercentage };
}