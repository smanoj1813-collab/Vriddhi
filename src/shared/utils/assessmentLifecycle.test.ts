import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  effectiveScheduledAssessmentStatus,
  isStudentAssessmentActionable,
  withEffectiveStudentAssessmentLifecycle,
} from './assessmentLifecycle'

const now = Date.parse('2026-09-20T12:00:00Z')

describe('assessment lifecycle guards', () => {
  it('shows an ended ongoing test as completed immediately', () => {
    assert.equal(effectiveScheduledAssessmentStatus({
      status: 'ongoing',
      startDateTime: '2026-09-18T09:00:00Z',
      endDateTime: '2026-09-18T10:00:00Z',
    }, now), 'completed')
  })

  it('does not offer Start Test for an expired card even if stale flags say available', () => {
    assert.equal(isStudentAssessmentActionable({
      status: 'available',
      canStart: true,
      endDateTime: '2026-09-18T10:00:00Z',
    }, now), false)
  })

  it('keeps an active card actionable', () => {
    assert.equal(isStudentAssessmentActionable({
      status: 'available',
      canStart: true,
      endDateTime: '2026-09-20T13:00:00Z',
    }, now), true)
  })

  it('moves a stale expired card out of the active tab and clears its actions', () => {
    assert.deepEqual(withEffectiveStudentAssessmentLifecycle({
      id: 'test-1', status: 'ongoing', canStart: false, canResume: true,
      endDateTime: '2026-09-18T10:00:00Z',
    }, now), {
      id: 'test-1', status: 'completed', canStart: false, canResume: false,
      endDateTime: '2026-09-18T10:00:00Z',
    })
  })
})
