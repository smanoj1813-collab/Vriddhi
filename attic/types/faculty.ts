  export interface FacultyProfile {
    title: string;
    name: string;
    email?: string;
    department?: string;
    avatar?: string;
  }

  export interface FacultyStudent {
    id: string;
    name: string;
    regNo?: string;
    rollNo?: string;
    course?: string;
    batch?: string;
    attendancePercentage?: number;
    avgScore?: number;
    status?: "good" | "average" | "weak";
  }

  export interface FacultyTopic {
    id: string;
    title?: string;
    name?: string;
    unit?: string;
    duration?: number;
    dateCovered?: string;
    status?: "pending" | "in-progress" | "completed" | "covered" | "in_progress";
    subject?: string;
    classId?: string;
  }

  export interface ClassSession {
    id: string;
    subject: string;
    startTime?: string;
    endTime?: string;
    room?: string;
    type?: string;
    topic?: string;
    className?: string;
    faculty?: string;
    status?: string;
    attendanceMarked?: boolean;
    topicsPlanned?: string[];
    date?: Date | string;
    period?: number;
    classId?: string;
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

  export interface UseFacultyDataReturn {
    loading: boolean;
    students: FacultyStudent[];
    topics: FacultyTopic[];
    sessions: ClassSession[];
    papers: FacultyPaper[];
    stats: FacultyStats;
    todayDate: string;
    error: string | null;
    refetch: () => void;
  }