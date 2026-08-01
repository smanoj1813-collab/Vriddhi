import { db } from '@/Firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Paper, PaperConfig, PaperSection, PaperStatus, GeneratedPaperResult } from '../types/questionBank';

const PAPERS_COLLECTION = 'papers';

// ═══════════════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════════════

export async function fetchPapers(
  collegeId: string,
  filters?: { status?: PaperStatus; search?: string }
): Promise<{ data: Paper[]; total: number }> {
  const papersRef = collection(db, PAPERS_COLLECTION);
  let q = query(papersRef, where('collegeId', '==', collegeId), orderBy('createdAt', 'desc'));
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  const snap = await getDocs(q);
  let papers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Paper));

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    papers = papers.filter((p) => p.title.toLowerCase().includes(searchLower));
  }

  return { data: papers, total: papers.length };
}

export async function getPaperById(paperId: string): Promise<Paper | null> {
  const docRef = doc(db, PAPERS_COLLECTION, paperId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Paper;
}

export async function createPaper(
  collegeId: string,
  config: PaperConfig,
  questionIds: string[],
  userId: string,
  userName: string,
  _isManual: boolean = false
): Promise<Paper> {
  const paperData = {
    ...config,
    sections: [],
    status: 'draft' as PaperStatus,
    collegeId,
    createdBy: userId,
    createdByName: userName,
    linkedQuestionIds: questionIds,
    totalQuestions: questionIds.length,
    usageCount: 0,
    createdAt: Timestamp.now().toDate().toISOString(),
    updatedAt: Timestamp.now().toDate().toISOString(),
  };
  const docRef = await addDoc(collection(db, PAPERS_COLLECTION), paperData);
  return { id: docRef.id, ...paperData } as Paper;
}

export async function updatePaper(paperId: string, updates: Partial<Paper>): Promise<Paper> {
  const docRef = doc(db, PAPERS_COLLECTION, paperId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now().toDate().toISOString(),
  });
  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as Paper;
}

export async function deletePaper(paperId: string): Promise<void> {
  await deleteDoc(doc(db, PAPERS_COLLECTION, paperId));
}

export async function duplicatePaper(
  paperId: string,
  collegeId: string,
  userId: string,
  userName: string,
  newTitle?: string
): Promise<Paper> {
  const original = await getPaperById(paperId);
  if (!original) throw new Error('Paper not found');

  const { id, createdAt, updatedAt, status, usageCount, ...rest } = original;
  const copyData = {
    ...rest,
    title: newTitle || `${original.title} (Copy)`,
    status: 'draft' as PaperStatus,
    collegeId,
    createdBy: userId,
    createdByName: userName,
    linkedQuestionIds: [...original.linkedQuestionIds],
    totalQuestions: original.totalQuestions || original.linkedQuestionIds.length,
    usageCount: 0,
    createdAt: Timestamp.now().toDate().toISOString(),
    updatedAt: Timestamp.now().toDate().toISOString(),
  };
  const docRef = await addDoc(collection(db, PAPERS_COLLECTION), copyData);
  return { id: docRef.id, ...copyData } as Paper;
}

// ═══════════════════════════════════════════════════════════════════════
// Paper Generation
// ═══════════════════════════════════════════════════════════════════════

export async function generatePaper(
  collegeId: string,
  config: PaperConfig & { sections?: PaperSection[] },
  userId: string,
  userName: string
): Promise<GeneratedPaperResult & { paper: Paper }> {
  const sections = config.sections || [];

  const generatedSections = sections.map((sec) => ({
    ...sec,
    questions: sec.questions || [],
    matched: sec.questions?.length || 0,
    requested: sec.numQuestions,
  }));

  const warnings: string[] = [];
  const totalSectionMarks = sections.reduce(
    (sum, s) => sum + s.numQuestions * s.marksPerQuestion,
    0
  );
  if (totalSectionMarks !== config.totalMarks) {
    warnings.push(
      `Section totals (${totalSectionMarks}) do not match configured total marks (${config.totalMarks}).`
    );
  }

  // Save the generated paper
  const paper = await createPaper(
    collegeId,
    config,
    sections.flatMap((s) => s.questions?.map((q) => q.id) || []),
    userId,
    userName,
    false
  );

  // Ensure paper has totalQuestions for type safety
  const safePaper: Paper = {
    ...paper,
    totalQuestions: paper.totalQuestions || sections.reduce((sum, s) => sum + s.numQuestions, 0),
  };

  return {
    success: true,
    id: paper.id,
    title: config.title,
    subject: config.subject,
    totalMarks: config.totalMarks,
    duration: config.duration,
    totalQuestions: sections.reduce((sum, s) => sum + s.numQuestions, 0),
    sections: generatedSections,
    warnings,
    generatedAt: new Date().toISOString(),
    paper: safePaper as any,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Status Management
// ═══════════════════════════════════════════════════════════════════════

export async function publishPaper(paperId: string): Promise<Paper> {
  return updatePaper(paperId, { status: 'published' });
}

export async function archivePaper(paperId: string): Promise<Paper> {
  return updatePaper(paperId, { status: 'archived' });
}
