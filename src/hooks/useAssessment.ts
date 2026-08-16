import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  StudentTestCard,
  TestResultSummary,
  PaperQuestion,
  StudentAnswer,
  ActiveTest,
  AssessmentQuestion,
  AssessmentPaper,
  CreatePaperInput,
  ScheduledTest,
  ScheduleTestInput,
} from '../types/assessment';

// ============================================================================
// useStudentTests
// ============================================================================

export interface UseStudentTestsReturn {
  tests: StudentTestCard[];
  upcomingTests: StudentTestCard[];
  availableTests: StudentTestCard[];
  completedTests: StudentTestCard[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useStudentTests = (
  collegeId?: string,
  studentId?: string
): UseStudentTestsReturn => {
  const [tests, setTests] = useState<StudentTestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to Firestore — use collegeId + studentId
      console.log('Fetching tests for', collegeId, studentId);
      setTests([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const upcomingTests = tests.filter(
    (t) => t.status === 'upcoming' || t.status === 'scheduled'
  );
  const availableTests = tests.filter(
    (t) => t.status === 'ongoing' || t.status === 'published' || t.canStart
  );
  const completedTests = tests.filter(
    (t) => t.status === 'completed' || t.status === 'graded'
  );

  return {
    tests,
    upcomingTests,
    availableTests,
    completedTests,
    loading,
    error,
    refresh: fetchData,
  };
};

// ============================================================================
// useActiveTest
// ============================================================================

export interface UseActiveTestReturn {
  activeTest: ActiveTest | null;
  currentQuestion: PaperQuestion | null;
  questions: PaperQuestion[];
  answers: Record<string, Partial<StudentAnswer>>;
  currentQuestionIndex: number;
  timeRemaining: number;
  loading: boolean;
  isSubmitting: boolean;
  error: string | null;
  /** Start a test. Alias for startTest. */
  start: (
    testId: string,
    studentId: string,
    studentName?: string,
    studentRegNo?: string,
    sectionId?: string,
    sectionName?: string
  ) => Promise<void>;
  /** Start a test. */
  startTest: (
    testId: string,
    studentId: string,
    studentName?: string,
    studentRegNo?: string,
    sectionId?: string,
    sectionName?: string
  ) => Promise<void>;
  saveCurrentAnswer: (questionId: string, answer: Partial<StudentAnswer>) => void;
  /** Submit the test. Alias for submitTest. Returns true on success. */
  submit: () => Promise<boolean>;
  /** Submit the test. Returns true on success. */
  submitTest: () => Promise<boolean>;
  navigateQuestion: (direction: 'prev' | 'next') => void;
  navigateToQuestion: (index: number) => void;
  toggleFlagQuestion: (questionId: string) => void;
  logProctorEvent: (eventType: string, details?: Record<string, unknown>) => void;
}

export const useActiveTest = (collegeId?: string): UseActiveTestReturn => {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentQuestionIndex] ?? null;

  const startTest = useCallback(
    async (
      testId: string,
      studentId: string,
      _studentName?: string,
      _studentRegNo?: string,
      _sectionId?: string,
      _sectionName?: string
    ) => {
      try {
        setLoading(true);
        setError(null);
        // TODO: Wire to API — load test by testId + studentId + collegeId
        console.log('Starting test', { collegeId, testId, studentId });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start test');
      } finally {
        setLoading(false);
      }
    },
    [collegeId]
  );

  const saveCurrentAnswer = useCallback(
    (questionId: string, answer: Partial<StudentAnswer>) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], ...answer },
      }));
    },
    []
  );

  const submitTest = useCallback(async () => {
    try {
      setIsSubmitting(true);
      // TODO: Wire to API
      console.log('Submitting test', answers);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers]);

  const navigateQuestion = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentQuestionIndex((idx) => {
        if (direction === 'prev') return Math.max(0, idx - 1);
        return Math.min(questions.length - 1, idx + 1);
      });
    },
    [questions.length]
  );

  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setActiveTest((prev) => {
      if (!prev) return prev;
      const flagged = new Set(prev.flaggedQuestions);
      if (flagged.has(questionId)) flagged.delete(questionId);
      else flagged.add(questionId);
      return { ...prev, flaggedQuestions: Array.from(flagged) };
    });
  }, []);

  const logProctorEvent = useCallback(
    (eventType: string, details?: Record<string, unknown>) => {
      console.log('Proctor event:', eventType, details);
    },
    []
  );

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    activeTest,
    currentQuestion,
    questions,
    answers,
    currentQuestionIndex,
    timeRemaining,
    loading,
    isSubmitting,
    error,
    start: startTest,
    startTest,
    saveCurrentAnswer,
    submit: submitTest,
    submitTest,
    navigateQuestion,
    navigateToQuestion,
    toggleFlagQuestion,
    logProctorEvent,
  };
};

