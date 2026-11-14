import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { startVisiblePolling } from './visiblePolling'

function harness(hidden = false) {
  let listener: (() => void) | undefined
  let tick: (() => void) | undefined
  let active = 0
  const visibility = {
    hidden,
    addEventListener(_type: string, next: () => void) { listener = next },
    removeEventListener() { listener = undefined },
  }
  const timers = {
    setInterval(fn: () => void) { tick = fn; active++; return 1 as any },
    clearInterval() { tick = undefined; active-- },
  } as any
  return { visibility, timers, fire: async () => { tick?.(); await new Promise(resolve => setImmediate(resolve)) },
    show: () => { visibility.hidden = false; listener?.() }, hide: () => { visibility.hidden = true; listener?.() },
    get active() { return active }, get listener() { return listener } }
}

describe('visible polling cost and lifecycle guards', () => {
  it('does not duplicate the caller initial load', async () => {
    const env = harness(); let calls = 0
    const stop = startVisiblePolling(() => { calls++ }, 30_000, env.visibility, env.timers)
    assert.equal(calls, 0); assert.equal(env.active, 1)
    await env.fire(); assert.equal(calls, 1); stop()
    assert.equal(env.active, 0); assert.equal(env.listener, undefined)
  })
  it('never starts a timer or request in an initially hidden tab', async () => {
    const env = harness(true); let calls = 0
    const stop = startVisiblePolling(() => { calls++ }, 30_000, env.visibility, env.timers)
    await env.fire(); assert.equal(calls, 0); assert.equal(env.active, 0)
    env.show(); assert.equal(calls, 1); assert.equal(env.active, 1); stop()
  })
  it('pauses hidden work and revalidates once on return', async () => {
    const env = harness(); let calls = 0
    const stop = startVisiblePolling(() => { calls++ }, 30_000, env.visibility, env.timers)
    env.hide(); await env.fire(); assert.equal(calls, 0); assert.equal(env.active, 0)
    env.show(); assert.equal(calls, 1); assert.equal(env.active, 1); stop()
  })
  it('coalesces ticks and visibility events during an in-flight request', async () => {
    const env = harness(); let calls = 0; let finish!: () => void
    const stop = startVisiblePolling(() => { calls++; return new Promise<void>(resolve => { finish = resolve }) }, 30_000, env.visibility, env.timers)
    await env.fire(); await env.fire(); env.hide(); env.show()
    assert.equal(calls, 1); finish(); await Promise.resolve(); await env.fire(); assert.equal(calls, 2); finish(); stop()
  })
  it('recovers after a rejected request without an unhandled rejection', async () => {
    const env = harness(); let calls = 0
    const stop = startVisiblePolling(async () => { calls++; throw new Error('offline') }, 30_000, env.visibility, env.timers)
    await env.fire(); await env.fire(); assert.equal(calls, 2); stop()
  })
  it('cleanup prevents future revalidation', () => {
    const env = harness(); let calls = 0
    const stop = startVisiblePolling(() => { calls++ }, 30_000, env.visibility, env.timers)
    stop(); env.show(); assert.equal(calls, 0); assert.equal(env.active, 0)
  })
  it('rejects invalid intervals without installing listeners', () => {
    for (const ms of [0, -1, NaN, Infinity]) {
      const env = harness()
      startVisiblePolling(() => assert.fail('must not poll'), ms, env.visibility, env.timers)()
      assert.equal(env.active, 0); assert.equal(env.listener, undefined)
    }
  })
})
