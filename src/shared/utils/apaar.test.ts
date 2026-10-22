// Run with: npm run test:unit (node --import tsx --test)
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { apaarCompleteness, apaarDuplicates, apaarWorklist, formatApaarId, isValidApaarId, normalizeApaarId } from './apaar'

describe('APAAR id normalisation & validation', () => {
  it('strips spaces and hyphens', () => {
    assert.equal(normalizeApaarId('1234 5678-9012'), '123456789012')
    assert.equal(normalizeApaarId(null), '')
    assert.equal(normalizeApaarId(undefined), '')
  })
  it('accepts exactly 12 digits', () => {
    assert.equal(isValidApaarId('123456789012'), true)
    assert.equal(isValidApaarId('1234 5678 9012'), true)
    assert.equal(isValidApaarId('12345678901'), false) // 11
    assert.equal(isValidApaarId('1234567890123'), false) // 13
    assert.equal(isValidApaarId(''), false)
    assert.equal(isValidApaarId('APAAR123456'), false)
  })
  it('formats for display only when complete', () => {
    assert.equal(formatApaarId('123456789012'), '1234 5678 9012')
    assert.equal(formatApaarId('12345'), '12345')
  })
})

const STUDENTS = [
  { id: 'a', apaarId: '111122223333', semester: 3, course: 'B.Com' },
  { id: 'b', apaarId: '1111 2222 4444', semester: 3, course: 'B.Com' },
  { id: 'c', apaarId: '', semester: 3, course: 'BBA' },
  { id: 'd', apaarId: '12345', semester: 5, department: 'BBA' },
  { id: 'e', semester: 5, branch: 'B.Sc' },
  { id: 'f', apaarId: '111122223333', semester: 5, course: 'B.Sc' },
]

describe('apaarCompleteness', () => {
  it('rolls up totals, missing, invalid and percent', () => {
    const c = apaarCompleteness(STUDENTS)
    assert.equal(c.total, 6)
    assert.equal(c.withValidId, 3)
    assert.equal(c.withInvalidId, 1)
    assert.equal(c.missing, 2)
    assert.equal(c.percent, 50)
  })
  it('breaks down by semester and programme', () => {
    const c = apaarCompleteness(STUDENTS)
    assert.deepEqual(c.bySemester.map(s => [s.semester, s.withValidId, s.total]), [[3, 2, 3], [5, 1, 3]])
    const bcom = c.byProgramme.find(p => p.programme === 'B.Com')
    assert.equal(bcom?.percent, 100)
  })
  it('handles the empty college', () => {
    const c = apaarCompleteness([])
    assert.equal(c.percent, 0)
    assert.equal(c.total, 0)
  })
})

describe('apaarWorklist & duplicates', () => {
  it('splits missing vs invalid', () => {
    const w = apaarWorklist(STUDENTS)
    assert.deepEqual(w.missing.map(s => s.id), ['c', 'e'])
    assert.deepEqual(w.invalid.map(s => s.id), ['d'])
  })
  it('flags the same valid ID on two students', () => {
    const dups = apaarDuplicates(STUDENTS)
    assert.equal(dups.length, 1)
    assert.deepEqual(dups[0].studentIds, ['a', 'f'])
  })
})
