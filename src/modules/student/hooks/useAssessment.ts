// src/modules/student/hooks/useAssessment.ts
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchScheduledTests,
  fetchTestResult,
  fetchActiveTest,
  saveStudentSubmission,
  logProctorEvent,
} from "../api/testApi";
import type {
  StudentTestCard,
  TestResultDetail,
  TestResultSummary,
  ActiveTest,
  StudentAnswer,
} from "../types/assessment";

/* ───────────────────────────────────────────────
   useStudentTests
   ─────────────────────────────────────────────── */
export function useStudentTests(collegeId: string, studentId: string) {
  const [testCards, setTestCards] = useState<StudentTestCard[]>([]);
  const [completedTests, setCompletedTests] = useState<TestResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchScheduledTests(collegeId, studentId)
      .then((data) => {
        if (cancelled) return;
        setTestCards(data.upcoming);
        setCompletedTests(data.completed);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load tests");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collegeId, studentId]);

  return { testCards, completedTests, loading, error };
}

/* ───────────────────────────────────────────────
   useTestResult
   ─────────────────────────────────────────────── */
export function useTestResult(collegeId: string, testId: string, studentId: string) {
  const [result, setResult] = useState<TestResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!testId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchTestResult(collegeId, testId, studentId)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load result");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [collegeId, testId, studentId]);

  return { result, loading, error };
}

/* ───────────────────────────────────────────────
   useActiveTest
   ─────────────────────────────────────────────── */
export function useActiveTest(collegeId: string) {
  const [activeTest, setActiveTest] = useState<ActiveTest | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const testIdRef = useRef<string | null>(null);
  const studentRef = useRef<{ id: string; name: string; regNo: string } | null>(null);
  const answersRef = useRef<Record<string, Partial<StudentAnswer>>>({});

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    async (testId: string, studentId: string, studentName: string, studentRegNo: string) => {
      setLoading(true);
      setError(null);
      try {
        const test = await fetchActiveTest(collegeId, testId);
        if (!test) throw new Error("Test not found");
        setActiveTest(test);
        testIdRef.current = testId;
        studentRef.current = { id: studentId, name: studentName, regNo: studentRegNo };
        setTimeRemaining(test.duration * 60);
        clearTimer();
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearTimer();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start test");
      } finally {
        setLoading(false);
      }
    },
    [collegeId, clearTimer]
  );

  const navigateToQuestion = useCallback((_index: number) => {
    // Placeholder for future sync
  }, []);

  const saveCurrentAnswer = useCallback((questionId: string, answer: Partial<StudentAnswer>) => {
    answersRef.current[questionId] = { ...answersRef.current[questionId], ...answer };
  }, []);

  const toggleFlagQuestion = useCallback((_questionId: string) => {
    // Placeholder
  }, []);

  const submit = useCallback(
    async (reason?: string) => {
      if (!testIdRef.current || !studentRef.current) return;
      setIsSubmitting(true);
      try {
        await saveStudentSubmission(
          collegeId,
          testIdRef.current,
          studentRef.current.id,
          studentRef.current.name,
          studentRef.current.regNo,
          answersRef.current,
          timeRemaining,
          reason ? [{ type: "auto_submit", details: { reason } }] : []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Submission failed");
      } finally {
        setIsSubmitting(false);
        clearTimer();
      }
    },
    [collegeId, timeRemaining, clearTimer]
  );

  const logProctorEventFn = useCallback(
    async (type: string, details?: Record<string, unknown>) => {
      if (!testIdRef.current || !studentRef.current) return;
      await logProctorEvent(collegeId, testIdRef.current, studentRef.current.id, { type, details });
    },
    [collegeId]
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    activeTest,
    timeRemaining,
    loading,
    error,
    isSubmitting,
    start,
    saveCurrentAnswer,
    navigateToQuestion,
    toggleFlagQuestion,
    submit,
    logProctorEvent: logProctorEventFn,
  };
}