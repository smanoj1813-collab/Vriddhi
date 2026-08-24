import { useEffect } from 'react';
import { ClassSession, AttendanceStatus } from '../../../modules/faculty/types/attendance';
import { useAttendanceMarking } from '../../../modules/faculty/hooks/useAttendanceMarking';

interface AttendanceFormProps {
  session: ClassSession;
  onBack: () => void;
  onSubmit: (sessionId: string) => void;
}

interface AttendanceTableProps {
  session: ClassSession;
  records: any[];
  selectedIds: Set<string>;
  onToggleSelect: (studentId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkStatus: (studentIds: string[], status: AttendanceStatus) => void;
}

function AttendanceTable({
  session,
  records,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onMarkStatus,
}: AttendanceTableProps) {
  if (!records.length) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-gray-500">
        No attendance records available yet.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-700">{session.subject}</div>
        <div className="space-x-2">
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onDeselectAll}
            className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
          >
            Deselect all
          </button>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Student</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {records.map((record: any) => {
            const id = record.id ?? record.studentId ?? record._id ?? '';
            const name = record.name ?? record.studentName ?? `Student ${id}`;
            const status = record.status ?? 'Pending';
            return (
              <tr key={id}>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onToggleSelect(id)}
                    className="text-left text-sm font-medium text-gray-900"
                  >
                    <span className={selectedIds.has(id) ? 'font-semibold' : ''}>{name}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{status}</td>
                <td className="px-4 py-3 space-x-1">
                  {(['Present', 'Absent', 'Leave', 'Late', 'OnDuty', 'MedicalLeave'] as AttendanceStatus[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onMarkStatus([id], value)}
                      className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      {value[0]}
                    </button>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Inline BulkActionsBar since the imported one may not exist yet
function BulkActionsBar({
  onMarkAll,
  onUndo,
  onSubmit,
  autoSave,
  onToggleAutoSave,
  allMarked,
  summary,
}: {
  onMarkAll: (status: AttendanceStatus) => void;
  onUndo: () => void;
  onSubmit: () => void;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  allMarked: boolean;
  summary: any;
}) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <button onClick={() => onMarkAll('Present')} className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-gray-50">All Present</button>
        <button onClick={() => onMarkAll('Absent')} className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-gray-50">All Absent</button>
        <button onClick={onUndo} className="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-gray-50">Undo</button>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <input type="checkbox" checked={autoSave} onChange={onToggleAutoSave} />
          Auto-save
        </label>
        <button
          onClick={onSubmit}
          disabled={!allMarked}
          className="px-4 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export function AttendanceForm({ session, onBack, onSubmit }: AttendanceFormProps) {
  const {
    records,
    selectedIds,
    markStatus,
    toggleSelect,
    selectAll,
    deselectAll,
    markAll,
    undo,
    allMarked,
    summary,
    autoSave,
    setAutoSave,
    clearDraft,
  } = useAttendanceMarking(session);

  // normalize records to an array for AttendanceTable
  const recordList: any[] = Array.isArray(records)
    ? records
    : Object.keys(records || {}).map((id) => ({ id, name: `Student ${id}`, status: (records as Record<string, any>)[id]?.status }));

  // Define handleSubmit BEFORE the useEffect that references it
  const handleSubmit = () => {
    clearDraft();
    onSubmit(session.id);
  };

  // Ctrl+Z undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Enter' && allMarked) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, allMarked, handleSubmit]);

  return (
    <div className="flex h-full flex-col">
      {/* Pre-filled Header */}
      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{session.subject}</h2>
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
          >
            ← Back to Classes
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3 lg:grid-cols-4">
          <InfoField label="Faculty" value="Dr. Rajesh Kumar" />
          <InfoField label="Semester" value={`Semester ${session.semester}`} />
          <InfoField label="Section" value={`Section ${session.section}`} />
          <InfoField label="Batch" value={`Batch ${session.batch}`} />
          <InfoField label="Period" value={session.timeSlot} />
          <InfoField label="Room" value={session.room} />
          <InfoField label="Date" value={new Date().toLocaleDateString('en-IN')} />
          <InfoField label="Students" value={`${session.students.length}`} />
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Shortcuts:</span>
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">P</span> Present
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">A</span> Absent
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">L</span> Leave
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">T</span> Late
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">O</span> On Duty
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">M</span> Medical
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">Ctrl+Z</span> Undo
        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono">Enter</span> Submit
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <AttendanceTable
          session={session}
          records={recordList}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onMarkStatus={markStatus}
        />
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar
        onMarkAll={markAll}
        onUndo={undo}
        onSubmit={handleSubmit}
        autoSave={autoSave}
        onToggleAutoSave={() => setAutoSave((v: boolean) => !v)}
        allMarked={allMarked}
        summary={summary}
      />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

export default AttendanceForm;