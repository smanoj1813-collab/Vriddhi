import { db } from '@/Firebase/config';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc,
  getDoc, Timestamp, orderBy, limit, writeBatch
} from 'firebase/firestore';
import type {
  FacultyClassSession,
  FacultyAttendanceDoc,
  FacultyStudent,
  FacultyTopic,
  FacultyStats,
  AttendanceStatus,
  FacultyAttendanceRecord,
  TestPaper,
  ClassSession,
} from '../types/attendance';

// Re-export types for backward compatibility
export type {
  FacultyStudent,
  FacultyTopic,
  FacultyStats,
  TestPaper,
  ClassSession,
  FacultyAttendanceRecord,
} from '../types/attendance';

// ─── Read Cap ──────────────────────────────────────────────────────────────

const MAX_READS_PER_SESSION = 500;
let sessionReadCount = 0;

function trackRead(docCount: number) {
  sessionReadCount += docCount;
  if (sessionReadCount > MAX_READS_PER_SESSION) {
    console.warn(`[FacultyApi] Session read cap exceeded: ${sessionReadCount}/${MAX_READS_PER_SESSION}`);
  }
}

function computeStudentStatus(attendance: number, score: number): 'good' | 'average' | 'weak' {
  if (attendance >= 85 && score >= 80) return 'good';
  if (attendance < 75 || score < 60) return 'weak';
  return 'average';
}

// ─── Helper: Build FacultyStudent from Firestore data ─────────────────────

function buildFacultyStudent(d: any, id: string): FacultyStudent {
  const attendance = d.attendancePercentage || d.attendance || 0;
  const score = d.avgScore || d.averageScore || 0;
  const regNo = d.regNo || d.registrationNumber || d.rollNo || '';
  return {
    id,
    name: d.name || '',
    usn: d.usn || '',
    regNo,
    rollNo: regNo,
    branch: d.branch || d.department || '',
    batch: d.batch || '',
    division: d.division || d.section || '',
    semester: d.semester || 0,
    attendancePercentage: attendance,
    status: computeStudentStatus(attendance, score),
    avgScore: score,
  };
}

// ─── Fetch Faculty's Class Sessions ────────────────────────────────────────

export async function fetchFacultyClassSessions(
  facultyId: string,
  dateStr?: string
): Promise<FacultyClassSession[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];
  if (!facultyId) return [];

  try {
    const constraints: any[] = [
      where('facultyId', '==', facultyId),
      limit(100)
    ];
    if (dateStr) constraints.splice(1, 0, where('date', '==', dateStr));

    const q = query(collection(db, 'classSessions'), ...constraints);
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          subject: data.subject || '',
          subjectCode: data.subjectCode || '',
          facultyId: data.facultyId || '',
          facultyName: data.facultyName || '',
          branch: data.branch || '',
          batch: data.batch || '',
          semester: data.semester || 0,
          division: data.division || '',
          section: data.section || '',
          room: data.room || '',
          timeSlot: data.timeSlot || '',
          date: data.date || '',
          topicsPlanned: data.topicsPlanned || [],
          status: data.status || 'scheduled',
          attendanceMarked: data.attendanceMarked || false,
        } as FacultyClassSession;
      })
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  } catch (err) {
    console.error('[FacultyApi] Class sessions query failed:', err);
    return [];
  }
}

// ─── Fetch Students for a Class Session ────────────────────────────────────

export async function fetchStudentsForSession(
  branch: string,
  batch: string,
  division: string,
  semester: number,
  subject: string,
  collegeId: string
): Promise<FacultyStudent[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];
  if (!collegeId) return [];

  try {
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      where('branch', '==', branch),
      where('batch', '==', batch),
      where('division', '==', division),
      where('semester', '==', semester),
      limit(200)
    );

    const snap = await getDocs(q);
    trackRead(snap.size);

    const students: FacultyStudent[] = [];

    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const studentSubjects = d.subjects || d.assignedSubjects || [];
      if (studentSubjects.length > 0 && !studentSubjects.includes(subject)) {
        continue;
      }
      students.push(buildFacultyStudent(d, docSnap.id));
    }

    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyApi] Students query failed:', err);
    return [];
  }
}

// ─── Fetch Existing Attendance ─────────────────────────────────────────────

export async function fetchAttendanceForSession(
  sessionId: string,
  date: string
): Promise<FacultyAttendanceDoc | null> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return null;

  try {
    const q = query(
      collection(db, 'attendance'),
      where('sessionId', '==', sessionId),
      where('date', '==', date)
    );

    const snap = await getDocs(q);
    trackRead(snap.size);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const data = docSnap.data();
    return {
      id: docSnap.id,
      sessionId: data.sessionId,
      facultyId: data.facultyId,
      subject: data.subject,
      subjectCode: data.subjectCode,
      branch: data.branch,
      batch: data.batch,
      semester: data.semester,
      division: data.division,
      section: data.section,
      room: data.room,
      timeSlot: data.timeSlot,
      date: data.date,
      markedAt: data.markedAt || '',
      markedBy: data.markedBy || '',
      records: data.records || [],
      presentCount: data.presentCount || 0,
      absentCount: data.absentCount || 0,
      lateCount: data.lateCount || 0,
      leaveCount: data.leaveCount || 0,
      onDutyCount: data.onDutyCount || 0,
      medicalLeaveCount: data.medicalLeaveCount || 0,
      totalStudents: data.totalStudents || 0,
    } as FacultyAttendanceDoc;
  } catch (err) {
    console.error('[FacultyApi] Attendance fetch failed:', err);
    return null;
  }
}

// ─── Save Attendance ─────────────────────────────────────────────────────

