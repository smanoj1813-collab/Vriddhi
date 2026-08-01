// src/services/llmService.ts
// Main LLM service orchestrator — fixed for type safety

import type { AIQuestionConfig, AIGenerationResult, GeneratedQuestion, LLMProvider } from '../types/aiQuestion'
import { callOpenAI, callClaude, callGemini, callAzureOpenAI, callCohere } from './llmProviders'
import { parseAIResponse, validateQuestions } from './responseParser'

// ─── Cost rates per 1K tokens ─────────────────────────────────────────────
const COST_RATES: Record<LLMProvider, number> = {
  openai: 0.0015,
  anthropic: 0.0008,
  claude: 0.0008,      // ← FIX: Added 'claude' as alias for 'anthropic'
  gemini: 0.0005,
  azure: 0.002,
  cohere: 0.001,
}

// ─── Provider dispatch map ──────────────────────────────────────────────
const PROVIDER_MAP: Record<LLMProvider, (prompt: string, config: AIQuestionConfig) => Promise<any>> = {
  openai: callOpenAI,
  anthropic: callClaude,
  claude: callClaude,  // ← FIX: Added 'claude' as alias for 'anthropic'
  gemini: callGemini,
  azure: callAzureOpenAI,
  cohere: callCohere,
}

// ─── Main generation function ───────────────────────────────────────────
export async function generateQuestions(config: AIQuestionConfig): Promise<AIGenerationResult> {
  const startTime = Date.now()
  const provider: LLMProvider = config.provider || 'gemini'
  const numQuestions = config.numQuestions || config.count || 5

  // Build prompt
  const prompt = buildPrompt(config)

  // Call provider
  const providerFn = PROVIDER_MAP[provider]
  if (!providerFn) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const result = await providerFn(prompt, config)

  // Parse response
  const parsed = parseAIResponse(result.text, config)

  // Validate
  const { valid, errors } = validateQuestions(parsed, config)

  const generationTime = Date.now() - startTime
  const tokensUsed = result.tokensUsed
  const costEstimate = tokensUsed ? (tokensUsed / 1000) * COST_RATES[provider] : undefined

  return {
    questions: valid,
    generatedCount: valid.length,
    tokensUsed,
    warnings: errors.length > 0 ? errors : undefined,
    rawResponse: result.text,
    costEstimate,
    generationTime,
    provider,
    model: result.model,
  }
}

// ─── Prompt builder ─────────────────────────────────────────────────────
function buildPrompt(config: AIQuestionConfig): string {
  const {
    topic,
    subject,
    questionType,
    difficulty,
    count,
    numQuestions,
    marks,
    chapter,
    unit,
    course,
    semester,
    includeExplanation,
    language,
  } = config

  const qCount = numQuestions || count || 5

  return `
Generate ${qCount} ${difficulty} difficulty ${questionType} questions for:
- Subject: ${subject}
- Topic: ${topic}
${chapter ? `- Chapter: ${chapter}` : ''}
${unit ? `- Unit: ${unit}` : ''}
${course ? `- Course: ${course}` : ''}
${semester ? `- Semester: ${semester}` : ''}
${marks ? `- Marks per question: ${marks}` : ''}
${language && language !== 'english' ? `- Language: ${language}` : ''}

Requirements:
- Return ONLY a valid JSON array
- Each question must have: text, options (for MCQ), correctAnswer, explanation
- Options should be labeled A, B, C, D for MCQ
- Correct answer should be the letter (A/B/C/D) for MCQ, or True/False for true_false
- Explanation should be detailed and educational

Example format:
[
  {
    "text": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "B",
    "explanation": "Paris is the capital and most populous city of France."
  }
]
`.trim()
}

// ─── Re-export types for convenience ──────────────────────────────────────
export type { AIQuestionConfig, AIGenerationResult, GeneratedQuestion, LLMProvider }