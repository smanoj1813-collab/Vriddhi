// functions/src/validation/index.ts
export {
  questionSchema,
  bulkQuestionsSchema,
  aiGenerateSchema,        // ← This should come from questionSchema.ts
  questionFilterSchema,
  questionOptionSchema,
} from './questionSchema';

export { validateRequest, validateQuery } from './validateRequest';