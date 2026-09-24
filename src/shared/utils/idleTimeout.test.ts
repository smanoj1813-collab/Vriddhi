// src/shared/utils/idleTimeout.test.ts
//
// Run with: npm run test:unit   (node --import tsx --test)
//
// Pins the auto-logout-on-inactivity configuration maths: clamp rules for the
// stored override, the warning window, and the active-test exemption.

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_IDLE_MINUTES,
  MAX_IDLE_MINUTES,
  MIN_IDLE_MINUTES,
  formatCountdown,
  isIdlePausedPath,
  resolveIdleMinutes,
  warningSecondsFor,
} from './idleTimeout'

describe('resolveIdleMinutes', () => {
  it('uses the default when nothing is stored', () => {
    assert.equal(resolveIdleMinutes(null), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes(undefined), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes(''), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes('   '), DEFAULT_IDLE_MINUTES)
  })

  it('falls back on junk instead of disabling the timer', () => {
    assert.equal(resolveIdleMinutes('abc'), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes('0'), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes('-5'), DEFAULT_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes('Infinity'), DEFAULT_IDLE_MINUTES)
  })

  it('clamps valid values to 1–480 minutes', () => {
    assert.equal(resolveIdleMinutes('15'), 15)
    assert.equal(resolveIdleMinutes('0.5'), MIN_IDLE_MINUTES) // floors after clamp
    assert.equal(resolveIdleMinutes('999'), MAX_IDLE_MINUTES)
    assert.equal(resolveIdleMinutes('10.9'), 10) // floors fractional minutes
    assert.equal(resolveIdleMinutes('30', 20), 30) // respects a custom fallback
  })
})

describe('warningSecondsFor', () => {
  it('is one minute for ordinary windows', () => {
    assert.equal(warningSecondsFor(20), 60)
  })

  it('never exceeds half of a tiny window', () => {
    assert.equal(warningSecondsFor(1), 30)
    assert.equal(warningSecondsFor(0), 1) // degenerate input still warns
  })
})

describe('isIdlePausedPath', () => {
  it('pauses while a test is being taken', () => {
    assert.equal(isIdlePausedPath('/student/assessments/t1/take'), true)
    assert.equal(isIdlePausedPath('/student/test/t1/take'), true)
    assert.equal(isIdlePausedPath('/student/test/t1/take/'), true)
    assert.equal(isIdlePausedPath('/student/test/t1/take?x=1'), true)
  })

  it('does not pause everywhere else in the test flow', () => {
    assert.equal(isIdlePausedPath('/student/test/t1/instructions'), false)
    assert.equal(isIdlePausedPath('/student/test/t1/result'), false)
    assert.equal(isIdlePausedPath('/student/dashboard'), false)
    assert.equal(isIdlePausedPath('/student/test/t1/taking-notes'), false)
    assert.equal(isIdlePausedPath('/'), false)
    assert.equal(isIdlePausedPath(''), false)
  })
})

describe('formatCountdown', () => {
  it('renders m:ss', () => {
    assert.equal(formatCountdown(60), '1:00')
    assert.equal(formatCountdown(59), '0:59')
    assert.equal(formatCountdown(125), '2:05')
    assert.equal(formatCountdown(-3), '0:00')
  })
})
