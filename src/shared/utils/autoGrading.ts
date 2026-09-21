// src/shared/utils/autoGrading.ts
// 5 Marks and 10 Marks Auto-Grading System - Reduce Faculty Manual Review Time
// For BCU, BNU descriptive papers (SEP 2024)

export type QuestionMarks = 5 | 10;
export type GradingMode = 'manual' | 'rubric' | 'ai_assisted' | 'bulk';

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  maxMarks: number;
  weight: number; // 0-1
  keywords?: string[]; // For AI matching
}

export interface Rubric {
  id: string;
  questionType: '5marks' | '10marks';
  title: string;
  description: string;
  totalMarks: QuestionMarks;
  criteria: RubricCriterion[];
  modelAnswer?: string;
  keywords?: string[];
  commonMistakes?: string[];
}

// Pre-defined rubrics for common BCU patterns
export const FIVE_MARKS_RUBRICS: Rubric[] = [
  {
    id: '5m_definition',
    questionType: '5marks',
    title: 'Definition + Explanation (5M)',
    description: 'Define concept + explain with example',
    totalMarks: 5,
    criteria: [
      { id: 'def', label: 'Correct Definition', description: 'Accurate definition with key terms', maxMarks: 2, weight: 0.4, keywords: ['define', 'definition', 'means', 'is'] },
      { id: 'exp', label: 'Explanation', description: 'Clear explanation of concept', maxMarks: 2, weight: 0.4, keywords: ['explain', 'because', 'therefore', 'hence'] },
      { id: 'ex', label: 'Example/Diagram', description: 'Relevant example or diagram', maxMarks: 1, weight: 0.2, keywords: ['example', 'e.g.', 'for instance', 'diagram'] },
    ],
    modelAnswer: 'Definition with key terms + explanation of importance + relevant example',
  },
  {
    id: '5m_difference',
    questionType: '5marks',
    title: 'Difference Between (5M)',
    description: 'Compare two concepts with differences',
    totalMarks: 5,
    criteria: [
      { id: 'c1', label: 'Concept 1 Explained', description: 'First concept correctly explained', maxMarks: 1.5, weight: 0.3 },
      { id: 'c2', label: 'Concept 2 Explained', description: 'Second concept correctly explained', maxMarks: 1.5, weight: 0.3 },
      { id: 'diff', label: 'Differences Listed', description: 'At least 3 clear differences', maxMarks: 2, weight: 0.4, keywords: ['difference', 'whereas', 'while', 'but', 'however'] },
    ],
  },
  {
    id: '5m_short_note',
    questionType: '5marks',
    title: 'Short Note (5M)',
    description: 'Write short note on topic',
    totalMarks: 5,
    criteria: [
      { id: 'intro', label: 'Introduction', description: 'Brief intro of topic', maxMarks: 1, weight: 0.2 },
      { id: 'body', label: 'Main Points', description: '3-4 key points covered', maxMarks: 3, weight: 0.6, keywords: ['important', 'key', 'main', 'feature', 'advantage'] },
      { id: 'conclusion', label: 'Conclusion', description: 'Concluding statement', maxMarks: 1, weight: 0.2 },
    ],
  },
  {
    id: '5m_problem',
    questionType: '5marks',
    title: 'Problem Solving (5M)',
    description: 'Solve numerical/problem',
    totalMarks: 5,
    criteria: [
      { id: 'formula', label: 'Formula/Approach', description: 'Correct formula or approach identified', maxMarks: 1, weight: 0.2, keywords: ['formula', 'equation', 'method'] },
      { id: 'steps', label: 'Steps/Calculation', description: 'Correct steps and calculation', maxMarks: 3, weight: 0.6 },
      { id: 'answer', label: 'Final Answer', description: 'Correct final answer with units', maxMarks: 1, weight: 0.2 },
    ],
  },
];

