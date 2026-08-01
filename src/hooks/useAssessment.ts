import { useState, useEffect, useCallback } from "react";
import type {
  Assessment,
  PaperQuestion,
  StudentTest,
  ActiveTest,
  TestResultSummary,
  ScheduledTest,
  TestResultView,
  StudentAnswer,
} from "../types/assessment";

export function useQuestions(subject?: string) {
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuestions([]);
    setLoading(false);
    setError(null);
  }, [subject]);

  return { questions, loading, error, refetch: () => {} };
}

export function usePapers(classId?: string) {
  const [papers, setPapers] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPapers([]);
    setLoading(false);
    setError(null);
  }, [classId]);

  return { papers, loading, error, refetch: () => {} };
}

export function useStudentTests(studentId?: string) {
  const [tests, setTests] = useState<StudentTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTests([]);
    setLoading(false);
    setError(null);
  }, [studentId]);

  return { tests, loading, error, refetch: () => {} };
}

export function useActiveTest(testId?: string) {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const start = useCallback(() => {
    setActiveTest((prev) => (prev ? { ...prev, status: "in_progress" } : null));
  }, []);

  const saveCurrentAnswer = useCallback(
    (questionId: string, answer: Partial<StudentAnswer>) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], questionId, ...answer } as StudentAnswer,
      }));
    },
    []
  );

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // TODO: wire to actual submission API
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const navigateQuestion = useCallback((direction: "next" | "prev") => {
    setCurrentQuestionIndex((prev) => {
      if (direction === "next") return prev + 1;
      return Math.max(0, prev - 1);
    });
  }, []);

  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setActiveTest((prev) => {
      if (!prev) return null;
      const flagged = prev.flaggedQuestions || [];
      const isFlagged = flagged.includes(questionId);
      return {
        ...prev,
        flaggedQuestions: isFlagged
          ? flagged.filter((id) => id !== questionId)
          : [...flagged, questionId],
      };
    });
  }, []);

  const logProctorEvent = useCallback((event: string, _details?: Record<string, unknown>) => {
    console.log("Proctor event:", event);
  }, []);

  useEffect(() => {
    setActiveTest(null);
    setLoading(false);
    setError(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setIsSubmitting(false);
  }, [testId]);

  const currentQuestion = activeTest?.questions?.[currentQuestionIndex] || null;
  const timeRemaining = activeTest?.timeRemaining || 0;

  return {
    activeTest,
    loading,
    error,
    currentQuestion,
    questions: activeTest?.questions || [],
    answers,
    timeRemaining,
    currentQuestionIndex,
    isSubmitting,
    start,
    saveCurrentAnswer,
    submit,
    navigateQuestion,
    navigateToQuestion,
    toggleFlagQuestion,
    logProctorEvent,
  };
}

export function useTestResult(testId?: string, studentId?: string) {
  const [result, setResult] = useState<TestResultSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setLoading(false);
    setError(null);
  }, [testId, studentId]);

  return { result, loading, error };
}

export function useScheduledTests(facultyId?: string) {
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScheduledTests([]);
    setLoading(false);
    setError(null);
  }, [facultyId]);

  return { scheduledTests, loading, error, refetch: () => {} };
}

export function useTestResultView(resultId?: string) {
  const [testResult, setTestResult] = useState<TestResultView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTestResult(null);
    setLoading(false);
    setError(null);
  }, [resultId]);

  return { testResult, loading, error };
}