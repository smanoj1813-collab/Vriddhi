#!/usr/bin/env node
// scripts/seed-linked-assignment.mjs
// ═══════════════════════════════════════════════════════════════════════════════
// Seeds ONE end-to-end linked assignment so the full flow can be verified
// against a real Firestore project:
//
//   faculty Publish → student bell → student submit → faculty grade
//
// By default it creates the assignment as a DRAFT (the way both real paths do:
// the faculty create form and the admin schedule→generateClassSessions link),
// so you can drive the human part of the flow yourself:
//
//   1. Log in as the faculty → Assignments → the seeded draft appears with the
//      "Linked: course → module" badge → click Publish.
//      (A college notification with deadline + course/module lands in the bell.)
//   2. Log in as the student → bell shows "New Assignment: …" with the
//      course → module badge and a live countdown → Assignments → Submit a file.
//   3. Log in as the faculty → grade the submission.
//   4. Log in as admin → Assignment Analytics → completion % + overdue alerts.
//
// Or skip the human steps entirely:
//
//   node scripts/seed-linked-assignment.mjs --publish --auto-submit --auto-grade
//
// Flags:
//   --college COLLEGE_ID      (default: demo-college)
//   --faculty-id ID           (default: first faculty in the college)
//   --student-email EMAIL     (default: first student in the college)
//   --student-id ID           (alternative to --student-email)
//   --title "…"               (default: "Seed Assignment: Curriculum Link E2E")
//   --course-name "…"         (default: "Data Structures")
//   --module-title "…"        (default: "Trees & Heaps")
//   --subject "…"             (default: the course name)
//   --days N                  deadline offset in days (default: 7)
//   --max-score N             (default: 20)
//   --publish                 publish now (creates the bell notification)
//   --auto-submit             simulate the student submission (real PDF file)
//   --auto-grade              grade the seeded submission (score via --score)
//   --score N                 grade score (default: 18)
//
// Requires a service account with Firestore + Storage access:
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/sa.json \
//   NODE_PATH=./functions/node_modules node scripts/seed-linked-assignment.mjs …
// ═══════════════════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';

let admin;
try {
  admin = (await import('firebase-admin')).default;
} catch {
  console.error(
    'firebase-admin not found. Run with NODE_PATH=./functions/node_modules or install it.'
  );
  process.exit(1);
}

// ─── args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);
const COLLEGE_ID = arg('college', 'demo-college');
const FACULTY_ID = arg('faculty-id', '');
const STUDENT_EMAIL = arg('student-email', '');
const STUDENT_ID = arg('student-id', '');
const TITLE = arg('title', 'Seed Assignment: Curriculum Link E2E');
const COURSE_NAME = arg('course-name', 'Data Structures');
const MODULE_TITLE = arg('module-title', 'Trees & Heaps');
const SUBJECT = arg('subject', COURSE_NAME);
const DAYS = Number(arg('days', '7'));
const MAX_SCORE = Number(arg('max-score', '20'));
const SCORE = Number(arg('score', '18'));
const PUBLISH = has('publish');
const AUTO_SUBMIT = has('auto-submit');
const AUTO_GRADE = has('auto-grade');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
  ),
});
const db = admin.firestore();

// ─── 1. resolve the seed faculty ────────────────────────────────────────────
let facultyDoc;
if (FACULTY_ID) {
  facultyDoc = await db.collection('faculty').doc(FACULTY_ID).get();
} else {
  const snap = await db.collection('faculty').where('collegeId', '==', COLLEGE_ID).limit(1).get();
  if (snap.empty) {
    console.error(`No faculty found in college ${COLLEGE_ID}. Add one or pass --faculty-id.`);
    process.exit(1);
  }
  facultyDoc = snap.docs[0];
}
if (!facultyDoc.exists) {
  console.error(`Faculty ${FACULTY_ID} not found.`);
  process.exit(1);
}
const faculty = facultyDoc.data();
const facultyUid = String(faculty.uid || facultyDoc.id);
const facultyName = String(faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || 'Seed Faculty');

