import assert from 'node:assert/strict'
import { after, before, beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'
import {
  get as getDatabaseValue,
  ref as databaseRef,
  set as setDatabaseValue,
} from 'firebase/database'

const PROJECT_ID = 'demo-vriddhi-student-portal'
const COLLEGE_A = 'college-a'
const COLLEGE_B = 'college-b'
const STUDENT_UID = 'student-auth-a'
const OTHER_UID = 'student-auth-b'
const STUDENT_ID = 'student-domain-a'
const OTHER_STUDENT_ID = 'student-domain-b'

function emulatorAddress(envName: string, fallbackPort: number): { host: string; port: number } {
  const value = process.env[envName]
  if (!value) {
    throw new Error(
      `${envName} is missing. Run this suite through Firebase emulators:exec (npm test).`
    )
  }
  const [host, rawPort] = value.split(':')
  return { host, port: Number(rawPort || fallbackPort) }
}

let testEnv: RulesTestEnvironment

before(async () => {
  const firestore = emulatorAddress('FIRESTORE_EMULATOR_HOST', 8080)
  const storage = emulatorAddress('FIREBASE_STORAGE_EMULATOR_HOST', 9199)
  const database = emulatorAddress('FIREBASE_DATABASE_EMULATOR_HOST', 9000)
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      ...database,
      rules: readFileSync(resolve(process.cwd(), '../database.rules.json'), 'utf8'),
    },
    firestore: {
      ...firestore,
      rules: readFileSync(resolve(process.cwd(), '../current-firestore.rules'), 'utf8'),
    },
    storage: {
      ...storage,
      rules: readFileSync(resolve(process.cwd(), '../storage.rules'), 'utf8'),
    },
  })
})

