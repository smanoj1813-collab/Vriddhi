// prep-app/src/services/api.ts
//
// API client for Vriddhi Prep connecting to shared Vriddhi backend.

import { auth } from '../firebase';

export interface PrepSubject {
  id: string;
  name: string;
  stream:
    | 'commerce'
    | 'management'
    | 'aptitude'
    | 'communication'
    | 'economics'
    | 'finance'
    | 'law'
    | 'strategy'
    | 'operations'
    | 'taxation'
    | 'mathematics'
    | 'statistics'
    | 'science'
    | 'computing'
    | 'communication';
  programs: string[];
  /** UG vs PG. Absent on legacy (BBA) records — treated as undergraduate. */
  degreeLevel?: 'undergraduate' | 'postgraduate';
  yearGroup?: '1st-year' | '2nd-year' | 'final-year' | 'pg-first-year' | 'pg-second-year';
  semester?: number;
  universityRegion?: 'karnataka' | 'national';
  syllabusRef?: string;
  icon: string;
  order: number;
  topicCount: number;
  status: 'draft' | 'in_review' | 'published';
  description?: string;
}

export interface PrepFormula {
  id: string;
  label: string;
  formula: string;
  exampleQ: string;
  exampleA: string;
}

export interface PrepTrick {
  id: string;
  title: string;
  trick: string;
  whenToUse: string;
}

export interface PrepHowToSolve {
  id: string;
  step: string;
  detail: string;
  questionType: string;
}

export interface PyqTag {
  university: string;
  year: number;
  marks: 2 | 5 | 10;
  semester?: number;
}

export interface PrepSubtopic {
  id: string;
  title: string;
  briefMd: string;
}

export interface PrepTopic {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  difficulty: 'basic' | 'core' | 'advanced';
  moduleNumber?: number;
  moduleName?: string;
  subtopics?: string[];
  /** Sub-topics with a short brief each; `subtopics` mirrors the titles. */
  subtopicDetails?: PrepSubtopic[];
  examFrequency?: 'very_high' | 'high' | 'moderate';
  pyqHighlights?: string[];
  explanationMd: string;
  formulas: PrepFormula[];
  tricks: PrepTrick[];
  howToSolve: PrepHowToSolve[];
  featuredQuestionIds: string[];
  status: 'draft' | 'in_review' | 'published';
  generatedBy: 'ai-draft' | 'curator';
  contentVersion: number;
  tier: 'free' | 'premium';
}

export interface UniversalQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'basic' | 'core' | 'advanced';
  status: 'approved' | 'pending' | 'rejected';
  prepTags: {
    subjectId: string;
    topicIds: string[];
    stream?: string;
    program?: string;
  };
  pyqTag?: PyqTag;
}

export interface LearnerProgress {
  topicsCompleted?: Record<
    string,
    {
      lastVisitedAt: string;
      visitedTabs: string[];
      completed?: boolean;
      quizScore?: number;
      quizTotal?: number;
      quizCompletedAt?: string;
    }
  >;
}

const DEFAULT_API_BASE = 'https://asia-south1-vriddhi-academic.cloudfunctions.net/api';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');

async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  let token: string | null = null;
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken().catch(() => null);
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${cleanPath}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

// ── Fallback Embedded Seed Data (Guarantees zero-blank UI even in offline/cold dev) ──
import {
  BBA_SUBJECTS,
  SEEDED_BBA_TOPICS,
  SEEDED_UNIVERSAL_QUESTIONS,
} from '../../../functions/src/data/bbaSeedData';
import {
  BSC_SUBJECTS,
  SEEDED_BSC_TOPICS,
  SEEDED_BSC_QUESTIONS,
} from '../../../functions/src/data/bscSeedData';
import {
  BA_SUBJECTS,
  SEEDED_BA_TOPICS,
  SEEDED_BA_QUESTIONS,
} from '../../../functions/src/data/baSeedData';
import {
  MCOM_SUBJECTS,
  SEEDED_MCOM_TOPICS,
  SEEDED_MCOM_QUESTIONS,
} from '../../../functions/src/data/mcomSeedData';

/**
 * Merged offline catalogue across every program that ships with seed data.
 * Used only when the backend is unreachable, so the Prep App never renders an
 * empty hub. The remote API remains the source of truth whenever it responds.
 */
const ALL_SEED_SUBJECTS: PrepSubject[] = [
  ...BBA_SUBJECTS,
  ...BSC_SUBJECTS,
  ...BA_SUBJECTS,
  ...MCOM_SUBJECTS,
] as PrepSubject[];

const ALL_SEED_TOPICS: Record<string, PrepTopic[]> = {
  ...SEEDED_BBA_TOPICS,
  ...SEEDED_BSC_TOPICS,
  ...SEEDED_BA_TOPICS,
  ...SEEDED_MCOM_TOPICS,
} as Record<string, PrepTopic[]>;

const ALL_SEED_QUESTIONS: UniversalQuestion[] = [
  ...SEEDED_UNIVERSAL_QUESTIONS,
  ...SEEDED_BSC_QUESTIONS,
  ...SEEDED_BA_QUESTIONS,
  ...SEEDED_MCOM_QUESTIONS,
] as UniversalQuestion[];

/** Subjects offered for a given program code, newest programs included. */
function seedSubjectsForProgram(program?: string): PrepSubject[] {
  if (!program || program === 'all') return ALL_SEED_SUBJECTS;
  return ALL_SEED_SUBJECTS.filter((s) => (s.programs || []).includes(program));
}

