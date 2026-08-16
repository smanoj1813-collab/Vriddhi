// src/api/facultyStudentIndexApi.ts
// ============================================================
// Faculty API v2 — Queries Student Index (colleges/{id}/students)
// Backward compatible with existing faculty components
// ============================================================

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../Firebase/config';
import type { StudentIndex } from '../types/students';
import type { FacultyStudent } from '../modules/faculty/types/attendance';
import { toFacultyStudent } from '../utils/facultyStudentMapper';

const MAX_READS = 500;
let readCount = 0;

function trackRead(n: number) {
  readCount += n;
  if (readCount > MAX_READS) {
    console.warn(`[FacultyStudentIndexApi] Read cap: ${readCount}/${MAX_READS}`);
  }
}

// ─── Get Faculty Profile ──────────────────────────────────────────────────

export async function getFacultyProfile(facultyId: string) {
  const snap = await getDoc(doc(db, 'faculty', facultyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as any;
}

// ─── Fetch Students by Faculty ID (uses linked mentorId) ─────────────────

export async function fetchFacultyStudentsById(
  facultyId: string,
  collegeId: string
): Promise<FacultyStudent[]> {
  if (!collegeId || !facultyId) return [];

  try {
    const q = query(
      collection(db, 'colleges', collegeId, 'students'),
      where('facultyId', '==', facultyId),
      where('isActive', '==', true),
      limit(200)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => toFacultyStudent({ id: d.id, ...d.data() } as StudentIndex))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyStudentIndexApi] By facultyId failed:', err);
    return [];
  }
}

// ─── Fetch Students by Mentor Name (fallback) ────────────────────────────

export async function fetchFacultyStudentsByName(
  mentorName: string,
  collegeId: string
): Promise<FacultyStudent[]> {
  if (!collegeId || !mentorName) return [];

  try {
    const q = query(
      collection(db, 'colleges', collegeId, 'students'),
      where('mentorName', '==', mentorName),
      where('isActive', '==', true),
      limit(200)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => toFacultyStudent({ id: d.id, ...d.data() } as StudentIndex))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyStudentIndexApi] By mentorName failed:', err);
    return [];
  }
}

// ─── Fetch Students by Department (for HOD / dept faculty) ───────────────

export async function fetchFacultyStudentsByDepartment(
  department: string,
  collegeId: string,
  batch?: number
): Promise<FacultyStudent[]> {
  if (!collegeId || !department) return [];

  try {
    const constraints: any[] = [
      where('department', '==', department),
      where('isActive', '==', true),
      limit(200),
    ];
    if (batch !== undefined) constraints.splice(1, 0, where('batch', '==', batch));

    const q = query(collection(db, 'colleges', collegeId, 'students'), ...constraints);
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => toFacultyStudent({ id: d.id, ...d.data() } as StudentIndex))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyStudentIndexApi] By department failed:', err);
    return [];
  }
}

// ─── Unified Fetch (tries facultyId → mentorName → department) ──────────

export async function fetchFacultyStudentsUnified(
  facultyId: string,
  collegeId: string,
  opts?: {
    facultyName?: string;
    department?: string;
    batch?: number;
  }
): Promise<FacultyStudent[]> {
  // Try 1: By facultyId (most accurate after linking)
  let students = await fetchFacultyStudentsById(facultyId, collegeId);
  if (students.length > 0) return students;

  // Try 2: By mentor name
  if (opts?.facultyName) {
    students = await fetchFacultyStudentsByName(opts.facultyName, collegeId);
    if (students.length > 0) return students;
  }

  // Try 3: By department
  if (opts?.department) {
    students = await fetchFacultyStudentsByDepartment(
      opts.department,
      collegeId,
      opts.batch
    );
  }

  return students;
}

// ─── Fetch for Class Session (by dept + batch + division) ────────────────

export async function fetchStudentsForClassSession(
  collegeId: string,
  department: string,
  batch: number,
  division: string
): Promise<FacultyStudent[]> {
  if (!collegeId) return [];

  try {
    const q = query(
      collection(db, 'colleges', collegeId, 'students'),
      where('department', '==', department),
      where('batch', '==', batch),
      where('division', '==', division),
      where('isActive', '==', true),
      limit(100)
    );
    const snap = await getDocs(q);
    trackRead(snap.size);

    return snap.docs
      .map((d) => toFacultyStudent({ id: d.id, ...d.data() } as StudentIndex))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error('[FacultyStudentIndexApi] Class session failed:', err);
    return [];
  }
}

// ─── Stats ───────────────────────────────────────────────────────────────

export async function getFacultyStudentStats(
  facultyId: string,
  collegeId: string
): Promise<{
  total: number;
  byDepartment: Record<string, number>;
  byBatch: Record<string, number>;
  byDivision: Record<string, number>;
}> {
  const students = await fetchFacultyStudentsById(facultyId, collegeId);
  const stats = {
    total: students.length,
    byDepartment: {} as Record<string, number>,
    byBatch: {} as Record<string, number>,
    byDivision: {} as Record<string, number>,
  };

  // FacultyStudent uses 'branch' (not 'course') per your attendance.ts
  students.forEach((s) => {
    stats.byDepartment[s.branch || 'Unknown'] = (stats.byDepartment[s.branch || 'Unknown'] || 0) + 1;
    stats.byBatch[s.batch || 'Unknown'] = (stats.byBatch[s.batch || 'Unknown'] || 0) + 1;
  });

  return stats;
}