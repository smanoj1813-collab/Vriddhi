// src/api/aiQuestionApi.ts
// ─── AI Question Generation API — Backend Agent Integration ─────

import { createQuestion } from '../../admin/api/questionBankApi';

import type {
  Question,
  QuestionType,
  DifficultyLevel,
  GeneratedQuestion,
} from '../../admin/types/questionBank';

import type {
  AIQuestionConfig,
  AIGenerationResult,
  SaveGeneratedQuestionsPayload,
  SaveGeneratedQuestionsResult,
} from '../types/aiQuestion';

// Re-export types for backward compatibility
export type {
  AIQuestionConfig,
  AIGenerationResult,
  SaveGeneratedQuestionsPayload,
  SaveGeneratedQuestionsResult,
} from '../types/aiQuestion';

// ═══════════════════════════════════════════════════════════════════════
// BACKEND API CLIENT
// ═══════════════════════════════════════════════════════════════════════

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://asia-south1-vriddhi-academic.cloudfunctions.net/api'
).replace(/\/$/, '');

async function getBearerToken(): Promise<string | null> {
  const stored = localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('vriddhi_auth_token');
  if (stored) return stored;
  try {
    const { auth } = await import('@/Firebase/config');
    if (auth.currentUser) return await auth.currentUser.getIdToken();
  } catch {
    // ignore
  }
  return null;
}

async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  const token = await getBearerToken();
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN: Generate questions via backend AI agent
// ═══════════════════════════════════════════════════════════════════════

