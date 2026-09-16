// prep-app/src/components/PracticeQuiz.tsx
import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, XCircle, Award, RotateCcw,
  ChevronRight, AlertCircle, HelpCircle, ArrowRight, ShieldCheck, GraduationCap
} from 'lucide-react';
import { UniversalQuestion, saveLearnerProgress } from '../services/api';
import { renderMarkdownWithMath } from './MathRenderer';

interface PracticeQuizProps {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  questions: UniversalQuestion[];
  onComplete?: (score: number, total: number) => void;
}

export default function PracticeQuiz({
  topicId,
  topicTitle,
  subjectId,
  questions,
  onComplete,
}: PracticeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(questions.length * 60);

  // Timer countdown
  useEffect(() => {
    if (isFinished || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, timeLeft]);

  const currentQ = questions[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // locked once answered
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    setIsFinished(true);
    let correct = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) {
        correct++;
      }
    });

    saveLearnerProgress({
      topicId,
      subjectId,
      visitedTab: 'practice',
      quizScore: correct,
      quizTotal: questions.length,
      completed: correct >= Math.ceil(questions.length * 0.6),
    });

    if (onComplete) {
      onComplete(correct, questions.length);
    }
  };

  const handleRetake = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setIsFinished(false);
    setTimeLeft(questions.length * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No practice questions available</h4>
        <p className="text-xs text-slate-400">Questions are being added to the universal bank for this topic.</p>
      </div>
    );
  }

  // Quiz Results Summary View
  if (isFinished) {
    let score = 0;
    questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) score++;
    });
    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= 60;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 text-center space-y-6">
        <div
          className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border-2 ${
            isPassed
              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
          }`}
        >
          <Award className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {isPassed ? 'Exam Readiness Achieved!' : 'Keep Practicing!'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPassed
              ? `Outstanding performance on ${topicTitle}. You have mastered the core concepts.`
              : `Review the formula sheet and shortcuts for ${topicTitle} to boost your accuracy.`}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase text-slate-400">Score</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{score} / {questions.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase text-slate-400">Percentage</p>
            <p className="text-xl font-black text-teal-600 dark:text-teal-400">{percentage}%</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50">
            <p className="text-[10px] font-bold uppercase text-slate-400">Status</p>
            <p className={`text-xl font-black ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isPassed ? 'Passed' : 'Needs Review'}
            </p>
          </div>
        </div>

        {/* Question Review List */}
        <div className="text-left space-y-3 max-w-2xl mx-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase text-slate-400">Detailed Answer Review</h4>
          {questions.map((q, idx) => {
            const userPick = selectedAnswers[idx];
            const isCorrect = userPick === q.correctIndex;
            return (
              <div key={q.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="font-bold text-slate-900 dark:text-white">
                      Q{idx + 1}. {renderMarkdownWithMath(q.questionText)}
                    </div>
                  </div>
                  {q.pyqTag && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                      {q.pyqTag.university} {q.pyqTag.year} · {q.pyqTag.marks}M
                    </span>
                  )}
                </div>
                <div className="pl-6 space-y-1">
                  <div className="text-slate-600 dark:text-slate-300">
                    Your Answer:{' '}
                    <span className={isCorrect ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {userPick !== undefined ? renderMarkdownWithMath(q.options[userPick]) : 'Not answered'}
                    </span>
                  </div>
                  {!isCorrect && (
                    <div className="text-emerald-600 font-bold">
                      Correct Answer: {renderMarkdownWithMath(q.options[q.correctIndex])}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1">
                    <strong>Explanation:</strong> {renderMarkdownWithMath(q.explanation)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4">
          <button
            onClick={handleRetake}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Retake Practice Quiz
          </button>
        </div>
      </div>
    );
  }

  // Active Quiz View
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
      {/* Top Header: Progress & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-400 uppercase tracking-wider">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
            {currentQ.difficulty || 'Core'}
          </span>
          {currentQ.pyqTag && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              PYQ: {currentQ.pyqTag.university} {currentQ.pyqTag.year} · {currentQ.pyqTag.marks} Marks
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-teal-600" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Text */}
      <div className="space-y-4">
        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          {renderMarkdownWithMath(currentQ.questionText)}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentIndex] === idx;
            const isCorrect = currentQ.correctIndex === idx;
            const hasAnswered = selectedAnswers[currentIndex] !== undefined;

            let optStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-teal-500';

            if (hasAnswered) {
              if (isCorrect) {
                optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold';
              } else if (isSelected) {
                optStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-bold';
              } else {
                optStyle = 'border-slate-200 dark:border-slate-800 opacity-60 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-xs flex items-center justify-between ${optStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{renderMarkdownWithMath(option)}</span>
                </div>
                {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {hasAnswered && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Immediate Explanation Callout */}
      {showExplanation && (
        <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-xs space-y-1.5 animate-in fade-in duration-200">
          <p className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Examiner's Model Explanation
          </p>
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {renderMarkdownWithMath(currentQ.explanation)}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={selectedAnswers[currentIndex] === undefined}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md shadow-teal-500/10 active:scale-95"
        >
          {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz & View Score'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
