// functions/src/validation/aiGenerateSchema.ts
import { z } from 'zod';

export const aiGenerateSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  subject: z.string().min(1, 'Subject is required'),
  chapter: z.string().optional(),
  unit: z.string().optional(),
  questionType: z.enum(['mcq', 'short', 'long', 'numerical', 'true_false']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().int().min(1).max(50).optional(),
  numQuestions: z.number().int().min(1).max(50).optional(),
  marks: z.number().int().min(1).max(100),
  batch: z.string().optional(),
  branch: z.string().optional(),
  course: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  provider: z.enum(['gemini', 'openai', 'deepseek']).optional(),
  collegeId: z.string().optional(),
});

// Allow either 'count' or 'numQuestions'
export type AIGenerateInput = z.infer<typeof aiGenerateSchema>;