// src/types/aiQuestion.ts
// Unified AI Question Types — SINGLE SOURCE OF TRUTH for all AI features

import type { QuestionType, DifficultyLevel, GeneratedQuestion } from '../../admin/types/questionBank';

// Re-export GeneratedQuestion for convenience
export type { GeneratedQuestion };

// ═══════════════════════════════════════════════════════════════════════
// LLM Provider Types
// ═══════════════════════════════════════════════════════════════════════

export type LLMProvider = 'gemini' | 'openai' | 'anthropic' | 'claude' | 'azure' | 'cohere';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// AI Question Configuration (used by services + components + API)
// ═══════════════════════════════════════════════════════════════════════

export interface AIQuestionConfig {
  // Core fields (used by UI + API)
  topic: string;
  subject: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  count: number;
  marks?: number;
  chapter?: string;
  unit?: string;
  tags?: string[];
  language?: string;
  includeExplanation?: boolean;
  batch?: string;
  branch?: string;

  // Extended fields (used by llmProviders, llmService, promptBuilder)
  numQuestions?: number;      // alias for count, used by services
  temperature?: number;       // LLM temperature (0.0 - 1.0)
  provider?: LLMProvider;     // Which LLM to use
  course?: string;            // Course name
  semester?: string;          // Semester identifier
}

// ═══════════════════════════════════════════════════════════════════════
// AI Generation Result
// ═══════════════════════════════════════════════════════════════════════

export interface AIGenerationResult {
  questions: GeneratedQuestion[];
  generatedCount: number;
  tokensUsed?: number;
  warnings?: string[];
  provider?: LLMProvider;
  model?: string;
  // Extended fields returned by llmService
  rawResponse?: string;
  costEstimate?: number;
  generationTime?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// Save Payload & Result (used by API layer)
// ═══════════════════════════════════════════════════════════════════════

export interface SaveGeneratedQuestionsPayload {
  questions: GeneratedQuestion[];
  collegeId: string;
  createdBy: string;
  createdByName: string;
  batch?: string;
  branch?: string;
}

export interface SaveGeneratedQuestionsResult {
  savedCount: number;
  savedIds: string[];
  failed: { question: GeneratedQuestion; error: string }[];
}

// ═══════════════════════════════════════════════════════════════════════
// Prompt Builder Types
// ═══════════════════════════════════════════════════════════════════════

export interface PromptContext {
  subject: string;
  topic: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  count: number;
  marks?: number;
  chapter?: string;
  unit?: string;
  course?: string;
  branch?: string;
  semester?: string;
  language?: string;
  includeExplanation?: boolean;
  tags?: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// Legacy aliases for backward compatibility
// ═══════════════════════════════════════════════════════════════════════

export type AIQuestionResponse = AIGenerationResult;