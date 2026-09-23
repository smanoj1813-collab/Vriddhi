// src/modules/admin/api/examManagementApi.ts
// Karnataka University Examination Management API

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type {
  ExamSession,
  ExamSubject,
  HallTicket,
  ExamRoom,
  RoomAllotment,
  UniversityNotification,
  UniversityResult,
  CreateExamSessionInput,
  GenerateHallTicketsInput,
  AllotRoomsInput,
} from '../types/examManagement';
import { calculateSchemeAttendanceMarks, DEFAULT_SCHEME_PACK } from '@/shared/utils/schemeEngine';
import { getCollegeSchemePack } from './schemePackApi';

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id');
  if (!id) throw new Error('No college ID found. Please re-login.');
  return id;
}

function toISO(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  if (ts.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

// ─── Exam Sessions ─────────────────────────────────────────────────

export async function createExamSession(input: CreateExamSessionInput): Promise<ExamSession> {
  const collegeId = getCollegeId();
  const now = new Date().toISOString();
  
  const data = {
    collegeId,
    ...input,
    status: 'draft' as const,
    totalStudents: 0,
    totalSubjects: 0,
    hallTicketsGenerated: 0,
    hallTicketsDownloaded: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'colleges', collegeId, 'examSessions'), data);
  
  return {
    id: ref.id,
    collegeId,
    ...input,
    status: 'draft',
    totalStudents: 0,
    totalSubjects: 0,
    hallTicketsGenerated: 0,
    hallTicketsDownloaded: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listExamSessions(filters?: {
  semester?: number;
  course?: string;
  status?: string;
  academicYear?: string;
}): Promise<ExamSession[]> {
  const collegeId = getCollegeId();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  
  if (filters?.semester) constraints.push(where('semester', '==', filters.semester));
  if (filters?.course) constraints.push(where('course', '==', filters.course));
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.academicYear) constraints.push(where('academicYear', '==', filters.academicYear));

  const q = query(collection(db, 'colleges', collegeId, 'examSessions'), ...constraints, limit(100));
  const snap = await getDocs(q);
  
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } as ExamSession;
  });
}