export const TEN_MARKS_RUBRICS: Rubric[] = [
  {
    id: '10m_essay',
    questionType: '10marks',
    title: 'Essay Type (10M)',
    description: 'Detailed essay with introduction, body, conclusion',
    totalMarks: 10,
    criteria: [
      { id: 'intro', label: 'Introduction', description: 'Clear introduction, definition, context', maxMarks: 2, weight: 0.2 },
      { id: 'body1', label: 'Main Content - Part 1', description: 'First half of key points (3-4 points)', maxMarks: 3, weight: 0.3, keywords: ['first', 'important', 'feature', 'advantage'] },
      { id: 'body2', label: 'Main Content - Part 2', description: 'Second half, examples, case study', maxMarks: 3, weight: 0.3, keywords: ['example', 'case', 'second', 'also', 'furthermore'] },
      { id: 'conclusion', label: 'Conclusion & Relevance', description: 'Summary + relevance/application', maxMarks: 2, weight: 0.2 },
    ],
    modelAnswer: 'Introduction with definition + 6-8 key points with explanations + examples/case study + conclusion with application',
  },
  {
    id: '10m_problem_detailed',
    questionType: '10marks',
    title: 'Detailed Problem (10M)',
    description: 'Complex numerical with multiple steps',
    totalMarks: 10,
    criteria: [
      { id: 'understand', label: 'Understanding', description: 'Correct understanding of problem, given data listed', maxMarks: 2, weight: 0.2 },
      { id: 'formula', label: 'Formulae & Approach', description: 'All relevant formulae, correct approach', maxMarks: 2, weight: 0.2 },
      { id: 'calc1', label: 'Calculation Part 1', description: 'First half calculations correct', maxMarks: 2.5, weight: 0.25 },
      { id: 'calc2', label: 'Calculation Part 2', description: 'Second half, final steps', maxMarks: 2.5, weight: 0.25 },
      { id: 'answer', label: 'Final Answer & Verification', description: 'Correct answer with units, verification', maxMarks: 1, weight: 0.1 },
    ],
  },
  {
    id: '10m_case_study',
    questionType: '10marks',
    title: 'Case Study Analysis (10M)',
    description: 'Analyze case study and answer',
    totalMarks: 10,
    criteria: [
      { id: 'identify', label: 'Problem Identification', description: 'Correctly identifies key issues in case', maxMarks: 2, weight: 0.2, keywords: ['problem', 'issue', 'challenge'] },
      { id: 'analysis', label: 'Analysis', description: 'Detailed analysis with theory application', maxMarks: 4, weight: 0.4, keywords: ['analyze', 'because', 'theory', 'concept'] },
      { id: 'solution', label: 'Solution/Recommendations', description: 'Practical solutions, recommendations', maxMarks: 3, weight: 0.3, keywords: ['solution', 'recommend', 'should', 'suggest'] },
      { id: 'conclusion', label: 'Conclusion', description: 'Clear conclusion', maxMarks: 1, weight: 0.1 },
    ],
  },
  {
    id: '10m_diagram_program',
    questionType: '10marks',
    title: 'Diagram/Program (10M)',
    description: 'Draw diagram or write program with explanation',
    totalMarks: 10,
    criteria: [
      { id: 'diagram', label: 'Diagram/Program Correctness', description: 'Correct diagram/program structure', maxMarks: 5, weight: 0.5 },
      { id: 'label', label: 'Labeling/Comments', description: 'Proper labeling, comments, explanation', maxMarks: 2, weight: 0.2 },
      { id: 'explanation', label: 'Explanation', description: 'Explanation of working', maxMarks: 3, weight: 0.3 },
    ],
  },
];

export const ALL_RUBRICS = [...FIVE_MARKS_RUBRICS, ...TEN_MARKS_RUBRICS];

export interface AutoGradingResult {
  questionId: string;
  maxMarks: QuestionMarks;
  suggestedMarks: number;
  confidence: number; // 0-1
  breakdown: Array<{
    criterionId: string;
    label: string;
    awarded: number;
    max: number;
    feedback: string;
    matched: boolean;
  }>;
  overallFeedback: string;
  keywordsMatched: string[];
  keywordsMissing: string[];
  needsManualReview: boolean;
  gradingMode: GradingMode;
  timeSaved: number; // seconds estimated saved vs manual
}

// Quick grading presets for 5 marks
export const FIVE_MARKS_PRESETS = [
  { label: '0 - No attempt', marks: 0, color: 'rose' },
  { label: '1 - Attempted', marks: 1, color: 'amber' },
  { label: '2 - Partial', marks: 2, color: 'amber' },
  { label: '3 - Average', marks: 3, color: 'blue' },
  { label: '4 - Good', marks: 4, color: 'teal' },
  { label: '5 - Excellent', marks: 5, color: 'emerald' },
];

// Quick grading presets for 10 marks
export const TEN_MARKS_PRESETS = [
  { label: '0 - No attempt', marks: 0, color: 'rose' },
  { label: '2 - Poor', marks: 2, color: 'rose' },
  { label: '4 - Below Avg', marks: 4, color: 'amber' },
  { label: '5 - Average', marks: 5, color: 'amber' },
  { label: '6 - Above Avg', marks: 6, color: 'blue' },
  { label: '8 - Good', marks: 8, color: 'teal' },
  { label: '10 - Excellent', marks: 10, color: 'emerald' },
];

