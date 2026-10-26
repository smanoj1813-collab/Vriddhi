import test from 'node:test'
import assert from 'node:assert/strict'
import { selectScheduleReviewer } from '../src/scheduleProposalService'
import {
  canTransitionCurriculumApproval,
  canTransitionScheduleApproval,
  isCurriculumReadyForMapping,
  isScheduleVisibleToStudents,
  sanitizeScheduleProposalSlot,
} from '../src/academicWorkflowCore'

test('curriculum approval allows a Principal decision only while pending', () => {
  assert.equal(canTransitionCurriculumApproval('pending_principal', 'approved'), true)
  assert.equal(canTransitionCurriculumApproval('pending_principal', 'returned'), true)
  assert.equal(canTransitionCurriculumApproval('returned', 'approved'), false)
  assert.equal(canTransitionCurriculumApproval('approved', 'returned'), false)
  assert.equal(canTransitionCurriculumApproval('pending_principal', 'active'), false)
})

test('schedule approval only publishes or returns pending drafts', () => {
  assert.equal(canTransitionScheduleApproval('pending_hod', 'approved'), true)
  assert.equal(canTransitionScheduleApproval('pending_hod', 'returned'), true)
  assert.equal(canTransitionScheduleApproval('returned', 'approved'), false)
  assert.equal(canTransitionScheduleApproval('approved', 'returned'), false)
})

test('legacy curriculum and weekly schedule documents remain live', () => {
  assert.equal(isCurriculumReadyForMapping(undefined), true)
  assert.equal(isScheduleVisibleToStudents(undefined), true)
  assert.equal(isCurriculumReadyForMapping('pending_principal'), false)
  assert.equal(isScheduleVisibleToStudents('pending_hod'), false)
})

test('bulk schedule proposals route to exactly one matching programme HOD', () => {
  const cs = { uid: 'hod-cs', data: { branches: ['Computer Science'] } }
  const commerce = { uid: 'hod-com', data: { department: 'Commerce' } }
  assert.equal(selectScheduleReviewer([cs, commerce], 'Computer Science')?.uid, 'hod-cs')
  assert.equal(selectScheduleReviewer([{ uid: 'legacy', data: {} }], 'B.Com')?.uid, 'legacy')
  assert.equal(selectScheduleReviewer([{ uid: 'one', data: {} }, { uid: 'two', data: {} }], 'B.Com'), null)
  assert.equal(selectScheduleReviewer([cs, { uid: 'duplicate', data: { department: 'Computer Science' } }], 'Computer Science'), null)
})

test('schedule proposal data is tenant-stamped and validates class fields', () => {
  const slot = sanitizeScheduleProposalSlot({
    subject: 'Business Statistics', subjectCode: 'BST101', facultyId: 'fac-1',
    branch: 'B.Com', batch: '2026', semester: 4, division: 'A', section: 'A',
    room: '301', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', type: 'lecture',
    collegeId: 'attacker-college', approvalStatus: 'approved', autoScheduled: true,
    effectiveFrom: '2026-08-01', mappingId: 'mapping-1', moduleQueue: ['1', '2'],
  }, 'college-a')
  assert.equal(slot.collegeId, 'college-a')
  assert.equal(slot.approvalStatus, undefined)
  assert.equal(slot.effectiveFrom, '2026-08-01')
  assert.equal(slot.mappingId, 'mapping-1')
  assert.deepEqual(slot.moduleQueue, ['1', '2'])
  assert.equal(slot.dayOfWeek, 'monday')
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, endTime: '08:00' }, 'college-a'), /times/)
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, semester: 0 }, 'college-a'), /semester/)
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, effectiveFrom: '2026-02-30' }, 'college-a'), /real calendar date/)
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, effectiveFrom: '2026-09-01', effectiveTo: '2026-08-31' }, 'college-a'), /on or after/)
})
