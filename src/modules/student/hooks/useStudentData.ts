// src/modules/student/hooks/useStudentData.ts
// ------------------------------------------------------------------
// Aggregates all real Firestore data for the student dashboard.
// Identity comes from useCurrentStudent() → no localStorage tokens.
// ------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import type {
  Assignment,
  Notification,
  FeeSummary,
  StudentDashboardStats,
  Assessment,
  ClassSchedule,
  AttendanceSummary,
  StudentProfile,
} from '../types/student';
import {
  fetchProfile,
  fetchAttendance,
  fetchAssignments,
  fetchFees,
  fetchTodaySchedule,
  fetchNotifications,
  fetchStudentTests,
  type StudentProfileData,
  type StudentAssignmentData,
  type StudentClassSession,
  type StudentNotificationData,
  type StudentFeeData,
  type AttendanceSummaryData,
  type StudentTestCardData,
} from '../api/studentDataApi';
import { useAuth } from '../../auth/context/AuthContext';

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
  tests: StudentTestCardData[];
  todayDate: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** The resolved Firestore student document id (used by other pages). */
  studentId: string;
  collegeId: string;
}

function mapProfile(p: StudentProfileData | null): StudentProfile | null {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    regNo: p.regNo,
    rollNumber: p.rollNumber,
    branch: p.branch,
    semester: p.semester,
    division: p.division,
    section: p.section,
    batch: p.batch,
    avatar: p.avatar,
    collegeId: p.collegeId,
    course: p.course,
  };
}

function mapAttendance(a: AttendanceSummaryData | null): AttendanceSummary | null {
  if (!a) return null;
  return {
    percentage: a.percentage,
    presentClasses: a.present,
    totalClasses: a.totalClasses,
    absentClasses: a.absent,
  };
}

function mapAssignments(items: StudentAssignmentData[]): Assignment[] {
  return items.map((a) => ({
    id: a.id,
    title: a.title,
    subject: a.subject,
    subjectCode: a.subjectCode,
    description: a.description || '',
    dueDate: a.dueDate,
    dueTime: a.dueTime,
    maxMarks: a.maxMarks,
    status: a.status,
    submissionType: a.submissionType,
  }));
}

function mapNotifications(items: StudentNotificationData[]): Notification[] {
  return items.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.timestamp,
    read: n.read,
    priority: n.priority,
  }));
}

function mapFees(f: StudentFeeData): FeeSummary {
  return {
    totalFees: f.totalFees,
    paidFees: f.paidFees,
    pendingFees: f.pendingFees,
    totalPaid: f.totalPaid,
    totalBalance: f.totalBalance,
    totalOverdue: f.totalOverdue,
  };
}

function mapSchedule(items: StudentClassSession[]): ClassSchedule[] {
  return items.map((s) => ({
    id: s.id,
    subject: s.subject,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    faculty: s.facultyName,
    facultyName: s.facultyName,
    teacher: s.facultyName,
    type: s.type,
    topic: s.topic,
  }));
}

function mapAssessments(tests: StudentTestCardData[]): Assessment[] {
  return tests.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    date: t.startDateTime ? t.startDateTime.split('T')[0] : '',
    time: t.startDateTime ? new Date(t.startDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    type: deriveType(t.title),
    status: t.status,
    totalMarks: t.totalMarks,
    venue: '',
  }));
}

function deriveType(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('quiz')) return 'quiz';
  if (t.includes('mid')) return 'midterm';
  if (t.includes('final') || t.includes('end sem')) return 'final';
  if (t.includes('unit test')) return 'unit-test';
  return 'assessment';
}

export const useStudentData = (explicitStudentId?: string): UseStudentDataReturn => {
  const { user } = useAuth();

  const [studentDocId, setStudentDocId] = useState<string>('');
  const [collegeId, setCollegeId] = useState<string>(user?.collegeId || '');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [schedule, setSchedule] = useState<ClassSchedule[]>([]);
  const [tests, setTests] = useState<StudentTestCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const fetchData = useCallback(async () => {
    const uid = explicitStudentId || user?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = await fetchProfile(uid, user?.email || undefined);
      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setStudentDocId(profileData.id);
      setCollegeId(profileData.collegeId || user?.collegeId || '');

      const mappedProfile = mapProfile(profileData);
      setProfile(mappedProfile);

      const today = new Date().toISOString().split('T')[0];

      const [attendanceData, assignmentData, feeData, scheduleData, notificationData, testData] =
        await Promise.all([
          fetchAttendance(profileData.id),
          fetchAssignments(profileData.id),
          fetchFees(profileData.id),
          fetchTodaySchedule(
            {
              branch: profileData.branch,
              batch: profileData.batch,
              semester: profileData.semester,
              division: profileData.division,
              section: profileData.section,
            },
            today
          ),
          fetchNotifications(profileData.id),
          fetchStudentTests(profileData.collegeId || user?.collegeId, profileData.id),
        ]);

      setAttendance(mapAttendance(attendanceData));
      setAssignments(mapAssignments(assignmentData));
      setFeeSummary(mapFees(feeData));
      setSchedule(mapSchedule(scheduleData));
      setNotifications(mapNotifications(notificationData));
      setTests(testData);
      setAssessments(mapAssessments(testData));

      const pendingAssignments = assignmentData.filter(
        (a) => a.status === 'pending' || a.status === 'overdue'
      ).length;
      const upcomingTests = testData.filter(
        (t) => t.status === 'upcoming' || t.status === 'available'
      ).length;

      setStats({
        attendancePercentage: attendanceData.percentage,
        pendingAssignments,
        upcomingTests,
        upcomingAssessments: upcomingTests,
        upcomingClasses: scheduleData.length,
        feeDue: feeData.pendingFees,
        newNotifications: notificationData.filter((n) => !n.read).length,
        overdueAssignments: assignmentData.filter((a) => a.status === 'overdue').length,
        lowAttendanceSubjects: attendanceData.percentage < attendanceData.requiredPercentage ? 1 : 0,
        cgpa: profileData.cgpa,
      });
    } catch (err) {
      console.error('[useStudentData] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [explicitStudentId, user?.uid, user?.email, user?.collegeId, refreshKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    student: profile,
    profile,
    assignments,
    notifications,
    unreadNotifications,
    feeSummary,
    fees: feeSummary,
    stats,
    attendance,
    assessments,
    schedule,
    tests,
    todayDate,
    loading,
    error,
    refresh: () => setRefreshKey((k) => k + 1),
    studentId: studentDocId,
    collegeId,
  };
};

export default useStudentData;
