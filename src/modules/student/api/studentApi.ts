import { db } from '@/Firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';

// ─── Local interfaces (decoupled from your types/student.ts to avoid mismatch) ───
// Replace these with your actual type imports once aligned
interface StudentProfile {
  id?: string;
  name: string;
  regNo: string;
  email: string;
  phone?: string;
  avatar?: string;
  batch: string;
  division?: string;
  mentor?: string;
  semester?: number;
  course: string;
  enrollmentDate?: string;
  cgpa?: number;
  attendancePercentage?: number;
}

interface AttendanceSummary {
  subject?: string;
  subjectCode?: string;
  totalClasses?: number;
  totalDays?: number;
  present: number;
  absent: number;
  late?: number;
  percentage: number;
  requiredPercentage?: number;
  isShortage?: boolean;
  monthlyBreakdown?: unknown[];
}

interface Assessment {
  id: string;
  title: string;
  subject: string;
  subjectCode?: string;
  type: string;
  date: string;
  time?: string;
  duration?: number;
  venue?: string;
  maxMarks?: number;
  syllabus?: string[];
  status: string;
  instructions?: string;
  materials?: string[];
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  subjectCode?: string;
  description?: string;
  assignedDate?: string;
  dueDate: string;
  dueTime?: string;
  maxMarks?: number;
  status: string;
  submissionType?: string;
  attachments?: unknown[];
  submittedAt?: string;
  grade?: number;
  feedback?: string;
  plagiarismScore?: number;
  allowLateSubmission?: boolean;
  latePenalty?: number;
}

interface FeeSummary {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  totalPaid?: number;
  totalBalance?: number;
  totalOverdue?: number;
  upcomingDue?: unknown[];
  overdueFees?: unknown[];
}

interface ClassSchedule {
  id: string;
  subject: string;
  subjectCode?: string;
  faculty?: string;
  teacher?: string;
  facultyName?: string;
  facultyInitials?: string;
  day?: string;
  startTime: string;
  endTime?: string;
  room?: string;
  type?: string;
  status?: string;
  topic?: string;
  notes?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority?: string;
}

interface StudentDashboardStats {
  upcomingClasses?: number;
  pendingAssignments: number;
  upcomingAssessments: number;
  attendancePercentage: number;
  feeDue?: number;
  newNotifications: number;
  overdueAssignments: number;
  lowAttendanceSubjects?: number;
  totalAssessments?: number;
  completedAssessments?: number;
  averageScore?: number;
  totalAssignments?: number;
  completedAssignments?: number;
  averageGrade?: number;
}

const MAX_READS = 500;
let readCount = 0;

function trackRead(n: number) {
  readCount += n;
  if (readCount > MAX_READS) console.warn('[StudentApi] Read cap exceeded:', readCount);
}

// ─── Profile ────────────────────────────────────────────────────────
export async function fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
  if (readCount >= MAX_READS) return null;

  const docRef = doc(db, 'students', studentId);
  const docSnap = await getDoc(docRef);
  trackRead(1);

  let data: Record<string, unknown>;
  let id: string;

  if (docSnap.exists()) {
    data = docSnap.data();
    id = docSnap.id;
  } else {
    const q = query(collection(db, 'students'), where('uid', '==', studentId), limit(1));
    const snap = await getDocs(q);
    trackRead(snap.size);
    if (snap.empty) return null;
    const d = snap.docs[0];
    data = d.data();
    id = d.id;
  }

  return {
    id,
    name: String(data.name || ''),
    regNo: String(data.regNo || data.registrationNumber || ''),
    email: String(data.email || ''),
    phone: data.phone ? String(data.phone) : undefined,
    avatar: data.avatar ? String(data.avatar) : undefined,
    batch: String(data.batch || ''),
    division: data.division ? String(data.division) : undefined,
    mentor: data.mentor ? String(data.mentor) : undefined,
    semester: typeof data.semester === 'number' ? data.semester : undefined,
    course: String(data.course || data.department || ''),
    enrollmentDate: data.enrollmentDate ? String(data.enrollmentDate) : undefined,
    cgpa: typeof data.cgpa === 'number' ? data.cgpa : undefined,
    attendancePercentage: typeof data.attendancePercentage === 'number' ? data.attendancePercentage : undefined,
  };
}

