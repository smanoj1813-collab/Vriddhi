import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, BookOpen, Calculator, Award, Lightbulb,
  Printer, RefreshCw, Loader2, CheckCircle2, ChevronRight, AlertCircle, Copy, Check
} from 'lucide-react';
import {
  fetchAIStudyMaterial,
  type AIStudyPack,
  type FetchStudyMaterialInput
} from '@/shared/services/aiStudyMaterialService';
import { useAuth } from '@/modules/auth/context/AuthContext';

/**
 * Mirrors the server-side cost guard in functions/src/routes/ai-chat.ts:
 * content refresh is a PLATFORM operation (central content team = superadmin).
 * Colleges consume the shared library — they never pay to regenerate it.
 */
const REGENERATE_ROLES = ['superadmin'];

interface AIStudyCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: FetchStudyMaterialInput;
}

export default function AIStudyCompanionModal({
  isOpen,
  onClose,
  context,
}: AIStudyCompanionModalProps) {
  const { user } = useAuth();
  // Regenerating is a paid LLM call and content is centrally operated — the
  // button exists only for the platform content team (the server
  // independently 403s everyone else; this keeps the UI honest before the
  // request ever leaves the browser).
  const canRegenerate = REGENERATE_ROLES.includes(user?.role || '');
  const [activeTab, setActiveTab] = useState<'concept' | 'cheatSheet' | 'example' | 'examPrep'>('concept');
  const [studyPack, setStudyPack] = useState<AIStudyPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'cache' | 'generated' | null>(null);
  const [servedVersion, setServedVersion] = useState<number | null>(null);
  const [cooldownNote, setCooldownNote] = useState<string | null>(null);
  const [waitingNote, setWaitingNote] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const loadMaterial = async (forceRefresh = false) => {
    if (!context.subject || !context.topic) return;
    setLoading(true);
    setError(null);
    setCooldownNote(null);
    setWaitingNote(null);

    try {
      const res = await fetchAIStudyMaterial(
        {
          ...context,
          forceRefresh,
        },
        {
          // Someone else is already paying for this pack's generation — the
          // service polls and serves the shared result (the concurrency
          // guard saves a duplicate LLM call; this note just explains the
          // wait instead of looking stuck).
          onWaiting: (info) =>
            setWaitingNote(
              `A study pack for this topic is already being generated — waiting for the shared copy (attempt ${info.attempt})…`
            ),
        }
      );
      setStudyPack(res.data);
      setSource(res.source);
      setServedVersion(typeof res.servedVersion === 'number' ? res.servedVersion : null);
    } catch (err: any) {
      const serverBody = (err as { body?: unknown })?.body as Record<string, unknown> | undefined;
      if (err?.status === 429 && serverBody?.regenerateAvailableAt) {
        // Per-key cooldown (staff refresh): the pack on screen is still
        // valid — keep it and say why the refresh did not happen.
        setCooldownNote(err?.message || 'This pack was generated very recently. Try again later.');
        setTimeout(() => setCooldownNote(null), 8000);
      } else {
        // Daily caps / exam freeze / real failures surface as hard errors
        // with the server's own reason text.
        console.error('[AIStudyCompanion] Load failed:', err);
        setError(err?.message || 'Could not load AI study material. Please try again.');
      }
    } finally {
      setLoading(false);
      setWaitingNote(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void loadMaterial(false);
    } else {
      setStudyPack(null);
      setError(null);
      setSource(null);
      setServedVersion(null);
      setCooldownNote(null);
      setWaitingNote(null);
    }
  }, [isOpen, context.subject, context.topic]);

  const handlePrint = () => {
    if (!studyPack) return;
    const win = window.open('', '_blank');
    if (!win) return;

    let html = `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #111; line-height: 1.6;">
        <div style="border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #0f766e; margin: 0 0 4px 0; font-size: 22px;">Vriddhi AI Study Guide: ${studyPack.title}</h1>
          <p style="margin: 0; color: #666; font-size: 13px;">Course: ${studyPack.subject} | Module: ${context.moduleName || 'Syllabus'}</p>
        </div>

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">1. Core Concept Overview</h2>
        <p style="font-size: 13px; color: #334155;">${studyPack.overview}</p>

        <h3 style="font-size: 14px; margin-top: 15px;">Key Takeaways:</h3>
        <ul style="font-size: 12px; color: #475569;">
          ${studyPack.quickSummaryPoints.map(p => `<li>${p}</li>`).join('')}
        </ul>

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">2. Formulas &amp; Definitions Cheat Sheet</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Term / Principle</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Definition &amp; Rule</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Exam Relevance</th>
            </tr>
          </thead>
          <tbody>
            ${studyPack.keyConcepts.map(c => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${c.term}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">
                  ${c.definition}
                  ${c.formulaOrRule && c.formulaOrRule !== 'N/A' ? `<div style="margin-top: 4px; font-family: monospace; color: #0f766e;"><strong>Rule/Formula:</strong> ${c.formulaOrRule}</div>` : ''}
                </td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">${c.importance || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${studyPack.workedExample ? `
          <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">3. Practical Worked Problem / Case Study</h2>
          <div style="background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px;">
            <p style="font-weight: bold; margin: 0 0 8px 0;">Scenario: ${studyPack.workedExample.scenario}</p>
            ${studyPack.workedExample.steps.map(s => `
              <div style="margin-bottom: 6px;">
                <strong>${s.step}:</strong> ${s.details}
              </div>
            `).join('')}
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-weight: bold; color: #047857;">
              Result: ${studyPack.workedExample.solution}
            </div>
          </div>
        ` : ''}

        <h2 style="font-size: 16px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 25px;">4. University Exam &amp; Viva Questions</h2>
        ${studyPack.examPrep.map((q, idx) => `
          <div style="margin-bottom: 12px; font-size: 12px;">
            <p style="font-weight: bold; margin: 0;">Q${idx + 1}. [${q.marks} Marks] ${q.question}</p>
            <p style="margin: 4px 0 0 15px; color: #334155;"><strong>Model Answer:</strong> ${q.expectedAnswer}</p>
            ${q.examTip ? `<p style="margin: 2px 0 0 15px; font-size: 11px; color: #d97706;"><em>Examiner Tip: ${q.examTip}</em></p>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    win.document.write(html);
    win.document.close();
    win.print();
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {context.topic}
                </h2>
                {source === 'cache' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    Instant Cache
                  </span>
                )}
                {source === 'generated' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                    AI Generated
                  </span>
                )}
                {servedVersion !== null && servedVersion > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20 shrink-0"
                    title="Versioned edition: your campus always sees this version unless your own faculty updates it"
                  >
                    v{servedVersion}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {context.subject} {context.courseCode ? `(${context.courseCode})` : ''} • {context.moduleName || 'Syllabus Topic'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canRegenerate && (
              <button
                onClick={() => loadMaterial(true)}
                disabled={loading}
                className="p-2 rounded-xl text-slate-500 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                title="Regenerate with AI (platform content team only)"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={handlePrint}
              disabled={!studyPack || loading}
              className="p-2 rounded-xl text-slate-500 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Print / Save Notes"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 gap-1 overflow-x-auto bg-slate-50/20 dark:bg-slate-900/20">
          <button
            onClick={() => setActiveTab('concept')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'concept'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-[#131b2e]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" /> Concept &amp; Intuition
          </button>
          <button
            onClick={() => setActiveTab('cheatSheet')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'cheatSheet'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-[#131b2e]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Cheat Sheet &amp; Formulas
          </button>
          <button
            onClick={() => setActiveTab('example')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'example'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-[#131b2e]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> Worked Case Study
          </button>
          <button
            onClick={() => setActiveTab('examPrep')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
              activeTab === 'examPrep'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-[#131b2e]'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Exam &amp; Viva Q&amp;A
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cooldownNote && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cooldownNote}</span>
            </div>
          )}
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Crafting Structured Study Pack for {context.topic}...
              </p>
              <p className="text-[11px] text-slate-500">
                {waitingNote || 'Analyzing university syllabus requirements and generating exam-focused summaries'}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && studyPack && (
            <>
              {/* Tab 1: Concept & Intuition */}
              {activeTab === 'concept' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/20 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Concept Overview
                    </span>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {studyPack.overview}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      High-Yield Exam Takeaways
                    </h3>
                    <div className="space-y-2">
                      {studyPack.quickSummaryPoints.map((point, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Cheat Sheet & Definitions */}
              {activeTab === 'cheatSheet' && (
                <div className="space-y-3">
                  {studyPack.keyConcepts.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {item.term}
                        </h4>
                        {item.importance && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20 shrink-0">
                            Exam Crucial
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.definition}
                      </p>

                      {item.formulaOrRule && item.formulaOrRule !== 'N/A' && (
                        <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/20 text-xs font-mono text-teal-800 dark:text-teal-300">
                          <span className="font-sans font-bold text-[10px] uppercase text-teal-600 block mb-0.5">Rule / Formula:</span>
                          {item.formulaOrRule}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Worked Case Study / Problem */}
              {activeTab === 'example' && (
                <div className="space-y-4">
                  {studyPack.workedExample ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          Problem Scenario
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-1 leading-relaxed">
                          {studyPack.workedExample.scenario}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Step-by-Step Resolution
                        </span>
                        {studyPack.workedExample.steps.map((st, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
                            <strong className="text-teal-700 dark:text-teal-300 font-bold block">{st.step}</strong>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{st.details}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                        <span className="text-[10px] uppercase tracking-wider block font-black text-emerald-600 mb-0.5">Final Solution &amp; Conclusion:</span>
                        {studyPack.workedExample.solution}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No worked example available for this concept.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Exam & Viva Q&A */}
              {activeTab === 'examPrep' && (
                <div className="space-y-3.5">
                  {studyPack.examPrep.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          Q{idx + 1}. {q.question}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs shrink-0">
                          {q.marks} Marks
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Model Answer:</span>
                        <p className="leading-relaxed">{q.expectedAnswer}</p>
                      </div>

                      {q.examTip && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          💡 Examiner Tip: {q.examTip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Vriddhi Academic AI • Cached for 100% Institution Free Access</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
