import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../Firebase/config';
import {
  autosaveStudentAssessment,
  fetchActiveTest,
  fetchTestResult,
  logProctorEvent as persistProctorEvent,
  startStudentAssessment,
  submitStudentAssessment,
} from '../modules/student/api/testApi';
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

function dateIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (!value) return '';
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toWireDate(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

async function callable<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
  const invoke = httpsCallable<TInput, TOutput>(functions, name);
  return (await invoke(input)).data;
}

// ============================================================================
// Student assessment hooks — backed exclusively by the server-owned engine.
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
  _collegeId?: string,
  studentId?: string
): UseStudentTestsReturn => {
  const [tests, setTests] = useState<StudentTestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setTests([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await callable<Record<string, never>, { tests: StudentTestCard[] }>(
        'getMyStudentTests',
        {}
      );
      setTests(result.tests);
    } catch (err) {
      setTests([]);
      setError(errorMessage(err, 'Could not load assessments.'));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  return {
    tests,
    upcomingTests: tests.filter((test) => test.status === 'upcoming'),
    availableTests: tests.filter((test) => test.status === 'ongoing' || test.status === 'available' || test.canStart),
    completedTests: tests.filter((test) => test.status === 'completed' || test.status === 'graded'),
    loading,
    error,
    refresh: () => { void fetchData(); },
  };
};

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
  start: (testId: string, studentId: string, studentName?: string, studentRegNo?: string, sectionId?: string, sectionName?: string) => Promise<void>;
  startTest: (testId: string, studentId: string, studentName?: string, studentRegNo?: string, sectionId?: string, sectionName?: string) => Promise<void>;
  saveCurrentAnswer: (questionId: string, answer: Partial<StudentAnswer>) => void;
  submit: () => Promise<boolean>;
  submitTest: () => Promise<boolean>;
  navigateQuestion: (direction: 'prev' | 'next') => void;
  navigateToQuestion: (index: number) => void;
  toggleFlagQuestion: (questionId: string) => void;
  logProctorEvent: (eventType: string, details?: Record<string, unknown>) => void;
}

export const useActiveTest = (collegeId = ''): UseActiveTestReturn => {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, Partial<StudentAnswer>>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptRef = useRef<{ id: string; testId: string; studentId: string; studentName: string; regNo: string } | null>(null);

  const startTest = useCallback(async (
    testId: string,
    studentId: string,
    studentName = '',
    studentRegNo = ''
  ) => {
    try {
      setLoading(true);
      setError(null);
      const started = await startStudentAssessment(collegeId, testId, {
        id: studentId,
        name: studentName,
        regNo: studentRegNo,
      });
      const loaded = await fetchActiveTest(collegeId, started.testId, studentId);
      if (!loaded) throw new Error('The active test could not be loaded.');
      const mappedQuestions: PaperQuestion[] = loaded.questions.map((question) => ({
        questionId: question.id,
        order: question.order,
        content: question.text,
        questionText: question.text,
        type: question.type,
        questionType: question.type,
        marks: question.marks,
        options: question.options?.map((option) => ({ id: option.id, text: option.text })),
        imageUrl: question.imageUrl,
      }));
      const mapped: ActiveTest = {
        testId: loaded.testId,
        studentId,
        paperId: loaded.paperId,
        paperTitle: loaded.title,
        questions: mappedQuestions,
        flaggedQuestions: loaded.flaggedQuestions,
        currentQuestionIndex: 0,
        answers: (loaded.answers || {}) as Record<string, Partial<StudentAnswer>>,
        startTime: loaded.startedAt,
        endTime: loaded.endsAt,
        timeRemaining: Math.max(0, Math.floor((new Date(loaded.endsAt).getTime() - Date.now()) / 1000)),
        status: 'in_progress',
      };
      attemptRef.current = { id: loaded.studentAssessmentId, testId: loaded.testId, studentId, studentName, regNo: studentRegNo };
      setActiveTest(mapped);
      setQuestions(mappedQuestions);
      setAnswers(mapped.answers);
      setTimeRemaining(mapped.timeRemaining);
    } catch (err) {
      setError(errorMessage(err, 'Failed to start the test.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  const saveCurrentAnswer = useCallback((questionId: string, answer: Partial<StudentAnswer>) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { ...previous[questionId], ...answer, questionId },
    }));
  }, []);

  const submitTest = useCallback(async () => {
    const attempt = attemptRef.current;
    if (!attempt) {
      setError('No active test is loaded.');
      return false;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await submitStudentAssessment({
        collegeId,
        testId: attempt.testId,
        studentAssessmentId: attempt.id,
        student: { id: attempt.studentId, name: attempt.studentName, regNo: attempt.regNo },
        answers: answers as never,
        timeSpent: 0,
        proctorEvents: [],
      });
      setActiveTest((previous) => previous ? { ...previous, status: 'submitted' } : previous);
      return true;
    } catch (err) {
      setError(errorMessage(err, 'Failed to submit the test.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, collegeId]);

  const navigateQuestion = useCallback((direction: 'prev' | 'next') => {
    setCurrentQuestionIndex((index) => direction === 'prev'
      ? Math.max(0, index - 1)
      : Math.min(Math.max(0, questions.length - 1), index + 1));
  }, [questions.length]);

  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(Math.max(0, Math.min(Math.max(0, questions.length - 1), index)));
  }, [questions.length]);

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setActiveTest((previous) => {
      if (!previous) return previous;
      const flagged = new Set(previous.flaggedQuestions);
      if (flagged.has(questionId)) flagged.delete(questionId);
      else flagged.add(questionId);
      return { ...previous, flaggedQuestions: [...flagged] };
    });
  }, []);

  const recordProctorEvent = useCallback((eventType: string, details?: Record<string, unknown>) => {
    const attempt = attemptRef.current;
    if (!attempt) return;
    void persistProctorEvent(collegeId, attempt.testId, attempt.id, attempt.studentId, {
      type: eventType,
      at: new Date().toISOString(),
      details,
    }).catch((err) => setError(errorMessage(err, 'A proctoring event could not be recorded.')));
  }, [collegeId]);

  useEffect(() => {
    if (!activeTest || activeTest.status !== 'in_progress') return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [activeTest?.status]);

  useEffect(() => {
    const attempt = attemptRef.current;
    if (!attempt || !activeTest || activeTest.status !== 'in_progress') return;
    const save = setTimeout(() => {
      const rows = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer,
      })) as never;
      void autosaveStudentAssessment(attempt.id, rows, 0).catch(() => undefined);
    }, 1500);
    return () => clearTimeout(save);
  }, [activeTest, answers]);

  return {
    activeTest,
    currentQuestion: questions[currentQuestionIndex] || null,
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
    logProctorEvent: recordProctorEvent,
  };
};

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
      setResult(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const detail = await fetchTestResult(collegeId || '', testId, studentId);
      setResult(detail ? detail as unknown as TestResultSummary : null);
    } catch (err) {
      setResult(null);
      setError(errorMessage(err, 'Could not load the result.'));
    } finally {
      setLoading(false);
    }
  }, [collegeId, studentId, testId]);
  useEffect(() => { void fetchData(); }, [fetchData]);
  return { result, loading, error, refresh: () => { void fetchData(); } };
};