after(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await Promise.all([
    testEnv.clearFirestore(),
    testEnv.clearDatabase(),
    testEnv.clearStorage(),
  ])
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await Promise.all([
      setDoc(doc(db, 'users', STUDENT_UID), {
        uid: STUDENT_UID,
        role: 'student',
        collegeId: COLLEGE_A,
        email: 'student-a@example.edu',
      }),
      setDoc(doc(db, 'users', OTHER_UID), {
        uid: OTHER_UID,
        role: 'student',
        collegeId: COLLEGE_A,
        email: 'student-b@example.edu',
      }),
      setDoc(doc(db, 'users', 'faculty-a'), {
        uid: 'faculty-a',
        role: 'faculty',
        collegeId: COLLEGE_A,
      }),
      // Legacy faculty: no users/{uid} document and, in the real app, no custom
      // claims. Identity must resolve from the role profile collection alone.
      setDoc(doc(db, 'faculty', 'legacy-faculty-a'), {
        uid: 'legacy-faculty-a',
        role: 'faculty',
        collegeId: COLLEGE_A,
        email: 'legacy-faculty@example.edu',
        firstName: 'Legacy',
        lastName: 'Faculty',
      }),
      setDoc(doc(db, 'students', STUDENT_ID), {
        userId: STUDENT_UID,
        name: 'Student A',
        collegeId: COLLEGE_A,
        regNo: 'A001',
      }),
      setDoc(doc(db, 'students', OTHER_STUDENT_ID), {
        userId: OTHER_UID,
        name: 'Student B',
        collegeId: COLLEGE_A,
        regNo: 'A002',
      }),
      setDoc(doc(db, 'students', 'student-domain-c'), {
        userId: 'student-auth-c',
        name: 'Student C',
        collegeId: COLLEGE_B,
        regNo: 'B001',
      }),
      setDoc(doc(db, 'colleges', COLLEGE_A, 'students', 'A001'), {
        userId: STUDENT_UID,
        studentDocId: STUDENT_ID,
        name: 'Student A',
        collegeId: COLLEGE_A,
      }),
      setDoc(doc(db, 'colleges', COLLEGE_A, 'students', 'A002'), {
        userId: OTHER_UID,
        studentDocId: OTHER_STUDENT_ID,
        name: 'Student B',
        collegeId: COLLEGE_A,
      }),
      setDoc(doc(db, 'attendanceRecords', 'attendance-own'), {
        studentId: STUDENT_ID,
        collegeId: COLLEGE_A,
        date: '2026-08-29',
        status: 'present',
      }),
      setDoc(doc(db, 'attendanceRecords', 'attendance-other'), {
        studentId: OTHER_STUDENT_ID,
        collegeId: COLLEGE_A,
        date: '2026-08-29',
        status: 'present',
      }),
      setDoc(doc(db, 'weeklySchedules', 'schedule-a'), {
        collegeId: COLLEGE_A,
        branch: 'B.Com',
        batch: '2026',
        semester: 1,
        division: 'A',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
      }),
      setDoc(doc(db, 'weeklySchedules', 'schedule-b'), {
        collegeId: COLLEGE_B,
        branch: 'B.Com',
        batch: '2026',
        semester: 1,
        division: 'A',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
      }),
      setDoc(doc(db, 'weeklySchedules', 'schedule-legacy-a'), {
        collegeId: COLLEGE_A,
        facultyId: 'legacy-faculty-a',
        facultyName: 'Legacy Faculty',
        // A different stream from the student timetable fixture (B.Com) so the
        // student-scoped list query does not pick this legacy row up. All values
        // here are non-technical UG/PG programs, matching academicPrograms.ts.
        branch: 'B.Sc',
        batch: '2026',
        semester: 1,
        division: 'A',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
      }),
      setDoc(doc(db, 'classSessions', 'session-legacy-a'), {
        collegeId: COLLEGE_A,
        facultyId: 'legacy-faculty-a',
        facultyName: 'Legacy Faculty',
        date: '2026-09-02',
        timeSlot: '09:00-10:00',
      }),
      setDoc(doc(db, 'questions', 'question-a'), {
        collegeId: COLLEGE_A,
        status: 'published',
        text: 'Two plus two?',
        correctAnswer: '4',
      }),
      setDoc(doc(db, 'papers', 'paper-a'), {
        collegeId: COLLEGE_A,
        createdBy: 'faculty-a',
        status: 'published',
        verificationStatus: 'approved-by-hod',
        title: 'Internal assessment',
        questions: [{ text: 'Two plus two?', correctAnswer: '4' }],
      }),
      // Faculty topic planner (src/hooks/useTopics.ts). Tenancy is the owning
      // uid: these rows carry no collegeId.
      setDoc(doc(db, 'facultyTopics', 'topic-own'), {
        facultyId: 'faculty-a',
        title: 'Linear equations',
        subject: 'Mathematics',
        status: 'planned',
        createdAt: '2026-09-01T09:00:00.000Z',
      }),
      setDoc(doc(db, 'facultyTopics', 'topic-other'), {
        facultyId: 'faculty-b',
        title: 'Another faculty topic',
        subject: 'Physics',
        status: 'planned',
        createdAt: '2026-09-02T09:00:00.000Z',
      }),
      setDoc(doc(db, 'scheduledTests', 'test-a'), {
        collegeId: COLLEGE_A,
        paperId: 'paper-a',
        status: 'published',
        title: 'Internal assessment',
      }),
      setDoc(doc(db, 'scheduledTests', 'test-a', 'assessmentQuestions', 'q-0001'), {
        id: 'q-0001',
        text: 'Two plus two?',
        options: [{ id: '4', text: '4', isCorrect: true }],
        correctAnswer: '4',
      }),
      setDoc(doc(db, 'studentAssessments', 'test-a_student-domain-a'), {
        collegeId: COLLEGE_A,
        testId: 'test-a',
        studentId: STUDENT_ID,
        studentUid: STUDENT_UID,
        status: 'graded',
        marksObtained: 10,
        gradingBreakdown: [{ questionId: 'q-0001', status: 'correct' }],
      }),
      setDoc(doc(db, 'studentAssessments', 'test-a_student-domain-b'), {
        collegeId: COLLEGE_A,
        testId: 'test-a',
        studentId: OTHER_STUDENT_ID,
        studentUid: OTHER_UID,
        status: 'graded',
        marksObtained: 6,
      }),
      setDoc(doc(db, 'assignments', 'assignment-a'), {
        collegeId: COLLEGE_A,
        facultyUid: 'faculty-a',
        status: 'published',
        targetType: 'specific',
        studentIds: [STUDENT_ID],
      }),
      setDoc(doc(db, 'assignments', 'assignment-legacy-a'), {
        collegeId: COLLEGE_A,
        facultyUid: 'legacy-faculty-a',
        facultyName: 'Legacy Faculty',
        status: 'published',
        targetType: 'cohort',
        title: 'Legacy Faculty Assignment',
        createdAt: Timestamp.fromMillis(Date.now()),
      }),
      setDoc(doc(db, 'assignmentSubmissionDrafts', 'session-own'), {
        assignmentId: 'assignment-a',
        studentId: STUDENT_ID,
        studentUid: STUDENT_UID,
        collegeId: COLLEGE_A,
        status: 'uploading',
        expiresAt: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      }),
      setDoc(doc(db, 'assignmentSubmissionDrafts', 'session-other'), {
        assignmentId: 'assignment-a',
        studentId: OTHER_STUDENT_ID,
        studentUid: OTHER_UID,
        collegeId: COLLEGE_A,
        status: 'uploading',
        expiresAt: Timestamp.fromMillis(Date.now() + 60 * 60 * 1000),
      }),
      setDoc(doc(db, 'submissions', 'assignment-a_student-domain-a'), {
        assignmentId: 'assignment-a',
        collegeId: COLLEGE_A,
        studentId: STUDENT_ID,
        studentUid: STUDENT_UID,
        status: 'submitted',
        files: [],
      }),
      setDoc(doc(db, 'gradeRecords', 'grade-own'), {
        collegeId: COLLEGE_A,
        studentId: STUDENT_ID,
        status: 'published',
        semester: 1,
        subject: 'Mathematics',
        grade: 'A',
      }),
      setDoc(doc(db, 'gradeRecords', 'grade-other'), {
        collegeId: COLLEGE_A,
        studentId: OTHER_STUDENT_ID,
        status: 'published',
        semester: 1,
        subject: 'Mathematics',
        grade: 'A',
      }),
      setDoc(doc(db, 'gradeRecords', 'grade-own-draft'), {
        collegeId: COLLEGE_A,
        studentId: STUDENT_ID,
        status: 'draft',
        semester: 2,
        subject: 'Physics',
        grade: 'B',
      }),
      setDoc(doc(db, 'notifications', 'notif-own'), {
        collegeId: COLLEGE_A,
        userId: STUDENT_UID,
        studentId: STUDENT_ID,
        title: 'Addressed to Student A',
      }),
      setDoc(doc(db, 'notifications', 'notif-other'), {
        collegeId: COLLEGE_A,
        userId: OTHER_UID,
        studentId: OTHER_STUDENT_ID,
        title: 'Addressed to Student B',
      }),
      setDoc(doc(db, 'notifications', 'notif-broadcast'), {
        collegeId: COLLEGE_A,
        title: 'College-wide announcement',
        message: 'Visible to every student under the old sameCollege rule',
      }),
      // Staff (faculty) attendance. Document ids follow the storage contract in
      // src/shared/api/staffAttendanceApi.ts: {collegeId}__{facultyUid}__{date}.
      setDoc(doc(db, 'staffAttendance', `${COLLEGE_A}__faculty-a__2026-09-01`), {
        collegeId: COLLEGE_A,
        facultyId: 'faculty-a',
        facultyName: 'Faculty A',
        date: '2026-09-01',
        month: '2026-09',
        status: 'present',
        source: 'self',
        markedBy: 'faculty-a',
      }),
      setDoc(doc(db, 'staffAttendance', `${COLLEGE_A}__faculty-b__2026-09-01`), {
        collegeId: COLLEGE_A,
        facultyId: 'faculty-b',
        facultyName: 'Faculty B',
        date: '2026-09-01',
        month: '2026-09',
        status: 'present',
        source: 'self',
        markedBy: 'faculty-b',
      }),
      setDoc(doc(db, 'staffAttendance', `${COLLEGE_B}__faculty-c__2026-09-01`), {
        collegeId: COLLEGE_B,
        facultyId: 'faculty-c',
        facultyName: 'Faculty C',
        date: '2026-09-01',
        month: '2026-09',
        status: 'present',
        source: 'self',
        markedBy: 'faculty-c',
      }),
    ])
  })
})

