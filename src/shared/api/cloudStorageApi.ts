// ============================================================
// VRIDDHI - Cloud Storage API
// ============================================================

import { getStorage, ref, uploadString, uploadBytes, getDownloadURL, getBytes, deleteObject, listAll } from 'firebase/storage';
import app from '@/Firebase/config';

// ============================================================
// TYPES (self-contained — no external import dependency)
// ============================================================

type DifficultyLevel = 'easy' | 'medium' | 'hard';
type QuestionStatus = 'draft' | 'pending' | 'approved' | 'rejected';
type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'long_answer' | 'match' | 'assertion';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionImage {
  url: string;
  caption?: string;
}

interface QuestionContent {
  id: string;
  topicId: string;
  subjectId: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: DifficultyLevel;
  marks: number;
  type: QuestionType;
  tags: string[];
  hasImage: boolean;
  images?: QuestionImage[];
  status: QuestionStatus;
  createdAt: string;
  updatedAt: string;
}

interface CreatedBy {
  userId: string;
  name: string;
  collegeId?: string;
  role: string;
}

interface PaperQuestionRef {
  questionId: string;
  order: number;
  marks: number;
  isRequired: boolean;
}

interface Paper {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  topicIds: string[];
  questions: PaperQuestionRef[];
  totalQuestions: number;
  totalMarks: number;
  duration: number;
  difficultyDistribution: DifficultyCount;
  topicDistribution: Record<string, number>;
  createdBy: CreatedBy;
  visibility: 'public' | 'college_only' | 'shared_with';
  sharedWith: string[];
  isTemplate: boolean;
  parentTemplateId?: string;
  status: 'draft' | 'published' | 'archived';
  storagePath: string;
  usageStats: {
    timesUsed: number;
    collegesUsing: string[];
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaperTemplate {
  id: string;
  name: string;
  subjectId: string;
  topicDistribution: Record<string, DifficultyCount>;
  totalMarks: number;
  duration: number;
  description?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DifficultyCount {
  easy: number;
  medium: number;
  hard: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface BulkUploadResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string; data: unknown }>;
  createdQuestionIds: string[];
}

interface PaperGenerationConfig {
  templateId?: string;
  title: string;
  description?: string;
  subjectId: string;
  topicIds: string[];
  totalQuestions: number;
  totalMarks: number;
  duration: number;
  difficultyDistribution: DifficultyCount;
  randomizeOrder: boolean;
  randomizeOptions: boolean;
  visibility: 'public' | 'college_only' | 'shared_with';
  sharedWith?: string[];
  includeQuestionIds?: string[];
  excludeQuestionIds?: string[];
}

interface PaperGenerationResult {
  paper: Paper;
  warnings: string[];
  excludedTopics: string[];
  usedQuestionIds: string[];
}

interface QuestionMetadata {
  id: string;
  topicId: string;
  subjectId: string;
  difficulty: DifficultyLevel;
  marks: number;
  type: QuestionType;
  status: QuestionStatus;
  storagePath: string;
  createdBy: CreatedBy;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================
// STORAGE PATHS
// ============================================================

const STORAGE_PATHS = {
  questions: (subjectId: string, topicId: string, questionId: string) =>
    `questions/${subjectId}/${topicId}/${questionId}.json`,
  questionImage: (subjectId: string, topicId: string, questionId: string, filename: string) =>
    `images/questions/${subjectId}/${topicId}/${questionId}/${filename}`,
  paper: (collegeId: string | null, paperId: string) =>
    `papers/${collegeId || 'public'}/${paperId}.json`,
  template: (templateId: string) => `templates/${templateId}.json`,
  topicManifest: (subjectId: string, topicId: string) =>
    `manifests/topics/${subjectId}_${topicId}.json`,
  masterManifest: () => `manifests/master.json`,
  bulkExport: (filename: string) => `exports/${filename}.json`,
};

// ============================================================
// STUB APIs (replace with actual imports when paths are known)
// ============================================================

const questionMetadataApi = {
  async getRandomQuestionIds(
    topicId: string,
    difficulty: string,
    count: number,
    excludeIds: string[]
  ): Promise<ApiResponse<string[]>> {
    // TODO: Replace with actual implementation
    return { success: true, data: [] };
  },
  async getById(id: string): Promise<ApiResponse<QuestionMetadata>> {
    // TODO: Replace with actual implementation
    return { success: false, error: 'Not implemented' };
  },
  async getByIds(ids: string[]): Promise<ApiResponse<QuestionMetadata[]>> {
    // TODO: Replace with actual implementation
    return { success: true, data: [] };
  },
  async search(
    filters: Record<string, unknown>,
    pagination: { page: number; limit: number }
  ): Promise<ApiResponse<PaginatedResponse<QuestionMetadata>>> {
    // TODO: Replace with actual implementation
    return { success: true, data: { data: [], total: 0, page: 1, limit: 10, hasMore: false } };
  },
  async incrementUsage(questionId: string, collegeId: string): Promise<ApiResponse<void>> {
    // TODO: Replace with actual implementation
    return { success: true };
  },
};

const paperApi = {
  async create(paper: Paper): Promise<ApiResponse<{ id: string }>> {
    // TODO: Replace with actual implementation
    return { success: true, data: { id: paper.id } };
  },
  async getById(id: string): Promise<ApiResponse<Paper>> {
    // TODO: Replace with actual implementation
    return { success: false, error: 'Not implemented' };
  },
};

const paperTemplateApi = {
  async getById(id: string): Promise<ApiResponse<PaperTemplate>> {
    // TODO: Replace with actual implementation
    return { success: false, error: 'Not implemented' };
  },
  async incrementUsage(templateId: string): Promise<ApiResponse<void>> {
    // TODO: Replace with actual implementation
    return { success: true };
  },
};

const storage = getStorage(app);

// ============================================================
// QUESTION CONTENT OPERATIONS
// ============================================================

export const questionStorageApi = {
  async uploadQuestion(
    question: QuestionContent
  ): Promise<ApiResponse<{ storagePath: string; downloadUrl: string }>> {
    try {
      const path = STORAGE_PATHS.questions(
        question.subjectId,
        question.topicId,
        question.id
      );
      const storageRef = ref(storage, path);
      const jsonString = JSON.stringify(question, null, 2);

      await uploadString(storageRef, jsonString, 'raw', {
        contentType: 'application/json',
        customMetadata: {
          questionId: question.id,
          topicId: question.topicId,
          subjectId: question.subjectId,
          difficulty: question.difficulty,
          status: question.status,
        },
      });

      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        data: { storagePath: path, downloadUrl },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async downloadQuestion(
    storagePath: string
  ): Promise<ApiResponse<QuestionContent>> {
    try {
      const storageRef = ref(storage, storagePath);
      const bytes = await getBytes(storageRef);
      const jsonString = new TextDecoder().decode(bytes);
      const question = JSON.parse(jsonString) as QuestionContent;

      return { success: true, data: question };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async downloadQuestions(
    storagePaths: string[]
  ): Promise<ApiResponse<QuestionContent[]>> {
    try {
      const questions: QuestionContent[] = [];
      const errors: string[] = [];

      const batchSize = 10;
      for (let i = 0; i < storagePaths.length; i += batchSize) {
        const batch = storagePaths.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(path => this.downloadQuestion(path))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success && result.value.data) {
            questions.push(result.value.data);
          } else {
            errors.push(`Failed to load: ${batch[index]}`);
          }
        });
      }

      if (errors.length > 0 && questions.length === 0) {
        return { success: false, error: errors.join('; ') };
      }

      return { success: true, data: questions, message: errors.length > 0 ? `${errors.length} failed` : undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async uploadImage(
    subjectId: string,
    topicId: string,
    questionId: string,
    file: File | Blob,
    filename: string
  ): Promise<ApiResponse<{ storagePath: string; downloadUrl: string }>> {
    try {
      const path = STORAGE_PATHS.questionImage(subjectId, topicId, questionId, filename);
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/png',
        customMetadata: {
          questionId,
          topicId,
          subjectId,
        },
      });

      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        data: { storagePath: path, downloadUrl },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async deleteQuestion(
    subjectId: string,
    topicId: string,
    questionId: string
  ): Promise<ApiResponse<void>> {
    try {
      const path = STORAGE_PATHS.questions(subjectId, topicId, questionId);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async deleteQuestionWithImages(
    subjectId: string,
    topicId: string,
    questionId: string
  ): Promise<ApiResponse<void>> {
    try {
      const questionPath = STORAGE_PATHS.questions(subjectId, topicId, questionId);
      await deleteObject(ref(storage, questionPath));

      const imageFolderPath = `images/questions/${subjectId}/${topicId}/${questionId}`;
      const imageFolderRef = ref(storage, imageFolderPath);

      try {
        const listResult = await listAll(imageFolderRef);
        await Promise.all(listResult.items.map(item => deleteObject(item)));
      } catch {
        // Folder might not exist, ignore
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getQuestionUrl(storagePath: string): Promise<ApiResponse<string>> {
    try {
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      return { success: true, data: url };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

// ============================================================
// PAPER CONTENT OPERATIONS
// ============================================================

export const paperStorageApi = {
  async uploadPaper(
    paper: Paper
  ): Promise<ApiResponse<{ storagePath: string; downloadUrl: string }>> {
    try {
      const path = STORAGE_PATHS.paper(paper.createdBy.collegeId ?? null, paper.id);
      const storageRef = ref(storage, path);

      const jsonString = JSON.stringify(paper, null, 2);

      await uploadString(storageRef, jsonString, 'raw', {
        contentType: 'application/json',
        customMetadata: {
          paperId: paper.id,
          title: paper.title,
          subjectId: paper.subjectId,
          collegeId: paper.createdBy.collegeId || 'public',
        },
      });

      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        data: { storagePath: path, downloadUrl },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async downloadPaper(
    storagePath: string
  ): Promise<ApiResponse<Paper>> {
    try {
      const storageRef = ref(storage, storagePath);
      const bytes = await getBytes(storageRef);
      const jsonString = new TextDecoder().decode(bytes);
      const paper = JSON.parse(jsonString) as Paper;

      return { success: true, data: paper };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async uploadTemplate(
    template: PaperTemplate
  ): Promise<ApiResponse<{ storagePath: string; downloadUrl: string }>> {
    try {
      const path = STORAGE_PATHS.template(template.id);
      const storageRef = ref(storage, path);

      const jsonString = JSON.stringify(template, null, 2);

      await uploadString(storageRef, jsonString, 'raw', {
        contentType: 'application/json',
      });

      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        data: { storagePath: path, downloadUrl },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async downloadTemplate(
    templateId: string
  ): Promise<ApiResponse<PaperTemplate>> {
    try {
      const path = STORAGE_PATHS.template(templateId);
      const storageRef = ref(storage, path);
      const bytes = await getBytes(storageRef);
      const jsonString = new TextDecoder().decode(bytes);
      const template = JSON.parse(jsonString) as PaperTemplate;

      return { success: true, data: template };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async deletePaper(
    collegeId: string | null,
    paperId: string
  ): Promise<ApiResponse<void>> {
    try {
      const path = STORAGE_PATHS.paper(collegeId, paperId);
      await deleteObject(ref(storage, path));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

// ============================================================
// MANIFEST OPERATIONS
// ============================================================

export const manifestApi = {
  async generateTopicManifest(
    subjectId: string,
    topicId: string,
    questionIds: string[]
  ): Promise<ApiResponse<void>> {
    try {
      const manifest = {
        subjectId,
        topicId,
        questionIds,
        totalQuestions: questionIds.length,
        generatedAt: new Date().toISOString(),
      };

      const path = STORAGE_PATHS.topicManifest(subjectId, topicId);
      const storageRef = ref(storage, path);

      await uploadString(storageRef, JSON.stringify(manifest, null, 2), 'raw', {
        contentType: 'application/json',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getTopicManifest(
    subjectId: string,
    topicId: string
  ): Promise<ApiResponse<{ questionIds: string[]; totalQuestions: number }>> {
    try {
      const path = STORAGE_PATHS.topicManifest(subjectId, topicId);
      const storageRef = ref(storage, path);
      const bytes = await getBytes(storageRef);
      const manifest = JSON.parse(new TextDecoder().decode(bytes));

      return {
        success: true,
        data: {
          questionIds: manifest.questionIds,
          totalQuestions: manifest.totalQuestions,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async generateMasterManifest(
    subjects: { id: string; name: string; topics: { id: string; name: string; questionCount: number }[] }[]
  ): Promise<ApiResponse<void>> {
    try {
      const manifest = {
        subjects,
        totalSubjects: subjects.length,
        totalTopics: subjects.reduce((sum, s) => sum + s.topics.length, 0),
        generatedAt: new Date().toISOString(),
      };

      const path = STORAGE_PATHS.masterManifest();
      const storageRef = ref(storage, path);

      await uploadString(storageRef, JSON.stringify(manifest, null, 2), 'raw', {
        contentType: 'application/json',
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  async getMasterManifest(): Promise<ApiResponse<{
    subjects: { id: string; name: string; topics: { id: string; name: string; questionCount: number }[] }[];
    totalSubjects: number;
    totalTopics: number;
  }>> {
    try {
      const path = STORAGE_PATHS.masterManifest();
      const storageRef = ref(storage, path);
      const bytes = await getBytes(storageRef);
      const manifest = JSON.parse(new TextDecoder().decode(bytes));

      return { success: true, data: manifest };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

// ============================================================
// BULK OPERATIONS
// ============================================================

export const bulkStorageApi = {
  async bulkUploadQuestions(
    questions: QuestionContent[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<ApiResponse<BulkUploadResult>> {
    const result: BulkUploadResult = {
      success: true,
      totalProcessed: questions.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      createdQuestionIds: [],
    };

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      try {
        const uploadRes = await questionStorageApi.uploadQuestion(question);
        if (uploadRes.success) {
          result.successCount++;
          result.createdQuestionIds.push(question.id);
        } else {
          result.errorCount++;
          result.errors.push({
            row: i + 1,
            error: uploadRes.error || 'Upload failed',
            data: question,
          });
        }
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: i + 1,
          error: (error as Error).message,
          data: question,
        });
      }

      if (onProgress) {
        onProgress(i + 1, questions.length);
      }
    }

    result.success = result.errorCount === 0;
    return { success: result.success, data: result };
  },

  async exportQuestionsToFile(
    questions: QuestionContent[],
    filename: string
  ): Promise<ApiResponse<{ storagePath: string; downloadUrl: string }>> {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalQuestions: questions.length,
        questions,
      };

      const path = STORAGE_PATHS.bulkExport(filename);
      const storageRef = ref(storage, path);

      await uploadString(storageRef, JSON.stringify(exportData, null, 2), 'raw', {
        contentType: 'application/json',
      });

      const downloadUrl = await getDownloadURL(storageRef);

      return {
        success: true,
        data: { storagePath: path, downloadUrl },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

// ============================================================
// SYNC OPERATIONS
// ============================================================

export const syncApi = {
  async verifyIntegrity(
    metadataList: { id: string; storagePath: string; topicId: string; subjectId: string }[]
  ): Promise<ApiResponse<{
    valid: number;
    missing: { id: string; storagePath: string }[];
    orphaned: string[];
  }>> {
    try {
      const missing: { id: string; storagePath: string }[] = [];

      for (const meta of metadataList) {
        try {
          const storageRef = ref(storage, meta.storagePath);
          await getBytes(storageRef);
        } catch {
          missing.push({ id: meta.id, storagePath: meta.storagePath });
        }
      }

      return {
        success: true,
        data: {
          valid: metadataList.length - missing.length,
          missing,
          orphaned: [],
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};

// ============================================================
// PAPER GENERATOR API
// ============================================================

export const paperGeneratorApi = {
  async generate(
    config: PaperGenerationConfig,
    createdBy: CreatedBy
  ): Promise<ApiResponse<PaperGenerationResult>> {
    try {
      const warnings: string[] = [];
      const usedQuestionIds: string[] = [];
      const excludedSet = new Set<string>(config.excludeQuestionIds || []);

      const distribution = this.calculateDistribution(config);

      const selectedQuestions: Array<{
        questionId: string;
        order: number;
        marks: number;
        isRequired: boolean;
      }> = [];
      let currentOrder = 1;

      for (const [topicId, diffCounts] of Object.entries(distribution)) {
        for (const [difficulty, count] of Object.entries(diffCounts)) {
          const countNum = count as number;
          if (countNum <= 0) continue;

          const questionRes = await questionMetadataApi.getRandomQuestionIds(
            topicId,
            difficulty,
            countNum,
            [...excludedSet, ...usedQuestionIds]
          );

          if (!questionRes.success || !questionRes.data) {
            warnings.push(`Failed to fetch ${difficulty} questions for topic ${topicId}`);
            continue;
          }

          const ids = questionRes.data;

          if (ids.length < countNum) {
            warnings.push(
              `Topic ${topicId} ${difficulty}: requested ${countNum}, found ${ids.length}`
            );
          }

          for (const id of ids) {
            const metaRes = await questionMetadataApi.getById(id);
            const marks = metaRes.success && metaRes.data ? metaRes.data.marks : 1;

            selectedQuestions.push({
              questionId: id,
              order: currentOrder++,
              marks,
              isRequired: true,
            });

            usedQuestionIds.push(id);
            excludedSet.add(id);
          }
        }
      }

      for (const id of config.includeQuestionIds || []) {
        if (!usedQuestionIds.includes(id)) {
          const metaRes = await questionMetadataApi.getById(id);
          const marks = metaRes.success && metaRes.data ? metaRes.data.marks : 1;

          selectedQuestions.push({
            questionId: id,
            order: currentOrder++,
            marks,
            isRequired: true,
          });
          usedQuestionIds.push(id);
        }
      }

      if (config.randomizeOrder) {
        const shuffled = [...selectedQuestions].sort(() => Math.random() - 0.5);
        shuffled.forEach((q, i) => { q.order = i + 1; });
      }

      const actualDistribution: DifficultyCount = { easy: 0, medium: 0, hard: 0 };
      const topicDistribution: Record<string, number> = {};

      for (const qRef of selectedQuestions) {
        const metaRes = await questionMetadataApi.getById(qRef.questionId);
        if (metaRes.success && metaRes.data) {
          const diff = metaRes.data.difficulty as keyof DifficultyCount;
          actualDistribution[diff] = (actualDistribution[diff] || 0) + 1;
          topicDistribution[metaRes.data.topicId] = (topicDistribution[metaRes.data.topicId] || 0) + 1;
        }
      }

      const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

      const paper: Paper = {
        id: `paper_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: config.title,
        description: config.description,
        subjectId: config.subjectId,
        topicIds: config.topicIds,
        questions: selectedQuestions,
        totalQuestions: selectedQuestions.length,
        totalMarks,
        duration: config.duration,
        difficultyDistribution: actualDistribution,
        topicDistribution,
        createdBy,
        visibility: config.visibility,
        sharedWith: config.sharedWith || [],
        isTemplate: false,
        parentTemplateId: config.templateId,
        status: 'draft',
        storagePath: '',
        usageStats: {
          timesUsed: 0,
          collegesUsing: [],
        },
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const uploadRes = await paperStorageApi.uploadPaper(paper);
      if (uploadRes.success && uploadRes.data) {
        paper.storagePath = uploadRes.data.storagePath;
      }

      const metaRes = await paperApi.create(paper);
      if (metaRes.success && metaRes.data) {
        paper.id = metaRes.data.id;
      }

      for (const qId of usedQuestionIds) {
        await questionMetadataApi.incrementUsage(qId, createdBy.collegeId || 'system');
      }

      if (config.templateId) {
        await paperTemplateApi.incrementUsage(config.templateId);
      }

      const result: PaperGenerationResult = {
        paper,
        warnings,
        excludedTopics: config.topicIds.filter(
          (tid: string) => !topicDistribution[tid] || topicDistribution[tid] === 0
        ),
        usedQuestionIds,
      };

      return { success: true, data: result };
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
    sharedWith?: string[]
  ): Promise<ApiResponse<PaperGenerationResult>> {
    try {
      const templateRes = await paperTemplateApi.getById(templateId);
      if (!templateRes.success || !templateRes.data) {
        return { success: false, error: 'Template not found' };
      }

      const template = templateRes.data;
      const topicIds = Object.keys(template.topicDistribution);

      let totalQuestions = 0;
      const difficultyDistribution: DifficultyCount = { easy: 0, medium: 0, hard: 0 };

      for (const topicDist of Object.values(template.topicDistribution) as Array<DifficultyCount>) {
        totalQuestions += topicDist.easy + topicDist.medium + topicDist.hard;
        difficultyDistribution.easy += topicDist.easy;
        difficultyDistribution.medium += topicDist.medium;
        difficultyDistribution.hard += topicDist.hard;
      }

      const config: PaperGenerationConfig = {
        templateId,
        title,
        description,
        subjectId: template.subjectId,
        topicIds,
        totalQuestions,
        totalMarks: template.totalMarks,
        duration: template.duration,
        difficultyDistribution,
        randomizeOrder: true,
        randomizeOptions: true,
        visibility,
        sharedWith,
      };

      return await this.generate(config, createdBy);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  calculateDistribution(config: PaperGenerationConfig): Record<string, DifficultyCount> {
    const distribution: Record<string, DifficultyCount> = {};

    for (const topicId of config.topicIds) {
      distribution[topicId] = { easy: 0, medium: 0, hard: 0 };
    }

    const totalTopics = config.topicIds.length;
    if (totalTopics === 0) return distribution;

    const totalQuestions = config.totalQuestions;
    const questionsPerTopic = Math.floor(totalQuestions / totalTopics);
    let remainder = totalQuestions % totalTopics;

    const diffTotal = config.difficultyDistribution.easy +
      config.difficultyDistribution.medium +
      config.difficultyDistribution.hard;

    const easyRatio = config.difficultyDistribution.easy / diffTotal;
    const mediumRatio = config.difficultyDistribution.medium / diffTotal;
    const hardRatio = config.difficultyDistribution.hard / diffTotal;

    for (let i = 0; i < totalTopics; i++) {
      const topicId = config.topicIds[i];
      let topicQuestions = questionsPerTopic;

      if (remainder > 0) {
        topicQuestions++;
        remainder--;
      }

      distribution[topicId] = {
        easy: Math.round(topicQuestions * easyRatio),
        medium: Math.round(topicQuestions * mediumRatio),
        hard: Math.round(topicQuestions * hardRatio),
      };

      const topicTotal = distribution[topicId].easy +
        distribution[topicId].medium +
        distribution[topicId].hard;

      if (topicTotal !== topicQuestions) {
        const diff = topicQuestions - topicTotal;
        distribution[topicId].medium += diff;
      }
    }

    return distribution;
  },

  async validateConfig(config: PaperGenerationConfig): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedQuestions: number;
  }>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.title.trim()) errors.push('Title is required');
    if (!config.subjectId) errors.push('Subject is required');
    if (!config.topicIds || config.topicIds.length === 0) errors.push('At least one topic is required');
    if (config.totalQuestions <= 0) errors.push('Total questions must be greater than 0');
    if (config.duration <= 0) errors.push('Duration must be greater than 0');

    const diffTotal = config.difficultyDistribution.easy +
      config.difficultyDistribution.medium +
      config.difficultyDistribution.hard;

    if (diffTotal === 0) {
      errors.push('Difficulty distribution cannot be all zero');
    }

    let estimatedQuestions = 0;
    for (const topicId of config.topicIds) {
      const topicRes = await questionMetadataApi.search(
        { topicId, status: 'approved' },
        { page: 1, limit: 1 }
      );

      if (!topicRes.success || !topicRes.data) {
        warnings.push(`Could not check question availability for topic ${topicId}`);
        continue;
      }

      const available = topicRes.data.total;
      const requested = Math.ceil(config.totalQuestions / config.topicIds.length);

      if (available < requested) {
        warnings.push(
          `Topic ${topicId}: only ${available} questions available, ${requested} requested`
        );
      }

      estimatedQuestions += available;
    }

    if (config.excludeQuestionIds && config.excludeQuestionIds.length > 0) {
      const excludeRes = await questionMetadataApi.getByIds(config.excludeQuestionIds);
      if (excludeRes.success && excludeRes.data) {
        const foundIds = new Set(excludeRes.data.map((q: QuestionMetadata) => q.id));
        const notFound = config.excludeQuestionIds.filter((id: string) => !foundIds.has(id));
        if (notFound.length > 0) {
          warnings.push(`Excluded questions not found: ${notFound.join(', ')}`);
        }
      }
    }

    return {
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings,
        estimatedQuestions,
      },
    };
  },
};

// ============================================================
// PAPER PREVIEW / RENDER
// ============================================================

export const paperPreviewApi = {
  async getPaperWithContent(paperId: string): Promise<ApiResponse<{
    paper: Paper;
    questions: Array<{
      questionId: string;
      order: number;
      marks: number;
      content: QuestionContent;
    }>;
  }>> {
    try {
      const paperRes = await paperApi.getById(paperId);
      if (!paperRes.success || !paperRes.data) {
        return { success: false, error: 'Paper not found' };
      }

      const paper = paperRes.data;

      const metaRes = await questionMetadataApi.getByIds(
        paper.questions.map((q: PaperQuestionRef) => q.questionId)
      );

      if (!metaRes.success || !metaRes.data) {
        return { success: false, error: 'Failed to load question metadata' };
      }

      const metadataMap = new Map(metaRes.data.map((m: QuestionMetadata) => [m.id, m]));

      const questionsWithContent: Array<{
        questionId: string;
        order: number;
        marks: number;
        content: QuestionContent;
      }> = [];

      for (const qRef of paper.questions) {
        const meta = metadataMap.get(qRef.questionId);
        if (!meta) continue;

        const contentRes = await questionStorageApi.downloadQuestion(meta.storagePath);
        if (contentRes.success && contentRes.data) {
          questionsWithContent.push({
            questionId: qRef.questionId,
            order: qRef.order,
            marks: qRef.marks,
            content: contentRes.data,
          });
        }
      }

      return {
        success: true,
        data: {
          paper,
          questions: questionsWithContent,
        },
      };
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
    try {
      const fullRes = await this.getPaperWithContent(paperId);
      if (!fullRes.success || !fullRes.data) {
        return { success: false, error: fullRes.error };
      }

      const { paper, questions } = fullRes.data;

      const studentQuestions = questions.map((q: {
        questionId: string;
        order: number;
        marks: number;
        content: QuestionContent;
      }) => {
        const content = q.content;

        const shuffledOptions = [...content.options].sort(() => Math.random() - 0.5);

        return {
          order: q.order,
          marks: q.marks,
          questionText: content.questionText,
          options: shuffledOptions.map((opt: QuestionOption) => ({ id: opt.id, text: opt.text })),
          hasImage: content.hasImage,
          imageUrl: content.images && content.images.length > 0 ? content.images[0].url : undefined,
        };
      });

      return {
        success: true,
        data: {
          paperId: paper.id,
          title: paper.title,
          duration: paper.duration,
          totalMarks: paper.totalMarks,
          questions: studentQuestions,
        },
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },
};