export async function getSubjects(params?: {
  program?: string;
  stream?: string;
  yearGroup?: string;
  degreeLevel?: string;
}): Promise<PrepSubject[]> {
  try {
    const qs = new URLSearchParams();
    if (params?.program) qs.set('program', params.program);
    if (params?.stream) qs.set('stream', params.stream);
    if (params?.yearGroup) qs.set('yearGroup', params.yearGroup);
    if (params?.degreeLevel) qs.set('degreeLevel', params.degreeLevel);

    const res = await authedFetch(`/prep/subjects${qs.toString() ? `?${qs.toString()}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[PrepApp] Failed to fetch remote subjects, falling back to embedded seed:', err);
  }

  // Fallback to the embedded multi-program catalog.
  let filtered = seedSubjectsForProgram(params?.program);
  if (params?.degreeLevel && params.degreeLevel !== 'all') {
    // Legacy BBA records omit degreeLevel and count as undergraduate.
    filtered = filtered.filter(
      (s) => (s.degreeLevel || 'undergraduate') === params.degreeLevel
    );
  }
  if (params?.yearGroup && params.yearGroup !== 'all') {
    filtered = filtered.filter((s) => s.yearGroup === params.yearGroup);
  }
  if (params?.stream && params.stream !== 'all') {
    filtered = filtered.filter((s) => s.stream === params.stream);
  }
  return filtered;
}

export async function getSubject(subjectId: string): Promise<PrepSubject | null> {
  try {
    const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[PrepApp] Error fetching subject:', err);
  }
  return ALL_SEED_SUBJECTS.find((s) => s.id === subjectId) || null;
}

export async function getTopics(subjectId: string): Promise<PrepTopic[]> {
  try {
    const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}/topics`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[PrepApp] Error fetching topics:', err);
  }
  return ALL_SEED_TOPICS[subjectId] || [];
}

export async function getTopic(subjectId: string, topicId: string): Promise<PrepTopic | null> {
  try {
    const res = await authedFetch(`/prep/subjects/${encodeURIComponent(subjectId)}/topics/${encodeURIComponent(topicId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data) return data.data;
    }
  } catch (err) {
    console.warn('[PrepApp] Error fetching topic:', err);
  }
  const list = ALL_SEED_TOPICS[subjectId] || [];
  return list.find((t) => t.id === topicId) || null;
}

export async function getPracticeQuestions(params: {
  topicId?: string;
  subjectId?: string;
  count?: number;
}): Promise<UniversalQuestion[]> {
  try {
    const qs = new URLSearchParams();
    if (params.topicId) qs.set('topicId', params.topicId);
    if (params.subjectId) qs.set('subjectId', params.subjectId);
    if (params.count) qs.set('count', String(params.count));

    const res = await authedFetch(`/prep/practice?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[PrepApp] Error fetching practice questions:', err);
  }

  // Fallback to seeded questions
  const matches = ALL_SEED_QUESTIONS.filter(
    (q) =>
      (!params.topicId || q.prepTags.topicIds.includes(params.topicId)) ||
      (!params.subjectId || q.prepTags.subjectId === params.subjectId)
  );
  if (matches.length > 0) return matches;

  return [
    {
      id: 'mock-q-1',
      questionText: `What is the primary analytical framework recommended for university evaluations in ${params.topicId || 'this topic'}?`,
      options: [
        'Systematic problem diagnosis followed by formula execution and managerial interpretation',
        'Directly writing numerical results without supporting calculations',
        'Selecting random options in multi-choice sections',
        'Omitting journal entries and balance sheet balancing rules',
      ],
      correctIndex: 0,
      explanation: 'Academic scoring rubrics award maximum credit for structured step-by-step problem solving with clear conceptual commentary.',
      difficulty: 'core',
      status: 'approved',
      prepTags: { subjectId: params.subjectId || '', topicIds: [params.topicId || ''] },
    },
  ];
}

export async function getLearnerProgress(): Promise<LearnerProgress> {
  const local = localStorage.getItem('vriddhi_prep_local_progress');
  const localObj = local ? JSON.parse(local) : { topicsCompleted: {} };

  try {
    if (auth.currentUser) {
      const res = await authedFetch('/prep/progress');
      if (res.ok) {
        const data = await res.json();
        return {
          topicsCompleted: {
            ...localObj.topicsCompleted,
            ...(data.data?.topicsCompleted || {}),
          },
        };
      }
    }
  } catch (err) {
    console.warn('[PrepApp] Progress fetch error, using local storage:', err);
  }
  return localObj;
}

export async function saveLearnerProgress(payload: {
  topicId: string;
  subjectId?: string;
  visitedTab?: string;
  quizScore?: number;
  quizTotal?: number;
  completed?: boolean;
}): Promise<void> {
  // Always update local cache for instant UI responsiveness
  const local = localStorage.getItem('vriddhi_prep_local_progress');
  const localObj = local ? JSON.parse(local) : { topicsCompleted: {} };
  const current = localObj.topicsCompleted[payload.topicId] || {};

  const visitedSet = new Set<string>(current.visitedTabs || []);
  if (payload.visitedTab) visitedSet.add(payload.visitedTab);

  localObj.topicsCompleted[payload.topicId] = {
    ...current,
    lastVisitedAt: new Date().toISOString(),
    visitedTabs: Array.from(visitedSet),
    ...(payload.completed !== undefined ? { completed: payload.completed } : {}),
    ...(payload.quizScore !== undefined ? { quizScore: payload.quizScore, quizTotal: payload.quizTotal } : {}),
  };
  localStorage.setItem('vriddhi_prep_local_progress', JSON.stringify(localObj));

  // Sync to remote if user is signed in
  if (auth.currentUser) {
    try {
      await authedFetch('/prep/progress', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch {}
  }
}

export async function initB2CIdentity(): Promise<void> {
  if (auth.currentUser) {
    try {
      await authedFetch('/prep/auth/init', { method: 'POST' });
    } catch {}
  }
}