function studentContext() {
  return testEnv.authenticatedContext(STUDENT_UID, {
    role: 'student',
    collegeId: COLLEGE_A,
    email: 'student-a@example.edu',
  })
}

function facultyContext() {
  return testEnv.authenticatedContext('faculty-a', {
    role: 'faculty',
    collegeId: COLLEGE_A,
  })
}

function adminContext() {
  return testEnv.authenticatedContext('admin-a', {
    role: 'admin',
    collegeId: COLLEGE_A,
  })
}

function principalContext() {
  return testEnv.authenticatedContext('principal-a', {
    role: 'principal',
    collegeId: COLLEGE_A,
  })
}

function superadminContext() {
  return testEnv.authenticatedContext('platform-root', { role: 'superadmin' })
}

// Faculty of the OTHER college, whose uid also owns one row in college A —
// exercises the owner branch of the curriculum mapping rules.
function facultyBContext() {
  return testEnv.authenticatedContext('faculty-b', {
    role: 'faculty',
    collegeId: COLLEGE_B,
  })
}

describe('student identity and profile isolation', () => {
  it('resolves the provisioned profile by canonical userId', async () => {
    const db = studentContext().firestore()
    const result = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'students'),
          where('userId', '==', STUDENT_UID),
          limit(1)
        )
      )
    )
    assert.equal(result.size, 1)
    assert.equal(result.docs[0].id, STUDENT_ID)
  })

  it('allows the own profile and denies another student profile', async () => {
    const db = studentContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'students', STUDENT_ID)))
    await assertFails(getDoc(doc(db, 'students', OTHER_STUDENT_ID)))
    await assertFails(getDoc(doc(db, 'colleges', COLLEGE_A, 'students', 'A002')))
  })

  it('requires server code for profile mutations', async () => {
    const db = studentContext().firestore()
    await assertFails(updateDoc(doc(db, 'students', STUDENT_ID), { name: 'Changed in browser' }))
  })
})

