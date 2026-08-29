import * as admin from 'firebase-admin'
import * as logger from 'firebase-functions/logger'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'

interface NotificationPreferences {
  exams: boolean
  fees: boolean
  assignments: boolean
  events: boolean
}

interface UpdateStudentProfileInput {
  name?: unknown
  notificationPrefs?: unknown
}

const PREFERENCE_KEYS: Array<keyof NotificationPreferences> = [
  'exams',
  'fees',
  'assignments',
  'events',
]

function parsePreferences(value: unknown): NotificationPreferences | undefined {
  if (value === undefined) return undefined
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'notificationPrefs must be an object')
  }

  const source = value as Record<string, unknown>
  const unexpected = Object.keys(source).filter(
    (key) => !PREFERENCE_KEYS.includes(key as keyof NotificationPreferences)
  )
  if (unexpected.length > 0 || PREFERENCE_KEYS.some((key) => typeof source[key] !== 'boolean')) {
    throw new HttpsError(
      'invalid-argument',
      'notificationPrefs must contain only boolean exams, fees, assignments, and events values'
    )
  }

  return {
    exams: source.exams as boolean,
    fees: source.fees as boolean,
    assignments: source.assignments as boolean,
    events: source.events as boolean,
  }
}

/**
 * Updates the authenticated student's editable profile fields across the
 * canonical Firestore records and Firebase Auth. The client cannot choose a
 * student ID, college, role, or any academic field.
 */
export const updateMyStudentProfile = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 20,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')

    const input = (request.data || {}) as UpdateStudentProfileInput
    const name = input.name === undefined ? undefined : String(input.name).trim()
    const notificationPrefs = parsePreferences(input.notificationPrefs)

    if (name === undefined && notificationPrefs === undefined) {
      throw new HttpsError('invalid-argument', 'No editable profile fields were provided')
    }
    if (name !== undefined && (name.length < 2 || name.length > 100)) {
      throw new HttpsError('invalid-argument', 'Name must be between 2 and 100 characters')
    }

    const db = admin.firestore()
    const auth = admin.auth()
    const [userDoc, studentSnapshot] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('students').where('userId', '==', uid).limit(2).get(),
    ])

    const userData = userDoc.data()
    const tokenRole = request.auth?.token.role
    const resolvedRole = tokenRole || userData?.role
    if (!userDoc.exists || resolvedRole !== 'student') {
      throw new HttpsError('permission-denied', 'A linked student account is required')
    }
    if (studentSnapshot.empty) {
      throw new HttpsError(
        'failed-precondition',
        'Your account is not linked to a student profile. Contact your college administrator.'
      )
    }
    if (studentSnapshot.size > 1) {
      logger.error('[StudentPortal] Duplicate profiles for Auth UID', { uid })
      throw new HttpsError(
        'failed-precondition',
        'Multiple student profiles are linked to this account. Contact your college administrator.'
      )
    }

    const studentDoc = studentSnapshot.docs[0]
    const studentData = studentDoc.data()
    const userCollegeId = request.auth?.token.collegeId || userData?.collegeId
    if (!studentData.collegeId || studentData.collegeId !== userCollegeId) {
      logger.error('[StudentPortal] Student/user tenant mismatch', {
        uid,
        studentCollegeId: studentData.collegeId,
        userCollegeId,
      })
      throw new HttpsError('failed-precondition', 'Student account tenant linkage is invalid')
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    if (name !== undefined) updates.name = name
    if (notificationPrefs !== undefined) updates.notificationPrefs = notificationPrefs

    let previousDisplayName: string | null | undefined
    if (name !== undefined) {
      const authUser = await auth.getUser(uid)
      previousDisplayName = authUser.displayName
      await auth.updateUser(uid, { displayName: name })
    }

    try {
      const batch = db.batch()
      batch.update(studentDoc.ref, updates)
      batch.update(userDoc.ref, updates)

      // Official provisioning indexes college students by registration number.
      // Update it only when it already exists; never create a partial index from
      // this profile-edit operation.
      const registrationNumber = String(studentData.regNo || '').trim()
      if (registrationNumber) {
        const collegeStudentRef = db
          .collection('colleges')
          .doc(studentData.collegeId)
          .collection('students')
          .doc(registrationNumber)
        const collegeStudentDoc = await collegeStudentRef.get()
        if (collegeStudentDoc.exists) batch.update(collegeStudentRef, updates)
      }

      await batch.commit()
    } catch (error) {
      if (name !== undefined) {
        try {
          await auth.updateUser(uid, { displayName: previousDisplayName || null })
        } catch (rollbackError) {
          logger.error('[StudentPortal] Failed to roll back Auth display name', {
            uid,
            rollbackError,
          })
        }
      }
      throw error
    }

    logger.info('[StudentPortal] Student profile updated', {
      uid,
      studentId: studentDoc.id,
      fields: Object.keys(updates).filter((key) => key !== 'updatedAt'),
    })

    return {
      success: true,
      name: name ?? studentData.name,
      notificationPrefs: notificationPrefs ?? studentData.notificationPrefs ?? null,
    }
  }
)

