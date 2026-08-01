import { useGreeting } from '../../hooks/useGreeting';

// Self-contained stub — swap to canonical import once type paths stabilize
interface FacultyProfile {
  id: string;
  name: string;
  title?: string;
  email?: string;
  department?: string;
  designation?: string;
  phone?: string;
  avatar?: string;
}

interface HeaderProps {
  faculty: FacultyProfile;
  todayClassesCount: number;
  onMarkAttendance: () => void;
  onViewPending: () => void;
}

export function Header({ faculty, todayClassesCount, onMarkAttendance, onViewPending }: HeaderProps) {
  const greeting = useGreeting(`${faculty.title ? faculty.title + ' ' : ''}${faculty.name}`);
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{greeting}</h1>
          <p className="mt-1 text-sm text-gray-500">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
            Today's Classes: {todayClassesCount}
          </span>
          <button
            onClick={onMarkAttendance}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-teal-600 active:scale-95"
          >
            Mark Attendance
          </button>
          <button
            onClick={onViewPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-95"
          >
            View Pending Classes
          </button>
        </div>
      </div>
    </header>
  );
}