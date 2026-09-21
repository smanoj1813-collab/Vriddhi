import { useState, useMemo } from 'react';
import {
  Brain, Clock, CheckCircle, AlertTriangle, Zap, Award,
  BookOpen, FileText, TrendingUp, Users, BarChart3,
  Lightbulb, Target, Timer, Sparkles, Eye
} from 'lucide-react';
import {
  FIVE_MARKS_RUBRICS, TEN_MARKS_RUBRICS, ALL_RUBRICS,
  FIVE_MARKS_PRESETS, TEN_MARKS_PRESETS,
  autoGradeAnswer, calculateTimeSaved, groupSimilarAnswers,
  type Rubric, type AutoGradingResult, type QuestionMarks
} from '@/shared/utils/autoGrading';

// Mock data for demo - in real app, this comes from Firestore
interface MockSubmission {
  id: string;
  studentName: string;
  regNo: string;
  questionId: string;
  questionText: string;
  maxMarks: QuestionMarks;
  answer: string;
  subject: string;
}

const MOCK_SUBMISSIONS: MockSubmission[] = [
  {
    id: '1',
    studentName: 'Ramesh Kumar',
    regNo: 'BCU2024BCA001',
    questionId: 'q1',
    questionText: 'Define DBMS and explain its advantages with examples. (5 Marks)',
    maxMarks: 5,
    subject: 'DBMS',
    answer: 'DBMS stands for Database Management System. It is a software that manages databases. DBMS helps in storing data efficiently. It provides security and reduces data redundancy. For example, MySQL, Oracle are DBMS. Advantages include data sharing, data security, data integrity.',
  },
  {
    id: '2',
    studentName: 'Priya S',
    regNo: 'BCU2024BCA002',
    questionId: 'q1',
    questionText: 'Define DBMS and explain its advantages with examples. (5 Marks)',
    maxMarks: 5,
    subject: 'DBMS',
    answer: 'Database Management System is a system to manage databases. It is very important for storing data. DBMS has many advantages like data can be shared easily. It is secure. Example: In college, student data is stored in DBMS.',
  },
  {
    id: '3',
    studentName: 'Arjun M',
    regNo: 'BCU2024BCA003',
    questionId: 'q2',
    questionText: 'Explain Normalization in detail with all normal forms, examples and importance. (10 Marks)',
    maxMarks: 10,
    subject: 'DBMS',
    answer: `Normalization is process of organizing data in database to reduce redundancy.

Introduction: Normalization is important to avoid data anomalies and improve data integrity. It was introduced by E.F. Codd.

1NF: First Normal Form - Each column should have atomic values, no repeating groups. Example: Student table with subjects should be separated.

2NF: Second Normal Form - Must be in 1NF and all non-key attributes fully dependent on primary key. Removes partial dependency.

3NF: Third Normal Form - Must be in 2NF and no transitive dependency. Non-key attributes should not depend on other non-key attributes.

BCNF: Boyce-Codd Normal Form - Stricter version of 3NF, every determinant is a candidate key.

Importance: Reduces redundancy, improves data integrity, avoids insertion, deletion, update anomalies, saves storage, improves query performance.

Example: Unnormalized student-course table with redundancy normalized to separate student, course, enrollment tables.

Conclusion: Normalization is essential for good database design, though sometimes denormalization is done for performance.`,
  },
  {
    id: '4',
    studentName: 'Sneha R',
    regNo: 'BCU2024BCA004',
    questionId: 'q2',
    questionText: 'Explain Normalization in detail with all normal forms, examples and importance. (10 Marks)',
    maxMarks: 10,
    subject: 'DBMS',
    answer: `Normalization means arranging data properly.

It has different forms like 1NF, 2NF, 3NF. These help in database.

1NF is first form. 2NF is second. 3NF is third.

It is important for database management.

Example: We use it in projects.`,
  },
];

