import { useState, useEffect } from "react";

export interface FacultyStudent {
  id: string;
  name: string;
  regNo: string;
  email?: string;
  classId?: string;
  className?: string;
  attendancePercentage?: number;
  avgScore?: number;
  status?: "good" | "average" | "weak";
  rollNo?: string;
}

export interface FacultyTopic {
  id: string;
  name?: string;
  title?: string;
  subject?: string;
  classId?: string;
  status?: "planned" | "in-progress" | "completed" | "delayed" | "pending" | "in_progress";
  scheduledDate?: Date | string;
  unit?: string;
  duration?: number;
  dateCovered?: string;
}

export interface ClassSession {
  id: string;
  classId?: string;
  className?: string;
  subject: string;
  date?: Date | string;
  period?: number;
  topic?: string;
  attendanceMarked?: boolean;
  startTime?: string;
  endTime?: string;
  room?: string;
  status?: string;
  type?: string;
  faculty?: string;
  topicsPlanned?: string[];
}

export interface FacultyPaper {
  id: string;
  title: string;
  verificationStatus?: "pending-verification" | "submitted-for-approval" | "approved" | "verified";
}

export interface FacultyStats {
  totalStudents?: number;
  weakStudentsCount?: number;
  avgAttendance?: number;
  topicsCovered?: number;
  topicsPending?: number;
  papersUploaded?: number;
  papersPendingApproval?: number;
  [key: string]: number | undefined;
}

export function useFacultyData(facultyId?: string) {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [topics, setTopics] = useState<FacultyTopic[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [papers, setPapers] = useState<FacultyPaper[]>([]);
  const [stats, setStats] = useState<FacultyStats>({});
  const [todayDate, setTodayDate] = useState<string>(new Date().toLocaleDateString("en-IN"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStudents([]);
    setTopics([]);
    setSessions([]);
    setPapers([]);
    setStats({});
    setTodayDate(new Date().toLocaleDateString("en-IN"));
    setLoading(false);
    setError(null);
  }, [facultyId]);

  return { students, topics, sessions, papers, stats, todayDate, loading, error, refetch: () => {} };
}