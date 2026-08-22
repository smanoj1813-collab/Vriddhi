// src/modules/faculty/services/questionBankAPI.ts
// Faculty-facing question bank API backed by the real Firestore repository.

import type { QuestionType } from '../../admin/types/questionBank';
import {
  createQuestion as createCollegeQuestion,
  bulkImportQuestions as bulkImportCollegeQuestions,
  linkQuestionToPaper,
  unlinkQuestionFromPaper,
  getQuestions,
  getLinkedPapers,
} from '../../admin/api/questionBankApi';
import { getPapers } from '../../admin/services/paperAPI';

export interface CreateQuestionData {
  question: string;
  type: QuestionType;
  subject: string;
  topic: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string | string[];
  explanation?: string;
  facultyId: string;
  collegeId?: string;
}

export const createQuestionApi = (data: CreateQuestionData) => {
  if (!data.collegeId) throw new Error('collegeId is required to create a question');
  return createCollegeQuestion(data.collegeId, {
    ...data,
    text: data.question,
    unit: '',
    chapter: data.topic,
    tags: [],
    status: 'active',
    createdBy: data.facultyId,
    createdByName: data.facultyId,
  } as any);
};

export const createQuestion = createQuestionApi;

export const bulkImportQuestionsApi = async (collegeId: string, questions: any[]) => {
  return bulkImportCollegeQuestions(collegeId, questions);
};

export const bulkImportFacultyQuestions = async (collegeId: string, questions: any[]) => {
  return bulkImportCollegeQuestions(collegeId, questions);
};

export const linkQuestionToPaperApi = linkQuestionToPaper;
export const unlinkQuestionFromPaperApi = unlinkQuestionFromPaper;

export const getQuestionsByFacultyApi = async (collegeId: string, facultyId: string) => {
  const result = await getQuestions(collegeId, { createdBy: facultyId }, 200);
  return result.data;
};

export const getPapersByFaculty = async (collegeId: string) => {
  return getPapers(collegeId);
};

export const getLinkedPapersApi = getLinkedPapers;

export default {
  createQuestion: createQuestionApi,
  bulkImportQuestions: bulkImportQuestionsApi,
  linkQuestionToPaper: linkQuestionToPaperApi,
  unlinkQuestionFromPaper: unlinkQuestionFromPaperApi,
  getQuestionsByFaculty: getQuestionsByFacultyApi,
  getPapersByFaculty,
  getLinkedPapers: getLinkedPapersApi,
};
