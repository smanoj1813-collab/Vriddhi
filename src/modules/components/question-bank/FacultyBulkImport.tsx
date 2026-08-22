import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';

interface FacultyBulkImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (questions: Record<string, unknown>[]) => Promise<void>;
}

interface ParsedRow {
  text: string;
  subject: string;
  type: string;
  difficulty: string;
  marks: string;
  unit: string;
  correctAnswer: string;
  batch: string;
  branch: string;
  tags: string;
}

export default function FacultyBulkImport({ open, onClose, onImport }: FacultyBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim());
        if (lines.length < 2) {
          setError('CSV file is empty or has no data rows');
          setParsed([]);
          return;
        }
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const rows: ParsedRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          rows.push({
            text: row.text || '',
            subject: row.subject || '',
            type: row.type || '',
            difficulty: row.difficulty || '',
            marks: row.marks || '',
            unit: row.unit || '',
            correctAnswer: row.correctanswer || row.correct_answer || '',
            batch: row.batch || '',
            branch: row.branch || '',
            tags: row.tags || '',
          });
        }
        setParsed(rows);
      } catch {
        setError('Failed to parse file. Ensure it is a valid CSV.');
      }
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const questions = parsed.map((row) => ({
        text: row.text,
        subject: row.subject,
        type: row.type,
        difficulty: row.difficulty,
        marks: Number(row.marks) || 1,
        unit: row.unit,
        correctAnswer: row.correctAnswer,
        batch: row.batch || undefined,
        branch: row.branch || undefined,
        tags: row.tags ? row.tags.split(';').map((t) => t.trim()).filter(Boolean) : [],
      })) as Record<string, unknown>[];
      await onImport(questions);
      setFile(null);
      setParsed([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Bulk Import Questions</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500/50 hover:bg-slate-800/50 transition-colors"
        >
          <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {file ? file.name : 'Click to upload CSV file'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Headers: text, subject, type, difficulty, marks, unit, correctAnswer, batch, branch, tags
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && (
          <div className="mt-3 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {parsed.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-teal-400">
              Parsed {parsed.length} question(s). Review before importing.
            </p>
            <ul className="mt-2 space-y-2 text-sm text-slate-300 max-h-48 overflow-y-auto">
              {parsed.slice(0, 12).map((row, i) => (
                <li key={i} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  {row.text || 'No text'}
                  <div className="flex flex-wrap gap-1 mt-1 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{row.subject || 'No subject'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{row.type || 'No type'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{row.difficulty || 'No difficulty'}</span>
                  </div>
                </li>
              ))}
              {parsed.length > 12 && <li className="text-xs text-slate-500">... and {parsed.length - 12} more</li>}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsed.length === 0 || importing}
            className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30 text-sm hover:bg-teal-500/30 disabled:opacity-50"
          >
            {importing ? 'Importing...' : `Import ${parsed.length} Questions`}
          </button>
        </div>
      </div>
    </div>
  );
}
