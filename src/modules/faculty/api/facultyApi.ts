import { db } from '@/Firebase/config';
import {
  collection, query, where, getDocs, addDoc, updateDoc, doc,
  getDoc, Timestamp, orderBy, limit, startAfter, writeBatch,
  Query, QuerySnapshot, QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore';
import { fetchFacultyWeeklySchedule } from '../../admin/api/scheduleApi';
import { ensureClassSession } from '../../admin/api/classSessionApi';
import { normalizeSessionDate, parseSlotDateKey, slotDateKey } from '@/shared/utils/sessionDate';
import { matchCohortRows, type RosterDiagnostics } from '@/shared/utils/cohortMatching';
import type {
  FacultyClassSession,
  FacultyAttendanceDoc,
  FacultyStudent,
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

// Budget for one attendance-marking page session: a full roster read (up to
// MAX_ROSTER_STUDENTS student docs, in pages) plus sessions and attendance
// lookups. This is a cost guard with a console warning and pre-emptive
// early-returns — NOT a Firestore rule.
const MAX_READS_PER_SESSION = 4000;
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
    // Division and section are SEPARATE fields (a student recorded under only
    // `section: "A"` must not be re-labelled "division A" — the cohort matcher
    // already treats the two letters as interchangeable, and display code that
    // needs "the letter" falls back across the pair).
    division: String(d.division || ''),
    section: String(d.section || ''),
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
        // S2.2: the id is the one the materialised session will have, not the
        // weeklySchedules id. Before this, attendance for a recurring class was
        // keyed on the weekly slot id and no classSessions document existed at
        // all for the class being marked — the "two writers, two shapes"
        // problem in audit finding F2. Using the deterministic id here means
        // the same day+slot always resolves to one document, whether or not an
        // admin has run Generate Sessions yet.
        id: slotDateKey(item.id, requestedDate),
        source: 'weekly',
        weeklyScheduleId: item.id,
        materialised: false,
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
        status: item.isActive === false ? 'cancelled' : 'scheduled',
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

    // Legacy rows store `date` as a yyyy-mm-dd string, an ISO datetime or a
    // Timestamp (see src/shared/utils/sessionDate.ts), so compare on the
    // normalised form rather than raw equality.
    const datedSessions = snap.docs
      .filter(d => normalizeSessionDate(d.data().date) === requestedDate)
      .map(d => {
        const data = d.data();
        const weeklyScheduleId = String(data.weeklyScheduleId || '');
        const startTime = data.startTime || '';
        const endTime = data.endTime || '';
        return {
          id: d.id,
          // A session materialised from the timetable keeps its recurring
          // parent; everything else is ad-hoc or a reschedule.
          source: weeklyScheduleId ? 'weekly' : 'daily',
          weeklyScheduleId,
          materialised: true,
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
          timeSlot: data.timeSlot || (startTime && endTime ? `${startTime}-${endTime}` : ''),
          startTime,
          endTime,
          date: normalizeSessionDate(data.date) || requestedDate,
          topicsPlanned: data.topicsPlanned || data.topicsCovered || [],
          status: data.status || 'scheduled',
          attendanceMarked: data.attendanceMarked || false,
        } as FacultyClassSession;
      });

    // Sessions materialised from the timetable supersede the virtual entry for
    // the same slot — that is the whole point of generating them.
    const materialisedBySlot = new Map<string, FacultyClassSession>();
    const dailySessions: FacultyClassSession[] = [];
    datedSessions.forEach(session => {
      if (session.weeklyScheduleId) materialisedBySlot.set(session.weeklyScheduleId, session);
      else dailySessions.push(session);
    });

    const weeklySessions = recurringSessions.map(session =>
      materialisedBySlot.get(session.weeklyScheduleId || '') || session
    );

    // An ad-hoc / rescheduled session supersedes the matching recurring slot.
    const dailyKeys = new Set(dailySessions.map(session =>
      `${session.subjectCode}|${session.timeSlot}|${session.branch}|${session.batch}|${session.division}`
    ));
    return [
      ...dailySessions,
      ...weeklySessions.filter(session => !dailyKeys.has(
        `${session.subjectCode}|${session.timeSlot}|${session.branch}|${session.batch}|${session.division}`
      )),
    ].sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  } catch (err) {
    console.error('[FacultyApi] Class sessions query failed:', err);
    throw new Error('Failed to load scheduled classes. Please try again.');
  }
}

// ─── Fetch Students for a Class Session ────────────────────────────────────

/** Firestore read page size (the cap this fetch used to apply in one shot). */
const ROSTER_PAGE_SIZE = 450;
/**
 * Hard ceiling on how many students of a college the roster scan will page
 * through. Generous enough for any real college (the save path chunks at 450
 * per batch, so size is no longer a constraint), bounded so one page cannot
 * read a runaway collection.
 */
const MAX_ROSTER_STUDENTS = 1800;