// ============================================================================
// useTestResult
// ============================================================================

export interface UseTestResultReturn {
  result: TestResultSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useTestResult = (
  collegeId?: string,
  testId?: string,
  studentId?: string
): UseTestResultReturn => {
  const [result, setResult] = useState<TestResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!testId || !studentId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // TODO: Fetch from API using collegeId + testId + studentId
      console.log('Fetching result for', collegeId, testId, studentId);
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, testId, studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { result, loading, error, refresh: fetchData };
};

// ============================================================================
// useQuestions
// ============================================================================

export interface UseQuestionsReturn {
  questions: AssessmentQuestion[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useQuestions = (
  collegeId?: string,
  filters?: {
    subjectId?: string;
    status?: string;
    topic?: string;
    type?: string;
    difficulty?: string;
    search?: string;
  }
): UseQuestionsReturn => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to Firestore / question bank API — use collegeId + filters
      console.log('Fetching questions for', collegeId, filters);
      setQuestions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters?.subjectId, filters?.status, filters?.topic, filters?.type, filters?.difficulty, filters?.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { questions, loading, error, refresh: fetchData };
};

// ============================================================================
// useQuestion
// ============================================================================

export interface UseQuestionReturn {
  question: AssessmentQuestion | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useQuestion = (questionId?: string): UseQuestionReturn => {
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!questionId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to API — fetch single question by ID
      console.log('Fetching question', questionId);
      setQuestion(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { question, loading, error, refresh: fetchData };
}; 
// ============================================================================
// usePapers
// ============================================================================

export interface UsePapersFilters {
  status?: string;
  type?: string;
  search?: string;
}

export interface UsePapersReturn {
  papers: AssessmentPaper[];
  create: (input: CreatePaperInput) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const usePapers = (
  collegeId?: string,
  filters?: UsePapersFilters
): UsePapersReturn => {
  const [papers, setPapers] = useState<AssessmentPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to Firestore / papers API — use collegeId + filters
      console.log('Fetching papers for', collegeId, filters);
      setPapers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters?.status, filters?.type, filters?.search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = useCallback(async (input: CreatePaperInput) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to API — create paper using collegeId
      console.log('Creating paper', { collegeId, input });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create paper');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  return { papers, create, loading, error, refresh: fetchData };
};

// ============================================================================
// useScheduledTests
// ============================================================================

export interface UseScheduledTestsReturn {
  tests: ScheduledTest[];
  schedule: (input: ScheduleTestInput) => Promise<void>;
  publish: (testId: string) => Promise<void>;
  cancel: (testId: string, reason: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useScheduledTests = (collegeId?: string): UseScheduledTestsReturn => {
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to Firestore / scheduled tests API
      console.log('Fetching scheduled tests for', collegeId);
      setTests([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const schedule = useCallback(async (input: ScheduleTestInput) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to API — schedule test using collegeId
      console.log('Scheduling test', { collegeId, input });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const publish = useCallback(async (testId: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to API — publish test
      console.log('Publishing test', { collegeId, testId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const cancel = useCallback(async (testId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Wire to API — cancel test
      console.log('Cancelling test', { collegeId, testId, reason });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel test');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  return { tests, schedule, publish, cancel, loading, error, refresh: fetchData };
};

export default useStudentTests;