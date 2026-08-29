export interface ServerQuestion {
  id: string
  questionId: string
  order: number
  text: string
  type: string
  marks: number
  negativeMarks: number
  options: Array<{ id: string; text: string; isCorrect?: boolean }>
  correctAnswer?: string | string[]
  tolerance?: number
  explanation?: string
  sectionId?: string
  sectionName?: string
  difficulty?: string
  imageUrl?: string
  caseText?: string
  matchPairs?: Array<{ left: string; right: string }>
}

export interface ServerAnswer {
  questionId: string
  selectedOptionId?: string
  selectedOptionIds?: string[]
  textAnswer?: string
  numericalAnswer?: number
  matchedPairs?: Array<{ left: string; right: string }>
  isFlagged: boolean
}

export interface QuestionGrade {
  questionId: string
  isObjective: boolean
  status: 'correct' | 'incorrect' | 'unattempted' | 'pending_manual'
  marksObtained: number | null
}

export interface PaperGrade {
  autoScore: number
  autoMax: number
  manualMax: number
  correctCount: number
  incorrectCount: number
  unattemptedCount: number
  needsManualGrading: boolean
  perQuestion: QuestionGrade[]
}

const OBJECTIVE_OPTION_TYPES = new Set([
  'mcq',
  'single_choice',
  'true_false',
  'assertion_reason',
  'case_based',
])

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en')
}

function selectedCorrectIds(question: ServerQuestion): string[] {
  const flagged = question.options.filter((option) => option.isCorrect).map((option) => option.id)
  if (flagged.length > 0) return flagged
  const raw = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : question.correctAnswer === undefined
      ? []
      : [question.correctAnswer]
  return raw.map(String).map((answer) => {
    const matchingOption = question.options.find((option) =>
      option.id === answer || normalizeText(option.text) === normalizeText(answer)
    )
    return matchingOption?.id || answer
  })
}

function hasAnswer(answer: ServerAnswer | undefined): boolean {
  if (!answer) return false
  return Boolean(
    answer.selectedOptionId
    || answer.selectedOptionIds?.length
    || answer.textAnswer?.trim()
    || answer.numericalAnswer !== undefined
    || answer.matchedPairs?.length
  )
}

function equalSets(left: string[], right: string[]): boolean {
  const a = [...new Set(left.map(String))].sort()
  const b = [...new Set(right.map(String))].sort()
  return a.length === b.length && a.every((value, index) => value === b[index])
}

/** Grades only answer forms whose correctness can be determined exactly. */
export function gradeAssessmentPaper(
  questions: ServerQuestion[],
  answers: ServerAnswer[]
): PaperGrade {
  const byQuestion = new Map(answers.map((answer) => [answer.questionId, answer]))
  const result: PaperGrade = {
    autoScore: 0,
    autoMax: 0,
    manualMax: 0,
    correctCount: 0,
    incorrectCount: 0,
    unattemptedCount: 0,
    needsManualGrading: false,
    perQuestion: [],
  }

  for (const question of questions) {
    const type = question.type.toLowerCase().replace(/\s+/g, '_')
    const answer = byQuestion.get(question.id) || byQuestion.get(question.questionId)
    const marks = Math.max(0, question.marks)
    const penalty = Math.max(0, question.negativeMarks)
    const correctIds = selectedCorrectIds(question)
    const optionBased = OBJECTIVE_OPTION_TYPES.has(type) && correctIds.length === 1
    const multiSelect = type === 'multi_select' && correctIds.length > 0
    const exactText = type === 'fill_in_blank' && question.correctAnswer !== undefined
    const numerical = type === 'numerical' && question.correctAnswer !== undefined
    const isObjective = optionBased || multiSelect || exactText || numerical

    if (!isObjective) {
      result.manualMax += marks
      const attempted = hasAnswer(answer)
      if (attempted) result.needsManualGrading = true
      result.perQuestion.push({
        questionId: question.id,
        isObjective: false,
        status: attempted ? 'pending_manual' : 'unattempted',
        marksObtained: null,
      })
      if (!hasAnswer(answer)) result.unattemptedCount += 1
      continue
    }

    result.autoMax += marks
    if (!hasAnswer(answer)) {
      result.unattemptedCount += 1
      result.perQuestion.push({
        questionId: question.id,
        isObjective: true,
        status: 'unattempted',
        marksObtained: 0,
      })
      continue
    }

    let correct = false
    if (optionBased) {
      correct = String(answer?.selectedOptionId || '') === correctIds[0]
    } else if (multiSelect) {
      correct = equalSets(answer?.selectedOptionIds || [], correctIds)
    } else if (exactText) {
      const accepted = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer as string]
      correct = accepted.some((value) => normalizeText(value) === normalizeText(answer?.textAnswer))
    } else if (numerical) {
      const expected = Number(Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer)
      const actual = Number(answer?.numericalAnswer)
      const tolerance = Math.max(0, Number(question.tolerance) || 0)
      correct = Number.isFinite(expected)
        && Number.isFinite(actual)
        && Math.abs(expected - actual) <= tolerance
    }

    if (correct) {
      result.autoScore += marks
      result.correctCount += 1
      result.perQuestion.push({
        questionId: question.id,
        isObjective: true,
        status: 'correct',
        marksObtained: marks,
      })
    } else {
      result.autoScore -= penalty
      result.incorrectCount += 1
      result.perQuestion.push({
        questionId: question.id,
        isObjective: true,
        status: 'incorrect',
        marksObtained: -penalty,
      })
    }
  }

  return result
}

export function gradeFromPercentage(percentage: number): { grade: string; gradePoint: number } {
  if (percentage >= 90) return { grade: 'A+', gradePoint: 10 }
  if (percentage >= 80) return { grade: 'A', gradePoint: 9 }
  if (percentage >= 70) return { grade: 'B+', gradePoint: 8 }
  if (percentage >= 60) return { grade: 'B', gradePoint: 7 }
  if (percentage >= 50) return { grade: 'C', gradePoint: 6 }
  if (percentage >= 40) return { grade: 'D', gradePoint: 5 }
  return { grade: 'F', gradePoint: 0 }
}
