// Stub for question bank API service
// Imported by: FacultyQuestionBank, PaperBuilder, etc.

export interface QuestionBankFilters {
  subject?: string;
  classId?: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  type?: string;
}

export interface QuestionBankItem {
  id: string;
  question: string;
  type: string;
  subject: string;
  topic: string;
  difficulty: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  createdBy: string;
  createdAt: Date;
}

export const questionBankAPI = {
  getQuestions: async (filters?: QuestionBankFilters): Promise<QuestionBankItem[]> => {
    return [];
  },
  getQuestionById: async (id: string): Promise<QuestionBankItem | null> => {
    return null;
  },
  createQuestion: async (
    data: Omit<QuestionBankItem, "id" | "createdAt">
  ): Promise<QuestionBankItem> => {
    return { ...data, id: "stub", createdAt: new Date() };
  },
  updateQuestion: async (id: string, data: Partial<QuestionBankItem>): Promise<QuestionBankItem> => {
    return {
      id,
      question: "",
      type: "mcq",
      subject: "",
      topic: "",
      difficulty: "easy",
      marks: 0,
      createdBy: "",
      createdAt: new Date(),
      ...data,
    };
  },
  deleteQuestion: async (id: string): Promise<void> => {},
  importQuestions: async (file: File): Promise<{ success: number; failed: number }> => {
    return { success: 0, failed: 0 };
  },
};

export default questionBankAPI;
