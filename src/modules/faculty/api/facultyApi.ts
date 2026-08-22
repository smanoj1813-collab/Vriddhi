import { db } from '@/Firebase/config';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc,
  getDoc, Timestamp, orderBy, limit, writeBatch
} from 'firebase/firestore';
import { fetchFacultyWeeklySchedule } from '../../admin/api/scheduleApi';
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

  const requestedDate = dateStr || new Date().toISOString().split('T')[0];
  // Parse at local noon so an ISO date is not shifted by the browser timezone.
  const requestedDay = new Date(`${requestedDate}T12:00:00`)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();

  try {
    // Admin creates recurring classes in weeklySchedules. Turn the matching
    // weekday into dated attendance sessions for the selected date.
    const weekly = await fetchFacultyWeeklySchedule(facultyId);
    const scheduleFacultyId = weekly[0]?.facultyId || facultyId;
    const recurringSessions: FacultyClassSession[] = weekly
      .filter(item => item.dayOfWeek === requestedDay)
      .map(item => ({
        id: item.id,
        source: 'weekly',
        subject: item.subject,
        subjectCode: item.subjectCode,
        facultyId: item.facultyId,
        facultyName: item.facultyName,
        branch: item.branch,
        batch: item.batch,
        semester: item.semester,
        division: item.division,
        section: item.section,
        room: item.room,
        timeSlot: `${item.startTime}-${item.endTime}`,
        startTime: item.startTime,
        endTime: item.endTime,
        date: requestedDate,
        topicsPlanned: [],
        status: 'scheduled',
        attendanceMarked: false,
      }));

    // Preserve explicitly-created/rescheduled daily sessions. Use one server
    // filter and filter the date client-side to avoid a composite index.
    const q = query(
      collection(db, 'classSessions'),
      where('facultyId', '==', scheduleFacultyId),
      limit(100)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    const dailySessions = snap.docs
      .filter(d => d.data().date === requestedDate)
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          source: 'daily',
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
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          date: data.date || requestedDate,
          topicsPlanned: data.topicsPlanned || [],
          status: data.status || 'scheduled',
          attendanceMarked: data.attendanceMarked || false,
        } as FacultyClassSession;
      });

    // A daily session supersedes the matching recurring slot.
    const dailyKeys = new Set(dailySessions.map(session =>
      `${session.subjectCode}|${session.timeSlot}|${session.branch}|${session.batch}|${session.division}`
    ));
    return [
      ...dailySessions,
      ...recurringSessions.filter(session => !dailyKeys.has(
        `${session.subjectCode}|${session.timeSlot}|${session.branch}|${session.batch}|${session.division}`
      )),
    ].sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  } catch (err) {
    console.error('[FacultyApi] Class sessions query failed:', err);
    throw new Error('Failed to load scheduled classes. Please try again.');
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
    // Query only by tenant and filter the cohort client-side. This avoids a
    // five-field composite index and tolerates legacy numeric/string values.
    const q = query(
      collection(db, 'students'),
      where('collegeId', '==', collegeId),
      // Keep enough headroom for aggregate documents in the 500-write save batch.
      limit(450)
    );

    const snap = await getDocs(q);
    trackRead(snap.size);

    const students: FacultyStudent[] = [];

    for (const docSnap of snap.docs) {
      const d = docSnap.data();
      const studentDivision = d.division || d.section || '';
      if (
        String(d.branch || d.department || '') !== String(branch) ||
        String(d.batch || '') !== String(batch) ||
        String(studentDivision) !== String(division) ||
        Number(d.semester || 0) !== Number(semester)
      ) {
        continue;
      }

      const studentSubjects = d.subjects || d.assignedSubjects || [];
      const subjectNames = Array.isArray(studentSubjects)
        ? studentSubjects.map((item: any) => typeof item === 'string' ? item : item.name || item.subject || '')
        : [];
      if (subjectNames.length > 0 && !subjectNames.includes(subject)) continue;
      students.push(buildFacultyStudent(d, docSnap.id));
    }

    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyApi] Students query failed:', err);
    throw new Error('Failed to load students for this class.');
  }
}

