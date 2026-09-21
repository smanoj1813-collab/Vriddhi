#!/usr/bin/env node
/**
 * One-time migration: move base64-embedded material files from Firestore
 * documents into Firebase Storage.
 *
 * WHY
 *   storage.rules (claims-only rewrite) was missing a path contract for
 *   colleges/{collegeId}/materials/, so every faculty material upload was
 *   DENIED in Storage and the client fell back to embedding the whole file
 *   as a base64 data URL inside the Firestore material document. That is 7x
 *   the per-GB cost of Storage and capped at Firestore's 1 MiB doc limit.
 *   The rules fix (this branch) makes new uploads go to Storage; this script
 *   moves the already-stored base64 documents.
 *
 * WHAT IT DOES (per material doc whose fileUrl starts with "data:")
 *   1. decodes the data URL (mime + base64 payload)
 *   2. uploads the bytes to colleges/{collegeId}/materials/migrated/{docId}_{name}
 *   3. sets fileUrl to the Storage media URL, records storagePath + migratedAt
 *      (the base64 blob is replaced, shrinking the doc)
 *   Re-running is idempotent: the target path is deterministic per doc id.
 *
 * CREDENTIALS (never commit) — same convention as seed-question-bank.mjs:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * or GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON file.
 *
 * USAGE (from repo root):
 *   npm --prefix functions install
 *   node functions/scripts/migrate-materials-base64.mjs            # dry-run
 *   node functions/scripts/migrate-materials-base64.mjs --apply    # do it
 *   node functions/scripts/migrate-materials-base64.mjs --college <collegeId>
 */
import { admin } from 'firebase-admin';

const APPLY = process.argv.includes('--apply');
const collegeArgIdx = process.argv.indexOf('--college');
const ONLY_COLLEGE = collegeArgIdx !== -1 ? process.argv[collegeArgIdx + 1] : null;

const MIME_EXT = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'text/plain': 'txt',
};

function initializeAdmin() {
  if (admin.apps.length > 0) return admin;
  const hasEnv =
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  if (hasEnv) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      }),
    });
  }
  return admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

function parseDataUrl(value) {
  const match = String(value || '').match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  const mime = match[1] || 'application/octet-stream';
  const payload = match[2];
  try {
    return { mime, bytes: Buffer.from(payload, 'base64') };
  } catch {
    return null;
  }
}

function sanitize(name) {
  return String(name || 'material').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

async function main() {
  const app = initializeAdmin();
  const db = app.firestore();
  const bucket = app.storage().bucket();
  const bucketName = bucket.name;
  console.log(`Project: ${app.options.projectId || 'unknown'}  bucket: ${bucketName}  ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
  if (ONLY_COLLEGE) console.log(`Limited to college: ${ONLY_COLLEGE}`);

  const collegesRef = ONLY_COLLEGE ? db.collection('colleges').doc(ONLY_COLLEGE) : db.collection('colleges');
  const collegeDocs = ONLY_COLLEGE ? [collegesRef] : await (await collegesRef.get()).docs;

  let scanned = 0;
  let migrated = 0;
  let skipped = 0;

  for (const collegeDoc of collegeDocs) {
    const collegeId = collegeDoc.id;
    let snapshot = await db.collection('colleges', collegeId, 'materials').get();
    // Page in case a college has >1000 materials.
    let startAfter = snapshot.docs[snapshot.docs.length - 1];
    while (!snapshot.empty) {
      for (const doc of snapshot.docs) {
        scanned += 1;
        const data = doc.data() || {};
        const fileUrl = String(data.fileUrl || data.url || '');
        if (!fileUrl.startsWith('data:')) continue;

        const parsed = parseDataUrl(fileUrl);
        if (!parsed) {
          console.log(`  SKIP  ${collegeId}/${doc.id} — not a decodable data URL`);
          skipped += 1;
          continue;
        }
        const title = sanitize(data.title || data.name || 'material');
        const ext = MIME_EXT[parsed.mime] || 'bin';
        const storagePath = `colleges/${collegeId}/materials/migrated/${doc.id}_${title}.${ext}`;
        const mediaUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;

        if (!APPLY) {
          console.log(`  WOULD ${collegeId}/${doc.id}  ${title}.${ext}  (${parsed.bytes.length} bytes, ${parsed.mime})  →  ${storagePath}`);
        } else {
          try {
            const file = bucket.file(storagePath);
            await file.save(parsed.bytes, { contentType: parsed.mime, metadata: { metadata: { source: 'base64-migration' } } });
            await doc.ref.update({
              fileUrl: mediaUrl,
              storagePath,
              migratedFromBase64: true,
              migratedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`  DONE  ${collegeId}/${doc.id}  (${parsed.bytes.length} bytes)  →  ${storagePath}`);
            migrated += 1;
          } catch (error) {
            console.error(`  FAIL  ${collegeId}/${doc.id}  ${error.message}`);
            skipped += 1;
          }
        }
      }
      if (snapshot.docs.length < 1000) break;
      snapshot = await db.collection('colleges', collegeId, 'materials').startAfter(startAfter).get();
    }
  }

  console.log(`\nScanned ${scanned} material docs across ${collegeDocs.length} college(s).`);
  if (APPLY) {
    console.log(`Migrated ${migrated}, skipped/failed ${skipped}.`);
    console.log('Verify: open a few materials in the app (student + faculty views), then re-run this script — it should report 0 to migrate.');
  } else {
    console.log('Dry run — nothing changed. Re-run with --apply to migrate.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
