#!/usr/bin/env node
/**
 * Seed the universal question bank from the repo's question content.
 *
 * Reads every `content/question-banks/**\/questions.json` and bulk-writes each
 * question into the shared pool as THREE linked documents:
 *   questionBank_meta/{id}      — small, filterable metadata
 *   questionBank_content/{id}   — full question payload
 *   questionReviews/{id}        — approval record (auto-approved, source=platform)
 *
 * Platform content is tagged `vriddhi-curated` + `free`, `visibility: public`,
 * `source: platform`, `status: approved` — free and visible to all colleges.
 * See docs/universal-question-bank-design.md §6.
 *
 * Requires the Firebase Admin SDK (declared in functions/package.json) and a
 * service account. Credentials are read from the environment exactly like
 * functions/src/services/questions.ts:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * or GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON file.
 *
 * Usage (from repo root):
 *   npm --prefix functions install
 *   node functions/scripts/seed-question-bank.mjs            # dry-run preview
 *   node functions/scripts/seed-question-bank.mjs --write    # write to Firestore
 *   node functions/scripts/seed-question-bank.mjs --write --subject "Marketing Management"
 *
 * Never commit service-account credentials.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BANK_DIR = join(ROOT, 'content', 'question-banks');

const META = 'questionBank_meta';
const CONTENT = 'questionBank_content';
const REVIEWS = 'questionReviews';

const PLATFORM_TAGS = ['vriddhi-curated', 'free'];
const CREATED_BY = {
  userId: 'vriddhi-seed',
  userName: 'Vriddhi',
  collegeId: null,
  collegeName: 'Vriddhi',
  role: 'superadmin',
};

const TYPE_MAP = {
  matching: 'match',
  assertion_reason: 'mcq',
  short: 'short_answer',
  long: 'long_answer',
};

function mapType(t) {
  return TYPE_MAP[t] || t;
}

function loadQuestions() {
  const out = [];
  if (!existsSync(BANK_DIR)) return out;
  // Walk program folders (e.g. bba/) then subject folders, collecting every
  // questions.json (each contains a `questions[]` array).
  for (const program of readdirSync(BANK_DIR)) {
    const programDir = join(BANK_DIR, program);
    if (!existsSync(join(programDir, 'questions.json')) && !isDir(programDir)) continue;
    for (const subject of readdirSync(programDir)) {
      const p = join(programDir, subject, 'questions.json');
      if (existsSync(p)) pushQuestions(join(programDir, subject), out);
    }
  }
  return out;
}

function isDir(p) {
  try {
    readdirSync(p);
    return true;
  } catch {
    return false;
  }
}

function pushQuestions(dir, out) {
  const data = JSON.parse(readFileSync(join(dir, 'questions.json'), 'utf-8'));
  const subject = data.subject || dir.split('/').pop();
  for (const q of data.questions || []) {
    out.push({ subjectDir: dir.split('/').pop(), subject, ...q });
  }
}

function toMeta(q, id) {
  const now = new Date().toISOString();
  return {
    subjectId: q.subject || 'General',
    topicId: q.topic || 'General',
    subTopicId: q.subTopicId || '',
    difficulty: q.difficulty || 'medium',
    questionType: mapType(q.type || 'mcq'),
    marks: q.marks ?? 1,
    language: q.language || 'en',
    tags: [...new Set([...(q.tags || []), ...PLATFORM_TAGS])],
    status: 'approved',
    visibility: 'public',
    sharedWith: [],
    source: 'platform',
    // Must be the real doc id: useQuestionBank.loadQuestionDetail reads this
    // path and calls downloadQuestion() on it. A literal "{id}" 404s the detail view.
    storagePath: `${CONTENT}/${id}.json`,
    hasImage: false,
    qualityRating: 0,
    usageCount: 0,
    createdBy: CREATED_BY,
    createdAt: now,
    updatedAt: now,
  };
}

function toContent(q, id) {
  const now = new Date().toISOString();
  const options = Array.isArray(q.options)
    ? q.options.map((o) => (typeof o === 'string' ? { id: String.fromCharCode(65 + q.options.indexOf(o)), text: o, isCorrect: o === q.correctAnswer || q.options.length === 1 } : o))
    : [];
  // letter-indexed correctness when options are strings and correctAnswer is a letter
  if (options.length && typeof q.options?.[0] === 'string' && typeof q.correctAnswer === 'string' && /^[A-Da-d]$/.test(q.correctAnswer)) {
    const idx = q.correctAnswer.toUpperCase().charCodeAt(0) - 65;
    options.forEach((o, i) => (o.isCorrect = i === idx));
  }
  return {
    version: 1,
    questionText: q.text || '',
    options,
    correctAnswer: q.correctAnswer || '',
    explanation: q.explanation || '',
    hint: '',
    topicId: q.topic || 'General',
    subjectId: q.subject || 'General',
    subTopicId: q.subTopicId || '',
    difficulty: q.difficulty || 'medium',
    questionType: mapType(q.type || 'mcq'),
    marks: q.marks ?? 1,
    language: q.language || 'en',
    tags: [...new Set([...(q.tags || []), ...PLATFORM_TAGS])],
    images: [],
    hasImage: false,
    createdBy: CREATED_BY,
    source: 'platform',
    status: 'approved',
    visibility: 'public',
    sharedWith: [],
    quality: { rating: 0, reviewCount: 0, flagged: false },
    usageStats: { usedInPapers: 0, usedInAssessments: 0, collegesUsing: [] },
    versions: [],
    storagePath: `${CONTENT}/${id}.json`,
    metadataDocId: id,
    createdAt: now,
    updatedAt: now,
  };
}

function toReview(metaId, now) {
  return {
    questionId: metaId,
    submittedBy: CREATED_BY,
    submittedAt: now,
    status: 'approved',
    reviewedAt: now,
    reviewerId: CREATED_BY.userId,
    reviewerName: CREATED_BY.userName,
    reviewComment: 'Trusted platform submission (auto-approved).',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Guard against the `{id}` placeholder regression: every meta/content doc must
 * point at the real Firestore doc id, or the question-detail view 404s when it
 * resolves meta.storagePath through downloadQuestion(). Runs in both modes.
 */
