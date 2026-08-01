// ═══════════════════════════════════════════════════════════════════════
// hooks/useSyllabusParser.ts — Syllabus Parser Hook
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { parseSyllabus, detectFormat, validateFile } from '../services/syllabusParser';
import { createSyllabusExtract } from '../api/syllabusCurriculumApi';
import type { SyllabusExtract, SyllabusFormat } from '../types/curriculum';

type ParserPhase = 'idle' | 'uploading' | 'parsing' | 'saving' | 'done' | 'error';

export function useSyllabusParser() {
  const [phase, setPhase] = useState<ParserPhase>('idle');
  const [extract, setExtract] = useState<SyllabusExtract | null>(null);
  const [rawText, setRawText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const parseFile = useCallback(async (file: File) => {
    setPhase('parsing');
    setError(null);
    setErrors([]);
    setWarnings([]);
    try {
      const format = detectFormat(file.name);
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
      const result = await parseSyllabus(file, format, 'super-admin', 'Super Admin');
      if (result.success && result.extract) {
        setExtract(result.extract);
        setRawText(result.rawText || '');
        setConfidenceScore(result.confidenceScore);
        setWarnings(result.warnings);
        setErrors(result.errors);
        setPhase('done');
      } else {
        setErrors(result.errors);
        setWarnings(result.warnings);
        setConfidenceScore(result.confidenceScore);
        setPhase('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
      setPhase('error');
    }
  }, []);

  const saveExtract = useCallback(async () => {
    if (!extract) return;
    setPhase('saving');
    try {
      const saved = await createSyllabusExtract(extract);
      setExtract(saved);
      setPhase('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      setPhase('error');
    }
  }, [extract]);

  const reset = useCallback(() => {
    setPhase('idle');
    setExtract(null);
    setRawText('');
    setErrors([]);
    setWarnings([]);
    setConfidenceScore(0);
    setUploadProgress(0);
    setError(null);
  }, []);

  const uploadAndParse = useCallback(async (file: File, userId: string, userName: string) => {
    setPhase('uploading');
    setUploadProgress(0);
    setError(null);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 200);

      const format = detectFormat(file.name);
      const result = await parseSyllabus(file, format, userId, userName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success && result.extract) {
        setExtract(result.extract);
        setRawText(result.rawText || '');
        setConfidenceScore(result.confidenceScore);
        setWarnings(result.warnings);
        setErrors(result.errors);
        setPhase('done');
        return result.extract;
      } else {
        setErrors(result.errors);
        setWarnings(result.warnings);
        setConfidenceScore(result.confidenceScore);
        setPhase('error');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPhase('error');
      return null;
    }
  }, []);

  return {
    phase,
    extract,
    rawText,
    errors,
    warnings,
    confidenceScore,
    isParsing: phase === 'parsing' || phase === 'uploading',
    parseFile,
    saveExtract,
    reset,
    uploading: phase === 'uploading',
    parsing: phase === 'parsing',
    uploadProgress,
    error,
    uploadAndParse,
  };
}