// ============================================================================
// Staff question/paper discovery.
// ============================================================================

export interface UseQuestionsReturn {
  questions: AssessmentQuestion[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface QuestionFilters {
  subjectId?: string;
  status?: string;
  topic?: string;
  type?: string;
  difficulty?: string;
  search?: string;
}

function mapQuestion(id: string, data: Record<string, unknown>): AssessmentQuestion {
  return {
    id,
    ...data,
    marks: Number(data.marks) || 1,
    questionText: String(data.questionText || data.text || data.content || ''),
    questionType: String(data.questionType || data.type || 'MCQ') as AssessmentQuestion['questionType'],
    createdAt: dateIso(data.createdAt),
    updatedAt: dateIso(data.updatedAt),
  } as AssessmentQuestion;
}

export const useQuestions = (collegeId?: string, filters?: QuestionFilters): UseQuestionsReturn => {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    if (!collegeId) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDocs(query(
        collection(db, 'questions'),
        where('collegeId', '==', collegeId),
        limit(500)
      ));
      const search = filters?.search?.trim().toLowerCase();
      const rows = snapshot.docs
        .map((item) => mapQuestion(item.id, item.data()))
        .filter((item) => !filters?.subjectId || (item as unknown as { subjectId?: string }).subjectId === filters.subjectId)
        .filter((item) => !filters?.status || item.status === filters.status)
        .filter((item) => !filters?.topic || item.topic === filters.topic)
        .filter((item) => !filters?.type || item.questionType === filters.type || item.type === filters.type)
        .filter((item) => !filters?.difficulty || item.difficulty === filters.difficulty)
        .filter((item) => !search || String(item.questionText || item.content || '').toLowerCase().includes(search));
      setQuestions(rows);
    } catch (err) {
      setQuestions([]);
      setError(errorMessage(err, 'Could not load the question bank.'));
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters?.difficulty, filters?.search, filters?.status, filters?.subjectId, filters?.topic, filters?.type]);
  useEffect(() => { void fetchData(); }, [fetchData]);
  return { questions, loading, error, refresh: () => { void fetchData(); } };
};

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
      setQuestion(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDoc(doc(db, 'questions', questionId));
      setQuestion(snapshot.exists() ? mapQuestion(snapshot.id, snapshot.data()) : null);
    } catch (err) {
      setQuestion(null);
      setError(errorMessage(err, 'Could not load the question.'));
    } finally {
      setLoading(false);
    }
  }, [questionId]);
  useEffect(() => { void fetchData(); }, [fetchData]);
  return { question, loading, error, refresh: () => { void fetchData(); } };
};

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

