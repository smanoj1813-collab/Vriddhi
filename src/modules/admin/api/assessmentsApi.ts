// api/assessmentsApi.ts
// ============================================
// ASSESSMENTS API — Complete Firebase Operations
// ============================================

import {
  collection, doc, getDoc, getDocs, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, Timestamp, writeBatch,
  limit, startAfter, QueryConstraint,
} from 'firebase/firestore';

// Dynamic firebase import to avoid path resolution issues
let db: any;
try {
  const firebaseMod = require('../firebase');
  db = firebaseMod.db;
} catch {
  try {
    const firebaseMod = require('../config/firebase');
    db = firebaseMod.db;
  } catch {
    console.warn('[assessmentsApi] Firebase db import failed. Ensure firebase config path is correct.');
  }
}

import type {
  Assessment, StudentAssessment, StudentAnswer,
  CreateAssessmentInput, UpdateAssessmentInput,
  AssessmentFilterOptions, AssessmentStats, AssessmentSection,
  AIGenerationConfig, BulkGradeInput,
  AssessmentPaper, CreatePaperInput, PaperSection, PaperQuestion,
  ScheduledTest, ScheduleTestInput, ReviewQueueItem,
  TestAnalytics,
} from '../types/assessment';

// ═══════════════════════════════════════════════════════════════════════
// Assessments
// ═══════════════════════════════════════════════════════════════════════

export async function createAssessment(input: CreateAssessmentInput): Promise<Assessment> {
  const now = Timestamp.now();
  const data = {
    ...input,
    status: input.status || 'draft',
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'assessments'), data);
  return { id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() } as unknown as Assessment;
}

export async function getAssessmentById(id: string): Promise<Assessment | null> {
  const docRef = doc(db, 'assessments', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() || '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
  } as unknown as Assessment;
}

export async function listAssessments(options: AssessmentFilterOptions = {}): Promise<Assessment[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (options.collegeId) constraints.push(where('collegeId', '==', options.collegeId));
  if (options.subjectId) constraints.push(where('subjectId', '==', options.subjectId));
  if (options.courseId) constraints.push(where('courseId', '==', options.courseId));
  if (options.status) constraints.push(where('status', '==', options.status));
  if (options.type) constraints.push(where('type', '==', options.type));
  if (options.facultyId) constraints.push(where('createdBy', '==', options.facultyId));
  if (options.curriculumId) constraints.push(where('curriculumId', '==', options.curriculumId));
  if (options.branch) constraints.push(where('branch', '==', options.branch));
  if (options.semester !== undefined) constraints.push(where('semester', '==', options.semester));
  if (options.batch) constraints.push(where('batch', '==', options.batch));
  if (options.division) constraints.push(where('division', '==', options.division));
  if (options.section) constraints.push(where('section', '==', options.section));
  if (options.mode) constraints.push(where('mode', '==', options.mode));

  const q = query(collection(db, 'assessments'), ...constraints);
  const snapshot = await getDocs(q);
  let items = snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || '',
      updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
    } as unknown as Assessment;
  });

  if (options.scheduledDateFrom) {
    items = items.filter((a) =>
      a.scheduledDate && new Date(a.scheduledDate as string) >= new Date(options.scheduledDateFrom as string)
    );
  }
  if (options.scheduledDateTo) {
    items = items.filter((a) =>
      a.scheduledDate && new Date(a.scheduledDate as string) <= new Date(options.scheduledDateTo as string)
    );
  }
  if (options.search || options.searchQuery) {
    const term = (options.search || options.searchQuery || '').toLowerCase();
    items = items.filter((a) =>
      (a.title?.toLowerCase() || '').includes(term) ||
      (a.courseCode?.toLowerCase() || '').includes(term) ||
      (a.courseName?.toLowerCase() || '').includes(term)
    );
  }

  return items;
}

