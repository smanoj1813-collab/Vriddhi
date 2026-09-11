// functions/test/selfIdentity.test.ts
//
// Run with: npm --prefix functions run test:unit
//
// Pins the claim-decision table of syncMyIdentity. The production "My
// Attendance: Missing or insufficient permissions" bug came from accounts in
// exactly these shapes: the users document has the role but the token has no
// collegeId claim (or a different one), and legacy accounts that have no
// users document at all. The client now detects the first two by comparing
// role AND collegeId (src/shared/utils/identityClaims.ts); this table is the
// server side of the same contract.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveIdentityTarget, type IdentityLookupFacts } from '../src/selfIdentity.ts'

const COLLEGE_A = 'college-a'

function facts(overrides: Partial<IdentityLookupFacts> = {}): IdentityLookupFacts {
  return {
    hasSuperadminProfile: false,
    usersDoc: null,
    profileDoc: null,
    claimedCollegeId: null,
    ...overrides,
  }
}

describe('resolveIdentityTarget — users document', () => {
  it('uses the users document for role and college', () => {
    const target = resolveIdentityTarget(
      facts({ usersDoc: { role: 'faculty', collegeId: COLLEGE_A } }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'users' })
  })

  it('canonicalises role spellings from the users document', () => {
    const target = resolveIdentityTarget(
      facts({ usersDoc: { role: 'Teacher', collegeId: COLLEGE_A } }),
    )
    assert.equal(target.role, 'faculty')
  })

  it('keeps the token college claim when the users document has no college', () => {
    // Tenancy may legitimately live only on the token: the claim the account
    // already carries is the target, not a reason to loop.
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'faculty' },
        claimedCollegeId: COLLEGE_A,
      }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'claim' })
  })

  it('reports a null college when neither document nor claim carries one', () => {
    const target = resolveIdentityTarget(facts({ usersDoc: { role: 'faculty' } }))
    assert.equal(target.role, 'faculty')
    assert.equal(target.collegeId, null)
  })

  it('ignores a users document whose role is not provisionable', () => {
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'wizard', collegeId: COLLEGE_A },
        profileDoc: { collection: 'faculty', data: { collegeId: COLLEGE_A } },
      }),
    )
    assert.equal(target.role, 'faculty')
    assert.equal(target.source, 'profile')
  })
})

describe('resolveIdentityTarget — profile fallback (legacy accounts)', () => {
  it('fills role AND college from the role profile collection', () => {
    // No users document at all: the shape of faculty accounts provisioned
    // before the users-document work.
    const target = resolveIdentityTarget(
      facts({ profileDoc: { collection: 'faculty', data: { collegeId: COLLEGE_A } } }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'profile' })
  })

  it('keeps the users role and adds the profile college when the users doc lacks one', () => {
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'faculty' },
        profileDoc: { collection: 'faculty', data: { collegeId: COLLEGE_A } },
      }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'users' })
  })

  it('never mints a role from the profile document role field — membership only', () => {
    // A manager can write role: 'hod' on a faculty profile; the fallback must
    // still issue 'faculty', or that field becomes an escalation path.
    const target = resolveIdentityTarget(
      facts({
        profileDoc: {
          collection: 'faculty',
          data: { role: 'hod', collegeId: COLLEGE_A },
        },
      }),
    )
    assert.equal(target.role, 'faculty')
  })

  it('keeps the token college when the profile has none either', () => {
    const target = resolveIdentityTarget(
      facts({
        profileDoc: { collection: 'faculty', data: { name: 'Legacy Faculty' } },
        claimedCollegeId: COLLEGE_A,
      }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'claim' })
  })

  it('supports student profiles the same way', () => {
    const target = resolveIdentityTarget(
      facts({
        profileDoc: { collection: 'students', data: { collegeId: COLLEGE_A } },
      }),
    )
    assert.deepEqual(target, { role: 'student', collegeId: COLLEGE_A, source: 'profile' })
  })
})

describe('resolveIdentityTarget — superadmin', () => {
  it('lets the marker document decide, and strips any college', () => {
    const target = resolveIdentityTarget(
      facts({
        hasSuperadminProfile: true,
        usersDoc: { role: 'superadmin', collegeId: COLLEGE_A },
        claimedCollegeId: COLLEGE_A,
      }),
    )
    assert.deepEqual(target, { role: 'superadmin', collegeId: null, source: 'superadmin' })
  })
})

describe('resolveIdentityTarget — nothing found', () => {
  it('reports no identity when no document exists', () => {
    const target = resolveIdentityTarget(facts())
    assert.deepEqual(target, { role: null, collegeId: null, source: 'none' })
  })

  it('still reports no identity when only a claim exists', () => {
    // A claim with no document behind it is not an identity the self-heal
    // can vouch for; the identity repair (with its full tenant scan) owns
    // that case.
    const target = resolveIdentityTarget(facts({ claimedCollegeId: COLLEGE_A }))
    assert.equal(target.role, null)
  })
})

describe('the two production stale-claim shapes (client/server agreement)', () => {
  it('correct role + missing college claim → server re-issues from the profile', () => {
    // Token: { role: 'faculty' } (no college). Profile: college-a.
    // detectClaimStaleness flags collegeStale; this table says the sync will
    // set { role: 'faculty', collegeId: 'college-a' } → alreadyCorrect false →
    // claims re-issued → force-refreshed token matches.
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'faculty', collegeId: COLLEGE_A },
        claimedCollegeId: null,
      }),
    )
    assert.equal(target.role, 'faculty')
    assert.equal(target.collegeId, COLLEGE_A)
  })

  it('correct role + wrong college claim → server re-issues the profile college', () => {
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'faculty', collegeId: COLLEGE_A },
        claimedCollegeId: 'college-b',
      }),
    )
    assert.equal(target.collegeId, COLLEGE_A)
  })

  it('repaired token/profile agreement → alreadyCorrect, no churn', () => {
    const target = resolveIdentityTarget(
      facts({
        usersDoc: { role: 'faculty', collegeId: COLLEGE_A },
        claimedCollegeId: COLLEGE_A,
      }),
    )
    assert.deepEqual(target, { role: 'faculty', collegeId: COLLEGE_A, source: 'users' })
  })
})
