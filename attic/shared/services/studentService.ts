// ============================================================================
// Firebase Service - Student Portal Operations
// ============================================================================

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
  DocumentData
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db } from '@/Firebase/config'; // Fixed: capital F in Firebase
import { getStorage } from 'firebase/storage';
const storage = getStorage(); // Fixed: import storage separately if exported

import {
  ScheduleItem,
  AttendanceRecord,
  AttendanceSummary,
  Assignment,
  AssignmentSubmission,
  FeeStructure,
  PaymentRecord
} from '../types/student';

// ============================================================================
// SCHEDULE SERVICES
// ============================================================================

export const getStudentSchedule = async (
  studentId: string,
  startDate: string,
  endDate: string
): Promise<ScheduleItem[]> => {
  const q = query(
    collection(db, 'schedules'),
    where('studentIds', 'array-contains', studentId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
};

export const subscribeToSchedule = (
  studentId: string,
  callback: (items: ScheduleItem[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'schedules'),
    where('studentIds', 'array-contains', studentId),
    orderBy('date', 'asc')
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduleItem));
    callback(items);
  });
  return unsubscribe;
};

// ============================================================================
// ATTENDANCE SERVICES
// ============================================================================

export const getAttendanceRecords = async (
  studentId: string,
  month?: string // YYYY-MM format
): Promise<AttendanceRecord[]> => {
  let q = query(
    collection(db, 'attendance'),
    where('studentId', '==', studentId),
    orderBy('date', 'desc')
  );

  if (month) {
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-31`;
    q = query(q, where('date', '>=', startOfMonth), where('date', '<=', endOfMonth));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
};

export const getAttendanceSummary = async (studentId: string): Promise<AttendanceSummary> => {
  const records = await getAttendanceRecords(studentId);

  const totalDays = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;

  // Monthly breakdown
  const monthlyMap = new Map<string, { present: number; absent: number; late: number; total: number }>();
  records.forEach(r => {
    const month = r.date.substring(0, 7); // YYYY-MM
    const current = monthlyMap.get(month) || { present: 0, absent: 0, late: 0, total: 0 };
    current.total += 1;
    if (r.status === 'present') current.present += 1;
    if (r.status === 'absent') current.absent += 1;
    if (r.status === 'late') current.late += 1;
    monthlyMap.set(month, current);
  });

  const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    present: data.present,
    absent: data.absent,
    late: data.late,
    total: data.total,
    percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
  })).sort((a, b) => a.month.localeCompare(b.month));

  return {
    subject: 'Overall',
    subjectCode: 'ALL',
    totalClasses: totalDays,
    totalDays,
    present,
    absent,
    late,
    percentage: totalDays > 0 ? Math.round((present / totalDays) * 100) : 0,
    requiredPercentage: 75,
    isShortage: totalDays > 0 && (present / totalDays) * 100 < 75,
    monthlyBreakdown
  };
};

// ============================================================================
// ASSIGNMENT SERVICES
// ============================================================================

export const getStudentAssignments = async (studentId: string): Promise<Assignment[]> => {
  const q = query(
    collection(db, 'assignments'),
    where('studentIds', 'array-contains', studentId),
    orderBy('dueDate', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
};

export const getAssignmentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<AssignmentSubmission | null> => {
  const q = query(
    collection(db, 'submissions'),
    where('assignmentId', '==', assignmentId),
    where('studentId', '==', studentId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
return {
  id: snapshot.docs[0].id,
  assignmentId: data.assignmentId || '',
  studentId: data.studentId || '',
  files: data.files || [],
  comment: data.comment || '',
  submittedAt: data.submittedAt || new Date(),
  status: data.status || 'pending'
} as AssignmentSubmission;
};

export const submitAssignment = async (
  assignmentId: string,
  studentId: string,
  files: File[],
  remarks?: string
): Promise<void> => {
  // Upload files to Firebase Storage
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const storageRef = ref(storage, `submissions/${assignmentId}/${studentId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { id: `${Date.now()}-${file.name}`, name: file.name, url, size: file.size, type: file.type };
    })
  );

  // Create submission record
  await addDoc(collection(db, 'submissions'), {
    assignmentId,
    studentId,
    submittedAt: new Date().toISOString(),
    files: uploadedFiles,
    comment: remarks || '',
    status: 'submitted',
    createdAt: new Date().toISOString()
  });

  // Update assignment status
  const assignmentRef = doc(db, 'assignments', assignmentId);
  await updateDoc(assignmentRef, { status: 'submitted' });
};

// ============================================================================
// FEE SERVICES
// ============================================================================

export interface FeeStructureWithDetails extends FeeStructure {
  dueAmount: number;
  paidAmount: number;
  totalAmount: number;
  status: 'paid' | 'partial' | 'pending' | 'overdue';
  items: FeeItem[];
  academicYear: string;
  semester: number;
}

export interface FeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  isMandatory: boolean;
}

export interface PaymentRecordWithPaidAt extends PaymentRecord {
  paidAt: string;
  method: string;
}

export const getStudentFeeStructure = async (studentId: string): Promise<FeeStructureWithDetails[]> => {
  const q = query(
    collection(db, 'feeStructures'),
    where('studentId', '==', studentId),
    orderBy('dueDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeeStructureWithDetails));
};

export const getPaymentHistory = async (studentId: string): Promise<PaymentRecordWithPaidAt[]> => {
  const q = query(
    collection(db, 'payments'),
    where('studentId', '==', studentId),
    orderBy('paidAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecordWithPaidAt));
};
