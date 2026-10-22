import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildNadAbcRows, isValidApaarId, normalizeApaarId } from '../src/apaarCore'

describe('apaar validation (server mirror)', () => {
  it('normalises and validates 12 digits', () => {
    assert.equal(normalizeApaarId(' 1234-5678 9012 '), '123456789012')
    assert.equal(isValidApaarId('123456789012'), true)
    assert.equal(isValidApaarId('123'), false)
  })
})

const STUDENTS = [
  { id: 's1', name: 'Ananya Rao', regNo: 'R001', apaarId: '111122223333', dob: '2006-03-15', gender: 'F', course: 'B.Com' },
  { id: 's2', name: 'Vikram', regNo: 'R002', apaarId: '', course: 'B.Com' },
  { id: 's3', name: 'Meena', regNo: 'R003', apaarId: 'bad', course: 'BBA' },
]
const RECORDS = [
  { studentId: 's1', semester: 3, subject: 'Financial Accounting', code: 'FAC201', credits: 4, grade: 'A+', gradePoint: 9, status: 'published' },
  { studentId: 's1', semester: 3, subject: 'Statistics', code: 'STA202', credits: 3, grade: 'F', gradePoint: 0, status: 'published' },
  { studentId: 's1', semester: 3, subject: 'Draft Subject', code: 'DRF', credits: 3, grade: 'A', gradePoint: 8, status: 'draft' },
  { studentId: 's2', semester: 3, subject: 'Financial Accounting', code: 'FAC201', credits: 4, grade: 'B', gradePoint: 6, status: 'published' },
  { studentId: 's3', semester: 1, subject: 'Principles', code: 'PM101', credits: 4, grade: 'A', gradePoint: 8, status: 'published' },
  { studentId: 'ghost', semester: 1, subject: 'Orphan', code: 'ORF', credits: 4, grade: 'A', gradePoint: 8, status: 'published' },
]

describe('buildNadAbcRows', () => {
  it('exports only published records of students with a valid APAAR id', () => {
    const out = buildNadAbcRows(RECORDS, STUDENTS, '2025')
    assert.equal(out.publishedRecords, 5)
    assert.equal(out.rows.length, 2)
    assert.equal(out.rows[0].apaarId, '111122223333')
    assert.equal(out.skipped.length, 3) // s2 missing, s3 invalid, ghost unknown
  })
  it('earns zero credits on fail grades', () => {
    const out = buildNadAbcRows(RECORDS, STUDENTS, '2025')
    const pass = out.rows.find(r => r.courseCode === 'FAC201')
    const fail = out.rows.find(r => r.courseCode === 'STA202')
    assert.equal(pass?.creditsEarned, 4)
    assert.equal(pass?.result, 'Pass')
    assert.equal(fail?.creditsEarned, 0)
    assert.equal(fail?.result, 'Fail')
  })
  it('reports skipped students with record counts', () => {
    const out = buildNadAbcRows(RECORDS, STUDENTS, '2025')
    const vikram = out.skipped.find(s => s.studentId === 's2')
    assert.equal(vikram?.records, 1)
    assert.equal(vikram?.registrationNo, 'R002')
  })
})