export default function FacultyAutoGrading() {
  const [selectedRubric, setSelectedRubric] = useState<Rubric>(FIVE_MARKS_RUBRICS[0]);
  const [submissions] = useState<MockSubmission[]>(MOCK_SUBMISSIONS);
  const [gradingResults, setGradingResults] = useState<Record<string, AutoGradingResult>>({});
  const [selectedSubmission, setSelectedSubmission] = useState<MockSubmission | null>(null);
  const [gradingMode, setGradingMode] = useState<'rubric' | 'ai' | 'bulk'>('rubric');
  const [bulkGroups, setBulkGroups] = useState<ReturnType<typeof groupSimilarAnswers>>([]);

  const timeSavedStats = useMemo(() => {
    const fiveCount = submissions.filter(s => s.maxMarks === 5).length;
    const tenCount = submissions.filter(s => s.maxMarks === 10).length;
    return calculateTimeSaved(submissions.length, fiveCount, tenCount, 0.7);
  }, [submissions]);

  const handleAutoGrade = (submission: MockSubmission) => {
    const result = autoGradeAnswer(submission.answer, submission.maxMarks, selectedRubric);
    result.questionId = submission.questionId;
    setGradingResults(prev => ({ ...prev, [submission.id]: result }));
  };

  const handleAutoGradeAll = () => {
    const results: Record<string, AutoGradingResult> = {};
    submissions.forEach(sub => {
      const rubric = sub.maxMarks === 5 ? FIVE_MARKS_RUBRICS[0] : TEN_MARKS_RUBRICS[0];
      const result = autoGradeAnswer(sub.answer, sub.maxMarks, rubric);
      result.questionId = sub.questionId;
      results[sub.id] = result;
    });
    setGradingResults(results);

    // Group similar for bulk
    const groups = groupSimilarAnswers(
      submissions.map(s => ({ studentId: s.id, answer: s.answer, questionId: s.questionId, maxMarks: s.maxMarks })),
      0.6
    );
    setBulkGroups(groups);
  };

  const handleQuickGrade = (submissionId: string, marks: number) => {
    setGradingResults(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        suggestedMarks: marks,
        gradingMode: 'manual',
        confidence: 1,
      } as AutoGradingResult,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Brain className="text-teal-600" />
          Auto-Grading: 5 Marks & 10 Marks
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Reduce faculty manual review time by 70% - Rubric-based + AI-assisted grading for BCU descriptive papers
        </p>
      </div>

      {/* Time Saved Banner */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="font-bold text-xl flex items-center gap-2">
              <Zap size={24} />
              Save {timeSavedStats.savedHours} Hours per Exam
            </h3>
            <p className="text-teal-50 mt-2">
              Manual grading: {timeSavedStats.manualTimeMinutes} min for {submissions.length} papers. 
              Auto-grading: {timeSavedStats.autoTimeMinutes} min. 
              <strong> Save {timeSavedStats.percentageSaved}% time</strong> with rubric + AI.
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
          <button
            onClick={handleAutoGradeAll}
            className="px-8 py-4 bg-white text-teal-700 rounded-xl font-black text-sm hover:bg-teal-50 transition-colors shadow-lg flex items-center gap-2 self-start lg:self-center"
          >
            <Sparkles size={18} />
            Auto-Grade All {submissions.length} Papers
          </button>
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
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedRubric.id === rubric.id
                      ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
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
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedRubric.id === rubric.id
                      ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
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
          <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm">Selected Rubric: {selectedRubric.title} ({selectedRubric.totalMarks}M)</h4>
          <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">{selectedRubric.description}</p>
          {selectedRubric.modelAnswer && (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg">
              Model: {selectedRubric.modelAnswer}
            </p>
          )}
        </div>
      </div>

      {/* Grading Queue */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Submissions List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <FileText size={18} className="text-teal-600" />
            Submissions ({submissions.length})
          </h3>
          
          {submissions.map(sub => {
            const result = gradingResults[sub.id];
            const isGraded = !!result;
            
            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubmission(sub)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedSubmission?.id === sub.id
                    ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700 shadow-md'
                    : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{sub.studentName}</p>
                    <p className="text-xs text-slate-500 font-mono">{sub.regNo}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{sub.questionText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        sub.maxMarks === 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {sub.maxMarks}M
                      </span>
                      <span className="text-xs text-slate-500">{sub.subject}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isGraded ? (
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        result.needsManualReview ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
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
                        <CheckCircle size={10} /> Auto-Graded
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

        {/* Grading Detail */}
        <div className="lg:col-span-2">
          {!selectedSubmission ? (
            <div className="h-full flex flex-col items-center justify-center py-16 bg-white dark:bg-[#131b2e] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Eye className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-700">Select a submission to grade</p>
              <p className="text-sm text-slate-500 mt-1">Choose from left list to see auto-grading</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question */}
              <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <BookOpen size={18} className="text-teal-600" />
                      {selectedSubmission.questionText}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{selectedSubmission.subject} • {selectedSubmission.maxMarks} Marks • {selectedSubmission.regNo}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-black border ${
                    selectedSubmission.maxMarks === 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {selectedSubmission.maxMarks}M
                  </span>
                </div>
              </div>

              {/* Answer */}
              <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <h4 className="font-bold text-sm mb-3">Student Answer - {selectedSubmission.studentName}</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedSubmission.answer}
                </div>
                <p className="text-xs text-slate-500 mt-2">{selectedSubmission.answer.split(/\s+/).length} words</p>
              </div>

              {/* Auto Grading Result */}
              {gradingResults[selectedSubmission.id] ? (
                <div className="space-y-4">
                  {(() => {
                    const result = gradingResults[selectedSubmission.id];
                    return (
                      <>
                        <div className={`rounded-2xl p-5 border ${
                          result.needsManualReview ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold flex items-center gap-2">
                              <Brain size={18} className={result.needsManualReview ? 'text-amber-600' : 'text-emerald-600'} />
                              Auto-Grading Result - {result.confidence > 0.8 ? 'High Confidence' : result.confidence > 0.6 ? 'Medium Confidence' : 'Low Confidence'}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-black ${
                              result.needsManualReview ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {result.suggestedMarks} / {result.maxMarks}
                            </span>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-3">
                            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                              <p className="text-lg font-black" style={{ color: result.confidence > 0.8 ? '#10b981' : result.confidence > 0.6 ? '#f59e0b' : '#ef4444' }}>
                                {Math.round(result.confidence * 100)}%
                              </p>
                              <p className="text-[10px] uppercase font-bold text-slate-500">Confidence</p>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                              <p className="text-lg font-black text-teal-600">{Math.round(result.timeSaved)}s</p>
                              <p className="text-[10px] uppercase font-bold text-slate-500">Time Saved</p>
                            </div>
                            <div className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                              <p className="text-lg font-black text-blue-600">{result.keywordsMatched.length}</p>
                              <p className="text-[10px] uppercase font-bold text-slate-500">Keywords Matched</p>
                            </div>
                          </div>

                          <p className="text-sm mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border">
                            <strong>Feedback:</strong> {result.overallFeedback}
                          </p>

                          <div className="mt-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Breakdown by Rubric</p>
                            <div className="space-y-2">
                              {result.breakdown.map(criterion => (
                                <div key={criterion.criterionId} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs">{criterion.label}</p>
                                    <p className="text-[11px] text-slate-500">{criterion.feedback}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${criterion.matched ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                      {criterion.matched ? 'Matched' : 'Missing'}
                                    </span>
                                    <span className="font-black text-sm">{criterion.awarded}/{criterion.max}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="font-bold text-emerald-700">Matched Keywords:</p>
                              <p className="text-slate-600 dark:text-slate-400 mt-1">{result.keywordsMatched.slice(0, 8).join(', ') || 'None'}</p>
                            </div>
                            <div>
                              <p className="font-bold text-rose-700">Missing Keywords:</p>
                              <p className="text-slate-600 dark:text-slate-400 mt-1">{result.keywordsMissing.slice(0, 8).join(', ') || 'None'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Quick Grading Presets */}
                        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-amber-600" />
                            Quick Grade - {selectedSubmission.maxMarks} Marks Presets (One Click)
                          </h4>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                            {(selectedSubmission.maxMarks === 5 ? FIVE_MARKS_PRESETS : TEN_MARKS_PRESETS).map(preset => (
                              <button
                                key={preset.marks}
                                onClick={() => handleQuickGrade(selectedSubmission.id, preset.marks)}
                                className={`p-3 rounded-xl border text-center transition-all hover:scale-105 ${
                                  result.suggestedMarks === preset.marks
                                    ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
                                }`}
                              >
                                <p className="font-black text-lg">{preset.marks}</p>
                                <p className="text-[10px] font-bold mt-1 leading-tight">{preset.label.split(' - ')[1] || preset.label}</p>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-3">
                            Current: {result.suggestedMarks}M • Click any preset to override AI suggestion instantly. Faculty review time: ~5 sec vs 75-150 sec manual.
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <button className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                            <CheckCircle size={16} />
                            Accept {result.suggestedMarks}M & Publish
                          </button>
                          <button className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm">
                            Edit Marks
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleAutoGrade(selectedSubmission)}
                    className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Brain size={18} />
                    Auto-Grade this {selectedSubmission.maxMarks} Marks Answer (Rubric + AI)
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <h4 className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-2">
                        <Lightbulb size={14} />
                        How it works - 5M
                      </h4>
                      <ul className="text-xs text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                        <li>• Definition (2M) + Explanation (2M) + Example (1M)</li>
                        <li>• Keyword matching + word count check</li>
                        <li>• 75 sec manual → 15 sec auto (80% saved)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm flex items-center gap-2">
                        <Award size={14} />
                        How it works - 10M
                      </h4>
                      <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                        <li>• Intro (2M) + Body (6M) + Conclusion (2M)</li>
                        <li>• Structure, examples, case study check</li>
                        <li>• 150 sec manual → 30 sec auto (80% saved)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Groups */}
      {bulkGroups.length > 0 && (
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Users size={18} className="text-teal-600" />
            Bulk Grading Groups - Similar Answers ({bulkGroups.length} groups found)
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Students with similar answers grouped together. Grade one, apply to all in group - massive time saver for 100+ students.
          </p>
          <div className="grid gap-3">
            {bulkGroups.map(group => (
              <div key={group.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{group.pattern}</p>
                  <p className="text-xs text-slate-500 mt-1">{group.answerSample}...</p>
                  <p className="text-xs text-slate-400 mt-1">{group.count} students: {group.studentIds.slice(0, 3).join(', ')}...</p>
                </div>
                <button className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold">
                  Grade All {group.count}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Faculty Time Saved Calculator */}
      <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-teal-600" />
          Faculty Time Saved - Real Calculation
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Manual Grading (Current)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
                <span>5 Marks × {submissions.filter(s => s.maxMarks === 5).length} Qs × {submissions.length} students</span>
                <span className="font-bold">{submissions.filter(s => s.maxMarks === 5).length * submissions.length * 1.25} min</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg">
                <span>10 Marks × {submissions.filter(s => s.maxMarks === 10).length} Qs × {submissions.length} students</span>
                <span className="font-bold">{submissions.filter(s => s.maxMarks === 10).length * submissions.length * 2.5} min</span>
              </div>
              <div className="flex justify-between p-2 bg-rose-50 dark:bg-rose-950/20 rounded-lg font-bold border border-rose-200 dark:border-rose-800">
                <span>Total Manual</span>
                <span>{timeSavedStats.manualTimeMinutes} min ({(timeSavedStats.manualTimeMinutes/60).toFixed(1)} hrs)</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Auto-Grading (New)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                <span>70% Auto (15 sec each)</span>
                <span className="font-bold">{Math.round(timeSavedStats.autoTimeMinutes * 0.4)} min</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <span>30% Manual Review (50% time)</span>
                <span className="font-bold">{Math.round(timeSavedStats.autoTimeMinutes * 0.6)} min</span>
              </div>
              <div className="flex justify-between p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg font-bold border border-emerald-200 dark:border-emerald-800">
                <span>Total Auto</span>
                <span>{timeSavedStats.autoTimeMinutes} min ({(timeSavedStats.autoTimeMinutes/60).toFixed(1)} hrs)</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Time Saved</h4>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white text-center">
              <p className="text-3xl font-black">{timeSavedStats.savedHours} hrs</p>
              <p className="text-sm font-bold mt-1">{timeSavedStats.percentageSaved}% Saved</p>
              <p className="text-xs text-emerald-50 mt-2">
                For 100 students × 5 Qs (2×5M + 3×10M) = Save ~{Math.round(timeSavedStats.savedHours * 25)} hrs per exam
              </p>
            </div>
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100">Faculty Benefits:</p>
              <ul className="text-xs text-amber-800 dark:text-amber-200 mt-1 space-y-1">
                <li>• Quick presets: 1-click grading (0,1,2,3,4,5 for 5M)</li>
                <li>• Rubric breakdown shows where marks lost</li>
                <li>• Bulk grading for similar answers</li>
                <li>• AI confidence tells when to manually review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
