import React, { useState } from 'react';
import { X, Link2, Check } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  examType?: string;
  totalMarks?: number;
  year?: number;
}

interface FacultyPaperLinkerProps {
  open: boolean;
  onClose: () => void;
  onLink: (paperId: string) => Promise<void>;
  papers: Paper[];
  questionId: string;
}

export default function FacultyPaperLinker({
  open,
  onClose,
  onLink,
  papers,
  questionId,
}: FacultyPaperLinkerProps) {
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [linking, setLinking] = useState(false);

  if (!open) return null;

  const handleLink = async () => {
    if (!selectedPaperId) return;
    setLinking(true);
    try {
      await onLink(selectedPaperId);
      onClose();
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-teal-400" />
            Link to Paper
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {papers.map(paper => (
            <div
              key={paper.id}
              onClick={() => setSelectedPaperId(paper.id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPaperId === paper.id
                  ? 'border-teal-500 bg-teal-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-white">{paper.title}</p>
                <p className="text-xs text-slate-400">
                  {paper.examType || 'Paper'}
                  {paper.totalMarks ? ` • ${paper.totalMarks} marks` : ''}
                  {paper.year ? ` • ${paper.year}` : ''}
                </p>
              </div>
              {selectedPaperId === paper.id && <Check className="w-4 h-4 text-teal-400" />}
            </div>
          ))}
          {papers.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No papers available</p>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={!selectedPaperId || linking}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-500 disabled:opacity-50"
          >
            {linking ? 'Linking...' : 'Link Question'}
          </button>
        </div>
      </div>
    </div>
  );
}