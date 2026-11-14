import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { sameAttendancePayload } from './attendanceWritePlan'
import { sameFirestoreValue } from '@/shared/utils/firestoreEquality'

describe('attendance change plan', () => {
  const record = { status: 'present', studentId: 's-1', name: 'Student', note: 'Excused', subject: 'Math', date: '2026-11-13', updatedAt: 'old', markedAt: 'old' }
  it('preserves audit times on an otherwise unchanged re-save', () => {
    assert.equal(sameAttendancePayload(record, { ...record, updatedAt: 'new', markedAt: 'new' }), true)
  })
  it('never suppresses meaningful reporting or identity corrections', () => {
    for (const field of ['status', 'studentId', 'name', 'note', 'subject', 'date']) assert.equal(sameAttendancePayload(record, { ...record, [field]: 'changed' }), false)
    assert.equal(sameAttendancePayload(undefined, record), false)
  })
  it('preserves unrelated fields and compares nested records regardless of key order', () => {
    assert.equal(sameAttendancePayload({ note: '', records: [{ name: 'A', status: 'present' }], extra: 'keep' }, { records: [{ status: 'present', name: 'A' }], note: '' }), true)
  })
  it('canonical equality distinguishes nulls, order and changes to timestamp nanos', () => {
    assert.equal(sameFirestoreValue({ x: undefined, data: { a: 1, b: 2 } }, { data: { b: 2, a: 1 } }), true)
    assert.equal(sameFirestoreValue({ x: null }, {}), false)
    assert.equal(sameFirestoreValue([1, 2], [2, 1]), false)
    const stamp = (nanos: number) => ({ seconds: 1, nanoseconds: nanos, toMillis: () => 1000 })
    assert.equal(sameFirestoreValue(stamp(0), stamp(1)), false)
  })
})
