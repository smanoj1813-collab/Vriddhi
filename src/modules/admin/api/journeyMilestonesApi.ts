// Journey Milestones API - Auto-generates milestones from real college data
// Connects College, Faculty, Student journeys into one unified timeline

import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore'
import { db } from '@/Firebase/config'
import type { Milestone } from './journeyApi'

function getCollegeId(): string {
  const id = localStorage.getItem('vriddhi_college_id')
  if (!id) throw new Error('No college ID')
  return id
}

function toDateString(ts: any): string {
  if (!ts) return new Date().toISOString().slice(0, 10)
  if (typeof ts === 'string') return ts.slice(0, 10)
  if (ts.toDate) return ts.toDate().toISOString().slice(0, 10)
  if (ts instanceof Date) return ts.toISOString().slice(0, 10)
  return new Date().toISOString().slice(0, 10)
}

function toISO(ts: any): string {
  if (!ts) return new Date().toISOString()
  if (typeof ts === 'string') return ts
  if (ts.toDate) return ts.toDate().toISOString()
  return new Date().toISOString()
}

// Auto-generate college milestones from real data
export async function fetchCollegeMilestonesFromRealData(): Promise<Milestone[]> {
  const collegeId = getCollegeId()
  const milestones: Milestone[] = []

  try {
    // 1. Exam Sessions -> Milestones
    const examSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'examSessions'), orderBy('createdAt', 'desc'), limit(20)))
    examSnap.docs.forEach(d => {
      const data = d.data()
      const title = data.title || 'Exam Session'
      const status = data.status || 'draft'
      let milestoneStatus: Milestone['status'] = 'upcoming'
      if (status === 'completed' || status === 'results_published') milestoneStatus = 'completed'
      else if (status === 'ongoing' || status === 'hall_tickets_generated' || status === 'scheduled') milestoneStatus = 'active'
      else if (status === 'draft') milestoneStatus = 'upcoming'

      milestones.push({
        id: `exam_${d.id}`,
        title: `Exam: ${title}`,
        date: toDateString(data.examStartDate || data.createdAt),
        status: milestoneStatus,
        description: `${data.course || ''} Sem ${data.semester || ''} • ${data.examType || 'regular'} • ${data.scheme || 'SEP 2024'} • ${data.hallTicketsGenerated || 0} hall tickets`,
        metric: `${data.totalStudents || 0} students • ${data.totalSubjects || 0} subjects`,
      })
    })

    // 2. University Notifications -> Milestones (Uniclare-style alerts)
    const notifSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'universityNotifications'), orderBy('createdAt', 'desc'), limit(20)))
    notifSnap.docs.forEach(d => {
      const data = d.data()
      const type = data.type || 'general'
      let status: Milestone['status'] = 'completed'
      if (type === 'fee_last_date_alert') status = 'warning'

      milestones.push({
        id: `notif_${d.id}`,
        title: data.title || `University Alert: ${type}`,
        date: toDateString(data.createdAt),
        status,
        description: data.message?.slice(0, 100) || `${type} notification`,
        metric: `${data.priority || 'medium'} • ${type}`,
      })
    })

    // 3. Fee Payments -> Milestones (Collection milestones)
    const feeSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'feePayments'), orderBy('createdAt', 'desc'), limit(10)))
    if (feeSnap.docs.length > 0) {
      const totalDue = feeSnap.docs.reduce((sum, doc) => sum + (Number(doc.data().amount) || 0), 0)
      const totalPaid = feeSnap.docs.reduce((sum, doc) => sum + (Number(doc.data().paidAmount) || 0), 0)
      const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

      milestones.push({
        id: 'fee_collection',
        title: 'Fee Collection Drive',
        date: toDateString(new Date()),
        status: collectionRate >= 80 ? 'completed' : collectionRate >= 50 ? 'active' : 'warning',
        description: `₹${totalPaid.toLocaleString('en-IN')} collected of ₹${totalDue.toLocaleString('en-IN')} • ${collectionRate}% collection rate`,
        metric: `${feeSnap.size} invoices • ${collectionRate}% collected`,
      })
    }

    // 4. Challans -> Milestones
    const challanSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'challans'), orderBy('createdAt', 'desc'), limit(10)))
    if (challanSnap.docs.length > 0) {
      const verified = challanSnap.docs.filter(d => d.data().status === 'verified').length
      const pending = challanSnap.docs.length - verified

      milestones.push({
        id: 'challan_drive',
        title: 'University Exam Fee Challan Drive',
        date: toDateString(new Date()),
        status: pending === 0 ? 'completed' : 'active',
        description: `${verified} challans verified, ${pending} pending verification • BCU/BNU bank payment flow`,
        metric: `${challanSnap.size} challans • ${verified} verified`,
      })
    }

    // 5. Grade Records / Results -> Milestones
    const gradeSnap = await getDocs(query(collection(db, 'gradeRecords'), where('collegeId', '==', collegeId), limit(10)))
    if (gradeSnap.docs.length > 0) {
      milestones.push({
        id: 'results_published',
        title: 'University Results Published',
        date: toDateString(new Date()),
        status: 'completed',
        description: `${gradeSnap.size} grade records published • SGPA/CGPA calculated per BCU`,
        metric: `${gradeSnap.size} records`,
      })
    }

    // 6. Attendance -> Milestones
    const attendanceSnap = await getDocs(query(collection(db, 'attendanceRecords'), where('collegeId', '==', collegeId), limit(1)))
    if (attendanceSnap.docs.length > 0) {
      milestones.push({
        id: 'attendance_tracking',
        title: 'Attendance Tracking Active',
        date: toDateString(new Date()),
        status: 'active',
        description: 'Daily attendance marking • 75% eligibility check per BCU • IA marks per slab',
        metric: 'Live tracking',
      })
    }

    // 7. UUCMS Sync -> Milestone
    const studentSnap = await getDocs(query(collection(db, 'students'), where('collegeId', '==', collegeId), limit(100)))
    const withUUCMS = studentSnap.docs.filter(d => d.data().uucmsCandidateId || d.data().candidateId).length
    const totalStudents = studentSnap.size
    const syncRate = totalStudents > 0 ? Math.round((withUUCMS / totalStudents) * 100) : 0

    if (totalStudents > 0) {
      milestones.push({
        id: 'uucms_sync',
        title: 'UUCMS Integration',
        date: toDateString(new Date()),
        status: syncRate >= 80 ? 'completed' : syncRate >= 50 ? 'active' : 'upcoming',
        description: `${withUUCMS} of ${totalStudents} students linked with UUCMS Candidate ID • ${syncRate}% sync`,
        metric: `${syncRate}% UUCMS sync • ${withUUCMS}/${totalStudents}`,
      })
    }

    // Sort by date desc
    milestones.sort((a, b) => b.date.localeCompare(a.date))

    // If no real data, provide starter milestones
    if (milestones.length === 0) {
      return [
        {
          id: 'setup_1',
          title: 'College Onboarding',
          date: new Date().toISOString().slice(0, 10),
          status: 'completed',
          description: 'College profile created • Courses, batches configured',
          metric: 'Setup complete',
        },
        {
          id: 'setup_2',
          title: 'UUCMS Integration Setup',
          date: new Date().toISOString().slice(0, 10),
          status: 'upcoming',
          description: 'Import UUCMS export CSV to link Candidate IDs',
          metric: 'Next step',
        },
        {
          id: 'setup_3',
          title: 'Create First Exam Session',
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'upcoming',
          description: 'Create exam session BCA 3rd Sem Regular SEP 2024 • Add subjects with Kannada medium',
          metric: 'University Exams → Exam Management',
        },
        {
          id: 'setup_4',
          title: 'Generate Hall Tickets',
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'upcoming',
          description: 'Generate hall tickets with 75% attendance check • QR code • Room allotment',
          metric: '75% eligibility per BCU',
        },
      ]
    }

    return milestones.slice(0, 20)
  } catch (e) {
    console.error('[journeyMilestonesApi] Failed:', e)
    // Return empty to let UI show starter
    return []
  }
}

