export interface PaperSection {
  id: string;
  name: string;
  description: string;
  marksPerQuestion: number;
  numQuestions: number;
  compulsory: boolean;
  questionType: 'any' | 'mcq' | 'short' | 'long' | 'numerical';
}

export interface PaperConfig {
  title: string;
  subject: string;
  examType: 'midterm' | 'endterm' | 'quiz' | 'sessional' | 'practical';
  totalMarks: number;
  duration: number;
  batch: string;
  branch: string;
  date: string;
  instructions: string[];
  sections: PaperSection[];
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  examType: string;
  totalMarks: number;
  duration: number;
  batch: string;
  branch: string;
  date: string;
  instructions: string[];
  sections: PaperSection[];

  collegeId: string;
  createdBy: string;
  createdByName: string;
  questionIds: string[];
  totalQuestions: number;
  status: 'draft' | 'published' | 'archived';
  isTemplate: boolean;

  createdAt: string;
  updatedAt: string;
}