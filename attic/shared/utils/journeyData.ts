// src/shared/utils/journeyData.ts
// Data computation utilities for Journey page

// ─── Self-contained types (no external import) ───────────

interface Student {
  id: string
  name: string
  regNo: string
  course: string
  batch: string
  branch?: string
}

interface AttendanceRecord {
  studentId: string
  date: string
  status: 'present' | 'absent'
}

interface Assessment {
  id: string
  course: string
  batch: string
  subject: string
  date: string
}

interface AssessmentScore {
  studentId: string
  assessmentId: string
  percentage: number
}

// TODO: Fetch from Firebase
interface FacultyStudent {
  id: string
  name: string
  rollNo: string
  batch: string
  attendancePercentage: number
  status: 'good' | 'average' | 'weak'
  avgScore: number
}

interface FacultyTopic {
  id: string
  name: string
  status: 'covered' | 'pending'
}

interface ClassSession {
  id: string
  date: string
  topic: string
  attended: number
  total: number
}

interface FacultyStats {
  totalStudents: number
  weakStudentsCount: number
  avgAttendance: number
  topicsCovered: number
  topicsPending: number
  papersUploaded: number
  papersPendingApproval: number
  classesThisWeek: number
}

const facultyStudents: FacultyStudent[] = []
const facultyTopics: FacultyTopic[] = []
const classSessions: ClassSession[] = []
const facultyStats: FacultyStats = {
  totalStudents: 0, weakStudentsCount: 0, avgAttendance: 0,
  topicsCovered: 0, topicsPending: 0, papersUploaded: 0,
  papersPendingApproval: 0, classesThisWeek: 0
}

import type { 
  StudentJourneyData, FacultyJourneyData, CollegeJourneyData, Milestone, Suggestion 
} from '../types/journey'

// ============================================
// FACULTY PROFILE
// ============================================
const facultyProfile = {
  id: 'fac-001',
  name: 'Rajesh Kumar',
  title: 'Dr.',
  department: 'Computer Science',
}

// ============================================
// COLLEGE DATA COMPUTATION
// ============================================

export function computeCollegeData(
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  assessments: Assessment[],
  scores: AssessmentScore[],
  activeAssessments: number,
  passRate: number,
  attendanceRate: number,
  topPerformers: { name: string; regNo: string; course: string; avg: number; rank: number }[],
  performanceTrend: { month: string; avg: number }[],
  weeklyAttendance: { day: string; present: number; absent: number; total: number }[]
): CollegeJourneyData {
  const totalPrograms = new Set(students.map(s => s.course)).size
  const batches = new Set(students.map(s => s.batch)).size
  const avgGPA = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b.percentage, 0) / scores.length) / 10 * 100) / 100
    : 0

  return {
    totalStudents: students.length,
    totalFaculty: 1,
    totalPrograms,
    batchesCompleted: batches,
    placementRate: 78,
    avgGPA,
    yearOverYearGrowth: 15,
    accreditation: 'NAAC A Grade',
    activeAssessments,
    passRate,
    attendanceRate,
    topPerformers,
    performanceTrend,
    weeklyAttendance,
  }
}

export function getCollegeMilestones(): Milestone[] {
  return [
    { id: 1, title: 'Institution Established', date: '2010-06-15', status: 'completed', description: 'College founded with 3 programs', metric: '3 UG Programs' },
    { id: 2, title: 'First Graduating Batch', date: '2014-05-20', status: 'completed', description: 'First batch of 120 students graduated', metric: '120 Graduates' },
    { id: 3, title: 'NAAC Accreditation', date: '2016-11-10', status: 'completed', description: 'Achieved NAAC B++ grade', metric: 'B++ Grade' },
    { id: 4, title: 'Program Expansion', date: '2018-07-01', status: 'completed', description: 'Added BCom, BA, and BSc programs', metric: '6 Programs' },
    { id: 5, title: '500+ Students Milestone', date: '2020-08-15', status: 'completed', description: 'Crossed 500 enrolled students', metric: '500+ Students' },
    { id: 6, title: 'NAAC A Grade', date: '2022-03-20', status: 'completed', description: 'Upgraded to NAAC A Grade', metric: 'A Grade' },
    { id: 7, title: 'Digital Transformation', date: '2024-01-10', status: 'completed', description: 'Launched Vriddhi platform for academic management', metric: '100% Digital' },
    { id: 8, title: 'Current Growth Phase', date: '2025-01-05', status: 'active', description: 'Expanding to 1000+ students with new programs', metric: 'Growing' },
    { id: 9, title: 'Autonomous Status', date: '2026-06-01', status: 'upcoming', description: 'Application for autonomous college status', metric: 'In Progress' },
    { id: 10, title: 'University Status', date: '2028-03-15', status: 'upcoming', description: 'Vision to become a deemed university', metric: 'Vision 2028' },
  ]
}

