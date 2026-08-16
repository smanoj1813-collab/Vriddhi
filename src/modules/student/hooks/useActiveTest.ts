import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc, getDoc, updateDoc, setDoc, Timestamp, collection
} from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type {
  ActiveTest, PaperQuestion, StudentAnswer
} from '../types/assessment';

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
  isFlagged: (questionId: string) => boolean;
  isAnswered: (questionId: string) => boolean;
  answeredCount: number;
  flaggedCount: number;
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
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const studentAssessmentIdRef = useRef<string>('');
  const answersRef = useRef<Record<string, Partial<StudentAnswer>>>({});
  const timeRemainingRef = useRef<number>(0);

  const currentQuestion = questions[currentQuestionIndex] ?? null;

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTest && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) { submitTestInternal(); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTest, timeRemaining]);

  const submitTestInternal = useCallback(async () => {
    if (!activeTest || !studentAssessmentIdRef.current) return false;
    try {
      setIsSubmitting(true);
      const now = new Date();
      const timeSpent = activeTest.duration * 60 - timeRemainingRef.current;
      const answerArray = Object.values(answersRef.current).filter((a): a is StudentAnswer => !!a.questionId);

      await updateDoc(doc(db, 'studentAssessments', studentAssessmentIdRef.current), {
        status: 'submitted',
        answers: answerArray,
        timeSpent,
        submittedAt: now.toISOString(),
        updatedAt: Timestamp.now(),
      });

      const schedDoc = await getDoc(doc(db, 'scheduledTests', activeTest.assessmentId));
      if (schedDoc.exists()) {
        const sData = schedDoc.data();
        await updateDoc(doc(db, 'scheduledTests', activeTest.assessmentId), {
          totalSubmitted: (sData.totalSubmitted || 0) + 1,
          updatedAt: Timestamp.now(),
        });
      }

      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);

      setActiveTest(null);
      setQuestions([]);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(0);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [activeTest]);

  const startTest = useCallback(
    async (testId: string, studentId: string, studentName?: string, studentRegNo?: string, _sectionId?: string, _sectionName?: string) => {
      try {
        setLoading(true);
        setError(null);

        const testDoc = await getDoc(doc(db, 'scheduledTests', testId));
        if (!testDoc.exists()) throw new Error('Test not found');
        const testData = testDoc.data();

        const paperDoc = await getDoc(doc(db, 'papers', testData.paperId));
        if (!paperDoc.exists()) throw new Error('Paper not found');
        const paperData = paperDoc.data();

        const paperQuestions: PaperQuestion[] = [];
        const qIds = paperData.linkedQuestionIds || paperData.questionIds || [];

        for (const qId of qIds) {
          const qDoc = await getDoc(doc(db, 'questions', qId));
          if (qDoc.exists()) {
            const qData = qDoc.data();
            paperQuestions.push({
              id: qDoc.id,
              questionId: qDoc.id,
              order: paperQuestions.length + 1,
              marks: qData.marks || 1,
              text: qData.text || '',
              type: qData.type || 'mcq',
              difficulty: qData.difficulty || 'medium',
              options: (qData.options || []).map((o: any, idx: number) => ({
                id: o.id || String.fromCharCode(65 + idx),
                text: o.text || String(o),
              })),
              hasImage: qData.hasImage || false,
              imageUrl: qData.imageUrl,
              negativeMarks: qData.negativeMarks || 0,
            });
          }
        }

        const saQuery = collection(db, 'studentAssessments');
        const saDocRef = doc(saQuery);
        const now = new Date();
        const endsAt = new Date(now.getTime() + (testData.duration || 60) * 60000);

        const studentAssessmentData = {
          assessmentId: testId,
          studentId,
          studentName: studentName || '',
          regNo: studentRegNo || '',
          collegeId: testData.collegeId || collegeId,
          branch: testData.branch || '',
          semester: testData.semester || 0,
          batch: testData.batch || '',
          division: testData.division || '',
          section: testData.section || '',
          status: 'in_progress',
          marksObtained: 0,
          totalMarks: testData.totalMarks || 0,
          percentage: 0,
          grade: null,
          gradePoint: 0,
          timeSpent: 0,
          answers: [],
          startedAt: now.toISOString(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        await setDoc(saDocRef, studentAssessmentData);
        studentAssessmentIdRef.current = saDocRef.id;

        await updateDoc(doc(db, 'scheduledTests', testId), {
          totalStarted: (testData.totalStarted || 0) + 1,
          updatedAt: Timestamp.now(),
        });

        const active: ActiveTest = {
          studentAssessmentId: saDocRef.id,
          assessmentId: testId,
          paperId: testData.paperId,
          title: testData.paperTitle || paperData.title || 'Untitled',
          subject: testData.subject || paperData.subject || '',
          totalMarks: testData.totalMarks || 0,
          duration: testData.duration || 60,
          startedAt: now.toISOString(),
          endsAt: endsAt.toISOString(),
          questions: paperQuestions,
          flaggedQuestions: [],
          instructions: testData.instructions || paperData.instructions || [],
          negativeMarking: testData.negativeMarking || false,
          collegeId: testData.collegeId || collegeId || '',
        };

        setActiveTest(active);
        setQuestions(paperQuestions);
        setTimeRemaining((testData.duration || 60) * 60);
        setCurrentQuestionIndex(0);
        setAnswers({});
        answersRef.current = {};

        autoSaveRef.current = setInterval(() => {
          if (studentAssessmentIdRef.current) {
            const currentAnswers = Object.values(answersRef.current);
            updateDoc(doc(db, 'studentAssessments', studentAssessmentIdRef.current), {
              answers: currentAnswers,
              timeSpent: (testData.duration || 60) * 60 - timeRemainingRef.current,
              updatedAt: Timestamp.now(),
            }).catch(console.error);
          }
        }, 30000);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start test');
      } finally {
        setLoading(false);
      }
    },
    [collegeId]
  );

  const saveCurrentAnswer = useCallback((questionId: string, answer: Partial<StudentAnswer>) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: { ...prev[questionId], questionId, ...answer, answeredAt: new Date().toISOString() },
      };
      answersRef.current = updated;
      return updated;
    });
  }, []);

  const submitTest = useCallback(async () => submitTestInternal(), [submitTestInternal]);

  const navigateQuestion = useCallback((direction: 'prev' | 'next') => {
    setCurrentQuestionIndex((idx) => {
      if (direction === 'prev') return Math.max(0, idx - 1);
      return Math.min(questions.length - 1, idx + 1);
    });
  }, [questions.length]);

  const navigateToQuestion = useCallback((index: number) => setCurrentQuestionIndex(index), []);

  const toggleFlagQuestion = useCallback((questionId: string) => {
    setActiveTest((prev) => {
      if (!prev) return prev;
      const flagged = new Set(prev.flaggedQuestions);
      if (flagged.has(questionId)) flagged.delete(questionId);
      else flagged.add(questionId);
      return { ...prev, flaggedQuestions: Array.from(flagged) };
    });
  }, []);

  const logProctorEvent = useCallback(async (eventType: string, details?: Record<string, unknown>) => {
    if (!studentAssessmentIdRef.current) return;
    try {
      await setDoc(doc(collection(db, 'proctorEvents')), {
        studentAssessmentId: studentAssessmentIdRef.current,
        eventType,
        details: details || {},
        timestamp: new Date().toISOString(),
      });
    } catch (e) { console.error('Failed to log proctor event:', e); }
  }, []);

  const isFlagged = useCallback((questionId: string) => activeTest?.flaggedQuestions.includes(questionId) || false, [activeTest]);

  const isAnswered = useCallback((questionId: string) => {
    const ans = answers[questionId];
    if (!ans) return false;
    return !!(ans.selectedOptionId || ans.selectedOptionIds?.length || ans.textAnswer || ans.numericalAnswer !== undefined);
  }, [answers]);

  const answeredCount = Object.values(answers).filter((a) =>
    !!(a.selectedOptionId || a.selectedOptionIds?.length || a.textAnswer || a.numericalAnswer !== undefined)
  ).length;

  const flaggedCount = activeTest?.flaggedQuestions.length || 0;

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
    isFlagged,
    isAnswered,
    answeredCount,
    flaggedCount,
  };
};

export default useActiveTest;