export async function generateQuestionsWithAI(
  config: AIQuestionConfig
): Promise<AIGenerationResult> {
  const data = await apiPost<AIGenerationResult>('/ai/generate-questions', config);

  // Ensure all questions have required fields and proper types
  const questions: GeneratedQuestion[] = (data.questions || []).map((q: any, index: number) => ({
    id: q.firestoreId || q.id || `ai-gen-${Date.now()}-${index}`,
    firestoreId: q.firestoreId,
    text: q.text || '',
    type: (q.type as QuestionType) || config.questionType,
    difficulty: (q.difficulty as DifficultyLevel) || config.difficulty,
    subject: q.subject || config.subject,
    topic: q.topic || config.topic,
    chapter: q.chapter || config.chapter,
    marks: q.marks ?? config.marks ?? 1,
    unit: q.unit || config.unit,
    negativeMarks: q.negativeMarks,
    options: normalizeOptions(q.options),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    tags: [...new Set([...(q.tags || []), config.subject, config.topic])].filter(Boolean),
    bloomLevel: q.bloomLevel,
    batch: q.batch || config.batch,
    branch: q.branch || config.branch,
    generatedAt: new Date().toISOString(),
  }));

  return {
    questions,
    generatedCount: data.generatedCount || questions.length,
    tokensUsed: data.tokensUsed,
    warnings: data.warnings,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Convert API response questions to GeneratedQuestion[]
// ═══════════════════════════════════════════════════════════════════════

export function mapToGeneratedQuestions(
  questions: Partial<Question>[],
  configSubject: string
): GeneratedQuestion[] {
  return questions.map((q, idx) => ({
    id: q.id || `ai-${Date.now()}-${idx}`,
    text: q.text || '',
    type: (q.type as QuestionType) || 'mcq',
    difficulty: (q.difficulty as DifficultyLevel) || 'medium',
    subject: q.subject || configSubject,
    chapter: q.chapter,
    topic: q.topic,
    marks: q.marks ?? 1,
    negativeMarks: q.negativeMarks,
    options: normalizeOptions(q.options),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    tags: q.tags,
    bloomLevel: q.bloomLevel,
    unit: q.unit,
    batch: q.batch,
    branch: q.branch,
    generatedAt: new Date().toISOString(),
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// Normalize options to consistent { id, text, isCorrect } format
// ═══════════════════════════════════════════════════════════════════════

function normalizeOptions(options: any): any[] | undefined {
  if (!options || !Array.isArray(options) || options.length === 0) {
    return undefined;
  }

  return options.map((opt: any, idx: number) => {
    if (opt && typeof opt === 'object' && opt.text !== undefined) {
      return {
        id: opt.id || String.fromCharCode(65 + idx),
        text: opt.text,
        isCorrect: !!opt.isCorrect,
      };
    }
    if (typeof opt === 'string') {
      return {
        id: String.fromCharCode(65 + idx),
        text: opt,
        isCorrect: false,
      };
    }
    return {
      id: String.fromCharCode(65 + idx),
      text: String(opt),
      isCorrect: false,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════
// Data Conversion: GeneratedQuestion → DB-ready Question
// ═══════════════════════════════════════════════════════════════════════

export function convertToQuestionData(
  generated: GeneratedQuestion,
  collegeId: string,
  userId: string,
  userName: string,
  batch: string,
  branch: string
): Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'> {
  if (!generated.text?.trim()) {
    throw new Error('Generated question is missing required "text" field.');
  }
  if (!generated.type) {
    throw new Error(`Generated question is missing "type": "${generated.text.substring(0, 50)}..."`);
  }
  if (!generated.difficulty) {
    throw new Error(`Generated question is missing "difficulty": "${generated.text.substring(0, 50)}..."`);
  }
  if (!generated.subject?.trim()) {
    throw new Error(
      `Generated question is missing required "subject" field.\n` +
      `Question: "${generated.text.substring(0, 80)}..."`
    );
  }

  const baseTags = [
    generated.subject,
    generated.topic || generated.chapter || '',
    generated.unit || '',
    generated.difficulty,
    generated.type,
    ...(generated.tags || []),
  ].filter(Boolean);

  const uniqueTags = [...new Set(baseTags)];

  const searchKeywords = [
    generated.subject.toLowerCase(),
    (generated.topic || generated.chapter || '').toLowerCase(),
    generated.text.substring(0, 50).toLowerCase(),
    generated.unit?.toLowerCase() || '',
  ].filter(Boolean);

  const normalizedOptions = generated.options?.map((opt: any, idx: number) => {
    if (opt && typeof opt === 'object' && opt.text !== undefined) {
      return {
        id: opt.id || String.fromCharCode(65 + idx),
        text: opt.text,
        isCorrect: !!opt.isCorrect,
      };
    }
    if (typeof opt === 'string') {
      return {
        id: String.fromCharCode(65 + idx),
        text: opt,
        isCorrect: false,
      };
    }
    return {
      id: String.fromCharCode(65 + idx),
      text: String(opt),
      isCorrect: false,
    };
  });

  let correctAnswer = generated.correctAnswer;
  if (normalizedOptions && normalizedOptions.length > 0 && !correctAnswer) {
    const correctOpt = normalizedOptions.find((o: any) => o.isCorrect);
    if (correctOpt) {
      correctAnswer = correctOpt.id;
    }
  }

  return {
    text: generated.text.trim(),
    type: generated.type,
    difficulty: generated.difficulty,
    subject: generated.subject.trim(),
    chapter: generated.chapter?.trim() || generated.topic?.trim() || '',
    topic: generated.topic?.trim() || generated.chapter?.trim() || '',
    marks: generated.marks ?? 1,
    negativeMarks: generated.negativeMarks,
    options: normalizedOptions,
    correctAnswer: correctAnswer,
    explanation: generated.explanation?.trim(),
    tags: uniqueTags,
    searchKeywords: [...new Set(searchKeywords)],
    bloomLevel: generated.bloomLevel,
    createdBy: userId,
    createdByName: userName,
    collegeId,
    status: 'active',
    batch,
    branch,
    unit: generated.unit?.trim(),
    isPYQ: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Batch conversion helper
// ═══════════════════════════════════════════════════════════════════════

export interface ConversionResult {
  valid: ReturnType<typeof convertToQuestionData>[];
  invalid: { question: GeneratedQuestion; error: string }[];
}

export function convertAllToQuestionData(
  generatedQuestions: GeneratedQuestion[],
  collegeId: string,
  userId: string,
  userName: string,
  batch: string,
  branch: string
): ConversionResult {
  const valid: ReturnType<typeof convertToQuestionData>[] = [];
  const invalid: { question: GeneratedQuestion; error: string }[] = [];

  for (const gq of generatedQuestions) {
    try {
      valid.push(convertToQuestionData(gq, collegeId, userId, userName, batch, branch));
    } catch (err: any) {
      invalid.push({ question: gq, error: err.message });
    }
  }

  return { valid, invalid };
}

// ═══════════════════════════════════════════════════════════════════════
// REAL Save Function: Converts AND writes each question to Firestore
// ═══════════════════════════════════════════════════════════════════════

export async function saveGeneratedQuestions(
  payload: SaveGeneratedQuestionsPayload
): Promise<SaveGeneratedQuestionsResult> {
  const { questions, collegeId, createdBy, createdByName, batch = '', branch = '' } = payload;

  const { valid, invalid } = convertAllToQuestionData(
    questions,
    collegeId,
    createdBy,
    createdByName,
    batch,
    branch
  );

  const savedIds: string[] = [];
  const failed: { question: GeneratedQuestion; error: string }[] = [...invalid];

  for (let i = 0; i < valid.length; i++) {
    const questionData = valid[i];
    try {
      const saved = await createQuestion(collegeId, questionData);
      savedIds.push(saved.id);
    } catch (err: any) {
      failed.push({
        question: questions[i],
        error: err.message || 'Failed to save to Firestore',
      });
    }
  }

  return {
    savedCount: savedIds.length,
    savedIds,
    failed,
  };
}
