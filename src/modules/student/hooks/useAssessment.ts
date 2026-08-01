import { useCallback, useEffect, useState } from 'react';
import type { StudentTestCard, TestResultSummary, PaperQuestion, StudentAnswer } from '../types/assessment';

export interface UseStudentTestsReturn {
  testCards: StudentTestCard[];
  completedTests: TestResultSummary[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useStudentTests = (collegeId?: string, studentId?: string): UseStudentTestsReturn => {
  const [testCards, setTestCards] = useState<StudentTestCard[]>([]);
  const [completedTests, setCompletedTests] = useState<TestResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore — use collegeId + studentId
      console.log('Fetching tests for', collegeId, studentId);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [collegeId, studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { testCards, completedTests, loading, error, refresh: fetchData };
};

export interface UseActiveTestReturn {
  activeTest: StudentTestCard | null;
  questions: PaperQuestion[];
  answers: Record<string, StudentAnswer>;
  currentQuestionIndex: number;
  timeRemaining: number;
  loading: boolean;
  error: string | null;
  submitAnswer: (questionId: string, answer: StudentAnswer) => void;
  submitTest: () => Promise<void>;
  goToQuestion: (index: number) => void;
}

export const useActiveTest = (collegeId?: string, testId?: string, studentId?: string): UseActiveTestReturn => {
  const [activeTest, setActiveTest] = useState<StudentTestCard | null>(null);
  const [questions, setQuestions] = useState<PaperQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId || !studentId) { setLoading(false); return; }
    console.log('Loading active test', collegeId, testId, studentId);
    setLoading(false);
  }, [collegeId, testId, studentId]);

  const submitAnswer = useCallback((questionId: string, answer: StudentAnswer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  const submitTest = useCallback(async () => {
    console.log('Submitting test', answers);
  }, [answers]);

  const goToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  return {
    activeTest, questions, answers, currentQuestionIndex, timeRemaining,
    loading, error, submitAnswer, submitTest, goToQuestion,
  };
};

export interface UseTestResultReturn {
  result: TestResultSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useTestResult = (collegeId?: string, testId?: string, studentId?: string): UseTestResultReturn => {
  const [result, setResult] = useState<TestResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!testId || !studentId) { setLoading(false); return; }
    try {
      setLoading(true);
      console.log('Fetching result for', collegeId, testId, studentId);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [collegeId, testId, studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { result, loading, error, refresh: fetchData };
};

export default useStudentTests;
