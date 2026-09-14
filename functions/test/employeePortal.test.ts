// functions/test/employeePortal.test.ts
// ─── Internal Employee Portal — pure-helper coverage ────────────────────────
//
// No Firestore emulator in this sandbox, so these tests pin the deterministic
// core: provisioning validation and the password policy, the id schemes,
// attendance validation and the rate maths, the CSV contract, question-bank
// validation, test-duplication maths, audit filters and the college-scope
// authorization decisions (resolveCollegeScope is pure by design).

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ATTENDANCE_STATUSES,
  EMPLOYEE_STATUSES,
  SUPPORTED_QUESTION_TYPES,
  attendanceDocId,
  buildBackfillRow,
  attendanceToCsvRow,
  buildCsv,
  buildDuplicateTestDoc,
  buildQuestionDoc,
  csvEscape,
  employeeDocId,
  employeeToCsvRow,
  istTodayKey,
  isValidDateKey,
  maskEmail,
  parseAuditFilters,
  questionDocId,
  summarizeAttendance,
  validateAttendancePayload,
  validateDuplicateWindow,
  validateEmployeePayload,
  validatePasswordPolicy,
  validateQuestionPayload,
  buildEmployeeUpdate,
} from '../src/employeePortal'
import { buildAuditEntry, resolveCollegeScope, type CallerContext } from '../src/authorization'

const adminCaller: CallerContext = {
  uid: 'admin-uid', email: 'admin@college.edu', name: 'Admin One',
  role: 'admin', collegeId: 'col-1', fromClaims: true,
}
const superCaller: CallerContext = {
  uid: 'super-uid', email: 'root@vriddhi.app', name: 'Root',
  role: 'superadmin', collegeId: null, fromClaims: true,
}

describe('employeeDocId', () => {
  it('is deterministic per college+email and tolerates casing/whitespace', () => {
    const a = employeeDocId('col-1', ' Ravi.K@College.edu ')
    const b = employeeDocId('col-1', 'ravi.k@college.edu')
    assert.equal(a, b)
    assert.equal(a, 'emp_col-1__ravi_k_college_edu')
  })

  it('keeps colleges apart for the same email', () => {
    assert.notEqual(employeeDocId('col-1', 'a@b.edu'), employeeDocId('col-2', 'a@b.edu'))
  })

  it('sanitises characters Firestore document ids dislike', () => {
    const id = employeeDocId('col/1', 'a+b@c.edu')
    assert.equal(id.includes('/'), false)
  })
})

describe('validatePasswordPolicy', () => {
  it('accepts a strong password', () => {
    assert.deepEqual(validatePasswordPolicy('Str0ng!Passw0rd'), [])
  })

  it('rejects short, simple and symbol-free passwords', () => {
    assert.ok(validatePasswordPolicy('Ab1!x').length > 0)                 // too short
    assert.ok(validatePasswordPolicy('alllowercase1!aaaa').length > 0)    // no uppercase
    assert.ok(validatePasswordPolicy('ALLUPPERCASE1!AAAA').length > 0)    // no lowercase
    assert.ok(validatePasswordPolicy('NoDigitsHere!!aa').length > 0)      // no digit
    assert.ok(validatePasswordPolicy('NoSymbols12345aa').length > 0)      // no symbol
  })
})

describe('validateEmployeePayload', () => {
  const valid = {
    email: 'Ravi@College.edu',
    name: 'Ravi Kumar',
    role: 'faculty',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '+91 98450 12345',
    employmentType: 'full-time',
    joiningDate: '2026-06-01',
    qualification: 'M.Tech CSE',
  }

  it('normalises email/role and passes a complete row', () => {
    const result = validateEmployeePayload(valid)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.value.email, 'ravi@college.edu')
      assert.equal(result.value.role, 'faculty')
      assert.equal(result.value.employmentType, 'full-time')
    }
  })

  it('defaults employmentType when omitted', () => {
    const result = validateEmployeePayload({ ...valid, employmentType: undefined })
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.employmentType, 'full-time')
  })

  it('rejects a bad email, missing name and unknown role together', () => {
    const result = validateEmployeePayload({ email: 'nope', name: 'x', role: 'dean' })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.errors.length, 3)
  })

  it('rejects a non-calendar joiningDate (Date would roll 2026-02-30 over)', () => {
    const result = validateEmployeePayload({ ...valid, joiningDate: '2026-02-30' })
    assert.equal(result.ok, false)
  })

  it('rejects junk phone numbers', () => {
    assert.equal(validateEmployeePayload({ ...valid, phone: 'call-me' }).ok, false)
  })

  it('only offers employee roles — never student or superadmin', () => {
    for (const role of ['student', 'superadmin', 'parent']) {
      assert.equal(validateEmployeePayload({ ...valid, role }).ok, false)
    }
    for (const role of ['faculty', 'hod', 'mentor', 'principal', 'admin']) {
      assert.equal(validateEmployeePayload({ ...valid, role }).ok, true)
    }
  })
})

