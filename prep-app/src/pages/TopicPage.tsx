// prep-app/src/pages/TopicPage.tsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, BookOpen, Calculator, Sparkles, CheckCircle2,
  ChevronRight, Award, Clock, ArrowRight, ShieldCheck,
  Lightbulb, Zap, HelpCircle, Check, Copy, FileText, Flame, GraduationCap,
  Printer, Download, Eye, X, FileDown
} from 'lucide-react';
import {
  getSubject,
  getTopic,
  getPracticeQuestions,
  saveLearnerProgress,
  type PrepSubject,
  type PrepTopic,
  type UniversalQuestion
} from '../services/api';
import PracticeQuiz from '../components/PracticeQuiz';
import { renderMarkdownWithMath } from '../components/MathRenderer';
import { generateCheatSheetMarkdown, cleanKatexFormula } from '../../../src/shared/utils/prepHelpers';

interface TopicPageProps {
  subjectId: string;
  topicId: string;
  initialTab?: string;
  onBackToSubject: () => void;
  onBackToHub: () => void;
}

export default function TopicPage({
  subjectId,
  topicId,
  initialTab = 'explanation',
  onBackToSubject,
  onBackToHub,
}: TopicPageProps) {
  const [subject, setSubject] = useState<PrepSubject | null>(null);
  const [topic, setTopic] = useState<PrepTopic | null>(null);
  const [questions, setQuestions] = useState<UniversalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'explanation' | 'formulas' | 'tricks' | 'howToSolve' | 'practice'>('explanation');
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCheatSheetModal, setShowCheatSheetModal] = useState(false);

  const handleDownloadMarkdownCheatSheet = () => {
    if (!topic || !subject) return;
    const md = generateCheatSheetMarkdown({
      subjectName: subject.name,
      topicTitle: topic.title,
      moduleName: topic.moduleName,
      syllabusRef: subject.syllabusRef,
      formulas: topic.formulas,
      tricks: topic.tricks,
      howToSolve: topic.howToSolve,
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.id}-revision-cheat-sheet.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintCheatSheet = () => {
    window.print();
  };

  useEffect(() => {
    if (['explanation', 'formulas', 'tricks', 'howToSolve', 'practice'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [subjData, topData, qData] = await Promise.all([
        getSubject(subjectId),
        getTopic(subjectId, topicId),
        getPracticeQuestions({ topicId, subjectId, count: 10 }),
      ]);
      setSubject(subjData);
      setTopic(topData);
      setQuestions(qData);
      setLoading(false);

      // Record visit
      saveLearnerProgress({
        topicId,
        subjectId,
        visitedTab: activeTab,
      });
    }
    load();
  }, [subjectId, topicId]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    saveLearnerProgress({
      topicId,
      subjectId,
      visitedTab: tab,
    });
  };

  const handleMarkCompleted = () => {
    setIsCompleted(true);
    saveLearnerProgress({
      topicId,
      subjectId,
      completed: true,
    });
  };

  const copyFormula = (formula: string, id: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-400">Loading topic study pack…</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold">Topic Not Found</h3>
        <button
          onClick={onBackToSubject}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
        >
          Back to Subject
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
        <button onClick={onBackToHub} className="hover:text-teal-600 transition-colors">
          BBA Hub
        </button>
        <span>/</span>
        <button onClick={onBackToSubject} className="hover:text-teal-600 transition-colors">
          {subject?.name || 'Subject'}
        </button>
        <span>/</span>
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{topic.title}</span>
      </div>

      {/* Topic Title Bar */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {topic.moduleName && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                  {topic.moduleName}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                {topic.difficulty || 'Core'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {subject?.name}
              </span>
              {topic.examFrequency && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  topic.examFrequency === 'very_high'
                    ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                }`}>
                  <Flame className="w-3 h-3 fill-current" />
                  {topic.examFrequency === 'very_high' ? 'Very High PYQ Frequency' : 'High PYQ Frequency'}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Free Topic
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {topic.title}
            </h1>
            {/* University PYQ Highlights Banner */}
            {topic.pyqHighlights && topic.pyqHighlights.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mr-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Recent University PYQ:
                </span>
                {topic.pyqHighlights.map((pyq, pIdx) => (
                  <span
                    key={pIdx}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                  >
                    {pyq}
                  </span>
                ))}
              </div>
            )}
            {topic.subtopics && topic.subtopics.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 self-center mr-1">
                  Subtopics:
                </span>
                {topic.subtopics.map((st, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    {st}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCheatSheetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all"
              title="Open 1-Page Cheat Sheet Preview"
            >
              <Eye className="w-4 h-4" />
              <span>Cheat Sheet</span>
            </button>

            <button
              onClick={handlePrintCheatSheet}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-all shadow-sm"
              title="Print or Save PDF Cheat Sheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdownCheatSheet}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title="Download Offline Markdown File"
            >
              <FileDown className="w-4 h-4" />
              <span>Offline .md</span>
            </button>

            <button
              onClick={handleMarkCompleted}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCompleted ? 'Completed' : 'Mark Completed'}</span>
            </button>
          </div>
        </div>

        {/* Five Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          {[
            { id: 'explanation', label: '1. Explanation', icon: BookOpen },
            { id: 'formulas', label: `2. Formula Sheet (${topic.formulas?.length || 0})`, icon: Calculator },
            { id: 'tricks', label: `3. Shortcuts & Tricks (${topic.tricks?.length || 0})`, icon: Zap },
            { id: 'howToSolve', label: `4. How to Solve (${topic.howToSolve?.length || 0})`, icon: FileText },
            { id: 'practice', label: `5. Practice Quiz (${questions.length})`, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-all ${
                  isActive
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Explanation */}
      {activeTab === 'explanation' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6">
          <div className="prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
            {/* KaTeX & Markdown Hybrid Content Renderer */}
            {topic.explanationMd.split('\n\n').map((block, idx) => {
              if (block.startsWith('# ')) {
                return (
                  <h2 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    {renderMarkdownWithMath(block.replace(/^# /, ''))}
                  </h2>
                );
              }
              if (block.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base sm:text-lg font-bold text-teal-700 dark:text-teal-400 pt-3">
                    {renderMarkdownWithMath(block.replace(/^### /, ''))}
                  </h3>
                );
              }
              if (block.startsWith('---')) {
                return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-4" />;
              }
              if (block.includes('\n1. ') || block.startsWith('1. ')) {
                const items = block.split('\n').filter((l) => l.trim());
                return (
                  <ol key={idx} className="space-y-1.5 pl-4 list-decimal">
                    {items.map((it, iIdx) => (
                      <li key={iIdx} className="text-slate-700 dark:text-slate-300">
                        {renderMarkdownWithMath(it.replace(/^\d+\.\s*/, ''))}
                      </li>
                    ))}
                  </ol>
                );
              }
              if (block.includes('\n- ') || block.startsWith('- ')) {
                const items = block.split('\n').filter((l) => l.trim());
                return (
                  <ul key={idx} className="space-y-1.5 pl-4 list-disc">
                    {items.map((it, iIdx) => (
                      <li key={iIdx} className="text-slate-700 dark:text-slate-300">
                        {renderMarkdownWithMath(it.replace(/^-\s*/, ''))}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <div key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {renderMarkdownWithMath(block)}
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold">Concept Section</span>
            <button
              onClick={() => handleTabChange('formulas')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors"
            >
              <span>Next: Formula Sheet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Formula Sheet */}
      {activeTab === 'formulas' && (
        <div className="space-y-4">
          {(!topic.formulas || topic.formulas.length === 0) ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <Calculator className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Pure Qualitative Topic</p>
              <p className="text-xs text-slate-400">This topic focuses on administrative frameworks. Check Shortcuts & Tricks next!</p>
            </div>
          ) : (
            topic.formulas.map((f, idx) => (
              <div
                key={f.id || idx}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    {f.label}
                  </span>
                  <button
                    onClick={() => copyFormula(f.formula, f.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-teal-600 font-bold hover:underline"
                  >
                    {copiedId === f.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === f.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Formula Highlight Box with KaTeX math */}
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-sm sm:text-base font-bold text-teal-900 dark:text-teal-200 text-center">
                  {renderMarkdownWithMath(f.formula.includes('$') ? f.formula : `$$${f.formula}$$`)}
                </div>

                {/* Example Problem & Solution */}
                {(f.exampleQ || f.exampleA) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <p className="font-bold text-slate-400 uppercase text-[10px]">Realistic Exam Problem</p>
                      <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        {renderMarkdownWithMath(f.exampleQ)}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1.5">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px]">Step-by-Step Solution</p>
                      <div className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {renderMarkdownWithMath(f.exampleA)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => handleTabChange('explanation')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Back to Explanation
            </button>
            <button
              onClick={() => handleTabChange('tricks')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors"
            >
              <span>Next: Shortcuts & Tricks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Shortcuts & Tricks */}
      {activeTab === 'tricks' && (
        <div className="space-y-4">
          {(!topic.tricks || topic.tricks.length === 0) ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <Zap className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold">No shortcuts registered yet.</p>
            </div>
          ) : (
            topic.tricks.map((t, idx) => (
              <div
                key={t.id || idx}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 p-6 space-y-3 relative overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.title}
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                  {renderMarkdownWithMath(t.trick)}
                </div>

                {t.whenToUse && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <span className="font-bold text-amber-600 uppercase text-[10px]">When to use:</span>
                    <span>{renderMarkdownWithMath(t.whenToUse)}</span>
                  </p>
                )}
              </div>
            ))
          )}

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => handleTabChange('formulas')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Back to Formulas
            </button>
            <button
              onClick={() => handleTabChange('howToSolve')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-colors"
            >
              <span>Next: How to Solve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: How To Solve */}
      {activeTab === 'howToSolve' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Master Step-by-Step Scoring Framework for University Semester Question Papers.</span>
          </div>

          {(!topic.howToSolve || topic.howToSolve.length === 0) ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold">Standard framework coming soon.</p>
            </div>
          ) : (
            topic.howToSolve.map((h, idx) => (
              <div
                key={h.id || idx}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{h.step}</h4>
                  </div>
                  {h.questionType && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {h.questionType}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                  {renderMarkdownWithMath(h.detail)}
                </div>
              </div>
            ))
          )}

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => handleTabChange('tricks')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Back to Shortcuts
            </button>
            <button
              onClick={() => handleTabChange('practice')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/20"
            >
              <span>Take Timed Practice Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Practice Quiz */}
      {activeTab === 'practice' && (
        <PracticeQuiz
          topicId={topic.id}
          topicTitle={topic.title}
          subjectId={subjectId}
          questions={questions}
          onComplete={(score, total) => {
            if (score >= Math.ceil(total * 0.6)) {
              setIsCompleted(true);
            }
          }}
        />
      )}

      {/* Point 3: Printable & Previewable 1-Page Revision Cheat Sheet Modal */}
      {showCheatSheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm no-print">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-teal-600" />
                  1-Page University Revision Cheat Sheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {topic.title} · {subject?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintCheatSheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={handleDownloadMarkdownCheatSheet}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>.md</span>
                </button>
                <button
                  onClick={() => setShowCheatSheetModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs">
                💡 <strong>Exam Day Tip:</strong> This cheat sheet contains all high-yield formulas, examiner shortcuts, and scoring steps. Click <strong>Print / Save PDF</strong> to save it for offline review on your phone.
              </div>

              {/* Formulas */}
              {topic.formulas && topic.formulas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    1. High-Yield Formulas
                  </h4>
                  <div className="space-y-3">
                    {topic.formulas.map((f, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {i + 1}. {f.label}
                        </span>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-center font-bold text-teal-700 dark:text-teal-300">
                          {renderMarkdownWithMath(f.formula.includes('$') ? f.formula : `$$${f.formula}$$`)}
                        </div>
                        {f.exampleA && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            <strong>Exam Key:</strong> {renderMarkdownWithMath(f.exampleA)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortcuts */}
              {topic.tricks && topic.tricks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    2. Shortcuts & Traps
                  </h4>
                  <div className="space-y-2">
                    {topic.tricks.map((t, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                        <p className="font-bold text-slate-900 dark:text-white">{t.title}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{renderMarkdownWithMath(t.trick)}</p>
                        {t.whenToUse && (
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                            <em>When to use: {renderMarkdownWithMath(t.whenToUse)}</em>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How to solve */}
              {topic.howToSolve && topic.howToSolve.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    3. Scoring Framework Sequence
                  </h4>
                  <div className="space-y-2">
                    {topic.howToSolve.map((h, i) => (
                      <div key={i} className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Step {i + 1}: {h.step}
                        </span>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {renderMarkdownWithMath(h.detail)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Point 3: Dedicated Print-Only Revision Cheat Sheet Container */}
      <div id="printable-cheat-sheet" className="print-only cheat-sheet-print bg-white text-black p-8 font-sans space-y-6">
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                Vriddhi Prep · University Revision Cheat Sheet
              </h1>
              <p className="text-xs text-slate-600 font-semibold">
                Aligned with Karnataka State Higher Education Council (KSHEC) NEP 2020 CBCS (BU / BCU / BNU / UOM / VTU)
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded">
                {subject?.stream || 'BBA'}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs font-bold text-slate-800">
            <span>Subject: {subject?.name}</span>
            <span>•</span>
            <span>{topic.moduleName || 'Module Core'}</span>
            <span>•</span>
            <span>Topic: {topic.title}</span>
          </div>
        </div>

        {/* Formulas Grid */}
        {topic.formulas && topic.formulas.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              1. High-Yield Formulas & Formulations
            </h2>
            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {topic.formulas.map((f, i) => (
                <div key={i} className="p-2.5 rounded border border-slate-300 bg-slate-50 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{i + 1}. {f.label}</span>
                  </div>
                  <div className="font-mono text-center font-bold text-slate-950 py-1 text-sm bg-white border border-slate-200 rounded">
                    {renderMarkdownWithMath(f.formula.includes('$') ? f.formula : `$$${f.formula}$$`)}
                  </div>
                  {f.exampleA && (
                    <p className="text-[11px] text-slate-700">
                      <span className="font-bold">Exam Key: </span>{renderMarkdownWithMath(f.exampleA)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shortcuts & Tricks */}
        {topic.tricks && topic.tricks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              2. Examiner Shortcuts & Pitfall Warnings
            </h2>
            <div className="space-y-2 text-xs">
              {topic.tricks.map((t, i) => (
                <div key={i} className="p-2.5 rounded border border-amber-300 bg-amber-50/40">
                  <p className="font-bold text-amber-950">{i + 1}. {t.title}</p>
                  <p className="text-slate-800 mt-0.5">{renderMarkdownWithMath(t.trick)}</p>
                  {t.whenToUse && (
                    <p className="text-[10px] text-amber-900 font-semibold mt-1">
                      When to use: {renderMarkdownWithMath(t.whenToUse)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step by Step Scoring Guide */}
        {topic.howToSolve && topic.howToSolve.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              3. Step-by-Step Scoring Framework
            </h2>
            <div className="space-y-1.5 text-xs">
              {topic.howToSolve.map((h, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="font-bold text-slate-900 shrink-0">Step {i + 1}:</span>
                  <div>
                    <span className="font-bold text-slate-900">{h.step}</span>
                    <p className="text-slate-700">{renderMarkdownWithMath(h.detail)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-300 pt-3 flex justify-between text-[10px] text-slate-500 font-mono">
          <span>Vriddhi Prep Academic Revision • Valid for BU, BCU, BNU, UOM, VTU</span>
          <span>Self-Study & Offline Print Copy</span>
        </div>
      </div>
    </div>
  );
}
