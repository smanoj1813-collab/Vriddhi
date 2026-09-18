// src/shared/services/prepMediaUpload.ts
//
// Firebase Storage glue for prep content media. Superadmin-only (the storage
// rules on /prep-media enforce it server-side; the Studio button is
// superadmin-gated in the UI as well). Pure validation/path/markdown helpers
// live in src/shared/utils/prepMedia.ts and are unit-tested there.

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/Firebase/config';
import {
  prepImageExtension,
  prepMediaPathForFile,
  validatePrepImage,
} from '@/shared/utils/prepMedia';

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Upload a prep image to /prep-media and return its public download URL.
 * Throws an Error with a user-readable message on validation failure.
 */
export async function uploadPrepImage(file: File): Promise<string> {
  const problem = validatePrepImage(file);
  if (problem) throw new Error(problem);

  const ext = prepImageExtension(file) as string;
  const path = prepMediaPathForFile(ext, Date.now(), Math.random().toString(36).slice(2, 8));
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, {
    contentType: file.type || MIME_BY_EXT[ext],
  });
  return getDownloadURL(objectRef);
}
