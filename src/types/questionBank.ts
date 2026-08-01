export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  options?: Array<{ id?: string; text?: string } | string>;
  answer?: string;
  marks?: number;
}

export type QuestionType = "mcq" | "truefalse" | "shortanswer" | "essay";
export type DifficultyLevel = "easy" | "medium" | "hard";

export interface Paper {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  duration: number;
  sections: PaperSection[];
  instructions?: string | string[];
  negativeMarking?: boolean;
  passingPercentage?: number;
}

export interface PaperSection {
  name?: string;
  title?: string;
  numQuestions?: number;
  marksPerQuestion?: number;
  instructions?: string;
  questions: Question[];
}