describe('login provisioning paths these rules gate', () => {
  // Each case here is a bug that was only visible as "the login is broken".
  // They are rules-level because the app cannot fix them from the client.
  function collegeAdminContext() {
    return testEnv.authenticatedContext('admin-a', { role: 'admin', collegeId: COLLEGE_A })
  }

  it('allows a student-scoped list but never an unbounded one', async () => {
    const db = studentContext().firestore()
    const mine = await assertSucceeds(
      getDocs(query(collection(db, 'students'), where('userId', '==', STUDENT_UID)))
    )
    assert.equal(mine.size, 1)
    // A student must not be able to sweep the collection to discover ids.
    await assertFails(getDocs(query(collection(db, 'students'), limit(10))))
  })

  it('lets an account with no role claim find its own faculty profile', async () => {
    // Sign-in identity resolution runs a `where('uid','==',auth.uid)` query. If
    // `faculty` list were staff-only, an imported account whose claim has not
    // been issued yet could not even discover who it is — the exact state a
    // half-finished import leaves behind.
    const db = testEnv.authenticatedContext('legacy-faculty-a', {
      email: 'legacy-faculty@example.edu',
    }).firestore()
    const byUid = await assertSucceeds(
      getDocs(query(collection(db, 'faculty'), where('uid', '==', 'legacy-faculty-a')))
    )
    assert.equal(byUid.size, 1)
    const byEmail = await assertSucceeds(
      getDocs(query(collection(db, 'faculty'), where('email', '==', 'legacy-faculty@example.edu')))
    )
    assert.equal(byEmail.size, 1)
    // Still no ability to list the rest of the college.
    await assertFails(getDocs(query(collection(db, 'faculty'), limit(10))))
  })

  it('refuses to store a credential on a student profile', async () => {
    const db = collegeAdminContext().firestore()
    await assertFails(
      setDoc(doc(db, 'students', 'student-with-password'), {
        userId: 'student-auth-d',
        name: 'Credential Carrier',
        collegeId: COLLEGE_A,
        regNo: 'A004',
        password: 'Temp!1234567',
      })
    )
    // The same row without credential material is the supported shape: the
    // password belongs to Firebase Authentication, not to a readable document.
    await assertSucceeds(
      setDoc(doc(db, 'students', 'student-with-password'), {
        userId: 'student-auth-d',
        name: 'Credential Carrier',
        collegeId: COLLEGE_A,
        regNo: 'A004',
      })
    )
  })

  it('refuses a role field smuggled onto a student profile', async () => {
    const db = collegeAdminContext().firestore()
    await assertFails(
      setDoc(doc(db, 'students', 'student-forged-role'), {
        userId: 'student-auth-e',
        name: 'Forged',
        collegeId: COLLEGE_A,
        regNo: 'A005',
        role: 'superadmin',
      })
    )
  })
})

describe('student academic reads', () => {
  it('reads only attendance belonging to the canonical domain student ID', async () => {
    const db = studentContext().firestore()
    const own = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'attendanceRecords'),
          where('collegeId', '==', COLLEGE_A),
          where('studentId', '==', STUDENT_ID),
          orderBy('date', 'desc')
        )
      )
    )
    assert.equal(own.size, 1)
    await assertFails(getDoc(doc(db, 'attendanceRecords', 'attendance-other')))
  })

  it('reads same-college timetable rows but not another college timetable', async () => {
    const db = studentContext().firestore()
    const schedule = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'weeklySchedules'),
          where('collegeId', '==', COLLEGE_A),
          where('branch', '==', 'B.Com')
        )
      )
    )
    assert.equal(schedule.size, 1)
    await assertFails(getDoc(doc(db, 'weeklySchedules', 'schedule-b')))
  })

  it('denies students direct access to authoring assignments, questions, and papers', async () => {
    const db = studentContext().firestore()
    await assertFails(getDoc(doc(db, 'assignments', 'assignment-a')))
    await assertFails(getDoc(doc(db, 'questions', 'question-a')))
    await assertFails(getDoc(doc(db, 'papers', 'paper-a')))
  })

  it('keeps students out of test authoring and answer keys, but lets each read their own attempt', async () => {
    const db = studentContext().firestore()
    // Authoring and answer keys stay staff-only.
    await assertFails(getDoc(doc(db, 'scheduledTests', 'test-a')))
    await assertFails(getDoc(doc(db, 'scheduledTests', 'test-a', 'assessmentQuestions', 'q-0001')))
    // A student reads their own attempt (how the portal shows results), but not
    // another student's, and never writes one.
    await assertSucceeds(getDoc(doc(db, 'studentAssessments', 'test-a_student-domain-a')))
    await assertFails(getDoc(doc(db, 'studentAssessments', 'test-a_student-domain-b')))
    await assertFails(setDoc(doc(db, 'studentAssessments', 'forged-attempt'), {
      collegeId: COLLEGE_A,
      studentId: STUDENT_ID,
      marksObtained: 100,
    }))
  })

  it('allows same-college faculty to review tests and attempts but not mutate authoritative state', async () => {
    const db = facultyContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'scheduledTests', 'test-a')))
    await assertSucceeds(getDoc(doc(db, 'scheduledTests', 'test-a', 'assessmentQuestions', 'q-0001')))
    const attempt = doc(db, 'studentAssessments', 'test-a_student-domain-a')
    await assertSucceeds(getDoc(attempt))
    await assertFails(updateDoc(attempt, { marksObtained: 100 }))
  })

  it('allows only the student to read a finalized submission and denies browser writes', async () => {
    const ownDb = studentContext().firestore()
    const otherDb = testEnv.authenticatedContext(OTHER_UID, {
      role: 'student',
      collegeId: COLLEGE_A,
    }).firestore()
    const submission = doc(ownDb, 'submissions', 'assignment-a_student-domain-a')
    await assertSucceeds(getDoc(submission))
    await assertFails(getDoc(doc(otherDb, 'submissions', 'assignment-a_student-domain-a')))
    await assertFails(updateDoc(submission, { remarks: 'browser mutation' }))
  })

  it('reads only the student’s published official grade records', async () => {
    const db = studentContext().firestore()
    const grades = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'gradeRecords'),
          where('collegeId', '==', COLLEGE_A),
          where('studentId', '==', STUDENT_ID),
          where('status', '==', 'published'),
          orderBy('semester', 'desc')
        )
      )
    )
    assert.equal(grades.size, 1)
    await assertFails(getDoc(doc(db, 'gradeRecords', 'grade-other')))
    await assertFails(getDoc(doc(db, 'gradeRecords', 'grade-own-draft')))
  })

  it('allows same-college faculty to read authoring records but denies direct assignment lifecycle writes', async () => {
    const db = facultyContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'questions', 'question-a')))
    await assertSucceeds(getDoc(doc(db, 'papers', 'paper-a')))
    await assertSucceeds(getDoc(doc(db, 'assignments', 'assignment-a')))
    await assertFails(updateDoc(doc(db, 'assignments', 'assignment-a'), { status: 'graded' }))
    await assertFails(setDoc(doc(db, 'assignments', 'forged-assignment'), {
      collegeId: COLLEGE_A,
      facultyUid: 'faculty-a',
      status: 'published',
      title: 'Unvalidated assignment',
    }))
    await assertFails(updateDoc(doc(db, 'gradeRecords', 'grade-own-draft'), {
      status: 'published',
    }))
    await assertFails(updateDoc(doc(db, 'papers', 'paper-a'), {
      verificationStatus: 'rejected-by-hod',
      status: 'draft',
    }))
    await assertFails(setDoc(doc(db, 'papers', 'forged-published-paper'), {
      collegeId: COLLEGE_A,
      createdBy: 'faculty-a',
      status: 'published',
      verificationStatus: 'approved-by-hod',
      title: 'Forged publication',
    }))
  })
})

