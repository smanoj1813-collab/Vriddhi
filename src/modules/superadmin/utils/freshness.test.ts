// Tests for the "Updated HH:MM" label (clause A11).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { describeFreshness } from './freshness'

const NOW = Date.parse('2026-09-25T12:00:00.000Z')
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString()

describe('describeFreshness', () => {
  it('says "just now" inside the first minute', () => {
    const result = describeFreshness(new Date(NOW - 5_000).toISOString(), { now: NOW })
    assert.equal(result.label, 'Updated just now')
    assert.equal(result.stale, false)
  })

  it('counts minutes up to an hour', () => {
    assert.equal(describeFreshness(minutesAgo(1), { now: NOW }).label, 'Updated 1 min ago')
    assert.equal(describeFreshness(minutesAgo(17), { now: NOW }).label, 'Updated 17 min ago')
    assert.equal(describeFreshness(minutesAgo(59), { now: NOW }).label, 'Updated 59 min ago')
  })

  it('switches to hours, singular and plural', () => {
    assert.equal(describeFreshness(minutesAgo(60), { now: NOW }).label, 'Updated 1 hour ago')
    assert.equal(describeFreshness(minutesAgo(60 * 5), { now: NOW }).label, 'Updated 5 hours ago')
  })

  it('switches to days past 24 hours', () => {
    assert.equal(describeFreshness(minutesAgo(60 * 26), { now: NOW }).label, 'Updated 1 day ago')
    assert.equal(describeFreshness(minutesAgo(60 * 24 * 4), { now: NOW }).label, 'Updated 4 days ago')
  })

  it('flags staleness against the expected refresh window, not a fixed rule', () => {
    // Default window is 20 minutes: a 10-minute-old snapshot is fine…
    assert.equal(describeFreshness(minutesAgo(10), { now: NOW }).stale, false)
    // …a 40-minute-old one is not.
    assert.equal(describeFreshness(minutesAgo(40), { now: NOW }).stale, true)
    // A caller that refreshes every hour passes a wider window.
    assert.equal(describeFreshness(minutesAgo(40), { now: NOW, staleAfterMs: 70 * 60_000 }).stale, false)
    assert.equal(describeFreshness(minutesAgo(40), { now: NOW, staleAfterMs: 70 * 60_000 }).label, 'Updated 40 min ago')
  })

  it('never reports an unknown or unparseable timestamp as fresh', () => {
    assert.deepEqual(describeFreshness(undefined, { now: NOW }), {
      label: 'Updated time unknown',
      stale: true,
    })
    assert.deepEqual(describeFreshness('', { now: NOW }), { label: 'Updated time unknown', stale: true })
    assert.deepEqual(describeFreshness('yesterday', { now: NOW }), {
      label: 'Updated time unknown',
      stale: true,
    })
  })

  it('tolerates a clock that runs slightly ahead', () => {
    const future = new Date(NOW + 30_000).toISOString()
    assert.deepEqual(describeFreshness(future, { now: NOW }), { label: 'Updated just now', stale: false })
  })
})