/**
 * The cohort a class session is taught to. `section` is part of the cohort —
 * it used to be dropped here, which is how a class for "A B" could never
 * find a student recorded under either letter. All matching is delegated to
 * the pure, unit-tested helpers in src/shared/utils/cohortMatching.ts so the
 * rules (normalisation, legacy-semester tolerance, per-field diagnostics)
 * live in exactly one place.
 */
export interface SessionCohort {
  branch: string;
  batch: string;
  division: string;
  section: string;
  semester: number | string;
  subject: string;
  subjectCode?: string;
}

export interface SessionRoster {
  students: FacultyStudent[];
  /**
   * Why the roster looks the way it does: the target cohort, how many
   * students the college query returned, and per-field mismatch counts with
   * the distinct values seen. Null only on the error/early-return paths.
   */
  diagnostics: RosterDiagnostics | null;
}

/**
 * Load the students of a class session, scoped to one tenant.
 *
 * The query stays `where('collegeId', '==', collegeId) + limit` — a single-
 * field equality needs no composite index, and the roster must never widen
 * across colleges. The cohort itself is filtered client-side over the loaded
 * documents (five-field composite indexes would be the alternative, and the
 * normalisation this matching needs makes those indexes useless anyway).
 *
 * The collection is read in PAGES of 450 (the single-shot cap this function
 * used to impose — a hard ceiling that silently left every student past the
 * first page out of the roster of a large college). Pagination continues up
 * to MAX_ROSTER_STUDENTS; `diagnostics.truncated` says when even that was hit.
 */
