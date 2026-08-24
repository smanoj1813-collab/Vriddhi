// src/services/promptBuilder.ts
import type { AIQuestionConfig } from '../types/aiQuestion'
import type { QuestionType, DifficultyLevel } from '../../admin/types/questionBank'

const typeInstructions: Record<string, string> = {
  mcq: `Generate Multiple Choice Questions with exactly 4 options (A, B, C, D).
One option must be correct. Three must be plausible distractors.
Format: Options must be labeled A), B), C), D).`,

  short: `Generate Short Answer questions that can be answered in 2-5 sentences.
No options needed. Provide the expected correct answer.`,

  short_answer: `Generate Short Answer questions that can be answered in 2-5 sentences.
No options needed. Provide the expected correct answer.`,

  long: `Generate Long Answer / Essay type questions requiring detailed explanation.
No options needed. Provide a comprehensive model answer.`,

  long_answer: `Generate Long Answer / Essay type questions requiring detailed explanation.
No options needed. Provide a comprehensive model answer.`,

  numerical: `Generate Numerical/Calculation problems.
Provide the exact numerical answer. Show step-by-step working.`,

  true_false: `Generate True/False statements.
Answer must be either "True" or "False" only.`,

  fill_in_blank: `Generate Fill in the Blank questions.
Provide the correct word or phrase that completes the sentence.`,

  matching: `Generate Matching questions with two columns.
Provide the correct pairings.`,

  assertion_reason: `Generate Assertion and Reason questions.
Provide both assertion and reason statements with correct answer.`,

  case_based: `Generate Case-Based questions with a scenario/case study.
Provide the case description followed by questions based on it.`,
}

const difficultyInstructions: Record<DifficultyLevel, string> = {
  easy: `EASY LEVEL:
- Single-step problems or direct recall
- Simple numbers, no complex calculations
- Straightforward application of basic concepts
- Minimal reasoning required`,

  medium: `MEDIUM LEVEL:
- 2-3 step problems requiring reasoning
- Moderate calculations, may include fractions/decimals
- Requires understanding of interrelated concepts
- Some analytical thinking needed`,

  hard: `HARD LEVEL:
- Multi-step complex problems
- Hidden variables, combined concepts
- Strategic thinking and deep understanding required
- Application of multiple formulas/concepts together`,
}

export function buildSystemPrompt(config: AIQuestionConfig): string {
  const {
    subject,
    topic,
    branch,
    course,
    semester,
    questionType,
    difficulty,
    marks,
    unit,
    language,
  } = config

  return `You are an expert academic question generator for Indian higher education.

## CONTEXT
- Course: ${course} (${branch})
- Subject: ${subject}
- Topic: ${topic}
- Semester: ${semester}
- Question Type: ${questionType.toUpperCase()}
- Difficulty: ${difficulty.toUpperCase()}
${unit ? `- Unit: ${unit}` : ''}
${marks ? `- Marks: ${marks}` : ''}

## ROLE
Generate high-quality, curriculum-aligned academic questions suitable for ${course} level students in India.

## DIFFICULTY RULES
${difficultyInstructions[difficulty]}

## QUESTION TYPE RULES
${typeInstructions[questionType] || typeInstructions['mcq']}

## VALIDATION RULES
- Question must be clear, unambiguous, and solvable
- Must align with ${course} ${branch} curriculum standards
- No trick questions or misleading wording
- Use realistic values and scenarios
- Language must be academic and precise
${language === 'hindi' ? '- Generate questions in Hindi language' : ''}

## OUTPUT FORMAT (STRICT JSON)
Respond ONLY with a valid JSON array. No markdown, no explanations outside JSON.

Format for each question:
{
  "text": "Question text here",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "A",
  "explanation": "Step-by-step solution",
  "marks": ${marks || 5},
  "topic": "${topic}",
  "unit": "${unit || ''}",
  "tags": ["${subject}", "${topic}", "${difficulty}"]
}

For non-MCQ types, omit "options" and "correctAnswer", use "expectedAnswer" instead.
For true_false, correctAnswer must be "True" or "False".

Generate ${config.numQuestions} question(s).`
}

export function buildValidationPrompt(
  questions: unknown[],
  config: AIQuestionConfig
): string {
  return `Validate and improve the following ${config.numQuestions} ${config.questionType} questions for ${config.course} ${config.branch}, Subject: ${config.subject}, Topic: ${config.topic}.

Questions:
${JSON.stringify(questions, null, 2)}

Please:
1. Check for clarity and unambiguity
2. Verify answers are correct
3. Ensure difficulty matches "${config.difficulty}"
4. Fix any errors
5. Return the corrected questions in the same JSON format`
}