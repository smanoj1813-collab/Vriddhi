// src/modules/admin/api/cloudStorageApi.ts
// Universal question/paper storage API backed by Firestore.
// Replaces the earlier stubs so PaperBuilder preview and generation work.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type {
  ApiResponse,
  QuestionContent,
  QuestionMetadata,
  Paper,
  PaperTemplate,
  PaperGenerationConfig,
  PaperGenerationResult,
  PaperQuestionRef,
  CreatedBy,
} from '../types/universalQuestionBank';

const META_COLLECTION = 'questionBank_meta';
const CONTENT_COLLECTION = 'questionBank_content';
const PAPERS_COLLECTION = 'papers_universal';
const TEMPLATES_COLLECTION = 'paperTemplates';

function toISOString(v: unknown, fallback: string): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  return (v as string) || fallback;
}

function normalizeQuestionContent(data: any, id: string): QuestionContent {
  const now = new Date().toISOString();
  return {
    id,
    version: data.version ?? 1,
    questionText: data.questionText || data.text || data.content || '',
    options: (data.options || []) as QuestionContent['options'],
    correctAnswer: data.correctAnswer || '',
    explanation: data.explanation || '',
    hint: data.hint || '',
    topicId: data.topicId || '',
    subjectId: data.subjectId || '',
    subTopicId: data.subTopicId || '',
    difficulty: data.difficulty || 'medium',
    questionType: data.questionType || 'mcq',
    marks: data.marks ?? 1,
    language: data.language || 'English',
    tags: data.tags || [],
    images: data.images || [],
    hasImage: !!data.hasImage || !!data.imageUrl,
    createdBy: data.createdBy || {
      userId: data.createdByUserId || '',
      userName: data.createdByName || 'Unknown',
      collegeId: data.collegeId || null,
      collegeName: data.collegeName || '',
      role: (data.role as CreatedBy['role']) || 'faculty',
    },
    source: data.source || 'manual',
    status: data.status || 'pending',
    quality: data.quality || { rating: 0, reviewCount: 0, flagged: false },
    usageStats: data.usageStats || { usedInPapers: 0, usedInAssessments: 0, collegesUsing: [] },
    versions: data.versions || [],
    storagePath: data.storagePath || `questionBank_content/${id}.json`,
    metadataDocId: data.metadataDocId || id,
    createdAt: toISOString(data.createdAt, now),
    updatedAt: toISOString(data.updatedAt, now),
  };
}

function idFromStoragePath(path: string): string {
  if (!path) return '';
  const parts = path.split('/');
  const last = parts[parts.length - 1] || '';
  return last.replace(/\.json$/i, '');
}

