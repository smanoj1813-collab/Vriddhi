import { db } from '../../Firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export interface StudentProfile {
  id: string;
  name: string;
  regNo: string;
  email: string;
  course: string;
  batch: string;
  avatar?: string;
}

export interface StudentAttendance {
  totalClasses: number;
  presentClasses: number;
  percentage: number;
}

export interface UpcomingAssessment {
  id: string;
  title: string;
  subject: string;
  date: string;
  type: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface PendingAssignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
}

export interface FeeStatus {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  dueDate?: string;
}

export interface ClassSchedule {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  timestamp: string;
  read: boolean;
}

const MAX_READS = 500;
let readCount = 0;

function trackRead(n: number) {
  readCount += n;
  if (readCount > MAX_READS) console.warn('[StudentApi] Read cap exceeded');
}

export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  if (readCount >= MAX_READS) return null;
  const q = query(collection(db, 'students'), where('__name__', '==', studentId), limit(1));
  const snap = await getDocs(q);
  trackRead(snap.size);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    name: data.name || '',
    regNo: data.regNo || data.registrationNumber || '',
    email: data.email || '',
    course: data.course || data.department || '',
    batch: data.batch || '',
    avatar: data.avatar,
  };
}

export async function fetchStudentAttendance(studentId: string): Promise<StudentAttendance> {
  if (readCount >= MAX_READS) return { totalClasses: 0, presentClasses: 0, percentage: 0 };
  const q = query(collection(db, 'attendance'), where('studentId', '==', studentId), limit(500));
  const snap = await getDocs(q);
  trackRead(snap.size);
  const records = snap.docs.map((d) => d.data());
  const total = records.length;
  const present = records.filter((r) => r.status === 'present' || r.isPresent === true).length;
  return {
    totalClasses: total,
    presentClasses: present,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
  };
}

export async function fetchUpcomingAssessments(studentId: string): Promise<UpcomingAssessment[]> {
  if (readCount >= MAX_READS) return [];
  const q = query(collection(db, 'assessments'), where('studentIds', 'array-contains', studentId), limit(50));
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as UpcomingAssessment))
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchPendingAssignments(studentId: string): Promise<PendingAssignment[]> {
  if (readCount >= MAX_READS) return [];
  const q = query(collection(db, 'assignments'), where('studentId', '==', studentId), limit(50));
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as PendingAssignment))
    .filter((a) => a.status === 'pending')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export async function fetchFeeStatus(studentId: string): Promise<FeeStatus> {
  if (readCount >= MAX_READS) return { totalFees: 0, paidFees: 0, pendingFees: 0 };
  const q = query(collection(db, 'fees'), where('studentId', '==', studentId), limit(1));
  const snap = await getDocs(q);
  trackRead(snap.size);
  if (snap.empty) return { totalFees: 0, paidFees: 0, pendingFees: 0 };
  const data = snap.docs[0].data();
  return {
    totalFees: data.totalFees || 0,
    paidFees: data.paidFees || 0,
    pendingFees: data.pendingFees || data.totalFees - data.paidFees || 0,
    dueDate: data.dueDate,
  };
}

export async function fetchClassSchedule(studentId: string, dateStr: string): Promise<ClassSchedule[]> {
  if (readCount >= MAX_READS) return [];
  // NOTE: Composite index on (studentId, date) may be required
  const q = query(collection(db, 'schedule'), where('studentId', '==', studentId), where('date', '==', dateStr), limit(20));
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ClassSchedule))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export async function fetchStudentNotifications(studentId: string): Promise<StudentNotification[]> {
  if (readCount >= MAX_READS) return [];
  const q = query(collection(db, 'notifications'), where('studentId', '==', studentId), limit(20));
  const snap = await getDocs(q);
  trackRead(snap.size);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as StudentNotification))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
