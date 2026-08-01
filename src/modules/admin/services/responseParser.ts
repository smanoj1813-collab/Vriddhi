// src/services/responseParser.ts
import type { AIQuestionConfig, GeneratedQuestion } from '../types/aiQuestion';
import type { QuestionType } from '../../admin/types/questionBank';

/**
 * Parse raw LLM response into structured questions
 */
export function parseAIResponse(rawText: string, config: AIQuestionConfig): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];

  // Try JSON array first
  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) {
      return parsed.map((q, i) => normalizeQuestion(q, config, i));
    }
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return parsed.questions.map((q: any, i: number) => normalizeQuestion(q, config, i));
    }
  } catch {
    // Not JSON, try text parsing
  }

  // Fallback: parse numbered questions from text
  const blocks = rawText.split(/\s*(?:Q\d+[.):]|\d+[.):]\s)/).filter(Boolean);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const q = parseTextBlock(block, config);
    if (q) questions.push(q);
  }

  return questions;
}

function normalizeQuestion(raw: any, config: AIQuestionConfig, index: number): GeneratedQuestion {
  const correctAnswer = raw.correctAnswer || raw.correct_answer || raw.answer || '';

  // Normalize options to { id, text, isCorrect } format
  const rawOptions = Array.isArray(raw.options) ? raw.options : undefined;
  const normalizedOptions = rawOptions?.map((opt: any, idx: number) => {
    if (opt && typeof opt === 'object' && opt.text !== undefined) {
      return {
        id: opt.id || String.fromCharCode(65 + idx),
        text: opt.text,
        isCorrect: !!opt.isCorrect || correctAnswer === opt.id || correctAnswer === opt.text,
      };
    }
    if (typeof opt === 'string') {
      return {
        id: String.fromCharCode(65 + idx),
        text: opt,
        isCorrect: correctAnswer === String.fromCharCode(65 + idx) || correctAnswer === opt,
      };
    }
    return {
      id: String.fromCharCode(65 + idx),
      text: String(opt),
      isCorrect: false,
    };
  });

  return {
    id: raw.id || `ai-${Date.now()}-${index}`,
    text: raw.text || raw.question || raw.q || '',
    type: (raw.type || config.questionType) as QuestionType,
    difficulty: raw.difficulty || config.difficulty,
    subject: raw.subject || config.subject,  // ← FIX: Added required subject field
    marks: raw.marks || config.marks || 1,
    topic: raw.topic || config.topic || '',
    tags: raw.tags || [config.subject, config.topic].filter(Boolean),
    options: normalizedOptions,
    correctAnswer: Array.isArray(correctAnswer) ? correctAnswer : String(correctAnswer),
    explanation: raw.explanation || raw.explanation_text || '',
    unit: raw.unit || config.unit,
    chapter: raw.chapter || config.chapter,
    batch: raw.batch || config.batch,
    branch: raw.branch || config.branch,
    generatedAt: new Date().toISOString(),
  };
}

function parseTextBlock(block: string, config: AIQuestionConfig): GeneratedQuestion | null {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const text = lines[0].replace(/^(?:Q\d+[.):]|\d+[.):])\s*/, '');

  // Extract options (A. B. C. D. or a) b) c) d))
  const options: { id: string; text: string; isCorrect: boolean }[] = [];
  const optionRegex = /^[A-Da-d][.)]\s*(.+)$/;
  let correctAnswer = '';

  for (const line of lines.slice(1)) {
    const match = line.match(optionRegex);
    if (match) {
      const letter = line.charAt(0).toUpperCase();
      options.push({
        id: letter,
        text: match[1],
        isCorrect: false,
      });
    }
  }

  // Find correct answer marker
  for (const line of lines) {
    if (line.toLowerCase().includes('correct answer') || line.toLowerCase().includes('answer:')) {
      const ans = line.split(/[:\-]/).pop()?.trim() || '';
      correctAnswer = ans;
      // Mark the correct option
      options.forEach(opt => {
        if (opt.id === ans || opt.text.toLowerCase() === ans.toLowerCase()) {
          opt.isCorrect = true;
        }
      });
      break;
    }
  }

  // For true/false, validate answer
  if (config.questionType === 'true_false' && correctAnswer) {
    const normalized = String(correctAnswer).toLowerCase().trim();
    if (!['true', 'false'].includes(normalized)) {
      correctAnswer = '';
    }
  }

  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    type: config.questionType,
    difficulty: config.difficulty,
    subject: config.subject,  // ← FIX: Added required subject field
    marks: config.marks || 1,
    topic: config.topic,
    tags: [config.subject, config.topic].filter(Boolean),
    options: options.length > 0 ? options : undefined,  // ← FIX: Returns { id, text, isCorrect }[]
    correctAnswer: correctAnswer || undefined,
    explanation: '',
    unit: config.unit,
    chapter: config.chapter,
    batch: config.batch,
    branch: config.branch,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Validate generated questions against config requirements
 */
export function validateQuestions(
  questions: GeneratedQuestion[],
  config: AIQuestionConfig
): { valid: GeneratedQuestion[]; invalid: GeneratedQuestion[]; errors: string[] } {
  const valid: GeneratedQuestion[] = [];
  const invalid: GeneratedQuestion[] = [];
  const errors: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qErrors: string[] = [];

    if (!q.text || q.text.length < 10) {
      qErrors.push(`Q${i + 1}: Question text too short or missing`);
    }

    if (q.type === 'mcq' && (!q.options || q.options.length < 2)) {
      qErrors.push(`Q${i + 1}: MCQ must have at least 2 options`);
    }

    if (q.type === 'true_false') {
      const ans = String(q.correctAnswer || '').toLowerCase().trim();
      if (!['true', 'false'].includes(ans)) {
        qErrors.push(`Q${i + 1}: True/False must have answer "True" or "False"`);
      }
    }

    if (qErrors.length === 0) {
      valid.push(q);
    } else {
      invalid.push(q);
      errors.push(...qErrors);
    }
  }

  const targetCount = config.numQuestions || config.count || 1;
  if (valid.length < targetCount) {
    errors.push(`Generated ${valid.length}/${targetCount} questions`);
  }

  return { valid, invalid, errors };
}