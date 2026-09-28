// src/modules/admin/utils/officeLinkage.test.ts
//
// Run with: npm run test:unit  (node --import tsx --test)
//
// Locks the office-desk diagnosis. The finance and operations portals render an
// empty list when a college-scoped read fails, and the failure used to be
// indistinguishable from "this college has no students" — which sent the
// accounts team to audit student imports when the actual problem was the
// account's college link or an out-of-date ruleset.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  classifyOfficeLinkageFailure,
  describeOfficeEmptyState,
  describeOfficeLinkageFailure,
} from './officeLinkage'

test('an account with no college is reported as unlinked, not as an empty college', () => {
  // The failure this whole module exists for: AuthContext still renders a
  // college name in the header (it reads the profile), the localStorage copy is
  // present, and every tenant read is refused by the rules.
  assert.equal(
    classifyOfficeLinkageFailure({ code: 'permission-denied', message: 'Missing or insufficient permissions.', collegeId: '' }),
    'no-college'
  )
  assert.equal(
    classifyOfficeLinkageFailure({ message: 'This sign-in carries no college to scope fee queries to.' }),
    'no-college'
  )
  assert.equal(
    classifyOfficeLinkageFailure({ code: 'permission-denied', message: 'No college selected. Sign out and back in.' }),
    'no-college'
  )
})

test('a rules refusal is classified separately from an unlinked account', () => {
  // The account IS linked, the claims carry a college, and the read is still
  // refused — an out-of-date ruleset, not a missing link.
  assert.equal(
    classifyOfficeLinkageFailure({ code: 'permission-denied', message: 'Missing or insufficient permissions.', collegeId: 'c1' }),
    'permission-denied'
  )
  assert.equal(
    classifyOfficeLinkageFailure({ code: 'functions/permission-denied', message: 'x', collegeId: 'c1' }),
    'permission-denied'
  )
})

test('a missing composite index is not reported as a permission problem', () => {
  assert.equal(
    classifyOfficeLinkageFailure({
      code: 'failed-precondition',
      message: 'The query requires an index. You can enable it here: …',
      collegeId: 'c1',
    }),
    'missing-index'
  )
})

test('anything else stays unknown rather than being guessed at', () => {
  assert.equal(classifyOfficeLinkageFailure({ code: 'unavailable', message: 'backend down', collegeId: 'c1' }), 'unknown')
  assert.equal(classifyOfficeLinkageFailure({ collegeId: 'c1' }), 'unknown')
})

test('every message names an action, and none of them blames the student data', () => {
  const context = { desk: 'fee ledger', collegeName: 'Vriddhi Demo College' }
  for (const failure of ['no-college', 'permission-denied', 'missing-index', 'unknown'] as const) {
    const message = describeOfficeLinkageFailure(failure, context)
    assert.ok(message.length > 40, `${failure} message is too short to act on`)
    assert.ok(/[.!?]$/.test(message.trim()), `${failure} message should be a sentence`)
  }
  // The unlinked-account copy must point at the account, not at imports.
  const unlinked = describeOfficeLinkageFailure('no-college', context)
  assert.match(unlinked, /not linked to a college/)
  assert.equal(unlinked.includes('Import students'), false)
  // The rules copy must point at a redeploy, because that is the fix that
  // works when signing out does not.
  assert.match(describeOfficeLinkageFailure('permission-denied', context), /deploy|redeploy|redeploy/i)
})

test('the empty state is a different sentence from every failure', () => {
  const empty = describeOfficeEmptyState('students')
  for (const failure of ['no-college', 'permission-denied', 'missing-index', 'unknown'] as const) {
    assert.notEqual(empty, describeOfficeLinkageFailure(failure, { desk: 'fee ledger' }))
  }
  assert.equal(empty, 'No students found.')
  assert.equal(describeOfficeEmptyState('students', 'Vriddhi Demo College'), 'No students found in Vriddhi Demo College.')
})