// ============================================
// FACULTY DATA COMPUTATION
// ============================================

export function computeFacultyData(): FacultyJourneyData {
  const goodCount = facultyStudents.filter((s: FacultyStudent) => s.status === 'good').length
  const avgCount = facultyStudents.filter((s: FacultyStudent) => s.status === 'average').length
  const weakCount = facultyStudents.filter((s: FacultyStudent) => s.status === 'weak').length

  const avgScore = facultyStudents.length > 0
    ? Math.round(facultyStudents.reduce((a: number, b: FacultyStudent) => a + b.avgScore, 0) / facultyStudents.length * 10) / 10
    : 0

  return {
    faculty: {
      id: facultyProfile.id,
      name: facultyProfile.name,
      title: facultyProfile.title,
      department: facultyProfile.department,
    },
    yearsOfService: 7,
    totalStudents: facultyStats.totalStudents,
    avgAttendance: facultyStats.avgAttendance,
    weakStudentsCount: weakCount,
    goodStudentsCount: goodCount,
    topicsCovered: facultyStats.topicsCovered,
    topicsPending: facultyStats.topicsPending,
    papersUploaded: facultyStats.papersUploaded,
    avgStudentScore: avgScore,
    studentPerformanceDistribution: { good: goodCount, average: avgCount, weak: weakCount },
  }
}

export function getFacultyMilestones(): Milestone[] {
  return [
    { id: 1, title: 'Joined Institution', date: '2018-06-01', status: 'completed', description: `Started as Assistant Professor in ${facultyProfile.department}`, metric: 'Assistant Prof.' },
    { id: 2, title: 'First Paper Published', date: '2019-03-15', status: 'completed', description: 'Published research in International Journal', metric: '1 Publication' },
    { id: 3, title: 'Completed 100 Lectures', date: '2019-12-20', status: 'completed', description: 'Delivered 100+ lectures in first academic year', metric: '100 Lectures' },
    { id: 4, title: 'Promoted to Associate', date: '2021-07-01', status: 'completed', description: 'Promoted to Associate Professor', metric: 'Associate Prof.' },
    { id: 5, title: '5 Papers Published', date: '2022-05-10', status: 'completed', description: 'Published 5 research papers in reputed journals', metric: '5 Publications' },
    { id: 6, title: 'Best Faculty Award', date: '2023-04-15', status: 'completed', description: 'Awarded Best Faculty for student performance', metric: 'Best Faculty' },
    { id: 7, title: 'Mentored 50+ Students', date: '2024-01-20', status: 'completed', description: 'Successfully mentored 50+ students to graduation', metric: '50 Students' },
    { id: 8, title: 'Department Head', date: '2025-01-05', status: 'active', description: `Currently serving as Head of ${facultyProfile.department} Department`, metric: 'HOD' },
    { id: 9, title: 'PhD Completion', date: '2025-12-01', status: 'upcoming', description: 'Doctoral thesis submission expected', metric: 'PhD' },
    { id: 10, title: 'Professor & Research Lead', date: '2027-06-01', status: 'upcoming', description: 'Vision to become Professor and lead research center', metric: 'Professor' },
  ]
}

// ============================================
// STUDENT DATA COMPUTATION
// ============================================