interface StudentIdentity {
  uid: string
  studentId: string
  collegeId: string
  name: string
  regNo: string
  branch: string
  batch: string
  division: string
  semester: number
}

interface SubmissionFileInput {
  name: string
  storagePath: string
  contentType: string
  size: number
}

const ASSIGNMENT_STATUSES = ['published', 'ongoing', 'closed', 'graded']
const ASSIGNMENT_UPLOAD_TTL_MS = 60 * 60 * 1000
const MAX_ASSIGNMENT_FILES = 10
const MAX_ASSIGNMENT_FILE_SIZE = 10 * 1024 * 1024
const ASSIGNMENT_CONTENT_TYPE = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain|image\/.*)$/

async function resolveStudentIdentity(
  uid: string,
  token: Record<string, unknown>
): Promise<StudentIdentity> {
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
    branch: String(student.branch || student.department || ''),
    batch: String(student.batch || student.academicYear || ''),
    division: String(student.division || student.section || ''),
    semester: Number(student.semester) || 0,
  }
}

function assignmentTargetsStudent(
  assignment: admin.firestore.DocumentData,
  student: StudentIdentity
): boolean {
  if (assignment.collegeId !== student.collegeId) return false
  if (assignment.targetType === 'specific') {
    const studentIds = Array.isArray(assignment.studentIds) ? assignment.studentIds : []
    const studentUids = Array.isArray(assignment.studentUids) ? assignment.studentUids : []
    return studentIds.includes(student.studentId) || studentUids.includes(student.uid)
  }

  const cohort = assignment.cohort
  if (!cohort || typeof cohort !== 'object') return false
  // An empty cohort is not a safe college-wide broadcast. At least one cohort
  // dimension must be explicitly selected by the author.
  const hasTextCriterion = [cohort.branch, cohort.batch, cohort.division]
    .some((value) => typeof value === 'string' && value.trim().length > 0)
  if (!hasTextCriterion && !(Number(cohort.semester) > 0)) return false
  if (cohort.branch && String(cohort.branch) !== student.branch) return false
  if (cohort.batch && String(cohort.batch) !== student.batch) return false
  if (cohort.division && String(cohort.division) !== student.division) return false
  if (cohort.semester && Number(cohort.semester) !== student.semester) return false
  return true
}

