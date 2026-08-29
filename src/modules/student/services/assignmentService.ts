// src/modules/student/services/assignmentService.ts
// Server-authorized assignment submission with tracked Storage upload sessions.
import { deleteObject, ref, uploadBytes } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { functions, storage } from '@/Firebase/config';
import type { AssignmentSubmission, SubmissionFile } from '../types/student';

export interface SubmitAssignmentOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

interface UploadedSubmissionFile {
  name: string;
  storagePath: string;
  contentType: string;
  size: number;
}

interface BeginSubmissionResponse {
  sessionId: string;
  studentId: string;
  uploadBase: string;
  expiresAt: string;
}

interface FinalizeSubmissionResponse {
  id: string;
  assignmentId: string;
  studentId: string;
  status: string;
  submittedAt: string;
  files: UploadedSubmissionFile[];
  remarks: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
];
const ALLOWED_CONTENT_TYPES = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|image\/.*)$/;

const beginSubmission = httpsCallable<
  { assignmentId: string },
  BeginSubmissionResponse
>(functions, 'beginMyAssignmentSubmission');

const finalizeSubmission = httpsCallable<
  {
    assignmentId: string;
    sessionId: string;
    remarks: string;
    files: UploadedSubmissionFile[];
  },
  FinalizeSubmissionResponse
>(functions, 'finalizeMyAssignmentSubmission');

const cancelSubmission = httpsCallable<
  { sessionId: string },
  { success: boolean }
>(functions, 'cancelMyAssignmentSubmission');

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size < 1) {
    return { valid: false, error: `"${file.name}" is empty.` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `"${file.name}" exceeds the 10 MB limit.` };
  }
  const lower = file.name.toLowerCase();
  const allowedExtension = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!allowedExtension || !ALLOWED_CONTENT_TYPES.test(file.type)) {
    return { valid: false, error: `"${file.name}" is not an allowed file type.` };
  }
  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getAllowedFileTypes(): string[] {
  return [...ALLOWED_EXTENSIONS];
}

export function isImageFile(fileName: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

/**
 * Creates an expiring server-side upload session, uploads each validated file,
 * and asks the server to verify Storage metadata and transactionally finalize
 * exactly one submission. Failed sessions are cancelled and cleaned up.
 */
export async function submitAssignmentWithFiles(
  assignmentId: string,
  studentId: string,
  files: File[],
  remarks: string,
  options: SubmitAssignmentOptions = {}
): Promise<AssignmentSubmission> {
  if (!assignmentId || !studentId) {
    throw new Error('Missing assignment or student profile.');
  }
  if (files.length < 1 || files.length > MAX_FILES) {
    throw new Error(`Attach between 1 and ${MAX_FILES} files.`);
  }
  if (remarks.length > 2000) {
    throw new Error('Comments cannot exceed 2,000 characters.');
  }
  files.forEach((file) => {
    const result = validateFile(file);
    if (!result.valid) throw new Error(result.error);
  });

  let sessionId = '';
  const uploadedPaths: string[] = [];

  try {
    if (options.signal?.aborted) throw new Error('Upload cancelled.');
    const session = (await beginSubmission({ assignmentId })).data;
    sessionId = session.sessionId;
    if (session.studentId !== studentId) {
      throw new Error('Your student profile changed. Refresh the page and try again.');
    }

    const uploaded: UploadedSubmissionFile[] = [];
    for (let index = 0; index < files.length; index++) {
      if (options.signal?.aborted) throw new Error('Upload cancelled.');
      const file = files[index];
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${session.uploadBase}/${Date.now()}_${index}_${safeName}`;
      await uploadBytes(ref(storage, storagePath), file, { contentType: file.type });
      uploadedPaths.push(storagePath);
      uploaded.push({
        name: file.name,
        storagePath,
        contentType: file.type,
        size: file.size,
      });
      options.onProgress?.(Math.round(((index + 1) / files.length) * 90));
    }

    const finalized = (await finalizeSubmission({
      assignmentId,
      sessionId,
      remarks: remarks.trim(),
      files: uploaded,
    })).data;
    options.onProgress?.(100);

    const submissionFiles: SubmissionFile[] = finalized.files.map((file, index) => ({
      id: `${index}-${file.storagePath}`,
      name: file.name,
      url: '',
      type: file.contentType,
      size: file.size,
      storagePath: file.storagePath,
    }));

    return {
      id: finalized.id,
      assignmentId: finalized.assignmentId,
      studentId: finalized.studentId,
      files: submissionFiles,
      remarks: finalized.remarks,
      status: finalized.status,
      submittedAt: finalized.submittedAt,
    };
  } catch (error) {
    // The server-side session cleanup is canonical. Direct deletes are a
    // fallback for a transient callable failure while Storage is reachable.
    if (sessionId) {
      try {
        await cancelSubmission({ sessionId });
      } catch {
        await Promise.allSettled(
          uploadedPaths.map((path) => deleteObject(ref(storage, path)))
        );
      }
    }
    throw error;
  }
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  files: File[],
  remarks?: string
): Promise<AssignmentSubmission> {
  return submitAssignmentWithFiles(assignmentId, studentId, files, remarks || '');
}
