// src/services/promptBuilder.ts

export interface AIQuestionConfig {
  subject: string
  topic: string
  branch: string
  course: string
  semester: string
  questionType: string
  difficulty: string
  marks?: number
  unit?: string
  numQuestions: number
  language?: string
  provider?: string
}

const typeInstructions: Record<string, string> = {
  mcq: `Generate Multiple Choice Questions with exactly 4 options (A, B, C, D).
One option must be correct. Three must be plausible distractors.
Format: Options must be labeled A), B), C), D).`,

  short_answer: `Generate Short Answer questions that can be answered in 2-5 sentences.
No options needed. Provide the expected correct answer.`,

  long_answer: `Generate Long Answer / Essay type questions requiring detailed explanation.
No options needed. Provide a comprehensive model answer.`,

  true_false: `Generate True/False statements.
Answer must be either "True" or "False" only.`,

  fill_in_blank: `Generate Fill in the Blank questions.
Use underscores (_____) for blanks. Provide the correct word/phrase.`,

  numerical: `Generate Numerical/Calculation problems.
Provide the exact numerical answer. Show step-by-step working.`,

  assertion_reason: `Generate Assertion-Reason type questions.
Format: Assertion (A) and Reason (R) statements.
Options: (a) Both A and R true, R explains A, (b) Both true but R doesn't explain A, (c) A true R false, (d) A false R true.`,

  case_based: `Generate Case Study / Case Based questions.
Provide a scenario/case followed by questions based on it.`,

  matching: `Generate Matching questions with two columns.
Provide the correct pairings.`,
}

const difficultyInstructions: Record<string, string> = {
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
  const { subject, topic, branch, course, semester, questionType, difficulty, marks, unit, numQuestions, language } = config

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
${difficultyInstructions[difficulty] || difficultyInstructions.medium}

## QUESTION TYPE RULES
${typeInstructions[questionType] || typeInstructions.mcq}

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

Generate ${numQuestions} question(s).`
}