export async function getExamSession(sessionId: string): Promise<ExamSession | null> {
  const collegeId = getCollegeId();
  const snap = await getDoc(doc(db, 'colleges', collegeId, 'examSessions', sessionId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  } as ExamSession;
}

export async function updateExamSession(sessionId: string, updates: Partial<ExamSession>): Promise<void> {
  const collegeId = getCollegeId();
  await updateDoc(doc(db, 'colleges', collegeId, 'examSessions', sessionId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ─── Exam Subjects ─────────────────────────────────────────────────

export async function addExamSubject(sessionId: string, subject: Omit<ExamSubject, 'id' | 'examSessionId'>): Promise<ExamSubject> {
  const collegeId = getCollegeId();
  const ref = await addDoc(collection(db, 'colleges', collegeId, 'examSessions', sessionId, 'subjects'), {
    ...subject,
    examSessionId: sessionId,
    createdAt: serverTimestamp(),
  });
  
  return {
    id: ref.id,
    examSessionId: sessionId,
    ...subject,
  };
}

export async function listExamSubjects(sessionId: string): Promise<ExamSubject[]> {
  const collegeId = getCollegeId();
  const q = query(collection(db, 'colleges', collegeId, 'examSessions', sessionId, 'subjects'), orderBy('examDate', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ExamSubject));
}

// ─── Hall Tickets ──────────────────────────────────────────────────

export async function generateHallTickets(input: GenerateHallTicketsInput): Promise<{ generated: number; blocked: number; errors: string[] }> {
  const collegeId = getCollegeId();
  // G1: attendance blocking + IA attendance marks come from the college's
  // assigned university scheme pack (BCU default when unassigned).
  const pack = await getCollegeSchemePack(collegeId).then((r) => r.pack).catch(() => DEFAULT_SCHEME_PACK);
  const session = await getExamSession(input.examSessionId);
  if (!session) throw new Error('Exam session not found');

  // Get students - filter by course/semester/batch if needed
  const studentConstraints: QueryConstraint[] = [where('collegeId', '==', collegeId)];
  if (session.course) studentConstraints.push(where('course', '==', session.course));
  if (session.batch) studentConstraints.push(where('batch', '==', session.batch));
  
  const studentQuery = query(collection(db, 'students'), ...studentConstraints, limit(500));
  const studentSnap = await getDocs(studentQuery);
  
  let students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  
  // Filter by specific IDs if provided
  if (input.studentIds && input.studentIds.length > 0) {
    students = students.filter(s => input.studentIds!.includes(s.id));
  }

  // Get subjects for this exam
  const subjects = await listExamSubjects(input.examSessionId);

  const batch = writeBatch(db);
  let generated = 0;
  let blocked = 0;
  const errors: string[] = [];

  for (const student of students) {
    try {
      // Check attendance eligibility if required
      let attendanceEligibility: HallTicket['attendanceEligibility'] | undefined;
      
      if (input.checkAttendanceEligibility) {
        // Fetch attendance records for this student
        // Simplified: get overall attendance percentage
        const attendanceQuery = query(
          collection(db, 'attendanceRecords'),
          where('studentId', '==', student.id),
          where('collegeId', '==', collegeId),
          limit(200)
        );
        const attendanceSnap = await getDocs(attendanceQuery);
        
        let present = 0;
        let total = attendanceSnap.docs.length;
        attendanceSnap.docs.forEach(doc => {
          const status = doc.data().status;
          if (status === 'present' || status === 'onDuty') present++;
        });
        
        const percentage = total > 0 ? (present / total) * 100 : 100;
        // The admin override wins; otherwise the pack's ordinance floor rules.
        const minPercentage = input.minAttendancePercentage || pack.attendance.minimumPercentage;
        const isEligible = pack.attendance.blocksExamEligibility
          ? percentage >= minPercentage
          : true;

        const attResult = calculateSchemeAttendanceMarks(percentage, pack);

        attendanceEligibility = {
          isEligible,
          overallPercentage: percentage,
          subjectWise: [], // TODO: subject-wise breakdown
          remarks: isEligible
            ? `${attResult.remarks} (${pack.code})`
            : `Blocked - ${percentage.toFixed(1)}% below ${minPercentage}% (${pack.code})`,
        };

        if (!isEligible) {
          blocked++;
          // Still create hall ticket but blocked
        }
      }

      const hallTicketNo = `HT-${session.academicYear.replace('/', '')}-${session.semester}-${student.regNo || student.id.slice(0, 6).toUpperCase()}`;
      
      const hallTicketData: Omit<HallTicket, 'id'> = {
        examSessionId: input.examSessionId,
        collegeId,
        studentId: student.id,
        studentName: student.name || 'Unknown',
        regNo: student.regNo || student.registrationNumber || student.usn || student.id,
        uucmsCandidateId: student.uucmsCandidateId || student.candidateId,
        uucmsUSN: student.uucmsUSN || student.usn,
        course: student.course || session.course,
        semester: student.semester || session.semester,
        branch: student.branch,
        batch: student.batch || session.batch || '',
        photoUrl: student.photoUrl || student.avatar,
        examTitle: session.title,
        academicYear: session.academicYear,
        subjects: subjects.map(s => ({
          subjectCode: s.subjectCode,
          subjectName: s.subjectName,
          examDate: s.examDate,
          examTime: s.examTime,
          isAppearing: true,
        })),
        hallTicketNo,
        status: attendanceEligibility && !attendanceEligibility.isEligible ? 'blocked' : 'generated',
        blockedReason: attendanceEligibility && !attendanceEligibility.isEligible ? attendanceEligibility.remarks : undefined,
        attendanceEligibility,
        examCenter: input.examCenter || 'Main Campus',
        examCenterCode: input.examCenterCode || collegeId.slice(0, 6).toUpperCase(),
        qrCodeData: JSON.stringify({
          htNo: hallTicketNo,
          usn: student.regNo,
          exam: session.title,
          college: collegeId,
          verify: `https://vriddhi.app/verify/${hallTicketNo}`,
        }),
        verificationUrl: `https://vriddhi.app/verify/${hallTicketNo}`,
        generatedAt: new Date().toISOString(),
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ref = doc(collection(db, 'colleges', collegeId, 'examSessions', input.examSessionId, 'hallTickets'));
      batch.set(ref, {
        ...hallTicketData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        generatedAt: serverTimestamp(),
      });
      
      generated++;
    } catch (err) {
      errors.push(`Student ${student.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  await batch.commit();

  // Update session stats
  await updateExamSession(input.examSessionId, {
    hallTicketsGenerated: generated,
    status: 'hall_tickets_generated',
  } as any);

  return { generated, blocked, errors };
}

export async function listHallTickets(sessionId: string, filters?: {
  status?: string;
  course?: string;
  search?: string;
}): Promise<HallTicket[]> {
  const collegeId = getCollegeId();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  
  const q = query(collection(db, 'colleges', collegeId, 'examSessions', sessionId, 'hallTickets'), ...constraints, limit(200));
  const snap = await getDocs(q);
  
  let tickets = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
      generatedAt: data.generatedAt ? toISO(data.generatedAt) : undefined,
      downloadedAt: data.downloadedAt ? toISO(data.downloadedAt) : undefined,
    } as HallTicket;
  });

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    tickets = tickets.filter(t => 
      t.studentName.toLowerCase().includes(search) ||
      t.regNo.toLowerCase().includes(search) ||
      t.hallTicketNo.toLowerCase().includes(search)
    );
  }

  return tickets;
}

export async function downloadHallTicket(sessionId: string, hallTicketId: string): Promise<void> {
  const collegeId = getCollegeId();
  const ref = doc(db, 'colleges', collegeId, 'examSessions', sessionId, 'hallTickets', hallTicketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Hall ticket not found');
  
  const data = snap.data();
  await updateDoc(ref, {
    status: 'downloaded',
    downloadedAt: serverTimestamp(),
    lastDownloadedAt: serverTimestamp(),
    downloadCount: (data.downloadCount || 0) + 1,
    updatedAt: serverTimestamp(),
  });
}

// ─── Exam Rooms ────────────────────────────────────────────────────

export async function createExamRoom(room: Omit<ExamRoom, 'id' | 'collegeId' | 'createdAt'>): Promise<ExamRoom> {
  const collegeId = getCollegeId();
  const ref = await addDoc(collection(db, 'colleges', collegeId, 'examRooms'), {
    ...room,
    collegeId,
    createdAt: serverTimestamp(),
  });
  
  return {
    id: ref.id,
    collegeId,
    ...room,
    createdAt: new Date().toISOString(),
  };
}

export async function listExamRooms(): Promise<ExamRoom[]> {
  const collegeId = getCollegeId();
  const q = query(collection(db, 'colleges', collegeId, 'examRooms'), orderBy('roomNo', 'asc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: toISO(d.data().createdAt),
  } as ExamRoom));
}

// ─── Room Allotment ────────────────────────────────────────────────

export async function allotRooms(input: AllotRoomsInput): Promise<RoomAllotment[]> {
  const collegeId = getCollegeId();
  
  // Get hall tickets for this exam session
  const hallTickets = await listHallTickets(input.examSessionId);
  const eligibleTickets = hallTickets.filter(ht => ht.status !== 'blocked');
  
  // Get rooms
  const rooms: ExamRoom[] = [];
  for (const roomId of input.roomIds) {
    const roomSnap = await getDoc(doc(db, 'colleges', collegeId, 'examRooms', roomId));
    if (roomSnap.exists()) {
      rooms.push({ id: roomSnap.id, ...roomSnap.data() } as ExamRoom);
    }
  }

  if (rooms.length === 0) throw new Error('No valid rooms found');
  if (eligibleTickets.length === 0) throw new Error('No eligible students for allotment');

  // Sort students based on strategy
  let sortedStudents = [...eligibleTickets];
  switch (input.allocationStrategy) {
    case 'regNo_wise':
      sortedStudents.sort((a, b) => a.regNo.localeCompare(b.regNo));
      break;
    case 'branch_wise':
      sortedStudents.sort((a, b) => (a.branch || '').localeCompare(b.branch || '') || a.regNo.localeCompare(b.regNo));
      break;
    case 'random':
      sortedStudents = sortedStudents.sort(() => Math.random() - 0.5);
      break;
    case 'sequential':
    default:
      // Keep as is
      break;
  }

  const batch = writeBatch(db);
  const allotments: RoomAllotment[] = [];
  let studentIndex = 0;

  for (const room of rooms) {
    if (studentIndex >= sortedStudents.length) break;

    const roomCapacity = room.capacity;
    const studentsInRoom = sortedStudents.slice(studentIndex, studentIndex + roomCapacity);
    
    const allotment: Omit<RoomAllotment, 'id'> = {
      examSessionId: input.examSessionId,
      collegeId,
      roomId: room.id,
      roomNo: room.roomNo,
      building: room.building,
      examDate: input.examDate,
      examTime: input.examTime,
      subjectCode: input.subjectCode,
      subjectName: input.subjectCode, // Will be enriched
      totalSeats: roomCapacity,
      allottedSeats: studentsInRoom.length,
      students: studentsInRoom.map((ht, idx) => ({
        studentId: ht.studentId,
        studentName: ht.studentName,
        regNo: ht.regNo,
        seatNo: `${room.roomNo}-${String(idx + 1).padStart(2, '0')}`,
        hallTicketNo: ht.hallTicketNo,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(collection(db, 'colleges', collegeId, 'examSessions', input.examSessionId, 'roomAllotments'));
    batch.set(ref, {
      ...allotment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    allotments.push({ id: ref.id, ...allotment });
    studentIndex += roomCapacity;
  }

  await batch.commit();
  return allotments;
}

export async function listRoomAllotments(sessionId: string, examDate?: string): Promise<RoomAllotment[]> {
  const collegeId = getCollegeId();
  const constraints: QueryConstraint[] = [orderBy('roomNo', 'asc')];
  if (examDate) constraints.push(where('examDate', '==', examDate));
  
  const q = query(collection(db, 'colleges', collegeId, 'examSessions', sessionId, 'roomAllotments'), ...constraints, limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: toISO(d.data().createdAt),
    updatedAt: toISO(d.data().updatedAt),
  } as RoomAllotment));
}

// ─── University Notifications (Uniclare Killer Features) ───────────

export async function createUniversityNotification(notification: Omit<UniversityNotification, 'id' | 'collegeId' | 'createdAt' | 'createdBy'>): Promise<UniversityNotification> {
  const collegeId = getCollegeId();
  const now = new Date().toISOString();
  
  // Get current user
  const userEmail = localStorage.getItem('vriddhi_user_email') || 'admin';
  
  const data = {
    collegeId,
    ...notification,
    createdBy: userEmail,
    createdAt: serverTimestamp(),
    sentAt: notification.scheduledAt ? null : serverTimestamp(),
  };

  const ref = await addDoc(collection(db, 'colleges', collegeId, 'universityNotifications'), data);
  
  // Also create entries in top-level notifications collection for student feed
  // This matches the existing notification system
  if (!notification.scheduledAt) {
    const batch = writeBatch(db);
    
    // Get target students
    let targetStudentIds = notification.targetStudentIds || [];
    
    if (targetStudentIds.length === 0 && (notification.targetCourses || notification.targetSemesters)) {
      const studentConstraints: QueryConstraint[] = [where('collegeId', '==', collegeId)];
      if (notification.targetCourses && notification.targetCourses.length > 0) {
        // Firestore doesn't support array-contains-any with other filters easily, so we filter in memory
      }
      const studentQuery = query(collection(db, 'students'), ...studentConstraints, limit(500));
      const studentSnap = await getDocs(studentQuery);
      let students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      if (notification.targetCourses && notification.targetCourses.length > 0) {
        students = students.filter(s => notification.targetCourses!.includes(s.course));
      }
      if (notification.targetSemesters && notification.targetSemesters.length > 0) {
        students = students.filter(s => notification.targetSemesters!.includes(s.semester));
      }
      
      targetStudentIds = students.map(s => s.id);
    }

    // Create notification for each student
    for (const studentId of targetStudentIds.slice(0, 100)) { // Limit to 100 for batch
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        studentId,
        collegeId,
        title: notification.title,
        message: notification.message,
        type: notification.type === 'fee_last_date_alert' || notification.type === 'result_announcement' ? 'warning' : 'info',
        category: 'university',
        universityType: notification.type,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        read: false,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  return {
    id: ref.id,
    collegeId,
    ...notification,
    createdBy: userEmail,
    createdAt: now,
    sentAt: notification.scheduledAt ? undefined : now,
  };
}

export async function listUniversityNotifications(filters?: {
  type?: string;
  priority?: string;
}): Promise<UniversityNotification[]> {
  const collegeId = getCollegeId();
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  
  if (filters?.type) constraints.push(where('type', '==', filters.type));
  if (filters?.priority) constraints.push(where('priority', '==', filters.priority));

  const q = query(collection(db, 'colleges', collegeId, 'universityNotifications'), ...constraints, limit(100));
  const snap = await getDocs(q);
  
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    createdAt: toISO(d.data().createdAt),
    sentAt: d.data().sentAt ? toISO(d.data().sentAt) : undefined,
  } as UniversityNotification));
}
