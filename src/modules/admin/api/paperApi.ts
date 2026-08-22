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
import { getAllQuestions, linkQuestionToPaper } from './questionBankApi';
import {
  Paper,
  PaperConfig,
  PaperSection,
  PaperStatus,
  GeneratedPaperResult,
  Question,
  QuestionType,
  DifficultyLevel,
} from '../types/questionBank';

const PAPERS_COLLECTION = 'papers';

function isoNow(): string {
  return Timestamp.now().toDate().toISOString();
}

function normalizePaper(data: any, id: string): Paper {
  const now = new Date().toISOString();
  return {
    ...(data || {}),
    id,
    createdAt: data?.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data?.createdAt || now,
    updatedAt: data?.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data?.updatedAt || now,
    status: (data?.status as PaperStatus) || 'draft',
    sections: data?.sections || [],
    linkedQuestionIds: data?.linkedQuestionIds || data?.questionIds || [],
    questionIds: data?.questionIds || data?.linkedQuestionIds || [],
    totalQuestions: data?.totalQuestions ?? (data?.questionIds || []).length,
  } as Paper;
}

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
    q = query(papersRef, where('collegeId', '==', collegeId), where('status', '==', filters.status), orderBy('createdAt', 'desc'));
  }
  const snap = await getDocs(q);
  let papers = snap.docs.map((d) => normalizePaper(d.data(), d.id));

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
  return normalizePaper(snap.data(), snap.id);
}

export async function createPaper(
  collegeId: string,
  config: PaperConfig,
  questionIds: string[],
  userId: string,
  userName: string,
  isManual: boolean = false,
  sections: PaperSection[] = []
): Promise<Paper> {
  const now = isoNow();
  const paperData = {
    ...config,
    sections: sections || [],
    questionIds: questionIds || [],
    linkedQuestionIds: questionIds || [],
    status: 'draft' as PaperStatus,
    collegeId,
    createdBy: userId,
    createdByName: userName,
    totalQuestions: (questionIds || []).length,
    usageCount: 0,
    examType: config.examType || 'midterm',
    batch: config.batch || '',
    branch: config.branch || '',
    date: config.date || new Date().toISOString().split('T')[0],
    isManual,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, PAPERS_COLLECTION), paperData);
  return { id: docRef.id, ...paperData } as Paper;
}

export async function updatePaper(paperId: string, updates: Partial<Paper>): Promise<Paper> {
  const docRef = doc(db, PAPERS_COLLECTION, paperId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: isoNow(),
  });
  const updated = await getDoc(docRef);
  return normalizePaper(updated.data(), updated.id);
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
    linkedQuestionIds: [...(original.linkedQuestionIds || original.questionIds || [])],
    questionIds: [...(original.questionIds || original.linkedQuestionIds || [])],
    totalQuestions: original.totalQuestions || (original.questionIds || []).length,
    usageCount: 0,
    createdAt: isoNow(),
    updatedAt: isoNow(),
  };
  const docRef = await addDoc(collection(db, PAPERS_COLLECTION), copyData);
  return { id: docRef.id, ...copyData } as Paper;
}