// AI grading logic - keyword based + length + structure
export function autoGradeAnswer(
  answer: string,
  maxMarks: QuestionMarks,
  rubric: Rubric,
  modelAnswer?: string
): AutoGradingResult {
  const answerLower = answer.toLowerCase().trim();
  const wordCount = answer.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  if (!answer || answerLower.length < 10) {
    return {
      questionId: '',
      maxMarks,
      suggestedMarks: 0,
      confidence: 0.95,
      breakdown: rubric.criteria.map(c => ({
        criterionId: c.id,
        label: c.label,
        awarded: 0,
        max: c.maxMarks,
        feedback: 'No attempt or too short',
        matched: false,
      })),
      overallFeedback: 'No attempt - 0 marks',
      keywordsMatched: [],
      keywordsMissing: rubric.keywords || [],
      needsManualReview: false,
      gradingMode: 'rubric',
      timeSaved: 30,
    };
  }

  // Keyword matching
  const allKeywords = rubric.criteria.flatMap(c => c.keywords || []).concat(rubric.keywords || []);
  const uniqueKeywords = [...new Set(allKeywords)];
  const matchedKeywords = uniqueKeywords.filter(kw => answerLower.includes(kw.toLowerCase()));
  const missingKeywords = uniqueKeywords.filter(kw => !answerLower.includes(kw.toLowerCase()));
  
  const keywordScore = uniqueKeywords.length > 0 ? matchedKeywords.length / uniqueKeywords.length : 0.5;
  
  // Length scoring - 5M expects 100-150 words, 10M expects 200-300 words
  const expectedWords = maxMarks === 5 ? 120 : 250;
  const lengthScore = Math.min(1, wordCount / expectedWords);
  const lengthPenalty = wordCount < expectedWords * 0.3 ? 0.5 : 1;

  // Structure scoring - check for paragraphs, points
  const hasStructure = answer.includes('\n') || answer.includes('•') || answer.includes('-') || /\d\./.test(answer);
  const structureScore = hasStructure ? 0.2 : 0;

  // Calculate per criterion
  const breakdown = rubric.criteria.map(criterion => {
    const criterionKeywords = criterion.keywords || [];
    const matched = criterionKeywords.length === 0 ? true : criterionKeywords.some(kw => answerLower.includes(kw.toLowerCase()));
    
    // Award based on keyword match + overall quality
    let awarded = 0;
    if (matched) {
      awarded = criterion.maxMarks * (0.6 + keywordScore * 0.4) * lengthPenalty;
      // Add structure bonus
      if (hasStructure) awarded = Math.min(criterion.maxMarks, awarded + criterion.maxMarks * 0.1);
    } else {
      // Partial if answer has decent length
      if (wordCount > expectedWords * 0.5) {
        awarded = criterion.maxMarks * 0.3 * lengthPenalty;
      }
    }
    
    awarded = Math.round(awarded * 2) / 2; // Round to 0.5
    awarded = Math.min(criterion.maxMarks, Math.max(0, awarded));

    return {
      criterionId: criterion.id,
      label: criterion.label,
      awarded,
      max: criterion.maxMarks,
      feedback: matched ? `Good - covers ${criterion.label}` : `Missing - needs ${criterion.label}`,
      matched,
    };
  });

  const totalAwarded = breakdown.reduce((sum, b) => sum + b.awarded, 0);
  const suggestedMarks = Math.min(maxMarks, Math.round(totalAwarded * 2) / 2);

  // Confidence based on keyword match + length
  const confidence = Math.min(0.95, 0.5 + keywordScore * 0.3 + lengthScore * 0.2 + (hasStructure ? 0.1 : 0));
  
  // Needs manual review if confidence < 0.7 or borderline marks
  const needsManualReview = confidence < 0.7 || (suggestedMarks > 0 && suggestedMarks < maxMarks * 0.4) || wordCount < expectedWords * 0.4;

  let overallFeedback = '';
  if (suggestedMarks === maxMarks) {
    overallFeedback = `Excellent answer - covers all criteria, good structure, relevant keywords. ${wordCount} words.`;
  } else if (suggestedMarks >= maxMarks * 0.7) {
    overallFeedback = `Good answer - ${matchedKeywords.length}/${uniqueKeywords.length} keywords matched, ${wordCount} words. Minor improvements needed: ${missingKeywords.slice(0, 3).join(', ')}`;
  } else if (suggestedMarks >= maxMarks * 0.4) {
    overallFeedback = `Average - needs more depth. Matched ${matchedKeywords.length} keywords, missing: ${missingKeywords.slice(0, 4).join(', ')}. Word count: ${wordCount} (expected ~${expectedWords})`;
  } else {
    overallFeedback = `Below average - too short or missing key points. Only ${wordCount} words (expected ~${expectedWords}), matched ${matchedKeywords.length}/${uniqueKeywords.length} keywords. Needs: ${missingKeywords.slice(0, 5).join(', ')}`;
  }

  // Time saved: manual grading takes ~60-90 sec per 5M, ~120-180 sec per 10M
  const manualTime = maxMarks === 5 ? 75 : 150;
  const autoTime = needsManualReview ? manualTime * 0.5 : 15; // If needs review, still saves 50%, else saves ~80%
  const timeSaved = manualTime - autoTime;

  return {
    questionId: '',
    maxMarks,
    suggestedMarks,
    confidence,
    breakdown,
    overallFeedback,
    keywordsMatched: matchedKeywords,
    keywordsMissing: missingKeywords,
    needsManualReview,
    gradingMode: 'rubric',
    timeSaved,
  };
}

