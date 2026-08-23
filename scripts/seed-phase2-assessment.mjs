#!/usr/bin/env node
// scripts/seed-phase2-assessment.mjs
// ═══════════════════════════════════════════════════════════════════════
// Seeds one end-to-end Phase 2 assessment so the student test engine can
// be verified against real Firestore data:
//
//   papers/{paperId}                        (2 sections, 8 questions)
//   questions/{qId} × 8                     (linked bank questions)
//   scheduledTests/{testId}                 (status: active, 30 min)
//   scheduledTests/{testId}/assessmentQuestions/*   (frozen snapshot)
//   studentAssessments/{saId}               (optional, --student-email)
//
// Covers every Phase 2 question type: mcq, multi_select, true_false,
// numerical, fill_in_blank (auto-graded) + short_answer, long_answer,
// matching (manual) + assertion_reason.
//
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
//   node scripts/seed-phase2-assessment.mjs [--college COLLEGE_ID] \
//        [--student-email student@college.edu] [--title "..."] [--minutes 30]
//
// Requires firebase-admin (installed under functions/):
//   NODE_PATH=./functions/node_modules node scripts/seed-phase2-assessment.mjs
// Prints the seeded ids at the end so you can jump straight into the flow:
//   /student/test/{testId}/instructions
// ═══════════════════════════════════════════════════════════════════════

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

// ─── args ───
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const COLLEGE_ID = arg('college', 'demo-college');
const STUDENT_EMAIL = arg('student-email', '');
const TITLE = arg('title', 'Phase 2 Seed Test — Mixed Question Types');
const MINUTES = Number(arg('minutes', '30'));

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))) });
const db = admin.firestore();

// ─── question bank (shared ids so the paper links resolve) ───
const QUESTIONS = [
  {
    id: 'seed_mcq_1',
    text: 'What is the time complexity of binary search on a sorted array of n elements?',
    type: 'mcq', difficulty: 'easy', marks: 2,
    options: [
      { id: 'opt-0', text: 'O(1)', isCorrect: false },
      { id: 'opt-1', text: 'O(log n)', isCorrect: true },
      { id: 'opt-2', text: 'O(n)', isCorrect: false },
      { id: 'opt-3', text: 'O(n log n)', isCorrect: false },
    ],
    explanation: 'Binary search halves the search space each step.',
  },
  {
    id: 'seed_mcq_2',
    text: 'Which data structure provides LIFO ordering?',
    type: 'mcq', difficulty: 'easy', marks: 2,
    options: [
      { id: 'opt-0', text: 'Queue', isCorrect: false },
      { id: 'opt-1', text: 'Stack', isCorrect: true },
      { id: 'opt-2', text: 'Heap', isCorrect: false },
    ],
    explanation: 'A stack pushes and pops from the same end.',
  },
  {
    id: 'seed_multi_1',
    text: 'Select ALL valid JavaScript primitive types.',
    type: 'multi_select', difficulty: 'medium', marks: 4,
    options: [
      { id: 'opt-0', text: 'string', isCorrect: true },
      { id: 'opt-1', text: 'number', isCorrect: true },
      { id: 'opt-2', text: 'array', isCorrect: false },
      { id: 'opt-3', text: 'boolean', isCorrect: true },
    ],
    explanation: 'array is an object, not a primitive.',
  },
  {
    id: 'seed_tf_1',
    text: 'In Firestore, a document can contain subcollections.',
    type: 'true_false', difficulty: 'easy', marks: 1,
    options: [
      { id: 'opt-0', text: 'True', isCorrect: true },
      { id: 'opt-1', text: 'False', isCorrect: false },
    ],
    explanation: 'Documents can nest collections one level deeper.',
  },
  {
    id: 'seed_num_1',
    text: 'A circle has radius 7. What is its area? (use π ≈ 3.14, answer to 2 decimals)',
    type: 'numerical', difficulty: 'medium', marks: 3,
    correctAnswer: '153.86', tolerance: 0.05,
    explanation: 'πr² = 3.14 × 49 = 153.86.',
  },
  {
    id: 'seed_fill_1',
    text: 'The Firestore write that atomically increments a numeric field is called ______.',
    type: 'fill_in_blank', difficulty: 'medium', marks: 2,
    correctAnswer: 'increment|FieldValue.increment',
    explanation: 'FieldValue.increment(n).',
  },
  {
    id: 'seed_assert_1',
    text: 'Assertion: Autosaving answers every few seconds prevents data loss on refresh. Reason: Because the answers are persisted to the studentAssessments document.',
    type: 'assertion_reason', difficulty: 'hard', marks: 3,
    correctAnswer: 'opt-0',
    options: [
      { id: 'opt-0', text: 'Both true, reason explains assertion', isCorrect: true },
      { id: 'opt-1', text: 'Both true, reason does not explain assertion', isCorrect: false },
      { id: 'opt-2', text: 'Assertion true, reason false', isCorrect: false },
      { id: 'opt-3', text: 'Assertion false, reason true', isCorrect: false },
    ],
    explanation: 'Both statements are true and causally linked.',
  },
  {
    id: 'seed_short_1',
    text: 'In 2–3 sentences, explain why a question snapshot is frozen at schedule time rather than read live from the question bank.',
    type: 'short_answer', difficulty: 'medium', marks: 5,
  },
  {
    id: 'seed_match_1',
    text: 'Match each Firestore concept with its description.',
    type: 'matching', difficulty: 'hard', marks: 3,
    matchPairs: [
      { left: 'Document', right: 'A flat record of fields' },
      { left: 'Collection', right: 'A group of documents' },
      { left: 'Subcollection', right: 'A collection nested in a document' },
    ],
  },
];

