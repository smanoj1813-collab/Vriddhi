import { ClassSession } from '../types';

interface ClassCardProps {
  session: ClassSession;
  onStart: () => void;
  onViewSummary: () => void;
}

export function ClassCard({ session, onStart, onViewSummary }: ClassCardProps) {
  const isPending = session.status === 'Pending';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{session.subject}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Semester {session.semester} · Section {session.section} · Batch {session.batchYear}
          </p>
        </div>
        <span
          className={`
            rounded-full px-3 py-1 text-xs font-semibold
            ${isPending
              ? 'border border-amber-300 bg-amber-50 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'}
          `}
        >
          {session.status}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {session.timeSlot}
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {session.room}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{session.students?.length ?? 0} students</span>
        {isPending ? (
          <button
            onClick={onStart}
            className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600 active:scale-[0.98] sm:w-auto"
          >
            Start Attendance
          </button>
        ) : (
          <button
            onClick={onViewSummary}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
          >
            View Summary
          </button>
        )}
      </div>
    </div>
  );
}