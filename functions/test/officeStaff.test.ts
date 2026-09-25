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

  it('only a superadmin may manage office staff', () => {
    assert.deepEqual(decideOfficeStaffAccess({ callerRole: 'superadmin', targetCollegeId: 'c9' }), { ok: true, collegeId: 'c9' })
    assert.deepEqual(decideOfficeStaffAccess({ callerRole: 'SuperAdmin', targetCollegeId: 'c1' }), { ok: true, collegeId: 'c1' })
    for (const role of ['principal', 'admin', 'hod', 'accounts', 'operations', 'faculty', ''])
      assert.equal(decideOfficeStaffAccess({ callerRole: role, targetCollegeId: 'c1' }).ok, false, role)
    assert.equal(decideOfficeStaffAccess({ callerRole: 'superadmin', targetCollegeId: null }).ok, false)
  })
})
