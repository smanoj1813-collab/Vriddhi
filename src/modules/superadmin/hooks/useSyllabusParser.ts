// ═══════════════════════════════════════════════════════════════════════
// hooks/useSyllabusParser.ts — Syllabus Parser Hook
// REQUIRES: npm install mammoth
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import { parseSyllabusDocument, DEFAULT_CONFIG } from '../services/syllabusParser';
import { createSyllabusExtract } from '../api/syllabusCurriculumApi';
import type { SyllabusExtract, SyllabusFormat } from '../types/curriculum';

type ParserPhase = 'idle' | 'uploading' | 'parsing' | 'saving' | 'done' | 'error';

// ─── Helpers ────────────────────────────────────────────────────────────

function detectFormat(fileName: string): SyllabusFormat {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'docx') return 'docx';
  if (ext === 'pdf') return 'pdf';
  return 'txt';
}

export function useSyllabusParser() {
  const [phase, setPhase] = useState<ParserPhase>('idle');
  const [extract, setExtract] = useState<SyllabusExtract | null>(null);
  const [rawText, setRawText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }
    // FIX: PDFs can't be read with file.text() — that produced garbage.
    // Fail loudly instead of silently parsing gibberish.
    if (ext === 'pdf') {
      throw new Error('PDF parsing is not supported yet. Please convert the syllabus to DOCX or TXT and re-upload.');
    }
    return file.text();
  }, []);

  const parseFile = useCallback(async (file: File) => {
    setPhase('parsing');
    setError(null);
    setErrors([]);
    setWarnings([]);
    try {
      const text = await extractText(file);

      const result = parseSyllabusDocument(
        text,
        file.name,
        file.size,
        detectFormat(file.name),
        DEFAULT_CONFIG
      );

      if (result.extract) {
        setExtract(result.extract);
        setRawText(text);
        setConfidenceScore(result.confidenceScore);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setPhase('done');
      } else {
        setErrors(result.errors || ['Failed to parse syllabus']);
        setWarnings(result.warnings || []);
        setConfidenceScore(result.confidenceScore);
        setPhase('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse failed');
      setPhase('error');
    }
  }, [extractText]);

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

  const uploadAndParse = useCallback(async (file: File, _userId: string, _userName: string) => {
    setPhase('uploading');
    setUploadProgress(0);
    setError(null);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 200);

      const text = await extractText(file);

      const result = parseSyllabusDocument(
        text,
        file.name,
        file.size,
        detectFormat(file.name),
        DEFAULT_CONFIG
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.extract) {
        setExtract(result.extract);
        setRawText(text);
        setConfidenceScore(result.confidenceScore);
        setWarnings(result.warnings || []);
        setErrors(result.errors || []);
        setPhase('done');
        return result.extract;
      } else {
        setErrors(result.errors || ['Failed to parse syllabus']);
        setWarnings(result.warnings || []);
        setConfidenceScore(result.confidenceScore);
        setPhase('error');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPhase('error');
      return null;
    }
  }, [extractText]);

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