// functions/src/studentJourney.ts
// ------------------------------------------------------------------
// The student's own academic journey, computed from real records.
//
// WHY THIS IS A CALLABLE
// Standing is a comparison against other students, and a student cannot list
// the college roster — Firestore rules cannot authorise that without leaking
// every classmate's record to every browser. The previous journey page read a
// `colleges/{id}/scores` collection that nothing ever wrote, then reported
// `rank: 1` for every student and a GPA of `(avgScore / 100) * 10` invented
// from assessment percentages. Here the rank is counted across the real
// published grade records of the student's own batch and branch, and the CGPA
// is the real credit-weighted mean of real grade points.
// ------------------------------------------------------------------

import * as admin from 'firebase-admin'
import { createReadThroughCache } from './readThroughCache'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { latestCreditRows, summarizeCredits, auditAssignedProgrammeCredits, type CreditRow } from './academic/creditEngine'
import { resolveCollegeSchemesOnServer } from './schemePacks'

// Only shared rank evidence is coalesced. Personal transcripts/attendance,
// identity checks and policy resolution are always read normally. No paid
// cache documents or additional background scans are introduced.
const standingEvidence = createReadThroughCache<{
  grades: FirebaseFirestore.QuerySnapshot
  roster: FirebaseFirestore.QuerySnapshot
  asOf: string
}>(90_000, 8)

interface JourneyStudent {
  uid: string
  studentId: string
  collegeId: string
  name: string
  regNo: string
  course: string
  branch: string
  batch: string
  division: string
  semester: number
}

async function resolveStudent(uid: string, token: Record<string, unknown>): Promise<JourneyStudent> {
  const db = admin.firestore()
  const [userDoc, students] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('students').where('userId', '==', uid).limit(2).get(),
  ])
  const userData = userDoc.data()
  if (!userDoc.exists || (token.role || userData?.role) !== 'student') {
    throw new HttpsError('permission-denied', 'A linked student account is required')
  }
  if (students.size !== 1) {
    throw new HttpsError(
      'failed-precondition',
      students.empty
        ? 'Your account is not linked to a student profile. Contact your college administrator.'
        : 'Multiple student profiles are linked to this account. Contact your college administrator.'
    )
  }
  const studentDoc = students.docs[0]
  const student = studentDoc.data()
  const collegeId = String(token.collegeId || userData?.collegeId || '')
  if (!collegeId || student.collegeId !== collegeId) {
    throw new HttpsError('failed-precondition', 'Student account tenant linkage is invalid')
  }
  return {
    uid,
    studentId: studentDoc.id,
    collegeId,
    name: String(student.name || userData?.name || ''),
    regNo: String(student.regNo || student.registrationNumber || ''),
    course: String(student.course || student.programme || student.program || ''),
    branch: String(student.branch || student.department || ''),
    batch: String(student.batch || student.academicYear || ''),
    division: String(student.division || student.section || ''),
    semester: Number(student.semester) || 0,
  }
}

function iso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const converted = (value as { toDate: () => Date }).toDate()
    if (converted instanceof Date) return converted.toISOString()
  }
  if (typeof value === 'string') return value
  return null
}

function round(value: number, places = 2): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/** Credit-weighted mean of real grade points. Returns null when unpublished. */
export function weightedCgpa(rows: CreditRow[]): number | null {
  return summarizeCredits(rows).gpa
}

// ─── Placement readiness ────────────────────────────────────────────────────
//
// These are the cut-offs campus recruiters commonly publish, kept as one
// explicit table so a college can adjust policy in one place. They describe
// the *opportunity band*, never a promised employer: which companies actually
// visit is decided by the college's placement cell, and the job application
// portal that will list those drives is a separate, later feature. Nothing
// here invents a recruiter name or a package.

export interface ReadinessBand {
  id: string
  minCgpa: number
  label: string
  /** What this band realistically opens, in the college's own words. */
  outlook: string
}

