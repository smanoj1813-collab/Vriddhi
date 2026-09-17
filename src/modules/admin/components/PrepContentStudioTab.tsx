// src/modules/admin/components/PrepContentStudioTab.tsx
//
// Superadmin Console: Prep Content Studio (BBA, B.Com, MBA PrepInsta-style Product)
// Centrally-authored academic preparation content:
//   - BBA Subjects (1st Year, 2nd Year, Final Year)
//   - Topics with 4 structured sections: Explanation, Formulas, Tricks, How To Solve
//   - AI Draft Generation (metered via platform AI pipeline)
//   - Curator Review & Publishing State Machine
//   - Practice Pool Inspection

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen, Sparkles, Plus, Check, AlertTriangle, Loader2, RefreshCw,
  Eye, Save, Send, Database, Filter, Search, Award, FileText,
  ChevronRight, ExternalLink, HelpCircle, Layers, CheckCircle2, Circle, Trash2,
  ImagePlus
} from 'lucide-react';
import {
  fetchPrepSubjects,
  fetchPrepTopics,
  fetchPrepTopic,
  generatePrepDraft,
  publishPrepTopic,
  savePrepTopic,
  savePrepSubject,
  seedPrepCatalog,
  fetchPracticeQuestions,
  type PrepSubject,
  type PrepTopic,
  type PrepFormula,
  type PrepTrick,
  type PrepHowToSolve,
  type UniversalQuestion
} from '@/shared/services/prepContentService';
import { uploadPrepImage } from '@/shared/services/prepMediaUpload';
import { insertMarkdownImage, markdownImageLine } from '@/shared/utils/prepMedia';
import { formatStreamLabel, formatDifficultyBadge } from '@/shared/utils/prepHelpers';

/**
 * Every program the server ships seed data for (functions/src/routes/prep.ts
 * PREP_SEED_BUNDLES). The old UI only exposed BBA here, which is why the
 * "seeded B.Com and BA" request was impossible from the studio: BA/B.Sc/
 * M.Com/B.Com only existed behind /prep/seed-all with no button.
 */
const SEEDABLE_PROGRAMS: Array<{ code: string; label: string }> = [
  { code: 'bba', label: 'BBA' },
  { code: 'bcom', label: 'B.Com' },
  { code: 'ba', label: 'BA' },
  { code: 'bsc', label: 'B.Sc' },
  { code: 'mcom', label: 'M.Com' },
];

