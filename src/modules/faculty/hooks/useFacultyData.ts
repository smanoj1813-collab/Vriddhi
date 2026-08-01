import { useCallback, useEffect, useState } from 'react';

export interface FacultyStudent {
  id: string;
  name: string;
  regNo: string;
  rollNo?: string;
  status: 'weak' | 'average' | 'good' | 'excellent';
  attendance?: number;
  attendancePercentage?: number;
  marks?: number;
  avgScore?: number;
  email?: string;
  photoUrl?: string;
}

export interface FacultyTopic {
  id: string;
  title: string;
  subject: string;
  unit?: string;
  duration?: number;
  status: 'covered' | 'pending' | 'in-progress' | 'completed';
  plannedDate?: Date | string;
  completedDate?: Date | string;
  dateCovered?: string;
  description?: string;
}

export interface FacultyPaper {
  id: string;
  title: string;
  subject: string;
  type: string;
  totalMarks: number;
  verificationStatus: 'pending-verification' | 'submitted-for-approval' | 'approved' | 'rejected';
  createdAt?: Date | string;
}

export interface FacultyClassSession {
  id: string;
  subject: string;
  subjectCode?: string;
  className: string;
  section?: string;
  time: string;
  endTime?: string;
  room: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rescheduled';
  topics?: string[];
  date?: Date | string;
}

// Alias for components that import ClassSession from this file
export type ClassSession = FacultyClassSession;

export interface FacultyStats {
  totalStudents: number;
  goodStudents: number;
  averageStudents: number;
  weakStudents: number;
  coveredTopics: number;
  pendingTopics: number;
  totalPapers: number;
  pendingVerifications: number;
  pendingApprovals: number;
}

export interface UseFacultyDataReturn {
  students: FacultyStudent[];
  topics: FacultyTopic[];
  papers: FacultyPaper[];
  sessions: FacultyClassSession[];
  classSessions: FacultyClassSession[]; // alias for legacy comps
  stats: FacultyStats;
  todayDate: string;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useFacultyData = (facultyId?: string, _collegeId?: string): UseFacultyDataReturn => {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [topics, setTopics] = useState<FacultyTopic[]>([]);
  const [papers, setPapers] = useState<FacultyPaper[]>([]);
  const [sessions, setSessions] = useState<FacultyClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayDate = new Date().toISOString().split('T')[0];

  const stats: FacultyStats = {
    totalStudents: students.length,
    goodStudents: students.filter(s => s.status === 'good').length,
    averageStudents: students.filter(s => s.status === 'average').length,
    weakStudents: students.filter(s => s.status === 'weak').length,
    coveredTopics: topics.filter(t => t.status === 'covered' || t.status === 'completed').length,
    pendingTopics: topics.filter(t => t.status === 'pending' || t.status === 'in-progress').length,
    totalPapers: papers.length,
    pendingVerifications: papers.filter(p => p.verificationStatus === 'pending-verification').length,
    pendingApprovals: papers.filter(p => p.verificationStatus === 'submitted-for-approval').length,
  };

  const fetchData = useCallback(async () => {
    if (!facultyId) { setLoading(false); return; }
    try {
      setLoading(true);
      // TODO: Wire to Firestore
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { 
    students, 
    topics, 
    papers, 
    sessions, 
    classSessions: sessions, // alias
    stats, 
    todayDate, 
    loading, 
    error, 
    refresh: fetchData 
  };
};

export default useFacultyData;