export async function updateAssessment(id: string, updates: UpdateAssessmentInput): Promise<Assessment> {
  const docRef = doc(db, 'assessments', id);
  const data = { ...updates, updatedAt: Timestamp.now() };
  await updateDoc(docRef, data);
  const updated = await getDoc(docRef);
  const updatedData = updated.data()!;
  return {
    id: updated.id,
    ...updatedData,
    createdAt: updatedData.createdAt?.toDate?.().toISOString() || '',
    updatedAt: updatedData.updatedAt?.toDate?.().toISOString() || '',
  } as unknown as Assessment;
}

export async function deleteAssessment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'assessments', id));
}

export async function publishAssessment(assessmentId: string): Promise<Assessment> {
  return updateAssessment(assessmentId, { status: 'published' });
}

export async function activateAssessment(assessmentId: string): Promise<Assessment> {
  return updateAssessment(assessmentId, { status: 'active' });
}

export async function completeAssessment(assessmentId: string): Promise<Assessment> {
  return updateAssessment(assessmentId, { status: 'completed' });
}

export async function archiveAssessment(assessmentId: string): Promise<Assessment> {
  return updateAssessment(assessmentId, { status: 'archived' });
}

// ═══════════════════════════════════════════════════════════════════════
// Student Assessments
// ═══════════════════════════════════════════════════════════════════════

export async function createStudentAssessment(assessment: Assessment, student: { id: string; name: string; regNo: string }): Promise<StudentAssessment> {
  const now = Timestamp.now();
  const data = {
    assessmentId: assessment.id,
    studentId: student.id,
    studentName: student.name,
    regNo: student.regNo,
    collegeId: assessment.collegeId,
    branch: assessment.branch || '',
    semester: assessment.semester || 0,
    batch: assessment.batch || '',
    division: assessment.division || '',
    section: assessment.section || '',
    status: 'not_started',
    marksObtained: 0,
    totalMarks: assessment.totalMarks || 0,
    percentage: 0,
    grade: null as string | null,
    gradePoint: 0,
    timeSpent: 0,
    answers: [] as StudentAnswer[],
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'studentAssessments'), data);
  return { id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() } as unknown as StudentAssessment;
}

export async function getStudentAssessment(id: string): Promise<StudentAssessment | null> {
  const docRef = doc(db, 'studentAssessments', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() || '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
  } as unknown as StudentAssessment;
}

export async function listStudentAssessments(filters: { assessmentId?: string; studentId?: string; status?: string } = {}): Promise<StudentAssessment[]> {
  const constraints: QueryConstraint[] = [];
  if (filters.assessmentId) constraints.push(where('assessmentId', '==', filters.assessmentId));
  if (filters.studentId) constraints.push(where('studentId', '==', filters.studentId));
  if (filters.status) constraints.push(where('status', '==', filters.status));

  const q = query(collection(db, 'studentAssessments'), ...constraints, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || '',
      updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
    } as unknown as StudentAssessment;
  });
}

export async function startAssessment(studentAssessmentId: string): Promise<StudentAssessment> {
  const docRef = doc(db, 'studentAssessments', studentAssessmentId);
  await updateDoc(docRef, { status: 'in_progress', startedAt: new Date().toISOString(), updatedAt: Timestamp.now() });
  const updated = await getDoc(docRef);
  const data = updated.data()!;
  return { id: updated.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() || '', updatedAt: data.updatedAt?.toDate?.().toISOString() || '' } as unknown as StudentAssessment;
}

export async function submitAssessment(studentAssessmentId: string, answers: StudentAnswer[], timeSpent: number): Promise<StudentAssessment> {
  const docRef = doc(db, 'studentAssessments', studentAssessmentId);
  await updateDoc(docRef, { status: 'submitted', answers, timeSpent, submittedAt: new Date().toISOString(), updatedAt: Timestamp.now() });
  const updated = await getDoc(docRef);
  const data = updated.data()!;
  return { id: updated.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() || '', updatedAt: data.updatedAt?.toDate?.().toISOString() || '' } as unknown as StudentAssessment;
}

