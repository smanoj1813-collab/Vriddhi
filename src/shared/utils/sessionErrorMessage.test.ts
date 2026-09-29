// src/shared/utils/sessionErrorMessage.test.ts
// The copy shown when a class-session callable refuses — the one piece of this
// path a teacher reads, and the piece that was wrong: "Mark topics covered"
// answered a permission failure with "Only college administrators (admin,
// principal, HOD) can generate or cancel class sessions."
//
// Pure module, no Firebase import, so it runs under `npm run test:unit`.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  describeSessionError,
  isSessionPermissionDenied,
  SCHEDULING_MESSAGES,
  serverMessage,
  SESSION_WRITER_MESSAGES,
} from './sessionErrorMessage'

/** What the Firebase v2 SDK hands a caller on an HttpsError. */
function callableError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(`Firebase: ${message} (${code}).`), { code })
}

describe('session error copy', () => {
  it('never tells a teacher that marking topics is admin-only', () => {
    const err = callableError(
      'functions/permission-denied',
      'You can only complete your own class sessions'
    )
    const message = describeSessionError(
      err,
      'The class session could not be completed.',
      SESSION_WRITER_MESSAGES
    )
    assert.equal(message.includes('college administrators'), false)
    assert.equal(message.includes('generate or cancel'), false)
    // …and the server's own reason survives instead of being swallowed.
    assert.equal(message.includes('You can only complete your own class sessions'), true)
  })

  it('keeps the admin-only wording for the scheduling callables only', () => {
    const err = callableError('functions/permission-denied', 'Scheduling administration access is required')
    const message = describeSessionError(err, 'Class sessions could not be generated.')
    assert.equal(message.startsWith(SCHEDULING_MESSAGES['functions/permission-denied']), true)
    assert.equal(message.includes('Scheduling administration access is required'), true)
  })

  it('gives the two halves different unauthenticated copy paths but the same advice', () => {
    const err = callableError('functions/unauthenticated', 'Authentication is required')
    for (const table of [SCHEDULING_MESSAGES, SESSION_WRITER_MESSAGES]) {
      assert.match(describeSessionError(err, 'fallback', table), /Sign out and back in/)
    }
  })

  it('falls back to the caller-supplied sentence for an unknown code', () => {
    const err = Object.assign(new Error('boom'), { code: 'functions/internal' })
    assert.equal(describeSessionError(err, 'Could not do the thing'), 'Could not do the thing (boom)')
  })

  it('does not repeat itself when the server sent the same sentence', () => {
    const framed = SESSION_WRITER_MESSAGES['functions/not-found']
    const err = callableError('functions/not-found', framed)
    assert.equal(describeSessionError(err, 'fallback', SESSION_WRITER_MESSAGES), framed)
  })

  it('survives an error with no message at all', () => {
    assert.equal(
      describeSessionError({ code: 'functions/internal' }, 'Could not do the thing'),
      'Could not do the thing'
    )
    assert.equal(describeSessionError(null, 'Could not do the thing'), 'Could not do the thing')
  })
})

describe('serverMessage', () => {
  it('strips the SDK wrapper and the trailing code', () => {
    assert.equal(
      serverMessage(callableError('functions/permission-denied', 'Teaching staff access is required')),
      'Teaching staff access is required'
    )
  })

  it('leaves a plain message alone', () => {
    assert.equal(serverMessage(new Error('You can only complete your own class sessions')), 'You can only complete your own class sessions')
  })
})

describe('isSessionPermissionDenied', () => {
  it('recognises the callable refusal and nothing else', () => {
    assert.equal(isSessionPermissionDenied(callableError('functions/permission-denied', 'x')), true)
    assert.equal(isSessionPermissionDenied(callableError('functions/not-found', 'x')), false)
    assert.equal(isSessionPermissionDenied(null), false)
  })
})
