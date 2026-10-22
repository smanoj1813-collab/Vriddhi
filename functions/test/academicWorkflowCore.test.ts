import test from 'node:test'
import assert from 'node:assert/strict'
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

test('schedule proposal data is tenant-stamped and validates class fields', () => {
  const slot = sanitizeScheduleProposalSlot({
    subject: 'Business Statistics', subjectCode: 'BST101', facultyId: 'fac-1',
    branch: 'B.Com', batch: '2026', semester: 4, division: 'A', section: 'A',
    room: '301', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', type: 'lecture',
  }, 'college-a')
  assert.equal(slot.collegeId, 'college-a')
  assert.equal(slot.dayOfWeek, 'monday')
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, endTime: '08:00' }, 'college-a'), /times/)
  assert.throws(() => sanitizeScheduleProposalSlot({ ...slot, semester: 0 }, 'college-a'), /semester/)
})