export async function gradeAssessment(
  studentAssessmentId: string,
  marksObtained: number,
  percentage: number,
  grade: string,
  gradePoint: number,
  feedback?: string,
  _gradedBy?: string
): Promise<StudentAssessment> {
  const docRef = doc(db, 'studentAssessments', studentAssessmentId);
  const updateData: Record<string, unknown> = { status: 'graded', marksObtained, percentage, grade, gradePoint, updatedAt: Timestamp.now() };
  if (feedback) updateData.facultyFeedback = feedback;
  await updateDoc(docRef, updateData);
  const updated = await getDoc(docRef);
  const data = updated.data()!;
  return { id: updated.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() || '', updatedAt: data.updatedAt?.toDate?.().toISOString() || '' } as unknown as StudentAssessment;
}

export async function autoGradeStudentAssessment(studentAssessmentId: string, _questions: any[]): Promise<StudentAssessment> {
  // Phase 2: real auto-grading via the shared objective grading core.
  // Loads the submitted row, re-grades its answers against the frozen
  // question snapshot, and grades immediately when nothing needs faculty.
  const saSnap = await getDoc(doc(db, 'studentAssessments', studentAssessmentId));
  if (!saSnap.exists()) throw new Error('Student assessment not found');
  const sa = saSnap.data();
  if (!['submitted', 'in_progress'].includes(String(sa.status))) {
    return saSnap.data() as unknown as StudentAssessment;
  }

  const testId = String(sa.testId || sa.assessmentId || '');
  let questions: any[] = _questions && _questions.length > 0 ? _questions : [];
  if (questions.length === 0 && testId) {
    const qSnap = await getDocs(collection(db, 'scheduledTests', testId, 'assessmentQuestions'));
    questions = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const { gradePaper, deriveGradeFromPercentage } = await import('../../../shared/utils/assessmentGrading');
  const graded = gradePaper(
    questions.map((q: any) => ({
      id: String(q.id || q.questionId),
      type: String(q.type || 'mcq'),
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || undefined,
      options: q.options,
      correctAnswer: q.correctAnswer,
      tolerance: q.tolerance,
    })),
    (Array.isArray(sa.answers) ? sa.answers : []) as any[]
  );

  const totalMarks = Number(sa.totalMarks) || graded.autoMax + graded.manualMax;
  if (graded.needsManualGrading) {
    // Persist the objective score but keep status submitted for faculty
    await updateDoc(doc(db, 'studentAssessments', studentAssessmentId), {
      autoScore: graded.autoScore,
      autoMax: graded.autoMax,
      manualMax: graded.manualMax,
      needsManualGrading: true,
      updatedAt: Timestamp.now(),
    });
    const refreshed = await getDoc(doc(db, 'studentAssessments', studentAssessmentId));
    return { id: refreshed.id, ...refreshed.data()! } as unknown as StudentAssessment;
  }

  const marksObtained = Math.max(0, graded.autoScore);
  const percentage = totalMarks > 0 ? Math.round((marksObtained / totalMarks) * 10000) / 100 : 0;
  const { grade, gradePoint } = deriveGradeFromPercentage(percentage);
  return gradeAssessment(studentAssessmentId, marksObtained, percentage, grade, gradePoint, 'Auto-graded (objective paper)');
}

export async function bulkCreateStudentAssessments(assessment: Assessment, students: Array<{ id: string; name: string; regNo: string }>): Promise<StudentAssessment[]> {
  const results: StudentAssessment[] = [];
  for (const student of students) {
    const sa = await createStudentAssessment(assessment, student);
    results.push(sa);
  }
  return results;
}

export async function bulkGradeAssessments(inputs: BulkGradeInput[]): Promise<void> {
  const batch = writeBatch(db);
  for (const input of inputs) {
    const ref = doc(db, 'studentAssessments', input.studentAssessmentId);
    batch.update(ref, {
      marksObtained: input.marksObtained,
      percentage: input.percentage,
      grade: input.grade,
      gradePoint: input.gradePoint,
      facultyFeedback: input.feedback || '',
      status: 'graded',
      updatedAt: Timestamp.now(),
    });
  }
  await batch.commit();
}

export async function recalculateAssessmentStats(_assessmentId: string): Promise<void> {
  // TODO: Implement stats recalculation
}

export async function getAssessmentStats(_collegeId: string): Promise<AssessmentStats> {
  // TODO: Implement real stats aggregation
  const stats = {
    totalAssessments: 0,
    draftCount: 0,
    publishedCount: 0,
    activeCount: 0,
    completedCount: 0,
    archivedCount: 0,
    activeAssessments: 0,
    completedAssessments: 0,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
    upcomingCount: 0,
    ongoingCount: 0,
    totalSubmissions: 0,
    totalGraded: 0,
    averageScore: 0,
    byBranch: {} as Record<string, number>,
    bySemester: {} as Record<string, number>,
    byBatch: {} as Record<string, number>,
  };

  return stats as unknown as AssessmentStats;
}

export async function getAssessmentAverageScore(assessmentId: string): Promise<number> {
  const q = query(collection(db, 'studentAssessments'), where('assessmentId', '==', assessmentId), where('status', '==', 'graded'));
  const snapshot = await getDocs(q);
  let totalScore = 0;
  let scoreCount = 0;
  snapshot.docs.forEach((d) => {
    const sa = d.data() as StudentAssessment;
    if ((sa.percentage || 0) > 0) {
      totalScore += sa.percentage || 0;
      scoreCount++;
    }
  });
  return scoreCount > 0 ? totalScore / scoreCount : 0;
}

// ═══════════════════════════════════════════════════════════════════════
// Review Queue
// ═══════════════════════════════════════════════════════════════════════

export async function getPendingReviews(): Promise<ReviewQueueItem[]> {
  const q = query(collection(db, 'reviewQueue'), where('status', '==', 'pending'), orderBy('submittedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type || 'question',
      itemId: data.questionId || data.paperId || d.id,
      title: data.title || 'Untitled',
      status: data.status || 'pending',
      submittedBy: data.submittedBy || '',
      submittedByName: data.submittedByName || 'Unknown',
      submittedByRole: data.submittedByRole || 'faculty',
      submittedAt: data.submittedAt?.toDate?.().toISOString() || new Date().toISOString(),
      questionId: data.questionId,
      paperId: data.paperId,
      rejectionReason: data.rejectionReason,
      reviewedBy: data.reviewedBy,
      reviewedAt: data.reviewedAt?.toDate?.().toISOString() || '',
    } as unknown as ReviewQueueItem;
  });
}

