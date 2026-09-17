// src/shared/services/prepContentService.ts
//
// Client service for the PrepInsta-style Prep-Content platform
// (BBA, B.Com, MBA commerce & management curriculum).
// Uses apiBase to resolve the Cloud Function endpoint and authedFetch.

import { apiUrl, assertJsonResponse } from '@/shared/api/apiBase'

export interface PrepSubject {
  id: string
  name: string
  stream: 'commerce' | 'management' | 'aptitude' | 'economics' | 'finance' | 'law' | 'strategy' | 'operations' | 'taxation'
  programs: string[]
  yearGroup?: '1st-year' | '2nd-year' | 'final-year'
  semester?: number
  universityRegion?: 'karnataka' | 'national'
  syllabusRef?: string
  icon: string
  order: number
  topicCount: number
  status: 'draft' | 'in_review' | 'published'
  description?: string
  updatedAt?: string
}

export interface PrepFormula {
  id: string
  label: string
  formula: string
  exampleQ: string
  exampleA: string
}

export interface PrepTrick {
  id: string
  title: string
  trick: string
  whenToUse: string
}

export interface PrepHowToSolve {
  id: string
  step: string
  detail: string
  questionType: string
}

export interface PyqTag {
  university: string
  year: number
  marks: 2 | 5 | 10
  semester?: number
}

export interface PrepTopic {
  id: string
  subjectId: string
  title: string
  order: number
  difficulty: 'basic' | 'core' | 'advanced'
  moduleNumber?: number
  moduleName?: string
  subtopics?: string[]
  examFrequency?: 'very_high' | 'high' | 'moderate'
  pyqHighlights?: string[]
  explanationMd: string
  formulas: PrepFormula[]
  tricks: PrepTrick[]
  howToSolve: PrepHowToSolve[]
  featuredQuestionIds: string[]
  status: 'draft' | 'in_review' | 'published'
  generatedBy: 'ai-draft' | 'curator'
  contentVersion: number
  reviewedBy?: string | null
  publishedAt?: string | null
  tier: 'free' | 'premium'
  updatedAt?: string
}

export interface UniversalQuestion {
  id: string
  questionText: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: 'basic' | 'core' | 'advanced'
  status: 'approved' | 'pending' | 'rejected'
  prepTags: {
    subjectId: string
    topicIds: string[]
    stream?: string
    program?: string
  }
}

export interface LearnerProgressData {
  topicsCompleted?: Record<
    string,
    {
      lastVisitedAt: string
      visitedTabs: string[]
      completed?: boolean
      quizScore?: number
      quizTotal?: number
      quizCompletedAt?: string
    }
  >
  updatedAt?: string
}

async function getBearerToken(): Promise<string | null> {
  const stored =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('vriddhi_auth_token')
  if (stored) return stored
  try {
    const { auth } = await import('@/Firebase/config')
    if (auth.currentUser) return await auth.currentUser.getIdToken()
  } catch {}
  return null
}

async function authedFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
  const token = await getBearerToken()
  const url = apiUrl(endpoint)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(url, {
    ...init,
    headers,
  })
  await assertJsonResponse(response, url)
  return response
}

export async function fetchPrepSubjects(params?: {
  program?: string
  stream?: string
  yearGroup?: string
}): Promise<PrepSubject[]> {
  const qs = new URLSearchParams()
  if (params?.program) qs.set('program', params.program)
  if (params?.stream) qs.set('stream', params.stream)
  if (params?.yearGroup) qs.set('yearGroup', params.yearGroup)

  const res = await authedFetch(`/prep/subjects${qs.toString() ? `?${qs.toString()}` : ''}`, { method: 'GET' })
  const data = await res.json()
  return data.data || []
}

export async function fetchPrepSubject(subjectId: string): Promise<PrepSubject> {
  const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}`, { method: 'GET' })
  const data = await res.json()
  return data.data
}

export async function fetchPrepTopics(subjectId: string): Promise<PrepTopic[]> {
  const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}/topics`, { method: 'GET' })
  const data = await res.json()
  return data.data || []
}

export async function fetchPrepTopic(subjectId: string, topicId: string): Promise<PrepTopic> {
  const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}/topics/${encodeURIComponent(topicId)}`, { method: 'GET' })
  const data = await res.json()
  return data.data
}

export async function generatePrepDraft(payload: {
  subjectId: string
  topicId: string
  title: string
  stream?: string
  difficulty?: string
  program?: string
}): Promise<{ data: PrepTopic; provider: string; tokensIn: number; tokensOut: number }> {
  const res = await authedFetch('/prep/content/draft', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function publishPrepTopic(payload: {
  subjectId: string
  topicId: string
}): Promise<{ success: boolean; message: string; publishedCount: number }> {
  const res = await authedFetch('/prep/content/publish', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function savePrepTopic(
  payload: Partial<PrepTopic> & { subjectId: string; topicId: string }
): Promise<{ success: boolean; data: PrepTopic }> {
  const res = await authedFetch('/prep/content/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function savePrepSubject(
  payload: Partial<PrepSubject> & { id: string; name: string; stream: string }
): Promise<{ success: boolean; data: PrepSubject }> {
  const res = await authedFetch('/prep/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function fetchPracticeQuestions(params: {
  topicId?: string
  subjectId?: string
  count?: number
}): Promise<UniversalQuestion[]> {
  const qs = new URLSearchParams()
  if (params.topicId) qs.set('topicId', params.topicId)
  if (params.subjectId) qs.set('subjectId', params.subjectId)
  if (params.count) qs.set('count', String(params.count))

  const res = await authedFetch(`/prep/practice?${qs.toString()}`, { method: 'GET' })
  const data = await res.json()
  return data.data || []
}

export async function fetchLearnerProgress(): Promise<LearnerProgressData> {
  const res = await authedFetch('/prep/progress', { method: 'GET' })
  const data = await res.json()
  return data.data || { topicsCompleted: {} }
}

export async function recordLearnerProgress(payload: {
  topicId: string
  subjectId?: string
  visitedTab?: string
  quizScore?: number
  quizTotal?: number
  completed?: boolean
}): Promise<{ success: boolean; data: any }> {
  const res = await authedFetch('/prep/progress', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function seedBbaCatalog(): Promise<{
  success: boolean
  message: string
  subjectCount: number
  topicCount: number
  questionCount: number
}> {
  const res = await authedFetch('/prep/seed-bba', {
    method: 'POST',
  })
  return res.json()
}

export interface PrepSeedProgramResult {
  code: string
  label: string
  subjectCount: number
  topicCount: number
  questionCount: number
  valid: boolean
  errorCount: number
  warningCount: number
}

export interface PrepSeedAllResult {
  success: boolean
  message: string
  programs: string[]
  unseedable?: string[]
  subjectCount: number
  topicCount: number
  questionCount: number
  perProgram: PrepSeedProgramResult[]
}

/**
 * Master seeder: every program that ships with seed data (BBA, B.Com, B.Sc,
 * BA, M.Com), or a chosen subset such as `['ba']` / `'ba,bcom'`. The old
 * studio button only wired up BBA, which is why "seeded B.Com and BA" was
 * impossible from the UI — this is the endpoint those programs live in.
 */
export async function seedPrepCatalog(programs?: string | string[]): Promise<PrepSeedAllResult> {
  const res = await authedFetch('/prep/seed-all', {
    method: 'POST',
    body: JSON.stringify(programs ? { programs } : { programs: 'all' }),
  })
  return res.json()
}
