import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Brain, Clock, CheckCircle, AlertTriangle, Zap, Award,
  BookOpen, FileText, TrendingUp, Users, BarChart3,
  Lightbulb, Target, Timer, Sparkles, Eye, RefreshCw, Loader2
} from 'lucide-react';
import {
  FIVE_MARKS_RUBRICS, TEN_MARKS_RUBRICS,
  FIVE_MARKS_PRESETS, TEN_MARKS_PRESETS,
  autoGradeAnswer, calculateTimeSaved, groupSimilarAnswers,
  type Rubric, type AutoGradingResult, type QuestionMarks
} from '@/shared/utils/autoGrading';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/Firebase/config';
import { useAuth } from '@/modules/auth/context/AuthContext';

// Real pending submission from backend
interface PendingResponse {
  questionId: string;
  questionText: string;
  type: string;
  marks: number;
  answer: string;
}
interface PendingSubmission {
  id: string;
  testId: string;
  title: string;
  subject: string;
  studentId: string;
  studentName: string;
  regNo: string;
  autoScore: number;
  autoMax: number;
  manualMax: number;
  totalMarks: number;
  submittedAt: string;
  isLateSubmission: boolean;
  latePenaltyPercentage: number;
  responses: PendingResponse[];
}

// Flattened for auto-grading UI
interface GradingItem {
  submissionId: string; // studentAssessmentId
  responseId: string; // questionId
  studentName: string;
  regNo: string;
  questionId: string;
  questionText: string;
  maxMarks: number;
  answer: string;
  subject: string;
  title: string;
  isLate: boolean;
}

