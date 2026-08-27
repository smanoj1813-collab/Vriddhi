// src/hooks/useAIQuestionGenerator.ts
// ─── AI Question Generator Hook (Fixed with Subject Validation & Bulk Save) ────────

import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import {
  generateQuestionsWithAI,
  convertToQuestionData,
  convertAllToQuestionData,
} from '../api/aiQuestionApi';
import { createQuestion, bulkImportQuestions } from '../api/questionBankApi';
import type { AIQuestionConfig, AIGenerationResult } from '../types/aiQuestion';
import type { GeneratedQuestion, Question } from '../../admin/types/questionBank';

interface SaveResult {
  saved: Question[];
  failed: { question: GeneratedQuestion; error: string }[];
}

export function useAIQuestionGenerator() {
  const { user } = useAuth();
  const collegeId = user?.collegeId;

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIGenerationResult | null>(null);
  const [savedQuestions, setSavedQuestions] = useState<Question[]>([]);

  // ─── Generate ─────────────────────────────────────────
  const generate = useCallback(
    async (config: AIQuestionConfig): Promise<AIGenerationResult> => {
      setGenerating(true);
      setError(null);
      setResult(null);

      try {
        const data = await generateQuestionsWithAI(config);

        // Post-generation validation: ensure all questions have subject
        const missingSubject = data.questions.filter((q: GeneratedQuestion) => !q.subject);
        if (missingSubject.length > 0) {
          console.warn(
            '[useAIQuestionGenerator] Questions still missing subject after API:',
            missingSubject.map((q: GeneratedQuestion) => q.text?.substring(0, 50))
          );
          // Force-inject config subject as last resort
          data.questions = data.questions.map((q: GeneratedQuestion) => ({
            ...q,
            subject: q.subject || config.subject,
          }));
        }

        setResult(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Generation failed';
        setError(msg);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    []
  );

  // ─── Save Single Question ─────────────────────────────
  const saveQuestion = useCallback(
    async (
      generated: GeneratedQuestion,
      batch: string,
      branch: string
    ): Promise<Question> => {
      if (!collegeId) throw new Error('Not authenticated — collegeId missing');

      setSaving(true);
      try {
        if (!generated.subject) {
          throw new Error(
            `Cannot save question without subject: "${generated.text?.substring(0, 50)}..."`
          );
        }

        const questionData = convertToQuestionData(
          generated,
          collegeId,
          (user as any)?.uid || (user as any)?.id || '',
          user?.name || user?.email || 'Unknown',
          batch,
          branch
        );

        // ═══ DEBUG: Log what's being sent ═══
        console.log('[saveQuestion] Payload:', JSON.stringify(questionData, null, 2));

        const saved = await createQuestion(collegeId, questionData);
        setSavedQuestions((prev) => [...prev, saved]);
        return saved;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save question';
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [collegeId, user]
  );

  // ─── Save All Questions (with partial failure handling) ─
  const saveAll = useCallback(
    async (
      generatedQuestions: GeneratedQuestion[],
      batch: string,
      branch: string
    ): Promise<Question[]> => {
      if (!collegeId) throw new Error('Not authenticated — collegeId missing');

      setSaving(true);
      setError(null);

      try {
        // Pre-validate all questions
        const { valid, invalid } = convertAllToQuestionData(
          generatedQuestions,
          collegeId,
          (user as any)?.uid || (user as any)?.id || '',
          user?.name || user?.email || 'Unknown',
          batch,
          branch
        );

        if (invalid.length > 0) {
          console.warn('[saveAll] Pre-validation failures:', invalid);
        }

        if (valid.length === 0) {
          throw new Error(
            `All ${generatedQuestions.length} questions failed validation. ` +
            `Errors: ${invalid.map((i) => i.error).join('; ')}`
          );
        }

        // ═══ FIX: Use bulkImportQuestions with correct BulkImportResult shape ═══
        console.log('[saveAll] Sending bulk payload:', {
          collegeId,
          questionCount: valid.length,
          firstQuestion: valid[0],
        });

        const bulkResult = await bulkImportQuestions(collegeId, valid);

        console.log('[saveAll] Bulk result:', bulkResult);

        // ═══ FIX: Use correct BulkImportResult properties ═══
        const savedCount = bulkResult.success || 0;
        const failedCount = bulkResult.failed || 0;
        const importedIds = bulkResult.importedIds || bulkResult.createdIds || [];

        if (failedCount > 0) {
          console.warn(`[saveAll] ${failedCount} questions failed in bulk save`);
          setError(`Saved ${savedCount}/${valid.length} questions. ${failedCount} failed.`);
        }

        // Build minimal Question objects from importedIds for state update
        // (Backend doesn't return full Question objects in bulk response)
        const saved: Question[] = importedIds.map((id, idx) => ({
          id,
          text: valid[idx]?.text || '',
          type: valid[idx]?.type || 'mcq',
          difficulty: valid[idx]?.difficulty || 'medium',
          subject: valid[idx]?.subject || '',
          marks: valid[idx]?.marks || 1,
          tags: valid[idx]?.tags || [],
          createdBy: valid[idx]?.createdBy || '',
          createdByName: valid[idx]?.createdByName || '',
          collegeId: valid[idx]?.collegeId || '',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setSavedQuestions((prev) => [...prev, ...saved]);
        return saved;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to save questions';
        console.error('[saveAll] Error:', msg);
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [collegeId, user]
  );

  // ─── Clear ────────────────────────────────────────────
  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setSavedQuestions([]);
  }, []);

  return {
    generating,
    saving,
    error,
    result,
    savedQuestions,
    generate,
    saveQuestion,
    saveAll,
    clear,
  };
}