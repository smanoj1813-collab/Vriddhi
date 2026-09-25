import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decideOfficeStaffAccess } from '../src/officeStaff.ts'
import { normalizeRole, PROVISIONABLE_ROLES } from '../src/identityShared.ts'

describe('office staff roles', () => {
  it('accounts and operations are provisionable canonical roles', () => {
    assert.ok(PROVISIONABLE_ROLES.includes('accounts'))
    assert.ok(PROVISIONABLE_ROLES.includes('operations'))
    assert.equal(normalizeRole('Accounts'), 'accounts')
    assert.equal(normalizeRole(' operations '), 'operations')
  })

  it('only a principal (own college) or superadmin may manage office staff', () => {
    assert.deepEqual(decideOfficeStaffAccess({ callerRole: 'principal', callerCollegeId: 'c1', targetCollegeId: null, targetRole: 'accounts' }), { ok: true, collegeId: 'c1' })
    assert.equal(decideOfficeStaffAccess({ callerRole: 'hod', callerCollegeId: 'c1', targetCollegeId: null, targetRole: 'accounts' }).ok, false)
    assert.equal(decideOfficeStaffAccess({ callerRole: 'admin', callerCollegeId: 'c1', targetCollegeId: null, targetRole: 'operations' }).ok, false)
    assert.equal(decideOfficeStaffAccess({ callerRole: 'accounts', callerCollegeId: 'c1', targetCollegeId: null, targetRole: 'accounts' }).ok, false)
    assert.equal(decideOfficeStaffAccess({ callerRole: 'principal', callerCollegeId: 'c1', targetCollegeId: 'c2', targetRole: 'accounts' }).ok, false)
    assert.equal(decideOfficeStaffAccess({ callerRole: 'principal', callerCollegeId: 'c1', targetCollegeId: null, targetRole: 'hod' }).ok, false)
    assert.deepEqual(decideOfficeStaffAccess({ callerRole: 'superadmin', callerCollegeId: null, targetCollegeId: 'c9', targetRole: 'operations' }), { ok: true, collegeId: 'c9' })
    assert.equal(decideOfficeStaffAccess({ callerRole: 'principal', callerCollegeId: null, targetCollegeId: null, targetRole: 'accounts' }).ok, false)
  })
})