// ─── Attendance ─────────────────────────────────────────────────────
export async function fetchStudentAttendance(studentId: string): Promise<AttendanceSummary | null> {
  if (readCount >= MAX_READS) return null;

  const q = query(collection(db, 'attendance'), where('studentId', '==', studentId), limit(500));
  const snap = await getDocs(q);
  trackRead(snap.size);

  const records = snap.docs.map((d) => d.data());
  const total = records.length;
  const present = records.filter((r) => r.status === 'present' || r.isPresent === true).length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const late = records.filter((r) => r.status === 'late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return {
    present,
    absent,
    late: late || undefined,
    percentage,
    requiredPercentage: 75,
    isShortage: percentage < 75,
  };
}

// ─── Assessments ────────────────────────────────────────────────────
export async function fetchUpcomingAssessments(studentId: string): Promise<Assessment[]> {
  if (readCount >= MAX_READS) return [];

  let snap;
  try {
    const q = query(
      collection(db, 'assessments'),
      where('studentIds', 'array-contains', studentId),
      where('status', 'in', ['upcoming', 'ongoing']),
      orderBy('date', 'asc'),
      limit(50)
    );
    snap = await getDocs(q);
  } catch {
    const q = query(
      collection(db, 'assessments'),
      where('studentIds', 'array-contains', studentId),
      limit(50)
    );
    snap = await getDocs(q);
  }
  trackRead(snap.size);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        subject: String(data.subject || ''),
        subjectCode: data.subjectCode ? String(data.subjectCode) : undefined,
        type: String(data.type || 'quiz'),
        date: String(data.date || ''),
        time: data.time ? String(data.time) : undefined,
        duration: typeof data.duration === 'number' ? data.duration : undefined,
        venue: data.venue ? String(data.venue) : undefined,
        maxMarks: typeof data.maxMarks === 'number' ? data.maxMarks : undefined,
        syllabus: Array.isArray(data.syllabus) ? data.syllabus : undefined,
        status: String(data.status || 'upcoming'),
        instructions: data.instructions ? String(data.instructions) : undefined,
        materials: Array.isArray(data.materials) ? data.materials : undefined,
      };
    })
    .filter((a) => a.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ─── Assignments ────────────────────────────────────────────────────
export async function fetchPendingAssignments(studentId: string): Promise<Assignment[]> {
  if (readCount >= MAX_READS) return [];

  let snap;
  try {
    const q = query(
      collection(db, 'assignments'),
      where('studentId', '==', studentId),
      where('status', '==', 'pending'),
      orderBy('dueDate', 'asc'),
      limit(50)
    );
    snap = await getDocs(q);
  } catch {
    const q = query(collection(db, 'assignments'), where('studentId', '==', studentId), limit(50));
    snap = await getDocs(q);
  }
  trackRead(snap.size);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: String(data.title || ''),
        subject: String(data.subject || ''),
        subjectCode: data.subjectCode ? String(data.subjectCode) : undefined,
        description: data.description ? String(data.description) : undefined,
        assignedDate: data.assignedDate ? String(data.assignedDate) : undefined,
        dueDate: String(data.dueDate || ''),
        dueTime: data.dueTime ? String(data.dueTime) : undefined,
        maxMarks: typeof data.maxMarks === 'number' ? data.maxMarks : undefined,
        status: String(data.status || 'pending'),
        submissionType: data.submissionType ? String(data.submissionType) : undefined,
        attachments: Array.isArray(data.attachments) ? data.attachments : undefined,
        submittedAt: data.submittedAt ? String(data.submittedAt) : undefined,
        grade: typeof data.grade === 'number' ? data.grade : undefined,
        feedback: data.feedback ? String(data.feedback) : undefined,
        plagiarismScore: typeof data.plagiarismScore === 'number' ? data.plagiarismScore : undefined,
        allowLateSubmission: typeof data.allowLateSubmission === 'boolean' ? data.allowLateSubmission : undefined,
        latePenalty: typeof data.latePenalty === 'number' ? data.latePenalty : undefined,
      };
    })
    .filter((a) => a.status === 'pending')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

