import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isFacultyMentee, normalizeMentorReference, summarizeMenteePerformance, yearsOfService } from './facultyJourney'

describe('faculty journey identities and real metrics', () => {
  const aliases = ['auth-uid', 'FAC001', 'faculty@example.edu', 'Aishwarya V']
  for (const [field, value] of [
    ['mentorId', 'auth-uid'], ['mentorFacultyId', 'FAC001'],
    ['mentor', ' faculty@EXAMPLE.edu '], ['mentorName', '  AISHWARYA    V '],
  ]) {
    it(`matches an assigned mentee through ${field}`, () => assert.equal(isFacultyMentee({ [field]: value }, aliases), true))
  }
  it('never matches empty or unrelated references', () => {
    assert.equal(isFacultyMentee({}, aliases), false)
    assert.equal(isFacultyMentee({ mentor: '' }, ['']), false)
    assert.equal(isFacultyMentee({ mentorId: 'another-uid', mentor: 'Different Faculty' }, aliases), false)
    assert.equal(normalizeMentorReference(undefined), '')
  })
  it('classifies each mentee once, not once per assessment attempt', () => {
    const result = summarizeMenteePerformance(['a', 'b', 'c', 'd'], [
      { studentId: 'a', percentage: 100 }, { studentId: 'a', percentage: 80 },
      { studentId: 'b', percentage: 60 }, { studentId: 'c', percentage: 0 },
    ])
    assert.deepEqual(result.studentPerformanceDistribution, { good: 1, average: 1, weak: 1 })
    assert.equal(result.avgStudentScore, 50) // mean of 90, 60, 0 (not four attempts)
    assert.equal(result.scoredStudentsCount, 3)
    assert.equal(result.ungradedStudentsCount, 1)
  })
  it('keeps missing results unknown and ungraded mentees out of the weak band', () => {
    const result = summarizeMenteePerformance(['a', 'b', 'b'], [])
    assert.equal(result.avgStudentScore, null)
    assert.equal(result.weakStudentsCount, 0)
    assert.equal(result.ungradedStudentsCount, 2)
  })
  it('ignores non-finite, out-of-range and unassigned scores, preserving genuine zero', () => {
    const result = summarizeMenteePerformance(['a'], [
      { studentId: 'a', percentage: Number.NaN }, { studentId: 'a', percentage: Infinity },
      { studentId: 'a', percentage: -1 }, { studentId: 'a', percentage: 101 },
      { studentId: 'other', percentage: 100 }, { studentId: 'a', percentage: 0 },
    ])
    assert.equal(result.avgStudentScore, 0)
    assert.equal(result.scoredStudentsCount, 1)
    assert.equal(result.weakStudentsCount, 1)
  })
  it('uses the documented 60 and 80 boundaries without rounding before classification', () => {
    assert.deepEqual(summarizeMenteePerformance(['a', 'b', 'c'], [
      { studentId: 'a', percentage: 59.99 }, { studentId: 'b', percentage: 79.99 }, { studentId: 'c', percentage: 80 },
    ]).studentPerformanceDistribution, { good: 1, average: 1, weak: 1 })
  })
  for (const date of [undefined, '', 'not-a-date', '2026-02-30', '2026-11-14']) {
    it(`does not invent years of service from ${String(date)}`, () => assert.equal(yearsOfService(date, new Date(2026, 10, 13)), null))
  }
  it('counts completed anniversaries, including a legitimate zero years', () => {
    const now = new Date(2026, 10, 13)
    assert.equal(yearsOfService('2026-11-13', now), 0)
    assert.equal(yearsOfService('2024-11-14', now), 1)
    assert.equal(yearsOfService('2024-11-13', now), 2)
    assert.equal(yearsOfService('2024-11-12', now), 2)
  })
})