describe('buildEmployeeUpdate', () => {
  it('keeps only the allow-listed HR fields', () => {
    const out = buildEmployeeUpdate({
      name: 'New Name', role: 'principal', email: 'hack@x.edu', collegeId: 'col-2',
      uid: 'someone-else', status: 'inactive', department: 'ECE',
    })
    assert.deepEqual(Object.keys(out).sort(), ['department', 'name'])
  })

  it('validates joiningDate and passes clean values through', () => {
    assert.deepEqual(buildEmployeeUpdate({ joiningDate: '2026-01-15' }), { joiningDate: '2026-01-15' })
    assert.throws(() => buildEmployeeUpdate({ joiningDate: '15/01/2026' }))
  })
})

describe('date keys', () => {
  it('accepts real calendar dates only', () => {
    assert.equal(isValidDateKey('2026-09-14'), true)
    assert.equal(isValidDateKey('2024-02-29'), true)
    assert.equal(isValidDateKey('2026-02-30'), false)
    assert.equal(isValidDateKey('2026-9-4'), false)
    assert.equal(isValidDateKey('09/14/2026'), false)
    assert.equal(isValidDateKey(20260914), false)
  })

  it('computes the IST day regardless of the host timezone', () => {
    // 2026-09-14T20:00:00Z is 2026-09-15 01:30 in IST — the next day.
    assert.equal(istTodayKey(new Date('2026-09-14T20:00:00Z')), '2026-09-15')
    // 2026-09-14T17:00:00Z is 2026-09-14 22:30 in IST — still the same day.
    assert.equal(istTodayKey(new Date('2026-09-14T17:00:00Z')), '2026-09-14')
  })
})

describe('attendance validation', () => {
  const valid = { employeeUid: 'uid-123', date: '2026-09-13', status: 'present', checkIn: '09:05', checkOut: '17:30' }

  it('accepts a complete present row', () => {
    const result = validateAttendancePayload(valid, '2026-09-14')
    assert.equal(result.ok, true)
  })

  it('accepts every status the product knows', () => {
    for (const status of ATTENDANCE_STATUSES) {
      assert.equal(validateAttendancePayload({ ...valid, status }, '2026-09-14').ok, true)
    }
  })

  it('refuses future dates — attendance is history, not prophecy', () => {
    assert.equal(validateAttendancePayload({ ...valid, date: '2026-09-15' }, '2026-09-14').ok, false)
  })

  it('refuses check-out at or before check-in and non-24h times', () => {
    assert.equal(validateAttendancePayload({ ...valid, checkOut: '09:05' }, '2026-09-14').ok, false)
    assert.equal(validateAttendancePayload({ ...valid, checkIn: '9:05' }, '2026-09-14').ok, false)
    assert.equal(validateAttendancePayload({ ...valid, checkOut: '25:00' }, '2026-09-14').ok, false)
  })

  it('requires an employee uid', () => {
    assert.equal(validateAttendancePayload({ ...valid, employeeUid: '' }, '2026-09-14').ok, false)
  })

  it('builds one deterministic id per employee-day', () => {
    const id = attendanceDocId('col-1', 'uid-123', '2026-09-13')
    assert.equal(id, 'att_col-1__uid-123__2026-09-13')
    assert.equal(id, attendanceDocId('col-1', 'uid-123', '2026-09-13'))
  })
})

describe('summarizeAttendance', () => {
  it('counts statuses and weights half-days at 0.5, excluding leave from the rate', () => {
    const summary = summarizeAttendance([
      { status: 'present' }, { status: 'present' }, { status: 'late' },
      { status: 'half-day' }, { status: 'absent' }, { status: 'leave' },
    ])
    assert.equal(summary.total, 6)
    assert.equal(summary.present, 2)
    assert.equal(summary.late, 1)
    assert.equal(summary.halfDay, 1)
    assert.equal(summary.absent, 1)
    assert.equal(summary.leave, 1)
    // countable = 5, weighted = 2 + 1 + 0.5 = 3.5 → 70%
    assert.equal(summary.attendanceRate, 70)
  })

  it('reports 0% (not NaN) when everything is leave or the set is empty', () => {
    assert.equal(summarizeAttendance([]).attendanceRate, 0)
    assert.equal(summarizeAttendance([{ status: 'leave' }]).attendanceRate, 0)
  })
})