// ─── Fees ───────────────────────────────────────────────────────────
export async function fetchFeeSummary(studentId: string): Promise<FeeSummary | null> {
  if (readCount >= MAX_READS) return null;

  const q = query(collection(db, 'fees'), where('studentId', '==', studentId), limit(1));
  const snap = await getDocs(q);
  trackRead(snap.size);

  if (snap.empty) {
    return {
      totalFees: 0,
      paidFees: 0,
      pendingFees: 0,
      totalPaid: 0,
      totalBalance: 0,
      totalOverdue: 0,
      upcomingDue: [],
      overdueFees: [],
    };
  }

  const data = snap.docs[0].data();
  const totalFees = typeof data.totalFees === 'number' ? data.totalFees : 0;
  const paidFees = typeof data.paidFees === 'number' ? data.paidFees : 0;

  return {
    totalFees,
    paidFees,
    pendingFees: typeof data.pendingFees === 'number' ? data.pendingFees : totalFees - paidFees || 0,
    totalPaid: paidFees,
    totalBalance: typeof data.totalBalance === 'number' ? data.totalBalance : totalFees - paidFees || 0,
    totalOverdue: typeof data.totalOverdue === 'number' ? data.totalOverdue : 0,
    upcomingDue: Array.isArray(data.upcomingDue) ? data.upcomingDue : [],
    overdueFees: Array.isArray(data.overdueFees) ? data.overdueFees : [],
  };
}

// ─── Schedule ───────────────────────────────────────────────────────
export async function fetchClassSchedule(studentId: string, dateStr: string): Promise<ClassSchedule[]> {
  if (readCount >= MAX_READS) return [];

  let snap;
  try {
    const q = query(
      collection(db, 'schedule'),
      where('studentId', '==', studentId),
      where('date', '==', dateStr),
      orderBy('startTime', 'asc'),
      limit(20)
    );
    snap = await getDocs(q);
  } catch {
    const q = query(
      collection(db, 'schedule'),
      where('studentId', '==', studentId),
      limit(50)
    );
    snap = await getDocs(q);
  }
  trackRead(snap.size);

  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        subject: String(data.subject || ''),
        subjectCode: data.subjectCode ? String(data.subjectCode) : undefined,
        faculty: data.faculty ? String(data.faculty) : undefined,
        teacher: data.teacher ? String(data.teacher) : data.faculty ? String(data.faculty) : undefined,
        facultyName: data.facultyName ? String(data.facultyName) : data.faculty ? String(data.faculty) : undefined,
        facultyInitials: data.facultyInitials ? String(data.facultyInitials) : undefined,
        day: data.day ? String(data.day) : undefined,
        startTime: String(data.startTime || ''),
        endTime: data.endTime ? String(data.endTime) : undefined,
        room: data.room ? String(data.room) : undefined,
        type: data.type ? String(data.type) : undefined,
        status: data.status ? String(data.status) : undefined,
        topic: data.topic ? String(data.topic) : undefined,
        notes: data.notes ? String(data.notes) : undefined,
      };
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

// ─── Notifications ──────────────────────────────────────────────────
export async function fetchStudentNotifications(studentId: string): Promise<Notification[]> {
  if (readCount >= MAX_READS) return [];

  let snap;
  try {
    const q = query(
      collection(db, 'notifications'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    snap = await getDocs(q);
  } catch {
    const q = query(collection(db, 'notifications'), where('studentId', '==', studentId), limit(50));
    snap = await getDocs(q);
  }
  trackRead(snap.size);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title || ''),
      message: String(data.message || ''),
      type: String(data.type || 'general'),
      timestamp: String(data.timestamp || ''),
      read: Boolean(data.read),
      actionUrl: data.actionUrl ? String(data.actionUrl) : undefined,
      priority: data.priority ? String(data.priority) : undefined,
    };
  });
}

// ─── Stats ──────────────────────────────────────────────────────────
export async function fetchStudentStats(studentId: string): Promise<StudentDashboardStats | null> {
  if (readCount >= MAX_READS) return null;

  const [attendance, assignments, assessments, notifications] = await Promise.all([
    fetchStudentAttendance(studentId),
    fetchPendingAssignments(studentId),
    fetchUpcomingAssessments(studentId),
    fetchStudentNotifications(studentId),
  ]);

  return {
    upcomingClasses: 0,
    pendingAssignments: assignments.length,
    upcomingAssessments: assessments.length,
    attendancePercentage: attendance?.percentage || 0,
    feeDue: 0,
    newNotifications: notifications.filter((n) => !n.read).length,
    overdueAssignments: assignments.filter((a) => a.status === 'overdue').length,
    lowAttendanceSubjects: 0,
    totalAssessments: assessments.length,
    completedAssessments: 0,
    averageScore: 0,
    totalAssignments: assignments.length,
    completedAssignments: 0,
    averageGrade: 0,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function resetReadCount(): void {
  readCount = 0;
}