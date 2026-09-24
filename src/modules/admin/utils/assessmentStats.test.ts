// src/modules/admin/utils/assessmentStats.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)
//
// Pins computeAssessmentStats — the aggregation that replaced the all-zeros
// stub behind the Admin → Assessments stat cards. Adding a future dimension is
// a one-line `bump()` in the source; add a case here to lock its behaviour.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeAssessmentStats } from './assessmentStats'
import type { Assessment } from '../types/assessment'

function a(overrides: Partial<Assessment>): Assessment {
  return { id: 'x', title: 'T', status: 'draft', ...overrides } as Assessment
}

const NOW = new Date('2026-09-24T12:00:00.000Z')

describe('computeAssessmentStats', () => {
  it('counts total and per-status buckets', () => {
    const s = computeAssessmentStats(
      [
        a({ id: '1', status: 'draft' }),
        a({ id: '2', status: 'draft' }),
        a({ id: '3', status: 'published' }),
        a({ id: '4', status: 'active' }),
        a({ id: '5', status: 'completed' }),
        a({ id: '6', status: 'archived' }),
      ],
      NOW,
    )
    assert.equal(s.totalAssessments, 6)
    assert.equal(s.draftCount, 2)
    assert.equal(s.publishedCount, 1)
    assert.equal(s.activeCount, 1)
    assert.equal(s.completedCount, 1)
    assert.equal(s.archivedCount, 1)
    assert.equal(s.activeAssessments, 1)
    assert.equal(s.completedAssessments, 1)
  })

  it('returns zeroed counts for an empty list (no NaN, no throw)', () => {
    const s = computeAssessmentStats([], NOW)
    assert.equal(s.totalAssessments, 0)
    assert.equal(s.draftCount, 0)
    assert.deepEqual(s.byStatus, {})
  })

  it('keeps unknown statuses visible under byStatus', () => {
    const s = computeAssessmentStats([a({ id: '1', status: 'weird' })], NOW)
    assert.equal(s.totalAssessments, 1)
    assert.deepEqual(s.byStatus, { weird: 1 })
    // None of the named buckets move for an unrecognised status.
    assert.equal(s.draftCount, 0)
    assert.equal(s.archivedCount, 0)
  })

  it('buckets by type, branch, semester and batch', () => {
    const s = computeAssessmentStats(
      [
        a({ id: '1', type: 'mcq', branch: 'BCom', semester: 1, batch: '2027' }),
        a({ id: '2', type: 'mcq', branch: 'BCom', semester: 1, batch: '2027' }),
        a({ id: '3', type: 'essay', branch: 'BA', semester: 2, batch: '2026' }),
      ],
      NOW,
    )
    assert.deepEqual(s.byType, { mcq: 2, essay: 1 })
    assert.deepEqual(s.byBranch, { BCom: 2, BA: 1 })
    assert.deepEqual(s.bySemester, { '1': 2, '2': 1 })
    assert.deepEqual(s.byBatch, { '2027': 2, '2026': 1 })
  })

  it('splits scheduled dates into upcoming vs ongoing relative to now', () => {
    const s = computeAssessmentStats(
      [
        a({ id: '1', scheduledDate: '2026-09-25T00:00:00.000Z' }), // future
        a({ id: '2', scheduledDate: '2026-09-20T00:00:00.000Z' }), // past
        a({ id: '3' }), // no date
        a({ id: '4', scheduledDate: 'not-a-date' }), // unparseable
      ],
      NOW,
    )
    assert.equal(s.upcomingCount, 1)
    assert.equal(s.ongoingCount, 1)
  })
})
