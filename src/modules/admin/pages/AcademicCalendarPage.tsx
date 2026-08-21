// ═══════════════════════════════════════════════════════════════════════
// pages/AcademicCalendarPage.tsx — Admin/Principal Academic Calendar
// ═══════════════════════════════════════════════════════════════════════

import { CalendarDays } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useCurriculumMapping } from '../hooks/useCurriculumMapping';
import AcademicCalendar from '@/components/AcademicCalendar';

export default function AcademicCalendarPage() {
  const { user } = useAuth();
  const collegeId = user?.collegeId;
  const { facultyList, curriculumList } = useCurriculumMapping(collegeId);

  return (
    <div className="min-h-full p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
          <CalendarDays size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Academic Calendar</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Classes, exams, holidays, deadlines and meetings across the college
          </p>
        </div>
      </div>

      <AcademicCalendar
        collegeId={collegeId}
        userId={user?.id || ''}
        userName={user?.name || null}
        facultyList={facultyList}
        curriculumList={curriculumList}
      />
    </div>
  );
}
