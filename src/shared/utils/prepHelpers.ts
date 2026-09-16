// src/shared/utils/prepHelpers.ts
//
// Pure helpers for Prep content UI, progress tracking, and formatting.
// Free of React/DOM dependencies for unit testing.

import { PrepTopic } from '@/shared/services/prepContentService'

export function filterTopicsByDifficulty(
  topics: PrepTopic[],
  difficulty?: string | null
): PrepTopic[] {
  if (!Array.isArray(topics)) return []
  if (!difficulty || difficulty === 'all') return [...topics]
  return topics.filter((t) => t.difficulty?.toLowerCase() === difficulty.toLowerCase())
}

export function calculateSubjectProgress(
  topics: PrepTopic[],
  completedMap?: Record<string, { completed?: boolean }> | null
): { completed: number; total: number; percentage: number } {
  if (!Array.isArray(topics) || topics.length === 0) {
    return { completed: 0, total: 0, percentage: 0 }
  }

  const total = topics.length
  let completed = 0

  if (completedMap) {
    for (const t of topics) {
      if (completedMap[t.id]?.completed) {
        completed++
      }
    }
  }

  const percentage = Math.round((completed / total) * 100)
  return { completed, total, percentage }
}

export function formatStreamLabel(stream?: string | null): string {
  if (!stream) return 'General'
  const mapping: Record<string, string> = {
    management: 'Management & OB',
    commerce: 'Commerce & Accounting',
    economics: 'Managerial Economics',
    aptitude: 'Quantitative Aptitude & Stats',
    finance: 'Financial Management',
    law: 'Business & Company Law',
    strategy: 'Strategic Management',
    operations: 'Operations & SCM',
    taxation: 'Taxation & GST',
  }
  return mapping[stream.toLowerCase()] || stream.charAt(0).toUpperCase() + stream.slice(1)
}

export function formatDifficultyBadge(difficulty?: string | null): {
  label: string
  color: string
  bg: string
} {
  const norm = (difficulty || '').toLowerCase()
  switch (norm) {
    case 'basic':
      return { label: 'Foundation', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' }
    case 'advanced':
      return { label: 'Advanced', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' }
    case 'core':
    default:
      return { label: 'Core', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' }
  }
}

export function cleanKatexFormula(formula?: string | null): string {
  if (!formula) return ''
  return formula.trim().replace(/^\\\[/, '').replace(/\\\]$/, '').trim()
}