export const questionStorageApi = {
  async downloadQuestion(storagePath: string): Promise<ApiResponse<QuestionContent>> {
    try {
      const id = idFromStoragePath(storagePath);
      if (!id) return { success: false, error: 'Invalid storagePath' };

      const docRef = doc(db, CONTENT_COLLECTION, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { success: true, data: normalizeQuestionContent(snap.data(), snap.id) };
      }

      // Fall back to the metadata document if content was never uploaded.
      const metaRef = doc(db, META_COLLECTION, id);
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        const meta = metaSnap.data() || {};
        return {
          success: true,
          data: normalizeQuestionContent(
            {
              ...meta,
              questionText: meta.questionText || meta.text || dataFromLegacy(meta) || '',
              storagePath: meta.storagePath || storagePath,
            },
            metaSnap.id,
          ),
        };
      }

      // Fall back to the college question bank document.
      const legacyRef = doc(db, 'questions', id);
      const legacySnap = await getDoc(legacyRef);
      if (legacySnap.exists()) {
        const legacy = legacySnap.data() || {};
        return {
          success: true,
          data: normalizeQuestionContent(
            {
              ...legacy,
              questionText: legacy.questionText || legacy.text || '',
              questionType: legacy.questionType || legacy.type || 'mcq',
              difficulty: legacy.difficulty || 'medium',
              marks: legacy.marks ?? legacy.marksPerQuestion ?? 1,
              tags: legacy.tags || [],
              storagePath: legacy.storagePath || storagePath,
              metadataDocId: legacySnap.id,
              status: legacy.status === 'active' ? 'approved' : legacy.status,
            },
            legacySnap.id,
          ),
        };
      }

      return { success: false, error: 'Question content not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

function dataFromLegacy(meta: any): string | undefined {
  return meta.questionText || meta.text || meta.content;
}

export const paperStorageApi = {
  async uploadPaper(paper: Paper): Promise<ApiResponse<{ storagePath: string }>> {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, PAPERS_COLLECTION), {
        ...paper,
        createdAt: paper.createdAt || now,
        updatedAt: paper.updatedAt || now,
      });
      return { success: true, data: { storagePath: `papers_universal/${docRef.id}` } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

async function readPaper(paperId: string): Promise<Paper | null> {
  const universalRef = doc(db, PAPERS_COLLECTION, paperId);
  const universalSnap = await getDoc(universalRef);
  if (universalSnap.exists()) {
    const d = universalSnap.data();
    return { id: universalSnap.id, ...d } as Paper;
  }
  const legacyRef = doc(db, 'papers', paperId);
  const legacySnap = await getDoc(legacyRef);
  if (legacySnap.exists()) {
    const d = legacySnap.data();
    const createdBy = {
      userId: d.createdBy || '',
      userName: d.createdByName || 'Unknown',
      collegeId: d.collegeId || null,
      collegeName: d.collegeName || '',
      role: 'faculty',
    };
    const questionRefs: PaperQuestionRef[] = (d.questionIds || []).map((qid: string, i: number) => ({
      questionId: qid,
      order: i + 1,
      marks: 1,
      isRequired: true,
    }));
    return {
      id: legacySnap.id,
      title: d.title || '',
      description: d.description || '',
      subjectId: d.subjectId || d.subject || '',
      topicIds: d.topicIds || [],
      questions: questionRefs,
      totalQuestions: questionRefs.length,
      totalMarks: d.totalMarks || questionRefs.length,
      duration: d.duration || 60,
      difficultyDistribution: d.difficultyDistribution || { easy: 0, medium: 0, hard: 0 },
      topicDistribution: d.topicDistribution || {},
      createdBy: (typeof d.createdBy === 'object' && d.createdBy) ? d.createdBy : createdBy,
      visibility: d.visibility || 'college_only',
      sharedWith: d.sharedWith || [],
      isTemplate: !!d.isTemplate,
      status: d.status === 'published' ? 'published' : d.status === 'archived' ? 'archived' : 'draft',
      storagePath: d.storagePath || '',
      usageStats: d.usageStats || { timesUsed: 0, collegesUsing: [] },
      tags: d.tags || [],
      createdAt: toISOString(d.createdAt, new Date().toISOString()),
      updatedAt: toISOString(d.updatedAt, new Date().toISOString()),
    };
  }
  return null;
}

export const paperGeneratorApi = {
  async validateConfig(config: unknown): Promise<ApiResponse<{ isValid: boolean; errors: string[] }>> {
    const c = (config || {}) as Partial<PaperGenerationConfig>;
    const errors: string[] = [];
    if (!c.title) errors.push('Title is required');
    if (!c.subjectId) errors.push('Subject is required');
    if (!c.totalMarks || c.totalMarks <= 0) errors.push('Total marks must be positive');
    return { success: true, data: { isValid: errors.length === 0, errors } };
  },

  async generate(config: PaperGenerationConfig, createdBy: CreatedBy): Promise<ApiResponse<PaperGenerationResult>> {
    try {
      const baseConstraints: any[] = [where('status', '==', 'approved')];
      if (config.subjectId) baseConstraints.push(where('subjectId', '==', config.subjectId));

      const snap = await getDocs(query(collection(db, META_COLLECTION), ...baseConstraints, orderBy('createdAt', 'desc'), limit(200)));

      let candidates = snap.docs.map((d) => ({ id: d.id, ...d.data() } as QuestionMetadata));
      if (config.topicIds?.length) {
        candidates = candidates.filter((q) => config.topicIds!.includes(q.topicId));
      }
      if (config.excludeQuestionIds?.length) {
        candidates = candidates.filter((q) => !config.excludeQuestionIds!.includes(q.id));
      }

      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const needed = config.totalQuestions || config.totalMarks;
      const selected = shuffled.slice(0, Math.max(needed, 1));

      const now = new Date().toISOString();
      const refs: PaperQuestionRef[] = selected.map((q, i) => ({
        questionId: q.id,
        order: i + 1,
        marks: q.marks || Math.max(1, Math.floor(config.totalMarks / Math.max(selected.length, 1))),
        isRequired: true,
      }));

      const totalMarks = refs.reduce((sum, r) => sum + r.marks, 0);
      const distribution = { easy: 0, medium: 0, hard: 0 };
      const topicDistribution: Record<string, number> = {};
      selected.forEach((q) => {
        distribution[q.difficulty] = (distribution[q.difficulty] || 0) + 1;
        topicDistribution[q.topicId] = (topicDistribution[q.topicId] || 0) + 1;
      });

      const paper: Paper = {
        id: '',
        title: config.title,
        description: config.description || '',
        subjectId: config.subjectId,
        topicIds: config.topicIds || [],
        questions: refs,
        totalQuestions: refs.length,
        totalMarks: totalMarks || config.totalMarks,
        duration: config.duration,
        difficultyDistribution: config.difficultyDistribution || distribution,
        topicDistribution,
        createdBy,
        visibility: config.visibility || 'college_only',
        sharedWith: config.sharedWith || [],
        isTemplate: false,
        status: 'draft',
        storagePath: '',
        usageStats: { timesUsed: 0, collegesUsing: [] },
        tags: [],
        createdAt: now,
        updatedAt: now,
      };

      const upload = await paperStorageApi.uploadPaper(paper);
      if (!upload.success || !upload.data) {
        return { success: false, error: upload.error || 'Failed to save paper' };
      }
      paper.id = upload.data.storagePath.split('/')[1] || '';
      paper.storagePath = upload.data.storagePath;

      // Record usage on selected questions.
      const batch = writeBatch(db);
      for (const qid of selected.map((q) => q.id)) {
        batch.update(doc(db, META_COLLECTION, qid), {
          usageCount: increment(1),
        });
      }
      await batch.commit();

      return {
        success: true,
        data: {
          paper,
          warnings: selected.length < (config.totalQuestions || config.totalMarks)
            ? [`Only ${selected.length} approved questions were available.`]
            : [],
          excludedTopics: [],
          usedQuestionIds: selected.map((q) => q.id),
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async generateFromTemplate(
    templateId: string,
    title: string,
    description: string,
    createdBy: CreatedBy,
    visibility: 'public' | 'college_only' | 'shared_with',
    sharedWith?: string[],
  ): Promise<ApiResponse<PaperGenerationResult>> {
    try {
      const templateSnap = await getDoc(doc(db, TEMPLATES_COLLECTION, templateId));
      if (!templateSnap.exists()) return { success: false, error: 'Template not found' };
      const t = templateSnap.data() as PaperTemplate;
      const config: PaperGenerationConfig = {
        templateId,
        title: title || t.name,
        description: description || t.description || '',
        subjectId: t.subjectId,
        topicIds: Object.keys(t.topicDistribution || {}),
        totalQuestions: t.totalMarks,
        totalMarks: t.totalMarks,
        duration: t.duration,
        difficultyDistribution: t.difficultyDistribution,
        randomizeOrder: true,
        randomizeOptions: true,
        visibility,
        sharedWith,
      };
      return this.generate(config, createdBy);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

export const paperPreviewApi = {
  async getPaperWithContent(paperId: string): Promise<ApiResponse<{
    paper: Paper;
    questions: Array<{ questionId: string; order: number; marks: number; content: QuestionContent }>;
  }>> {
    try {
      const paper = await readPaper(paperId);
      if (!paper) return { success: false, error: 'Paper not found' };

      const questions: Array<{ questionId: string; order: number; marks: number; content: QuestionContent }> = [];
      for (const ref of paper.questions || []) {
        const res = await questionStorageApi.downloadQuestion(ref.questionId);
        if (res.success && res.data) {
          questions.push({ questionId: ref.questionId, order: ref.order, marks: ref.marks, content: res.data });
        }
      }
      return { success: true, data: { paper, questions } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getStudentPaper(paperId: string): Promise<ApiResponse<{
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    questions: Array<{
      order: number;
      marks: number;
      questionText: string;
      options: Array<{ id: string; text: string }>;
      hasImage: boolean;
      imageUrl?: string;
    }>;
  }>> {
    const preview = await this.getPaperWithContent(paperId);
    if (!preview.success || !preview.data) return { success: false, error: preview.error || 'Paper not found' };

    return {
      success: true,
      data: {
        paperId,
        title: preview.data.paper.title,
        duration: preview.data.paper.duration,
        totalMarks: preview.data.paper.totalMarks,
        questions: preview.data.questions.map((q) => ({
          order: q.order,
          marks: q.marks,
          questionText: q.content.questionText,
          options: q.content.options.map((o) => ({ id: o.id, text: o.text })),
          hasImage: q.content.hasImage,
          imageUrl: q.content.images?.[0]?.url,
        })),
      },
    };
  },
};
