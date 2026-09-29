import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { decideOfficeStaffAccess } from '../src/officeStaff.ts'
import { normalizeRole, PROVISIONABLE_ROLES, hasIdentityProfile } from '../src/identityShared.ts'

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

// An office account is filed ONLY at colleges/{cid}/officeStaff/{uid} — there is
// no users and no superadmins document for it. diagnoseIdentity used to decide
// "does this account have a profile?" from users/superadmins alone, so every
// healthy office account was reported as "No identity profile document exists"
// while the very same report went on to display its valid roster row. That
// self-contradiction reads as a broken identity and invites a superadmin to
// "repair" an account that is already correct.
describe('hasIdentityProfile — office-only accounts', () => {
  it('counts a college office roster row as an identity profile', () => {
    assert.equal(
      hasIdentityProfile({ usersDoc: null, superadminDoc: null, officeRows: [{ role: 'accounts' }] }),
      true,
    )
  })

  it('still reports a truly unprovisioned account as having no profile', () => {
    assert.equal(hasIdentityProfile({ usersDoc: null, superadminDoc: null, officeRows: [] }), false)
  })

  it('accepts a users or superadmins document as before', () => {
    assert.equal(hasIdentityProfile({ usersDoc: { role: 'faculty' }, superadminDoc: null, officeRows: [] }), true)
    assert.equal(hasIdentityProfile({ usersDoc: null, superadminDoc: { uid: 'x' }, officeRows: [] }), true)
  })

  it('does not depend on the roster row carrying any particular fields', () => {
    // The row is the identity anchor; an empty row still proves the account
    // was provisioned onto the roster. Role/college drift is reported by
    // diagnoseIdentity's own issues, not by this question.
    assert.equal(hasIdentityProfile({ usersDoc: null, superadminDoc: null, officeRows: [{}] }), true)
  })
})