export const READINESS_BANDS: ReadinessBand[] = [
  {
    id: 'tier1',
    minCgpa: 9,
    label: 'Distinction band',
    outlook:
      'Clears the highest academic cut-offs. Eligible for merit pools, honours tracks and the widest range of campus drives.',
  },
  {
    id: 'tier2',
    minCgpa: 8,
    label: 'Strong band',
    outlook:
      'Clears most campus drive cut-offs, including the majority of core and product roles posted by recruiters.',
  },
  {
    id: 'tier3',
    minCgpa: 7,
    label: 'Competitive band',
    outlook:
      'Meets the common 7.0 cut-off used by many recruiters. Some premium drives will still be out of reach.',
  },
  {
    id: 'tier4',
    minCgpa: 6.5,
    label: 'Eligible band',
    outlook:
      'Meets the widely used 6.5 cut-off. Focus on projects and aptitude scores to stand out within the pool.',
  },
  {
    id: 'tier5',
    minCgpa: 6,
    label: 'Minimum band',
    outlook:
      'Meets the baseline 6.0 cut-off. A smaller set of drives will shortlist on academics alone — build a portfolio.',
  },
  {
    id: 'below',
    minCgpa: 0,
    label: 'Below common cut-off',
    outlook:
      'Below the 6.0 cut-off most recruiters publish. Clear backlogs and raise the CGPA before the placement window.',
  },
]

const MIN_ATTENDANCE_FOR_PLACEMENT = 75

export function bandFor(cgpa: number): ReadinessBand {
  return READINESS_BANDS.find((band) => cgpa >= band.minCgpa) || READINESS_BANDS[READINESS_BANDS.length - 1]
}

// ─── Callable ───────────────────────────────────────────────────────────────

