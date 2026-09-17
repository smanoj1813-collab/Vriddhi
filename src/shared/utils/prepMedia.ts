// src/shared/utils/prepMedia.ts
//
// Pure helpers for prep content media (diagrams / visual explanations).
// The Firebase Storage upload glue lives in src/shared/services/prepMediaUpload.ts;
// everything here is unit-tested in prepMedia.test.ts.
//
// The public /prep pages embed images in the topic explanation via standard
// markdown image syntax:  ![Caption](https://.../storage/...)
// The Studio "Upload image" control produces exactly that line.

export const PREP_MEDIA_PREFIX = 'prep-media';
export const PREP_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const PREP_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif'] as const;

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

/** The image extension for a file (MIME first, then file name), or null. */
export function prepImageExtension(file: { name?: string; type?: string }): string | null {
  const byMime = file.type ? EXT_BY_MIME[file.type.toLowerCase()] : undefined;
  if (byMime) return byMime;
  const m = /\.([a-z0-9]+)$/i.exec(file.name || '');
  const ext = m ? m[1].toLowerCase() : null;
  return ext && (PREP_IMAGE_EXTS as readonly string[]).includes(ext) ? ext : null;
}

/**
 * Validation shared by the upload control and the storage rules
 * (image MIME + 4 MB cap). Returns an error message, or null when fine.
 */
export function validatePrepImage(file: { name?: string; type?: string; size?: number }): string | null {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return 'That file looks empty.';
  }
  if (file.size > PREP_IMAGE_MAX_BYTES) {
    return `Images must be 4 MB or smaller (this one is ${(file.size / 1048576).toFixed(1)} MB).`;
  }
  if (!prepImageExtension(file)) {
    return 'Use a PNG, JPEG, WebP or GIF image.';
  }
  return null;
}

/** Storage object path for an uploaded prep image. */
export function prepMediaPathForFile(ext: string, now: number, rand: string): string {
  return `${PREP_MEDIA_PREFIX}/${now}-${rand}.${ext}`;
}

/** The markdown image line the explanation editor should receive. */
export function markdownImageLine(caption: string, url: string): string {
  const alt = (caption || '').replace(/\s+/g, ' ').trim() || 'Diagram';
  return `![${alt}](${url})`;
}

/**
 * Insert an image line into the explanation markdown at the cursor position
 * (or append at the end). Keeps the image as its own block: exactly one
 * blank line separates it from whatever is above and below, no matter what
 * the surrounding text looks like.
 */
export function insertMarkdownImage(text: string, imageLine: string, cursor: number | null): string {
  const base = (text || '').replace(/\s+$/, '');
  if (!base) return imageLine;
  const at = cursor == null ? base.length : Math.max(0, Math.min(cursor, base.length));
  const beforeRaw = base.slice(0, at);
  const after = base.slice(at);
  const before = beforeRaw
    ? beforeRaw.endsWith('\n\n')
      ? beforeRaw
      : beforeRaw.endsWith('\n')
        ? `${beforeRaw}\n`
        : `${beforeRaw}\n\n`
    : '';
  // The block below the image needs a blank line too: a single '\n' at the
  // cursor position is not enough separation.
  const afterSep = after ? (after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n') : '';
  return `${before}${imageLine}${afterSep}${after}`;
}
