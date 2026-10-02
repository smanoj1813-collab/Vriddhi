import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  EMPLOYEE_GRANTS,
  EMPLOYEE_ROLE,
  employeeAssignmentView,
  employeeClaims,
  employeeHasGrant,
  nextActiveCollegeId,
  normaliseCollegeIds,
  normaliseEmployeeStatus,
  normaliseGrants,
  type PlatformEmployeeRecord,
} from '../src/employeeAccessCore.ts'

function record(overrides: Partial<PlatformEmployeeRecord> = {}): PlatformEmployeeRecord {
  return {
    uid: 'employee-1',
    email: 'employee@vriddhi.example',
    name: 'Platform Employee',
    status: 'active',
    assignedCollegeIds: ['college-a', 'college-b'],
    assignedColleges: [
      { id: 'college-a', name: 'College A', code: 'CA' },
      { id: 'college-b', name: 'College B', code: 'CB' },
    ],
    grants: [...EMPLOYEE_GRANTS],
    activeCollegeId: 'college-a',
    ...overrides,
  }
}

describe('platform employee assignment', () => {
  it('de-duplicates and trims college ids', () => {
    assert.deepEqual(normaliseCollegeIds([' college-a ', 'college-a', '', 'college-b', 42, null]), [
      'college-a',
      'college-b',
    ])
  })

  it('drops unknown grants and falls back to the full academic set', () => {
    assert.deepEqual(normaliseGrants(['schedule', 'PAYROLL', 'grading']), ['schedule', 'grading'])
    assert.deepEqual(normaliseGrants([]), [...EMPLOYEE_GRANTS])
    assert.deepEqual(normaliseGrants(['nonsense']), [...EMPLOYEE_GRANTS])
  })

  it('keeps the active college while it is still assigned, else moves to the first', () => {
    assert.equal(nextActiveCollegeId(['college-a', 'college-b'], 'college-b'), 'college-b')
    assert.equal(nextActiveCollegeId(['college-a', 'college-b'], 'college-c'), 'college-a')
    assert.equal(nextActiveCollegeId([], 'college-a'), null)
  })

  it('issues employee claims scoped to exactly one college', () => {
    const claims = employeeClaims({ status: 'active', activeCollegeId: 'college-b' }, { mustChangePassword: true })
    assert.equal(claims.role, EMPLOYEE_ROLE)
    assert.equal(claims.collegeId, 'college-b')
    assert.equal(claims.employeeStatus, 'active')
    assert.equal(claims.mustChangePassword, true, 'non-identity claims must survive a re-issue')
  })

  it('suspension strips the college scope and flags the status for the rules', () => {
    const claims = employeeClaims({ status: 'suspended', activeCollegeId: 'college-a' })
    assert.equal(claims.role, EMPLOYEE_ROLE)
    assert.equal(claims.collegeId, null)
    assert.equal(claims.employeeStatus, 'suspended')
  })

  it('normalises status and never leaks internal fields to the list view', () => {
    assert.equal(normaliseEmployeeStatus('Suspended'), 'suspended')
    assert.equal(normaliseEmployeeStatus(undefined), 'active')
    const view = employeeAssignmentView(record())
    assert.deepEqual(Object.keys(view).sort(), [
      'activeCollegeId', 'collegeIds', 'colleges', 'email', 'grants', 'name', 'status', 'uid',
    ])
  })

  it('checks academic grants', () => {
    assert.equal(employeeHasGrant(record({ grants: ['grading'] }), 'grading'), true)
    assert.equal(employeeHasGrant(record({ grants: ['grading'] }), 'reports'), false)
  })
})
