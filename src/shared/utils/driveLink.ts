// src/shared/utils/driveLink.ts
//
// Google Drive link validation for assignment submissions.
//
// WHY ONLY drive.google.com /file/d/ LINKS
// Students may submit a Drive link INSTEAD of uploading the file, so the
// college stores zero bytes for that attachment (cost saver for large work
// such as videos). We deliberately reject every other URL:
//   * faculty will click student-submitted links — an arbitrary-URL field is a
//     phishing vector;
//   * we can only promise "opens in Drive" for the canonical file URL shape;
//   * folder/share/shortened links cannot be validated the same way.
// The student must set the file's sharing to "Anyone with the link → Viewer".

const DRIVE_FILE_URL =
  /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})\/(?:view|preview)(?:[?#].*)?$/

/** Extract the raw Drive file id from a link, or null when it is not one. */
export function extractDriveFileId(raw: string): string | null {
  const value = (raw || '').trim()
  const match = value.match(DRIVE_FILE_URL)
  return match ? match[1] : null
}

/** Canonical, click-anywhere form of a Drive file link. */
export function normalizeDriveLink(raw: string): string | null {
  const id = extractDriveFileId(raw)
  return id ? `https://drive.google.com/file/d/${id}/view` : null
}

export interface DriveLinkValidation {
  valid: boolean
  error?: string
  /** Canonical URL to store, present when valid. */
  url?: string
}

export function validateDriveLink(raw: string): DriveLinkValidation {
  const value = (raw || '').trim()
  if (!value) {
    return { valid: false, error: 'Paste a Google Drive link to add it.' }
  }
  const url = normalizeDriveLink(value)
  if (!url) {
    return {
      valid: false,
      error:
        'That does not look like a Google Drive file link. Share the file in Drive (Anyone with the link → Viewer), then copy its link — it should look like https://drive.google.com/file/d/…/view',
    }
  }
  return { valid: true, url }
}
