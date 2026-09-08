// src/api/facultyAppointmentApi.ts
import { db } from '@/Firebase/config';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export type MeetingType = 'doubt_clearing' | 'mentorship' | 'career_guidance' | 'project_review' | 'general';
export type AppointmentStatus = 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';

export interface FacultyAppointment {
  id: string;
  collegeId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentBatch?: string;
  studentBranch?: string;
  studentRegNo?: string;
  facultyId: string;
  facultyName: string;
  facultyEmail?: string;
  subject: string;
  topic: string;
  doubtDescription: string;
  meetingType: MeetingType;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string; // e.g. "14:00 - 15:00"
  status: AppointmentStatus;
  facultyRemarks?: string;
  meetingLocation?: string; // Room number or Virtual meeting link
  createdAt: string;
  updatedAt: string;
}

export interface FacultyAvailabilitySlot {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string; // "14:00"
  endTime: string;   // "16:00"
  location: string;  // "Cabin 302" or "Google Meet"
  isAcceptingRequests: boolean;
}

export interface FacultyProfileOption {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  subjects?: string[];
}

// ─── APPOINTMENT QUERIES & MUTATIONS ───

export async function createAppointmentRequest(
  collegeId: string,
  data: Omit<FacultyAppointment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> {
  if (!collegeId) throw new Error('collegeId is required to create an appointment request');

  const ref = collection(db, 'colleges', collegeId, 'facultyAppointments');
  const docRef = await addDoc(ref, {
    ...data,
    collegeId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    serverCreatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function getStudentAppointments(
  collegeId: string,
  studentId: string
): Promise<FacultyAppointment[]> {
  if (!collegeId || !studentId) return [];

  try {
    const ref = collection(db, 'colleges', collegeId, 'facultyAppointments');
    const q = query(ref, where('studentId', '==', studentId));
    const snap = await getDocs(q);

    const appointments: FacultyAppointment[] = [];
    snap.forEach((d) => {
      appointments.push({ id: d.id, ...d.data() } as FacultyAppointment);
    });

    return appointments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Failed to get student appointments:', err);
    return [];
  }
}

export async function getFacultyAppointments(
  collegeId: string,
  facultyId: string
): Promise<FacultyAppointment[]> {
  if (!collegeId || !facultyId) return [];

  try {
    const ref = collection(db, 'colleges', collegeId, 'facultyAppointments');
    const q = query(ref, where('facultyId', '==', facultyId));
    const snap = await getDocs(q);

    const appointments: FacultyAppointment[] = [];
    snap.forEach((d) => {
      appointments.push({ id: d.id, ...d.data() } as FacultyAppointment);
    });

    return appointments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('Failed to get faculty appointments:', err);
    return [];
  }
}

export async function updateAppointmentStatus(
  collegeId: string,
  appointmentId: string,
  status: AppointmentStatus,
  remarks?: string,
  meetingLocation?: string
): Promise<void> {
  if (!collegeId || !appointmentId) throw new Error('collegeId and appointmentId required');

  const docRef = doc(db, 'colleges', collegeId, 'facultyAppointments', appointmentId);
  const updatePayload: Record<string, unknown> = {
    status,
    updatedAt: new Date().toISOString(),
  };

  if (remarks !== undefined) updatePayload.facultyRemarks = remarks;
  if (meetingLocation !== undefined) updatePayload.meetingLocation = meetingLocation;

  await updateDoc(docRef, updatePayload);
}

// ─── FACULTY AVAILABILITY (OFFICE HOURS) ───

export async function getFacultyAvailabilitySlots(
  collegeId: string,
  facultyId: string
): Promise<FacultyAvailabilitySlot[]> {
  if (!collegeId || !facultyId) return [];

  try {
    const docRef = doc(db, 'colleges', collegeId, 'facultyAvailability', facultyId);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data()?.slots) {
      return snap.data().slots as FacultyAvailabilitySlot[];
    }
    return [
      { id: '1', dayOfWeek: 'Monday', startTime: '15:00', endTime: '16:30', location: 'Faculty Cabin 204', isAcceptingRequests: true },
      { id: '2', dayOfWeek: 'Wednesday', startTime: '15:00', endTime: '16:30', location: 'Faculty Cabin 204', isAcceptingRequests: true },
      { id: '3', dayOfWeek: 'Friday', startTime: '14:00', endTime: '15:30', location: 'Google Meet', isAcceptingRequests: true },
    ];
  } catch (err) {
    console.warn('Failed to load faculty availability:', err);
    return [];
  }
}

export async function saveFacultyAvailabilitySlots(
  collegeId: string,
  facultyId: string,
  slots: FacultyAvailabilitySlot[]
): Promise<void> {
  if (!collegeId || !facultyId) throw new Error('collegeId and facultyId required');

  const docRef = doc(db, 'colleges', collegeId, 'facultyAvailability', facultyId);
  await setDoc(docRef, {
    facultyId,
    slots,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// ─── LIST COLLEGE FACULTY ───

export async function listCollegeFaculty(collegeId: string): Promise<FacultyProfileOption[]> {
  if (!collegeId) return [];

  try {
    const ref = collection(db, 'colleges', collegeId, 'faculty');
    const snap = await getDocs(ref);

    const facultyList: FacultyProfileOption[] = [];
    snap.forEach((d) => {
      const data = d.data();
      facultyList.push({
        id: d.id,
        name: data.name || data.fullName || 'Faculty Member',
        email: data.email || '',
        department: data.department || data.branch || '',
        designation: data.designation || 'Assistant Professor',
        subjects: Array.isArray(data.subjects) ? data.subjects : (data.subject ? [data.subject] : []),
      });
    });

    return facultyList;
  } catch (err) {
    console.error('Failed to list college faculty:', err);
    return [];
  }
}
