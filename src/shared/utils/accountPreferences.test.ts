import assert from 'node:assert/strict'
import { after, beforeEach, describe, it } from 'node:test'
import { booleanPreferences, cacheAccountPreferences, readAccountPreferences } from './accountPreferences'

const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
let values: Map<string, string>
let readKeys: string[]
const defaults = { exams: true, fees: true }
beforeEach(() => {
  values = new Map(); readKeys = []
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key: string) { readKeys.push(key); return values.get(key) ?? null },
    setItem(key: string, value: string) { values.set(key, value) },
    removeItem(key: string) { values.delete(key) },
  } })
})
after(() => {
  if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor)
  else delete (globalThis as any).localStorage
})

describe('account-isolated notification cache', () => {
  it('never adopts another account or the unattributed browser-wide legacy value', () => {
    values.set('prefs', '{"exams":false,"fees":false}')
    values.set('prefs__account-a', '{"exams":false,"fees":false}')
    assert.deepEqual(readAccountPreferences('prefs', 'account-b', defaults), defaults)
    assert.deepEqual(readAccountPreferences('prefs', null, defaults), defaults)
    assert.deepEqual(readKeys, ['prefs__account-b'])
  })
  it('restores only the named account and returns a fresh object', () => {
    values.set('prefs__account-a', '{"exams":false,"fees":true}')
    const result = readAccountPreferences('prefs', 'account-a', defaults)
    assert.deepEqual(result, { exams: false, fees: true })
    result.exams = true
    assert.equal(readAccountPreferences('prefs', 'account-a', defaults).exams, false)
    assert.deepEqual(defaults, { exams: true, fees: true })
  })
  it('writes only validated, UID-suffixed values and retires the shared legacy cache', () => {
    values.set('prefs', '{}')
    cacheAccountPreferences('prefs', 'account-a', defaults, { exams: false, fees: true })
    assert.equal(values.has('prefs'), false)
    assert.equal(values.get('prefs__account-a'), '{"exams":false,"fees":true}')
    assert.equal(values.has('prefs__account-b'), false)
  })
  it('does not write a cache for a signed-out account', () => {
    cacheAccountPreferences('prefs', '', defaults, defaults)
    assert.equal(values.size, 0)
  })
  for (const raw of ['not-json', 'null', '[]', 'false', '"hello"']) {
    it(`ignores corrupt cache ${raw}`, () => {
      values.set('prefs__a', raw)
      assert.deepEqual(readAccountPreferences('prefs', 'a', defaults), defaults)
    })
  }
  it('ignores non-boolean and unknown fields without spreading untrusted objects', () => {
    assert.deepEqual(booleanPreferences(defaults, { exams: 'false', fees: false, role: 'admin' }), { exams: true, fees: false })
    assert.deepEqual(booleanPreferences(defaults, JSON.parse('{"__proto__":{"polluted":true},"fees":false}')), { exams: true, fees: false })
    assert.equal(({} as any).polluted, undefined)
  })
  it('blocked storage reads use safe defaults and writes never turn a server success into a failure', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked') } })
    assert.deepEqual(readAccountPreferences('prefs', 'a', defaults), defaults)
    assert.doesNotThrow(() => cacheAccountPreferences('prefs', 'a', defaults, defaults))
  })
  it('full storage is non-fatal', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem() { throw new Error('Quota exceeded') } } })
    assert.doesNotThrow(() => cacheAccountPreferences('prefs', 'a', defaults, defaults))
  })
})
