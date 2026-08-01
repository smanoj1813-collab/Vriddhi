import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';

interface FacultyBulkImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

export default function FacultyBulkImport({ open, onClose, onImport }: FacultyBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      await onImport(file);
      setFile(null);
      onClose();
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
            {file ? file.name : 'Click to upload CSV or Excel file'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-500 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}