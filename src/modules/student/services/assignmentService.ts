// src/modules/student/services/assignmentService.ts
// Real Firestore + Storage implementation for student assignment submissions.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, storage } from '@/Firebase/config';
import type { Assignment, AssignmentSubmission, SubmissionFile } from '../types/student';

export interface CreateAssignmentData {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  facultyId: string;
}

export interface SubmitAssignmentOptions {
  parseImages?: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.zip', '.rar', '.ppt', '.pptx', '.xls', '.xlsx',
];

// ─── Validators / helpers ───────────────────────────────────────────

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `"${file.name}" exceeds the 50 MB limit.` };
  }
  const lower = file.name.toLowerCase();
  const allowed = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!allowed) {
    return { valid: false, error: `"${file.name}" is not an allowed file type.` };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getAllowedFileTypes(): string[] {
  return [...ALLOWED_EXTENSIONS];
}

export function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

// ─── Read operations ────────────────────────────────────────────────

/**
 * Fetch a single assignment by id.
 */
export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const snap = await getDoc(doc(db, 'assignments', id));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, any>;
  return {
    id: snap.id,
    title: data.title || '',
    subject: data.subject || '',
    subjectCode: data.subjectCode,
    description: data.description || '',
    dueDate: data.dueDate || '',
    dueTime: data.dueTime,
    maxMarks: data.maxMarks ?? data.totalMarks,
    totalMarks: data.totalMarks ?? data.maxMarks,
    status: data.status || 'pending',
    submissionType: data.submissionType,
    attachments: data.attachments,
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || '',
  } as Assignment;
}

/**
 * Fetch the student's submission for a given assignment (if any).
 */
export async function getAssignmentSubmission(
  assignmentId: string,
  studentId: string
): Promise<AssignmentSubmission | null> {
  const q = query(
    collection(db, 'submissions'),
    where('assignmentId', '==', assignmentId),
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc'),
    limit(1)
  );
  const snap = await getDocs(q).catch(async () => {
    // Fallback without orderBy if a composite index is missing.
    const fallback = query(
      collection(db, 'submissions'),
      where('assignmentId', '==', assignmentId),
      where('studentId', '==', studentId),
      limit(1)
    );
    return getDocs(fallback);
  });
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data() as Record<string, any>;
  return {
    id: d.id,
    assignmentId: data.assignmentId,
    studentId: data.studentId,
    files: (data.files || []) as SubmissionFile[],
    remarks: data.remarks || data.comment || '',
    status: data.status || 'submitted',
    submittedAt: data.submittedAt?.toDate?.().toISOString() || data.submittedAt || '',
    marksObtained: data.marksObtained,
    feedback: data.feedback,
    gradedAt: data.gradedAt?.toDate?.().toISOString() || data.gradedAt || '',
  } as AssignmentSubmission;
}

// ─── Write operations ───────────────────────────────────────────────

/**
 * Submit an assignment: upload each file to Cloud Storage under
 * `assignments/{assignmentId}/students/{studentId}/{timestamp}_{filename}`,
 * then write a `submissions` document.
 */
export async function submitAssignmentWithFiles(
  assignmentId: string,
  studentId: string,
  files: File[],
  remarks: string,
  options: SubmitAssignmentOptions = {}
): Promise<AssignmentSubmission> {
  if (!assignmentId || !studentId) {
    throw new Error('Missing assignment or student id.');
  }
  if (files.length === 0) {
    throw new Error('Please attach at least one file.');
  }

  // Validate all files up-front
  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) throw new Error(result.error);
  }

  const uploaded: SubmissionFile[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    if (options.signal?.aborted) throw new Error('Upload cancelled.');
    const file = files[i];
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `assignments/${assignmentId}/students/${studentId}/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const url = await getDownloadURL(storageRef);
    uploaded.push({
      id: `${i}-${safeName}`,
      name: file.name,
      url,
      type: file.type,
      size: file.size,
    });
    options.onProgress?.(Math.round(((i + 1) / total) * 100));
  }

  const submissionData = {
    assignmentId,
    studentId,
    files: uploaded,
    remarks,
    comment: remarks,
    status: 'submitted',
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'submissions'), submissionData);

  // Best-effort: mark the assignment doc's student entry as submitted when
  // it tracks submissions as a map.
  try {
    await updateDoc(doc(db, 'assignments', assignmentId), {
      [`submissions.${studentId}`]: { submissionId: docRef.id, submittedAt: new Date().toISOString() },
      updatedAt: serverTimestamp(),
    });
  } catch {
    // assignments doc may not have a submissions map — ignore.
  }

  return {
    id: docRef.id,
    assignmentId,
    studentId,
    files: uploaded,
    remarks,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  } as AssignmentSubmission;
}

/**
 * Backwards-compatible signature used by older components.
 */
export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  files: File[],
  remarks?: string
): Promise<AssignmentSubmission> {
  return submitAssignmentWithFiles(assignmentId, studentId, files, remarks || '');
}
