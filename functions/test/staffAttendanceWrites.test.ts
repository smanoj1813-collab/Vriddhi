import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideStaffAttendanceWrite,
  staffAttendanceDocId,
  hoursBetween,
  buildAttendanceDocument,
  type StaffAttendanceCaller,
} from '../src/staffAttendanceWrites'

const COLLEGE = 'PZIg0HN9vG2kMo4Sb0YM'
const UID = 'WcScoYaMndh5yXHlFbUIrJTPtqx2'
const DATE = '2026-09-17'

const caller = (over: Partial<StaffAttendanceCaller> = {}): StaffAttendanceCaller => ({
  uid: UID,
  role: 'faculty',
  collegeId: COLLEGE,
  isSuperadmin: false,
  ...over,
})

const input = (over: Record<string, unknown> = {}) => ({
  facultyId: UID,
  collegeId: COLLEGE,
  facultyName: 'AISHWARYA V',
  department: 'BBA',
  date: DATE,
  status: 'present',
  checkIn: '',
  checkOut: '',
  note: '',
  ...over,
})

describe('decideStaffAttendanceWrite — the exact production request', () => {
  it('allows the audited faculty self-mark (uid == facultyId, own college)', () => {
    assert.deepEqual(decideStaffAttendanceWrite(caller(), input()), {
      ok: true,
      facultyId: UID,
      collegeId: COLLEGE,
    })
  })
})

describe('authorization matrix', () => {
  it('faculty may write their own record in their own college', () => {
    assert.equal(decideStaffAttendanceWrite(caller(), input()).ok, true)
  })

  it('faculty may NOT write a colleague record (facultyId != uid)', () => {
    const d = decideStaffAttendanceWrite(caller(), input({ facultyId: 'someone-else' }))
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'not-authorized')
  })

  it('faculty may NOT write into another college', () => {
    const d = decideStaffAttendanceWrite(caller(), input({ collegeId: 'OTHERCOLLEGE' }))
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'not-authorized')
  })

  it('faculty without a college claim is refused (sameCollege fails)', () => {
    const d = decideStaffAttendanceWrite(caller({ collegeId: null }), input())
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'not-authorized')
  })

  it('admin may mark any colleague inside their own college', () => {
    const d = decideStaffAttendanceWrite(caller({ role: 'admin' }), input({ facultyId: 'someone-else' }))
    assert.deepEqual(d, { ok: true, facultyId: 'someone-else', collegeId: COLLEGE })
  })

  it('hod and principal behave like admin inside their own college', () => {
    for (const role of ['hod', 'principal'] as const) {
      const d = decideStaffAttendanceWrite(caller({ role }), input({ facultyId: 'someone-else' }))
      assert.equal(d.ok, true)
    }
  })

  it('management may NOT cross into another college', () => {
    const d = decideStaffAttendanceWrite(caller({ role: 'admin' }), input({ collegeId: 'OTHERCOLLEGE' }))
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'not-authorized')
  })

  it('management without a college claim is refused', () => {
    const d = decideStaffAttendanceWrite(caller({ role: 'admin', collegeId: null }), input())
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'not-authorized')
  })

  it('superadmin may write any record in any college (claim or marker doc)', () => {
    assert.equal(
      decideStaffAttendanceWrite(
        caller({ role: 'superadmin', collegeId: null, isSuperadmin: true }),
        input({ collegeId: 'OTHERCOLLEGE', facultyId: 'anyone' }),
      ).ok,
      true,
    )
    assert.equal(
      decideStaffAttendanceWrite(
        caller({ role: '', collegeId: null, isSuperadmin: true }),
        input({ collegeId: 'OTHERCOLLEGE', facultyId: 'anyone' }),
      ).ok,
      true,
    )
  })

  it('unauthenticated is refused', () => {
    const d = decideStaffAttendanceWrite(caller({ uid: '' }), input())
    assert.equal(d.ok, false)
    if (!d.ok) assert.equal(d.code, 'unauthenticated')
  })

  it('student / unknown roles are refused', () => {
    for (const role of ['student', 'parent', 'mentor', '']) {
      const d = decideStaffAttendanceWrite(caller({ role }), input())
      assert.equal(d.ok, false)
      if (!d.ok) assert.equal(d.code, 'not-authorized')
    }
  })
})