export async function fetchStudentsForSession(
  cohort: SessionCohort,
  collegeId: string
): Promise<SessionRoster> {
  if (sessionReadCount >= MAX_READS_PER_SESSION) return { students: [], diagnostics: null };
  if (!collegeId) return { students: [], diagnostics: null };

  try {
    const rows: Array<Record<string, unknown>> = [];
    const ids: string[] = [];
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

    while (rows.length < MAX_ROSTER_STUDENTS) {
      const pageQuery: Query<DocumentData> = cursor
        ? query(
            collection(db, 'students'),
            where('collegeId', '==', collegeId),
            startAfter(cursor),
            limit(ROSTER_PAGE_SIZE)
          )
        : query(
            collection(db, 'students'),
            where('collegeId', '==', collegeId),
            limit(ROSTER_PAGE_SIZE)
          );
      const snap: QuerySnapshot<DocumentData> = await getDocs(pageQuery);
      trackRead(snap.size);
      if (snap.empty) break;
      snap.docs.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
        rows.push(d.data() as Record<string, unknown>);
        ids.push(d.id);
      });
      cursor = snap.docs[snap.docs.length - 1] ?? null;
      if (snap.size < ROSTER_PAGE_SIZE) break;
    }

    const { matchedIndices, diagnostics } = matchCohortRows(
      rows,
      { ...cohort, collegeId },
      MAX_ROSTER_STUDENTS
    );

    const students: FacultyStudent[] = matchedIndices.map((i) =>
      buildFacultyStudent(rows[i], ids[i])
    ).sort((a, b) => a.name.localeCompare(b.name));

    return { students, diagnostics };
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

    // S2.2 shim: a recurring session used to be keyed on the bare weekly slot
    // id, so attendance marked before this change lives under `${date}_${weeklyId}`
    // while the session is now named `${weeklyId}_${date}`. Try the old key
    // before falling back to a query, otherwise every previously-marked
    // recurring class looks unmarked.
    if (!docSnap.exists()) {
      const legacySlot = parseSlotDateKey(sessionId);
      if (legacySlot && legacySlot.date === date) {
        docSnap = await getDoc(
          doc(db, 'attendance', attendanceDocumentId(legacySlot.weeklyScheduleId, date))
        );
        trackRead(1);
      }
    }

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

  // ─── S2.2: mark the session that exists ──────────────────────────────────
  // A recurring class that has not been materialised yet has no classSessions
  // document — only a virtual entry built from the weekly slot. Get-or-create
  // it now so attendance, attendanceRecords and attendanceSummary all point at
  // a real session, and so a second save for the same day+slot cannot create a
  // second one (audit DoD #3).
  let sessionId = session.id;
  if (!session.materialised) {
    try {
      const ensured = await ensureClassSession({
        date: normalizeSessionDate(session.date) || session.date,
        weeklyScheduleId: session.source === 'weekly'
          ? (session.weeklyScheduleId || parseSlotDateKey(session.id)?.weeklyScheduleId)
          : undefined,
        facultyId: session.facultyId || facultyId,
        facultyName: session.facultyName || facultyName,
        subject: session.subject,
        subjectCode: session.subjectCode,
        branch: session.branch,
        batch: session.batch,
        semester: session.semester,
        division: session.division,
        section: session.section,
        room: session.room,
        startTime: session.startTime,
        endTime: session.endTime,
      });
      sessionId = ensured.id;
    } catch (err) {
      // A session document is an optimisation here, not the point of the save:
      // attendance must not be lost because the callable was unavailable.
      console.warn('[FacultyApi] Could not materialise session, marking attendance anyway:', err);
    }
  }

  const documentId = attendanceDocumentId(sessionId, session.date || '');

  const attendanceData = {
    collegeId,
    sessionId,
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
  // session summary in sync.
  //
  // Firestore caps a WriteBatch at 500 operations, and one operation per
  // student is written below — so the writes are CHUNKED. The authoritative
  // documents (the `attendance` row with its embedded records, the summary and
  // the session update) commit FIRST together with the first record chunk;
  // remaining `attendanceRecords` follow in later chunks. Deterministic ids +
  // `merge` make a retry after a partial failure idempotent.
  const RECORDS_PER_BATCH = 450;
  const attendanceRef = doc(db, 'attendance', documentId);
  const summaryRef = doc(db, 'attendanceSummary', documentId);
  const sessionRef = doc(db, 'classSessions', sessionId);

  const recordWrites = records.map(record => {
    const recordId = `${documentId}_${record.studentId}`.replace(/\//g, '_');
    return {
      ref: doc(db, 'attendanceRecords', recordId),
      data: {
        collegeId,
        sessionId,
        classSessionId: sessionId,
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
      },
    };
  });

  const summaryWrite = {
    collegeId,
    sessionId,
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
  };

  // S2.2: update the session for *every* source, not just ad-hoc ones. Before
  // this, marking attendance on a recurring class never touched classSessions
  // at all, so the timetable and the attendance ledger disagreed silently
  // (audit finding F2).
  //
  // `merge` is required either way: the session may have been created by
  // ensureClassSession moments ago and a plain set would drop the fields the
  // server wrote. When we *did* just create it — or when the callable was
  // unavailable and this write is what brings the document into existence —
  // the full context goes in so the row is not left a half-empty shell that
  // only attendance understands.
  const sessionWrite: Record<string, unknown> = session.materialised
    ? {}
    : {
        subject: session.subject,
        subjectCode: session.subjectCode,
        facultyId: session.facultyId || facultyId,
        facultyName: session.facultyName || facultyName,
        branch: session.branch,
        batch: session.batch,
        semester: session.semester,
        division: session.division,
        section: session.section,
        room: session.room,
        date: normalizeSessionDate(session.date) || session.date,
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        timeSlot: session.timeSlot || '',
        weeklyScheduleId: session.weeklyScheduleId || '',
        source: session.source === 'weekly' ? 'weekly-schedule' : 'adhoc',
      };

  // First batch: the authoritative trio (attendance + summary + session update)
  // plus as many per-student records as fit under the 500-write cap.
  const firstBatch = writeBatch(db);
  firstBatch.set(attendanceRef, attendanceData, { merge: true });
  firstBatch.set(summaryRef, summaryWrite, { merge: true });
  firstBatch.set(sessionRef, {
    ...sessionWrite,
    collegeId,
    attendanceMarked: true,
    attendanceCount: records.length,
    presentCount,
    markedAt: timestamp,
    markedBy: facultyId,
    updatedAt: timestamp,
  }, { merge: true });
  recordWrites.slice(0, RECORDS_PER_BATCH).forEach(({ ref, data }) => {
    firstBatch.set(ref, data, { merge: true });
  });
  await firstBatch.commit();

  // Remaining per-student reporting records in chunks of ≤450.
  for (let start = RECORDS_PER_BATCH; start < recordWrites.length; start += RECORDS_PER_BATCH) {
    const chunkBatch = writeBatch(db);
    recordWrites.slice(start, start + RECORDS_PER_BATCH).forEach(({ ref, data }) => {
      chunkBatch.set(ref, data, { merge: true });
    });
    await chunkBatch.commit();
  }

  return documentId;
}

// ─── Create a Class Session ────────────────────────────────────────────────

export async function createClassSession(
  data: Omit<FacultyClassSession, 'id'>
): Promise<string> {
  // S2.2: this used to `addDoc` a second, incompatible session shape straight
  // from the browser — one of the two writers behind audit finding F2. It now
  // goes through the single get-or-create writer, so the caller gets back the
  // id of the session that *already exists* for this day+slot if there is one,
  // instead of creating a parallel document.
  const result = await ensureClassSession({
    date: normalizeSessionDate(data.date) || data.date,
    weeklyScheduleId: data.weeklyScheduleId,
    facultyId: data.facultyId,
    facultyName: data.facultyName,
    subject: data.subject,
    subjectCode: data.subjectCode,
    branch: data.branch,
    batch: data.batch,
    semester: data.semester,
    division: data.division,
    section: data.section,
    room: data.room,
    startTime: data.startTime,
    endTime: data.endTime,
  });
  return result.id;
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
