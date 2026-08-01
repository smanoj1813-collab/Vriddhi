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
  // TODO: Implement actual auto-grading logic
  return gradeAssessment(studentAssessmentId, 0, 0, 'F', 0, 'Auto-graded');
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
  return {
    id: docRef.id,
    ...data,
    startDateTime: data.startDateTime instanceof Date ? data.startDateTime.toISOString() : data.startDateTime,
    endDateTime: data.endDateTime instanceof Date ? data.endDateTime.toISOString() : data.endDateTime,
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
  } as unknown as ScheduledTest;
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