function asDate(value: unknown, endOfDayForDateOnly = false): Date | null {
  if (!value) return null
  if (value instanceof admin.firestore.Timestamp) return value.toDate()
  if (value instanceof Date) return value
  const text = String(value)
  const normalized = endOfDayForDateOnly && /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T23:59:59+05:30`
    : text
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function serializeAssignment(
  id: string,
  assignment: admin.firestore.DocumentData,
  submission?: admin.firestore.DocumentData
) {
  const deadline = asDate(assignment.deadline || assignment.dueDate, true)
  const status = submission
    ? submission.status === 'graded' ? 'graded' : submission.status === 'late' ? 'late-submitted' : 'submitted'
    : deadline && deadline.getTime() < Date.now() ? 'overdue' : 'pending'

  return {
    id,
    title: String(assignment.title || 'Untitled assignment'),
    description: String(assignment.description || ''),
    subject: String(assignment.subject || ''),
    subjectCode: String(assignment.subjectCode || ''),
    dueDate: deadline ? deadline.toISOString().slice(0, 10) : '',
    dueTime: deadline ? deadline.toISOString().slice(11, 16) : '',
    maxMarks: Number(assignment.maxScore ?? assignment.maxMarks ?? assignment.totalMarks) || 0,
    submissionType: String(assignment.submissionType || 'file'),
    status,
    attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
    createdAt: asDate(assignment.createdAt)?.toISOString() || '',
    marksObtained: submission?.score ?? submission?.marksObtained ?? null,
    feedback: String(submission?.remarks || submission?.feedback || ''),
    submittedAt: asDate(submission?.submittedAt)?.toISOString() || '',
  }
}

async function getAssignmentForStudent(
  assignmentId: string,
  student: StudentIdentity,
  allowedStatuses = ASSIGNMENT_STATUSES
): Promise<FirebaseFirestore.DocumentSnapshot> {
  if (!assignmentId || assignmentId.includes('/')) {
    throw new HttpsError('invalid-argument', 'A valid assignmentId is required')
  }
  const assignmentDoc = await admin.firestore().collection('assignments').doc(assignmentId).get()
  const assignment = assignmentDoc.data()
  if (!assignmentDoc.exists || !assignment) throw new HttpsError('not-found', 'Assignment not found')
  if (!allowedStatuses.includes(String(assignment.status || ''))) {
    throw new HttpsError('failed-precondition', 'Assignment is not available for submission')
  }
  if (!assignmentTargetsStudent(assignment, student)) {
    throw new HttpsError('permission-denied', 'This assignment is not assigned to your cohort')
  }
  return assignmentDoc
}

export const getMyAssignments = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 30,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const student = await resolveStudentIdentity(uid, request.auth?.token || {})
    const db = admin.firestore()

    const [assignmentSnapshot, submissionSnapshot] = await Promise.all([
      db
        .collection('assignments')
        .where('collegeId', '==', student.collegeId)
        .where('status', 'in', ASSIGNMENT_STATUSES)
        .limit(200)
        .get(),
      db.collection('submissions').where('studentId', '==', student.studentId).limit(500).get(),
    ])

    const submissions = new Map<string, admin.firestore.DocumentData>()
    submissionSnapshot.docs.forEach((submissionDoc) => {
      const submission = submissionDoc.data()
      const assignmentId = String(submission.assignmentId || '')
      const current = submissions.get(assignmentId)
      const submittedAt = asDate(submission.submittedAt)?.getTime() || 0
      const currentSubmittedAt = asDate(current?.submittedAt)?.getTime() || 0
      if (assignmentId && submittedAt >= currentSubmittedAt) submissions.set(assignmentId, submission)
    })

    const assignments = assignmentSnapshot.docs
      .filter((assignmentDoc) => assignmentTargetsStudent(assignmentDoc.data(), student))
      .map((assignmentDoc) =>
        serializeAssignment(
          assignmentDoc.id,
          assignmentDoc.data(),
          submissions.get(assignmentDoc.id)
        )
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    return { assignments }
  }
)

export const beginMyAssignmentSubmission = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 30,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const assignmentId = String(request.data?.assignmentId || '')
    const student = await resolveStudentIdentity(uid, request.auth?.token || {})
    const assignmentDoc = await getAssignmentForStudent(assignmentId, student, ['published', 'ongoing'])
    const assignment = assignmentDoc.data() || {}
    const db = admin.firestore()
    const submissionRef = db.collection('submissions').doc(`${assignmentId}_${student.studentId}`)
    const existingSubmission = await submissionRef.get()
    if (existingSubmission.exists) {
      const existing = existingSubmission.data() || {}
      if (existing.status === 'graded' || assignment.allowResubmission !== true) {
        throw new HttpsError('already-exists', 'This assignment has already been submitted')
      }
    }

    const sessionRef = db.collection('assignmentSubmissionDrafts').doc()
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + ASSIGNMENT_UPLOAD_TTL_MS)
    await sessionRef.create({
      assignmentId,
      studentId: student.studentId,
      studentUid: student.uid,
      collegeId: student.collegeId,
      status: 'uploading',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    })

    return {
      sessionId: sessionRef.id,
      studentId: student.studentId,
      uploadBase: `assignment-submissions/${student.studentId}/${assignmentId}/${sessionRef.id}`,
      expiresAt: expiresAt.toDate().toISOString(),
    }
  }
)

function parseSubmissionFiles(value: unknown, expectedPrefix: string): SubmissionFileInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_ASSIGNMENT_FILES) {
    throw new HttpsError(
      'invalid-argument',
      `Between 1 and ${MAX_ASSIGNMENT_FILES} files are required`
    )
  }
  return value.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object') {
      throw new HttpsError('invalid-argument', `File ${index + 1} is invalid`)
    }
    const file = candidate as Record<string, unknown>
    const parsed = {
      name: String(file.name || '').trim(),
      storagePath: String(file.storagePath || ''),
      contentType: String(file.contentType || ''),
      size: Number(file.size),
    }
    if (
      !parsed.name
      || !parsed.storagePath.startsWith(`${expectedPrefix}/`)
      || parsed.storagePath.slice(expectedPrefix.length + 1).includes('/')
      || !ASSIGNMENT_CONTENT_TYPE.test(parsed.contentType)
      || !Number.isFinite(parsed.size)
      || parsed.size < 1
      || parsed.size > MAX_ASSIGNMENT_FILE_SIZE
    ) {
      throw new HttpsError('invalid-argument', `File ${index + 1} does not meet upload policy`)
    }
    return parsed
  })
}

export const finalizeMyAssignmentSubmission = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 60,
    minInstances: 0,
    maxInstances: 30,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const assignmentId = String(request.data?.assignmentId || '')
    const sessionId = String(request.data?.sessionId || '')
    const remarks = String(request.data?.remarks || '').trim()
    if (!sessionId || sessionId.includes('/') || remarks.length > 2000) {
      throw new HttpsError('invalid-argument', 'Submission session or remarks are invalid')
    }

    const student = await resolveStudentIdentity(uid, request.auth?.token || {})
    const assignmentDoc = await getAssignmentForStudent(assignmentId, student, ['published', 'ongoing'])
    const assignment = assignmentDoc.data() || {}
    const expectedPrefix = `assignment-submissions/${student.studentId}/${assignmentId}/${sessionId}`
    const files = parseSubmissionFiles(request.data?.files, expectedPrefix)
    const db = admin.firestore()
    const draftRef = db.collection('assignmentSubmissionDrafts').doc(sessionId)
    const draftDoc = await draftRef.get()
    const draft = draftDoc.data()
    if (
      !draftDoc.exists
      || draft?.status !== 'uploading'
      || draft.studentUid !== uid
      || draft.studentId !== student.studentId
      || draft.assignmentId !== assignmentId
      || !(draft.expiresAt instanceof admin.firestore.Timestamp)
      || draft.expiresAt.toMillis() <= Date.now()
    ) {
      throw new HttpsError('failed-precondition', 'Submission upload session is invalid or expired')
    }

    // Never trust browser-provided file metadata. Verify every object in the
    // bucket before making the submission visible to faculty.
    const bucket = admin.storage().bucket()
    await Promise.all(files.map(async (file, index) => {
      try {
        const [metadata] = await bucket.file(file.storagePath).getMetadata()
        const storedSize = Number(metadata.size)
        const storedType = String(metadata.contentType || '')
        if (
          storedSize !== file.size
          || storedSize > MAX_ASSIGNMENT_FILE_SIZE
          || storedType !== file.contentType
          || !ASSIGNMENT_CONTENT_TYPE.test(storedType)
        ) {
          throw new Error('metadata mismatch')
        }
      } catch (error) {
        logger.warn('[StudentPortal] Submission object verification failed', {
          uid,
          assignmentId,
          sessionId,
          path: file.storagePath,
          error,
        })
        throw new HttpsError('failed-precondition', `Uploaded file ${index + 1} could not be verified`)
      }
    }))

    const submissionRef = db.collection('submissions').doc(`${assignmentId}_${student.studentId}`)
    const deadline = asDate(assignment.deadline || assignment.dueDate, true)
    const isLate = Boolean(deadline && deadline.getTime() < Date.now())

    await db.runTransaction(async (transaction) => {
      const [freshDraft, existingSubmission] = await Promise.all([
        transaction.get(draftRef),
        transaction.get(submissionRef),
      ])
      const freshDraftData = freshDraft.data()
      if (freshDraftData?.status !== 'uploading') {
        throw new HttpsError('already-exists', 'This upload session has already been finalized')
      }
      if (existingSubmission.exists) {
        const existing = existingSubmission.data() || {}
        if (existing.status === 'graded' || assignment.allowResubmission !== true) {
          throw new HttpsError('already-exists', 'This assignment has already been submitted')
        }
      }

      const submission = {
        assignmentId,
        collegeId: student.collegeId,
        studentId: student.studentId,
        studentUid: uid,
        studentName: student.name,
        studentRegNo: student.regNo,
        files,
        attachments: files,
        remarks,
        content: remarks,
        status: isLate ? 'late' : 'submitted',
        maxScore: Number(assignment.maxScore ?? assignment.maxMarks ?? assignment.totalMarks) || 0,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(existingSubmission.exists
          ? {}
          : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
      }
      transaction.set(submissionRef, submission, { merge: existingSubmission.exists })
      transaction.update(draftRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      if (!existingSubmission.exists) {
        transaction.update(assignmentDoc.ref, {
          submissionCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      }
    })

    logger.info('[StudentPortal] Assignment submitted', {
      uid,
      studentId: student.studentId,
      assignmentId,
      sessionId,
      isLate,
      fileCount: files.length,
    })

    return {
      id: submissionRef.id,
      assignmentId,
      studentId: student.studentId,
      status: isLate ? 'late' : 'submitted',
      submittedAt: new Date().toISOString(),
      files,
      remarks,
    }
  }
)

export const cancelMyAssignmentSubmission = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 30,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const sessionId = String(request.data?.sessionId || '')
    if (!sessionId || sessionId.includes('/')) {
      throw new HttpsError('invalid-argument', 'A valid sessionId is required')
    }
    const draftRef = admin.firestore().collection('assignmentSubmissionDrafts').doc(sessionId)
    const draftDoc = await draftRef.get()
    const draft = draftDoc.data()
    if (!draftDoc.exists || draft?.studentUid !== uid) {
      throw new HttpsError('not-found', 'Submission upload session not found')
    }
    if (draft.status === 'completed') {
      throw new HttpsError('failed-precondition', 'Completed submissions cannot be cancelled')
    }

    const prefix = `assignment-submissions/${draft.studentId}/${draft.assignmentId}/${sessionId}/`
    await admin.storage().bucket().deleteFiles({ prefix, force: true })
    await draftRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { success: true }
  }
)

export const cleanupExpiredAssignmentSubmissionDrafts = onSchedule(
  {
    region: 'asia-south1',
    schedule: 'every 60 minutes',
    timeZone: 'Asia/Kolkata',
    memory: '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    const db = admin.firestore()
    const expired = await db
      .collection('assignmentSubmissionDrafts')
      .where('status', '==', 'uploading')
      .where('expiresAt', '<=', admin.firestore.Timestamp.now())
      .limit(200)
      .get()
    if (expired.empty) return

    const bucket = admin.storage().bucket()
    await Promise.all(expired.docs.map(async (draftDoc) => {
      const draft = draftDoc.data()
      const prefix = `assignment-submissions/${draft.studentId}/${draft.assignmentId}/${draftDoc.id}/`
      try {
        await bucket.deleteFiles({ prefix, force: true })
        await draftDoc.ref.update({
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      } catch (error) {
        logger.error('[StudentPortal] Failed to clean expired assignment upload', {
          draftId: draftDoc.id,
          error,
        })
      }
    }))
  }
)

export const gradeAssignmentSubmission = onCall(
  {
    region: 'asia-south1',
    memory: '256MiB',
    timeoutSeconds: 30,
    minInstances: 0,
    maxInstances: 30,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const submissionId = String(request.data?.submissionId || '')
    const score = Number(request.data?.score)
    const remarks = String(request.data?.remarks || '').trim()
    if (!submissionId || submissionId.includes('/') || !Number.isFinite(score) || remarks.length > 5000) {
      throw new HttpsError('invalid-argument', 'Submission, score, or remarks are invalid')
    }

    const db = admin.firestore()
    const userDoc = await db.collection('users').doc(uid).get()
    const user = userDoc.data()
    const role = String(request.auth?.token.role || user?.role || '')
    const collegeId = String(request.auth?.token.collegeId || user?.collegeId || '')
    if (!userDoc.exists || !['superadmin', 'admin', 'principal', 'hod', 'faculty'].includes(role)) {
      throw new HttpsError('permission-denied', 'Academic staff access is required')
    }

    const submissionRef = db.collection('submissions').doc(submissionId)
    await db.runTransaction(async (transaction) => {
      const submissionDoc = await transaction.get(submissionRef)
      const submission = submissionDoc.data()
      if (!submissionDoc.exists || !submission) throw new HttpsError('not-found', 'Submission not found')
      if (role !== 'superadmin' && submission.collegeId !== collegeId) {
        throw new HttpsError('permission-denied', 'Submission belongs to another college')
      }
      const assignmentRef = db.collection('assignments').doc(String(submission.assignmentId || ''))
      const assignmentDoc = await transaction.get(assignmentRef)
      const assignment = assignmentDoc.data()
      if (!assignmentDoc.exists || !assignment) throw new HttpsError('failed-precondition', 'Assignment not found')
      if (
        role === 'faculty'
        && assignment.facultyUid !== uid
      ) {
        throw new HttpsError('permission-denied', 'Faculty may grade only their own assignments')
      }
      const maxScore = Number(
        submission.maxScore ?? assignment.maxScore ?? assignment.maxMarks ?? assignment.totalMarks
      )
      if (!Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
        throw new HttpsError('invalid-argument', `Score must be between 0 and ${maxScore || 0}`)
      }

      transaction.update(submissionRef, {
        score,
        marksObtained: score,
        remarks,
        feedback: remarks,
        status: 'graded',
        gradedAt: admin.firestore.FieldValue.serverTimestamp(),
        gradedBy: uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    logger.info('[StudentPortal] Assignment submission graded', {
      uid,
      submissionId,
      score,
    })
    return { success: true }
  }
)

interface AssignmentStaffIdentity {
  uid: string
  role: string
  collegeId: string
  name: string
}

async function resolveAssignmentStaff(
  uid: string,
  token: Record<string, unknown>
): Promise<AssignmentStaffIdentity> {
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const user = userDoc.data()
  const role = String(token.role || user?.role || '')
  const collegeId = String(token.collegeId || user?.collegeId || '')
  if (
    !userDoc.exists
    || !['superadmin', 'admin', 'principal', 'hod', 'faculty'].includes(role)
    || (role !== 'superadmin' && !collegeId)
  ) {
    throw new HttpsError('permission-denied', 'Academic staff access is required')
  }
  return { uid, role, collegeId, name: String(user?.name || '') }
}

function assignmentDate(value: unknown, field: string): Date {
  const text = String(value || '')
  const parsed = value instanceof admin.firestore.Timestamp
    ? value.toDate()
    : new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T23:59:59+05:30` : text)
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpsError('invalid-argument', `${field} must be a valid date`)
  }
  return parsed
}

