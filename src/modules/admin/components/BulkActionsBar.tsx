import { AttendanceStatus } from '../types/attendance';

interface BulkActionsBarProps {
  onMarkAll: (status: AttendanceStatus) => void;
  onUndo: () => void;
  onSubmit: () => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  allMarked: boolean;
  summary: {
    total: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
    onDuty: number;
    medicalLeave: number;
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
    <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Summary */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
          <span className="font-semibold text-gray-900">Summary:</span>
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">P: {summary.present}</span>
          <span className="rounded bg-red-50 px-2 py-0.5 text-red-700">A: {summary.absent}</span>
          <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">L: {summary.leave}</span>
          <span className="rounded bg-orange-50 px-2 py-0.5 text-orange-700">T: {summary.late}</span>
          <span className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">OD: {summary.onDuty}</span>
          <span className="rounded bg-purple-50 px-2 py-0.5 text-purple-700">ML: {summary.medicalLeave}</span>
          <span className="text-gray-400">/ {summary.total} total</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onMarkAll('Present')}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95"
          >
            Mark All Present
          </button>
          <button
            onClick={() => onMarkAll('Absent')}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 active:scale-95"
          >
            Mark All Absent
          </button>
          <button
            onClick={onUndo}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:bg-gray-100 active:scale-95"
          >
            Undo
          </button>

          <div className="mx-1 h-6 w-px bg-gray-200" />

          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={onToggleAutoSave}
              className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            Auto Save
          </label>

          <button
            onClick={onSubmit}
            disabled={!allMarked}
            className={`
              rounded-lg px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200
              ${allMarked
                ? 'bg-teal-500 hover:bg-teal-600 active:scale-95'
                : 'cursor-not-allowed bg-gray-300'}
            `}
          >
            Submit Attendance
          </button>
        </div>
      </div>
    </div>
  );
}