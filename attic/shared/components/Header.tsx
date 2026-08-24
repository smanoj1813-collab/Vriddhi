import { useGreeting } from '../../hooks/useGreeting';
import { CalendarToday, CheckCircleOutlined, Schedule } from '@mui/icons-material';

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
    <header className="mb-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{greeting}</h1>
          </div>
          <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span>{today}</span>
            {faculty.department && (
              <>
                <span>•</span>
                <span className="text-teal-600 dark:text-teal-400 font-semibold">{faculty.department}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/60 px-3.5 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <Schedule sx={{ fontSize: 16 }} />
            Today's Classes: {todayClassesCount}
          </span>
          <button
            onClick={onMarkAttendance}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition-all duration-200 hover:bg-teal-700 active:scale-95"
          >
            <CheckCircleOutlined sx={{ fontSize: 16 }} />
            Mark Attendance
          </button>
          <button
            onClick={onViewPending}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
          >
            Pending Classes
          </button>
        </div>
      </div>
    </header>
  );
}
