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
import { db } from '@/Firebase/config';

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
  credits: number;
  internal: number;
  external: number;
  total: number;
  grade: string;
  gradePoint: number;
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

function safeQuery<T>(q: FirebaseFirestoreQuery, mapper: (d: FirebaseFirestoreDoc) => T): Promise<T[]> {
  return getDocs(q)
    .then((snap) => snap.docs.map(mapper))
    .catch((err) => {
      console.error('[studentDataApi] query failed:', err);
      return [] as T[];
    });
}

// Minimal local types so we don't need to import firebase types across the file
type FirebaseFirestoreQuery = ReturnType<typeof query>;
type FirebaseFirestoreDoc = Awaited<ReturnType<typeof getDocs>>['docs'][number];

// ─── Profile ───────────────────────────────────────────────────────────

export async function fetchProfile(studentId: string, email?: string): Promise<StudentProfileData | null> {
  if (!studentId) return null;

  const mapDoc = (d: FirebaseFirestoreDoc): StudentProfileData => {
    const data = d.data() as Record<string, any>;
    const branch = data.branch || data.department || '';
    return {
      id: d.id,
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

  // 1) By doc id
  const byId = await getDoc(doc(db, 'students', studentId)).catch(() => null);
  if (byId && byId.exists()) return mapDoc(byId as unknown as FirebaseFirestoreDoc);

  // 2) By uid
  const byUid = await getDocs(
    query(collection(db, 'students'), where('uid', '==', studentId), limit(1))
  ).catch(() => null);
  if (byUid && !byUid.empty) return mapDoc(byUid.docs[0]);

  // 3) By email
  if (email) {
    const byEmail = await getDocs(
      query(collection(db, 'students'), where('email', '==', email), limit(1))
    ).catch(() => null);
    if (byEmail && !byEmail.empty) return mapDoc(byEmail.docs[0]);
  }

  return null;
}

// ─── Attendance (from attendanceRecords) ───────────────────────────────

export async function fetchAttendance(studentId: string): Promise<AttendanceSummaryData> {
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
  if (!studentId) return empty;

  const records = await safeQuery<StudentAttendanceRecord>(
    query(
      collection(db, 'attendanceRecords'),
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
    percentage: total ? Math.round((present / total) * 100) : 0,
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
  title: string;
  subject: string;
  totalMarks: number;
  duration: number;
  startDateTime: string;
  endDateTime: string;
  status: 'upcoming' | 'available' | 'ongoing' | 'completed' | 'missed' | 'graded';
  studentStatus: string;
  canStart: boolean;
  marksObtained?: number;
  percentage?: number;
  grade?: string;
  timeSpent?: number;
  submittedAt?: string;
  totalQuestions?: number;
}

export async function fetchStudentTests(
  collegeId: string | undefined,
  studentId: string
): Promise<StudentTestCardData[]> {
  if (!collegeId || !studentId) return [];

  const studentAssessments = await safeQuery<any>(
    query(
      collection(db, 'studentAssessments'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      limit(200)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );

  // Hydrate with assessment metadata
  const cards: StudentTestCardData[] = [];
  for (const sa of studentAssessments) {
    const assessmentId = sa.assessmentId;
    let title = sa.title || 'Assessment';
    let subject = sa.subject || '';
    let totalMarks = Number(sa.totalMarks) || 0;
    let duration = Number(sa.duration) || 0;
    let startDateTime = toIso(sa.startDateTime);
    let endDateTime = toIso(sa.endDateTime);
    let totalQuestions = sa.totalQuestions || 0;

    if (assessmentId) {
      const aDoc = await getDoc(doc(db, 'assessments', assessmentId)).catch(() => null);
      if (aDoc && aDoc.exists()) {
        const a = aDoc.data() as Record<string, any>;
        title = a.title || title;
        subject = a.subject || subject;
        totalMarks = Number(a.totalMarks) || totalMarks;
        duration = Number(a.duration) || duration;
        startDateTime = toIso(a.startDateTime) || startDateTime;
        endDateTime = toIso(a.endDateTime) || endDateTime;
        totalQuestions = a.totalQuestions || totalQuestions;
      }
    }

    const now = Date.now();
    const startMs = startDateTime ? new Date(startDateTime).getTime() : 0;
    const endMs = endDateTime ? new Date(endDateTime).getTime() : startMs + duration * 60_000;

    let status: StudentTestCardData['status'] = 'upcoming';
    if (sa.status === 'graded' || sa.status === 'submitted') {
      status = sa.status === 'graded' ? 'graded' : 'completed';
    } else if (sa.status === 'in_progress') {
      status = 'ongoing';
    } else if (startMs && endMs) {
      if (now < startMs) status = 'upcoming';
      else if (now >= startMs && now <= endMs) status = 'available';
      else status = 'missed';
    }

    cards.push({
      id: sa.id,
      assessmentId: assessmentId || '',
      title,
      subject,
      totalMarks,
      duration,
      startDateTime,
      endDateTime,
      status,
      studentStatus: sa.status || 'not_started',
      canStart: status === 'available' || status === 'ongoing',
      marksObtained: sa.marksObtained,
      percentage: sa.percentage,
      grade: sa.grade,
      timeSpent: sa.timeSpent,
      submittedAt: toIso(sa.submittedAt),
      totalQuestions,
    });
  }

  return cards.sort((a, b) => (b.startDateTime || '').localeCompare(a.startDateTime || ''));
}

// ─── Assignments ───────────────────────────────────────────────────────

export async function fetchAssignments(studentId: string): Promise<StudentAssignmentData[]> {
  if (!studentId) return [];

  // Assignments addressed to the student directly
  const direct = await safeQuery<any>(
    query(
      collection(db, 'assignments'),
      where('studentIds', 'array-contains', studentId),
      limit(100)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );

  // Submissions made by this student (to determine status/grade)
  const submissions = await safeQuery<any>(
    query(
      collection(db, 'submissions'),
      where('studentId', '==', studentId),
      limit(200)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );
  const subByAssignment = new Map<string, any>();
  submissions.forEach((s) => {
    if (s.assignmentId) subByAssignment.set(s.assignmentId, s);
  });

  return direct.map((a) => {
    const sub = subByAssignment.get(a.id);
    let status: StudentAssignmentData['status'] = 'pending';
    if (sub) {
      status = sub.status === 'graded' ? 'graded' : 'submitted';
    } else if (a.dueDate && new Date(a.dueDate).getTime() < Date.now()) {
      status = 'overdue';
    }
    return {
      id: a.id,
      title: a.title || 'Untitled',
      subject: a.subject || '',
      subjectCode: a.subjectCode,
      description: a.description,
      dueDate: a.dueDate || '',
      dueTime: a.dueTime,
      maxMarks: a.maxMarks || a.totalMarks,
      status,
      submissionType: a.submissionType,
      marksObtained: sub?.marksObtained,
      feedback: sub?.feedback,
      submittedAt: toIso(sub?.submittedAt),
      createdAt: toIso(a.createdAt),
    };
  });
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
  student: { branch: string; batch: string; semester: number; division: string; section: string },
  dateStr: string
): Promise<StudentClassSession[]> {
  if (!student.branch || !student.batch) return [];

  const dayOfWeek = new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Weekly recurring schedule filtered by cohort (client-side to avoid composite index)
  const weekly = await safeQuery<any>(
    query(collection(db, 'weeklySchedules'), where('branch', '==', student.branch), limit(500)),
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
    }));

  // Daily overrides
  const daily = await safeQuery<any>(
    query(collection(db, 'classSessions'), where('date', '==', dateStr), limit(200)),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );
  const overrides = daily
    .filter((row) => matchesCohort(row))
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
    }));

  // Overrides supersede recurring slot with same subjectCode+startTime
  const overrideKeys = new Set(overrides.map((o) => `${o.subjectCode}|${o.startTime}`));
  return [...overrides, ...recurring.filter((r) => !overrideKeys.has(`${r.subjectCode}|${r.startTime}`))]
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
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

// ─── Grades (graded studentAssessments) ────────────────────────────────

export async function fetchGrades(collegeId: string | undefined, studentId: string): Promise<StudentGradeData[]> {
  if (!collegeId || !studentId) return [];

  const graded = await safeQuery<any>(
    query(
      collection(db, 'studentAssessments'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      where('status', '==', 'graded'),
      limit(200)
    ),
    (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })
  );

  return graded.map((g) => {
    const total = Number(g.totalMarks) || 0;
    const obtained = Number(g.marksObtained) || 0;
    // Heuristic split: 40% internal / 60% external when not otherwise provided.
    const internal = g.internalMarks != null ? Number(g.internalMarks) : Math.round(obtained * 0.4);
    const external = g.externalMarks != null ? Number(g.externalMarks) : obtained - internal;
    return {
      id: g.id,
      subject: g.subject || 'Subject',
      code: g.courseCode || g.subjectCode || '',
      credits: Number(g.credits) || 3,
      internal,
      external,
      total: obtained,
      grade: g.grade || deriveGrade(total ? (obtained / total) * 100 : 0),
      gradePoint: Number(g.gradePoint) || deriveGradePoint(total ? (obtained / total) * 100 : 0),
      semester: Number(g.semester) || 0,
    };
  });
}

function deriveGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

function deriveGradePoint(percentage: number): number {
  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  return 0;
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
