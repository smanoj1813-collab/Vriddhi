// src/api/facultyAppointmentApi.ts
import { functions, db } from '@/Firebase/config';
import { httpsCallable } from 'firebase/functions';
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
    // No fake office hours: this read was unruled before the availability
    // block, and the fallback the old code fabricated here invented three
    // slots ("Faculty Cabin 204", ...) pointing at a nonexistent office. A teacher who has
    // saved nothing has no listed hours — the request form then takes a
    // free-text preferred slot instead.
    const docRef = doc(db, 'colleges', collegeId, 'facultyAvailability', facultyId);
    const snap = await getDoc(docRef);

    const slots = snap.exists() ? snap.data()?.slots : null;
    return Array.isArray(slots) ? (slots as FacultyAvailabilitySlot[]) : [];
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

// This used to read `colleges/{collegeId}/faculty` — a collection NOTHING in
// the codebase ever wrote to (the canonical directory is the top-level
// `faculty/{uid}` docs, which students must not read wholesale: those profiles
// carry notification prefs and 2FA settings). The list was therefore always
// empty, and even the empty read was permission-denied. It now calls the
// listMentorDirectory callable, which filters the real directory by the
// caller's COLLEGE CLAIM and returns only contact-safe fields keyed by the
// faculty uid — the same key facultyAvailability documents and the
// facultyAppointments rules use.
export async function listCollegeFaculty(collegeId: string): Promise<FacultyProfileOption[]> {
  if (!collegeId) return [];

  const call = httpsCallable<Record<string, never>, { faculty: FacultyProfileOption[] }>(
    functions,
    'listMentorDirectory'
  );
  const result = await call();
  return result.data.faculty;
}