describe('CSV contract', () => {
  it('quotes values containing commas, quotes or newlines', () => {
    assert.equal(csvEscape('plain'), 'plain')
    assert.equal(csvEscape('a,b'), '"a,b"')
    assert.equal(csvEscape('say "hi"'), '"say ""hi"""')
    assert.equal(csvEscape('line\nbreak'), '"line\nbreak"')
    assert.equal(csvEscape(null), '')
  })

  it('joins with CRLF, ends with a newline and keeps header order', () => {
    const csv = buildCsv(['A', 'B'], [[1, 'x'], [2, 'y,z']])
    assert.equal(csv, 'A,B\r\n1,x\r\n2,"y,z"\r\n')
  })

  it('maps an employee row onto the documented header order', () => {
    const row = employeeToCsvRow({
      id: 'emp_1', name: 'Ravi', email: 'r@x.edu', role: 'faculty', department: 'CSE',
      designation: 'AP', employmentType: 'full-time', joiningDate: '2026-01-01',
      phone: '999', qualification: 'MTech', status: 'active',
    })
    assert.equal(row.length, 11)
    assert.equal(row[0], 'emp_1')
    assert.equal(row[10], 'active')
  })

  it('maps an attendance row onto the documented header order', () => {
    const row = attendanceToCsvRow({
      date: '2026-09-13', employeeName: 'Ravi', employeeEmail: 'r@x.edu',
      department: 'CSE', status: 'present', checkIn: '09:00', checkOut: '17:00',
      note: '', source: 'self',
    })
    assert.equal(row.length, 9)
    assert.equal(row[0], '2026-09-13')
    assert.equal(row[8], 'self')
  })
})

describe('validateQuestionPayload', () => {
  const mcq = {
    text: 'What is 2 + 2?', type: 'mcq', difficulty: 'easy', subject: 'Mathematics', marks: 1,
    options: [
      { id: 'a', text: '3', isCorrect: false },
      { id: 'b', text: '4', isCorrect: true },
    ],
  }

  it('accepts a well-formed MCQ and derives correctAnswer from the options', () => {
    const result = validateQuestionPayload(mcq)
    assert.equal(result.ok, true)
    if (result.ok) {
      assert.equal(result.value.correctAnswer, 'b')
      assert.equal(result.value.status, 'active')
    }
  })

  it('reads the legacy questionText alias', () => {
    const result = validateQuestionPayload({ ...mcq, text: undefined, questionText: 'What is 2 + 2?' })
    assert.equal(result.ok, true)
  })

  it('demands exactly one correct option for single-choice MCQs', () => {
    const two = { ...mcq, options: [{ id: 'a', text: '4', isCorrect: true }, { id: 'b', text: '4', isCorrect: true }] }
    assert.equal(validateQuestionPayload(two).ok, false)
  })

  it('allows several correct options for multi_select', () => {
    const multi = {
      ...mcq, type: 'multi_select',
      options: [{ id: 'a', text: '4', isCorrect: true }, { id: 'b', text: 'IV', isCorrect: true }],
    }
    const result = validateQuestionPayload(multi)
    assert.equal(result.ok, true)
    if (result.ok) assert.equal(result.value.correctAnswer, 'a,b')
  })

  it('needs ≥2 options and one correct answer for optioned types', () => {
    assert.equal(validateQuestionPayload({ ...mcq, options: [{ id: 'a', text: '4', isCorrect: true }] }).ok, false)
    assert.equal(validateQuestionPayload({
      ...mcq,
      options: [{ id: 'a', text: '4', isCorrect: false }, { id: 'b', text: '5', isCorrect: false }],
    }).ok, false)
  })

  it('requires correctAnswer for free-response types', () => {
    const short = { text: 'Explain photosynthesis.', type: 'short_answer', subject: 'Biology', marks: 5 }
    assert.equal(validateQuestionPayload(short).ok, false)
    assert.equal(validateQuestionPayload({ ...short, correctAnswer: 'Light → chemical energy' }).ok, true)
  })

  it('bounds marks and rejects unknown types/difficulties', () => {
    assert.equal(validateQuestionPayload({ ...mcq, marks: 0 }).ok, false)
    assert.equal(validateQuestionPayload({ ...mcq, marks: 101 }).ok, false)
    assert.equal(validateQuestionPayload({ ...mcq, type: 'essay' }).ok, false)
    assert.equal(validateQuestionPayload({ ...mcq, difficulty: 'nightmare' }).ok, false)
    assert.ok(SUPPORTED_QUESTION_TYPES.includes('assertion_reason'))
  })

  it('buildQuestionDoc stamps tenancy and authorship server-side', () => {
    const result = validateQuestionPayload({
      ...mcq, collegeId: 'evil-college', createdBy: 'someone-else',
    })
    assert.equal(result.ok, true)
    if (result.ok) {
      const doc = buildQuestionDoc(result.value, { collegeId: 'col-1', createdBy: 'uid-1', createdByName: 'Ravi' })
      assert.equal(doc.collegeId, 'col-1')
      assert.equal(doc.createdBy, 'uid-1')
      // Compatibility aliases the older UI paths read.
      assert.equal(doc.content, doc.text)
      assert.equal(doc.questionText, doc.text)
      assert.equal(doc.questionType, 'mcq')
    }
  })
})

