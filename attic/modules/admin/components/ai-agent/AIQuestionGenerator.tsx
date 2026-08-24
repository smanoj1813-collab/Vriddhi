// src/components/ai-agent/AIQuestionGenerator.tsx
// Full AI Question Generator — wired to backend Express API (fetch-based client)
// Props: subjects, onQuestionsSaved — compatible with QuestionBankManager dialog

import React, { useState, useCallback } from 'react'
import { useAuth } from '../../../auth/context/AuthContext'
import {
  generateQuestionsWithAI,
  saveGeneratedQuestions,
} from '../../api/aiQuestionApi'
import type { AIQuestionConfig } from '../../types/aiQuestion'
import type { QuestionType, DifficultyLevel, GeneratedQuestion } from '../../types/questionBank'

// ─── Props Interface ────────────────────────────────────────────────────
interface AIQuestionGeneratorProps {
  subjects?: string[]
  onQuestionsSaved?: (questions: GeneratedQuestion[]) => void
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────
const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

// ─── Constants ──────────────────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'English', 'History', 'Geography',
  'Economics', 'Political Science', 'General',
]

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'mcq', label: 'Multiple Choice (MCQ)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'fill_in_blank', label: 'Fill in the Blank' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
  { value: 'assertion_reason', label: 'Assertion & Reason' },
  { value: 'case_based', label: 'Case Based' },
]