async function sanitizeAssignmentAuthoringInput(
  value: unknown,
  collegeId: string,
  requireFutureDeadline: boolean
): Promise<admin.firestore.DocumentData> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpsError('invalid-argument', 'Assignment data is required')
  }
  const input = value as Record<string, unknown>
  const title = String(input.title || '').trim()
  const description = String(input.description || '').trim()
  const topic = String(input.topic || '').trim()
  const subject = String(input.subject || '').trim()
  const subjectCode = String(input.subjectCode || '').trim()
  const maxScore = Number(input.maxScore)
  const type = String(input.type || 'assignment')
  const targetType = String(input.targetType || 'cohort')
  const deadline = assignmentDate(input.deadline, 'deadline')
  if (title.length < 3 || title.length > 200) {
    throw new HttpsError('invalid-argument', 'Title must be between 3 and 200 characters')
  }
  if (description.length > 20_000 || topic.length > 200 || subject.length < 1 || subject.length > 200) {
    throw new HttpsError('invalid-argument', 'Description, topic, or subject is invalid')
  }
  if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 10_000) {
    throw new HttpsError('invalid-argument', 'Maximum score must be between 1 and 10000')
  }
  if (!['assignment', 'project', 'quiz', 'test'].includes(type)) {
    throw new HttpsError('invalid-argument', 'Assignment type is invalid')
  }
  if (!['cohort', 'specific'].includes(targetType)) {
    throw new HttpsError('invalid-argument', 'Assignment target type is invalid')
  }
  if (requireFutureDeadline && deadline.getTime() <= Date.now()) {
    throw new HttpsError('invalid-argument', 'Published assignments require a future deadline')
  }

  let cohort: Record<string, unknown> | undefined
  let studentIds: string[] | undefined
  if (targetType === 'cohort') {
    const source = input.cohort && typeof input.cohort === 'object' && !Array.isArray(input.cohort)
      ? input.cohort as Record<string, unknown>
      : {}
    const branch = String(source.branch || '').trim().slice(0, 100)
    const batch = String(source.batch || '').trim().slice(0, 100)
    const division = String(source.division || source.section || '').trim().slice(0, 100)
    const semester = Math.max(0, Math.min(20, Number(source.semester) || 0))
    cohort = {
      ...(branch ? { branch } : {}),
      ...(batch ? { batch } : {}),
      ...(division ? { division } : {}),
      ...(semester ? { semester } : {}),
    }
    if (Object.keys(cohort).length === 0) {
      throw new HttpsError('invalid-argument', 'Choose at least one cohort field')
    }
  } else {
    studentIds = Array.isArray(input.studentIds)
      ? [...new Set(input.studentIds.map(String).filter(Boolean))].slice(0, 500)
      : []
    if (studentIds.length === 0) {
      throw new HttpsError('invalid-argument', 'Choose at least one student')
    }
    const db = admin.firestore()
    const docs = await db.getAll(...studentIds.map((id) => db.collection('students').doc(id)))
    if (docs.some((student) => !student.exists || student.data()?.collegeId !== collegeId)) {
      throw new HttpsError('invalid-argument', 'One or more selected students are invalid')
    }
  }

  return {
    title,
    description,
    topic,
    subject,
    subjectCode: subjectCode.slice(0, 100),
    maxScore,
    type,
    targetType,
    ...(cohort ? { cohort } : {}),
    ...(studentIds ? { studentIds } : {}),
    deadline: admin.firestore.Timestamp.fromDate(deadline),
    allowResubmission: Boolean(input.allowResubmission),
  }
}

