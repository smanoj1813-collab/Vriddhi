// Unit tests for the pure claim surgery behind clearMyMustChangePassword.
// The callable itself is thin (self-only by construction: it reads
// request.auth.uid and never accepts a target), so the risk lives in the
// claim copy — dropping or mutating any other claim would silently strip a
// user's role or college scope.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { stripMustChangePassword } from '../src/identityShared'

test('stripMustChangePassword removes only the mustChangePassword claim', () => {
  const claims = {
    role: 'operations',
    collegeId: 'PZIg0HN9vG2kMo4Sb0YM',
    mustChangePassword: true,
  }
  const next = stripMustChangePassword(claims)
  assert.deepEqual(next, { role: 'operations', collegeId: 'PZIg0HN9vG2kMo4Sb0YM' })
  // The original object must not be mutated (it is the live customClaims record).
  assert.equal(claims.mustChangePassword, true)
})

test('stripMustChangePassword is a no-op copy when the flag is absent', () => {
  const claims = { role: 'student', collegeId: 'c1' }
  const next = stripMustChangePassword(claims)
  assert.deepEqual(next, claims)
  assert.notEqual(next, claims) // still a fresh object
})

test('stripMustChangePassword tolerates null/undefined claims', () => {
  assert.deepEqual(stripMustChangePassword(null), {})
  assert.deepEqual(stripMustChangePassword(undefined), {})
})

test('stripMustChangePassword preserves identity: false flags and custom claims', () => {
  const claims = {
    role: 'faculty',
    mustChangePassword: false,
    collegeId: 'c2',
    department: 'Commerce',
  }
  const next = stripMustChangePassword(claims)
  assert.deepEqual(next, { role: 'faculty', collegeId: 'c2', department: 'Commerce' })
})
