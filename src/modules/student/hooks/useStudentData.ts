import { useCallback, useEffect, useState } from 'react';
import type {
  StudentProfile,
  Assignment,
  Notification,
  FeeSummary,
  StudentDashboardStats,
  Assessment,
  ClassSchedule,
  AttendanceSummary,
} from '../types/student';
import {
  fetchStudentProfile,
  fetchStudentAttendance,
  fetchPendingAssignments,
  fetchFeeSummary,
  fetchClassSchedule,
  fetchStudentNotifications,
  getTodayDateString,
  resetReadCount,
} from '../api/studentApi';

export interface UseStudentDataReturn {
  student: StudentProfile | null;
  profile: StudentProfile | null;
  assignments: Assignment[];
  notifications: Notification[];
  unreadNotifications: number;
  feeSummary: FeeSummary | null;
  fees: FeeSummary | null;
  stats: StudentDashboardStats | null;
  attendance: AttendanceSummary | null;
  assessments: Assessment[];
  schedule: ClassSchedule[];
  todayDate: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useStudentData = (studentId?: string): UseStudentDataReturn => {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
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

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const fetchData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      resetReadCount();

      const today = getTodayDateString();

      const [
        profileData,
        attendanceData,
        assignmentsData,
        feesData,
        scheduleData,
        notificationsData,
      ] = await Promise.all([
        fetchStudentProfile(studentId),
        fetchStudentAttendance(studentId),
        fetchPendingAssignments(studentId),
        fetchFeeSummary(studentId),
        fetchClassSchedule(studentId, today),
        fetchStudentNotifications(studentId),
      ]);

      setStudent(profileData as StudentProfile);
      setAttendance(attendanceData as AttendanceSummary);
      setAssignments(assignmentsData as Assignment[]);
      setFeeSummary(feesData as FeeSummary | null);
      setSchedule(scheduleData as ClassSchedule[]);
      setNotifications(notificationsData as Notification[]);

      // ═══════════════════════════════════════════════════════
      // DEMO DATA — Assessments (remove after testing)
      // ═══════════════════════════════════════════════════════
      const demoAssessments: Assessment[] = [
        {
          id: 'demo-001',
          title: 'Data Structures & Algorithms — Mid Term',
          subject: 'Computer Science',
          date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          time: '10:00 AM',
          venue: 'Block A — Room 301',
          type: 'midterm',
          status: 'upcoming',
          totalMarks: 100,
        },
        {
          id: 'demo-002',
          title: 'Database Management Systems — Quiz 3',
          subject: 'DBMS',
          date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          time: '2:00 PM',
          venue: 'Online (Moodle)',
          type: 'quiz',
          status: 'upcoming',
          totalMarks: 20,
        },
        {
          id: 'demo-003',
          title: 'Operating Systems — End Semester',
          subject: 'OS',
          date: new Date().toISOString().split('T')[0],
          time: '9:00 AM',
          venue: 'Block B — Lab 2',
          type: 'final',
          status: 'active',
          totalMarks: 100,
        },
        {
          id: 'demo-004',
          title: 'Mathematics — Unit Test 1',
          subject: 'Mathematics',
          date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
          time: '11:00 AM',
          venue: 'Block C — Room 105',
          type: 'quiz',
          status: 'completed',
          totalMarks: 50,
        },
        {
          id: 'demo-005',
          title: 'Computer Networks — Surprise Test',
          subject: 'CN',
          date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          time: '3:30 PM',
          venue: 'Block A — Room 202',
          type: 'quiz',
          status: 'missed',
          totalMarks: 15,
        },
      ];
      setAssessments(demoAssessments);

      // ═══════════════════════════════════════════════════════
      // DEMO DATA — Dashboard Stats (remove after testing)
      // ═══════════════════════════════════════════════════════
      const demoStats: StudentDashboardStats = {
        attendancePercentage: 87,
        pendingAssignments: 3,
        upcomingTests: 2,
        upcomingClasses: 4,
        upcomingAssessments: 2,
        feeDue: 12500,
        newNotifications: 5,
        overdueAssignments: 1,
        lowAttendanceSubjects: 1,
        cgpa: 8.4,
        rank: 12,
        totalStudents: 120,
      };
      setStats(demoStats);

    } catch (err) {
      console.error('[useStudentData] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    student,
    profile: student,
    assignments,
    notifications,
    unreadNotifications,
    feeSummary,
    fees: feeSummary,
    stats,
    attendance,
    assessments,
    schedule,
    todayDate,
    loading,
    error,
    refresh: fetchData,
  };
};

export default useStudentData;