// src/types/journey.ts
// Types for the Journey page

export type MilestoneStatus = 'completed' | 'active' | 'upcoming' | 'warning'

export interface Milestone {
  id: number
  title: string
  date: string
  status: MilestoneStatus
  description: string
  metric?: string
}

export interface Achievement {
  title: string
  date: string
  description: string
  icon?: string
}

export interface Prediction {
  label: string
  value: string
  trend: 'up' | 'down' | 'stable'
  confidence: number
}

export interface Suggestion {
  type: 'strength' | 'warning' | 'opportunity'
  title: string
  description: string
  action?: string
}

export interface StudentJourneyData {
  student: {
    id: string
    name: string
    regNo: string
    course: string
    batch: string
    branch: string
  }
  currentGPA: number
  cgpa: number
  attendance: number
  avgScore: number
  rank: number
  totalStudents: number
  creditsCompleted: number
  totalCredits: number
  assessmentsTaken: number
  totalAssessments: number
  weakSubjects: string[]
  strongSubjects: string[]
  attendanceTrend: number[]
  scoreTrend: number[]
}

export interface FacultyJourneyData {
  faculty: {
    id: string
    name: string
    title: string
    department: string
  }
  yearsOfService: number
  totalStudents: number
  avgAttendance: number
  weakStudentsCount: number
  goodStudentsCount: number
  topicsCovered: number
  topicsPending: number
  classesThisWeek?: number
  papersUploaded: number
  avgStudentScore: number
  studentPerformanceDistribution: { good: number; average: number; weak: number }
}

export interface CollegeJourneyData {
  totalStudents: number
  totalFaculty: number
  totalPrograms: number
  batchesCompleted: number
  placementRate: number
  avgGPA: number
  yearOverYearGrowth: number
  accreditation: string
  activeAssessments: number
  passRate: number
  attendanceRate: number
  topPerformers: { name: string; regNo: string; course: string; avg: number; rank: number }[]
  performanceTrend: { month: string; avg: number }[]
  weeklyAttendance: { day: string; present: number; absent: number; total: number }[]
}