const TOTAL_MARKS = QUESTIONS.reduce((s, q) => s + q.marks, 0);
const NOW = Date.now();

async function main() {
  console.log(`Seeding Phase 2 assessment for college "${COLLEGE_ID}"…`);

  // 1. questions
  const batch = db.batch();
  const qRefs = {};
  for (const q of QUESTIONS) {
    const ref = db.collection('questions').doc(q.id);
    qRefs[q.id] = ref;
    const { id, ...data } = q;
    batch.set(ref, {
      ...data,
      subject: 'Computer Science',
      chapter: 'Phase 2 Seed',
      status: 'active',
      tags: ['phase2-seed'],
      collegeId: COLLEGE_ID,
      createdBy: 'seed-script',
      createdByName: 'Phase 2 Seed',
      createdAt: new Date(NOW).toISOString(),
      updatedAt: new Date(NOW).toISOString(),
      usageCount: 0,
      linkedPaperIds: [],
    });
  }

  // 2. paper
  const paperRef = db.collection('papers').doc();
  batch.set(paperRef, {
    title: TITLE,
    subject: 'Computer Science',
    examType: 'unit-test',
    totalMarks: TOTAL_MARKS,
    totalQuestions: QUESTIONS.length,
    duration: MINUTES,
    sections: [
      { id: 'sec-a', name: 'Section A — Objective', marksPerQuestion: 2, questionType: 'mcq', compulsory: true },
      { id: 'sec-b', name: 'Section B — Descriptive', marksPerQuestion: 5, questionType: 'short_answer', compulsory: true },
    ],
    instructions: [
      'The timer starts as soon as you begin and cannot be paused.',
      'Answers autosave every 15 seconds — you can refresh and resume.',
      'Objective questions are scored instantly; descriptive answers are graded by faculty.',
    ],
    status: 'published',
    collegeId: COLLEGE_ID,
    createdBy: 'seed-script',
    createdByName: 'Phase 2 Seed',
    linkedQuestionIds: QUESTIONS.map((q) => q.id),
    batch: '2024-2028',
    branch: 'CSE',
    semester: 5,
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
  });

  // 3. scheduled test
  const testRef = db.collection('scheduledTests').doc();
  batch.set(testRef, {
    title: TITLE,
    subject: 'Computer Science',
    paperId: paperRef.id,
    paperTitle: TITLE,
    collegeId: COLLEGE_ID,
    facultyId: 'seed-faculty',
    facultyName: 'Seeded Faculty',
    branch: 'CSE',
    batch: '2024-2028',
    semester: 5,
    startDateTime: new Date(NOW - 60_000).toISOString(),
    endDateTime: new Date(NOW + 7 * 24 * 3600_000).toISOString(),
    duration: MINUTES,
    totalMarks: TOTAL_MARKS,
    totalQuestions: QUESTIONS.length,
    instructions: [
      'The timer starts as soon as you begin and cannot be paused.',
      'Answers autosave every 15 seconds — refresh and resume any time.',
      'This seeded paper mixes auto-graded and faculty-graded questions.',
    ],
    status: 'active',
    paperType: 'quiz',
    negativeMarking: false,
    enableProctoring: true,
    totalRegistered: 0,
    totalStarted: 0,
    totalSubmitted: 0,
    createdAt: new Date(NOW).toISOString(),
    updatedAt: new Date(NOW).toISOString(),
  });
  await batch.commit();

  // 4. frozen question snapshot (the authoritative Phase 2 source)
  const snapBatch = db.batch();
  QUESTIONS.forEach((q, i) => {
    const ref = db.collection('scheduledTests').doc(testRef.id).collection('assessmentQuestions').doc(q.id);
    const section = ['short_answer', 'matching', 'long_answer'].includes(q.type) ? 'sec-b' : 'sec-a';
    snapBatch.set(ref, {
      questionId: q.id,
      order: i + 1,
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
      marks: q.marks,
      negativeMarks: 0,
      options: q.options || null,
      correctAnswer: q.correctAnswer || null,
      tolerance: q.tolerance || null,
      matchPairs: q.matchPairs || null,
      explanation: q.explanation || null,
      sectionId: section,
      sectionName: section === 'sec-a' ? 'Section A — Objective' : 'Section B — Descriptive',
    });
  });
  await snapBatch.commit();

  // 5. optional: enroll a student by email → studentAssessments row
  let saId = null;
  if (STUDENT_EMAIL) {
    const studentsSnap = await db.collection('students')
      .where('email', '==', STUDENT_EMAIL)
      .limit(1)
      .get();
    if (studentsSnap.empty) {
      console.warn(`No students doc with email ${STUDENT_EMAIL} — skipping enrollment.`);
    } else {
      const s = studentsSnap.docs[0];
      const saRef = db.collection('studentAssessments').doc();
      await saRef.set({
        testId: testRef.id,
        assessmentId: testRef.id,
        collegeId: s.data().collegeId || COLLEGE_ID,
        studentId: s.id,
        studentName: s.data().name || '',
        regNo: s.data().regNo || '',
        title: TITLE,
        subject: 'Computer Science',
        duration: MINUTES,
        totalMarks: TOTAL_MARKS,
        totalQuestions: QUESTIONS.length,
        status: 'not_started',
        marksObtained: 0,
        percentage: 0,
        grade: null,
        gradePoint: 0,
        timeSpent: 0,
        answers: [],
        startedAt: null,
        submittedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      saId = saRef.id;
    }
  }

  console.log('\n✅ Seed complete:');
  console.log(`   questions:            ${QUESTIONS.length} docs (seed_*)`);
  console.log(`   paper:                ${paperRef.id}`);
  console.log(`   scheduledTest:        ${testRef.id}  (active · ${MINUTES} min · ${TOTAL_MARKS} marks)`);
  console.log(`   question snapshot:    scheduledTests/${testRef.id}/assessmentQuestions × ${QUESTIONS.length}`);
  if (saId) console.log(`   studentAssessments:   ${saId} (not_started)`);
  console.log(`\n→ Open /student/test/${testRef.id}/instructions and start the test.`);
  console.log('  Objective-only? No — this paper has short_answer + matching, so submit');
  console.log('  should land on "awaiting grading". Grade via gradeAssessment to see the full result.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
}).then(() => process.exit(0));