export async function approveQuestion(questionId: string, reviewerId: string, reviewerName: string, _comment?: string): Promise<boolean> {
  await updateDoc(doc(db, 'questions', questionId), { status: 'approved', reviewedBy: reviewerId, reviewedByName: reviewerName, reviewedAt: Timestamp.now() });
  return true;
}

export async function rejectQuestion(questionId: string, reviewerId: string, reviewerName: string, reason: string): Promise<boolean> {
  await updateDoc(doc(db, 'questions', questionId), { status: 'rejected', reviewedBy: reviewerId, reviewedByName: reviewerName, reviewedAt: Timestamp.now(), rejectionReason: reason });
  return true;
}

export async function approvePaper(paperId: string, reviewerId: string, reviewerName: string, _comment?: string): Promise<boolean> {
  await updateDoc(doc(db, 'papers', paperId), { status: 'approved', reviewedBy: reviewerId, reviewedByName: reviewerName, reviewedAt: Timestamp.now() });
  return true;
}

export async function rejectPaper(paperId: string, reviewerId: string, reviewerName: string, reason: string): Promise<boolean> {
  await updateDoc(doc(db, 'papers', paperId), { status: 'rejected', reviewedBy: reviewerId, reviewedByName: reviewerName, reviewedAt: Timestamp.now(), rejectionReason: reason });
  return true;
}