export async function saveAttendance(
  session: FacultyClassSession,
  records: FacultyAttendanceRecord[],
  facultyId: string,
  facultyName: string
): Promise<string> {
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const leaveCount = records.filter(r => r.status === 'Leave').length;
  const onDutyCount = records.filter(r => r.status === 'OnDuty').length;
  const medicalLeaveCount = records.filter(r => r.status === 'MedicalLeave').length;

  const attendanceData = {
    sessionId: session.id,
    facultyId,
    facultyName,
    subject: session.subject,
    subjectCode: session.subjectCode,
    branch: session.branch,
    batch: session.batch,
    semester: session.semester,
    division: session.division,
    section: session.section,
    room: session.room,
    timeSlot: session.timeSlot,
    date: session.date,
    markedAt: new Date().toISOString(),
    markedBy: facultyName,
    records,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    onDutyCount,
    medicalLeaveCount,
    totalStudents: records.length,
  };

  const existing = await fetchAttendanceForSession(session.id, session.date || '');

  if (existing) {
    const docRef = doc(db, 'attendance', existing.id);
    await updateDoc(docRef, attendanceData);
    return existing.id;
  } else {
    const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
    const sessionRef = doc(db, 'classSessions', session.id);
    await updateDoc(sessionRef, { attendanceMarked: true });
    return docRef.id;
  }
}

// ─── Create a Class Session ────────────────────────────────────────────────

export async function createClassSession(
  data: Omit<FacultyClassSession, 'id'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'classSessions'), data);
  return docRef.id;
}

// ─── Fetch Faculty Students ───────────────────────────────────────────────

export async function fetchFacultyStudents(
  facultyId: string,
  collegeId?: string,
  facultyName?: string,
  facultyDepartment?: string
): Promise<FacultyStudent[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];
  if (!collegeId) return [];

  let students: FacultyStudent[] = [];

  if (facultyName) {
    try {
      const q = query(
        collection(db, 'students'),
        where('collegeId', '==', collegeId),
        where('mentor', '==', facultyName),
        limit(200)
      );
      const snap = await getDocs(q);
      trackRead(snap.size);
      students = snap.docs.map((d) => buildFacultyStudent(d.data(), d.id));
      if (students.length > 0) return students;
    } catch (err) {
      console.warn('[FacultyApi] Mentor name query failed:', err);
    }
  }

  try {
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      where('facultyId', '==', facultyId),
      limit(200)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);
    students = snap.docs.map((d) => buildFacultyStudent(d.data(), d.id));
    if (students.length > 0) return students;
  } catch (err) {
    console.warn('[FacultyApi] facultyId query failed:', err);
  }

  if (facultyDepartment) {
    try {
      const q = query(
        collection(db, 'students'),
        where('collegeId', '==', collegeId),
        where('department', '==', facultyDepartment),
        limit(200)
      );
      const snap = await getDocs(q);
      trackRead(snap.size);
      students = snap.docs.map((d) => buildFacultyStudent(d.data(), d.id));
    } catch (err) {
      console.error('[FacultyApi] Department query failed:', err);
    }
  }

  if (students.length === 0) {
    try {
      const q = query(
        collection(db, 'students'),
        where('collegeId', '==', collegeId),
        limit(200)
      );
      const snap = await getDocs(q);
      trackRead(snap.size);
      students = snap.docs.map((d) => buildFacultyStudent(d.data(), d.id));
    } catch (err) {
      console.error('[FacultyApi] College-only query failed:', err);
    }
  }

  return students;
}

// ─── Fetch Faculty Topics ─────────────────────────────────────────────────

export async function fetchFacultyTopics(facultyId: string): Promise<FacultyTopic[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];

  try {
    const q = query(
      collection(db, 'topics'),
      where('facultyId', '==', facultyId),
      limit(200)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as FacultyTopic))
      .sort((a, b) => ((a.moduleNo || '').localeCompare(b.moduleNo || '')) || a.title.localeCompare(b.title));
  } catch (err) {
    console.error('[FacultyApi] Topics query failed:', err);
    return [];
  }
}

// ─── Fetch Class Sessions (legacy alias) ─────────────────────────────────

export async function fetchClassSessions(
  facultyId: string,
  dateStr?: string
): Promise<ClassSession[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];

  try {
    const constraints: any[] = [where('facultyId', '==', facultyId), limit(100)];
    if (dateStr) constraints.splice(1, 0, where('date', '==', dateStr));

    const q = query(collection(db, 'classSessions'), ...constraints);
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          subject: data.subject || '',
          subjectCode: data.subjectCode || '',
          facultyId: data.facultyId || '',
          facultyName: data.facultyName || '',
          branch: data.branch || '',
          batch: data.batch || '',
          semester: data.semester || 0,
          division: data.division || '',
          section: data.section || '',
          room: data.room || '',
          timeSlot: data.timeSlot || '',
          date: data.date || '',
          students: data.students || [],
          className: data.className || `${data.subject || ''} - ${data.batch || ''}`,
          startTime: data.startTime || (data.timeSlot ? data.timeSlot.split(' - ')[0] : ''),
          endTime: data.endTime || (data.timeSlot ? data.timeSlot.split(' - ')[1] : ''),
          status: data.status || 'scheduled',
          topicsPlanned: data.topicsPlanned || [],
          attendanceMarked: data.attendanceMarked || false,
        } as ClassSession;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  } catch (err) {
    console.error('[FacultyApi] Class sessions query failed:', err);
    return [];
  }
}

// ─── Fetch Test Papers ────────────────────────────────────────────────────

export async function fetchTestPapers(facultyId: string): Promise<TestPaper[]> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return [];

  try {
    const q = query(
      collection(db, 'testPapers'),
      where('createdBy', '==', facultyId),
      limit(100)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as TestPaper))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.error('[FacultyApi] Test papers query failed:', err);
    return [];
  }
}

export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}
