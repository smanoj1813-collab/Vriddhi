import { useState, useEffect } from "react";

export interface FacultyStudent {
  id: string;
  name: string;
  regNo: string;
  email: string;
  classId: string;
  className: string;
  attendancePercentage?: number;
}

export interface FacultyTopic {
  id: string;
  name: string;
  subject: string;
  classId: string;
  status: "pending" | "in_progress" | "completed";
  scheduledDate?: Date;
}

export interface ClassSession {
  id: string;
  classId: string;
  className: string;
  subject: string;
  date: Date;
  period: number;
  topic?: string;
  attendanceMarked: boolean;
}

export function useFacultyData(facultyId?: string) {
  const [students, setStudents] = useState<FacultyStudent[]>([]);
  const [topics, setTopics] = useState<FacultyTopic[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStudents([]);
    setTopics([]);
    setSessions([]);
    setLoading(false);
    setError(null);
  }, [facultyId]);

  return { students, topics, sessions, loading, error, refetch: () => {} };
}