export const createFacultyAssignment = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveAssignmentStaff(uid, request.auth?.token || {})
    const requestedCollege = String(request.data?.collegeId || '')
    const collegeId = staff.role === 'superadmin' ? requestedCollege : staff.collegeId
    if (!collegeId) throw new HttpsError('invalid-argument', 'collegeId is required')
    const assignment = await sanitizeAssignmentAuthoringInput(request.data, collegeId, false)
    const assignmentRef = admin.firestore().collection('assignments').doc()
    await assignmentRef.create({
      ...assignment,
      collegeId,
      facultyUid: uid,
      facultyName: staff.name,
      status: 'draft',
      submissionCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { id: assignmentRef.id, status: 'draft' }
  }
)

export const updateFacultyAssignment = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 60, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveAssignmentStaff(uid, request.auth?.token || {})
    const assignmentId = String(request.data?.assignmentId || '')
    if (!assignmentId || assignmentId.includes('/')) throw new HttpsError('invalid-argument', 'A valid assignmentId is required')
    const ref = admin.firestore().collection('assignments').doc(assignmentId)
    const current = await ref.get()
    const data = current.data()
    if (!current.exists || !data) throw new HttpsError('not-found', 'Assignment not found')
    if (staff.role !== 'superadmin' && data.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Assignment belongs to another college')
    }
    if (staff.role === 'faculty' && data.facultyUid !== uid) {
      throw new HttpsError('permission-denied', 'Faculty may edit only their own assignments')
    }
    if (data.status !== 'draft') {
      throw new HttpsError('failed-precondition', 'Only draft assignments can be edited')
    }
    const updates = await sanitizeAssignmentAuthoringInput(
      request.data?.assignment,
      String(data.collegeId),
      false
    )
    await ref.update({ ...updates, updatedAt: admin.firestore.FieldValue.serverTimestamp() })
    return { success: true }
  }
)

