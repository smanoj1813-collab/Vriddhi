// Quarantined: do not call LLM providers from the browser.
// Production generation uses functions/src/routes/ai-questions.ts via aiQuestionApi.

import type { AIQuestionConfig, AIGenerationResult } from '../types/aiQuestion'

export async function generateQuestions(_config: AIQuestionConfig): Promise<AIGenerationResult> {
  throw new Error(
    'Client-side LLM generation is disabled. Call generateQuestionsWithAI in aiQuestionApi (Functions API).'
  )
}

export type { AIQuestionConfig, AIGenerationResult }