// ─── Fetch Existing Attendance ─────────────────────────────────────────────

function attendanceDocumentId(sessionId: string, date: string): string {
  return `${date}_${sessionId}`.replace(/\//g, '_');
}

export async function fetchAttendanceForSession(
  sessionId: string,
  date: string
): Promise<FacultyAttendanceDoc | null> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return null;

  try {
    // New records use a deterministic ID, avoiding a query and duplicate saves.
    let docSnap = await getDoc(doc(db, 'attendance', attendanceDocumentId(sessionId, date)));
    trackRead(1);

    // Backward-compatible lookup for attendance written before deterministic IDs.
    if (!docSnap.exists()) {
      const q = query(
        collection(db, 'attendance'),
        where('sessionId', '==', sessionId),
        limit(20)
      );
      const snap = await getDocs(q);
      trackRead(snap.size);
      const legacy = snap.docs.find(candidate => candidate.data().date === date);
      if (!legacy) return null;
      docSnap = legacy;
    }

    const data = docSnap.data();
    if (!data) return null;
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
  facultyName: string,
  collegeId: string
): Promise<string> {
  const presentCount = records.filter(r => r.status === 'Present').length;
  const absentCount = records.filter(r => r.status === 'Absent').length;
  const lateCount = records.filter(r => r.status === 'Late').length;
  const leaveCount = records.filter(r => r.status === 'Leave').length;
  const onDutyCount = records.filter(r => r.status === 'OnDuty').length;
  const medicalLeaveCount = records.filter(r => r.status === 'MedicalLeave').length;
  const markedAt = new Date().toISOString();
  const timestamp = Timestamp.now();
  const documentId = attendanceDocumentId(session.id, session.date || '');

  const attendanceData = {
    collegeId,
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
    markedAt,
    markedBy: facultyName,
    records,
    presentCount,
    absentCount,
    lateCount,
    leaveCount,
    onDutyCount,
    medicalLeaveCount,
    totalStudents: records.length,
    updatedAt: timestamp,
  };

  const statusMap: Record<AttendanceStatus, string> = {
    Present: 'present',
    Absent: 'absent',
    Late: 'late',
    Leave: 'leave',
    OnDuty: 'onDuty',
    MedicalLeave: 'medicalLeave',
  };

  // Keep the detailed faculty document, per-student reporting records and
  // session summary in sync in one atomic write.
  const batch = writeBatch(db);
  batch.set(doc(db, 'attendance', documentId), attendanceData, { merge: true });

  records.forEach(record => {
    const recordId = `${documentId}_${record.studentId}`.replace(/\//g, '_');
    batch.set(doc(db, 'attendanceRecords', recordId), {
      collegeId,
      sessionId: session.id,
      classSessionId: session.id,
      studentId: record.studentId,
      studentName: record.name,
      usn: record.usn,
      regNo: record.regNo,
      status: statusMap[record.status],
      date: session.date,
      subject: session.subject,
      subjectCode: session.subjectCode,
      branch: session.branch,
      batch: session.batch,
      division: session.division,
      semester: session.semester,
      markedBy: facultyId,
      markedAt: timestamp,
      note: record.notes || '',
      notes: record.notes || '',
      updatedAt: timestamp,
    }, { merge: true });
  });

  batch.set(doc(db, 'attendanceSummary', documentId), {
    collegeId,
    sessionId: session.id,
    facultyId,
    facultyName,
    date: session.date,
    subject: session.subject,
    subjectCode: session.subjectCode,
    branch: session.branch,
    batch: session.batch,
    division: session.division,
    semester: session.semester,
    total: records.length,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    leave: leaveCount,
    onDuty: onDutyCount,
    medicalLeave: medicalLeaveCount,
    percentage: records.length ? Math.round((presentCount / records.length) * 100) : 0,
    sessions: 1,
    markedAt: timestamp,
    updatedAt: timestamp,
  }, { merge: true });

  if (session.source === 'daily') {
    batch.update(doc(db, 'classSessions', session.id), {
      attendanceMarked: true,
      markedAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await batch.commit();
  return documentId;
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
