// src/api/aiAgentApi.ts
// ─── AI Agent API ─────────────────────────────────────────

import { apiClient } from './client'

// ─── Types ──────────────────────────────────────────────

export interface AggregatedAttendance {
  totalStudents: number
  presentToday: number
  absentToday: number
  averageAttendance: number
  byDepartment: Record<string, number>
  byBatch: Record<string, number>
  weeklyTrend: { day: string; percentage: number }[]
}

export interface AggregatedPerformance {
  totalAssessments: number
  averageScore: number
  passRate: number
  topPerformers: { name: string; score: number }[]
  weakAreas: { subject: string; avgScore: number }[]
  byDepartment: Record<string, number>
}

export interface AggregatedFees {
  totalFees: number
  collectedFees: number
  pendingFees: number
  collectionRate: number
  byDepartment: Record<string, { collected: number; pending: number }>
  defaulters: { name: string; regNo: string; pendingAmount: number }[]
}

export interface AggregatedFaculty {
  totalFaculty: number
  activeFaculty: number
  avgWorkload: number
  byDepartment: Record<string, number>
  topSubjects: { subject: string; facultyCount: number }[]
}

export interface CollegeSnapshot {
  collegeId: string
  collegeName: string
  totalStudents: number
  totalFaculty: number
  totalDepartments: number
  attendanceToday: number
  feesCollectionRate: number
  avgPerformance: number
  activeAssessments: number
  lastUpdated: string
}

export interface AIInsight {
  id: string
  category: 'attendance' | 'performance' | 'fees' | 'faculty' | 'general'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  createdAt: string
}

export interface AIQueryResult {
  answer: string
  data?: Record<string, unknown>
  sources?: string[]
  confidence: number
}

// ─── API Functions ──────────────────────────────────────

export async function getAggregatedAttendance(collegeId: string): Promise<AggregatedAttendance> {
  const res = await apiClient.get<AggregatedAttendance>(`/ai-agent/attendance/${collegeId}`)
  return res.data
}

export async function getAggregatedPerformance(collegeId: string): Promise<AggregatedPerformance> {
  const res = await apiClient.get<AggregatedPerformance>(`/ai-agent/performance/${collegeId}`)
  return res.data
}

export async function getAggregatedFees(collegeId: string): Promise<AggregatedFees> {
  const res = await apiClient.get<AggregatedFees>(`/ai-agent/fees/${collegeId}`)
  return res.data
}

export async function getAggregatedFaculty(collegeId: string): Promise<AggregatedFaculty> {
  const res = await apiClient.get<AggregatedFaculty>(`/ai-agent/faculty/${collegeId}`)
  return res.data
}

export async function getCollegeSnapshot(collegeId: string): Promise<CollegeSnapshot> {
  const res = await apiClient.get<CollegeSnapshot>(`/ai-agent/snapshot/${collegeId}`)
  return res.data
}

export async function generateInsights(collegeId: string): Promise<AIInsight[]> {
  const res = await apiClient.get<AIInsight[]>(`/ai-agent/insights/${collegeId}`)
  return res.data
}

export async function processAIQuery(query: string, collegeId: string): Promise<AIQueryResult> {
  const res = await apiClient.post<AIQueryResult>(`/ai-agent/query`, { query, collegeId })
  return res.data
}
