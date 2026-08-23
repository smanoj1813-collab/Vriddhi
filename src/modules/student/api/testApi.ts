// src/modules/student/api/testApi.ts
// ═══════════════════════════════════════════════════════════════════════
// PHASE 2 TEST ENGINE — authoritative contract:
//
//   scheduledTests/{testId}                      scheduling + metadata
//   scheduledTests/{testId}/assessmentQuestions  frozen question snapshot
//   studentAssessments/{id}                      one row per student:
//     not_started → in_progress → submitted → graded
//   studentSubmissions/{id}                      raw audit copy of a submit
//   proctoringLogs/{id}                          basic proctoring events
//
// Decisions (see docs/student-portal-phase2-handoff.md):
//   • Questions load from the assessmentQuestions subcollection
//     (fallbacks: inline scheduledTests.questions, then paper → questions).
//   • Timer = per-student duration from startedAt (no hard window).
//   • Objective questions auto-grade on submit; subjective questions
//     await faculty grading (gradeAssessment flips the row to `graded`).
//   • `testResults` is dead and never read or written.
// ═══════════════════════════════════════════════════════════════════════
import { db } from '@/Firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type {
  ActiveTest,
  BasicProctorEvent,
  PaperQuestion,
  StudentAnswer,
  StudentTestStatus,
  SubmitOutcome,
  TestInstructionsData,
  TestResultDetail,
} from '../types/assessment';
import {
  gradePaper,
  deriveGradeFromPercentage,
  type GradableAnswer,
  type GradableQuestion,
} from '@/shared/utils/assessmentGrading';

/* ─── helpers ─── */

const VALID_QUESTION_TYPES: PaperQuestion['type'][] = [
  'mcq', 'multi_select', 'true_false', 'fill_in_blank', 'short_answer', 'long_answer',
  'numerical', 'assertion_reason', 'case_based', 'matching',
];

function toQuestionType(raw: unknown): PaperQuestion['type'] {
  const s = String(raw || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'multi' || s === 'multiple_correct' || s === 'multiple_response') return 'multi_select';
  if (s === 'single_choice' || s === 'single_correct') return 'mcq';
  if (VALID_QUESTION_TYPES.includes(s as PaperQuestion['type'])) return s as PaperQuestion['type'];
  return 'mcq';
}

function toDifficulty(raw: unknown): PaperQuestion['difficulty'] {
  const s = String(raw || 'medium').toLowerCase();
  if (s === 'easy' || s === 'medium' || s === 'hard') return s;
  return 'medium';
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return value ? String(value) : '';
}

function normalizeOptions(raw: unknown): { id: string; text: string; isCorrect?: boolean }[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((o: any, i: number) =>
    typeof o === 'string'
      ? { id: `opt-${i}`, text: o }
      : {
          id: String(o.id || o.key || String.fromCharCode(65 + i)),
          text: String(o.text ?? o.label ?? ''),
          ...(o.isCorrect !== undefined ? { isCorrect: Boolean(o.isCorrect) } : {}),
        }
  );
}

function docToQuestion(d: DocumentData, id: string, idx: number): PaperQuestion {
  return {
    id,
    questionId: String(d.questionId || id),
    order: typeof d.order === 'number' ? d.order : idx + 1,
    marks: Number(d.marks) || 1,
    text: String(d.text || d.questionText || ''),
    type: toQuestionType(d.type || d.questionType),
    difficulty: toDifficulty(d.difficulty),
    options: normalizeOptions(d.options),
    hasImage: Boolean(d.imageUrl || d.hasImage),
    imageUrl: d.imageUrl ? String(d.imageUrl) : undefined,
    sectionId: d.sectionId ? String(d.sectionId) : undefined,
    sectionName: d.sectionName ? String(d.sectionName) : undefined,
    negativeMarks: typeof d.negativeMarks === 'number' ? d.negativeMarks : undefined,
    tolerance: typeof d.tolerance === 'number' ? d.tolerance : undefined,
    caseText: d.caseText ? String(d.caseText) : undefined,
    matchPairs: Array.isArray(d.matchPairs) ? d.matchPairs : undefined,
    correctAnswer: d.correctAnswer as string | string[] | undefined,
    explanation: d.explanation ? String(d.explanation) : undefined,
    questionText: String(d.questionText || d.text || ''),
    questionType: String(d.questionType || d.type || 'mcq'),
  };
}

