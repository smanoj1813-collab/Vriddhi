// src/shared/components/question-paper/QuestionUploadEditor.tsx
// Upload questions (CSV / TSV / JSON / paste / manual) → review & EDIT every row →
// then save them to the question bank as a draft or submit them for review.
// Used by both the faculty and admin portals.

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  X, UploadCloud, FileSpreadsheet, Plus, Trash2, Copy, AlertTriangle,
  CheckCircle2, Loader2, Download, ClipboardPaste, PencilLine, ChevronDown, ChevronUp,
} from 'lucide-react';
import { bulkImportQuestions } from '@/modules/admin/api/questionBankApi';
import type { Question } from '@/modules/admin/types/questionBank';
import {
  type DraftQuestion,
  emptyDraftQuestion,
  parseQuestionFile,
  validateDraftQuestion,
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  SAMPLE_QUESTION_CSV,
} from '@/shared/utils/questionFileParser';
import { DEFAULT_SUBJECTS, DEFAULT_PROGRAMS } from '@/shared/constants/academicPrograms';

export interface QuestionUploadEditorProps {
  open: boolean;
  collegeId: string;
  createdBy: string;
  createdByName?: string;
  subjects?: string[];
  batches?: string[];
  branches?: string[];
  defaultSubject?: string;
  /** Faculty submissions land as `draft` for HOD review; admins can publish directly. */
  canPublishDirectly?: boolean;
  onClose: () => void;
  onSaved?: (count: number, status: 'draft' | 'active') => void;
}

type Step = 'source' | 'review';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/60';
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

