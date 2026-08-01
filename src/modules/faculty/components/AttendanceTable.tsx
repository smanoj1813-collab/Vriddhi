import { useEffect, useState } from 'react';
import { AttendanceStatus, ClassSession, STATUS_CONFIG, Student } from '../types/attendance';

interface AttendanceTableProps {
  session: ClassSession;
  records: Record<string, AttendanceStatus>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onMarkStatus: (ids: string[], status: AttendanceStatus) => void;
}

// Inline simple avatar since StudentAvatar component may not exist yet
function StudentAvatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// Inline status badge since StatusBadge component may not exist yet
function StatusBadge({ status }: { status: AttendanceStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color} border border-current/20`}>
      {config.label}
    </span>
  );
}

export function AttendanceTable({
  session,
  records,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onMarkStatus,
}: AttendanceTableProps) {
  const [search, setSearch] = useState('');

  const filteredStudents = session.students.filter(
    (s: Student) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.usn.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s: Student) => selectedIds.has(s.id));

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        return;
      }
      if (selectedIds.size === 0) return;
      const selectedArray = Array.from(selectedIds);
      const key = e.key.toUpperCase();
      const statusMap: Record<string, AttendanceStatus> = {
        P: 'Present',
        A: 'Absent',
        L: 'Leave',
        T: 'Late',
        O: 'OnDuty',
        M: 'MedicalLeave',
      };
      if (statusMap[key]) {
        e.preventDefault();
        onMarkStatus(selectedArray, statusMap[key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, onMarkStatus]);

  return (
    <div className="flex flex-col">
      {/* Search */}
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or USN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="text-xs text-gray-500">
          {selectedIds.size > 0 ? `${selectedIds.size} selected` : ''}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="max-h-[60vh] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? onDeselectAll() : onSelectAll())}
                    className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="px-2 py-3 font-semibold text-gray-700">Photo</th>
                <th className="px-2 py-3 font-semibold text-gray-700">USN</th>
                <th className="px-2 py-3 font-semibold text-gray-700">Name</th>
                <th className="px-2 py-3 font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 font-semibold text-gray-700">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student: Student) => {
                const status = records[student.id] ?? 'Present';
                const isSelected = selectedIds.has(student.id);
                return (
                  <tr
                    key={student.id}
                    className={`transition-colors duration-150 ${isSelected ? 'bg-teal-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(student.id)}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <StudentAvatar name={student.name} />
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600">{student.usn}</td>
                    <td className="px-2 py-2 font-medium text-gray-900">{student.name}</td>
                    <td className="px-2 py-2">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => onMarkStatus([student.id], s)}
                            className={`
                              rounded px-2 py-1 text-xs font-medium transition-all duration-150
                              ${status === s
                                ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} border border-current`
                                : 'border border-gray-200 text-gray-500 hover:bg-gray-100'
                              }
                            `}
                          >
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredStudents.length === 0 && (
        <div className="py-12 text-center text-sm text-gray-400">No students match your search.</div>
      )}
    </div>
  );
}

export default AttendanceTable;