describe('input validation', () => {
  it('rejects malformed dates', () => {
    for (const date of ['17/09/2026', '2026-09-1', '2026-13-40', 'not-a-date', '']) {
      const d = decideStaffAttendanceWrite(caller(), input({ date }))
      assert.equal(d.ok, false)
      if (!d.ok) assert.equal(d.code, 'bad-date')
    }
  })

  it('rejects unknown statuses', () => {
    for (const status of ['Present', 'PRESENT', 'on_duty', 'wfh-remote', '']) {
      const d = decideStaffAttendanceWrite(caller(), input({ status }))
      assert.equal(d.ok, false)
      if (!d.ok) assert.equal(d.code, 'bad-status')
    }
  })

  it('accepts every real status', () => {
    for (const status of ['present', 'late', 'halfday', 'absent', 'leave', 'medical', 'onduty', 'wfh']) {
      assert.equal(decideStaffAttendanceWrite(caller(), input({ status })).ok, true)
    }
  })

  it('rejects path-injection style ids', () => {
    for (const [field, bad] of [
      ['facultyId', 'a/b'],
      ['facultyId', 'a\\b'],
      ['collegeId', '../escape'],
    ] as const) {
      const d = decideStaffAttendanceWrite(caller(), input({ [field]: bad }))
      assert.equal(d.ok, false)
      if (!d.ok)
        assert.equal(d.code, field === 'facultyId' ? 'bad-faculty' : 'bad-college')
    }
  })
})

describe('staffAttendanceDocId', () => {
  it('builds the deterministic id the client and rules contract use', () => {
    assert.equal(staffAttendanceDocId(COLLEGE, UID, DATE), 'PZIg0HN9vG2kMo4Sb0YM__WcScoYaMndh5yXHlFbUIrJTPtqx2__2026-09-17')
  })
})

describe('hoursBetween (server port)', () => {
  it('computes simple spans', () => {
    assert.equal(hoursBetween('09:00', '17:00'), 8)
    assert.equal(hoursBetween('09:30', '10:00'), 0.5)
  })
  it('wraps midnight (night duty)', () => {
    assert.equal(hoursBetween('23:00', '01:00'), 2)
  })
  it('returns 0 for missing/invalid times', () => {
    assert.equal(hoursBetween('', '17:00'), 0)
    assert.equal(hoursBetween('09:00', ''), 0)
    assert.equal(hoursBetween('abc', '17:00'), 0)
    assert.equal(hoursBetween('25:00', '17:00'), 0)
  })
})

describe('buildAttendanceDocument', () => {
  const now = '2026-09-17T17:09:05.000Z'
  it('matches the old client write shape, with server-derived audit fields', () => {
    const doc = buildAttendanceDocument(input(), { facultyId: UID, collegeId: COLLEGE }, caller(), now)
    assert.equal(doc.collegeId, COLLEGE)
    assert.equal(doc.facultyId, UID)
    assert.equal(doc.facultyName, 'AISHWARYA V')
    assert.equal(doc.department, 'BBA')
    assert.equal(doc.date, DATE)
    assert.equal(doc.month, '2026-09')
    assert.equal(doc.status, 'present')
    assert.equal(doc.hoursWorked, 0)
    assert.equal(doc.source, 'self')
    assert.equal(doc.markedBy, UID)
    assert.equal(doc.markedAt, now)
    assert.equal('createdAt' in doc, false)
    assert.equal('updatedAt' in doc, false)
  })
  it('management writes are stamped source=admin with the manager uid', () => {
    const manager = caller({ role: 'admin' })
    const doc = buildAttendanceDocument(
      input({ facultyId: 'someone-else' }),
      { facultyId: 'someone-else', collegeId: COLLEGE },
      manager,
      now,
    )
    assert.equal(doc.source, 'admin')
    assert.equal(doc.markedBy, UID)
    assert.equal(doc.facultyId, 'someone-else')
  })
  it('trims and bounds long free-text', () => {
    const doc = buildAttendanceDocument(
      input({
        facultyName: 'A'.repeat(250) + 'X',
        note: 'y'.repeat(5000),
        department: '',
      }),
      { facultyId: UID, collegeId: COLLEGE },
      caller(),
      now,
    )
    assert.equal(String(doc.facultyName).length, 200)
    assert.equal(String(doc.note).length, 1000)
    assert.equal(doc.department, 'General')
  })
})