// ─── 2. resolve the seed student (their cohort becomes the target) ─────────
let studentDoc;
if (STUDENT_ID) {
  studentDoc = await db.collection('students').doc(STUDENT_ID).get();
} else if (STUDENT_EMAIL) {
  const userSnap = await db.collection('users').where('email', '==', STUDENT_EMAIL).limit(2).get();
  if (userSnap.empty) {
    console.error(`No user with email ${STUDENT_EMAIL}.`);
    process.exit(1);
  }
  studentDoc = (
    await db.collection('students').where('userId', '==', userSnap.docs[0].id).limit(1).get()
  ).docs[0];
} else {
  const snap = await db.collection('students').where('collegeId', '==', COLLEGE_ID).limit(1).get();
  if (snap.empty) {
    console.error(`No students found in college ${COLLEGE_ID}. Add one or pass --student-email.`);
    process.exit(1);
  }
  studentDoc = snap.docs[0];
}
if (!studentDoc) {
  console.error(`No student record found for ${STUDENT_EMAIL || STUDENT_ID}.`);
  process.exit(1);
}
const student = studentDoc.data();
const studentId = studentDoc.id;
const branch = String(student.branch || student.department || '');
const batch = String(student.batch || student.academicYear || '');
const division = String(student.division || student.section || '');
const semester = Number(student.semester) || 0;

// ─── 3. create the draft assignment (linked to course → module) ────────────
const deadline = new Date(Date.now() + DAYS * 86_400_000);
const assignmentRef = db.collection('assignments').doc();
const now = admin.firestore.FieldValue.serverTimestamp();

await assignmentRef.set({
  title: TITLE,
  description:
    'Seeded end-to-end test assignment (scripts/seed-linked-assignment.mjs). ' +
    'Verify the course → module badge, the deadline countdown and the bell ' +
    'notification in the student portal, then submit and grade it.',
  topic: MODULE_TITLE,
  subject: SUBJECT,
  subjectCode: '',
  maxScore: MAX_SCORE,
  deadline: admin.firestore.Timestamp.fromDate(deadline),
  status: 'draft',
  type: 'assignment',
  targetType: 'cohort',
  cohort: {
    ...(branch ? { branch } : {}),
    ...(batch ? { batch } : {}),
    ...(division ? { division } : {}),
    ...(semester ? { semester } : {}),
  },
  // The optional curriculum linkage — what the student badge + bell render.
  curriculumId: 'seed-curriculum',
  courseId: 'seed-course',
  courseName: COURSE_NAME,
  moduleId: 'seed-module-1',
  moduleTitle: MODULE_TITLE,
  collegeId: COLLEGE_ID,
  facultyUid,
  facultyName,
  allowResubmission: false,
  source: 'seed',
  submissionCount: 0,
  createdAt: now,
  updatedAt: now,
});
const assignmentId = assignmentRef.id;
console.log(`✔ draft assignment  ${assignmentId}`);

// ─── 4. publish (the bell notification mirrors transitionFacultyAssignment) ─
if (PUBLISH) {
  const deadlineStr = deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const message = [
    `${facultyName} published an assignment for ${SUBJECT} — ${MODULE_TITLE} · Linked to ${COURSE_NAME} · Module: ${MODULE_TITLE}.`,
    `Deadline: ${deadlineStr}.`,
    `Open Student → Assignments to view details and submit before the deadline.`,
  ].join(' ');
  const notificationRef = db.collection('notifications').doc();
  await Promise.all([
    assignmentRef.update({ status: 'published', publishedAt: now }),
    notificationRef.set({
      collegeId: COLLEGE_ID,
      title: `New Assignment: ${TITLE.slice(0, 80)}`,
      message: message.slice(0, 4000),
      type: 'academic',
      category: 'assignment',
      priority: 'high',
      audience: 'cohort',
      cohort: {
        branches: branch ? [branch] : [],
        batches: batch ? [batch] : [],
        division: division || '',
        semester,
      },
      pinned: false,
      sentBy: facultyName,
      sentByName: facultyName,
      createdBy: facultyUid,
      assignmentId,
      deadline: deadline.toISOString(),
      courseName: COURSE_NAME,
      moduleTitle: MODULE_TITLE,
      recipientCount: 1,
      readCount: 0,
      createdAt: now,
    }),
  ]);
  console.log(`✔ published         bell notification seeded (deadline ${deadlineStr})`);
}