// Faculty journey timeline from real data
export async function fetchFacultyTimelineFromRealData(facultyEmail: string, facultyName: string): Promise<Milestone[]> {
  const collegeId = getCollegeId()
  const milestones: Milestone[] = []

  try {
    // Assessments created by faculty
    const assessmentSnap = await getDocs(query(collection(db, 'assessments'), where('collegeId', '==', collegeId), limit(20)))
    const facultyAssessments = assessmentSnap.docs.filter(d => {
      const data = d.data()
      return data.createdBy === facultyEmail || data.facultyName === facultyName || data.createdByName === facultyName
    })

    facultyAssessments.forEach(d => {
      const data = d.data()
      milestones.push({
        id: `faculty_assessment_${d.id}`,
        title: `Created Assessment: ${data.title || 'Untitled'}`,
        date: toDateString(data.createdAt),
        status: data.status === 'published' || data.status === 'active' ? 'completed' : 'upcoming',
        description: `${data.courseName || data.subject || ''} • ${data.totalMarks || 0} marks • ${data.totalQuestions || 0} questions`,
        metric: `${data.status || 'draft'}`,
      })
    })

    // Papers generated
    const papersSnap = await getDocs(query(collection(db, 'papers'), where('collegeId', '==', collegeId), limit(10)))
    const facultyPapers = papersSnap.docs.filter(d => {
      const data = d.data()
      return data.createdBy === facultyEmail || data.createdByName === facultyName
    })

    facultyPapers.forEach(d => {
      const data = d.data()
      milestones.push({
        id: `faculty_paper_${d.id}`,
        title: `Generated Paper: ${data.title || 'Paper'}`,
        date: toDateString(data.createdAt),
        status: 'completed',
        description: `${data.subjectId || ''} • ${data.totalMarks || 0} marks • ${data.totalQuestions || 0} questions`,
        metric: 'Paper generator',
      })
    })

    // If no data, starter
    if (milestones.length === 0) {
      return [
        {
          id: 'faculty_start_1',
          title: 'Faculty Onboarding',
          date: new Date().toISOString().slice(0, 10),
          status: 'completed',
          description: `${facultyName} • ${facultyEmail} • Teaching assignment`,
          metric: 'Active faculty',
        },
        {
          id: 'faculty_start_2',
          title: 'Create First Assessment',
          date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'upcoming',
          description: 'Use AI Question Generator → Paper Generator → Schedule Test',
          metric: 'Next: 5M/10M questions',
        },
        {
          id: 'faculty_start_3',
          title: 'Auto-Grading 5M/10M',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          status: 'upcoming',
          description: 'Grade descriptive answers with rubric + one-click presets • Save 70% time',
          metric: 'Faculty → Auto-Grading',
        },
      ]
    }

    milestones.sort((a, b) => b.date.localeCompare(a.date))
    return milestones.slice(0, 15)
  } catch (e) {
    console.error('[journeyMilestonesApi] Faculty timeline failed:', e)
    return []
  }
}