export default function FacultyAutoGrading() {
  const { user } = useAuth();
  const collegeId = user?.collegeId || '';
  const [selectedRubric, setSelectedRubric] = useState<Rubric>(FIVE_MARKS_RUBRICS[0]);
  const [gradingResults, setGradingResults] = useState<Record<string, AutoGradingResult>>({});
  const [selectedItem, setSelectedItem] = useState<GradingItem | null>(null);
  const [bulkGroups, setBulkGroups] = useState<ReturnType<typeof groupSimilarAnswers>>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [gradingItems, setGradingItems] = useState<GradingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterMarks, setFilterMarks] = useState<'all' | '5' | '10'>('all');

  // Load real pending submissions
  const loadPending = useCallback(async () => {
    if (!collegeId) return;
    try {
      setLoading(true);
      setError(null);
      const list = httpsCallable<{ collegeId: string }, { submissions: PendingSubmission[] }>(
        functions, 'listPendingAssessmentSubmissions'
      );
      const res = await list({ collegeId });
      setPendingSubmissions(res.data.submissions);

      // Flatten to grading items (only descriptive: short_answer, long_answer)
      const items: GradingItem[] = [];
      for (const sub of res.data.submissions) {
        for (const resp of sub.responses) {
          // Only include if marks is 5 or 10 or >2 (descriptive)
          if (resp.marks >= 2) {
            items.push({
              submissionId: sub.id,
              responseId: resp.questionId,
              studentName: sub.studentName,
              regNo: sub.regNo,
              questionId: resp.questionId,
              questionText: resp.questionText,
              maxMarks: resp.marks,
              answer: resp.answer || '',
              subject: sub.subject,
              title: sub.title,
              isLate: sub.isLateSubmission,
            });
          }
        }
      }
      setGradingItems(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const filteredItems = useMemo(() => {
    if (filterMarks === 'all') return gradingItems;
    const m = filterMarks === '5' ? 5 : 10;
    return gradingItems.filter(i => i.maxMarks === m);
  }, [gradingItems, filterMarks]);

  const timeSavedStats = useMemo(() => {
    const fiveCount = gradingItems.filter(s => s.maxMarks === 5).length;
    const tenCount = gradingItems.filter(s => s.maxMarks === 10).length;
    if (gradingItems.length === 0) return calculateTimeSaved(4, 2, 2, 0.7);
    return calculateTimeSaved(gradingItems.length, fiveCount, tenCount, 0.7);
  }, [gradingItems]);

  const handleAutoGrade = (item: GradingItem) => {
    const rubric = item.maxMarks === 5 ? FIVE_MARKS_RUBRICS[0] : item.maxMarks === 10 ? TEN_MARKS_RUBRICS[0] : selectedRubric;
    const result = autoGradeAnswer(item.answer, item.maxMarks as QuestionMarks, rubric);
    result.questionId = item.questionId;
    const key = `${item.submissionId}_${item.questionId}`;
    setGradingResults(prev => ({ ...prev, [key]: result }));
  };

  const handleAutoGradeAll = () => {
    const results: Record<string, AutoGradingResult> = {};
    filteredItems.forEach(item => {
      const rubric = item.maxMarks === 5 ? FIVE_MARKS_RUBRICS[0] : item.maxMarks === 10 ? TEN_MARKS_RUBRICS[0] : selectedRubric;
      const result = autoGradeAnswer(item.answer, item.maxMarks as QuestionMarks, rubric);
      result.questionId = item.questionId;
      const key = `${item.submissionId}_${item.questionId}`;
      results[key] = result;
    });
    setGradingResults(prev => ({ ...prev, ...results }));

    const groups = groupSimilarAnswers(
      filteredItems.map(s => ({ studentId: `${s.submissionId}_${s.questionId}`, answer: s.answer, questionId: s.questionId, maxMarks: s.maxMarks })),
      0.6
    );
    setBulkGroups(groups);
  };

  const handleQuickGrade = (item: GradingItem, marks: number) => {
    const key = `${item.submissionId}_${item.questionId}`;
    const existing = gradingResults[key];
    if (existing) {
      setGradingResults(prev => ({
        ...prev,
        [key]: { ...existing, suggestedMarks: marks, gradingMode: 'manual', confidence: 1 } as AutoGradingResult,
      }));
    } else {
      // Create manual result
      const rubric = item.maxMarks === 5 ? FIVE_MARKS_RUBRICS[0] : TEN_MARKS_RUBRICS[0];
      const auto = autoGradeAnswer(item.answer, item.maxMarks as QuestionMarks, rubric);
      auto.suggestedMarks = marks;
      auto.gradingMode = 'manual';
      auto.confidence = 1;
      setGradingResults(prev => ({ ...prev, [key]: auto }));
    }
  };

  const handlePublish = async (item: GradingItem) => {
    const key = `${item.submissionId}_${item.questionId}`;
    const result = gradingResults[key];
    if (!result) return;
    try {
      setSavingId(key);
      // Find submission to get current total manual marks
      const sub = pendingSubmissions.find(s => s.id === item.submissionId);
      if (!sub) throw new Error('Submission not found');
      // We need to publish per question? The existing gradeStudentAssessmentSubmission expects total manualScore
      // For now, we publish the whole submission with this question's marks as manualScore if single question, else sum
      // Simpler: collect all graded results for this submissionId
      const allForSubmission = Object.entries(gradingResults)
        .filter(([k]) => k.startsWith(item.submissionId + '_'))
        .map(([k, v]) => {
          const qId = k.split('_').slice(1).join('_');
          return { questionId: qId, marks: v.suggestedMarks };
        });
      // Include current item if not in allForSubmission yet
      if (!allForSubmission.find(x => x.questionId === item.questionId)) {
        allForSubmission.push({ questionId: item.questionId, marks: result.suggestedMarks });
      }
      const totalManual = allForSubmission.reduce((a, b) => a + b.marks, 0);
      const grade = httpsCallable<
        { studentAssessmentId: string; manualScore: number; manualMarks?: Array<{ questionId: string; marks: number }>; feedback?: string },
        { success: boolean }
      >(functions, 'gradeStudentAssessmentSubmission');
      await grade({
        studentAssessmentId: item.submissionId,
        manualScore: totalManual,
        manualMarks: allForSubmission,
        feedback: result.overallFeedback,
      });
      // Remove published items from list
      setGradingItems(prev => prev.filter(i => i.submissionId !== item.submissionId));
      setPendingSubmissions(prev => prev.filter(s => s.id !== item.submissionId));
      setSelectedItem(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish grade');
    } finally {
      setSavingId(null);
    }
  };

  const getKey = (item: GradingItem) => `${item.submissionId}_${item.questionId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="text-teal-600" />
            Auto-Grading: 5 Marks & 10 Marks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reduce faculty manual review time by 70% - Rubric-based + AI-assisted grading for BCU descriptive papers
            {collegeId && <span className="ml-2 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{collegeId.slice(0, 8)}...</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadPending()} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Time Saved Banner */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Zap size={24} />
              Save {timeSavedStats.savedHours} Hours per Exam
            </h3>
            <p className="text-teal-50 mt-2">
              Manual: {timeSavedStats.manualTimeMinutes} min for {gradingItems.length} answers.
              Auto: {timeSavedStats.autoTimeMinutes} min.
              <strong> Save {timeSavedStats.percentageSaved}% time</strong> with rubric + AI.
              {pendingSubmissions.length > 0 && ` • ${pendingSubmissions.length} submissions pending`}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                <p className="text-xs uppercase font-bold text-teal-100">5 Marks</p>
                <p className="font-black text-lg">75 sec → 15 sec</p>
                <p className="text-xs text-teal-100">80% saved</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                <p className="text-xs uppercase font-bold text-teal-100">10 Marks</p>
                <p className="font-black text-lg">150 sec → 30 sec</p>
                <p className="text-xs text-teal-100">80% saved</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                <p className="text-xs uppercase font-bold text-teal-100">Bulk Group</p>
                <p className="font-black text-lg">{bulkGroups.length} groups</p>
                <p className="text-xs text-teal-100">Similar answers</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 self-start lg:self-center">
            <div className="flex gap-2">
              <button onClick={() => setFilterMarks('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterMarks === 'all' ? 'bg-white text-teal-700 border-white' : 'bg-white/15 text-white border-white/30'}`}>All ({gradingItems.length})</button>
              <button onClick={() => setFilterMarks('5')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterMarks === '5' ? 'bg-white text-teal-700 border-white' : 'bg-white/15 text-white border-white/30'}`}>5M ({gradingItems.filter(i => i.maxMarks === 5).length})</button>
              <button onClick={() => setFilterMarks('10')} className={`px-3 py-1.5 rounded-full text-xs font-bold border ${filterMarks === '10' ? 'bg-white text-teal-700 border-white' : 'bg-white/15 text-white border-white/30'}`}>10M ({gradingItems.filter(i => i.maxMarks === 10).length})</button>
            </div>
            <button
              onClick={handleAutoGradeAll}
              disabled={filteredItems.length === 0 || loading}
              className="px-8 py-4 bg-white text-teal-700 rounded-xl font-black text-sm hover:bg-teal-50 transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles size={18} />
              Auto-Grade All {filteredItems.length} Answers
            </button>
          </div>
        </div>
      </div>

      {/* Rubric Selector */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Target size={18} className="text-teal-600" />
          Select Rubric - 5M & 10M Patterns (BCU SEP 2024)
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">5 Marks Rubrics</h4>
            <div className="space-y-2">
              {FIVE_MARKS_RUBRICS.map(rubric => (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRubric.id === rubric.id ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                >
                  <p className="font-bold text-sm">{rubric.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{rubric.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rubric.criteria.map(c => (
                      <span key={c.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold">
                        {c.label}: {c.maxMarks}M
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">10 Marks Rubrics</h4>
            <div className="space-y-2">
              {TEN_MARKS_RUBRICS.map(rubric => (
                <button
                  key={rubric.id}
                  onClick={() => setSelectedRubric(rubric)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRubric.id === rubric.id ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                >
                  <p className="font-bold text-sm">{rubric.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{rubric.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {rubric.criteria.map(c => (
                      <span key={c.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold">
                        {c.label}: {c.maxMarks}M
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Selected: {selectedRubric.title} ({selectedRubric.totalMarks}M)</h4>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">{selectedRubric.description}</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="ml-3 font-bold">Loading pending submissions from Firestore...</span>
        </div>
      )}

      {!loading && gradingItems.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-[#131b2e] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">No descriptive submissions pending</p>
          <p className="text-sm text-slate-500 mt-1">All 5M/10M answers graded! Check Assessment → Manual grading tab or schedule a test with descriptive questions.</p>
          <button onClick={() => void loadPending()} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-bold">Refresh</button>
        </div>
      )}

      {/* Grading Queue */}
      {!loading && gradingItems.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 space-y-3 max-h-[80vh] overflow-y-auto pr-1">
            <h3 className="font-bold flex items-center gap-2 sticky top-0 bg-white dark:bg-[#131b2e] py-2 z-10">
              <FileText size={18} className="text-teal-600" />
              Answers ({filteredItems.length}/{gradingItems.length})
            </h3>
            {filteredItems.map(item => {
              const key = getKey(item);
              const result = gradingResults[key];
              const isGraded = !!result;
              const isSelected = selectedItem && getKey(selectedItem) === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 shadow-md' : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800 hover:border-slate-300'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.studentName}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.regNo} • {item.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{item.questionText}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${item.maxMarks === 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : item.maxMarks === 10 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                          {item.maxMarks}M
                        </span>
                        <span className="text-xs text-slate-500">{item.subject}</span>
                        {item.isLate && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Late</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {isGraded ? (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${result.needsManualReview ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {result.suggestedMarks}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Clock size={16} className="text-slate-400" />
                        </div>
                      )}
                      {isGraded && (
                        <p className="text-[10px] font-bold mt-1" style={{ color: result.confidence > 0.8 ? '#10b981' : result.confidence > 0.6 ? '#f59e0b' : '#ef4444' }}>
                          {Math.round(result.confidence * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                  {isGraded && (
                    <div className="mt-3 flex items-center gap-2">
                      {result.needsManualReview ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                          <AlertTriangle size={10} /> Needs Review
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <CheckCircle size={10} /> Auto
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Timer size={10} /> Saved {Math.round(result.timeSaved)}s
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selectedItem ? (
              <div className="h-full flex flex-col items-center justify-center py-16 bg-white dark:bg-[#131b2e] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Eye className="w-12 h-12 text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">Select an answer to grade</p>
                <p className="text-sm text-slate-500 mt-1">Choose from left - auto-grading with rubric + keyword check</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        <BookOpen size={18} className="text-teal-600" />
                        {selectedItem.questionText}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{selectedItem.subject} • {selectedItem.maxMarks} Marks • {selectedItem.regNo} • {selectedItem.title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-black border ${selectedItem.maxMarks === 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {selectedItem.maxMarks}M
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                  <h4 className="font-bold text-sm mb-3">Student Answer - {selectedItem.studentName}</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {selectedItem.answer || <span className="text-slate-400 italic">Not answered</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{selectedItem.answer.split(/\s+/).filter(Boolean).length} words • {selectedItem.answer.length} chars</p>
                </div>

                {(() => {
                  const key = getKey(selectedItem);
                  const result = gradingResults[key];
                  if (!result) {
                    return (
                      <div className="space-y-3">
                        <button
                          onClick={() => handleAutoGrade(selectedItem)}
                          className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Brain size={18} />
                          Auto-Grade this {selectedItem.maxMarks}M Answer (Rubric + AI)
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
                              <Lightbulb size={14} /> 5M Pattern
                            </h4>
                            <ul className="text-xs text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                              <li>• Definition 2M + Explanation 2M + Example 1M</li>
                              <li>• Keyword + word count (120 words expected)</li>
                              <li>• 75 sec → 15 sec (80% saved)</li>
                            </ul>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm flex items-center gap-2">
                              <Award size={14} /> 10M Pattern
                            </h4>
                            <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                              <li>• Intro 2M + Body 6M + Conclusion 2M</li>
                              <li>• Structure, examples, case study</li>
                              <li>• 150 sec → 30 sec (80% saved)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      <div className={`rounded-2xl p-5 border ${result.needsManualReview ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold flex items-center gap-2">
                            <Brain size={18} className={result.needsManualReview ? 'text-amber-600' : 'text-emerald-600'} />
                            Auto Result - {result.confidence > 0.8 ? 'High' : result.confidence > 0.6 ? 'Medium' : 'Low'} Confidence
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-black ${result.needsManualReview ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {result.suggestedMarks} / {result.maxMarks}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                            <p className="text-lg font-black" style={{ color: result.confidence > 0.8 ? '#10b981' : result.confidence > 0.6 ? '#f59e0b' : '#ef4444' }}>{Math.round(result.confidence * 100)}%</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Confidence</p>
                          </div>
                          <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                            <p className="text-lg font-black text-teal-600">{Math.round(result.timeSaved)}s</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Saved</p>
                          </div>
                          <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                            <p className="text-lg font-black text-blue-600">{result.keywordsMatched.length}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500">Keywords</p>
                          </div>
                        </div>
                        <p className="text-sm mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border"><strong>Feedback:</strong> {result.overallFeedback}</p>
                        <div className="mt-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Rubric Breakdown</p>
                          <div className="space-y-2">
                            {result.breakdown.map(c => (
                              <div key={c.criterionId} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-xs">{c.label}</p>
                                  <p className="text-[11px] text-slate-500">{c.feedback}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.matched ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{c.matched ? 'Matched' : 'Missing'}</span>
                                  <span className="font-black text-sm">{c.awarded}/{c.max}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                          <div><p className="font-bold text-emerald-700">Matched:</p><p className="text-slate-600 dark:text-slate-400 mt-1">{result.keywordsMatched.slice(0, 8).join(', ') || 'None'}</p></div>
                          <div><p className="font-bold text-rose-700">Missing:</p><p className="text-slate-600 dark:text-slate-400 mt-1">{result.keywordsMissing.slice(0, 8).join(', ') || 'None'}</p></div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Zap size={16} className="text-amber-600" />Quick Grade - {selectedItem.maxMarks}M Presets (One Click)</h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                          {(selectedItem.maxMarks === 5 ? FIVE_MARKS_PRESETS : selectedItem.maxMarks === 10 ? TEN_MARKS_PRESETS : FIVE_MARKS_PRESETS).map(preset => (
                            <button key={preset.marks} onClick={() => handleQuickGrade(selectedItem, preset.marks)} className={`p-3 rounded-xl border text-center transition-all hover:scale-105 ${result.suggestedMarks === preset.marks ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'}`}>
                              <p className="font-black text-lg">{preset.marks}</p>
                              <p className="text-[10px] font-bold mt-1 leading-tight">{preset.label.split(' - ')[1] || preset.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => void handlePublish(selectedItem)} disabled={savingId === getKey(selectedItem)} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                          {savingId === getKey(selectedItem) ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          Publish {result.suggestedMarks}M
                        </button>
                        <button onClick={() => handleAutoGrade(selectedItem)} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">Re-grade</button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Groups */}
      {bulkGroups.length > 0 && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Users size={18} className="text-teal-600" />Bulk Groups - Similar Answers ({bulkGroups.length})</h3>
          <div className="grid gap-3">
            {bulkGroups.map(group => (
              <div key={group.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div><p className="font-bold text-sm">{group.pattern}</p><p className="text-xs text-slate-500 mt-1">{group.answerSample}...</p><p className="text-xs text-slate-400 mt-1">{group.count} students</p></div>
                <button className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">Grade All {group.count}</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