export function computeStudentData(
  studentId: string,
  students: Student[],
  attendanceRecords: AttendanceRecord[],
  assessments: Assessment[],
  scores: AssessmentScore[]
): StudentJourneyData | null {
  const student = students.find(s => s.id === studentId)
  if (!student) return null

  const studentAttendance = attendanceRecords.filter(r => r.studentId === studentId)
  const totalClasses = studentAttendance.length
  const presentClasses = studentAttendance.filter(r => r.status === 'present').length
  const attendance = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 1000) / 10 : 0

  const studentScores = scores.filter(s => s.studentId === studentId)
  const avgScore = studentScores.length > 0
    ? Math.round(studentScores.reduce((a, b) => a + b.percentage, 0) / studentScores.length * 10) / 10
    : 0

  const currentGPA = avgScore > 0 ? Math.round((avgScore / 10) * 10) / 10 : 0
  const cgpa = currentGPA

  const allAvgs = students.map(s => {
    const sScores = scores.filter(sc => sc.studentId === s.id)
    return {
      id: s.id,
      avg: sScores.length > 0
        ? sScores.reduce((a, b) => a + b.percentage, 0) / sScores.length
        : 0
    }
  }).sort((a, b) => b.avg - a.avg)

  const rank = allAvgs.findIndex(s => s.id === studentId) + 1
  const totalStudents = students.length

  const studentAssessments = assessments.filter(a => a.course === student.course && a.batch === student.batch)
  const assessmentsTaken = studentScores.length
  const totalAssessments = studentAssessments.length

  const subjectScores: Record<string, number[]> = {}
  studentScores.forEach(sc => {
    const assessment = assessments.find(a => a.id === sc.assessmentId)
    if (assessment) {
      if (!subjectScores[assessment.subject]) subjectScores[assessment.subject] = []
      subjectScores[assessment.subject].push(sc.percentage)
    }
  })

  const subjectAvgs = Object.entries(subjectScores).map(([subject, scores]) => ({
    subject,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length
  }))

  const weakSubjects = subjectAvgs.filter(s => s.avg < 60).map(s => s.subject)
  const strongSubjects = subjectAvgs.filter(s => s.avg >= 80).map(s => s.subject)

  const attendanceTrend = studentAttendance
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => r.status === 'present' ? 1 : 0)

  const scoreTrend = studentScores
    .sort((a, b) => {
      const aDate = assessments.find(as => as.id === a.assessmentId)?.date || ''
      const bDate = assessments.find(as => as.id === b.assessmentId)?.date || ''
      return new Date(aDate).getTime() - new Date(bDate).getTime()
    })
    .map(s => s.percentage)

  return {
    student: {
      id: student.id,
      name: student.name,
      regNo: student.regNo,
      course: student.course,
      batch: student.batch,
      branch: student.branch || '',
    },
    currentGPA,
    cgpa,
    attendance,
    avgScore,
    rank,
    totalStudents,
    creditsCompleted: assessmentsTaken * 8,
    totalCredits: totalAssessments * 8,
    assessmentsTaken,
    totalAssessments,
    weakSubjects,
    strongSubjects,
    attendanceTrend,
    scoreTrend,
  }
}

export function getStudentMilestones(data: StudentJourneyData): Milestone[] {
  const milestones: Milestone[] = [
    { id: 1, title: 'Admission', date: '2024-06-15', status: 'completed', description: `Joined college, ${data.student.course} Batch ${data.student.batch}`, metric: `${data.student.course}` },
    { id: 2, title: 'Orientation', date: '2024-06-20', status: 'completed', description: 'College orientation and campus tour completed', metric: 'Done' },
  ]

  if (data.assessmentsTaken >= 1) {
    milestones.push({
      id: 3, title: 'First Assessment', date: '2024-09-15', status: 'completed',
      description: `First assessment completed - scored ${data.scoreTrend[0]?.toFixed(1) || 'N/A'}%`,
      metric: `${data.scoreTrend[0]?.toFixed(1) || 'N/A'}%`
    })
  }

  if (data.assessmentsTaken >= 2) {
    milestones.push({
      id: 4, title: 'Progress Check', date: '2024-10-20', status: 'completed',
      description: `Multiple assessments completed - average ${data.avgScore}%`,
      metric: `${data.avgScore}%`
    })
  }

  if (data.assessmentsTaken >= 3) {
    milestones.push({
      id: 5, title: 'Consistent Performance', date: '2024-11-10', status: 'completed',
      description: `Maintained performance across ${data.assessmentsTaken} assessments`,
      metric: `${data.assessmentsTaken} Tests`
    })
  }

  milestones.push({
    id: 6, title: 'Current Semester', date: '2025-01-05', status: 'active',
    description: `Currently ongoing - ${data.student.course} Batch ${data.student.batch}`,
    metric: 'In Progress'
  })

  if (data.totalAssessments > data.assessmentsTaken) {
    milestones.push({
      id: 7, title: 'Upcoming Assessments', date: '2025-03-01', status: 'upcoming',
      description: `${data.totalAssessments - data.assessmentsTaken} assessments remaining`,
      metric: `${data.totalAssessments - data.assessmentsTaken} Pending`
    })
  }

  milestones.push({
    id: 8, title: 'Graduation', date: '2027-05-15', status: 'upcoming',
    description: `Projected graduation with ${data.currentGPA >= 8 ? 'First Class' : data.currentGPA >= 6 ? 'Second Class' : 'Pass Class'}`,
    metric: data.currentGPA >= 8 ? 'First Class' : data.currentGPA >= 6 ? 'Second Class' : 'Pass Class'
  })

  return milestones
}