function sortByOrder(qs: PaperQuestion[]): PaperQuestion[] {
  return [...qs].sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Remove grading keys before questions are sent to the player. */
function stripAnswerKeys(q: PaperQuestion): PaperQuestion {
  const { correctAnswer: _ca, explanation: _ex, ...safe } = q;
  return {
    ...safe,
    options: safe.options?.map(({ isCorrect: _ic, ...opt }) => opt),
  };
}

export interface StudentIdentity {
  id: string;
  name: string;
  regNo: string;
}

/* ═══════════════════════════════════════════════════════════════════
   QUESTION LOADING
   Source of truth: scheduledTests/{testId}/assessmentQuestions.
   Fallbacks (legacy data): inline scheduledTests.questions, then
   papers.linkedQuestionIds → questions.
   ═══════════════════════════════════════════════════════════════════ */

async function loadQuestions(testId: string, testData: DocumentData): Promise<PaperQuestion[]> {
  // 1. assessmentQuestions subcollection (authoritative snapshot)
  try {
    const snap = await getDocs(collection(db, 'scheduledTests', testId, 'assessmentQuestions'));
    if (!snap.empty) {
      return sortByOrder(snap.docs.map((d, idx) => docToQuestion(d.data(), d.id, idx)));
    }
  } catch {
    /* fall through */
  }

  // 2. Inline questions on the schedule doc (legacy)
  if (Array.isArray(testData.questions) && testData.questions.length > 0) {
    return sortByOrder(
      (testData.questions as DocumentData[]).map((q, idx) => docToQuestion(q, String(q.id || q.questionId || `q-${idx}`), idx))
    );
  }

  // 3. Paper → linked questions (legacy)
  const paperId = String(testData.paperId || '');
  if (paperId) {
    try {
      const paperSnap = await getDoc(doc(db, 'papers', paperId));
      if (paperSnap.exists()) {
        const paper = paperSnap.data();
        // Papers may embed questions per section…
        if (Array.isArray(paper.sections)) {
          const embedded: PaperQuestion[] = [];
          (paper.sections as DocumentData[]).forEach((s: any) => {
            (Array.isArray(s.questions) ? s.questions : []).forEach((q: any, idx: number) => {
              embedded.push(docToQuestion(q, String(q.id || q.questionId || `q-${embedded.length}`), idx));
            });
          });
          if (embedded.length > 0) return sortByOrder(embedded);
        }
        // …or link to the questions collection
        const qIds: string[] = (paper.linkedQuestionIds || paper.questionIds || []) as string[];
        const loaded: PaperQuestion[] = [];
        for (const qId of qIds) {
          const qSnap = await getDoc(doc(db, 'questions', qId));
          if (qSnap.exists()) loaded.push(docToQuestion(qSnap.data(), qSnap.id, loaded.length));
        }
        if (loaded.length > 0) return sortByOrder(loaded);
      }
    } catch {
      /* no paper questions */
    }
  }

  return [];
}

/* ═══════════════════════════════════════════════════════════════════
   ROUTE / ROW RESOLUTION
   ═══════════════════════════════════════════════════════════════════ */

export interface ResolvedTest {
  testId: string;
  testData: DocumentData;
  /** null when the student has no row yet (not enrolled / not started) */
  studentAssessment: { id: string; data: DocumentData } | null;
}

/** Accepts a scheduledTest id OR a studentAssessment id from the route. */
export async function resolveTest(
  collegeId: string,
  routeId: string,
  studentId: string
): Promise<ResolvedTest | null> {
  if (!collegeId || !routeId) return null;

  // Route id → scheduledTests
  const schedSnap = await getDoc(doc(db, 'scheduledTests', routeId)).catch(() => null);
  let testId = '';
  let testData: DocumentData | null = null;
  if (schedSnap?.exists()) {
    testId = schedSnap.id;
    testData = schedSnap.data();
  } else {
    // Route id → studentAssessments (assessment flow links)
    const saSnap = await getDoc(doc(db, 'studentAssessments', routeId)).catch(() => null);
    if (saSnap?.exists()) {
      const sa = saSnap.data();
      testId = String(sa.testId || sa.assessmentId || '');
      if (testId) {
        const tSnap = await getDoc(doc(db, 'scheduledTests', testId)).catch(() => null);
        if (tSnap?.exists()) testData = tSnap.data();
      }
    }
  }
  if (!testId) return null;
  if (!testData) {
    // Legacy rows link to the assessments collection — use it for metadata.
    // (Question loading will fall back to inline/paper sources; result review
    // relies on persisted questionResults.)
    const aSnap = await getDoc(doc(db, 'assessments', testId)).catch(() => null);
    if (aSnap?.exists()) testData = aSnap.data();
  }
  if (!testData) return null;
  if (collegeId && String(testData.collegeId || '') !== collegeId) return null;

  // Own row: testId first (Phase 2), assessmentId second (legacy rows)
  const row = await findOwnRow(collegeId, testId, studentId);
  return { testId, testData, studentAssessment: row };
}

async function findOwnRow(
  collegeId: string,
  testId: string,
  studentId: string
): Promise<{ id: string; data: DocumentData } | null> {
  if (!collegeId || !testId || !studentId) return null;
  const runs = [
    query(
      collection(db, 'studentAssessments'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      where('testId', '==', testId),
      limit(1)
    ),
    query(
      collection(db, 'studentAssessments'),
      where('collegeId', '==', collegeId),
      where('studentId', '==', studentId),
      where('assessmentId', '==', testId),
      limit(1)
    ),
  ];
  for (const q of runs) {
    try {
      const snap = await getDocs(q);
      if (!snap.empty) return { id: snap.docs[0].id, data: snap.docs[0].data() };
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Idempotently create the student's row for a test (status not_started). */
async function ensureRow(
  collegeId: string,
  testId: string,
  testData: DocumentData,
  student: StudentIdentity
): Promise<{ id: string; data: DocumentData }> {
  const existing = await findOwnRow(collegeId, testId, student.id);
  if (existing) return existing;

  const nowIso = new Date().toISOString();
  const data: DocumentData = {
    testId,
    assessmentId: String(testData.assessmentId || testId),
    collegeId,
    studentId: student.id,
    studentName: student.name || '',
    regNo: student.regNo || '',
    branch: testData.branch || '',
    semester: testData.semester || 0,
    batch: testData.batch || '',
    division: testData.division || '',
    section: testData.section || '',
    title: testData.title || testData.paperTitle || '',
    subject: testData.subject || '',
    duration: Number(testData.duration) || 0,
    totalMarks: Number(testData.totalMarks) || 0,
    totalQuestions: Number(testData.totalQuestions) || 0,
    status: 'not_started',
    marksObtained: 0,
    percentage: 0,
    grade: null,
    gradePoint: 0,
    timeSpent: 0,
    answers: [],
    startedAt: null,
    submittedAt: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  const ref = doc(collection(db, 'studentAssessments'));
  await setDoc(ref, data);
  return { id: ref.id, data };
}

/* ═══════════════════════════════════════════════════════════════════
   READ: instructions page
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchTestInstructions(
  collegeId: string,
  testId: string,
  studentId: string
): Promise<TestInstructionsData | null> {
  const resolved = await resolveTest(collegeId, testId, studentId);
  if (!resolved) return null;
  const { testData, studentAssessment } = resolved;

  const questions = await loadQuestions(resolved.testId, testData);
  const rowStatus = String(studentAssessment?.data.status || 'not_started') as StudentTestStatus;
  const duration = Number(testData.duration) || 60;

  const startedAt = toIso(studentAssessment?.data.startedAt);
  const endsAt = startedAt
    ? new Date(new Date(startedAt).getTime() + duration * 60_000).toISOString()
    : undefined;

  return {
    testId: resolved.testId,
    studentAssessmentId: studentAssessment?.id || null,
    title: String(testData.title || testData.paperTitle || 'Assessment'),
    subject: String(testData.subject || ''),
    totalMarks: Number(testData.totalMarks) || 0,
    totalQuestions: Number(testData.totalQuestions) || questions.length,
    duration,
    instructions: Array.isArray(testData.instructions) ? (testData.instructions as string[]) : [],
    negativeMarking: Boolean(testData.negativeMarking),
    enableProctoring: testData.enableProctoring !== false,
    questionTypes: Array.from(new Set(questions.map((q) => q.type))),
    studentStatus: rowStatus === 'absent' ? 'not_started' : rowStatus,
    startedAt: startedAt || undefined,
    endsAt,
    submittedAt: toIso(studentAssessment?.data.submittedAt) || undefined,
    marksObtained:
      typeof studentAssessment?.data.marksObtained === 'number'
        ? studentAssessment.data.marksObtained
        : undefined,
    grade: studentAssessment?.data.grade ? String(studentAssessment.data.grade) : undefined,
    needsManualGrading: Boolean(studentAssessment?.data.needsManualGrading),
  };
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: start (not_started → in_progress) / resume
   ═══════════════════════════════════════════════════════════════════ */

export interface StartResult {
  studentAssessmentId: string;
  testId: string;
  startedAt: string;
  endsAt: string;
  resumed: boolean;
}

export async function startStudentAssessment(
  collegeId: string,
  testId: string,
  student: StudentIdentity
): Promise<StartResult> {
  const resolved = await resolveTest(collegeId, testId, student.id);
  if (!resolved) throw new Error('Test not found');
  const { testData } = resolved;
  const schedStatus = String(testData.status || 'scheduled');
  if (schedStatus === 'cancelled') throw new Error('This test has been cancelled.');

  const row = resolved.studentAssessment
    ? resolved.studentAssessment
    : await ensureRow(collegeId, resolved.testId, testData, student);

  const status = String(row.data.status || 'not_started');
  const duration = Number(testData.duration) || 60;
  const nowIso = new Date().toISOString();

  if (status === 'in_progress') {
    const startedAt = toIso(row.data.startedAt) || nowIso;
    const endsAt = new Date(new Date(startedAt).getTime() + duration * 60_000).toISOString();
    return { studentAssessmentId: row.id, testId: resolved.testId, startedAt, endsAt, resumed: true };
  }

  if (status === 'submitted' || status === 'graded') {
    throw new Error('You have already submitted this test.');
  }

  await updateDoc(doc(db, 'studentAssessments', row.id), {
    status: 'in_progress',
    startedAt: nowIso,
    updatedAt: nowIso,
  });

  updateDoc(doc(db, 'scheduledTests', resolved.testId), {
    totalStarted: increment(1),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);

  const endsAt = new Date(new Date(nowIso).getTime() + duration * 60_000).toISOString();
  return { studentAssessmentId: row.id, testId: resolved.testId, startedAt: nowIso, endsAt, resumed: false };
}

/* ═══════════════════════════════════════════════════════════════════
   READ: active test (player) — questions with answer keys STRIPPED
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchActiveTest(
  collegeId: string,
  testId: string,
  studentId: string
): Promise<ActiveTest | null> {
  const resolved = await resolveTest(collegeId, testId, studentId);
  if (!resolved) return null;
  const { testData, studentAssessment } = resolved;

  const allQuestions = await loadQuestions(resolved.testId, testData);
  const duration = Number(testData.duration) || 60;

  const rowStatus = String(studentAssessment?.data.status || 'not_started') as StudentTestStatus;
  const startedAt = toIso(studentAssessment?.data.startedAt) || new Date().toISOString();
  const endsAt = new Date(new Date(startedAt).getTime() + duration * 60_000).toISOString();

  // Restore answers for an in_progress attempt (resume after refresh)
  let answers: Record<string, Partial<StudentAnswer>> | undefined;
  if (rowStatus === 'in_progress' && Array.isArray(studentAssessment?.data.answers)) {
    answers = {};
    (studentAssessment.data.answers as StudentAnswer[]).forEach((a) => {
      if (a && a.questionId) answers![a.questionId] = a;
    });
  }

  return {
    studentAssessmentId: studentAssessment?.id || '',
    testId: resolved.testId,
    assessmentId: resolved.testId,
    paperId: String(testData.paperId || resolved.testId),
    title: String(testData.title || testData.paperTitle || ''),
    subject: String(testData.subject || ''),
    totalMarks: Number(testData.totalMarks) || 0,
    duration,
    startedAt,
    endsAt,
    questions: allQuestions.map(stripAnswerKeys),
    flaggedQuestions: [],
    instructions: Array.isArray(testData.instructions) ? (testData.instructions as string[]) : [],
    negativeMarking: Boolean(testData.negativeMarking),
    collegeId: String(testData.collegeId || collegeId),
    totalQuestions: allQuestions.length,
    studentStatus: rowStatus,
    answers,
    resumed: rowStatus === 'in_progress',
    enableProctoring: testData.enableProctoring !== false,
    allowResume: rowStatus === 'in_progress',
  };
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: autosave (in_progress only)
   ═══════════════════════════════════════════════════════════════════ */

export async function autosaveStudentAssessment(
  studentAssessmentId: string,
  answers: StudentAnswer[],
  timeSpent: number,
  proctorEvents?: BasicProctorEvent[]
): Promise<void> {
  if (!studentAssessmentId) return;
  await updateDoc(doc(db, 'studentAssessments', studentAssessmentId), {
    answers,
    timeSpent,
    ...(proctorEvents?.length ? { proctorEvents } : {}),
    updatedAt: new Date().toISOString(),
  });
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: submit (in_progress → submitted, or → graded when fully
   objective) + raw audit copy in studentSubmissions
   ═══════════════════════════════════════════════════════════════════ */

export async function submitStudentAssessment(params: {
  collegeId: string;
  testId: string;
  student: StudentIdentity;
  studentAssessmentId: string;
  answers: Record<string, Partial<StudentAnswer>>;
  timeSpent: number;
  proctorEvents: BasicProctorEvent[];
  autoSubmitted?: boolean;
}): Promise<SubmitOutcome> {
  const { collegeId, testId, student, studentAssessmentId, answers, timeSpent, proctorEvents, autoSubmitted } = params;

  const tSnap = await getDoc(doc(db, 'scheduledTests', testId));
  if (!tSnap.exists()) throw new Error('Test not found');
  const testData = tSnap.data();

  const questions = await loadQuestions(testId, testData);
  const answerArray = Object.values(answers).filter(
    (a): a is StudentAnswer => !!a && !!a.questionId
  );

  // ─── Auto-grade the objective portion (shared grading core) ───
  const gradableQuestions: GradableQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    options: q.options,
    correctAnswer: q.correctAnswer,
    tolerance: q.tolerance,
  }));
  const graded = gradePaper(gradableQuestions, answerArray as GradableAnswer[]);

  const totalMarks = Number(testData.totalMarks) || graded.autoMax + graded.manualMax;
  const nowIso = new Date().toISOString();

  // Persisted question-level review rows (answers hidden until graded by rules of the result page)
  const answerText = (q: PaperQuestion, a?: Partial<StudentAnswer>): string => {
    if (!a) return '';
    if (a.selectedOptionId) {
      return q.options?.find((o) => o.id === a.selectedOptionId)?.text || String(a.selectedOptionId);
    }
    if (a.selectedOptionIds?.length) {
      return a.selectedOptionIds
        .map((id) => q.options?.find((o) => o.id === id)?.text || id)
        .join(', ');
    }
    if (a.numericalAnswer !== undefined && a.numericalAnswer !== null) return String(a.numericalAnswer);
    if (a.textAnswer) return String(a.textAnswer);
    return '';
  };
  const correctText = (q: PaperQuestion): string => {
    const flagged = q.options?.filter((o) => o.isCorrect).map((o) => o.text);
    if (flagged?.length) return flagged.join(', ');
    if (q.correctAnswer) return Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer;
    return '';
  };

  const gradeByQuestion = new Map(graded.perQuestion.map((g) => [g.questionId, g]));
  const questionResults = sortByOrder(questions).map((q, idx) => {
    const g = gradeByQuestion.get(q.id);
    return {
      questionId: q.id,
      order: idx + 1,
      marks: q.marks,
      marksObtained: g?.isObjective ? (g.marksObtained ?? 0) : null,
      status: g?.status || 'unattempted',
      yourAnswer: answerText(q, answers[q.id]),
      correctAnswer: correctText(q),
      explanation: q.explanation || '',
      questionType: q.type,
      sectionName: q.sectionName || '',
    };
  });

  // ─── Decide final status: graded now, or awaiting faculty ───
  const fullyObjective = graded.manualMax === 0 && !graded.needsManualGrading;
  let finalStatus: 'submitted' | 'graded' = 'submitted';
  let marksObtained: number | null = null;
  let percentage: number | null = null;
  let grade: string | null = null;
  let gradePoint = 0;

  if (fullyObjective) {
    finalStatus = 'graded';
    marksObtained = Math.max(0, graded.autoScore); // clamp negatives at 0 for the headline score
    percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
    const derived = deriveGradeFromPercentage(percentage);
    grade = derived.grade;
    gradePoint = derived.gradePoint;
  }

  const rowUpdate: DocumentData = {
    status: finalStatus,
    answers: answerArray,
    timeSpent,
    submittedAt: nowIso,
    updatedAt: nowIso,
    autoScore: graded.autoScore,
    autoMax: graded.autoMax,
    manualMax: graded.manualMax,
    needsManualGrading: !fullyObjective,
    objectiveCorrectCount: graded.correctCount,
    objectiveIncorrectCount: graded.incorrectCount,
    questionResults,
    proctorEvents: proctorEvents.slice(-100),
    ...(finalStatus === 'graded'
      ? {
          marksObtained,
          percentage,
          grade,
          gradePoint,
          gradedAt: nowIso,
          gradedBy: 'auto',
        }
      : {}),
  };

  await updateDoc(doc(db, 'studentAssessments', studentAssessmentId), rowUpdate);

  // ─── Raw audit copy (kept per Phase 2 decision) ───
  try {
    await addDoc(collection(db, 'studentSubmissions'), {
      kind: 'test',
      collegeId,
      testId,
      studentAssessmentId,
      studentId: student.id,
      studentName: student.name || '',
      studentRegNo: student.regNo || '',
      answers: answerArray,
      timeSpent,
      proctorEvents,
      autoScore: graded.autoScore,
      autoMax: graded.autoMax,
      manualMax: graded.manualMax,
      needsManualGrading: !fullyObjective,
      autoSubmitted: Boolean(autoSubmitted),
      client: typeof navigator !== 'undefined' ? { userAgent: navigator.userAgent, platform: navigator.platform } : {},
      status: finalStatus,
      submittedAt: nowIso,
    });
  } catch (err) {
    console.error('[submitStudentAssessment] audit copy failed (non-fatal):', err);
  }

  // ─── Counter on the schedule doc ───
  updateDoc(doc(db, 'scheduledTests', testId), {
    totalSubmitted: increment(1),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);

  return {
    studentAssessmentId,
    testId,
    status: finalStatus,
    autoScore: graded.autoScore,
    autoMax: graded.autoMax,
    manualMax: graded.manualMax,
    needsManualGrading: !fullyObjective,
    marksObtained,
    percentage,
    grade,
    correctCount: graded.correctCount,
    incorrectCount: graded.incorrectCount,
    unattemptedCount: graded.unattemptedCount,
    answeredCount: answerArray.length,
    timeSpent,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   READ: result (graded row + review; pending state when manual grading)
   ═══════════════════════════════════════════════════════════════════ */

export async function fetchTestResult(
  collegeId: string,
  testId: string,
  studentId: string
): Promise<TestResultDetail | null> {
  const resolved = await resolveTest(collegeId, testId, studentId);
  if (!resolved || !resolved.studentAssessment) return null;
  const { testData, studentAssessment } = resolved;
  const sa = studentAssessment.data;
  const status = String(sa.status || 'not_started');

  if (status !== 'submitted' && status !== 'graded') return null;

  const questions = sortByOrder(await loadQuestions(resolved.testId, testData));
  const persisted = Array.isArray(sa.questionResults) ? sa.questionResults : [];

  const answeredCount = Array.isArray(sa.answers) ? (sa.answers as StudentAnswer[]).length : 0;
  const isGraded = status === 'graded';
  const totalMarks = Number(sa.totalMarks) || Number(testData.totalMarks) || 0;
  const marksObtained = Number(sa.marksObtained) || 0;
  const percentage = isGraded
    ? Number(sa.percentage) || (totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0)
    : 0;

  const sectionMap = new Map<string, { total: number; correct: number; incorrect: number; score: number; totalMarks: number }>();
  const questionResults = questions.map((q, idx) => {
    const p = persisted.find((r: any) => String(r.questionId) === q.id) as any;
    const sectionName = q.sectionName || 'General';
    const marks = Number(q.marks) || 1;
    const entry = sectionMap.get(sectionName) || { total: 0, correct: 0, incorrect: 0, score: 0, totalMarks: 0 };
    entry.total += 1;
    entry.totalMarks += marks;
    if (p) {
      if (p.status === 'correct') { entry.correct += 1; entry.score += p.marksObtained || 0; }
      else if (p.status === 'incorrect') entry.incorrect += 1;
    }
    sectionMap.set(sectionName, entry);

    return {
      questionId: q.id,
      questionText: q.text,
      questionType: q.type,
      marks,
      options: q.options?.map((o) => o.text),
      // Answers/reasons only once graded (result visibility decision)
      correctAnswer: isGraded ? p?.correctAnswer || undefined : undefined,
      studentAnswer: isGraded ? p?.yourAnswer || undefined : undefined,
      isCorrect: isGraded && p?.status === 'correct',
      isAttempted: Boolean(p?.yourAnswer),
      explanation: isGraded ? p?.explanation || undefined : undefined,
      status: p?.status || 'unattempted',
      marksObtained: isGraded ? p?.marksObtained ?? null : null,
      sectionName,
      order: idx + 1,
    };
  });

  const sectionScores = Array.from(sectionMap.entries()).map(([sectionName, s]) => ({
    sectionName,
    total: s.total,
    correct: s.correct,
    incorrect: s.incorrect,
    score: s.score,
    totalMarks: s.totalMarks,
    percentage: s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100) : 0,
    timeTaken: 0,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
  }));

  // Leaderboard: sibling graded rows of the same test (client-sorted — no extra index)
  let leaderboard: TestResultDetail['leaderboard'] = [];
  let rank = 0;
  let totalStudents = 0;
  if (isGraded) {
    try {
      const lbQ = query(
        collection(db, 'studentAssessments'),
        where('testId', '==', resolved.testId),
        where('status', '==', 'graded'),
        limit(200)
      );
      const lbSnap = await getDocs(lbQ);
      const rows = lbSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }));
      rows.sort((a: any, b: any) => (Number(b.marksObtained) || 0) - (Number(a.marksObtained) || 0));
      totalStudents = rows.length;
      leaderboard = rows.map((r: any, idx: number) => {
        const rTotal = Number(r.totalMarks) || totalMarks || 1;
        const rMarks = Number(r.marksObtained) || 0;
        return {
          studentId: String(r.studentId || r.id),
          studentName: String(r.studentName || 'Student'),
          rank: idx + 1,
          score: rMarks,
          totalMarks: rTotal,
          percentage: rTotal > 0 ? Math.round((rMarks / rTotal) * 10000) / 100 : 0,
          timeTaken: Number(r.timeSpent) || 0,
          isPassed: rTotal > 0 ? (rMarks / rTotal) * 100 >= 40 : false,
          isCurrentUser: String(r.studentId) === studentId,
        };
      });
      rank = leaderboard.find((e) => e.isCurrentUser)?.rank || 0;
    } catch {
      /* leaderboard is best-effort */
    }
  }

  const autoScore = Number(sa.autoScore) || 0;
  const autoMax = Number(sa.autoMax) || 0;

  return {
    studentAssessmentId: studentAssessment.id,
    assessmentId: resolved.testId,
    title: String(sa.title || testData.title || testData.paperTitle || 'Assessment'),
    subject: String(sa.subject || testData.subject || ''),
    totalMarks,
    marksObtained: isGraded ? marksObtained : 0,
    percentage,
    grade: isGraded ? String(sa.grade || '') : '',
    gradePoint: isGraded ? Number(sa.gradePoint) || 0 : 0,
    timeSpent: Number(sa.timeSpent) || 0,
    totalQuestions: questions.length || Number(sa.totalQuestions) || 0,
    answeredCount,
    correctCount: Number(sa.objectiveCorrectCount) || 0,
    incorrectCount: Number(sa.objectiveIncorrectCount) || 0,
    unattemptedCount: Math.max(0, questions.length - answeredCount),
    sectionScores,
    questionResults,
    leaderboard,
    rank,
    totalStudents,
    facultyFeedback: sa.facultyFeedback ? String(sa.facultyFeedback) : undefined,
    submittedAt: toIso(sa.submittedAt),
    gradedAt: sa.gradedAt ? toIso(sa.gradedAt) : undefined,
    passingPercentage: 40,
    percentile: 0,
    completedAt: toIso(sa.submittedAt),
    flaggedCount: 0,
    // Phase 2 extras (pending state surfaced by the page)
    pendingManualGrading: !isGraded,
    autoScore,
    autoMax,
    manualPending: Boolean(sa.needsManualGrading),
  } as TestResultDetail & {
    pendingManualGrading: boolean;
    autoScore: number;
    autoMax: number;
    manualPending: boolean;
  };
}

/* ═══════════════════════════════════════════════════════════════════
   WRITE: proctoring event (basic browser proctoring)
   ═══════════════════════════════════════════════════════════════════ */

export async function logProctorEvent(
  collegeId: string,
  testId: string,
  studentAssessmentId: string,
  studentId: string,
  event: BasicProctorEvent
): Promise<void> {
  await addDoc(collection(db, 'proctoringLogs'), {
    collegeId,
    testId,
    studentAssessmentId,
    studentId,
    eventType: event.type,
    details: event.details || {},
    occurredAt: event.at,
    timestamp: serverTimestamp(),
  });
}