export async function getPaperQuestions(paperId: string): Promise<Question[]> {
  const paper = await getPaperById(paperId);
  if (!paper) return [];
  const ids = paper.questionIds || paper.linkedQuestionIds || [];
  const result: Question[] = [];
  for (const qid of ids) {
    const snap = await getDoc(doc(db, 'questions', qid));
    if (snap.exists()) {
      result.push({ ...snap.data(), id: snap.id } as Question);
    }
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════
// Paper Generation
// ═══════════════════════════════════════════════════════════════════════

function matchesType(q: Question, questionType: QuestionType | 'any'): boolean {
  if (questionType === 'any') return true;
  return q.type === questionType;
}

function matchesDifficulty(q: Question, difficulty: DifficultyLevel | 'mixed' | undefined): boolean {
  if (!difficulty || difficulty === 'mixed') return true;
  return q.difficulty === difficulty;
}

function matchesDifficultyMix(q: Question, mix?: { easy: number; medium: number; hard: number }): boolean {
  if (!mix) return true;
  const total = (mix.easy || 0) + (mix.medium || 0) + (mix.hard || 0);
  if (total === 0) return true;
  return true; // mix is enforced by bucket selection below, not pre-filtering
}

function pickWithDifficultyMix(
  candidates: Question[],
  numQuestions: number,
  mix?: { easy: number; medium: number; hard: number }
): Question[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  if (!mix || !mix.easy && !mix.medium && !mix.hard) {
    return shuffled.slice(0, numQuestions);
  }

  const buckets: Record<DifficultyLevel, Question[]> = {
    easy: shuffled.filter((q) => q.difficulty === 'easy'),
    medium: shuffled.filter((q) => q.difficulty === 'medium'),
    hard: shuffled.filter((q) => q.difficulty === 'hard'),
  };

  const picked: Question[] = [];
  const used = new Set<string>();

  const take = (level: DifficultyLevel, count: number) => {
    let taken = 0;
    for (const q of buckets[level]) {
      if (taken >= count) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        picked.push(q);
        taken++;
      }
    }
  };

  take('easy', mix.easy || 0);
  take('medium', mix.medium || 0);
  take('hard', mix.hard || 0);

  // Backfill from remaining pool if a bucket is short.
  for (const q of shuffled) {
    if (picked.length >= numQuestions) break;
    if (!used.has(q.id)) {
      used.add(q.id);
      picked.push(q);
    }
  }

  return picked;
}

export async function generatePaper(
  collegeId: string,
  config: PaperConfig & { sections?: PaperSection[] },
  userId: string,
  userName: string
): Promise<GeneratedPaperResult & { paper: Paper }> {
  const sections = config.sections || [];
  const allQuestions = await getAllQuestions(collegeId, 500);
  const warnings: string[] = [];

  const subjectFilter = config.subject?.trim();
  const filtered = allQuestions.filter((q) => {
    if (subjectFilter && q.subject !== subjectFilter && q.courseName !== subjectFilter) return false;
    return true;
  });

  const generatedSections = sections.map((sec) => {
    let pool = filtered.filter((q) =>
      matchesType(q, sec.questionType) &&
      matchesDifficulty(q, sec.difficulty) &&
      matchesDifficultyMix(q, sec.difficultyMix)
    );

    if (sec.topicFilter) pool = pool.filter((q) => (q.topic || q.chapter) === sec.topicFilter);
    if (sec.unitFilter) pool = pool.filter((q) => q.unit === sec.unitFilter);
    if (sec.compulsory === false) pool = pool.filter((q) => true);

    const questions = pickWithDifficultyMix(pool, sec.numQuestions, sec.difficultyMix);
    return {
      ...sec,
      questions,
      matched: questions.length,
      requested: sec.numQuestions,
    };
  });

  const totalMatched = generatedSections.reduce((sum, s) => sum + s.matched, 0);
  const totalSectionMarks = generatedSections.reduce((sum, s) => sum + s.numQuestions * s.marksPerQuestion, 0);
  if (totalSectionMarks !== config.totalMarks) {
    warnings.push(`Section totals (${totalSectionMarks}) do not match configured total marks (${config.totalMarks}).`);
  }

  const generatedQuestionIds = generatedSections.flatMap((s) => s.questions.map((q) => q.id));
  const paper = await createPaper(
    collegeId,
    config,
    generatedQuestionIds,
    userId,
    userName,
    false,
    generatedSections
  );

  if (generatedQuestionIds.length < generatedSections.reduce((sum, s) => sum + s.numQuestions, 0)) {
    warnings.push(`Only ${generatedQuestionIds.length} questions were available; ${generatedSections.reduce((sum, s) => sum + s.numQuestions, 0)} were requested.`);
  }

  // Keep the question documents linked to the paper.
  try {
    for (const qid of generatedQuestionIds) {
      await linkQuestionToPaper(qid, paper.id);
    }
  } catch {
    // Linking is best-effort; paper still stores the ids.
  }

  return {
    success: true,
    id: paper.id,
    title: config.title,
    subject: config.subject,
    totalMarks: config.totalMarks,
    duration: config.duration,
    totalQuestions: totalMatched,
    sections: generatedSections,
    warnings,
    generatedAt: new Date().toISOString(),
    paper: paper as any,
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

export async function setPaperStatus(paperId: string, status: PaperStatus): Promise<Paper> {
  return updatePaper(paperId, { status });
}
