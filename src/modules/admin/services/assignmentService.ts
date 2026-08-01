// src/services/assignmentService.ts
// Assignment upload service with image parsing & OCR capabilities

import type { AssignmentSubmission, SubmissionFile } from '../types/student';

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  document: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'],
  code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.mkv'],
  presentation: ['.ppt', '.pptx', '.key'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES_PER_SUBMISSION = 10;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface ParsedImageContent {
  text: string;
  confidence: number;
  language: string;
  blocks: TextBlock[];
}

interface TextBlock {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

/**
 * Validate a file before upload
 */
export function validateFile(file: File, allowedTypes?: string[]): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
    };
  }

  // Check file type
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const allSupported = Object.values(SUPPORTED_FILE_TYPES).flat();

  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `File type ${extension} not allowed. Allowed: ${allowedTypes.join(', ')}`,
      };
    }
  } else if (!allSupported.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type: ${extension}`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
export function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    pdf: 'FileText',
    doc: 'FileText',
    docx: 'FileText',
    txt: 'FileText',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    webp: 'Image',
    mp4: 'Video',
    mov: 'Video',
    zip: 'Archive',
    rar: 'Archive',
    js: 'Code',
    ts: 'Code',
    py: 'Code',
    java: 'Code',
    cpp: 'Code',
    html: 'Code',
    css: 'Code',
    ppt: 'Presentation',
    pptx: 'Presentation',
  };
  return iconMap[ext || ''] || 'File';
}

/**
 * Parse image content using OCR (simulated - integrate with Tesseract.js or cloud OCR)
 */
export async function parseImageContent(file: File): Promise<ParsedImageContent> {
  // TODO: Integrate with actual OCR service
  // Options:
  // 1. Tesseract.js (client-side, free)
  // 2. Google Cloud Vision API (server-side, paid)
  // 3. AWS Textract (server-side, paid)

  // Simulated response for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        text: `[OCR Parsed Content from ${file.name}]\n\nThis is simulated OCR output. In production, integrate with Tesseract.js or Google Vision API.\n\nDetected text blocks would appear here with confidence scores.`,
        confidence: 0.92,
        language: 'en',
        blocks: [
          {
            text: 'Sample detected text block 1',
            confidence: 0.95,
            bbox: { x: 10, y: 10, width: 200, height: 30 },
          },
          {
            text: 'Sample detected text block 2',
            confidence: 0.88,
            bbox: { x: 10, y: 50, width: 180, height: 25 },
          },
        ],
      });
    }, 2000);
  });
}

/**
 * Create thumbnail for image files
 */
export async function createImageThumbnail(file: File, maxWidth: number = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload files with progress tracking
 */
export async function uploadFiles(
  files: File[],
  assignmentId: string,
  onProgress?: (progress: number) => void
): Promise<SubmissionFile[]> {
  const uploadedFiles: SubmissionFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      onProgress?.(Math.round(((i + progress / 100) / files.length) * 100));
    }

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      try {
        thumbnailUrl = await createImageThumbnail(file);
      } catch {
        // Thumbnail creation failed, continue without it
      }
    }

    uploadedFiles.push({
      id: `FILE_${Date.now()}_${i}`,
      name: file.name,
      url: URL.createObjectURL(file), // In production, this would be the server URL
      type: file.type,
      size: file.size,
      thumbnailUrl,
    });
  }

  return uploadedFiles;
}

/**
 * Submit assignment with all files
 */
export async function submitAssignmentWithFiles(
  assignmentId: string,
  files: File[],
  comment: string,
  options?: {
    parseImages?: boolean;
    onProgress?: (progress: number) => void;
    onImageParsed?: (fileName: string, content: ParsedImageContent) => void;
  }
): Promise<AssignmentSubmission> {
  // Validate all files first
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  if (files.length > MAX_FILES_PER_SUBMISSION) {
    throw new Error(`Maximum ${MAX_FILES_PER_SUBMISSION} files allowed per submission`);
  }

  // Parse images if requested
  if (options?.parseImages) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    for (const imgFile of imageFiles) {
      const parsed = await parseImageContent(imgFile);
      options.onImageParsed?.(imgFile.name, parsed);
    }
  }

  // Upload files
  const uploadedFiles = await uploadFiles(files, assignmentId, options?.onProgress);

  const submission: AssignmentSubmission = {
    assignmentId,
    studentId: 'STU2024001', // Get from auth context
    files: uploadedFiles,
    comment,
    submittedAt: new Date().toISOString(),
    status: 'submitted',
  };

  // TODO: Send to API
  // await api.post('/assignments/submit', submission);

  return submission;
}

/**
 * Get allowed file types for assignment submission
 */
export function getAllowedFileTypes(submissionType: string): string[] {
  const typeMap: Record<string, string[]> = {
    document: [...SUPPORTED_FILE_TYPES.document, ...SUPPORTED_FILE_TYPES.presentation],
    image: SUPPORTED_FILE_TYPES.image,
    code: SUPPORTED_FILE_TYPES.code,
    video: SUPPORTED_FILE_TYPES.video,
    presentation: SUPPORTED_FILE_TYPES.presentation,
    mixed: Object.values(SUPPORTED_FILE_TYPES).flat(),
  };
  return typeMap[submissionType] || Object.values(SUPPORTED_FILE_TYPES).flat();
}

/**
 * Check if file is an image
 */
export function isImageFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_TYPES.image.includes(`.${ext}`);
}

/**
 * Check if file is a document
 */
export function isDocumentFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  return SUPPORTED_FILE_TYPES.document.includes(`.${ext}`);
}