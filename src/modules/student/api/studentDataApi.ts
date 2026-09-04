// src/modules/student/api/studentDataApi.ts
// ------------------------------------------------------------------
// Real Firestore data access for the student portal.
// Aligned to the collections actually written by faculty/admin:
//   - students
//   - attendanceRecords   (per-session per-student rows)
//   - studentAssessments  (student ↔ assessment link + result)
//   - assignments + submissions
//   - fees / payments
//   - weeklySchedules + classSessions
//   - notifications
// No mock / demo data lives here.
// ------------------------------------------------------------------
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/Firebase/config';
import { resolveStudentRecord } from '../services/studentRecordResolver';

// ─── Types returned to the UI (kept close to existing components) ──────

export interface StudentProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  regNo: string;
  rollNumber?: string;
  branch: string;
  batch: string;
  semester: number;
  division: string;
  section: string;
  course?: string;
  mentor?: string;
  collegeId?: string;
  cgpa?: number;
}

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  subject: string;
  subjectCode?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'onDuty' | 'medicalLeave' | string;
  checkInTime?: string;
  notes?: string;
  markedAt?: string;
}

export interface AttendanceSummaryData {
  percentage: number;
  requiredPercentage: number;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  monthlyBreakdown: { month: string; total: number; present: number; absent: number; percentage: number }[];
  records: StudentAttendanceRecord[];
}

export interface StudentAssignmentData {
  id: string;
  title: string;
  subject: string;
  subjectCode?: string;
  description?: string;
  dueDate: string;
  dueTime?: string;
  maxMarks?: number;
  status: 'pending' | 'submitted' | 'graded' | 'overdue' | 'late-submitted' | string;
  submissionType?: string;
  marksObtained?: number;
  feedback?: string;
  submittedAt?: string;
  createdAt?: string;
}

export interface StudentFeeData {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  totalPaid: number;
  totalBalance: number;
  totalOverdue: number;
}

export interface StudentClassSession {
  id: string;
  subject: string;
  subjectCode?: string;
  facultyName?: string;
  startTime: string;
  endTime?: string;
  room?: string;
  type?: string;
  date?: string;
  topic?: string;
  status?: string;
}

export interface StudentNotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
  priority?: string;
  actionUrl?: string;
}

