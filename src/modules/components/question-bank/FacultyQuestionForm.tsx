import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Question } from '../../admin/types/questionBank';

interface FacultyQuestionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Question>) => Promise<void>;
  initialData?: Partial<Question>;
  subjects: { id: string; name: string }[];
}

export default function FacultyQuestionForm({
  open,
  onClose,
  onSubmit,
  initialData,
  subjects,
}: FacultyQuestionFormProps) {
  const [formData, setFormData] = useState<Partial<Question>>(initialData || {});
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {initialData?.id ? 'Edit Question' : 'New Question'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Question Text</label>
            <textarea
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={3}
              value={(formData.text as string) || ''}
              onChange={e => setFormData(prev => ({ ...prev, text: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Subject</label>
              <select
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"
                value={formData.subject || ''}
                onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
              >
                <option value="">Select subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Marks</label>
              <input
                type="number"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm"
                value={formData.marks || ''}
                onChange={e => setFormData(prev => ({ ...prev, marks: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}