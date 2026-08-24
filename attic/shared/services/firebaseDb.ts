// src/services/firebaseDb.ts
import { ref, get, set, push, update, remove, onValue, off } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const rtdb = getDatabase();

// ===== STUDENTS =====
export interface Student {
  id: string;
  name: string;
  regNo: string;
  mentor: string;
  division: string;
  batch: string;
  email?: string;
  phone?: string;
}

export async function getStudents(): Promise<Student[]> {
  const snapshot = await get(ref(rtdb, 'students'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([id, student]) => ({ ...(student as object), id })) as Student[];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const snapshot = await get(ref(rtdb, `students/${id}`));
  if (!snapshot.exists()) return null;
  return { ...snapshot.val(), id } as Student;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
  const newRef = push(ref(rtdb, 'students'));
  await set(newRef, student);
  return newRef.key!;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  await update(ref(rtdb, `students/${id}`), data);
}

export async function deleteStudent(id: string): Promise<void> {
  await remove(ref(rtdb, `students/${id}`));
}

// ===== ATTENDANCE =====
export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  division: string;
  markedBy: string;
}

export async function markAttendance(record: Omit<AttendanceRecord, 'id'>): Promise<string> {
  const newRef = push(ref(rtdb, 'attendance'));
  await set(newRef, { ...record, timestamp: new Date().toISOString() });
  return newRef.key!;
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const snapshot = await get(ref(rtdb, 'attendance'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data)
    .filter(([_, record]) => (record as AttendanceRecord).date === date)
    .map(([id, record]) => ({ ...(record as object), id })) as AttendanceRecord[];
}

export async function getAttendanceByStudent(studentId: string): Promise<AttendanceRecord[]> {
  const snapshot = await get(ref(rtdb, 'attendance'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data)
    .filter(([_, record]) => (record as AttendanceRecord).studentId === studentId)
    .map(([id, record]) => ({ ...(record as object), id })) as AttendanceRecord[];
}

// ===== ASSESSMENTS =====
export interface Assessment {
  id: string;
  name: string;
  date: string;
  division: string;
  subject: string;
  totalMarks: number;
  createdBy: string;
}

export async function getAssessments(): Promise<Assessment[]> {
  const snapshot = await get(ref(rtdb, 'assessments'));
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  return Object.entries(data).map(([id, a]) => ({ ...(a as object), id })) as Assessment[];
}

export async function addAssessment(assessment: Omit<Assessment, 'id'>): Promise<string> {
  const newRef = push(ref(rtdb, 'assessments'));
  await set(newRef, assessment);
  return newRef.key!;
}

// ===== REALTIME LISTENERS =====
export function subscribeToStudents(callback: (students: Student[]) => void) {
  const studentsRef = ref(rtdb, 'students');
  onValue(studentsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const students = Object.entries(data).map(([id, s]) => ({ ...(s as object), id })) as Student[];
    callback(students);
  });
  return () => off(studentsRef);
}

export function subscribeToAttendance(date: string, callback: (records: AttendanceRecord[]) => void) {
  const attendanceRef = ref(rtdb, 'attendance');
  onValue(attendanceRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const data = snapshot.val();
    const records = Object.entries(data)
      .filter(([_, r]) => (r as AttendanceRecord).date === date)
      .map(([id, r]) => ({ ...(r as object), id })) as AttendanceRecord[];
    callback(records);
  });
  return () => off(attendanceRef);
}