const ASSIGNMENT_TRANSITIONS: Record<string, string[]> = {
  draft: ['published'],
  published: ['ongoing', 'closed'],
  ongoing: ['closed'],
  closed: ['graded'],
  graded: [],
}

export const transitionFacultyAssignment = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveAssignmentStaff(uid, request.auth?.token || {})
    const assignmentId = String(request.data?.assignmentId || '')
    const nextStatus = String(request.data?.status || '')
    if (!assignmentId || assignmentId.includes('/') || !['published', 'ongoing', 'closed', 'graded'].includes(nextStatus)) {
      throw new HttpsError('invalid-argument', 'Assignment or next status is invalid')
    }
    const ref = admin.firestore().collection('assignments').doc(assignmentId)
    await admin.firestore().runTransaction(async (transaction) => {
      const current = await transaction.get(ref)
      const data = current.data()
      if (!current.exists || !data) throw new HttpsError('not-found', 'Assignment not found')
      if (staff.role !== 'superadmin' && data.collegeId !== staff.collegeId) {
        throw new HttpsError('permission-denied', 'Assignment belongs to another college')
      }
      if (staff.role === 'faculty' && data.facultyUid !== uid) {
        throw new HttpsError('permission-denied', 'Faculty may manage only their own assignments')
      }
      const currentStatus = String(data.status || 'draft')
      if (!ASSIGNMENT_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
        throw new HttpsError('failed-precondition', `Assignment cannot move from ${currentStatus} to ${nextStatus}`)
      }
      if (nextStatus === 'published') {
        const deadline = asDate(data.deadline, true)
        if (!deadline || deadline.getTime() <= Date.now()) {
          throw new HttpsError('failed-precondition', 'Set a future deadline before publishing')
        }
      }
      transaction.update(ref, {
        status: nextStatus,
        ...(nextStatus === 'published'
          ? { publishedAt: admin.firestore.FieldValue.serverTimestamp() }
          : {}),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    })
    return { success: true }
  }
)

