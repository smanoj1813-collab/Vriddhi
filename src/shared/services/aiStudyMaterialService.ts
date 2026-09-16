// ═══════════════════════════════════════════════════════════════════════
// src/shared/services/aiStudyMaterialService.ts
// Frontend client for the AI Study Material Generator Agent
// ═══════════════════════════════════════════════════════════════════════

import { apiUrl, assertJsonResponse } from '@/shared/api/apiBase';

export interface KeyConceptItem {
  term: string;
  definition: string;
  formulaOrRule?: string;
  importance?: string;
}

export interface WorkedStep {
  step: string;
  details: string;
}

export interface WorkedExample {
  scenario: string;
  steps: WorkedStep[];
  solution: string;
}

export interface ExamPrepQuestion {
  question: string;
  expectedAnswer: string;
  marks: number;
  bloomLevel?: string;
  examTip?: string;
}

export interface AIStudyPack {
  title: string;
  subject: string;
  overview: string;
  quickSummaryPoints: string[];
  keyConcepts: KeyConceptItem[];
  workedExample: WorkedExample;
  examPrep: ExamPrepQuestion[];
}

export interface FetchStudyMaterialInput {
  subject: string;
  topic: string;
  courseName?: string;
  courseCode?: string;
  moduleName?: string;
  moduleNo?: number | string;
  branch?: string;
  semester?: number | string;
  forceRefresh?: boolean;
}

export interface FetchStudyMaterialResponse {
  success: boolean;
  source: 'cache' | 'generated';
  cachedAt?: string;
  cacheKey?: string;
  data: AIStudyPack;
}

async function getBearerToken(): Promise<string | null> {
  const stored =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('vriddhi_auth_token');
  if (stored) return stored;
  try {
    const { auth } = await import('@/Firebase/config');
    if (auth.currentUser) return await auth.currentUser.getIdToken();
  } catch {}
  return null;
}

export async function fetchAIStudyMaterial(
  input: FetchStudyMaterialInput
): Promise<FetchStudyMaterialResponse> {
  const token = await getBearerToken();
  const endpoint = '/ai/study-material';
  const url = apiUrl(endpoint);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify(input),
  });

  await assertJsonResponse(response, url);
  return response.json();
}
