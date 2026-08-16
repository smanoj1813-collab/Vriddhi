// ============================================================
// VRIDDHI - Unified useQuestionBank Hook
// ============================================================
// Bridges existing college-specific question bank with new
// universal question repository
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/context/AuthContext';

// Existing types (your current system)
import {
  type Question as CollegeQuestion,
  type QuestionFilters as CollegeFilters,
  type PaginatedResult as CollegePaginatedResult,
  type BulkImportResult as CollegeBulkResult,
  type QuestionBankStats as CollegeStats,
} from '../types/questionBank';

import {
  getQuestions as getCollegeQuestions,
  getAllQuestions as getAllCollegeQuestions,
  getQuestionById as getCollegeQuestionById,
  createQuestion as createCollegeQuestion,
  updateQuestion as updateCollegeQuestion,
  deleteQuestion as deleteCollegeQuestion,
  getQuestionStats as getCollegeStats,
  bulkImportQuestions as collegeBulkImport,
  linkQuestionToPaper as collegeLinkQuestion,
  unlinkQuestionFromPaper as collegeUnlinkQuestion,
} from '../api/questionBankApi';

// NEW Universal types
import {
  type QuestionMetadata,
  type QuestionContent,
  type QuestionFilter as UniversalFilter,
  type PaginationParams,
  type PaginatedResult as UniversalPaginatedResult,
  type Paper,
  type PaperFilter,
  type PaperTemplate,
  type PaperGenerationConfig,
  type PaperGenerationResult,
  type QuestionReview,
  type ReviewStatus,
  type QuestionBankStats as UniversalStats,
  type TopicStats,
  type ApiResponse,
  type CacheEntry,
  DEFAULTS,
} from '../../admin/types/universalQuestionBank';

// NEW Universal APIs
import {
  questionMetadataApi,
  paperApi,
  paperTemplateApi,
  reviewQueueApi,
  statsApi,
} from '../api/questionBankApi';

import {
  questionStorageApi,
  paperStorageApi,
  paperGeneratorApi,
  paperPreviewApi,
} from '../api/cloudStorageApi';

// ============================================================
// CACHE MANAGEMENT (for universal system)
// ============================================================

class QuestionCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl = DEFAULTS.CACHE_TTL): void {
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest) {
        this.cache.delete(oldest);
      }
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const globalCache = new QuestionCache();

// ============================================================
// UNIFIED HOOK
// ============================================================

export interface UseQuestionBankReturn {
  // -- EXISTING college-specific state (backward compatible) --
  questions: CollegeQuestion[];
  total: number;
  loading: boolean;
  error: string | null;
  stats: CollegeStats | null;
  hasMore: boolean;
  filters: CollegeFilters;

  // -- NEW universal state --
  universalQuestions: QuestionMetadata[];
  selectedQuestion: QuestionContent | null;
  papers: Paper[];
  templates: PaperTemplate[];
  reviews: QuestionReview[];
  universalStats: UniversalStats | null;
  topicStats: TopicStats | null;

  loadingUniversal: {
    questions: boolean;
    questionDetail: boolean;
    papers: boolean;
    templates: boolean;
    reviews: boolean;
    stats: boolean;
    generating: boolean;
    saving: boolean;
  };

