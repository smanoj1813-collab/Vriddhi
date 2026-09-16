// prep-app/src/pages/SubjectPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BookOpen, Calculator, Sparkles, CheckCircle2,
  ChevronRight, HelpCircle, Award, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { getSubject, getTopics, getLearnerProgress, type PrepSubject, type PrepTopic, type LearnerProgress } from '../services/api';

interface SubjectPageProps {
  subjectId: string;
  onBack: () => void;
  onSelectTopic: (topicId: string, initialTab?: string) => void;
}

export default function SubjectPage({ subjectId, onBack, onSelectTopic }: SubjectPageProps) {
  const [subject, setSubject] = useState<PrepSubject | null>(null);
  const [topics, setTopics] = useState<PrepTopic[]>([]);
  const [progress, setProgress] = useState<LearnerProgress>({ topicsCompleted: {} });
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subj, topList, prog] = await Promise.all([
        getSubject(subjectId),
        getTopics(subjectId),
        getLearnerProgress(),
      ]);
      setSubject(subj);
      setTopics(topList);
      setProgress(prog);
      setLoading(false);
    }
    load();
  }, [subjectId]);

  const filteredTopics = topics.filter((t) => {
    if (difficultyFilter !== 'all' && t.difficulty !== difficultyFilter) return false;
    return true;
  });

  const completedCount = topics.filter((t) => progress.topicsCompleted?.[t.id]?.completed).length;
  const progressPercent = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to All Subjects
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold">{subject?.name || 'Subject'}</span>
      </div>

      {/* Subject Header Banner */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {subject?.semester && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-600 text-white">
                  Semester {subject.semester}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {subject?.stream || 'Management'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {subject?.yearGroup === '1st-year' ? '1st Year' : subject?.yearGroup === '2nd-year' ? '2nd Year' : 'Final Year'}
              </span>
              {subject?.syllabusRef && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {subject.syllabusRef}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {subject?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {subject?.description || 'Standard university module study packs with step-by-step problem solvers and practice tests.'}
            </p>
          </div>

          {/* Progress Pill */}
          <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completion</p>
            <p className="text-xl font-black text-teal-600 dark:text-teal-400">{progressPercent}%</p>
            <p className="text-[11px] text-slate-500">{completedCount} of {topics.length} topics</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Difficulty:</span>
          {[
            { id: 'all', label: 'All Topics' },
            { id: 'basic', label: 'Foundation' },
            { id: 'core', label: 'Core University' },
            { id: 'advanced', label: 'Advanced' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficultyFilter(d.id)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                difficultyFilter === d.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-400'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-400">
          Showing {filteredTopics.length} topics
        </span>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          ))
        ) : filteredTopics.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-bold">No topics found for this filter.</p>
          </div>
        ) : (
          filteredTopics.map((topic, idx) => {
            const isCompleted = progress.topicsCompleted?.[topic.id]?.completed;
            const visitedCount = progress.topicsCompleted?.[topic.id]?.visitedTabs?.length || 0;
            const quizScore = progress.topicsCompleted?.[topic.id]?.quizScore;

            return (
              <div
                key={topic.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 hover:border-teal-500/60 transition-all duration-200 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {topic.order || idx + 1}
                    </span>
                    <div>
                      {topic.moduleName && (
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-0.5">
                          {topic.moduleName}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <h3
                          onClick={() => onSelectTopic(topic.id)}
                          className="text-base font-bold text-slate-900 dark:text-white hover:text-teal-600 transition-colors cursor-pointer"
                        >
                          {topic.title}
                        </h3>
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-semibold">
                        <span className="capitalize">{topic.difficulty || 'Core'} difficulty</span>
                        <span>·</span>
                        <span>{topic.formulas?.length || 0} Formulas</span>
                        <span>·</span>
                        <span>{topic.tricks?.length || 0} Tricks</span>
                        {quizScore !== undefined && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Quiz Score: {quizScore}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Granular Subtopics Breakdown */}
                      {topic.subtopics && topic.subtopics.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {topic.subtopics.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTopic(topic.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shrink-0"
                  >
                    <span>Open Study Pack</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Direct Tab Shortcut Pills */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Jump to:</span>
                  <button
                    onClick={() => onSelectTopic(topic.id, 'explanation')}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
                  >
                    Explanation
                  </button>
                  <button
                    onClick={() => onSelectTopic(topic.id, 'formulas')}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
                  >
                    Formula Sheet ({topic.formulas?.length || 0})
                  </button>
                  <button
                    onClick={() => onSelectTopic(topic.id, 'tricks')}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
                  >
                    Shortcuts & Tricks ({topic.tricks?.length || 0})
                  </button>
                  <button
                    onClick={() => onSelectTopic(topic.id, 'howToSolve')}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 text-slate-600 dark:text-slate-300 font-semibold transition-colors"
                  >
                    How to Solve ({topic.howToSolve?.length || 0} Steps)
                  </button>
                  <button
                    onClick={() => onSelectTopic(topic.id, 'practice')}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold transition-colors"
                  >
                    Timed Quiz
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
