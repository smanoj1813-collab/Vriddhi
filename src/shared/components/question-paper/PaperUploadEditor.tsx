// src/shared/components/question-paper/PaperUploadEditor.tsx
// Upload a ready-made question paper (PDF/DOC/image) and/or build one by hand,
// EDIT everything (title, program, marks, instructions, each question) and then
// save it as a draft or submit it for HOD approval.
// Shared by the faculty and admin portals.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, UploadCloud, FileText, Plus, Trash2, ArrowUp, ArrowDown, Loader2,
  AlertTriangle, Save, Send, Paperclip, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/Firebase/config';
import { DEFAULT_PROGRAMS, DEFAULT_SUBJECTS, DEFAULT_SEMESTERS } from '@/shared/constants/academicPrograms';
import { QUESTION_TYPE_OPTIONS } from '@/shared/utils/questionFileParser';

export interface EditablePaperQuestion {
  rowId: string;
  text: string;
  type: string;
  marks: number;
  topic: string;
}

export interface EditablePaper {
  id?: string;
  title: string;
  subject: string;
  branch: string;
  batch: string;
  semester: string;
  examType: string;
  date: string;
  duration: number;
  totalMarks: number;
  instructions: string;
  questions: EditablePaperQuestion[];
  fileUrl?: string;
  fileName?: string;
  filePath?: string;
  answerKeyUrl?: string;
  answerKeyName?: string;
  /** Optional HOD sign-off — only exam papers normally need it. */
  requiresApproval?: boolean;
}

export interface PaperUploadEditorProps {
  open: boolean;
  collegeId: string;
  userId: string;
  userName?: string;
  subjects?: string[];
  branches?: string[];
  batches?: string[];
  /** Pass an existing paper to EDIT it (including papers already uploaded). */
  paper?: Partial<EditablePaper> | null;
  /** Admin / HOD can publish straight away. */
  canPublishDirectly?: boolean;
  onClose: () => void;
  onSaved?: (paperId: string, action: 'draft' | 'save' | 'submitted' | 'published') => void;
}

const EXAM_TYPES = ['Internal Assessment 1', 'Internal Assessment 2', 'Mid Semester', 'Semester End', 'Model Exam', 'Assignment', 'Class Test', 'Practice / Revision', 'Other'];

/**
 * HOD approval is OPTIONAL. Only high-stakes papers (semester / mid-sem / model
 * exams) are pre-ticked for approval — day-to-day class tests, assignments and
 * practice papers are saved and ready to use immediately.
 */
const EXAM_TYPES_NEEDING_APPROVAL = ['Mid Semester', 'Semester End', 'Model Exam'];

