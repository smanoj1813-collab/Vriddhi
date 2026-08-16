// src/modules/student/services/studentService.ts
import type { Assignment, AssignmentSubmission, SubmissionFile } from '../types/student';

export interface CreateAssignmentData {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  totalMarks: number;
  facultyId: string;
}

export interface ParsedImageContent {
  text: string;
  confidence: number;
}

export interface GetAssignmentsOptions {
  studentId?: string;
  status?: string;
  subject?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SubmitWithFilesOptions {
  parseImages?: boolean;
  onProgress?: (progress: number) => void;
  onImageParsed?: (fileName: string, content: ParsedImageContent) => void;
}

export const createAssignment = async (data: CreateAssignmentData): Promise<Assignment> => {
  // TODO: Implement Firestore write
  console.log('Creating assignment', data);
  return {
    id: crypto.randomUUID(),
    title: data.title,
    subject: data.subject,
    description: data.description,
    dueDate: data.dueDate,
    totalMarks: data.totalMarks,
    status: 'pending',
    attachments: [],
    createdAt: new Date().toISOString(),
  };
};

export const updateAssignment = async (id: string, data: Partial<CreateAssignmentData>): Promise<Assignment> => {
  // TODO: Implement Firestore update
  console.log('Updating assignment', id, data);
  return { 
    id, 
    title: data.title || '', 
    description: data.description || '', 
    subject: data.subject || '', 
    dueDate: data.dueDate || '', 
    totalMarks: data.totalMarks || 0, 
    status: 'pending', 
    attachments: [], 
    ...data 
  } as Assignment;
};

export const deleteAssignment = async (id: string): Promise<void> => {
  // TODO: Implement Firestore delete
  console.log('Deleting assignment', id);
};

export const getAssignmentById = async (id: string): Promise<Assignment | null> => {
  // TODO: Implement Firestore fetch
  console.log('Fetching assignment', id);
  return null;
};

export const getStudentAssignments = async (options: GetAssignmentsOptions | string): Promise<Assignment[]> => {
  const studentId = typeof options === 'string' ? options : options.studentId;
  console.log('Fetching assignments for student', studentId);
  // TODO: Wire to Firestore
  return [];
};

export const getAssignmentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<AssignmentSubmission | null> => {
  // TODO: Implement Firestore fetch
  console.log('Fetching submission for', assignmentId, studentId);
  return null;
};

export const submitAssignment = async (
  assignmentId: string, 
  studentId: string, 
  files: File[], 
  remarks?: string
): Promise<AssignmentSubmission> => {
  console.log('Submitting assignment', assignmentId, studentId, files, remarks);
  // TODO: Wire to Firestore + Storage
  return {
    id: crypto.randomUUID(),
    assignmentId,
    studentId,
    files: files.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      url: '',
      type: f.type,
      size: f.size,
    })),
    remarks,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
};

export const submitAssignmentWithFiles = async (
  assignmentId: string,
  files: File[],
  comment: string,
  options: SubmitWithFilesOptions = {}
): Promise<void> => {
  const { onProgress } = options;
  // TODO: Implement actual upload to Cloud Storage + Firestore write
  console.log('Uploading assignment', { assignmentId, files, comment, options });

  // Simulate progress
  if (onProgress) {
    for (let i = 0; i <= 100; i += 10) {
      onProgress(i);
      await new Promise((r) => setTimeout(r, 50));
    }
  }
};

export const validateFile = (file: File, allowedTypes?: string[]): ValidationResult => {
  if (!allowedTypes || allowedTypes.length === 0) return { valid: true };
  const isAllowed = allowedTypes.some(type => file.type.includes(type) || file.name.endsWith(type));
  if (!isAllowed) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getAllowedFileTypes = (submissionType?: string): string[] => {
  switch (submissionType) {
    case 'document':
    case 'file':
      return ['.pdf', '.doc', '.docx', '.txt'];
    case 'image':
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    case 'code':
    case 'text':
      return ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.txt'];
    case 'online':
      return ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    default:
      return ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
  }
};

export const isImageFile = (fileName: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
};