export default function QuestionUploadEditor({
  open,
  collegeId,
  createdBy,
  createdByName,
  subjects,
  batches = [],
  branches,
  defaultSubject = '',
  canPublishDirectly = false,
  onClose,
  onSaved,
}: QuestionUploadEditorProps) {
  const subjectList = subjects?.length ? subjects : DEFAULT_SUBJECTS;
  const branchList = branches?.length ? branches : DEFAULT_PROGRAMS;

  const [step, setStep] = useState<Step>('source');
  const [rows, setRows] = useState<DraftQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Defaults applied to every imported row
  const [defSubject, setDefSubject] = useState(defaultSubject);
  const [defBatch, setDefBatch] = useState('');
  const [defBranch, setDefBranch] = useState('');

  const defaults = useMemo(
    () => ({ subject: defSubject, batch: defBatch, branch: defBranch }),
    [defSubject, defBatch, defBranch]
  );

  const validation = useMemo(
    () => rows.map((r) => ({ rowId: r.rowId, errors: validateDraftQuestion(r) })),
    [rows]
  );
  const invalidCount = validation.filter((v) => v.errors.length > 0).length;
  const totalMarks = rows.reduce((sum, r) => sum + (Number(r.marks) || 0), 0);

  const ingest = useCallback(
    (name: string, content: string) => {
      const result = parseQuestionFile(name, content, defaults);
      if (result.questions.length === 0) {
        setError(result.warnings[0] || 'Could not read any questions from that file.');
        return;
      }
      setRows(result.questions);
      setWarnings(result.warnings);
      setError('');
      setStep('review');
    },
    [defaults]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setFileName(file.name);
      try {
        const text = await file.text();
        ingest(file.name, text);
      } catch {
        setError('Could not read that file. Please upload a .csv, .tsv, .txt or .json file.');
      }
    },
    [ingest]
  );

  const updateRow = (rowId: string, patch: Partial<DraftQuestion>) =>
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));

  const removeRow = (rowId: string) => setRows((prev) => prev.filter((r) => r.rowId !== rowId));

  const duplicateRow = (rowId: string) =>
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.rowId === rowId);
      if (idx < 0) return prev;
      const copy: DraftQuestion = { ...prev[idx], rowId: emptyDraftQuestion({}).rowId };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });

  const addBlankRow = () => {
    const row = emptyDraftQuestion(defaults);
    setRows((prev) => [...prev, row]);
    setExpanded((prev) => ({ ...prev, [row.rowId]: true }));
    setStep('review');
  };

  const applyDefaultsToAll = () =>
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        subject: defSubject || r.subject,
        batch: defBatch || r.batch,
        branch: defBranch || r.branch,
      }))
    );

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_QUESTION_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vriddhi-question-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = async (status: 'draft' | 'active') => {
    if (!collegeId) {
      setError('Missing college — please sign in again.');
      return;
    }
    if (rows.length === 0) {
      setError('Add at least one question.');
      return;
    }
    if (invalidCount > 0) {
      setError(`${invalidCount} question(s) still have errors. Fix them before saving.`);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = rows.map((r) => {
        const q: any = {
          text: r.text.trim(),
          type: r.type,
          difficulty: r.difficulty,
          subject: r.subject.trim(),
          topic: r.topic.trim(),
          unit: r.unit.trim(),
          marks: Number(r.marks) || 1,
          options: r.options
            .filter((o) => o.trim())
            .map((o, i) => ({
              id: `opt_${i}`,
              text: o.trim(),
              isCorrect: r.correctAnswer.trim().toLowerCase() === o.trim().toLowerCase(),
            })),
          correctAnswer: r.correctAnswer.trim(),
          explanation: r.explanation.trim(),
          tags: r.tags.filter(Boolean),
          batch: r.batch.trim(),
          branch: r.branch.trim(),
          status,
          isPYQ: r.isPYQ,
          examYear: r.examYear.trim(),
          examName: r.examName.trim(),
          createdBy,
          createdByName: createdByName || '',
          source: 'upload',
        };
        return q as Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'linkedPaperIds' | 'collegeId'>;
      });

      const result = await bulkImportQuestions(collegeId, payload);
      if (result.failed > 0 && result.success === 0) {
        const firstError = result.errors?.[0] as any;
        setError((typeof firstError === 'string' ? firstError : firstError?.message) || 'Import failed.');
        return;
      }
      onSaved?.(result.success, status);
      onClose();
      // reset for next open
      setRows([]);
      setStep('source');
      setPasteText('');
      setFileName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save questions.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-6xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10">
              <UploadCloud className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Questions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a file or paste questions, edit everything, then save to the question bank.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
          {(['source', 'review'] as Step[]).map((s, i) => (
            <button
              key={s}
              onClick={() => (s === 'review' && rows.length === 0 ? null : setStep(s))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                step === s
                  ? 'bg-teal-500/15 text-teal-500 border border-teal-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {i + 1}. {s === 'source' ? 'Upload / Paste' : `Review & Edit${rows.length ? ` (${rows.length})` : ''}`}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'source' && (
            <>
              {/* Defaults */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Default subject</label>
                  <input
                    list="que-subject-list"
                    value={defSubject}
                    onChange={(e) => setDefSubject(e.target.value)}
                    placeholder="e.g. Financial Accounting"
                    className={inputCls}
                  />
                  <datalist id="que-subject-list">
                    {subjectList.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelCls}>Default program</label>
                  <select value={defBranch} onChange={(e) => setDefBranch(e.target.value)} className={inputCls}>
                    <option value="">Not set</option>
                    {branchList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Default batch</label>
                  <input
                    list="que-batch-list"
                    value={defBatch}
                    onChange={(e) => setDefBatch(e.target.value)}
                    placeholder="e.g. 2024-25"
                    className={inputCls}
                  />
                  <datalist id="que-batch-list">
                    {batches.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                  dragOver
                    ? 'border-teal-500 bg-teal-500/5'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/60'
                }`}
              >
                <FileSpreadsheet className="w-9 h-9 mx-auto mb-3 text-teal-500" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {fileName || 'Drop a question file here, or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Supported: .csv, .tsv, .txt, .json</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.json"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <Download className="w-4 h-4" /> Download CSV template
                </button>
                <button
                  onClick={addBlankRow}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-500 border border-teal-500/30 hover:bg-teal-500/20"
                >
                  <PencilLine className="w-4 h-4" /> Type questions manually
                </button>
              </div>

              {/* Paste */}
              <div>
                <label className={labelCls}>…or paste rows / JSON</label>
                <textarea
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={SAMPLE_QUESTION_CSV}
                  className={`${inputCls} font-mono text-xs`}
                />
                <button
                  onClick={() => ingest(pasteText.trim().startsWith('[') ? 'paste.json' : 'paste.csv', pasteText)}
                  disabled={!pasteText.trim()}
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-500 border border-teal-500/30 hover:bg-teal-500/20 disabled:opacity-40"
                >
                  <ClipboardPaste className="w-4 h-4" /> Parse pasted questions
                </button>
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              {warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  {warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {rows.length} question{rows.length === 1 ? '' : 's'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {totalMarks} marks total
                </span>
                {invalidCount > 0 ? (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
                    {invalidCount} need attention
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    All rows valid
                  </span>
                )}
                <button
                  onClick={applyDefaultsToAll}
                  className="ml-auto px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Apply defaults to all rows
                </button>
                <button
                  onClick={addBlankRow}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/30 hover:bg-teal-500/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Add question
                </button>
              </div>

              <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
                {rows.map((row, index) => {
                  const errors = validation.find((v) => v.rowId === row.rowId)?.errors || [];
                  const isOpen = expanded[row.rowId] ?? false;
                  return (
                    <div
                      key={row.rowId}
                      className={`rounded-xl border p-4 space-y-3 ${
                        errors.length
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-2 text-xs font-semibold text-slate-500 w-6 shrink-0">Q{index + 1}</span>
                        <textarea
                          rows={2}
                          value={row.text}
                          onChange={(e) => updateRow(row.rowId, { text: e.target.value })}
                          placeholder="Question text"
                          className={inputCls}
                        />
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => setExpanded((p) => ({ ...p, [row.rowId]: !isOpen }))}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="More fields"
                          >
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => duplicateRow(row.rowId)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeRow(row.rowId)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pl-9">
                        <div>
                          <label className={labelCls}>Subject</label>
                          <input
                            list="que-subject-list"
                            value={row.subject}
                            onChange={(e) => updateRow(row.rowId, { subject: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Type</label>
                          <select
                            value={row.type}
                            onChange={(e) => updateRow(row.rowId, { type: e.target.value as DraftQuestion['type'] })}
                            className={inputCls}
                          >
                            {QUESTION_TYPE_OPTIONS.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Difficulty</label>
                          <select
                            value={row.difficulty}
                            onChange={(e) =>
                              updateRow(row.rowId, { difficulty: e.target.value as DraftQuestion['difficulty'] })
                            }
                            className={inputCls}
                          >
                            {DIFFICULTY_OPTIONS.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Marks</label>
                          <input
                            type="number"
                            min={1}
                            value={row.marks}
                            onChange={(e) => updateRow(row.rowId, { marks: Number(e.target.value) })}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Unit</label>
                          <input
                            value={row.unit}
                            onChange={(e) => updateRow(row.rowId, { unit: e.target.value })}
                            className={inputCls}
                          />
                        </div>
                      </div>

                      {isOpen && (
                        <div className="pl-9 space-y-2">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className={labelCls}>Topic</label>
                              <input
                                value={row.topic}
                                onChange={(e) => updateRow(row.rowId, { topic: e.target.value })}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Program</label>
                              <select
                                value={row.branch}
                                onChange={(e) => updateRow(row.rowId, { branch: e.target.value })}
                                className={inputCls}
                              >
                                <option value="">Not set</option>
                                {branchList.map((b) => (
                                  <option key={b} value={b}>
                                    {b}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Batch</label>
                              <input
                                value={row.batch}
                                onChange={(e) => updateRow(row.rowId, { batch: e.target.value })}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Tags (comma separated)</label>
                              <input
                                value={row.tags.join(', ')}
                                onChange={(e) =>
                                  updateRow(row.rowId, {
                                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                                  })
                                }
                                className={inputCls}
                              />
                            </div>
                          </div>

                          {(row.type === 'mcq' || row.type === 'true_false') && (
                            <div>
                              <label className={labelCls}>Options (one per line)</label>
                              <textarea
                                rows={3}
                                value={row.options.join('\n')}
                                onChange={(e) =>
                                  updateRow(row.rowId, { options: e.target.value.split('\n') })
                                }
                                className={inputCls}
                              />
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div>
                              <label className={labelCls}>Correct answer</label>
                              <input
                                value={row.correctAnswer}
                                onChange={(e) => updateRow(row.rowId, { correctAnswer: e.target.value })}
                                className={inputCls}
                              />
                            </div>
                            <div>
                              <label className={labelCls}>Explanation</label>
                              <input
                                value={row.explanation}
                                onChange={(e) => updateRow(row.rowId, { explanation: e.target.value })}
                                className={inputCls}
                              />
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                            <input
                              type="checkbox"
                              checked={row.isPYQ}
                              onChange={(e) => updateRow(row.rowId, { isPYQ: e.target.checked })}
                            />
                            Previous year question
                          </label>
                          {row.isPYQ && (
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={row.examYear}
                                onChange={(e) => updateRow(row.rowId, { examYear: e.target.value })}
                                placeholder="Exam year"
                                className={inputCls}
                              />
                              <input
                                value={row.examName}
                                onChange={(e) => updateRow(row.rowId, { examName: e.target.value })}
                                placeholder="Exam name"
                                className={inputCls}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {errors.length > 0 && (
                        <p className="pl-9 text-xs text-rose-500 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> {errors.join(' • ')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {step === 'review' && (
            <>
              <button
                onClick={() => save('draft')}
                disabled={saving || rows.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PencilLine className="w-4 h-4" />}
                Save as draft
              </button>
              <button
                onClick={() => save('active')}
                disabled={saving || rows.length === 0 || invalidCount > 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {canPublishDirectly ? 'Publish' : 'Submit'} {rows.length} question{rows.length === 1 ? '' : 's'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
