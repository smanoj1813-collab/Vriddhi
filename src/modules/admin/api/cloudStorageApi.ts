// src/modules/admin/api/cloudStorageApi.ts
import type { ApiResponse, QuestionContent, Paper } from '../types/universalQuestionBank';

export const questionStorageApi = {
  async downloadQuestion(storagePath: string): Promise<ApiResponse<QuestionContent>> {
    console.warn('[STUB] downloadQuestion not implemented for path:', storagePath);
    return { success: false, error: 'Not implemented' };
  },
};

export const paperStorageApi = {
  async uploadPaper(paper: Paper): Promise<ApiResponse<{ storagePath: string }>> {
    console.warn('[STUB] uploadPaper not implemented');
    return {
      success: true,
      data: { storagePath: `papers/${paper.id}.json` },
    };
  },
};
export const paperGeneratorApi = {
  async validateConfig(config: unknown): Promise<ApiResponse<{ isValid: boolean; errors: string[] }>> {
    return { success: true, data: { isValid: true, errors: [] } };
  },
  async generate(config: unknown, createdBy: unknown): Promise<ApiResponse<unknown>> {
    return { success: false, error: 'Not implemented' };
  },
  async generateFromTemplate(...args: unknown[]): Promise<ApiResponse<unknown>> {
    return { success: false, error: 'Not implemented' };
  },
};

export const paperPreviewApi = {
  async getPaperWithContent(paperId: string): Promise<ApiResponse<unknown>> {
    return { success: false, error: 'Not implemented' };
  },
  async getStudentPaper(paperId: string): Promise<ApiResponse<unknown>> {
    return { success: false, error: 'Not implemented' };
  },
};