function selfCheckIdWiring() {
  const probeId = 'probe123';
  const sample = { subject: 'Self-Check', topic: 'Self-Check', text: 'x', type: 'mcq' };
  const meta = toMeta(sample, probeId);
  const content = toContent(sample, probeId);
  const checks = [
    [meta.storagePath === `${CONTENT}/${probeId}.json`, 'meta.storagePath must interpolate the doc id'],
    [content.storagePath === `${CONTENT}/${probeId}.json`, 'content.storagePath must interpolate the doc id'],
    [content.metadataDocId === probeId, 'content.metadataDocId must equal the meta doc id'],
    [!JSON.stringify(meta).includes('{id}') && !JSON.stringify(content).includes('{id}'), 'no literal {id} placeholder may survive'],
  ];
  const failed = checks.filter(([ok]) => !ok).map(([, msg]) => msg);
  if (failed.length) {
    console.error(`Seed script self-check FAILED:\n  - ${failed.join('\n  - ')}`);
    process.exit(1);
  }
}

async function getAdmin() {
  try {
    return (await import('firebase-admin')).default;
  } catch {
    console.error('firebase-admin not found. Run: npm --prefix functions install');
    process.exit(1);
  }
}

function buildApp(admin) {
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
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
  console.error(
    'Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.'
  );
  process.exit(1);
}

async function main() {
  selfCheckIdWiring();
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const subjectFilter = (args.find((a) => a.startsWith('--subject=')) || '').split('=')[1];

  const all = loadQuestions().filter((q) => !subjectFilter || q.subject === subjectFilter);
  if (!all.length) {
    console.log('No questions found. Check content/question-banks/.');
    return;
  }

  const bySubject = {};
  for (const q of all) bySubject[q.subject] = (bySubject[q.subject] || 0) + 1;
  console.log(`Loaded ${all.length} questions across ${Object.keys(bySubject).length} subjects:`);
  for (const [s, n] of Object.entries(bySubject)) console.log(`  - ${s}: ${n}`);

  if (!write) {
    console.log('\nDry run — pass --write to write to Firestore. (Credentials required only for --write.)');
    return;
  }

  const admin = await getAdmin();
  const app = buildApp(admin);
  const db = admin.firestore();
  const now = new Date().toISOString();
  const BATCH = 400; // Firestore batch cap is 500 writes
  let total = 0;

  for (let i = 0; i < all.length; i += Math.floor(BATCH / 3)) {
    const chunk = all.slice(i, i + Math.floor(BATCH / 3));
    const batch = db.batch();
    for (const q of chunk) {
      const metaRef = db.collection(META).doc();
      const metaId = metaRef.id;
      batch.set(metaRef, toMeta(q, metaId));
      batch.set(db.collection(CONTENT).doc(metaId), toContent(q, metaId));
      batch.set(db.collection(REVIEWS).doc(), toReview(metaId, now));
    }
    await batch.commit();
    total += chunk.length;
    console.log(`  seeded ${total}/${all.length} questions…`);
  }

  console.log(`Done. Seeded ${total} questions into the universal question bank (public + free).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
