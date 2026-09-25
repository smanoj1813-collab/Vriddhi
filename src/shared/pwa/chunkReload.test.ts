// Tests for the one-shot chunk-reload guard (item 2.2, clause A9).
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  PRELOAD_ERROR_EVENT,
  RELOAD_FLAG_KEY,
  alreadyReloadedForChunk,
  installChunkReloadGuard,
  type ChunkReloadStorage,
} from './chunkReload'

function fakeStorage(seed: Record<string, string> = {}): ChunkReloadStorage & { data: Record<string, string> } {
  const data = { ...seed }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
  }
}

function fakeTarget() {
  const handlers: Record<string, Array<(event: unknown) => void>> = {}
  let reloads = 0
  return {
    handlers,
    reloads: () => reloads,
    addEventListener: (type: string, handler: (event: unknown) => void) => {
      handlers[type] = [...(handlers[type] ?? []), handler]
    },
    removeEventListener: (type: string, handler: (event: unknown) => void) => {
      handlers[type] = (handlers[type] ?? []).filter((entry) => entry !== handler)
    },
    location: {
      reload: () => {
        reloads += 1
      },
    },
    fire: (type: string, event: unknown) => (handlers[type] ?? []).forEach((handler) => handler(event)),
  }
}

describe('chunk reload guard', () => {
  it('listens for the Vite preload error and reloads once', () => {
    const target = fakeTarget()
    const storage = fakeStorage()
    installChunkReloadGuard(target, storage, { now: () => 1_000 })
    assert.equal(target.handlers[PRELOAD_ERROR_EVENT]?.length, 1)

    target.fire(PRELOAD_ERROR_EVENT, new Error('Failed to fetch dynamically imported module'))
    assert.equal(target.reloads(), 1)
    assert.equal(storage.data[RELOAD_FLAG_KEY], '1000')
  })

  it('does not loop: a second failure in the same session is surfaced, not reloaded', () => {
    const target = fakeTarget()
    const storage = fakeStorage()
    const givenUp: unknown[] = []
    installChunkReloadGuard(target, storage, { now: () => 5_000, onGiveUp: (error) => givenUp.push(error) })

    target.fire(PRELOAD_ERROR_EVENT, 'first')
    target.fire(PRELOAD_ERROR_EVENT, 'second')
    assert.equal(target.reloads(), 1)
    assert.deepEqual(givenUp, ['second'])
  })

  it('allows a fresh reload once the incident window has passed', () => {
    const target = fakeTarget()
    const storage = fakeStorage({ [RELOAD_FLAG_KEY]: '1000' })
    let clock = 1_000
    installChunkReloadGuard(target, storage, { now: () => clock })

    target.fire(PRELOAD_ERROR_EVENT, 'early — inside the window')
    assert.equal(target.reloads(), 0, 'inside the window: no reload')

    clock = 1_000 + 60_001
    target.fire(PRELOAD_ERROR_EVENT, 'late — outside the window')
    assert.equal(target.reloads(), 1, 'a new incident reloads again')
  })

  it('treats unreadable storage as no flag so the single reload still happens', () => {
    const hostile: ChunkReloadStorage = {
      getItem: () => {
        throw new Error('storage disabled')
      },
      setItem: () => {
        throw new Error('storage disabled')
      },
    }
    assert.equal(alreadyReloadedForChunk(hostile, 10), false)
    const target = fakeTarget()
    installChunkReloadGuard(target, hostile, { now: () => 10 })
    target.fire(PRELOAD_ERROR_EVENT, 'boom')
    assert.equal(target.reloads(), 1)
  })

  it('ignores a non-numeric flag rather than trusting it', () => {
    assert.equal(alreadyReloadedForChunk(fakeStorage({ [RELOAD_FLAG_KEY]: 'yesterday' }), 10), false)
  })

  it('uninstalls cleanly', () => {
    const target = fakeTarget()
    const storage = fakeStorage()
    const stop = installChunkReloadGuard(target, storage, { now: () => 1 })
    stop()
    assert.equal(target.handlers[PRELOAD_ERROR_EVENT]?.length, 0)
    target.fire(PRELOAD_ERROR_EVENT, 'after uninstall')
    assert.equal(target.reloads(), 0)
  })
})
