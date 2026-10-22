import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  computeSeatCounts, fullOptions, isWindowOpen, normalizeWindows,
  validateSelections, windowMatchesStudent,
} from '../src/registrationCore'

const [win] = normalizeWindows({
  windows: [{
    id: 'sem3-2026', title: 'Sem 3 electives', semester: 3, batches: ['2024-27'], status: 'open',
    opensOn: '2026-10-01', closesOn: '2026-10-31',
    groups: [
      { id: 'dse', label: 'DSC elective', category: 'DSE', choose: 1, programmes: ['BCA'], options: [
        { id: 'ai', code: 'BCA-DSE-3.1', name: 'Artificial Intelligence', capacity: 2 },
        { id: 'ds', code: 'BCA-DSE-3.2', name: 'Data Science', capacity: 0 },
      ] },
      { id: 'oe', label: 'Open elective', category: 'OE', choose: 1, options: [
        { id: 'carnatic', code: 'OE-3.1', name: 'Carnatic Music Basics', capacity: 30 },
        { id: 'journalism', code: 'OE-3.2', name: 'Introduction to Journalism', capacity: 30 },
      ] },
    ],
  }],
})

describe('registration core', () => {
  it('matches windows by semester + batch and honours dates', () => {
    assert.equal(windowMatchesStudent(win, { semester: 3, batch: '2024-27' }), true)
    assert.equal(windowMatchesStudent(win, { semester: 5, batch: '2024-27' }), false)
    assert.equal(isWindowOpen(win, new Date(2026, 9, 15)), true)
    assert.equal(isWindowOpen(win, new Date(2026, 10, 2)), false)
    assert.equal(isWindowOpen({ ...win, status: 'draft' }, new Date(2026, 9, 15)), false)
  })
  it('validates baskets and programme-restricted groups', () => {
    assert.deepEqual(validateSelections(win, 'BCA', { dse: ['ai'], oe: ['journalism'] }), [])
    assert.ok(validateSelections(win, 'BCA', { oe: ['journalism'] }).length >= 1)
    // B.Com student: DSE basket does not apply
    assert.deepEqual(validateSelections(win, 'B.Com', { oe: ['carnatic'] }), [])
    assert.ok(validateSelections(win, 'B.Com', { oe: ['carnatic'], dse: ['ai'] }).length >= 1)
  })
  it('counts seats and flags full options', () => {
    const counts = computeSeatCounts([
      { selections: { dse: ['ai'], oe: ['carnatic'] }, status: 'submitted' },
      { selections: { dse: ['ai'] }, status: 'confirmed' },
      { selections: { dse: ['ai'] }, status: 'rejected' },
    ])
    assert.equal(counts.ai, 2)
    assert.deepEqual(fullOptions(win, { dse: ['ai'] }, counts).map(f => f.optionId), ['ai'])
    assert.deepEqual(fullOptions(win, { dse: ['ds'] }, counts), []) // unlimited
  })
})