describe('faculty topic planner (facultyTopics)', () => {
  it('lets a faculty member list, create, update, and delete their own topics', async () => {
    const db = facultyContext().firestore()

    // The page's first query: owned rows only, keyed by the signed-in uid.
    const own = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'facultyTopics'),
          where('facultyId', '==', 'faculty-a')
        )
      )
    )
    assert.equal(own.size, 1)
    assert.equal(own.docs[0].id, 'topic-own')

    const created = await assertSucceeds(
      addDoc(collection(db, 'facultyTopics'), {
        facultyId: 'faculty-a',
        title: 'Quadratic equations',
        subject: 'Mathematics',
        status: 'planned',
        createdAt: '2026-09-03T09:00:00.000Z',
      })
    )
    await assertSucceeds(updateDoc(created, { status: 'completed' }))
    await assertSucceeds(deleteDoc(created))
  })

  it('refuses topics stamped with, or handed to, another faculty id', async () => {
    const db = facultyContext().firestore()

    await assertFails(addDoc(collection(db, 'facultyTopics'), {
      facultyId: 'faculty-b',
      title: 'Forged ownership',
      subject: 'Mathematics',
      status: 'planned',
      createdAt: '2026-09-03T09:00:00.000Z',
    }))
    // Re-parenting an owned row onto someone else is denied too.
    await assertFails(updateDoc(doc(db, 'facultyTopics', 'topic-own'), {
      facultyId: 'faculty-b',
    }))
  })

  it('denies a faculty member updating or deleting another faculty topic', async () => {
    const db = facultyContext().firestore()
    await assertFails(updateDoc(doc(db, 'facultyTopics', 'topic-other'), { title: 'Hijacked' }))
    await assertFails(deleteDoc(doc(db, 'facultyTopics', 'topic-other')))
  })

  it('keeps students and claim-less accounts out of the planner', async () => {
    const studentDb = studentContext().firestore()
    await assertFails(
      getDocs(
        query(
          collection(studentDb, 'facultyTopics'),
          where('facultyId', '==', 'faculty-a')
        )
      )
    )
    await assertFails(getDoc(doc(studentDb, 'facultyTopics', 'topic-own')))
    await assertFails(addDoc(collection(studentDb, 'facultyTopics'), {
      facultyId: 'faculty-a',
      title: 'Student-authored topic',
      subject: 'Mathematics',
      status: 'planned',
      createdAt: '2026-09-03T09:00:00.000Z',
    }))

    // No role/collegeId claims: staff access is claim-only, so even a faculty
    // profile document must not open the planner.
    const legacyDb = testEnv
      .authenticatedContext('legacy-faculty-a', { email: 'legacy-faculty@example.edu' })
      .firestore()
    await assertFails(
      getDocs(
        query(
          collection(legacyDb, 'facultyTopics'),
          where('facultyId', '==', 'legacy-faculty-a')
        )
      )
    )
  })
})