export function generateStudentSuggestions(data: StudentJourneyData): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Strengths
  if (data.avgScore >= 80) {
    suggestions.push({
      type: 'strength',
      title: 'Excellent Academic Performance',
      description: `Your average score of ${data.avgScore}% places you in the top tier. Keep up the great work!`,
      action: 'Maintain consistent study schedule',
    })
  } else if (data.avgScore >= 60) {
    suggestions.push({
      type: 'strength',
      title: 'Solid Academic Foundation',
      description: `Your average score of ${data.avgScore}% shows a good understanding of the material.`,
      action: 'Focus on weak subjects to push above 80%',
    })
  }

  if (data.attendance >= 90) {
    suggestions.push({
      type: 'strength',
      title: 'Outstanding Attendance',
      description: `Your ${data.attendance}% attendance shows excellent commitment and discipline.`,
      action: 'Maintain 95%+ attendance for perfect record',
    })
  }

  if (data.rank <= 3 && data.totalStudents > 5) {
    suggestions.push({
      type: 'strength',
      title: 'Top Rank Performer',
      description: `You are ranked #${data.rank} out of ${data.totalStudents} students. Exceptional achievement!`,
      action: 'Mentor peers and lead study groups',
    })
  }

  if (data.strongSubjects.length > 0) {
    suggestions.push({
      type: 'strength',
      title: 'Subject Excellence',
      description: `Strong performance in: ${data.strongSubjects.join(', ')}`,
      action: 'Consider peer tutoring in these subjects',
    })
  }

  // Warnings
  if (data.attendance < 75) {
    suggestions.push({
      type: 'warning',
      title: 'Attendance Below Threshold',
      description: `Your attendance is ${data.attendance}%, below the 75% minimum. Risk of debarment from exams.`,
      action: 'Attend all remaining classes immediately',
    })
  } else if (data.attendance < 85) {
    suggestions.push({
      type: 'warning',
      title: 'Attendance Needs Improvement',
      description: `Your attendance is ${data.attendance}%. Falling below 75% will affect eligibility.`,
      action: 'Avoid missing more than 2 classes per month',
    })
  }

  if (data.avgScore < 50) {
    suggestions.push({
      type: 'warning',
      title: 'Critical Academic Performance',
      description: `Your average score of ${data.avgScore}% is critically low. Immediate intervention needed.`,
      action: 'Meet mentor and join remedial classes today',
    })
  } else if (data.avgScore < 60) {
    suggestions.push({
      type: 'warning',
      title: 'Below Average Performance',
      description: `Your average score of ${data.avgScore}% needs improvement to pass comfortably.`,
      action: 'Review past assessments and seek help',
    })
  }

  if (data.weakSubjects.length > 0) {
    suggestions.push({
      type: 'warning',
      title: 'Weak Subject Areas',
      description: `Needs attention in: ${data.weakSubjects.join(', ')}`,
      action: 'Schedule extra study sessions for these subjects',
    })
  }

  // Opportunities
  if (data.rank > 3 && data.avgScore >= 70) {
    suggestions.push({
      type: 'opportunity',
      title: 'Rank Improvement Possible',
      description: `You are ${data.rank - 1} positions from the top. Focus on next assessments to climb up.`,
      action: 'Aim for 90%+ in upcoming tests',
    })
  }

  if (data.currentGPA >= 7 && data.currentGPA < 8.5) {
    suggestions.push({
      type: 'opportunity',
      title: 'Honors Eligibility Within Reach',
      description: `Current GPA ${data.currentGPA} - push to 8.5+ for First Class with Distinction.`,
      action: 'Target 85%+ in all remaining assessments',
    })
  }

  if (data.avgScore >= 85 && data.attendance >= 90) {
    suggestions.push({
      type: 'opportunity',
      title: 'Internship Ready',
      description: 'Your performance profile makes you eligible for premium internships.',
      action: 'Start applying for summer internships',
    })
  }

  if (data.assessmentsTaken < data.totalAssessments) {
    suggestions.push({
      type: 'opportunity',
      title: 'Assessment Recovery Window',
      description: `${data.totalAssessments - data.assessmentsTaken} assessments remaining to improve your standing.`,
      action: 'Prepare thoroughly for upcoming tests',
    })
  }

  return suggestions
}