export interface StudentGradeData {
  id: string;
  subject: string;
  code: string;
  credits?: number;
  internal?: number;
  external?: number;
  total?: number;
  grade: string;
  gradePoint?: number;
  semester: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────

function toIso(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

function monthKey(dateStr: string): string {
  // Expect YYYY-MM-DD or ISO
  const d = new Date(dateStr.length >= 10 ? dateStr.slice(0, 10) + 'T12:00:00' : dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

async function safeQuery<T>(
  q: FirebaseFirestoreQuery,
  mapper: (d: FirebaseFirestoreDoc) => T
): Promise<T[]> {
  try {
    const snap = await getDocs(q);
    return snap.docs.map(mapper);
  } catch (err) {
    // Callers must distinguish an empty result from an unavailable or denied
    // backend. Log once for diagnostics, then preserve the failure for the UI.
    console.error('[studentDataApi] query failed:', err);
    throw err;
  }
}

// Minimal local types so we don't need to import firebase types across the file
type FirebaseFirestoreQuery = ReturnType<typeof query>;
type FirebaseFirestoreDoc = Awaited<ReturnType<typeof getDocs>>['docs'][number];

// ─── Profile ───────────────────────────────────────────────────────────

export async function fetchProfile(studentId: string, email?: string): Promise<StudentProfileData | null> {
  if (!studentId) return null;

  const mapDoc = (id: string, raw: Record<string, any>): StudentProfileData => {
    const data = raw as Record<string, any>;
    const branch = data.branch || data.department || '';
    return {
      id,
      name: data.name || 'Student',
      email: data.email || email || '',
      phone: data.phone || data.mobile,
      avatar: data.avatar || data.profilePhotoUrl,
      regNo: data.regNo || data.registrationNumber || data.rollNumber || data.usn || '',
      rollNumber: data.rollNumber || data.regNo || data.usn,
      branch,
      batch: data.batch || data.academicYear || '',
      semester: Number(data.semester) || 0,
      division: data.division || data.section || '',
      section: data.section || data.division || '',
      course: data.course || data.department || branch,
      mentor: data.mentor || data.mentorName,
      collegeId: data.collegeId,
      cgpa: typeof data.cgpa === 'number' ? data.cgpa : undefined,
    };
  };

  // Owned document reads only — see student/services/studentRecordResolver.ts.
  // A `where('userId','==',uid)` query is denied for a student by the rules
  // (a list request has no `resource`, so ownership cannot be proven), which is
  // why the profile used to come back empty for correctly provisioned students.
  const { record, permissionDenied, errors } = await resolveStudentRecord(studentId, email);
  if (record) return mapDoc(record.id, record.data);
  if (permissionDenied) {
    // Surface it: an empty result here means "no records", and students were
    // being told they had no profile when the truth was a rules mismatch.
    throw new Error(
      'Your student record could not be read because Firestore security rules denied access. ' +
      'Deploy the current rules and sign out and back in. Details: ' + errors.join(' | ')
    );
  }

  return null;
}

// ─── Attendance (from attendanceRecords) ───────────────────────────────

export async function fetchAttendance(
  studentId: string,
  collegeId: string
): Promise<AttendanceSummaryData> {
  const empty: AttendanceSummaryData = {
    percentage: 0,
    requiredPercentage: 75,
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    monthlyBreakdown: [],
    records: [],
  };
  if (!studentId || !collegeId) return empty;

  const records = await safeQuery<StudentAttendanceRecord>(
    query(
      collection(db, 'attendanceRecords'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(500)
    ),
    (d) => {
      const data = d.data() as Record<string, any>;
      return {
        id: d.id,
        date: data.date || '',
        subject: data.subject || '',
        subjectCode: data.subjectCode || '',
        status: data.status || '',
        checkInTime: data.checkInTime || data.timeIn,
        notes: data.note || data.notes || '',
        markedAt: toIso(data.markedAt),
      };
    }
  );

  const present = records.filter((r) => r.status === 'present' || r.status === 'onDuty').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const excused = records.filter((r) => r.status === 'leave' || r.status === 'medicalLeave').length;
  const total = records.length;

  // Monthly breakdown
  const monthMap = new Map<string, { total: number; present: number; absent: number }>();
  records.forEach((r) => {
    const key = monthKey(r.date);
    if (!key) return;
    const entry = monthMap.get(key) || { total: 0, present: 0, absent: 0 };
    entry.total += 1;
    if (r.status === 'present' || r.status === 'onDuty' || r.status === 'late') entry.present += 1;
    if (r.status === 'absent') entry.absent += 1;
    monthMap.set(key, entry);
  });
  const monthlyBreakdown = Array.from(monthMap.entries())
    .map(([month, v]) => ({
      month,
      total: v.total,
      present: v.present,
      absent: v.absent,
      percentage: v.total ? Math.round((v.present / v.total) * 100) : 0,
    }))
    .reverse();

  return {
    // Late attendance counts as attended consistently with the monthly view;
    // it remains a separate count for the status breakdown.
    percentage: total ? Math.round(((present + late) / total) * 100) : 0,
    requiredPercentage: 75,
    totalClasses: total,
    present,
    absent,
    late,
    excused,
    monthlyBreakdown,
    records,
  };
}

// ─── Assessments / Tests (studentAssessments) ──────────────────────────

export interface StudentTestCardData {
  id: string;
  assessmentId: string;
  /** scheduledTests doc id (Phase 2 authoritative link) */
  testId: string;
  title: string;
  subject: string;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  status: 'upcoming' | 'available' | 'ongoing' | 'completed' | 'missed' | 'graded';
  studentStatus: string;
  canStart: boolean;
  canResume: boolean;
  marksObtained?: number;
  percentage?: number;
  grade?: string;
  timeSpent?: number;
  submittedAt?: string;
  totalQuestions?: number;
  needsManualGrading?: boolean;
  resultReleased?: boolean;
}

export async function fetchStudentTests(
  collegeId: string | undefined,
  studentId: string
): Promise<StudentTestCardData[]> {
  if (!collegeId || !studentId) return [];
  // Eligibility, target matching, attempt state and result visibility are
  // enforced by the callable. Client-supplied tenant/student IDs are never
  // used to select another student's records.
  const getMyStudentTests = httpsCallable<
    Record<string, never>,
    { tests: StudentTestCardData[] }
  >(functions, 'getMyStudentTests');
  const result = await getMyStudentTests({});
  return result.data.tests;
}

// ─── Assignments ───────────────────────────────────────────────────────

export async function fetchAssignments(studentId: string): Promise<StudentAssignmentData[]> {
  if (!studentId) return [];
  // The callable resolves the authenticated student's canonical domain ID and
  // filters cohort/specific targeting server-side. The browser cannot request
  // assignments for another student.
  const getMyAssignments = httpsCallable<
    Record<string, never>,
    { assignments: StudentAssignmentData[] }
  >(functions, 'getMyAssignments');
  const result = await getMyAssignments({});
  return result.data.assignments;
}

// ─── Fees ──────────────────────────────────────────────────────────────

export async function fetchFees(studentId: string): Promise<StudentFeeData> {
  const empty = {
    totalFees: 0, paidFees: 0, pendingFees: 0,
    totalPaid: 0, totalBalance: 0, totalOverdue: 0,
  };
  if (!studentId) return empty;

  const feeStructures = await safeQuery<any>(
    query(collection(db, 'feeStructures'), where('studentId', '==', studentId), limit(50)),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );

  if (feeStructures.length > 0) {
    const totalFees = feeStructures.reduce((sum, f) => sum + (Number(f.totalAmount) || Number(f.amount) || 0), 0);
    const paidFees = feeStructures.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
    const pendingFees = Math.max(0, totalFees - paidFees);
    const overdue = feeStructures
      .filter((f) => f.status === 'overdue' || (f.dueDate && new Date(f.dueDate).getTime() < Date.now() && (Number(f.paidAmount) || 0) < (Number(f.totalAmount) || 0)))
      .reduce((sum, f) => sum + Math.max(0, (Number(f.totalAmount) || Number(f.amount) || 0) - (Number(f.paidAmount) || 0)), 0);
    return {
      totalFees,
      paidFees,
      pendingFees,
      totalPaid: paidFees,
      totalBalance: pendingFees,
      totalOverdue: overdue,
    };
  }

  // Fallback: single fees/{studentId} document
  const feeDoc = await getDoc(doc(db, 'fees', studentId)).catch(() => null);
  if (feeDoc && feeDoc.exists()) {
    const data = feeDoc.data() as Record<string, any>;
    const totalFees = Number(data.totalFees) || 0;
    const paidFees = Number(data.paidFees) || 0;
    const pendingFees = Number(data.pendingFees) ?? totalFees - paidFees;
    return {
      totalFees,
      paidFees,
      pendingFees,
      totalPaid: paidFees,
      totalBalance: Number(data.totalBalance) ?? pendingFees,
      totalOverdue: Number(data.totalOverdue) || 0,
    };
  }

  return empty;
}

// ─── Today's Schedule (weeklySchedules + classSessions) ────────────────

export async function fetchTodaySchedule(
  student: {
    collegeId: string;
    branch: string;
    batch: string;
    semester: number;
    division: string;
    section: string;
  },
  dateStr: string
): Promise<StudentClassSession[]> {
  if (!student.collegeId || !student.branch || !student.batch) return [];

  const dayOfWeek = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Weekly recurring schedule is always scoped to the student's tenant before
  // the remaining cohort fields are matched.
  const weekly = await safeQuery<any>(
    query(
      collection(db, 'weeklySchedules'),
      where('collegeId', '==', student.collegeId),
      where('branch', '==', student.branch),
      limit(500)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );

  const matchesCohort = (row: any) => {
    if (String(row.batch || '') !== String(student.batch)) return false;
    if (Number(row.semester || 0) !== Number(student.semester)) return false;
    const div = row.division || row.section || '';
    if (div && div !== student.division && div !== student.section) return false;
    return true;
  };

  const recurring: StudentClassSession[] = weekly
    .filter((row) => matchesCohort(row) && String(row.dayOfWeek || '').toLowerCase() === dayOfWeek)
    .map((row) => ({
      id: row.id,
      subject: row.subject || '',
      subjectCode: row.subjectCode,
      facultyName: row.facultyName,
      startTime: row.startTime || '',
      endTime: row.endTime,
      room: row.room,
      type: row.type,
      date: dateStr,
      topic: row.topic,
      status: row.status || 'scheduled',
    }));

  // Daily overrides
  const daily = await safeQuery<any>(
    query(
      collection(db, 'classSessions'),
      where('collegeId', '==', student.collegeId),
      where('date', '==', dateStr),
      limit(200)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );
  const matchedDaily = daily.filter((row) => matchesCohort(row));
  const legacySlotKey = (row: any) =>
    `${row.subjectCode || row.subject || ''}|${row.startTime || ''}`;
  const overrides = matchedDaily
    .filter((row) => row.status !== 'cancelled')
    .map((row) => ({
      id: row.id,
      subject: row.subject || '',
      subjectCode: row.subjectCode,
      facultyName: row.facultyName,
      startTime: row.startTime || '',
      endTime: row.endTime,
      room: row.room,
      type: row.type,
      date: row.date,
      topic: (row.topicsPlanned || []).join?.(', ') || row.topic,
      status: row.status || 'scheduled',
    }));

  // Daily rows supersede the recurring slot even when the daily row is a
  // cancellation. A linked weeklyScheduleId is preferred; legacy rows fall
  // back to subject/start-time matching.
  const linkedScheduleIds = new Set(
    matchedDaily.map((row) => String(row.weeklyScheduleId || '')).filter(Boolean)
  );
  const legacyOverrideKeys = new Set(
    matchedDaily.filter((row) => !row.weeklyScheduleId).map(legacySlotKey)
  );
  return [
    ...overrides,
    ...recurring.filter((row) =>
      !linkedScheduleIds.has(row.id) && !legacyOverrideKeys.has(legacySlotKey(row))
    ),
  ].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
}

// ─── Notifications ─────────────────────────────────────────────────────

export async function fetchNotifications(studentId: string): Promise<StudentNotificationData[]> {
  if (!studentId) return [];
  return safeQuery<StudentNotificationData>(
    query(
      collection(db, 'notifications'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(50)
    ),
    (d) => {
      const data = d.data() as Record<string, any>;
      return {
        id: d.id,
        title: data.title || '',
        message: data.message || data.body || '',
        type: data.type || 'info',
        timestamp: toIso(data.timestamp || data.createdAt),
        read: Boolean(data.read),
        priority: data.priority,
        actionUrl: data.actionUrl,
      };
    }
  );
}

// ─── Official grades ──────────────────────────────────────────────────

export async function fetchGrades(collegeId: string | undefined, studentId: string): Promise<StudentGradeData[]> {
  if (!collegeId || !studentId) return [];

  // Official transcript rows are separate from test attempts. The portal must
  // never invent credits, internal/external splits, grades, or grade points
  // from assessment percentages.
  return safeQuery<StudentGradeData>(
    query(
      collection(db, 'gradeRecords'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      where('status', '==', 'published'),
      orderBy('semester', 'desc'),
      limit(200)
    ),
    (d) => {
      const grade = d.data() as Record<string, any>;
      return {
        id: d.id,
        subject: String(grade.subject || grade.courseName || ''),
        code: String(grade.code || grade.courseCode || ''),
        credits: typeof grade.credits === 'number' ? grade.credits : undefined,
        internal: typeof grade.internal === 'number' ? grade.internal : undefined,
        external: typeof grade.external === 'number' ? grade.external : undefined,
        total: typeof grade.total === 'number' ? grade.total : undefined,
        grade: String(grade.grade || ''),
        gradePoint: typeof grade.gradePoint === 'number' ? grade.gradePoint : undefined,
        semester: Number(grade.semester) || 0,
      };
    }
  );
}

// ─── Notifications: mark read ─────────────────────────────────────────

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  try {
    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (err) {
    console.error('[markNotificationRead] failed:', err);
  }
}

export async function markAllNotificationsRead(studentId: string): Promise<number> {
  if (!studentId) return 0;
  try {
    const { writeBatch } = await import('firebase/firestore');
    const q = query(
      collection(db, 'notifications'),
      where('studentId', '==', studentId),
      where('read', '==', false),
      limit(100)
    );
    const snap = await getDocs(q);
    if (snap.empty) return 0;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    return snap.size;
  } catch (err) {
    console.error('[markAllNotificationsRead] failed:', err);
    return 0;
  }
}