export const getMyAcademicJourney = onCall(
  { region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudent(uid, request.auth?.token || {})
    const db = admin.firestore()

    const [attendanceSnap, assessmentSnap, cohort, myGradeSnap] = await Promise.all([
      db
        .collection('attendanceRecords')
        .where('collegeId', '==', student.collegeId)
        .where('studentId', '==', student.studentId)
        .limit(1000)
        .get(),
      db.collection('studentAssessments').where('studentId', '==', student.studentId).limit(500).get(),
      standingEvidence.get(student.collegeId, async () => {
        const [grades, roster] = await Promise.all([
          db.collection('gradeRecords').where('collegeId', '==', student.collegeId).where('status', '==', 'published').limit(2000).get(),
          db.collection('students').where('collegeId', '==', student.collegeId).select('branch', 'department', 'batch', 'academicYear').limit(2000).get(),
        ])
        return { grades, roster, asOf: new Date().toISOString() }
      }, request.data?.fresh === true),
      db.collection('gradeRecords').where('collegeId', '==', student.collegeId).where('studentId', '==', student.studentId).where('status', '==', 'published').limit(500).get(),
    ])
    const { grades: gradeSnap, roster: rosterSnap, asOf: standingAsOf } = cohort
    if (myGradeSnap.size >= 500) throw new HttpsError('resource-exhausted', 'Transcript exceeds the safe summary limit. Ask the college to review its grade records.')

    // ── Attendance: real marked rows, late counts as attended (matches the
    //    student attendance page so the two numbers can never disagree).
    const statuses = attendanceSnap.docs.map((doc) => String(doc.data().status || ''))
    const totalClasses = statuses.length
    const present = statuses.filter((s) => s === 'present' || s === 'onDuty').length
    const late = statuses.filter((s) => s === 'late').length
    const absent = statuses.filter((s) => s === 'absent').length
    const attendancePercentage =
      totalClasses > 0 ? Math.round(((present + late) / totalClasses) * 100) : null

    // ── Assessments: only graded attempts have a defensible percentage.
    const attempts = assessmentSnap.docs
      .map((doc) => doc.data())
      .filter((row) => row.collegeId === student.collegeId)
    const graded = attempts.filter((row) => String(row.status) === 'graded')
    const gradedWithScore = graded.filter(
      (row) => typeof Number(row.percentage) === 'number' && !Number.isNaN(Number(row.percentage))
    )
    const averagePercentage =
      gradedWithScore.length > 0
        ? round(
            gradedWithScore.reduce((sum, row) => sum + Number(row.percentage), 0) / gradedWithScore.length,
            1
          )
        : null

    const recentAssessments = gradedWithScore
      .map((row) => ({
        title: String(row.title || ''),
        subject: String(row.subject || ''),
        percentage: round(Number(row.percentage), 1),
        grade: String(row.grade || ''),
        submittedAt: iso(row.submittedAt),
      }))
      .sort((left, right) => (right.submittedAt || '').localeCompare(left.submittedAt || ''))
      .slice(0, 8)

    // ── Grades: published transcript rows only. The portal never derives a
    //    grade or credit from a test percentage.
    const myGrades = latestCreditRows(myGradeSnap.docs.map(doc => {
      const row = doc.data()
      return {
        id: doc.id, code: String(row.code || row.subjectCode || ''), subject: String(row.subject || row.subjectName || row.courseName || ''),
        ...(typeof row.credits === 'number' ? { credits: row.credits } : {}),
        ...(typeof row.gradePoint === 'number' ? { gradePoint: row.gradePoint } : {}),
        grade: String(row.grade || ''), result: String(row.result || ''),
        ...(typeof row.isPass === 'boolean' ? { isPass: row.isPass } : {}),
        ...(typeof row.includeInGpa === 'boolean' ? { includeInGpa: row.includeInGpa } : {}),
        category: String(row.category || ''), updatedAt: iso(row.updatedAt),
        publishedAt: iso(row.publishedAt), createdAt: iso(row.createdAt),
        total: typeof row.total === 'number' ? row.total : null, semester: Number(row.semester) || 0,
      }
    }))
    const bySemester = new Map<number, CreditRow[]>()
    myGrades.forEach(row => {
      const bucket = bySemester.get(row.semester) || []
      bucket.push(row); bySemester.set(row.semester, bucket)
    })
    const semesters = [...bySemester.entries()].sort((a, b) => a[0] - b[0]).map(([semester, rows]) => {
      const summary = summarizeCredits(rows)
      return { semester, sgpa: summary.gpa, credits: summary.attemptedCredits, earnedCredits: summary.earnedCredits, gpaCredits: summary.gpaCredits }
    })
    const creditSummary = summarizeCredits(myGrades)
    const cgpa = creditSummary.gpa
    const creditsEarned = creditSummary.earnedCredits
    // Historical transcripts remain viewable without today's configuration.
    // An unavailable current plan is reported explicitly; it is never BCU.
    const creditAudit = await resolveCollegeSchemesOnServer(student.collegeId)
      .then(configuration => auditAssignedProgrammeCredits(myGrades, configuration, { programme: student.course || student.branch, batch: student.batch }))
      .catch(err => ({ configured: false as const, creditRequirementsMet: false, reason: err instanceof Error ? err.message : 'College scheme unavailable' }))

    // ── Standing: rank across the real published CGPAs of the student's own
    //    batch and branch. Students with no published grades are excluded
    //    rather than counted as zero, which would flatter everyone.
    const cohortIds = new Set(
      rosterSnap.docs
        .filter((doc) => {
          const row = doc.data()
          if (doc.id === student.studentId) return true
          const sameBranch =
            !student.branch ||
            String(row.branch || row.department || '').toLowerCase() === student.branch.toLowerCase()
          const sameBatch =
            !student.batch || String(row.batch || row.academicYear || '') === student.batch
          return sameBranch && sameBatch
        })
        .map((doc) => doc.id)
    )

    const cgpaByStudent = new Map<string, CreditRow[]>()
    gradeSnap.docs.forEach((doc) => {
      const row = doc.data()
      const studentId = String(row.studentId || '')
      if (!cohortIds.has(studentId)) return
      const bucket = cgpaByStudent.get(studentId) || []
      bucket.push(row as CreditRow)
      cgpaByStudent.set(studentId, bucket)
    })

    const rankedCgpas = [...cgpaByStudent.entries()]
      .map(([studentId, rows]) => ({ studentId, cgpa: weightedCgpa(rows) }))
      .filter((entry): entry is { studentId: string; cgpa: number } => entry.cgpa !== null)
      .sort((left, right) => right.cgpa - left.cgpa)

    const myPosition = rankedCgpas.findIndex((entry) => entry.studentId === student.studentId)
    const cohortSize = rankedCgpas.length
    const standingIncomplete = gradeSnap.size >= 2000 || rosterSnap.size >= 2000
    const rank = !standingIncomplete && myPosition >= 0 ? myPosition + 1 : null
    // Percentile = share of the ranked cohort scoring below this student.
    const percentile =
      rank !== null && cohortSize > 1 ? round(((cohortSize - rank) / (cohortSize - 1)) * 100, 1) : null

    // ── Readiness from the real CGPA, gated on real attendance.
    const band = cgpa !== null ? bandFor(cgpa) : null
    const nextBand =
      cgpa !== null
        ? READINESS_BANDS.slice()
            .reverse()
            .find((entry) => entry.minCgpa > cgpa) || null
        : null
    const attendanceShortfall =
      attendancePercentage !== null && attendancePercentage < MIN_ATTENDANCE_FOR_PLACEMENT
        ? MIN_ATTENDANCE_FOR_PLACEMENT - attendancePercentage
        : 0

    return {
      profile: {
        name: student.name,
        regNo: student.regNo,
        course: student.course,
        branch: student.branch,
        batch: student.batch,
        division: student.division,
        semester: student.semester,
      },
      attendance: {
        percentage: attendancePercentage,
        totalClasses,
        present,
        late,
        absent,
        requiredPercentage: MIN_ATTENDANCE_FOR_PLACEMENT,
      },
      assessments: {
        attempted: attempts.filter((row) => ['submitted', 'graded'].includes(String(row.status))).length,
        graded: graded.length,
        awaitingGrading: graded.length < attempts.filter((row) => String(row.status) === 'submitted').length
          ? attempts.filter((row) => String(row.status) === 'submitted').length
          : 0,
        averagePercentage,
        recent: recentAssessments,
      },
      grades: {
        published: myGrades.length > 0,
        subjects: myGrades,
        semesters,
        cgpa,
        creditsEarned,
        attemptedCredits: creditSummary.attemptedCredits,
        gpaCredits: creditSummary.gpaCredits,
        incompleteRows: creditSummary.invalidRows + creditSummary.pendingRows,
        creditAudit,
      },
      standing: {
        asOf: standingAsOf,
        branch: student.branch,
        batch: student.batch,
        cohortSize,
        incomplete: standingIncomplete,
        rank,
        percentile,
      },
      readiness: {
        hasCgpa: cgpa !== null,
        band: band ? { id: band.id, label: band.label, outlook: band.outlook } : null,
        minCgpaForBand: band ? band.minCgpa : null,
        nextBand: nextBand
          ? {
              id: nextBand.id,
              label: nextBand.label,
              minCgpa: nextBand.minCgpa,
              gap: cgpa !== null ? round(nextBand.minCgpa - cgpa) : null,
            }
          : null,
        attendanceGate: MIN_ATTENDANCE_FOR_PLACEMENT,
        attendanceShortfall,
        bands: READINESS_BANDS.map((entry) => ({
          id: entry.id,
          minCgpa: entry.minCgpa,
          label: entry.label,
          outlook: entry.outlook,
        })),
      },
    }
  }
)