export function generateStudentPredictions(data: StudentJourneyData): { label: string; value: string; trend: 'up' | 'down' | 'stable'; confidence: number }[] {
  const trend = data.scoreTrend.length >= 2
    ? (data.scoreTrend[data.scoreTrend.length - 1] > data.scoreTrend[0] ? 'up' : 
       data.scoreTrend[data.scoreTrend.length - 1] < data.scoreTrend[0] ? 'down' : 'stable')
    : 'stable'

  const projectedGPA = data.currentGPA + (trend === 'up' ? 0.5 : trend === 'down' ? -0.3 : 0)
  const projectedRank = trend === 'up' ? Math.max(1, data.rank - 1) : trend === 'down' ? data.rank + 1 : data.rank

  const placementProb = data.avgScore >= 80 ? 90 : data.avgScore >= 70 ? 75 : data.avgScore >= 60 ? 50 : 30
  const honors = projectedGPA >= 8.5 ? 'First Class with Distinction' : projectedGPA >= 7.5 ? 'First Class' : projectedGPA >= 6 ? 'Second Class' : 'Pass Class'

  return [
    { label: 'Projected Final GPA', value: `${projectedGPA.toFixed(1)} / 10`, trend, confidence: 75 },
    { label: 'Projected Rank', value: `#${projectedRank} of ${data.totalStudents}`, trend, confidence: 65 },
    { label: 'Placement Probability', value: `${placementProb}% (${placementProb >= 80 ? 'Top Tier' : placementProb >= 60 ? 'Good' : 'Needs Work'})`, trend: placementProb >= 60 ? 'up' : 'down', confidence: 70 },
    { label: 'Honors Prediction', value: honors, trend: projectedGPA >= 7.5 ? 'up' : 'down', confidence: 80 },
  ]
}

export function getStudentAchievements(data: StudentJourneyData): { title: string; date: string; description: string }[] {
  const achievements: { title: string; date: string; description: string }[] = []

  if (data.rank <= 3) {
    achievements.push({
      title: 'Top Performer',
      date: '2024-12',
      description: `Ranked #${data.rank} in class of ${data.totalStudents} students`,
    })
  }

  if (data.attendance >= 95) {
    achievements.push({
      title: 'Perfect Attendance',
      date: '2024-11',
      description: 'Maintained 95%+ attendance consistently',
    })
  }

  if (data.avgScore >= 90) {
    achievements.push({
      title: 'Academic Excellence',
      date: '2024-10',
      description: `Achieved ${data.avgScore}% average across all assessments`,
    })
  }

  if (data.strongSubjects.length >= 2) {
    achievements.push({
      title: 'Multi-Subject Mastery',
      date: '2024-12',
      description: `Excellence in ${data.strongSubjects.length} subjects`,
    })
  }

  if (achievements.length === 0) {
    achievements.push({
      title: 'Active Learner',
      date: '2024-06',
      description: 'Consistently participating in academic activities',
    })
  }

  return achievements
}
