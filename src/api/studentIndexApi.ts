// src/api/studentIndexApi.ts
// ============================================================
// Student Index Firestore API — CRUD + Bulk Import + Stats
// Collection path: colleges/{collegeId}/students/{regNo}
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../Firebase/config';
import type {
  StudentIndex,
  StudentImportRow,
  StudentImportResult,
  StudentIndexFilter,
  StudentIndexListItem,
  StudentIndexStats,
} from '../types/students';

const PAGE_SIZE = 50;

const getCol = (collegeId: string) =>
  collection(db, 'colleges', collegeId, 'students');

const getRef = (collegeId: string, studentId: string) =>
  doc(db, 'colleges', collegeId, 'students', studentId);

// ------------------------------------------------------------------
// READ
// ------------------------------------------------------------------

export async function getStudentIndex(
  collegeId: string,
  studentId: string
): Promise<StudentIndex | null> {
  const snap = await getDoc(getRef(collegeId, studentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as StudentIndex;
}

export async function getStudentByRegNo(
  collegeId: string,
  regNo: string
): Promise<StudentIndex | null> {
  const q = query(
    getCol(collegeId),
    where('registrationNumber', '==', regNo.trim().toUpperCase()),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as StudentIndex;
}

function buildConstraints(filter: StudentIndexFilter): QueryConstraint[] {
  const c: QueryConstraint[] = [];
  if (filter.department) c.push(where('department', '==', filter.department));
  if (filter.batch !== undefined) c.push(where('batch', '==', filter.batch));
  if (filter.division) c.push(where('division', '==', filter.division));
  if (filter.mentorName) c.push(where('mentorName', '==', filter.mentorName));
  if (filter.isActive !== undefined) c.push(where('isActive', '==', filter.isActive));
  c.push(orderBy('registrationNumber', 'asc'));
  c.push(limit(PAGE_SIZE));
  return c;
}

export async function listStudentIndex(
  filter: StudentIndexFilter,
  lastDoc?: QueryDocumentSnapshot<StudentIndex> | null
): Promise<{ items: StudentIndexListItem[]; lastDoc: QueryDocumentSnapshot<StudentIndex> | null }> {
  const constraints = buildConstraints(filter);
  if (lastDoc) constraints.push(startAfter(lastDoc));

  const snap = await getDocs(query(getCol(filter.collegeId), ...constraints));

  const items: StudentIndexListItem[] = snap.docs.map((d) => {
    const s = d.data() as StudentIndex;
    return {
      id: d.id,
      name: s.name,
      registrationNumber: s.registrationNumber,
      department: s.department,
      batch: s.batch,
      division: s.division,
      mentorName: s.mentorName,
    };
  });

  return {
    items,
    lastDoc: snap.docs.length ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot<StudentIndex>) : null,
  };
}

export async function searchStudentIndex(
  collegeId: string,
  term: string
): Promise<StudentIndexListItem[]> {
  const snap = await getDocs(query(getCol(collegeId), orderBy('name'), limit(200)));
  const t = term.toLowerCase().trim();
  return snap.docs
    .map((d) => {
      const s = d.data() as StudentIndex;
      return {
        id: d.id,
        name: s.name,
        registrationNumber: s.registrationNumber,
        department: s.department,
        batch: s.batch,
        division: s.division,
        mentorName: s.mentorName,
      };
    })
    .filter((s) =>
      s.name.toLowerCase().includes(t) ||
      s.registrationNumber.toLowerCase().includes(t)
    );
}

// ------------------------------------------------------------------
// WRITE
// ------------------------------------------------------------------

export async function upsertStudentIndex(
  collegeId: string,
  studentId: string,
  data: Partial<StudentIndex>
): Promise<void> {
  const ref = getRef(collegeId, studentId);
  const now = Timestamp.now();
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, { ...data, updatedAt: now });
  } else {
    await setDoc(ref, {
      ...data,
      collegeId,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    } as StudentIndex);
  }
}

export async function deactivateStudentIndex(
  collegeId: string,
  studentId: string
): Promise<void> {
  await updateDoc(getRef(collegeId, studentId), {
    isActive: false,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteStudentIndex(
  collegeId: string,
  studentId: string
): Promise<void> {
  await deleteDoc(getRef(collegeId, studentId));
}

/** ⚠️ Nuclear option — deletes ALL students in a college */
export async function deleteAllStudentIndex(collegeId: string): Promise<number> {
  const snap = await getDocs(getCol(collegeId));
  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => {
      batch.delete(d.ref);
      count++;
    });
    await batch.commit();
  }
  return count;
}

// ------------------------------------------------------------------
// BULK IMPORT
// ------------------------------------------------------------------

export async function importStudentIndexBulk(
  collegeId: string,
  rows: StudentImportRow[],
  opts: { skipExisting?: boolean } = {}
): Promise<StudentImportResult> {
  const start = performance.now();
  const result: StudentImportResult = {
    success: true,
    total: rows.length,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    elapsedMs: 0,
  };

  const now = Timestamp.now();
  const col = getCol(collegeId);

  // Pre-check existing regNos (chunked, Firestore 'in' max = 30)
  const existing = new Set<string>();
  if (opts.skipExisting) {
    const regNos = rows.map((r) => r.registrationNumber.trim().toUpperCase());
    for (let i = 0; i < regNos.length; i += 30) {
      const chunk = regNos.slice(i, i + 30);
      const q = query(col, where('registrationNumber', 'in', chunk));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => existing.add(d.data().registrationNumber.toUpperCase()));
    }
  }

  const ops: Array<{ ref: ReturnType<typeof doc>; data: StudentIndex }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const regNo = row.registrationNumber.trim().toUpperCase();
      if (opts.skipExisting && existing.has(regNo)) {
        result.skipped++;
        continue;
      }

      const studentId = regNo;
      const data: StudentIndex = {
        id: studentId,
        collegeId,
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        registrationNumber: regNo,
        phoneNumber: String(row.phoneNumber).trim(),
        department: row.department.trim(),
        course: row.department.trim(),
        batch: Number(row.batch),
        batchString: String(row.batch),
        division: row.division.trim().toUpperCase(),
        mentorName: row.mentorName.trim(),
        createdAt: now,
        updatedAt: now,
        importedAt: now,
        isActive: true,
      };
      ops.push({ ref: doc(col, studentId), data });
    } catch (err) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        regNo: row.registrationNumber,
        message: err instanceof Error ? err.message : 'Unknown',
      });
    }
  }

  for (let i = 0; i < ops.length; i += 400) {
    const batch = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
    result.created += Math.min(400, ops.length - i);
  }

  result.elapsedMs = Math.round(performance.now() - start);
  result.success = result.failed === 0;
  return result;
}

// ------------------------------------------------------------------
// STATS
// ------------------------------------------------------------------

export async function getStudentIndexStats(collegeId: string): Promise<StudentIndexStats> {
  const snap = await getDocs(getCol(collegeId));
  const stats: StudentIndexStats = {
    total: 0,
    byDepartment: {},
    byBatch: {},
    byDivision: {},
    byMentor: {},
  };
  snap.docs.forEach((d) => {
    const s = d.data() as StudentIndex;
    if (!s.isActive) return;
    stats.total++;
    stats.byDepartment[s.department] = (stats.byDepartment[s.department] || 0) + 1;
    stats.byBatch[s.batch] = (stats.byBatch[s.batch] || 0) + 1;
    stats.byDivision[s.division] = (stats.byDivision[s.division] || 0) + 1;
    stats.byMentor[s.mentorName] = (stats.byMentor[s.mentorName] || 0) + 1;
  });
  return stats;
}