// ─── 5. optional: simulate the student submission with a real PDF file ─────
const MINIMAL_PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
    '4 0 obj<</Length 62>>stream\nBT /F1 24 Tf 72 700 Td (Vriddhi seed assignment submission) Tj ET\nendstream endobj\n' +
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n' +
    'trailer<</Root 1 0 R/Size 6>>\n%%EOF\n',
  'utf8'
);

if (AUTO_SUBMIT) {
  const sessionId = `seed-${Date.now()}`;
  const storagePath = `assignment-submissions/${studentId}/${assignmentId}/${sessionId}/seed-submission.pdf`;
  await admin.storage().bucket().file(storagePath).save(MINIMAL_PDF, { contentType: 'application/pdf' });
  const submissionRef = db.collection('submissions').doc(`${assignmentId}_${studentId}`);
  const file = {
    name: 'seed-submission.pdf',
    storagePath,
    contentType: 'application/pdf',
    size: MINIMAL_PDF.length,
  };
  await submissionRef.set({
    assignmentId,
    collegeId: COLLEGE_ID,
    studentId,
    studentUid: String(student.userId || ''),
    studentName: String(student.name || 'Seed Student'),
    studentRegNo: String(student.regNo || student.registrationNumber || ''),
    files: [file],
    attachments: [file],
    remarks: 'Seeded by scripts/seed-linked-assignment.mjs (--auto-submit).',
    content: 'Seeded by scripts/seed-linked-assignment.mjs (--auto-submit).',
    status: 'submitted',
    maxScore: MAX_SCORE,
    submittedAt: now,
    updatedAt: now,
    createdAt: now,
  });
  await assignmentRef.update({ submissionCount: admin.firestore.FieldValue.increment(1) });
  console.log(`✔ submission        ${submissionRef.id} (real PDF at ${storagePath})`);

  if (AUTO_GRADE) {
    if (SCORE < 0 || SCORE > MAX_SCORE) {
      console.error(`--score must be between 0 and ${MAX_SCORE} (got ${SCORE}).`);
      process.exit(1);
    }
    await submissionRef.update({
      score: SCORE,
      marksObtained: SCORE,
      remarks: 'Seeded grade — the e2e loop is complete.',
      feedback: 'Seeded grade — the e2e loop is complete.',
      status: 'graded',
      gradedAt: now,
      gradedBy: facultyUid,
      updatedAt: now,
    });
    console.log(`✔ graded            ${SCORE}/${MAX_SCORE} by ${facultyUid}`);
  }
}

// ─── verification checklist ──────────────────────────────────────────────────
console.log('\n──── verification (manual part) ──────────────────────────────────────');
console.log(`1. Faculty login (${facultyName}) → Assignments → find "${TITLE}"`);
if (PUBLISH) console.log('     (already published — the bell notification was seeded)');
else console.log('     → it shows the "Linked: ' + COURSE_NAME + ' → ' + MODULE_TITLE + '" badge → click Publish');
console.log(`2. Student login (${String(student.name || 'seed student')}, ${branch} ${batch} ${division} Sem ${semester})`);
console.log('     → bell shows "New Assignment" with the course → module badge + countdown');
console.log('     → Assignments page shows the badge, countdown chip and course filter');
if (AUTO_SUBMIT) console.log('     (submission already seeded)');
else console.log('     → Submit a file');
if (AUTO_GRADE) console.log('     (grade already seeded)');
else console.log('3. Faculty → grade the submission');
console.log('4. Admin → Assignment Analytics → completion % + overdue alerts reflect the data');
console.log('\nSeeded ids:');
console.log(`  college:    ${COLLEGE_ID}`);
console.log(`  faculty:    ${facultyDoc.id} (uid ${facultyUid})`);
console.log(`  student:    ${studentId}`);
console.log(`  assignment: ${assignmentId}`);
console.log(`  deadline:   ${deadline.toISOString()}`);