// Student journey timeline from real data (beyond getMyAcademicJourney)
export async function fetchStudentTimelineFromRealData(studentId: string): Promise<Milestone[]> {
  const collegeId = getCollegeId()
  const milestones: Milestone[] = []

  try {
    // Fee payments
    const feeSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'feePayments'), where('studentId', '==', studentId), limit(10)))
    feeSnap.docs.forEach(d => {
      const data = d.data()
      const status = data.status || 'pending'
      let milestoneStatus: Milestone['status'] = 'upcoming'
      if (status === 'paid') milestoneStatus = 'completed'
      else if (status === 'partial') milestoneStatus = 'active'
      else if (status === 'overdue') milestoneStatus = 'warning'

      milestones.push({
        id: `student_fee_${d.id}`,
        title: `Fee: ${data.category || 'Fee'} - ${status}`,
        date: toDateString(data.dueDate || data.createdAt),
        status: milestoneStatus,
        description: `₹${Number(data.amount || 0).toLocaleString('en-IN')} • ${data.remarks || ''} • Receipt ${data.receiptNo || 'pending'}`,
        metric: `₹${Number(data.paidAmount || 0).toLocaleString('en-IN')} paid`,
      })
    })

    // Challans
    const challanSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'challans'), where('studentId', '==', studentId), limit(10)))
    challanSnap.docs.forEach(d => {
      const data = d.data()
      const status = data.status || 'generated'
      let milestoneStatus: Milestone['status'] = 'upcoming'
      if (status === 'verified') milestoneStatus = 'completed'
      else if (status === 'paid_at_bank') milestoneStatus = 'active'
      else if (status === 'generated') milestoneStatus = 'warning'

      milestones.push({
        id: `student_challan_${d.id}`,
        title: `Challan: ${data.examTitle || data.type} - ${status}`,
        date: toDateString(data.dueDate || data.createdAt),
        status: milestoneStatus,
        description: `${data.challanNo || ''} • ₹${Number(data.amount || 0).toLocaleString('en-IN')} • ${data.university || 'BCU'} • Bank Ref ${data.bankReferenceNo || 'pending'}`,
        metric: `${data.type || 'university_exam'} • ${status}`,
      })
    })

    // Hall tickets
    const examSessionsSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'examSessions'), limit(10)))
    for (const sessionDoc of examSessionsSnap.docs) {
      const htSnap = await getDocs(query(collection(db, 'colleges', collegeId, 'examSessions', sessionDoc.id, 'hallTickets'), where('studentId', '==', studentId), limit(5)))
      htSnap.docs.forEach(d => {
        const data = d.data()
        const status = data.status || 'generated'
        let milestoneStatus: Milestone['status'] = 'upcoming'
        if (status === 'downloaded') milestoneStatus = 'completed'
        else if (status === 'generated') milestoneStatus = 'active'
        else if (status === 'blocked') milestoneStatus = 'warning'

        milestones.push({
          id: `student_ht_${d.id}`,
          title: `Hall Ticket: ${data.examTitle || 'Exam'} - ${status}`,
          date: toDateString(data.examDate || data.generatedAt),
          status: milestoneStatus,
          description: `${data.hallTicketNo || ''} • ${data.examCenter || ''} • Room ${data.roomNo || ''} Seat ${data.seatNo || ''} • Eligibility ${data.attendanceEligibility?.overallPercentage?.toFixed(1) || ''}%`,
          metric: `${status} • ${data.course || ''} Sem ${data.semester || ''}`,
        })
      })
    }

    // Grade records
    const gradeSnap = await getDocs(query(collection(db, 'gradeRecords'), where('collegeId', '==', collegeId), where('studentId', '==', studentId), limit(10)))
    gradeSnap.docs.forEach(d => {
      const data = d.data()
      milestones.push({
        id: `student_grade_${d.id}`,
        title: `Result: ${data.subject || data.code || 'Subject'} - Grade ${data.grade || ''}`,
        date: toDateString(data.createdAt),
        status: data.grade === 'F' ? 'warning' : 'completed',
        description: `${data.code || ''} • ${data.subject || ''} • ${data.totalMarks || 0}/${data.maxMarks || 100} • GP ${data.gradePoint || 0} • ${data.credits || 0} credits`,
        metric: `SGPA ${data.sgpa || ''} • ${data.grade || ''}`,
      })
    })

    // Assessments
    const assessmentSnap = await getDocs(query(collection(db, 'studentAssessments'), where('studentId', '==', studentId), limit(10)))
    assessmentSnap.docs.forEach(d => {
      const data = d.data()
      const status = data.status || 'submitted'
      let milestoneStatus: Milestone['status'] = 'upcoming'
      if (status === 'graded') milestoneStatus = 'completed'
      else if (status === 'submitted') milestoneStatus = 'active'

      milestones.push({
        id: `student_assessment_${d.id}`,
        title: `Assessment: ${data.title || 'Test'} - ${status}`,
        date: toDateString(data.submittedAt || data.createdAt),
        status: milestoneStatus,
        description: `${data.subject || ''} • ${data.marksObtained || 0}/${data.totalMarks || 0} • ${data.percentage || 0}% • ${data.grade || ''}`,
        metric: `${status} • ${data.percentage || 0}%`,
      })
    })

    milestones.sort((a, b) => b.date.localeCompare(a.date))
    return milestones.slice(0, 20)
  } catch (e) {
    console.error('[journeyMilestonesApi] Student timeline failed:', e)
    return []
  }
}