// Bulk grading - group similar answers
export interface BulkGradingGroup {
  id: string;
  pattern: string;
  answerSample: string;
  count: number;
  studentIds: string[];
  suggestedMarks: number;
  confidence: number;
}

export function groupSimilarAnswers(
  answers: Array<{ studentId: string; answer: string; questionId: string; maxMarks: number }>,
  threshold: number = 0.7
): BulkGradingGroup[] {
  const groups: BulkGradingGroup[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < answers.length; i++) {
    if (processed.has(answers[i].studentId)) continue;

    const current = answers[i];
    const similar: typeof answers = [current];
    processed.add(current.studentId);

    // Simple similarity: word overlap
    const currentWords = new Set(current.answer.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    for (let j = i + 1; j < answers.length; j++) {
      if (processed.has(answers[j].studentId)) continue;
      if (answers[j].questionId !== current.questionId) continue;

      const otherWords = new Set(answers[j].answer.toLowerCase().split(/\s+/).filter(w => w.length > 3));
      const intersection = [...currentWords].filter(w => otherWords.has(w)).length;
      const union = new Set([...currentWords, ...otherWords]).size;
      const similarity = union > 0 ? intersection / union : 0;

      if (similarity >= threshold) {
        similar.push(answers[j]);
        processed.add(answers[j].studentId);
      }
    }

    if (similar.length > 1) {
      groups.push({
        id: `group-${i}`,
        pattern: `Similar answers (${similar.length} students)`,
        answerSample: current.answer.slice(0, 200),
        count: similar.length,
        studentIds: similar.map(s => s.studentId),
        suggestedMarks: 0, // Will be set after grading one
        confidence: 0.8,
      });
    }
  }

  return groups;
}

// Time saved calculator
export function calculateTimeSaved(
  totalSubmissions: number,
  fiveMarksCount: number,
  tenMarksCount: number,
  autoGradedPercentage: number = 0.6
): {
  manualTimeMinutes: number;
  autoTimeMinutes: number;
  savedMinutes: number;
  savedHours: number;
  percentageSaved: number;
} {
  const fiveMarksManual = 1.25; // 75 seconds = 1.25 min per 5M
  const tenMarksManual = 2.5; // 150 seconds = 2.5 min per 10M
  
  const manualTime = (fiveMarksCount * fiveMarksManual + tenMarksCount * tenMarksManual) * totalSubmissions;
  
  // Auto grading: 70% auto (15 sec each), 30% manual review (50% time)
  const autoGraded = autoGradedPercentage;
  const manualReview = 1 - autoGraded;
  
  const autoTime = 
    (fiveMarksCount * (0.25 * autoGraded + fiveMarksManual * 0.5 * manualReview) +
     tenMarksCount * (0.25 * autoGraded + tenMarksManual * 0.5 * manualReview)) * totalSubmissions;

  const saved = manualTime - autoTime;

  return {
    manualTimeMinutes: Math.round(manualTime),
    autoTimeMinutes: Math.round(autoTime),
    savedMinutes: Math.round(saved),
    savedHours: Math.round(saved / 60 * 10) / 10,
    percentageSaved: Math.round((saved / manualTime) * 100),
  };
}
