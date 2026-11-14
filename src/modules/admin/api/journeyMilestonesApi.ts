// Journey Milestones API - Auto-generates milestones from real college data
// Connects College, Faculty, Student journeys into one unified timeline

import { collection, getDocs, query, orderBy, limit, where, Timestamp, type DocumentData, type Query, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '@/Firebase/data'
import type { Milestone } from './journeyApi'
import type { FacultyTimelineIdentity } from '@/shared/api/facultyProfileApi'
import { normalizeSessionDate } from '@/shared/utils/sessionDate'
import { normalizeMentorReference } from '@/modules/faculty/utils/facultyJourney'

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
/**
 * Fee and challan collections are finance-office data (principal / accounts).
 * Department heads open the same journey pages, so a permission-denied read
 * there must drop that section instead of aborting the whole timeline.
 */
async function getDocsOrEmpty(q: Query<DocumentData>): Promise<{ docs: QueryDocumentSnapshot<DocumentData>[]; size: number }> {
  try {
    const snap = await getDocs(q)
    return { docs: snap.docs, size: snap.size }
  } catch {
    return { docs: [], size: 0 }
  }
}

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
    const feeSnap = await getDocsOrEmpty(query(collection(db, 'colleges', collegeId, 'feePayments'), orderBy('createdAt', 'desc'), limit(10)))
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
    const challanSnap = await getDocsOrEmpty(query(collection(db, 'colleges', collegeId, 'challans'), orderBy('createdAt', 'desc'), limit(10)))
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

// Faculty activity is queried by owner BEFORE the limit, not selected from
// the college's first 20 rows (which hid activity in any moderately busy college).
export async function fetchFacultyTimelineFromRealData(
  identity: FacultyTimelineIdentity,
): Promise<{ milestones: Milestone[]; limited: boolean }> {
  if (!identity.collegeId) throw new Error('A college is required to load faculty activity.')
  const ownerIds = [...new Set([...identity.ids, ...identity.emails].map(value => value.trim()).filter(Boolean))]
  const names = [...new Set(identity.names.map(value => value.trim()).filter(Boolean))]
  const nameKeys = new Set(names.map(normalizeMentorReference))
  const emails = new Set(identity.emails.map(value => value.toLowerCase()))
  const belongsToFaculty = (data: DocumentData): boolean => {
    const owners = [data.createdBy, data.facultyId, data.facultyUid].filter(value => typeof value === 'string' && value.trim()) as string[]
    if (owners.some(owner => identity.ids.includes(owner) || emails.has(owner.trim().toLowerCase()))) return true
    // A matching display name must not override somebody else's explicit id.
    if (owners.length) return false
    return [data.createdByName, data.facultyName].some(value => nameKeys.has(normalizeMentorReference(value)))
  }
  let limited = false
  const readOwned = async (path: string, fields: Array<[string, string[]]>) => {
    const queries = fields.flatMap(([field, values]) => {
      const batches: string[][] = []
      for (let i = 0; i < values.length; i += 10) batches.push(values.slice(i, i + 10))
      return batches.map(batch => getDocs(query(
        collection(db, path),
        where('collegeId', '==', identity.collegeId),
        where(field, 'in', batch),
        limit(51),
      )))
    })
    const snapshots = await Promise.all(queries)
    const rows = new Map<string, QueryDocumentSnapshot<DocumentData>>()
    for (const snap of snapshots) {
      if (snap.size > 50) limited = true
      for (const row of snap.docs.slice(0, 50)) {
        if (row.data().collegeId === identity.collegeId && belongsToFaculty(row.data())) rows.set(row.id, row)
      }
    }
    return [...rows.values()]
  }

  // Fail visibly on a transport/permission error: [] is reserved for a
  // successful read with no activity. The page offers an independent retry.
  const [assessments, papers] = await Promise.all([
    readOwned('assessments', [['createdBy', ownerIds], ['facultyId', identity.ids], ['createdByName', names], ['facultyName', names]]),
    readOwned('papers', [['createdBy', ownerIds], ['createdByName', names]]),
  ])
  const describeActivity = (subject: string, data: DocumentData) => [
    subject,
    typeof data.totalMarks === 'number' && Number.isFinite(data.totalMarks) ? `${data.totalMarks} marks` : '',
    typeof data.totalQuestions === 'number' && Number.isFinite(data.totalQuestions) ? `${data.totalQuestions} questions` : '',
  ].filter(Boolean).join(' • ')
  const milestones: Milestone[] = [
    ...assessments.map(row => {
      const data = row.data()
      return {
        id: `faculty_assessment_${row.id}`,
        title: `Created Assessment: ${data.title || 'Untitled'}`,
        date: normalizeSessionDate(data.createdAt),
        status: 'completed' as const,
        description: describeActivity(data.courseName || data.subject || 'Assessment', data),
        metric: String(data.status || 'draft'),
      }
    }),
    ...papers.map(row => {
      const data = row.data()
      return {
        id: `faculty_paper_${row.id}`,
        title: `Generated Paper: ${data.title || 'Paper'}`,
        date: normalizeSessionDate(data.createdAt),
        status: 'completed' as const,
        description: describeActivity(data.subjectId || data.subject || 'Question paper', data),
        metric: 'Paper generator',
      }
    }),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return { milestones: milestones.slice(0, 15), limited: limited || milestones.length > 15 }
}

// Student journey timeline from real data (beyond getMyAcademicJourney)
export async function fetchStudentTimelineFromRealData(studentId: string): Promise<Milestone[]> {
  const collegeId = getCollegeId()
  const milestones: Milestone[] = []

  try {
    // Fee payments
    const feeSnap = await getDocsOrEmpty(query(collection(db, 'colleges', collegeId, 'feePayments'), where('studentId', '==', studentId), limit(10)))
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
    const challanSnap = await getDocsOrEmpty(query(collection(db, 'colleges', collegeId, 'challans'), where('studentId', '==', studentId), limit(10)))
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
