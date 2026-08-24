import React from 'react';
import type { AttendanceStatus } from '../../../modules/faculty/types/attendance';

interface BulkActionsBarProps {
  onMarkAll: (status: AttendanceStatus) => void;
  onUndo: () => void;
  onSubmit: () => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  allMarked: boolean;
  summary: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    onDuty: number;
    medicalLeave: number;
    total: number;
  };
}

export function BulkActionsBar({
  onMarkAll,
  onUndo,
  onSubmit,
  autoSave,
  onToggleAutoSave,
  allMarked,
  summary,
}: BulkActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-xl">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Mark all:</span>
        <button onClick={() => onMarkAll('Present')} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
          Present
        </button>
        <button onClick={() => onMarkAll('Absent')} className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all">
          Absent
        </button>
        <button onClick={() => onMarkAll('Late')} className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-all">
          Late
        </button>
        <button onClick={onUndo} className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ml-2">
          Undo
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex gap-3">
          <span className="text-emerald-500">P: {summary.present}</span>
          <span className="text-rose-500">A: {summary.absent}</span>
          <span className="text-amber-500">L: {summary.late}</span>
          <span className="text-purple-500">Le: {summary.leave}</span>
          <span className="text-blue-500">OD: {summary.onDuty}</span>
          <span className="text-pink-500">M: {summary.medicalLeave}</span>
          <span className="text-slate-400">/ {summary.total}</span>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={autoSave}
            onChange={onToggleAutoSave}
            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          Auto-save
        </label>
        <button
          onClick={onSubmit}
          disabled={!allMarked}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default BulkActionsBar;