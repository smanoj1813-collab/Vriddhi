// functions/src/validation/questionSchema.ts
import { z } from 'zod';

const questionOptionSchema = z.object({
  label: z.string().min(1).max(5),
  text: z.string().min(1).max(500),
});

const questionSchema = z.object({
  text: z.string().min(5).max(2000),
  options: z.array(questionOptionSchema).min(2).max(6).optional(),
  correctAnswer: z.string().min(1).max(500).optional(),
  explanation: z.string().min(1).max(3000).optional(),
  marks: z.number().min(0.5).max(100).default(1),
  topic: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(50)).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionType: z.enum(['mcq', 'subjective', 'true_false', 'fill_blank']).default('mcq'),
  subject: z.string().min(1).max(200),
  course: z.string().min(1).max(200).optional(),
  branch: z.string().min(1).max(200).optional(),
  collegeId: z.string().min(1).optional(),
  createdBy: z.string().min(1).optional(),
});

const bulkQuestionsSchema = z.object({
  questions: z.array(questionSchema).min(1).max(100),
  collegeId: z.string().min(1).optional(),
});

// ─── UNIFIED AI GENERATE SCHEMA ───
// Accepts ALL frontend question types + legacy backend aliases
const aiGenerateSchema = z.object({
  provider: z.enum(['gemini', 'openai', 'deepseek']).default('gemini'),
  count: z.number().int().min(1).max(50).optional(),
  numQuestions: z.number().int().min(1).max(50).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionType: z.enum([
    'mcq',
    'short_answer',
    'long_answer',
    'true_false',
    'fill_in_blank',
    'matching',
    'assertion_reason',
    'case_based',
    // Legacy/backend aliases
    'subjective',
    'fill_blank',
    'short',
    'long',
    'numerical',
  ]).default('mcq'),
  course: z.string().min(1).max(200).optional(),
  branch: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200),
  topic: z.string().min(1).max(200),
  marks: z.number().min(0.5).max(100).default(1),
  language: z.string().min(1).max(50).default('english'),
  chapter: z.string().optional(),
  unit: z.string().optional(),
  tags: z.array(z.string()).optional(),
  batch: z.string().optional(),
  collegeId: z.string().min(1).optional(),
  includeExplanation: z.boolean().optional(),
}).refine(
  (data) => data.count !== undefined || data.numQuestions !== undefined,
  { message: 'Either count or numQuestions is required', path: ['count'] }
);

const questionFilterSchema = z.object({
  collegeId: z.string().optional(),
  subject: z.string().optional(),
  type: z.string().optional(),
  difficulty: z.string().optional(),
  topic: z.string().optional(),
  createdBy: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('50'),
  offset: z.string().transform(Number).pipe(z.number().min(0)).default('0'),
});

export {
  questionSchema,
  bulkQuestionsSchema,
  aiGenerateSchema,
  questionFilterSchema,
  questionOptionSchema,
};

export type QuestionInput = z.infer<typeof questionSchema>;
export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;