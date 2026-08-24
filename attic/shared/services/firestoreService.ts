// src/shared/services/firestoreService.ts
// ─── Firestore Database Operations ────────────────────────

import { db } from '@/Firebase/config'
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'

const QUESTIONS_COLLECTION = 'questions'
const GENERATION_LOGS = 'aiGenerationLogs'

// ─── Self-contained types (no external import) ───────────

type QuestionType = 'mcq' | 'true_false' | 'fill_blank' | 'short_answer' | 'long_answer' | 'match' | 'assertion'
type DifficultyLevel = 'easy' | 'medium' | 'hard'

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

interface QuestionBankEntry {
  id: string
  text: string
  subject: string
  topic: string
  type: QuestionType
  difficulty: DifficultyLevel
  unit: string
  marks: number
  options?: QuestionOption[]
  correctAnswer?: string
  explanation?: string
  tags: string[]
  batch: string
  branch: string
  collegeId: string
  createdBy: string
  createdByName: string
  isPYQ: boolean
  status: string
  usageCount: number
  linkedPaperIds: string[]
  searchKeywords: string[]
  createdAt: string
  updatedAt: string
}

interface GeneratedQuestion {
  text: string
  subject?: string
  topic: string
  type: QuestionType
  difficulty: DifficultyLevel
  unit?: string
  marks: number
  options?: string[]
  correctAnswer?: string
  explanation?: string
  tags: string[]
}

// ─── Save Questions to Bank ───────────────────────────────
export async function saveQuestionsToBank(
  questions: GeneratedQuestion[],
  collegeId: string,
  createdBy: string,
  createdByName: string,
  batch?: string,
  branch?: string
): Promise<QuestionBankEntry[]> {
  const saved: QuestionBankEntry[] = []

  for (const q of questions) {
    const searchKeywords = [
      q.text.toLowerCase(),
      q.topic.toLowerCase(),
      q.subject?.toLowerCase() || '',
      ...(q.tags || []).map((t: string) => t.toLowerCase()),
    ].filter(Boolean)

    const docRef = doc(collection(db, QUESTIONS_COLLECTION))
    const entry: Omit<QuestionBankEntry, 'id'> = {
      text: q.text,
      subject: q.tags[0] || 'General',
      topic: q.topic,
      type: q.type,
      difficulty: q.difficulty,
      unit: q.unit || '',
      marks: q.marks,
      options: q.options
        ? q.options.map((opt: string, i: number) => ({
            id: String.fromCharCode(65 + i),
            text: opt,
            isCorrect: q.correctAnswer === String.fromCharCode(65 + i),
          }))
        : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      tags: q.tags,
      batch: batch || '',
      branch: branch || '',
      collegeId,
      createdBy,
      createdByName,
      isPYQ: false,
      status: 'active',
      usageCount: 0,
      linkedPaperIds: [],
      searchKeywords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(docRef, entry)
    saved.push({ id: docRef.id, ...entry })
  }

  return saved
}

// ─── Log Generation ─────────────────────────────────────
export async function logGeneration(
  collegeId: string,
  userId: string,
  config: Record<string, unknown>,
  result: Record<string, unknown>,
  status: 'success' | 'failed'
): Promise<void> {
  await addDoc(collection(db, GENERATION_LOGS), {
    collegeId,
    userId,
    config,
    result:
      status === 'success'
        ? {
            questionCount: (result.questions as unknown[])?.length,
            generationTime: result.generationTime,
            provider: result.provider,
            tokensUsed: result.tokensUsed,
            costEstimate: result.costEstimate,
          }
        : { error: result.error },
    status,
    timestamp: serverTimestamp(),
  })
}

// ─── Get Generation Stats ─────────────────────────────────
export async function getGenerationStats(
  collegeId: string,
  days: number = 30
): Promise<Record<string, unknown>> {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const q = query(
    collection(db, GENERATION_LOGS),
    where('collegeId', '==', collegeId),
    where('timestamp', '>=', since)
  )

  const snapshot = await getDocs(q)

  const stats: Record<string, unknown> = {
    totalGenerations: 0,
    successfulGenerations: 0,
    failedGenerations: 0,
    totalQuestionsGenerated: 0,
    totalCost: 0,
    byProvider: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    byDifficulty: {} as Record<string, number>,
  }

  snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data()
    ;(stats.totalGenerations as number)++

    if (data.status === 'success') {
      ;(stats.successfulGenerations as number)++
      ;(stats.totalQuestionsGenerated as number) +=
        data.result?.questionCount || 0
      ;(stats.totalCost as number) += data.result?.costEstimate || 0
      const provider = data.result?.provider as string
      if (provider) {
        ;(stats.byProvider as Record<string, number>)[provider] =
          ((stats.byProvider as Record<string, number>)[provider] || 0) + 1
      }
    } else {
      ;(stats.failedGenerations as number)++
    }

    const qType = data.config?.questionType as string
    if (qType) {
      ;(stats.byType as Record<string, number>)[qType] =
        ((stats.byType as Record<string, number>)[qType] || 0) + 1
    }
    const diff = data.config?.difficulty as string
    if (diff) {
      ;(stats.byDifficulty as Record<string, number>)[diff] =
        ((stats.byDifficulty as Record<string, number>)[diff] || 0) + 1
    }
  })

  return stats
}

// ─── Check Duplicate Questions ──────────────────────────
export async function checkDuplicates(
  collegeId: string,
  questions: GeneratedQuestion[],
  threshold: number = 0.85
): Promise<{ duplicates: string[]; similar: string[] }> {
  const duplicates: string[] = []
  const similar: string[] = []

  for (const q of questions) {
    const searchTerm = q.text.toLowerCase().substring(0, 30)
    const qry = query(
      collection(db, QUESTIONS_COLLECTION),
      where('collegeId', '==', collegeId),
      where('searchKeywords', 'array-contains', searchTerm),
      limit(10)
    )

    const snapshot = await getDocs(qry)

    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const existing = doc.data()
      const similarity = calculateSimilarity(q.text, existing.text as string)
      if (similarity >= threshold) {
        duplicates.push(q.text.substring(0, 100))
      } else if (similarity >= 0.6) {
        similar.push(q.text.substring(0, 100))
      }
    })
  }

  return { duplicates, similar }
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/))
  const wordsB = new Set(b.toLowerCase().split(/\s+/))
  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}