export const deleteFacultyAssignmentDraft = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 30 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveAssignmentStaff(uid, request.auth?.token || {})
    const assignmentId = String(request.data?.assignmentId || '')
    if (!assignmentId || assignmentId.includes('/')) throw new HttpsError('invalid-argument', 'A valid assignmentId is required')
    const ref = admin.firestore().collection('assignments').doc(assignmentId)
    await admin.firestore().runTransaction(async (transaction) => {
      const current = await transaction.get(ref)
      const data = current.data()
      if (!current.exists || !data) throw new HttpsError('not-found', 'Assignment not found')
      if (staff.role !== 'superadmin' && data.collegeId !== staff.collegeId) {
        throw new HttpsError('permission-denied', 'Assignment belongs to another college')
      }
      if (staff.role === 'faculty' && data.facultyUid !== uid) {
        throw new HttpsError('permission-denied', 'Faculty may delete only their own assignments')
      }
      if (data.status !== 'draft' || Number(data.submissionCount) > 0) {
        throw new HttpsError('failed-precondition', 'Only an unused draft assignment can be deleted')
      }
      transaction.delete(ref)
    })
    return { success: true }
  }
)

export const getAssignmentSubmissionDownload = onCall(
  { region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30, minInstances: 0, maxInstances: 40 },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Authentication is required')
    const staff = await resolveAssignmentStaff(uid, request.auth?.token || {})
    const submissionId = String(request.data?.submissionId || '')
    const storagePath = String(request.data?.storagePath || '')
    if (!submissionId || submissionId.includes('/') || !storagePath.startsWith('assignment-submissions/')) {
      throw new HttpsError('invalid-argument', 'Submission and file path are required')
    }
    const db = admin.firestore()
    const submissionDoc = await db.collection('submissions').doc(submissionId).get()
    const submission = submissionDoc.data()
    if (!submissionDoc.exists || !submission) throw new HttpsError('not-found', 'Submission not found')
    if (staff.role !== 'superadmin' && submission.collegeId !== staff.collegeId) {
      throw new HttpsError('permission-denied', 'Submission belongs to another college')
    }
    const assignmentDoc = await db.collection('assignments').doc(String(submission.assignmentId || '')).get()
    const assignment = assignmentDoc.data()
    if (!assignmentDoc.exists || !assignment) throw new HttpsError('failed-precondition', 'Assignment not found')
    if (staff.role === 'faculty' && assignment.facultyUid !== uid) {
      throw new HttpsError('permission-denied', 'Faculty may retrieve only their own assignment files')
    }
    const files = Array.isArray(submission.files)
      ? submission.files
      : Array.isArray(submission.attachments) ? submission.attachments : []
    const file = files.find((candidate: admin.firestore.DocumentData) => candidate.storagePath === storagePath)
    if (!file) throw new HttpsError('permission-denied', 'File is not part of this submission')
    const bucketFile = admin.storage().bucket().file(storagePath)
    const [exists] = await bucketFile.exists()
    if (!exists) throw new HttpsError('not-found', 'Submitted file no longer exists')
    const [url] = await bucketFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60_000,
      responseDisposition: `attachment; filename="${String(file.name || 'submission').replace(/["\r\n]/g, '_')}"`,
    })
    return {
      url,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
      name: String(file.name || 'submission'),
      contentType: String(file.contentType || ''),
    }
  }
)