export default function PrepContentStudioTab() {
  const [subjects, setSubjects] = useState<PrepSubject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [topics, setTopics] = useState<PrepTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [activeTopic, setActiveTopic] = useState<PrepTopic | null>(null);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingTopic, setLoadingTopic] = useState(false);
  const [seeding, setSeeding] = useState(false);
  // Which programs the operator has ticked for the next seed pass. Defaults
  // to every seedable program so "Seed All" is one click, and ticking a
  // single program (e.g. just B.Com) narrows the pass to that catalogue.
  const [seedSelection, setSeedSelection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SEEDABLE_PROGRAMS.map((p) => [p.code, true]))
  );
  const [drafting, setDrafting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Explanation "Upload image": the file picker is hidden; the textarea ref
  // gives the cursor position so the markdown line lands where the editor
  // was working (null cursor → appended at the end).
  const [uploadingImage, setUploadingImage] = useState(false);
  const explanationRef = useRef<HTMLTextAreaElement | null>(null);
  const imageFileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadImage = async (file: File) => {
    if (!activeTopic) return;
    setUploadingImage(true);
    try {
      const url = await uploadPrepImage(file);
      const caption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Diagram';
      const line = markdownImageLine(caption, url);
      const cursor = explanationRef.current?.selectionStart ?? null;
      setActiveTopic({
        ...activeTopic,
        explanationMd: insertMarkdownImage(activeTopic.explanationMd || '', line, cursor),
      });
      showToast('ok', 'Image uploaded — the markdown line was added at your cursor. Remember to Save the topic.');
    } catch (err: any) {
      showToast('err', err?.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
      if (imageFileRef.current) imageFileRef.current.value = '';
    }
  };

  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [activeSection, setActiveSection] = useState<'explanation' | 'formulas' | 'tricks' | 'howToSolve' | 'practice'>('explanation');

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // New subject modal state
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjStream, setNewSubjStream] = useState('management');
  const [newSubjYear, setNewSubjYear] = useState<'1st-year' | '2nd-year' | 'final-year'>('1st-year');

  // New topic modal state
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'basic' | 'core' | 'advanced'>('core');

  // Practice test preview
  const [practicePool, setPracticePool] = useState<UniversalQuestion[]>([]);
  const [loadingPractice, setLoadingPractice] = useState(false);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await fetchPrepSubjects();
      setSubjects(data);
      if (data.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(data[0].id);
      }
    } catch (err: any) {
      showToast('err', `Failed to load subjects: ${err.message}`);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadTopics = async (subjId: string) => {
    if (!subjId) return;
    setLoadingTopics(false);
    try {
      const data = await fetchPrepTopics(subjId);
      setTopics(data);
      if (data.length > 0) {
        setSelectedTopicId(data[0].id);
      } else {
        setSelectedTopicId('');
        setActiveTopic(null);
      }
    } catch (err: any) {
      showToast('err', `Failed to load topics: ${err.message}`);
    }
  };

  useEffect(() => {
    if (selectedSubjectId) {
      loadTopics(selectedSubjectId);
    }
  }, [selectedSubjectId]);

  const loadTopicDetail = async (subjId: string, topId: string) => {
    if (!subjId || !topId) return;
    setLoadingTopic(true);
    try {
      const data = await fetchPrepTopic(subjId, topId);
      setActiveTopic(data);
    } catch (err: any) {
      showToast('err', `Failed to load topic details: ${err.message}`);
    } finally {
      setLoadingTopic(false);
    }
  };

  useEffect(() => {
    if (selectedSubjectId && selectedTopicId) {
      loadTopicDetail(selectedSubjectId, selectedTopicId);
    }
  }, [selectedSubjectId, selectedTopicId]);

  const selectedSeedCodes = SEEDABLE_PROGRAMS
    .filter((p) => seedSelection[p.code])
    .map((p) => p.code);

  const toggleSeedProgram = (code: string) => {
    setSeedSelection((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleSeed = async () => {
    const codes = selectedSeedCodes;
    if (codes.length === 0) {
      showToast('err', 'Tick at least one program to seed.');
      return;
    }
    const labels = SEEDABLE_PROGRAMS.filter((p) => codes.includes(p.code)).map((p) => p.label).join(', ');
    if (!confirm(`Seed/refresh the ${codes.length === SEEDABLE_PROGRAMS.length ? 'complete' : 'selected'} catalogue (${labels})? Existing subjects and topics are updated in place.`)) return;
    setSeeding(true);
    try {
      const res = await seedPrepCatalog(codes);
      const integrity = res.perProgram
        .filter((p) => !p.valid)
        .map((p) => `${p.label} (${p.errorCount} integrity note${p.errorCount === 1 ? '' : 's'})`)
        .join('; ');
      showToast('ok', res.message + (integrity ? ` Review: ${integrity}.` : ''));
      await loadSubjects();
    } catch (err: any) {
      showToast('err', `Seeding failed: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjName.trim()) return;
    const slug = `bba-${newSubjName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    try {
      await savePrepSubject({
        id: slug,
        name: newSubjName.trim(),
        stream: newSubjStream as any,
        programs: ['bba'],
        yearGroup: newSubjYear,
        icon: 'BookOpen',
        order: subjects.length + 1,
      });
      showToast('ok', `Subject "${newSubjName}" created!`);
      setShowNewSubject(false);
      setNewSubjName('');
      await loadSubjects();
      setSelectedSubjectId(slug);
    } catch (err: any) {
      showToast('err', `Create subject failed: ${err.message}`);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !selectedSubjectId) return;
    const slug = `${selectedSubjectId}-${newTopicTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    try {
      await savePrepTopic({
        subjectId: selectedSubjectId,
        topicId: slug,
        title: newTopicTitle.trim(),
        order: topics.length + 1,
        difficulty: newTopicDifficulty,
        status: 'draft',
        tier: 'free',
        contentVersion: 1,
        explanationMd: `### ${newTopicTitle}\n\nDraft concept explanation for ${newTopicTitle}. Click "Generate AI Draft" to populate all 4 sections through the AI pipeline.`,
        formulas: [],
        tricks: [],
        howToSolve: [],
        featuredQuestionIds: [],
      });
      showToast('ok', `Topic "${newTopicTitle}" created!`);
      setShowNewTopic(false);
      setNewTopicTitle('');
      await loadTopics(selectedSubjectId);
      setSelectedTopicId(slug);
    } catch (err: any) {
      showToast('err', `Create topic failed: ${err.message}`);
    }
  };

  const handleGenerateDraft = async () => {
    if (!activeTopic || !selectedSubjectId) return;
    setDrafting(true);
    try {
      const res = await generatePrepDraft({
        subjectId: selectedSubjectId,
        topicId: activeTopic.id,
        title: activeTopic.title,
        stream: subjects.find((s) => s.id === selectedSubjectId)?.stream || 'management',
        difficulty: activeTopic.difficulty,
        program: 'bba',
      });
      setActiveTopic(res.data);
      showToast('ok', `AI draft created via ${res.provider}! (${res.tokensIn + res.tokensOut} tokens)`);
      await loadTopics(selectedSubjectId);
    } catch (err: any) {
      showToast('err', `Draft generation failed: ${err.message}`);
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveTopic = async () => {
    if (!activeTopic || !selectedSubjectId) return;
    setSaving(true);
    try {
      await savePrepTopic({
        ...activeTopic,
        subjectId: selectedSubjectId,
        topicId: activeTopic.id,
      });
      showToast('ok', 'Topic content saved successfully.');
      await loadTopics(selectedSubjectId);
    } catch (err: any) {
      showToast('err', `Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishTopic = async () => {
    if (!activeTopic || !selectedSubjectId) return;
    setPublishing(true);
    try {
      await publishPrepTopic({
        subjectId: selectedSubjectId,
        topicId: activeTopic.id,
      });
      showToast('ok', `Topic "${activeTopic.title}" is now PUBLISHED platform-wide!`);
      await loadTopics(selectedSubjectId);
      await loadTopicDetail(selectedSubjectId, activeTopic.id);
      await loadSubjects();
    } catch (err: any) {
      showToast('err', `Publish failed: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleLoadPracticePool = async () => {
    if (!activeTopic) return;
    setLoadingPractice(true);
    try {
      const data = await fetchPracticeQuestions({ topicId: activeTopic.id, count: 10 });
      setPracticePool(data);
    } catch (err: any) {
      showToast('err', `Failed to load practice pool: ${err.message}`);
    } finally {
      setLoadingPractice(false);
    }
  };

  const filteredSubjects = subjects.filter((s) => {
    if (filterYear !== 'all' && s.yearGroup !== filterYear) return false;
    if (filterSemester !== 'all' && s.semester !== Number(filterSemester)) return false;
    if (filterStream !== 'all' && s.stream !== filterStream) return false;
    return true;
  });

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            toast.type === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Prep Content Studio (BBA / Commerce & Management)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Centrally authored, curriculum-aligned study packs. Authored once: AI draft → Curator review → Publish.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {SEEDABLE_PROGRAMS.map((p) => {
              const active = seedSelection[p.code];
              return (
                <button
                  key={p.code}
                  onClick={() => toggleSeedProgram(p.code)}
                  disabled={seeding}
                  aria-pressed={active}
                  className={
                    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ' +
                    (active
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700'
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-600')
                  }
                >
                  {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  {p.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding || selectedSeedCodes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            {seeding
              ? 'Seeding Catalog…'
              : selectedSeedCodes.length === SEEDABLE_PROGRAMS.length
                ? 'Seed All Programs'
                : `Seed ${selectedSeedCodes.length} Selected`}
          </button>
          <button
            onClick={() => setShowNewSubject(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Subject
          </button>
        </div>
      </div>

      {/* Studio Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects & Topics Navigation */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filters */}
          <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 w-1/2"
            >
              <option value="all">All Years</option>
              <option value="1st-year">1st Year (Foundations)</option>
              <option value="2nd-year">2nd Year (Core Functional)</option>
              <option value="final-year">Final Year (Capstone)</option>
            </select>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester:</span>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-200 text-xs"
              >
                <option value="all">All Semesters (1–6)</option>
                <option value="1">Sem 1 (1st Year)</option>
                <option value="2">Sem 2 (1st Year)</option>
                <option value="3">Sem 3 (2nd Year)</option>
                <option value="4">Sem 4 (2nd Year)</option>
                <option value="5">Sem 5 (Final Year)</option>
                <option value="6">Sem 6 (Final Year)</option>
              </select>
            </div>
          </div>

          {/* Subject Selector */}
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 max-h-72 overflow-y-auto space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
              BBA Subjects ({filteredSubjects.length})
            </div>
            {loadingSubjects ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading subjects…</div>
            ) : filteredSubjects.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No subjects found. Tick a program (BBA, B.Com, BA, B.Sc, M.Com) above and press "Seed".</div>
            ) : (
              filteredSubjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedSubjectId === s.id
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate font-bold">{s.name}</p>
                    <p className="text-[10px] text-slate-400">{formatStreamLabel(s.stream)} · {s.yearGroup || 'All'}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                    {s.topicCount || 0}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Topics for Selected Subject */}
          <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 p-3 space-y-2">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Topics ({topics.length})
              </span>
              <button
                onClick={() => setShowNewTopic(true)}
                disabled={!selectedSubjectId}
                className="text-[11px] text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Topic
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1">
              {loadingTopics ? (
                <div className="p-4 text-center text-xs text-slate-400">Loading topics…</div>
              ) : topics.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No topics in this subject yet.</div>
              ) : (
                topics.map((t) => {
                  const badge = formatDifficultyBadge(t.difficulty);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTopicId(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        selectedTopicId === t.id
                          ? 'bg-slate-100 dark:bg-slate-700/60 font-bold text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="truncate pr-2">{t.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Topic Editor & Section Preview */}
        <div className="lg:col-span-8 space-y-4">
          {activeTopic ? (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 space-y-5">
              {/* Topic Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeTopic.title}</h3>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        activeTopic.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}
                    >
                      {activeTopic.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">v{activeTopic.contentVersion || 1}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Subject: {selectedSubject?.name} · Difficulty: {activeTopic.difficulty} · Tier: {activeTopic.tier}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleGenerateDraft}
                    disabled={drafting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-colors"
                  >
                    {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                    {drafting ? 'Generating AI Pack…' : 'Generate AI Draft'}
                  </button>

                  <button
                    onClick={handleSaveTopic}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Edits
                  </button>

                  <button
                    onClick={handlePublishTopic}
                    disabled={publishing || activeTopic.status === 'published'}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    {activeTopic.status === 'published' ? 'Published' : 'Publish to Platform'}
                  </button>
                </div>
              </div>

              {/* Module & Granular Subtopics Meta */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500">Module:</span>
                    <input
                      type="text"
                      value={activeTopic.moduleName || ''}
                      onChange={(e) => setActiveTopic({ ...activeTopic, moduleName: e.target.value })}
                      placeholder="e.g. Module 1: Management Foundations"
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold w-72"
                    />
                  </div>
                  {selectedSubject?.syllabusRef && (
                    <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                      {selectedSubject.syllabusRef}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Granular Subtopics Breakdown ({activeTopic.subtopics?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSub = prompt('Enter new subtopic:');
                        if (newSub && newSub.trim()) {
                          setActiveTopic({
                            ...activeTopic,
                            subtopics: [...(activeTopic.subtopics || []), newSub.trim()],
                          });
                        }
                      }}
                      className="text-[10px] text-teal-600 font-bold hover:underline"
                    >
                      + Add Subtopic
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTopic.subtopics && activeTopic.subtopics.length > 0 ? (
                      activeTopic.subtopics.map((st, sIdx) => (
                        <span
                          key={sIdx}
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          <span>{st}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = activeTopic.subtopics?.filter((_, idx) => idx !== sIdx);
                              setActiveTopic({ ...activeTopic, subtopics: updated });
                            }}
                            className="text-slate-400 hover:text-rose-500 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No subtopics defined yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Five Content Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                {(['explanation', 'formulas', 'tricks', 'howToSolve', 'practice'] as const).map((tab) => {
                  const labels = {
                    explanation: 'Explanation (MD)',
                    formulas: `Formulas (${activeTopic.formulas?.length || 0})`,
                    tricks: `Shortcuts & Tricks (${activeTopic.tricks?.length || 0})`,
                    howToSolve: `How to Solve (${activeTopic.howToSolve?.length || 0})`,
                    practice: 'Practice Questions',
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveSection(tab);
                        if (tab === 'practice') handleLoadPracticePool();
                      }}
                      className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
                        activeSection === tab
                          ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Section 1: Explanation Markdown */}
              {activeSection === 'explanation' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>Comprehensive Markdown Explanation (curriculum-aligned)</span>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline">Markdown · KaTeX · images</span>
                      <input
                        ref={imageFileRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadImage(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => imageFileRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        title="Upload a diagram (PNG/JPEG/WebP/GIF, max 4 MB) and insert it at your cursor"
                      >
                        {uploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="w-3.5 h-3.5" />
                        )}
                        {uploadingImage ? 'Uploading…' : 'Upload image'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={explanationRef}
                    rows={16}
                    value={activeTopic.explanationMd || ''}
                    onChange={(e) => setActiveTopic({ ...activeTopic, explanationMd: e.target.value })}
                    className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder={'Enter academic explanation in Markdown...\n\nVisuals: use "Upload image" above, or paste  ![Caption](https://image-url)  on its own line.'}
                  />
                </div>
              )}

              {/* Section 2: Formulas */}
              {activeSection === 'formulas' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Formula Sheet / Governing Formulations
                    </span>
                    <button
                      onClick={() => {
                        const newF: PrepFormula = {
                          id: `formula-${(activeTopic.formulas?.length || 0) + 1}`,
                          label: 'New Formula',
                          formula: 'Equation = X / Y',
                          exampleQ: 'Sample Question',
                          exampleA: 'Step-by-step solution',
                        };
                        setActiveTopic({
                          ...activeTopic,
                          formulas: [...(activeTopic.formulas || []), newF],
                        });
                      }}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Formula
                    </button>
                  </div>

                  {activeTopic.formulas?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No formula cards added for this topic yet.
                    </div>
                  ) : (
                    activeTopic.formulas.map((f, i) => (
                      <div key={f.id || i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => {
                              const updated = [...activeTopic.formulas];
                              updated[i] = { ...updated[i], label: e.target.value };
                              setActiveTopic({ ...activeTopic, formulas: updated });
                            }}
                            className="font-bold text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-2/3"
                            placeholder="Formula label..."
                          />
                          <button
                            onClick={() => {
                              const updated = activeTopic.formulas.filter((_, idx) => idx !== i);
                              setActiveTopic({ ...activeTopic, formulas: updated });
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400">Formula / Equation</label>
                          <input
                            type="text"
                            value={f.formula}
                            onChange={(e) => {
                              const updated = [...activeTopic.formulas];
                              updated[i] = { ...updated[i], formula: e.target.value };
                              setActiveTopic({ ...activeTopic, formulas: updated });
                            }}
                            className="font-mono text-xs w-full bg-white dark:bg-slate-800 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 font-semibold"
                            placeholder="Formula equation..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Example Question</label>
                            <textarea
                              rows={2}
                              value={f.exampleQ}
                              onChange={(e) => {
                                const updated = [...activeTopic.formulas];
                                updated[i] = { ...updated[i], exampleQ: e.target.value };
                                setActiveTopic({ ...activeTopic, formulas: updated });
                              }}
                              className="text-xs w-full bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                              placeholder="Example question..."
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400">Solution / Answer</label>
                            <textarea
                              rows={2}
                              value={f.exampleA}
                              onChange={(e) => {
                                const updated = [...activeTopic.formulas];
                                updated[i] = { ...updated[i], exampleA: e.target.value };
                                setActiveTopic({ ...activeTopic, formulas: updated });
                              }}
                              className="text-xs w-full bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                              placeholder="Solution..."
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Section 3: Tricks */}
              {activeSection === 'tricks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Shortcuts, Mnemonics & Exam Tricks
                    </span>
                    <button
                      onClick={() => {
                        const newT: PrepTrick = {
                          id: `trick-${(activeTopic.tricks?.length || 0) + 1}`,
                          title: 'New Exam Shortcut',
                          trick: 'Mnemonic or shortcut description',
                          whenToUse: 'When solving semester examination MCQs',
                        };
                        setActiveTopic({
                          ...activeTopic,
                          tricks: [...(activeTopic.tricks || []), newT],
                        });
                      }}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Trick
                    </button>
                  </div>

                  {activeTopic.tricks?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No shortcuts or tricks added yet.
                    </div>
                  ) : (
                    activeTopic.tricks.map((t, i) => (
                      <div key={t.id || i} className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={t.title}
                            onChange={(e) => {
                              const updated = [...activeTopic.tricks];
                              updated[i] = { ...updated[i], title: e.target.value };
                              setActiveTopic({ ...activeTopic, tricks: updated });
                            }}
                            className="font-bold text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-2/3"
                          />
                          <button
                            onClick={() => {
                              const updated = activeTopic.tricks.filter((_, idx) => idx !== i);
                              setActiveTopic({ ...activeTopic, tricks: updated });
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={t.trick}
                          onChange={(e) => {
                            const updated = [...activeTopic.tricks];
                            updated[i] = { ...updated[i], trick: e.target.value };
                            setActiveTopic({ ...activeTopic, tricks: updated });
                          }}
                          className="text-xs w-full bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                          placeholder="Shortcut / mnemonic..."
                        />
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[10px] font-bold text-slate-400">When to use:</span>
                          <input
                            type="text"
                            value={t.whenToUse}
                            onChange={(e) => {
                              const updated = [...activeTopic.tricks];
                              updated[i] = { ...updated[i], whenToUse: e.target.value };
                              setActiveTopic({ ...activeTopic, tricks: updated });
                            }}
                            className="text-xs flex-1 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Section 4: How To Solve */}
              {activeSection === 'howToSolve' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Step-by-Step Problem Solving Framework
                    </span>
                    <button
                      onClick={() => {
                        const newH: PrepHowToSolve = {
                          id: `step-${(activeTopic.howToSolve?.length || 0) + 1}`,
                          step: `Step ${(activeTopic.howToSolve?.length || 0) + 1}`,
                          detail: 'Execution details',
                          questionType: 'Standard 10-Mark Question',
                        };
                        setActiveTopic({
                          ...activeTopic,
                          howToSolve: [...(activeTopic.howToSolve || []), newH],
                        });
                      }}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Step
                    </button>
                  </div>

                  {activeTopic.howToSolve?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No step framework defined yet.
                    </div>
                  ) : (
                    activeTopic.howToSolve.map((h, i) => (
                      <div key={h.id || i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={h.step}
                            onChange={(e) => {
                              const updated = [...activeTopic.howToSolve];
                              updated[i] = { ...updated[i], step: e.target.value };
                              setActiveTopic({ ...activeTopic, howToSolve: updated });
                            }}
                            className="font-bold text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-1/2"
                          />
                          <input
                            type="text"
                            value={h.questionType}
                            onChange={(e) => {
                              const updated = [...activeTopic.howToSolve];
                              updated[i] = { ...updated[i], questionType: e.target.value };
                              setActiveTopic({ ...activeTopic, howToSolve: updated });
                            }}
                            className="text-xs text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-1/3 text-right"
                            placeholder="Question type..."
                          />
                          <button
                            onClick={() => {
                              const updated = activeTopic.howToSolve.filter((_, idx) => idx !== i);
                              setActiveTopic({ ...activeTopic, howToSolve: updated });
                            }}
                            className="text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={h.detail}
                          onChange={(e) => {
                            const updated = [...activeTopic.howToSolve];
                            updated[i] = { ...updated[i], detail: e.target.value };
                            setActiveTopic({ ...activeTopic, howToSolve: updated });
                          }}
                          className="text-xs w-full bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700"
                          placeholder="Detailed instructions for this step..."
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Section 5: Practice Pool */}
              {activeSection === 'practice' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Practice Pool (Sampled from Universal Question Bank)
                    </span>
                    <button
                      onClick={handleLoadPracticePool}
                      disabled={loadingPractice}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingPractice ? 'animate-spin' : ''}`} />
                      Refresh Sample
                    </button>
                  </div>

                  {practicePool.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      {loadingPractice ? 'Sampling questions…' : 'No practice questions matched. Click Refresh Sample.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {practicePool.map((q, i) => (
                        <div key={q.id || i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Q{i + 1}. {q.questionText}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                            {q.options?.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`px-2 py-1 rounded text-[11px] ${
                                  oIdx === q.correctIndex
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                                    : 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt}
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <strong>Explanation:</strong> {q.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 space-y-3">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Select a Topic from the Left Panel</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select any BBA subject and topic to view or edit the explanation, formula sheet, tricks, and step-by-step solver.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Subject Modal */}
      {showNewSubject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Prep Subject</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  placeholder="e.g. Corporate Finance"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 block mb-1">Stream *</label>
                <select
                  value={newSubjStream}
                  onChange={(e) => setNewSubjStream(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="management">Management</option>
                  <option value="commerce">Commerce</option>
                  <option value="economics">Economics</option>
                  <option value="aptitude">Aptitude / Quant</option>
                  <option value="finance">Finance</option>
                  <option value="law">Business Law</option>
                  <option value="strategy">Strategic Management</option>
                  <option value="operations">Operations Management</option>
                  <option value="taxation">Taxation</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-500 block mb-1">Year Group *</label>
                <select
                  value={newSubjYear}
                  onChange={(e) => setNewSubjYear(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="1st-year">1st Year</option>
                  <option value="2nd-year">2nd Year</option>
                  <option value="final-year">Final Year</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewSubject(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubject}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
              >
                Create Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Topic Modal */}
      {showNewTopic && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Topic to {selectedSubject?.name}</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Topic Title *</label>
                <input
                  type="text"
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Ratio Analysis & Solvency Ratios"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 block mb-1">Difficulty *</label>
                <select
                  value={newTopicDifficulty}
                  onChange={(e) => setNewTopicDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <option value="basic">Basic (Foundation)</option>
                  <option value="core">Core (Standard University)</option>
                  <option value="advanced">Advanced (Analytical / Case)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewTopic(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
              >
                Create Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