// ═══════════════════════════════════════════════════════════════════════
// Papers
// ═══════════════════════════════════════════════════════════════════════

export async function createPaper(input: CreatePaperInput): Promise<AssessmentPaper> {
  const now = Timestamp.now();
  const totalMarks = input.sections.reduce((sum, s) => sum + (s.totalMarks || 0), 0);
  const totalQuestions = input.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
  const data = {
    ...input,
    totalMarks,
    totalQuestions,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'papers'), data);
  return { id: docRef.id, ...data, createdAt: now.toDate().toISOString(), updatedAt: now.toDate().toISOString() } as unknown as AssessmentPaper;
}

export async function getPaperById(id: string): Promise<AssessmentPaper | null> {
  const docRef = doc(db, 'papers', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString() || '',
    updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
  } as unknown as AssessmentPaper;
}

export async function listPapers(collegeId: string, filters?: { status?: string; subject?: string; createdBy?: string }): Promise<AssessmentPaper[]> {
  const constraints: QueryConstraint[] = [where('collegeId', '==', collegeId), orderBy('createdAt', 'desc')];
  if (filters?.status) constraints.push(where('status', '==', filters.status));
  if (filters?.subject) constraints.push(where('subjectId', '==', filters.subject));
  if (filters?.createdBy) constraints.push(where('createdBy', '==', filters.createdBy));

  const q = query(collection(db, 'papers'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || '',
      updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
    } as unknown as AssessmentPaper;
  });
}

export async function updatePaper(id: string, updates: Partial<AssessmentPaper>): Promise<AssessmentPaper> {
  const docRef = doc(db, 'papers', id);
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
  const updated = await getDoc(docRef);
  const data = updated.data()!;
  return { id: updated.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() || '', updatedAt: data.updatedAt?.toDate?.().toISOString() || '' } as unknown as AssessmentPaper;
}

export async function deletePaper(id: string): Promise<void> {
  await deleteDoc(doc(db, 'papers', id));
}

// ═══════════════════════════════════════════════════════════════════════
// Scheduled Tests
// ═══════════════════════════════════════════════════════════════════════

export async function scheduleTest(input: ScheduleTestInput): Promise<ScheduledTest> {
  const now = Timestamp.now();
  const data = {
    ...input,
    status: 'scheduled',
    paperType: 'quiz',
    totalRegistered: 0,
    totalStarted: 0,
    totalSubmitted: 0,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'scheduledTests'), data);

  // Phase 2: freeze the paper's questions into the assessmentQuestions
  // subcollection so the student engine has one authoritative source
  // (scheduledTests/{id}/assessmentQuestions). Non-fatal on failure —
  // the reader falls back to inline questions / paper links.
  try {
    const snapshotted = await snapshotQuestionsToSchedule(docRef.id, String(input.paperId || ''));
    if (snapshotted > 0 && !(input as unknown as Record<string, unknown>).totalQuestions) {
      await updateDoc(doc(db, 'scheduledTests', docRef.id), { totalQuestions: snapshotted });
    }
  } catch (err) {
    console.error('[scheduleTest] question snapshot failed (non-fatal):', err);
  }

  return {
    id: docRef.id,
    ...data,
    startDateTime: data.startDateTime instanceof Date ? data.startDateTime.toISOString() : data.startDateTime,
    endDateTime: data.endDateTime instanceof Date ? data.endDateTime.toISOString() : data.endDateTime,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as unknown as ScheduledTest;
}

