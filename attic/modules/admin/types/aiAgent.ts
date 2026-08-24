// src/types/aiAgent.ts
// Type definitions for the Vriddhi AI Agent module

export type AIInsightType =
  | 'attendance_alert'
  | 'performance_risk'
  | 'fee_overdue'
  | 'schedule_conflict'
  | 'faculty_workload'
  | 'student_at_risk'
  | 'top_performer'
  | 'trend_positive'
  | 'trend_negative'
  | 'action_required'
  | 'general_info'
  | 'comparison';

export type AIInsightSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface AIInsight {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  title: string;
  description: string;
  metric?: number;
  metricLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  affectedCount?: number;
  affectedIds?: string[];
  actionText?: string;
  actionRoute?: string;
  createdAt: string;
  expiresAt?: string;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface AIQueryResult {
  query: string;
  intent: AIQueryIntent;
  insights: AIInsight[];
  summary: string;
  dataPoints?: Record<string, number | string>;
  chartData?: Array<Record<string, unknown>>;
  suggestedActions?: string[];
  processingTimeMs: number;
}

export type AIQueryIntent =
  | 'attendance_summary'
  | 'performance_summary'
  | 'fee_summary'
  | 'faculty_summary'
  | 'student_search'
  | 'schedule_query'
  | 'trend_analysis'
  | 'comparison'
  | 'risk_assessment'
  | 'general';

export interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  queryResult?: AIQueryResult;
  isLoading?: boolean;
}

export interface AIAgentFilters {
  severity?: AIInsightSeverity[];
  type?: AIInsightType[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
  acknowledged?: boolean;
}

export interface AggregatedAttendance {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  overallPercentage: number;
  departmentBreakdown: Array<{
    department: string;
    percentage: number;
    total: number;
    present: number;
  }>;
  lowAttendanceStudents: Array<{
    studentId: string;
    name: string;
    regNo: string;
    percentage: number;
    department: string;
  }>;
}

export interface AggregatedPerformance {
  totalAssessments: number;
  avgScore: number;
  passRate: number;
  topPerformers: Array<{
    studentId: string;
    name: string;
    regNo: string;
    avgScore: number;
    department: string;
  }>;
  weakPerformers: Array<{
    studentId: string;
    name: string;
    regNo: string;
    avgScore: number;
    department: string;
  }>;
  departmentBreakdown: Array<{
    department: string;
    avgScore: number;
    passRate: number;
  }>;
}

export interface AggregatedFees {
  totalFees: number;
  collectedFees: number;
  pendingFees: number;
  overdueFees: number;
  collectionRate: number;
  overdueStudents: Array<{
    studentId: string;
    name: string;
    regNo: string;
    amount: number;
    daysOverdue: number;
  }>;
}

export interface AggregatedFaculty {
  totalFaculty: number;
  avgClassesPerDay: number;
  avgAttendanceMarked: number;
  papersPending: number;
  topicsPending: number;
  workloadDistribution: Array<{
    facultyId: string;
    name: string;
    classesPerWeek: number;
    topicsCovered: number;
    papersUploaded: number;
    workloadScore: number;
  }>;
}

export interface CollegeSnapshot {
  collegeId: string;
  collegeName: string;
  generatedAt: string;
  attendance: AggregatedAttendance;
  performance: AggregatedPerformance;
  fees: AggregatedFees;
  faculty: AggregatedFaculty;
  totalStudents: number;
  totalFaculty: number;
  totalDepartments: number;
}