import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('verifyAuth rejects forged legacy tokens', () => {
  it('does not contain a vriddhi_ bearer fallback', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/middleware/auth.ts'), 'utf8')
    assert.equal(src.includes('vriddhi_'), false)
    assert.match(src, /verifyIdToken/)
  })

  it('documents that vriddhi_some-user_123 must 401', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/middleware/auth.ts'), 'utf8')
    assert.match(src, /Invalid Firebase token/)
    assert.equal(/token\.startsWith\(['"]vriddhi_/.test(src), false)
  })
})