describe('test duplication', () => {
  const now = Date.parse('2026-09-14T06:00:00Z')

  it('accepts a future window that fits the duration', () => {
    const result = validateDuplicateWindow({
      startDateTime: '2026-09-20T04:00:00Z',
      endDateTime: '2026-09-20T06:00:00Z',
      durationMinutes: 90,
    }, now)
    assert.equal(result.ok, true)
  })

  it('rejects past starts, inverted windows and over-long durations', () => {
    assert.equal(validateDuplicateWindow({
      startDateTime: '2026-09-01T04:00:00Z', endDateTime: '2026-09-01T06:00:00Z', durationMinutes: 60,
    }, now).ok, false)
    assert.equal(validateDuplicateWindow({
      startDateTime: '2026-09-20T06:00:00Z', endDateTime: '2026-09-20T04:00:00Z', durationMinutes: 60,
    }, now).ok, false)
    assert.equal(validateDuplicateWindow({
      startDateTime: '2026-09-20T04:00:00Z', endDateTime: '2026-09-20T05:00:00Z', durationMinutes: 90,
    }, now).ok, false)
    assert.equal(validateDuplicateWindow({
      startDateTime: '2026-09-20T04:00:00Z', endDateTime: '2026-09-20T12:00:00Z', durationMinutes: 481,
    }, now).ok, false)
  })

  it('copies settings but drops the original run state', () => {
    const source = {
      id: 'test-1', title: 'Midterm 1', paperId: 'paper-9', collegeId: 'col-1',
      facultyId: 'old-faculty', facultyName: 'Old Name', visibility: 'public',
      passingMarks: 20, totalMarks: 50, totalQuestions: 10,
      status: 'completed', totalRegistered: 120, totalStarted: 118, totalSubmitted: 115,
      publishedAt: 'when', cancelledAt: null,
    }
    const doc = buildDuplicateTestDoc(source, {
      startMs: Date.parse('2026-09-20T04:00:00Z'),
      endMs: Date.parse('2026-09-20T06:00:00Z'),
      durationMinutes: 90,
    }, { facultyId: 'new-faculty', facultyName: 'New Name' })

    // Copied through
    assert.equal(doc.paperId, 'paper-9')
    assert.equal(doc.passingMarks, 20)
    assert.equal(doc.visibility, 'public')
    // Reset for the new run
    assert.equal(doc.status, 'scheduled')
    assert.equal(doc.totalRegistered, 0)
    assert.equal(doc.totalStarted, 0)
    assert.equal(doc.totalSubmitted, 0)
    assert.equal(doc.publishedAt, undefined)
    assert.equal(doc.cancelledAt, undefined)
    // Re-owned and linked back to the source
    assert.equal(doc.facultyId, 'new-faculty')
    assert.equal(doc.sourceTestId, 'test-1')
    assert.equal(doc.title, 'Midterm 1 (Copy)')
    assert.equal((doc.startDateTime as Date).toISOString(), '2026-09-20T04:00:00.000Z')
    assert.equal(doc.durationMinutes, 90)
  })

  it('uses an explicit title when given', () => {
    const doc = buildDuplicateTestDoc(
      { id: 't', title: 'Original' },
      { startMs: 0, endMs: 1, durationMinutes: 1 },
      { title: 'Retest Batch B', facultyId: 'f', facultyName: 'F' }
    )
    assert.equal(doc.title, 'Retest Batch B')
  })

  it('numbers copied questions with the schedule-time id scheme', () => {
    assert.equal(questionDocId(1), 'q-0001')
    assert.equal(questionDocId(42), 'q-0042')
  })
})

