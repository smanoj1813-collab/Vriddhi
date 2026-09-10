// src/modules/admin/pages/FacultyAttendanceAdmin.tsx
//
// Full-page home for the faculty attendance analysis (sidebar →
// /admin/faculty-attendance). The dashboard tab renders the same panel, so a
// principal who starts on the dashboard and one who clicks through the sidebar
// are looking at identical numbers.

import { useAuth } from '@/modules/auth/context/AuthContext';
import FacultyAttendancePanel from '../components/FacultyAttendancePanel';

export default function FacultyAttendanceAdmin() {
  const { user } = useAuth();

  return (
    <div className="page-container max-w-[1400px]">
      <div className="mb-6">
        <h1 className="section-title mb-1">Faculty Attendance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Staff self-marked attendance, monthly or for any date range. Downloadable as CSV, Excel or PDF.
        </p>
      </div>
      <FacultyAttendancePanel collegeId={user?.collegeId} compact />
    </div>
  );
}
