import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { evaluatePromotion, liveBacklogs, normalizePolicy, DEFAULT_PROMOTION_POLICY, type GradeLite } from '../src/promotionCore'

const pass = (code: string, sem = 3): GradeLite => ({ subjectCode: code, subjectName: code, semester: sem, grade: 'A', gradePoint: 8, result: 'Pass', createdAt: '2026-06-01' })
const fail = (code: string, sem = 3): GradeLite => ({ subjectCode: code, subjectName: code, semester: sem, grade: 'F', gradePoint: 0, result: 'Fail', createdAt: '2026-06-01' })

describe('liveBacklogs', () => {
  it('lists only subjects whose latest attempt failed', () => {
    const rows = liveBacklogs([
      fail('BCA301'), pass('BCA302'), fail('BCA303'),
      { ...pass('BCA301'), createdAt: '2026-09-01' }, // cleared later
    ])
    assert.deepEqual(rows.map(r => r.subjectCode), ['BCA303'])
  })
})

describe('evaluatePromotion', () => {
  it('promotes a clear student', () => {
    const v = evaluatePromotion({ semester: 3, status: 'Active' }, [pass('A'), pass('B')], DEFAULT_PROMOTION_POLICY)
    assert.equal(v.action, 'promote'); assert.equal(v.toSemester, 4)
  })
  it('detains beyond the carryover limit, promotes within it', () => {
    const many = ['A', 'B', 'C', 'D', 'E'].map(c => fail(c))
    assert.equal(evaluatePromotion({ semester: 3 }, many, { ...DEFAULT_PROMOTION_POLICY, maxBacklogsToPromote: 4 }).action, 'detain')
    assert.equal(evaluatePromotion({ semester: 3 }, many.slice(0, 4), DEFAULT_PROMOTION_POLICY).action, 'promote')
  })
  it('final semester graduates only when all clear', () => {
    assert.equal(evaluatePromotion({ semester: 6 }, [pass('A', 6)], DEFAULT_PROMOTION_POLICY).action, 'graduate')
    const v = evaluatePromotion({ semester: 6 }, [fail('A', 6)], DEFAULT_PROMOTION_POLICY)
    assert.equal(v.action, 'repeat_final')
    assert.equal(evaluatePromotion({ semester: 6 }, [fail('A', 6)], { ...DEFAULT_PROMOTION_POLICY, requireAllClearForGraduation: false }).action, 'graduate')
  })
  it('skips non-active students', () => {
    assert.equal(evaluatePromotion({ semester: 3, status: 'Alumni' }, [], DEFAULT_PROMOTION_POLICY).action, 'skip')
    assert.equal(evaluatePromotion({ semester: 3, status: 'Dropped' }, [], DEFAULT_PROMOTION_POLICY).action, 'skip')
  })
  it('normalizes policy inputs', () => {
    assert.deepEqual(normalizePolicy({}), DEFAULT_PROMOTION_POLICY)
    assert.equal(normalizePolicy({ maxBacklogsToPromote: 99 }).maxBacklogsToPromote, 40)
    assert.equal(normalizePolicy({ programmeSemesters: 8 }).programmeSemesters, 8)
  })
})
