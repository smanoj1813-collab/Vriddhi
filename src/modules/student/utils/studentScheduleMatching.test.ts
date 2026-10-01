import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { scheduleMatchesStudentDocument } from './studentScheduleMatching'

const profile = {
  collegeId: 'college-1',
  branch: 'BBA',
  batch: '2027',
  semester: 4,
  division: 'B',
  section: '',
}

const student = {
  collegeId: 'college-1',
  department: 'b.b.a',
  batch: 2027,
  semester: '4',
  division: '',
  section: 'Div B',
}

describe('student timetable cohort matching', () => {
  it('shows a merged division class to every covered student', () => {
    assert.equal(scheduleMatchesStudentDocument({
      collegeId: 'college-1',
      branch: 'BBA',
      batch: '2026-2027',
      semester: 4,
      division: 'A,B',
      subject: 'Financial Accounting',
    }, student, profile), true)
  })

  it('does not show the merged class to a division outside its scope', () => {
    const outside = { ...student, section: '', division: 'C' }
    const outsideProfile = { ...profile, division: 'C' }
    assert.equal(scheduleMatchesStudentDocument({
      branch: 'BBA', batch: '2027', semester: 4, division: 'A,B', subject: 'Accounting',
    }, outside, outsideProfile), false)
  })

  it('keeps blank-scope whole-batch classes visible to all matching divisions', () => {
    assert.equal(scheduleMatchesStudentDocument({
      branch: 'BBA', batch: '2027', semester: 4, division: '', section: '', subject: 'Accounting',
    }, student, profile), true)
  })

  it('accepts section-only student and schedule scope and ignores display punctuation', () => {
    assert.equal(scheduleMatchesStudentDocument({
      branch: 'B.B.A', batch: '2027', semester: 4, division: '', section: 'A,B', subject: 'Accounting',
    }, { ...student, section: 'B', division: '' }, { ...profile, division: '', section: 'B' }), true)
  })
})