describe('audit helpers', () => {
  it('clamps the page size and drops malformed date filters', () => {
    const filters = parseAuditFilters({ limit: 5000, from: 'not-a-date', to: '2026-09-14' })
    assert.equal(filters.limit, 200)
    assert.equal(filters.from, '')
    assert.equal(filters.to, '2026-09-14')
    assert.equal(parseAuditFilters({}).limit, 50)
  })

  it('masks emails down to first char + domain', () => {
    assert.equal(maskEmail('ravi.kumar@college.edu'), 'r***@college.edu')
    assert.equal(maskEmail(''), '***')
  })

  it('buildAuditEntry strips anything credential-shaped from details', () => {
    const entry = buildAuditEntry({
      action: 'employee.provision',
      actorUid: 'a1',
      details: { role: 'faculty', temporaryPassword: 'hunter2', apiToken: 'xyz', department: 'CSE' },
    })
    const details = entry.details as Record<string, unknown>
    assert.deepEqual(Object.keys(details).sort(), ['department', 'role'])
  })

  it('lowercases target emails and caps field lengths', () => {
    const entry = buildAuditEntry({
      action: 'x'.repeat(200),
      actorUid: 'a1',
      targetEmail: ' Ravi@College.EDU ',
    })
    assert.equal(String(entry.action).length, 80)
    assert.equal(entry.targetEmail, 'ravi@college.edu')
  })
})

describe('buildBackfillRow — directory backfill mapping', () => {
  it('maps a complete faculty profile onto a directory row', () => {
    const row = buildBackfillRow({
      uid: 'uid-1', email: ' Ravi@College.EDU ', firstName: 'Ravi', lastName: 'Kumar',
      role: 'Faculty', department: 'CSE', designation: 'AP', collegeName: 'Vriddhi',
      status: 'active', joiningDate: '2025-01-15',
    }, 'col-1')
    assert.ok(row)
    assert.equal(row!.id, 'emp_col-1__ravi_college_edu')
    assert.equal(row!.name, 'Ravi Kumar')       // firstName+lastName fallback
    assert.equal(row!.email, 'ravi@college.edu')
    assert.equal(row!.role, 'faculty')          // canonicalised from "Faculty"
    assert.equal(row!.backfilled, true)
    assert.equal(row!.joiningDate, '2025-01-15')
  })

  it('prefers an explicit name and keeps the inactive flag', () => {
    const row = buildBackfillRow({
      uid: 'uid-2', email: 'x@y.edu', name: 'Full Name', firstName: 'Ignored',
      status: 'inactive',
    }, 'col-1')
    assert.equal(row!.name, 'Full Name')
    assert.equal(row!.status, 'inactive')
    assert.equal(row!.employmentType, 'full-time')
  })

  it('refuses profiles that could never carry attendance or an id', () => {
    assert.equal(buildBackfillRow({ email: 'x@y.edu' }, 'col-1'), null)          // no uid
    assert.equal(buildBackfillRow({ uid: 'u1' }, 'col-1'), null)                  // no email
    assert.equal(buildBackfillRow({ uid: 'u1', email: 'nope' }, 'col-1'), null)   // bad email
  })

  it('drops an unknown role back to faculty and a bad joiningDate to empty', () => {
    const row = buildBackfillRow({
      uid: 'u1', email: 'x@y.edu', role: 'dean', joiningDate: '15/01/2025',
    }, 'col-1')
    assert.equal(row!.role, 'faculty')
    assert.equal(row!.joiningDate, '')
  })
})

describe('resolveCollegeScope — backend authorization', () => {
  it('pins college staff to their claim even when the client disagrees', () => {
    assert.equal(resolveCollegeScope(adminCaller, 'col-1'), 'col-1')
    assert.equal(resolveCollegeScope(adminCaller, undefined), 'col-1')
    assert.throws(() => resolveCollegeScope(adminCaller, 'col-2'), /own college/)
  })

  it('lets superadmins target any college but forces an explicit choice', () => {
    assert.equal(resolveCollegeScope(superCaller, 'col-9'), 'col-9')
    assert.equal(resolveCollegeScope(superCaller, undefined), null)
    assert.throws(() => resolveCollegeScope(superCaller, undefined, { required: true }), /collegeId is required/)
  })

  it('rejects a collegeless account when a college is required', () => {
    const orphan: CallerContext = { ...adminCaller, collegeId: null, fromClaims: false }
    assert.throws(() => resolveCollegeScope(orphan, undefined, { required: true }), /not attached to a college/)
  })

  it('employee lifecycle statuses are the product vocabulary', () => {
    assert.deepEqual([...EMPLOYEE_STATUSES], ['active', 'inactive', 'suspended'])
  })
})
