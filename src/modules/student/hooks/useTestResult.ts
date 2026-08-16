// src/modules/student/hooks/useTestResult.ts
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import type { TestResultSummary } from '../types/assessment';

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

      const q = query(
        collection(db, 'studentAssessments'),
        where('assessmentId', '==', testId),
        where('studentId', '==', studentId)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Result not found');
        setLoading(false);
        return;
      }

      const saDoc = snap.docs[0];
      const saData = saDoc.data();

      const assessmentDoc = await getDoc(doc(db, 'scheduledTests', testId));
      const assessmentData = assessmentDoc.exists() ? assessmentDoc.data() : {};

      const paperDoc = await getDoc(doc(db, 'papers', saData.paperId || assessmentData.paperId));
      const paperData = paperDoc.exists() ? paperDoc.data() : {};

      const questionResults: TestResultSummary['questionResults'] = [];
      const answers = saData.answers || [];
      const qIds = paperData.linkedQuestionIds || paperData.questionIds || [];

      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;

      for (let i = 0; i < qIds.length; i++) {
        const qId = qIds[i];
        const qDoc = await getDoc(doc(db, 'questions', qId));
        const qData = qDoc.exists() ? qDoc.data() : {};
        const ans = answers.find((a: any) => a.questionId === qId);

        let status: 'correct' | 'incorrect' | 'unattempted' | 'partial' = 'unattempted';
        let marksObtained = 0;
        let yourAnswer = 'Not attempted';
        let correctAnswer = '';

        if (qData.type === 'mcq' || qData.type === 'true_false') {
          const correctOpt = (qData.options || []).find((o: any) => o.isCorrect);
          correctAnswer = correctOpt?.id || correctOpt?.text || qData.correctAnswer || '';
          if (ans?.selectedOptionId) {
            yourAnswer = ans.selectedOptionId;
            if (ans.selectedOptionId === correctAnswer) {
              status = 'correct';
              marksObtained = qData.marks || 1;
              correctCount++;
            } else {
              status = 'incorrect';
              marksObtained = -(qData.negativeMarks || 0);
              incorrectCount++;
            }
          } else {
            unattemptedCount++;
          }
        } else if (qData.type === 'fill_in_blank' || qData.type === 'short_answer' || qData.type === 'long_answer') {
          correctAnswer = qData.correctAnswer || '';
          if (ans?.textAnswer) {
            yourAnswer = ans.textAnswer;
            if (ans.textAnswer.toLowerCase().trim() === (qData.correctAnswer || '').toLowerCase().trim()) {
              status = 'correct';
              marksObtained = qData.marks || 1;
              correctCount++;
            } else {
              status = 'incorrect';
              incorrectCount++;
            }
          } else {
            unattemptedCount++;
          }
        } else if (qData.type === 'numerical') {
          correctAnswer = String(qData.correctAnswer || '');
          if (ans?.numericalAnswer !== undefined) {
            yourAnswer = String(ans.numericalAnswer);
            if (Math.abs(ans.numericalAnswer - (parseFloat(qData.correctAnswer) || 0)) < 0.01) {
              status = 'correct';
              marksObtained = qData.marks || 1;
              correctCount++;
            } else {
              status = 'incorrect';
              incorrectCount++;
            }
          } else {
            unattemptedCount++;
          }
        }

        questionResults.push({
          questionId: qId,
          order: i + 1,
          marks: qData.marks || 1,
          marksObtained,
          status,
          yourAnswer,
          correctAnswer,
          explanation: qData.explanation,
        });
      }

      const totalObtained = questionResults.reduce((sum, q) => sum + q.marksObtained, 0);
      const totalMarks = saData.totalMarks || paperData.totalMarks || qIds.length;
      const percentage = totalMarks > 0 ? (totalObtained / totalMarks) * 100 : 0;

      let grade = 'F';
      let gradePoint = 0;
      if (percentage >= 90) { grade = 'O'; gradePoint = 10; }
      else if (percentage >= 80) { grade = 'A'; gradePoint = 9; }
      else if (percentage >= 70) { grade = 'B'; gradePoint = 8; }
      else if (percentage >= 60) { grade = 'C'; gradePoint = 7; }
      else if (percentage >= 50) { grade = 'D'; gradePoint = 6; }
      else if (percentage >= 40) { grade = 'E'; gradePoint = 5; }

      const summary: TestResultSummary = {
        studentAssessmentId: saDoc.id,
        assessmentId: testId,
        title: assessmentData.paperTitle || paperData.title || 'Test',
        subject: assessmentData.subject || paperData.subject || '',
        totalMarks,
        marksObtained: totalObtained,
        percentage: Math.round(percentage * 100) / 100,
        grade,
        gradePoint,
        timeSpent: saData.timeSpent || 0,
        totalQuestions: qIds.length,
        answeredCount: answers.length,
        correctCount,
        incorrectCount,
        unattemptedCount,
        sectionWise: [],
        questionResults,
        submittedAt: saData.submittedAt || '',
        gradedAt: saData.gradedAt,
        facultyFeedback: saData.facultyFeedback,
      };

      setResult(summary);
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

export default useTestResult;