// functions/src/validation/aiGenerateSchema.ts
import { z } from 'zod';

export const aiGenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  subject: z.string().min(1, 'Subject is required'),
  chapter: z.string().optional(),
  unit: z.string().optional(),
  // Allow both old and new question type names for compatibility
  questionType: z.enum([
    'mcq', 'mcq_single', 'mcq_multiple',
    'short', 'short_answer',
    'long', 'long_answer',
    'numerical', 'true_false',
    'fill_in_blank', 'matching', 'match_following'
  ]),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(50).optional(),
  numQuestions: z.number().int().min(1).max(50).optional(),
  marks: z.number().int().min(1).max(100).optional().default(1),
  batch: z.string().optional(),
  branch: z.string().optional(),
  course: z.string().optional(),
  courseName: z.string().optional(),
  courseCode: z.string().optional(),
  courseId: z.string().optional(),
  curriculumId: z.string().optional(),
  moduleId: z.string().optional(),
  moduleName: z.string().optional(),
  moduleNo: z.number().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  provider: z.enum(['gemini', 'openai', 'deepseek']).optional(),
  collegeId: z.string().optional(),
  includeExplanation: z.boolean().optional(),
  learningOutcomes: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
}).passthrough(); // Allow extra fields without failing

// Allow either 'count' or 'numQuestions'
export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;