describe('staff (faculty) attendance', () => {
  // The collection the faculty "My Attendance" page writes and the principal's
  // Faculty Attendance tab reads. Ownership is the whole security story: a
  // teacher marks their own day, the people who run the college read everyone's.
  //
  // `isStaff()` is deliberately NOT the college-wide read gate — it includes
  // faculty and mentors, so it would let any teacher list every colleague's
  // attendance. The first test below is the one that would catch that.
  function ownDay(collegeId = COLLEGE_A, uid = 'faculty-a', date = '2026-09-01') {
    return `${collegeId}__${uid}__${date}`
  }

  function principalContext(collegeId = COLLEGE_A) {
    return testEnv.authenticatedContext(`principal-${collegeId}`, {
      role: 'principal',
      collegeId,
    })
  }

  it('lets a faculty member read and mark only their own day', async () => {
    const db = facultyContext().firestore()

    // The page's own-month query: scoped to the signed-in uid.
    const mine = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'staffAttendance'),
          where('facultyId', '==', 'faculty-a'),
          where('date', '>=', '2026-09-01'),
          where('date', '<=', '2026-09-30')
        )
      )
    )
    assert.equal(mine.size, 1)
    assert.equal(mine.docs[0].id, ownDay())

    await assertSucceeds(getDoc(doc(db, 'staffAttendance', ownDay())))

    // Writing a NEW day for yourself, at the deterministic id.
    await assertSucceeds(
      setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-02')), {
        collegeId: COLLEGE_A,
        facultyId: 'faculty-a',
        facultyName: 'Faculty A',
        date: '2026-09-02',
        month: '2026-09',
        status: 'present',
        source: 'self',
        markedBy: 'faculty-a',
      })
    )
    // Correcting an existing day of your own.
    await assertSucceeds(updateDoc(doc(db, 'staffAttendance', ownDay()), { status: 'late' }))
  })

  it('refuses a record stamped with another faculty id', async () => {
    const db = facultyContext().firestore()

    // Marking someone else present/absent is the forgery this collection most
    // needs to prevent.
    await assertFails(
      setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-b', '2026-09-02')), {
        collegeId: COLLEGE_A,
        facultyId: 'faculty-b',
        facultyName: 'Faculty B',
        date: '2026-09-02',
        month: '2026-09',
        status: 'absent',
        source: 'self',
        markedBy: 'faculty-a',
      })
    )

    // So is re-parenting your own row onto a colleague, which would move a day
    // of attendance between people without creating a new document.
    await assertFails(updateDoc(doc(db, 'staffAttendance', ownDay()), { facultyId: 'faculty-b' }))

    // And reading or editing theirs directly.
    await assertFails(getDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-b'))))
    await assertFails(updateDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-b')), { status: 'absent' }))
  })

  it('keeps the college-wide list away from ordinary faculty', async () => {
    const db = facultyContext().firestore()
    // The principal's query. A teacher must not be able to run it: the rollup
    // names who is absent, which is exactly what a colleague should not see.
    await assertFails(
      getDocs(query(collection(db, 'staffAttendance'), where('collegeId', '==', COLLEGE_A)))
    )
  })

  it('reserves deletion for admin and principal', async () => {
    // A teacher cannot delete their own history either — a day of attendance is
    // payroll-relevant, so removing one is a management action.
    await assertFails(deleteDoc(doc(facultyContext().firestore(), 'staffAttendance', ownDay())))

    const hodDb = testEnv
      .authenticatedContext('hod-a', { role: 'hod', collegeId: COLLEGE_A })
      .firestore()
    await assertFails(deleteDoc(doc(hodDb, 'staffAttendance', ownDay())))

    await assertSucceeds(deleteDoc(doc(principalContext().firestore(), 'staffAttendance', ownDay())))
  })

  it('gives management the college rollup but not another college\'s', async () => {
    const db = principalContext().firestore()

    // Exercise the exact date-range and month query shapes used by
    // staffAttendanceApi, not just a simplified college-only approximation.
    const collegeA = await assertSucceeds(
      getDocs(query(
        collection(db, 'staffAttendance'),
        where('collegeId', '==', COLLEGE_A),
        where('date', '>=', '2026-09-01'),
        where('date', '<=', '2026-09-30')
      ))
    )
    assert.equal(collegeA.size, 2)
    const collegeAMonth = await assertSucceeds(
      getDocs(query(
        collection(db, 'staffAttendance'),
        where('collegeId', '==', COLLEGE_A),
        where('month', '==', '2026-09')
      ))
    )
    assert.equal(collegeAMonth.size, 2)

    // Tenancy comes from the claim, so the same role in another college sees
    // only its own rows.
    const otherDb = principalContext(COLLEGE_B).firestore()
    await assertFails(getDoc(doc(otherDb, 'staffAttendance', ownDay())))
    const collegeB = await assertSucceeds(
      getDocs(query(collection(otherDb, 'staffAttendance'), where('collegeId', '==', COLLEGE_B)))
    )
    assert.equal(collegeB.size, 1)
  })

  it('lets management correct a record but not move it between people', async () => {
    const db = principalContext().firestore()
    await assertSucceeds(updateDoc(doc(db, 'staffAttendance', ownDay()), { status: 'absent', source: 'admin' }))
    await assertFails(updateDoc(doc(db, 'staffAttendance', ownDay()), { facultyId: 'faculty-b' }))
  })

  it('keeps students and claim-less accounts out entirely', async () => {
    const studentDb = studentContext().firestore()
    await assertFails(getDoc(doc(studentDb, 'staffAttendance', ownDay())))
    await assertFails(
      getDocs(query(collection(studentDb, 'staffAttendance'), where('facultyId', '==', 'faculty-a')))
    )

    // No role/collegeId claims: staff access is claim-only, so even a faculty
    // profile document must not open the collection.
    const legacyDb = testEnv
      .authenticatedContext('legacy-faculty-a', { email: 'legacy-faculty@example.edu' })
      .firestore()
    await assertFails(
      getDocs(query(collection(legacyDb, 'staffAttendance'), where('facultyId', '==', 'faculty-a')))
    )
    await assertFails(
      setDoc(doc(legacyDb, 'staffAttendance', ownDay(COLLEGE_A, 'legacy-faculty-a', '2026-09-02')), {
        collegeId: COLLEGE_A,
        facultyId: 'legacy-faculty-a',
        facultyName: 'Legacy Faculty',
        date: '2026-09-02',
        month: '2026-09',
        status: 'present',
        source: 'self',
        markedBy: 'legacy-faculty-a',
      })
    )
  })

  // ─── Stale identity claims (the "My Attendance" production bug) ──────────
  //
  // A faculty token with the correct ROLE claim but a missing or wrong
  // COLLEGE claim can read its own rows (ownership is uid-based and
  // claim-independent) but every write is denied, because writes require
  // the tenant claim (`isCollegeStaff` + `sameCollege`). The rules
  // intentionally keep that requirement: the fix is claim issuance
  // (syncMyIdentity, self-healed by the client), not rule relaxation.
  // These tests pin both halves of that boundary.
  describe('stale identity claims', () => {
    function newDay(collegeId: string, uid: string, date: string) {
      return {
        collegeId,
        facultyId: uid,
        facultyName: 'Faculty A',
        date,
        month: date.slice(0, 7),
        status: 'present',
        source: 'self',
        markedBy: uid,
      }
    }

    it('lets a role-only token read its own history but refuse its writes', async () => {
      // Correct role claim, NO collegeId claim.
      const db = testEnv.authenticatedContext('faculty-a', { role: 'faculty' }).firestore()

      // Ownership reads are claim-independent and must keep working — this
      // is why the symptom is "the month loads, the save fails", not a full
      // lock-out.
      const mine = await assertSucceeds(
        getDocs(
          query(
            collection(db, 'staffAttendance'),
            where('facultyId', '==', 'faculty-a'),
            where('date', '>=', '2026-09-01'),
            where('date', '<=', '2026-09-30')
          )
        )
      )
      assert.equal(mine.size, 1)
      await assertSucceeds(getDoc(doc(db, 'staffAttendance', ownDay())))

      // The get on a not-yet-written deterministic id is denied by design
      // (the rule cannot prove ownership of a document with no data, and
      // widening `get` for it would open ownership probes on another
      // faculty's id space). The client expects this and treats it as
      // "no record yet" — it must not become a real permission failure.
      await assertFails(getDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-03'))))

      // The writes the faculty actually makes: denied until syncMyIdentity
      // re-issues the college claim and the token is force-refreshed.
      await assertFails(
        setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-04')), newDay(COLLEGE_A, 'faculty-a', '2026-09-04'))
      )
      await assertFails(updateDoc(doc(db, 'staffAttendance', ownDay()), { status: 'late' }))
    })

    it('refuses writes when the college claim points at another college', async () => {
      // Correct role claim, collegeId claim for the WRONG college.
      const db = testEnv
        .authenticatedContext('faculty-a', { role: 'faculty', collegeId: COLLEGE_B })
        .firestore()

      // Ownership reads still work (uid-based)…
      await assertSucceeds(
        getDocs(query(collection(db, 'staffAttendance'), where('facultyId', '==', 'faculty-a')))
      )

      // …but the record the UI writes is stamped with the profile's college,
      // which does not match the stale claim — denied, not silently moved
      // across tenants.
      await assertFails(
        setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-05')), newDay(COLLEGE_A, 'faculty-a', '2026-09-05'))
      )
      // And the existing record (college A) cannot be corrected by a token
      // that claims college B.
      await assertFails(updateDoc(doc(db, 'staffAttendance', ownDay()), { status: 'late' }))
    })

    it('lets the repaired token create, update and re-read its own day', async () => {
      // After syncMyIdentity: role AND college claim agree with the profile.
      const db = facultyContext().firestore()

      await assertSucceeds(
        setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-06')), newDay(COLLEGE_A, 'faculty-a', '2026-09-06'))
      )
      await assertSucceeds(updateDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-06')), { status: 'late' }))
      // A get on the now-existing deterministic id is allowed: the document
      // exists and is owned, which is exactly when the single-day prefill
      // must succeed.
      await assertSucceeds(getDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-06'))))
    })

    it('denies cross-college faculty the record, the list and the write', async () => {
      // A correctly-claimed faculty of another college.
      const db = testEnv
        .authenticatedContext('faculty-c', { role: 'faculty', collegeId: COLLEGE_B })
        .firestore()

      await assertFails(getDoc(doc(db, 'staffAttendance', ownDay())))
      await assertFails(
        getDocs(query(collection(db, 'staffAttendance'), where('facultyId', '==', 'faculty-a')))
      )
      await assertFails(
        setDoc(doc(db, 'staffAttendance', ownDay(COLLEGE_A, 'faculty-a', '2026-09-07')), newDay(COLLEGE_A, 'faculty-a', '2026-09-07'))
      )
    })
  })
})

describe('legacy no-claim faculty reads', () => {
  function legacyFacultyContext() {
    // No role/collegeId claims and no users/{uid} document: the account is only
    // a legacy faculty profile. Identity for AUTHORIZATION is claim-only, so
    // staff-scoped reads are denied until identity repair issues claims and the
    // user signs in again. (The profile doc still lets them sign IN — it just
    // cannot authorize a staff query. See current-firestore.rules header.)
    return testEnv.authenticatedContext('legacy-faculty-a', {
      email: 'legacy-faculty@example.edu',
    })
  }

  it('denies staff-scoped queries to a legacy faculty until claims are issued', async () => {
    const db = legacyFacultyContext().firestore()

    // Role comes from the token claim ONLY — a claim-less account must not be
    // able to read staff-only collections by virtue of a client-writable
    // profile document.
    await assertFails(
      getDocs(
        query(
          collection(db, 'weeklySchedules'),
          where('facultyId', '==', 'legacy-faculty-a'),
          limit(100)
        )
      )
    )

    await assertFails(
      getDocs(
        query(
          collection(db, 'classSessions'),
          where('facultyId', '==', 'legacy-faculty-a'),
          limit(100)
        )
      )
    )

    await assertFails(
      getDocs(
        query(
          collection(db, 'assignments'),
          where('collegeId', '==', COLLEGE_A),
          where('facultyUid', '==', 'legacy-faculty-a'),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      )
    )
  })

  it('does not grant legacy faculty implicit superadmin or write access', async () => {
    const db = legacyFacultyContext().firestore()
    await assertFails(updateDoc(doc(db, 'assignments', 'assignment-legacy-a'), {
      status: 'graded',
    }))
    await assertFails(setDoc(doc(db, 'users', 'legacy-faculty-a'), {
      uid: 'legacy-faculty-a',
      role: 'superadmin',
    }))
  })
})

describe('notification identity & access', () => {
  // The direct student read these tests asserted was REMOVED on purpose when
  // the panel was rewired: students now receive their feed through the
  // `getMyNotifications` callable (which resolves batch/branch server-side
  // and can scope per-recipient reads the rules cannot express). Rules for the
  // collection are superadmin+staff only — any browser path a student tries
  // must fail, addressed to their own id or not.
  it('refuses students every direct notification read', async () => {
    const db = studentContext().firestore()
    await assertFails(getDoc(doc(db, 'notifications', 'notif-own')))
    await assertFails(getDoc(doc(db, 'notifications', 'notif-other')))
    await assertFails(getDoc(doc(db, 'notifications', 'notif-broadcast')))
  })

  it('refuses the student notification list query outright', async () => {
    const db = studentContext().firestore()
    await assertFails(
      getDocs(
        query(
          collection(db, 'notifications'),
          where('studentId', '==', STUDENT_ID),
          limit(50)
        )
      )
    )
  })

  it('keeps same-college staff able to read notifications but not students at large', async () => {
    const db = facultyContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'notifications', 'notif-broadcast')))
    await assertSucceeds(getDoc(doc(db, 'notifications', 'notif-own')))
  })
})