export function approvalDefaultFor(examType: string): boolean {
  return EXAM_TYPES_NEEDING_APPROVAL.includes(examType);
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/60';
const labelCls = 'block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1';

let qCounter = 0;
const newQ = (patch: Partial<EditablePaperQuestion> = {}): EditablePaperQuestion => ({
  rowId: `pq_${Date.now().toString(36)}_${++qCounter}`,
  text: '',
  type: 'long_answer',
  marks: 5,
  topic: '',
  ...patch,
});

function blankPaper(): EditablePaper {
  return {
    title: '',
    subject: '',
    branch: '',
    batch: '',
    semester: '',
    examType: EXAM_TYPES[0],
    date: new Date().toISOString().split('T')[0],
    duration: 90,
    totalMarks: 0,
    instructions: 'Answer all questions. Figures to the right indicate full marks.',
    questions: [],
    requiresApproval: approvalDefaultFor(EXAM_TYPES[0]),
  };
}

export default function PaperUploadEditor({
  open,
  collegeId,
  userId,
  userName,
  subjects,
  branches,
  batches = [],
  paper,
  canPublishDirectly = false,
  onClose,
  onSaved,
}: PaperUploadEditorProps) {
  const subjectList = subjects?.length ? subjects : DEFAULT_SUBJECTS;
  const branchList = branches?.length ? branches : DEFAULT_PROGRAMS;

  const [form, setForm] = useState<EditablePaper>(blankPaper());
  /** True once the user manually toggles approval — we then stop auto-syncing it. */
  const [approvalTouched, setApprovalTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [answerKey, setAnswerKey] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(paper?.id);

  useEffect(() => {
    if (!open) return;
    setError('');
    setFile(null);
    setAnswerKey(null);
    setApprovalTouched(Boolean(paper?.id));
    const base = { ...blankPaper(), ...(paper || {}) } as EditablePaper;
    setForm({
      ...base,
      requiresApproval:
        paper?.requiresApproval !== undefined ? paper.requiresApproval : approvalDefaultFor(base.examType),
      questions: (paper?.questions || []).map((q) => newQ(q)),
    });
  }, [open, paper]);

  const computedMarks = useMemo(
    () => form.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [form.questions]
  );
  const effectiveMarks = form.questions.length > 0 ? computedMarks : Number(form.totalMarks) || 0;

  const set = (patch: Partial<EditablePaper>) => setForm((prev) => ({ ...prev, ...patch }));
  const setQ = (rowId: string, patch: Partial<EditablePaperQuestion>) =>
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.rowId === rowId ? { ...q, ...patch } : q)),
    }));
  const removeQ = (rowId: string) =>
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.rowId !== rowId) }));
  const moveQ = (rowId: string, dir: -1 | 1) =>
    setForm((prev) => {
      const idx = prev.questions.findIndex((q) => q.rowId === rowId);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= prev.questions.length) return prev;
      const next = [...prev.questions];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...prev, questions: next };
    });

  const uploadIfNeeded = async (f: File | null, folder: string) => {
    if (!f) return null;
    const path = `${folder}/${collegeId}/${Date.now()}_${f.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, f);
    const url = await getDownloadURL(storageRef);
    return { url, path, name: f.name };
  };

  const persist = async (action: 'draft' | 'save' | 'submitted' | 'published') => {
    if (!collegeId) {
      setError('Missing college — please sign in again.');
      return;
    }
    if (!form.title.trim()) {
      setError('Paper title is required.');
      return;
    }
    if (!form.subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (action !== 'draft' && !file && !form.fileUrl && form.questions.length === 0) {
      setError('Add at least one question or attach a paper file before saving.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadIfNeeded(file, 'papers');
      const uploadedKey = await uploadIfNeeded(answerKey, 'answer-keys');

      // Approval is OPTIONAL: papers saved without it are immediately usable.
      const verificationStatus =
        action === 'draft'
          ? 'draft'
          : action === 'submitted'
            ? 'submitted-for-approval'
            : action === 'published'
              ? 'approved-by-hod'
              : 'not-required';

      const payload: Record<string, any> = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        branch: form.branch,
        batch: form.batch,
        semester: form.semester,
        examType: form.examType,
        date: form.date,
        duration: Number(form.duration) || 0,
        totalMarks: effectiveMarks,
        instructions: form.instructions,
        sections: form.questions.length
          ? [
              {
                id: 'section-a',
                name: 'Section A',
                questions: form.questions.map((q, i) => ({
                  number: i + 1,
                  text: q.text,
                  type: q.type,
                  marks: Number(q.marks) || 0,
                  topic: q.topic,
                })),
              },
            ]
          : [],
        totalQuestions: form.questions.length,
        status: action === 'published' || action === 'save' ? 'published' : 'draft',
        verificationStatus,
        requiresApproval: action === 'submitted' ? true : action === 'draft' ? Boolean(form.requiresApproval) : false,
        approvalRequired: action === 'submitted',
        collegeId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      if (uploaded) {
        payload.fileUrl = uploaded.url;
        payload.fileName = uploaded.name;
        payload.filePath = uploaded.path;
        payload.fileType = 'upload';
      }
      if (uploadedKey) {
        payload.answerKeyUrl = uploadedKey.url;
        payload.answerKeyName = uploadedKey.name;
      }
      if (action === 'submitted') payload.submittedAt = new Date().toISOString();
      if (action === 'save') payload.finalisedAt = new Date().toISOString();

      let paperId = form.id || '';
      if (isEdit && paperId) {
        await updateDoc(doc(db, 'papers', paperId), payload);
      } else {
        const created = await addDoc(collection(db, 'papers'), {
          ...payload,
          questionIds: [],
          linkedQuestionIds: [],
          usageCount: 0,
          isManual: true,
          createdBy: userId,
          createdByName: userName || '',
          createdAt: new Date().toISOString(),
        });
        paperId = created.id;
      }

      onSaved?.(paperId, action);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save the paper.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
      <div className="w-full max-w-5xl my-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10">
              <FileText className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit Question Paper' : 'Upload / Create Question Paper'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attach a file or type the questions — review and edit everything before submitting.
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File upload */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Paper file (optional)</h3>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) setFile(f);
              }}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                dragOver ? 'border-teal-500 bg-teal-500/5' : 'border-slate-300 dark:border-slate-700 hover:border-teal-500/60'
              }`}
            >
              <UploadCloud className="w-8 h-8 mx-auto mb-2 text-teal-500" />
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {file?.name || form.fileName || 'Drop the question paper here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX, JPG or PNG</p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => keyRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <Paperclip className="w-4 h-4" />
                {answerKey?.name || form.answerKeyName || 'Attach answer key (optional)'}
              </button>
              <input
                ref={keyRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setAnswerKey(e.target.files?.[0] || null)}
              />
              {(file || answerKey) && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> File ready — will upload when you save
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Paper details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className={labelCls}>Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                  placeholder="e.g. Semester End Exam — Financial Accounting"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Subject *</label>
                <input
                  list="paper-subject-list"
                  value={form.subject}
                  onChange={(e) => set({ subject: e.target.value })}
                  className={inputCls}
                />
                <datalist id="paper-subject-list">
                  {subjectList.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Program</label>
                <select value={form.branch} onChange={(e) => set({ branch: e.target.value })} className={inputCls}>
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
                  list="paper-batch-list"
                  value={form.batch}
                  onChange={(e) => set({ batch: e.target.value })}
                  placeholder="e.g. 2024-25"
                  className={inputCls}
                />
                <datalist id="paper-batch-list">
                  {batches.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={labelCls}>Semester</label>
                <select value={form.semester} onChange={(e) => set({ semester: e.target.value })} className={inputCls}>
                  <option value="">Not set</option>
                  {DEFAULT_SEMESTERS.map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Exam type</label>
                <select
                  value={form.examType}
                  onChange={(e) =>
                    set({
                      examType: e.target.value,
                      ...(approvalTouched ? {} : { requiresApproval: approvalDefaultFor(e.target.value) }),
                    })
                  }
                  className={inputCls}
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Exam date</label>
                <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Duration (minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={form.duration}
                  onChange={(e) => set({ duration: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Total marks {form.questions.length > 0 && '(auto)'}</label>
                <input
                  type="number"
                  min={0}
                  value={effectiveMarks}
                  disabled={form.questions.length > 0}
                  onChange={(e) => set({ totalMarks: Number(e.target.value) })}
                  className={`${inputCls} disabled:opacity-60`}
                />
              </div>
              <div className="md:col-span-3">
                <label className={labelCls}>Instructions</label>
                <textarea
                  rows={2}
                  value={form.instructions}
                  onChange={(e) => set({ instructions: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Optional HOD approval */}
            <div
              className={`mt-4 rounded-xl border p-4 transition-colors ${
                form.requiresApproval
                  ? 'border-teal-500/40 bg-teal-500/5'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.requiresApproval)}
                  onChange={(e) => {
                    setApprovalTouched(true);
                    set({ requiresApproval: e.target.checked });
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-teal-500" />
                    Needs HOD approval before use
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Approval is optional. It is pre-ticked only for semester, mid-semester and model exams —
                    class tests, assignments and practice papers can be saved and used straight away.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Questions {form.questions.length > 0 && `(${form.questions.length} • ${computedMarks} marks)`}
              </h3>
              <button
                onClick={() => set({ questions: [...form.questions, newQ()] })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-500 border border-teal-500/30 hover:bg-teal-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add question
              </button>
            </div>

            {form.questions.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                No questions typed in. That's fine for a file-only upload — or add questions so the paper is searchable
                and printable inside Vriddhi.
              </p>
            ) : (
              <div className="space-y-3">
                {form.questions.map((q, i) => (
                  <div
                    key={q.rowId}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-2 text-xs font-semibold text-slate-500 w-6 shrink-0">Q{i + 1}</span>
                      <textarea
                        rows={2}
                        value={q.text}
                        onChange={(e) => setQ(q.rowId, { text: e.target.value })}
                        placeholder="Question text"
                        className={inputCls}
                      />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => moveQ(q.rowId, -1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveQ(q.rowId, 1)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQ(q.rowId)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pl-9">
                      <div>
                        <label className={labelCls}>Type</label>
                        <select value={q.type} onChange={(e) => setQ(q.rowId, { type: e.target.value })} className={inputCls}>
                          {QUESTION_TYPE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Marks</label>
                        <input
                          type="number"
                          min={0}
                          value={q.marks}
                          onChange={(e) => setQ(q.rowId, { marks: Number(e.target.value) })}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Topic / Unit</label>
                        <input value={q.topic} onChange={(e) => setQ(q.rowId, { topic: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => persist('draft')}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save draft
          </button>
          {canPublishDirectly && form.requiresApproval && (
            <button
              onClick={() => persist('published')}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-40"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve &amp; publish
            </button>
          )}
          {form.requiresApproval ? (
            <button
              onClick={() => persist('submitted')}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for approval
            </button>
          ) : (
            <button
              onClick={() => persist('save')}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save paper
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
