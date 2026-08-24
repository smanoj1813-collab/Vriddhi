// ============================================================
// VRIDDHI - Paper Generator API
// ============================================================
// Auto-generates papers from templates or custom configs
// Uses Firestore metadata for selection, fetches content from Storage
// ============================================================

import {
  questionMetadataApi,
  paperApi,
  paperTemplateApi,
} from './questionBankApi';
import {
  questionStorageApi,
  paperStorageApi,
} from './cloudStorageApi';
import {
  type PaperGenerationConfig,
  type PaperGenerationResult,
  type Paper,
  type PaperQuestionRef,
  type QuestionMetadata,
  type QuestionContent,
  type DifficultyCount,
  type CreatedBy,
  type ApiResponse,
  DEFAULTS,
} from '../../admin/types/universalQuestionBank';

// ============================================================
// PAPER GENERATOR
// ============================================================

export const paperGeneratorApi = {
  /**
   * Generate a paper from configuration
   * Main entry point for auto-paper creation
   */
  async generate(
    config: PaperGenerationConfig,
    createdBy: CreatedBy
  ): Promise<ApiResponse<PaperGenerationResult>> {
    try {
      const warnings: string[] = [];
      const usedQuestionIds: string[] = [];
      const excludedSet = new Set(config.excludeQuestionIds || []);
      const includedSet = new Set(config.includeQuestionIds || []);

      // Step 1: Calculate how many questions per topic per difficulty
      const distribution = this.calculateDistribution(config);

      // Step 2: Select questions from each topic/difficulty combo
      const selectedQuestions: PaperQuestionRef[] = [];
      let currentOrder = 1;

      for (const [topicId, diffCounts] of Object.entries(distribution)) {
        for (const [difficulty, count] of Object.entries(diffCounts)) {
          if (count <= 0) continue;

          const questionRes = await questionMetadataApi.getRandomQuestionIds(
            topicId,
            difficulty,
            count,
            [...excludedSet, ...usedQuestionIds]
          );

          if (!questionRes.success || !questionRes.data) {
            warnings.push(`Failed to fetch ${difficulty} questions for topic ${topicId}`);
            continue;
          }

          const ids = questionRes.data;

          if (ids.length < count) {
            warnings.push(
              `Topic ${topicId} ${difficulty}: requested ${count}, found ${ids.length}`
            );
          }

          for (const id of ids) {
            // Get metadata to determine marks
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

      // Step 3: Add force-included questions if not already selected
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

      // Step 4: Randomize order if requested
      if (config.randomizeOrder) {
        const shuffled = [...selectedQuestions].sort(() => Math.random() - 0.5);
        shuffled.forEach((q, i) => { q.order = i + 1; });
      }

      // Step 5: Calculate actual difficulty distribution
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

      // Step 6: Create paper object
      const totalMarks = selectedQuestions.reduce((sum, q) => sum + q.marks, 0);

      const paper: Paper = {
        id: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        storagePath: '', // Will be set after upload
        usageStats: {
          timesUsed: 0,
          collegesUsing: [],
        },
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Step 7: Upload to Cloud Storage
      const uploadRes = await paperStorageApi.uploadPaper(paper);
      if (uploadRes.success && uploadRes.data) {
        paper.storagePath = uploadRes.data.storagePath;
      }

      // Step 8: Save metadata to Firestore
      const metaRes = await paperApi.create(paper);
      if (metaRes.success && metaRes.data) {
        paper.id = metaRes.data.id;
      }

      // Step 9: Update question usage stats
      for (const qId of usedQuestionIds) {
        await questionMetadataApi.incrementUsage(qId, createdBy.collegeId || 'system');
      }

      // Step 10: Update template usage if applicable
      if (config.templateId) {
        await paperTemplateApi.incrementUsage(config.templateId);
      }

      const result: PaperGenerationResult = {
        paper,
        warnings,
        excludedTopics: config.topicIds.filter(
          tid => !topicDistribution[tid] || topicDistribution[tid] === 0
        ),
        usedQuestionIds,
      };

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Generate paper from a template
   */
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

      // Calculate total questions and marks from template
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

  /**
   * Calculate how many questions to pick from each topic/difficulty
   */
  calculateDistribution(config: PaperGenerationConfig): Record<string, DifficultyCount> {
    const distribution: Record<string, DifficultyCount> = {};

    // Initialize
    for (const topicId of config.topicIds) {
      distribution[topicId] = { easy: 0, medium: 0, hard: 0 };
    }

    const totalTopics = config.topicIds.length;
    if (totalTopics === 0) return distribution;

    // Distribute questions across topics proportionally
    const totalQuestions = config.totalQuestions;
    const questionsPerTopic = Math.floor(totalQuestions / totalTopics);
    let remainder = totalQuestions % totalTopics;

    // Get difficulty ratios
    const diffTotal = config.difficultyDistribution.easy +
      config.difficultyDistribution.medium +
      config.difficultyDistribution.hard;

    const easyRatio = config.difficultyDistribution.easy / diffTotal;
    const mediumRatio = config.difficultyDistribution.medium / diffTotal;
    const hardRatio = config.difficultyDistribution.hard / diffTotal;

    for (let i = 0; i < totalTopics; i++) {
      const topicId = config.topicIds[i];
      let topicQuestions = questionsPerTopic;

      // Add remainder to first topics
      if (remainder > 0) {
        topicQuestions++;
        remainder--;
      }

      distribution[topicId] = {
        easy: Math.round(topicQuestions * easyRatio),
        medium: Math.round(topicQuestions * mediumRatio),
        hard: Math.round(topicQuestions * hardRatio),
      };

      // Adjust for rounding errors
      const topicTotal = distribution[topicId].easy +
        distribution[topicId].medium +
        distribution[topicId].hard;

      if (topicTotal !== topicQuestions) {
        const diff = topicQuestions - topicTotal;
        distribution[topicId].medium += diff; // Adjust medium
      }
    }

    return distribution;
  },

  /**
   * Validate a paper configuration before generation
   */
  async validateConfig(config: PaperGenerationConfig): Promise<ApiResponse<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedQuestions: number;
  }>> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!config.title.trim()) errors.push('Title is required');
    if (!config.subjectId) errors.push('Subject is required');
    if (!config.topicIds || config.topicIds.length === 0) errors.push('At least one topic is required');
    if (config.totalQuestions <= 0) errors.push('Total questions must be greater than 0');
    if (config.duration <= 0) errors.push('Duration must be greater than 0');

    // Check difficulty distribution sums to reasonable value
    const diffTotal = config.difficultyDistribution.easy +
      config.difficultyDistribution.medium +
      config.difficultyDistribution.hard;

    if (diffTotal === 0) {
      errors.push('Difficulty distribution cannot be all zero');
    }

    // Check if topics have enough questions
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

    // Check excluded questions exist
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
  /**
   * Fetch full question content for a paper (for preview/printing)
   */
  async getPaperWithContent(paperId: string): Promise<ApiResponse<{
    paper: Paper;
    questions: { questionId: string; order: number; marks: number; content: QuestionContent }[];
  }>> {
    try {
      const paperRes = await paperApi.getById(paperId);
      if (!paperRes.success || !paperRes.data) {
        return { success: false, error: 'Paper not found' };
      }

      const paper = paperRes.data;
      const storagePaths = paper.questions.map((q: PaperQuestionRef) => {
        // We need to get metadata first to find storagePath
        return q.questionId;
      });

      // Get metadata for all questions
      const metaRes = await questionMetadataApi.getByIds(
        paper.questions.map((q: PaperQuestionRef) => q.questionId)
      );

      if (!metaRes.success || !metaRes.data) {
        return { success: false, error: 'Failed to load question metadata' };
      }

      const metadataMap = new Map(metaRes.data.map((m: QuestionMetadata) => [m.id, m]));

      // Fetch content from Cloud Storage
      const questionsWithContent: { questionId: string; order: number; marks: number; content: QuestionContent }[] = [];
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

  /**
   * Generate a student-facing version of the paper
   * (shuffled options, no correct answers)
   */
  async getStudentPaper(paperId: string): Promise<ApiResponse<{
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    questions: {
      order: number;
      marks: number;
      questionText: string;
      options: { id: string; text: string }[];
      hasImage: boolean;
      imageUrl?: string;
    }[];
  }>> {
    try {
      const fullRes = await this.getPaperWithContent(paperId);
      if (!fullRes.success || !fullRes.data) {
        return { success: false, error: fullRes.error };
      }

      const { paper, questions } = fullRes.data;

      const studentQuestions = questions.map((q) => {
        const content = q.content;

        // Shuffle options
        const shuffledOptions = [...content.options].sort(() => Math.random() - 0.5);

        return {
          order: q.order,
          marks: q.marks,
          questionText: content.questionText,
          options: shuffledOptions.map((opt) => ({ id: opt.id, text: opt.text })),
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
