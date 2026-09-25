// Run with: npm run test:unit
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stripUndefined } from './firestoreClean'

test('stripUndefined removes undefined deeply but keeps null/0/false and class instances', () => {
  class Sentinel { kind = 'serverTimestamp' }
  const s = new Sentinel()
  const out = stripUndefined({ a: undefined, b: null, c: 0, d: false, e: { f: undefined, g: [1, undefined, { h: undefined, i: 2 }] }, s })
  assert.deepEqual(Object.keys(out), ['b', 'c', 'd', 'e', 's'])
  assert.deepEqual(out.e, { g: [1, { i: 2 }] })
  assert.equal(out.s, s)
})