  errorsUniversal: {
    questions: string | null;
    questionDetail: string | null;
    papers: string | null;
    templates: string | null;
    reviews: string | null;
    stats: string | null;
    generate: string | null;
    save: string | null;
  };

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };

  // -- EXISTING college-specific actions --
  fetchQuestions: (overrideFilters?: CollegeFilters & { page?: number; limit?: number }) => Promise<CollegePaginatedResult<CollegeQuestion>>;
  fetchAllQuestions: (limit?: number) => Promise<CollegeQuestion[]>;
  fetchQuestionById: (id: string) => Promise<CollegeQuestion | null>;
  addQuestion: (data: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => Promise<CollegeQuestion>;
  editQuestion: (id: string, data: Partial<CollegeQuestion>) => Promise<CollegeQuestion>;
  removeQuestion: (id: string) => Promise<void>;
  search: (query: string, extraFilters?: CollegeFilters) => Promise<CollegePaginatedResult<CollegeQuestion>>;
  fetchStats: () => Promise<CollegeStats>;
  bulkImport: (questionsData: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>[]) => Promise<CollegeBulkResult>;
  importQuestions: (questionsData: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>[]) => Promise<CollegeBulkResult>;
  toggleStatus: (id: string) => Promise<CollegeQuestion>;
  linkToPaper: (questionId: string, paperId: string) => Promise<CollegeQuestion | null>;
  unlinkFromPaper: (questionId: string, paperId: string) => Promise<CollegeQuestion | null>;
  setFilter: (key: keyof CollegeFilters, value: unknown) => void;
  clearFilters: () => void;
  refresh: () => Promise<CollegePaginatedResult<CollegeQuestion>>;
  loadMore: () => Promise<CollegePaginatedResult<CollegeQuestion> | undefined>;

  // -- NEW universal actions --
  searchUniversalQuestions: (filter: UniversalFilter, page?: number) => Promise<void>;
  loadQuestionDetail: (questionId: string) => Promise<void>;
  loadPapers: (filter: PaperFilter, page?: number) => Promise<void>;
  loadTemplates: () => Promise<void>;
  loadPendingReviews: () => Promise<void>;
  loadUniversalStats: () => Promise<void>;
  loadTopicStats: (topicId: string) => Promise<void>;
  generatePaper: (config: PaperGenerationConfig, createdBy: {
    userId: string;
    userName: string;
    collegeId: string | null;
    collegeName: string;
    role: 'superadmin' | 'admin' | 'faculty';
  }) => Promise<PaperGenerationResult | null>;
  generateFromTemplate: (
    templateId: string,
    title: string,
    description: string,
    createdBy: {
      userId: string;
      userName: string;
      collegeId: string | null;
      collegeName: string;
      role: 'superadmin' | 'admin' | 'faculty';
    },
    visibility: 'public' | 'college_only' | 'shared_with',
    sharedWith?: string[]
  ) => Promise<PaperGenerationResult | null>;
  previewPaper: (paperId: string) => Promise<{
    paper: Paper;
    questions: Array<{
      questionId: string;
      order: number;
      marks: number;
      content: QuestionContent;
    }>;
  } | null>;
  getStudentPaper: (paperId: string) => Promise<{
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    questions: Array<{
      order: number;
      marks: number;
      questionText: string;
      options: Array<{ id: string; text: string }>;
      hasImage: boolean;
      imageUrl?: string;
    }>;
  } | null>;
  submitReview: (review: Omit<QuestionReview, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  approveReview: (reviewId: string, reviewerId: string, reviewerName: string, comment?: string) => Promise<boolean>;
  rejectReview: (reviewId: string, reviewerId: string, reviewerName: string, comment?: string) => Promise<boolean>;
  invalidateCache: (pattern?: string) => void;
  clearUniversalErrors: () => void;
}

export function useQuestionBank(): UseQuestionBankReturn {
  const { user } = useAuth();
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || '';
  const userId = user?.id || '';
  const userName = user?.name || 'Unknown';

  // ============================================================
  // EXISTING COLLEGE-SPECIFIC STATE
  // ============================================================
  const [questions, setQuestions] = useState<CollegeQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollegeStats | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFiltersState] = useState<CollegeFilters>({});
  const lastDocRef = useRef<unknown>(null);
  const pageSizeRef = useRef<number>(20);

  // ============================================================
  // NEW UNIVERSAL STATE
  // ============================================================
  const [universalQuestions, setUniversalQuestions] = useState<QuestionMetadata[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionContent | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [templates, setTemplates] = useState<PaperTemplate[]>([]);
  const [reviews, setReviews] = useState<QuestionReview[]>([]);
  const [universalStats, setUniversalStats] = useState<UniversalStats | null>(null);
  const [topicStats, setTopicStats] = useState<TopicStats | null>(null);

  const [loadingUniversal, setLoadingUniversal] = useState({
    questions: false,
    questionDetail: false,
    papers: false,
    templates: false,
    reviews: false,
    stats: false,
    generating: false,
    saving: false,
  });

  const [errorsUniversal, setErrorsUniversal] = useState<{
    questions: string | null;
    questionDetail: string | null;
    papers: string | null;
    templates: string | null;
    reviews: string | null;
    stats: string | null;
    generate: string | null;
    save: string | null;
  }>({
    questions: null,
    questionDetail: null,
    papers: null,
    templates: null,
    reviews: null,
    stats: null,
    generate: null,
    save: null,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULTS.PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ============================================================
  // EXISTING COLLEGE-SPECIFIC ACTIONS (unchanged)
  // ============================================================

  const fetchQuestions = useCallback(
    async (overrideFilters?: CollegeFilters & { page?: number; limit?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const mergedFilters = { ...filters, ...overrideFilters };
        const pageSize = overrideFilters?.limit || pageSizeRef.current;
        pageSizeRef.current = pageSize;

        const result: CollegePaginatedResult<CollegeQuestion> = await getCollegeQuestions(
          collegeId,
          mergedFilters,
          pageSize,
          lastDocRef.current as any
        );

        setQuestions(result.data);
        setTotal(result.total);
        setHasMore(result.hasMore || false);
        lastDocRef.current = result.lastDoc || null;
        return result;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch questions');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collegeId, filters]
  );

  const fetchAllQuestions = useCallback(
    async (limit?: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllCollegeQuestions(collegeId, limit || 100);
        setQuestions(data);
        setTotal(data.length);
        setHasMore(false);
        lastDocRef.current = null;
        return data;
      } catch (err: any) {
        setError(err.message || 'Failed to fetch all questions');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collegeId]
  );

  const fetchQuestionById = useCallback(
    async (id: string): Promise<CollegeQuestion | null> => {
      setLoading(true);
      setError(null);
      try {
        return await getCollegeQuestionById(id);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch question');
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addQuestion = useCallback(
    async (data: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'collegeId' | 'createdBy' | 'createdByName' | 'usageCount' | 'linkedPaperIds'>) => {
      setLoading(true);
      setError(null);
      try {
        const newQuestion = await createCollegeQuestion(collegeId, data as any);
        setQuestions((prev) => [newQuestion, ...prev]);
        setTotal((prev) => prev + 1);
        return newQuestion;
      } catch (err: any) {
        setError(err.message || 'Failed to create question');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collegeId]
  );

  const editQuestion = useCallback(
    async (id: string, data: Partial<CollegeQuestion>) => {
      setLoading(true);
      setError(null);
      try {
        await updateCollegeQuestion(id, data);
        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...data } : q))
        );
        return { ...questions.find(q => q.id === id), ...data } as CollegeQuestion;
      } catch (err: any) {
        setError(err.message || 'Failed to update question');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [questions]
  );

  const removeQuestion = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await deleteCollegeQuestion(id);
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err: any) {
        setError(err.message || 'Failed to delete question');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const search = useCallback(
    async (query: string, extraFilters?: CollegeFilters) => {
      setLoading(true);
      setError(null);
      try {
        const searchFilters = { ...extraFilters, searchQuery: query };
        const result = await getCollegeQuestions(collegeId, searchFilters, pageSizeRef.current);
        setQuestions(result.data);
        setTotal(result.total);
        setHasMore(result.hasMore || false);
        lastDocRef.current = result.lastDoc || null;
        return result;
      } catch (err: any) {
        setError(err.message || 'Search failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collegeId]
  );

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rawStats = await getCollegeStats(collegeId);
      const result: CollegeStats = {
        totalQuestions: rawStats.total,
        total: rawStats.total,
        bySubject: rawStats.bySubject,
        byType: rawStats.byType,
        byDifficulty: rawStats.byDifficulty,
        byStatus: {},
        byBatch: rawStats.byBatch,
        byBranch: rawStats.byBranch,
        pyqCount: rawStats.pyqCount,
        linkedCount: rawStats.linkedCount,
        unusedCount: rawStats.unusedCount,
        recentlyAdded: questions.slice(0, 5),
        mostUsed: questions.filter(q => (q.usageCount || 0) > 0).slice(0, 5),
      };
      setStats(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stats');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, questions]);

  const bulkImport = useCallback(
    async (questionsData: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>[]) => {
      setLoading(true);
      setError(null);
      try {
        const result: CollegeBulkResult = await collegeBulkImport(collegeId, questionsData);
        await fetchQuestions();
        return result;
      } catch (err: any) {
        setError(err.message || 'Bulk import failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [collegeId, fetchQuestions]
  );

  const importQuestions = useCallback(
    async (questionsData: Omit<CollegeQuestion, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds'>[]) => {
      return bulkImport(questionsData);
    },
    [bulkImport]
  );

  const toggleStatus = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const current = questions.find(q => q.id === id);
        const newStatus = current?.status === 'active' ? 'inactive' : 'active';
        await updateCollegeQuestion(id, { status: newStatus });
        const updated = { ...current, status: newStatus } as CollegeQuestion;
        setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
        return updated;
      } catch (err: any) {
        setError(err.message || 'Failed to toggle status');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [questions]
  );

  const linkToPaper = useCallback(
    async (questionId: string, paperId: string) => {
      setLoading(true);
      setError(null);
      try {
        await collegeLinkQuestion(questionId, paperId);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, linkedPaperIds: [...(q.linkedPaperIds || []), paperId] }
              : q
          )
        );
        return questions.find(q => q.id === questionId) || null;
      } catch (err: any) {
        setError(err.message || 'Failed to link question');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [questions]
  );

  const unlinkFromPaper = useCallback(
    async (questionId: string, paperId: string) => {
      setLoading(true);
      setError(null);
      try {
        await collegeUnlinkQuestion(questionId, paperId);
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, linkedPaperIds: (q.linkedPaperIds || []).filter(pid => pid !== paperId) }
              : q
          )
        );
        return questions.find(q => q.id === questionId) || null;
      } catch (err: any) {
        setError(err.message || 'Failed to unlink question');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [questions]
  );

  const setFilter = useCallback(
    (key: keyof CollegeFilters, value: unknown) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFiltersState({});
    lastDocRef.current = null;
  }, []);

  const refresh = useCallback(() => {
    lastDocRef.current = null;
    return fetchQuestions();
  }, [fetchQuestions]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return undefined;
    setLoading(true);
    try {
      const result = await getCollegeQuestions(collegeId, filters, pageSizeRef.current, lastDocRef.current as any);
      setQuestions((prev) => [...prev, ...result.data]);
      setTotal((prev) => prev + result.data.length);
      setHasMore(result.hasMore || false);
      lastDocRef.current = result.lastDoc || null;
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to load more');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters, hasMore, loading]);

  // ============================================================
  // NEW UNIVERSAL ACTIONS
  // ============================================================

  const searchUniversalQuestions = useCallback(async (filter: UniversalFilter, page = 1) => {
    setLoadingUniversal(prev => ({ ...prev, questions: true }));
    setErrorsUniversal(prev => ({ ...prev, questions: null }));
    try {
      const cacheKey = 'uq_' + JSON.stringify(filter) + '_' + page;
      const cached = globalCache.get<UniversalPaginatedResult<QuestionMetadata>>(cacheKey);
      if (cached) {
        setUniversalQuestions(cached.data);
        setPagination({
          page: cached.page,
          limit: cached.limit,
          total: cached.total,
          totalPages: cached.totalPages,
          hasNextPage: cached.hasNextPage,
          hasPrevPage: cached.hasPrevPage,
        });
        setLoadingUniversal(prev => ({ ...prev, questions: false }));
        return;
      }
      const result = await questionMetadataApi.search(filter, { page, limit: DEFAULTS.PAGE_SIZE });
      if (result.success && result.data) {
        setUniversalQuestions(result.data.data);
        setPagination({
          page: result.data.page,
          limit: result.data.limit,
          total: result.data.total,
          totalPages: result.data.totalPages,
          hasNextPage: result.data.hasNextPage,
          hasPrevPage: result.data.hasPrevPage,
        });
        globalCache.set(cacheKey, result.data);
      } else {
        setErrorsUniversal(prev => ({ ...prev, questions: result.error || 'Failed to load questions' }));
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, questions: (error as Error).message }));
    } finally {
      setLoadingUniversal(prev => ({ ...prev, questions: false }));
    }
  }, []);

  const loadQuestionDetail = useCallback(async (questionId: string) => {
    setLoadingUniversal(prev => ({ ...prev, questionDetail: true }));
    setErrorsUniversal(prev => ({ ...prev, questionDetail: null }));
    setSelectedQuestion(null);
    try {
      const cacheKey = 'qd_' + questionId;
      const cached = globalCache.get<QuestionContent>(cacheKey);
      if (cached) {
        setSelectedQuestion(cached);
        setLoadingUniversal(prev => ({ ...prev, questionDetail: false }));
        return;
      }
      const metaRes = await questionMetadataApi.getById(questionId);
      if (!metaRes.success || !metaRes.data) {
        setErrorsUniversal(prev => ({ ...prev, questionDetail: metaRes.error || 'Question not found' }));
        return;
      }
      const contentRes = await questionStorageApi.downloadQuestion(metaRes.data.storagePath);
      if (contentRes.success && contentRes.data) {
        setSelectedQuestion(contentRes.data);
        globalCache.set(cacheKey, contentRes.data, 10 * 60 * 1000);
      } else {
        setErrorsUniversal(prev => ({ ...prev, questionDetail: contentRes.error || 'Failed to load content' }));
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, questionDetail: (error as Error).message }));
    } finally {
      setLoadingUniversal(prev => ({ ...prev, questionDetail: false }));
    }
  }, []);

  const loadPapers = useCallback(async (filter: PaperFilter, page = 1) => {
    setLoadingUniversal(prev => ({ ...prev, papers: true }));
    setErrorsUniversal(prev => ({ ...prev, papers: null }));
    try {
      const cacheKey = 'papers_' + JSON.stringify(filter) + '_' + page;
      const cached = globalCache.get<UniversalPaginatedResult<Paper>>(cacheKey);
      if (cached) {
        setPapers(cached.data);
        setLoadingUniversal(prev => ({ ...prev, papers: false }));
        return;
      }
      const result = await paperApi.search(filter, { page, limit: DEFAULTS.PAGE_SIZE });
      if (result.success && result.data) {
        setPapers(result.data.data);
        globalCache.set(cacheKey, result.data);
      } else {
        setErrorsUniversal(prev => ({ ...prev, papers: result.error || 'Failed to load papers' }));
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, papers: (error as Error).message }));
    } finally {
      setLoadingUniversal(prev => ({ ...prev, papers: false }));
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setLoadingUniversal(prev => ({ ...prev, templates: true }));
    setErrorsUniversal(prev => ({ ...prev, templates: null }));
    try {
      const cacheKey = 'templates_all';
      const cached = globalCache.get<PaperTemplate[]>(cacheKey);
      if (cached) {
        setTemplates(cached);
        setLoadingUniversal(prev => ({ ...prev, templates: false }));
        return;
      }
      const result = await paperTemplateApi.getAll();
      if (result.success && result.data) {
        setTemplates(result.data);
        globalCache.set(cacheKey, result.data, 30 * 60 * 1000);
      } else {
        setErrorsUniversal(prev => ({ ...prev, templates: result.error || 'Failed to load templates' }));
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, templates: (error as Error).message }));
    } finally {
      setLoadingUniversal(prev => ({ ...prev, templates: false }));
    }
  }, []);

  const loadPendingReviews = useCallback(async () => {
    setLoadingUniversal(prev => ({ ...prev, reviews: true }));
    setErrorsUniversal(prev => ({ ...prev, reviews: null }));
    try {
      const result = await reviewQueueApi.getPending();
      if (result.success && result.data) {
        setReviews(result.data);
      } else {
        setErrorsUniversal(prev => ({ ...prev, reviews: result.error || 'Failed to load reviews' }));
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, reviews: (error as Error).message }));
    } finally {
      setLoadingUniversal(prev => ({ ...prev, reviews: false }));
    }
  }, []);

  const loadUniversalStats = useCallback(async () => {
    setLoadingUniversal(prev => ({ ...prev, stats: true }));
    try {
      const cacheKey = 'stats_global';
      const cached = globalCache.get<UniversalStats>(cacheKey);
      if (cached) {
        setUniversalStats(cached);
        setLoadingUniversal(prev => ({ ...prev, stats: false }));
        return;
      }
      const result = await statsApi.getQuestionBankStats();
      if (result.success && result.data) {
        setUniversalStats(result.data);
        globalCache.set(cacheKey, result.data, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingUniversal(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const loadTopicStats = useCallback(async (topicId: string) => {
    setLoadingUniversal(prev => ({ ...prev, stats: true }));
    try {
      const result = await statsApi.getTopicStats(topicId);
      if (result.success && result.data) {
        setTopicStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load topic stats:', error);
    } finally {
      setLoadingUniversal(prev => ({ ...prev, stats: false }));
    }
  }, []);

  const generatePaper = useCallback(async (
    config: PaperGenerationConfig,
    createdBy: { userId: string; userName: string; collegeId: string | null; collegeName: string; role: 'superadmin' | 'admin' | 'faculty' }
  ): Promise<PaperGenerationResult | null> => {
    setLoadingUniversal(prev => ({ ...prev, generating: true }));
    setErrorsUniversal(prev => ({ ...prev, generate: null }));
    try {
      const validateRes = await paperGeneratorApi.validateConfig(config);
      if (validateRes.success && validateRes.data && !validateRes.data.isValid) {
        setErrorsUniversal(prev => ({ ...prev, generate: validateRes.data!.errors.join(', ') }));
        return null;
      }
      const result = await paperGeneratorApi.generate(config, createdBy);
      if (result.success && result.data) {
        globalCache.invalidate('papers');
        return result.data as PaperGenerationResult;
      } else {
        setErrorsUniversal(prev => ({ ...prev, generate: result.error || 'Failed to generate paper' }));
        return null;
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, generate: (error as Error).message }));
      return null;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, generating: false }));
    }
  }, []);

  const generateFromTemplate = useCallback(async (
    templateId: string,
    title: string,
    description: string,
    createdBy: { userId: string; userName: string; collegeId: string | null; collegeName: string; role: 'superadmin' | 'admin' | 'faculty' },
    visibility: 'public' | 'college_only' | 'shared_with',
    sharedWith?: string[]
  ): Promise<PaperGenerationResult | null> => {
    setLoadingUniversal(prev => ({ ...prev, generating: true }));
    setErrorsUniversal(prev => ({ ...prev, generate: null }));
    try {
      const result = await paperGeneratorApi.generateFromTemplate(
        templateId, title, description, createdBy, visibility, sharedWith
      );
      if (result.success && result.data) {
        globalCache.invalidate('papers');
        return result.data as PaperGenerationResult;
      } else {
        setErrorsUniversal(prev => ({ ...prev, generate: result.error || 'Failed to generate paper' }));
        return null;
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, generate: (error as Error).message }));
      return null;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, generating: false }));
    }
  }, []);

  const previewPaper = useCallback(async (paperId: string): Promise<{
    paper: Paper;
    questions: Array<{
      questionId: string;
      order: number;
      marks: number;
      content: QuestionContent;
    }>;
  } | null> => {
    setLoadingUniversal(prev => ({ ...prev, questionDetail: true }));
    try {
      const result = await paperPreviewApi.getPaperWithContent(paperId);
      if (result.success && result.data) {
        return result.data as { paper: Paper; questions: Array<{ questionId: string; order: number; marks: number; content: QuestionContent; }> };
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, questionDetail: false }));
    }
  }, []);

  const getStudentPaper = useCallback(async (paperId: string): Promise<{
    paperId: string;
    title: string;
    duration: number;
    totalMarks: number;
    questions: Array<{
      order: number;
      marks: number;
      questionText: string;
      options: Array<{ id: string; text: string }>;
      hasImage: boolean;
      imageUrl?: string;
    }>;
  } | null> => {
    setLoadingUniversal(prev => ({ ...prev, questionDetail: true }));
    try {
      const result = await paperPreviewApi.getStudentPaper(paperId);
      if (result.success && result.data) {
        return result.data as { paperId: string; title: string; duration: number; totalMarks: number; questions: Array<{ order: number; marks: number; questionText: string; options: Array<{ id: string; text: string }>; hasImage: boolean; imageUrl?: string; }> };
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, questionDetail: false }));
    }
  }, []);

  const submitReview = useCallback(async (review: Omit<QuestionReview, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoadingUniversal(prev => ({ ...prev, saving: true }));
    setErrorsUniversal(prev => ({ ...prev, save: null }));
    try {
      const result = await reviewQueueApi.submit(review);
      if (result.success) {
        globalCache.invalidate('reviews');
        return true;
      } else {
        setErrorsUniversal(prev => ({ ...prev, save: result.error || null }));
        return false;
      }
    } catch (error) {
      setErrorsUniversal(prev => ({ ...prev, save: (error as Error).message }));
      return false;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, saving: false }));
    }
  }, []);

  const approveReview = useCallback(async (reviewId: string, reviewerId: string, reviewerName: string, comment?: string) => {
    setLoadingUniversal(prev => ({ ...prev, saving: true }));
    try {
      const result = await reviewQueueApi.review(reviewId, 'approved', reviewerId, reviewerName, comment);
      if (result.success) {
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          await questionMetadataApi.updateStatus(review.questionId, 'approved', reviewerId);
        }
        globalCache.invalidate('reviews');
        globalCache.invalidate('questions');
        await loadPendingReviews();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, saving: false }));
    }
  }, [reviews, loadPendingReviews]);

  const rejectReview = useCallback(async (reviewId: string, reviewerId: string, reviewerName: string, comment?: string) => {
    setLoadingUniversal(prev => ({ ...prev, saving: true }));
    try {
      const result = await reviewQueueApi.review(reviewId, 'rejected', reviewerId, reviewerName, comment);
      if (result.success) {
        const review = reviews.find(r => r.id === reviewId);
        if (review) {
          await questionMetadataApi.updateStatus(review.questionId, 'rejected', reviewerId);
        }
        globalCache.invalidate('reviews');
        await loadPendingReviews();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoadingUniversal(prev => ({ ...prev, saving: false }));
    }
  }, [reviews, loadPendingReviews]);

  const invalidateCache = useCallback((pattern?: string) => {
    globalCache.invalidate(pattern);
  }, []);

  const clearUniversalErrors = useCallback(() => {
    setErrorsUniversal({
      questions: null,
      questionDetail: null,
      papers: null,
      templates: null,
      reviews: null,
      stats: null,
      generate: null,
      save: null,
    });
  }, []);

  // ============================================================
  // RETURN EVERYTHING
  // ============================================================

  return {
    // Existing
    questions,
    total,
    loading,
    error,
    stats,
    hasMore,
    filters,
    fetchQuestions,
    fetchAllQuestions,
    fetchQuestionById,
    addQuestion,
    editQuestion,
    removeQuestion,
    search,
    fetchStats,
    bulkImport,
    importQuestions,
    toggleStatus,
    linkToPaper,
    unlinkFromPaper,
    setFilter,
    clearFilters,
    refresh,
    loadMore,

    // Universal
    universalQuestions,
    selectedQuestion,
    papers,
    templates,
    reviews,
    universalStats,
    topicStats,
    loadingUniversal,
    errorsUniversal,
    pagination,
    searchUniversalQuestions,
    loadQuestionDetail,
    loadPapers,
    loadTemplates,
    loadPendingReviews,
    loadUniversalStats,
    loadTopicStats,
    generatePaper,
    generateFromTemplate,
    previewPaper,
    getStudentPaper,
    submitReview,
    approveReview,
    rejectReview,
    invalidateCache,
    clearUniversalErrors,
  };
}

export default useQuestionBank;