function mapPaper(id: string, data: Record<string, unknown>): AssessmentPaper {
  return {
    id,
    ...data,
    title: String(data.title || ''),
    subject: String(data.subject || data.subjectName || ''),
    duration: Number(data.duration || data.durationMinutes) || 0,
    totalMarks: Number(data.totalMarks) || 0,
    sections: Array.isArray(data.sections) ? data.sections : [],
    status: String(data.status || 'draft'),
    createdBy: String(data.createdBy || ''),
    createdAt: dateIso(data.createdAt),
    updatedAt: dateIso(data.updatedAt),
  } as AssessmentPaper;
}

export const usePapers = (collegeId?: string, filters?: UsePapersFilters): UsePapersReturn => {
  const [papers, setPapers] = useState<AssessmentPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async () => {
    if (!collegeId) {
      setPapers([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const snapshot = await getDocs(query(
        collection(db, 'papers'),
        where('collegeId', '==', collegeId),
        limit(300)
      ));
      const search = filters?.search?.trim().toLowerCase();
      const rows = snapshot.docs
        .map((item) => mapPaper(item.id, item.data()))
        .filter((item) => !filters?.status || item.status === filters.status)
        .filter((item) => !filters?.type || item.type === filters.type || item.paperType === filters.type)
        .filter((item) => !search || item.title.toLowerCase().includes(search));
      setPapers(rows);
    } catch (err) {
      setPapers([]);
      setError(errorMessage(err, 'Could not load assessment papers.'));
    } finally {
      setLoading(false);
    }
  }, [collegeId, filters?.search, filters?.status, filters?.type]);
  useEffect(() => { void fetchData(); }, [fetchData]);

  const create = useCallback(async (input: CreatePaperInput) => {
    if (!collegeId || !auth.currentUser) throw new Error('A signed-in college account is required.');
    try {
      setLoading(true);
      setError(null);
      await addDoc(collection(db, 'papers'), {
        ...input,
        collegeId,
        createdBy: auth.currentUser.uid,
        duration: Number(input.duration || input.durationMinutes) || 0,
        totalMarks: Number(input.totalMarks) || 0,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await fetchData();
    } catch (err) {
      const message = errorMessage(err, 'Could not create the paper.');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [collegeId, fetchData]);

  return { papers, create, loading, error, refresh: () => { void fetchData(); } };
};

// ============================================================================
// Secure scheduling hooks.
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!collegeId) {
      setTests([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await callable<{ collegeId: string }, { tests: ScheduledTest[] }>(
        'listManagedAssessmentTests',
        { collegeId }
      );
      setTests(result.tests);
    } catch (err) {
      setTests([]);
      setError(errorMessage(err, 'Could not load scheduled tests.'));
    } finally {
      setLoading(false);
    }
  }, [collegeId]);
  useEffect(() => { void fetchData(); }, [fetchData]);

  const runMutation = useCallback(async (action: () => Promise<unknown>, fallback: string) => {
    try {
      setLoading(true);
      setError(null);
      await action();
      await fetchData();
    } catch (err) {
      const message = errorMessage(err, fallback);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const schedule = useCallback(async (input: ScheduleTestInput) => {
    if (!collegeId) throw new Error('College context is required.');
    await runMutation(
      () => callable('scheduleAssessmentTest', {
        ...input,
        collegeId,
        startDateTime: toWireDate(input.startDateTime),
        endDateTime: toWireDate(input.endDateTime),
        resultPublishDate: toWireDate(input.resultPublishDate),
      }),
      'Could not schedule the test.'
    );
  }, [collegeId, runMutation]);

  const publish = useCallback(async (testId: string) => {
    await runMutation(
      () => callable('publishAssessmentTest', { testId }),
      'Could not publish the test.'
    );
  }, [runMutation]);

  const cancel = useCallback(async (testId: string, reason: string) => {
    await runMutation(
      () => callable('cancelAssessmentTest', { testId, reason }),
      'Could not cancel the test.'
    );
  }, [runMutation]);

  return { tests, schedule, publish, cancel, loading, error, refresh: () => { void fetchData(); } };
};

export default useStudentTests;
