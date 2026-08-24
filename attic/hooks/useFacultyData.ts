import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/Firebase/config';
import { useAuth } from '@/modules/auth/context/AuthContext';
import {
  fetchFacultyStudents,
  fetchFacultyTopics,
  fetchClassSessions,
  fetchTestPapers,
  getTodayDateString,
} from '@/modules/faculty/api/facultyApi';
import type {
  FacultyStudent,
  FacultyTopic,
  ClassSession,
  FacultyStats,
  TestPaper,
} from '@/modules/faculty/types/attendance';

export type { FacultyStudent, FacultyTopic, ClassSession, FacultyStats } from '@/modules/faculty/types/attendance';

// ═══════════════════════════════════════════════════════════════════════
// LOCAL TYPES
// ═══════════════════════════════════════════════════════════════════════
export interface FacultyPaper {
  id: string;
  title: string;
  // Matches TestPaper.verificationStatus exactly: includes 'rejected'
  verificationStatus: 'pending-verification' | 'submitted-for-approval' | 'approved' | 'rejected';
  facultyId?: string;
  subject?: string;
  createdAt?: string;
}

export interface UseFacultyDataReturn {
  students: FacultyStudent[];
  topics: FacultyTopic[];
  sessions: ClassSession[];
  papers: FacultyPaper[];
  stats: FacultyStats;
  todayDate: string;
  loading: boolean;
  error: string | null;
  collegeName: string;
  refetch: () => void;
}

function makeEmptyStats(): FacultyStats {
  return {
    totalStudents: 0,
    weakStudentsCount: 0,
    avgAttendance: 0,
    topicsCovered: 0,
    topicsPending: 0,
    papersUploaded: 0,
    papersPendingApproval: 0,
    classesThisWeek: 0,
    goodStudents: 0,
    averageStudents: 0,
    weakStudents: 0,
    coveredTopics: 0,
    pendingTopics: 0,
    totalPapers: 0,
    pendingVerifications: 0,
    pendingApprovals: 0,
  };
}

export function useFacultyData(): UseFacultyDataReturn {
  const { user } = useAuth();
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [topics, setTopics] = useState<FacultyTopic[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [papers, setPapers] = useState<FacultyPaper[]>([]);
  const [stats, setStats] = useState<FacultyStats>(makeEmptyStats());
  const [todayDate, setTodayDate] = useState<string>(getTodayDateString());
  const [collegeName, setCollegeName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setStudents([]);
      setTopics([]);
      setSessions([]);
      setPapers([]);
      setStats(makeEmptyStats());
      setCollegeName('');
      return;
    }

    const facultyId = user.uid || user.id || '';
    const collegeId = user.collegeId || '';
    const facultyName = user.name || '';
    const facultyDepartment = user.department || '';

    setLoading(true);
    setError(null);

    try {
      const today = getTodayDateString();

      let fetchedCollegeName = '';
      if (collegeId) {
        const collegeSnap = await getDoc(doc(db, 'colleges', collegeId));
        if (collegeSnap.exists()) {
          const cData = collegeSnap.data();
          fetchedCollegeName = cData.name || cData.shortName || cData.collegeName || '';
        }
      }
      setCollegeName(fetchedCollegeName);

      const [studentsData, topicsData, sessionsData, papersData] = await Promise.all([
        fetchFacultyStudents(facultyId, collegeId, facultyName, facultyDepartment),
        fetchFacultyTopics(facultyId),
        fetchClassSessions(facultyId, today),
        fetchTestPapers(facultyId),
      ]);

      setStudents(studentsData);
      setTopics(topicsData);
      setSessions(sessionsData);

      const mappedPapers: FacultyPaper[] = (papersData as TestPaper[]).map((p) => ({
        id: p.id,
        title: p.title || 'Untitled Paper',
        verificationStatus: p.verificationStatus,
        facultyId: p.createdBy,
        subject: p.subject,
        createdAt: p.createdAt,
      }));
      setPapers(mappedPapers);

      const totalStudents = studentsData.length;
      const weakStudentsCount = studentsData.filter((s) => s.status === 'weak').length;
      const goodStudentsCount = studentsData.filter((s) => s.status === 'good').length;
      const averageStudentsCount = studentsData.filter((s) => s.status === 'average').length;
      const excellentStudentsCount = studentsData.filter((s) => s.status === 'excellent').length;
      const avgAttendance =
        totalStudents > 0
          ? Math.round(
              studentsData.reduce((sum, s) => sum + (s.attendancePercentage || 0), 0) / totalStudents
            )
          : 0;
      const topicsCovered = topicsData.filter(
        (t) => t.status === 'covered' || t.status === 'completed'
      ).length;
      const topicsPending = topicsData.filter((t) => t.status === 'pending').length;
      const papersUploaded = papersData.length;
      const papersPendingApproval = mappedPapers.filter(
        (p) =>
          p.verificationStatus === 'pending-verification' ||
          p.verificationStatus === 'submitted-for-approval'
      ).length;

      setStats({
        totalStudents,
        weakStudentsCount,
        avgAttendance,
        topicsCovered,
        topicsPending,
        papersUploaded,
        papersPendingApproval,
        classesThisWeek: sessionsData.length,
        goodStudents: goodStudentsCount,
        averageStudents: averageStudentsCount,
        weakStudents: weakStudentsCount,
        coveredTopics: topicsCovered,
        pendingTopics: topicsPending,
        totalPapers: papersUploaded,
        pendingVerifications: mappedPapers.filter((p) => p.verificationStatus === 'pending-verification').length,
        pendingApprovals: mappedPapers.filter((p) => p.verificationStatus === 'submitted-for-approval').length,
      });

      setTodayDate(today);
    } catch (err: any) {
      console.error('[useFacultyData] Fetch error:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    students,
    topics,
    sessions,
    papers,
    stats,
    todayDate,
    loading,
    error,
    collegeName,
    refetch: fetchData,
  };
}