const DIFFICULTY_LEVELS: { value: DifficultyLevel; label: string; color: string }[] = [
  { value: 'easy', label: 'Easy', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  { value: 'hard', label: 'Hard', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
]

// ─── Component ──────────────────────────────────────────────────────────
export default function AIQuestionGenerator({ subjects, onQuestionsSaved }: AIQuestionGeneratorProps) {
  const { user } = useAuth()
  const collegeId = user?.collegeId || localStorage.getItem('vriddhi_college_id') || ''
  const availableSubjects = subjects && subjects.length > 0 ? subjects : DEFAULT_SUBJECTS

  // ── Form State ─────────────────────────────────────────────────────────
  const [config, setConfig] = useState<AIQuestionConfig>({
    topic: '',
    subject: availableSubjects[0] || 'Mathematics',
    questionType: 'mcq',
    difficulty: 'medium',
    count: 5,
    marks: 1,
    chapter: '',
    tags: [],
    language: 'english',
    includeExplanation: true,
    batch: '',
    branch: '',
    unit: '',
  })

  const [tagInput, setTagInput] = useState('')

  // ── Generation State ───────────────────────────────────────────────────
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState<number | undefined>()

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleChange = useCallback(
    <K extends keyof AIQuestionConfig>(key: K, value: AIQuestionConfig[K]) => {
      setConfig((prev: AIQuestionConfig) => ({ ...prev, [key]: value }))
    },
    []
  )

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !config.tags?.includes(trimmed)) {
      setConfig((prev: AIQuestionConfig) => ({ ...prev, tags: [...(prev.tags || []), trimmed] }))
      setTagInput('')
    }
  }, [tagInput, config.tags])

  const removeTag = useCallback(
    (tag: string) => {
      setConfig((prev: AIQuestionConfig) => ({ ...prev, tags: prev.tags?.filter((t: string) => t !== tag) || [] }))
    },
    []
  )

  const toggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (selectedIndices.size === generated.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(generated.map((_: GeneratedQuestion, i: number) => i)))
    }
  }, [generated, selectedIndices.size])

  // ── Generate ───────────────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!config.topic.trim()) {
      setError('Please enter a topic')
      return
    }
    if (!collegeId) {
      setError('College ID not found. Please log in again.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setGenerated([])
    setSelectedIndices(new Set())

    try {
      const result = await generateQuestionsWithAI(config)
      setGenerated(result.questions)
      setTokensUsed(result.tokensUsed)
      if (result.warnings?.length) {
        setSuccess(`Generated ${result.generatedCount} questions with warnings`)
      } else {
        setSuccess(`Successfully generated ${result.generatedCount} questions!`)
      }
      // Auto-select all
      setSelectedIndices(new Set(result.questions.map((_: GeneratedQuestion, i: number) => i)))
    } catch (err: any) {
      console.error('[AI Generate] Error:', err)
      if (err.message?.includes('Rate limit')) {
        setError('Rate limit exceeded. Please wait a few minutes before generating more questions.')
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Authentication failed. Please log in again.')
      } else {
        setError(err.message || 'Failed to generate questions')
      }
    } finally {
      setLoading(false)
    }
  }, [config, collegeId])

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (selectedIndices.size === 0) {
      setError('Please select at least one question to save')
      return
    }
    if (!user?.id || !user?.name) {
      setError('User info missing. Please log in again.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const selectedQuestions = Array.from(selectedIndices).map((i) => generated[i])
      const payload = {
        questions: selectedQuestions,
        collegeId,
        createdBy: user.id,
        createdByName: user.name,
        batch: config.batch || '',
        branch: config.branch || '',
      }

      const result = await saveGeneratedQuestions(payload)

      if (result.failed.length > 0) {
        console.warn('[AI Save] Some questions failed:', result.failed)
      }

      setSuccess(`Saved ${result.savedCount} questions to Question Bank!`)

      // Notify parent (QuestionBankManager)
      if (onQuestionsSaved) {
        onQuestionsSaved(selectedQuestions)
      }

      setGenerated([])
      setSelectedIndices(new Set())
    } catch (err: any) {
      console.error('[AI Save] Error:', err)
      setError(err.message || 'Failed to save questions')
    } finally {
      setSaving(false)
    }
  }, [selectedIndices, generated, user, collegeId, config.batch, config.branch, onQuestionsSaved])

  // ── Delete generated ───────────────────────────────────────────────────
  const handleDeleteGenerated = useCallback(
    (index: number) => {
      setGenerated((prev) => prev.filter((_, i) => i !== index))
      setSelectedIndices((prev) => {
        const next = new Set<number>()
        prev.forEach((i) => {
          if (i < index) next.add(i)
          else if (i > index) next.add(i - 1)
        })
        return next
      })
    },
    []
  )

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[60vh] text-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <SparklesIcon />
            AI Question Generator
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Generate high-quality questions using AI. Review, edit, and save them directly to your Question Bank.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm">
            {success}
            {tokensUsed !== undefined && (
              <span className="ml-2 text-slate-400">({tokensUsed} tokens used)</span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* LEFT: Configuration Form */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-semibold text-white mb-3">Configuration</h2>

              {/* Topic */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Topic *</label>
                <input
                  type="text"
                  value={config.topic}
                  onChange={(e) => handleChange('topic', e.target.value)}
                  placeholder="e.g., Newton's Laws of Motion"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Subject */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                <select
                  value={config.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Chapter */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Chapter</label>
                <input
                  type="text"
                  value={config.chapter || ''}
                  onChange={(e) => handleChange('chapter', e.target.value)}
                  placeholder="e.g., Chapter 3"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Unit */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Unit</label>
                <input
                  type="text"
                  value={config.unit || ''}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  placeholder="e.g., Unit I"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Question Type */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Question Type</label>
                <select
                  value={config.questionType}
                  onChange={(e) => handleChange('questionType', e.target.value as QuestionType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {QUESTION_TYPES.map((qt) => (
                    <option key={qt.value} value={qt.value}>{qt.label}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {DIFFICULTY_LEVELS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => handleChange('difficulty', d.value)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        config.difficulty === d.value
                          ? d.color + ' border-current'
                          : 'border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count & Marks */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={config.count}
                    onChange={(e) => handleChange('count', Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Marks Each</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config.marks || 1}
                    onChange={(e) => handleChange('marks', Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Batch & Branch */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Batch</label>
                  <input
                    type="text"
                    value={config.batch || ''}
                    onChange={(e) => handleChange('batch', e.target.value)}
                    placeholder="e.g., 2024"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Branch</label>
                  <input
                    type="text"
                    value={config.branch || ''}
                    onChange={(e) => handleChange('branch', e.target.value)}
                    placeholder="e.g., B.Com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 rounded-md text-teal-300 text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-teal-100 leading-none">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Include Explanation */}
              <div className="mb-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="explain"
                  checked={config.includeExplanation}
                  onChange={(e) => handleChange('includeExplanation', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
                />
                <label htmlFor="explain" className="text-sm text-slate-300">
                  Include explanations
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    Generate Questions
                  </>
                )}
              </button>

              {loading && (
                <p className="mt-2 text-xs text-slate-500 text-center">
                  This may take 10–30 seconds depending on complexity...
                </p>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* RIGHT: Generated Questions */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2">
            {generated.length === 0 && !loading ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-10 text-center">
                <div className="flex justify-center mb-3">
                  <SparklesIcon />
                </div>
                <h3 className="text-base font-medium text-slate-300">No questions generated yet</h3>
                <p className="text-slate-500 text-sm mt-1">Configure your settings and click Generate to create AI-powered questions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Toolbar */}
                {generated.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={selectAll}
                        className="text-sm text-teal-400 hover:text-teal-300 font-medium"
                      >
                        {selectedIndices.size === generated.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-xs text-slate-500">
                        {selectedIndices.size} of {generated.length} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setGenerated([]); setSelectedIndices(new Set()); setSuccess(null); }}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RefreshIcon />
                        Clear
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving || selectedIndices.size === 0}
                        className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-xs font-semibold transition-colors flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <SaveIcon />
                            Save Selected ({selectedIndices.size})
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Questions List */}
                <div className="space-y-2.5">
                  {generated.map((q, index) => {
                    const isSelected = selectedIndices.has(index)
                    const diffColor = DIFFICULTY_LEVELS.find((d) => d.value === q.difficulty)?.color || ''

                    return (
                      <div
                        key={index}
                        className={`bg-slate-900/50 border rounded-xl p-4 transition-all ${
                          isSelected
                            ? 'border-teal-500/40 bg-teal-500/5'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleSelect(index)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-teal-500 border-teal-500 text-white'
                                : 'border-slate-600 hover:border-slate-400'
                            }`}
                          >
                            {isSelected && <CheckIcon />}
                          </button>

                          <div className="flex-1 min-w-0">
                            {/* Meta row */}
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${diffColor}`}>
                                {q.difficulty}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {q.type}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {q.marks} mark{q.marks !== 1 ? 's' : ''}
                              </span>
                              {q.topic && (
                                <span className="px-1.5 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                                  {q.topic}
                                </span>
                              )}
                            </div>

                            {/* Question text */}
                            <p className="text-white text-sm leading-relaxed mb-2">{q.text}</p>

                            {/* Options (for MCQ) */}
                            {q.options && q.options.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                                {q.options.map((opt, optIdx) => {
                                  const letter = String.fromCharCode(65 + optIdx)
                                  const optAny = opt as any
                                  const optText = typeof optAny === 'string'
                                    ? optAny
                                    : (optAny?.text || optAny?.label || String(optAny))
                                  const optLabel = typeof optAny === 'string'
                                    ? letter
                                    : (optAny?.label || letter)
                                  const isCorrect =
                                    q.correctAnswer === letter ||
                                    q.correctAnswer === optLabel ||
                                    q.correctAnswer === optText
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                                        isCorrect
                                          ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                          : 'bg-slate-800/50 border border-slate-700 text-slate-300'
                                      }`}
                                    >
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                        isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 text-slate-400'
                                      }`}>
                                        {optLabel}
                                      </span>
                                      <span className="flex-1 truncate">{optText}</span>
                                      {isCorrect && <span className="text-xs text-green-400">✓</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Correct answer (non-MCQ) */}
                            {!q.options && q.correctAnswer && (
                              <div className="mb-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <span className="text-xs text-green-400 font-medium">Correct Answer:</span>
                                <span className="text-xs text-green-300 ml-2">{q.correctAnswer}</span>
                              </div>
                            )}

                            {/* Explanation */}
                            {q.explanation && (
                              <div className="mb-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                <span className="text-xs text-blue-400 font-medium">Explanation:</span>
                                <p className="text-xs text-blue-200/80 mt-0.5">{q.explanation}</p>
                              </div>
                            )}

                            {/* Tags */}
                            {q.tags && q.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {q.tags.map((tag) => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-slate-800 rounded text-xs text-slate-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteGenerated(index)}
                            className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
