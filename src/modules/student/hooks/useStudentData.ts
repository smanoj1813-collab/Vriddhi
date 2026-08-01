import { useCallback, useEffect, useState } from 'react';
import type {
  StudentProfile,
  Assignment,
  Notification,
  FeeSummary,
  StudentDashboardStats,
  Assessment,
  ClassSchedule,
  AttendanceSummary,   // ← ADDED
} from '../types/student';

// Re-export API functions from shared location
export * from '../../../shared/api/studentApi';

export interface UseStudentDataReturn {
  student: StudentProfile | null;
  profile: StudentProfile | null;
  assignments: Assignment[];
  notifications: Notification[];
  unreadNotifications: number;
  feeSummary: FeeSummary | null;
  fees: FeeSummary | null;
  stats: StudentDashboardStats | null;
  attendance: AttendanceSummary | null;   // ← FIXED: was `unknown`
  assessments: Assessment[];
  schedule: ClassSchedule[];
  todayDate: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useStudentData = (studentId?: string): UseStudentDataReturn => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);   // ← ADDED
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const fetchData = useCallback(async () => {
    if (!studentId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Implement actual Firebase fetch
      // When you wire real data, setAttendance(data.attendance) here
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    student,
    profile: student,
    assignments,
    notifications,
    unreadNotifications,
    feeSummary,
    fees: feeSummary,
    stats,
    attendance,          // ← FIXED: was `null`
    assessments,
    schedule,
    todayDate,
    loading,
    error,
    refresh: fetchData,
  };
};

export default useStudentData;
