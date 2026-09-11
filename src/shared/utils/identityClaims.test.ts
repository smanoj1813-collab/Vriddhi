// src/shared/utils/identityClaims.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the self-heal trigger: the client must flag exactly the tokens that
// syncMyIdentity (functions/src/selfIdentity.ts) would re-issue — role OR
// collegeId claim missing or wrong — without flagging healthy tokens (which
// would loop the self-heal) or healthy no-college accounts.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  canonicalizeRole,
  detectClaimStaleness,
  isPermissionDeniedError,
  staleClaimMessage,
} from './identityClaims'

describe('canonicalizeRole', () => {
  it('case-folds and trims canonical roles', () => {
    assert.equal(canonicalizeRole(' Faculty '), 'faculty')
    assert.equal(canonicalizeRole('HOD'), 'hod')
    assert.equal(canonicalizeRole('student'), 'student')
  })

  it('maps legacy spellings onto the canonical role', () => {
    assert.equal(canonicalizeRole('Teacher'), 'faculty')
    assert.equal(canonicalizeRole('head of department'), 'hod')
    assert.equal(canonicalizeRole('Super Admin'), 'superadmin')
  })

  it('returns an empty string for nothing recognisable', () => {
    assert.equal(canonicalizeRole(undefined), '')
    assert.equal(canonicalizeRole(''), '')
    assert.equal(canonicalizeRole('wizard'), '')
  })
})

describe('detectClaimStaleness — role claim', () => {
  const faculty = { role: 'faculty', collegeId: 'college-a' }

  it('flags a missing role claim', () => {
    const check = detectClaimStaleness({ collegeId: 'college-a' }, faculty)
    assert.equal(check.stale, true)
    assert.equal(check.roleStale, true)
    assert.equal(check.collegeStale, false)
  })

  it('flags a different role claim', () => {
    const check = detectClaimStaleness({ role: 'student', collegeId: 'college-a' }, faculty)
    assert.equal(check.stale, true)
    assert.equal(check.roleStale, true)
  })

  it('recognises an aliased role claim as the same role', () => {
    const check = detectClaimStaleness({ role: 'Teacher', collegeId: 'college-a' }, faculty)
    assert.equal(check.stale, false)
  })

  it('does not flag a correct role claim', () => {
    const check = detectClaimStaleness({ role: 'faculty', collegeId: 'college-a' }, faculty)
    assert.equal(check.stale, false)
  })
})

describe('detectClaimStaleness — college claim (the production bug)', () => {
  const faculty = { role: 'faculty', collegeId: 'college-a' }

  it('flags a missing college claim when the role is correct', () => {
    // Role claim correct, college claim never issued: the state the old
    // role-only check missed, which is why the self-heal never ran.
    const check = detectClaimStaleness({ role: 'faculty' }, faculty)
    assert.equal(check.stale, true)
    assert.equal(check.roleStale, false)
    assert.equal(check.collegeStale, true)
    assert.equal(check.expectedCollegeId, 'college-a')
  })

  it('flags a college claim that differs from the profile', () => {
    const check = detectClaimStaleness({ role: 'faculty', collegeId: 'college-b' }, faculty)
    assert.equal(check.stale, true)
    assert.equal(check.collegeStale, true)
  })

  it('does not flag a matching college claim', () => {
    const check = detectClaimStaleness({ role: 'faculty', collegeId: 'college-a' }, faculty)
    assert.equal(check.stale, false)
  })

  it('keeps a token college claim that the profile never contradicts', () => {
    // Neither the users document nor the profile carries a college; the
    // target is whatever the token already has — including "nothing".
    const student = { role: 'student', collegeId: null }
    assert.equal(detectClaimStaleness({ role: 'student' }, student).stale, false)
    assert.equal(
      detectClaimStaleness({ role: 'student', collegeId: 'college-c' }, student).stale,
      false,
    )
  })

  it('flags a college the token carries but the profile overrides', () => {
    const check = detectClaimStaleness({ role: 'faculty', collegeId: 'college-b' }, faculty)
    assert.equal(check.collegeStale, true)
    assert.equal(check.expectedCollegeId, 'college-a')
  })
})

describe('detectClaimStaleness — superadmin', () => {
  const superadmin = { role: 'superadmin', collegeId: null }

  it('does not require a college claim for superadmin', () => {
    assert.equal(detectClaimStaleness({ role: 'superadmin' }, superadmin).stale, false)
  })

  it('treats a stray college claim on a superadmin as stale', () => {
    // syncMyIdentity writes collegeId: null for superadmins, so a tenant
    // claim on the governing account is itself a defect.
    const check = detectClaimStaleness({ role: 'superadmin', collegeId: 'college-a' }, superadmin)
    assert.equal(check.stale, true)
    assert.equal(check.collegeStale, true)
    assert.equal(check.expectedCollegeId, null)
  })
})

describe('isPermissionDeniedError', () => {
  it('recognises Firebase permission denials', () => {
    assert.equal(isPermissionDeniedError({ code: 'permission-denied' }), true)
    assert.equal(isPermissionDeniedError(new Error('Missing or insufficient permissions')), true)
  })

  it('does not flag unrelated failures', () => {
    assert.equal(isPermissionDeniedError(new Error('Network request failed')), false)
    assert.equal(isPermissionDeniedError({ code: 'unavailable' }), false)
    assert.equal(isPermissionDeniedError(null), false)
  })
})

describe('staleClaimMessage', () => {
  it('is actionable: names the fix, not the error code', () => {
    const text = staleClaimMessage('save')
    assert.match(text, /sign out and sign back in/i)
    assert.match(text, /Identity Repair/i)
    assert.doesNotMatch(text, /Missing or insufficient permissions/)
  })
})