describe('legacy Realtime Database lockdown', () => {
  it('denies authenticated reads and writes to legacy data', async () => {
    const database = studentContext().database()
    await assertFails(getDatabaseValue(databaseRef(database, 'students')))
    await assertFails(setDatabaseValue(databaseRef(database, `users/${STUDENT_UID}/role`), 'superadmin'))
  })
})

describe('paper authoring storage', () => {
  it('allows staff uploads only in their tenant and author namespace', async () => {
    const storage = facultyContext().storage()
    const contents = new Uint8Array([37, 80, 68, 70])
    await assertSucceeds(uploadBytes(
      ref(storage, `paper-files/${COLLEGE_A}/faculty-a/paper-new/paper_exam.pdf`),
      contents,
      { contentType: 'application/pdf' }
    ))
    await assertFails(uploadBytes(
      ref(storage, `paper-files/${COLLEGE_B}/faculty-a/paper-new/paper_exam.pdf`),
      contents,
      { contentType: 'application/pdf' }
    ))
    await assertFails(uploadBytes(
      ref(storage, `paper-files/${COLLEGE_A}/other-faculty/paper-new/paper_exam.pdf`),
      contents,
      { contentType: 'application/pdf' }
    ))
  })
})

describe('assignment submission storage', () => {
  it('allows a student to upload only inside their canonical submission path', async () => {
    const storage = studentContext().storage()
    const contents = new Uint8Array([37, 80, 68, 70])

    await assertSucceeds(
      uploadBytes(
        ref(storage, `assignment-submissions/${STUDENT_ID}/assignment-a/session-own/own.pdf`),
        contents,
        { contentType: 'application/pdf' }
      )
    )
    await assertFails(
      uploadBytes(
        ref(storage, `assignment-submissions/${OTHER_STUDENT_ID}/assignment-a/session-other/other.pdf`),
        contents,
        { contentType: 'application/pdf' }
      )
    )
  })

  it('rejects unsupported files and files above the declared limit contract', async () => {
    const storage = studentContext().storage()
    await assertFails(
      uploadBytes(
        ref(storage, `assignment-submissions/${STUDENT_ID}/assignment-a/session-own/script.html`),
        new TextEncoder().encode('<script>alert(1)</script>'),
        { contentType: 'text/html' }
      )
    )
  })
})
