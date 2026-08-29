import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  deterministicGradeRecordId,
  validateDraftGradeRecord,
} from '../src/gradeRecords'

describe('official grade record validation', () => {
  it('normalizes a complete registrar draft', () => {
    assert.deepEqual(validateDraftGradeRecord({
      studentId: 'student-a',
      semester: 3,
      subject: 'Data Structures',
      code: ' cs201 ',
      credits: 4,
      internal: 40,
      external: 50,
      total: 90,
      grade: ' a+ ',
      gradePoint: 10,
    }), {
      studentId: 'student-a',
      semester: 3,
      subject: 'Data Structures',
      code: 'CS201',
      credits: 4,
      internal: 40,
      external: 50,
      total: 90,
      grade: 'A+',
      gradePoint: 10,
    })
  })

  it('rejects inconsistent marks and out-of-range grade points', () => {
    assert.throws(() => validateDraftGradeRecord({
      studentId: 'student-a', semester: 1, subject: 'Physics', code: 'PHY1',
      internal: 30, external: 50, total: 90, grade: 'A', gradePoint: 8,
    }), /Total must equal/)
    assert.throws(() => validateDraftGradeRecord({
      studentId: 'student-a', semester: 1, subject: 'Physics', code: 'PHY1',
      grade: 'A', gradePoint: 11,
    }), /gradePoint must be between/)
  })

  it('uses a stable tenant-qualified identity for one student/course/semester', () => {
    const first = deterministicGradeRecordId('college-a', 'student-a', 2, 'CS102')
    assert.equal(first, deterministicGradeRecordId('college-a', 'student-a', 2, 'CS102'))
    assert.notEqual(first, deterministicGradeRecordId('college-b', 'student-a', 2, 'CS102'))
    assert.match(first, /^[a-f0-9]{64}$/)
  })
})
