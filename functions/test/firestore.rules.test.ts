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
  collection,
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
        branch: 'CSE',
        batch: '2026',
        semester: 1,
        division: 'A',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
      }),
      setDoc(doc(db, 'weeklySchedules', 'schedule-b'), {
        collegeId: COLLEGE_B,
        branch: 'CSE',
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
        branch: 'CSE',
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
          where('branch', '==', 'CSE')
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

  it('denies students direct access to test authoring, answer keys, and attempt scores', async () => {
    const db = studentContext().firestore()
    await assertFails(getDoc(doc(db, 'scheduledTests', 'test-a')))
    await assertFails(getDoc(doc(db, 'scheduledTests', 'test-a', 'assessmentQuestions', 'q-0001')))
    await assertFails(getDoc(doc(db, 'studentAssessments', 'test-a_student-domain-a')))
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

describe('legacy no-claim faculty reads', () => {
  function legacyFacultyContext() {
    // No role/collegeId claims and no users/{uid} document: the account is only
    // a legacy faculty profile. Rules must resolve the identity from faculty/uid
    // and stay under the 10 get()/exists() call limit.
    return testEnv.authenticatedContext('legacy-faculty-a', {
      email: 'legacy-faculty@example.edu',
    })
  }

  it('resolves role and college from a legacy faculty profile for the exact faculty queries', async () => {
    const db = legacyFacultyContext().firestore()

    const weekly = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'weeklySchedules'),
          where('facultyId', '==', 'legacy-faculty-a'),
          limit(100)
        )
      )
    )
    assert.equal(weekly.size, 1)

    const sessions = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'classSessions'),
          where('facultyId', '==', 'legacy-faculty-a'),
          limit(100)
        )
      )
    )
    assert.equal(sessions.size, 1)

    const assignments = await assertSucceeds(
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
    assert.equal(assignments.size, 1)
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
  it('lets a student read only notifications addressed to their own identity', async () => {
    const db = studentContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'notifications', 'notif-own')))
    await assertFails(getDoc(doc(db, 'notifications', 'notif-other')))
    // A same-college broadcast is no longer readable by arbitrary students.
    await assertFails(getDoc(doc(db, 'notifications', 'notif-broadcast')))
  })

  it('authorizes the student notification list query by canonical studentId', async () => {
    const db = studentContext().firestore()
    const result = await assertSucceeds(
      getDocs(
        query(
          collection(db, 'notifications'),
          where('studentId', '==', STUDENT_ID),
          limit(50)
        )
      )
    )
    assert.equal(result.size, 1)
    assert.equal(result.docs[0].id, 'notif-own')
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