/**
 * Copies the paper's questions into scheduledTests/{testId}/assessmentQuestions.
 * Reads questions from (in order): paper.sections[].questions (embedded),
 * paper.linkedQuestionIds → questions collection.
 * Returns the number of questions snapshotted.
 */
async function snapshotQuestionsToSchedule(testId: string, paperId: string): Promise<number> {
  if (!testId || !paperId) return 0;
  const paperSnap = await getDoc(doc(db, 'papers', paperId));
  if (!paperSnap.exists()) return 0;
  const paper = paperSnap.data();

  type SnapQuestion = Record<string, unknown>;
  const questions: SnapQuestion[] = [];

  const push = (q: any, sectionId?: string, sectionName?: string, order = questions.length + 1) => {
    if (!q) return;
    questions.push({
      questionId: String(q.id || q.questionId || ''),
      order: typeof q.order === 'number' ? q.order : order,
      text: String(q.text || q.questionText || ''),
      type: String(q.type || q.questionType || 'mcq'),
      difficulty: String(q.difficulty || 'medium'),
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negativeMarks) || 0,
      options: Array.isArray(q.options)
        ? q.options.map((o: any, i: number) =>
            typeof o === 'string' ? { id: `opt-${i}`, text: o } : { id: String(o.id || `opt-${i}`), text: String(o.text ?? ''), isCorrect: Boolean(o.isCorrect) }
          )
        : undefined,
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : undefined,
      explanation: q.explanation || undefined,
      imageUrl: q.imageUrl || undefined,
      caseText: q.caseText || undefined,
      matchPairs: Array.isArray(q.matchPairs) ? q.matchPairs : undefined,
      tolerance: typeof q.tolerance === 'number' ? q.tolerance : undefined,
      sectionId: sectionId || undefined,
      sectionName: sectionName || undefined,
    });
  };

  if (Array.isArray(paper.sections)) {
    (paper.sections as any[]).forEach((s) => {
      (Array.isArray(s.questions) ? s.questions : []).forEach((q: any) => push(q, s.id, s.name || s.title));
    });
  }
  if (questions.length === 0) {
    const qIds: string[] = (paper.linkedQuestionIds || paper.questionIds || []) as string[];
    for (const qId of qIds) {
      const qSnap = await getDoc(doc(db, 'questions', qId));
      if (qSnap.exists()) push(qSnap.data());
    }
  }
  if (questions.length === 0) return 0;

  const batch = writeBatch(db);
  questions.forEach((q) => {
    const ref = doc(collection(db, 'scheduledTests', testId, 'assessmentQuestions'));
    batch.set(ref, q);
  });
  await batch.commit();
  return questions.length;
}

export async function listScheduledTests(filters: { collegeId?: string; facultyId?: string; status?: string } = {}): Promise<ScheduledTest[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
  if (filters.collegeId) constraints.push(where('collegeId', '==', filters.collegeId));
  if (filters.facultyId) constraints.push(where('facultyId', '==', filters.facultyId));
  if (filters.status) constraints.push(where('status', '==', filters.status));

  const q = query(collection(db, 'scheduledTests'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || '',
      updatedAt: data.updatedAt?.toDate?.().toISOString() || '',
    } as unknown as ScheduledTest;
  });
}

export async function updateScheduledTest(id: string, updates: Partial<ScheduledTest>): Promise<ScheduledTest> {
  const docRef = doc(db, 'scheduledTests', id);
  await updateDoc(docRef, { ...updates, updatedAt: Timestamp.now() });
  const updated = await getDoc(docRef);
  const data = updated.data()!;
  return { id: updated.id, ...data, createdAt: data.createdAt?.toDate?.().toISOString() || '', updatedAt: data.updatedAt?.toDate?.().toISOString() || '' } as unknown as ScheduledTest;
}

export async function deleteScheduledTest(id: string): Promise<void> {
  await deleteDoc(doc(db, 'scheduledTests', id));
}
